export interface ScreenPoint {
  key: string; // eventId:locationIndex
  eventId: string;
  x: number;
  y: number;
}

export interface Cluster {
  x: number;
  y: number;
  points: ScreenPoint[];
  /** Distinct milestones in the cluster (multi-location events count once). */
  eventIds: string[];
}

/**
 * Greedy screen-space clustering. Deterministic for a given input order.
 * Points closer than `radius` pixels to an existing cluster centre join it.
 */
export function clusterPoints(points: ScreenPoint[], radius: number): Cluster[] {
  const out: Cluster[] = [];
  const r2 = radius * radius;
  for (const p of points) {
    let best: Cluster | null = null;
    let bestD = r2;
    for (const c of out) {
      const d = (c.x - p.x) ** 2 + (c.y - p.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    if (best) {
      best.points.push(p);
      const n = best.points.length;
      best.x += (p.x - best.x) / n;
      best.y += (p.y - best.y) / n;
      if (!best.eventIds.includes(p.eventId)) best.eventIds.push(p.eventId);
    } else {
      out.push({ x: p.x, y: p.y, points: [p], eventIds: [p.eventId] });
    }
  }
  // Centroids drift as points join, so merge any clusters that ended up overlapping.
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i], b = out[j];
        if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 < r2) {
          const n = a.points.length + b.points.length;
          a.x = (a.x * a.points.length + b.x * b.points.length) / n;
          a.y = (a.y * a.points.length + b.y * b.points.length) / n;
          a.points.push(...b.points);
          for (const id of b.eventIds) if (!a.eventIds.includes(id)) a.eventIds.push(id);
          out.splice(j, 1);
          merged = true;
          break outer;
        }
      }
    }
  }
  return out;
}
