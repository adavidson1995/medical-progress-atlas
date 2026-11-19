#!/usr/bin/env node
/**
 * Check that every source URL (and DOI) in public/data/atlas.json still resolves.
 * Run after `npm run validate`. Needs ordinary internet access.
 *
 *   node scripts/check-links.mjs            # check everything
 *   node scripts/check-links.mjs --only=id  # check one milestone
 *
 * Some publishers refuse automated requests (403/429) even when the page is fine;
 * those are reported separately as "check by hand" rather than as broken.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(root, 'public', 'data', 'atlas.json'), 'utf8'));
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);

const targets = new Map(); // url -> [milestone ids]
for (const m of data.milestones) {
  if (only && m.id !== only) continue;
  for (const s of m.sources) {
    for (const u of [s.url, s.doi ? `https://doi.org/${s.doi}` : null]) {
      if (!u) continue;
      if (!targets.has(u)) targets.set(u, []);
      targets.get(u).push(m.id);
    }
  }
}

const UA = 'Mozilla/5.0 (compatible; atlas-link-check/1.0)';
async function check(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });
      if (res.ok) return { status: res.status, ok: true, final: res.url };
      if (method === 'GET') return { status: res.status, ok: false, final: res.url };
    } catch (e) {
      if (method === 'GET') return { status: 0, ok: false, error: e.cause?.code ?? e.name };
    }
  }
}

const urls = [...targets.keys()];
const results = [];
let i = 0;
async function worker() {
  while (i < urls.length) {
    const url = urls[i++];
    results.push({ url, ids: targets.get(url), ...(await check(url)) });
  }
}
await Promise.all(Array.from({ length: 6 }, worker));

const broken = results.filter((r) => !r.ok && ![401, 403, 429].includes(r.status));
const manual = results.filter((r) => !r.ok && [401, 403, 429].includes(r.status));
console.log(`Checked ${results.length} URLs: ${results.length - broken.length - manual.length} OK, ${manual.length} to check by hand, ${broken.length} broken.`);
for (const r of manual) console.log(`  check by hand (${r.status}): ${r.url}  [${r.ids.join(', ')}]`);
for (const r of broken) console.log(`  BROKEN (${r.status || r.error}): ${r.url}  [${r.ids.join(', ')}]`);
process.exit(broken.length ? 1 : 0);
