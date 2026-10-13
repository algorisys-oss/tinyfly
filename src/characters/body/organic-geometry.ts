import type { Point } from '../../adapters/canvas/sketch'
import type { CharacterJoints } from '../character'
import type { BodyPlan } from '../rig/body-plan'
import { bodyProfileWidth, type BodyProfilePoint, type OrganicBody } from './organic-body'

export interface OrganicSample { center: Point; left: Point; right: Point; width: number; at: number }
export interface OrganicContour {
  outline: Point[]
  samples: OrganicSample[]
  /** Normalized position for each outline vertex, for attachment seam removal. */
  positions: number[]
}
export type OrganicBodyContours = Record<string, OrganicContour>
const CAP_STEPS = 8

const mix = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
const direction = (a: Point, b: Point): Point => {
  const length = Math.hypot(b.x - a.x, b.y - a.y) || 1
  return { x: (b.x - a.x) / length, y: (b.y - a.y) / length }
}
const shifted = (point: Point, vector: Point, distance: number): Point => ({ x: point.x + vector.x * distance, y: point.y + vector.y * distance })

/** Cubic centerlines pass through the actual joints with a continuous tangent. */
export function organicCenterLine(points: Point[], steps = 12): Point[] {
  if (!Number.isInteger(steps) || steps < 1 || steps > 128) throw new Error('organicCenterLine: steps must be an integer from 1 to 128')
  if (points.length < 2) return points.map(point => ({ ...point }))
  const tangents = points.map((point, i) => {
    const before = direction(points[Math.max(0, i - 1)], point)
    const after = direction(point, points[Math.min(points.length - 1, i + 1)])
    const length = Math.hypot(before.x + after.x, before.y + after.y)
    return length > 1e-6 ? { x: (before.x + after.x) / length, y: (before.y + after.y) / length } : after
  })
  const result: Point[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1]
    const handle = Math.hypot(b.x - a.x, b.y - a.y) * 0.28
    const c = shifted(a, tangents[i], handle), d = shifted(b, tangents[i + 1], -handle)
    for (let step = i === 0 ? 0 : 1; step <= steps; step++) {
      const t = step / steps, u = 1 - t
      result.push({ x: u ** 3 * a.x + 3 * u * u * t * c.x + 3 * u * t * t * d.x + t ** 3 * b.x,
        y: u ** 3 * a.y + 3 * u * u * t * c.y + 3 * u * t * t * d.y + t ** 3 * b.y })
    }
  }
  return result
}

/** Half-widths either side of a centerline at 0..1 along it, px: `left` is along the normal (-ty, tx). */
type ContourWidth = (at: number) => { left: number; right: number }

const evenWidth = (profile: BodyProfilePoint[], height: number): ContourWidth => at => {
  const width = bodyProfileWidth(profile, at) * height
  return { left: width, right: width }
}

function contour(line: Point[], widthAt: ContourWidth, startCap = 1): OrganicContour {
  const samples = line.map((center, i): OrganicSample => {
    const before = line[Math.max(0, i - 1)], after = line[Math.min(line.length - 1, i + 1)]
    let tangent = direction(before, after)
    if (Math.hypot(tangent.x, tangent.y) < 1e-6) tangent = { x: 0, y: 1 }
    const normal = { x: -tangent.y, y: tangent.x }
    const at = i / Math.max(1, line.length - 1)
    const { left, right } = widthAt(at)
    // Limit only the inside of a very tight bend; the outside retains volume.
    const incoming = direction(before, center), outgoing = direction(center, after)
    const cross = incoming.x * outgoing.y - incoming.y * outgoing.x
    const angle = Math.acos(Math.min(1, Math.max(-1, incoming.x * outgoing.x + incoming.y * outgoing.y)))
    const radius = (Math.hypot(center.x - before.x, center.y - before.y) + Math.hypot(after.x - center.x, after.y - center.y)) / (2 * Math.max(1e-6, angle))
    const inner = (width: number) => Math.min(width, Math.max(width * 0.2, radius * 0.8))
    return { center, width: (left + right) / 2, at, left: shifted(center, normal, cross > 0 ? inner(left) : left), right: shifted(center, normal, cross < 0 ? -inner(right) : -right) }
  })
  const outline: Point[] = [], positions: number[] = []
  const append = (point: Point, at: number) => { outline.push(point); positions.push(at) }
  for (const sample of samples) append(sample.left, sample.at)
  const cap = (sample: OrganicSample, tangent: Point, end: boolean) => {
    const normal = { x: -tangent.y, y: tangent.x }
    // Round between the two edges: on an uneven section the cap's centre is off the line.
    const { left, right } = widthAt(sample.at)
    const middle = shifted(sample.center, normal, (left - right) / 2)
    const radius = (left + right) / 2
    for (let i = 1; i < CAP_STEPS; i++) {
      const angle = i * Math.PI / CAP_STEPS
      const across = (end ? 1 : -1) * Math.cos(angle)
      const along = (end ? 1 : -startCap) * Math.sin(angle)
      append({ x: middle.x + radius * (normal.x * across + tangent.x * along),
        y: middle.y + radius * (normal.y * across + tangent.y * along) }, sample.at)
    }
  }
  cap(samples.at(-1)!, direction(line[Math.max(0, line.length - 2)], line.at(-1)!), true)
  for (const sample of [...samples].reverse()) append(sample.right, sample.at)
  cap(samples[0], direction(line[0], line[Math.min(1, line.length - 1)]), false)
  return { outline, samples, positions }
}

/**
 * The torso as seen at this turn. Each section is treated as a front half and
 * a back half of an ellipse (half-width w, depth f in front and b behind), so
 * its silhouette edge is √((w·cos)² + (f·sin)²) on the side the body faces and
 * √((w·cos)² + (b·sin)²) on the other: the bust and belly lead, the back and
 * seat trail, and from the front both sides are simply w.
 */
function torsoWidth(body: OrganicBody, height: number, across: number, facesRight: boolean): ContourWidth {
  const side = Math.sqrt(Math.max(0, 1 - across * across))
  return at => {
    const width = bodyProfileWidth(body.torso, at) * height * across
    const front = Math.hypot(width, bodyProfileWidth(body.torsoFront, at) * height * side)
    const back = Math.hypot(width, bodyProfileWidth(body.torsoBack, at) * height * side)
    // The spine runs up from the hip, so its left normal points screen-right.
    return facesRight ? { left: front, right: back } : { left: back, right: front }
  }
}

/** Pose-dependent plain geometry, shared by rendering, layers and exporters. */
export function organicBodyContours(body: OrganicBody, joints: CharacterJoints, plan: BodyPlan): OrganicBodyContours {
  const result: OrganicBodyContours = {}
  const height = joints.height
  const spine = joints.chains.spine
  if (spine?.length >= 2) {
    const left = joints.points['shoulder.left'], right = joints.points['shoulder.right']
    const span = plan.chains.find(chain => chain.id === 'arm.left')?.offset?.[0] ?? 0.07
    const fullSpan = Math.max(1e-6, Math.abs(span) * height * 2)
    const across = left && right ? Math.min(1, Math.hypot(left.x - right.x, left.y - right.y) / fullSpan) : Math.abs(Math.cos(joints.turn * Math.PI / 2))
    const facesRight = Math.sin(joints.turn * Math.PI / 2) >= 0
    const extended = [mix(spine[0], spine[1], -0.16), ...spine.slice(1)]
    result.spine = contour(organicCenterLine(extended), torsoWidth(body, height, across, facesRight), 0.25)
  }
  if (joints.chains.neck?.length >= 2) result.neck = contour(organicCenterLine(joints.chains.neck), evenWidth(body.neck, height))
  for (const side of ['left', 'right']) {
    for (const limb of ['arm', 'leg'] as const) {
      const points = joints.chains[`${limb}.${side}`]
      if (!points || points.length < 3) continue
      result[`${limb}.${side}`] = contour(organicCenterLine(points.slice(0, 3)), evenWidth(body[limb], height))
      if (limb === 'leg' && points.length > 3) {
        result[`foot.${side}`] = contour(organicCenterLine(points.slice(2)), evenWidth([{ at: 0, width: 0.019 }, { at: 1, width: 0.014 }], height))
      }
    }
  }
  return result
}

export function insideBodyContour(point: Point, outline: Point[]): boolean {
  let inside = false
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const a = outline[i], b = outline[j]
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}

/** Cloth follows the same curved anatomy, with room independent of its ink. */
export function organicContourSection(shape: OrganicContour, from: number, to: number, padding = 0): Point[] {
  const samples = shape.samples.filter(sample => sample.at >= from && sample.at <= to)
  const edge = (sample: OrganicSample, side: 'left' | 'right') => {
    const p = sample[side], c = sample.center, distance = Math.hypot(p.x - c.x, p.y - c.y) || 1
    return { x: p.x + (p.x - c.x) * padding / distance, y: p.y + (p.y - c.y) * padding / distance }
  }
  const outline = [...samples.map(s => edge(s, 'left')), ...[...samples].reverse().map(s => edge(s, 'right'))]
  if (from === 0) {
    // The root is a rounded attachment, not a flat cut. Cover its entire
    // cap so a raised sleeve or trouser waist never exposes a skin notch.
    const center = shape.samples[0].center
    for (const p of shape.outline.slice(-(CAP_STEPS - 1))) {
      const distance = Math.hypot(p.x - center.x, p.y - center.y) || 1
      outline.push({ x: p.x + (p.x - center.x) * padding / distance, y: p.y + (p.y - center.y) * padding / distance })
    }
  }
  return outline
}
