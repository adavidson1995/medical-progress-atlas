import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AtlasData, CategoryId, MilestoneType } from './types';
import { CAT, CATEGORIES, TYPES } from './lib/meta';
import {
  COMPRESSED, DOMAIN_END, DOMAIN_START, ERAS, LINEAR, compareMilestones, eraScale, eventRange,
  formatPlayhead, formatReadoutYear, playheadResolution, toAstro, visibility, type Visibility,
} from './lib/dates';
import { decodeState, encodeState } from './lib/urlState';
import { MapView, type MapHandle, type MapViewMode } from './components/MapView';
import { Timeline } from './components/Timeline';
import { EventCard } from './components/EventCard';
import { AboutPanel, DensityLegend, Feed, Legend, LifeLegend, ListPanel, StoriesPanel } from './components/Panels';
import type { LifeData } from './lib/lifeExpectancy';

const AXIS_SECONDS = 90; // seconds to cross the whole timeline at 1× in "through time" playback
const EVENT_MS = 2600; // milliseconds per milestone at 1× in "through events" playback
const SPEEDS = [0.5, 1, 2, 4];
const SPANS = [10, 25, 50, 100, 250, 1000, 5000];
type Panel = 'feed' | 'list' | 'stories' | 'about';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const inFrame = (() => { try { return window.top !== window.self; } catch { return true; } })();

export default function App() {
  const init = useMemo(() => decodeState(window.location.hash), []);
  const hasInitState = Object.keys(init).length > 0;

  const [data, setData] = useState<AtlasData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [year, setYear] = useState<number>(init.year ?? (reducedMotion() ? DOMAIN_END - 0.5 : toAstro(1750) + 0.5));
  const [mode, setMode] = useState<'cumulative' | 'window'>(init.span ? 'window' : 'cumulative');
  const [span, setSpan] = useState<number>(init.span ?? 100);
  const [playing, setPlaying] = useState(false);
  const [playMode, setPlayMode] = useState<'events' | 'time'>('events');
  const [speed, setSpeed] = useState(1);
  const [zoom, setZoom] = useState<string>(init.zoom ?? 'compressed');
  const [cats, setCats] = useState<Set<CategoryId>>(new Set(init.cats ?? CATEGORIES.map((c) => c.id)));
  const [types, setTypes] = useState<Set<MilestoneType>>(new Set(init.types ?? TYPES.map((t) => t.id)));
  const [matchTags, setMatchTags] = useState(!!init.matchTags);
  const [view, setView] = useState<MapViewMode>(init.view ?? 'density');
  const [borders, setBorders] = useState(true);
  const [lifeOn, setLifeOn] = useState(!!init.life);
  const [lifeData, setLifeData] = useState<LifeData | null>(null);
  const [lifeError, setLifeError] = useState(false);
  useEffect(() => {
    if (!lifeOn || lifeData) return;
    fetch(`${import.meta.env.BASE_URL}data/life-expectancy.json`)
      .then((r) => r.json())
      .then(setLifeData)
      .catch(() => setLifeError(true));
  }, [lifeOn, lifeData]);
  const [follow, setFollow] = useState(false);
  const [selected, setSelected] = useState<string | null>(init.event ?? null);
  const [panel, setPanel] = useState<Panel>('feed');
  const [sideOpen, setSideOpen] = useState(() => !!init.event); // mobile bottom sheet
  const [story, setStory] = useState<{ index: number; step: number } | null>(init.story ?? null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [intro, setIntro] = useState(!hasInitState);
  const [hoverCat, setHoverCat] = useState<CategoryId | null>(null);
  const [clusterList, setClusterList] = useState<{ ids: string[]; x: number; y: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareFallback, setShareFallback] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(() => typeof window !== 'undefined' && window.innerWidth > 860 && window.innerHeight >= 820);
  const [pulses, setPulses] = useState<Set<string>>(new Set());
  const mapRef = useRef<MapHandle>(null);

  // ---- data
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/atlas.json`)
      .then((r) => r.json())
      .then((d: AtlasData) => setData({ ...d, milestones: [...d.milestones].sort(compareMilestones) }))
      .catch(() => setLoadError(true));
  }, []);

  const all = data?.milestones ?? [];
  const byId = useMemo(() => new Map(all.map((m) => [m.id, m])), [all]);
  const stories = data?.stories ?? [];

  const filtered = useMemo(
    () => all.filter((m) => (cats.has(m.category) || (matchTags && m.tags.some((t) => cats.has(t)))) && types.has(m.type)),
    [all, cats, types, matchTags],
  );
  const filterKey = filtered.map((m) => m.id).join('|');
  const filteredSet = useMemo(() => new Set(filtered.map((m) => m.id)), [filtered]);

  const scale = useMemo(() => {
    if (zoom === 'linear') return LINEAR;
    const era = ERAS.find((e) => e.id === zoom);
    return era ? eraScale(era) : COMPRESSED;
  }, [zoom]);

  const vis = useMemo(() => {
    const v = new Map<string, Visibility>();
    for (const m of filtered) v.set(m.id, visibility(m, year, mode, span));
    return v;
  }, [filtered, year, mode, span]);

  const visibleCounts = useMemo(() => {
    const c = new Map<CategoryId, number>();
    for (const m of filtered) if (vis.get(m.id) !== 'hidden') c.set(m.category, (c.get(m.category) ?? 0) + 1);
    return c;
  }, [filtered, vis]);

  const filtersActive = cats.size < CATEGORIES.length || types.size < TYPES.length;



  // ---- pulses for newly appearing milestones (forward movement only)
  const prev = useRef({ visible: new Set<string>(), year, filterKey });
  useEffect(() => {
    const nowVisible = new Set<string>();
    vis.forEach((v, id) => { if (v !== 'hidden') nowVisible.add(id); });
    const p = prev.current;
    if (p.filterKey === filterKey && year > p.year) {
      const fresh = [...nowVisible].filter((id) => !p.visible.has(id));
      if (fresh.length) {
        setPulses((s) => new Set([...s, ...fresh]));
        window.setTimeout(() => setPulses((s) => { const n = new Set(s); fresh.forEach((id) => n.delete(id)); return n; }), 1800);
        if (follow && playing) {
          const last = byId.get(fresh[fresh.length - 1]);
          const loc = last?.locations.find((l) => l.lat != null);
          if (loc) mapRef.current?.focus(loc.lon as number, loc.lat as number);
        }
      }
    }
    prev.current = { visible: nowVisible, year, filterKey };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vis]);

  // ---- playback
  const yearRef = useRef(year);
  yearRef.current = year;
  const currentRef = useRef(currentId);
  currentRef.current = currentId;

  const nextIndex = useCallback((dir: 1 | -1): number => {
    const y = yearRef.current;
    const cur = currentRef.current ? filtered.findIndex((m) => m.id === currentRef.current) : -1;
    if (cur >= 0 && Math.abs(eventRange(filtered[cur])[0] + 0.5 - y) < 1e-6) {
      const n = cur + dir;
      return n >= 0 && n < filtered.length ? n : -1;
    }
    if (dir === 1) return filtered.findIndex((m) => eventRange(m)[0] + 0.5 > y + 1e-6);
    for (let i = filtered.length - 1; i >= 0; i--) if (eventRange(filtered[i])[0] + 0.5 < y - 1e-6) return i;
    return -1;
  }, [filtered]);

  const goToIndex = useCallback((i: number) => {
    const m = filtered[i];
    if (!m) return;
    const y = eventRange(m)[0] + 0.5;
    if (y < scale.domain[0] || y > scale.domain[1]) setZoom('compressed');
    setYear(y);
    setCurrentId(m.id);
  }, [filtered, scale]);

  const step = useCallback((dir: 1 | -1) => {
    const i = nextIndex(dir);
    if (i < 0) { if (dir === 1) setPlaying(false); return; }
    goToIndex(i);
  }, [nextIndex, goToIndex]);

  useEffect(() => {
    if (!playing) return;
    if (playMode === 'time') {
      let raf = 0;
      let last = performance.now();
      const tick = (now: number) => {
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        const p = scale.pos(yearRef.current) + (dt * speed) / AXIS_SECONDS;
        if (p >= 1) { setYear(scale.domain[1] - 0.001); setPlaying(false); return; }
        setYear(scale.inv(p));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
    step(1);
    const id = window.setInterval(() => step(1), EVENT_MS / speed);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, playMode, speed, scale, filterKey]);

  // autoplay a short demonstration on first visit
  useEffect(() => {
    if (!data || hasInitState || reducedMotion()) return;
    const t = window.setTimeout(() => setPlaying(true), 1400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // ---- selection
  const select = useCallback((id: string, opts: { keepStory?: boolean } = {}) => {
    const m = byId.get(id);
    if (!m) return;
    setPlaying(false);
    setSelected(id);
    setClusterList(null);
    setSideOpen(true);
    setIntro(false);
    if (!opts.keepStory) setStory(null);
    if (!filteredSet.has(id)) {
      setCats(new Set(CATEGORIES.map((c) => c.id)));
      setTypes(new Set(TYPES.map((t) => t.id)));
    }
    const [s, e] = eventRange(m);
    const v = visibility(m, yearRef.current, mode, span);
    if (opts.keepStory) {
      // In a story, move the playhead to just after the milestone, so the map shows the world as it stood then.
      const y = Math.min(e - s > 1 ? e + 0.01 : s + 0.5, DOMAIN_END - 0.5);
      setYear(y);
      if (y < scale.domain[0] || y > scale.domain[1]) setZoom('compressed');
    } else if (v === 'hidden') {
      const y = s + 0.5;
      setYear(y);
      if (y < scale.domain[0] || y > scale.domain[1]) setZoom('compressed');
    }
    const loc = m.locations.find((l) => l.lat != null);
    if (loc) window.setTimeout(() => mapRef.current?.focus(loc.lon as number, loc.lat as number), 30);
  }, [byId, filteredSet, mode, span, scale]);

  const closeCard = () => { setSelected(null); setStory(null); };

  const neighbours = useMemo(() => {
    if (!selected) return { prev: undefined, next: undefined };
    const i = all.findIndex((m) => m.id === selected);
    return { prev: all[i - 1]?.id, next: all[i + 1]?.id };
  }, [selected, all]);

  // ---- stories
  const startStory = (index: number) => {
    const s = stories[index];
    if (!s) return;
    setStory({ index, step: 0 });
    setMode('cumulative');
    select(s.steps[0].eventId, { keepStory: true });
  };
  const storyStep = (d: 1 | -1) => {
    if (!story) return;
    const s = stories[story.index];
    const n = story.step + d;
    if (n < 0) return;
    if (n >= s.steps.length) { setStory(null); return; }
    setStory({ index: story.index, step: n });
    select(s.steps[n].eventId, { keepStory: true });
  };
  useEffect(() => {
    if (story && data && !selected) {
      const s = stories[story.index];
      if (s) select(s.steps[Math.min(story.step, s.steps.length - 1)].eventId, { keepStory: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // A pasted link that changes only the hash does not reload the page, so reload to apply it.
  // (replaceState, used below to keep the hash in sync, does not fire hashchange.)
  // Hashes this page wrote itself are ignored, in case a host frame echoes them back late.
  const writtenHashes = useRef<string[]>([]);
  const writeHash = (h: string) => {
    writtenHashes.current = [...writtenHashes.current.slice(-30), h];
    try { window.history.replaceState(null, '', `#${h}`); } catch { /* ignore */ }
  };
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace(/^#/, '');
      if (!h || writtenHashes.current.includes(h)) return;
      window.location.reload();
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // ---- URL state (not while playing, to avoid churn)
  const hash = useMemo(() => encodeState({
    year,
    span: mode === 'window' ? span : undefined,
    view,
    cats: [...cats],
    types: [...types],
    matchTags,
    life: lifeOn,
    zoom: zoom === 'compressed' ? undefined : zoom,
    story: story ?? undefined,
    event: selected ?? undefined,
  }), [year, mode, span, view, cats, types, matchTags, lifeOn, zoom, story, selected]);
  useEffect(() => {
    if (playing || intro) return;
    const t = window.setTimeout(() => writeHash(hash), 300);
    return () => window.clearTimeout(t);
  }, [hash, playing, intro]);

  const copyLink = () => {
    writeHash(hash);
    const url = window.location.href.split('#')[0] + '#' + hash;
    const done = () => { setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
    if (inFrame) { setShareFallback(url); return; }
    navigator.clipboard?.writeText(url).then(done, () => setShareFallback(url)) ?? setShareFallback(url);
  };

  // ---- keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (e.key === ' ' && tag !== 'BUTTON' && !(e.target as HTMLElement).getAttribute('role')) { e.preventDefault(); setPlaying((p) => !p); setIntro(false); }
      else if (e.key === '.') { setPlaying(false); step(1); }
      else if (e.key === ',') { setPlaying(false); step(-1); }
      else if (e.key === 'Escape') { if (clusterList) setClusterList(null); else if (selected) closeCard(); else setSideOpen(false); }
      else if (e.key === '+' || e.key === '=') mapRef.current?.zoomBy(1.6);
      else if (e.key === '-') mapRef.current?.zoomBy(1 / 1.6);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ---- derived labels
  const ypp = scale.yearsPerAxis(year) / 1000; // years per pixel on a ~1000px timeline
  const playheadLabel = formatPlayhead(year, playheadResolution(ypp));
  const yearsPerSecond = (scale.yearsPerAxis(year) * speed) / AXIS_SECONDS;
  const rateLabel = yearsPerSecond >= 10
    ? `${new Intl.NumberFormat('en-GB', { maximumSignificantDigits: 2 }).format(yearsPerSecond)} years per second`
    : `${yearsPerSecond.toFixed(1)} years per second`;
  const readoutYear = formatReadoutYear(year);
  const segIdx = scale.segments.findIndex((s) => year < s.a1);

  const startFromBeginning = () => {
    setIntro(false);
    setSelected(null);
    setStory(null);
    setMode('cumulative');
    setZoom('compressed');
    setPlayMode('events');
    setCurrentId(null);
    setYear(DOMAIN_START);
    setPlaying(true);
  };

  if (loadError) return <div className="fatal"><h1>An Atlas of Medical Progress</h1><p>The milestone data could not be loaded. Check your connection and reload the page.</p></div>;

  const selectedM = selected ? byId.get(selected) : undefined;
  const storyObj = story ? stories[story.index] : undefined;

  return (
    <div className={`app ${sideOpen ? 'side-open' : ''} ${intro ? 'intro-open' : ''}`}>
      <a href="#side" className="skip">Skip to milestone panel</a>
      <header className="masthead">
        <div className="brand">
          <h1>An Atlas of Medical Progress</h1>
          <p className="brand-sub">{all.length || '…'} documented milestones, from a healed amputation 31,000 years ago to the present</p>
        </div>
        <nav className="tabs" aria-label="Panels">
          {([['feed', 'Now appearing'], ['list', 'All milestones'], ['stories', 'Stories'], ['about', 'About & method']] as [Panel, string][]).map(([id, label]) => (
            <button key={id} className={`tab ${panel === id && !selectedM ? 'is-active' : ''}`} aria-pressed={panel === id && !selectedM} onClick={() => { setPanel(id); setSelected(null); setStory(null); setSideOpen(true); }}>{label}</button>
          ))}
          <button className="tab tab-share" onClick={copyLink}>{copied ? 'Copied' : 'Share view'}</button>
        </nav>
      </header>

      <main className="stage">
        <section className="map-area" data-hl={hoverCat ?? undefined} aria-label="Map">
          <MapView
            ref={mapRef}
            items={filtered}
            vis={vis}
            pulses={pulses}
            selectedId={selected}
            view={view}
            borders={borders}
            life={lifeOn ? lifeData : null}
            year={year}
            onSelect={(id) => select(id)}
            onClusterList={(ids, x, y) => setClusterList({ ids, x, y })}
          />

          <div className="readout" aria-live="off">
            <p className="readout-year">{readoutYear}</p>
            {!playing && (
              <p className="readout-sub">
                {mode === 'window' ? `Showing milestones dated within the ${span} years to here` : 'Showing all milestones up to here'}
              </p>
            )}
          </div>

          {intro && (
            <div className="intro" role="dialog" aria-labelledby="intro-title">
              <h2 id="intro-title">Thirty-one thousand years of looking after each other</h2>
              <p>Watch documented medical milestones appear across the world: surgery in Ice Age Borneo, quarantine in medieval Ragusa, anaesthesia in Japan and Boston, trials in Auckland and Conakry. Click any warm area of the map, or any entry in the feed, for a sourced account of what happened, what changed and what remains uncertain.</p>
              <div className="intro-actions">
                <button className="btn btn-primary" onClick={startFromBeginning}>Start from the beginning</button>
                <button className="btn" onClick={() => { setIntro(false); setPlaying(false); setYear(DOMAIN_END - 0.5); }}>Show the whole atlas</button>
              </div>
              <p className="small muted">{playing ? 'Playing from 1750 as a preview.' : ''} Press Space to pause at any time.</p>
              <button className="btn-close intro-close" onClick={() => setIntro(false)} aria-label="Close introduction">×</button>
            </div>
          )}

          <div className="map-tools">
            <div className="seg" role="group" aria-label="Map display">
              {([['density', 'Heatmap'], ['dots', 'Milestones'], ['both', 'Both']] as [MapViewMode, string][]).map(([v, l]) => (
                <button key={v} aria-pressed={view === v} className={view === v ? 'is-on' : ''} onClick={() => setView(v)}>{l}</button>
              ))}
            </div>
            <div className="zoom-btns" role="group" aria-label="Map zoom">
              <button onClick={() => mapRef.current?.zoomBy(1.6)} aria-label="Zoom in">+</button>
              <button onClick={() => mapRef.current?.zoomBy(1 / 1.6)} aria-label="Zoom out">−</button>
              <button onClick={() => mapRef.current?.reset()} aria-label="Reset map view" className="small">World</button>
            </div>
            <label className="check small pill pill-life"><input type="checkbox" checked={lifeOn} onChange={(e) => setLifeOn(e.target.checked)} /> Life expectancy by country</label>
            <label className="check small pill"><input type="checkbox" checked={borders} onChange={(e) => setBorders(e.target.checked)} /> Modern borders (for orientation only)</label>
            <label className="check small pill"><input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} /> Follow new milestones</label>
          </div>

          <div className={`legend-wrap ${showFilters ? 'is-open' : ''}`}>
            {!showFilters && (
              <button className="legend-toggle" onClick={() => setShowFilters(true)} aria-expanded={false}>
                <span>Categories{filtersActive ? ' (filtered)' : ''}</span>
                <span className="legend-dots" aria-hidden="true">
                  {CATEGORIES.map((c) => <i key={c.id} style={{ background: cats.has(c.id) ? c.color : 'transparent', borderColor: c.color }} />)}
                </span>
              </button>
            )}
            {showFilters && (
              <>
                <Legend
                  all={all}
                  visibleCounts={visibleCounts}
                  cats={cats}
                  setCats={setCats}
                  onHoverCat={setHoverCat}
                  onHide={() => setShowFilters(false)}
                />
                <details className="type-filter" open={types.size < TYPES.length || undefined}>
                  <summary className="legend-head">
                    <span>More filters</span>
                    <span className="legend-n">{filtered.length} of {all.length} milestones</span>
                  </summary>
                  <label className="check small">
                    <input type="checkbox" checked={matchTags} onChange={(e) => setMatchTags(e.target.checked)} />
                    Also show milestones that list a category as a secondary tag
                  </label>
                  <p className="legend-sub">Kind of milestone</p>
                  <div className="type-chips" role="group" aria-label="Filter by kind of milestone">
                    {TYPES.map((t) => {
                      const on = types.has(t.id);
                      return (
                        <button key={t.id} className={`chip ${on ? 'is-on' : ''}`} aria-pressed={on} title={t.description} onClick={() => {
                          const n = new Set(types);
                          if (on) n.delete(t.id); else n.add(t.id);
                          setTypes(n.size ? n : new Set(TYPES.map((x) => x.id)));
                        }}>{t.label}</button>
                      );
                    })}
                  </div>
                  <p className="small muted legend-foot">Counts beside each category: on the map now / in the atlas.</p>
                </details>
              </>
            )}
          </div>

          <div className="map-legends">
            {lifeOn && <LifeLegend data={lifeData} error={lifeError} />}
            {view !== 'dots' && <DensityLegend heatOnly={view === 'density'} />}
          </div>

          {clusterList && (
            <div className="cluster-pop" style={{ left: Math.max(8, clusterList.x - 140), top: clusterList.y + 18 }} role="dialog" aria-label="Milestones at this place">
              <button className="btn-close" onClick={() => setClusterList(null)} aria-label="Close list">×</button>
              <ul>
                {clusterList.ids.map((id) => {
                  const m = byId.get(id)!;
                  return (
                    <li key={id}><button onClick={() => select(id)}><i style={{ background: CAT[m.category].color }} />{m.title}<span className="muted"> {m.date.display}</span></button></li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        <aside className={`side ${sideOpen ? 'is-open' : ''}`} id="side" tabIndex={-1} aria-label="Milestone panel">
          <button className="sheet-handle" onClick={() => { if (selectedM) closeCard(); else setSideOpen(false); }} aria-label="Close panel">Close</button>
          {selectedM ? (
            <EventCard
              m={selectedM}
              byId={byId}
              onClose={closeCard}
              onSelect={(id) => select(id)}
              onPrev={story ? undefined : neighbours.prev ? () => select(neighbours.prev!) : undefined}
              onNext={story ? undefined : neighbours.next ? () => select(neighbours.next!) : undefined}
              story={story && storyObj ? {
                title: storyObj.title,
                note: storyObj.steps[story.step].note,
                step: story.step,
                total: storyObj.steps.length,
                onPrev: () => storyStep(-1),
                onNext: () => storyStep(1),
                onExit: () => setStory(null),
              } : undefined}
              onCopyLink={copyLink}
              copied={copied}
            />
          ) : (
            <div className="panel">
              {panel === 'feed' && <Feed items={filtered} vis={vis} pulses={pulses} currentId={currentId} onSelect={(id) => select(id)} />}
              {panel === 'list' && <ListPanel all={all} filtered={filteredSet} vis={vis} onSelect={(id) => select(id)} />}
              {panel === 'stories' && <StoriesPanel stories={stories} byId={byId} onStart={startStory} />}
              {panel === 'about' && <AboutPanel all={all} generated={data?.generated ?? ''} />}
            </div>
          )}
        </aside>
      </main>

      <section className="dock" aria-label="Timeline and playback">
        <div className="controls">
          <div className="transport">
            <button className="btn-icon" onClick={() => { setPlaying(false); step(-1); }} aria-label="Previous milestone" title="Previous milestone (,)">⏮</button>
            <button className="btn-play" onClick={() => { setIntro(false); if (!playing && yearRef.current >= scale.domain[1] - 1) setYear(scale.domain[0]); setPlaying((p) => !p); }} aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <span aria-hidden="true">❚❚</span> : <span aria-hidden="true">▶</span>}
              <span className="btn-play-label">{playing ? 'Pause' : 'Play'}</span>
            </button>
            <button className="btn-icon" onClick={() => { setPlaying(false); step(1); }} aria-label="Next milestone" title="Next milestone (.)">⏭</button>
          </div>
          <div className="seg" role="group" aria-label="Playback mode">
            <button aria-pressed={playMode === 'events'} className={playMode === 'events' ? 'is-on' : ''} onClick={() => setPlayMode('events')} title="Jump from one milestone to the next">Through milestones</button>
            <button aria-pressed={playMode === 'time'} className={playMode === 'time' ? 'is-on' : ''} onClick={() => setPlayMode('time')} title="Move steadily along the timeline">Through time</button>
          </div>
          <div className="seg seg-speed" role="group" aria-label="Playback speed">
            {SPEEDS.map((s) => (
              <button key={s} aria-pressed={speed === s} className={speed === s ? 'is-on' : ''} onClick={() => setSpeed(s)}>{s}×</button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="What the map shows">
            <button aria-pressed={mode === 'cumulative'} className={mode === 'cumulative' ? 'is-on' : ''} onClick={() => setMode('cumulative')}>Everything so far</button>
            <button aria-pressed={mode === 'window'} className={mode === 'window' ? 'is-on' : ''} onClick={() => setMode('window')}>Selected period</button>
          </div>
          {mode === 'window' && (
            <label className="span-select small">Period{' '}
              <select value={SPANS.includes(span) ? span : ''} onChange={(e) => setSpan(Number(e.target.value))}>
                {!SPANS.includes(span) && <option value="">{span} years</option>}
                {SPANS.map((s) => <option key={s} value={s}>{s.toLocaleString('en-GB')} years</option>)}
              </select>
            </label>
          )}
          <p className="rate small muted" aria-live="polite">
            {playMode === 'time'
              ? `About ${rateLabel}${scale === COMPRESSED ? ` in band ${segIdx + 1} of 6` : ''}`
              : `One milestone every ${(EVENT_MS / speed / 1000).toFixed(1)} s`}
          </p>
          <button className="btn btn-primary start-btn" onClick={startFromBeginning} aria-label="Start from the beginning"><span className="start-long">Start from the beginning</span><span className="start-short" aria-hidden="true">From the start</span></button>
        </div>

        <div className="eras" role="group" aria-label="Timeline range">
          <button className={`chip ${zoom === 'compressed' ? 'is-on' : ''}`} aria-pressed={zoom === 'compressed'} onClick={() => setZoom('compressed')}>All history, compressed</button>
          <button className={`chip ${zoom === 'linear' ? 'is-on' : ''}`} aria-pressed={zoom === 'linear'} onClick={() => setZoom('linear')}>All history, even scale</button>
          <span className="eras-sep" aria-hidden="true" />
          {ERAS.map((e) => (
            <button key={e.id} className={`chip ${zoom === e.id ? 'is-on' : ''}`} aria-pressed={zoom === e.id} onClick={() => {
              setZoom(e.id);
              const a0 = toAstro(e.start), a1 = toAstro(e.end);
              if (year < a0 || year >= a1) setYear(a0 + 0.5);
            }}>{e.label}</button>
          ))}
        </div>

        <Timeline
          scale={scale}
          compressed={scale === COMPRESSED}
          year={year}
          mode={mode}
          span={span}
          items={filtered}
          vis={vis}
          selectedId={selected}
          currentId={currentId}
          onScrub={(y) => { setPlaying(false); setIntro(false); setYear(Math.min(scale.domain[1] - 0.001, Math.max(scale.domain[0], y))); }}
          onSpan={setSpan}
          onSelect={(id) => select(id)}
          playheadLabel={playheadLabel}
        />
        <p className="scale-note small muted">
          {scale === COMPRESSED
            ? 'Not to scale: the six bands cover very different lengths of time (labelled above each band). Choose “All history, even scale” to compare.'
            : scale === LINEAR
              ? 'Even scale: equal distances are equal lengths of time. Recent centuries are compressed into the right-hand edge.'
              : 'Even scale within the selected period.'}
        </p>
      </section>

      {shareFallback && (
        <div className="share-dialog" role="dialog" aria-labelledby="share-title">
          <h2 id="share-title">Share this view</h2>
          {inFrame
            ? <p>This page is shown inside another app, so use that app’s own share or copy-link button. The current view, including filters, year and open milestone, is stored in the page address.</p>
            : <p>Copy this link. It keeps the year, filters and the open milestone.</p>}
          <input readOnly value={shareFallback} onFocus={(e) => e.currentTarget.select()} aria-label="Link to this view" />
          <button className="btn" onClick={() => setShareFallback(null)}>Done</button>
        </div>
      )}
    </div>
  );
}
