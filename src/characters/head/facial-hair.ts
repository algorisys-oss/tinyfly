import type { Point } from '../../adapters/canvas/sketch'
import type { SolvedHead } from '../rig/skeleton'
import type { Pen } from '../look/pen'
import { faceToScreen } from './face'
import { aroundDistance, behindHead, cachedOutlines, facingOf, onScreen, shellOutlines, spherePoint, type ShellRegion } from './shell'

/**
 * Facial hair: a moustache and a beard, chosen separately. A beard is a
 * region on the head's surface (it follows the jaw round in a turn and shows
 * its own outline in profile); a moustache sits on the face, placed like the
 * mouth, so it stays over the mouth however the face slides in a turn. A
 * beard that covers the mouth leaves an opening in the skin colour, so the
 * mouth and every lip-sync shape stay readable.
 */

export type MoustacheStyle = 'none' | 'pencil' | 'short' | 'chevron' | 'handlebar' | 'walrus'
export type BeardStyle =
  | 'none'
  | 'stubble'
  | 'goatee'
  | 'soulPatch'
  | 'chinStrap'
  | 'circle'
  | 'boxed'
  | 'full'
  | 'rounded'
  | 'pointed'
  | 'long'
  | 'sideburns'
  | 'muttonChops'

export interface FacialHair {
  /** Fill colour (default: the hair's, else brown) */
  color: string
  moustache: MoustacheStyle
  beard: BeardStyle
}

export type FacialHairSpec = Partial<FacialHair> & { style?: FacialHairStyleName }

/** The combinations on the facial-hair reference sheet, by name. */
export const FACIAL_HAIR_STYLES = {
  cleanShaven: { moustache: 'none', beard: 'none' },
  stubble: { moustache: 'none', beard: 'stubble' },
  pencilMoustache: { moustache: 'pencil', beard: 'none' },
  shortMoustache: { moustache: 'short', beard: 'none' },
  chevron: { moustache: 'chevron', beard: 'none' },
  handlebar: { moustache: 'handlebar', beard: 'none' },
  walrus: { moustache: 'walrus', beard: 'none' },
  goatee: { moustache: 'none', beard: 'goatee' },
  vanDyke: { moustache: 'chevron', beard: 'goatee' },
  circleBeard: { moustache: 'short', beard: 'circle' },
  shortBoxed: { moustache: 'short', beard: 'boxed' },
  fullBeard: { moustache: 'chevron', beard: 'full' },
  longBeard: { moustache: 'walrus', beard: 'long' },
  roundedBeard: { moustache: 'chevron', beard: 'rounded' },
  pointedBeard: { moustache: 'chevron', beard: 'pointed' },
  chinStrap: { moustache: 'none', beard: 'chinStrap' },
  soulPatch: { moustache: 'none', beard: 'soulPatch' },
  sideburns: { moustache: 'none', beard: 'sideburns' },
  muttonChops: { moustache: 'none', beard: 'muttonChops' },
  moustacheStubble: { moustache: 'short', beard: 'stubble' },
} satisfies Record<string, { moustache: MoustacheStyle; beard: BeardStyle }>

export type FacialHairStyleName = keyof typeof FACIAL_HAIR_STYLES

export function resolveFacialHair(spec: FacialHairSpec | FacialHairStyleName, hairColor?: string): FacialHair {
  const own: FacialHairSpec = typeof spec === 'string' ? { style: spec } : spec
  const preset = own.style ? FACIAL_HAIR_STYLES[own.style] : undefined
  if (own.style && !preset) throw new Error(`facialHair: unknown style '${own.style}'`)
  return {
    color: own.color ?? hairColor ?? '#6b4630',
    moustache: own.moustache ?? preset?.moustache ?? 'none',
    beard: own.beard ?? preset?.beard ?? 'none',
  }
}

const rad = (degrees: number) => (degrees * Math.PI) / 180
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/** How a beard is cut: where its top edge runs, how far round it reaches, how far it hangs below the chin and in what shape. */
interface BeardCut {
  /** Top edge (head radii, +up) at the chin's middle and at the sideburn */
  top: [number, number]
  /** How far round the face it reaches, degrees */
  reach: number
  /** Only a band this deep below the top edge (a chin strap); 0 the whole region */
  band: number
  /** Below the chin, head radii */
  length: number
  /** The hanging part's shape: wide and square, rounded, or to a point */
  shape: 'square' | 'round' | 'point'
  /** How far it stands off the face, head radii */
  volume: number
  /** It covers the mouth, so the mouth gets an opening */
  aroundMouth: boolean
}

const BEARD_CUTS: Partial<Record<BeardStyle, BeardCut>> = {
  goatee: { top: [-0.55, -0.55], reach: 22, band: 0, length: 0.22, shape: 'point', volume: 0.06, aroundMouth: false },
  circle: { top: [-0.24, -0.3], reach: 42, band: 0, length: 0.08, shape: 'round', volume: 0.06, aroundMouth: true },
  boxed: { top: [-0.38, 0.02], reach: 100, band: 0, length: 0.18, shape: 'square', volume: 0.08, aroundMouth: true },
  full: { top: [-0.36, 0.05], reach: 100, band: 0, length: 0.32, shape: 'round', volume: 0.12, aroundMouth: true },
  rounded: { top: [-0.36, 0.05], reach: 100, band: 0, length: 0.55, shape: 'round', volume: 0.14, aroundMouth: true },
  pointed: { top: [-0.36, 0.05], reach: 100, band: 0, length: 0.8, shape: 'point', volume: 0.12, aroundMouth: true },
  long: { top: [-0.36, 0.05], reach: 100, band: 0, length: 1.4, shape: 'round', volume: 0.14, aroundMouth: true },
  chinStrap: { top: [-0.68, 0.05], reach: 100, band: 0.18, length: 0, shape: 'round', volume: 0.04, aroundMouth: false },
  sideburns: { top: [0.08, 0.08], reach: 100, band: 0.42, length: 0, shape: 'round', volume: 0.05, aroundMouth: false },
  muttonChops: { top: [0.08, 0.08], reach: 100, band: 0.75, length: 0, shape: 'round', volume: 0.08, aroundMouth: false },
}

/** Where a beard's top edge runs at a place around the face. */
const topAt = (cut: BeardCut, around: number) => {
  // Low across the cheeks, rising only near the ear to meet the sideburn.
  const t = smoothstep(rad(48), rad(100), aroundDistance(around, 0))
  return cut.top[0] + (cut.top[1] - cut.top[0]) * t
}

/** Sideburns and mutton chops only grow on the sides of the face. */
const sidesOnly = (style: BeardStyle) => style === 'sideburns' || style === 'muttonChops'

export function beardRegion(style: BeardStyle, pad: number): ShellRegion | null {
  const cut = BEARD_CUTS[style]
  if (!cut) return null
  const reach = rad(cut.reach)
  // How much of the beard hangs at a place around the face.
  const hangAt = (around: number) => {
    const a = aroundDistance(around, 0)
    if (cut.shape === 'point') return Math.exp(-((a / 0.42) ** 2))
    if (cut.shape === 'square') return 1 - smoothstep(rad(45), rad(85), a)
    return Math.cos(Math.min(a, Math.PI / 2)) ** 0.7
  }
  return {
    top: Math.max(cut.top[0], cut.top[1]) + 0.05,
    bottom: -1,
    inside(around, up) {
      const a = aroundDistance(around, 0)
      const top = topAt(cut, around)
      let inside = Math.min(top - up, reach - a)
      if (cut.band > 0) inside = Math.min(inside, up - (top - cut.band))
      if (sidesOnly(style)) {
        // Wider toward the bottom for mutton chops.
        const from = style === 'muttonChops' ? rad(70) - rad(22) * smoothstep(0.08, -0.6, up) : rad(72)
        inside = Math.min(inside, a - from)
      }
      return inside
    },
    position(around, up) {
      const [x, y, z] = spherePoint(around, up)
      const radius = 1 + pad + cut.volume
      // Below the jaw the beard hangs down, in its shape.
      const drop = cut.length * hangAt(around) * smoothstep(-0.45, -1, up)
      return [x * radius, y * radius - drop, z * radius + drop * 0.25]
    },
    normal: (around, up) => spherePoint(around, up),
  }
}

/** A moustache's outline in face coordinates (x across, y up, as the face's features), around the upper lip. */
function moustacheOutline(style: MoustacheStyle): Point[] | null {
  const Y = -0.24
  const curve = (points: Array<[number, number]>) => points.map(([x, y]) => ({ x, y: Y + y }))
  switch (style) {
    case 'short':
      return curve([[-0.17, -0.02], [-0.1, 0.04], [0, 0.03], [0.1, 0.04], [0.17, -0.02], [0.08, -0.05], [0, -0.03], [-0.08, -0.05]])
    case 'chevron':
      return curve([[-0.28, -0.1], [-0.16, 0.05], [0, 0.07], [0.16, 0.05], [0.28, -0.1], [0.12, -0.08], [0, -0.06], [-0.12, -0.08]])
    case 'walrus':
      return curve([[-0.38, -0.2], [-0.3, 0.02], [-0.12, 0.09], [0, 0.07], [0.12, 0.09], [0.3, 0.02], [0.38, -0.2], [0.2, -0.13], [0, -0.11], [-0.2, -0.13]])
    case 'handlebar':
      return curve([[-0.24, -0.03], [-0.12, 0.04], [0, 0.03], [0.12, 0.04], [0.24, -0.03], [0.1, -0.05], [0, -0.03], [-0.1, -0.05]])
    default:
      return null
  }
}

export interface FacialHairDrawOptions {
  lineWidth: number
  skin: string
}

const outlineOf = (lineWidth: number) => Math.max(1, lineWidth * 0.45)
const SHOWN = 0.05

/** Dots over a region of the face, as stubble or a shaved scalp. */
function stipple(pen: Pen, head: SolvedHead, region: ShellRegion, size: number) {
  for (let up = 0.1; up > -1; up -= 0.13) {
    for (let around = -Math.PI / 1.7; around < Math.PI / 1.7; around += 0.2) {
      const shift = (Math.round(up * 100) % 2) * 0.1
      if (region.inside(around + shift, up) < 0.02) continue
      const point = spherePoint(around + shift, up)
      if (facingOf(head, point) < 0.15) continue
      const p = onScreen(head, point)
      pen.dot(p.x, p.y, size)
    }
  }
}

/** A beard's far side, behind the head (a long beard seen from behind). */
export function drawBeardBehind(pen: Pen, ctx: CanvasRenderingContext2D, head: SolvedHead, hair: FacialHair, options: FacialHairDrawOptions): void {
  const region = hair.beard === 'stubble' ? null : beardRegion(hair.beard, (options.lineWidth * 0.45) / head.rx)
  if (!region) return
  const { far } = cachedOutlines(head, hair, () => shellOutlines(head, region))
  behindHead(ctx, head, () => {
    for (const loop of far) pen.shape(loop, hair.color, outlineOf(options.lineWidth))
  })
}

/** The beard over the face (before the mouth is drawn, so the mouth shows in its opening). */
export function drawBeardFront(pen: Pen, head: SolvedHead, hair: FacialHair, options: FacialHairDrawOptions, mouthWidth: number): void {
  if (hair.beard === 'none') return
  const pad = (options.lineWidth * 0.45) / head.rx
  if (hair.beard === 'stubble') {
    stipple(pen, head, beardRegion('full', pad)!, Math.max(0.5, options.lineWidth * 0.09))
    return
  }
  if (hair.beard === 'soulPatch') {
    const shape = [{ x: -0.05, y: -0.55 }, { x: 0.05, y: -0.55 }, { x: 0, y: -0.68 }]
    const { points, facing } = faceToScreen(head, shape, { x: 0, y: -0.6 })
    if (facing > -SHOWN) pen.shape(points, hair.color, outlineOf(options.lineWidth) * 0.7)
    return
  }
  const region = beardRegion(hair.beard, pad)
  if (!region) return
  const { near } = cachedOutlines(head, hair, () => shellOutlines(head, region))
  for (const loop of near) pen.shape(loop, hair.color, outlineOf(options.lineWidth))
  if (BEARD_CUTS[hair.beard]?.aroundMouth) {
    // An opening around the mouth, in the skin colour.
    const w = 0.27 * Math.max(0.3, mouthWidth)
    const opening = Array.from({ length: 20 }, (_, i) => {
      const a = (Math.PI * 2 * i) / 20
      return { x: Math.cos(a) * w, y: -0.42 + Math.sin(a) * 0.13 }
    })
    const { points, facing } = faceToScreen(head, opening, { x: 0, y: -0.42 })
    if (facing > -SHOWN) pen.shape(points, options.skin === 'none' ? '#ffffff' : options.skin, 0)
  }
}

/** The moustache, over the mouth. */
export function drawMoustache(pen: Pen, head: SolvedHead, hair: FacialHair, options: FacialHairDrawOptions): void {
  if (hair.moustache === 'none') return
  const centre = { x: 0, y: -0.24 }
  if (hair.moustache === 'pencil') {
    const line = [-0.2, -0.1, 0, 0.1, 0.2].map((x) => ({ x, y: -0.25 + 0.03 * Math.cos((x / 0.2) * Math.PI) }))
    const { points, facing } = faceToScreen(head, line, centre)
    if (facing > -SHOWN) pen.line(points, Math.max(1, options.lineWidth * 0.32))
    return
  }
  const outline = moustacheOutline(hair.moustache)
  if (!outline) return
  const { points, facing } = faceToScreen(head, outline, centre)
  if (facing <= -SHOWN) return
  pen.shape(points, hair.color, outlineOf(options.lineWidth) * 0.8)
  if (hair.moustache === 'handlebar') {
    // The tips curl up and round.
    for (const side of [1, -1]) {
      const curl = Array.from({ length: 10 }, (_, i) => {
        const a = -Math.PI / 2 + (i / 9) * Math.PI * 1.4
        return { x: side * (0.27 + 0.05 * Math.cos(a)), y: -0.21 + 0.05 * (1 + Math.sin(a)) }
      })
      curl.unshift({ x: side * 0.22, y: -0.27 })
      pen.line(faceToScreen(head, curl, centre).points, outlineOf(options.lineWidth) * 0.8)
    }
  }
}
