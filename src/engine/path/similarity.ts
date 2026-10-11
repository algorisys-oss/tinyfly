/**
 * Similarity transforms: a scale, a turn and a move as one value, the maths
 * of self-similar pictures (a Droste zoom, a spiral of copies, a picture in
 * its own frame). Composing two is one; a fraction of one (`powSimilarity`)
 * is the in-between step a zoom animates through; the fixed point is where
 * everything converges.
 *
 * A similarity maps a point `z` to `scale · R(turn) · z + (x, y)`: in complex
 * numbers, `a·z + b` with `a = scale·e^(i·turn)`. `turn` is in degrees,
 * positive clockwise on a canvas (y down), as `rotate` tracks are.
 */

export interface Similarity {
  /** The scale factor (1: none; 0.5: half size) */
  scale: number
  /** The turn, degrees (clockwise on a canvas) */
  turn: number
  /** The move, applied after the scale and turn */
  x: number
  y: number
}

export interface SimilarityPoint {
  x: number
  y: number
}

export const IDENTITY_SIMILARITY: Similarity = { scale: 1, turn: 0, x: 0, y: 0 }

/** A similarity from any of its fields (the rest identity). */
export function similarity(fields: Partial<Similarity> = {}): Similarity {
  return { scale: fields.scale ?? 1, turn: fields.turn ?? 0, x: fields.x ?? 0, y: fields.y ?? 0 }
}

/** A scale and turn about a point that stays where it is: the usual way to write a zoom's step. */
export function similarityAbout(scale: number, turn: number, centre: SimilarityPoint): Similarity {
  const { ax, ay } = complexOf(scale, turn)
  // b = c − a·c
  return { scale, turn, x: centre.x - (ax * centre.x - ay * centre.y), y: centre.y - (ay * centre.x + ax * centre.y) }
}

/** Where a similarity takes a point. */
export function applySimilarity(s: Similarity, p: SimilarityPoint): SimilarityPoint {
  const { ax, ay } = complexOf(s.scale, s.turn)
  return { x: ax * p.x - ay * p.y + s.x, y: ay * p.x + ax * p.y + s.y }
}

/** `first`, then `then`, as one similarity. */
export function composeSimilarity(first: Similarity, then: Similarity): Similarity {
  const moved = applySimilarity(then, { x: first.x, y: first.y })
  return { scale: first.scale * then.scale, turn: first.turn + then.turn, x: moved.x, y: moved.y }
}

/** The similarity that undoes this one. */
export function invertSimilarity(s: Similarity): Similarity {
  if (s.scale === 0) throw new Error('invertSimilarity: a scale of 0 cannot be undone')
  const inverse = { scale: 1 / s.scale, turn: -s.turn, x: 0, y: 0 }
  const back = applySimilarity(inverse, { x: s.x, y: s.y })
  return { ...inverse, x: -back.x, y: -back.y }
}

/**
 * The point a similarity leaves where it is (the centre of a zoom or a
 * spiral), or null for a pure move, which has none.
 */
export function similarityFixedPoint(s: Similarity): SimilarityPoint | null {
  const { ax, ay } = complexOf(s.scale, s.turn)
  // p = b / (1 − a)
  const dx = 1 - ax
  const dy = -ay
  const d = dx * dx + dy * dy
  if (d < 1e-18) return null
  return { x: (s.x * dx + s.y * dy) / d, y: (s.y * dx - s.x * dy) / d }
}

/**
 * The similarity applied `k` times, for any real `k`: `powSimilarity(step,
 * 0.5)` is half a step of a zoom, `-1` a step back. The fixed point stays
 * put; a pure move scales its distance.
 */
export function powSimilarity(s: Similarity, k: number): Similarity {
  if (s.scale <= 0) throw new Error('powSimilarity: the scale must be positive')
  const scale = Math.pow(s.scale, k)
  const turn = s.turn * k
  const fixed = similarityFixedPoint(s)
  if (!fixed) return { scale, turn, x: s.x * k, y: s.y * k }
  return similarityAbout(scale, turn, fixed)
}

/** The 2D matrix `[a, b, c, d, e, f]` for `ctx.transform(...)` or a DOMMatrix. */
export function similarityMatrix(s: Similarity): [number, number, number, number, number, number] {
  const { ax, ay } = complexOf(s.scale, s.turn)
  return [ax, ay, -ay, ax, s.x, s.y]
}

const complexOf = (scale: number, turn: number) => {
  const radians = (turn * Math.PI) / 180
  return { ax: scale * Math.cos(radians), ay: scale * Math.sin(radians) }
}
