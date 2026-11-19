/**
 * Country life expectancy at birth, for the optional map layer.
 * Source: Our World in Data (Riley 2005; Clio Infra 2015; UN Population Division 2019), CC BY 4.0.
 * Built by scripts/build-life-expectancy.mjs into public/data/life-expectancy.json.
 */
export interface LifeData {
  source: string;
  url: string;
  firstYear: number;
  lastYear: number;
  /** ISO 3166-1 numeric code (as used by the map's country shapes) -> [year, years of life] sorted by year. */
  series: Record<string, [number, number][]>;
}

/** An estimate is shown for up to this many years after the year it refers to, then the country goes blank. */
export const MAX_GAP_YEARS = 10;

/** Fixed bins in years of life expectancy at birth. */
export const LIFE_BINS = [30, 40, 50, 60, 70, 80];
/** One hue, light to dark: the darker the colour, the longer people could expect to live. */
export const LIFE_COLORS = ['#cfece6', '#a5dacf', '#7cc4b7', '#57aa9d', '#3a8f84', '#21736c', '#0d5552'];
export const LIFE_LABELS = ['under 30', '30–39', '40–49', '50–59', '60–69', '70–79', '80 and over'];
export const LIFE_SHORT = ['<30', '30s', '40s', '50s', '60s', '70s', '80+'];

export function lifeColor(v: number): string {
  let i = 0;
  while (i < LIFE_BINS.length && v >= LIFE_BINS[i]) i++;
  return LIFE_COLORS[i];
}

export interface LifeValue { value: number; year: number }

/** The most recent estimate at or before `year` (a historical year, no year 0), if it is recent enough. */
export function lifeAt(series: [number, number][] | undefined, year: number): LifeValue | null {
  if (!series || !series.length || year < series[0][0]) return null;
  let lo = 0, hi = series.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (series[mid][0] <= year) lo = mid; else hi = mid - 1;
  }
  const [y, v] = series[lo];
  return year - y <= MAX_GAP_YEARS ? { value: v, year: y } : null;
}

/** Values for every country at a given year. */
export function lifeSnapshot(data: LifeData, year: number): Map<string, LifeValue> {
  const out = new Map<string, LifeValue>();
  for (const [id, s] of Object.entries(data.series)) {
    const v = lifeAt(s, year);
    if (v) out.set(id, v);
  }
  return out;
}
