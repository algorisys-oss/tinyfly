/**
 * tinyfly/gsap-compat — a GSAP-flavoured authoring surface.
 *
 * Familiar, not compatible. GSAP code will not run unchanged; this gives GSAP
 * users a syntax they recognise that compiles to ordinary tinyfly JSON.
 * See docs/gsap-compat.md for the mapping table and the deliberate gaps.
 */

export * from './timeline'
export * from './ease-map'
export * from './position'
export * from './vars'
export * from './defaults'
export * from './quick-play'
export * from './motion-path-vars'
export * from './morph-vars'
export * from './text-vars'
export * from './inertia-vars'
export { convertToPath, pathDataOf } from './live-morph'
export { createLiveDraggable } from './live-draggable'
export { getFlipState, flipFrom } from './live-flip'
export type { FlipState as LiveFlipState, FlipVars } from './live-flip'
export type { LiveDraggable, LiveDraggableOptions, LiveThrowOptions } from './live-draggable'
export { resolveLiveMotionPath } from './live-motion-path'
export type { LiveMotionPathVars, LiveMotionPathContext } from './live-motion-path'

import { CompatTimeline, timeline, type CompatTimelineOptions } from './timeline'
import type { TweenVars } from './vars'
import type { Position } from './position'

/**
 * Create a one-tween timeline — the shorthand for when you do not need a
 * sequence. Mirrors `gsap.to()` / `gsap.from()` / `gsap.fromTo()`.
 */
export const tf = {
  timeline,

  to(target: string | string[], vars: TweenVars, options?: CompatTimelineOptions): CompatTimeline {
    const tl = new CompatTimeline(options)
    tl.to(target, vars)
    return tl
  },

  from(target: string | string[], vars: TweenVars, options?: CompatTimelineOptions): CompatTimeline {
    const tl = new CompatTimeline(options)
    tl.from(target, vars)
    return tl
  },

  fromTo(
    target: string | string[],
    fromVars: TweenVars,
    toVars: TweenVars,
    options?: CompatTimelineOptions
  ): CompatTimeline {
    const tl = new CompatTimeline(options)
    tl.fromTo(target, fromVars, toVars)
    return tl
  },

  set(target: string | string[], vars: TweenVars, options?: CompatTimelineOptions): CompatTimeline {
    const tl = new CompatTimeline(options)
    tl.set(target, vars)
    return tl
  },
}

export type { Position, TweenVars }

export { Stage } from './stage'
export type { TargetInput, FrameScheduler, StageOptions } from './stage'
export { LiveTimeline, live, createLive } from './live'
export type { LiveTimelineOptions, LiveApi } from './live'
