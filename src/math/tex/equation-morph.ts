import type { TexLayout, TexPiece } from './tex-layout'

/**
 * One frame of a change from one typeset equation to the next, the way a
 * teacher rewrites a line: terms that appear in both glide from their old
 * place to their new one, terms that go fade out, terms that arrive fade in.
 *
 * Pieces pair by id (see tex-layout.ts: `x#1`, `=#1`, or an explicit
 * `\id{name}`), in order within an id. A pair whose glyphs differ (a value
 * that changed) cross-fades in place of gliding. Pure.
 */
export type MorphPiece = TexPiece & { opacity: number }

export interface PlacedLayout {
  layout: TexLayout
  /** Where the layout's origin (left edge, baseline) sits, in the same units as the layout */
  x: number
  y: number
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t

function place(piece: TexPiece, dx: number, dy: number): TexPiece {
  if (piece.kind === 'stroke') return { ...piece, points: piece.points.map(([x, y]) => [x + dx, y + dy] as [number, number]) }
  return { ...piece, x: piece.x + dx, y: piece.y + dy }
}

function blend(a: TexPiece, b: TexPiece, t: number): TexPiece | undefined {
  if (a.kind === 'glyph' && b.kind === 'glyph' && a.text === b.text) {
    return { ...b, x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), width: mix(a.width, b.width, t), size: mix(a.size, b.size, t) }
  }
  if (a.kind === 'rule' && b.kind === 'rule') {
    return { ...b, x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), width: mix(a.width, b.width, t), height: mix(a.height, b.height, t) }
  }
  if (a.kind === 'stroke' && b.kind === 'stroke' && a.points.length === b.points.length) {
    return { ...b, width: mix(a.width, b.width, t), points: a.points.map(([x, y], i) => [mix(x, b.points[i][0], t), mix(y, b.points[i][1], t)] as [number, number]) }
  }
  return undefined
}

/** Ease that settles a gliding term without a jolt at either end. */
const smooth = (t: number) => t * t * (3 - 2 * t)

/** The pieces of the change at `progress` 0 (all `from`) to 1 (all `to`). */
export function morphEquation(from: PlacedLayout, to: PlacedLayout, progress: number): MorphPiece[] {
  const t = Math.min(1, Math.max(0, progress))
  const before = from.layout.pieces.map((p) => place(p, from.x, from.y))
  const after = to.layout.pieces.map((p) => place(p, to.x, to.y))
  if (t === 0) return before.map((p) => ({ ...p, opacity: 1 }))
  if (t === 1) return after.map((p) => ({ ...p, opacity: 1 }))

  const byId = (pieces: TexPiece[]) => {
    const map = new Map<string, TexPiece[]>()
    for (const piece of pieces) map.set(piece.id, [...(map.get(piece.id) ?? []), piece])
    return map
  }
  const a = byId(before)
  const b = byId(after)
  const out: MorphPiece[] = []
  const glide = smooth(t)
  // Leaving terms are gone by the middle; arriving ones start there.
  const leaving = Math.max(0, 1 - t * 2)
  const arriving = Math.max(0, t * 2 - 1)
  for (const id of new Set([...a.keys(), ...b.keys()])) {
    const olds = a.get(id) ?? []
    const news = b.get(id) ?? []
    const n = Math.max(olds.length, news.length)
    for (let k = 0; k < n; k++) {
      const old = olds[k]
      const next = news[k]
      const blended = old && next ? blend(old, next, glide) : undefined
      if (blended) {
        out.push({ ...blended, opacity: 1 })
        continue
      }
      if (old) out.push({ ...old, opacity: leaving })
      if (next) out.push({ ...next, opacity: arriving })
    }
  }
  return out.filter((piece) => piece.opacity > 0)
}
