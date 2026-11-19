import type { Milestone } from '../types';

/**
 * Historical years (data): ..., -2 = 2 BCE, -1 = 1 BCE, 1 = 1 CE, 2 = 2 CE ... (no zero)
 * Astronomical years (arithmetic): ..., -1 = 2 BCE, 0 = 1 BCE, 1 = 1 CE ...
 * The playhead is a continuous astronomical value: astro year N covers [N, N+1).
 */
export const toAstro = (y: number): number => (y < 0 ? y + 1 : y);
export const fromAstro = (a: number): number => (a <= 0 ? a - 1 : a);

const nf = new Intl.NumberFormat('en-GB');

/** Format a historical year. */
export function formatYear(y: number): string {
  if (y < 0) return `${nf.format(-y)} BCE`;
  if (y < 1000) return `${y} CE`;
  return String(y);
}

/** Format a continuous playhead position, rounded to a sensible resolution. */
export function formatPlayhead(a: number, resolution = 1): string {
  const y = fromAstro(Math.floor(a));
  if (resolution <= 1) return formatYear(y);
  const r = Math.round(y / resolution) * resolution;
  return `c. ${formatYear(r === 0 ? -1 : r)}`;
}

export const NOW_YEAR = new Date().getFullYear();
export const DOMAIN_START_HIST = -30000;
export const DOMAIN_START = toAstro(DOMAIN_START_HIST);
export const DOMAIN_END = NOW_YEAR + 1; // end of the current year (astro == historical for CE)

/** Event interval as half-open astronomical range [s, e). */
export function eventRange(m: Milestone): [number, number] {
  return [toAstro(m.date.start), toAstro(m.date.end) + 1];
}

export type Visibility = 'hidden' | 'partial' | 'full';

/**
 * How a milestone is shown for a given playhead.
 *
 * Cumulative view (everything up to the playhead):
 *   - appears when the playhead reaches the EARLIEST plausible year (date.start);
 *   - is drawn hollow ("partial") while the playhead is still inside its date range,
 *     because it may not yet have happened (point) or is still under way (span);
 *   - becomes solid once the playhead passes the LATEST plausible year (date.end).
 *
 * Selected-period view (window [playhead - span, playhead)):
 *   - shown if any part of its date range overlaps the window;
 *   - solid only if its whole date range lies inside the window, otherwise hollow.
 */
export function visibility(m: Milestone, playhead: number, mode: 'cumulative' | 'window', span: number): Visibility {
  const [s, e] = eventRange(m);
  if (mode === 'cumulative') {
    if (playhead < s) return 'hidden';
    if (e - s > 1 && playhead < e) return 'partial';
    return 'full';
  }
  const w0 = playhead - span;
  if (s >= playhead || e <= w0) return 'hidden';
  return s >= w0 && e <= playhead ? 'full' : 'partial';
}

export function compareMilestones(a: Milestone, b: Milestone): number {
  const [as, ae] = eventRange(a);
  const [bs, be] = eventRange(b);
  return as - bs || ae - be || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Timeline scales
// ---------------------------------------------------------------------------

export interface Stop {
  a: number; // astronomical year
  p: number; // position 0..1
}

export interface TimeScale {
  id: string;
  stops: Stop[];
  pos: (a: number) => number;
  inv: (p: number) => number;
  /** Years per unit of axis (0..1) at astronomical year a. */
  yearsPerAxis: (a: number) => number;
  domain: [number, number];
  segments: { a0: number; a1: number; p0: number; p1: number }[];
}

export function makeScale(id: string, stops: Stop[]): TimeScale {
  const segs = stops.slice(1).map((s, i) => ({ a0: stops[i].a, a1: s.a, p0: stops[i].p, p1: s.p }));
  const findA = (a: number) => segs.find((s) => a < s.a1) ?? segs[segs.length - 1];
  const findP = (p: number) => segs.find((s) => p < s.p1) ?? segs[segs.length - 1];
  return {
    id,
    stops,
    segments: segs,
    domain: [stops[0].a, stops[stops.length - 1].a],
    pos(a) {
      const s = a <= segs[0].a0 ? segs[0] : findA(a);
      return s.p0 + ((a - s.a0) / (s.a1 - s.a0)) * (s.p1 - s.p0);
    },
    inv(p) {
      const s = p <= segs[0].p0 ? segs[0] : findP(p);
      return s.a0 + ((p - s.p0) / (s.p1 - s.p0)) * (s.a1 - s.a0);
    },
    yearsPerAxis(a) {
      const s = findA(a);
      return (s.a1 - s.a0) / (s.p1 - s.p0);
    },
  };
}

export interface Era {
  id: string;
  label: string;
  start: number; // historical
  end: number; // historical (exclusive end expressed as next year's start)
}

/** Era shortcuts: plain date ranges, deliberately not regional period names. */
export const ERAS: Era[] = [
  { id: 'e1', label: '30,000–3500 BCE', start: -30000, end: -3500 },
  { id: 'e2', label: '3500 BCE–500 CE', start: -3500, end: 500 },
  { id: 'e3', label: '500–1500', start: 500, end: 1500 },
  { id: 'e4', label: '1500–1800', start: 1500, end: 1800 },
  { id: 'e5', label: '1800–1900', start: 1800, end: 1900 },
  { id: 'e6', label: `1900–${NOW_YEAR}`, start: 1900, end: NOW_YEAR + 1 },
];

/** Share of the full-history axis given to each era in the compressed scale. */
const ERA_WIDTHS = [0.12, 0.17, 0.12, 0.16, 0.18, 0.25];

export const COMPRESSED: TimeScale = (() => {
  const stops: Stop[] = [{ a: toAstro(ERAS[0].start), p: 0 }];
  let p = 0;
  ERAS.forEach((e, i) => {
    p += ERA_WIDTHS[i];
    stops.push({ a: toAstro(e.end), p: i === ERAS.length - 1 ? 1 : p });
  });
  return makeScale('compressed', stops);
})();

export const LINEAR: TimeScale = makeScale('linear', [
  { a: DOMAIN_START, p: 0 },
  { a: DOMAIN_END, p: 1 },
]);

export function eraScale(era: Era): TimeScale {
  return makeScale(era.id, [
    { a: toAstro(era.start), p: 0 },
    { a: toAstro(era.end), p: 1 },
  ]);
}

/** Pick a tick step (in years) so that ticks are at least minPx apart. */
export function tickStep(yearsPerPx: number, minPx: number): number {
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000];
  return steps.find((s) => s / yearsPerPx >= minPx) ?? 10000;
}

/** Resolution at which to print the playhead year, given how many years one pixel covers. */
export function playheadResolution(yearsPerPx: number): number {
  if (yearsPerPx > 40) return 100;
  if (yearsPerPx > 4) return 10;
  return 1;
}
