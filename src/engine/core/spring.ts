import type { SpringConfig } from '../types'

/**
 * Deterministic spring simulation.
 *
 * The whole point of this module is that `valueAt(t)` is a *pure function of t*.
 * A naive spring integrates from the previous frame's state, which makes output
 * depend on frame rate and on the direction you scrubbed from — a timeline that
 * looks different on a 144 Hz monitor, and that can't be exported. Instead we
 * always integrate forward from rest at t=0 using a fixed substep, so seeking
 * backwards to 300 ms gives the identical value as playing forward to 300 ms.
 *
 * The cost is that evaluating late times means simulating the earlier ones, so
 * each spring memoises its samples and extends them as needed (`SpringSampler`).
 */

/** Integration substep in milliseconds. Small enough to be stable for stiff springs. */
export const SPRING_STEP_MS = 1

/** Simulation is cut off here so a never-resting spring can't hang the engine. */
export const SPRING_MAX_DURATION_MS = 60_000

/** Highest sample index inside the duration cap. */
const MAX_STEPS = SPRING_MAX_DURATION_MS / SPRING_STEP_MS

export const DEFAULT_SPRING: Required<Omit<SpringConfig, 'from' | 'to'>> = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1,
}

/**
 * Named springs for the two parameters that decide how one feels. Stiffness and
 * damping interact, so named pairs are more useful than two sliders someone has
 * to discover the combinations of. Shared by the editor and `spring: 'wobbly'`.
 */
export const SPRING_PRESETS = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 },
} as const satisfies Record<string, { stiffness: number; damping: number; mass: number }>

export type SpringPresetName = keyof typeof SPRING_PRESETS

/**
 * Samples a single spring, extending the simulation on demand and caching it.
 *
 * Instances are cheap; one is created per spring track.
 */
export class SpringSampler {
  private readonly from: number
  private readonly to: number
  private readonly stiffness: number
  private readonly damping: number
  private readonly mass: number
  private readonly restDelta: number
  private readonly restSpeed: number

  /** value[i] is the spring's position at time i * SPRING_STEP_MS */
  /**
   * Travel distance, used to scale the rest thresholds.
   *
   * Without this the thresholds are absolute, and a spring animating `scale`
   * from 0 to 1 hits them ~100x sooner than one animating `x` from 0 to 100 —
   * so the small one is declared "settled" at its first pass through the
   * target and never shows the overshoot at all. Scaling by travel makes
   * settling depend on the spring's parameters, not on the units of whatever
   * property it happens to drive.
   */
  private readonly distance: number

  private samples: number[]
  private velocity: number
  /** Once at rest we stop simulating; every later time returns `to`. */
  private settledStep: number | null = null

  constructor(config: SpringConfig) {
    this.from = config.from
    this.to = config.to
    this.stiffness = config.stiffness ?? DEFAULT_SPRING.stiffness
    this.damping = config.damping ?? DEFAULT_SPRING.damping
    this.mass = config.mass ?? DEFAULT_SPRING.mass
    this.restDelta = config.restDelta ?? DEFAULT_SPRING.restDelta
    this.restSpeed = config.restSpeed ?? DEFAULT_SPRING.restSpeed

    // A zero-travel spring (a pure velocity "knock", where from === to) still
    // needs a yardstick, so fall back to 1.
    this.distance = Math.abs(this.to - this.from) || 1

    this.samples = [this.from]
    this.velocity = config.velocity ?? DEFAULT_SPRING.velocity

    // A spring that starts at its target with no velocity is already finished;
    // without this it would report a one-step duration.
    if (this.isAtRest(this.from)) {
      this.settledStep = 0
    }
  }

  /**
   * Whether a position/velocity pair counts as settled.
   *
   * Both thresholds are fractions of the spring's travel distance:
   * `restDelta` as a fraction of the distance, and `restSpeed` as a fraction
   * of the distance per second. That keeps settling scale-invariant.
   */
  private isAtRest(position: number): boolean {
    return (
      Math.abs(position - this.to) < this.restDelta * this.distance &&
      Math.abs(this.velocity) < this.restSpeed * this.distance
    )
  }

  /**
   * Position at `timeMs`. Times before 0 clamp to the start value; times past
   * settling return the target exactly.
   */
  valueAt(timeMs: number): number {
    if (timeMs <= 0) return this.from

    const step = Math.floor(timeMs / SPRING_STEP_MS)
    this.simulateTo(step + 1)

    if (this.settledStep !== null && step >= this.settledStep) {
      return this.to
    }

    // Linear blend between substeps. At a 1 ms step this is well below the
    // precision anything downstream cares about.
    const a = this.samples[Math.min(step, this.samples.length - 1)]
    const b = this.samples[Math.min(step + 1, this.samples.length - 1)]
    const frac = timeMs / SPRING_STEP_MS - step
    return a + (b - a) * frac
  }

  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime(): number {
    this.simulateTo(MAX_STEPS + 1)
    if (this.settledStep !== null) {
      return this.settledStep * SPRING_STEP_MS
    }
    return SPRING_MAX_DURATION_MS
  }

  /** Advance the cached simulation until it holds at least `steps` samples. */
  private simulateTo(steps: number): void {
    if (this.settledStep !== null) return

    // `steps` is a sample count; index MAX_STEPS is the last one inside the cap.
    const limit = Math.min(steps, MAX_STEPS + 1)
    const dt = SPRING_STEP_MS / 1000 // integrate in seconds

    while (this.samples.length < limit) {
      const position = this.samples[this.samples.length - 1]

      // Semi-implicit Euler: F = -k*x - c*v, applied to the displacement from
      // the target. Stable at a 1 ms step for the stiffness range we allow.
      const displacement = position - this.to
      const springForce = -this.stiffness * displacement
      const dampingForce = -this.damping * this.velocity
      const acceleration = (springForce + dampingForce) / this.mass

      this.velocity += acceleration * dt
      const next = position + this.velocity * dt
      this.samples.push(next)

      if (this.isAtRest(next)) {
        this.settledStep = this.samples.length - 1
        return
      }
    }

    if (this.samples.length > MAX_STEPS) {
      // Never settled within the cap — treat the cap as the settle point so the
      // track has a finite duration.
      this.settledStep = MAX_STEPS
    }
  }
}

/**
 * One-shot sampling helper. Prefer a long-lived `SpringSampler` when sampling
 * repeatedly (playback) — this rebuilds the simulation each call.
 */
export function springValueAt(config: SpringConfig, timeMs: number): number {
  return new SpringSampler(config).valueAt(timeMs)
}

/** Natural settle duration for a spring, in milliseconds. */
export function springDuration(config: SpringConfig): number {
  return new SpringSampler(config).settleTime()
}

/**
 * Whether a spring passes its target before settling.
 *
 * A spring oscillates when it is damped less than critically, and critical
 * damping is `2 * sqrt(stiffness * mass)`. Worth exposing rather than leaving
 * to trial and error: overshoot is usually the whole point of reaching for a
 * spring, and its absence is the most common reason a "bouncy" one looks flat.
 *
 * This is the closed-form test, so it is exact and costs nothing — no
 * simulation required.
 */
export function isUnderdamped(config: SpringConfig): boolean {
  const stiffness = config.stiffness ?? DEFAULT_SPRING.stiffness
  const damping = config.damping ?? DEFAULT_SPRING.damping
  const mass = config.mass ?? DEFAULT_SPRING.mass

  return damping < 2 * Math.sqrt(stiffness * mass)
}

/**
 * Damping that would make this spring settle without overshooting — the
 * critical-damping value for its stiffness and mass.
 */
export function criticalDamping(config: SpringConfig): number {
  const stiffness = config.stiffness ?? DEFAULT_SPRING.stiffness
  const mass = config.mass ?? DEFAULT_SPRING.mass

  return 2 * Math.sqrt(stiffness * mass)
}
