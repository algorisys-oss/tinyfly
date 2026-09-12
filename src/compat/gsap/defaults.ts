/**
 * Static starting values for animatable properties.
 *
 * GSAP reads the live DOM to find a `to()` tween's implicit start value. We
 * cannot: `getComputedStyle` is exactly the implicit browser state that
 * determinism rule 5 rules out, and it would make the same JSON play
 * differently depending on the page's CSS.
 *
 * So the start value is resolved, in order:
 *   1. an explicit `from` (fromTo) — always wins
 *   2. the last value authored for that target+property on this timeline
 *   3. a `defaults` map passed to `timeline({ defaults })`
 *   4. the documented static default below
 *
 * Reaching (4) is the case that surprises GSAP users, so the facade warns.
 */

export const PROPERTY_DEFAULTS: Record<string, number> = {
  opacity: 1,

  x: 0,
  y: 0,
  z: 0,

  rotate: 0,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  rotation: 0,

  scale: 1,
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,

  skewX: 0,
  skewY: 0,

  originX: 50,
  originY: 50,
  perspective: 0,

  blur: 0,
  glow: 0,

  clipTop: 0,
  clipRight: 0,
  clipBottom: 0,
  clipLeft: 0,
}

/** The documented static default for a property, if it has one. */
export function defaultFor(property: string): number | undefined {
  return PROPERTY_DEFAULTS[property]
}
