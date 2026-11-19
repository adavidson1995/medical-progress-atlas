import { useEffect, useMemo, useRef, useState } from 'react';
import type { Milestone } from '../types';
import { eventRange, formatYear, fromAstro, tickStep, toAstro, type TimeScale, type Visibility } from '../lib/dates';
import { CAT } from '../lib/meta';

interface Props {
  scale: TimeScale;
  compressed: boolean;
  year: number;
  mode: 'cumulative' | 'window';
  span: number;
  items: Milestone[];
  vis: Map<string, Visibility>;
  selectedId: string | null;
  currentId: string | null;
  onScrub: (year: number) => void;
  onSpan: (span: number) => void;
  onSelect: (id: string) => void;
  playheadLabel: string;
}

const H = 104;
const TRACK_Y = 24;
const LANE_H = 7;
const LANES = 5;
const AXIS_Y = TRACK_Y + LANES * LANE_H + 6;
const nf = new Intl.NumberFormat('en-GB');
/** Band lengths: exact when round, otherwise "about" (3500 BCE–500 CE is 3,999 years because there is no year 0). */
function approxYears(y: number): string {
  if (y < 1000 || y % 100 === 0) return `${nf.format(y)} years`;
  return `about ${nf.format(Math.round(y / 100) * 100)} years`;
}

export function Timeline(p: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(900);
  const [drag, setDrag] = useState<'playhead' | 'span' | null>(null);
  const pad = 12;

  useEffect(() => {
    const el = wrap.current!;
    const ro = new ResizeObserver(() => setW(Math.max(280, el.getBoundingClientRect().width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const inner = w - pad * 2;
  const x = (a: number) => pad + p.scale.pos(Math.min(Math.max(a, p.scale.domain[0]), p.scale.domain[1])) * inner;
  const yearAt = (px: number) => p.scale.inv(Math.min(1, Math.max(0, (px - pad) / inner)));

  // segments with tick marks
  const segs = useMemo(() => {
    return p.scale.segments.map((s, i) => {
      const x0 = pad + s.p0 * inner, x1 = pad + s.p1 * inner;
      const yearsPerPx = (s.a1 - s.a0) / Math.max(1, x1 - x0);
      const minor = tickStep(yearsPerPx, 7);
      const major = tickStep(yearsPerPx, 64);
      const ticks: { x: number; y: number; major: boolean }[] = [];
      const h0 = fromAstro(s.a0), h1 = fromAstro(s.a1);
      for (let y = Math.ceil(h0 / minor) * minor; y <= h1; y += minor) {
        if (y === 0) continue;
        const a = toAstro(y);
        if (a < s.a0 || a > s.a1) continue;
        ticks.push({ x: x0 + ((a - s.a0) / (s.a1 - s.a0)) * (x1 - x0), y, major: y % major === 0 });
      }
      return { i, x0, x1, years: s.a1 - s.a0, h0, h1, ticks, minor };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.scale, inner]);

  // event marks, packed into lanes
  const marks = useMemo(() => {
    const laneEnd = new Array(LANES).fill(-Infinity);
    return p.items.map((m) => {
      const [s, e] = eventRange(m);
      const xs = x(s);
      const xe = Math.max(xs + 2, x(e));
      let lane = laneEnd.findIndex((end) => xs > end + 2);
      if (lane < 0) lane = laneEnd.indexOf(Math.min(...laneEnd));
      laneEnd[lane] = xe;
      return { m, xs, xe, lane, range: e - s > 1 };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.items, p.scale, inner]);

  const px = x(p.year);
  const wx = p.mode === 'window' ? x(p.year - p.span) : px;

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const target = e.target as Element;
    if (target.closest('.tl-mark')) return;
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const nearSpan = p.mode === 'window' && Math.abs(mx - wx) < 10 && Math.abs(mx - px) > 10;
    setDrag(nearSpan ? 'span' : 'playhead');
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    if (!nearSpan) p.onScrub(yearAt(mx));
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag) return;
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    if (drag === 'playhead') p.onScrub(yearAt(mx));
    else p.onSpan(Math.max(1, Math.round(p.year - yearAt(Math.min(mx, px - 4)))));
  };
  const onKey = (e: React.KeyboardEvent) => {
    // Step in screen space, so a key press moves a similar distance in every band of a compressed scale:
    // 3 px per press, 24 px with Shift, and never less than one year.
    const move = (dir: 1 | -1) => {
      const dp = ((e.shiftKey ? 24 : 3) / inner) * dir;
      const target = p.scale.inv(Math.min(1, Math.max(0, p.scale.pos(p.year) + dp)));
      const y = Math.abs(target - p.year) < 1 ? p.year + dir : target;
      p.onScrub(Math.min(p.scale.domain[1] - 0.01, Math.max(p.scale.domain[0], y)));
      e.preventDefault();
    };
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') move(1);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') move(-1);
    if (e.key === 'Home') { p.onScrub(p.scale.domain[0]); e.preventDefault(); }
    if (e.key === 'End') { p.onScrub(p.scale.domain[1] - 0.01); e.preventDefault(); }
  };

  return (
    <div className="timeline" ref={wrap}>
      <svg
        width={w}
        height={H}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => setDrag(null)}
        onPointerCancel={() => setDrag(null)}
        className={drag ? 'is-dragging' : ''}
      >
        {segs.map((s) => (
          <g key={s.i}>
            <rect x={s.x0} y={TRACK_Y - 4} width={s.x1 - s.x0} height={AXIS_Y - TRACK_Y + 4} className={`tl-seg ${s.i % 2 ? 'tl-seg-alt' : ''}`} />
            {p.compressed && segLabel(s.years, s.minor, s.x1 - s.x0) && (
              <text x={s.x0 + 4} y={12} className="tl-seg-label">
                {segLabel(s.years, s.minor, s.x1 - s.x0)}
              </text>
            )}
            {s.ticks.map((t) => (
              <line key={t.y} x1={t.x} x2={t.x} y1={AXIS_Y} y2={AXIS_Y + (t.major ? 7 : 3.5)} className={t.major ? 'tl-tick-major' : 'tl-tick'} />
            ))}
            {(() => {
              const out: JSX.Element[] = [];
              let lastX = -Infinity;
              for (const t of s.ticks) {
                if (!t.major) continue;
                const label = formatYear(t.y);
                const half = label.length * 3.4;
                if (t.x - half < s.x0 + 2 || t.x + half > s.x1 - 2 || t.x - half < lastX + 10) continue;
                lastX = t.x + half;
                out.push(<text key={`l${t.y}`} x={t.x} y={AXIS_Y + 19} className="tl-tick-label" textAnchor="middle">{label}</text>);
              }
              return out;
            })()}
            {p.compressed && s.i > 0 && <line x1={s.x0} x2={s.x0} y1={4} y2={AXIS_Y + 8} className="tl-break" />}
          </g>
        ))}
        <line x1={pad} x2={w - pad} y1={AXIS_Y} y2={AXIS_Y} className="tl-axis" />

        {p.mode === 'window' && (
          <g>
            <rect x={Math.min(wx, px)} y={TRACK_Y - 6} width={Math.max(2, px - wx)} height={AXIS_Y - TRACK_Y + 6} className="tl-window" />
            <line x1={wx} x2={wx} y1={TRACK_Y - 8} y2={AXIS_Y + 4} className="tl-window-edge" />
            <rect x={wx - 4} y={TRACK_Y + 6} width={8} height={18} rx={3} className="tl-window-handle" aria-hidden="true" />
          </g>
        )}

        <g>
          {marks.map(({ m, xs, xe, lane, range }) => {
            const v = p.vis.get(m.id) ?? 'hidden';
            const y = TRACK_Y + lane * LANE_H;
            const col = CAT[m.category].color;
            const cls = `tl-mark ${v === 'hidden' ? 'is-future' : ''} ${m.id === p.selectedId ? 'is-selected' : ''} ${m.id === p.currentId ? 'is-current' : ''}`;
            return (
              <g key={m.id} className={cls} onClick={() => p.onSelect(m.id)}>
                <title>{`${m.title} (${m.date.display})`}</title>
                <rect x={xs - 3} y={y - 1} width={Math.max(6, xe - xs + 6)} height={LANE_H + 2} className="tl-hit" />
                {range ? (
                  <>
                    <rect x={xs} y={y + 1.5} width={Math.max(2, xe - xs)} height={LANE_H - 3} rx={2} style={{ fill: col }} className={`tl-range ${m.date.approximate ? 'tl-approx' : ''}`} />
                    <rect x={xs - 1} y={y} width={2.5} height={LANE_H} style={{ fill: col }} />
                  </>
                ) : (
                  <rect x={xs - 1.5} y={y} width={3} height={LANE_H} rx={1} style={{ fill: col }} />
                )}
              </g>
            );
          })}
        </g>

        <g className="tl-playhead" transform={`translate(${px},0)`}>
          <line y1={TRACK_Y - 10} y2={AXIS_Y + 8} />
          <circle cy={TRACK_Y - 10} r={5} />
        </g>
      </svg>
      <div
        className="tl-slider"
        role="slider"
        tabIndex={0}
        aria-label="Timeline position"
        aria-valuemin={p.scale.domain[0]}
        aria-valuemax={p.scale.domain[1]}
        aria-valuenow={Math.floor(p.year)}
        aria-valuetext={p.playheadLabel}
        onKeyDown={onKey}
        style={{ left: px - 14 }}
      />
    </div>
  );
}

/** Band label that fits its band: full, then shorter, then nothing. ~6.4px per character at 11.5px. */
function segLabel(years: number, minor: number, width: number): string {
  const fits = (t: string) => t.length * 6.4 + 10 <= width;
  const full = `${approxYears(years)}, ticks every ${nf.format(minor)}`;
  if (fits(full)) return full;
  const short = approxYears(years);
  return fits(short) ? short : '';
}
