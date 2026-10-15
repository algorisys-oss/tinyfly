import { compile, compileDerivative, type Scope } from '../expr/evaluate'
import type { MathItem } from './figure-spec'
import { distributionOf, numOf, type Values } from './item-context'
import { density, isDiscrete, meanOf, samples, sdOf } from '../prob/distributions'
import { summary } from '../prob/histogram'
import { leastSquares, scatterPoints } from '../prob/scatter'
import { bayesAreas } from '../prob/bayes'
import { evaluate } from '../expr/evaluate'
import { parseExpression } from '../expr/parse-expression'
import { pointsSpec, sampleCount } from './items/probability'

/**
 * Numbers items work out from the figure's values, so TeX can show them with
 * `\val{…}`: a tangent's `ID.slope`, `ID.x` and `ID.y`; a Riemann sum's
 * `ID.sum`, `ID.exact` (the integral) and `ID.n`; an area's `ID.value`; a
 * point on a curve's `ID.x` and `ID.y`; a Taylor polynomial's `ID.order` and `ID.degree`.
 * Pure: worked out again from the values at every moment.
 */

/** ∫ f from a to b by Simpson's rule (512 panels): accurate for smooth teaching functions. */
export function integrate(f: (x: number) => number, a: number, b: number, panels = 512): number {
  if (a === b) return 0
  const h = (b - a) / panels
  let sum = f(a) + f(b)
  for (let i = 1; i < panels; i++) sum += f(a + i * h) * (i % 2 ? 4 : 2)
  return (sum * h) / 3
}

/** The sample points of a Riemann sum's pieces: [left, right, height] each. */
export function riemannPieces(f: (x: number) => number, a: number, b: number, n: number, rule: 'left' | 'right' | 'midpoint' | 'trapezoid'): [number, number, number, number][] {
  const width = (b - a) / n
  return Array.from({ length: n }, (_, i) => {
    const left = a + i * width
    const right = left + width
    // [left, right, height at left edge, height at right edge]: equal except for trapezoids.
    if (rule === 'trapezoid') return [left, right, f(left), f(right)]
    const h = rule === 'left' ? f(left) : rule === 'right' ? f(right) : f((left + right) / 2)
    return [left, right, h, h]
  })
}

/** How many Riemann pieces a value asks for: a whole number from 1 to 400. */
export const pieceCount = (n: number) => Math.min(400, Math.max(1, Math.round(n)))

export function derivedValues(items: MathItem[], values: Values, scope: Scope): Scope {
  const derived: Scope = {}
  const read = { ...scope }
  for (const item of items) {
    switch (item.kind) {
      case 'tangent': {
        const f = compile(item.expr)
        const x = numOf(values, item.at)
        const h = item.h === undefined ? 0 : numOf(values, item.h)
        const slope = Math.abs(h) > 1e-9 ? (f(x + h, read) - f(x, read)) / h : compileDerivative(item.expr, 1)(x, read)
        Object.assign(derived, { [`${item.id}.slope`]: slope, [`${item.id}.x`]: x, [`${item.id}.y`]: f(x, read) })
        break
      }
      case 'riemann': {
        const f = compile(item.expr)
        const a = numOf(values, item.from)
        const b = numOf(values, item.to)
        const n = pieceCount(numOf(values, item.n))
        const pieces = riemannPieces((x) => f(x, read), a, b, n, item.rule ?? 'left')
        const sum = pieces.reduce((total, [left, right, h1, h2]) => total + ((h1 + h2) / 2) * (right - left), 0)
        Object.assign(derived, { [`${item.id}.sum`]: sum, [`${item.id}.exact`]: integrate((x) => f(x, read), a, b), [`${item.id}.n`]: n })
        break
      }
      case 'area': {
        const f = compile(item.expr)
        const g = item.lower ? compile(item.lower) : () => 0
        derived[`${item.id}.value`] = integrate((x) => f(x, read) - g(x, read), numOf(values, item.from), numOf(values, item.to))
        break
      }
      case 'point':
        if (item.on !== undefined && item.x !== undefined) {
          const x = numOf(values, item.x)
          Object.assign(derived, { [`${item.id}.x`]: x, [`${item.id}.y`]: compile(item.on)(x, read) })
        }
        break
      case 'histogram': {
        const drawn = samples(distributionOf(values, item.distribution), item.seed ?? item.id, sampleCount(numOf(values, item.count)))
        const { mean, sd } = summary(drawn)
        Object.assign(derived, { [`${item.id}.count`]: drawn.length, [`${item.id}.mean`]: mean, [`${item.id}.sd`]: sd })
        break
      }
      case 'distribution': {
        const d = distributionOf(values, item.distribution)
        let p = 0
        if (item.shade) {
          const [a, b] = [numOf(values, item.shade[0]), numOf(values, item.shade[1])].sort((x, y) => x - y)
          if (isDiscrete(d)) {
            for (let k = Math.max(0, Math.ceil(a)); k <= Math.floor(b) && k <= 5000; k++) p += density(d, k)
          } else {
            p = integrate((x) => density(d, x), a, b, 2048)
          }
        }
        Object.assign(derived, { [`${item.id}.p`]: p, [`${item.id}.mean`]: meanOf(d), [`${item.id}.sd`]: sdOf(d) })
        break
      }
      case 'galton':
        derived[`${item.id}.landed`] = Math.max(0, Math.floor(numOf(values, item.balls)))
        break
      case 'scatter': {
        const points = scatterPoints(pointsSpec(item, { values }), item.seed ?? item.id, sampleCount(numOf(values, item.count)))
        const test = item.inside ? parseExpression(item.inside) : undefined
        const inside = test ? points.filter(([x, y]) => evaluate(test, { ...read, x, y }) <= 0).length : 0
        const fit = leastSquares(points)
        Object.assign(derived, {
          [`${item.id}.count`]: points.length,
          [`${item.id}.inside`]: inside,
          [`${item.id}.ratio`]: points.length ? inside / points.length : 0,
          [`${item.id}.slope`]: fit?.slope ?? 0,
          [`${item.id}.intercept`]: fit?.intercept ?? 0,
          [`${item.id}.r`]: fit?.r ?? 0,
        })
        break
      }
      case 'bayes': {
        const prior = numOf(values, item.prior)
        const areas = bayesAreas(prior, numOf(values, item.truePositive), numOf(values, item.falsePositive))
        Object.assign(derived, { [`${item.id}.prior`]: prior, [`${item.id}.posterior`]: areas.posterior, [`${item.id}.positive`]: areas.positive, [`${item.id}.truePositive`]: areas.truePositive, [`${item.id}.falsePositive`]: areas.falsePositive })
        break
      }
      case 'taylor':
        derived[`${item.id}.order`] = Math.min(20, Math.max(0, numOf(values, item.order)))
        // The whole terms in so far (the order part way to the next counts as the one before).
        derived[`${item.id}.degree`] = Math.floor(derived[`${item.id}.order`])
        break
    }
  }
  return derived
}
