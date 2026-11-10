import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, readdir, access, appendFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { randomUUID, randomInt } from 'node:crypto';
import { it } from 'vitest';
import { chromium, expect } from 'playwright/test';
import { observeOfficialApi, assertRealProvenance, hash } from './live-proof.mjs';

const root = resolve(import.meta.dirname, '..');
const source = resolve(process.env.DSH_SOURCE_ROOT);
const output = resolve(process.env.DSH_LIVE_OUTPUT);
const model = process.env.DSH_LIVE_MODEL || 'deepseek-flash';
const require = createRequire(join(source, 'apps/cli/package.json'));
const { SessionId } = require('@deepseek-ai/dsh-session');
const { launchWebScaffold, readPersistedEvents } = await import(pathToFileURL(join(source, 'apps/web/tests/scaffold.ts')).href);
const { writeComposerDraft } = await import(pathToFileURL(join(source, 'apps/web/tests/support.ts')).href);
const textOf = message => message.content.filter(block => block.type === 'text').map(block => block.text).join('');
const finalReply = events => events.findLast(event => event.type === 'assistant/message' && !event.data.interrupted && textOf(event.data.message).trim())?.data.message;
async function executableSources() {
  const paths = ['package.json', 'index.mjs', 'client.js', 'cordis.patch.yml'];
  for (const directory of ['src', 'tests', 'scripts']) {
    for (const file of await readdir(join(root, directory), { recursive: true })) {
      if (/\.(?:mjs|js)$/.test(file)) paths.push(directory + '/' + file);
    }
  }
  return Object.fromEntries(await Promise.all(paths.sort().map(async file => [file, hash(await readFile(join(root, file)))])));
}

it('verifies independent root messages and contextual threads against actual DeepSeek responses in real DSH', async () => {
  assert.equal(process.env.DSH_SNAPSHOT, 'record');
  assert.ok(process.env.DEEPSEEK_API_KEY, 'BLOCKED: an actual API credential is required.');
  const sourceRevision = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  assert.equal(sourceRevision, 'fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159');
  const candidateSources = await executableSources();
  await mkdir(output, { recursive: true });
  const observer = observeOfficialApi(24);
  const runId = randomUUID();
  const nonce = runId.slice(0, 8);
  const layout = { nonce, width: randomInt(1280, 1600), navigation: 240, history: 360 };
  const expectedWidth = layout.width - layout.navigation - layout.history;
  const overlay = join(output, 'overlay.json');
  await writeFile(overlay, JSON.stringify([{ id: 'llm-deepseek', config: {
    baseURL: 'https://api.deepseek.com/anthropic', models: [{ id: model, name: model + ' (real API)' }],
    thinking: 'disabled', reasoningEffort: 'off', maxTokens: 1800,
  } }]));
  let scaffold, browser, page, cdp;
  const errors = [];
  const checks = [];
  const usage = [];
  const sessions = [];
  const network = [];
  const timings = {};
  const step = async label => {
    await appendFile(join(output, 'progress.jsonl'), JSON.stringify({ at: new Date().toISOString(), label }) + '\n');
    console.log('LIVE_STEP', label);
  };
  const screenshot = async name => {
    await step(`Capture ${name}`);
    const { data } = await Promise.race([
      cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Chromium capture exceeded 20 seconds')), 20000)),
    ]);
    await writeFile(join(output, name), Buffer.from(data, 'base64'));
  };
  try {
    scaffold = await launchWebScaffold({ profile: { hmr: false, packages: [{ dir: root, enabled: true }] }, extraOverlayPath: overlay });
    await writeFile(join(output, 'preview-auth-url.txt'), scaffold.authenticatedUrl, { mode: 0o600 });
    await writeFile(join(scaffold.workspaceCwd, 'layout.json'), JSON.stringify(layout, null, 2));
    scaffold.ctx.on('agent/created', ({ agent }) => agent.ctx.tools.restrict({ allow: ['read', 'todo_write'] }));
    scaffold.ctx.on('llm/stream', async function* (options, next) {
      assert.equal(options.provider, 'deepseek-official');
      assert.equal(options.model, model);
      const call = { provider: options.provider, model: options.model, at: new Date().toISOString() };
      usage.push(call);
      for await (const chunk of next()) {
        if (chunk.type === 'usage') call.usage = chunk.usage;
        yield chunk;
      }
      await writeFile(join(output, 'calls-progress.json'), JSON.stringify({ usage, calls: observer.receipts }, null, 2));
    });
    await scaffold.ctx.agentDefaultModel.saveSelection({ provider: 'deepseek-official', model });
    browser = await chromium.launch({ ...(process.env.DSH_CHROMIUM_PATH ? { executablePath: process.env.DSH_CHROMIUM_PATH } : {}), headless: true,
      args: ['--no-sandbox', '--no-zygote', '--disable-dev-shm-usage', '--disable-gpu'] });
    page = await browser.newPage({ viewport: { width: 1672, height: 941 }, locale: 'en-US', colorScheme: 'light' });
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(30000);
    cdp = await page.context().newCDPSession(page);
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', request => network.push({ at: Date.now(), kind: 'request', path: new URL(request.url()).pathname, method: request.method() }));
    page.on('requestfailed', request => network.push({ at: Date.now(), kind: 'failed', path: new URL(request.url()).pathname, error: request.failure()?.errorText }));
    page.on('response', async response => {
      const path = new URL(response.url()).pathname;
      const entry = { at: Date.now(), kind: 'response', path, status: response.status() };
      network.push(entry);
      if (path === '/api/session/list') {
        try {
          const result = await response.json();
          entry.result = { ok: result.ok, error: result.error, items: result.value?.items?.length };
        } catch {}
      }
    });
    await page.goto(scaffold.authenticatedUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.dsh-slack-root-input')).toBeVisible({ timeout: 30000 });
    await writeFile(join(output, 'input-preflight.json'), JSON.stringify(await page.locator('.dsh-slack-root-input').evaluate(element => {
      const style = getComputedStyle(element); const rect = element.getBoundingClientRect();
      return { disabled: element.disabled, readOnly: element.readOnly, display: style.display, visibility: style.visibility,
        pointerEvents: style.pointerEvents, width: rect.width, height: rect.height, x: rect.x, y: rect.y,
        ancestors: Array.from((function* () { for (let p = element; p; p = p.parentElement) yield p; })()).map(p => ({ tag: p.tagName, inert: p.inert, hidden: p.hidden, contentVisibility: getComputedStyle(p).contentVisibility })) };
    }), null, 2));
    await screenshot('01-empty.png');
    checks.push('installed-external-plugin-in-real-dsh');

    const submitRoot = async (prompt, marker) => {
      const count = sessions.length;
      await step(`Root ${count + 1}: fill composer`);
      await page.locator('.dsh-slack-root-input').fill(prompt);
      await page.locator('.dsh-slack-root-submit').click();
      await step(`Root ${count + 1}: submitted`);
      let agent;
      await expect.poll(() => {
        agent = scaffold.ctx.agents.list().find(value => value.session.snapshotEvents().some(event => event.type === 'user/message' && textOf(event.data).includes(marker)));
        return Boolean(agent);
      }, { timeout: 30000 }).toBe(true);
      assert.ok(!sessions.includes(agent.session.id), 'Every root message must create a distinct session');
      sessions.push(agent.session.id);
      await step(`Root ${count + 1}: host session created`);
      const card = page.locator(`.dsh-slack-card[data-session-id="${agent.session.id}"]`);
      await expect(card).toBeVisible({ timeout: 20000 });
      await step(`Root ${count + 1}: card visible`);
      await agent.whenIdle();
      await step(`Root ${count + 1}: model idle`);
      await scaffold.ctx.sessions.flush(agent.session);
      await step(`Root ${count + 1}: persistence flushed`);
      const events = await readPersistedEvents(scaffold, SessionId(agent.session.id));
      await step(`Root ${count + 1}: durable events read`);
      const reply = finalReply(events);
      assert.ok(reply && reply.source.provider === 'deepseek-official');
      await expect(card.locator('.dsh-slack-summary')).not.toBeEmpty();
      assert.equal(sessions.length, count + 1);
      await step(`Root ${count + 1}: verified`);
      return { agent, events, reply, card };
    };

    const firstPrompt = `Simplify DSH sidebar UI\nRead ${join(scaffold.workspaceCwd, 'layout.json')} with the read tool. First call todo_write with exactly three tasks: Review current UI issues (in_progress); Design simplified thread layout (pending); Run a quick user test (pending). Compute thread width = width - navigation - history from the file. Then update the first task to completed, leave the other two pending. Reply in English in a short Markdown paragraph and two bullets, under 70 words, including the file nonce and the computed thread width. Do not edit files. Remember the file nonce and width for follow-up questions in this thread.`;
    const first = await submitRoot(firstPrompt, 'Simplify DSH sidebar UI');
    assert.ok(textOf(first.reply).includes(nonce));
    assert.ok(textOf(first.reply).includes(String(expectedWidth)), 'Real model computes the fresh input');
    const firstTodos = first.events.findLast(event => event.type === 'todo/write')?.data.todos;
    assert.equal(firstTodos.length, 3);
    assert.equal(firstTodos.filter(item => item.status === 'completed').length, 1);
    await expect(first.card.locator('.dsh-slack-progress')).toContainText('1/3');
    await screenshot('02-first-thread.png');

    const cards = [
      ['Add multi-session support', ['Session API', 'Persistence', 'Test'], 3],
      ['Improve TODO sync', ['Sync API', 'UI update', 'E2E test'], 2],
      ['DSH release checklist', ['Scope', 'Test', 'Docs', 'Release'], 1],
    ];
    for (let index = 0; index < cards.length; index++) {
      const [title, taskNames, completed] = cards[index];
      const marker = `${nonce}-independent-${index}`;
      const tasks = taskNames.map((content, taskIndex) => ({ content, status: taskIndex < completed ? 'completed' : 'pending' }));
      const result = await submitRoot(`${title}\nThis is an independent session, marker ${marker}. Use todo_write once with these tasks: ${JSON.stringify(tasks)}. Give a one-sentence summary of this task, under 25 English words. Include marker ${marker}. Do not read any file.`, marker);
      assert.ok(textOf(result.reply).includes(marker));
      assert.ok(!textOf(result.reply).includes(nonce + ' ' + expectedWidth));
      assert.equal(result.events.filter(event => event.type === 'user/message' && event.data.source.kind === 'user').length, 1);
      await expect(result.card.locator('.dsh-slack-progress')).toContainText(`${completed}/${taskNames.length}`);
    }
    checks.push('four-root-messages-create-four-independent-sessions', 'native-todo-counts-and-real-model-summaries');
    const parkedDraft = 'Keep this unsent new-topic draft while I switch threads.';
    await page.locator('.dsh-slack-root-input').fill(parkedDraft);
    await first.card.click();
    await expect(page.locator('.dsh-slack-root-input')).toHaveValue(parkedDraft);
    await page.locator('.dsh-slack-root-input').fill('');
    checks.push('unsent-root-draft-survives-thread-switch');
    await expect(first.card).toHaveAttribute('aria-selected', 'true');
    const composer = page.locator('[data-composer-input][contenteditable="true"]').first();
    await expect(composer).toBeVisible();
    const followUp = 'Continue this thread. Without reading the file again, give the original file nonce and computed thread width from the first turn. Keep the same three tasks, complete Design simplified thread layout too, and leave Run a quick user test pending. Use todo_write and reply in one short paragraph with bold labels. Do not start a new session.';
    await writeComposerDraft(page, composer, followUp);
    await composer.press('Enter');
    await expect.poll(() => first.agent.session.snapshotEvents().filter(event => event.type === 'turn/start').length, { timeout: 20000 }).toBe(2);
    await first.agent.whenIdle();
    await scaffold.ctx.sessions.flush(first.agent.session);
    const finalEvents = await readPersistedEvents(scaffold, SessionId(first.agent.session.id));
    const finalMessage = finalReply(finalEvents);
    assert.ok(textOf(finalMessage).includes(nonce), 'Follow-up recalls a nonce absent from the follow-up prompt');
    assert.ok(textOf(finalMessage).includes(String(expectedWidth)), 'Follow-up keeps the first turn context');
    assert.equal(finalEvents.filter(event => event.type === 'user/message' && event.data.source.kind === 'user').length, 2);
    const secondTurn = finalEvents.findIndex(event => event.type === 'turn/start' && event.data.turn === 2);
    assert.ok(secondTurn >= 0);
    const followUpTools = finalEvents.slice(secondTurn).filter(event => event.type === 'assistant/message')
      .flatMap(event => event.data.message.content.filter(block => block.type === 'tool-call'));
    assert.ok(!followUpTools.some(call => call.name === 'read'), 'The contextual answer must not read the nonce from disk again');
    assert.equal(scaffold.ctx.agents.list().length, sessions.length, 'Thread reply does not create another session');
    const todos = finalEvents.findLast(event => event.type === 'todo/write').data.todos;
    assert.equal(todos.length, 3);
    assert.equal(todos.filter(item => item.status === 'completed').length, 2);
    await expect(first.card.locator('.dsh-slack-progress')).toContainText('2/3');
    await expect(first.card.locator('.dsh-slack-summary')).toContainText(nonce);
    checks.push('native-thread-reply-preserves-context-and-session', 'todo-and-summary-update-after-follow-up');
    const todoHeader = page.getByTestId('todo-panel').getByRole('button').first();
    if (await todoHeader.getAttribute('aria-expanded') !== 'true') await todoHeader.click();
    await expect(page.getByTestId('todo-panel').locator('li')).toHaveCount(3);
    await expect(page.locator('.dsh-slack-native [data-composer-seat]')).toHaveCSS('position', 'sticky');
    checks.push('native-full-todo-list-in-thread');
    await screenshot('03-desktop.png');
    await writeFile(join(output, 'visible-desktop.txt'), await page.locator('body').innerText());
    assert.equal(await page.locator('.dsh-slack-card').count(), 4);
    assert.ok(await page.locator('body').evaluate(body => body.scrollWidth <= innerWidth + 1));

    const reloadStarted = Date.now();
    const catalogAfterReload = page.waitForResponse(response => new URL(response.url()).pathname === '/api/session/list' && response.status() === 200, { timeout: 60000 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await catalogAfterReload;
    timings.reloadCatalogMs = Date.now() - reloadStarted;
    const restored = page.locator(`.dsh-slack-card[data-session-id="${first.agent.session.id}"]`);
    await expect(restored).toHaveAttribute('aria-selected', 'true', { timeout: 30000 });
    await expect(restored.locator('.dsh-slack-progress')).toContainText('2/3');
    await expect(restored.locator('.dsh-slack-summary')).toContainText(nonce);
    timings.reloadRestoredMs = Date.now() - reloadStarted;
    await screenshot('04-reload.png');
    checks.push('reload-restores-selection-tasks-and-summary');

    const nativeDraft = 'Keep this draft while I open native DSH settings.';
    await page.locator('.dsh-slack-root-input').fill(nativeDraft);
    await page.getByRole('button', { name: 'Native DSH', exact: true }).click();
    await expect(page.locator('.dsh-slack-app')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Plugins', exact: true })).toBeVisible();
    const accountMenu = page.getByRole('button', { name: 'Account menu', exact: true });
    if (await accountMenu.count()) {
      await accountMenu.click();
      await page.getByRole('menuitem', { name: 'Settings', exact: true }).click();
    } else await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await screenshot('08-native-settings.png');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Open DSH Slack', exact: true }).click();
    await expect(page.locator('.dsh-slack-root-input')).toHaveValue(nativeDraft);
    await page.locator('.dsh-slack-root-input').fill('');
    await expect(restored).toHaveAttribute('aria-selected', 'true');
    checks.push('native-settings-and-plugin-access-restored', 'draft-survives-native-navigation-round-trip');

    await page.locator('.dsh-slack-pin').click();
    await expect(page.locator('.dsh-slack-pin')).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Later', exact: true }).click();
    await expect(page.locator('.dsh-slack-card')).toHaveCount(1);
    await page.locator('.dsh-slack-pin').click();
    await expect(page.locator('.dsh-slack-card')).toHaveCount(0);
    await page.getByRole('button', { name: 'Threads', exact: true }).click();
    await expect(page.locator('.dsh-slack-card')).toHaveCount(4);
    checks.push('native-save-for-later-and-remove');

    const search = page.locator('input[type="search"]').first();
    await expect(search).toBeVisible();
    await search.fill('no-matching-session-987654321');
    await expect(page.locator('.dsh-slack-card')).toHaveCount(0);
    await search.fill('');
    await expect(page.locator('.dsh-slack-card')).toHaveCount(4);
    await restored.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.dsh-slack-card[aria-posinset="2"]')).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.locator('.dsh-slack-card[aria-posinset="4"]')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(page.locator('.dsh-slack-card[aria-posinset="1"]')).toBeFocused();
    await restored.click();
    checks.push('search-empty-result-and-keyboard-navigation');

    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.locator('body').evaluate(body => body.scrollWidth <= innerWidth + 1), 'Mobile viewport must not overflow horizontally');
    await screenshot('05-mobile.png');
    await page.getByRole('button', { name: 'Back to threads', exact: true }).click();
    await expect(page.locator('.dsh-slack-root-input')).toBeVisible();
    await screenshot('05-mobile-list.png');
    await restored.click();
    await expect(page.locator('[data-composer-input][contenteditable="true"]').first()).toBeVisible();
    await page.setViewportSize({ width: 1672, height: 941 });
    await page.emulateMedia({ colorScheme: 'light' });
    await scaffold.ctx.settings.update('ui-theme', { preference: 'dark' });
    await expect(page.locator('body')).toHaveAttribute('data-ds-dark-theme', '');
    await expect.poll(() => restored.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(57, 40, 79)');
    await screenshot('06-dark.png');
    await page.emulateMedia({ colorScheme: 'dark' });
    await scaffold.ctx.settings.update('ui-theme', { preference: 'light' });
    await expect(page.locator('body')).not.toHaveAttribute('data-ds-dark-theme', '');
    await expect.poll(() => restored.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(232, 224, 250)');
    await page.emulateMedia({ colorScheme: 'light' });
    checks.push('mobile-without-horizontal-overflow', 'explicit-dsh-dark-with-light-os', 'explicit-dsh-light-with-dark-os');
    const finalTodoHeader = page.getByTestId('todo-panel').getByRole('button').first();
    if (await finalTodoHeader.getAttribute('aria-expanded') !== 'true') await finalTodoHeader.click();
    await screenshot('07-final.png');

    await observer.settle();
    const provenance = assertRealProvenance(observer.receipts, finalEvents, first.agent.session.id);
    for (const id of sessions) {
      const events = await readPersistedEvents(scaffold, SessionId(id));
      const relevant = observer.receipts.filter(receipt => receipt.sessionId === id);
      for (const message of events.filter(event => event.type === 'assistant/message' && !event.data.interrupted).map(event => event.data.message)) {
        const text = textOf(message);
        if (text) assert.ok(relevant.some(receipt => receipt.text === text), 'Every visible assistant message is an actual API response');
      }
    }
    assert.deepEqual(errors, [], 'Browser console must have no errors');
    assert.ok(usage.length > 0 && usage.every(call => call.usage?.outputTokens > 0));
    assert.deepEqual(await executableSources(), candidateSources, 'Executable candidate changed during acceptance');
    const files = ['01-empty.png', '02-first-thread.png', '03-desktop.png', '04-reload.png', '05-mobile.png', '05-mobile-list.png', '06-dark.png', '07-final.png', '08-native-settings.png'];
    const result = { status: 'PASS', runId, at: new Date().toISOString(), candidateTree: process.env.DSH_CANDIDATE_TREE || null,
      candidateSources, sourceRevision, provider: 'deepseek-official', model,
      liveModel: true, mockedService: false, scriptedModel: false, seededAssistantMessages: false, seededTodoEvents: false,
      machine: { platform: process.platform, node: process.version, browser: await browser.version(), viewport: { width: 1672, height: 941 } },
      input: layout, expectedWidth, sessions, provenance, checks, timings, calls: observer.receipts, usage, consoleErrors: errors,
      finalAssistantText: textOf(finalMessage), finalTodos: todos,
      screenshots: Object.fromEntries(await Promise.all(files.map(async file => [file, hash(await readFile(join(output, file)))]))),
    };
    await writeFile(join(output, 'result.json'), JSON.stringify(result, null, 2) + '\n');
    const safeEvents = finalEvents.filter(event => ['user/message', 'assistant/message', 'todo/write', 'tool/call', 'tool/result', 'turn/start', 'turn/end'].includes(event.type))
      .map(event => event.type === 'assistant/message' ? { ...event, data: { ...event.data, message: { ...event.data.message,
        content: event.data.message.content.filter(block => block.type !== 'reasoning'), replayState: undefined } } } : event);
    await writeFile(join(output, 'native-events.json'), JSON.stringify(safeEvents, null, 2) + '\n');
    console.log(JSON.stringify({ status: 'PASS', runId, actualApiResponses: observer.receipts.length, checks, output }));
    if (process.env.DSH_KEEP_OPEN === '1') {
      await writeFile(join(output, 'ready.txt'), 'Real DSH is open. Create release.txt in this directory to stop.');
      await new Promise(resolveWait => {
        const timer = setInterval(async () => { try { await access(join(output, 'release.txt')); clearInterval(timer); resolveWait(); } catch {} }, 1000);
      });
    }
  } catch (error) {
    if (page && !page.isClosed()) {
      await screenshot('failure.png').catch(() => {});
      await writeFile(join(output, 'failure-visible.txt'), await page.locator('body').innerText()).catch(() => {});
    }
    await writeFile(join(output, 'failure.json'), JSON.stringify({ status: 'FAIL', error: String(error), errors, usage, calls: observer.receipts }, null, 2));
    await writeFile(join(output, 'failure-network.json'), JSON.stringify(network, null, 2));
    if (scaffold) await writeFile(join(output, 'failure-event-metadata.json'), JSON.stringify(scaffold.ctx.agents.list().map(agent => ({ sessionId: agent.session.id,
      events: agent.session.snapshotEvents().map(event => ({ type: event.type, seq: event.seq,
        ...(event.type === 'user/message' ? { source: event.data.source } : {}),
        ...(event.type === 'session/title' ? { title: event.data.title, source: event.data.source } : {}) })) })), null, 2));
    throw error;
  } finally {
    await browser?.close();
    await scaffold?.close();
    observer.restore();
  }
});
