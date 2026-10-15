/**
 * Bayes' rule as areas of a unit square: the prior splits it into a column
 * with the condition and one without; each column splits into those who test
 * positive and those who do not.
 */
export interface BayesAreas {
  /** P(condition and positive) */
  truePositive: number
  /** P(no condition and positive) */
  falsePositive: number
  /** P(positive) */
  positive: number
  /** P(condition | positive) */
  posterior: number
}

export function bayesAreas(prior: number, sensitivity: number, falsePositiveRate: number): BayesAreas {
  const p = Math.min(1, Math.max(0, prior))
  const truePositive = p * Math.min(1, Math.max(0, sensitivity))
  const falsePositive = (1 - p) * Math.min(1, Math.max(0, falsePositiveRate))
  const positive = truePositive + falsePositive
  return { truePositive, falsePositive, positive, posterior: positive > 0 ? truePositive / positive : 0 }
}
