import type { Point } from '../../adapters/canvas/sketch'
import type { BodyPlan, ChainSpec, ContactSpec, Pose, Vec3 } from './body-plan'

/**
 * Solve a pose on a body plan: bones in 3D (forward kinematics), turned to the
 * view, projected flat, rolled, and set down on the ground.
 *
 * Pure: the same plan, pose and size always give the same numbers. Screen
 * points are in the character's own drawing space, feet at (0, 0), up is -y.
 */

const rad = (degrees: number) => (degrees * Math.PI) / 180

/** Turn about x: a hanging vector's end moves forward (+z) as the angle grows. */
export function rotX([x, y, z]: Vec3, a: number): Vec3 {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [x, y * c + z * s, -y * s + z * c]
}

/** Turn about z: a hanging vector's end moves toward +x (the character's left) as the angle grows. */
export function rotZ([x, y, z]: Vec3, a: number): Vec3 {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [x * c - y * s, x * s + y * c, z]
}

/** Turn about y (the vertical): forward (+z) turns toward +x as the angle grows. */
export function rotY([x, y, z]: Vec3, a: number): Vec3 {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [x * c + z * s, y, -x * s + z * c]
}

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k]

/** A bone's absolute orientation: summed swing and (signed) spread, radians. */
export interface BoneFrame {
  swing: number
  spread: number
}

/** Turn a vector by a bone frame, as its bones are turned: spread after swing. */
export const orient = (v: Vec3, frame: BoneFrame): Vec3 => rotZ(rotX(v, frame.swing), frame.spread)

export interface SolvedChain {
  id: string
  /** Joints in the character's 3D space, px */
  joints3: Vec3[]
  /** Each bone's frame */
  frames: BoneFrame[]
  /** Joints on screen (projected, rolled, placed) */
  points: Point[]
  /** Each joint's depth toward the viewer, px */
  depths: number[]
}

export interface SolvedHead {
  center: Point
  depth: number
  rx: number
  ry: number
  /** Screen rotation of the head ellipse, radians */
  angle: number
  /**
   * The head's own axes (its left, up and forward) in view space: x to the
   * right of the screen, y up the screen, z toward the viewer. A point on the
   * head is center + its coordinates along these axes.
   */
  axes: [Vec3, Vec3, Vec3]
}

export interface Skeleton {
  height: number
  /** View angle, radians: turn × 90° */
  view: number
  chains: Record<string, SolvedChain>
  head: SolvedHead
  /** The hips on screen */
  hip: Point
  /** Every contact point on screen, and which one is lowest */
  contacts: Array<{ spec: ContactSpec; point: Point }>
  /** Screen y of the lowest contact point (0 when the figure stands on the ground) */
  groundY: number
}

export interface SolveOptions {
  /** Height in px */
  height: number
  /** 'ground' (default) rests the lowest contact point on y = 0; 'none' keeps the hips at standing height */
  contact?: 'ground' | 'none'
}

/** Screen position of a character-space point, before rolling and placing. */
function project(v: Vec3, view: number): { point: Point; depth: number } {
  const turned = rotY(v, view)
  return { point: { x: turned[0], y: -turned[1] }, depth: turned[2] }
}

export function solveSkeleton(plan: BodyPlan, pose: Pose, options: SolveOptions): Skeleton {
  const H = options.height
  const view = rad(90 * (pose.turn ?? 0))
  const hipHeight = plan.hipHeight * H * (plan.boneScale?.(pose, null) ?? 1)
  const root: Vec3 = [0, hipHeight, 0]

  // Forward kinematics: each chain from its parent's joint, its bones' angles summed.
  const solved: Record<string, { joints3: Vec3[]; frames: BoneFrame[] }> = {}
  for (const chain of plan.chains) {
    const parent = chain.parent ? solved[chain.parent] : undefined
    if (chain.parent && !parent) throw new Error(`body plan ${plan.id}: chain ${chain.id} comes before its parent ${chain.parent}`)
    const at = chain.at ?? (parent ? parent.joints3.length - 1 : 0)
    const base = parent ? parent.joints3[at] : root
    const parentFrame = parent ? parent.frames[Math.max(0, at - 1)] : { swing: 0, spread: 0 }
    const start = chain.offset ? add(base, orient(scale(chain.offset, H), parentFrame)) : base
    const side = chain.side ?? 1
    const lengthScale = plan.boneScale?.(pose, chain) ?? 1
    const angles = plan.angles(pose, chain)
    const joints3: Vec3[] = [start]
    const frames: BoneFrame[] = []
    let swing = parentFrame.swing
    let spread = parentFrame.spread
    chain.bones.forEach((bone, i) => {
      const a = angles[i] ?? { swing: 0, spread: 0 }
      swing += rad(a.swing)
      spread += rad(a.spread) * side
      frames.push({ swing, spread })
      const direction = rotY(orient(chain.rest, { swing, spread }), rad(a.yaw ?? 0))
      joints3.push(add(joints3[i], scale(direction, bone.length * H * lengthScale)))
    })
    solved[chain.id] = { joints3, frames }
  }

  // The head sits on the end of its chain, turned by the chain and then by its own angles.
  const neck = solved[plan.head.on]
  const headPose = plan.headPose?.(pose) ?? { yaw: 0, nod: 0, tilt: 0, sx: 1, sy: 1 }
  const neckFrame = neck.frames[neck.frames.length - 1]
  const radius = (plan.head.size / 2) * H
  const rx = radius * headPose.sx
  const ry = radius * headPose.sy
  /** A vector in the head's own frame, to character space. */
  const headToBody = (v: Vec3): Vec3 =>
    orient(rotY(rotX(rotZ(v, -rad(headPose.tilt)), -rad(headPose.nod)), rad(headPose.yaw)), neckFrame)
  const headCenter3 = add(neck.joints3[neck.joints3.length - 1], headToBody([0, ry, 0]))

  // Turn to the view and project.
  const chains: Record<string, SolvedChain> = {}
  for (const chain of plan.chains) {
    const { joints3, frames } = solved[chain.id]
    const projected = joints3.map((v) => project(v, view))
    chains[chain.id] = {
      id: chain.id,
      joints3,
      frames,
      points: projected.map((p) => p.point),
      depths: projected.map((p) => p.depth),
    }
  }
  const headProjected = project(headCenter3, view)
  const axes = ([[1, 0, 0], [0, 1, 0], [0, 0, 1]] as Vec3[]).map((v) => rotY(headToBody(v), view)) as [Vec3, Vec3, Vec3]
  const hipScreen = project(root, view).point

  // Roll the whole figure in the picture plane, about the hips.
  const roll = rad(pose.roll ?? 0)
  const rollPoint = (p: Point): Point => {
    const dx = p.x - hipScreen.x
    const dy = p.y - hipScreen.y
    return { x: hipScreen.x + dx * Math.cos(roll) - dy * Math.sin(roll), y: hipScreen.y + dx * Math.sin(roll) + dy * Math.cos(roll) }
  }
  // Screen vectors turn with the roll too: (x right, y up) in view space.
  const rollAxis = ([x, y, z]: Vec3): Vec3 => [x * Math.cos(roll) + y * Math.sin(roll), -x * Math.sin(roll) + y * Math.cos(roll), z]
  for (const solvedChain of Object.values(chains)) solvedChain.points = solvedChain.points.map(rollPoint)
  const head: SolvedHead = {
    center: rollPoint(headProjected.point),
    depth: headProjected.depth,
    rx,
    ry,
    angle: 0,
    axes: axes.map(rollAxis) as [Vec3, Vec3, Vec3],
  }
  const up = head.axes[1]
  head.angle = Math.atan2(up[0], up[1])

  // Set the figure down: its lowest contact point on the ground.
  const contactPoint = (spec: ContactSpec): Point => {
    if ('head' in spec) return { x: head.center.x + up[0] * ry, y: head.center.y - up[1] * ry }
    const solvedChain = chains[spec.chain]
    return solvedChain.points[Math.min(spec.joint, solvedChain.points.length - 1)]
  }
  let shiftY = 0
  if ((options.contact ?? 'ground') === 'ground') {
    shiftY = -Math.max(...plan.contacts.map((spec) => contactPoint(spec).y))
  }
  shiftY -= (pose.lift ?? 0) * H
  const place = (p: Point): Point => ({ x: p.x, y: p.y + shiftY })
  for (const solvedChain of Object.values(chains)) solvedChain.points = solvedChain.points.map(place)
  head.center = place(head.center)
  const contacts = plan.contacts.map((spec) => ({ spec, point: contactPoint(spec) }))

  return {
    height: H,
    view,
    chains,
    head,
    hip: place(rollPoint(hipScreen)),
    contacts,
    groundY: Math.max(...contacts.map((c) => c.point.y)),
  }
}

/** A point on the head from head coordinates: x to its left, y up, z forward, each -1..1 of a radius. */
export function headPoint(head: SolvedHead, [x, y, z]: Vec3): { point: Point; depth: number; facing: number } {
  const [ax, ay, az] = head.axes
  const v: Vec3 = [
    ax[0] * x * head.rx + ay[0] * y * head.ry + az[0] * z * head.rx,
    ax[1] * x * head.rx + ay[1] * y * head.ry + az[1] * z * head.rx,
    ax[2] * x * head.rx + ay[2] * y * head.ry + az[2] * z * head.rx,
  ]
  // How directly the surface there faces the viewer: 1 straight on, 0 at the edge, negative behind.
  const length = Math.hypot(x, y, z) || 1
  const facing = (ax[2] * x + ay[2] * y + az[2] * z) / length
  return { point: { x: head.center.x + v[0], y: head.center.y - v[1] }, depth: head.depth + v[2], facing }
}

/** Which chains a plan has, in order: for drawing and for tests. */
export const chainIds = (plan: BodyPlan): string[] => plan.chains.map((chain: ChainSpec) => chain.id)
