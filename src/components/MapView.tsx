import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { geoEqualEarth, geoPath, geoGraticule, geoCircle, type GeoProjection, type GeoSphere } from 'd3-geo';
import 'd3-transition';
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import { select } from 'd3-selection';
import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Milestone } from '../types';
import type { Visibility } from '../lib/dates';
import { CAT } from '../lib/meta';
import { computeDensity, heatPixels } from '../lib/density';
import { clusterPoints, type Cluster, type ScreenPoint } from '../lib/cluster';
import { lifeColor, lifeSnapshot, type LifeData } from '../lib/lifeExpectancy';
import { fromAstro } from '../lib/dates';

export type MapViewMode = 'dots' | 'density' | 'both';

export interface MapHandle {
  zoomBy: (f: number) => void;
  reset: () => void;
  focus: (lon: number, lat: number, minK?: number) => void;
}

interface Props {
  items: Milestone[]; // filtered milestones
  vis: Map<string, Visibility>;
  pulses: Set<string>;
  selectedId: string | null;
  view: MapViewMode;
  borders: boolean;
  /** Life expectancy layer: data (null while loading or switched off) and the playhead year. */
  life: LifeData | null;
  year: number;
  onSelect: (id: string) => void;
  onClusterList: (ids: string[], x: number, y: number) => void;
}

const BASE = import.meta.env.BASE_URL;
/** Screen radius within which a click or hover on the heatmap gathers milestones. */
const HEAT_PICK_PX = 34;
/** Antarctica and the French Southern and Antarctic Lands have no permanent population, so no life expectancy. */
const NO_POPULATION = new Set(['010', '260']);
const MAX_K = 24;

type Geo = { land: GeoJSON.Feature | GeoJSON.FeatureCollection; borders: GeoJSON.MultiLineString; countries: GeoJSON.Feature[] };

function loadTopo(file: string): Promise<Geo> {
  return fetch(`${BASE}data/${file}`)
    .then((r) => r.json())
    .then((topo: Topology) => {
      const countries = topo.objects.countries as GeometryCollection;
      return {
        land: feature(topo, topo.objects.land) as GeoJSON.Feature,
        borders: mesh(topo, countries, (a, b) => a !== b) as GeoJSON.MultiLineString,
        countries: (feature(topo, countries) as unknown as GeoJSON.FeatureCollection).features,
      };
    });
}

export const MapView = forwardRef<MapHandle, Props>(function MapView(props, ref) {
  const { items, vis, pulses, selectedId, view, borders, life, year, onSelect, onClusterList } = props;
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [size, setSize] = useState({ w: 800, h: 450 });
  const [t, setT] = useState<ZoomTransform>(zoomIdentity);
  const [geo110, setGeo110] = useState<Geo | null>(null);
  const [geo50, setGeo50] = useState<Geo | null>(null);
  const [hover, setHover] = useState<{ id?: string; cluster?: Cluster; x: number; y: number } | null>(null);
  const [heatHover, setHeatHover] = useState<{ x: number; y: number; ids: string[] } | null>(null);
  const [geoError, setGeoError] = useState(false);

  // --- size
  useEffect(() => {
    const el = wrapRef.current!;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(280, Math.round(r.width)), h: Math.max(220, Math.round(r.height)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // --- basemap: coarse first, detailed when zoomed in
  useEffect(() => {
    loadTopo('countries-110m.json').then(setGeo110).catch(() => setGeoError(true));
  }, []);
  useEffect(() => {
    if (t.k > 2.2 && !geo50) loadTopo('countries-50m.json').then(setGeo50).catch(() => undefined);
  }, [t.k, geo50]);
  const geo = t.k > 2.2 && geo50 ? geo50 : geo110;

  // --- projection fitted to the container (base coordinates, before zoom)
  const projection: GeoProjection = useMemo(() => {
    const pad = 8;
    // On narrow screens the legends sit above the map, so leave room for them at the top.
    const top = size.w < 600 && size.h > 380 ? Math.min(150, size.h * 0.28) : pad;
    return geoEqualEarth().fitExtent(
      [[pad, top], [size.w - pad, size.h - pad]],
      { type: 'Sphere' } as GeoSphere,
    );
  }, [size.w, size.h]);
  const path = useMemo(() => geoPath(projection), [projection]);
  const spherePath = useMemo(() => path({ type: 'Sphere' } as never) ?? '', [path]);
  const graticulePath = useMemo(() => path(geoGraticule().step([30, 30])()) ?? '', [path]);
  const landPath = useMemo(() => (geo ? path(geo.land as never) ?? '' : ''), [geo, path]);
  const borderPath = useMemo(() => (geo ? path(geo.borders) ?? '' : ''), [geo, path]);
  const countryPaths = useMemo(
    () => (geo && life ? geo.countries.filter((f) => f.id != null && !NO_POPULATION.has(String(f.id))).map((f) => ({ id: String(f.id), name: String(f.properties?.name ?? ''), d: path(f) ?? '' })) : []),
    [geo, path, life],
  );
  const lifeYear = fromAstro(Math.floor(year));
  const lifeNow = useMemo(() => (life ? lifeSnapshot(life, lifeYear) : null), [life, lifeYear]);
  const [lifeHover, setLifeHover] = useState<{ id: string; name: string; x: number; y: number } | null>(null);

  // --- zoom behaviour
  useEffect(() => {
    const svg = select(svgRef.current!);
    const z = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, MAX_K])
      .translateExtent([[0, 0], [size.w, size.h]])
      .extent([[0, 0], [size.w, size.h]])
      .on('zoom', (e) => setT(e.transform));
    svg.call(z);
    svg.on('dblclick.zoom', null);
    zoomRef.current = z;
    return () => {
      svg.on('.zoom', null);
    };
  }, [size.w, size.h]);

  useImperativeHandle(ref, () => ({
    zoomBy(f) {
      const svg = select(svgRef.current!);
      zoomRef.current?.scaleBy(svg.transition().duration(reduceMotion() ? 0 : 300) as never, f);
    },
    reset() {
      const svg = select(svgRef.current!);
      zoomRef.current?.transform(svg.transition().duration(reduceMotion() ? 0 : 400) as never, zoomIdentity);
    },
    focus(lon, lat, minK = 1) {
      const p = projection([lon, lat]);
      if (!p) return;
      const [sx, sy] = t.apply(p);
      const margin = 60;
      const inView = sx > margin && sx < size.w - margin && sy > margin && sy < size.h - margin;
      if (inView && t.k >= minK) return;
      const k = Math.max(t.k, minK);
      const next = zoomIdentity.translate(size.w / 2 - p[0] * k, size.h / 2 - p[1] * k).scale(k);
      const svg = select(svgRef.current!);
      zoomRef.current?.transform(svg.transition().duration(reduceMotion() ? 0 : 700) as never, next);
    },
  }), [projection, t, size.w, size.h]);

  // --- data in base coordinates
  const visible = useMemo(() => items.filter((m) => (vis.get(m.id) ?? 'hidden') !== 'hidden'), [items, vis]);
  const visibleKey = visible.map((m) => m.id).join('|');

  const density = useMemo(() => {
    if (view === 'dots' || !visible.length) return null;
    return computeDensity(visible, projection, size.w, size.h, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleKey, projection, size.w, size.h, view]);

  // The heat surface is drawn once per change of the visible set, as an image of the grid
  // (one pixel per cell). The browser smooths it when scaling, and it moves with the zoom.
  const heatHref = useMemo(() => {
    if (!density || typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = density.nx;
    c.height = density.ny;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    const img = ctx.createImageData(density.nx, density.ny);
    img.data.set(heatPixels(density));
    ctx.putImageData(img, 0, 0);
    return c.toDataURL('image/png');
  }, [density]);
  const contourPaths = useMemo(() => {
    if (!density) return [];
    const p = geoPath();
    return density.contours.map((c) => ({ value: c.value, d: p(c) ?? '' }));
  }, [density]);

  // uncertainty areas (only for locations with a meaningful radius)
  const areas = useMemo(() => {
    if (view === 'density') return [];
    const out: { key: string; d: string; color: string; partial: boolean; id: string }[] = [];
    for (const m of visible) {
      m.locations.forEach((l, i) => {
        if (l.lat == null || l.lon == null || l.radiusKm < 20) return;
        const circle = geoCircle().center([l.lon, l.lat]).radius((l.radiusKm / 6371) * (180 / Math.PI)).precision(4)();
        out.push({ key: `${m.id}:${i}`, d: path(circle) ?? '', color: CAT[m.category].color, partial: vis.get(m.id) === 'partial', id: m.id });
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleKey, path, view, vis]);

  // links between locations of the selected / hovered multi-location milestone
  const linkId = hover?.id ?? selectedId;
  const linkPath = useMemo(() => {
    const m = items.find((x) => x.id === linkId);
    if (!m) return '';
    const pts = m.locations.filter((l) => l.lat != null).map((l) => [l.lon as number, l.lat as number]);
    if (pts.length < 2) return '';
    const lines = pts.slice(1).map((p) => [pts[0], p]);
    return path({ type: 'MultiLineString', coordinates: lines } as never) ?? '';
  }, [linkId, items, path]);

  // --- markers in screen coordinates
  const screenPts: ScreenPoint[] = useMemo(() => {
    const pts: ScreenPoint[] = [];
    for (const m of visible) {
      m.locations.forEach((l, i) => {
        if (l.lat == null || l.lon == null) return;
        const p = projection([l.lon, l.lat]);
        if (!p) return;
        const [x, y] = t.apply(p);
        if (x < -20 || y < -20 || x > size.w + 20 || y > size.h + 20) return;
        pts.push({ key: `${m.id}:${i}`, eventId: m.id, x, y });
      });
    }
    return pts;
  }, [visible, projection, t, size.w, size.h]);

  // The selected milestone is drawn on its own, above any clusters, so it is never hidden inside one.
  const clusters = useMemo(
    () => (view === 'density' ? [] : clusterPoints(screenPts.filter((p) => p.eventId !== selectedId), t.k >= MAX_K - 0.01 ? 4 : 24)),
    [screenPts, view, t.k, selectedId],
  );
  const selectedPts = useMemo(() => screenPts.filter((p) => p.eventId === selectedId), [screenPts, selectedId]);
  const byId = useMemo(() => new Map(items.map((m) => [m.id, m])), [items]);

  const onClusterClick = (c: Cluster) => {
    const xs = c.points.map((p) => p.x), ys = c.points.map((p) => p.y);
    const spread = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    if (spread < 6 || t.k >= MAX_K - 0.01) {
      onClusterList(c.eventIds, c.x, c.y);
      return;
    }
    // zoom so the cluster's members spread out
    const [bx0, by0] = t.invert([Math.min(...xs), Math.min(...ys)]);
    const [bx1, by1] = t.invert([Math.max(...xs), Math.max(...ys)]);
    const cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2;
    const k = Math.min(MAX_K, Math.max(t.k * 2, 0.5 * Math.min(size.w / Math.max(bx1 - bx0, 1), size.h / Math.max(by1 - by0, 1))));
    const next = zoomIdentity.translate(size.w / 2 - cx * k, size.h / 2 - cy * k).scale(k);
    const svg = select(svgRef.current!);
    zoomRef.current?.transform(svg.transition().duration(reduceMotion() ? 0 : 600) as never, next);
  };

  const gTransform = `translate(${t.x},${t.y}) scale(${t.k})`;
  const showDots = view !== 'density';

  // Heatmap view: hovering or clicking gathers the milestones within HEAT_PICK_PX of the pointer.
  const pickNear = (x: number, y: number) => {
    const ids: string[] = [];
    for (const p of screenPts) {
      if ((p.x - x) ** 2 + (p.y - y) ** 2 <= HEAT_PICK_PX ** 2 && !ids.includes(p.eventId)) ids.push(p.eventId);
    }
    return ids;
  };
  const localXY = (e: React.MouseEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onHeatMove = (e: React.MouseEvent) => {
    if ((e.target as Element).closest('.marker')) { setHeatHover(null); return; }
    const { x, y } = localXY(e);
    const ids = pickNear(x, y);
    setHeatHover(ids.length ? { x, y, ids } : null);
  };
  const onHeatClick = (e: React.MouseEvent) => {
    if ((e.target as Element).closest('.marker')) return;
    const { x, y } = localXY(e);
    const ids = pickNear(x, y);
    setHeatHover(null);
    if (ids.length === 1) onSelect(ids[0]);
    else if (ids.length > 1) onClusterList(ids, x, y);
  };
  const selected = selectedId ? byId.get(selectedId) : undefined;

  return (
    <div className="map-wrap" ref={wrapRef}>
      <svg
        ref={svgRef}
        className="map-svg"
        width={size.w}
        height={size.h}
        role="img"
        aria-label={`World map in an equal-area projection showing ${visible.length} milestones${showDots ? '' : ' as a heatmap'}. Use the milestone list or the previous and next buttons to move between them with the keyboard.`}
        onMouseMove={showDots ? undefined : onHeatMove}
        onMouseLeave={showDots ? undefined : () => setHeatHover(null)}
        onClick={showDots ? undefined : onHeatClick}
        style={!showDots && heatHover ? { cursor: 'pointer' } : undefined}
      >
        <defs>
          <pattern id="life-none" width={4} height={4} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={4} height={4} className="life-none-bg" />
            <line x1={0} y1={0} x2={0} y2={4} className="life-none-line" />
          </pattern>
          <clipPath id="sphere-clip">
            <path d={spherePath} transform={gTransform} />
          </clipPath>
        </defs>
        <g transform={gTransform}>
          <path d={spherePath} className="sphere" />
          <path d={graticulePath} className="graticule" />
          <path d={landPath} className="land" />
          {lifeNow && (
            <g className="life-layer">
              {countryPaths.map((c) => {
                const v = lifeNow.get(c.id);
                const enter = (e: React.MouseEvent) => { const r = svgRef.current!.getBoundingClientRect(); setLifeHover({ id: c.id, name: c.name, x: e.clientX - r.left, y: e.clientY - r.top }); };
                return (
                  <path
                    key={c.id}
                    d={c.d}
                    style={{ fill: v ? lifeColor(v.value) : 'url(#life-none)' }}
                    className={`life-country ${v ? '' : 'is-none'}`}
                    onMouseEnter={enter}
                    onMouseMove={enter}
                    onMouseLeave={() => setLifeHover(null)}
                  />
                );
              })}
            </g>
          )}
          {borders && <path d={borderPath} className="borders" />}
          <path d={spherePath} className="sphere-edge" />
        </g>
        {density && heatHref && (
          <g transform={gTransform} clipPath="url(#sphere-clip)" className={`density ${view === 'both' || lifeNow ? 'density-faint' : ''}`}>
            <g transform={`scale(${density.cell})`}>
              <image href={heatHref} x={0} y={0} width={density.nx} height={density.ny} preserveAspectRatio="none" className="heat-image" />
              {contourPaths.map((c) => (
                <path key={c.value} d={c.d} className="contour" />
              ))}
            </g>
          </g>
        )}
        {!showDots && (
          <g className="markers heat-marks" aria-hidden="true">
            {screenPts.filter((p) => pulses.has(p.eventId)).map((p) => (
              <g key={`pulse-${p.key}`} transform={`translate(${p.x},${p.y})`}>
                <circle r={9} className="pulse-ring pulse-ink" />
                <circle r={2.5} className="heat-dot" />
              </g>
            ))}
            {heatHover && (
              <circle cx={heatHover.x} cy={heatHover.y} r={HEAT_PICK_PX} className="heat-pick" />
            )}
          </g>
        )}
        {!showDots && selected && (
          <g className="markers">
            {selectedPts.map((p) => (
              <Marker
                key={p.key}
                m={selected}
                x={p.x}
                y={p.y}
                status={vis.get(selected.id) ?? 'full'}
                pulse={pulses.has(selected.id)}
                selected
                onClick={() => onSelect(selected.id)}
                onEnter={() => setHover({ id: selected.id, x: p.x, y: p.y })}
                onLeave={() => setHover(null)}
              />
            ))}
          </g>
        )}
        {showDots && (
          <g transform={gTransform}>
            {areas.map((a) => (
              <path
                key={a.key}
                d={a.d}
                className={`uncertainty ${a.id === selectedId ? 'is-selected' : ''}`}
                style={{ fill: a.color, stroke: a.color }}
              />
            ))}
            {linkPath && <path d={linkPath} className="link" />}
          </g>
        )}
        {showDots && (
          <g className="markers">
            {clusters.map((c) => {
              if (c.eventIds.length === 1) {
                const m = byId.get(c.eventIds[0])!;
                return c.points.map((p) => (
                  <Marker
                    key={p.key}
                    m={m}
                    x={p.x}
                    y={p.y}
                    status={vis.get(m.id) ?? 'full'}
                    pulse={pulses.has(m.id)}
                    selected={m.id === selectedId}
                    onClick={() => onSelect(m.id)}
                    onEnter={() => setHover({ id: m.id, x: p.x, y: p.y })}
                    onLeave={() => setHover(null)}
                  />
                ));
              }
              return (
                <ClusterMark
                  key={c.points[0].key + c.eventIds.length}
                  c={c}
                  colors={c.eventIds.map((id) => CAT[byId.get(id)!.category].color)}
                  pulse={c.eventIds.some((id) => pulses.has(id))}
                  selected={!!selectedId && c.eventIds.includes(selectedId)}
                  onClick={() => onClusterClick(c)}
                  onEnter={() => setHover({ cluster: c, x: c.x, y: c.y })}
                  onLeave={() => setHover(null)}
                />
              );
            })}
            {selected && selectedPts.map((p) => (
              <Marker
                key={p.key}
                m={selected}
                x={p.x}
                y={p.y}
                status={vis.get(selected.id) ?? 'full'}
                pulse={pulses.has(selected.id)}
                selected
                onClick={() => onSelect(selected.id)}
                onEnter={() => setHover({ id: selected.id, x: p.x, y: p.y })}
                onLeave={() => setHover(null)}
              />
            ))}
          </g>
        )}
        {selected && <SelectedLabel m={selected} projection={projection} t={t} w={size.w} />}
      </svg>

      {!hover && !heatHover && lifeHover && lifeNow && !lifeNow.get(lifeHover.id) && (
        <div className="map-tooltip" style={{ left: Math.min(lifeHover.x + 14, size.w - 260), top: Math.max(lifeHover.y - 12, 8) }} role="tooltip">
          <strong>{lifeHover.name}</strong>
          <span className="tt-sub">No life expectancy estimate for {lifeYear < 0 ? `${-lifeYear} BCE` : lifeYear}</span>
        </div>
      )}
      {!hover && !heatHover && lifeHover && lifeNow?.get(lifeHover.id) && (
        <div className="map-tooltip" style={{ left: Math.min(lifeHover.x + 14, size.w - 260), top: Math.max(lifeHover.y - 12, 8) }} role="tooltip">
          <strong>{lifeHover.name}</strong>
          <span className="tt-sub">
            Life expectancy at birth: {lifeNow.get(lifeHover.id)!.value.toFixed(1)} years
            {lifeNow.get(lifeHover.id)!.year !== lifeYear ? ` (latest estimate: ${lifeNow.get(lifeHover.id)!.year})` : ` (${lifeYear})`}
          </span>
        </div>
      )}
      {!hover && heatHover && (
        <div className="map-tooltip" style={{ left: Math.min(heatHover.x + 14, size.w - 260), top: Math.max(heatHover.y - 12, 8) }} role="tooltip">
          <strong>{heatHover.ids.length} milestone{heatHover.ids.length === 1 ? '' : 's'} here</strong>
          <span className="tt-sub">Click to list {heatHover.ids.length === 1 ? 'it' : 'them'}</span>
        </div>
      )}
      {hover && (
        <div className="map-tooltip" style={{ left: Math.min(hover.x + 14, size.w - 260), top: Math.max(hover.y - 12, 8) }} role="tooltip">
          {hover.id ? <TooltipBody m={byId.get(hover.id)!} status={vis.get(hover.id)} /> : (
            <>
              <strong>{hover.cluster!.eventIds.length} milestones</strong>
              <span className="tt-sub">{t.k >= MAX_K - 0.01 ? 'Click to list them' : 'Click to zoom in'}</span>
            </>
          )}
        </div>
      )}
      {geoError && <p className="map-error">The basemap could not be loaded. Milestones are still listed in the side panel.</p>}
    </div>
  );
});

function reduceMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function Marker(p: {
  m: Milestone; x: number; y: number; status: Visibility; pulse: boolean; selected: boolean;
  onClick: () => void; onEnter: () => void; onLeave: () => void;
}) {
  const color = CAT[p.m.category].color;
  const approx = p.m.date.approximate;
  const hollow = p.status === 'partial';
  return (
    <g
      className={`marker ${p.selected ? 'is-selected' : ''}`}
      data-cat={p.m.category}
      transform={`translate(${p.x},${p.y})`}
      onClick={(e) => { e.stopPropagation(); p.onClick(); }}
      onMouseEnter={p.onEnter}
      onMouseLeave={p.onLeave}
    >
      {p.pulse && <circle r={7} className="pulse-ring" style={{ stroke: color }} />}
      <circle r={13} className="hit" />
      {approx && <circle r={9.5} className="approx-ring" style={{ stroke: color }} />}
      <circle r={p.selected ? 7.5 : 6} className={`dot ${hollow ? 'dot-hollow' : ''}`} style={hollow ? { stroke: color } : { fill: color }} />
    </g>
  );
}

function ClusterMark(p: { c: Cluster; colors: string[]; pulse: boolean; selected: boolean; onClick: () => void; onEnter: () => void; onLeave: () => void }) {
  const n = p.c.eventIds.length;
  const r = 11 + Math.min(9, Math.sqrt(n) * 2.2);
  // ring of category colours, one segment per milestone
  const segs = p.colors.map((col, i) => {
    const a0 = (i / n) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
    const R = r + 3;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const d = `M${R * Math.cos(a0)},${R * Math.sin(a0)} A${R},${R} 0 ${large} 1 ${R * Math.cos(a1)},${R * Math.sin(a1)}`;
    return <path key={i} d={d} style={{ stroke: col }} className="cluster-seg" />;
  });
  return (
    <g
      className={`cluster ${p.selected ? 'is-selected' : ''}`}
      transform={`translate(${p.c.x},${p.c.y})`}
      onClick={(e) => { e.stopPropagation(); p.onClick(); }}
      onMouseEnter={p.onEnter}
      onMouseLeave={p.onLeave}
    >
      {p.pulse && <circle r={r} className="pulse-ring pulse-ink" />}
      {segs}
      <circle r={r} className="cluster-body" />
      <text className="cluster-count" dy="0.35em">{n}</text>
    </g>
  );
}

function TooltipBody({ m, status }: { m: Milestone; status?: Visibility }) {
  const place = m.locations.filter((l) => l.lat != null).map((l) => l.name).join(' · ');
  return (
    <>
      <span className="tt-cat"><i style={{ background: CAT[m.category].color }} />{CAT[m.category].label}</span>
      <strong>{m.title}</strong>
      <span className="tt-sub">{m.date.display}{status === 'partial' ? ' — within its date range' : ''}</span>
      <span className="tt-sub">{place}</span>
    </>
  );
}

function SelectedLabel({ m, projection, t, w }: { m: Milestone; projection: GeoProjection; t: ZoomTransform; w: number }) {
  const l = m.locations.find((x) => x.lat != null);
  if (!l) return null;
  const p = projection([l.lon as number, l.lat as number]);
  if (!p) return null;
  const [x, y] = t.apply(p);
  // Put the label on whichever side has more room, and shorten it to fit (≈7.4px per character).
  // The map tools occupy the top-right corner (about 265 × 235 px), so treat that as no room.
  const toolsEdge = y < 235 ? w - 270 : w;
  const roomRight = toolsEdge - x - 22;
  const roomLeft = x - 22;
  const wantChars = Math.min(44, m.title.length);
  const left = roomRight < wantChars * 7.4 && roomLeft > roomRight;
  const maxChars = Math.max(8, Math.min(44, Math.floor((left ? roomLeft : roomRight) / 7.4)));
  const text = m.title.length > maxChars ? m.title.slice(0, maxChars - 1).trimEnd() + '…' : m.title;
  return (
    <g className="sel-label" transform={`translate(${x + (left ? -14 : 14)},${y - 14})`}>
      <text textAnchor={left ? 'end' : 'start'} className="sel-label-halo">{text}</text>
      <text textAnchor={left ? 'end' : 'start'}>{text}</text>
    </g>
  );
}
