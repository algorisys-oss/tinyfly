import type { Vec3 } from '../rig/body-plan'
import type { SolvedHead } from '../rig/skeleton'
import type { Pen } from '../look/pen'
import type { Hair, HairMotion } from './hair'
import { sampleHairLock, type HairLockSample } from './hair-lock'
import { facingOf, onScreen } from './shell'

const mix = (a: Vec3, b: Vec3, t: number): Vec3 => a.map((value, axis) => value + (b[axis] - value) * t) as Vec3

/** Split at exact facing crossings, so the two passes meet through a turn. */
function lockRuns(head: SolvedHead, samples: HairLockSample[], near: boolean): HairLockSample[][] {
  const sign = near ? 1 : -1
  const runs: HairLockSample[][] = []
  let run: HairLockSample[] = []
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i]
    const visible = sign * facingOf(head, sample.normal) >= 0
    if (i > 0) {
      const previous = samples[i - 1]
      const before = sign * facingOf(head, previous.normal)
      const after = sign * facingOf(head, sample.normal)
      if ((before >= 0) !== visible) {
        const t = before / (before - after)
        const crossing: HairLockSample = {
          center: mix(previous.center, sample.center, t),
          left: mix(previous.left, sample.left, t),
          right: mix(previous.right, sample.right, t),
          normal: mix(previous.normal, sample.normal, t),
          t: previous.t + (sample.t - previous.t) * t,
        }
        if (visible) run = [crossing]
        else {
          run.push(crossing)
          if (run.length >= 2) runs.push(run)
          run = []
        }
      }
    }
    if (visible) run.push(sample)
  }
  if (run.length >= 2) runs.push(run)
  return runs
}

/** Broad flowing locks, ordered by depth and drawn in the head's two passes. */
export function drawHairLocks(pen: Pen, head: SolvedHead, hair: Hair, pad: number, motion: HairMotion, lineWidth: number, near: boolean): void {
  const locks = (hair.locks ?? []).map(lock => sampleHairLock(lock, hair.volume, pad, motion))
  const depth = (samples: HairLockSample[]) => samples.reduce((sum, sample) => sum + facingOf(head, sample.center), 0) / samples.length
  locks.sort((a, b) => depth(a) - depth(b))
  const outline = Math.max(0.7, lineWidth * 0.35)
  for (const samples of locks) {
    for (const run of lockRuns(head, samples, near)) {
      const left = run.map(sample => onScreen(head, sample.left))
      const right = run.map(sample => onScreen(head, sample.right))
      // Filled roots merge with the cap; skip their cross-edge and keep only
      // a few curved edges, rather than outlining every lock like a sticker.
      pen.shape([...left, ...right.slice().reverse()], hair.color, 0)
      if (pen.look === 'clean' && (hair.shine ?? 0) > 0) {
        const shine = run.filter(sample => sample.t >= 0.2 && sample.t <= 0.75)
        if (shine.length >= 3) {
          const outer = shine.map((sample, i) => {
            const width = 0.16 * Math.sin(Math.PI * i / (shine.length - 1))
            return onScreen(head, mix(sample.center, sample.left, 0.16 + width))
          })
          const inner = shine.map(sample => onScreen(head, mix(sample.center, sample.left, 0.16)))
          pen.shape([...outer, ...inner.reverse()], `rgba(255,255,255,${hair.shine})`, 0)
        }
      }
      const edge = run.filter(sample => sample.t > 0.3)
      if (edge.length >= 2) pen.line(edge.map(sample => onScreen(head, sample.left)), outline)
    }
  }
}
