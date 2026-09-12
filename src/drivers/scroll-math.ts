/**
 * Pure scroll-position maths.
 *
 * Every DOM read lives in `scroll-driver.ts`; this module takes plain rectangles
 * and returns numbers, so the tricky part — resolving GSAP-style trigger strings
 * into pixel offsets — is unit-testable without a browser.
 */

/** A rectangle in viewport coordinates, matching the fields of a DOMRect. */
export interface Rect {
  top: number
  bottom: number
  height: number
}

/**
 * Where a trigger fires, as `"<element edge> <viewport edge>"`.
 *
 * `"top bottom"` means "when the element's top reaches the viewport's bottom".
 * Also accepts a bare percentage (`"50%"` of the element), a bare number
 * (pixels from the element's top), or a relative offset appended to either
 * (`"top bottom+=100"`).
 */
export type TriggerPosition = string | number

const EDGE_FRACTIONS: Record<string, number> = {
  top: 0,
  left: 0,
  start: 0,
  center: 0.5,
  centre: 0.5,
  middle: 0.5,
  bottom: 1,
  right: 1,
  end: 1,
}

/** Parse one edge token into a 0..1 fraction. Accepts keywords and percentages. */
export function parseEdge(token: string): number | undefined {
  const key = token.trim().toLowerCase()
  if (key in EDGE_FRACTIONS) return EDGE_FRACTIONS[key]

  if (key.endsWith('%')) {
    const pct = Number.parseFloat(key.slice(0, -1))
    return Number.isNaN(pct) ? undefined : pct / 100
  }

  return undefined
}

/** A parsed trigger position, before it is resolved against real geometry. */
export interface ParsedTrigger {
  /** Fraction down the element (0 = its top, 1 = its bottom) */
  elementFraction: number
  /** Fraction down the viewport (0 = its top, 1 = its bottom) */
  viewportFraction: number
  /** Extra pixels added after both fractions resolve */
  offsetPx: number
  /** Absolute pixel offset from the element's top, when given as a bare number */
  absolutePx?: number
}

/**
 * Parse a trigger string into its parts.
 *
 * Grammar: `<elementEdge> <viewportEdge>` with an optional `+=n` / `-=n` on
 * either token. A single token is read as the element edge with the viewport
 * edge defaulting to `top`, which matches ScrollTrigger's shorthand.
 */
export function parseTrigger(position: TriggerPosition): ParsedTrigger {
  if (typeof position === 'number') {
    return { elementFraction: 0, viewportFraction: 0, offsetPx: 0, absolutePx: position }
  }

  let offsetPx = 0

  // Pull out every relative offset before splitting on whitespace, so
  // "top bottom+=100" and "top+=50 bottom" both work.
  const withoutOffsets = position.replace(/([+-])=\s*(-?[\d.]+)/g, (_, sign: string, amount: string) => {
    offsetPx += (sign === '-' ? -1 : 1) * Number.parseFloat(amount)
    return ''
  })

  const tokens = withoutOffsets.trim().split(/\s+/).filter(Boolean)

  // A bare number means pixels from the element's top.
  if (tokens.length === 1 && /^-?[\d.]+$/.test(tokens[0])) {
    return {
      elementFraction: 0,
      viewportFraction: 0,
      offsetPx: 0,
      absolutePx: Number.parseFloat(tokens[0]) + offsetPx,
    }
  }

  const elementFraction = tokens[0] !== undefined ? parseEdge(tokens[0]) : undefined
  const viewportFraction = tokens[1] !== undefined ? parseEdge(tokens[1]) : undefined

  return {
    elementFraction: elementFraction ?? 0,
    viewportFraction: viewportFraction ?? 0,
    offsetPx,
  }
}

/**
 * Scroll distance from where the page is now to where the trigger fires.
 *
 * Positive means the trigger is still ahead (below the fold). This is expressed
 * relative to the current scroll position, so the caller never has to know the
 * document's absolute geometry.
 */
export function triggerDistance(
  rect: Rect,
  viewportHeight: number,
  position: TriggerPosition
): number {
  const parsed = parseTrigger(position)

  const elementPoint =
    parsed.absolutePx !== undefined
      ? rect.top + parsed.absolutePx
      : rect.top + rect.height * parsed.elementFraction

  const viewportPoint = viewportHeight * parsed.viewportFraction

  return elementPoint - viewportPoint + parsed.offsetPx
}

/**
 * How far between `start` and `end` the page has scrolled, as 0..1.
 *
 * Returns 0 before the start trigger and 1 after the end trigger, so a driver
 * can hold the timeline at either extreme without special-casing.
 */
export function scrollProgress(
  rect: Rect,
  viewportHeight: number,
  start: TriggerPosition,
  end: TriggerPosition
): number {
  const toStart = triggerDistance(rect, viewportHeight, start)
  const toEnd = triggerDistance(rect, viewportHeight, end)

  // Both distances shrink as the page scrolls down, and the gap between them is
  // constant: it is the scroll distance the animation spans. Progress is how
  // far past the start trigger we are, over that distance.
  //   toStart === 0  -> the start trigger is firing now      -> 0
  //   toEnd   === 0  -> the end trigger is firing now        -> 1
  const span = toEnd - toStart
  if (span <= 0) {
    // Degenerate range (end at or before start): treat it as fully scrolled
    // once the start has passed, rather than dividing by zero.
    return toStart <= 0 ? 1 : 0
  }

  return clamp01(-toStart / span)
}

/**
 * Clamp a number into 0..1.
 *
 * Normalises -0 to 0: dividing a zero numerator by a positive span yields -0,
 * which compares equal to 0 but prints differently and survives into serialized
 * output, so it is easiest to remove at the source.
 */
export function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value === 0 ? 0 : value
}

/**
 * Move `current` toward `target` by a fixed time constant — the smoothing
 * behind `scrub: <seconds>`.
 *
 * Exponential approach rather than a fixed step, so the result is stable across
 * frame rates. Note it is still frame-rate *dependent* in the sense that it
 * depends on elapsed time; `scrub: true` (no smoothing) is the exact path.
 */
export function smoothToward(
  current: number,
  target: number,
  smoothingSeconds: number,
  deltaMs: number
): number {
  if (smoothingSeconds <= 0) return target

  const factor = 1 - Math.exp(-(deltaMs / 1000) / smoothingSeconds)
  return current + (target - current) * factor
}
