import { isPathData } from '../../engine'
import type { TweenVars } from './vars'

/**
 * GSAP's `morphSVG` tween option, desugared to the `d` property.
 *
 *     tl.fromTo('shape', { d: circleData }, { morphSVG: starData, duration: 1 })
 *
 * The engine already interpolates path data (see engine/path/path-morph.ts,
 * which pairs subpaths, picks the start point and keeps corners), so a morph is
 * an ordinary track on `d`. The facade accepts path data only; `live` resolves
 * a selector or element to its path data first, and reads each target's
 * current shape as the start.
 */

export interface MorphSvgVars {
  /** The shape to morph into: path data (or, in `live`, a selector or element) */
  shape: string
}

export type MorphSvgValue = string | MorphSvgVars

/** The shape a `morphSVG` value names, before any DOM resolution. */
export function morphShapeOf(value: unknown): unknown {
  return typeof value === 'object' && value !== null && 'shape' in value ? (value as MorphSvgVars).shape : value
}

/** Replace `morphSVG` with `d`. Vars without it are returned as they are. */
export function desugarMorph(vars: TweenVars): TweenVars {
  if (vars.morphSVG === undefined) return vars
  const { morphSVG, ...rest } = vars
  const shape = morphShapeOf(morphSVG)
  if (typeof shape !== 'string' || !isPathData(shape)) {
    throw new Error(
      `gsap-compat: morphSVG "${String(shape)}" is not path data. Selectors and elements ` +
        'are resolved by live.to(); timeline() and tf need the path data itself.'
    )
  }
  return { ...rest, d: shape }
}
