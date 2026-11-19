import { contours as d3contours, type ContourMultiPolygon } from 'd3-contour';
import type { GeoProjection } from 'd3-geo';
import type { Milestone } from '../types';

/** Smoothing bandwidth (standard deviation of the Gaussian kernel), in km. */
export const KERNEL_KM = 500;

/**
 * Fixed levels in milestones per million km², used for the faint contour lines and
 * the legend ticks. They never rescale during playback or filtering, so the same
 * colour always means the same density. Each level doubles the previous one.
 */
export const THRESHOLDS = [0.25, 0.5, 1, 2, 4, 8, 16];

export interface DensityResult {
  contours: ContourMultiPolygon[];
  grid: Float64Array;
  nx: number;
  ny: number;
  cell: number;
  peak: number;
  totalWeight: number;
}

/**
 * Heat colour ramp on a fixed logarithmic scale (ColorBrewer YlOrRd, 8 classes).
 * Each stop is a density in milestones per million km²; each doubles the last.
 * Lightness falls steadily from the first stop to the last, so order is readable
 * without relying on hue. Below the first stop the surface is fully transparent.
 */
export const HEAT_STOPS: { value: number; color: string }[] = [
  { value: 0.125, color: '#ffffcc' },
  { value: 0.25, color: '#ffeda0' },
  { value: 0.5, color: '#fed976' },
  { value: 1, color: '#feb24c' },
  { value: 2, color: '#fd8d3c' },
  { value: 4, color: '#fc4e2a' },
  { value: 8, color: '#e31a1c' },
  { value: 16, color: '#b10026' },
];

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const STOP_RGB = HEAT_STOPS.map((s) => hex(s.color));
const LOG_MIN = Math.log2(HEAT_STOPS[0].value);
const LOG_MAX = Math.log2(HEAT_STOPS[HEAT_STOPS.length - 1].value);

/** Position of a density value on the fixed heat scale, 0 (first stop or below) to 1 (last stop or above). */
export function heatPosition(v: number): number {
  if (!(v > 0)) return 0;
  return Math.min(1, Math.max(0, (Math.log2(v) - LOG_MIN) / (LOG_MAX - LOG_MIN)));
}

/** RGBA for a density value. Opacity rises over the lowest three steps, then holds. */
export function heatRGBA(v: number): [number, number, number, number] {
  const t = heatPosition(v);
  if (t <= 0) return [0, 0, 0, 0];
  const x = t * (STOP_RGB.length - 1);
  const i = Math.min(STOP_RGB.length - 2, Math.floor(x));
  const f = x - i;
  const a = STOP_RGB[i], b = STOP_RGB[i + 1];
  const ramp = Math.min(1, t / (3 / 7));
  const alpha = 0.88 * ramp * ramp * (3 - 2 * ramp); // smoothstep
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, Math.round(alpha * 255)];
}

/** Pixel data (one pixel per grid cell) for drawing the heat surface. */
export function heatPixels(r: DensityResult): Uint8ClampedArray {
  const out = new Uint8ClampedArray(r.nx * r.ny * 4);
  for (let k = 0; k < r.grid.length; k++) {
    const c = heatRGBA(r.grid[k]);
    out[k * 4] = c[0]; out[k * 4 + 1] = c[1]; out[k * 4 + 2] = c[2]; out[k * 4 + 3] = c[3];
  }
  return out;
}

/**
 * Kernel density of milestones, computed in the (equal-area) projected plane.
 *
 * - Every milestone has total weight 1. A milestone with n mapped locations
 *   contributes 1/n at each, so multi-location events do not inflate density.
 * - Locations with a large uncertainty radius are spread more widely:
 *   sigma = sqrt(KERNEL_KM² + (radiusKm/2)²), which preserves the weight.
 * - Values are milestones per million km². Because Equal Earth is an equal-area
 *   projection, projected area is proportional to true area everywhere.
 */
export function computeDensity(
  items: Milestone[],
  projection: GeoProjection,
  width: number,
  height: number,
  cell = 3,
): DensityResult {
  const kmPerUnit = 6371 / projection.scale();
  const nx = Math.max(2, Math.ceil(width / cell));
  const ny = Math.max(2, Math.ceil(height / cell));
  const grid = new Float64Array(nx * ny);
  let totalWeight = 0;

  for (const m of items) {
    const locs = m.locations.filter((l) => l.lat != null && l.lon != null);
    if (!locs.length) continue;
    const w = 1 / locs.length;
    totalWeight += 1;
    for (const l of locs) {
      const xy = projection([l.lon as number, l.lat as number]);
      if (!xy) continue;
      const sigmaKm = Math.sqrt(KERNEL_KM ** 2 + (l.radiusKm / 2) ** 2);
      const sigmaCells = sigmaKm / kmPerUnit / cell;
      const peak = (w / (2 * Math.PI * sigmaKm * sigmaKm)) * 1e6;
      const cx = xy[0] / cell;
      const cy = xy[1] / cell;
      const R = Math.ceil(3 * sigmaCells);
      const two = 2 * sigmaCells * sigmaCells;
      const i0 = Math.max(0, Math.floor(cx - R)), i1 = Math.min(nx - 1, Math.ceil(cx + R));
      const j0 = Math.max(0, Math.floor(cy - R)), j1 = Math.min(ny - 1, Math.ceil(cy + R));
      for (let j = j0; j <= j1; j++) {
        const dy = j + 0.5 - cy;
        for (let i = i0; i <= i1; i++) {
          const dx = i + 0.5 - cx;
          grid[j * nx + i] += peak * Math.exp(-(dx * dx + dy * dy) / two);
        }
      }
    }
  }
  let peak = 0;
  for (let k = 0; k < grid.length; k++) if (grid[k] > peak) peak = grid[k];
  const cs = d3contours().size([nx, ny]).thresholds(THRESHOLDS)(Array.from(grid));
  return { contours: cs.filter((c) => c.coordinates.length > 0), grid, nx, ny, cell, peak, totalWeight };
}

/** Numerically integrate the grid (used by tests to check weight is conserved). */
export function integrateGrid(
  items: Milestone[],
  projection: GeoProjection,
  width: number,
  height: number,
  cell = 3,
): number {
  const kmPerUnit = 6371 / projection.scale();
  const nx = Math.ceil(width / cell), ny = Math.ceil(height / cell);
  const cellAreaKm2 = (cell * kmPerUnit) ** 2;
  let sum = 0;
  for (const m of items) {
    const locs = m.locations.filter((l) => l.lat != null);
    const w = 1 / locs.length;
    for (const l of locs) {
      const xy = projection([l.lon as number, l.lat as number])!;
      const sigmaKm = Math.sqrt(KERNEL_KM ** 2 + (l.radiusKm / 2) ** 2);
      const sc = sigmaKm / kmPerUnit / cell;
      const peak = (w / (2 * Math.PI * sigmaKm * sigmaKm)) * 1e6;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const dx = i + 0.5 - xy[0] / cell, dy = j + 0.5 - xy[1] / cell;
        sum += peak * Math.exp(-(dx * dx + dy * dy) / (2 * sc * sc)) * cellAreaKm2 / 1e6;
      }
    }
  }
  return sum;
}
