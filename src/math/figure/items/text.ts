import { layoutTex, type TexLayout } from '../../tex/tex-layout'
import { morphEquation } from '../../tex/equation-morph'
import type { EquationItem, LabelItem, VecRef } from '../figure-spec'
import { texOrigin, texPiecesToShapes, texToShapes, type Shape, type TexPlacement } from '../display-list'
import { colorOf, vecOf, type ItemContext } from '../item-context'

/** A soft panel behind typeset text (the larger of several layouts), so it reads over a grid. */
function backdrop(id: string, layouts: TexLayout[], place: TexPlacement, ctx: ItemContext): Shape[] {
  const pad = place.size * 0.35
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity
  for (const layout of layouts) {
    const [ox, oy] = texOrigin(layout, place)
    left = Math.min(left, ox - pad)
    right = Math.max(right, ox + layout.width * place.size + pad)
    top = Math.min(top, oy - layout.height * place.size - pad)
    bottom = Math.max(bottom, oy + layout.depth * place.size + pad)
  }
  return [{
    type: 'line', id: `${id}.backdrop`, points: [[left, top], [right, top], [right, bottom], [left, bottom]], closed: true,
    fill: ctx.theme.background, opacity: (place.opacity ?? 1) * 0.85,
  }]
}

function anchor(at: VecRef, screen: boolean | undefined, ctx: ItemContext) {
  const point = vecOf(ctx.values, at)
  return screen ? point : ctx.plane.toScreen(point)
}

export function layoutLabel(item: LabelItem, ctx: ItemContext): Shape[] {
  const [x, y] = anchor(item.at, item.screen, ctx)
  const size = (item.size ?? 28) * ctx.plane.scale
  const color = colorOf(ctx.theme, item.color, ctx.theme.ink)
  // A label fades in rather than drawing on.
  const place = { x, y, size, color, align: item.align, opacity: ctx.opacity * ctx.draw, idPrefix: `${item.id}.`, palette: ctx.theme.colors }
  const layout = layoutTex(item.tex, { values: ctx.scope })
  const panel = item.backdrop ?? item.screen ?? false
  return [...(panel ? backdrop(item.id, [layout], place, ctx) : []), ...texToShapes(layout, place)]
}

export function layoutEquation(item: EquationItem, ctx: ItemContext): Shape[] {
  const [x, y] = anchor(item.at, item.screen, ctx)
  const size = (item.size ?? 36) * ctx.plane.scale
  const color = colorOf(ctx.theme, item.color, ctx.theme.ink)
  const last = item.steps.length - 1
  const step = Math.min(last, Math.max(0, ctx.prop('step') ?? item.step ?? 0))
  const from = Math.floor(step)
  const progress = step - from
  const place = { x, y, size, color, align: item.align, opacity: ctx.opacity * ctx.draw, idPrefix: `${item.id}.`, palette: ctx.theme.colors }
  const layoutOf = (k: number): TexLayout => layoutTex(item.steps[k], { values: ctx.scope })
  const panel = item.backdrop ?? item.screen ?? false
  if (progress === 0 || from >= last) {
    const layout = layoutOf(from)
    return [...(panel ? backdrop(item.id, [layout], place, ctx) : []), ...texToShapes(layout, place)]
  }
  // Both steps placed at the same anchor, in ems, so the morph works in one coordinate system.
  const placed = (layout: TexLayout) => {
    const [ox, oy] = texOrigin(layout, place)
    return { layout, x: ox / size, y: oy / size }
  }
  const before = layoutOf(from)
  const after = layoutOf(from + 1)
  return [
    ...(panel ? backdrop(item.id, [before, after], place, ctx) : []),
    ...texPiecesToShapes(morphEquation(placed(before), placed(after), progress), [0, 0], place),
  ]
}
