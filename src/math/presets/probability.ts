import type { DistributionRef, MathFigureSpec, MathItem, MathThemeName } from '../figure/figure-spec'

/**
 * Ready-made probability and statistics figures. Each returns a plain
 * MathFigureSpec whose moving parts are number values:
 *
 * - normalFigure: `mu`, `sigma`, and the shaded range `a`..`b`
 * - binomialFigure: `n` and `p`
 * - cltFigure: `k` (how many draws are averaged) and `samples`
 * - galtonFigure: `balls` (fractional: the next ball is on its way down)
 * - monteCarloPiFigure: `count` points
 * - regressionFigure: `count`, `slope`, `noise`
 * - bayesFigure: `prior`, `sensitivity`, `falsePositive`
 */
export interface ProbabilityOptions {
  width?: number
  height?: number
  theme?: MathThemeName
  x?: [number, number]
  y?: [number, number]
}

const base = (options: ProbabilityOptions, defaults: { x: [number, number]; y: [number, number] }, values: Record<string, number>, items: MathItem[]): MathFigureSpec => ({
  width: options.width ?? 600,
  height: options.height ?? 600,
  ...(options.theme ? { theme: options.theme } : {}),
  x: options.x ?? defaults.x,
  y: options.y ?? defaults.y,
  values,
  items,
})

const readout = (options: ProbabilityOptions, tex: string): MathItem => ({
  id: 'readout', kind: 'label', screen: true, align: 'left', size: 24,
  at: [(options.width ?? 600) * 0.05, (options.height ?? 600) * 0.08], tex,
})

/** The normal curve, with P(a ≤ X ≤ b) shaded. */
export function normalFigure(options: ProbabilityOptions & { mean?: number; sd?: number; shade?: [number, number] } = {}): MathFigureSpec {
  const [a, b] = options.shade ?? [-1, 1]
  return base(options, { x: [-4, 4], y: [-0.08, 0.55] }, { mu: options.mean ?? 0, sigma: options.sd ?? 1, a, b }, [
    { id: 'axes', kind: 'axes', ticks: 1, labels: true },
    { id: 'dist', kind: 'distribution', distribution: { kind: 'normal', mean: 'mu', sd: 'sigma' }, shade: ['a', 'b'] },
    readout(options, 'P(\\val{a:2} \\le X \\le \\val{b:2}) = \\val{dist.p:3}'),
  ])
}

/** Binomial(n, p) as bars. */
export function binomialFigure(options: ProbabilityOptions & { n?: number; p?: number } = {}): MathFigureSpec {
  const n = options.n ?? 10
  return base(options, { x: [-1, n + 1], y: [-0.04, 0.4] }, { n, p: options.p ?? 0.5 }, [
    { id: 'axes', kind: 'axes', ticks: Math.max(1, Math.round(n / 10)) },
    { id: 'dist', kind: 'distribution', distribution: { kind: 'binomial', n: 'n', p: 'p' } },
    readout(options, 'n = \\val{n:0} \\quad p = \\val{p:2} \\quad \\mu = \\val{dist.mean:2}'),
  ])
}

/**
 * The central limit theorem: the mean of k draws from a skewed distribution
 * (exponential by default) piles up into a normal curve as k grows.
 */
export function cltFigure(options: ProbabilityOptions & { of?: DistributionRef; k?: number; samples?: number } = {}): MathFigureSpec {
  return base(options, { x: [-0.2, 3.2], y: [-0.2, 3] }, { k: options.k ?? 1, samples: options.samples ?? 2000 }, [
    { id: 'axes', kind: 'axes', ticks: 1 },
    { id: 'hist', kind: 'histogram', distribution: { kind: 'mean', of: options.of ?? { kind: 'exponential', rate: 1 }, count: 'k' }, count: 'samples', bins: [0, 3, 45], curve: true, color: 'teal' },
    readout(options, 'k = \\val{k:0} \\text{ draws averaged} \\quad \\bar{x} = \\val{hist.mean:3} \\quad s = \\val{hist.sd:3}'),
  ])
}

/** A Galton board in a tall frame: balls bounce through the pegs into a bell. */
export function galtonFigure(options: ProbabilityOptions & { rows?: number; balls?: number } = {}): MathFigureSpec {
  const rows = options.rows ?? 10
  return base(options, { x: [-(rows + 2) * 0.25, (rows + 2) * 0.25], y: [-12, 1] }, { balls: options.balls ?? 0 }, [
    { id: 'board', kind: 'galton', rows, balls: 'balls', spacing: 0.5, top: 0 },
    readout(options, '\\val{board.landed:0} \\text{ balls}'),
  ])
}

/** Estimate π by throwing points at a square and counting those inside the circle. */
export function monteCarloPiFigure(options: ProbabilityOptions & { count?: number } = {}): MathFigureSpec {
  return base(options, { x: [-1.3, 1.3], y: [-1.3, 1.3] }, { count: options.count ?? 0 }, [
    { id: 'square', kind: 'polygon', points: [[-1, -1], [1, -1], [1, 1], [-1, 1]], color: 'grey', fillOpacity: 0 },
    { id: 'circle', kind: 'parametric', x: 'cos(t)', y: 'sin(t)', color: 'yellow', width: 2.5 },
    { id: 'pts', kind: 'scatter', points: { kind: 'uniform', x: [-1, 1], y: [-1, 1] }, count: 'count', inside: 'x^2 + y^2 - 1', color: 'blue', radius: 2.2 },
    readout(options, '\\frac{\\text{inside}}{\\text{all}} = \\frac{\\val{pts.inside:0}}{\\val{pts.count:0}} = \\val{pts.ratio:4} \\approx \\frac{\\pi}{4}'),
  ])
}

/** Noisy points about a line, and the least-squares line through them. */
export function regressionFigure(options: ProbabilityOptions & { slope?: number; intercept?: number; noise?: number; count?: number } = {}): MathFigureSpec {
  return base(options, { x: [-1, 11], y: [-2, 10] }, { slope: options.slope ?? 0.6, intercept: options.intercept ?? 1, noise: options.noise ?? 1, count: options.count ?? 60 }, [
    { id: 'axes', kind: 'axes', ticks: 2 },
    { id: 'pts', kind: 'scatter', points: { kind: 'linear', slope: 'slope', intercept: 'intercept', noise: 'noise', x: [0, 10] }, count: 'count', fit: true, radius: 3.5 },
    readout(options, 'y = \\val{pts.slope:2}\\,x + \\val{pts.intercept:2} \\quad r = \\val{pts.r:2}'),
  ])
}

/** A medical test as areas: how likely is the condition, given a positive result? */
export function bayesFigure(options: ProbabilityOptions & { prior?: number; sensitivity?: number; falsePositive?: number } = {}): MathFigureSpec {
  return base(options, { x: [0, 1], y: [0, 1] }, { prior: options.prior ?? 0.1, sensitivity: options.sensitivity ?? 0.9, falsePositive: options.falsePositive ?? 0.1 }, [
    { id: 'test', kind: 'bayes', prior: 'prior', truePositive: 'sensitivity', falsePositive: 'falsePositive', at: [0.08, 0.2], size: [0.84, 0.66] },
  ])
}
