import type { MathFigureSpec, MathItem, MathThemeName } from '../figure/figure-spec'

/**
 * Ready-made calculus figures. Each returns a plain MathFigureSpec whose
 * moving parts are number values, so a timeline (or a slider) slides the
 * point, shrinks the secant, adds rectangles or Taylor terms:
 *
 * - tangentFigure: value `a`, the point of tangency
 * - secantFigure: values `a` and `h`; key `h` toward 0 to watch the secant become the tangent
 * - riemannFigure: value `n`, the number of rectangles
 * - areaFigure: value `b`, the right end of the shaded area
 * - taylorFigure: value `order`, the degree (fractional values grow the next term in)
 * - limitFigure: value `p`, a point sliding along the curve toward the hole at `at`
 */
export interface CalculusOptions {
  width?: number
  height?: number
  theme?: MathThemeName
  /** World x range (default [-5, 5]) */
  x?: [number, number]
  /** World y range (default: centred on 0 with square units) */
  y?: [number, number]
  /** The function, an expression in x */
  expr: string
}

const base = (options: CalculusOptions, values: Record<string, number>, items: MathItem[]): MathFigureSpec => ({
  width: options.width ?? 600,
  height: options.height ?? 600,
  ...(options.theme ? { theme: options.theme } : {}),
  ...(options.x ? { x: options.x } : {}),
  ...(options.y ? { y: options.y } : {}),
  values,
  items: [{ id: 'axes', kind: 'axes' }, { id: 'f', kind: 'function', expr: options.expr, color: 'blue' }, ...items],
})

/** The tangent at x = a, with its slope shown. */
export function tangentFigure(options: CalculusOptions & { at?: number }): MathFigureSpec {
  return base(options, { a: options.at ?? 1 }, [
    { id: 'tangent', kind: 'tangent', expr: options.expr, at: 'a', color: 'yellow', label: '\\text{slope} = \\val{tangent.slope}' },
  ])
}

/** The secant through x = a and x = a + h; shrink `h` to 0 and it becomes the tangent. */
export function secantFigure(options: CalculusOptions & { at?: number; h?: number }): MathFigureSpec {
  return base(options, { a: options.at ?? 1, h: options.h ?? 2 }, [
    { id: 'secant', kind: 'tangent', expr: options.expr, at: 'a', h: 'h', color: 'yellow', label: '\\frac{\\Delta y}{\\Delta x} = \\val{secant.slope}' },
  ])
}

/** n rectangles under the curve from `from` to `to`, their total beside the exact area. */
export function riemannFigure(options: CalculusOptions & { from: number; to: number; n?: number; rule?: 'left' | 'right' | 'midpoint' | 'trapezoid' }): MathFigureSpec {
  const figure = base(options, { n: options.n ?? 4 }, [
    { id: 'sum', kind: 'riemann', expr: options.expr, from: options.from, to: options.to, n: 'n', rule: options.rule ?? 'left', color: 'teal' },
  ])
  // The curve over the rectangles.
  figure.items.push(figure.items.splice(1, 1)[0])
  figure.items.push({
    id: 'readout', kind: 'label', screen: true, align: 'left', size: 24,
    at: [(options.width ?? 600) * 0.05, (options.height ?? 600) * 0.08],
    tex: `n = \\val{sum.n:0} \\quad \\text{sum} = \\val{sum.sum:3} \\quad \\int = \\val{sum.exact:3}`,
  })
  return figure
}

/** The area under the curve from `from` to b, growing as `b` moves. */
export function areaFigure(options: CalculusOptions & { from: number; to: number }): MathFigureSpec {
  const figure = base(options, { b: options.to }, [
    { id: 'area', kind: 'area', expr: options.expr, from: options.from, to: 'b', color: 'teal' },
  ])
  figure.items.push(figure.items.splice(1, 1)[0])
  figure.items.push({
    id: 'readout', kind: 'label', screen: true, align: 'left', size: 26,
    at: [(options.width ?? 600) * 0.05, (options.height ?? 600) * 0.09],
    tex: `\\int_{${options.from}}^{\\val{b:2}} f(x)\\,dx = \\val{area.value:3}`,
  })
  return figure
}

/** Taylor polynomials of the function about x = at, degree `order`. */
export function taylorFigure(options: CalculusOptions & { at?: number; order?: number }): MathFigureSpec {
  const figure = base(options, { order: options.order ?? 1 }, [
    { id: 'taylor', kind: 'taylor', expr: options.expr, at: options.at ?? 0, order: 'order', color: 'yellow' },
    { id: 'centre', kind: 'point', on: options.expr, x: options.at ?? 0, color: 'yellow' },
  ])
  figure.items.push({
    id: 'readout', kind: 'label', screen: true, align: 'left', size: 26,
    at: [(options.width ?? 600) * 0.05, (options.height ?? 600) * 0.09],
    tex: '\\text{degree } \\val{taylor.degree:0}',
  })
  return figure
}

/**
 * A limit: a point sliding along the curve toward x = at, where the function
 * has a hole (pass `limit`, the value it approaches, to draw the hole there).
 */
export function limitFigure(options: CalculusOptions & { at: number; limit: number; from?: number }): MathFigureSpec {
  const figure = base(options, { p: options.from ?? options.at - 2 }, [
    { id: 'hole', kind: 'point', at: [options.at, options.limit], hollow: true, color: 'blue', radius: 7 },
    { id: 'moving', kind: 'point', on: options.expr, x: 'p', color: 'yellow' },
  ])
  figure.items.push({
    id: 'readout', kind: 'label', screen: true, align: 'left', size: 26,
    at: [(options.width ?? 600) * 0.05, (options.height ?? 600) * 0.09],
    tex: 'f(\\val{moving.x:3}) = \\val{moving.y:4}',
  })
  return figure
}
