import type { Point } from '../../adapters/canvas/sketch'
import { headPoint, type SolvedHead } from '../rig/skeleton'
import type { FaceOptions } from './face'
import { ellipsePoints } from '../look/pen'

/** A bridge, forward tip and lower return anchored above the mouth. */
export function nosePoints(head: SolvedHead): Point[] {
  return [[.01, -.12, .8], [0, -.25, .98], [-.04, -.31, .8]].map(p => headPoint(head, p as [number, number, number]).point)
}

/** Filled cartoon heads have a small forward nose in their turned silhouette. */
export function headOutline(head: SolvedHead, face: FaceOptions): Point[] {
  const outline = face.shape === 'angular' ? angularHeadOutline(head, face)
    : face.projection === 'volume' ? roundVolumeOutline(head)
    : ellipsePoints(head.center.x, head.center.y, head.rx, head.ry, head.angle)
  if (face.projection !== 'volume' || !face.nose) return outline
  const cos = Math.cos(head.angle), sin = Math.sin(head.angle)
  const local = (p: Point) => ({
    x: ((p.x - head.center.x) * cos + (p.y - head.center.y) * sin) / head.rx,
    y: ((p.x - head.center.x) * sin - (p.y - head.center.y) * cos) / head.ry,
  })
  // The nose starts at the facial centre above the mouth, then points forward
  // in head space. It affects the silhouette only once the tip projects past
  // the cheek; a three-quarter nose otherwise stays inside the face.
  const tip = local(nosePoints(head)[1]), side = Math.sign(tip.x)
  const noseY = tip.y
  const intersections = outline.flatMap((a, i) => {
    const start = local(a), end = local(outline[(i + 1) % outline.length])
    if ((start.y > noseY) === (end.y > noseY)) return []
    const t = (noseY - start.y) / (end.y - start.y)
    return [(start.x + (end.x - start.x) * t) * side]
  })
  const amount = Math.max(0, tip.x * side - Math.max(...intersections))
  if (!Number.isFinite(amount) || amount === 0) return outline
  // Sample only existing edges; a compact bump avoids the convex hull that
  // would drag the lip/chin forward with the nose. Outside this narrow band
  // every point remains on the original cheek/jaw silhouette.
  return outline.flatMap((a, i) => {
    const b = outline[(i + 1) % outline.length], start = local(a), end = local(b)
    const steps = Math.max(1, Math.ceil(Math.hypot(end.x - start.x, end.y - start.y) / .025))
    return Array.from({ length: steps }, (_, step) => {
      const t = step / steps, point = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
      const p = local(point), position = (p.y - noseY + .115) / .23
      if (p.x * side < .5 || position <= 0 || position >= 1) return point
      const bump = Math.sin(position * Math.PI) ** 2 * amount * head.rx * side
      return { x: point.x + bump * cos, y: point.y + bump * sin }
    })
  })
}

/** Project a tapered 3D head, then take its silhouette: the jaw follows turn, nod and roll. */
export function angularHeadOutline(head: SolvedHead, face: FaceOptions): Point[] {
  const jaw = Math.min(0.95, Math.max(0.55, face.jawWidth ?? 0.74))
  const chin = Math.min(0.35, Math.max(0.03, face.chinWidth ?? 0.14))
  const rings: Array<[number, number]> = [[-1, 0], [-0.92, chin], [-0.5, jaw], [-0.12, Math.sqrt(1 - 0.12 ** 2)]]
  for (let i = 0; i <= 12; i++) {
    const angle = i * Math.PI / 24
    rings.push([Math.sin(angle), Math.cos(angle)])
  }
  return ringOutline(head, rings, face.jawRoundness ?? 0, face.projection === 'volume')
}

/** A rounded cranium with a flatter facial plane, rather than a spherical profile. */
function roundVolumeOutline(head: SolvedHead): Point[] {
  const rings: Array<[number, number]> = Array.from({ length: 41 }, (_, i) => {
    const angle = -Math.PI / 2 + i * Math.PI / 40
    return [Math.sin(angle), Math.cos(angle)]
  })
  return ringOutline(head, rings, 0, true)
}

function ringOutline(head: SolvedHead, rings: Array<[number, number]>, roundness: number, volume: boolean): Point[] {
  const points: Point[] = []
  for (const [y, radius] of rings) {
    for (let i = 0; i < 40; i++) {
      const angle = i * Math.PI / 20
      // Flatten only the front surface in head space. The forehead/face plane
      // turns with the rig, while the rear cranium keeps its curved volume.
      const z = radius * Math.sin(angle)
      points.push(headPoint(head, [radius * Math.cos(angle), y, volume ? Math.min(z, .82) : z]).point)
    }
  }
  let outline = convexHull(points)
  roundness = Math.min(1, Math.max(0, roundness))
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
