import { describe, it, expect } from 'vitest'
import { activate, forward, seededNetwork } from './network'
import { contourLines, sampleGrid } from './contours'
import { descentPath, surface } from './descent'
import { accuracy, blobs, logLoss, trainLogistic } from './classify'
import { assign, inertia, kmeansHistory } from './kmeans'
import { colorAt, blendOver } from './colormap'

describe('networks', () => {
  it('seeds the same weights and runs a forward pass', () => {
    const a = seededNetwork([3, 4, 2], 'n')
    expect(seededNetwork([3, 4, 2], 'n')).toEqual(a)
    expect(a.weights.map((w) => [w.length, w[0].length])).toEqual([[4, 3], [2, 4]])
    const out = forward(a, [1, 0, 0.5], 'sigmoid')
    expect(out.map((layer) => layer.length)).toEqual([3, 4, 2])
    expect(out[2].every((v) => v > 0 && v < 1)).toBe(true)
    expect(activate('relu', -2)).toBe(0)
    expect(activate('tanh', 0)).toBe(0)
  })
})

describe('contours', () => {
  it('traces a circle as one closed level curve', () => {
    const grid = sampleGrid((x, y) => x * x + y * y, [-2, 2], [-2, 2], 40)
    const [line, ...rest] = contourLines(grid.values, grid.x0, grid.y0, grid.dx, grid.dy, 1)
    expect(rest).toHaveLength(0)
    for (const [x, y] of line) expect(Math.hypot(x, y)).toBeCloseTo(1, 1)
    expect(Math.hypot(line[0][0] - line.at(-1)![0], line[0][1] - line.at(-1)![1])).toBeLessThan(1e-6)
  })
})

describe('gradient descent', () => {
  it('walks downhill to the minimum with an exact gradient', () => {
    const path = descentPath('(x - 1)^2 + 2 (y + 2)^2', [3, 3], 0.1, 200)
    const [x, y] = path.at(-1)!
    expect(x).toBeCloseTo(1, 4)
    expect(y).toBeCloseTo(-2, 4)
    const f = surface('(x - 1)^2 + 2 (y + 2)^2')
    for (let k = 1; k < 20; k++) expect(f(...path[k])).toBeLessThan(f(...path[k - 1]))
  })

  it('stops when a rate too large diverges, and momentum changes the path', () => {
    expect(descentPath('x^2 + y^2', [1, 1], 1.5, 500).length).toBeLessThan(501)
    expect(descentPath('x^2 + y^2', [1, 1], 0.1, 5, 0.8)).not.toEqual(descentPath('x^2 + y^2', [1, 1], 0.1, 5))
  })
})

describe('classification and clustering', () => {
  const data = blobs([[-2, -2], [2, 2]], 50, 0.8, 'c')

  it('makes seeded clusters and trains a logistic model that separates them', () => {
    expect(blobs([[-2, -2], [2, 2]], 50, 0.8, 'c')).toEqual(data)
    const models = trainLogistic(data, 200, 0.5)
    expect(accuracy(models[0], data)).toBeLessThan(0.9)
    expect(accuracy(models.at(-1)!, data)).toBeGreaterThan(0.97)
    expect(logLoss(models.at(-1)!, data)).toBeLessThan(logLoss(models[1], data))
  })

  it('runs Lloyd\'s algorithm until the centroids settle, lowering the inertia', () => {
    const points = blobs([[-3, 0], [3, 0], [0, 4]], 30, 0.5, 'k').map((d) => d.point)
    const history = kmeansHistory(points, 3, 20, [[0, 0.1], [0, 0], [0.1, 0]])
    expect(history.length).toBeLessThan(21)
    expect(inertia(points, history.at(-1)!)).toBeLessThan(inertia(points, history[0]))
    expect(new Set(assign(points, history.at(-1)!)).size).toBe(3)
  })
})

describe('colours', () => {
  it('maps 0..1 through a colormap and mixes over a background', () => {
    expect(colorAt('viridis', 0)).toBe('#440154')
    expect(colorAt('viridis', 2)).toBe(colorAt('viridis', 1))
    expect(blendOver('#ffffff', '#000000', 0.5)).toBe('rgb(128, 128, 128)')
    expect(blendOver('rgb(10, 20, 30)', '#000', 1)).toBe('rgb(10, 20, 30)')
  })
})
