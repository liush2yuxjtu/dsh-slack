import assert from 'node:assert/strict';
import { readFile, readdir, access, mkdtemp, cp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
assert.equal(pkg.name, 'dsh-slack');
assert.equal(pkg.type, 'module');
assert.equal(pkg.dsh.client.platform, 'web');
assert.ok(pkg.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-conversation'));
for (const file of ['index.mjs', 'client.js', 'cordis.patch.yml', 'README.md', 'LICENSE']) await access(join(root, file));
const files = ['index.mjs', 'client.js'];
for (const directory of ['src', 'scripts', 'tests', 'examples']) {
  for (const file of await readdir(join(root, directory), { recursive: true })) if (/\.(?:mjs|js)$/.test(file)) files.push(directory + '/' + file);
}
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', join(root, file)], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const text = await readFile(join(root, file), 'utf8');
  assert.ok(!/sk-[a-zA-Z0-9]{20,}/.test(text), `Credential in ${file}`);
}
const staging = await mkdtemp(join(tmpdir(), 'dsh-slack-pack-'));
let packed;
try {
  for (const file of ['package.json', ...pkg.files]) await cp(join(root, file), join(staging, file), { recursive: true });
  const pack = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: staging, encoding: 'utf8', timeout: 60000, maxBuffer: 4 * 1024 * 1024 });
  assert.equal(pack.status, 0, pack.error?.message || `npm pack ${pack.signal || ''}: ${pack.stderr}`);
  packed = JSON.parse(pack.stdout)[0].files.map(file => file.path);
} finally { await rm(staging, { recursive: true, force: true }); }
for (const file of ['index.mjs', 'client.js', 'cordis.patch.yml', 'README.md', 'LICENSE']) assert.ok(packed.includes(file), `Package missing ${file}`);
assert.ok(!packed.some(file => /(^|\/)\.runtime\//.test(file)));
console.log(`PASS: ${files.length} JavaScript files checked. Distributable package contains ${packed.length} files.`);
