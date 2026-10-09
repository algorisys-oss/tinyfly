import type { Point } from '../../adapters/canvas/sketch'
import type { Vec3 } from '../rig/body-plan'
import type { SolvedHead } from '../rig/skeleton'
import type { Pen } from '../look/pen'
import { onScreen, shellOutlines, spherePoint, visibleRuns, type ShellRegion } from './shell'

/**
 * Hats: a crown that fits over the head (and the hair under it) and a brim,
 * a peak at the front for a cap or a ring all round. The crown is a region on
 * a slightly larger head, so it turns with the head; the brim is a ring of
 * points around it, drawn first so the crown sits on it. Hair under the hat is
 * covered by it; hair below the brim still shows.
 */

export type HatStyle = 'cap' | 'beanie' | 'hardHat' | 'sunHat' | 'bowler'

export interface Hat {
  style: HatStyle
  color: string
}

export type HatSpec = Partial<Hat>

interface HatShape {
  color: string
  /** The brim's height (head radii) at the front and at the back */
  brim: [number, number]
  /** Crown height, as a share of a round head (1 round) */
  height: number
  /** A peak at the front, or a ring all round, and how far it reaches (head radii) */
  peak?: number
  ring?: number
  /** The detail line drawn on it */
  detail: 'seams' | 'fold' | 'ridge' | 'band'
}

export const HAT_STYLES = {
  cap: { color: '#d64535', brim: [0.36, 0.16], height: 1, peak: 0.7, detail: 'seams' },
  beanie: { color: '#3a6ea5', brim: [0.3, 0.12], height: 1.08, detail: 'fold' },
  hardHat: { color: '#f2c230', brim: [0.34, 0.22], height: 1.12, ring: 0.16, detail: 'ridge' },
  sunHat: { color: '#e3c98f', brim: [0.36, 0.3], height: 1.02, ring: 0.62, detail: 'band' },
  bowler: { color: '#2f2b2a', brim: [0.36, 0.28], height: 1.15, ring: 0.2, detail: 'band' },
} satisfies Record<HatStyle, HatShape>

export function resolveHat(spec: HatSpec | HatStyle): Hat {
  const own: HatSpec = typeof spec === 'string' ? { style: spec } : spec
  const style = own.style ?? 'cap'
  const shape = HAT_STYLES[style] as HatShape | undefined
  if (!shape) throw new Error(`hat: unknown style '${style}'`)
  return { style, color: own.color ?? shape.color }
}

/** The brim's height at a place around the head. */
const brimAt = (shape: HatShape, around: number) => shape.brim[1] + (shape.brim[0] - shape.brim[1]) * (1 + Math.cos(around)) / 2

/** The crown, on a head `radius` head radii round (over any hair). */
function crownRegion(shape: HatShape, radius: number): ShellRegion {
  return {
    top: 1,
    bottom: Math.min(...shape.brim) - 0.05,
    inside: (around, up) => up - brimAt(shape, around),
    position(around, up) {
      const [x, y, z] = spherePoint(around, up)
      // Taller crowns rise above the head; the brim line stays where it is.
      const brim = brimAt(shape, around)
      const lift = up > brim ? (y - brim) * (shape.height - 1) : 0
      return [x * radius, y * radius + lift, z * radius]
    },
    normal: (around, up) => spherePoint(around, up),
  }
}

/** The brim's outline on the screen: a peak at the front, or a ring all round. */
function brimOutline(head: SolvedHead, shape: HatShape, radius: number): Point[] | null {
  const droop = 0.07
  const at = (around: number, out: number, drop: number): Vec3 => {
    const y = brimAt(shape, around) * radius - drop
    return [Math.sin(around) * out, y, Math.cos(around) * out]
  }
  if (shape.peak) {
    const outer: Point[] = []
    const inner: Point[] = []
    for (let i = 0; i <= 24; i++) {
      const around = (-80 + (160 * i) / 24) * (Math.PI / 180)
      const reach = shape.peak * Math.cos(around) ** 0.6
      outer.push(onScreen(head, [Math.sin(around) * (radius + reach * 0.25), brimAt(shape, around) * radius - droop * Math.cos(around), Math.cos(around) * (radius + reach)]))
      inner.push(onScreen(head, at(around, radius, 0)))
    }
    return [...outer, ...inner.reverse()]
  }
  if (shape.ring) {
    return Array.from({ length: 48 }, (_, i) => onScreen(head, at((Math.PI * 2 * i) / 48, radius + (shape.ring as number), droop)))
  }
  return null
}

/** The detail line on the crown, as (around, up) curves. */
function detailCurves(shape: HatShape): Array<Array<[number, number]>> {
  const meridian = (around: number) => Array.from({ length: 13 }, (_, i): [number, number] => [around, brimAt(shape, around) + ((0.97 - brimAt(shape, around)) * i) / 12])
  const ring = (above: number) => Array.from({ length: 49 }, (_, i): [number, number] => {
    const around = -Math.PI + (Math.PI * 2 * i) / 48
    return [around, brimAt(shape, around) + above]
  })
  switch (shape.detail) {
    case 'seams':
      return [meridian(0.55), meridian(-0.55)]
    case 'fold':
      return [ring(0.2)]
    case 'ridge':
      return [meridian(0), meridian(Math.PI)]
    case 'band':
      return [ring(0.12)]
  }
}

export interface HatDrawOptions {
  lineWidth: number
  /** How far the hair under the hat stands off the head, head radii */
  hairVolume: number
}

export function drawHat(pen: Pen, head: SolvedHead, hat: Hat, options: HatDrawOptions): void {
  const shape = HAT_STYLES[hat.style] as HatShape
  const pad = (options.lineWidth * 0.45) / head.rx
  const radius = 1 + pad + Math.max(0.05, Math.min(0.3, options.hairVolume) + 0.04)
  const outline = Math.max(1, options.lineWidth * 0.5)
  const brim = brimOutline(head, shape, radius)
  if (brim) pen.shape(brim, hat.color, outline)
  const region = crownRegion(shape, radius)
  const { near, far } = shellOutlines(head, region)
  for (const loop of [...far, ...near]) pen.shape(loop, hat.color, outline)
  const detail = Math.max(0.8, outline * 0.7)
  for (const curve of detailCurves(shape)) {
    const points = curve.map(([around, up]) => {
      const [x, y, z] = region.position(around, up)
      return [x * 0.99, y * 0.99, z * 0.99] as Vec3
    })
    const normals = curve.map(([around, up]) => spherePoint(around, up))
    for (const run of visibleRuns(head, points, normals, 0.1)) pen.line(run, detail)
  }
  if (shape.detail === 'seams') {
    // The button on top.
    const top = onScreen(head, [0, radius * 1.01, 0])
    pen.dot(top.x, top.y, outline * 0.9)
  }
}
