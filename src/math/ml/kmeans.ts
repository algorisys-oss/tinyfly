import type { Vec2 } from '../linear/vec2'

const distance2 = (a: Vec2, b: Vec2) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2

/** The centroid each point is nearest to (ties go to the lower index). */
export function assign(points: Vec2[], centroids: Vec2[]): number[] {
  return points.map((p) => {
    let best = 0
    for (let k = 1; k < centroids.length; k++) if (distance2(p, centroids[k]) < distance2(p, centroids[best])) best = k
    return best
  })
}

/**
 * Lloyd's algorithm from `start` (default the first `k` points), so it is
 * deterministic: the centroids after each iteration, the start first,
 * until they stop moving or `maxIterations` is reached.
 */
export function kmeansHistory(points: Vec2[], k: number, maxIterations = 20, start: Vec2[] = points.slice(0, k)): Vec2[][] {
  const history: Vec2[][] = [start.map((p): Vec2 => [p[0], p[1]])]
  for (let it = 0; it < maxIterations; it++) {
    const centroids = history[history.length - 1]
    const owners = assign(points, centroids)
    const next = centroids.map((c, j): Vec2 => {
      const mine = points.filter((_, i) => owners[i] === j)
      if (mine.length === 0) return c
      return [mine.reduce((s, p) => s + p[0], 0) / mine.length, mine.reduce((s, p) => s + p[1], 0) / mine.length]
    })
    const moved = next.some((c, j) => distance2(c, centroids[j]) > 1e-12)
    history.push(next)
    if (!moved) break
  }
  return history
}

/** Sum of squared distances from each point to its centroid. */
export function inertia(points: Vec2[], centroids: Vec2[]): number {
  const owners = assign(points, centroids)
  return points.reduce((sum, p, i) => sum + distance2(p, centroids[owners[i]]), 0)
}
