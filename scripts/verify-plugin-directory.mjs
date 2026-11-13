import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const catalog = JSON.parse(await readFile(join(root, 'scripts/plugin-directory.json'), 'utf8'));
const document = JSON.parse(await readFile(join(root, 'docs/plugins/index.json'), 'utf8'));
assert.equal(catalog.plugins.length, 4);
assert.deepEqual(document.plugins.map(p => p.name), catalog.plugins.map(p => p.name));
const source = process.env.DSH_SOURCE_ROOT || execFileSync('git', ['-C', root, 'config', '--get', 'dsh.sourceRoot'], {encoding: 'utf8'}).trim();
const { parseMarketIndex, marketInstallTarget } = await import(pathToFileURL(join(source, 'packages/util/plugin-market-index/lib/index.js')));
const parsed = parseMarketIndex(document, 'https://liush2yuxjtu.github.io/dsh-slack/plugins/index.json');
assert.equal(parsed.plugins.length, 4);
for (let i = 0; i < parsed.plugins.length; i++) {
  const plugin = parsed.plugins[i];
  const target = marketInstallTarget(plugin.name, plugin.versions[0]);
  assert.equal(typeof target.spec, 'string');
  assert.ok(catalog.plugins[i].install.includes(target.spec), target.spec);
}
for (const filename of ['index.html', 'first-use.html']) {
  const content = await readFile(join(root, 'docs/plugins', filename), 'utf8');
  for (const item of catalog.plugins) assert.ok(content.includes('id="' + item.id + '"'));
  assert.ok(!content.includes('4e9ce85') && !content.includes('7458910') && !content.includes('552a132'), 'Do not link missing commits');
  for (const match of content.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = match[1];
    if (/^https?:/.test(url)) continue;
    const [path, hash] = url.split('#');
    const resolved = join(root, 'docs/plugins', path.endsWith('/') ? path + 'index.html' : path || filename);
    await access(resolved);
    if (hash) assert.ok((await readFile(resolved, 'utf8')).includes('id="' + hash + '"'));
  }
}
console.log('PASS: four public install targets parsed by the official DSH parser; directory and guide references resolve.');
