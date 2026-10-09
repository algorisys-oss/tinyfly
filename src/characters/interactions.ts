import { characterJoints, reachCharacter, type Character } from './character'
import type { Pose } from './rig/body-plan'
import { HUMAN_REST } from './species/human'

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
