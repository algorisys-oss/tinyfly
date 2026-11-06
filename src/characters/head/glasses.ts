import type { Point } from '../../adapters/canvas/sketch'
import type { SolvedHead } from '../rig/skeleton'
import type { Pen } from '../look/pen'
import { faceToScreen, OVAL_EYE, type FaceOptions } from './face'
import { facingOf, onScreen } from './shell'

/**
 * Glasses: a lens round each eye, a bridge between them, and the arms back
 * to the ears. Lenses are placed like the eyes (they slide round with the
 * face in a turn, and the far one hides in profile); the near arm runs back
 * to its ear, so a profile shows the frame side-on.
 */

export type GlassesStyle = 'round' | 'square' | 'sunglasses'

/** Glasses, drawn in the character's ink. */
export interface Glasses {
  style: GlassesStyle
}

export type GlassesSpec = Partial<Glasses>

export const GLASSES_STYLES = { round: true, square: true, sunglasses: true } satisfies Record<GlassesStyle, true>

export function resolveGlasses(spec: GlassesSpec | GlassesStyle): Glasses {
  const own: GlassesSpec = typeof spec === 'string' ? { style: spec } : spec
  const style = own.style ?? 'round'
  if (!(style in GLASSES_STYLES)) throw new Error(`glasses: unknown style '${style}'`)
  return { style }
}

const SHOWN = 0.05

/** Where the lenses sit and how big they are: round the usual eyes, or round big oval eyes (face style `oval`). */
interface LensFit { x: number; y: number; rx: number; ry: number }
const USUAL_FIT: LensFit = { x: 0.34, y: 0.12, rx: 1, ry: 1 }
const OVAL_FIT: LensFit = { x: OVAL_EYE.x, y: OVAL_EYE.y, rx: (OVAL_EYE.rx + 0.03) / 0.2, ry: (OVAL_EYE.ry + 0.06) / 0.19 }

/** A lens's outline around an eye, in face coordinates. */
function lensOutline(style: GlassesStyle, cx: number, fit: LensFit = USUAL_FIT): Point[] {
  const samples = 28
  return Array.from({ length: samples }, (_, i) => {
    const a = (Math.PI * 2 * i) / samples
    if (style === 'round') return { x: cx + Math.cos(a) * 0.2 * fit.rx, y: fit.y + Math.sin(a) * 0.19 * fit.ry }
    // A rounded rectangle: a squarish superellipse.
    const c = Math.cos(a)
    const s = Math.sin(a)
    const rx = (style === 'sunglasses' ? 0.22 : 0.21) * fit.rx * (fit === USUAL_FIT ? 1 : 0.93)
    const ry = (style === 'sunglasses' ? 0.17 : 0.16) * fit.ry * (fit === USUAL_FIT ? 1 : 1.12)
    return { x: cx + Math.sign(c) * Math.abs(c) ** 0.45 * rx, y: fit.y - 0.01 + Math.sign(s) * Math.abs(s) ** 0.45 * ry }
  })
}

export interface GlassesDrawOptions {
  face?: FaceOptions
  lineWidth: number
}

export function drawGlasses(pen: Pen, head: SolvedHead, glasses: Glasses, options: GlassesDrawOptions): void {
  const frame = Math.max(1, Math.min(options.lineWidth * 0.5, 0.11 * head.rx))
  const fit = options.face?.style === 'oval' ? OVAL_FIT : USUAL_FIT
  const half = 0.2 * fit.rx
  const shown: number[] = []
  for (const side of [1, -1]) {
    const cx = fit.x * side
    const { points, facing } = faceToScreen(head, lensOutline(glasses.style, cx, fit), { x: cx, y: fit.y }, options.face?.projection)
    if (facing < SHOWN) continue
    shown.push(side)
    pen.shape(points, glasses.style === 'sunglasses' ? '#1f2328' : null, frame)
    // The arm back to the ear on this side, when that side of the head faces the viewer.
    const ear = [side * 0.97, fit.y + 0.02, -0.1] as [number, number, number]
    if (facingOf(head, [side, 0, 0]) > 0.15) {
      const hinge = faceToScreen(head, [{ x: cx + side * (half + 0.01), y: fit.y + 0.02 }], { x: cx, y: fit.y }, options.face?.projection).points[0]
      pen.line([hinge, onScreen(head, ear)], frame * 0.9)
    }
  }
  // Big oval eyes nearly touch: their lenses meet without a bridge.
  if (shown.length === 2 && fit.x - half > 0.02) {
    const bridge = [
      { x: fit.x - half, y: fit.y + 0.02 },
      { x: 0, y: fit.y + 0.07 },
      { x: -(fit.x - half), y: fit.y + 0.02 },
    ]
    pen.line(faceToScreen(head, bridge, { x: 0, y: fit.y }, options.face?.projection).points, frame)
  }
}
