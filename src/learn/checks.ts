import { mapEase } from '../compat/gsap'
import type { Check, CheckContext } from './types'

/**
 * Check builders for lessons. Each returns a `Check` whose failure message says
 * what is still wrong, in the learner's terms (selectors and seconds, not track ids).
 */

const format = (value: unknown) => (typeof value === 'number' ? String(Math.round(value * 100) / 100) : JSON.stringify(value))
const near = (a: unknown, b: number, tolerance = 0.5) => typeof a === 'number' && Math.abs(a - b) <= tolerance

export function animates(selector: string, property: string): Check {
  return {
    label: `Animate \`${property}\` on \`${selector}\``,
    test: (context) => context.tracks(selector, property).length > 0 || `Nothing animates \`${property}\` on \`${selector}\` yet.`,
  }
}

/** The value `seconds` in; defaults to the end of the animation. */
export function valueIs(selector: string, property: string, expected: number, seconds?: number): Check {
  const when = seconds === undefined ? 'at the end' : `at ${seconds}s`
  return {
    label: `\`${selector}\` has \`${property}: ${expected}\` ${when}`,
    test: (context) => {
      const at = seconds ?? endOf(context)
      const actual = context.valueAt(selector, property, at)
      if (actual === undefined) return `Nothing animates \`${property}\` on \`${selector}\` yet.`
      return near(actual, expected) || `\`${property}\` is ${format(actual)} ${when}, not ${expected}.`
    },
  }
}

export function durationIs(seconds: number): Check {
  return {
    label: `Lasts ${seconds}s`,
    test: (context) => {
      const actual = context.duration()
      return Math.abs(actual - seconds) < 0.01 || `It lasts ${format(actual)}s; make it ${seconds}s.`
    },
  }
}

export function easeIs(selector: string, property: string, ease: string): Check {
  const expected = JSON.stringify(mapEase(ease).easing)
  return {
    label: `Uses \`ease: '${ease}'\``,
    test: (context) => {
      const [track] = context.tracks(selector, property)
      if (!track || !('keyframes' in track)) return `Nothing animates \`${property}\` on \`${selector}\` yet.`
      const last = track.keyframes[track.keyframes.length - 1] as { easing?: unknown }
      return JSON.stringify(last.easing) === expected || `The ease isn't \`'${ease}'\` yet.`
    },
  }
}

export function staggerIs(selector: string, property: string, each: number, from?: string): Check {
  return {
    label: `Staggered ${each}s apart${from ? ` from the ${from}` : ''}`,
    test: (context) => {
      const [track] = context.tracks(selector, property)
      const stagger = track && 'stagger' in track ? track.stagger : undefined
      if (!stagger) return 'The elements all start together; add `stagger`.'
      if (!near(stagger.each, each * 1000, 1)) return `They start ${format((stagger.each ?? 0) / 1000)}s apart, not ${each}s.`
      if (from && stagger.from !== from) return `The stagger runs from the ${stagger.from ?? 'start'}, not the ${from}.`
      return true
    },
  }
}

export function timelineCount(count: number): Check {
  return {
    label: count === 1 ? 'Built as one timeline' : `Built as ${count} timelines`,
    test: (context) => context.definitions.length === count || `The code builds ${context.definitions.length} timelines; use ${count === 1 ? 'one `live.timeline()`' : count}.`,
  }
}

export function custom(label: string, test: (context: CheckContext) => true | string): Check {
  return { label, test }
}

/** A moment near the end of the animation, or 10s in for endless ones. */
function endOf(context: CheckContext): number {
  const duration = context.duration()
  return Number.isFinite(duration) ? duration : 10
}
