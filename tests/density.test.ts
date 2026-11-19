import { describe, expect, it } from 'vitest';
import { geoEqualEarth } from 'd3-geo';
import { computeDensity, integrateGrid } from '../src/lib/density';
import { clusterPoints } from '../src/lib/cluster';
import type { Milestone } from '../src/types';

const loc = (lat: number, lon: number, radiusKm = 5) => ({ name: '', modern: '', lat, lon, radiusKm, precision: 'settlement', type: 'discovery-site' });
const ev = (id: string, locs: ReturnType<typeof loc>[]) => ({ id, locations: locs } as unknown as Milestone);

const W = 1600, H = 800;
const projection = geoEqualEarth().fitExtent([[0, 0], [W, H]], { type: 'Sphere' } as never);

describe('density surface', () => {
  it('gives every milestone a total weight of 1 (mass is conserved)', () => {
    const items = [ev('a', [loc(10, 20)]), ev('b', [loc(-5, 100)]), ev('c', [loc(40, -80, 300)])];
    const mass = integrateGrid(items, projection, W, H, 4);
    expect(mass).toBeGreaterThan(2.9);
    expect(mass).toBeLessThan(3.1);
  });
  it('does not let a multi-location milestone inflate density', () => {
    const one = integrateGrid([ev('a', [loc(10, 20)])], projection, W, H, 4);
    const three = integrateGrid([ev('m', [loc(10, 20), loc(30, 60), loc(-10, -60)])], projection, W, H, 4);
    expect(Math.abs(one - three)).toBeLessThan(0.05);
  });
  it('uses a fixed scale: totalWeight counts mapped milestones only', () => {
    const r = computeDensity([ev('a', [loc(10, 20)]), ev('u', [{ ...loc(0, 0), lat: null, lon: null } as never])], projection, W, H, 4);
    expect(r.totalWeight).toBe(1);
  });
});

describe('clustering', () => {
  it('merges overlapping points and counts distinct milestones once', () => {
    const pts = [
      { key: 'a:0', eventId: 'a', x: 100, y: 100 },
      { key: 'a:1', eventId: 'a', x: 105, y: 102 },
      { key: 'b:0', eventId: 'b', x: 110, y: 98 },
      { key: 'c:0', eventId: 'c', x: 400, y: 400 },
    ];
    const cs = clusterPoints(pts, 24);
    expect(cs).toHaveLength(2);
    const big = cs.find((c) => c.points.length === 3)!;
    expect(big.eventIds.sort()).toEqual(['a', 'b']);
  });
  it('leaves no two clusters closer than the radius', () => {
    const pts = Array.from({ length: 60 }, (_, i) => ({ key: `p${i}:0`, eventId: `p${i}`, x: (i * 37) % 300, y: (i * 53) % 200 }));
    const cs = clusterPoints(pts, 24);
    for (let i = 0; i < cs.length; i++)
      for (let j = i + 1; j < cs.length; j++)
        expect(Math.hypot(cs[i].x - cs[j].x, cs[i].y - cs[j].y)).toBeGreaterThanOrEqual(24);
    expect(cs.reduce((n, c) => n + c.points.length, 0)).toBe(60);
  });
});

import { heatPosition, heatRGBA, HEAT_STOPS } from '../src/lib/density';

describe('heat colour scale', () => {
  it('is fixed: the same density always maps to the same colour', () => {
    expect(heatPosition(0.125)).toBe(0);
    expect(heatPosition(16)).toBe(1);
    expect(heatPosition(1000)).toBe(1);
    expect(heatRGBA(0.05)[3]).toBe(0);
    expect(heatRGBA(2)).toEqual(heatRGBA(2));
  });
  it('gets darker as density rises (lightness is monotonic)', () => {
    const lum = (c: number[]) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    let prev = Infinity;
    for (let v = 0.13; v <= 16; v *= 1.15) {
      const L = lum(heatRGBA(v));
      expect(L).toBeLessThanOrEqual(prev + 1e-9);
      prev = L;
    }
    expect(HEAT_STOPS).toHaveLength(8);
  });
});
