import type { TweenVars } from './vars'

/**
 * GSAP's `drawSVG` option: animate how much of a stroke is drawn.
 *
 *     live.from('.line', { drawSVG: 0, duration: 1 })          // draw in from nothing
 *     live.to('.line', { drawSVG: '40% 60%', duration: 1 })    // shrink to the middle fifth
 *
 * A visible segment [start, end] along a path of length L is one dash of
 * `end - start` followed by a gap of L (so no second dash ever shows), shifted
 * back by `start`:
 *
 *     stroke-dasharray: <end - start> <L>;  stroke-dashoffset: <-start>
 *
 * Both are plain numeric values, so a draw compiles to ordinary tracks on
 * `strokeDasharray` (a two-number array) and `strokeDashoffset`. Only the length
 * needs the page, so `live` measures it once per element.
 */

export type DrawSvgValue = boolean | number | string

/**
 * The visible segment `[start, end]` in px for a `drawSVG` value on a path of
 * `length`:
 * - `true` → the whole stroke; `false` → none
 * - a number → that many px from the start
 * - `'60%'` → the first 60%; `'20% 80%'` → from 20% to 80%
 * - `'10 50'` → px, and units may mix: `'10 50%'`
 */
export function drawSegment(value: DrawSvgValue, length: number): [number, number] {
  if (value === true) return [0, length]
  if (value === false) return [0, 0]
  if (typeof value === 'number') return [0, clamp(value, length)]

  const tokens = value.trim().split(/[\s,]+/).filter(Boolean)
  const resolve = (token: string): number => {
    const amount = Number.parseFloat(token)
    if (Number.isNaN(amount)) throw new Error(`gsap-compat: drawSVG "${value}" is not a length or percentage`)
    return clamp(token.endsWith('%') ? (length * amount) / 100 : amount, length)
  }

  if (tokens.length === 0) return [0, length]
  if (tokens.length === 1) return [0, resolve(tokens[0])]
  const a = resolve(tokens[0])
  const b = resolve(tokens[1])
  return a <= b ? [a, b] : [b, a]
}

/** The dash values that draw `[start, end]` of a stroke `length` long. */
export function drawSvgProperties(value: DrawSvgValue, length: number): { strokeDasharray: number[]; strokeDashoffset: number } {
  const [start, end] = drawSegment(value, length)
  return { strokeDasharray: [end - start, length], strokeDashoffset: -start }
}

/** Replace `drawSVG` with dash properties for a stroke of `length`. */
export function resolveDrawSvg(vars: TweenVars, length: number): TweenVars {
  if (vars.drawSVG === undefined) return vars
  const { drawSVG, ...rest } = vars
  return { ...rest, ...drawSvgProperties(drawSVG as DrawSvgValue, length) }
}

/** `drawSVG` needs a stroke's length, which only the page has. */
export function rejectUnresolvedDrawSvg(vars: TweenVars): TweenVars {
  if (vars.drawSVG !== undefined) {
    throw new Error(
      'gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate ' +
        'strokeDasharray / strokeDashoffset directly (see drawSvgProperties).'
    )
  }
  return vars
}

function clamp(value: number, length: number): number {
  return Math.max(0, Math.min(length, value))
}
