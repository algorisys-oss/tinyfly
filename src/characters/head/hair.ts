import type { Point } from '../../adapters/canvas/sketch'
import type { Pose, Vec3 } from '../rig/body-plan'
import type { SolvedHead } from '../rig/skeleton'
import type { Pen } from '../look/pen'
import { convexHull } from './head-shape'
import { taperedOutline } from '../look/tapered-line'
import { aroundDistance, behindHead, cachedOutlines, facingOf, onScreen, shellOutlines, spherePoint, visibleRuns, type ShellOutlines, type ShellRegion } from './shell'
import { copyHairLock, type HairLock } from './hair-lock'
import { drawHairLocks } from './hair-lock-draw'
import { FLOWING_HAIR_STYLES } from './flowing-hair'

/**
 * Hair for the human character, as plain data: a cap of hair on the head
 * (how far it stands off the head, where its hairline runs, its texture),
 * optional length that hangs below the head, curved locks and ties (ponytails,
 * buns, braids). Every style is plain data, so a style is a
 * preset of them and any field can be changed on its own.
 *
 * Hair is a region on the head's surface (see `shell.ts`), so it turns with
 * the head: the parting and the fringe stay on their own side through a
 * turn, the back view shows the back of the hair, and a ponytail stays tied
 * to the same place. The part facing away is drawn before the head, the part
 * facing the viewer after it.
 *
 * Hair that hangs (long hair, ponytails, braids) also swings: three pose
 * fields (`hair.swing`, `hair.trail`, `hair.lift`) carry how far its ends
 * lag behind the head, and `hairFollow` works them out from the head's
 * motion as keyframes, so drawing stays stateless.
 */

/**
 * How far hanging hair lags behind the head, at its ends (the roots stay on
 * the head). Plain numbers that live in the pose as `hair.swing`,
 * `hair.trail` and `hair.lift`, so they key, save and mirror like any field.
 */
export interface HairMotion {
  /** Swung round the head toward the character's left (+) or right (−), degrees */
  swing: number
  /** Streaming back behind the head (+) or thrown forward (−), head radii */
  trail: number
  /** Lifted (+) or dropped (−), head radii */
  lift: number
}

export const HAIR_STILL: HairMotion = { swing: 0, trail: 0, lift: 0 }

/** The hair motion a pose carries (`hair.swing`, `hair.trail`, `hair.lift`; missing fields are still). */
export function hairMotionOf(pose: Pose | undefined): HairMotion {
  if (!pose) return HAIR_STILL
  const swing = pose['hair.swing'] ?? 0
  const trail = pose['hair.trail'] ?? 0
  const lift = pose['hair.lift'] ?? 0
  return swing === 0 && trail === 0 && lift === 0 ? HAIR_STILL : { swing, trail, lift }
}

const isStill = (motion: HairMotion) => motion.swing === 0 && motion.trail === 0 && motion.lift === 0

/** Whether a style has anything that swings: hanging hair, a ponytail/braid, or flexible locks. */
export function hairHangs(hair: Hair): boolean {
  return hair.length > 0 || hair.ties.some((tie) => tie.kind !== 'bun') || (hair.locks ?? []).some(lock => (lock.follow ?? 1) > 0)
}

/** A head-space point swung round the head's up axis by `angle` (radians, + toward the character's left at the back). */
function swung([x, y, z]: Vec3, angle: number): Vec3 {
  if (angle === 0) return [x, y, z]
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [x * cos - z * sin, y, z * cos + x * sin]
}

export type HairTexture = 'smooth' | 'spiky' | 'curly' | 'wavy' | 'locs'

/** Detail lines drawn on the hair: none, a parting, strands swept from a parting, combed back, hanging strands, a few thin strands */
export type HairStrands = 'none' | 'part' | 'sweep' | 'combed' | 'hanging' | 'thin'

/** A pointed 3D tuft anchored on the scalp. All dimensions are head radii. */
export interface HairSpike {
  /** Degrees around the head from the face. */
  around: number
  /** Height on the scalp, -1..1. */
  up: number
  /** Length beyond the scalp and base radius. */
  length: number
  width: number
}

export interface HairTie {
  kind: 'ponytail' | 'bun' | 'braid'
  /** Where it is tied: on top, high at the back, low at the back, or over one ear (the character's left or right) */
  at: 'top' | 'high' | 'low' | 'left' | 'right'
  /** Ponytails and braids: how far it hangs, head radii (default 1.8) */
  length?: number
  /** Buns: radius; ponytails and braids: width at the tie, head radii (default 0.32 bun, 0.34 ponytail, 0.2 braid) */
  size?: number
}

/** A hairstyle, every field resolved: plain data, so it can be saved, synced and generated. */
export interface Hair {
  /** Fill colour (in the silhouette look, the ink) */
  color: string
  /** How far the hair stands off the head, head radii */
  volume: number
  /** The hairline's height (head radii, +up from the centre) at the forehead, at the temples and at the nape */
  hairline: { front: number; side: number; back: number }
  /** A side fringe: the hairline drops toward the character's left (+) or right (−) */
  sweep: number
  /** Temples pushed back (0 none, 0.4 well receded) */
  recede: number
  /** Long hair: where it ends, head radii below the head's centre (0: short hair) */
  length: number
  /** Long hair: half the opening it leaves for the face, degrees around from the middle of the face */
  opening: number
  texture: HairTexture
  /** How strong the texture is, head radii */
  textureAmount: number
  /** Volume lifted up and forward over the forehead (a quiff) */
  quiff: number
  /** A flat top: how far above the crown the flat top sits, head radii (0: round) */
  flat: number
  /** Where a parting sits, degrees around from the middle of the face toward the character's left (null: none) */
  part: number | null
  strands: HairStrands
  /** `solid` filled hair; `stipple` close-cropped hair drawn as dots on the scalp */
  fill: 'solid' | 'stipple'
  ties: HairTie[]
  /** Optional pointed tufts; their silhouette follows every head turn. */
  spikes?: HairSpike[]
  /** Broad curved locks, rooted on the cap, with tapered tips and individual flexibility. */
  locks?: HairLock[]
  /** Hanging mass: narrowing toward the tips and a soft uneven hem, in head radii. */
  fall?: { taper: number; wave: number }
  /** Soft highlight opacity on flowing locks, 0..1 (default 0). */
  shine?: number
  /** Hair falls over the ears, so the ears are hidden */
  coversEars: boolean
}

/** A hairstyle: a named preset, any fields changed from it. */
export type HairSpec = Partial<Omit<Hair, 'hairline'>> & { style?: HairStyleName; hairline?: Partial<Hair['hairline']> }

const DEFAULT_HAIR: Hair = {
  color: '#6b4630',
  volume: 0.1,
  hairline: { front: 0.5, side: 0.12, back: -0.82 },
  sweep: 0,
  recede: 0,
  length: 0,
  opening: 84,
  texture: 'smooth',
  textureAmount: 0,
  quiff: 0,
  flat: 0,
  part: null,
  strands: 'none',
  fill: 'solid',
  ties: [],
  coversEars: false,
}

type HairPreset = Omit<HairSpec, 'style' | 'color'>

/** Long hair falls to the shoulders at this length (head radii below the centre). */
const SHOULDERS = 1.75

/**
 * Ready-made hairstyles: short cuts and hairlines, then medium and long hair.
 * They are starting points, not restrictions: any style suits anyone, and
 * every field can be changed (`{ style: 'bob', length: 1.4 }`).
 */
export const HAIR_STYLES = {
  ...FLOWING_HAIR_STYLES,
  // Short hair and hairlines
  bald: { volume: 0, hairline: { front: 2, side: 2, back: 2 } },
  buzzCut: { volume: 0, fill: 'stipple', hairline: { front: 0.52, side: 0.1, back: -0.8 } },
  crewCut: { volume: 0.1, texture: 'spiky', textureAmount: 0.07, hairline: { front: 0.55, side: 0.1, back: -0.8 } },
  short: { volume: 0.12, texture: 'spiky', textureAmount: 0.1, hairline: { front: 0.42, side: 0.1, back: -0.82 }, sweep: 0.12 },
  sidePart: { volume: 0.14, part: 35, strands: 'sweep', sweep: -0.22, hairline: { front: 0.5, side: 0.08, back: -0.82 } },
  sideSwept: { volume: 0.15, part: 45, strands: 'sweep', sweep: -0.38, hairline: { front: 0.42, side: 0.05, back: -0.82 } },
  slickBack: { volume: 0.12, strands: 'combed', hairline: { front: 0.62, side: 0.15, back: -0.8 } },
  quiff: { volume: 0.12, quiff: 0.42, strands: 'combed', hairline: { front: 0.6, side: 0.15, back: -0.8 } },
  spiky: { volume: 0.12, texture: 'spiky', textureAmount: 0.34, hairline: { front: 0.5, side: 0.12, back: -0.8 } },
  mangaSpikes: { volume: 0.12, texture: 'spiky', textureAmount: 0.08, hairline: { front: 0.55, side: 0.12, back: -0.7 }, spikes: [
    { around: -100, up: 0.4, length: 0.55, width: 0.24 }, { around: -65, up: 0.7, length: 0.6, width: 0.25 },
    { around: -25, up: 0.93, length: 0.6, width: 0.24 }, { around: 40, up: 0.87, length: 0.7, width: 0.25 },
    { around: 85, up: 0.55, length: 0.55, width: 0.24 }, { around: 160, up: 0.8, length: 0.5, width: 0.24 },
    { around: -160, up: 0.65, length: 0.55, width: 0.24 },
  ] },
  mangaSweep: { volume: 0.14, texture: 'spiky', textureAmount: 0.1, sweep: -0.35, hairline: { front: 0.5, side: 0.08, back: -0.8 }, spikes: [
    { around: -95, up: 0.45, length: 0.35, width: 0.2 }, { around: -60, up: 0.8, length: 0.4, width: 0.24 },
    { around: 75, up: 0.55, length: 0.4, width: 0.23 }, { around: 150, up: 0.75, length: 0.35, width: 0.2 },
  ] },
  undercut: { volume: 0.16, quiff: 0.18, part: 40, strands: 'sweep', sweep: -0.15, hairline: { front: 0.55, side: 0.42, back: -0.3 } },
  curlyCrop: { volume: 0.14, texture: 'curly', textureAmount: 0.12, hairline: { front: 0.5, side: 0.1, back: -0.8 } },
  afro: { volume: 0.5, texture: 'curly', textureAmount: 0.12, hairline: { front: 0.5, side: -0.1, back: -0.85 }, coversEars: true },
  wavyCrop: { volume: 0.16, texture: 'wavy', textureAmount: 0.08, part: 30, hairline: { front: 0.45, side: 0.05, back: -0.82 } },
  shortLocs: { volume: 0.16, texture: 'locs', textureAmount: 0.1, hairline: { front: 0.38, side: -0.25, back: -0.85 }, strands: 'hanging', coversEars: true },
  flatTop: { volume: 0.1, flat: 0.42, hairline: { front: 0.5, side: 0.15, back: -0.78 } },
  receding: { volume: 0.14, recede: 0.28, strands: 'thin', hairline: { front: 0.74, side: 0.1, back: -0.8 } },
  thinning: { volume: 0.05, strands: 'thin', hairline: { front: 0.72, side: 0.05, back: -0.78 } },
  // Medium and long hair
  pixie: { volume: 0.16, texture: 'spiky', textureAmount: 0.07, sweep: 0.3, hairline: { front: 0.32, side: -0.1, back: -0.82 } },
  bob: { volume: 0.2, length: 1.05, opening: 84, sweep: 0.2, part: -25, hairline: { front: 0.34, side: 0.05, back: -0.85 }, coversEars: true },
  longBob: { volume: 0.18, length: 1.35, opening: 84, part: 0, strands: 'part', hairline: { front: 0.5, side: 0.05, back: -0.85 }, coversEars: true },
  wavyBob: { volume: 0.22, length: 1.2, opening: 84, part: 18, texture: 'wavy', textureAmount: 0.1, hairline: { front: 0.45, side: 0.05, back: -0.85 }, coversEars: true },
  shoulderStraight: { volume: 0.16, length: SHOULDERS, opening: 84, part: 0, strands: 'part', hairline: { front: 0.5, side: 0.05, back: -0.85 }, coversEars: true },
  shoulderWaves: { volume: 0.22, length: SHOULDERS, opening: 84, part: 22, texture: 'wavy', textureAmount: 0.12, hairline: { front: 0.45, side: 0.05, back: -0.85 }, coversEars: true },
  longStraight: { volume: 0.14, length: 2.6, opening: 84, part: 0, strands: 'hanging', hairline: { front: 0.5, side: 0.05, back: -0.85 }, coversEars: true },
  longWaves: { volume: 0.2, length: 2.5, opening: 84, part: 20, texture: 'wavy', textureAmount: 0.14, hairline: { front: 0.45, side: 0.05, back: -0.85 }, coversEars: true },
  longCurls: { volume: 0.26, length: 2.5, opening: 84, texture: 'curly', textureAmount: 0.13, hairline: { front: 0.45, side: 0.05, back: -0.85 }, coversEars: true },
  longLocs: { volume: 0.2, length: 2.6, opening: 84, texture: 'locs', textureAmount: 0.12, strands: 'hanging', part: 0, hairline: { front: 0.45, side: 0.05, back: -0.85 }, coversEars: true },
  lowPonytail: { volume: 0.12, part: 0, strands: 'combed', hairline: { front: 0.5, side: 0.1, back: -0.82 }, ties: [{ kind: 'ponytail', at: 'low', length: 1.5 }] },
  highPonytail: { volume: 0.12, part: 18, strands: 'combed', hairline: { front: 0.45, side: 0.1, back: -0.78 }, ties: [{ kind: 'ponytail', at: 'high', length: 2 }] },
  ponytail: { volume: 0.12, sweep: 0.2, hairline: { front: 0.42, side: 0.1, back: -0.78 }, ties: [{ kind: 'ponytail', at: 'high', length: 1.8 }] },
  sidePonytail: { volume: 0.12, part: -20, strands: 'combed', hairline: { front: 0.45, side: 0.1, back: -0.82 }, ties: [{ kind: 'ponytail', at: 'left', length: 1.5 }] },
  topBun: { volume: 0.12, part: 0, strands: 'combed', hairline: { front: 0.5, side: 0.1, back: -0.8 }, ties: [{ kind: 'bun', at: 'top', size: 0.32 }] },
  lowBun: { volume: 0.12, part: 0, strands: 'combed', hairline: { front: 0.5, side: 0.1, back: -0.8 }, ties: [{ kind: 'bun', at: 'low', size: 0.34 }] },
  singleBraid: { volume: 0.12, part: 0, strands: 'combed', hairline: { front: 0.5, side: 0.1, back: -0.82 }, ties: [{ kind: 'braid', at: 'low', length: 2.2 }] },
  twinBraids: { volume: 0.12, part: 0, strands: 'part', hairline: { front: 0.5, side: 0.05, back: -0.82 }, ties: [{ kind: 'braid', at: 'left', length: 1.9 }, { kind: 'braid', at: 'right', length: 1.9 }], coversEars: true },
  braids: { volume: 0.12, part: 0, strands: 'part', hairline: { front: 0.5, side: 0.05, back: -0.82 }, ties: [{ kind: 'braid', at: 'left', length: 1.6 }, { kind: 'braid', at: 'right', length: 1.6 }], coversEars: true },
} satisfies Record<string, HairPreset>

export type HairStyleName = keyof typeof HAIR_STYLES

/** Hair colours that read well against the default ink, by name. */
export const HAIR_COLORS = {
  black: '#22201f',
  brown: '#6b4630',
  chestnut: '#7b4a2b',
  auburn: '#9a4426',
  blond: '#d9b55a',
  ginger: '#c8662f',
  gray: '#a7a29c',
  white: '#ecebe7',
} as const

/** A hairstyle with every field filled in (a style name, or a style and changes). */
export function resolveHair(spec: HairSpec | HairStyleName): Hair {
  const own: HairSpec = typeof spec === 'string' ? { style: spec } : spec
  const preset: HairPreset = own.style ? HAIR_STYLES[own.style] : {}
  if (own.style && !preset) throw new Error(`hair: unknown style '${own.style}'`)
  const { style: _style, hairline, ...fields } = own
  const hair: Hair = {
    ...DEFAULT_HAIR,
    ...(preset as Partial<Hair>),
    ...fields,
    hairline: { ...DEFAULT_HAIR.hairline, ...preset.hairline, ...hairline },
    ties: (fields.ties ?? preset.ties ?? []).map((tie) => ({ ...tie })),
    ...((fields.spikes ?? preset.spikes) ? { spikes: (fields.spikes ?? preset.spikes)!.map((spike) => ({ ...spike })) } : {}),
    ...((fields.locks ?? preset.locks) ? { locks: (fields.locks ?? preset.locks)!.map(copyHairLock) } : {}),
    ...((fields.fall ?? preset.fall) ? { fall: { ...(fields.fall ?? preset.fall)! } } : {}),
  } as Hair
  if (hair.shine !== undefined && (!Number.isFinite(hair.shine) || hair.shine < 0 || hair.shine > 1)) throw new Error('hair: shine must be between 0 and 1')
  if (hair.fall && (!Number.isFinite(hair.fall.taper) || hair.fall.taper < 0 || hair.fall.taper > 1 || !Number.isFinite(hair.fall.wave) || hair.fall.wave < 0)) {
    throw new Error('hair: fall needs taper between 0 and 1 and nonnegative wave')
  }
  return hair
}

const rad = (degrees: number) => (degrees * Math.PI) / 180
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}
/** 0 → 1 → 0 over each whole unit. */
const tri = (x: number) => 1 - Math.abs(2 * (x - Math.floor(x)) - 1)

/** The hairline's height at a place around the head. */
export function hairlineAt(hair: Hair, around: number): number {
  const { front, side, back } = hair.hairline
  // A smooth curve through the forehead, the temples and the nape.
  const b = (front - back) / 2
  const middle = (front + back) / 2
  const a = (middle + side) / 2
  const c = (middle - side) / 2
  const frontness = Math.max(0, Math.cos(around))
  let y = a + b * Math.cos(around) + c * Math.cos(2 * around)
  y -= hair.sweep * Math.sin(around) * frontness
  y += hair.recede * Math.exp(-(((Math.abs(around) - 0.75) / 0.32) ** 2))
  // A spiky or curly fringe has an uneven edge.
  if (hair.texture === 'spiky' || hair.texture === 'curly') y -= hair.textureAmount * 0.6 * tri((around * 11) / (Math.PI * 2)) * frontness
  return y
}

/** How far the texture lifts the hair at a point, head radii. */
function textureAt(hair: Hair, around: number, up: number): number {
  const amount = hair.textureAmount
  switch (hair.texture) {
    case 'spiky':
      return amount * (tri((around * 11) / (Math.PI * 2)) * tri(up * 2.6 + 0.5)) ** 1.2 * smoothstep(-0.3, 0.4, up)
    case 'curly':
      return amount * Math.sqrt(Math.abs(Math.sin(around * 7)) * Math.abs(Math.sin(up * Math.PI * 2.6)))
    case 'wavy':
      return amount * (0.5 + 0.5 * Math.sin(around * 6 + up * 6))
    case 'locs':
      return amount * Math.abs(Math.sin(around * 10)) ** 0.6
    default:
      return 0
  }
}

/**
 * The hair as a region on the head. `pad` (head radii) lifts it clear of
 * the head's own outline, so a thick head line never shows through it.
 */
export function hairRegion(hair: Hair, pad: number, motion: HairMotion = HAIR_STILL): ShellRegion {
  const long = hair.length > 0
  // The hairline depends only on the place around the head: work it out once per column.
  const hairlines = new Map<number, number>()
  const hairlineOf = (around: number) => {
    let y = hairlines.get(around)
    if (y === undefined) hairlines.set(around, (y = hairlineAt(hair, around)))
    return y
  }
  const opening = rad(hair.opening)
  const lengthAt = (around: number) =>
    hair.length + (hair.texture === 'wavy' || hair.texture === 'curly' || hair.texture === 'locs' ? 0.12 * Math.sin(around * 9) : 0) + (hair.fall?.wave ?? 0) * Math.cos(around * 3 + 0.6)
  // The flat top: sides rise straight, then the top is flat.
  const flatTop = (around: number, up: number, radius: number): Vec3 | null => {
    if (hair.flat <= 0 || up < 0.45) return null
    const t = (up - 0.45) / 0.55
    const ring = Math.sqrt(1 - 0.45 * 0.45) * radius * (1 - t ** 5)
    const y = 0.45 + (1 + hair.flat - 0.45) * Math.min(1, t * 1.8)
    return [ring * Math.sin(around), y * (1 + pad), ring * Math.cos(around)]
  }
  const region: ShellRegion = {
    top: 1,
    bottom: long ? -(hair.length + 0.25 + Math.abs(hair.fall?.wave ?? 0)) : -1,
    inside(around, up) {
      const cap = up - hairlineOf(around)
      if (!long) return cap
      const curtain = Math.min(up + lengthAt(around), aroundDistance(around, 0) - opening)
      return Math.max(cap, curtain)
    },
    position(around, up) {
      if (long && up < 0) {
        // Long hair hangs straight down; short of the shoulders its ends tuck under.
        const tuck = hair.length < 1.5 ? 0.14 * smoothstep(-hair.length + 0.45, -hair.length - 0.1, up) : 0
        const taper = (hair.fall?.taper ?? 0) * smoothstep(0, -Math.max(0.1, lengthAt(around)), up)
        const radius = 1 + pad + hair.volume * (1 - tuck * 2.5) + textureAt(hair, around, up) - tuck - taper
        return [radius * Math.sin(around), up, radius * Math.cos(around)]
      }
      // The hair thins to the scalp at its hairline, so its edge lies on the head.
      const edge = 0.4 + 0.6 * smoothstep(0, 0.3, up - hairlineAt(hair, around))
      const radius = 1 + pad + (hair.volume + textureAt(hair, around, up)) * edge
      const flat = flatTop(around, up, radius)
      if (flat) return flat
      const [x, y, z] = spherePoint(around, up)
      const point: Vec3 = [x * radius, y * radius, z * radius]
      if (hair.quiff > 0) {
        // Swept up and forward over the forehead.
        const lift = hair.quiff * Math.exp(-((around / 0.7) ** 2)) * smoothstep(0.15, 0.85, up)
        point[1] += lift * 0.7
        point[2] += lift * 0.45
      }
      return point
    },
    normal(around, up) {
      if (long && up < 0) return [Math.sin(around), 0, Math.cos(around)]
      return spherePoint(around, up)
    },
  }
  return long && !isStill(motion) ? swingingRegion(region, hair, motion) : region
}

/**
 * The hanging part of the hair, lagging behind the head: the roots stay put
 * and the ends swing round the head, stream back and lift, in proportion to
 * how far below the head they hang. The cap is left as it is.
 */
function swingingRegion(base: ShellRegion, hair: Hair, motion: HairMotion): ShellRegion {
  // 0 at the head's bottom edge, 1 at the hair's ends.
  const weight = (up: number) => (up < 0 ? smoothstep(-0.15, -Math.max(0.7, hair.length), up) : 0)
  const angle = (up: number) => rad(motion.swing) * weight(up)
  return {
    top: base.top,
    bottom: base.bottom,
    inside: (around, up) => base.inside(around + angle(up), up),
    position(around, up) {
      const w = weight(up)
      if (w === 0) return base.position(around, up)
      const a = angle(up)
      const [x, y, z] = swung(base.position(around + a, up), a)
      return [x, y + motion.lift * w, z - motion.trail * w]
    },
    normal: (around, up) => swung(base.normal!(around + angle(up), up), angle(up)),
  }
}

/** Fine textures need more columns round the head to show. */
const columnsFor = (hair: Hair) => (hair.texture === 'spiky' || hair.texture === 'curly' || hair.texture === 'locs' ? 104 : hair.texture === 'wavy' ? 80 : 64)

/** The hair's outlines for this head, traced once per drawing. */
function hairOutlines(head: SolvedHead, hair: Hair, region: ShellRegion, motion: HairMotion): ShellOutlines {
  return cachedOutlines(head, motionKey(hair, motion), () => shellOutlines(head, region, columnsFor(hair)))
}

/** Outlines are cached per head by the hair; moving hair is cached by the hair and its motion. */
const hairIds = new WeakMap<Hair, number>()
let nextHairId = 1
function motionKey(hair: Hair, motion: HairMotion): unknown {
  if (isStill(motion)) return hair
  let id = hairIds.get(hair)
  if (!id) hairIds.set(hair, (id = nextHairId++))
  return `${id}:${motion.swing}:${motion.trail}:${motion.lift}`
}

/** Where a tie sits on the head (head radii) and which way it points out. */
function tieAnchor(at: HairTie['at']): { point: Vec3; out: Vec3 } {
  switch (at) {
    case 'top':
      return { point: [0, 1.02, -0.12], out: [0, 1, -0.15] }
    case 'high':
      return { point: [0, 0.72, -0.78], out: [0, 0.55, -0.85] }
    case 'low':
      return { point: [0, -0.2, -1.02], out: [0, -0.1, -1] }
    case 'left':
      return { point: [0.82, -0.32, -0.45], out: [0.8, -0.2, -0.5] }
    case 'right':
      return { point: [-0.82, -0.32, -0.45], out: [-0.8, -0.2, -0.5] }
  }
}

/** A head-space direction on the screen, in px per head radius. */
function screenVector(head: SolvedHead, [x, y, z]: Vec3): Point {
  const a = onScreen(head, [x, y, z])
  return { x: a.x - head.center.x, y: a.y - head.center.y }
}

/** Points along a quadratic curve. */
function curve(from: Point, control: Point, to: Point, samples = 16): Point[] {
  return Array.from({ length: samples + 1 }, (_, i) => {
    const t = i / samples
    const u = 1 - t
    return { x: u * u * from.x + 2 * u * t * control.x + t * t * to.x, y: u * u * from.y + 2 * u * t * control.y + t * t * to.y }
  })
}

/**
 * The path a ponytail or braid hangs along, on the screen: out from its tie,
 * then down. Hung from the side of the head it falls straight; tied at the
 * back it swings out toward the character's left, so it shows from the front.
 */
function hangingPath(head: SolvedHead, tie: HairTie, root: Point, out: Vec3, motion: HairMotion): Point[] {
  const scale = head.ry
  const length = (tie.length ?? 1.8) * scale
  // Lagging behind the head: swung round it, and its end carried back and up or down.
  const outward = screenVector(head, swung(out, rad(motion.swing)))
  const carried = screenVector(head, [0, motion.lift, -motion.trail])
  const outLength = Math.hypot(outward.x, outward.y) || 1
  const sway = tie.at === 'high' || tie.at === 'low' || tie.at === 'top' ? screenVector(head, [0.95, 0, 0]) : { x: 0, y: 0 }
  const reach = tie.kind === 'braid' ? 0.15 : 0.5
  const control = {
    x: root.x + (outward.x / outLength) * scale * reach + sway.x * 0.9 + carried.x * 0.5,
    y: root.y + (outward.y / outLength) * scale * reach * 0.6 + carried.y * 0.5,
  }
  const tip = { x: root.x + (outward.x / outLength) * scale * reach * 0.6 + sway.x * 1.3 + carried.x, y: root.y + length + carried.y }
  return curve(root, control, tip)
}

export interface HairDrawOptions {
  /** The character's line width, px */
  lineWidth: number
  /** Skin colour, for the scalp under close-cropped hair */
  skin: string
  /** How far hanging hair lags behind the head (default still) */
  motion?: HairMotion
}

/** Outline weight of hair: lighter than the body's line. */
const outlineOf = (lineWidth: number) => Math.max(1, lineWidth * 0.5)
/** Detail lines (strands, partings): as light as the face's. */
const detailOf = (lineWidth: number, head: SolvedHead) => Math.max(0.8, Math.min(lineWidth * 0.4, 0.1 * head.rx))

/** Draw one tie (a bun, ponytail or braid). */
function drawTie(pen: Pen, head: SolvedHead, hair: Hair, tie: HairTie, lineWidth: number, motion: HairMotion) {
  const { point, out } = tieAnchor(tie.at)
  const lift = 1 + hair.volume
  const root = onScreen(head, [point[0] * lift, point[1] * lift, point[2] * lift])
  const outline = outlineOf(lineWidth)
  const detail = detailOf(lineWidth, head)
  if (tie.kind === 'bun') {
    const size = tie.size ?? 0.32
    const centre = onScreen(head, [point[0] * lift + out[0] * size, point[1] * lift + out[1] * size, point[2] * lift + out[2] * size])
    pen.ellipse(centre.x, centre.y, size * head.rx, size * head.ry, head.angle, hair.color, outline)
    // A twist in the bun.
    const r = size * head.rx * 0.55
    pen.line(
      Array.from({ length: 9 }, (_, i) => {
        const a = -0.4 + (i / 8) * Math.PI * 1.3
        return { x: centre.x + Math.cos(a) * r, y: centre.y + Math.sin(a) * r * 0.8 }
      }),
      detail
    )
    return
  }
  const path = hangingPath(head, tie, root, out, motion)
  const width = (tie.size ?? (tie.kind === 'braid' ? 0.2 : 0.34)) * head.rx * 2
  if (tie.kind === 'ponytail') {
    pen.shape(taperedOutline(path, width, width * 0.15), hair.color, outline)
    // A strand down its middle, and the band that ties it.
    pen.line(path.slice(3, path.length - 3), detail)
  } else {
    // A braid: plaits down its length, then a tuft below the band.
    const plaits = 7
    const usable = path.slice(0, path.length - 3)
    for (let i = 0; i < plaits; i++) {
      const a = usable[Math.floor((i / plaits) * (usable.length - 1))]
      const b = usable[Math.floor(((i + 1) / plaits) * (usable.length - 1))]
      const angle = Math.atan2(b.y - a.y, b.x - a.x)
      const length = Math.hypot(b.x - a.x, b.y - a.y)
      const w = width * (1 - i / (plaits * 2.2))
      const lean = (i % 2 === 0 ? 1 : -1) * 0.35
      const centre = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      pen.ellipse(centre.x, centre.y, length * 0.62, w * 0.5, angle + lean, hair.color, outline * 0.8)
    }
    const end = usable[usable.length - 1]
    const tip = path[path.length - 1]
    pen.shape(taperedOutline([end, tip], width * 0.7, width * 0.2), hair.color, outline * 0.8)
  }
  const band = path[tie.kind === 'braid' ? path.length - 4 : 2]
  pen.ellipse(band.x, band.y, width * 0.32, width * 0.22, head.angle, hair.color, outline)
}

/** Which ties sit on the far side of the head (drawn behind it). */
function tieIsFar(head: SolvedHead, tie: HairTie): boolean {
  // Ties in profile count as near, so they never flicker behind the head.
  return facingOf(head, tieAnchor(tie.at).out) < -0.2
}

/** Detail lines in head space: (around, up) curves. */
function strandCurves(hair: Hair): Array<Array<[number, number]>> {
  const line = (from: [number, number], to: [number, number], bend = 0, samples = 14): Array<[number, number]> =>
    Array.from({ length: samples + 1 }, (_, i) => {
      const t = i / samples
      return [from[0] + (to[0] - from[0]) * t + bend * Math.sin(Math.PI * t), from[1] + (to[1] - from[1]) * t]
    })
  const part = rad(hair.part ?? 0)
  const front = (around: number) => hairlineAt(hair, around) + 0.04
  switch (hair.strands) {
    case 'part':
      return [line([part, front(part)], [part, 0.97])]
    case 'sweep': {
      const toward = Math.sign(hair.sweep || -1)
      const sweeps = [0.9, 0.72, 0.55].map((up, i) => {
        const end = part + toward * (0.6 + i * 0.35)
        return line([part, up], [end, Math.max(front(end) + 0.05, up - 0.35)], 0.05 * toward)
      })
      return [line([part, front(part)], [part, 0.97]), ...sweeps]
    }
    case 'combed':
      return [-0.75, -0.35, 0.35, 0.75].map((around) => line([around, front(around) + 0.02], [around * 0.3, 0.86]))
    case 'thin':
      return [-0.5, 0.05, 0.6].map((around) => line([around, front(around) + 0.02], [around * 0.5, 0.95], 0.12))
    case 'hanging': {
      const bottom = hair.length > 0 ? -hair.length + 0.25 : -0.4
      const curves = [-2.6, -2, -1.4, 1.4, 2, 2.6, 3.05].map((around) => line([around, hairlineAt(hair, around) < 0.9 ? 0.6 : 0.9], [around, bottom], 0))
      if (hair.part !== null) curves.push(line([part, front(part)], [part, 0.97]))
      return curves
    }
    default:
      return []
  }
}

/**
 * The hair behind the head: the part facing away, and ties on the far side.
 * Drawn before the body, so long hair hangs behind the shoulders.
 */
export function drawHairBehind(pen: Pen, ctx: CanvasRenderingContext2D, head: SolvedHead, hair: Hair, options: HairDrawOptions): void {
  if (hair.fill === 'stipple' || hair.hairline.front > 1.5) return
  const motion = options.motion ?? HAIR_STILL
  const pad = (options.lineWidth * 0.45) / head.rx
  const { far } = hairOutlines(head, hair, hairRegion(hair, pad, motion), motion)
  behindHead(ctx, head, () => {
    for (const tie of hair.ties) if (tieIsFar(head, tie)) drawTie(pen, head, hair, tie, options.lineWidth, motion)
    drawSpikes(pen, head, hair, options.lineWidth, pad, false)
    for (const loop of far) pen.shape(loop, hair.color, outlineOf(options.lineWidth))
    drawHairLocks(pen, head, hair, pad, motion, options.lineWidth, false)
  })
}

/** The hair over the head: the part facing the viewer, its detail lines, and near ties. */
export function drawHairFront(pen: Pen, head: SolvedHead, hair: Hair, options: HairDrawOptions): void {
  if (hair.hairline.front > 1.5) return
  const motion = options.motion ?? HAIR_STILL
  const pad = (options.lineWidth * 0.45) / head.rx
  const region = hairRegion(hair, pad, motion)
  const detail = detailOf(options.lineWidth, head)
  if (hair.fill === 'stipple') {
    // Close-cropped: dots over the scalp, and a dotted hairline.
    for (let up = 0.97; up > -1; up -= 0.17) {
      for (let around = -Math.PI; around < Math.PI; around += 0.27) {
        const jitter = (Math.round(up * 100) % 2) * 0.13
        if (region.inside(around + jitter, up) < 0.02) continue
        const point = spherePoint(around + jitter, up)
        if (facingOf(head, point) < 0.12) continue
        const p = onScreen(head, point)
        pen.dot(p.x, p.y, detail * 0.4)
      }
    }
    return
  }
  const { near } = hairOutlines(head, hair, region, motion)
  const outline = outlineOf(options.lineWidth)
  drawSpikes(pen, head, hair, options.lineWidth, pad, true)
  for (const loop of near) pen.shape(loop, hair.color, outline)
  drawHairLocks(pen, head, hair, pad, motion, options.lineWidth, true)
  // Detail lines: on the hair, just inside its surface.
  for (const strand of strandCurves(hair)) {
    const points = strand.map(([around, up]) => {
      const [x, y, z] = region.position(around, up)
      return [x * 0.985, y * 0.985, z * 0.985] as Vec3
    })
    const normals = strand.map(([around, up]) => region.normal!(around, up))
    for (const run of visibleRuns(head, points, normals, 0.12)) pen.line(run, detail)
  }
  for (const tie of hair.ties) if (!tieIsFar(head, tie)) drawTie(pen, head, hair, tie, options.lineWidth, motion)
}

/** Cone silhouettes in head space, drawn before the cap so it hides their roots. */
function drawSpikes(pen: Pen, head: SolvedHead, hair: Hair, lineWidth: number, pad: number, near: boolean): void {
  for (const spike of hair.spikes ?? []) {
    const n = spherePoint(rad(spike.around), Math.max(-1, Math.min(1, spike.up)))
    if ((facingOf(head, n) >= 0) !== near) continue
    const across: Vec3 = [Math.cos(rad(spike.around)), 0, -Math.sin(rad(spike.around))]
    const along: Vec3 = [n[1] * across[2], n[2] * across[0] - n[0] * across[2], -n[1] * across[0]]
    const radius = 1 + hair.volume + pad
    const width = Math.max(0, spike.width)
    const length = Math.max(0, spike.length)
    const points = [onScreen(head, n.map(v => v * (radius + length)) as Vec3)]
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4
      const base = n.map((v, axis) => v * radius + width * (across[axis] * Math.cos(angle) + along[axis] * Math.sin(angle))) as Vec3
      points.push(onScreen(head, base))
    }
    pen.shape(convexHull(points), hair.color, outlineOf(lineWidth))
  }
}
