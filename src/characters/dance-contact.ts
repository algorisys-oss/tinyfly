import type { Character } from './character'
import type { Pose, Vec3 } from './rig/body-plan'
import { reachPose } from './rig/reach'
import { rotY, rotZ, solvePlanSpace, stagePlanSpace } from './rig/skeleton'
import { HUMAN_REST } from './species/human'
import { HAND_SHAPES } from './hands/hand-rig'

/** Position and height use the same units (pixels in 2D, metres in a 3D scene). */
export interface DancePartner {
  character: Character
  pose: Pose
  position: Vec3
}

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const scale = (v: Vec3, s: number): Vec3 => [v[0] * s, v[1] * s, v[2] * s]
const norm = (v: Vec3) => Math.hypot(...v)
const unit = (v: Vec3): Vec3 => scale(v, 1 / (norm(v) || 1))
const full = (pose: Pose): Pose => ({ ...HUMAN_REST, ...pose })
const staged = (partner: DancePartner) => stagePlanSpace(partner.character.plan, full(partner.pose), { height: partner.character.height, contact: partner.character.contact })

/**
 * A joint in world space, with pose.turn (quarter-turns), roll, ground contact
 * and position applied. Scene object rotations are not read. Index 2 is the
 * wrist/ankle, and leg index 3 is the toe.
 */
export function danceJoint(partner: DancePartner, chain: string, joint: number): Vec3 {
  return add(partner.position, staged(partner).chains[chain][joint])
}

/** Undo placing, grounding, roll and yaw before asking the local two-bone IK. */
function reachWorld(partner: DancePartner, chain: string, target: Vec3): Pose {
  const pose = full(partner.pose)
  const hip = staged(partner).hip
  const space = solvePlanSpace(partner.character.plan, pose, partner.character.height)
  const aroundHip = sub(sub(target, partner.position), hip)
  const unrolled = rotZ(aroundHip, (pose.roll ?? 0) * Math.PI / 180)
  const local = add(space.root, rotY(unrolled, -(pose.turn ?? 0) * Math.PI / 2))
  return reachPose(partner.character.plan, pose, chain, local, { height: partner.character.height })
}

export interface DanceFootPlant extends DancePartner {
  /** Joint error is less than 0.002 times the character height. */
  reached: boolean
}

/**
 * Keep one ankle or toe at a world point while the body travels or turns.
 * Apply the returned position as well as the pose: its y correction carries
 * weight onto the supporting leg. An unreachable target is reported, never
 * hidden by translating the body sideways.
 */
export function plantDanceFoot(partner: DancePartner, side: 'left' | 'right', target: Vec3, point: 'ankle' | 'toe' = 'toe'): DanceFootPlant {
  const chain = `leg.${side}`
  const endJoint = point === 'toe' ? 3 : 2
  let current: DancePartner = { ...partner, pose: full(partner.pose), position: [...partner.position] }
  for (let i = 0; i < 6; i++) {
    const leg = staged(current).chains[chain]
    const offset = sub(leg[endJoint], leg[2])
    current = { ...current, pose: reachWorld(current, chain, sub(target, offset)) }
    const landed = danceJoint(current, chain, endJoint)
    current.position[1] += target[1] - landed[1]
  }
  const error = norm(sub(danceJoint(current, chain, endJoint), target))
  return { ...current, reached: error < partner.character.height * 0.002 }
}

export interface DandiyaStick {
  grip: Vec3
  tip: Vec3
}

export interface DandiyaMeeting {
  /** Solved poses for the two partners; positions are unchanged. */
  a: Pose
  b: Pose
  sticks: [DandiyaStick, DandiyaStick]
  point: Vec3
  /** Both tips are within 0.002 times the shorter height of point. */
  reached: boolean
}

function palm(partner: DancePartner, side: 'left' | 'right'): Vec3 {
  const wrist = danceJoint(partner, `arm.${side}`, 2)
  const elbow = danceJoint(partner, `arm.${side}`, 1)
  return add(wrist, scale(unit(sub(wrist, elbow)), partner.character.lineWidth * 0.5))
}

/**
 * Both sticks reach one shared 3D strike point. Stick length defaults to
 * 0.22 of the shorter dancer's height; the point defaults to chest height
 * between them. Draw the returned grip→tip segments with each arm's depth.
 * Call on strike frames, or blend its poses with recovery poses between hits.
 * Both selected hands default to right and use the hold shape. Inspect
 * reached before applying a solve: unreachable tips are not snapped to point.
 */
export function meetDandiya(a: DancePartner, b: DancePartner, options: { sideA?: 'left' | 'right'; sideB?: 'left' | 'right'; point?: Vec3; length?: number } = {}): DandiyaMeeting {
  const height = Math.min(a.character.height, b.character.height)
  const length = options.length ?? height * 0.22
  if (!(length > 0) || !Number.isFinite(length)) throw new Error('meetDandiya: stick length must be positive and finite')
  const point: Vec3 = options.point ?? [(a.position[0] + b.position[0]) / 2, Math.max(a.position[1], b.position[1]) + height * 0.62, (a.position[2] + b.position[2]) / 2]
  const reach = (partner: DancePartner, side: 'left' | 'right'): { pose: Pose; stick: DandiyaStick } => {
    // Keep the grip below the strike, near its dancer. Pointing straight
    // from the shoulder can ask for a grip inside the elbow's minimum reach.
    const direction = unit([point[0] - partner.position[0], height * 0.2, point[2] - partner.position[2]])
    const gripTarget = sub(point, scale(direction, length))
    let pose = full(partner.pose)
    for (let i = 0; i < 6; i++) {
      const current = { ...partner, pose }
      const wrist = danceJoint(current, `arm.${side}`, 2)
      pose = reachWorld(current, `arm.${side}`, sub(gripTarget, sub(palm(current, side), wrist)))
    }
    for (const [field, value] of Object.entries(HAND_SHAPES.hold)) pose[`hand.${side}.${field}`] = value
    const grip = palm({ ...partner, pose }, side)
    return { pose, stick: { grip, tip: add(grip, scale(direction, length)) } }
  }
  const left = reach(a, options.sideA ?? 'right')
  const right = reach(b, options.sideB ?? 'right')
  return {
    a: left.pose, b: right.pose, sticks: [left.stick, right.stick], point,
    reached: [left.stick, right.stick].every((stick) => norm(sub(stick.tip, point)) < height * 0.002),
  }
}
