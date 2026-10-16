import { MATH_THEMES, type MathFigureSpec, type MathItem } from './figure-spec'
import type { DisplayList, Shape } from './display-list'
import { scopeOf, type ItemContext, type Values } from './item-context'
import { planeOf } from './plane'
import { layoutAxes, layoutGrid } from './items/grid'
import { layoutBasis, layoutPoint, layoutVector } from './items/vectors'
import { layoutFunction, layoutParametric } from './items/curves'
import { layoutLine, layoutPolygon } from './items/regions'
import { layoutEquation, layoutLabel } from './items/text'
import { layoutArea, layoutRiemann, layoutTangent, layoutTaylor } from './items/calculus'
import { derivedValues } from './derived'
import { layoutBayes, layoutDistribution, layoutGalton, layoutHistogram, layoutScatter } from './items/probability'
import { layoutClock, layoutGraph, layoutVenn } from './items/discrete'

/**
 * Animated values for a figure, as a timeline writes them on its target:
 * a value by name (`M`, `k`, `v`) or an item prop (`grid.draw`, `eq.step`).
 */
export type MathProps = Record<string, number | number[] | string>

function layoutItem(item: MathItem, ctx: ItemContext): Shape[] {
  switch (item.kind) {
    case 'grid': return layoutGrid(item, ctx)
    case 'axes': return layoutAxes(item, ctx)
    case 'vector': return layoutVector(item, ctx)
    case 'basis': return layoutBasis(item, ctx)
    case 'point': return layoutPoint(item, ctx)
    case 'function': return layoutFunction(item, ctx)
    case 'parametric': return layoutParametric(item, ctx)
    case 'polygon': return layoutPolygon(item, ctx)
    case 'line': return layoutLine(item, ctx)
    case 'label': return layoutLabel(item, ctx)
    case 'equation': return layoutEquation(item, ctx)
    case 'tangent': return layoutTangent(item, ctx)
    case 'riemann': return layoutRiemann(item, ctx)
    case 'area': return layoutArea(item, ctx)
    case 'taylor': return layoutTaylor(item, ctx)
    case 'histogram': return layoutHistogram(item, ctx)
    case 'distribution': return layoutDistribution(item, ctx)
    case 'galton': return layoutGalton(item, ctx)
    case 'scatter': return layoutScatter(item, ctx)
    case 'bayes': return layoutBayes(item, ctx)
    case 'graph': return layoutGraph(item, ctx)
    case 'venn': return layoutVenn(item, ctx)
    case 'clock': return layoutClock(item, ctx)
  }
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/**
 * The figure at one moment: its spec with these props applied, as shapes.
 * Pure and deterministic. Items draw in the order they are listed, so later
 * items sit on top. Validate the spec once with `validateMathFigure` first.
 */
export function layoutFigure(spec: MathFigureSpec, props: MathProps = {}): DisplayList {
  const theme = MATH_THEMES[spec.theme ?? 'dark']
  const plane = planeOf(spec)
  const values: Values = { ...spec.values }
  const itemProps = new Map<string, number>()
  for (const [key, value] of Object.entries(props)) {
    const dot = key.indexOf('.')
    if (dot < 0) {
      if (typeof value !== 'string') values[key] = value
    } else if (typeof value === 'number') {
      itemProps.set(key, value)
    }
  }
  const base = scopeOf(values)
  const scope = { ...base, ...derivedValues(spec.items, values, base) }
  const shapes: Shape[] = []
  for (const item of spec.items) {
    const prop = (name: string) => itemProps.get(`${item.id}.${name}`)
    const draw = clamp01(prop('draw') ?? item.draw ?? 1)
    const opacity = clamp01(prop('opacity') ?? item.opacity ?? 1)
    if (draw <= 0 || opacity <= 0) continue
    shapes.push(...layoutItem(item, { plane, theme, values, scope, draw, opacity, prop }))
  }
  const background = spec.background === 'none' ? undefined : spec.background ?? theme.background
  return { width: spec.width, height: spec.height, ...(background ? { background } : {}), shapes }
}
