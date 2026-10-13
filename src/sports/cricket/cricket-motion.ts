import { character, type Character, type CharacterOptions } from '../../characters/character'
import { HAND_SHAPES } from '../../characters/hands/hand-rig'
import { reachPose } from '../../characters/rig/reach'
import { rotY, rotZ, stagePlanSpace, solvePlanSpace } from '../../characters/rig/skeleton'
import type { Pose } from '../../characters/rig/body-plan'
import { HUMAN_REST } from '../../characters/species/human'
import { quat, vec3, type Quat, type Vec3 } from '../../engine/math'
import type { CharacterObject3D, Scene3D } from '../../scene-3d/scene-types'

export interface CricketActor {
  object: CharacterObject3D
  who: Character
}

export interface BatFrame { grip: Vec3; axis: Vec3; scale: number }
export interface CricketSample { position: Vec3; pose: Pose; bat?: BatFrame }

export const progress = (time: number, start: number, end: number) => Math.max(0, Math.min(1, (time - start) / (end - start)))
export const smooth = (t: number) => t * t * (3 - 2 * t)
export const add = (a: Vec3, b: Vec3): Vec3 => vec3.add(a, b)
export const scale = (a: Vec3, b: number): Vec3 => vec3.scale(a, b)

/** The nearest equivalent body yaw, in quarter turns, without a wrap-around spin. */
export function turnNear(turn: number, reference: number): number {
  const value = reference + ((turn - reference + 2) % 4 + 4) % 4 - 2
  return value === 0 ? 0 : value
}

export function turnToward(from: Vec3, to: Vec3, reference = 0): number {
  if (Math.hypot(to[0] - from[0], to[2] - from[2]) < .001) return reference
  return turnNear(Math.atan2(to[0] - from[0], to[2] - from[2]) * 2 / Math.PI, reference)
}

/** Right-handed guard: left shoulder/front foot toward the bowler, soft knees. */
export function battingStance(): Pose {
  return { turn: 1, 'head.turn': 90, 'leg.left.spread': 12, 'leg.right.spread': 12,
    'leg.left.swing': 6, 'leg.right.swing': 6, 'leg.left.knee': 12, 'leg.right.knee': 12 }
}

export function cricketActor(scene: Scene3D, id: string): CricketActor {
  const object = scene.objects.find(o => o.id === id)
  if (!object || object.kind !== 'character') throw new Error(`cricketAction: required character '${id}' is missing`)
  if (object.parent || object.rotation?.some(v => v !== 0) || object.quaternion || object.scale !== undefined) throw new Error(`cricketAction: '${id}' must use position and pose.turn, without a transformed parent, scale or object rotation`)
  return { object, who: character({ ...(object.character as CharacterOptions), height: object.height ?? 1.78 }) }
}

export function restSample(actor: CricketActor): CricketSample {
  return { position: [...(actor.object.position ?? [0, 0, 0])], pose: { ...HUMAN_REST, ...actor.object.pose } }
}

/** Actual native wrist/elbow/leg points in world space, including grounding and body yaw. */
export function cricketJoint(actor: CricketActor, sample: CricketSample, chain: string, index: number): Vec3 {
  const staged = stagePlanSpace(actor.who.plan, sample.pose, { height: actor.who.height, contact: actor.who.contact })
  return add(sample.position, staged.chains[chain][index])
}

export function cricketPalm(actor: CricketActor, sample: CricketSample, side: 'left' | 'right'): Vec3 {
  const wrist = cricketJoint(actor, sample, `arm.${side}`, 2)
  const elbow = cricketJoint(actor, sample, `arm.${side}`, 1)
  return add(wrist, scale(vec3.normalize(vec3.subtract(wrist, elbow)), actor.who.lineWidth * .5))
}

/** Aim the head in the rig's own neck frame, including a bent/leaning torso. */
export function cricketLook(actor: CricketActor, sample: CricketSample, target: Vec3): CricketSample {
  const neutral = { ...sample.pose, 'head.turn': 0, 'head.nod': 0, 'head.tilt': 0 }
  const head = stagePlanSpace(actor.who.plan, neutral, { height: actor.who.height, contact: actor.who.contact }).head
  const direction = vec3.subtract(target, add(sample.position, head.center))
  const local = head.axes.map(axis => vec3.dot(direction, axis))
  const turn = Math.atan2(local[0], local[2]) * 180 / Math.PI
  const nod = Math.atan2(-local[1], Math.hypot(local[0], local[2])) * 180 / Math.PI
  return { ...sample, pose: { ...sample.pose, 'head.turn': Math.max(-90, Math.min(90, turn)), 'head.nod': Math.max(-25, Math.min(30, nod)), 'head.tilt': 0 } }
}

/** Solve to the rendered palm rather than snapping an unattached prop to a desired hand point. */
export function cricketReach(actor: CricketActor, sample: CricketSample, side: 'left' | 'right', target: Vec3, shape: keyof typeof HAND_SHAPES = 'hold'): CricketSample {
  let pose = { ...sample.pose }
  for (let i = 0; i < 10; i++) {
    const current = { ...sample, pose }
    const staged = stagePlanSpace(actor.who.plan, pose, { height: actor.who.height, contact: actor.who.contact })
    const space = solvePlanSpace(actor.who.plan, pose, actor.who.height)
    const offset = vec3.subtract(cricketPalm(actor, current, side), cricketJoint(actor, current, `arm.${side}`, 2))
    const wanted = vec3.subtract(vec3.subtract(vec3.subtract(target, offset), sample.position), staged.hip)
    const unrolled = rotZ(wanted, (pose.roll ?? 0) * Math.PI / 180)
    const local = add(space.root, rotY(unrolled, -(pose.turn ?? 0) * Math.PI / 2))
    pose = reachPose(actor.who.plan, pose, `arm.${side}`, local, { height: actor.who.height })
  }
  for (const [field, value] of Object.entries(HAND_SHAPES[shape])) pose[`hand.${side}.${field}`] = value
  return { ...sample, pose }
}

export function gripBat(actor: CricketActor, sample: CricketSample, target: Vec3, axis: Vec3): CricketSample {
  const direction = vec3.normalize(axis)
  const size = actor.who.height / 1.78
  // The left hand is above the right hand for a right-handed batter. The bat's
  // +y axis points from the upper grip toward the blade, even during a backlift.
  let posed = cricketReach(actor, sample, 'left', target)
  posed = cricketReach(actor, posed, 'right', add(cricketPalm(actor, posed, 'left'), scale(direction, .105 * size)))
  return { ...posed, bat: { grip: cricketPalm(actor, posed, 'left'), axis: direction, scale: size } }
}

export function batSweetSpot(bat: BatFrame): Vec3 { return add(bat.grip, scale(bat.axis, .51 * bat.scale)) }

/** Rotation from a mesh's +y axis to a world direction. Written as slerp keyframe data. */
export function alignCricketEquipment(direction: Vec3): Quat {
  const unit = vec3.normalize(direction)
  const cosine = Math.max(-1, Math.min(1, unit[1]))
  if (cosine > .999999) return [0, 0, 0, 1]
  if (cosine < -.999999) return quat.fromAxisAngle([1, 0, 0], 180)
  return quat.fromAxisAngle(vec3.normalize(vec3.cross([0, 1, 0], unit)), Math.acos(cosine) * 180 / Math.PI).map(value => value === 0 ? 0 : value) as Quat
}

export function blendPose(a: Pose, b: Pose, t: number): Pose {
  const pose: Pose = {}
  for (const key of Object.keys({ ...a, ...b })) {
    const from = a[key] ?? HUMAN_REST[key] ?? 0
    pose[key] = from + ((b[key] ?? HUMAN_REST[key] ?? 0) - from) * t
  }
  return pose
}

export function poseSequence(time: number, keys: Array<[number, Pose]>): Pose {
  if (time <= keys[0][0]) return { ...HUMAN_REST, ...keys[0][1] }
  for (let i = 1; i < keys.length; i++) {
    if (time <= keys[i][0]) return blendPose({ ...HUMAN_REST, ...keys[i - 1][1] }, { ...HUMAN_REST, ...keys[i][1] }, smooth(progress(time, keys[i - 1][0], keys[i][0])))
  }
  return { ...HUMAN_REST, ...keys.at(-1)![1] }
}
