import { describe, it, expect } from 'vitest'
import { layoutFigure } from './layout-figure'
import { validateMathFigure } from './validate-spec'
import { integrate, riemannPieces } from './derived'
import type { MathFigureSpec } from './figure-spec'
import type { Shape } from './display-list'
import { areaFigure, limitFigure, riemannFigure, secantFigure, tangentFigure, taylorFigure } from '../presets/calculus'
import { planeOf } from './plane'

const shapes = (spec: MathFigureSpec, props = {}) => layoutFigure(validateMathFigure(spec), props).shapes
const of = (list: Shape[], id: string) => list.filter((s) => s.id === id || s.id.startsWith(`${id}.`))
const text = (list: Shape[], id: string) => of(list, id).map((s) => (s.type === 'text' ? s.text : '')).join('')

describe('calculus helpers', () => {
  it('integrates smooth functions accurately', () => {
    expect(integrate(Math.sin, 0, Math.PI)).toBeCloseTo(2, 9)
    expect(integrate((x) => x * x, 0, 3)).toBeCloseTo(9, 9)
    expect(integrate(Math.exp, 1, 1)).toBe(0)
  })

  it('places Riemann pieces by rule', () => {
    const f = (x: number) => x
    expect(riemannPieces(f, 0, 2, 2, 'left').map((p) => p[2])).toEqual([0, 1])
    expect(riemannPieces(f, 0, 2, 2, 'right').map((p) => p[2])).toEqual([1, 2])
    expect(riemannPieces(f, 0, 2, 2, 'midpoint').map((p) => p[2])).toEqual([0.5, 1.5])
    expect(riemannPieces(f, 0, 2, 2, 'trapezoid')[0]).toEqual([0, 1, 0, 1])
  })
})

describe('calculus items', () => {
  it('shows a tangent with its exact slope, and a secant that becomes it', () => {
    const tangent = shapes(tangentFigure({ expr: 'x^2', at: 1.5 }))
    expect(text(tangent, 'tangent.label')).toBe('slope=3')
    const secant = secantFigure({ expr: 'x^2', at: 1, h: 2 })
    expect(text(shapes(secant), 'secant.label')).toBe('ΔyΔx=4') // (9 − 1) / 2
    expect(text(shapes(secant, { h: 0.001 }), 'secant.label')).toBe('ΔyΔx=2') // → 2x at 1
    expect(of(shapes(secant, { h: 0 }), 'secant.secant')).toHaveLength(0) // one point when h is 0
  })

  it('sums Riemann rectangles toward the integral as n grows', () => {
    const figure = riemannFigure({ expr: 'x^2', from: 0, to: 3, n: 4 })
    const four = shapes(figure)
    expect(of(four, 'sum').filter((s) => s.type === 'line')).toHaveLength(4)
    expect(text(four, 'readout')).toContain('sum=5.906') // left sum, n = 4: 0.75 × (0 + 0.5625 + 2.25 + 5.0625)
    expect(text(shapes(figure, { n: 300 }), 'readout')).toMatch(/sum=8\.9\d\d/)
    expect(text(four, 'readout')).toContain('=9') // the exact integral
    // Drawn on piece by piece.
    expect(of(shapes(figure, { 'sum.draw': 0.5 }), 'sum')).toHaveLength(2)
  })

  it('colours an area by sign, and grows it with its end', () => {
    const figure = areaFigure({ expr: 'sin(x)', from: 0, to: 5 })
    const parts = of(shapes(figure), 'area')
    expect(parts).toHaveLength(2) // above, then below, split at π
    expect(new Set(parts.map((p) => (p.type === 'line' ? p.fill : '')))).toHaveProperty('size', 2)
    expect(text(shapes(figure, { b: Math.PI }), 'readout')).toContain('=2')
  })

  it('builds Taylor polynomials from exact derivatives', () => {
    const plane = planeOf({ width: 600, height: 600 })
    const end = (order: number) => {
      const [line] = of(shapes(taylorFigure({ expr: 'exp(x)', order: 0 }), { order }), 'taylor')
      return line.type === 'line' ? plane.toWorld(line.points[0])[1] : NaN // at x = −5
    }
    expect(end(0)).toBeCloseTo(1) // the constant term
    expect(end(1)).toBeCloseTo(-4) // 1 + x
    expect(end(2)).toBeCloseTo(-4 + 12.5) // + x²/2
    expect(end(1.5)).toBeCloseTo((end(1) + end(2)) / 2) // half of the next term
    expect(text(shapes(taylorFigure({ expr: 'sin(x)', order: 2.5 })), 'readout')).toBe('degree2')
  })

  it('rides a point along a curve, beside a hollow point', () => {
    const figure = limitFigure({ expr: 'sin(x) / x', at: 0, limit: 1, from: -0.5 })
    const list = shapes(figure, { p: -0.01 })
    expect(text(list, 'readout')).toBe('f(−0.01)=1')
    const [hole] = of(list, 'hole')
    expect(hole.type === 'circle' && hole.stroke).toBeTruthy()
  })

  it('plots exact derivatives', () => {
    const spec: MathFigureSpec = { width: 600, height: 600, items: [{ id: 'd', kind: 'function', expr: 'x^3', derivative: 2 }] }
    const [line] = of(shapes(spec), 'd')
    const plane = planeOf(spec)
    const [x, y] = plane.toWorld(line.type === 'line' ? line.points[0] : [0, 0])
    expect(y).toBeCloseTo(6 * x) // (x³)″ = 6x
  })

  it('says how to fix calculus items', () => {
    const base = { width: 600, height: 600 }
    expect(() => validateMathFigure({ ...base, items: [{ id: 't', kind: 'tangent', expr: 'floor(x)', at: 0 }] })).toThrow(/no derivative rule/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'r', kind: 'riemann', expr: 'x', from: 0, to: 1, n: 'm' }] })).toThrow(/value/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'r', kind: 'riemann', expr: 'x', from: 0, to: 1, n: 4, rule: 'centre' as never }] })).toThrow(/rule/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'p', kind: 'point', on: 'x^2' }] })).toThrow(/needs x/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'p', kind: 'point' }] })).toThrow(/needs at, or on/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'l', kind: 'label', tex: '\\val{r.sum}', at: [0, 0] }] })).toThrow(/no value named "r.sum"/)
  })
})
