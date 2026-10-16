import { describe, it, expect } from 'vitest'
import { layoutFigure } from './layout-figure'
import { validateMathFigure } from './validate-spec'
import type { MathFigureSpec } from './figure-spec'
import type { Shape } from './display-list'
import { activationFigure, attentionFigure, decisionBoundaryFigure, gradientDescentFigure, kmeansFigure, neuralNetworkFigure } from '../presets/ml'

const shapes = (spec: MathFigureSpec, props = {}) => layoutFigure(validateMathFigure(spec), props).shapes
const of = (list: Shape[], id: string) => list.filter((s) => s.id === id || s.id.startsWith(`${id}.`))
const text = (list: Shape[], id: string) => of(list, id).map((s) => (s.type === 'text' ? s.text : '')).join('')

describe('ML items', () => {
  it('flows activations layer by layer, with pulses on the edges being fed', () => {
    const figure = neuralNetworkFigure({ layers: [2, 3, 1] })
    expect(of(shapes(figure, { flow: 0 }), 'net.value')).toHaveLength(2) // only the inputs
    expect(of(shapes(figure, { flow: 0.5 }), 'net.pulse')).toHaveLength(6)
    expect(of(shapes(figure, { flow: 2 }), 'net.value')).toHaveLength(6)
    expect(text(shapes(figure, { in0: 0 }), 'readout')).not.toBe(text(shapes(figure, { in0: 1 }), 'readout'))
  })

  it('descends step by step and reports the loss', () => {
    const figure = gradientDescentFigure({ rate: 0.2 })
    const loss = (steps: number) => Number(text(shapes(figure, { steps }), 'readout').match(/f=([\d.]+)/)![1])
    expect(loss(10)).toBeLessThan(loss(1))
    expect(of(shapes(figure, { steps: 3 }), 'gd.step')).toHaveLength(4)
  })

  it('softmaxes attention rows so each sums to 1', () => {
    const list = shapes(attentionFigure({ tokens: ['a', 'b', 'c'] }))
    const row = of(list, 'attn.v.0').map((s) => (s.type === 'text' ? Number(`0${s.text}`) : 0))
    expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 1)
  })

  it('trains the classifier from a wrong guess to an accurate line', () => {
    const figure = decisionBoundaryFigure()
    const acc = (epochs: number) => Number(text(shapes(figure, { epochs }), 'readout').match(/accuracy([\d.]+)/)![1])
    expect(acc(0)).toBeLessThan(0.6)
    expect(acc(80)).toBeGreaterThan(0.8)
  })

  it('moves k-means centroids and lowers the inertia', () => {
    const figure = kmeansFigure()
    const inertia = (iteration: number) => Number(text(shapes(figure, { iteration }), 'readout').match(/inertia([\d.]+)/)![1])
    expect(inertia(5)).toBeLessThan(inertia(0))
    expect(of(shapes(figure), 'km.centroid')).toHaveLength(3)
  })

  it('draws TeX colour names from the theme', () => {
    const [sigma] = of(shapes(activationFigure()), 'readout').filter((s) => s.type === 'text')
    expect(sigma.type === 'text' && sigma.color).toBe('#58c4dd') // the dark theme's blue, not CSS blue
  })

  it('says how to fix ML items', () => {
    const base = { width: 600, height: 600 }
    expect(() => validateMathFigure({ ...base, items: [{ id: 'n', kind: 'network', layers: [3] }] })).toThrow(/layers/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'n', kind: 'network', layers: [2, 2], activation: 'relux' as never }] })).toThrow(/relu/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'h', kind: 'heatmap' }] })).toThrow(/cells or expr/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'd', kind: 'descent', expr: 'floor(x) + y', start: [0, 0], rate: 0.1, steps: 1 }] })).toThrow(/gradient/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'k', kind: 'kmeans', centres: [], iteration: 0 }] })).toThrow(/centres/)
  })
})
