import { determinant, IDENTITY, isMat2, type Mat2 } from '../linear/mat2'
import { isVec2, type Vec2 } from '../linear/vec2'
import type { DistributionRef, MathTheme, NumRef, VecRef } from './figure-spec'
import type { Distribution } from '../prob/distributions'
import type { Plane } from './plane'

/** Values by name, as the figure holds them at one moment. */
export type Values = Record<string, number | number[]>

/** What an item's layout reads: where it is, the values, its colours and how much of it shows. */
export interface ItemContext {
  plane: Plane
  theme: MathTheme
  values: Values
  /**
   * Numbers for expressions and `\val{…}`: every number value, plus for each
   * matrix `M.a M.b M.c M.d M.det` and for each vector `v.x v.y v.length`.
   */
  scope: Record<string, number>
  /** Drawn part, 0..1 */
  draw: number
  /** 0..1 */
  opacity: number
  /** The item's own props (`step` for an equation) */
  prop(name: string): number | undefined
}

/** Numbers for expressions and TeX values, from all values (see ItemContext.scope). */
export function scopeOf(values: Values): Record<string, number> {
  const scope: Record<string, number> = {}
  for (const [name, value] of Object.entries(values)) {
    if (typeof value === 'number') {
      scope[name] = value
    } else if (isMat2(value)) {
      const [a, b, c, d] = value
      Object.assign(scope, { [`${name}.a`]: a, [`${name}.b`]: b, [`${name}.c`]: c, [`${name}.d`]: d, [`${name}.det`]: determinant(value) })
    } else if (isVec2(value)) {
      Object.assign(scope, { [`${name}.x`]: value[0], [`${name}.y`]: value[1], [`${name}.length`]: Math.hypot(value[0], value[1]) })
    }
  }
  return scope
}

/** A theme colour by name, or the CSS colour as given, or the fallback. */
export function colorOf(theme: MathTheme, color: string | undefined, fallback: string): string {
  if (!color) return fallback
  return Object.prototype.hasOwnProperty.call(theme.colors, color) ? theme.colors[color] : color
}

/** A vector given directly or by value name. */
export function vecOf(values: Values, ref: VecRef): Vec2 {
  if (typeof ref !== 'string') return ref
  const value = values[ref]
  if (!isVec2(value)) throw new Error(`math figure: value "${ref}" is not an [x, y] vector`)
  return value
}

/** A matrix value by name; the identity when no name is given. */
export function matrixOf(values: Values, name: string | undefined): Mat2 {
  if (name === undefined) return IDENTITY
  const value = values[name]
  if (!isMat2(value)) throw new Error(`math figure: value "${name}" is not a [a, b, c, d] matrix`)
  return value
}

/** A number given directly or by the name of a number value. */
export function numOf(values: Values, ref: NumRef): number {
  if (typeof ref === 'number') return ref
  const value = values[ref]
  if (typeof value !== 'number') throw new Error(`math figure: value "${ref}" is not a number`)
  return value
}

/**
 * A distribution with its value names replaced by the values' numbers. Counts
 * (binomial n, dice count and sides, a mean's count) are rounded to whole numbers.
 */
export function distributionOf(values: Values, ref: DistributionRef): Distribution {
  const n = (r: NumRef | undefined) => (r === undefined ? undefined : numOf(values, r))
  const whole = (r: NumRef | undefined) => (r === undefined ? undefined : Math.round(numOf(values, r)))
  switch (ref.kind) {
    case 'normal': return { kind: 'normal', mean: n(ref.mean), sd: n(ref.sd) }
    case 'uniform': return { kind: 'uniform', min: n(ref.min), max: n(ref.max) }
    case 'exponential': return { kind: 'exponential', rate: n(ref.rate) }
    case 'binomial': return { kind: 'binomial', n: whole(ref.n)!, p: n(ref.p)! }
    case 'poisson': return { kind: 'poisson', rate: n(ref.rate)! }
    case 'dice': return { kind: 'dice', count: whole(ref.count), sides: whole(ref.sides) }
    case 'mean': return { kind: 'mean', of: distributionOf(values, ref.of), count: whole(ref.count)! }
  }
}
