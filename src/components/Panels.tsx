import { useMemo, useState } from 'react';
import type { Milestone, Story, CategoryId } from '../types';
import { CAT, CATEGORIES, TYPES, TYPE_LABEL } from '../lib/meta';
import { ERAS, eventRange, toAstro, type Visibility } from '../lib/dates';
import { HEAT_STOPS, KERNEL_KM, THRESHOLDS, heatPosition } from '../lib/density';
import { LIFE_COLORS, LIFE_LABELS, LIFE_SHORT, MAX_GAP_YEARS, lifeSnapshot, type LifeData } from '../lib/lifeExpectancy';
import { fromAstro } from '../lib/dates';

// ---------------------------------------------------------------------------
export function Feed({ items, vis, pulses, currentId, onSelect }: {
  items: Milestone[]; vis: Map<string, Visibility>; pulses: Set<string>; currentId: string | null; onSelect: (id: string) => void;
}) {
  const shown = useMemo(() => {
    const v = items.filter((m) => (vis.get(m.id) ?? 'hidden') !== 'hidden');
    return v.slice(-12).reverse();
  }, [items, vis]);
  const total = items.filter((m) => (vis.get(m.id) ?? 'hidden') !== 'hidden').length;
  const unmapped = items.filter((m) => (vis.get(m.id) ?? 'hidden') !== 'hidden' && !m.locations.some((l) => l.lat != null)).length;
  return (
    <div className="feed">
      <p className="panel-intro">
        {total === 0 ? 'No milestones in view yet. Press play or move the timeline.' : `${total} milestone${total === 1 ? '' : 's'} so far, most recent first.`}
        {unmapped > 0 && ` ${unmapped === 1 ? 'One has' : `${unmapped} have`} no reliable location, so ${unmapped === 1 ? 'it appears' : 'they appear'} here and on the timeline but not on the map.`}
      </p>
      <ol className="feed-list" aria-live="polite" aria-relevant="additions">
        {shown.map((m) => (
          <li key={m.id} className={`${pulses.has(m.id) ? 'is-new' : ''} ${m.id === currentId ? 'is-current' : ''}`}>
            <button onClick={() => onSelect(m.id)} className="feed-item">
              <i className="swatch" style={{ background: CAT[m.category].color }} aria-hidden="true" />
              <span className="feed-date">{m.date.display}</span>
              <span className="feed-title">{m.title}</span>
              <span className="feed-sub">{TYPE_LABEL[m.type]}{m.locations[0] ? `, ${m.locations[0].modern}` : ''}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------
export function ListPanel({ all, filtered, vis, onSelect }: {
  all: Milestone[]; filtered: Set<string>; vis: Map<string, Visibility>; onSelect: (id: string) => void;
}) {
  const [q, setQ] = useState('');
  const [onlyFiltered, setOnlyFiltered] = useState(true);
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((m) => {
      if (onlyFiltered && !filtered.has(m.id)) return false;
      if (!needle) return true;
      const hay = [m.title, m.summary, m.date.display, ...m.people.map((p) => p.name), ...m.locations.map((l) => `${l.name} ${l.modern}`), ...m.themes, CAT[m.category].label].join(' ').toLowerCase();
      return hay.includes(needle);
    });
  }, [q, all, filtered, onlyFiltered]);
  const groups = ERAS.map((e) => ({
    era: e,
    items: results.filter((m) => {
      const s = eventRange(m)[0];
      return s >= toAstro(e.start) && s < toAstro(e.end);
    }),
  })).filter((g) => g.items.length);

  return (
    <div className="list-panel">
      <label className="search">
        <span className="sr-only">Search milestones</span>
        <input type="search" placeholder="Search people, places, topics…" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <label className="check small">
        <input type="checkbox" checked={onlyFiltered} onChange={(e) => setOnlyFiltered(e.target.checked)} /> Only milestones matching the current filters
      </label>
      <p className="panel-intro" aria-live="polite">{results.length} of {all.length} milestones</p>
      {groups.map((g) => (
        <section key={g.era.id}>
          <h3 className="list-era">{g.era.label}</h3>
          <ul className="list">
            {g.items.map((m) => {
              const hidden = (vis.get(m.id) ?? 'hidden') === 'hidden';
              const mapped = m.locations.some((l) => l.lat != null);
              return (
                <li key={m.id}>
                  <button onClick={() => onSelect(m.id)} className={`list-item ${hidden ? 'is-later' : ''}`}>
                    <i className="swatch" style={{ background: CAT[m.category].color }} aria-hidden="true" />
                    <span className="list-title">{m.title}</span>
                    <span className="list-sub">
                      {m.date.display}. {m.locations.map((l) => l.modern).join('; ') || 'Location unknown'}
                      {!mapped && <span className="badge">not mapped</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
export function StoriesPanel({ stories, byId, onStart }: { stories: Story[]; byId: Map<string, Milestone>; onStart: (i: number) => void }) {
  return (
    <div className="stories">
      <p className="panel-intro">Guided routes through verified milestones. Each shows independent work, borrowed knowledge, and the gaps between a discovery and its use.</p>
      <ul>
        {stories.map((s, i) => (
          <li key={s.id}>
            <button className="story-item" onClick={() => onStart(i)}>
              <span className="story-title">{s.title}</span>
              <span className="story-dek">{s.dek}</span>
              <span className="story-steps">
                {s.steps.map((st) => {
                  const m = byId.get(st.eventId);
                  return m ? <i key={st.eventId} style={{ background: CAT[m.category].color }} title={m.title} /> : null;
                })}
                <span className="muted small">{s.steps.length} steps</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
export function AboutPanel({ all, generated }: { all: Milestone[]; generated: string }) {
  const counts = CATEGORIES.map((c) => ({ c, n: all.filter((m) => m.category === c.id).length }));
  const typeCounts = TYPES.map((t) => ({ t, n: all.filter((m) => m.type === t.id).length }));
  const single = all.filter((m) => m.singleSource).length;
  const multi = all.filter((m) => m.locations.length > 1).length;
  const unmapped = all.filter((m) => !m.locations.some((l) => l.lat != null)).length;
  const sources = new Set(all.flatMap((m) => m.sources.map((s) => s.doi ?? s.url))).size;
  const suggested = all.filter((m) => m.suggestedBy === 'wikipedia-timeline').length;
  return (
    <div className="about">
      <p className="lead-small">This atlas maps {all.length} documented medical milestones, from a healed amputation in Borneo some 31,000 years ago to the present. Each entry was checked against published research, institutional records or museum and library collections ({sources} distinct sources).</p>
      {suggested > 0 && <p>{suggested} entries were suggested by Wikipedia's <a href="https://en.wikipedia.org/wiki/Timeline_of_medicine_and_medical_technology" target="_blank" rel="noreferrer">Timeline of medicine and medical technology</a>. Wikipedia was used only as a list of candidates: each was researched and checked against independent sources to the same standard as the rest, and several of its dates and attributions were corrected.</p>}

      <h3>What counts as a milestone</h3>
      <p>“Milestone” is an umbrella term. Each entry is labelled with the kind of contribution it represents, because evidence that something was done is not evidence that it worked:</p>
      <dl className="defs">
        {typeCounts.map(({ t, n }) => (
          <div key={t.id}><dt>{t.label} <span className="muted">({n})</span></dt><dd>{t.description}</dd></div>
        ))}
      </dl>
      <p>The earliest surviving record of a practice is not proof that it began there. Where several people or places reached the same result independently, they appear under one milestone with linked locations.</p>

      <h3>Categories</h3>
      <ul className="cat-defs">
        {counts.map(({ c, n }) => (
          <li key={c.id}><i style={{ background: c.color }} /><strong>{c.label}</strong> <span className="muted">({n})</span><br /><span className="small">{c.description}</span></li>
        ))}
      </ul>
      <p className="small">Medical devices appear as a theme rather than a category, since each device serves diagnosis, surgery or treatment. Each milestone has one primary category, which sets its colour, and may carry others as tags.</p>

      <h3>Reading the timeline</h3>
      <p>The full-history timeline is <strong>not to scale</strong>. It is divided into six bands, each labelled with the number of years it covers: the first band spans 26,500 years, the last little more than a century. Choose “All history, even scale” to see time drawn uniformly, or pick a period to zoom in, where the scale is even within that period.</p>
      <p>In “Through time” playback the playhead moves at a constant speed across the screen, so years pass faster in the compressed early bands. The current rate is always shown beside the controls.</p>
      <p><strong>Uncertain dates.</strong> A milestone dated to a range (for example “c. 7000–5500 BCE”) is never pinned to a single year. In the default view, a dot appears when the playhead reaches the earliest plausible year, stays hollow while the playhead is within the range, and fills in once the range has passed. In the selected-period view, a dot is shown if any part of its range overlaps the period, and is solid only if the whole range falls inside it. Dots with a dashed outer ring have approximate dates.</p>

      <h3>Reading the map</h3>
      <p>The map uses the Equal Earth projection, which preserves area, so a cluster of milestones in a small region is not exaggerated or shrunk by the map itself. Modern borders are drawn only to help orientation; they are not historical boundaries, and present-day place names are given for reference only.</p>
      <p>Where a location is known only approximately, a shaded circle shows the area the marker stands for. {unmapped > 0 ? `${unmapped} milestone${unmapped > 1 ? 's have' : ' has'} no reliable location and appear${unmapped > 1 ? '' : 's'} only in the list and on the timeline.` : 'Milestones without a reliable location are kept in the list and timeline but not placed on the map.'}</p>

      <h3>The heatmap</h3>
      <p><strong>Density of documented milestones in this atlas</strong> is a smoothed count of the milestones currently shown, and the map's default view. Point at a warm area to see how many milestones are there, and click to list them. It reflects which events were selected for this atlas and what documentation survives, not the total of medical achievement, population health or cultural importance anywhere.</p>
      <ul>
        <li>Every milestone counts equally. No importance scores or lives-saved estimates are used.</li>
        <li>A milestone with several linked locations is split between them, so it still counts once ({multi} milestones have more than one location).</li>
        <li>Each milestone is spread with a Gaussian kernel of {KERNEL_KM} km; uncertain locations are spread more widely.</li>
        <li>The colour scale is fixed and logarithmic, from pale yellow to deep red, with faint contour lines at {THRESHOLDS.join(', ')} milestones per million km². It never rescales during playback or filtering, so a colour always means the same density.</li>
      </ul>

      <h3>Life expectancy layer</h3>
      <p>The optional layer colours each present-day country by its estimated life expectancy at birth in the year on the timeline. It comes from <a href="https://ourworldindata.org/life-expectancy" target="_blank" rel="noreferrer">Our World in Data</a>, combining Clio Infra's country estimates before 1950 (Zijdeman and Ribeira da Silva, 2015) with the UN Population Division's World Population Prospects 2019 from 1950 to 2019 (CC BY 4.0).</p>
      <ul>
        <li>Before 1950 most countries have no estimate and are hatched. The earliest figures in the series are for the United Kingdom from 1543 and Sweden from 1751.</li>
        <li>Each country shows its most recent estimate from the previous ten years. After 2019 the 2019 figures are shown, so falls during the COVID-19 pandemic do not appear.</li>
        <li>Figures are given for present-day borders, including for years before those countries existed.</li>
        <li>Life expectancy at birth is pulled down heavily by deaths in infancy and childhood; it is not the age most adults reached.</li>
        <li>The layer is context. It does not show that any milestone on the map caused a change in life expectancy.</li>
      </ul>

      <h3>Evidence and its limits</h3>
      <p>Early and disputed claims were checked against at least two independent sources where possible. {single} milestone{single === 1 ? ' rests' : 's rest'} on a single study or account; {single === 1 ? 'it is' : 'these are'} flagged in {single === 1 ? 'its' : 'their'} card. Coverage is uneven: written and archaeological records survive unequally, and published scholarship over-represents some regions and languages. This atlas is a curated selection, not a complete history.</p>

      <h3>Keyboard</h3>
      <ul className="keys small">
        <li><kbd>Space</kbd> play or pause</li>
        <li><kbd>,</kbd> / <kbd>.</kbd> previous or next milestone</li>
        <li>Timeline: focus it, then <kbd>←</kbd> <kbd>→</kbd> to move, <kbd>Shift</kbd> for larger steps</li>
        <li><kbd>Esc</kbd> close the open card or panel</li>
        <li><kbd>+</kbd> / <kbd>−</kbd> zoom the map</li>
      </ul>

      <h3>Credits</h3>
      <p className="small">Basemap made with Natural Earth (public domain; naturalearthdata.com), via the world-atlas package (ISC licence). Life expectancy data: Our World in Data, CC BY 4.0. Typefaces: Public Sans (U.S. Web Design System) and Newsreader (Production Type), both under the SIL Open Font License. Data version {generated}. Full methodology, schema and bibliography are in the project’s documentation.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
export function Legend({ all, visibleCounts, cats, setCats, onHoverCat, onHide }: {
  all: Milestone[]; visibleCounts: Map<CategoryId, number>;
  cats: Set<CategoryId>; setCats: (c: Set<CategoryId>) => void;
  onHoverCat: (c: CategoryId | null) => void; onHide: () => void;
}) {
  const allOn = cats.size === CATEGORIES.length;
  return (
    <div className="legend" role="group" aria-label="Filter by category">
      <div className="legend-head">
        <span>Categories</span>
        <span className="legend-head-btns">
          <button className="btn-quiet small" onClick={() => setCats(new Set(allOn ? [] : CATEGORIES.map((c) => c.id)))}>{allOn ? 'Clear all' : 'Show all'}</button>
          <button className="btn-quiet small" onClick={onHide} aria-label="Hide categories and filters">Hide</button>
        </span>
      </div>
      <ul>
        {CATEGORIES.map((c) => {
          const on = cats.has(c.id);
          const total = all.filter((m) => m.category === c.id).length;
          return (
            <li key={c.id} onMouseEnter={() => onHoverCat(c.id)} onMouseLeave={() => onHoverCat(null)}>
              <button className={`legend-item ${on ? '' : 'is-off'}`} aria-pressed={on} onClick={() => {
                const n = new Set(cats);
                if (on) n.delete(c.id); else n.add(c.id);
                setCats(n);
              }}>
                <i style={{ background: on ? c.color : 'transparent', borderColor: c.color }} />
                <span>{c.short}</span>
                <span className="legend-n" aria-label={`${visibleCounts.get(c.id) ?? 0} on the map now, ${total} in the atlas`}>{visibleCounts.get(c.id) ?? 0}<span className="muted">/{total}</span></span>
              </button>
              <button className="legend-only" onClick={() => setCats(new Set([c.id]))} aria-label={`Show only ${c.label}`}>only</button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function DensityLegend({ heatOnly }: { heatOnly: boolean }) {
  const grad = `linear-gradient(to right, ${HEAT_STOPS.map((s, i) => `${s.color} ${(i / (HEAT_STOPS.length - 1)) * 100}%`).join(', ')})`;
  return (
    <div className="density-legend">
      <p className="dl-title">Density of documented milestones in this atlas</p>
      <div className="dl-bar" style={{ background: grad }} aria-hidden="true" />
      <div className="dl-ticks" aria-label="Scale from 0.25 to 16 milestones per million square kilometres">
        {THRESHOLDS.map((t) => (
          <span key={t} style={{ left: `${heatPosition(t) * 100}%` }}>{t}</span>
        ))}
      </div>
      <p className="small muted">Milestones per million km², smoothed over ~{KERNEL_KM} km, on a fixed scale. It reflects this atlas and what records survive, not all medical activity.{heatOnly ? ' Point at a warm area to see how many milestones are there; click to list them.' : ''}</p>
    </div>
  );
}

export function LifeLegend({ data, year, error }: { data: LifeData | null; year: number; error: boolean }) {
  const y = fromAstro(Math.floor(year));
  const n = data ? lifeSnapshot(data, y).size : 0;
  let note: string;
  if (error) note = 'The life expectancy data could not be loaded.';
  else if (!data) note = 'Loading life expectancy estimates…';
  else if (y < data.firstYear) note = `No country estimates this early. The series begins in ${data.firstYear} (United Kingdom); most countries have estimates only from 1950.`;
  else if (y > data.lastYear) note = `Latest estimates, for ${data.lastYear}, for ${n} countries and territories.`;
  else note = `Estimates for ${n} ${n === 1 ? 'country or territory' : 'countries and territories'} in ${y}.${y < 1950 ? ' Before 1950 most countries have no estimate.' : ''}`;
  return (
    <div className="life-legend" aria-live="polite">
      <p className="dl-title">Life expectancy at birth, in years</p>
      <div className="ll-scale">
        {LIFE_COLORS.map((c, i) => (
          <span key={c}><i style={{ background: c }} /><b className="ll-long">{LIFE_LABELS[i]}</b><b className="ll-short">{LIFE_SHORT[i]}</b></span>
        ))}
        <span><i className="ll-none" /><b className="ll-long">no estimate</b><b className="ll-short">none</b></span>
      </div>
      <p className="small muted">{note} Shown by present-day borders; each country shows its most recent estimate from the last {MAX_GAP_YEARS} years. Source: Our World in Data (Riley; Clio Infra; UN Population Division), CC BY 4.0.</p>
    </div>
  );
}
