import { naturalRest, type InertiaConfig } from '../../engine'

/**
 * GSAP's InertiaPlugin tween option, desugared to inertia tracks.
 *
 *     tl.to('card', { inertia: { x: { velocity: 900, end: [0, 200, 400] }, y: 300 } })
 *
 * Each property becomes one inertia track starting from the property's current
 * value. A throw decides its own duration, so `duration` is ignored for it.
 *
 * `end` may be a function: it receives where a free throw would stop and returns
 * where to rest. It is called once, when the tween is built, and the number it
 * returns is what the track stores — the JSON never contains code.
 */

export interface InertiaPropertyVars {
  /** Release speed in units per second */
  velocity: number
  min?: number
  max?: number
  /** Snap increment, candidate resting values, or a function choosing one */
  end?: number | number[] | ((naturalEnd: number) => number)
  /**
   * GSAP-style resistance: higher stops sooner. 100 matches tinyfly's default
   * friction; each 25 adds one unit of friction per second.
   */
  resistance?: number
  /** tinyfly's own friction (decay rate per second); overrides `resistance` */
  friction?: number
}

/** Per property: the full options, or just a release velocity. */
export type InertiaVars = Record<string, number | InertiaPropertyVars>

/** Everything but `from`, which the timeline resolves from the property's current value. */
export type InertiaConfigWithoutFrom = Omit<InertiaConfig, 'from'>

/** GSAP resistance → tinyfly friction. */
export function resistanceToFriction(resistance: number): number {
  return Math.max(0.1, resistance / 25)
}

/**
 * Compile one property's inertia options, given where it starts. `end`
 * functions are resolved here.
 */
export function compileInertiaProperty(from: number, value: number | InertiaPropertyVars): InertiaConfig {
  const vars: InertiaPropertyVars = typeof value === 'number' ? { velocity: value } : value
  if (typeof vars?.velocity !== 'number' || !Number.isFinite(vars.velocity)) {
    throw new Error('gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.')
  }

  const friction =
    vars.friction ?? (vars.resistance !== undefined ? resistanceToFriction(vars.resistance) : undefined)

  const config: InertiaConfig = {
    from,
    velocity: vars.velocity,
    ...(friction !== undefined && { friction }),
    ...(vars.min !== undefined && { min: vars.min }),
    ...(vars.max !== undefined && { max: vars.max }),
  }

  if (typeof vars.end === 'function') {
    config.end = [vars.end(naturalRest(config))]
  } else if (vars.end !== undefined) {
    config.end = Array.isArray(vars.end) ? [...vars.end] : vars.end
  }
  return config
}
