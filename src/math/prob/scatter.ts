import { createRandom, hashSeed, randomNormal } from '../../engine/authoring/random'
import type { Vec2 } from '../linear/vec2'

export type PointsSpec =
  | { kind: 'uniform'; x: [number, number]; y: [number, number] }
  | { kind: 'linear'; slope: number; intercept: number; noise: number; x: [number, number] }

/**
 * `count` random points from a seed. Each point draws the same random numbers
 * whatever the parameters, so moving the slope or the noise moves every
 * point smoothly instead of reshuffling them.
 */
export function scatterPoints(spec: PointsSpec, seed: number | string, count: number): Vec2[] {
  const source = createRandom(typeof seed === 'number' ? seed : hashSeed(seed))
  return Array.from({ length: Math.max(0, Math.floor(count)) }, (): Vec2 => {
    const u = source.next()
    if (spec.kind === 'uniform') {
      const v = source.next()
      return [spec.x[0] + u * (spec.x[1] - spec.x[0]), spec.y[0] + v * (spec.y[1] - spec.y[0])]
    }
    const x = spec.x[0] + u * (spec.x[1] - spec.x[0])
    return [x, spec.slope * x + spec.intercept + spec.noise * randomNormal(source)]
  })
}

/** The least-squares line through points, and the correlation r. Undefined for fewer than two distinct x. */
export function leastSquares(points: Vec2[]): { slope: number; intercept: number; r: number } | undefined {
  const n = points.length
  if (n < 2) return undefined
  const mx = points.reduce((s, p) => s + p[0], 0) / n
  const my = points.reduce((s, p) => s + p[1], 0) / n
  let sxy = 0, sxx = 0, syy = 0
  for (const [x, y] of points) {
    sxy += (x - mx) * (y - my)
    sxx += (x - mx) ** 2
    syy += (y - my) ** 2
  }
  if (sxx === 0) return undefined
  const slope = sxy / sxx
  return { slope, intercept: my - slope * mx, r: syy === 0 ? 0 : sxy / Math.sqrt(sxx * syy) }
}
