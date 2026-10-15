import { apply, determinant, type Mat2 } from '../../linear/mat2'
import type { Vec2 } from '../../linear/vec2'
import type { AxesItem, GridItem } from '../figure-spec'
import { trimPolylines, UI_FONT, type Shape } from '../display-list'
import { colorOf, matrixOf, type ItemContext } from '../item-context'
import type { Plane } from '../plane'

/** How far out (world units) grid lines must reach so the warped grid still fills the view. */
function reach(plane: Plane, m: Mat2): number {
  const view = Math.max(Math.abs(plane.x[0]), Math.abs(plane.x[1]), Math.abs(plane.y[0]), Math.abs(plane.y[1]))
  // The smallest stretch the matrix applies: |det| / largest stretch.
  const [a, b, c, d] = m
  const largest = Math.hypot(a, b, c, d)
  const smallest = largest === 0 ? 0 : Math.abs(determinant(m)) / largest
  return Math.min(view * 12, view / Math.max(smallest, 0.08)) + 1
}

function gridLines(plane: Plane, m: Mat2, step: number): { line: Vec2[]; axis: boolean }[] {
  const r = reach(plane, m)
  const count = Math.min(120, Math.ceil(r / step))
  const lines: { line: Vec2[]; axis: boolean }[] = []
  for (let k = -count; k <= count; k++) {
    const at = k * step
    // Straight lines stay straight under a linear map: two ends are enough.
    lines.push({ line: [apply(m, [at, -r]), apply(m, [at, r])].map(plane.toScreen), axis: k === 0 })
    lines.push({ line: [apply(m, [-r, at]), apply(m, [r, at])].map(plane.toScreen), axis: k === 0 })
  }
  return lines
}

export function layoutGrid(item: GridItem, ctx: ItemContext): Shape[] {
  const { plane, theme } = ctx
  const step = item.step ?? 1
  const shapes: Shape[] = []
  const width = 1.4 * plane.scale
  if (item.ghost) {
    for (const [k, { line }] of gridLines(plane, [1, 0, 0, 1], step).entries()) {
      shapes.push({ type: 'line', id: `${item.id}.ghost.${k}`, points: line, stroke: theme.ghost, width, opacity: ctx.opacity })
    }
  }
  const color = colorOf(theme, item.color, theme.grid)
  for (const [k, { line, axis }] of gridLines(plane, matrixOf(ctx.values, item.transform), step).entries()) {
    // Every line draws on together, each from its own end, as the classic animation does.
    const [part] = trimPolylines([line], ctx.draw)
    if (!part) continue
    shapes.push({ type: 'line', id: `${item.id}.${k}`, points: part, stroke: axis ? theme.ink : color, width: axis ? width * 1.6 : width, opacity: ctx.opacity })
  }
  return shapes
}

export function layoutAxes(item: AxesItem, ctx: ItemContext): Shape[] {
  const { plane, theme } = ctx
  const color = colorOf(theme, item.color, theme.axes)
  const width = 2 * plane.scale
  const opacity = ctx.opacity
  const xAxis = trimPolylines([[plane.toScreen([plane.x[0], 0]), plane.toScreen([plane.x[1], 0])]], ctx.draw)
  const yAxis = trimPolylines([[plane.toScreen([0, plane.y[0]]), plane.toScreen([0, plane.y[1]])]], ctx.draw)
  const shapes: Shape[] = [...xAxis, ...yAxis].map((points, k): Shape => ({ type: 'line', id: `${item.id}.${k ? 'y' : 'x'}`, points, stroke: color, width, opacity }))
  const step = item.ticks ?? 1
  if (step <= 0 || ctx.draw < 1) return shapes
  const tick = 5 * plane.scale
  const size = 13 * plane.scale
  const ticks = (from: number, to: number) => {
    const out: number[] = []
    for (let v = Math.ceil(from / step) * step; v <= to + 1e-9; v += step) if (Math.abs(v) > 1e-9) out.push(Number(v.toFixed(6)))
    return out
  }
  const label = (v: number) => String(v).replace('-', '−')
  for (const v of ticks(plane.x[0], plane.x[1])) {
    const [x, y] = plane.toScreen([v, 0])
    shapes.push({ type: 'line', id: `${item.id}.tick.x${v}`, points: [[x, y - tick], [x, y + tick]], stroke: color, width: width * 0.8, opacity })
    if (item.labels !== false) shapes.push({ type: 'text', id: `${item.id}.label.x${v}`, text: label(v), x, y: y + tick + size * 1.1, size, font: UI_FONT, color, align: 'center', opacity: opacity * 0.8 })
  }
  for (const v of ticks(plane.y[0], plane.y[1])) {
    const [x, y] = plane.toScreen([0, v])
    shapes.push({ type: 'line', id: `${item.id}.tick.y${v}`, points: [[x - tick, y], [x + tick, y]], stroke: color, width: width * 0.8, opacity })
    if (item.labels !== false) shapes.push({ type: 'text', id: `${item.id}.label.y${v}`, text: label(v), x: x - tick - size * 0.4, y: y + size * 0.35, size, font: UI_FONT, color, align: 'right', opacity: opacity * 0.8 })
  }
  return shapes
}
