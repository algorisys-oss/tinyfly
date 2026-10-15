import { isDiscrete, meanOf, sdOf, supportOf, type Distribution } from './distributions'

export interface Bin {
  left: number
  right: number
  count: number
  /** count, or count / (total × width) when scaled as a density */
  height: number
}

/**
 * The default bins for a distribution: one per whole number for discrete
 * ones (centred on it), else 30 across mean ± 4 sd.
 */
export function defaultBins(d: Distribution): [number, number, number] {
  const mean = meanOf(d)
  const sd = sdOf(d)
  if (isDiscrete(d)) {
    const [first, last] = supportOf(d)
    const low = Math.max(first, Math.floor(mean - 4 * sd))
    const high = Math.min(last, Math.ceil(mean + 4 * sd))
    return [low - 0.5, high + 0.5, high - low + 1]
  }
  return [mean - 4 * sd, mean + 4 * sd, 30]
}

/** Samples counted into `bins`; heights as counts or as a density (total area 1). */
export function binSamples(values: number[], [from, to, count]: [number, number, number], scale: 'density' | 'count'): Bin[] {
  const width = (to - from) / count
  const counts = new Array<number>(count).fill(0)
  for (const v of values) {
    const k = Math.floor((v - from) / width)
    if (k >= 0 && k < count) counts[k]++
    else if (v === to) counts[count - 1]++
  }
  const total = values.length || 1
  return counts.map((c, k) => ({
    left: from + k * width,
    right: from + (k + 1) * width,
    count: c,
    height: scale === 'density' ? c / (total * width) : c,
  }))
}

/** Sample mean and standard deviation (0 and 0 for no samples). */
export function summary(values: number[]): { mean: number; sd: number } {
  if (values.length === 0) return { mean: 0, sd: 0 }
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  return { mean, sd: Math.sqrt(variance) }
}
