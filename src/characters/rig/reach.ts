import type { BodyPlan, Pose, Vec3 } from './body-plan'
import { BODY_FRAME, hangingTilt, orient, rotY, solveSkeleton, tiltFrame, unorient } from './skeleton'

/**
 * Reaching: solve a two-bone limb (an arm, or a leg's thigh and shin) so its
 * end touches a point. Exact, and so deterministic: the elbow or knee bends in
 * the plane through the limb and the target that contains the chain's pole
 * (elbows back and down, knees forward), and a target out of reach is pointed
 * at with the limb straight.
 */

const deg = (radians: number) => (radians * 180) / Math.PI
const rad = (degrees: number) => (degrees * Math.PI) / 180
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const length = (a: Vec3) => Math.hypot(a[0], a[1], a[2])
const unit = (a: Vec3): Vec3 => {
  const l = length(a) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}
export interface ReachOptions {
  /** Character height in the same units as target (pixels or scene metres). */
  height: number
}

/**
 * The pose with chain `chainId` reaching for `target`, a point in the
 * character's unplaced 3D space, in the same units as height (+x its left,
 * +y up, +z forward). Body turn, roll, lift and grounding are excluded from
 * the solve. The chain must hang down at rest (arms, legs). Authored bone
 * yaw, including human hip turn-out, is retained; reaching the existing
 * endpoint returns the original pose, including a straight limb at full reach.
 */
export function reachPose(plan: BodyPlan, pose: Pose, chainId: string, target: Vec3, options: ReachOptions): Pose {
  const chain = plan.chains.find((c) => c.id === chainId)
  if (!chain) throw new Error(`reach: no chain ${chainId} in ${plan.id}`)
  if (chain.bones.length < 2 || chain.rest[1] > -0.99) throw new Error(`reach: ${chainId} is not a hanging limb of two bones or more`)
  if (!plan.withAngles) throw new Error(`reach: the ${plan.id} plan cannot set angles`)
  // Solve without placing or rolling the figure: character space as built.
  const skeleton = solveSkeleton(plan, { ...pose, turn: 0, roll: 0, lift: 0 }, { height: options.height, contact: 'none' })
  const current = skeleton.chains[chainId]
  if (length(sub(target, current.joints3[2])) < options.height * 1e-12) return pose
  const start = current.joints3[0]
  const a = length(sub(current.joints3[1], current.joints3[0]))
  const b = length(sub(current.joints3[2], current.joints3[1]))
  const parentFrame = chain.parent
    ? skeleton.chains[chain.parent].frames[Math.max(0, (chain.at ?? skeleton.chains[chain.parent].joints3.length - 1) - 1)]
    : BODY_FRAME

  const toTarget = sub(target, start)
  const authoredAngles = plan.angles(pose, chain)
  const yaw = (i: number) => (authoredAngles[i]?.yaw ?? 0) * Math.PI / 180
  const d = Math.min(a + b - 1e-6, Math.max(Math.abs(a - b) + 1e-6, length(toTarget)))
  const u = unit(toTarget)
  // The pole: which way the middle joint bends, turned with the parent bone.
  const isArm = chain.parent !== null
  const pole = rotY(orient(chain.pole ?? (isArm ? [0, -0.35, -1] : [0, 0, 1]), parentFrame), yaw(0))
  let p = sub(pole, [u[0] * dot(pole, u), u[1] * dot(pole, u), u[2] * dot(pole, u)])
  if (length(p) < 1e-6) p = rotY([1, 0, 0], yaw(0)) // pole along the limb: bend sideways
  p = unit(p)
  const cosA = (a * a + d * d - b * b) / (2 * a * d)
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA))
  const end: Vec3 = [start[0] + u[0] * d, start[1] + u[1] * d, start[2] + u[2] * d]
  const side = chain.side ?? 1
  const now = (i: number) => ({ swing: rad(authoredAngles[i]?.swing ?? 0), spread: rad(authoredAngles[i]?.spread ?? 0) * side })

  /**
   * Each bone's tilt from the one before (in that bone's frame, nearest the
   * tilt it has now), with the middle joint turned `swivel` radians about the
   * line to the target from where the pole puts it.
   */
  const solveBones = (swivel: number) => {
    const q = cross(u, p)
    const out: Vec3 = [
      p[0] * Math.cos(swivel) + q[0] * Math.sin(swivel),
      p[1] * Math.cos(swivel) + q[1] * Math.sin(swivel),
      p[2] * Math.cos(swivel) + q[2] * Math.sin(swivel),
    ]
    const joint: Vec3 = [
      start[0] + a * (cosA * u[0] + sinA * out[0]),
      start[1] + a * (cosA * u[1] + sinA * out[1]),
      start[2] + a * (cosA * u[2] + sinA * out[2]),
    ]
    const upper = hangingTilt(unorient(rotY(sub(joint, start), -yaw(0)), parentFrame), now(0))
    const upperFrame = tiltFrame(parentFrame, upper.swing, upper.spread)
    const lower = hangingTilt(unorient(rotY(sub(end, joint), -yaw(1)), upperFrame), now(1))
    return { upper, lower }
  }

  // An elbow bends wherever the pole puts it. A knee is a hinge: it only bends
  // forward and back in its thigh's frame, so the leg swivels about the line
  // to the target until the shin needs no sideways tilt (secant steps from the pole).
  let swivel = 0
  let bones = solveBones(swivel)
  if (!isArm) {
    let previous = { swivel: 0.05, miss: solveBones(0.05).lower.spread }
    for (let step = 0; step < 40 && Math.abs(bones.lower.spread) > 1e-14; step++) {
      const slope = (bones.lower.spread - previous.miss) / (swivel - previous.swivel)
      if (!Number.isFinite(slope) || Math.abs(slope) < 1e-15) break
      previous = { swivel, miss: bones.lower.spread }
      swivel -= bones.lower.spread / slope
      bones = solveBones(swivel)
    }
  }
  const { upper, lower } = bones
  const angles = [
    { swing: deg(upper.swing), spread: deg(upper.spread) * side },
    { swing: deg(lower.swing), spread: deg(lower.spread) * side },
  ]
  return plan.withAngles(pose, chain, angles)
}
