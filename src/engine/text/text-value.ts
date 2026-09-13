/**
 * Text animation: the string a text track shows at a moment in time.
 *
 * Pure and deterministic. "Random" scramble characters come from a hash of the
 * seed, the character's position and the current refresh step — never from
 * Math.random — so scrubbing backwards shows exactly what playing forwards did,
 * and every export of the same timeline matches.
 */

import type { TextChars, TextConfig } from '../types'

const CHARACTER_SETS: Record<string, string> = {
  upperCase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowerCase: 'abcdefghijklmnopqrstuvwxyz',
  upperAndLowerCase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
}

const DEFAULT_REFRESH_RATE = 20

/** The characters a `chars` setting names (split by code point, so emoji work). */
export function charactersFor(chars: TextChars | undefined): string[] {
  const set = CHARACTER_SETS[chars ?? 'upperCase'] ?? chars ?? CHARACTER_SETS.upperCase
  const list = Array.from(set)
  return list.length > 0 ? list : Array.from(CHARACTER_SETS.upperCase)
}

/** A well-mixed 32-bit hash of three integers (a small, fixed avalanche mix). */
function hash(seed: number, index: number, step: number): number {
  let h = (seed | 0) ^ Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(step + 1, 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d)
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b)
  return (h ^ (h >>> 16)) >>> 0
}

/**
 * The text at `progress` (0–1, already eased) after `elapsedMs` of the tween.
 * Progress 0 returns `from` and progress 1 returns `to`, exactly.
 */
export function textAt(config: TextConfig, progress: number, elapsedMs = 0): string {
  const from = config.from ?? ''
  const to = config.to
  const p = Math.max(0, Math.min(1, progress))
  if (p <= 0) return from
  if (p >= 1) return to

  const fromChars = Array.from(from)
  const toChars = Array.from(to)
  const rightToLeft = config.rightToLeft ?? false

  if (config.mode === 'type') {
    // The new text overwrites the old one character at a time, over the longer
    // of the two — so typing towards a shorter (or empty) string deletes
    // character by character instead of all at once at the end.
    const steps = Math.round(p * Math.max(fromChars.length, toChars.length))
    if (rightToLeft) {
      const kept = fromChars.slice(0, Math.max(0, fromChars.length - steps))
      return kept.join('') + toChars.slice(Math.max(0, toChars.length - steps)).join('')
    }
    return toChars.slice(0, steps).join('') + fromChars.slice(steps).join('')
  }

  // Scramble.
  const delay = Math.max(0, Math.min(0.999, config.revealDelay ?? 0))
  const reveal = Math.max(0, (p - delay) / (1 - delay))
  const revealed = Math.floor(reveal * toChars.length)

  const length =
    config.tweenLength === false
      ? toChars.length
      : Math.round(fromChars.length + (toChars.length - fromChars.length) * p)

  const pool = charactersFor(config.chars)
  const refreshRate = config.refreshRate ?? DEFAULT_REFRESH_RATE
  const step = refreshRate > 0 ? Math.floor((elapsedMs * refreshRate) / 1000) : 0
  const seed = config.seed ?? 1

  let out = ''
  for (let i = 0; i < length; i++) {
    const settled = rightToLeft ? i >= length - revealed : i < revealed
    const target = rightToLeft ? toChars[toChars.length - (length - i)] : toChars[i]

    if (settled && target !== undefined) {
      out += target
    } else if (target === ' ' || target === '\n') {
      // Keep word shapes readable while the rest scrambles.
      out += target
    } else {
      out += pool[hash(seed, i, step) % pool.length]
    }
  }
  return out
}
