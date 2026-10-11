import { characterJoints, mixPoses, reachCharacter, type Character } from './character'
import type { Pose } from './rig/body-plan'
import { HUMAN_POSES, HUMAN_REST } from './species/human'

/**
 * Two characters whose hands meet: a handshake, a high five, a fist bump, or
 * a parcel handed from one to the other. Rather than playing two clips and
 * hoping the hands line up, both arms reach (exactly, see `reachCharacter`)
 * for one shared point, worked out from where the two stand and how tall
 * they are. The result is two poses and the point, plain data to key as
 * tracks; any field of the poses can still be changed.
 *
 * Both stand on the same ground line, `a` on the left facing right and `b`
 * on the right facing left, turned three-quarters toward the viewer (or side
 * on, with `view: 'side'`). Hands are the characters' right hands (a hand
 * over uses both).
 */

export type HandMeeting = 'handshake' | 'highFive' | 'fistBump' | 'handOver'

export interface MeetingPartner {
  character: Character
  /** Starting pose (default rest); its arms are replaced, the rest kept */
  pose?: Pose
  /** Scene x of the feet */
  x: number
}

export interface MeetHandsOptions {
  /** `threeQuarter` (default): turned toward the viewer as well as each other; `side`: in profile */
  view?: 'threeQuarter' | 'side'
  /** Where the hands meet, as a share of the shorter one's height above the ground (default by kind) */
  height?: number
}

export interface HandsMeet {
  a: Pose
  b: Pose
  /** Where the hands meet: scene x, and px above the ground (negative y, as drawing space) */
  point: { x: number; y: number }
  /** Both reached it (they stand close enough; see `meetingSpacing`) */
  reached: boolean
}

/**
 * Each kind: how high the hands meet and how far apart the two stand for
 * it (both as a share of the shorter one's height), and how far they lean in.
 */
export const HAND_MEETINGS = {
  handshake: { height: 0.47, spacing: 0.42, lean: 6 },
  highFive: { height: 0.9, spacing: 0.4, lean: 4 },
  fistBump: { height: 0.55, spacing: 0.44, lean: 6 },
  handOver: { height: 0.52, spacing: 0.46, lean: 8 },
} satisfies Record<HandMeeting, { height: number; spacing: number; lean: number }>

/** How far apart (px, feet to feet) two characters stand for their hands to meet comfortably. */
export function meetingSpacing(kind: HandMeeting, a: Character, b: Character): number {
  return HAND_MEETINGS[kind].spacing * Math.min(a.height, b.height)
}

/** A parcel handed over is held this wide, as a share of the shorter one's height. */
const PARCEL = 0.075

export function meetHands(kind: HandMeeting, a: MeetingPartner, b: MeetingPartner, options: MeetHandsOptions = {}): HandsMeet {
  const spec = HAND_MEETINGS[kind] as (typeof HAND_MEETINGS)[HandMeeting] | undefined
  if (!spec) throw new Error(`meetHands: unknown meeting '${kind}' (one of ${Object.keys(HAND_MEETINGS).join(', ')})`)
  const [left, right] = a.x <= b.x ? [a, b] : [b, a]
  const side = options.view === 'side'
  const shorter = Math.min(left.character.height, right.character.height)
  const point = { x: (left.x + right.x) / 2, y: -(options.height ?? spec.height) * shorter }

  const posed = (who: MeetingPartner, facingRight: boolean): Pose => {
    const turn = facingRight ? (side ? 1 : 0.62) : side ? 3 : 3.38
    let pose: Pose = { ...HUMAN_REST, ...who.pose, turn, lean: (who.pose?.lean ?? 0) + spec.lean }
    const toward = facingRight ? 1 : -1
    const reach = (arm: 'arm.left' | 'arm.right', dx: number, depth: number) => {
      pose = reachCharacter(who.character, pose, arm, { x: point.x + dx - who.x, y: point.y, depth })
    }
    if (kind === 'handOver') {
      // Both hands at this one's side of the parcel, either side of it.
      const half = PARCEL * shorter
      reach('arm.left', -toward * half * 0.9, half)
      reach('arm.right', -toward * half * 0.9, -half)
    } else {
      reach('arm.right', 0, 0)
    }
    if (kind === 'fistBump') pose = { ...pose, 'hand.right.index.curl': 1, 'hand.right.middle.curl': 1, 'hand.right.ring.curl': 1, 'hand.right.pinky.curl': 1 }
    return pose
  }

  const leftPose = posed(left, true)
  const rightPose = posed(right, false)
  // Did each hand get there? Out of reach, an arm points at the spot instead.
  const tolerance = 0.03 * shorter
  const arrives = (who: MeetingPartner, pose: Pose) => {
    const joints = characterJoints(who.character, pose)
    const hands = kind === 'handOver' ? ['hand.left', 'hand.right'] : ['hand.right']
    // Over a parcel the hands are either side of it; otherwise on the point itself.
    const across = kind === 'handOver' ? PARCEL * shorter + tolerance : tolerance
    return hands.every((hand) => Math.abs(joints.points[hand].y - point.y) < tolerance && Math.abs(joints.points[hand].x + who.x - point.x) < across)
  }
  const reached = arrives(left, leftPose) && arrives(right, rightPose)
  return a.x <= b.x ? { a: leftPose, b: rightPose, point, reached } : { a: rightPose, b: leftPose, point, reached }
}

/**
 * Two characters in each other's arms: a hug. Both turn toward each other
 * (three-quarters to the viewer, or side on), lean in and tilt their heads
 * together, and each reaches its right arm over the other's far shoulder and
 * its left round the other's waist, exactly, from where the two stand. Plain
 * data, like `meetHands`.
 */
export interface EmbraceOptions {
  /** `threeQuarter` (default): turned toward the viewer as well as each other; `side`: in profile */
  view?: 'threeQuarter' | 'side'
}

export interface Embrace {
  a: Pose
  b: Pose
  /** Both pairs of arms got round the other (they stand close enough; see `embraceSpacing`) */
  reached: boolean
}

/** A hug: how far apart the two stand (a share of the shorter one's height), how far they lean in and tilt their heads together. */
export const EMBRACE = { spacing: 0.3, lean: 10, tilt: 8 }

/** How far apart (px, feet to feet) two characters stand to hug. */
export function embraceSpacing(a: Character, b: Character): number {
  return EMBRACE.spacing * Math.min(a.height, b.height)
}

export function embrace(a: MeetingPartner, b: MeetingPartner, options: EmbraceOptions = {}): Embrace {
  const [left, right] = a.x <= b.x ? [a, b] : [b, a]
  const side = options.view === 'side'
  const shorter = Math.min(left.character.height, right.character.height)
  // Where each one's arms go on the other: over its shoulder (behind it) and round its waist (in front), at
  // heights the shorter of the two can reach, just short of the other's middle line.
  const targets = (who: MeetingPartner, other: MeetingPartner, toward: 1 | -1) => ({
    over: { x: other.x - toward * 0.02 * shorter - who.x, y: -0.72 * shorter, depth: -0.08 * shorter },
    round: { x: other.x - toward * 0.04 * shorter - who.x, y: -0.5 * shorter, depth: 0.06 * shorter },
  })
  const posed = (who: MeetingPartner, other: MeetingPartner, facingRight: boolean): Pose => {
    const turn = facingRight ? (side ? 1 : 0.62) : side ? 3 : 3.38
    const toward = facingRight ? 1 : -1
    let pose: Pose = { ...HUMAN_REST, ...who.pose, turn, lean: (who.pose?.lean ?? 0) + EMBRACE.lean, 'head.tilt': (who.pose?.['head.tilt'] ?? 0) + toward * EMBRACE.tilt }
    const { over, round } = targets(who, other, toward)
    pose = reachCharacter(who.character, pose, 'arm.right', over)
    pose = reachCharacter(who.character, pose, 'arm.left', round)
    return pose
  }
  const leftPose = posed(left, right, true)
  const rightPose = posed(right, left, false)
  const tolerance = 0.05 * shorter
  const arrives = (who: MeetingPartner, other: MeetingPartner, toward: 1 | -1, pose: Pose) => {
    const joints = characterJoints(who.character, pose).points
    const { over, round } = targets(who, other, toward)
    return Math.hypot(joints['hand.right'].x - over.x, joints['hand.right'].y - over.y) < tolerance && Math.hypot(joints['hand.left'].x - round.x, joints['hand.left'].y - round.y) < tolerance
  }
  const reached = arrives(left, right, 1, leftPose) && arrives(right, left, -1, rightPose)
  return a.x <= b.x ? { a: leftPose, b: rightPose, reached } : { a: rightPose, b: leftPose, reached }
}

/**
 * One character helping another up off the floor, as a function of how far
 * along it is: at `progress` 0 the sitter sits on the floor (`sitFloor`) and
 * the helper bends down to take its hand; at 1 both stand. In between the
 * sitter's pose blends from sitting to standing and the helper straightens,
 * while both right hands stay joined at a point that rises with them. Key
 * it at a few values of `progress` (or sample it) for the rise.
 */
export interface HelpUp {
  helper: Pose
  sitter: Pose
  /** Where the hands are joined: scene x, and px above the ground (negative y, as drawing space) */
  point: { x: number; y: number }
  /** Both hands got there (they are the spacing apart; see `helpUpSpacing`) */
  reached: boolean
}

export interface HelpUpOptions {
  /** `threeQuarter` (default) or `side` */
  view?: 'threeQuarter' | 'side'
}

/** A help-up: how far apart they are (a share of the shorter one's height), how high the joined hands are at the start and the end, and how far the helper bows down. */
export const HELP_UP = { spacing: 0.32, low: 0.3, high: 0.5, helperLean: 40, helperBend: 16 }

/** How far apart (px, feet to feet) a helper stands from someone on the floor to take their hand. */
export function helpUpSpacing(helper: Character, sitter: Character): number {
  return HELP_UP.spacing * Math.min(helper.height, sitter.height)
}

export function helpUp(helper: MeetingPartner, sitter: MeetingPartner, progress: number, options: HelpUpOptions = {}): HelpUp {
  const u = Math.max(0, Math.min(1, progress))
  const side = options.view === 'side'
  const helperRight = helper.x <= sitter.x
  const shorter = Math.min(helper.character.height, sitter.character.height)
  const point = { x: (helper.x + sitter.x) / 2, y: -(HELP_UP.low + (HELP_UP.high - HELP_UP.low) * u) * shorter }
  const turnOf = (facingRight: boolean) => (facingRight ? (side ? 1 : 0.62) : side ? 3 : 3.38)
  // The helper bends down to the hand on the floor and straightens as the other rises.
  let h: Pose = { ...HUMAN_REST, ...helper.pose, turn: turnOf(helperRight), lean: (helper.pose?.lean ?? 0) + HELP_UP.helperLean * (1 - u) + 4, bend: (helper.pose?.bend ?? 0) + HELP_UP.helperBend * (1 - u), 'head.nod': 18 * (1 - u) }
  h = reachCharacter(helper.character, h, 'arm.right', { x: point.x - helper.x, y: point.y })
  // The sitter: on the floor, then up on its feet, its hand in the helper's all the way.
  const sitting: Pose = { ...HUMAN_POSES.sitFloor, ...sitter.pose, turn: turnOf(!helperRight) }
  const standing: Pose = { ...HUMAN_REST, ...sitter.pose, turn: turnOf(!helperRight) }
  let s = mixPoses(sitting, standing, u)
  s = reachCharacter(sitter.character, s, 'arm.right', { x: point.x - sitter.x, y: point.y })
  const tolerance = 0.04 * shorter
  const at = (who: MeetingPartner, pose: Pose) => {
    const hand = characterJoints(who.character, pose).points['hand.right']
    return Math.hypot(hand.x + who.x - point.x, hand.y - point.y) < tolerance
  }
  return { helper: h, sitter: s, point, reached: at(helper, h) && at(sitter, s) }
}
