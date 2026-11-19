import { describe, expect, it } from 'vitest';
import { decodeState, encodeState } from '../src/lib/urlState';
import { toAstro } from '../src/lib/dates';

describe('URL state', () => {
  it('round-trips a full state including a BCE year and a hyphenated event id', () => {
    const s = {
      year: toAstro(-1600) + 0.5,
      span: 50,
      view: 'dots' as const,
      cats: ['surgery', 'public-health'] as never,
      types: ['demonstration'] as never,
      matchTags: true,
      zoom: 'linear',
      story: { index: 2, step: 3 },
      event: 'edwin-smith-papyrus',
    };
    const h = encodeState(s);
    expect(h).toMatch(/^[a-z0-9-]+$/);
    const d = decodeState(`#${h}`);
    expect(Math.floor(d.year!)).toBe(Math.floor(s.year));
    expect(d.span).toBe(50);
    expect(d.view).toBe('dots');
    expect(d.cats).toEqual(['surgery', 'public-health']);
    expect(d.types).toEqual(['demonstration']);
    expect(d.matchTags).toBe(true);
    expect(d.zoom).toBe('linear');
    expect(d.story).toEqual({ index: 2, step: 3 });
    expect(d.event).toBe('edwin-smith-papyrus');
  });
  it('treats an empty hash as defaults', () => {
    expect(decodeState('')).toEqual({});
  });
  it('accepts a link that only names an event', () => {
    expect(decodeState('#e-ether-anaesthesia').event).toBe('ether-anaesthesia');
  });
});
