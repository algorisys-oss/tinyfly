import { describe, it, expect } from 'vitest'
import { layoutFigure } from './layout-figure'
import { validateMathFigure } from './validate-spec'
import type { MathFigureSpec } from './figure-spec'
import type { Shape } from './display-list'
import { bayesFigure, binomialFigure, cltFigure, galtonFigure, monteCarloPiFigure, normalFigure, regressionFigure } from '../presets/probability'

const shapes = (spec: MathFigureSpec, props = {}) => layoutFigure(validateMathFigure(spec), props).shapes
const of = (list: Shape[], id: string) => list.filter((s) => s.id === id || s.id.startsWith(`${id}.`))
const text = (list: Shape[], id: string) => of(list, id).map((s) => (s.type === 'text' ? s.text : '')).join('')

describe('probability items', () => {
  it('shade a normal probability, moving with its values', () => {
    expect(text(shapes(normalFigure()), 'readout')).toContain('=0.683')
    expect(text(shapes(normalFigure(), { a: -2, b: 2 }), 'readout')).toContain('=0.954')
    expect(text(shapes(normalFigure(), { sigma: 2 }), 'readout')).toContain('=0.383')
  })

  it('draws whole-number distributions as bars', () => {
    const bars = of(shapes(binomialFigure({ n: 10 })), 'dist')
    expect(bars).toHaveLength(11)
    expect(text(shapes(binomialFigure({ n: 10 }), { p: 0.2 }), 'readout')).toContain('μ=2')
  })

  it('fills a histogram as count grows, keeping the earlier samples', () => {
    const figure = cltFigure({ k: 4, samples: 0 })
    expect(of(shapes(figure), 'hist').filter((s) => s.id !== 'hist.curve.0')).toHaveLength(0)
    const few = text(shapes(figure, { samples: 50 }), 'readout')
    expect(few).not.toBe(text(shapes(figure, { samples: 2000 }), 'readout'))
    // 1 / √4 = 0.5, as sampled
    expect(Number(text(shapes(figure, { samples: 2000 }), 'readout').match(/s=([\d.]+)/)![1])).toBeCloseTo(0.5, 1)
  })

  it('drops Galton balls: landed ones stack, the next one falls', () => {
    const board = galtonFigure({ rows: 6 })
    expect(of(shapes(board, { balls: 10 }), 'board.ball')).toHaveLength(10)
    expect(of(shapes(board, { balls: 10 }), 'board.falling')).toHaveLength(0)
    expect(of(shapes(board, { balls: 10.4 }), 'board.falling')).toHaveLength(1)
    expect(text(shapes(board, { balls: 37.9 }), 'readout')).toBe('37balls')
  })

  it('estimates π/4 by counting points inside the circle', () => {
    const readout = text(shapes(monteCarloPiFigure(), { count: 8000 }), 'readout')
    const ratio = Number(readout.match(/=(0\.\d+)/)![1])
    expect(ratio).toBeCloseTo(Math.PI / 4, 1)
  })

  it('fits a least-squares line through the scatter', () => {
    const list = shapes(regressionFigure({ noise: 0.01, count: 50 }))
    expect(of(list, 'pts.fit')).toHaveLength(1)
    expect(text(list, 'readout')).toContain('r=1')
  })

  it('works out a positive test\'s meaning as areas', () => {
    const list = shapes(bayesFigure({ prior: 0.01, sensitivity: 0.9, falsePositive: 0.05 }))
    expect(text(list, 'test.label.posterior')).toContain('=0.154')
    expect(of(list, 'test').filter((s) => s.type === 'line')).toHaveLength(4)
  })

  it('says how to fix probability items', () => {
    const base = { width: 600, height: 600 }
    expect(() => validateMathFigure({ ...base, items: [{ id: 'h', kind: 'histogram', distribution: { kind: 'normall' } as never, count: 10 }] })).toThrow(/did you mean "normal"/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'h', kind: 'histogram', distribution: { kind: 'normal', sd: -1 }, count: 10 }] })).toThrow(/sd must be positive/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'd', kind: 'distribution', distribution: { kind: 'binomial', n: 'm', p: 0.5 } }] })).toThrow(/value/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 's', kind: 'scatter', points: { kind: 'uniform', x: [0, 1], y: [0, 1] }, count: 5, inside: 'x + z' }] })).toThrow(/"z" is neither x, y/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'g', kind: 'galton', rows: 40, balls: 1 }] })).toThrow(/rows/)
  })
})
