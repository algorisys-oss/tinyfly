import { describe, it, expect } from 'vitest'
import { layoutFigure } from './layout-figure'
import { validateMathFigure } from './validate-spec'
import { planeOf } from './plane'
import { trimPolylines, type Shape } from './display-list'
import type { MathFigureSpec } from './figure-spec'
import { determinantFigure, eigenFigure, linearMapFigure, spanFigure, vectorSumFigure } from '../presets/linear-algebra'

const shapesOf = (spec: MathFigureSpec, props = {}) => layoutFigure(validateMathFigure(spec), props).shapes
const byId = (shapes: Shape[], id: string) => shapes.filter((s) => s.id === id || s.id.startsWith(`${id}.`))

describe('plane', () => {
  it('maps world units (y up) to pixels (y down), square by default', () => {
    const plane = planeOf({ width: 600, height: 400 })
    expect(plane.toScreen([0, 0])).toEqual([300, 200])
    expect(plane.toScreen([5, 0])).toEqual([600, 200])
    expect(plane.toScreen([0, 1])).toEqual([300, 140]) // 60 px per unit both ways
    const [wx, wy] = plane.toWorld(plane.toScreen([1.5, -2]))
    expect(wx).toBeCloseTo(1.5)
    expect(wy).toBeCloseTo(-2)
  })
})

describe('trimPolylines', () => {
  it('draws runs on in order, by length', () => {
    const lines: [number, number][][] = [[[0, 0], [10, 0]], [[0, 10], [30, 10]]]
    expect(trimPolylines(lines, 0)).toEqual([])
    expect(trimPolylines(lines, 1)).toBe(lines)
    expect(trimPolylines(lines, 0.5)).toEqual([[[0, 0], [10, 0]], [[0, 10], [10, 10]]])
  })
})

describe('layoutFigure', () => {
  it('is deterministic', () => {
    const spec = linearMapFigure()
    expect(layoutFigure(spec, { M: [1, 1, 0, 1] })).toEqual(layoutFigure(spec, { M: [1, 1, 0, 1] }))
  })

  it('carries î and ĵ, the square and the grid with the matrix', () => {
    const plane = planeOf({ width: 600, height: 600 })
    const shapes = shapesOf(linearMapFigure(), { M: [2, 1, 0, 1] })
    const [i] = byId(shapes, 'basis.i')
    const [j] = byId(shapes, 'basis.j')
    expect(i.type === 'arrow' && i.points.at(-1)).toEqual(plane.toScreen([2, 0]))
    expect(j.type === 'arrow' && j.points.at(-1)).toEqual(plane.toScreen([1, 1]))
    const fill = byId(shapes, 'square.fill')[0]
    expect(fill.type === 'line' && fill.points).toEqual([[0, 0], [2, 0], [3, 1], [1, 1]].map((p) => plane.toScreen(p as [number, number])))
  })

  it('shows the live matrix and determinant as text', () => {
    const text = (shapes: Shape[], id: string) => byId(shapes, id).filter((s) => s.type === 'text').map((s) => (s.type === 'text' ? s.text : '')).join('')
    const shapes = shapesOf(determinantFigure(), { M: [2, 1, 0.5, 1.5] })
    expect(text(shapes, 'matrix')).toBe('210.51.5')
    expect(text(shapes, 'square')).toBe('det=2.5')
  })

  it('draws items on with ITEM.draw and hides them at 0', () => {
    const spec = linearMapFigure()
    const full = byId(shapesOf(spec, { 'basis.draw': 1 }), 'basis.i')[0]
    const half = byId(shapesOf(spec, { 'basis.draw': 0.5 }), 'basis.i')[0]
    expect(full.type === 'arrow' && half.type === 'arrow' && half.points[1][0]).toBeCloseTo(((full as { points: number[][] }).points[1][0] + 300) / 2)
    expect(byId(shapesOf(spec, { 'basis.draw': 0 }), 'basis')).toEqual([])
    // Labels wait until the vector is drawn.
    expect(byId(shapesOf(spec, { 'basis.draw': 0.5 }), 'basis').some((s) => s.type === 'text')).toBe(false)
  })

  it('draws one line per real eigenvector, and none for a rotation', () => {
    expect(byId(shapesOf(eigenFigure({ matrix: [3, 1, 0, 2] })), 'eigen')).toHaveLength(2)
    expect(byId(shapesOf(eigenFigure({ matrix: [0, -1, 1, 0] })), 'eigen')).toHaveLength(0)
  })

  it('breaks a plot at asymptotes and gaps instead of joining them', () => {
    const spec: MathFigureSpec = { width: 600, height: 600, items: [{ id: 'f', kind: 'function', expr: 'tan(x)' }] }
    expect(byId(shapesOf(spec), 'f').length).toBeGreaterThanOrEqual(3)
    const root: MathFigureSpec = { width: 600, height: 600, items: [{ id: 'f', kind: 'function', expr: 'sqrt(x)' }] }
    const [only] = byId(shapesOf(root), 'f')
    expect(only.type === 'line' && only.points[0][0]).toBeGreaterThanOrEqual(300) // starts at x = 0
  })

  it('reads number values as function parameters', () => {
    const spec: MathFigureSpec = { width: 600, height: 600, values: { k: 1 }, items: [{ id: 'f', kind: 'function', expr: 'k x' }] }
    const end = (props = {}) => {
      const [line] = byId(shapesOf(spec, props), 'f')
      return line.type === 'line' ? line.points.at(-1)![1] : NaN
    }
    expect(end({ k: 0 })).toBe(300)
    expect(end({ k: 1 })).toBeLessThan(end({ k: 0.5 }))
  })

  it('morphs an equation between steps with ITEM.step', () => {
    const spec: MathFigureSpec = { width: 600, height: 300, items: [{ id: 'eq', kind: 'equation', steps: ['2x + 3 = 7', '2x = 4'], at: [300, 150], screen: true, backdrop: false }] }
    const text = (step: number) => shapesOf(spec, { 'eq.step': step }).map((s) => (s.type === 'text' ? s.text : '')).join('')
    expect(text(0)).toBe('2x+3=7')
    expect(text(1)).toBe('2x=4')
    expect(text(0.5)).toBe('2x=') // + 3 7 gone, 4 not yet arrived
  })

  it('builds the other presets', () => {
    expect(shapesOf(vectorSumFigure({ u: [2, 1], v: [-1, 2] })).some((s) => s.id === 'arrowV')).toBe(true)
    expect(byId(shapesOf(spanFigure({ u: [1, 2], v: [2, -1] })), 'spanV')).toHaveLength(1)
  })
})

describe('validateMathFigure', () => {
  const base = { width: 600, height: 600 }
  it('says how to fix a figure', () => {
    expect(() => validateMathFigure({ ...base, items: [{ id: 'g', kind: 'gird' } as never] })).toThrow(/did you mean "grid"/i)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'g', kind: 'grid' }, { id: 'g', kind: 'axes' }] })).toThrow(/two items have the id "g"/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'g', kind: 'grid', transform: 'N' }] })).toThrow(/value/)
    expect(() => validateMathFigure({ ...base, values: { M: [1, 2] }, items: [{ id: 'g', kind: 'grid', transform: 'M' }] })).toThrow(/not an \[a, b, c, d\] matrix/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'f', kind: 'function', expr: 'sin(k x)' }] })).toThrow(/"k" is neither x nor a number value/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'f', kind: 'function', expr: 'sin(x' }] })).toThrow(/Expected "\)"/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'l', kind: 'label', tex: '\\fracc{1}{2}', at: [0, 0] }] })).toThrow(/did you mean "\\frac"/)
    expect(() => validateMathFigure({ ...base, values: { x: 1 }, items: [] })).toThrow(/cannot name a value/)
    expect(() => validateMathFigure({ ...base, values: { opacity: 1 }, items: [] })).toThrow(/property of the figure itself/)
    expect(() => validateMathFigure({ ...base, theme: 'neon' as never, items: [] })).toThrow(/theme/)
  })
})
