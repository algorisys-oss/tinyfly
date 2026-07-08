import type { Keyframe } from '../../engine'

/** A track description ready to hand to the editor store's `addTracks`. */
export interface TrackInput {
  target: string
  property: string
  keyframes: Keyframe[]
}

/** Geometry for one letter of a split text element. */
export interface TypewriterLetter {
  /** Track target (the letter element's id). */
  target: string
  /** Absolute x of the letter box (top-left). */
  x: number
  /** Width of the letter box. */
  width: number
}

export interface TypewriterCursor {
  /** Track target (the cursor element's id). */
  target: string
  /** The cursor element's base x (its `left`), so x offsets are relative to it. */
  baseX: number
  /** Blink the cursor while/after typing. Defaults to true. */
  blink?: boolean
  /** Blink half-period in ms (time visible == time hidden). Defaults to 500. */
  blinkPeriod?: number
  /** How long the cursor keeps blinking after the last character. Defaults to 1500. */
  holdAfterMs?: number
}

export interface TypewriterOptions {
  /** Delay between characters in ms (typing speed). Defaults to 90. */
  charDelay?: number
  /** Time before the first character appears. Defaults to 0. */
  startTime?: number
  /** Optional blinking cursor that steps along with the reveal. */
  cursor?: TypewriterCursor
}

export interface TypewriterResult {
  tracks: TrackInput[]
  /** Total time (ms) from 0 to the end of the effect, including cursor hold. */
  duration: number
}

/**
 * Build the tracks for a typewriter reveal over a set of pre-split letters.
 *
 * Each letter is hidden until its reveal moment and then snaps on (a crisp
 * character-by-character reveal rather than a fade). An optional cursor steps to
 * the right edge of each revealed letter — held, then jumped in ~1ms so it reads
 * as discrete typing — and blinks throughout.
 *
 * Pure data: identical input always yields identical tracks, so the effect
 * serializes to JSON and plays anywhere the engine runs.
 */
export function buildTypewriter(
  letters: TypewriterLetter[],
  options: TypewriterOptions = {}
): TypewriterResult {
  const delay = Math.max(1, options.charDelay ?? 90)
  const start = Math.max(0, options.startTime ?? 0)
  const tracks: TrackInput[] = []

  // Reveal each letter: hidden (opacity 0) until its time, then instantly on.
  letters.forEach((letter, i) => {
    const t = start + i * delay
    const keyframes: Keyframe[] =
      t <= 0
        ? [{ time: 0, value: 1 }]
        : [
            { time: 0, value: 0 },
            { time: t, value: 0 },
            { time: t + 1, value: 1 },
          ]
    tracks.push({ target: letter.target, property: 'opacity', keyframes })
  })

  const typingEnd = start + Math.max(0, letters.length) * delay

  if (options.cursor && letters.length > 0) {
    const cursor = options.cursor
    const xKeyframes: Keyframe[] = []

    // Start at the left edge of the first letter before typing begins.
    const firstOffset = letters[0].x - cursor.baseX
    if (start > 0) {
      xKeyframes.push({ time: 0, value: firstOffset })
    }

    letters.forEach((letter, i) => {
      const t = start + i * delay
      const rightEdge = letter.x + letter.width - cursor.baseX
      // Snap to the right edge of the just-typed letter...
      xKeyframes.push({ time: t, value: rightEdge })
      // ...and hold there until just before the next character (1ms jump = crisp).
      if (i < letters.length - 1) {
        xKeyframes.push({ time: start + (i + 1) * delay - 1, value: rightEdge })
      }
    })

    tracks.push({ target: cursor.target, property: 'x', keyframes: xKeyframes })

    if (cursor.blink !== false) {
      const period = Math.max(60, cursor.blinkPeriod ?? 500)
      const end = typingEnd + Math.max(0, cursor.holdAfterMs ?? 1500)
      const blinkKeyframes: Keyframe[] = []
      let time = 0
      let visible = true
      while (time <= end) {
        blinkKeyframes.push({ time, value: visible ? 1 : 0 })
        time += period
        visible = !visible
      }
      tracks.push({ target: cursor.target, property: 'opacity', keyframes: blinkKeyframes })
    }
  }

  const cursorEnd = options.cursor && options.cursor.blink !== false
    ? typingEnd + (options.cursor.holdAfterMs ?? 1500)
    : typingEnd
  const duration = Math.max(typingEnd, cursorEnd) + 200

  return { tracks, duration }
}
