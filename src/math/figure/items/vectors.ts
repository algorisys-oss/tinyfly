import { apply } from '../../linear/mat2'
import { normalize, sub, type Vec2 } from '../../linear/vec2'
import { layoutTex } from '../../tex/tex-layout'
import type { BasisItem, PointItem, VectorItem } from '../figure-spec'
import { texToShapes, trimPolylines, type Shape } from '../display-list'
import { colorOf, matrixOf, vecOf, type ItemContext } from '../item-context'

/** A TeX label just beyond `tip`, pushed out along `direction` (screen px). */
export function tipLabel(tex: string, tip: Vec2, direction: Vec2, color: string, id: string, ctx: ItemContext): Shape[] {
  const size = 26 * ctx.plane.scale
  const [dx, dy] = normalize(direction)
  const layout = layoutTex(tex, { values: ctx.scope, style: 'inline' })
  // Far enough out that the label's own half-width clears the tip.
  const out = size * (0.55 + Math.abs(dx) * layout.width * 0.5)
  return texToShapes(layout, { x: tip[0] + dx * out, y: tip[1] + dy * out, size, color, opacity: ctx.opacity, idPrefix: `${id}.label.` })
}

/** One arrow from `from` to `to` in world units, drawn on from the tail. */
function arrow(id: string, from: Vec2, to: Vec2, color: string, width: number, ctx: ItemContext): Shape[] {
  const a = ctx.plane.toScreen(from)
  const b = ctx.plane.toScreen(to)
  const [line] = trimPolylines([[a, b]], ctx.draw)
  if (!line) return []
  const length = Math.hypot(b[0] - a[0], b[1] - a[1])
  // A short vector gets a smaller head, so the head never swallows it.
  const head = Math.min(width * 3.6, length * 0.45)
  return [{ type: 'arrow', id, points: line, stroke: color, width, head, opacity: ctx.opacity }]
}

export function layoutVector(item: VectorItem, ctx: ItemContext): Shape[] {
  const m = matrixOf(ctx.values, item.transform)
  const from = apply(m, item.from === undefined ? [0, 0] : vecOf(ctx.values, item.from))
  const to = apply(m, vecOf(ctx.values, item.to))
  const color = colorOf(ctx.theme, item.color, ctx.theme.colors.yellow)
  const shapes = arrow(item.id, from, to, color, (item.width ?? 4) * ctx.plane.scale, ctx)
  if (item.label && ctx.draw >= 1) {
    const tip = ctx.plane.toScreen(to)
    const tail = ctx.plane.toScreen(from)
    const direction = sub(tip, tail)
    if (item.labelAt === 'middle') {
      // Beside the middle, on the left of the direction of travel (screen y is down).
      const middle: Vec2 = [(tip[0] + tail[0]) / 2, (tip[1] + tail[1]) / 2]
      shapes.push(...tipLabel(item.label, middle, [direction[1], -direction[0]], color, item.id, ctx))
    } else {
      shapes.push(...tipLabel(item.label, tip, direction, color, item.id, ctx))
    }
  }
  return shapes
}

export function layoutBasis(item: BasisItem, ctx: ItemContext): Shape[] {
  const m = matrixOf(ctx.values, item.transform)
  const width = 4.5 * ctx.plane.scale
  const origin = ctx.plane.toScreen([0, 0])
  const shapes: Shape[] = []
  const vectors: [string, Vec2, string, string][] = [
    ['i', [1, 0], ctx.theme.colors.green, '\\hat{i}'],
    ['j', [0, 1], ctx.theme.colors.red, '\\hat{j}'],
  ]
  for (const [name, unit, color, tex] of vectors) {
    const tip = apply(m, unit)
    shapes.push(...arrow(`${item.id}.${name}`, [0, 0], tip, color, width, ctx))
    if (item.labels !== false && ctx.draw >= 1) {
      const screenTip = ctx.plane.toScreen(tip)
      shapes.push(...tipLabel(tex, screenTip, sub(screenTip, origin), color, `${item.id}.${name}`, ctx))
    }
  }
  return shapes
}

export function layoutPoint(item: PointItem, ctx: ItemContext): Shape[] {
  // On a curve, the point is (x, f(x)), worked out with the derived values.
  const where: Vec2 = item.on !== undefined ? [ctx.scope[`${item.id}.x`], ctx.scope[`${item.id}.y`]] : vecOf(ctx.values, item.at!)
  if (!Number.isFinite(where[0]) || !Number.isFinite(where[1])) return []
  const at = apply(matrixOf(ctx.values, item.transform), where)
  const [x, y] = ctx.plane.toScreen(at)
  const color = colorOf(ctx.theme, item.color, ctx.theme.colors.yellow)
  const r = (item.radius ?? 6) * ctx.plane.scale * Math.min(1, ctx.draw * 2)
  const dot: Shape = item.hollow
    ? { type: 'circle', id: item.id, x, y, r, fill: ctx.theme.background, stroke: color, width: 2.5 * ctx.plane.scale, opacity: ctx.opacity }
    : { type: 'circle', id: item.id, x, y, r, fill: color, opacity: ctx.opacity }
  const shapes: Shape[] = r > 0 ? [dot] : []
  if (item.label && ctx.draw >= 1) shapes.push(...tipLabel(item.label, [x, y], [0.7, -0.7], color, item.id, ctx))
  return shapes
}
