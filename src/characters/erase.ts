import type { CustomTarget } from '../adapters/canvas'
import type { Point } from '../adapters/canvas/sketch'
import { drawEraser, drawHand, type EraserStyle, type HandStyle } from './hand'
import { partialPath, pointAlong } from '../adapters/canvas/polyline'

/**
 * Erasing: an eraser of some width travels along a path and whatever was drawn
 * under the part it has covered is gone. How far it has travelled is one
 * number, `progress` 0..1, so erasing is a timeline track like any other.
 *
 * The erased swath is cut out with clipping (one clip per segment and per
 * joint, each "everything except this shape"), not with an offscreen layer, so
 * it needs only a Canvas 2D context: browser, Worker or Node all draw it the
 * same way. Only drawing done inside the clip is erased; what was drawn before
 * it, such as the paper, shows through.
 */

/** How far a clip-out rectangle reaches: far past any canvas, in local units. */
const EVERYWHERE = 1e5

/**
 * A back-and-forth scrub that covers a box, the way an eraser rubs out an area:
 * `strokes` passes from side to side, stepping down the box.
 */
export function scrubPath(x: number, y: number, width: number, height: number, strokes = 6): Point[] {
  const points: Point[] = []
  const count = Math.max(1, Math.round(strokes))
  for (let i = 0; i <= count; i++) {
    points.push({ x: i % 2 === 0 ? x : x + width, y: y + (height * i) / count })
  }
  return points
}

/**
 * Clip the context so that drawing misses the swath an eraser `width` wide
 * leaves along `path` up to `progress`. Wrap in save()/restore() to end it.
 */
export function clipErased(ctx: CanvasRenderingContext2D, path: Point[], width: number, progress: number): void {
  if (progress <= 0 || path.length === 0) return
  const swath = partialPath(path, progress)
  const r = width / 2
  // Each clip keeps everything except one shape; clips intersect, so after all
  // of them everything except the whole swath is left.
  const clipOut = (shape: () => void) => {
    ctx.beginPath()
    ctx.rect(-EVERYWHERE, -EVERYWHERE, 2 * EVERYWHERE, 2 * EVERYWHERE)
    shape()
    ctx.clip('evenodd')
  }
  for (const point of swath) {
    clipOut(() => {
      ctx.moveTo(point.x + r, point.y)
      ctx.arc(point.x, point.y, r, 0, Math.PI * 2)
    })
  }
  for (let i = 1; i < swath.length; i++) {
    const a = swath[i - 1]
    const b = swath[i]
    const length = Math.hypot(b.x - a.x, b.y - a.y)
    if (length === 0) continue
    const nx = (-(b.y - a.y) / length) * r
    const ny = ((b.x - a.x) / length) * r
    clipOut(() => {
      ctx.moveTo(a.x + nx, a.y + ny)
      ctx.lineTo(b.x + nx, b.y + ny)
      ctx.lineTo(b.x - nx, b.y - ny)
      ctx.lineTo(a.x - nx, a.y - ny)
      ctx.closePath()
    })
  }
}

/** Run `draw` with the swath erased from it, for immediate-mode drawing. */
export function withErased(
  ctx: CanvasRenderingContext2D,
  path: Point[],
  width: number,
  progress: number,
  draw: () => void
): void {
  ctx.save()
  clipErased(ctx, path, width, progress)
  draw()
  ctx.restore()
}

export interface ErasableOptions {
  /** The eraser's path, in the target's own box (0, 0 is its top-left corner) */
  path: Point[]
  /** Eraser width, px (default 40) */
  width?: number
  /** Draw the eraser while it is rubbing (default true); a style changes its look */
  eraser?: boolean | EraserStyle
  /** Draw a hand holding the eraser, reaching in from off screen (default false) */
  hand?: boolean | HandStyle
}

/**
 * `target`, erasable: it gains an `erase` prop (0..1, how far along `path` the
 * eraser has rubbed), and what the eraser has covered stays erased. The path
 * is in the target's own box, so the erased part moves with the target.
 */
export function erasable(target: CustomTarget, options: ErasableOptions): CustomTarget {
  const width = options.width ?? 40
  const handStyle = options.hand === true ? {} : options.hand || undefined
  const eraserStyle = options.eraser === false ? undefined : options.eraser === true || options.eraser === undefined ? {} : options.eraser
  return {
    ...target,
    props: { ...target.props, erase: 0 },
    draw(ctx, current, time) {
      const progress = Number(current.props?.erase ?? 0)
      ctx.save()
      clipErased(ctx, options.path, width, progress)
      target.draw(ctx, current, time)
      ctx.restore()
      // The eraser shows while it moves, and is gone once it is done.
      if (!eraserStyle || progress <= 0 || progress >= 1) return
      const tip = pointAlong(options.path, progress)
      if (handStyle) drawHand(ctx, tip, { ...handStyle, tool: 'eraser' })
      else drawEraser(ctx, tip, eraserStyle)
    },
  }
}
