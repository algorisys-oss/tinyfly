import type { EasingType } from '../../engine/types'
import { EXPRESSIONS, POSES, REST_POSE, type PoseKey, type PoseName, type StickPose } from '../stick-figure'

/**
 * Cartoon gags as data: short, already-timed sequences of stick-figure poses
 * that splice into a list of keys. Their timing is the gag (a held wind-up, a
 * zip, a squash on landing), so their keys are marked `act: false` and the
 * acting pass leaves them as written.
 *
 * ```ts
 * const keys = [
 *   { time: 0, pose: 'rest' },
 *   ...gag('take', { at: 800 }),
 *   { time: 3000, pose: 'shrug' },
 * ]
 * actTracks('hero', keys, { style: 'snappy' })
 * ```
 */

/** One step of a gag: when (ms after it starts), what changes from the pose it starts on, and the ease into it. */
export interface GagStep {
  after: number
  pose: Partial<StickPose>
  easing?: EasingType
}

const shocked = EXPRESSIONS.shocked
const scared = EXPRESSIONS.scared

/**
 * The gags, each built on the pose it starts from (so a take works sitting,
 * turned or mid-wave). Each ends on a pose the next key can move on from.
 */
export const GAGS = {
  /** The classic take: squash down in a squint, then shoot up stretched with eyes popping, hang, and land squashed. */
  take: (from: StickPose): GagStep[] => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: from.lean - 4, leftShoulder: 8, rightShoulder: 8, leftEye: 0.35, rightEye: 0.35, leftBrow: -0.6, rightBrow: -0.6, mouth: 0 }, easing: 'ease-in-out' },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { rise: 0.22, stretch: 1.35, bend: -14, leftShoulder: 150, rightShoulder: 150, leftElbow: 35, rightElbow: 35, leftHip: 22, rightHip: 22, leftKnee: 45, rightKnee: 45, ...shocked, headTilt: 0 }, easing: 'ease-out-cubic' },
    { after: 720, pose: { rise: 0.25, stretch: 1.25, bend: -10, leftShoulder: 140, rightShoulder: 140 }, easing: 'ease-in-out' },
    { after: 900, pose: { rise: 0, stretch: 0.74, bend: 12, leftShoulder: 70, rightShoulder: 70, leftHip: 18, rightHip: 18, leftKnee: 30, rightKnee: 30 }, easing: 'ease-in-quad' },
    { after: 1060, pose: { stretch: 1.06, bend: -3, leftShoulder: 60, rightShoulder: 60, leftHip: from.leftHip, rightHip: from.rightHip, leftKnee: from.leftKnee, rightKnee: from.rightKnee }, easing: 'ease-out' },
    { after: 1260, pose: { stretch: from.stretch, bend: from.bend, ...EXPRESSIONS.surprised, leftShoulder: 70, rightShoulder: 70, leftElbow: 60, rightElbow: 60 }, easing: 'ease-in-out' },
  ],
  /** Glance at something, look away unbothered, then snap back to it in shock. */
  doubleTake: (from: StickPose): GagStep[] => [
    { after: 160, pose: { lookX: 1, lookY: 0 }, easing: 'ease-out' },
    { after: 520, pose: { lookX: -0.6, headTilt: from.headTilt - 4, smile: 0.6, mouth: 0 }, easing: 'ease-in-out' },
    { after: 1100, pose: { lookX: -0.6 } },
    { after: 1180, pose: { bend: from.bend - 10, headTilt: from.headTilt + 10, rise: 0.05, stretch: 1.18, ...shocked, lookX: 1, lookY: 0 }, easing: 'ease-out-cubic' },
    { after: 1360, pose: { rise: 0, stretch: 0.88, bend: from.bend + 4, headTilt: from.headTilt + 4 }, easing: 'ease-in-quad' },
    { after: 1560, pose: { stretch: from.stretch, bend: from.bend, headTilt: from.headTilt }, easing: { type: 'elastic', mode: 'out', amplitude: 1, period: 0.35 } },
  ],
  /** Rear back for a zip-off: lean back, one knee up, arms cocked, hold, then pitch forward ready to run. */
  windUp: (): GagStep[] => [
    { after: 220, pose: { lean: -18, bend: -16, headTilt: -6, leftShoulder: 70, leftElbow: -100, rightShoulder: 40, rightElbow: 100, leftHip: -45, leftKnee: -80, stretch: 0.92, ...EXPRESSIONS.angry, lookX: 1 }, easing: 'ease-out' },
    { after: 620, pose: { lean: -20, bend: -18, stretch: 0.9 } },
    { after: 700, pose: { lean: 28, bend: 14, headTilt: 6, leftShoulder: 30, rightShoulder: 60, leftHip: 30, leftKnee: -30, rightHip: -20, stretch: 1.12 }, easing: 'ease-out-cubic' },
  ],
  /** Coming down to the ground: stretched in the fall, squashed on contact, a spring back up. */
  land: (from: StickPose): GagStep[] => [
    { after: 120, pose: { rise: 0, stretch: 0.7, bend: 14, leftShoulder: 75, rightShoulder: 75, leftHip: 20, rightHip: 20, leftKnee: 35, rightKnee: 35 }, easing: 'ease-in-quad' },
    { after: 300, pose: { stretch: 1.05, bend: -4, leftShoulder: from.leftShoulder, rightShoulder: from.rightShoulder }, easing: 'ease-out' },
    { after: 460, pose: { rise: 0, stretch: from.stretch, bend: from.bend, leftHip: REST_POSE.leftHip, rightHip: REST_POSE.rightHip, leftKnee: 0, rightKnee: 0 }, easing: 'ease-in-out' },
  ],
  /** A frightened shiver: small, fast shakes with wide eyes, then still. */
  tremble: (from: StickPose): GagStep[] => {
    const steps: GagStep[] = [{ after: 80, pose: { ...scared, bend: from.bend + 8, leftShoulder: 40, rightShoulder: 40, leftElbow: 110, rightElbow: 110, stretch: 0.94 }, easing: 'ease-out' }]
    for (let i = 1; i <= 14; i++) steps.push({ after: 80 + i * 45, pose: { lean: from.lean + (i % 2 === 0 ? 2.5 : -2.5), headTilt: from.headTilt + (i % 2 === 0 ? -2 : 2) } })
    steps.push({ after: 80 + 15 * 45, pose: { lean: from.lean, headTilt: from.headTilt, bend: from.bend } })
    return steps
  },
  /** A sigh: the body sags, shoulders drop, head and eyes go down. */
  deflate: (from: StickPose): GagStep[] => [
    { after: 260, pose: { stretch: 1.04, headTilt: from.headTilt + 4, leftBrow: 0.3, rightBrow: 0.3 }, easing: 'ease-in-out' },
    { after: 900, pose: { ...POSES.sad, bend: 18, stretch: 0.92, lean: from.lean + 5, turn: from.turn, sit: from.sit }, easing: 'ease-in-out' },
  ],
} satisfies Record<string, (from: StickPose) => GagStep[]>

export type GagName = keyof typeof GAGS

export interface GagOptions {
  /** When the gag starts, ms */
  at: number
  /** The pose it starts on: a name or a full pose (default rest) */
  from?: PoseName | StickPose
  /** Time scale: 1 as designed, 2 twice as long (default 1) */
  speed?: number
}

/** The keys of a gag, starting at `at` on the pose it starts from; splice them into a key list. */
export function gag(name: GagName, options: GagOptions): PoseKey[] {
  const from = typeof options.from === 'string' ? POSES[options.from] : options.from ?? REST_POSE
  const scale = options.speed ?? 1
  let pose = from
  return [
    // The move onto the starting pose is acted like any other; the gag itself is not.
    { time: options.at, pose: from },
    ...GAGS[name](from).map((step): PoseKey => {
      pose = { ...pose, ...step.pose }
      return { time: options.at + step.after * scale, pose, act: false, ...(step.easing ? { easing: step.easing } : {}) }
    }),
  ]
}

/** How long a gag lasts at a speed, ms. */
export function gagDuration(name: GagName, speed = 1): number {
  const steps = GAGS[name](REST_POSE)
  return steps[steps.length - 1].after * speed
}
