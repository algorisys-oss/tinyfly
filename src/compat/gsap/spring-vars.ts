import { SPRING_PRESETS, type SpringConfig, type SpringPresetName } from '../../engine'

/**
 * The `spring` tween option: animate numeric properties with spring physics
 * instead of a duration and an ease.
 *
 *     live.to('.card', { x: 0, scale: 1, spring: 'wobbly' })
 *     live.to('.card', { x: 0, y: 0, spring: { stiffness: 260, damping: 14, velocity: { x: vx, y: vy } } })
 *
 * Each numeric property becomes a spring track (see engine/core/spring.ts):
 * deterministic, scrubbable and serializable. A spring settles in its own
 * time, so `duration` and `ease` are ignored for those properties; anything
 * that is not a number (a colour) still tweens with them.
 */

export interface SpringOptions {
  /** Start from a named spring, then override its parameters */
  preset?: SpringPresetName
  stiffness?: number
  damping?: number
  mass?: number
  /**
   * Initial velocity in units per second — one number for every property, or per
   * property (`{ x: 800, y: -200 }`, e.g. a drag's release velocity). Unset, `live`
   * carries on the velocity of whatever was animating the property.
   */
  velocity?: number | Record<string, number>
  /** Settled within this fraction of the travel (default 0.01) */
  restDelta?: number
}

/** `true` (the default spring), a preset name, or options. */
export type SpringVars = true | SpringPresetName | SpringOptions

/** The parameters for one property, apart from `from`, `to` and velocity. */
export function springParameters(value: SpringVars): Omit<SpringConfig, 'from' | 'to' | 'velocity'> {
  const options: SpringOptions = value === true ? {} : typeof value === 'string' ? { preset: value } : value
  if (options.preset !== undefined && !(options.preset in SPRING_PRESETS)) {
    throw new Error(
      `gsap-compat: unknown spring preset "${options.preset}" — use one of ${Object.keys(SPRING_PRESETS).join(', ')}`
    )
  }
  const preset = options.preset ? SPRING_PRESETS[options.preset] : {}
  return {
    ...preset,
    ...(options.stiffness !== undefined && { stiffness: options.stiffness }),
    ...(options.damping !== undefined && { damping: options.damping }),
    ...(options.mass !== undefined && { mass: options.mass }),
    ...(options.restDelta !== undefined && { restDelta: options.restDelta }),
  }
}

/** The velocity the options give a property, if they give one. */
export function springVelocity(value: SpringVars, property: string): number | undefined {
  if (value === true || typeof value === 'string') return undefined
  const velocity = value.velocity
  return typeof velocity === 'number' ? velocity : velocity?.[property]
}
