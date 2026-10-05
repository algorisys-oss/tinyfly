/**
 * Does a video loop? Pure measurements on rendered frames (RGBA bytes), so a
 * loop can be checked without encoding anything.
 *
 * A loop closes when the frame at time = duration is the frame at time 0:
 * every motion repeats over the duration. Then the step from the last frame
 * back to the first is a step like any other. A loop with a cut, or one that
 * drifts, shows a seam that differs much more than its ordinary steps.
 */

/** Peak signal-to-noise ratio of two RGBA images (RGB only), dB; Infinity when identical. Higher is more alike. */
export function psnr(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length) throw new Error('psnr: the images differ in size')
  let sum = 0
  let count = 0
  for (let i = 0; i < a.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const d = a[i + c] - b[i + c]
      sum += d * d
    }
    count += 3
  }
  if (sum === 0) return Infinity
  return 10 * Math.log10((255 * 255) / (sum / count))
}

export interface LoopFrames {
  /** The frame at time 0 */
  first: ArrayLike<number>
  /** The frame after it */
  second: ArrayLike<number>
  /** The frame before the last */
  beforeLast: ArrayLike<number>
  /** The last frame */
  last: ArrayLike<number>
  /** The frame at time = duration: one frame past the end, where the loop comes back round */
  wrapped: ArrayLike<number>
}

export interface LoopReport {
  /** The frame at time = duration against the first: Infinity (or very high) when every motion repeats */
  closure: number
  /** The last frame → the first: the step a looping player shows */
  seam: number
  /** Ordinary steps for comparison: first → second, before-last → last */
  steps: [number, number]
  /** True when the loop closes, or its seam differs no more than an ordinary step does */
  loops: boolean
  /** Why, in a sentence */
  verdict: string
}

/** Above this the frames at 0 and at the duration count as the same picture. */
export const CLOSED_DB = 40
/** A seam this much worse than the worse ordinary step stands out. */
export const SEAM_SLACK_DB = 3

const db = (value: number) => (Number.isFinite(value) ? `${value.toFixed(2)} dB` : 'identical')

/** Judge a loop from its frames: does it close, and does its seam look like any other step? */
export function loopReport(frames: LoopFrames): LoopReport {
  const closure = psnr(frames.wrapped, frames.first)
  const seam = psnr(frames.last, frames.first)
  const steps: [number, number] = [psnr(frames.first, frames.second), psnr(frames.beforeLast, frames.last)]
  const worst = Math.min(...steps)
  if (closure >= CLOSED_DB) {
    return { closure, seam, steps, loops: true, verdict: `closes: the frame at the duration matches the first (${db(closure)}), so the seam is an ordinary step` }
  }
  if (seam >= worst - SEAM_SLACK_DB) {
    return {
      closure,
      seam,
      steps,
      loops: true,
      verdict: `seamless: the last → first step (${db(seam)}) is like an ordinary step (${db(worst)}), though the motion does not repeat exactly (${db(closure)})`,
    }
  }
  return {
    closure,
    seam,
    steps,
    loops: false,
    verdict: `does not loop: the last → first step (${db(seam)}) differs much more than an ordinary step (${db(worst)}); make every motion repeat over the duration`,
  }
}
