#!/usr/bin/env node
/**
 * Merge data-src/*.json into public/data/atlas.json, validate every milestone,
 * and regenerate docs/BIBLIOGRAPHY.md.
 *
 * Errors stop the build. Warnings are printed for editorial review.
 * Usage: node scripts/validate-data.mjs [--quiet]
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'data-src');
const quiet = process.argv.includes('--quiet');
const draft = process.argv.includes('--draft'); // downgrade missing related ids to warnings while drafting

const CATEGORIES = ['surgery', 'public-health', 'prevention', 'therapeutics', 'diagnosis', 'mechanisms', 'maternal', 'mind-brain'];
const TYPES = ['practice', 'observation', 'discovery', 'invention', 'demonstration', 'clinical-evidence', 'implementation', 'eradication'];
const EVIDENCE = ['archaeological', 'surviving-text', 'published-report', 'eyewitness-account', 'trial', 'programme-records', 'laboratory'];
const LOC_TYPES = ['archaeological-findspot', 'documented-practice', 'discovery-site', 'trial-site', 'implementation-area', 'text-origin'];
const PRECISIONS = { site: [0, 10, 2], settlement: [0, 40, 2], region: [20, 600, 1], 'macro-region': [300, 3000, 1] }; // [minKm, maxKm, maxDecimals]
const DATE_PREC = ['day', 'month', 'year', 'decade', 'century', 'millennium', 'radiometric'];
const SOURCE_KINDS = ['primary', 'journal', 'book', 'museum', 'institution', 'university', 'archive'];
const CURRENT_YEAR = new Date().getFullYear();

const errors = [];
const warnings = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);
const warn = (id, msg) => warnings.push(`${id}: ${msg}`);

const decimals = (n) => {
  const s = String(n);
  return s.includes('.') ? s.split('.')[1].length : 0;
};
const toAstro = (y) => (y < 0 ? y + 1 : y);

// ---- load
const files = readdirSync(srcDir).filter((f) => /^\d\d-.*\.json$/.test(f)).sort();
let milestones = [];
for (const f of files) {
  let arr;
  try {
    arr = JSON.parse(readFileSync(join(srcDir, f), 'utf8'));
  } catch (e) {
    console.error(`Cannot parse ${f}: ${e.message}`);
    process.exit(1);
  }
  if (!Array.isArray(arr)) { console.error(`${f} must contain an array`); process.exit(1); }
  for (const m of arr) milestones.push({ ...m, __file: f });
}
let stories = [];
try { stories = JSON.parse(readFileSync(join(srcDir, 'stories.json'), 'utf8')); } catch { stories = []; }

// ---- validate
const ids = new Set();
for (const m of milestones) {
  if (m.suggestedBy !== undefined && m.suggestedBy !== 'wikipedia-timeline') err(m.id, `unknown suggestedBy "${m.suggestedBy}"`);
  const id = m.id || `(missing id in ${m.__file})`;
  if (!m.id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(m.id)) err(id, 'id must be lowercase-hyphenated');
  if (ids.has(m.id)) err(id, 'duplicate id');
  ids.add(m.id);
  for (const k of ['title', 'summary', 'explanation', 'whatChanged', 'whyItMattered']) {
    if (typeof m[k] !== 'string' || m[k].trim().length < 10) err(id, `missing or too short: ${k}`);
  }
  if (m.title && m.title.length > 80) warn(id, `title is long (${m.title.length} chars)`);
  if (m.summary && m.summary.length > 320) warn(id, `summary is long (${m.summary.length} chars)`);
  if (!CATEGORIES.includes(m.category)) err(id, `unknown category ${m.category}`);
  if (!Array.isArray(m.tags) || m.tags.some((t) => !CATEGORIES.includes(t))) err(id, 'tags must be category ids');
  if (m.tags?.includes(m.category)) err(id, 'tags repeat the primary category');
  if (!TYPES.includes(m.type)) err(id, `unknown milestone type ${m.type}`);
  if (!Array.isArray(m.evidence) || !m.evidence.length || m.evidence.some((e) => !EVIDENCE.includes(e))) err(id, 'evidence must list known kinds');
  if (!Array.isArray(m.limitations) || m.limitations.length === 0) warn(id, 'no limitations listed');
  if (!Array.isArray(m.people)) err(id, 'people must be an array');

  // dates
  const d = m.date || {};
  for (const k of ['start', 'end']) {
    if (!Number.isInteger(d[k])) err(id, `date.${k} must be an integer`);
    if (d[k] === 0) err(id, `date.${k} is 0 — there is no year zero (use -1 for 1 BCE, 1 for 1 CE)`);
    if (d[k] > CURRENT_YEAR) err(id, `date.${k} is in the future`);
  }
  if (d.start > d.end) err(id, 'date.start is after date.end');
  if (!d.display) err(id, 'date.display missing');
  if (!['point', 'span'].includes(d.kind)) err(id, 'date.kind must be point or span');
  if (typeof d.approximate !== 'boolean') err(id, 'date.approximate must be boolean');
  if (!DATE_PREC.includes(d.precision)) err(id, `date.precision invalid: ${d.precision}`);
  if (!d.basis) err(id, 'date.basis missing — explain how the date is known');
  if (d.display && /\bc\.\s/.test(d.display) && !d.approximate) err(id, 'display says "c." but approximate is false');
  if (d.kind === 'point' && !d.approximate && d.start !== d.end && d.precision !== 'decade') warn(id, 'exact point date with a range — should this be approximate or a span?');
  if (d.display) {
    const saysBCE = /BCE/.test(d.display);
    const saysAgo = /years ago/.test(d.display);
    if (d.end < 0 && !saysBCE && !saysAgo) err(id, 'BCE date but display does not say BCE or "years ago"');
    if (d.start > 0 && saysBCE) err(id, 'CE date but display says BCE');
  }

  // locations
  if (!Array.isArray(m.locations)) err(id, 'locations must be an array (may be empty)');
  else {
    if (m.locations.length === 0) warn(id, 'no mappable location — listed in timeline only');
    m.locations.forEach((l, i) => {
      const where = `location[${i}]`;
      if (!l.name || !l.modern) err(id, `${where} needs historical name and modern reference`);
      if (!LOC_TYPES.includes(l.type)) err(id, `${where} unknown type ${l.type}`);
      const pr = PRECISIONS[l.precision];
      if (!pr) err(id, `${where} unknown precision ${l.precision}`);
      const hasCoord = l.lat !== null && l.lon !== null && l.lat !== undefined && l.lon !== undefined;
      if (hasCoord) {
        if (Math.abs(l.lat) > 90 || Math.abs(l.lon) > 180) err(id, `${where} coordinates out of range`);
        if (pr && (decimals(l.lat) > pr[2] || decimals(l.lon) > pr[2])) err(id, `${where} coordinates more precise than ${l.precision} precision allows (${pr[2]} decimals)`);
        if (pr && (l.radiusKm < pr[0] || l.radiusKm > pr[1])) err(id, `${where} radiusKm ${l.radiusKm} outside ${pr[0]}–${pr[1]} for ${l.precision}`);
      } else if (l.lat !== null || l.lon !== null) err(id, `${where} must give both lat and lon, or neither (null)`);
      if (m.locations.length > 1 && !l.role) warn(id, `${where} multi-location event without a role`);
    });
    if (m.locations.length > 1 && !m.locations.every((l) => l.role)) warn(id, 'multi-location roles incomplete');
  }

  // sources
  if (!Array.isArray(m.sources) || m.sources.length === 0) err(id, 'at least one source is required');
  else {
    m.sources.forEach((s, i) => {
      if (!s.citation || s.citation.length < 15) err(id, `source[${i}] citation missing`);
      if (!/^https?:\/\//.test(s.url || '')) err(id, `source[${i}] needs a URL`);
      else if (s.url.startsWith('http://')) warn(id, `source[${i}] uses http (no https version found)`);
      if (!SOURCE_KINDS.includes(s.kind)) err(id, `source[${i}] unknown kind ${s.kind}`);
      if (!s.supports) err(id, `source[${i}] must say which claims it supports`);
      if (s.doi && !/^10\.\d{4,9}\//.test(s.doi)) err(id, `source[${i}] DOI looks malformed`);
    });
    if (m.sources.length < 2 && !m.singleSource) err(id, 'only one source: set singleSource true and explain in sourceNote');
    if (m.singleSource && !m.sourceNote) err(id, 'singleSource needs a sourceNote');
    const early = m.date && m.date.end < 1500;
    const claimsFirst = /\b(first|earliest)\b(?! (known|surviving))/i.test(`${m.title} ${m.summary}`);
    if ((early || claimsFirst) && m.sources.length < 2 && !m.singleSource) warn(id, 'early or "first" claim with a single source');
    if (claimsFirst && !m.contested && !m.limitations?.some((x) => /first|earlier|earliest|priority/i.test(x))) warn(id, 'uses "first/earliest" without a caveat');
  }
  if (!Array.isArray(m.related)) err(id, 'related must be an array');
}
// cross references
for (const m of milestones) {
  for (const r of m.related || []) {
    if (r === m.id) err(m.id, 'related to itself');
    else if (!ids.has(r)) (draft ? warn : err)(m.id, `related id not found: ${r}`);
  }
}
// near-duplicates: same place (≤ 25 km) and overlapping dates and same category
const R = 6371;
const dist = (a, b) => {
  const toR = (x) => (x * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat), dLon = toR(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
// pairs checked by hand and confirmed to be different events
const KNOWN_DISTINCT = new Set(['hiv-identified|pcr-invention']);
for (let i = 0; i < milestones.length; i++) for (let j = i + 1; j < milestones.length; j++) {
  const a = milestones[i], b = milestones[j];
  if (a.title === b.title) err(a.id, `same title as ${b.id}`);
  if (KNOWN_DISTINCT.has([a.id, b.id].sort().join('|'))) continue;
  const overlap = a.date.start <= b.date.end && b.date.start <= a.date.end;
  if (!overlap || a.category !== b.category) continue;
  for (const la of a.locations) for (const lb of b.locations) {
    if (la.lat == null || lb.lat == null) continue;
    if (dist(la, lb) < 25) warn(a.id, `possible duplicate of ${b.id} (same place, overlapping dates, same category)`);
  }
}
// stories
for (const s of stories) {
  for (const st of s.steps) if (!ids.has(st.eventId)) err(`story:${s.id}`, `unknown event ${st.eventId}`);
}

// ---- report
const sortKey = (m) => [toAstro(m.date.start), toAstro(m.date.end), m.id];
milestones.sort((a, b) => {
  const ka = sortKey(a), kb = sortKey(b);
  return ka[0] - kb[0] || ka[1] - kb[1] || (ka[2] < kb[2] ? -1 : 1);
});

const byCat = {};
const byType = {};
let unmapped = 0, multi = 0, single = 0;
for (const m of milestones) {
  byCat[m.category] = (byCat[m.category] || 0) + 1;
  byType[m.type] = (byType[m.type] || 0) + 1;
  if (!m.locations.some((l) => l.lat != null)) unmapped++;
  if (m.locations.length > 1) multi++;
  if (m.singleSource) single++;
}
if (!quiet) {
  console.log(`\nMilestones: ${milestones.length} (${multi} multi-location, ${unmapped} unmapped, ${single} single-source)`);
  console.log('By category:', byCat);
  console.log('By type:', byType);
  console.log(`Stories: ${stories.length}`);
  if (warnings.length) console.log(`\nWarnings (${warnings.length}):\n  ` + warnings.join('\n  '));
}
if (errors.length) {
  console.error(`\nERRORS (${errors.length}):\n  ` + errors.join('\n  '));
  process.exit(1);
}

// ---- write outputs
const clean = milestones.map(({ __file, ...m }) => m);
mkdirSync(join(root, 'public', 'data'), { recursive: true });
const out = { version: '1.0', generated: new Date().toISOString().slice(0, 10), milestones: clean, stories };
writeFileSync(join(root, 'public', 'data', 'atlas.json'), JSON.stringify(out));

// bibliography
const bib = new Map();
for (const m of clean) for (const s of m.sources) {
  const key = s.doi ? `doi:${s.doi.toLowerCase()}` : s.url;
  if (!bib.has(key)) bib.set(key, { ...s, events: [], checks: [] });
  bib.get(key).events.push(m.id);
  bib.get(key).checks.push([m.id, s.supports]);
}
const entries = [...bib.values()].sort((a, b) => a.citation.localeCompare(b.citation));
const lines = [
  '# Source bibliography',
  '',
  `Generated from the dataset on ${out.generated} by \`scripts/validate-data.mjs\`. ${entries.length} distinct sources across ${clean.length} milestones.`,
  '',
  'Each entry lists the milestones it is cited for and, for each, the specific claims that were checked against it.',
  '',
];
for (const e of entries) {
  lines.push(`- ${e.citation}${e.pages ? ` (pp. ${e.pages})` : ''}  `);
  lines.push(`  ${e.doi ? `DOI: [${e.doi}](https://doi.org/${e.doi}), ` : ''}<${e.url}>  `);
  lines.push(`  Type: ${e.kind}.`);
  for (const [id, sup] of e.checks) lines.push(`  - \`${id}\`: ${sup}`);
  lines.push('');
}
mkdirSync(join(root, 'docs'), { recursive: true });
writeFileSync(join(root, 'docs', 'BIBLIOGRAPHY.md'), lines.join('\n'));
if (!quiet) console.log(`\nOK — wrote public/data/atlas.json and docs/BIBLIOGRAPHY.md (${entries.length} sources)`);
