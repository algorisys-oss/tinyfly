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

/** A pose solved in the character's own 3D space (+x its left, +y up, +z forward), before any view. */
export interface PlanSpace {
  height: number
  /** The hips, where the chains hang from */
  root: Vec3
  chains: Record<string, { joints3: Vec3[]; frames: BoneFrame[] }>
  head: { center: Vec3; rx: number; ry: number; toBody: (v: Vec3) => Vec3 }
}

/** Forward kinematics: every chain's joints and the head, in the character's own space. */
export function solvePlanSpace(plan: BodyPlan, pose: Pose, height: number): PlanSpace {
  const H = height
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
  const toBody = (v: Vec3): Vec3 =>
    orient(rotY(rotX(rotZ(v, -rad(headPose.tilt)), -rad(headPose.nod)), rad(headPose.yaw)), neckFrame)
  const center = add(neck.joints3[neck.joints3.length - 1], toBody([0, ry, 0]))
  return { height: H, root, chains: solved, head: { center, rx, ry, toBody } }
}

export function solveSkeleton(plan: BodyPlan, pose: Pose, options: SolveOptions): Skeleton {
  const H = options.height
  const view = rad(90 * (pose.turn ?? 0))
  const space = solvePlanSpace(plan, pose, H)
  const { root } = space
  const solved = space.chains
  const { rx, ry } = space.head
  const headToBody = space.head.toBody
  const headCenter3 = space.head.center

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

/**
 * Seeing a character through a camera: `toView` takes a point of the
 * character's staged space (turned by its `turn`, rolled, set down: px or
 * metres, +y up, the ground at y = 0) to view space (x right, y up, z toward
 * the viewer); `toScreen` takes a view-space point to the canvas.
 */
export interface ViewProjection {
  toView(v: Vec3): Vec3
  toScreen(v: Vec3): Point
}

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const unit = (v: Vec3): Vec3 => {
  const length = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / length, v[1] / length, v[2] / length]
}

/**
 * A pose solved in 3D and seen through a camera (a 3D scene's), instead of
 * flattened front-on: the same bones, turn, roll, lift and ground contact as
 * {@link solveSkeleton}, then projected through `projection`. Screen points
 * are canvas px; depths, radii and `height` are px at the hips, so the pens
 * draw it as they draw any figure. Under an orthographic camera looking down
 * -z it gives what `solveSkeleton` gives.
 */
/** A pose in 3D, turned, rolled and set down on its ground (y = 0): what a 3D renderer places in its world. */
export interface StagedSpace {
  height: number
  /** The hips */
  hip: Vec3
  /** Every chain's joints */
  chains: Record<string, Vec3[]>
  head: { center: Vec3; rx: number; ry: number; axes: [Vec3, Vec3, Vec3] }
}

/**
 * The pose's joints in its own 3D space with its turn, roll, lift and ground
 * contact applied, as front-on drawing applies them, but kept 3D: +x right of
 * the authored view, +y up from the ground, +z toward that view.
 */
export function stagePlanSpace(plan: BodyPlan, pose: Pose, options: SolveOptions): StagedSpace {
  const H = options.height
  const view = rad(90 * (pose.turn ?? 0))
  const roll = rad(pose.roll ?? 0)
  const space = solvePlanSpace(plan, pose, H)
  const hip3 = rotY(space.root, view)
  // Turned to the authored view, then rolled about the hips in that view's picture plane.
  const stage = (v: Vec3): Vec3 => add(rotZ(sub(rotY(v, view), hip3), -roll), hip3)
  const staged: Record<string, Vec3[]> = {}
  for (const chain of plan.chains) staged[chain.id] = space.chains[chain.id].joints3.map(stage)
  const headCenter = stage(space.head.center)
  const axis = (v: Vec3) => unit(sub(stage(add(space.head.center, space.head.toBody(v))), headCenter))
  const axes = [axis([1, 0, 0]), axis([0, 1, 0]), axis([0, 0, 1])] as [Vec3, Vec3, Vec3]

  // Set down: the lowest contact point on the ground (y = 0), then lifted.
  const contactPoint3 = (spec: ContactSpec): Vec3 => {
    if ('head' in spec) return add(headCenter, scale(axes[1], space.head.ry))
    const joints = staged[spec.chain]
    return joints[Math.min(spec.joint, joints.length - 1)]
  }
  let shiftY = 0
  if ((options.contact ?? 'ground') === 'ground') shiftY = -Math.min(...plan.contacts.map((spec) => contactPoint3(spec)[1]))
  shiftY += (pose.lift ?? 0) * H
  const place = (v: Vec3): Vec3 => [v[0], v[1] + shiftY, v[2]]
  return {
    height: H,
    hip: place(hip3),
    chains: Object.fromEntries(Object.entries(staged).map(([id, joints]) => [id, joints.map(place)])),
    head: { center: place(headCenter), rx: space.head.rx, ry: space.head.ry, axes },
  }
}

export function skeletonInView(plan: BodyPlan, pose: Pose, options: SolveOptions, projection: ViewProjection): Skeleton {
  const H = options.height
  const view = rad(90 * (pose.turn ?? 0))
  const space = solvePlanSpace(plan, pose, H)
  const set = stagePlanSpace(plan, pose, options)
  const hip3 = set.hip
  const staged = set.chains
  const headCenter = set.head.center
  const contactPoint3 = (spec: ContactSpec): Vec3 => {
    if ('head' in spec) return add(headCenter, scale(set.head.axes[1], set.head.ry))
    const joints = staged[spec.chain]
    return joints[Math.min(spec.joint, joints.length - 1)]
  }

  // px per unit at the hips: how big the figure looks there.
  const hipView = projection.toView(hip3)
  const hipScreen = projection.toScreen(hipView)
  const across = projection.toScreen([hipView[0] + 1, hipView[1], hipView[2]])
  const pxPerUnit = Math.hypot(across.x - hipScreen.x, across.y - hipScreen.y)
  const see = (v: Vec3) => {
    const inView = projection.toView(v)
    return { point: projection.toScreen(inView), depth: inView[2] * pxPerUnit }
  }

  const chains: Record<string, SolvedChain> = {}
  for (const chain of plan.chains) {
    const seen = staged[chain.id].map(see)
    chains[chain.id] = {
      id: chain.id,
      joints3: space.chains[chain.id].joints3,
      frames: space.chains[chain.id].frames,
      points: seen.map((p) => p.point),
      depths: seen.map((p) => p.depth),
    }
  }

  // The head: its centre and its own axes in view space; its radii at its depth.
  const centerView = projection.toView(headCenter)
  const centerScreen = projection.toScreen(centerView)
  const side = projection.toScreen([centerView[0] + 1, centerView[1], centerView[2]])
  const headPx = Math.hypot(side.x - centerScreen.x, side.y - centerScreen.y)
  const axes = set.head.axes.map((axis) => unit(sub(projection.toView(add(headCenter, axis)), centerView))) as [Vec3, Vec3, Vec3]
  const head: SolvedHead = {
    center: centerScreen,
    depth: centerView[2] * pxPerUnit,
    rx: space.head.rx * headPx,
    ry: space.head.ry * headPx,
    angle: Math.atan2(axes[1][0], axes[1][1]),
    axes,
  }
  const contacts = plan.contacts.map((spec) => ({ spec, point: see(contactPoint3(spec)).point }))
  return {
    height: H * pxPerUnit,
    view,
    chains,
    head,
    hip: hipScreen,
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
