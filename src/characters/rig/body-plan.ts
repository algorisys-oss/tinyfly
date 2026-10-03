/**
 * Body plans: what a character is made of, as data.
 *
 * A body plan is a set of bone chains (a spine, a neck, arms, legs; later
 * tails, wings, trunks) hanging from one another, a head, and the points that
 * can touch a surface. Lengths and widths are fractions of the character's
 * height, so one plan draws at any size.
 *
 * Space: +x is the character's left, +y is up, +z is the way it faces. The
 * hips sit on the y axis; the ground under them is y = 0.
 */

export type Vec3 = [number, number, number]

export interface BoneSpec {
  /** Length, fraction of the height */
  length: number
  /** Drawn width at each end, in line widths (the fluid figure tapers) */
  width: [number, number]
}

export interface ChainSpec {
  id: string
  /** Chain it hangs from; null hangs from the hips */
  parent: string | null
  /** Joint of the parent it starts at (default: the parent's last joint) */
  at?: number
  /**
   * Offset from that joint, fraction of the height, in the parent bone's own
   * frame (so shoulders turn with the spine)
   */
  offset?: Vec3
  /** Direction of the first bone at rest (a unit vector) */
  rest: Vec3
  bones: BoneSpec[]
  /** -1 the right side, +1 the left: which way a positive spread goes (default +1) */
  side?: -1 | 1
  /**
   * Which way the middle joint bends when the chain reaches for a point, in
   * the parent bone's frame (default: elbows back and down, knees forward)
   */
  pole?: Vec3
}

/** A bone's angles in degrees, relative to the bone before it (or the parent chain). */
export interface BoneAngles {
  /** Forward and back: a hanging bone's end moves forward (+z) as swing grows */
  swing: number
  /** Away from the body (+) and across it (-), toward the chain's side */
  spread: number
  /** Turn about the vertical, for this bone only (a foot turned out) */
  yaw?: number
}

/** A point that can rest on a surface: a joint of a chain, or the top of the head. */
export type ContactSpec = { chain: string; joint: number } | { head: 'top' }

export interface HeadSpec {
  /** Chain the head sits on the end of */
  on: string
  /** Diameter, fraction of the height */
  size: number
}

/** A pose: every value a number, so any two poses blend and each field can be a track. */
export type Pose = Record<string, number>

export interface BodyPlan {
  id: string
  /** In drawing order for ties: when two parts are at the same depth, the earlier is drawn first */
  chains: ChainSpec[]
  head: HeadSpec
  contacts: ContactSpec[]
  /** The angles of each bone of a chain, from a pose */
  angles(pose: Pose, chain: ChainSpec): BoneAngles[]
  /** How much a chain's bones are scaled (squash and stretch); `null` asks for the hip height. Default 1 */
  boneScale?(pose: Pose, chain: ChainSpec | null): number
  /** The head's own turn, nod and tilt (degrees) and its radii as multiples of the plan's. Default: still, round */
  headPose?(pose: Pose): { yaw: number; nod: number; tilt: number; sx: number; sy: number }
  /** The pose with a chain's bone angles set (the inverse of `angles`), for reaching */
  withAngles?(pose: Pose, chain: ChainSpec, angles: BoneAngles[]): Pose
  /** Named points: [chain, joint], e.g. `'hand.left': ['arm.left', 2]` */
  landmarks?: Record<string, [string, number]>
  /** Height of the hips above the ground at rest, fraction of the height (where a figure in the air keeps them) */
  hipHeight: number
}
