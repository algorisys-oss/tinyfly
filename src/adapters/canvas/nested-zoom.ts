import { powSimilarity, similarityMatrix, type Similarity } from '../../engine/path/similarity'

/**
 * A nested zoom (a Droste picture): one drawing repeated inside itself, each
 * level a `step` smaller and turned, and the camera diving in so that after
 * one step every level is where the next one was. That is the whole loop: a
 * video whose duration is one step repeats exactly.
 *
 *     draw(ctx, frame) {
 *       nestedZoom(ctx, {
 *         step: similarityAbout(0.5, 12, { x: 640, y: 360 }),
 *         phase: frame.time / frame.period,
 *         extent: 1600,
 *         coversAbove: 1,
 *         draw: (ctx, level) => drawFrame(ctx),
 *       })
 *     }
 *
 * Only the levels that show are drawn: those smaller than a pixel are
 * skipped, and so is everything behind a level that covers the whole frame.
 */

export interface NestedZoomOptions {
  /** The step from a level to the one inside it: a shrink (and turn) about the zoom's centre (`similarityAbout`) */
  step: Similarity
  /** How far into one step the zoom is, 0..1: at 1 every level has moved to where the next was */
  phase: number
  /** The levels considered, outermost to innermost (default −4 to 24) */
  levels?: [number, number]
  /** The size of a level's drawing at level 0, px (how far it reaches): with `step`, which levels are big enough to see */
  extent: number
  /** A level whose drawing is smaller than this many px is skipped (default 1) */
  minSize?: number
  /** A level drawn at this screen scale or more covers the whole frame, so nothing behind it is drawn (default: nothing covers) */
  coversAbove?: number
  /** Draw one level in level-0 coordinates; the transform is already applied. `scale` is its size on screen */
  draw: (ctx: CanvasRenderingContext2D, level: number, scale: number) => void
}

/** Where level `level` sits at a `phase` of the zoom: `step` to the power `level − phase`. */
export function nestedZoomTransform(step: Similarity, level: number, phase: number): Similarity {
  return powSimilarity(step, level - phase)
}

/** Draw the levels of a nested zoom that show, outermost first. Returns the levels drawn. */
export function nestedZoom(ctx: CanvasRenderingContext2D, options: NestedZoomOptions): number[] {
  const [from, to] = options.levels ?? [-4, 24]
  const minSize = options.minSize ?? 1
  const levels: Array<{ level: number; scale: number; transform: Similarity }> = []
  for (let level = Math.ceil(from); level <= Math.floor(to); level++) {
    const transform = nestedZoomTransform(options.step, level, options.phase)
    if (transform.scale * options.extent < minSize) continue
    levels.push({ level, scale: transform.scale, transform })
  }
  // Biggest first: it is behind the smaller levels inside it.
  levels.sort((a, b) => b.scale - a.scale)
  let start = 0
  if (options.coversAbove !== undefined) {
    for (let i = 0; i < levels.length; i++) if (levels[i].scale >= options.coversAbove) start = i
  }
  const drawn: number[] = []
  for (const { level, scale, transform } of levels.slice(start)) {
    ctx.save()
    ctx.transform(...similarityMatrix(transform))
    options.draw(ctx, level, scale)
    ctx.restore()
    drawn.push(level)
  }
  return drawn
}
