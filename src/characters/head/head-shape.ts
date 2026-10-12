import type { Point } from '../../adapters/canvas/sketch'
import { headPoint, type SolvedHead } from '../rig/skeleton'
import type { FaceOptions } from './face'

/** Project a tapered 3D head, then take its silhouette: the jaw follows turn, nod and roll. */
export function angularHeadOutline(head: SolvedHead, face: FaceOptions): Point[] {
  const jaw = Math.min(0.95, Math.max(0.55, face.jawWidth ?? 0.74))
  const chin = Math.min(0.35, Math.max(0.03, face.chinWidth ?? 0.14))
  const rings: Array<[number, number]> = [[-1, 0], [-0.92, chin], [-0.5, jaw], [-0.12, Math.sqrt(1 - 0.12 ** 2)]]
  for (let i = 0; i <= 12; i++) {
    const angle = i * Math.PI / 24
    rings.push([Math.sin(angle), Math.cos(angle)])
  }
  const points: Point[] = []
  for (const [y, radius] of rings) {
    for (let i = 0; i < 40; i++) {
      const angle = i * Math.PI / 20
      points.push(headPoint(head, [radius * Math.cos(angle), y, radius * Math.sin(angle)]).point)
    }
  }
  let outline = convexHull(points)
  const roundness = Math.min(1, Math.max(0, face.jawRoundness ?? 0))
  if (roundness === 0) return outline
  // Corner cutting keeps the silhouette convex and inside the original head.
  // Dense crown edges barely move; the longer cheek/chin edges soften visibly.
  const weight = roundness * 0.25
  for (let pass = 0; pass < 3; pass++) {
    outline = outline.flatMap((point, i) => {
      const next = outline[(i + 1) % outline.length]
      return [
        { x: point.x + (next.x - point.x) * weight, y: point.y + (next.y - point.y) * weight },
        { x: next.x + (point.x - next.x) * weight, y: next.y + (point.y - next.y) * weight },
      ]
    })
  }
  return outline
}

/** Monotone chain. Dropping interior points preserves sharp jaw corners at any view. */
export function convexHull(points: Point[]): Point[] {
  const sorted = points.sort((a, b) => a.x - b.x || a.y - b.y)
  const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
  const half = (list: Point[]) => {
    const result: Point[] = []
    for (const p of list) {
      while (result.length >= 2 && cross(result[result.length - 2], result[result.length - 1], p) <= 0) result.pop()
      result.push(p)
    }
    return result.slice(0, -1)
  }
  return [...half(sorted), ...half([...sorted].reverse())]
}
