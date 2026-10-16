import { createRandom, hashSeed, randomNormal } from '../../engine/authoring/random'

/**
 * A small fully connected network, for drawing: layer sizes, seeded weights
 * and a forward pass. Pure: the same layers, seed and inputs always give the
 * same weights and activations.
 */
export type Activation = 'sigmoid' | 'tanh' | 'relu'
export const ACTIVATIONS: readonly Activation[] = ['sigmoid', 'tanh', 'relu']

export const activate = (kind: Activation, x: number) =>
  kind === 'sigmoid' ? 1 / (1 + Math.exp(-x)) : kind === 'tanh' ? Math.tanh(x) : Math.max(0, x)

export interface Network {
  layers: number[]
  /** weights[l][j][i]: from node i of layer l to node j of layer l + 1 */
  weights: number[][][]
  /** biases[l][j]: of node j of layer l + 1 */
  biases: number[][]
}

/** A network with weights drawn from a seed (normal, scaled by 1/√fan-in). */
export function seededNetwork(layers: number[], seed: number | string): Network {
  const source = createRandom(typeof seed === 'number' ? seed : hashSeed(seed))
  const weights: number[][][] = []
  const biases: number[][] = []
  for (let l = 0; l < layers.length - 1; l++) {
    const scale = 1.6 / Math.sqrt(layers[l])
    weights.push(Array.from({ length: layers[l + 1] }, () => Array.from({ length: layers[l] }, () => randomNormal(source) * scale)))
    biases.push(Array.from({ length: layers[l + 1] }, () => randomNormal(source) * 0.3))
  }
  return { layers, weights, biases }
}

/** Every layer's activations for `inputs` (layer 0 is the inputs themselves). */
export function forward(network: Network, inputs: number[], activation: Activation): number[][] {
  const out = [inputs.slice(0, network.layers[0])]
  for (let l = 0; l < network.weights.length; l++) {
    const previous = out[l]
    out.push(network.weights[l].map((row, j) => activate(activation, row.reduce((sum, w, i) => sum + w * (previous[i] ?? 0), network.biases[l][j]))))
  }
  return out
}
