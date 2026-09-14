import type { TweenVars } from './vars'

/**
 * GSAP's tween `keyframes`, expanded into consecutive segment tweens.
 *
 * Three forms are accepted:
 *
 *     keyframes: [{ x: 100, duration: 0.4 }, { y: 50, ease: 'back.out' }]        // array: each is a tween
 *     keyframes: { '0%': { x: 0 }, '50%': { x: 100 }, '100%': { x: 0 } }        // percentages of `duration`
 *     keyframes: { x: [0, 100, 50], y: [0, -20, 0], easeEach: 'sine.inOut' }    // values spread evenly
 *
 * Segments play one after another. In the percentage and value forms the
 * tween's `duration` is shared out between them, each segment is eased with its
 * own `ease`, then `easeEach` (default `'power1.inOut'`, as GSAP). Settings that
 * belong to the whole animation (delay, stagger, repeat, callbacks, scroll
 * trigger) stay on the outer tween.
 */

/** Keys that describe the whole keyframed tween rather than one segment. */
const OUTER_KEYS = new Set([
  'keyframes',
  'duration',
  'delay',
  'ease',
  'easeEach',
  'stagger',
  'repeat',
  'repeatDelay',
  'yoyo',
  'repeatRefresh',
  'paused',
  'id',
  'onStart',
  'onUpdate',
  'onComplete',
  'onRepeat',
  'onReverseComplete',
  'scrollTrigger',
])

const DEFAULT_SEGMENT_DURATION = 0.5
const DEFAULT_EASE_EACH = 'power1.inOut'

export type KeyframesVars =
  | TweenVars[]
  | Record<`${number}%`, TweenVars>
  | ({ easeEach?: string } & Record<string, unknown[] | string | undefined>)

/** Whether vars use `keyframes`. */
export function hasKeyframes(vars: TweenVars): boolean {
  return vars.keyframes !== undefined && vars.keyframes !== null
}

/** The consecutive segment tweens a keyframed tween plays. */
export function expandKeyframes(vars: TweenVars): TweenVars[] {
  const keyframes = vars.keyframes as KeyframesVars
  const shared: TweenVars = {}
  for (const [key, value] of Object.entries(vars)) if (!OUTER_KEYS.has(key)) shared[key] = value

  if (Array.isArray(keyframes)) {
    return keyframes.map((step) => ({
      ...shared,
      ...step,
      duration: (step.duration as number | undefined) ?? (vars.duration as number | undefined) ?? DEFAULT_SEGMENT_DURATION,
    }))
  }

  const entries = Object.entries(keyframes)
  const total = (vars.duration as number | undefined) ?? DEFAULT_SEGMENT_DURATION
  const easeEach = ((keyframes as { easeEach?: string }).easeEach ?? (vars.easeEach as string | undefined)) ?? DEFAULT_EASE_EACH

  // Percentages: "0%", "50%", "100%".
  if (entries.length > 0 && entries.every(([key]) => /^\s*-?\d+(\.\d+)?\s*%\s*$/.test(key) || key === 'easeEach')) {
    const stops = entries
      .filter(([key]) => key !== 'easeEach')
      .map(([key, step]) => ({ at: Number.parseFloat(key) / 100, step: step as TweenVars }))
      .sort((a, b) => a.at - b.at)
    const segments: TweenVars[] = []
    let previous = 0
    for (const { at, step } of stops) {
      const span = Math.max(0, at - previous)
      // A "0%" stop sets the starting values instantly.
      segments.push({ ...shared, ease: easeEach, ...step, duration: span * total })
      previous = at
    }
    return segments
  }

  // Arrays of values per property, spread evenly.
  const properties = entries.filter(([key, value]) => key !== 'easeEach' && Array.isArray(value)) as Array<[string, unknown[]]>
  const count = Math.max(0, ...properties.map(([, values]) => values.length))
  const segments: TweenVars[] = []
  for (let i = 0; i < count; i++) {
    const step: TweenVars = { ...shared, ease: easeEach, duration: total / count }
    for (const [property, values] of properties) {
      if (i < values.length) step[property] = values[i]
    }
    segments.push(step)
  }
  return segments
}
