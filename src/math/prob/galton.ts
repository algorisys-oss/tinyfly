import { createRandom, hashSeed } from '../../engine/authoring/random'

/**
 * A Galton board's balls: each bounces left or right at each row of pegs, by
 * its own seeded coin flips, and lands in the bin numbered by its rights.
 * Pure geometry in "peg units": row i of pegs sits at depth i, its pegs at
 * x = j − i / 2 (j = 0..i); bin b sits at x = b − rows / 2.
 */
export function ballPath(seed: number | string, ball: number, rows: number): boolean[] {
  const source = createRandom(hashSeed(`${seed}:${ball}`))
  return Array.from({ length: rows }, () => source.next() < 0.5)
}

/** The bin a ball lands in: how many times it went right. */
export const binOf = (path: boolean[]) => path.filter(Boolean).length

/**
 * Where a ball is, part way down (`progress` 0 at the top peg, 1 when it
 * reaches the bins), in peg units: x across, depth down. Between rows it
 * hops in a small arc, as balls on a real board do.
 */
export function ballAt(path: boolean[], progress: number): { x: number; depth: number } {
  const rows = path.length
  const along = Math.min(1, Math.max(0, progress)) * rows
  const row = Math.min(rows - 1, Math.floor(along))
  const t = along - row
  const rightsBefore = path.slice(0, row).filter(Boolean).length
  const from = rightsBefore - row / 2
  const to = from + (path[row] ? 0.5 : -0.5)
  // A little hop over the peg: up and across, then down.
  const hop = 0.18 * Math.sin(Math.PI * t)
  return { x: from + (to - from) * t, depth: row + t - hop }
}
