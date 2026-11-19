#!/usr/bin/env node
/**
 * Builds public/data/life-expectancy.json from Our World in Data's long-run life expectancy
 * series (Riley 2005; Clio Infra 2015; UN Population Division 2019), stored unmodified in
 * data-src/external/owid-life-expectancy/. Countries are matched to the map's Natural Earth
 * shapes by ISO 3166-1 numeric code. Regions, income groups and the world total are dropped.
 *
 *   node scripts/build-life-expectancy.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const countries = require('i18n-iso-countries');
countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

const root = new URL('..', import.meta.url).pathname;
const csv = readFileSync(`${root}data-src/external/owid-life-expectancy/life-expectancy.csv`, 'utf8').trim().split('\n');
const topo = JSON.parse(readFileSync(`${root}public/data/countries-110m.json`, 'utf8'));
const mapIds = new Set(topo.objects.countries.geometries.map((g) => g.id).filter(Boolean));

// OWID entity names that the ISO library does not resolve on its own.
const OVERRIDES = {
  'Cape Verde': 'CPV', "Cote d'Ivoire": 'CIV', 'Czechia': 'CZE', 'Czech Republic': 'CZE', 'Democratic Republic of Congo': 'COD',
  'Congo': 'COG', 'Eswatini': 'SWZ', 'Swaziland': 'SWZ', 'Micronesia (country)': 'FSM', 'North Macedonia': 'MKD', 'Macedonia': 'MKD',
  'Timor': 'TLS', 'East Timor': 'TLS', 'Russia': 'RUS', 'Syria': 'SYR', 'Laos': 'LAO', 'Vietnam': 'VNM', 'Iran': 'IRN',
  'South Korea': 'KOR', 'North Korea': 'PRK', 'Moldova': 'MDA', 'Tanzania': 'TZA', 'Bolivia': 'BOL', 'Venezuela': 'VEN',
  'Brunei': 'BRN', 'Palestine': 'PSE', 'Taiwan': 'TWN', 'United States': 'USA', 'United Kingdom': 'GBR', 'Bahamas': 'BHS',
  'Gambia': 'GMB', 'Curacao': 'CUW', 'Reunion': 'REU', 'Sao Tome and Principe': 'STP', 'Saint Barthelemy': 'BLM',
  'Faeroe Islands': 'FRO', 'Falkland Islands': 'FLK', 'British Virgin Islands': 'VGB', 'Bonaire Sint Eustatius and Saba': 'BES', 'United States Virgin Islands': 'VIR', 'Vatican': 'VAT', 'Western Sahara': 'ESH',
};
const NON_COUNTRIES = new Set(['World', 'Africa', 'Americas', 'Asia', 'Europe', 'Latin America and the Caribbean', 'Northern America', 'Oceania']);

const series = {}; // numeric id -> [[year, value]]
const unmatched = new Set();
const dropped = new Set();
for (const line of csv.slice(1)) {
  const m = line.match(/^("?)(.*)\1,(\d{4}),([\d.]+)$/);
  if (!m) continue;
  const [, , name, y, v] = m;
  if (NON_COUNTRIES.has(name)) { dropped.add(name); continue; }
  const a3 = OVERRIDES[name] ?? countries.getAlpha3Code(name, 'en');
  const num = a3 && countries.alpha3ToNumeric(a3);
  if (!num) { unmatched.add(name); continue; }
  const id = String(num).padStart(3, '0');
  (series[id] ??= []).push([+y, Math.round(+v * 10) / 10]);
}
for (const id of Object.keys(series)) series[id].sort((a, b) => a[0] - b[0]);
const onMap = Object.keys(series).filter((id) => mapIds.has(id));
const out = {
  source: 'Our World in Data, based on Riley (2005), Clio Infra (Zijdeman & Ribeira da Silva 2015) and UN Population Division (2019). CC BY 4.0.',
  url: 'https://ourworldindata.org/life-expectancy',
  firstYear: Math.min(...Object.values(series).flat().map((p) => p[0])),
  lastYear: Math.max(...Object.values(series).flat().map((p) => p[0])),
  series,
};
writeFileSync(`${root}public/data/life-expectancy.json`, JSON.stringify(out));
console.log(`Countries with data: ${Object.keys(series).length}; drawn on the map: ${onMap.length}; years ${out.firstYear}–${out.lastYear}`);
console.log('Map shapes without data:', topo.objects.countries.geometries.filter((g) => !series[g.id]).map((g) => g.properties.name).join(', '));
if (unmatched.size) console.log('Unmatched OWID entities (left out):', [...unmatched].join(', '));
console.log('Aggregates dropped:', [...dropped].join(', '));
