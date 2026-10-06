import { REST_POSE, strideLength, walkPose, type StickPose } from './stick-figure'

/**
 * Gaits with personality: how a stick figure walks, as plain data.
 *
 * A gait is a handful of numbers (how far the legs swing, how high the knee
 * lifts, how the arms pump, how much the body bobs), so gaits serialize,
 * blend and can be invented without code. `gaitPose()` turns one into a pose
 * at a phase of the cycle (0 → 1 is one full cycle, two steps), the same way
 * `walkPose()` does for the plain walk.
 *
 * On a `stickFigureTarget`, the `gait` prop picks one by name: a string
 * track (`{ time: 4000, value: 'sneak' }`) switches gait mid-scene.
 */
export interface Gait {
  /** Thigh swing either side of vertical, degrees */
  swing: number
  /** How far the knee of the leg swinging forward lifts, degrees */
  knee: number
  /** Arm swing either side, degrees (arms raised above 40° keep their pose) */
  arm: number
  /** Forearm follow-through at the front of the swing, degrees */
  elbow: number
  /** Forearms held bent forward by this much throughout: pumping running arms, sneaking paws (degrees) */
  forearm?: number
  /** Upper arms held raised forward by this much (sneaking paws up), degrees */
  shoulder?: number
  /** Forward lean, degrees */
  lean: number
  /** Line of action: the spine curled forward (+) or the chest out (−), degrees */
  bend?: number
  /** Head tilt added, degrees (+ down when facing right) */
  headTilt?: number
  /** Lift off the ground at the passing position, fraction of the height (a bounce, a run's flight) */
  bounce?: number
  /** Bobs per step: 1, or 2 for the double bounce */
  bounces?: number
  /** Stretch on the way up and squash on the way down, 0..0.2 */
  squash?: number
  /** Knees always bent this much: a crouch, degrees */
  crouch?: number
  /** Toes pointed down (tiptoe), degrees */
  tiptoe?: number
  /** Side-to-side sway of the upper body, degrees (a strut, a waddle) */
  sway?: number
}

/**
 * Ready-made gaits. `walk` matches `walkPose()` exactly.
 * - `bouncy`: springs up on every step, arms swinging high.
 * - `doubleBounce`: the classic cartoon walk, two bobs a step.
 * - `sneak`: tiptoeing in a crouch, knees high, paws up.
 * - `strut`: chest out, head high, a swagger.
 * - `tired`: slumped, dragging, arms hanging.
 * - `run`: leaning in, knees high, arms pumping, off the ground between steps.
 */
export const GAITS = {
  walk: { swing: 24, knee: 30, arm: 22, elbow: 28, lean: 4 },
  bouncy: { swing: 26, knee: 45, arm: 34, elbow: 30, lean: 2, bend: -4, bounce: 0.035, squash: 0.06 },
  doubleBounce: { swing: 22, knee: 40, arm: 26, elbow: 24, lean: 3, bounce: 0.02, bounces: 2, squash: 0.04 },
  sneak: { swing: 28, knee: 70, arm: 6, elbow: 0, forearm: 110, shoulder: 55, lean: 16, bend: 14, headTilt: -8, crouch: 50, tiptoe: 25 },
  strut: { swing: 26, knee: 30, arm: 30, elbow: 20, lean: -4, bend: -10, headTilt: -6, sway: 4, bounce: 0.01 },
  tired: { swing: 14, knee: 14, arm: 6, elbow: 6, lean: 10, bend: 16, headTilt: 12 },
  run: { swing: 40, knee: 95, arm: 45, elbow: 0, forearm: 90, lean: 16, bend: 6, bounce: 0.05, squash: 0.06 },
} satisfies Record<string, Gait>

export type GaitName = keyof typeof GAITS

/** Arms raised further than this (degrees) keep their pose while walking, as in walkPose. */
const SWINGING_ARM_LIMIT = 40

/** A gait by name or as data; an unknown name is the plain walk. */
export function resolveGait(gait: GaitName | Gait | string | undefined): Gait {
  if (gait === undefined) return GAITS.walk
  if (typeof gait === 'string') return (GAITS as Record<string, Gait>)[gait] ?? GAITS.walk
  return gait
}

/**
 * The pose `phase` cycles into a gait (0 → 1 is two steps), built on `base`:
 * the legs and hanging arms move, raised arms and the face keep `base`'s
 * pose. `stride` scales the swing. The plain `walk` gait is `walkPose()`.
 */
export function gaitPose(gait: GaitName | Gait | string | undefined, phase: number, base: StickPose = REST_POSE, stride = 1): StickPose {
  const spec = resolveGait(gait)
  if (spec === GAITS.walk) return walkPose(phase, base, stride)
  const angle = phase * Math.PI * 2
  const swing = Math.sin(angle) * stride
  const lift = Math.cos(angle) * stride
  const swings = (shoulder: number) => shoulder <= SWINGING_ARM_LIMIT
  // Paws held up (sneak) start from the held angle. Forward is negative for the
  // left limbs and positive for the right (angles run outward per side), so the
  // same swing moves the two arms opposite ways, against the legs.
  const held = spec.shoulder ?? 0
  const armSwing = (shoulder: number, forward: number) => (swings(shoulder) ? forward * held + spec.arm * swing : shoulder)
  const forearm = spec.forearm ?? 0
  const leftElbow = swings(base.leftShoulder) ? base.leftElbow - forearm - spec.elbow * Math.max(0, -swing) : base.leftElbow
  const rightElbow = swings(base.rightShoulder) ? base.rightElbow + forearm + spec.elbow * Math.max(0, swing) : base.rightElbow
  // The bob peaks as the legs pass each other (swing 0), once or twice a step.
  const bobs = spec.bounces ?? 1
  const bob = (1 + Math.cos(angle * 2 * bobs)) / 2
  const crouch = spec.crouch ?? 0
  return {
    ...base,
    lean: base.lean + spec.lean * stride + (spec.sway ?? 0) * Math.sin(angle) * (1 - (base.turn ?? 0)),
    bend: (base.bend ?? 0) + (spec.bend ?? 0),
    headTilt: base.headTilt - spec.lean * 0.5 * stride + (spec.headTilt ?? 0),
    leftElbow,
    rightElbow,
    // A crouch brings both thighs forward and folds both shins back.
    leftHip: -spec.swing * swing - crouch * 0.5,
    rightHip: -spec.swing * swing + crouch * 0.5,
    // The leg swinging forward lifts its knee; a crouch keeps both bent. A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -spec.knee * Math.max(0, lift) - crouch,
    rightKnee: spec.knee * Math.max(0, -lift) + crouch,
    leftAnkle: (base.leftAnkle ?? 0) + (spec.tiptoe ?? 0),
    rightAnkle: (base.rightAnkle ?? 0) + (spec.tiptoe ?? 0),
    leftShoulder: armSwing(base.leftShoulder, -1),
    rightShoulder: armSwing(base.rightShoulder, 1),
    rise: (base.rise ?? 0) + (spec.bounce ?? 0) * stride * bob,
    stretch: base.stretch * (1 + (spec.squash ?? 0) * (bob - 0.5)),
  }
}

/**
 * Ground covered by one cycle of a gait (two steps) for a figure `height` px
 * tall. Move the figure this far per unit of phase and its feet stay planted.
 */
export function gaitStrideLength(gait: GaitName | Gait | string | undefined, height: number, stride = 1): number {
  const spec = resolveGait(gait)
  // strideLength is for the walk's swing; scale by how far this gait's feet reach instead.
  const walk = GAITS.walk.swing
  const sin = (degrees: number) => Math.sin((degrees * Math.PI) / 180)
  return (strideLength(height, stride) * sin(spec.swing * stride)) / sin(walk * stride)
}
