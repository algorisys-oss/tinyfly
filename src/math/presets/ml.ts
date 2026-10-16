import { createRandom, hashSeed, randomNormal } from '../../engine/authoring/random'
import type { MathFigureSpec, MathItem, MathThemeName } from '../figure/figure-spec'
import type { Activation } from '../ml/network'

/**
 * Ready-made AI/ML figures. Each returns a plain MathFigureSpec whose moving
 * part is a number value:
 *
 * - neuralNetworkFigure: `flow` (how far activations have travelled) and inputs `in0`, `in1` …
 * - gradientDescentFigure: `steps`, with `rate` and `momentum`
 * - attentionFigure: no values; animate the heatmap's draw
 * - decisionBoundaryFigure: `epochs`
 * - kmeansFigure: `iteration`
 * - activationFigure: no values
 */
export interface MlOptions {
  width?: number
  height?: number
  theme?: MathThemeName
}

const size = (options: MlOptions) => ({ width: options.width ?? 600, height: options.height ?? 600, ...(options.theme ? { theme: options.theme } : {}) })

const readout = (options: MlOptions, tex: string): MathItem => ({
  id: 'readout', kind: 'label', screen: true, align: 'left', size: 22,
  at: [(options.width ?? 600) * 0.05, (options.height ?? 600) * 0.07], tex,
})

/** A small network; activations flow from the inputs to the outputs as `flow` goes 0 → layers − 1. */
export function neuralNetworkFigure(options: MlOptions & { layers?: number[]; activation?: Activation; inputs?: number[]; seed?: string } = {}): MathFigureSpec {
  const layers = options.layers ?? [3, 5, 4, 2]
  const inputs = Array.from({ length: layers[0] }, (_, i) => options.inputs?.[i] ?? [0.9, 0.2, 0.6, 0.4, 0.8][i % 5])
  return {
    ...size(options), x: [-5, 5], y: [-5, 5],
    values: { flow: layers.length - 1, ...Object.fromEntries(inputs.map((v, i) => [`in${i}`, v])) },
    items: [
      {
        id: 'net', kind: 'network', layers, activation: options.activation ?? 'sigmoid', seed: options.seed ?? 'net', flow: 'flow', at: [0, -0.3], size: [7, 6.5],
        inputs: inputs.map((_, i) => `in${i}`),
        labels: { inputs: inputs.map((_, i) => `x_{${i + 1}}`), outputs: Array.from({ length: layers[layers.length - 1] }, (_, j) => `y_{${j + 1}}`) },
      },
      readout(options, layers[layers.length - 1] >= 2 ? 'y_1 = \\val{net.out0:2} \\quad y_2 = \\val{net.out1:2}' : 'y = \\val{net.out0:2}'),
    ],
  }
}

/** Gradient descent on a long, narrow bowl: a small rate crawls, a large one zigzags, momentum speeds it up. */
export function gradientDescentFigure(options: MlOptions & { expr?: string; start?: [number, number]; rate?: number; momentum?: number } = {}): MathFigureSpec {
  const expr = options.expr ?? '(x^2 + 8 y^2) / 4'
  return {
    ...size(options), x: [-4, 4], y: [-4, 4],
    values: { steps: 0, rate: options.rate ?? 0.2, momentum: options.momentum ?? 0, sx: options.start?.[0] ?? -3.5, sy: options.start?.[1] ?? 2 },
    items: [
      { id: 'field', kind: 'heatmap', expr, resolution: 40, colormap: 'viridis', opacity: 0.35 },
      { id: 'levels', kind: 'contours', expr, levels: 9, colormap: 'viridis' },
      { id: 'gd', kind: 'descent', expr, start: [options.start?.[0] ?? -3.5, options.start?.[1] ?? 2], rate: 'rate', steps: 'steps', momentum: 'momentum' },
      readout(options, '\\text{step } \\val{gd.step:0} \\quad f = \\val{gd.loss:3}'),
    ],
  }
}

/** Attention weights between tokens: each row (a query) softmaxed over the columns (the keys). */
export function attentionFigure(options: MlOptions & { tokens?: string[]; scores?: number[][]; seed?: string } = {}): MathFigureSpec {
  const tokens = options.tokens ?? ['The', 'cat', 'sat', 'on', 'the', 'mat']
  const source = createRandom(hashSeed(options.seed ?? 'attention'))
  // Default scores: a pull toward each token itself and the one before, plus seeded noise.
  const scores = options.scores ?? tokens.map((_, i) => tokens.map((_, j) => (i === j ? 2.2 : 0) + (j === i - 1 ? 1.4 : 0) + randomNormal(source) * 0.8))
  const labels = tokens.map((t) => `\\text{${t}}`)
  return {
    ...size(options), x: [-5, 5], y: [-5, 5],
    items: [
      { id: 'attn', kind: 'heatmap', cells: scores, softmax: true, range: [0, 1], colormap: 'heat', at: [-3, -4], size: [7, 7], rowLabels: labels, colLabels: labels, values: true },
    ],
  }
}

/** Logistic regression finding the line between two clusters, epoch by epoch. */
export function decisionBoundaryFigure(options: MlOptions & { rate?: number; spread?: number } = {}): MathFigureSpec {
  return {
    ...size(options), x: [-4, 4], y: [-4, 4], values: { epochs: 0 },
    items: [
      { id: 'clf', kind: 'classifier', epochs: 'epochs', centres: [[-1.1, -0.7], [1.1, 0.9]], rate: options.rate ?? 0.3, spread: options.spread ?? 1.15 },
      readout(options, '\\text{epoch } \\val{clf.epoch:0} \\quad \\text{accuracy } \\val{clf.accuracy:2} \\quad \\text{loss } \\val{clf.loss:3}'),
    ],
  }
}

/** k-means finding clusters: points recolour as the centroids move. */
export function kmeansFigure(options: MlOptions & { centres?: [number, number][]; k?: number } = {}): MathFigureSpec {
  return {
    ...size(options), x: [-4.5, 4.5], y: [-4.5, 4.5], values: { iteration: 0 },
    items: [
      { id: 'km', kind: 'kmeans', centres: options.centres ?? [[-2.2, 1.6], [2, 2], [0.4, -2.2]], k: options.k, iteration: 'iteration', spread: 0.75 },
      readout(options, '\\text{iteration } \\val{km.iteration:0} \\quad \\text{inertia } \\val{km.inertia:1}'),
    ],
  }
}

/** The usual activation functions side by side. */
export function activationFigure(options: MlOptions = {}): MathFigureSpec {
  return {
    ...size(options), x: [-4, 4], y: [-2, 3],
    items: [
      { id: 'axes', kind: 'axes' },
      { id: 'sigmoid', kind: 'function', expr: 'sigmoid(x)', color: 'blue' },
      { id: 'tanh', kind: 'function', expr: 'tanh(x)', color: 'yellow' },
      { id: 'relu', kind: 'function', expr: 'relu(x)', color: 'red' },
      readout(options, '\\color{blue}{\\sigma(x)} \\quad \\color{yellow}{\\tanh x} \\quad \\color{red}{\\text{ReLU}(x)}'),
    ],
  }
}
