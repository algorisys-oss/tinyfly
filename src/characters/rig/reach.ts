import type { BodyPlan, Pose, Vec3 } from './body-plan'
import { orient, solveSkeleton, rotY } from './skeleton'

/**
 * Reaching: solve a two-bone limb (an arm, or a leg's thigh and shin) so its
 * end touches a point. Exact, and so deterministic: the elbow or knee bends in
 * the plane through the limb and the target that contains the chain's pole
 * (elbows back and down, knees forward), and a target out of reach is pointed
 * at with the limb straight.
 */

const deg = (radians: number) => (radians * 180) / Math.PI
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const length = (a: Vec3) => Math.hypot(a[0], a[1], a[2])
const unit = (a: Vec3): Vec3 => {
  const l = length(a) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}
/** Wrap an angle into (-π, π]. */
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

/** The frame (swing, spread) that turns a hanging bone (0, -1, 0) to point along `d`. */
function hangingFrame(d: Vec3): { swing: number; spread: number } {
  const [x, y, z] = unit(d)
  return { swing: Math.asin(Math.max(-1, Math.min(1, z))), spread: Math.atan2(x, -y) }
}

export interface ReachOptions {
  /** Height in px the character is drawn at */
  height: number
}

/**
 * The pose with chain `chainId` reaching for `target`, a point in the
 * character's 3D space in px (+x its left, +y up from the ground under its
 * hips, +z forward). The chain must hang down at rest (arms, legs).
 */
export function reachPose(plan: BodyPlan, pose: Pose, chainId: string, target: Vec3, options: ReachOptions): Pose {
  const chain = plan.chains.find((c) => c.id === chainId)
  if (!chain) throw new Error(`reach: no chain ${chainId} in ${plan.id}`)
  if (chain.bones.length < 2 || chain.rest[1] > -0.99) throw new Error(`reach: ${chainId} is not a hanging limb of two bones or more`)
  if (!plan.withAngles) throw new Error(`reach: the ${plan.id} plan cannot set angles`)
  // Solve without placing or rolling the figure: character space as built.
  const skeleton = solveSkeleton(plan, { ...pose, turn: 0, roll: 0, lift: 0 }, { height: options.height, contact: 'none' })
  const solved = skeleton.chains[chainId]
  const start = solved.joints3[0]
  const a = length(sub(solved.joints3[1], solved.joints3[0]))
  const b = length(sub(solved.joints3[2], solved.joints3[1]))
  const parentFrame = chain.parent
    ? skeleton.chains[chain.parent].frames[Math.max(0, (chain.at ?? skeleton.chains[chain.parent].joints3.length - 1) - 1)]
    : { swing: 0, spread: 0 }

  const toTarget = sub(target, start)
  const d = Math.min(a + b - 1e-6, Math.max(Math.abs(a - b) + 1e-6, length(toTarget)))
  const u = unit(toTarget)
  // The pole: which way the middle joint bends, turned with the parent bone.
  const isArm = chain.parent !== null
  const pole = orient(chain.pole ?? (isArm ? [0, -0.35, -1] : [0, 0, 1]), parentFrame)
  let p = sub(pole, [u[0] * dot(pole, u), u[1] * dot(pole, u), u[2] * dot(pole, u)])
  if (length(p) < 1e-6) p = rotY([1, 0, 0], 0) // pole along the limb: bend sideways
  p = unit(p)
  const cosA = (a * a + d * d - b * b) / (2 * a * d)
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA))
  const joint: Vec3 = [
    start[0] + a * (cosA * u[0] + sinA * p[0]),
    start[1] + a * (cosA * u[1] + sinA * p[1]),
    start[2] + a * (cosA * u[2] + sinA * p[2]),
  ]
  const end: Vec3 = [start[0] + u[0] * d, start[1] + u[1] * d, start[2] + u[2] * d]

  const side = chain.side ?? 1
  const upper = hangingFrame(sub(joint, start))
  const lower = hangingFrame(sub(end, joint))
  const angles = [
    { swing: deg(wrap(upper.swing - parentFrame.swing)), spread: deg(wrap(upper.spread - parentFrame.spread)) * side },
    { swing: deg(wrap(lower.swing - upper.swing)), spread: deg(wrap(lower.spread - upper.spread)) * side },
  ]
  return plan.withAngles(pose, chain, angles)
}
