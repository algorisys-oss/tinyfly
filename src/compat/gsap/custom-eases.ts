import {
  customBounce,
  customEase,
  customWiggle,
  type CubicBezierPoints,
  type CustomBounceOptions,
  type CustomWiggleOptions,
} from '../../engine'
import { registerEase } from './ease-map'

/**
 * GSAP's CustomEase, CustomBounce and CustomWiggle: build a curve once, give it a
 * name, and use the name as an ease anywhere.
 *
 *     CustomEase.create('hop', 'M0,0 C0.2,0 0.3,1.4 0.5,1.1 0.7,0.8 0.8,1 1,1')
 *     CustomBounce.create('drop', { strength: 0.6 })
 *     CustomWiggle.create('shake', { wiggles: 8 })
 *
 *     live.to('.ball', { y: 300, ease: 'drop' })
 *
 * Curves are built from the engine's pure generators (engine/authoring/custom-ease.ts).
 * A single cubic-bezier stays an exact, serializable easing; anything else is
 * sampled into keyframes by the tween that uses it, so the JSON needs no curve
 * implementation to play.
 */
export const CustomEase = {
  /** Register a curve from SVG path data or bezier points. Returns the name. */
  create: (name: string, definition: string | CubicBezierPoints): string => registerEase(name, customEase(definition)),
}

export const CustomBounce = {
  /** Register a bouncing ease that lands and settles on the end value. Returns the name. */
  create: (name: string, options?: CustomBounceOptions): string => registerEase(name, { fn: customBounce(options) }),
}

export const CustomWiggle = {
  /** Register a wiggle that swings around the start value and returns to it. Returns the name. */
  create: (name: string, options?: CustomWiggleOptions): string => registerEase(name, { fn: customWiggle(options) }),
}
