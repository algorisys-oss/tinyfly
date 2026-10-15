import { apply, eigen } from '../../linear/mat2'
import { scale, type Vec2 } from '../../linear/vec2'
import { layoutTex } from '../../tex/tex-layout'
import type { LineItem, PolygonItem } from '../figure-spec'
import { texToShapes, trimPolylines, type Shape } from '../display-list'
import { colorOf, matrixOf, vecOf, type ItemContext } from '../item-context'

const UNIT_SQUARE: Vec2[] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export function layoutPolygon(item: PolygonItem, ctx: ItemContext): Shape[] {
  const m = matrixOf(ctx.values, item.transform)
  const world = (item.points ?? UNIT_SQUARE).map((p) => apply(m, p))
  const points = world.map(ctx.plane.toScreen)
  const color = colorOf(ctx.theme, item.color, ctx.theme.colors.yellow)
  // The fill fades in with `draw`; the outline is drawn on around it.
  const shapes: Shape[] = [
    { type: 'line', id: `${item.id}.fill`, points, closed: true, fill: color, opacity: ctx.opacity * (item.fillOpacity ?? 0.3) * ctx.draw },
    ...trimPolylines([[...points, points[0]]], ctx.draw).map((outline): Shape => ({ type: 'line', id: `${item.id}.outline`, points: outline, stroke: color, width: 2.5 * ctx.plane.scale, opacity: ctx.opacity })),
  ]
  if (item.label && ctx.draw >= 1) {
    const centre = world.reduce<Vec2>((sum, p) => [sum[0] + p[0] / world.length, sum[1] + p[1] / world.length], [0, 0])
    const [x, y] = ctx.plane.toScreen(centre)
    shapes.push(...texToShapes(layoutTex(item.label, { values: ctx.scope, style: 'inline' }), { x, y, size: 24 * ctx.plane.scale, color: ctx.theme.ink, opacity: ctx.opacity, idPrefix: `${item.id}.label.` }))
  }
  return shapes
}

export function layoutLine(item: LineItem, ctx: ItemContext): Shape[] {
  const directions: Vec2[] = item.eigen
    ? eigen(matrixOf(ctx.values, item.eigen)).map((pair) => pair.vector)
    : item.along !== undefined ? [vecOf(ctx.values, item.along)] : []
  const view = Math.max(Math.abs(ctx.plane.x[0]), Math.abs(ctx.plane.x[1]), Math.abs(ctx.plane.y[0]), Math.abs(ctx.plane.y[1])) * 1.5
  const color = colorOf(ctx.theme, item.color, ctx.theme.colors.yellow)
  const width = (item.width ?? 2.5) * ctx.plane.scale
  return directions.flatMap((direction, k) => {
    const length = Math.hypot(direction[0], direction[1])
    if (length === 0) return []
    const unit = scale(direction, view / length)
    const line = [scale(unit, -1), unit].map(ctx.plane.toScreen)
    return trimPolylines([line], ctx.draw).map((points): Shape => ({
      type: 'line', id: `${item.id}.${k}`, points, stroke: color, width, opacity: ctx.opacity,
      ...(item.dashed ? { dash: [10 * ctx.plane.scale, 8 * ctx.plane.scale] } : {}),
    }))
  })
}
