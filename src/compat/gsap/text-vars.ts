import type { TextChars, TextConfig } from '../../engine'

/**
 * GSAP's TextPlugin (`text`) and ScrambleTextPlugin (`scrambleText`) tween
 * options, desugared to a text track.
 *
 *     tl.to('title', { text: 'Hello', duration: 1 })
 *     tl.to('title', { scrambleText: { text: 'Hello', chars: 'numbers' }, duration: 1.5 })
 *
 * The starting text is the one this timeline last set, or empty; `live` reads
 * the element's current text instead. Scramble characters are seeded from the
 * target and text, so the same script always scrambles the same way.
 */

export interface TypeTextVars {
  value: string
  rightToLeft?: boolean
}

export interface ScrambleTextVars {
  text: string
  /** `upperCase` (default), `lowerCase`, `upperAndLowerCase`, `numbers`, or your own characters */
  chars?: TextChars
  /** Seconds before characters start to settle */
  revealDelay?: number
  /** How fast random characters change: 1 is the default 20 per second */
  speed?: number
  /** Grow or shrink the length over the tween (default true) */
  tweenLength?: boolean
  rightToLeft?: boolean
  /** Fix the random sequence; by default it is derived from the target and text */
  seed?: number
}

export type TextValue = string | TypeTextVars
export type ScrambleTextValue = string | ScrambleTextVars

/** Everything but the start text, which the timeline resolves. */
export type TextConfigWithoutFrom = Omit<TextConfig, 'from'>

/** A small, stable string hash — for default scramble seeds. */
function stringHash(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619)
  return h >>> 0
}

/**
 * The text config a `text` or `scrambleText` value describes, or undefined if
 * neither is set. `durationMs` converts `revealDelay` seconds into a fraction.
 */
export function compileTextVars(
  properties: Record<string, unknown>,
  target: string,
  durationMs: number
): TextConfigWithoutFrom | undefined {
  if (properties.scrambleText !== undefined) {
    const value = properties.scrambleText as ScrambleTextValue
    const vars: ScrambleTextVars = typeof value === 'string' ? { text: value } : value
    if (typeof vars?.text !== 'string') {
      throw new Error('gsap-compat: scrambleText needs the text to end on — a string, or { text }.')
    }
    const revealDelay = vars.revealDelay && durationMs > 0 ? (vars.revealDelay * 1000) / durationMs : undefined
    return {
      to: vars.text,
      mode: 'scramble',
      ...(vars.chars !== undefined && { chars: vars.chars }),
      ...(vars.speed !== undefined && { refreshRate: 20 * vars.speed }),
      ...(revealDelay !== undefined && { revealDelay: Math.min(revealDelay, 0.999) }),
      ...(vars.tweenLength !== undefined && { tweenLength: vars.tweenLength }),
      ...(vars.rightToLeft !== undefined && { rightToLeft: vars.rightToLeft }),
      seed: vars.seed ?? stringHash(`${target}|${vars.text}`),
    }
  }

  if (properties.text !== undefined) {
    const value = properties.text as TextValue
    const vars: TypeTextVars = typeof value === 'string' ? { value } : value
    if (typeof vars?.value !== 'string') {
      throw new Error('gsap-compat: text needs the text to end on — a string, or { value }.')
    }
    return {
      to: vars.value,
      mode: 'type',
      ...(vars.rightToLeft !== undefined && { rightToLeft: vars.rightToLeft }),
    }
  }

  return undefined
}
