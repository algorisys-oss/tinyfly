import { evaluate } from '../../expr/evaluate'
import { parseExpression } from '../../expr/parse-expression'
import type { Vec2 } from '../../linear/vec2'
import { density, isDiscrete, meanOf, samples, sdOf } from '../../prob/distributions'
import { binSamples, defaultBins } from '../../prob/histogram'
import { leastSquares, scatterPoints, type PointsSpec } from '../../prob/scatter'
import { ballAt, ballPath, binOf } from '../../prob/galton'
import { layoutTex } from '../../tex/tex-layout'
import type { BayesItem, DistributionItem, GaltonItem, HistogramItem, ScatterItem } from '../figure-spec'
import { texToShapes, trimPolylines, type Shape } from '../display-list'
import { colorOf, distributionOf, numOf, type ItemContext } from '../item-context'
import { curveRuns } from './curves'

const box = (ctx: ItemContext, left: number, bottom: number, right: number, top: number): Vec2[] =>
  ([[left, bottom], [right, bottom], [right, top], [left, top]] as Vec2[]).map(ctx.plane.toScreen)

/** How many samples a histogram or scatter has so far: a whole number, at most 20 000. */
export const sampleCount = (n: number) => Math.min(20000, Math.max(0, Math.floor(n)))

export function layoutHistogram(item: HistogramItem, ctx: ItemContext): Shape[] {
  const d = distributionOf(ctx.values, item.distribution)
  const values = samples(d, item.seed ?? item.id, sampleCount(numOf(ctx.values, item.count)))
  const bins = binSamples(values, item.bins ?? defaultBins(d), item.scale ?? 'density')
  const color = colorOf(ctx.theme, item.color, ctx.theme.colors.blue)
  const opacity = ctx.opacity * ctx.draw
  const shapes: Shape[] = bins.flatMap((bin, k): Shape[] =>
    bin.height > 0
      ? [{ type: 'line', id: `${item.id}.${k}`, points: box(ctx, bin.left, 0, bin.right, bin.height), closed: true, fill: color, stroke: ctx.theme.background, width: 1 * ctx.plane.scale, opacity: opacity * (item.fillOpacity ?? 0.75) }]
      : [],
  )
  if (item.curve && (item.scale ?? 'density') === 'density') {
    const [from, to] = item.bins ?? defaultBins(d)
    // Whole-number distributions get their normal approximation, which is what the bars approach.
    const curveColor = colorOf(ctx.theme, 'yellow', ctx.theme.colors.yellow)
    shapes.push(...curveRuns(`${item.id}.curve`, (x) => density(isDiscrete(d) ? { kind: 'normal', mean: meanOf(d), sd: sdOf(d) } : d, x), from, to, curveColor, 3 * ctx.plane.scale, { ...ctx, draw: 1 }))
  }
  return shapes
}

export function layoutDistribution(item: DistributionItem, ctx: ItemContext): Shape[] {
  const d = distributionOf(ctx.values, item.distribution)
  const color = colorOf(ctx.theme, item.color, ctx.theme.colors.blue)
  const [x0, x1] = item.domain ?? ctx.plane.x
  const shade = item.shade ? [numOf(ctx.values, item.shade[0]), numOf(ctx.values, item.shade[1])].sort((a, b) => a - b) : undefined
  const shadeColor = colorOf(ctx.theme, 'yellow', ctx.theme.colors.yellow)
  if (isDiscrete(d)) {
    // Bars on whole numbers; those inside the shaded range are highlighted.
    const shapes: Shape[] = []
    const first = Math.max(0, Math.ceil(x0))
    const last = Math.floor(x1)
    const shown = first + Math.ceil((last - first + 1) * ctx.draw)
    for (let k = first; k < shown && k <= last; k++) {
      const p = density(d, k)
      if (p <= 0) continue
      const inside = shade && k >= shade[0] && k <= shade[1]
      shapes.push({ type: 'line', id: `${item.id}.${k}`, points: box(ctx, k - 0.4, 0, k + 0.4, p), closed: true, fill: inside ? shadeColor : color, opacity: ctx.opacity * (item.fillOpacity ?? 0.8) })
    }
    return shapes
  }
  const shapes: Shape[] = []
  if (shade && ctx.draw >= 1) {
    const [a, b] = [Math.max(shade[0], x0), Math.min(shade[1], x1)]
    if (b > a) {
      const steps = 120
      const top = Array.from({ length: steps + 1 }, (_, i): Vec2 => {
        const x = a + ((b - a) * i) / steps
        return [x, density(d, x)]
      })
      const region = [[a, 0] as Vec2, ...top, [b, 0] as Vec2].map(ctx.plane.toScreen)
      shapes.push({ type: 'line', id: `${item.id}.shade`, points: region, closed: true, fill: shadeColor, opacity: ctx.opacity * (item.fillOpacity ?? 0.4) })
    }
  }
  shapes.push(...curveRuns(item.id, (x) => density(d, x), x0, x1, color, (item.width ?? 3.5) * ctx.plane.scale, ctx))
  return shapes
}

export function layoutGalton(item: GaltonItem, ctx: ItemContext): Shape[] {
  const rows = item.rows ?? 10
  const spacing = item.spacing ?? 0.5
  const top = item.top ?? ctx.plane.y[1] - spacing
  const gap = spacing * 0.9
  // Peg units to world: x across, depth down.
  const world = (x: number, depth: number): Vec2 => [x * spacing, top - depth * gap]
  const ink = colorOf(ctx.theme, 'grey', ctx.theme.colors.grey)
  const ball = colorOf(ctx.theme, item.color, ctx.theme.colors.yellow)
  const r = spacing * 0.19 * ctx.plane.unitX
  const shapes: Shape[] = []
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j <= i; j++) {
      const [x, y] = ctx.plane.toScreen(world(j - i / 2, i))
      shapes.push({ type: 'circle', id: `${item.id}.peg.${i}.${j}`, x, y, r: r * 0.45, fill: ink, opacity: ctx.opacity * ctx.draw })
    }
  }
  // The bins: dividers from just below the last row of pegs down to the floor at the bottom of the view.
  const binTop = rows + 0.3
  const floor = Math.max(rows + 2, (top - ctx.plane.y[0]) / gap - 0.2)
  for (let b = 0; b <= rows + 1; b++) {
    const x = b - (rows + 1) / 2
    const line = trimPolylines([[world(x, binTop), world(x, floor)].map(ctx.plane.toScreen)], ctx.draw)
    for (const points of line) shapes.push({ type: 'line', id: `${item.id}.bin.${b}`, points, stroke: ink, width: 1.2 * ctx.plane.scale, opacity: ctx.opacity * 0.6 })
  }
  const floorLine = trimPolylines([[world(-(rows + 1) / 2, floor), world((rows + 1) / 2, floor)].map(ctx.plane.toScreen)], ctx.draw)
  for (const points of floorLine) shapes.push({ type: 'line', id: `${item.id}.floor`, points, stroke: ink, width: 1.2 * ctx.plane.scale, opacity: ctx.opacity * 0.6 })
  // Landed balls stack two to a row in their bins, from the floor up; the next one is on its way.
  const balls = Math.max(0, numOf(ctx.values, item.balls))
  const landed = Math.floor(balls)
  const seed = item.seed ?? item.id
  const heights = new Array<number>(rows + 1).fill(0)
  const stack = (2 * r) / ctx.plane.unitY / gap // one ball's height in peg units
  const restAt = (bin: number, slot: number) => ({ x: bin - rows / 2 + (slot % 2 ? 0.22 : -0.22), depth: floor - stack * (Math.floor(slot / 2) + 0.5) })
  for (let k = 0; k < landed; k++) {
    const bin = binOf(ballPath(seed, k, rows))
    const rest = restAt(bin, heights[bin])
    const [x, y] = ctx.plane.toScreen(world(rest.x, rest.depth))
    heights[bin]++
    shapes.push({ type: 'circle', id: `${item.id}.ball.${k}`, x, y, r, fill: ball, opacity: ctx.opacity })
  }
  const progress = balls - landed
  if (progress > 0) {
    const path = ballPath(seed, landed, rows)
    // Through the pegs for most of the way, then the drop into its bin.
    const throughPegs = Math.min(1, progress / 0.8)
    let { x, depth } = ballAt(path, throughPegs)
    depth -= 1 // the ball starts above the top peg
    if (progress > 0.8) {
      // Falling (accelerating) from the last row to its resting place.
      const fall = ((progress - 0.8) / 0.2) ** 2
      const bin = binOf(path)
      const rest = restAt(bin, heights[bin])
      const start = { x: binOf(path) - rows / 2, depth: rows - 1 }
      depth = start.depth + (rest.depth - start.depth) * fall
      x = start.x + (rest.x - start.x) * fall
    }
    const [sx, sy] = ctx.plane.toScreen(world(x, depth))
    shapes.push({ type: 'circle', id: `${item.id}.falling`, x: sx, y: sy, r, fill: ball, opacity: ctx.opacity })
  }
  return shapes
}

export function layoutScatter(item: ScatterItem, ctx: ItemContext): Shape[] {
  const spec = pointsSpec(item, ctx)
  const points = scatterPoints(spec, item.seed ?? item.id, sampleCount(numOf(ctx.values, item.count)))
  const color = colorOf(ctx.theme, item.color, ctx.theme.colors.blue)
  const insideColor = colorOf(ctx.theme, item.insideColor, ctx.theme.colors.yellow)
  const test = item.inside ? parseExpression(item.inside) : undefined
  const r = (item.radius ?? 3) * ctx.plane.scale
  const shapes: Shape[] = points.map(([x, y], k): Shape => {
    const [sx, sy] = ctx.plane.toScreen([x, y])
    const inside = test ? evaluate(test, { ...ctx.scope, x, y }) <= 0 : false
    return { type: 'circle', id: `${item.id}.${k}`, x: sx, y: sy, r, fill: inside ? insideColor : color, opacity: ctx.opacity * ctx.draw * 0.85 }
  })
  if (item.fit) {
    const fit = leastSquares(points)
    if (fit) {
      const [a, b] = ctx.plane.x
      shapes.push({ type: 'line', id: `${item.id}.fit`, points: ([[a, fit.slope * a + fit.intercept], [b, fit.slope * b + fit.intercept]] as Vec2[]).map(ctx.plane.toScreen), stroke: colorOf(ctx.theme, 'red', ctx.theme.colors.red), width: 3 * ctx.plane.scale, opacity: ctx.opacity })
    }
  }
  return shapes
}

/** A scatter item's points spec with its numbers resolved. */
export function pointsSpec(item: ScatterItem, ctx: Pick<ItemContext, 'values'>): PointsSpec {
  const p = item.points
  return p.kind === 'uniform' ? p : { kind: 'linear', slope: numOf(ctx.values, p.slope), intercept: numOf(ctx.values, p.intercept), noise: numOf(ctx.values, p.noise), x: p.x }
}

export function layoutBayes(item: BayesItem, ctx: ItemContext): Shape[] {
  const prior = numOf(ctx.values, item.prior)
  const sensitivity = numOf(ctx.values, item.truePositive)
  const falseRate = numOf(ctx.values, item.falsePositive)
  const width = ctx.plane.x[1] - ctx.plane.x[0]
  const height = ctx.plane.y[1] - ctx.plane.y[0]
  const [w, h] = item.size ?? [width * 0.8, height * 0.7]
  const [x0, y0] = item.at ?? [ctx.plane.x[0] + width * 0.1, ctx.plane.y[0] + height * 0.08]
  const split = x0 + w * Math.min(1, Math.max(0, prior))
  const truePositive = colorOf(ctx.theme, item.color, ctx.theme.colors.yellow)
  const falsePositive = colorOf(ctx.theme, 'red', ctx.theme.colors.red)
  const negative = colorOf(ctx.theme, 'grey', ctx.theme.colors.grey)
  const opacity = ctx.opacity * ctx.draw
  const region = (id: string, left: number, bottom: number, right: number, top: number, fill: string, alpha: number): Shape => ({
    type: 'line', id: `${item.id}.${id}`, points: box(ctx, left, bottom, right, top), closed: true, fill, stroke: ctx.theme.background, width: 2 * ctx.plane.scale, opacity: opacity * alpha,
  })
  // Positives on top of each column.
  const yesTop = y0 + h
  const yesSplit = yesTop - h * Math.min(1, Math.max(0, sensitivity))
  const noSplit = yesTop - h * Math.min(1, Math.max(0, falseRate))
  const shapes: Shape[] = [
    region('tp', x0, yesSplit, split, yesTop, truePositive, 0.85),
    region('fn', x0, y0, split, yesSplit, negative, 0.35),
    region('fp', split, noSplit, x0 + w, yesTop, falsePositive, 0.8),
    region('tn', split, y0, x0 + w, noSplit, negative, 0.2),
  ]
  if (item.labels !== false && ctx.draw >= 1) {
    const size = 20 * ctx.plane.scale
    const label = (id: string, tex: string, at: Vec2, color: string) => {
      const [x, y] = ctx.plane.toScreen(at)
      shapes.push(...texToShapes(layoutTex(tex, { values: ctx.scope, style: 'inline' }), { x, y, size, color, opacity: ctx.opacity, idPrefix: `${item.id}.label.${id}.` }))
    }
    // Under the square: how the prior splits it; above: the posterior.
    label('prior', `\\text{has it: } \\val{${item.id}.prior:3}`, [x0 + w / 2, y0 - height * 0.04], ctx.theme.ink)
    label('tp', `\\text{has it, tests positive: } \\val{${item.id}.truePositive:3}`, [x0 + w / 2, y0 - height * 0.09], truePositive)
    label('fp', `\\text{does not, tests positive: } \\val{${item.id}.falsePositive:3}`, [x0 + w / 2, y0 - height * 0.14], falsePositive)
    label('posterior', `P(\\text{has it} \\mid +) = \\val{${item.id}.posterior:3}`, [x0 + w / 2, y0 + h + height * 0.05], truePositive)
  }
  return shapes
}
