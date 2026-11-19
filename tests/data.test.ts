import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { AtlasData } from '../src/types';
import { CATEGORIES, TYPES } from '../src/lib/meta';

const data = JSON.parse(readFileSync(new URL('../public/data/atlas.json', import.meta.url), 'utf8')) as AtlasData;
const ids = new Set(data.milestones.map((m) => m.id));

describe('published dataset', () => {
  it('has unique ids and known categories and types', () => {
    expect(ids.size).toBe(data.milestones.length);
    const cats = new Set(CATEGORIES.map((c) => c.id));
    const types = new Set(TYPES.map((t) => t.id));
    for (const m of data.milestones) {
      expect(cats.has(m.category), m.id).toBe(true);
      expect(types.has(m.type), m.id).toBe(true);
    }
  });
  it('never uses year 0 and keeps start <= end', () => {
    for (const m of data.milestones) {
      expect(m.date.start, m.id).not.toBe(0);
      expect(m.date.end, m.id).not.toBe(0);
      expect(m.date.start <= m.date.end, m.id).toBe(true);
    }
  });
  it('has valid coordinates or none at all', () => {
    for (const m of data.milestones)
      for (const l of m.locations) {
        if (l.lat == null) { expect(l.lon, m.id).toBeNull(); continue; }
        expect(Math.abs(l.lat), m.id).toBeLessThanOrEqual(90);
        expect(Math.abs(l.lon as number), m.id).toBeLessThanOrEqual(180);
      }
  });
  it('has at least two sources, or a declared single-source note', () => {
    for (const m of data.milestones) {
      if (m.sources.length < 2) expect(m.singleSource && m.sourceNote, m.id).toBeTruthy();
      for (const s of m.sources) expect(s.url, m.id).toMatch(/^https?:\/\//);
    }
  });
  it('only links to milestones that exist', () => {
    for (const m of data.milestones) for (const r of m.related ?? []) expect(ids.has(r), `${m.id} -> ${r}`).toBe(true);
    for (const s of data.stories) for (const st of s.steps) expect(ids.has(st.eventId), `${s.id} -> ${st.eventId}`).toBe(true);
  });
  it('is sorted chronologically', () => {
    for (let i = 1; i < data.milestones.length; i++)
      expect(data.milestones[i - 1].date.start <= data.milestones[i].date.start).toBe(true);
  });
});
