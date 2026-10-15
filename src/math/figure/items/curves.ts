import { compile, compileDerivative } from '../../expr/evaluate'
import { apply } from '../../linear/mat2'
import type { Vec2 } from '../../linear/vec2'
import type { FunctionItem, ParametricItem } from '../figure-spec'
import { trimPolylines, type Shape } from '../display-list'
import { colorOf, matrixOf, type ItemContext } from '../item-context'

const SAMPLES = 480

/**
 * Screen points split into runs wherever the curve leaves the real numbers
 * (NaN, ±∞) or leaps across the view between samples (an asymptote, as in
 * tan x or 1/x), so no false vertical line joins the two sides.
 */
function runs(points: (Vec2 | undefined)[], height: number): Vec2[][] {
  const out: Vec2[][] = []
  let run: Vec2[] = []
  points.forEach((p, i) => {
    const previous = points[i - 1]
    const broken = !p || (previous && Math.abs(p[1] - previous[1]) > height * 1.5)
    if (broken) {
      if (run.length >= 2) out.push(run)
      run = []
    }
    if (p) run.push(p)
  })
  if (run.length >= 2) out.push(run)
  return out
}

/** Keep coordinates bounded so canvases and SVG stay well behaved far off screen. */
function bounded(p: Vec2, ctx: ItemContext): Vec2 | undefined {
  const limit = Math.max(ctx.plane.width, ctx.plane.height) * 20
  if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) return undefined
  return [Math.max(-limit, Math.min(limit, p[0])), Math.max(-limit, Math.min(limit, p[1]))]
}

function curveShapes(id: string, lines: Vec2[][], color: string, width: number, ctx: ItemContext, dash?: number[]): Shape[] {
  return trimPolylines(lines, ctx.draw).map((points, k): Shape => ({ type: 'line', id: `${id}.${k}`, points, stroke: color, width, opacity: ctx.opacity, ...(dash ? { dash } : {}) }))
}

/** y = f(x) from x0 to x1 as drawn-on runs, broken at gaps and asymptotes. */
export function curveRuns(id: string, f: (x: number) => number, x0: number, x1: number, color: string, width: number, ctx: ItemContext, dash?: number[]): Shape[] {
  const points = Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / SAMPLES
    return bounded(ctx.plane.toScreen([x, f(x)]), ctx)
  })
  return curveShapes(id, runs(points, ctx.plane.height), color, width, ctx, dash)
}

export function layoutFunction(item: FunctionItem, ctx: ItemContext): Shape[] {
  const f = item.derivative ? compileDerivative(item.expr, item.derivative) : compile(item.expr, 'x')
  const [a, b] = item.domain ?? ctx.plane.x
  const color = colorOf(ctx.theme, item.color, ctx.theme.colors.blue)
  const dash = item.dashed ? [10 * ctx.plane.scale, 8 * ctx.plane.scale] : undefined
  return curveRuns(item.id, (x) => f(x, ctx.scope), a, b, color, (item.width ?? 3.5) * ctx.plane.scale, ctx, dash)
}

export function layoutParametric(item: ParametricItem, ctx: ItemContext): Shape[] {
  const fx = compile(item.x, 't')
  const fy = compile(item.y, 't')
  const m = matrixOf(ctx.values, item.transform)
  const [a, b] = item.t ?? [0, Math.PI * 2]
  const points = Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const t = a + ((b - a) * i) / SAMPLES
    return bounded(ctx.plane.toScreen(apply(m, [fx(t, ctx.scope), fy(t, ctx.scope)])), ctx)
  })
  const color = colorOf(ctx.theme, item.color, ctx.theme.colors.blue)
  return curveShapes(item.id, runs(points, ctx.plane.height), color, (item.width ?? 3.5) * ctx.plane.scale, ctx)
}
