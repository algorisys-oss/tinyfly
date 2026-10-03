import type { BodyPlan, BoneAngles, ChainSpec, Pose } from '../rig/body-plan'
import { EXPRESSIONS, type ExpressionName } from '../stick-figure'

/**
 * The human body plan for the v2 character system: a two-bone spine, a neck,
 * two arms and two legs with feet, and a head.
 *
 * Pose fields (degrees unless noted):
 * - `turn`: 0 faces the viewer, 1 faces screen-right, 2 shows the back, 3 faces screen-left
 * - `lean` (forward +), `side` (toward the character's left +): the upper body
 * - `head.turn` (toward its left +), `head.nod` (down +), `head.tilt` (toward its left shoulder +)
 * - `arm.left.swing` (forward +), `arm.left.spread` (out +), `arm.left.elbow`
 *   (forearm forward +), `arm.left.bend` (forearm out +), and the same for `.right`
 * - `leg.left.swing` (forward +), `leg.left.spread` (out +), `leg.left.knee`
 *   (shin back +), `leg.left.ankle` (toes up +), and the same for `.right`
 * - `stretch` (1 normal), `lift` (fraction of height above the ground), `roll` (whole-figure roll, degrees)
 * - the face: `mouth`, `smile`, `mouthWidth`, `blink`, `eye.left`, `eye.right`,
 *   `brow.left`, `brow.right`, `browTilt`, `lookX`, `lookY` (as the v1 stick figure)
 *
 * The character's left is +x: facing the viewer its left arm is on screen-right.
 */

export interface HumanBuild {
  /** Head diameter, fraction of the height (default 0.3, the bold look) */
  headSize?: number
  /** Half the shoulder width, fraction of the height (0: both arms from one point) */
  shoulderWidth?: number
  /** Half the hip width, fraction of the height (0: both legs from one point) */
  hipWidth?: number
}

const THIGH = 0.215
const SHIN = 0.205
const FOOT = 0.065
const NECK = 0.035
const UPPER_ARM = 0.165
const FOREARM = 0.155
/** Shoulders sit this far below the top of the spine (fraction of height) */
const SHOULDER_DROP = 0.035
/** Feet turn out from straight ahead, degrees */
const TOE_OUT = 12

export const HUMAN_REST: Pose = {
  turn: 0,
  lean: 0,
  side: 0,
  'head.turn': 0,
  'head.nod': 0,
  'head.tilt': 0,
  'arm.left.swing': 0,
  'arm.left.spread': 12,
  'arm.left.elbow': 8,
  'arm.left.bend': 0,
  'arm.right.swing': 0,
  'arm.right.spread': 12,
  'arm.right.elbow': 8,
  'arm.right.bend': 0,
  'leg.left.swing': 0,
  'leg.left.spread': 3,
  'leg.left.knee': 0,
  'leg.left.ankle': 0,
  'leg.right.swing': 0,
  'leg.right.spread': 3,
  'leg.right.knee': 0,
  'leg.right.ankle': 0,
  stretch: 1,
  lift: 0,
  roll: 0,
  mouth: 0,
  smile: 0.5,
  mouthWidth: 1,
  blink: 0,
  'eye.left': 1,
  'eye.right': 1,
  'brow.left': 0,
  'brow.right': 0,
  browTilt: 0,
  lookX: 0,
  lookY: 0,
}

/** A full human pose from the fields that differ from rest. */
export function humanPose(changes: Pose = {}): Pose {
  return { ...HUMAN_REST, ...changes }
}

/** Both arms or both legs at once: `both('arm', { spread: 40 })`. */
function both(limb: 'arm' | 'leg', fields: Record<string, number>): Pose {
  const out: Pose = {}
  for (const side of ['left', 'right']) for (const [key, value] of Object.entries(fields)) out[`${limb}.${side}.${key}`] = value
  return out
}

/**
 * Ready-made human poses. Several rest on something other than the feet (a
 * knee, the hands, the back): the figure is set down on whatever is lowest.
 */
export const HUMAN_POSES = {
  rest: HUMAN_REST,
  wave: humanPose({ 'arm.right.spread': 115, 'arm.right.bend': 55, 'arm.right.elbow': 0, 'head.tilt': -6, smile: 0.9 }),
  cheer: humanPose({ ...both('arm', { spread: 140, bend: 20, elbow: 0 }), mouth: 0.6, smile: 1, 'eye.left': 0, 'eye.right': 0 }),
  point: humanPose({ 'arm.right.spread': 88, 'arm.right.elbow': 0, 'arm.right.bend': 0, 'head.turn': -20, smile: 0.4 }),
  handsOnHips: humanPose({ ...both('arm', { spread: 50, bend: -105, elbow: 0 }), ...both('leg', { spread: 9 }), smile: 0.8 }),
  think: humanPose({ 'arm.right.spread': 22, 'arm.right.bend': -150, 'arm.right.elbow': 0, 'head.tilt': 10, lookX: -0.5, lookY: -0.8, smile: 0 }),
  shrug: humanPose({ ...both('arm', { spread: 35, bend: 75, elbow: 0 }), 'head.tilt': -10, smile: -0.2 }),
  sit: humanPose({ ...both('leg', { swing: 90, knee: 90, spread: 4 }), ...both('arm', { swing: 25, elbow: 45, spread: 8 }) }),
  kneel: humanPose({
    'leg.left.swing': 90,
    'leg.left.knee': 90,
    // The back thigh leans back a little so its knee meets the ground beside the
    // front foot; the shin slopes up from it and the foot points down to tucked toes.
    'leg.right.swing': -18,
    'leg.right.knee': 108,
    'leg.right.ankle': 16,
    ...both('arm', { swing: 20, elbow: 30 }),
  }),
  crouch: humanPose({ ...both('leg', { swing: 75, knee: 140, spread: 6 }), lean: 25, ...both('arm', { swing: 50, elbow: 40 }), 'head.nod': -15 }),
  // On hands and knees: the back nearly level, arms straight down, the toes
  // pointed back along the ground.
  crawl: humanPose({ lean: 82, 'head.nod': -35, ...both('arm', { swing: 80, elbow: 0, spread: 4 }), ...both('leg', { knee: 92, ankle: -88 }) }),
  lieDown: humanPose({ roll: 90, ...both('arm', { spread: 8 }), 'head.nod': 0 }),
} satisfies Record<string, Pose>

export type HumanPoseName = keyof typeof HUMAN_POSES

/** A human body plan; the same pose fields work on every build. */
export function humanPlan(build: HumanBuild = {}): BodyPlan {
  const headSize = build.headSize ?? 0.3
  const shoulder = build.shoulderWidth ?? 0.06
  const hip = build.hipWidth ?? 0.022
  const spine = Math.max(0.12, 1 - headSize - NECK - (THIGH + SHIN))

  const arm = (side: 'left' | 'right'): ChainSpec => ({
    id: `arm.${side}`,
    parent: 'spine',
    offset: [(side === 'left' ? 1 : -1) * shoulder, -SHOULDER_DROP, 0],
    rest: [0, -1, 0],
    side: side === 'left' ? 1 : -1,
    bones: [
      { length: UPPER_ARM, width: [1.25, 0.9] },
      { length: FOREARM, width: [0.9, 0.75] },
    ],
  })
  const leg = (side: 'left' | 'right'): ChainSpec => ({
    id: `leg.${side}`,
    parent: null,
    offset: [(side === 'left' ? 1 : -1) * hip, 0, 0],
    rest: [0, -1, 0],
    side: side === 'left' ? 1 : -1,
    bones: [
      { length: THIGH, width: [1.45, 1.05] },
      { length: SHIN, width: [1.05, 0.85] },
      { length: FOOT, width: [0.95, 0.7] },
    ],
  })

  const field = (pose: Pose, key: string) => pose[key] ?? HUMAN_REST[key] ?? 0

  return {
    id: 'human',
    hipHeight: THIGH + SHIN,
    // Tie order: legs, then the body, then the arms (in front of the chest unless turned away), then the head.
    chains: [
      leg('left'),
      leg('right'),
      {
        id: 'spine',
        parent: null,
        rest: [0, 1, 0],
        bones: [
          { length: spine / 2, width: [1.7, 1.4] },
          { length: spine / 2, width: [1.4, 1.1] },
        ],
      },
      { id: 'neck', parent: 'spine', rest: [0, 1, 0], bones: [{ length: NECK, width: [1, 0.9] }] },
      arm('left'),
      arm('right'),
    ],
    head: { on: 'neck', size: headSize },
    contacts: [
      ...(['left', 'right'] as const).flatMap((side) => [
        { chain: `leg.${side}`, joint: 1 },
        { chain: `leg.${side}`, joint: 2 },
        { chain: `leg.${side}`, joint: 3 },
        { chain: `arm.${side}`, joint: 1 },
        { chain: `arm.${side}`, joint: 2 },
      ]),
      { chain: 'spine', joint: 0 },
      { chain: 'spine', joint: 1 },
      { chain: 'spine', joint: 2 },
      { head: 'top' as const },
    ],
    angles(pose: Pose, chain: ChainSpec): BoneAngles[] {
      if (chain.id === 'spine') {
        // Leaning forward turns the top of an upright bone toward +z, which is a negative swing.
        const lean = -field(pose, 'lean') / 2
        const side = field(pose, 'side') / 2
        return [
          { swing: lean, spread: side },
          { swing: lean, spread: side },
        ]
      }
      if (chain.id === 'neck') return [{ swing: 0, spread: 0 }]
      const [limb, side] = chain.id.split('.')
      const f = (name: string) => field(pose, `${limb}.${side}.${name}`)
      if (limb === 'arm') {
        return [
          { swing: f('swing'), spread: f('spread') },
          { swing: f('elbow'), spread: f('bend') },
        ]
      }
      return [
        { swing: f('swing'), spread: f('spread') },
        { swing: -f('knee'), spread: 0 },
        // The foot points forward, square to the shin, turned out a little.
        { swing: 90 + f('ankle'), spread: 0, yaw: TOE_OUT * (chain.side ?? 1) },
      ]
    },
    withAngles(pose: Pose, chain: ChainSpec, angles: BoneAngles[]): Pose {
      const [limb, side] = chain.id.split('.')
      const key = (name: string) => `${limb}.${side}.${name}`
      if (limb === 'arm') {
        return {
          ...pose,
          [key('swing')]: angles[0].swing,
          [key('spread')]: angles[0].spread,
          [key('elbow')]: angles[1].swing,
          [key('bend')]: angles[1].spread,
        }
      }
      if (limb === 'leg') {
        return { ...pose, [key('swing')]: angles[0].swing, [key('spread')]: angles[0].spread, [key('knee')]: -angles[1].swing }
      }
      return pose
    },
    boneScale(pose: Pose, chain: ChainSpec | null): number {
      const stretch = Math.min(3, Math.max(0.3, field(pose, 'stretch')))
      return chain?.id.startsWith('arm.') ? Math.sqrt(stretch) : stretch
    },
    headPose(pose: Pose) {
      const stretch = Math.min(3, Math.max(0.3, field(pose, 'stretch')))
      return {
        yaw: field(pose, 'head.turn'),
        nod: field(pose, 'head.nod'),
        tilt: field(pose, 'head.tilt'),
        // The head keeps its area: taller and narrower when stretched.
        sx: 1 / Math.sqrt(stretch),
        sy: Math.sqrt(stretch),
      }
    },
    landmarks: {
      neck: ['neck', 0],
      'shoulder.left': ['arm.left', 0],
      'elbow.left': ['arm.left', 1],
      'hand.left': ['arm.left', 2],
      'shoulder.right': ['arm.right', 0],
      'elbow.right': ['arm.right', 1],
      'hand.right': ['arm.right', 2],
      'hip.left': ['leg.left', 0],
      'knee.left': ['leg.left', 1],
      'ankle.left': ['leg.left', 2],
      'toe.left': ['leg.left', 3],
      'hip.right': ['leg.right', 0],
      'knee.right': ['leg.right', 1],
      'ankle.right': ['leg.right', 2],
      'toe.right': ['leg.right', 3],
    },
  }
}

/** Plain-language names for the human pose fields, for timelines and property panels. */
export function humanFieldLabel(field: string): string {
  const parts = field.split('.')
  if (parts.length === 3) {
    const [limb, side, motion] = parts
    const who = `${side === 'left' ? 'Left' : 'Right'} ${limb}`
    const motions: Record<string, string> = {
      swing: 'forward / back',
      spread: 'out / in',
      elbow: 'elbow bend',
      bend: 'forearm out / in',
      knee: 'knee bend',
      ankle: 'foot tilt',
    }
    return `${who} · ${motions[motion] ?? motion}`
  }
  const names: Record<string, string> = {
    turn: 'View (front → side → back)',
    lean: 'Lean forward / back',
    side: 'Lean sideways',
    'head.turn': 'Head · turn',
    'head.nod': 'Head · nod',
    'head.tilt': 'Head · tilt',
    stretch: 'Squash / stretch',
    lift: 'Lift off the ground',
    roll: 'Roll (whole figure)',
    mouth: 'Mouth open',
    smile: 'Smile',
    mouthWidth: 'Mouth width',
    blink: 'Blink',
    'eye.left': 'Left eye open',
    'eye.right': 'Right eye open',
    'brow.left': 'Left brow',
    'brow.right': 'Right brow',
    browTilt: 'Brow slant',
    lookX: 'Look left / right',
    lookY: 'Look up / down',
  }
  return names[field] ?? field
}

/** v1 face field names to the human plan's. */
const FACE_FIELDS: Record<string, string> = {
  leftEye: 'eye.left',
  rightEye: 'eye.right',
  leftBrow: 'brow.left',
  rightBrow: 'brow.right',
}

/**
 * The ready-made faces (happy, sad, surprised, angry…), as human pose fields.
 * Each sets every face field, so applying one replaces the whole face.
 */
export const HUMAN_EXPRESSIONS = Object.fromEntries(
  Object.entries(EXPRESSIONS).map(([name, face]) => [
    name,
    Object.fromEntries(Object.entries(face).map(([field, value]) => [FACE_FIELDS[field] ?? field, value])),
  ])
) as Record<ExpressionName, Pose>
