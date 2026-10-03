import type { Point } from '../../adapters/canvas/sketch'

/**
 * Points along a limb, blending the jointed shape (two straight segments) into
 * a rubber-hose curve by `rubber` 0..1. The curve is the quadratic that passes
 * through the joint halfway along, so a bent limb keeps its bend, rounded.
 */
export function rubberLimb(root: Point, joint: Point, end: Point, rubber: number, samples = 16): Point[] {
  // Control point that makes the quadratic pass through the joint at t = 0.5.
  const control = { x: 2 * joint.x - (root.x + end.x) / 2, y: 2 * joint.y - (root.y + end.y) / 2 }
  const points: Point[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const jointed =
      t < 0.5
        ? { x: root.x + (joint.x - root.x) * 2 * t, y: root.y + (joint.y - root.y) * 2 * t }
        : { x: joint.x + (end.x - joint.x) * (2 * t - 1), y: joint.y + (end.y - joint.y) * (2 * t - 1) }
    const u = 1 - t
    const hose = {
      x: u * u * root.x + 2 * u * t * control.x + t * t * end.x,
      y: u * u * root.y + 2 * u * t * control.y + t * t * end.y,
    }
    points.push({ x: jointed.x + (hose.x - jointed.x) * rubber, y: jointed.y + (hose.y - jointed.y) * rubber })
  }
  return points
}
