import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { hostname } from 'node:os';
import { it } from 'vitest';
import { chromium, expect } from 'playwright/test';
import { observeOfficialApi, hash } from '../../tests/live-proof.mjs';
import { installPointer, startCapture } from '../../scripts/record-capture.mjs';

const root = resolve(import.meta.dirname, '../..');
const source = resolve(process.env.DSH_SOURCE_ROOT);
const require = createRequire(join(source, 'apps/cli/package.json'));
const { SessionId } = require('@deepseek-ai/dsh-session');
const { launchWebScaffold, readPersistedEvents } = await import(pathToFileURL(join(source, 'apps/web/tests/scaffold.ts')).href);
const { writeComposerDraft } = await import(pathToFileURL(join(source, 'apps/web/tests/support.ts')).href);
const textOf = message => message.content.filter(block => block.type === 'text').map(block => block.text).join('');
const model = 'deepseek-flash';
const scenarios = {
  en: {
    locale: 'en-US', title: 'Plan the launch', other: 'Plan a workshop',
    first: 'Plan the launch\nMake a checklist: Write announcement, Prepare screenshots, Publish update. Announcement is done. Keep the others pending. Reply briefly.',
    second: 'Plan a workshop\nMake a checklist: Pick date, Invite team, Prepare agenda. All three are complete. Reply briefly.',
    followUp: 'The screenshots are ready. Update the same checklist. Leave publishing for later.',
    language: 'Reply in English. Use the native todo_write tool for checklists. Keep replies under 30 words. Do not invent work beyond the user updates.',
  },
  zh: {
    locale: 'zh-CN', title: '规划发布', other: '筹备工作坊',
    first: '规划发布\n请创建三项待办：撰写公告、准备截图、发布更新。公告已完成，其余待处理。简短回复。',
    second: '筹备工作坊\n请创建三项待办：确定日期、邀请团队、准备议程。三项均已完成。简短回复。',
    followUp: '截图已经准备好了，请更新同一份清单。发布更新仍待处理。',
    language: '请用简体中文回复。清单必须通过原生 todo_write 工具更新。回复不超过60字，只记录用户明确告知的进度。',
  },
};

for (const lang of (process.env.DSH_MEDIA_LANGS || 'en,zh').split(',')) {
  it(`records real DeepSeek session threads in ${lang}`, async () => {
    const scenario = scenarios[lang];
    assert.ok(scenario);
    assert.ok(process.env.DEEPSEEK_API_KEY);
    assert.equal(process.env.DSH_SNAPSHOT, 'record');
    const output = join(resolve(process.env.DSH_LIVE_OUTPUT), lang);
    await mkdir(output, { recursive: true });
    const sourceCommit = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const files = ['client.js', 'index.mjs', 'src/projection.mjs'];
    const sourceHashes = Object.fromEntries(await Promise.all(files.map(async file => [file, hash(await readFile(join(root, file)))])));
    const overlay = join(output, 'overlay.json');
    await writeFile(overlay, JSON.stringify([{ id: 'llm-deepseek', config: {
      baseURL: 'https://api.deepseek.com/anthropic', models: [{ id: model, name: 'DeepSeek Flash' }],
      thinking: 'disabled', reasoningEffort: 'off', maxTokens: 800,
    } }]));
    const observer = observeOfficialApi(20);
    let scaffold, browser, page, capture;
    const markers = [];
    const errors = [];
    const agents = [];
    const progress = async label => {
      await appendFile(join(output, 'progress.jsonl'), JSON.stringify({ at: new Date().toISOString(), label }) + '\n');
      console.log('MEDIA_STEP', lang, label);
    };
    const mark = async label => {
      const text = await page.locator('body').innerText();
      if (lang === 'en') assert.ok(!/[\u3400-\u9fff]/u.test(text), 'English recording contains Chinese UI or content');
      const row = { label, elapsed_ms: Math.round(Date.now() - capture.started) };
      markers.push(row);
      await writeFile(join(output, 'markers.jsonl'), markers.map(item => JSON.stringify(item)).join('\n') + '\n');
      return row.elapsed_ms / 1000;
    };
    const holdUntil = async timestamp => {
      const remaining = timestamp * 1000 - (Date.now() - capture.started);
      if (remaining > 0) await page.waitForTimeout(remaining);
    };
    const moveClick = async (locator, label) => {
      await expect(locator).toBeVisible({ timeout: 20000 });
      const box = await locator.boundingBox();
      assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= 1281 && box.y + box.height <= 801, label);
      await page.mouse.move(box.x + box.width - 16, box.y + box.height / 2, { steps: 18 });
      await page.waitForTimeout(180);
      await mark(label);
      await locator.click({ position: { x: box.width - 16, y: box.height / 2 } });
    };
    try {
      await progress('Boot real DSH');
      scaffold = await launchWebScaffold({ profile: { hmr: false, packages: [{ dir: root, enabled: true }] }, extraOverlayPath: overlay });
      await scaffold.ctx.settings.update('locale', { preference: lang });
      scaffold.ctx.on('agent/created', ({ agent }) => agent.ctx.tools.restrict({ allow: ['todo_write'] }));
      scaffold.ctx.systemPrompt.section({ name: 'feature-recording-language', order: 900, text: scenario.language });
      await scaffold.ctx.agentDefaultModel.saveSelection({ provider: 'deepseek-official', model });
      browser = await chromium.launch({ ...(process.env.DSH_CHROMIUM_PATH ? { executablePath: process.env.DSH_CHROMIUM_PATH } : {}),
        headless: true, args: ['--no-sandbox', '--no-zygote', '--disable-dev-shm-usage', '--disable-gpu'] });
      page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, locale: scenario.locale, colorScheme: 'light' });
      page.setDefaultTimeout(20000); page.setDefaultNavigationTimeout(30000);
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto(scaffold.authenticatedUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.dsh-slack-root-input')).toBeVisible({ timeout: 30000 });
      const cdp = await page.context().newCDPSession(page);
      const snap = async name => { const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true }); await writeFile(join(output, name), Buffer.from(data, 'base64')); };
      await snap('preflight.png');
      const before = await page.locator('body').innerText();
      assert.ok(lang === 'en' ? before.includes('Chats') && !/[\u3400-\u9fff]/u.test(before) : before.includes('对话'));
      const geometry = await page.locator('.dsh-slack-app').boundingBox();
      assert.ok(geometry && geometry.width > 800);
      await writeFile(join(output, 'discovery.json'), JSON.stringify({ language: lang, geometry, viewport: { width: 1280, height: 800 }, dpr: 2,
        sourceCommit, sourceHashes, controls: ['.dsh-slack-root-input', '.dsh-slack-root-submit', '.dsh-slack-card', '[data-composer-input]', '[data-testid="todo-panel"]'] }, null, 2));
      await writeFile(join(output, 'rehearsal.json'), JSON.stringify({ status: 'pass', semantics: true, selectors: true, state_transitions: true, framing: true, dependencies: true,
        basis: 'Same plugin source as the actual API browser acceptance; current viewport and locale verified before capture.',
        priorAcceptance: 'docs/evidence/result.json', sourceHashes }, null, 2));
      await installPointer(page);
      capture = await startCapture(page, output);
      await mark('Capture started');
      const rootSend = async (prompt, title) => {
        await page.locator('.dsh-slack-root-input').fill(prompt);
        await moveClick(page.locator('.dsh-slack-root-submit'), 'Send a new topic');
        let agent;
        await expect.poll(() => {
          agent = scaffold.ctx.agents.list().find(value => value.session.snapshotEvents().some(event => event.type === 'user/message' && event.data.source.kind === 'user' && textOf(event.data) === prompt));
          return Boolean(agent);
        }, { timeout: 30000 }).toBe(true);
        assert.ok(!agents.some(value => value.session.id === agent.session.id)); agents.push(agent);
        await agent.whenIdle(); await scaffold.ctx.sessions.flush(agent.session);
        const card = page.locator(`.dsh-slack-card[data-session-id="${agent.session.id}"]`);
        await expect(card).toContainText(title);
        await mark('Actual model reply committed');
        await progress(title + ' completed');
        return { agent, card };
      };
      const first = await rootSend(scenario.first, scenario.title);
      await expect(first.card.locator('.dsh-slack-progress')).toContainText('1/3');
      const second = await rootSend(scenario.second, scenario.other);
      await expect(second.card.locator('.dsh-slack-progress')).toContainText('3/3');
      await moveClick(first.card, 'Continue the launch Thread');
      const composer = page.locator('[data-composer-input][contenteditable="true"]').first();
      await writeComposerDraft(page, composer, scenario.followUp);
      await mark('Send a contextual Thread reply');
      await composer.press('Enter');
      await expect.poll(() => first.agent.session.snapshotEvents().filter(event => event.type === 'turn/start').length, { timeout: 20000 }).toBe(2);
      await first.agent.whenIdle(); await scaffold.ctx.sessions.flush(first.agent.session);
      await expect(first.card.locator('.dsh-slack-progress')).toContainText('2/3');
      await expect(second.card.locator('.dsh-slack-progress')).toContainText('3/3');
      await mark('Context and TODO update confirmed');
      await moveClick(second.card, 'Show the independent workshop Thread');
      await expect(page.locator('.dsh-slack-thread-title')).toHaveText(scenario.other);
      await expect(page.getByTestId('todo-panel')).toBeVisible();
      await page.waitForTimeout(500);
      const shortStart = await mark('Eight-second excerpt starts');
      await holdUntil(shortStart + 1.1);
      await moveClick(first.card, 'Open the launch Thread');
      await expect(page.locator('.dsh-slack-thread-title')).toHaveText(scenario.title);
      await expect(first.card.locator('.dsh-slack-progress')).toContainText('2/3');
      const todoHeader = page.getByTestId('todo-panel').getByRole('button').first();
      if (await todoHeader.getAttribute('aria-expanded') !== 'true') await moveClick(todoHeader, 'Expand the native TODO list');
      await expect(page.getByTestId('todo-panel').locator('li')).toHaveCount(3);
      const proofStart = await mark('Result visible');
      assert.ok(proofStart - shortStart <= 4.7, 'Reopening and expansion must leave at least three seconds of visible result');
      await holdUntil(shortStart + 8.4);
      const proofEnd = await mark('Result hold complete');
      assert.ok(proofEnd - proofStart >= 3);
      await snap('snapshot.png');
      await holdUntil(shortStart + 9);
      const captured = await capture.stop(); capture = undefined;
      await observer.settle();
      const eventsBySession = {};
      for (const agent of agents) {
        const events = await readPersistedEvents(scaffold, SessionId(agent.session.id));
        eventsBySession[agent.session.id] = events.filter(event => ['user/message', 'assistant/message', 'todo/write', 'turn/start', 'turn/end'].includes(event.type)
          && (event.type !== 'user/message' || event.data.source.kind === 'user'))
          .map(event => event.type === 'assistant/message' ? { ...event, data: { ...event.data, message: { ...event.data.message,
            replayState: undefined, content: event.data.message.content.filter(block => block.type !== 'reasoning') } } } : event);
        const receipts = observer.receipts.filter(receipt => receipt.sessionId === agent.session.id);
        assert.ok(receipts.length > 0);
        for (const event of events.filter(event => event.type === 'assistant/message' && !event.data.interrupted)) {
          assert.equal(event.data.message.source.provider, 'deepseek-official');
          const text = textOf(event.data.message);
          if (text) assert.ok(receipts.some(receipt => receipt.text === text));
          for (const call of event.data.message.content.filter(block => block.type === 'tool-call')) {
            assert.ok(receipts.some(receipt => receipt.toolCalls.some(wire => wire.id === call.id && wire.name === call.name)));
          }
        }
      }
      assert.ok(observer.receipts.every(receipt => receipt.httpStatus === 200 && receipt.responseId && receipt.complete && receipt.usage.output_tokens > 0));
      assert.equal(agents.length, 2); assert.deepEqual(errors, []);
      for (const file of files) assert.equal(hash(await readFile(join(root, file))), sourceHashes[file]);
      await writeFile(join(output, 'native-events.json'), JSON.stringify(eventsBySession, null, 2));
      const result = { status: 'recorded', language: lang, source: { environment: 'repository-build', commit: sourceCommit, version: '0.1.0', sourceHashes },
        runtime: { platform: process.platform, host: hostname(), browser: await browser.version(), viewport: { width: 1280, height: 800 }, dpr: 2 },
        liveModel: true, mockedService: false, scriptedModel: false, seededAssistantMessages: false, seededTodoEvents: false,
        sessions: agents.map(agent => agent.session.id), calls: observer.receipts, captured, excerpt: { start_s: shortStart, duration_s: 8 },
        proof_interval_s: [proofStart, Math.min(proofEnd, shortStart + 8)], crop_css: { x: Math.floor(geometry.x), y: 0, width: Math.floor(geometry.width), height: 800 },
        language_check: { dom: 'pass', expected: lang }, consoleErrors: errors,
      };
      await writeFile(join(output, 'recording.json'), JSON.stringify(result, null, 2));
      await progress(`Recorded ${captured.duration_s.toFixed(2)}s with ${observer.receipts.length} actual API responses`);
    } catch (error) {
      await writeFile(join(output, 'failure.json'), JSON.stringify({ error: String(error), errors, calls: observer.receipts }, null, 2));
      if (page && !page.isClosed()) await writeFile(join(output, 'failure-visible.txt'), await page.locator('body').innerText()).catch(() => {});
      throw error;
    } finally {
      if (capture) await capture.stop().catch(() => {});
      await browser?.close(); await scaffold?.close(); observer.restore();
    }
  });
}
