import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const base = 'https://liush2yuxjtu.github.io/dsh-slack/';
const paths = ['', 'install/', 'demo/', 'guides/session-threads/'];
const titles = new Set();
let links = 0;
for (const path of paths) {
  for (const language of ['en', 'zh']) {
    const relative = (language === 'zh' ? 'zh/' : '') + path;
    const source = await readFile(join(root, 'docs', relative, 'index.html'), 'utf8');
    const title = source.match(/<title>(.*?)<\/title>/)?.[1];
    assert.ok(title && !titles.has(title), `Missing or duplicate title: ${relative}`);
    titles.add(title);
    assert.equal((source.match(/<h1>/g) || []).length, 1, relative);
    assert.ok(source.includes(`<html lang="${language === 'zh' ? 'zh-CN' : 'en'}">`));
    assert.ok(source.includes(`<link rel="canonical" href="${base + relative}">`));
    assert.ok(source.includes(`<link rel="alternate" hreflang="en" href="${base + path}">`));
    assert.ok(source.includes(`<link rel="alternate" hreflang="zh-CN" href="${base + 'zh/' + path}">`));
    assert.ok(source.includes('name="google-site-verification"'));
    assert.ok(!source.includes('noindex'));
    const data = JSON.parse(source.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    if (path === 'demo/') {
      assert.equal(data['@type'], 'VideoObject');
      const qa = JSON.parse(await readFile(join(root, 'docs/media', language, 'qa.json'), 'utf8'));
      assert.equal(data.duration, `PT${qa.raw_duration_s}S`);
      assert.ok(source.includes('<video class="walkthrough" controls'));
    }
    for (const match of source.matchAll(/(?:href|src|poster)="([^"]+)"/g)) {
      const value = match[1];
      if (value.startsWith('#')) {
        assert.ok(source.includes(`id="${value.slice(1)}"`));
      } else if (value.startsWith(base)) {
        const file = value.slice(base.length).split('#')[0];
        await access(join(root, 'docs', file.endsWith('/') || !file ? file + 'index.html' : file));
      } else {
        assert.ok(value.startsWith('https://github.com/'), `Unexpected outbound link: ${value}`);
      }
      links++;
    }
    for (const image of source.matchAll(/<img\b[^>]*>/g)) assert.ok(/alt="[^"]+"/.test(image[0]));
  }
}
const sitemap = await readFile(join(root, 'docs/sitemap.xml'), 'utf8');
assert.equal((sitemap.match(/<url>/g) || []).length, paths.length * 2 + 2);
assert.equal((sitemap.match(/<video:video>/g) || []).length, 2);
assert.ok(!sitemap.includes('localhost'));
console.log(`PASS: ${titles.size} pages, ${links} references, canonical and language links, sitemap, verification tag, and real video metadata.`);

await import('./verify-plugin-directory.mjs');
