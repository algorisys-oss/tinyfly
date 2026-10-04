import type { EasingType, Track } from '../engine/types'
import { getEasingFunction } from '../engine/interpolation/easing'
import { REST_POSE, blendPose, type StickPose } from './stick-figure'

/**
 * Flips and other acrobatics for the stick figure, as plain data.
 *
 * A flip is one continuous motion through its phases: wind up (crouch, arms
 * back), take off (arms swing up, toes push), the air (tuck or layout while
 * the body turns), and land (absorb in a crouch, stand). `progress` runs 0 → 1
 * through all of it.
 *
 * The body's pose is keyed like any pose. The turn and the height are not
 * keyed: between take-off and landing the hips follow a parabola (as anything
 * thrown does) and the turn eases in and out, quickest at the top, where a
 * real tuck spins fastest. After landing the turn is a whole number of turns,
 * drawn as none, so the figure can blend on into any other pose.
 */

export interface FlipKey {
  /** When, 0..1 of the whole move */
  at: number
  /** Joints that change from the previous key (the first key builds on the view's stance) */
  pose?: Partial<StickPose>
  /** Start again from the stance before applying `pose` */
  reset?: boolean
  /** Easing into this key (default ease-in-out) */
  easing?: EasingType
}

export interface Flip {
  label: string
  /** How the figure is seen: 0 front-on (side flips, cartwheels), 1 in profile (front and back flips) */
  view: number
  /** Total turn in the air, degrees: positive rolls forward, negative backward */
  spin: number
  /** Height of the hips' arc above standing, as a fraction of the height */
  height: number
  /** Ground covered, as a fraction of the height (positive the way the figure faces) */
  travel: number
  /** Feet leave the ground, 0..1 */
  takeoff: number
  /** Feet touch down again, 0..1 */
  landing: number
  /** How long the whole move takes at its natural speed, ms */
  duration: number
  keys: FlipKey[]
}

/** `t` clamped to 0..1. */
const unit = (t: number) => Math.min(1, Math.max(0, t))

function resolveKeys(flip: Flip): Array<{ at: number; pose: StickPose; easing?: EasingType }> {
  const stance: StickPose = { ...REST_POSE, turn: flip.view }
  const resolved: Array<{ at: number; pose: StickPose; easing?: EasingType }> = []
  for (const key of flip.keys) {
    const previous = resolved[resolved.length - 1]
    const from = !previous || key.reset ? stance : previous.pose
    resolved.push({ at: key.at, pose: { ...from, ...key.pose }, easing: key.easing })
  }
  return resolved
}

/**
 * How much of the turn is done `air` (0..1) of the way through the air. The
 * body leaves the ground already turning (half speed) and turns fastest at the
 * top, where it is most tucked: steady enough to read, never a sudden whip.
 */
function spinProgress(air: number): number {
  return air - (SPIN_SURGE * Math.sin(2 * Math.PI * air)) / (2 * Math.PI)
}

/** How much faster the turn is at the top than on average (0 even, 1 from rest) */
const SPIN_SURGE = 0.5

/** How far through the air (0 at take-off, 1 at landing), or undefined on the ground. */
function airborne(flip: Flip, progress: number): number | undefined {
  if (progress <= flip.takeoff || progress >= flip.landing) return undefined
  return (progress - flip.takeoff) / (flip.landing - flip.takeoff)
}

/**
 * The figure `progress` (0..1) of the way through a flip. The pose is in the
 * figure's own place: add {@link flipTravel} to its x to move it across.
 */
export function flipPose(flip: Flip | FlipName, progress: number): StickPose {
  const move = typeof flip === 'string' ? FLIPS[flip] : flip
  const keys = resolveKeys(move)
  const p = unit(progress)
  let index = 0
  for (let i = 0; i < keys.length; i++) if (keys[i].at <= p) index = i
  const from = keys[index]
  const to = keys[Math.min(index + 1, keys.length - 1)]
  const t = to.at > from.at ? (p - from.at) / (to.at - from.at) : 0
  const body = blendPose(from.pose, to.pose, getEasingFunction(to.easing ?? 'ease-in-out')(unit(t)))

  const air = airborne(move, p)
  if (air === undefined) return { ...body, spin: 0, rise: 0 }
  return {
    ...body,
    spin: move.spin * spinProgress(air),
    rise: 4 * move.height * air * (1 - air),
  }
}

/**
 * Ground covered `progress` of the way through a flip, px for a figure
 * `height` px tall: none while winding up, steady through the air, none after.
 */
export function flipTravel(flip: Flip | FlipName, progress: number, height: number): number {
  const move = typeof flip === 'string' ? FLIPS[flip] : flip
  const p = unit(progress)
  const through = unit((p - move.takeoff) / (move.landing - move.takeoff))
  return move.travel * height * through
}

export interface FlipTrackOptions {
  /** When the flip starts, ms (default 0) */
  start?: number
  /** How long it takes, ms (default the flip's own duration) */
  duration?: number
  /** Keyframes over the whole flip (default 48) */
  samples?: number
  /**
   * The figure's height in px, to move it across by the flip's `travel` (an
   * `x` offset track). Omit to flip on the spot.
   */
  height?: number
  /** Facing: -1 travels to the left (default 1) */
  facing?: number
  /** An x offset the travel starts from (default 0) */
  x?: number
}

/**
 * The flip as keyframe tracks for a stick-figure target: every joint that
 * moves, plus `spin` and `rise` (and `x` when `height` is given). Plain JSON,
 * so a flip saves, scrubs and renders like any other animation.
 */
export function flipTracks(target: string, flip: Flip | FlipName, options: FlipTrackOptions = {}): Track[] {
  const move = typeof flip === 'string' ? FLIPS[flip] : flip
  const start = options.start ?? 0
  const duration = options.duration ?? move.duration
  const count = options.samples ?? 48
  const samples = Array.from({ length: count + 1 }, (_, i) => {
    const progress = i / count
    return { time: start + progress * duration, progress, pose: flipPose(move, progress) }
  })
  const fields = Object.keys(REST_POSE) as (keyof StickPose)[]
  const tracks: Track[] = fields
    .filter((field) => samples.some((s) => s.pose[field] !== REST_POSE[field]))
    .map((field) => ({
      id: `${target}-${field}`,
      target,
      property: field,
      keyframes: samples.map((s) => ({ time: s.time, value: s.pose[field] })),
    }))
  if (options.height !== undefined && move.travel !== 0) {
    const facing = (options.facing ?? 1) < 0 ? -1 : 1
    tracks.push({
      id: `${target}-x`,
      target,
      property: 'x',
      keyframes: samples.map((s) => ({ time: s.time, value: (options.x ?? 0) + facing * flipTravel(move, s.progress, options.height!) })),
    })
  }
  return tracks
}

// ───────────────────────────────────────────────────────────────────────────
// The flips.
//
// Seen in profile (`view` 1) the figure faces +x, and a limb's angle spreads
// it toward its own side: forward is a negative angle for the left arm and leg
// and a positive one for the right. `lean` tips the body forward.
// ───────────────────────────────────────────────────────────────────────────

/** Wind up: knees bent, arms back, leaning in. */
const WIND_UP: Partial<StickPose> = {
  leftHip: -55, leftKnee: -95, rightHip: 55, rightKnee: 95,
  leftShoulder: 45, rightShoulder: -45, leftElbow: 10, rightElbow: -10,
  lean: 22, stretch: 0.94, headTilt: 6,
}

/** Take off: legs straight, toes pointed, arms swung up overhead. */
const TAKE_OFF: Partial<StickPose> = {
  leftHip: 0, leftKnee: 0, rightHip: 0, rightKnee: 0, leftAnkle: 55, rightAnkle: 55,
  leftShoulder: -172, rightShoulder: 172, leftElbow: 0, rightElbow: 0,
  lean: 0, stretch: 1.08, headTilt: 0,
}

/** Tuck: knees to the chest, hands on the shins, chin in. */
const TUCK: Partial<StickPose> = {
  leftHip: -128, leftKnee: -152, rightHip: 128, rightKnee: 152, leftAnkle: 30, rightAnkle: 30,
  leftShoulder: -78, rightShoulder: 78, leftElbow: -48, rightElbow: 48,
  lean: 26, stretch: 1, headTilt: 14,
}

/** Opening out to land: legs reach down, arms forward for balance. */
const OPEN: Partial<StickPose> = {
  leftHip: -22, leftKnee: -30, rightHip: 22, rightKnee: 30, leftAnkle: 10, rightAnkle: 10,
  leftShoulder: -125, rightShoulder: 125, leftElbow: 0, rightElbow: 0,
  lean: 8, headTilt: 0,
}

/** Landing: absorb in a crouch, arms forward. */
const LAND: Partial<StickPose> = {
  leftHip: -58, leftKnee: -100, rightHip: 58, rightKnee: 100, leftAnkle: 0, rightAnkle: 0,
  leftShoulder: -80, rightShoulder: 80, leftElbow: -10, rightElbow: 10,
  lean: 20, stretch: 0.93,
}

/** A flip seen in profile: wind up, take off, `air` keys, open, land, stand. */
function profileFlip(label: string, spin: number, height: number, travel: number, air: FlipKey[], duration = 1300): Flip {
  return {
    label,
    view: 1,
    spin,
    height,
    travel,
    takeoff: 0.27,
    landing: 0.8,
    duration,
    keys: [
      { at: 0, reset: true },
      { at: 0.16, pose: WIND_UP },
      { at: 0.27, pose: TAKE_OFF, easing: 'ease-out-quad' },
      ...air,
      { at: 0.76, pose: OPEN },
      { at: 0.86, pose: LAND, easing: 'ease-out-quad' },
      { at: 1, reset: true },
    ],
  }
}

/**
 * Ready-made flips and leaps. Each is plain data: copy one and change it to
 * make your own. Side flips, cartwheels and toe touches are seen front-on,
 * the rest in profile.
 */
export const FLIPS = {
  frontFlip: profileFlip('Front flip (tuck)', 360, 0.56, 0.35, [
    { at: 0.38, pose: TUCK, easing: 'ease-out-cubic' },
    { at: 0.64, pose: TUCK },
  ]),
  backFlip: profileFlip('Back flip (tuck)', -360, 0.58, -0.15, [
    { at: 0.36, pose: { ...TUCK, lean: 18 }, easing: 'ease-out-cubic' },
    { at: 0.64, pose: { ...TUCK, lean: 18 } },
  ]),
  layout: profileFlip('Back layout (straight body)', -360, 0.66, -0.2, [
    // Arched, arms overhead, legs together and long.
    { at: 0.4, pose: { leftHip: 8, rightHip: -8, leftKnee: 0, rightKnee: 0, leftAnkle: 60, rightAnkle: 60, leftShoulder: -178, rightShoulder: 178, lean: -18, headTilt: -14 } },
    { at: 0.64, pose: { leftHip: -4, rightHip: 4, lean: -6, headTilt: -4, leftShoulder: -150, rightShoulder: 150 } },
  ], 1400),
  scissorFlip: profileFlip('Scissor flip', 360, 0.6, 0.45, [
    // The legs scissor through the turn: left kicks high, then they switch.
    { at: 0.36, pose: { leftHip: -105, leftKnee: 0, rightHip: -40, rightKnee: -20, leftAnkle: 50, rightAnkle: 50, leftShoulder: -150, rightShoulder: 150, leftElbow: 0, rightElbow: 0, lean: 12 }, easing: 'ease-out-cubic' },
    { at: 0.52, pose: { leftHip: 40, leftKnee: 20, rightHip: 105, rightKnee: 0, leftShoulder: -140, rightShoulder: 140 } },
    { at: 0.66, pose: { leftHip: -30, leftKnee: -20, rightHip: 30, rightKnee: 20, leftShoulder: -110, rightShoulder: 110, lean: 6 } },
  ]),
  sideFlip: {
    label: 'Side flip (tuck)',
    view: 0,
    spin: 360,
    height: 0.55,
    travel: 0.4,
    takeoff: 0.27,
    landing: 0.8,
    duration: 1300,
    keys: [
      { at: 0, reset: true },
      { at: 0.16, pose: { leftHip: 22, rightHip: 22, leftKnee: 44, rightKnee: 44, leftShoulder: 20, rightShoulder: 20, lean: -10, stretch: 0.94 } },
      { at: 0.27, pose: { leftHip: 4, rightHip: 4, leftKnee: 0, rightKnee: 0, leftAnkle: 55, rightAnkle: 55, leftShoulder: 165, rightShoulder: 165, lean: 6, stretch: 1.08 }, easing: 'ease-out-quad' },
      { at: 0.38, pose: { leftHip: 105, rightHip: 105, leftKnee: 135, rightKnee: 135, leftShoulder: 40, rightShoulder: 40, leftElbow: -95, rightElbow: -95, lean: 0, stretch: 1, headTilt: 10 }, easing: 'ease-out-cubic' },
      { at: 0.64, pose: {} },
      { at: 0.76, pose: { leftHip: 20, rightHip: 20, leftKnee: 20, rightKnee: 20, leftAnkle: 10, rightAnkle: 10, leftShoulder: 100, rightShoulder: 100, leftElbow: 0, rightElbow: 0, headTilt: 0 } },
      { at: 0.86, pose: { leftHip: 24, rightHip: 24, leftKnee: 48, rightKnee: 48, leftAnkle: 0, rightAnkle: 0, leftShoulder: 70, rightShoulder: 70, stretch: 0.93 }, easing: 'ease-out-quad' },
      { at: 1, reset: true },
    ],
  },
  cartwheel: {
    label: 'Cartwheel',
    view: 0,
    spin: 360,
    // Upside down half way round, the hands (arms overhead) just reach the ground.
    height: 0.155,
    travel: 0.9,
    takeoff: 0.2,
    landing: 0.86,
    duration: 1600,
    keys: [
      { at: 0, reset: true },
      { at: 0.12, pose: { leftShoulder: 165, rightShoulder: 165, rightHip: 30, rightKnee: 0, lean: -6 } },
      { at: 0.24, pose: { leftShoulder: 172, rightShoulder: 172, leftHip: 55, rightHip: 55, leftKnee: 0, rightKnee: 0, leftAnkle: 40, rightAnkle: 40, lean: 0 } },
      { at: 0.75, pose: {} },
      { at: 0.9, pose: { leftHip: 30, rightHip: 12, leftAnkle: 0, rightAnkle: 0, leftShoulder: 150, rightShoulder: 150 } },
      { at: 1, reset: true },
    ],
  },
  // Leaps: no turn, the shape is the trick.
  splitLeap: profileFlip('Split leap (grand jeté)', 0, 0.36, 0.9, [
    // A front split in the air: front leg reaching, back leg long, arms open.
    { at: 0.4, pose: { leftHip: -96, rightHip: -84, leftKnee: 0, rightKnee: 0, leftAnkle: 55, rightAnkle: 55, leftShoulder: -130, rightShoulder: -105, leftElbow: 0, rightElbow: 0, lean: 4, headTilt: -6 }, easing: 'ease-out-cubic' },
    { at: 0.64, pose: { lean: 2 } },
  ]),
  toeTouch: {
    label: 'Toe touch (straddle jump)',
    view: 0,
    spin: 0,
    height: 0.36,
    travel: 0,
    takeoff: 0.27,
    landing: 0.8,
    duration: 1200,
    keys: [
      { at: 0, reset: true },
      { at: 0.16, pose: { leftHip: 22, rightHip: 22, leftKnee: 44, rightKnee: 44, leftShoulder: -20, rightShoulder: -20, stretch: 0.94 } },
      { at: 0.27, pose: { leftHip: 4, rightHip: 4, leftKnee: 0, rightKnee: 0, leftAnkle: 55, rightAnkle: 55, leftShoulder: 170, rightShoulder: 170, stretch: 1.06 }, easing: 'ease-out-quad' },
      // Legs straddled up past level, hands reaching out toward the toes.
      { at: 0.42, pose: { leftHip: 104, rightHip: 104, leftShoulder: 96, rightShoulder: 96, leftElbow: 0, rightElbow: 0, stretch: 1, headTilt: 0 }, easing: 'ease-out-cubic' },
      { at: 0.62, pose: {} },
      { at: 0.76, pose: { leftHip: 12, rightHip: 12, leftAnkle: 10, rightAnkle: 10, leftShoulder: 120, rightShoulder: 120 } },
      { at: 0.86, pose: { leftHip: 22, rightHip: 22, leftKnee: 44, rightKnee: 44, leftAnkle: 0, rightAnkle: 0, leftShoulder: 60, rightShoulder: 60, stretch: 0.94 }, easing: 'ease-out-quad' },
      { at: 1, reset: true },
    ],
  },
  backHandspring: profileFlip('Back handspring', -360, 0.16, -0.7, [
    // Arms reach back overhead to the ground, legs snap over.
    { at: 0.38, pose: { leftHip: 10, rightHip: -10, leftKnee: 0, rightKnee: 0, leftShoulder: -178, rightShoulder: 178, lean: -26, headTilt: -20 } },
    { at: 0.6, pose: { leftHip: -40, rightHip: 40, leftKnee: -20, rightKnee: 20, lean: 6, headTilt: 0 } },
  ], 1200),
} satisfies Record<string, Flip>

export type FlipName = keyof typeof FLIPS
