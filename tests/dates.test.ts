import { describe, expect, it } from 'vitest';
import { eventRange, formatPlayhead, formatYear, fromAstro, toAstro, visibility, COMPRESSED, LINEAR, DOMAIN_START, DOMAIN_END } from '../src/lib/dates';
import type { Milestone } from '../src/types';

const ev = (start: number, end: number): Milestone =>
  ({ id: 't', date: { start, end, display: '', kind: start === end ? 'point' : 'span', approximate: false, precision: 'year', basis: '' } } as unknown as Milestone);

describe('year conventions (no year zero)', () => {
  it('maps 1 BCE and 1 CE to adjacent astronomical years', () => {
    expect(toAstro(-1)).toBe(0);
    expect(toAstro(1)).toBe(1);
    expect(toAstro(1) - toAstro(-1)).toBe(1);
  });
  it('round-trips every year from 3000 BCE to 3000 CE except the non-existent year 0', () => {
    for (let y = -3000; y <= 3000; y++) {
      if (y === 0) continue;
      expect(fromAstro(toAstro(y))).toBe(y);
    }
  });
  it('never produces year 0 from a continuous playhead', () => {
    for (let a = -5; a <= 5; a += 0.25) expect(fromAstro(Math.floor(a))).not.toBe(0);
  });
  it('formats BCE and CE correctly', () => {
    expect(formatYear(-1)).toBe('1 BCE');
    expect(formatYear(1)).toBe('1 CE');
    expect(formatYear(-30000)).toBe('30,000 BCE');
    expect(formatYear(1846)).toBe('1846');
    expect(formatPlayhead(0.5)).toBe('1 BCE');
    expect(formatPlayhead(1.5)).toBe('1 CE');
  });
  it('computes spans across the BCE/CE boundary without an off-by-one', () => {
    // 10 BCE to 10 CE inclusive is 20 years, not 21.
    const [s, e] = eventRange(ev(-10, 10));
    expect(e - s).toBe(20);
  });
});

describe('visibility rules', () => {
  const span = ev(1967, 1980); // [1967, 1981)
  const point = ev(1796, 1796);
  it('cumulative: hidden before, partial during, full after a range', () => {
    expect(visibility(span, 1966.5, 'cumulative', 50)).toBe('hidden');
    expect(visibility(span, 1970, 'cumulative', 50)).toBe('partial');
    expect(visibility(span, 1981, 'cumulative', 50)).toBe('full');
  });
  it('cumulative: a single-year milestone is full from the start of its year', () => {
    expect(visibility(point, 1795.9, 'cumulative', 50)).toBe('hidden');
    expect(visibility(point, 1796.1, 'cumulative', 50)).toBe('full');
  });
  it('selected period: shows overlap, full only when entirely inside', () => {
    expect(visibility(span, 1960, 'window', 10)).toBe('hidden');
    expect(visibility(span, 1975, 'window', 10)).toBe('partial');
    expect(visibility(span, 1985, 'window', 20)).toBe('full');
    expect(visibility(span, 2000, 'window', 10)).toBe('hidden');
  });
});

describe('timeline scales', () => {
  for (const [name, sc] of [['compressed', COMPRESSED], ['linear', LINEAR]] as const) {
    it(`${name} scale is monotonic and invertible`, () => {
      let prev = -1;
      for (let i = 0; i <= 200; i++) {
        const a = DOMAIN_START + ((DOMAIN_END - DOMAIN_START) * i) / 200;
        const p = sc.pos(a);
        expect(p).toBeGreaterThanOrEqual(prev);
        prev = p;
        expect(Math.abs(sc.inv(p) - a)).toBeLessThan(1e-6 * (DOMAIN_END - DOMAIN_START));
      }
    });
  }
});
