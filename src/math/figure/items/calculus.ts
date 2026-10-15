import { compile, compileDerivative } from '../../expr/evaluate'
import type { Vec2 } from '../../linear/vec2'
import { layoutTex } from '../../tex/tex-layout'
import type { AreaItem, RiemannItem, TangentItem, TaylorItem } from '../figure-spec'
import { texToShapes, trimPolylines, type Shape } from '../display-list'
import { pieceCount, riemannPieces } from '../derived'
import { colorOf, numOf, type ItemContext } from '../item-context'
import { curveRuns } from './curves'

export function layoutTangent(item: TangentItem, ctx: ItemContext): Shape[] {
  const f = compile(item.expr)
  const x0 = numOf(ctx.values, item.at)
  const h = item.h === undefined ? 0 : numOf(ctx.values, item.h)
  const y0 = f(x0, ctx.scope)
  const slope = ctx.scope[`${item.id}.slope`]
  if (!Number.isFinite(y0) || !Number.isFinite(slope)) return []
  const half = item.length !== undefined ? item.length / 2 : Math.max(Math.abs(ctx.plane.x[0] - x0), Math.abs(ctx.plane.x[1] - x0))
  const line: Vec2[] = [[x0 - half, y0 - slope * half], [x0 + half, y0 + slope * half]]
  const color = colorOf(ctx.theme, item.color, ctx.theme.colors.yellow)
  // Drawn on from the point outwards, both ways at once.
  const middle = ctx.plane.toScreen([x0, y0])
  const ends = line.map(ctx.plane.toScreen)
  const shapes: Shape[] = [ends[0], ends[1]].flatMap((end, k) =>
    trimPolylines([[middle, end]], ctx.draw).map((points): Shape => ({ type: 'line', id: `${item.id}.${k}`, points, stroke: color, width: (item.width ?? 3) * ctx.plane.scale, opacity: ctx.opacity })),
  )
  if (item.points !== false) {
    const r = 6 * ctx.plane.scale
    shapes.push({ type: 'circle', id: `${item.id}.point`, x: middle[0], y: middle[1], r, fill: color, opacity: ctx.opacity })
    if (Math.abs(h) > 1e-9) {
      const [sx, sy] = ctx.plane.toScreen([x0 + h, f(x0 + h, ctx.scope)])
      if (Number.isFinite(sy)) shapes.push({ type: 'circle', id: `${item.id}.secant`, x: sx, y: sy, r, fill: color, opacity: ctx.opacity })
    }
  }
  if (item.label && ctx.draw >= 1) {
    // Above the point, on the side the line rises away from.
    const size = 24 * ctx.plane.scale
    const layout = layoutTex(item.label, { values: ctx.scope, style: 'inline' })
    shapes.push(...texToShapes(layout, { x: middle[0], y: middle[1] - size * 1.6, size, color, opacity: ctx.opacity, idPrefix: `${item.id}.label.` }))
  }
  return shapes
}

export function layoutRiemann(item: RiemannItem, ctx: ItemContext): Shape[] {
  const f = compile(item.expr)
  const a = numOf(ctx.values, item.from)
  const b = numOf(ctx.values, item.to)
  const n = pieceCount(numOf(ctx.values, item.n))
  const pieces = riemannPieces((x) => f(x, ctx.scope), a, b, n, item.rule ?? 'left')
  const color = colorOf(ctx.theme, item.color, ctx.theme.colors.blue)
  // Draw on piece by piece, left to right.
  const shown = Math.ceil(pieces.length * ctx.draw)
  // Thin outlines when there are many pieces, so the fill still reads.
  const outline = Math.max(0.5, Math.min(1.5, 60 / n)) * ctx.plane.scale
  return pieces.slice(0, shown).flatMap(([left, right, h1, h2], i): Shape[] => {
    if (!Number.isFinite(h1) || !Number.isFinite(h2)) return []
    const points = ([[left, 0], [right, 0], [right, h2], [left, h1]] as Vec2[]).map(ctx.plane.toScreen)
    const sign = (h1 + h2) / 2 < 0
    const fill = sign ? colorOf(ctx.theme, 'red', ctx.theme.colors.red) : color
    return [{ type: 'line', id: `${item.id}.${i}`, points, closed: true, fill, stroke: fill, width: outline, opacity: ctx.opacity * (item.fillOpacity ?? 0.35) }]
  })
}

export function layoutArea(item: AreaItem, ctx: ItemContext): Shape[] {
  const f = compile(item.expr)
  const g = item.lower ? compile(item.lower) : () => 0
  const a = numOf(ctx.values, item.from)
  const b = a + (numOf(ctx.values, item.to) - a) * ctx.draw
  if (a === b) return []
  const samples = 240
  const above = colorOf(ctx.theme, item.color, ctx.theme.colors.blue)
  const below = colorOf(ctx.theme, item.negativeColor, ctx.theme.colors.red)
  const opacity = ctx.opacity * (item.fillOpacity ?? 0.4)
  // Split the band where f − g changes sign, so each part takes its own colour.
  const shapes: Shape[] = []
  let top: Vec2[] = []
  let bottom: Vec2[] = []
  let positive: boolean | undefined
  const flush = () => {
    if (top.length >= 2) {
      shapes.push({ type: 'line', id: `${item.id}.${shapes.length}`, points: [...top, ...bottom.reverse()].map(ctx.plane.toScreen), closed: true, fill: positive ? above : below, opacity })
    }
    top = []
    bottom = []
  }
  let previous: { x: number; fy: number; gy: number } | undefined
  for (let i = 0; i <= samples; i++) {
    const x = a + ((b - a) * i) / samples
    const fy = f(x, ctx.scope)
    const gy = g(x, ctx.scope)
    if (!Number.isFinite(fy) || !Number.isFinite(gy)) {
      flush()
      previous = undefined
      continue
    }
    const sign = fy - gy >= 0
    if (previous && positive !== undefined && sign !== positive) {
      // Close this part at the crossing and start the next there.
      const d0 = previous.fy - previous.gy
      const d1 = fy - gy
      const t = d0 / (d0 - d1)
      const cx = previous.x + (x - previous.x) * t
      const cy = previous.gy + (gy - previous.gy) * t
      top.push([cx, cy])
      bottom.push([cx, cy])
      flush()
      top.push([cx, cy])
      bottom.push([cx, cy])
    }
    positive = sign
    top.push([x, fy])
    bottom.push([x, gy])
    previous = { x, fy, gy }
  }
  flush()
  return shapes
}

const FACTORIALS = Array.from({ length: 22 }, (_, k) => k).map((k) => (k === 0 ? 1 : Array.from({ length: k }, (_, i) => i + 1).reduce((p, v) => p * v, 1)))

export function layoutTaylor(item: TaylorItem, ctx: ItemContext): Shape[] {
  const a = numOf(ctx.values, item.at)
  const order = ctx.scope[`${item.id}.order`]
  const whole = Math.floor(order)
  const blend = order - whole
  // Coefficients f⁽ᵏ⁾(a) / k!, exact from symbolic derivatives.
  const coefficients = Array.from({ length: Math.min(20, whole + 1) + 1 }, (_, k) => compileDerivative(item.expr, k)(a, ctx.scope) / FACTORIALS[k])
  const polynomial = (x: number) => {
    let sum = 0
    let power = 1
    for (let k = 0; k <= whole; k++) {
      sum += coefficients[k] * power
      power *= x - a
    }
    // The next term grows in as the order passes between whole numbers.
    return blend > 0 && whole < 20 ? sum + blend * coefficients[whole + 1] * power : sum
  }
  const color = colorOf(ctx.theme, item.color, ctx.theme.colors.yellow)
  const [x0, x1] = item.domain ?? ctx.plane.x
  return curveRuns(item.id, (x) => polynomial(x), x0, x1, color, (item.width ?? 3.5) * ctx.plane.scale, ctx)
}
