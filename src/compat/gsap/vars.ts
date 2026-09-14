import { gridOffsets, needsExplicitOffsets, type GridStagger } from './stagger-grid'
import type { EasingType } from '../../engine'
import type { StaggerConfig, StaggerFrom } from '../../engine'
import type { Position } from './position'
import type { ScrollTriggerVars } from './live-scroll'
import type { SpringVars } from './spring-vars'

/**
 * Splitting a GSAP `vars` object into scheduling and animated properties.
 *
 * Everything GSAP recognises as configuration is reserved; everything else is
 * treated as a property to animate. That is how GSAP behaves, and it is why
 * a typo like `opactiy` silently animates nothing rather than erroring.
 */

/** Keys that configure the tween rather than naming a property to animate. */
export const RESERVED_KEYS = new Set([
  'duration',
  'delay',
  'ease',
  'repeat',
  'repeatDelay',
  'yoyo',
  'stagger',
  'onComplete',
  'onUpdate',
  'onStart',
  'onRepeat',
  'onReverseComplete',
  'repeatRefresh',
  'keyframes',
  'easeEach',
  'scrollTo',
  'id',
  'immediateRender',
  'overwrite',
  'paused',
  'scrollTrigger',
  'spring',
])

export interface TweenVars {
  /** Seconds (GSAP's unit), converted to milliseconds by the facade */
  duration?: number
  delay?: number
  ease?: string | EasingType | ((t: number) => number)
  repeat?: number
  repeatDelay?: number
  yoyo?: boolean
  stagger?: number | GsapStagger
  onComplete?: () => void
  onUpdate?: () => void
  onStart?: () => void
  /** Each time a repeat begins */
  onRepeat?: () => void
  /** On arriving back at the start after `reverse()` */
  onReverseComplete?: () => void
  /** Rebuild on every repeat, so function and `"random(…)"` values are drawn again each loop */
  repeatRefresh?: boolean
  /** Consecutive segments: an array of tweens, percentages of `duration`, or value arrays (live) */
  keyframes?: unknown
  /** The ease of each segment in percentage / value-array keyframes (default 'power1.inOut') */
  easeEach?: string
  id?: string
  paused?: boolean
  /** Animate numeric properties with spring physics instead of duration + ease — see spring-vars.ts */
  spring?: SpringVars
  /** Tie the tween to scrolling (live only) — see live-scroll.ts */
  scrollTrigger?: ScrollTriggerVars
  /** Any other key is a property to animate */
  [property: string]: unknown
}

/** GSAP's stagger object, in seconds. */
export interface GsapStagger {
  each?: number
  amount?: number
  /** Where the ripple starts; `'random'` and `[x, y]` ratios too, with explicit offsets */
  from?: StaggerFrom | 'random' | [number, number]
  /** `[rows, columns]`, or `'auto'` to read rows from the layout (live) */
  grid?: [number, number] | 'auto'
  /** Measure distance along one axis only */
  axis?: 'x' | 'y'
  /** Distribute the offsets through an ease */
  ease?: string
}

export interface SplitVars {
  /** Scheduling and lifecycle options */
  config: TweenVars
  /** Property name → target value */
  properties: Record<string, unknown>
}

/** Split a vars object into its configuration and its animated properties. */
export function splitVars(vars: TweenVars): SplitVars {
  const config: TweenVars = {}
  const properties: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(vars)) {
    if (RESERVED_KEYS.has(key)) {
      config[key] = value
    } else {
      properties[key] = value
    }
  }

  return { config, properties }
}

/** Convert GSAP's seconds to the engine's milliseconds. */
export function toMs(seconds: number | undefined, fallback: number): number {
  return seconds === undefined ? fallback : seconds * 1000
}

/** What an advanced stagger (grid, random, eased) needs to be worked out. */
export interface StaggerContext {
  count: number
  /** How many targets share the first row, for `grid: 'auto'` */
  columnsFromLayout?: () => number
  random?: () => number
}

/** Convert a GSAP stagger (seconds) to the engine's StaggerConfig (ms). */
export function toStaggerConfig(stagger: number | GsapStagger | undefined, context?: StaggerContext): StaggerConfig | undefined {
  if (stagger === undefined) return undefined
  if (typeof stagger === 'number') return { each: stagger * 1000 }
  if (needsExplicitOffsets(stagger)) {
    const offsets = gridOffsets(context?.count ?? 0, stagger as GridStagger, context ?? {})
    return { offsets: offsets.map((seconds) => seconds * 1000) }
  }

  return {
    ...(stagger.each !== undefined && { each: stagger.each * 1000 }),
    ...(stagger.amount !== undefined && { amount: stagger.amount * 1000 }),
    ...(stagger.from !== undefined && { from: stagger.from as StaggerFrom }),
  }
}

/** Re-exported so callers only import from one place. */
export type { Position }
