import type { CategoryId, MilestoneType } from '../types';
import { CATEGORIES, TYPES } from './meta';
import { fromAstro, toAstro } from './dates';

/**
 * Shareable view state, stored in the URL hash using only letters, digits and
 * hyphens so it survives hosts that restrict the hash (e.g. sandboxed previews).
 * Tokens are joined with "--"; the event id (which may contain hyphens) is last.
 *
 *   #y1846--w50--vboth--c-sur-pub--t-dem-cli--zl--e-ether-anaesthesia
 *
 *   y<year>[bce]   playhead year (historical)
 *   w<span>        selected-period view with this many years (absent = cumulative)
 *   vdots|vboth          map view (absent = heatmap, the default)
 *   c-<codes>      category filter (absent = all)
 *   t-<codes>      milestone-type filter (absent = all)
 *   g              match secondary tags too
 *   zl | z<era>    timeline: linear full scale, or zoomed to an era id
 *   s<n>p<m>       story n, step m
 *   e-<id>         selected milestone
 */
export interface UrlState {
  year?: number; // astro
  span?: number;
  view?: 'dots' | 'density' | 'both';
  cats?: CategoryId[];
  types?: MilestoneType[];
  matchTags?: boolean;
  zoom?: string; // 'linear' | era id
  story?: { index: number; step: number };
  event?: string;
}

export function encodeState(s: UrlState): string {
  const t: string[] = [];
  if (s.year !== undefined) {
    const y = fromAstro(Math.floor(s.year));
    t.push(y < 0 ? `y${-y}bce` : `y${y}`);
  }
  if (s.span) t.push(`w${Math.round(s.span)}`);
  if (s.view && s.view !== 'density') t.push(`v${s.view}`);
  if (s.cats && s.cats.length < CATEGORIES.length) t.push(`c-${s.cats.map((c) => CATEGORIES.find((x) => x.id === c)!.code).join('-') || 'none'}`);
  if (s.types && s.types.length < TYPES.length) t.push(`t-${s.types.map((c) => TYPES.find((x) => x.id === c)!.code).join('-') || 'none'}`);
  if (s.matchTags) t.push('g');
  if (s.zoom) t.push(s.zoom === 'linear' ? 'zl' : `z${s.zoom}`);
  if (s.story) t.push(`s${s.story.index}p${s.story.step}`);
  if (s.event) t.push(`e-${s.event}`);
  return t.join('--');
}

export function decodeState(hash: string): UrlState {
  const h = hash.replace(/^#/, '');
  if (!h) return {};
  const out: UrlState = {};
  const ePos = h.indexOf('e-');
  let rest = h;
  if (ePos === 0 || h.indexOf('--e-') >= 0) {
    const i = ePos === 0 ? 0 : h.indexOf('--e-') + 2;
    out.event = h.slice(i + 2);
    rest = h.slice(0, Math.max(0, i - 2));
  }
  for (const tok of rest.split('--').filter(Boolean)) {
    let m: RegExpMatchArray | null;
    if ((m = tok.match(/^y(\d+)(bce)?$/))) out.year = toAstro(m[2] ? -Number(m[1]) : Number(m[1])) + 0.5;
    else if ((m = tok.match(/^w(\d+)$/))) out.span = Number(m[1]);
    else if ((m = tok.match(/^v(dots|density|both)$/))) out.view = m[1] as UrlState['view'];
    else if (tok.startsWith('c-')) out.cats = tok.slice(2).split('-').map((c) => CATEGORIES.find((x) => x.code === c)?.id).filter(Boolean) as CategoryId[];
    else if (tok.startsWith('t-')) out.types = tok.slice(2).split('-').map((c) => TYPES.find((x) => x.code === c)?.id).filter(Boolean) as MilestoneType[];
    else if (tok === 'g') out.matchTags = true;
    else if (tok === 'zl') out.zoom = 'linear';
    else if ((m = tok.match(/^z(e\d)$/))) out.zoom = m[1];
    else if ((m = tok.match(/^s(\d+)p(\d+)$/))) out.story = { index: Number(m[1]), step: Number(m[2]) };
  }
  return out;
}
