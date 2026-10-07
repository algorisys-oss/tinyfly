import type { EditLog, EditOptions } from './edit-log'
import type { SurfaceBox } from './surface-box'

/**
 * Parts of a surface that come loose: a word off a line of code, a note off
 * a board, a slice out of a chart. A piece is drawn by its surface at its
 * home plus the offsets recorded here, as `piece.K.x`, `.y` (px from home),
 * `.rotate` (degrees) and `.opacity`. The surface makes its pieces (it knows
 * what they look like); this moves them, the same way on every surface.
 */

/** A part of a surface that can come loose. */
export interface SurfacePiece {
  /** Its key in the surface's props (`piece.K.x`…) */
  readonly id: number
  /** Where it sits on the surface */
  readonly home: SurfaceBox
}

/** A point at a time, scene px: a path for a piece to follow (see `handPath`). */
export interface TimedPoint {
  time: number
  x: number
  y: number
}

export interface FlingOptions {
  /** When it leaves, ms */
  at: number
  /** px/ms (default: how fast it was moving along its `follow` path at `at`, or up and to the right) */
  velocity?: { x: number; y: number }
  /** Turns, degrees per ms (default 0.6, signed by the throw's direction) */
  spin?: number
  /** px/ms² (default 0.0016) */
  gravity?: number
  /** How long it flies before it is gone, ms (default 900) */
  duration?: number
}

/** Gravity and spin of a fling. */
const FLING_GRAVITY = 0.0016
const FLING_SPIN = 0.6
/** How often a fling's arc (and a ride) is sampled, ms. */
export const SAMPLE_STEP = 33

export interface PieceMotion {
  /** Where a piece's centre is at `time`, scene px */
  at(piece: SurfacePiece, time: number): { x: number; y: number }
  /** Drop a piece's position and turn after `time` (a fling or a move takes over from there) */
  cutAfter(piece: SurfacePiece, time: number): void
  /** Carry a piece along a path of scene points (its centre follows them) */
  follow(piece: SurfacePiece, path: TimedPoint[]): void
  /** Throw or kick a piece away: it flies on a ballistic arc, spinning, and fades */
  fling(piece: SurfacePiece, options: FlingOptions): void
  /** Move a piece's centre to a scene point (back home: its `home` centre) */
  move(piece: SurfacePiece, options: EditOptions & { to: { x: number; y: number } }): void
}

/** Moves pieces by recording their offsets in `log`. */
export function pieceMotion(log: EditLog): PieceMotion {
  const key = (piece: SurfacePiece, field: string) => `piece.${piece.id}.${field}`
  const at = (piece: SurfacePiece, time: number) => ({
    x: piece.home.x + log.valueAt(key(piece, 'x'), time),
    y: piece.home.y + log.valueAt(key(piece, 'y'), time),
  })
  /** How fast a piece was moving along its recorded path just before `time`, px/ms. */
  const pathVelocity = (piece: SurfacePiece, time: number): { x: number; y: number } | undefined => {
    const xs = log.keys(key(piece, 'x'))
    if (!xs || xs.length < 2) return undefined
    const before = at(piece, time - SAMPLE_STEP)
    const now = at(piece, time)
    return { x: (now.x - before.x) / SAMPLE_STEP, y: (now.y - before.y) / SAMPLE_STEP }
  }
  const cutAfter = (piece: SurfacePiece, time: number) => log.cutAfter(['x', 'y', 'rotate'].map((field) => key(piece, field)), time)

  return {
    at,
    cutAfter,
    follow(piece, path) {
      for (const point of path) {
        log.push(key(piece, 'x'), { time: point.time, value: point.x - piece.home.x })
        log.push(key(piece, 'y'), { time: point.time, value: point.y - piece.home.y })
      }
    },
    fling(piece, fling) {
      const start = at(piece, fling.at)
      const velocity = fling.velocity ?? pathVelocity(piece, fling.at) ?? { x: 0.5, y: -0.6 }
      const gravity = fling.gravity ?? FLING_GRAVITY
      const duration = fling.duration ?? 900
      const spin = (fling.spin ?? FLING_SPIN) * (velocity.x < 0 ? -1 : 1)
      const turned = log.valueAt(key(piece, 'rotate'), fling.at)
      cutAfter(piece, fling.at)
      for (let t = 0; t <= duration; t += SAMPLE_STEP) {
        const x = start.x + velocity.x * t
        const y = start.y + velocity.y * t + 0.5 * gravity * t * t
        log.push(key(piece, 'x'), { time: fling.at + t, value: x - piece.home.x })
        log.push(key(piece, 'y'), { time: fling.at + t, value: y - piece.home.y })
        log.push(key(piece, 'rotate'), { time: fling.at + t, value: turned + spin * t })
      }
      log.tween(key(piece, 'opacity'), 1, 0, { at: fling.at + duration * 0.6, duration: duration * 0.4 })
    },
    move(piece, edit) {
      const from = at(piece, edit.at)
      log.tween(key(piece, 'x'), from.x - piece.home.x, edit.to.x - piece.home.x, edit, 400)
      log.tween(key(piece, 'y'), from.y - piece.home.y, edit.to.y - piece.home.y, edit, 400)
    },
  }
}
