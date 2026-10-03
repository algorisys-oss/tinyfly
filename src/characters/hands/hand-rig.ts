import type { Point } from '../../adapters/canvas/sketch'
import type { Vec3 } from '../rig/body-plan'

/**
 * Cartoon hands: a palm and five fingers built in the hand's own 3D space,
 * posed by a flat record of numbers, turned and drawn flat. Because the hand
 * is 3D, turning the wrist (back, side, palm toward us) needs no extra
 * drawing code, and fingers behind the palm are drawn behind it.
 *
 * Hand space, for a right hand, in units of the hand's length (wrist to the
 * tip of the middle finger):
 * - **+y** runs from the wrist toward the fingers,
 * - **+x** toward the little finger (the thumb is on the -x side),
 * - **+z** out of the back of the hand (the palm faces -z).
 *
 * At `turn` 0 the back of the hand faces the viewer with the fingers up; a
 * left hand is the right hand mirrored on screen. Pure: the same pose and
 * style always give the same points.
 */

export type FingerName = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky'
export const FINGERS: readonly FingerName[] = ['thumb', 'index', 'middle', 'ring', 'pinky']

/**
 * A hand pose: every field a number, so poses blend and each field can be a
 * timeline track.
 *
 * | Field | Meaning |
 * |---|---|
 * | `index.curl` … `pinky.curl` | 0 straight, 1 curled into the palm |
 * | `thumb.curl` | 0 straight, 1 bent at both knuckles |
 * | `thumb.across` | 0 out to the side, 1 across the palm |
 * | `spread` | 0 fingers together, 1 fanned wide |
 * | `turn` | Wrist turn: 0 back of the hand toward the viewer, 1 thumb side, 2 palm, -1 little-finger side |
 * | `bend` | Wrist bend, degrees: + toward the palm |
 * | `tilt` | Wrist tilt, degrees: + toward the little finger |
 * | `roll` | The whole hand turned in the picture, degrees clockwise (a left hand turns the mirror way) |
 */
export type HandPose = Record<string, number>

export const HAND_REST: HandPose = {
  'thumb.curl': 0.15,
  'thumb.across': 0.15,
  'index.curl': 0.12,
  'middle.curl': 0.16,
  'ring.curl': 0.2,
  'pinky.curl': 0.25,
  spread: 0.25,
  turn: 0,
  bend: 0,
  tilt: 0,
  roll: 0,
}

/** A full hand pose from the fields that differ from rest. */
export function handPose(changes: Partial<HandPose> = {}): HandPose {
  return { ...HAND_REST, ...(changes as HandPose) }
}

const curls = (thumb: number, index: number, middle: number, ring: number, pinky: number) => ({
  'thumb.curl': thumb,
  'index.curl': index,
  'middle.curl': middle,
  'ring.curl': ring,
  'pinky.curl': pinky,
})

/** Ready-made hand shapes. Blend between them with {@link mixHandPoses}, or change single fields. */
export const HAND_SHAPES = {
  relaxed: HAND_REST,
  open: handPose({ ...curls(0, 0, 0, 0, 0), 'thumb.across': 0, spread: 0.55 }),
  spread: handPose({ ...curls(0, 0, 0, 0, 0), 'thumb.across': 0, spread: 1 }),
  flat: handPose({ ...curls(0, 0, 0, 0, 0), 'thumb.across': 0.35, spread: 0 }),
  fist: handPose({ ...curls(0.7, 1, 1, 1, 1), 'thumb.across': 0.9, spread: 0 }),
  point: handPose({ ...curls(0.75, 0, 1, 1, 1), 'thumb.across': 0.9, spread: 0 }),
  /** The fist on its side, knuckles toward the viewer, the thumb up */
  thumbsUp: handPose({ ...curls(0, 1, 1, 1, 1), 'thumb.across': 0, spread: 0, roll: 70 }),
  peace: handPose({ ...curls(0.75, 0, 0, 1, 1), 'thumb.across': 0.9, spread: 1 }),
  ok: handPose({ ...curls(0.12, 0.6, 0.1, 0.15, 0.2), 'thumb.across': 0.55, spread: 0.6 }),
  pinch: handPose({ ...curls(0.1, 0.65, 0.75, 0.85, 0.9), 'thumb.across': 0.55, spread: 0 }),
  cupped: handPose({ ...curls(0.25, 0.4, 0.4, 0.4, 0.4), 'thumb.across': 0.4, spread: 0.05, turn: 2 }),
  wave: handPose({ ...curls(0, 0.05, 0.05, 0.1, 0.12), 'thumb.across': 0, spread: 0.7, turn: 2 }),
  /** Holding a pencil to write: thumb and middle finger pinch it, the index finger rests on top */
  pencilGrip: handPose({ ...curls(0.1, 0.6, 0.72, 0.88, 0.95), 'thumb.across': 0.5, spread: 0, turn: 0.8, bend: 10 }),
  /** Holding a handle, a cup or a bar: every finger wrapped round it */
  hold: handPose({ ...curls(0.5, 0.7, 0.72, 0.74, 0.76), 'thumb.across': 0.75, spread: 0, turn: 1 }),
} satisfies Record<string, HandPose>

export type HandShapeName = keyof typeof HAND_SHAPES

/** A blend of two hand poses: `t` 0 is `from`, 1 is `to`. */
export function mixHandPoses(from: HandPose, to: HandPose, t: number): HandPose {
  const out: HandPose = { ...from }
  for (const [key, value] of Object.entries(to)) {
    const start = from[key] ?? value
    out[key] = start + (value - start) * t
  }
  return out
}

export interface HandRigStyle {
  /** Wrist to the tip of the middle finger, px (default 100) */
  size?: number
  /** Which hand (default right) */
  side?: 'right' | 'left'
  /** Which way the fingers point on screen, degrees clockwise from straight up (default 0) */
  angle?: number
  /** Four fingers (a thumb and three, the classic cartoon hand) or five (default 5) */
  fingers?: 4 | 5
  /** Chunkiness: 1 is a natural hand (default); 1.5 is a fat cartoon glove, its fingers and palm wider */
  plump?: number
}

/** One finger as drawn: joints from the knuckle (the thumb: its base in the palm) to the tip. */
export interface FingerJoints {
  points: Point[]
  /** Each joint's depth toward the viewer, px */
  depths: number[]
  /** Width of the finger at each joint, px */
  widths: number[]
  /** How squarely the nail faces the viewer: 1 straight on, 0 edge on, negative hidden */
  nail: number
  /** The direction the back of the fingertip faces, on screen (unit, or zero when it faces the viewer) */
  back: Point
}

/** Where every part of a hand is, as drawn. */
export interface HandJoints {
  size: number
  side: 'right' | 'left'
  wrist: Point
  /** Outline of the palm (the back of the hand and its edges), around */
  palm: Point[]
  /** The palm's depth toward the viewer, px */
  palmDepth: number
  /** How squarely the inside of the palm faces the viewer: 1 straight on, negative when the back does */
  palmFacing: number
  fingers: Partial<Record<FingerName, FingerJoints>>
  /** The hand's own axes on screen (unit vectors): toward the fingers, toward the little finger, out of the back */
  axes: { up: Point; across: Point; out: Point }
  /** Each finger's curl, as posed (the thumb's included) */
  curls: Partial<Record<FingerName, number>>
}

// ── The hand's build, in hand lengths ─────────────────────────────────────

interface FingerBuild {
  knuckle: Vec3
  bones: number[]
  width: number
  /** How far the finger fans out as `spread` grows: - toward the thumb, + toward the little finger */
  fan: number
}

const FINGER_BUILD: Record<Exclude<FingerName, 'thumb'>, FingerBuild> = {
  index: { knuckle: [-0.16, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.125, fan: -1 },
  middle: { knuckle: [-0.055, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.13, fan: -0.2 },
  ring: { knuckle: [0.05, 0.475, -0.02], bones: [0.2, 0.125, 0.1], width: 0.122, fan: 0.55 },
  pinky: { knuckle: [0.15, 0.43, -0.02], bones: [0.16, 0.1, 0.085], width: 0.108, fan: 1.25 },
}

/** Three-finger cartoon hands: plumper fingers, spread a little wider. */
const FOUR_FINGER_BUILD: Record<'index' | 'middle' | 'pinky', FingerBuild> = {
  index: { knuckle: [-0.14, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.15, fan: -1 },
  middle: { knuckle: [0, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.155, fan: 0 },
  pinky: { knuckle: [0.14, 0.45, -0.02], bones: [0.19, 0.115, 0.095], width: 0.145, fan: 1 },
}

const THUMB = {
  base: [-0.11, 0.1, -0.05] as Vec3,
  bones: [0.2, 0.15, 0.12],
  widths: [0.2, 0.145, 0.135],
  /** Where the thumb points with `across` 0 and 1 */
  out: [-0.7, 0.68, -0.22] as Vec3,
  across: [0.35, 0.5, -0.8] as Vec3,
}

/** Finger joint bends at full curl, degrees: knuckle, middle joint, end joint. */
const CURL_ANGLES = [82, 100, 62]
/** Thumb bends at full curl, degrees: its knuckle and its end joint. */
const THUMB_CURL_ANGLES = [48, 72]
/** Fingers fan by this much at `spread` 0, and this much more at 1, degrees per unit of `fan`. */
const FAN_BASE = 3
const FAN_SPREAD = 13
/** Palm thickness: its outline at the back (z) and the front. */
const PALM_BACK = 0.035
const PALM_FRONT = -0.075

/** The palm's outline, around, in the plane of the hand (for a five-fingered hand). */
const PALM_OUTLINE: [number, number][] = [
  [-0.17, 0],
  [-0.215, 0.12],
  [-0.235, 0.26],
  [-0.225, 0.4],
  [-0.185, 0.49],
  [-0.075, 0.525],
  [0.05, 0.51],
  [0.16, 0.465],
  [0.215, 0.4],
  [0.225, 0.26],
  [0.2, 0.1],
  [0.16, 0],
]

// ── Vector helpers ───────────────────────────────────────────────────────

const rad = (degrees: number) => (degrees * Math.PI) / 180
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k]
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const normalize = (a: Vec3): Vec3 => {
  const length = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / length, a[1] / length, a[2] / length]
}

/** Turn `v` about the unit `axis` by `angle` radians, right-handed (Rodrigues). */
export function rotateAbout(v: Vec3, axis: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const k = cross(axis, v)
  const d = axis[0] * v[0] + axis[1] * v[1] + axis[2] * v[2]
  return [
    v[0] * c + k[0] * s + axis[0] * d * (1 - c),
    v[1] * c + k[1] * s + axis[1] * d * (1 - c),
    v[2] * c + k[2] * s + axis[2] * d * (1 - c),
  ]
}

const X: Vec3 = [1, 0, 0]
const Y: Vec3 = [0, 1, 0]
const Z: Vec3 = [0, 0, 1]

/** A chain of bones in hand space: joints, and the back of its last bone. */
interface Chain3 {
  joints: Vec3[]
  back: Vec3
  widths: number[]
}

function fingerChain(build: FingerBuild, curl: number, spread: number): Chain3 {
  const fan = rad(build.fan * (FAN_BASE + FAN_SPREAD * spread))
  const direction: Vec3 = [Math.sin(fan), Math.cos(fan), 0]
  // The axis the finger bends about: across it, in the plane of the hand.
  const side: Vec3 = [Math.cos(fan), -Math.sin(fan), 0]
  const joints: Vec3[] = [build.knuckle]
  let bent = 0
  build.bones.forEach((length, i) => {
    bent += rad(CURL_ANGLES[i] * curl)
    // Bending turns the finger toward the palm (-z).
    joints.push(add(joints[i], scale(rotateAbout(direction, side, -bent), length)))
  })
  const back = rotateAbout(Z, side, -bent)
  const widths = joints.map((_, i) => build.width * (1 - 0.14 * (i / (joints.length - 1))))
  return { joints, back, widths }
}

function thumbChain(curl: number, across: number, plump = 1, widen = 1): Chain3 {
  const a = Math.min(1, Math.max(0, across))
  const direction = normalize(add(scale(normalize(THUMB.out), 1 - a), scale(normalize(THUMB.across), a)))
  // The thumb bends about an axis across it and the back of the hand, curling into the palm.
  const side = normalize(cross(Z, direction))
  const nailSide = normalize(cross(direction, side))
  const joints: Vec3[] = [[THUMB.base[0] * widen, THUMB.base[1], THUMB.base[2]]]
  let bent = 0
  THUMB.bones.forEach((length, i) => {
    if (i > 0) bent += rad(THUMB_CURL_ANGLES[i - 1] * curl)
    joints.push(add(joints[i], scale(rotateAbout(direction, side, bent), length)))
  })
  const back = rotateAbout(nailSide, side, bent)
  const widths = [...THUMB.widths, THUMB.widths[THUMB.widths.length - 1] * 0.92].map((w) => w * plump)
  return { joints, back, widths }
}

/**
 * Solve a hand pose: every finger's joints on screen, with depths, for a
 * hand whose wrist is at (0, 0). Move the result with {@link handJointsAt}.
 */
export function handJoints(pose: HandPose, style: HandRigStyle = {}): HandJoints {
  const full = { ...HAND_REST, ...pose }
  const size = style.size ?? 100
  const side = style.side ?? 'right'
  const mirror = side === 'left' ? -1 : 1
  const angle = rad(style.angle ?? 0)
  const fourFingers = style.fingers === 4
  const plump = Math.max(0.5, style.plump ?? 1)
  // A plumper hand: thicker fingers on a wider palm, their knuckles spaced to match.
  const widen = 1 + (plump - 1) * 0.7
  const widened = (build: FingerBuild): FingerBuild => ({
    ...build,
    knuckle: [build.knuckle[0] * widen, build.knuckle[1], build.knuckle[2]],
    width: build.width * plump,
  })

  // Wrist bend and tilt, then the turn: hand space to view space (x right, y up, z toward the viewer).
  const bend = rad(full.bend ?? 0)
  const tilt = rad(full.tilt ?? 0)
  const turn = rad(90 * (full.turn ?? 0))
  const toView = (v: Vec3): Vec3 => rotateAbout(rotateAbout(rotateAbout(v, X, -bend), Z, -tilt), Y, turn)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const roll = rad(full.roll ?? 0)
  const rollCos = Math.cos(roll)
  const rollSin = Math.sin(roll)
  /** View space to the screen: flatten, roll, mirror a left hand, point the fingers along `angle`, scale. */
  const toScreen = (v: Vec3): Point => {
    const flatX = v[0] * size
    const flatY = -v[1] * size
    const x = (flatX * rollCos - flatY * rollSin) * mirror
    const y = flatX * rollSin + flatY * rollCos
    return { x: x * cos - y * sin, y: x * sin + y * cos }
  }
  const screenVector = (v: Vec3): Point => {
    const p = toScreen(v)
    const length = Math.hypot(p.x, p.y)
    return length > 1e-6 * size ? { x: p.x / length, y: p.y / length } : { x: 0, y: 0 }
  }

  const chains: Partial<Record<FingerName, Chain3>> = {
    thumb: thumbChain(full['thumb.curl'] ?? 0, full['thumb.across'] ?? 0, plump, widen),
  }
  const builds: Partial<Record<FingerName, FingerBuild>> = fourFingers ? FOUR_FINGER_BUILD : FINGER_BUILD
  for (const name of FINGERS) {
    const build = builds[name]
    if (build) chains[name] = fingerChain(widened(build), full[`${name}.curl`] ?? 0, full.spread ?? 0)
  }

  const fingers: Partial<Record<FingerName, FingerJoints>> = {}
  for (const [name, chain] of Object.entries(chains) as [FingerName, Chain3][]) {
    const view = chain.joints.map(toView)
    const back = toView(chain.back)
    fingers[name] = {
      points: view.map(toScreen),
      depths: view.map((v) => v[2] * size),
      widths: chain.widths.map((w) => w * size),
      nail: back[2],
      back: screenVector(back),
    }
  }

  // The palm has a thickness, so edge on it is still a shape: its outline is
  // the hull of the back and front outlines.
  const outline = PALM_OUTLINE.flatMap(([x, y]) => [toView([x * widen, y, PALM_BACK]), toView([x * widen, y, PALM_FRONT])])
  const palm = convexHull(outline.map(toScreen))
  const palmDepth = (outline.reduce((sum, v) => sum + v[2], 0) / outline.length) * size

  return {
    size,
    side,
    wrist: { x: 0, y: 0 },
    palm,
    palmDepth,
    palmFacing: -toView(Z)[2],
    fingers,
    axes: { up: screenVector(toView(Y)), across: screenVector(toView(X)), out: screenVector(toView(Z)) },
    curls: Object.fromEntries(Object.keys(fingers).map((name) => [name, full[`${name}.curl`] ?? 0])),
  }
}

/** Hand joints moved so the wrist is at `at`. */
export function handJointsAt(joints: HandJoints, at: Point): HandJoints {
  const move = (p: Point): Point => ({ x: p.x + at.x - joints.wrist.x, y: p.y + at.y - joints.wrist.y })
  const fingers: Partial<Record<FingerName, FingerJoints>> = {}
  for (const [name, finger] of Object.entries(joints.fingers) as [FingerName, FingerJoints][]) {
    fingers[name] = { ...finger, points: finger.points.map(move) }
  }
  return { ...joints, wrist: move(joints.wrist), palm: joints.palm.map(move), fingers }
}

/** The convex hull of points, anticlockwise on screen (Andrew's monotone chain). */
function convexHull(points: Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  if (sorted.length < 3) return sorted
  const turn = (o: Point, a: Point, b: Point) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const lower: Point[] = []
  for (const p of sorted) {
    while (lower.length >= 2 && turn(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: Point[] = []
  for (const p of [...sorted].reverse()) {
    while (upper.length >= 2 && turn(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}
