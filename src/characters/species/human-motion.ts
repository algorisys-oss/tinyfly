import type { EasingType } from '../../engine/types'
import type { Pose } from '../rig/body-plan'
import type { CharacterPoseKey } from '../character'
import { resolveGait, type Gait, type GaitName } from '../gaits'
import { HUMAN_EXPRESSIONS, HUMAN_REST, humanPose } from './human'

/**
 * Native motion for the human body plan: gaits and gags posed in the
 * character's own frame (forward is the way it faces, in 3D), so they read
 * from any view (front, side, back, the other side) with no mirroring.
 *
 * Gaits come from the same data as the stick figure's (`GAITS`): one spec,
 * two rigs. Gags are written for this body: arms raise out to the sides,
 * knees tuck forward, the back curves (`bend`).
 */

/** Arms raised further than this (degrees out or forward) keep their pose while walking. */
const RAISED = 40
/** Thigh and shin, as fractions of the height (the human plan's). */
const LEG = 0.215 + 0.205

const both = (limb: 'arm' | 'leg', fields: Record<string, number>): Pose => {
  const out: Pose = {}
  for (const side of ['left', 'right']) for (const [key, value] of Object.entries(fields)) out[`${limb}.${side}.${key}`] = value
  return out
}
const field = (pose: Pose, key: string) => pose[key] ?? HUMAN_REST[key] ?? 0

/**
 * The pose `phase` cycles into a gait (0 → 1 is two steps), built on `base`:
 * legs and hanging arms move; raised arms, the face and the view keep
 * `base`'s. `stride` scales the swing.
 */
export function humanGaitPose(gait: GaitName | Gait | string | undefined, phase: number, base: Pose = HUMAN_REST, stride = 1): Pose {
  const spec = resolveGait(gait)
  const angle = phase * Math.PI * 2
  const swing = Math.sin(angle) * stride
  const lift = Math.cos(angle) * stride
  const bob = (1 + Math.cos(angle * 2 * (spec.bounces ?? 1))) / 2
  const crouch = spec.crouch ?? 0
  const held = spec.shoulder ?? 0
  const forearm = spec.forearm ?? 0
  const out: Pose = { ...HUMAN_REST, ...base }

  // Legs: the left foot comes forward while `swing` > 0; the leg passing forward lifts its knee.
  out['leg.left.swing'] = spec.swing * swing + crouch * 0.6
  out['leg.right.swing'] = -spec.swing * swing + crouch * 0.6
  out['leg.left.knee'] = spec.knee * Math.max(0, lift) + crouch * 1.2
  out['leg.right.knee'] = spec.knee * Math.max(0, -lift) + crouch * 1.2
  out['leg.left.ankle'] = field(base, 'leg.left.ankle') - (spec.tiptoe ?? 0)
  out['leg.right.ankle'] = field(base, 'leg.right.ankle') - (spec.tiptoe ?? 0)

  // Arms swing against the legs, unless raised (a wave, a point).
  for (const [side, sign] of [['left', -1], ['right', 1]] as const) {
    const raised = field(base, `arm.${side}.spread`) > RAISED || field(base, `arm.${side}.swing`) > RAISED
    if (raised) continue
    out[`arm.${side}.swing`] = held + sign * spec.arm * swing
    // The forearm follows through as the arm comes forward.
    out[`arm.${side}.elbow`] = field(base, `arm.${side}.elbow`) + forearm + spec.elbow * Math.max(0, sign * swing)
  }

  out.lean = field(base, 'lean') + spec.lean * stride
  out.bend = field(base, 'bend') + (spec.bend ?? 0)
  // The head stays level as the body leans in, then takes the gait's own carriage.
  out['head.nod'] = field(base, 'head.nod') - spec.lean * 0.5 * stride + (spec.headTilt ?? 0)
  out.side = field(base, 'side') + (spec.sway ?? 0) * Math.sin(angle)
  out.lift = field(base, 'lift') + (spec.bounce ?? 0) * stride * bob
  out.stretch = field(base, 'stretch') * (1 + (spec.squash ?? 0) * (bob - 0.5))
  return out
}

/**
 * Ground covered by one gait cycle (two steps) for a character `height` px
 * tall: the feet stay planted. `legLength` is the build's (see HUMAN_BUILDS).
 */
export function humanGaitStrideLength(gait: GaitName | Gait | string | undefined, height: number, stride = 1, legLength = 1): number {
  const spec = resolveGait(gait)
  return 4 * LEG * legLength * height * Math.sin((spec.swing * stride * Math.PI) / 180)
}

/** One step of a gag: when (ms in), what changes from the pose so far, and the ease into it. */
export interface HumanGagStep {
  after: number
  pose: Pose
  easing?: EasingType
}

const face = (name: keyof typeof HUMAN_EXPRESSIONS) => HUMAN_EXPRESSIONS[name]

/** The gags, each built on the pose it starts from. Same names and timing as the stick figure's `GAGS`. */
export const HUMAN_GAGS = {
  /** Squash down in a squint, shoot up stretched with arms flung up, hang, land squashed, end surprised. */
  take: (from: Pose): HumanGagStep[] => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: field(from, 'lean') - 4, ...both('arm', { spread: 6, swing: 0, elbow: 10 }), 'eye.left': 0.35, 'eye.right': 0.35, 'brow.left': -0.6, 'brow.right': -0.6, mouth: 0 }, easing: 'ease-in-out' },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { lift: 0.22, stretch: 1.35, bend: -14, ...both('arm', { spread: 150, bend: 35, swing: 0, elbow: 0 }), ...both('leg', { swing: 25, knee: 60 }), ...face('shocked') }, easing: 'ease-out-cubic' },
    { after: 720, pose: { lift: 0.25, stretch: 1.25, bend: -10, ...both('arm', { spread: 140 }) }, easing: 'ease-in-out' },
    { after: 900, pose: { lift: 0, stretch: 0.74, bend: 12, ...both('arm', { spread: 70, bend: 0 }), ...both('leg', { swing: 30, knee: 60 }) }, easing: 'ease-in-quad' },
    {
      after: 1060,
      pose: {
        stretch: 1.06,
        bend: -3,
        ...both('arm', { spread: 60 }),
        'leg.left.swing': field(from, 'leg.left.swing'),
        'leg.right.swing': field(from, 'leg.right.swing'),
        'leg.left.knee': field(from, 'leg.left.knee'),
        'leg.right.knee': field(from, 'leg.right.knee'),
      },
      easing: 'ease-out',
    },
    { after: 1260, pose: { stretch: field(from, 'stretch'), bend: field(from, 'bend'), ...face('surprised'), ...both('arm', { spread: 55, bend: 60 }) }, easing: 'ease-in-out' },
  ],
  /** Glance ahead, look away unbothered, then snap back in shock with a little hop. */
  doubleTake: (from: Pose): HumanGagStep[] => [
    { after: 160, pose: { lookX: 1, lookY: 0, 'head.turn': 0 }, easing: 'ease-out' },
    { after: 520, pose: { lookX: -0.6, 'head.turn': 30, 'head.nod': field(from, 'head.nod') - 4, smile: 0.6, mouth: 0 }, easing: 'ease-in-out' },
    { after: 1100, pose: { lookX: -0.6 } },
    { after: 1180, pose: { 'head.turn': 0, 'head.nod': field(from, 'head.nod') - 10, bend: field(from, 'bend') - 10, lift: 0.05, stretch: 1.18, ...face('shocked'), lookX: 1, lookY: 0 }, easing: 'ease-out-cubic' },
    { after: 1360, pose: { lift: 0, stretch: 0.88, 'head.nod': field(from, 'head.nod') - 4, bend: field(from, 'bend') + 4 }, easing: 'ease-in-quad' },
    { after: 1560, pose: { stretch: field(from, 'stretch'), 'head.nod': field(from, 'head.nod'), bend: field(from, 'bend') }, easing: { type: 'elastic', mode: 'out', amplitude: 1, period: 0.35 } },
  ],
  /** Rear back for a zip-off: lean back, a knee up, arms cocked; hold; pitch forward ready to run. */
  windUp: (): HumanGagStep[] => [
    {
      after: 220,
      pose: {
        lean: -18,
        bend: -16,
        'head.nod': -6,
        'arm.left.swing': 60,
        'arm.left.elbow': 100,
        'arm.right.swing': -40,
        'arm.right.elbow': 90,
        'leg.left.swing': 55,
        'leg.left.knee': 95,
        stretch: 0.92,
        ...face('angry'),
        lookX: 1,
      },
      easing: 'ease-out',
    },
    { after: 620, pose: { lean: -20, bend: -18, stretch: 0.9 } },
    { after: 700, pose: { lean: 28, bend: 14, 'head.nod': 6, 'arm.left.swing': -30, 'arm.right.swing': 60, 'leg.left.swing': -20, 'leg.left.knee': 30, 'leg.right.swing': 20, stretch: 1.12 }, easing: 'ease-out-cubic' },
  ],
  /** Coming down: stretched in the fall, squashed on contact, a spring back up. */
  land: (from: Pose): HumanGagStep[] => [
    { after: 120, pose: { lift: 0, stretch: 0.7, bend: 14, ...both('arm', { spread: 75 }), ...both('leg', { swing: 25, knee: 50 }) }, easing: 'ease-in-quad' },
    { after: 300, pose: { stretch: 1.05, bend: -4, 'arm.left.spread': field(from, 'arm.left.spread'), 'arm.right.spread': field(from, 'arm.right.spread') }, easing: 'ease-out' },
    { after: 460, pose: { lift: 0, stretch: field(from, 'stretch'), bend: field(from, 'bend'), ...both('leg', { swing: 0, knee: 0 }) }, easing: 'ease-in-out' },
  ],
  /** A frightened shiver: paws up, fast small shakes side to side, then still. */
  tremble: (from: Pose): HumanGagStep[] => {
    const steps: HumanGagStep[] = [{ after: 80, pose: { ...face('scared'), ...both('arm', { swing: 40, elbow: 110, spread: 14 }), stretch: 0.94, bend: field(from, 'bend') + 8 }, easing: 'ease-out' }]
    for (let i = 1; i <= 14; i++) {
      const way = i % 2 === 0 ? 1 : -1
      steps.push({ after: 80 + i * 45, pose: { side: field(from, 'side') + 2.5 * way, 'head.tilt': field(from, 'head.tilt') - 2 * way } })
    }
    steps.push({ after: 80 + 15 * 45, pose: { side: field(from, 'side'), 'head.tilt': field(from, 'head.tilt'), bend: field(from, 'bend') } })
    return steps
  },
  /** A sigh: the body sags, the back curls, the head and arms drop. */
  deflate: (from: Pose): HumanGagStep[] => [
    { after: 260, pose: { stretch: 1.04, 'head.nod': field(from, 'head.nod') - 4, 'brow.left': 0.3, 'brow.right': 0.3 }, easing: 'ease-in-out' },
    { after: 900, pose: { ...face('sad'), bend: 18, stretch: 0.92, lean: field(from, 'lean') + 5, 'head.nod': 14, ...both('arm', { spread: 6, swing: 0, elbow: 4, bend: 0 }) }, easing: 'ease-in-out' },
  ],
} satisfies Record<string, (from: Pose) => HumanGagStep[]>

export type HumanGagName = keyof typeof HUMAN_GAGS

/**
 * A gag's key poses from `at`, built on the pose it starts from (its view
 * kept). Keys after the first are `act: false`: a gag's timing is already acted.
 */
export function humanGag(name: HumanGagName, options: { at: number; from?: Pose; speed?: number }): Array<CharacterPoseKey & { pose: Pose }> {
  const from = humanPose(options.from ?? {})
  const scale = options.speed ?? 1
  let pose = from
  return [
    { time: options.at, pose: from },
    ...HUMAN_GAGS[name](from).map((step) => {
      pose = { ...pose, ...step.pose }
      return { time: options.at + step.after * scale, pose, act: false, ...(step.easing ? { easing: step.easing } : {}) }
    }),
  ]
}
