import { describe, it, expect } from 'vitest'
import { density, distributionProblem, meanOf, samples, sdOf, type Distribution } from './distributions'
import { binSamples, defaultBins, summary } from './histogram'
import { leastSquares, scatterPoints } from './scatter'
import { ballAt, ballPath, binOf } from './galton'
import { bayesAreas } from './bayes'
import { integrate } from '../figure/derived'

describe('distributions', () => {
  it('have densities that integrate (or sum) to 1, with the stated mean', () => {
    const continuous: Distribution[] = [{ kind: 'normal', mean: 1, sd: 2 }, { kind: 'uniform', min: -1, max: 3 }, { kind: 'exponential', rate: 2 }]
    // Integrate over each support: Simpson's rule loses accuracy across a jump.
    const supports: [number, number][] = [[-30, 30], [-1, 3], [0, 30]]
    continuous.forEach((d, i) => {
      const [a, b] = supports[i]
      expect(integrate((x) => density(d, x), a, b, 20000), d.kind).toBeCloseTo(1, 6)
      expect(integrate((x) => x * density(d, x), a, b, 20000), d.kind).toBeCloseTo(meanOf(d), 5)
    })
    const discrete: Distribution[] = [{ kind: 'binomial', n: 12, p: 0.3 }, { kind: 'poisson', rate: 4 }, { kind: 'dice', count: 3 }]
    for (const d of discrete) {
      let total = 0, mean = 0
      for (let k = 0; k <= 60; k++) { total += density(d, k); mean += k * density(d, k) }
      expect(total, d.kind).toBeCloseTo(1, 9)
      expect(mean, d.kind).toBeCloseTo(meanOf(d), 9)
    }
    expect(density({ kind: 'dice', count: 2 }, 7)).toBeCloseTo(6 / 36, 12)
    expect(sdOf({ kind: 'mean', of: { kind: 'exponential', rate: 1 }, count: 4 })).toBe(0.5)
  })

  it('samples the same sequence for a seed, matching the mean and spread', () => {
    const d: Distribution = { kind: 'binomial', n: 20, p: 0.25 }
    const many = samples(d, 'seed', 4000)
    expect(samples(d, 'seed', 10)).toEqual(many.slice(0, 10))
    const { mean, sd } = summary(many)
    expect(mean).toBeCloseTo(meanOf(d), 0)
    expect(sd).toBeCloseTo(sdOf(d), 0)
    const clt = summary(samples({ kind: 'mean', of: { kind: 'uniform' }, count: 12 }, 4, 4000))
    expect(clt.sd).toBeCloseTo(sdOf({ kind: 'uniform' }) / Math.sqrt(12), 2)
  })

  it('names bad parameters', () => {
    expect(distributionProblem({ kind: 'normal', sd: 0 })).toMatch(/sd/)
    expect(distributionProblem({ kind: 'binomial', n: 2.5, p: 0.5 })).toMatch(/whole number/)
    expect(distributionProblem({ kind: 'mean', of: { kind: 'poisson', rate: -1 }, count: 3 })).toMatch(/rate/)
    expect(distributionProblem({ kind: 'nope' } as never)).toMatch(/kind/)
  })
})

describe('histograms', () => {
  it('bin samples as counts or as a density of area 1', () => {
    const bins = binSamples([0.1, 0.2, 0.6, 1, 5], [0, 1, 2], 'count')
    expect(bins.map((b) => b.count)).toEqual([2, 2]) // 1 is the top edge; 5 is outside
    const density = binSamples([0.1, 0.2, 0.6, 0.9], [0, 1, 4], 'density')
    expect(density.reduce((s, b) => s + b.height * (b.right - b.left), 0)).toBeCloseTo(1)
    expect(defaultBins({ kind: 'dice', count: 2 })).toEqual([1.5, 12.5, 11])
  })
})

describe('scatter, Galton and Bayes', () => {
  it('recovers a line from noisy points', () => {
    const points = scatterPoints({ kind: 'linear', slope: 2, intercept: -1, noise: 0.3, x: [0, 10] }, 'fit', 400)
    const fit = leastSquares(points)!
    expect(fit.slope).toBeCloseTo(2, 1)
    expect(fit.intercept).toBeCloseTo(-1, 0)
    expect(fit.r).toBeGreaterThan(0.99)
    // The same random numbers whatever the parameters: points move, not reshuffle.
    const flatter = scatterPoints({ kind: 'linear', slope: 1, intercept: -1, noise: 0.3, x: [0, 10] }, 'fit', 400)
    expect(flatter.map((p) => p[0])).toEqual(points.map((p) => p[0]))
  })

  it('drops Galton balls along seeded paths into the bin of their rights', () => {
    const path = ballPath('board', 3, 8)
    expect(ballPath('board', 3, 8)).toEqual(path)
    expect(binOf(path)).toBe(path.filter(Boolean).length)
    expect(ballAt(path, 0)).toEqual({ x: 0, depth: 0 })
    expect(ballAt(path, 1).x).toBe(binOf(path) - 4)
    // Many balls pile up binomially: the middle bins are the fullest.
    const bins = new Array(9).fill(0)
    for (let k = 0; k < 2000; k++) bins[binOf(ballPath('board', k, 8))]++
    expect(bins[4]).toBeGreaterThan(bins[1])
    expect(bins[4] / 2000).toBeCloseTo(70 / 256, 1)
  })

  it('works Bayes out as areas', () => {
    const areas = bayesAreas(0.01, 0.9, 0.05)
    expect(areas.positive).toBeCloseTo(0.009 + 0.0495)
    expect(areas.posterior).toBeCloseTo(0.009 / 0.0585)
    expect(bayesAreas(0, 0, 0).posterior).toBe(0)
  })
})
