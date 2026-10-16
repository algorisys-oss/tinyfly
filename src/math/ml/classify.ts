import { createRandom, hashSeed, randomNormal } from '../../engine/authoring/random'
import type { Vec2 } from '../linear/vec2'

/** Points in clusters round `centres`, `count` per cluster, `spread` apart: [point, cluster] pairs. Seeded. */
export function blobs(centres: Vec2[], count: number, spread: number, seed: number | string): { point: Vec2; label: number }[] {
  const source = createRandom(typeof seed === 'number' ? seed : hashSeed(seed))
  const out: { point: Vec2; label: number }[] = []
  for (let i = 0; i < count; i++) {
    centres.forEach(([cx, cy], label) => out.push({ point: [cx + randomNormal(source) * spread, cy + randomNormal(source) * spread], label }))
  }
  return out
}

export interface LogisticModel {
  w: Vec2
  b: number
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))

/** P(class 1) for a point. */
export const predict = (model: LogisticModel, [x, y]: Vec2) => sigmoid(model.w[0] * x + model.w[1] * y + model.b)

/**
 * Logistic regression trained by full-batch gradient descent from `start`
 * (default zero weights): the model after each epoch, the start first.
 */
export function trainLogistic(data: { point: Vec2; label: number }[], epochs: number, rate: number, start: LogisticModel = { w: [0, 0], b: 0 }): LogisticModel[] {
  const models: LogisticModel[] = [start]
  for (let e = 0; e < epochs; e++) {
    const { w, b } = models[models.length - 1]
    let gw0 = 0, gw1 = 0, gb = 0
    for (const { point, label } of data) {
      const error = predict({ w, b }, point) - label
      gw0 += error * point[0]
      gw1 += error * point[1]
      gb += error
    }
    const n = data.length || 1
    models.push({ w: [w[0] - (rate * gw0) / n, w[1] - (rate * gw1) / n], b: b - (rate * gb) / n })
  }
  return models
}

/** Share of points the model puts on the right side of 0.5. */
export function accuracy(model: LogisticModel, data: { point: Vec2; label: number }[]): number {
  if (data.length === 0) return 0
  return data.filter(({ point, label }) => (predict(model, point) >= 0.5 ? 1 : 0) === label).length / data.length
}

/** Mean cross-entropy loss. */
export function logLoss(model: LogisticModel, data: { point: Vec2; label: number }[]): number {
  if (data.length === 0) return 0
  const eps = 1e-12
  return -data.reduce((sum, { point, label }) => {
    const p = predict(model, point)
    return sum + (label ? Math.log(p + eps) : Math.log(1 - p + eps))
  }, 0) / data.length
}
