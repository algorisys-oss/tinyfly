import type { CustomTarget } from '../../adapters/canvas'
import type { AnimationState } from '../../engine/types'
import { chart, type Chart } from '../../characters'
import type { ChartElement } from '../stores/scene-store'

/**
 * Chart elements: the editor's bridge to `chart()`. The element is plain data
 * (its kind, data, series, title, theme, axis titles); these turn it into a
 * chart, a canvas target, a painted canvas, or a surface a Character's beats
 * aim at and whose bars carry a figure.
 */

/** The chart an element describes, laid out at `at` (default the origin: a target or a painted canvas draws local). Throws on bad data, as `chart()` does. */
export function chartOf(element: ChartElement, at: { x: number; y: number } = { x: 0, y: 0 }): Chart {
  return chart({
    x: at.x,
    y: at.y,
    width: element.width,
    height: element.height,
    kind: element.chartKind,
    data: element.data,
    ...(element.series?.length ? { series: element.series } : {}),
    ...(element.title ? { title: element.title } : {}),
    theme: element.theme,
    ...(element.max !== undefined ? { max: element.max } : {}),
    ...(element.axis ? { axis: element.axis } : {}),
    ...(element.decimals !== undefined ? { decimals: element.decimals } : {}),
    ...(element.prefix ? { prefix: element.prefix } : {}),
    ...(element.suffix ? { suffix: element.suffix } : {}),
    ...(element.values === false ? { values: false } : {}),
  })
}

/** What is wrong with an element's chart data, or null when it makes a chart. */
export function chartElementProblem(element: ChartElement): string | null {
  try {
    chartOf(element)
    return null
  } catch (error) {
    return (error as Error).message
  }
}

/** Is `property` one of a chart's animatable values (`bar.q1.value`, `slice.a.pull`, `piece.1.x`)? */
export const isChartField = (property: string) => /^(bar|point|slice|piece)\./.test(property)

/** The chart's values at a moment: as made, then any animated values in `state` (tracks address an element by name, or by id). */
export function chartElementProps(element: ChartElement, state?: AnimationState | null): Record<string, number> {
  const props = { ...(chartOf(element).target.props as Record<string, number>) }
  for (const key of [element.id, element.name]) {
    const values = state?.values.get(key)
    if (!values) continue
    for (const [property, value] of values) if (typeof value === 'number' && property in props) props[property] = value
  }
  return props
}

/** A canvas target for the Canvas preview and the exporters; its props are the chart's animatable values. */
export function chartElementTarget(element: ChartElement): CustomTarget {
  const made = chartOf(element)
  return {
    ...made.target,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    opacity: element.opacity,
    rotate: element.rotation || undefined,
  }
}

/** The chart as a surface in the scene (its places in scene px), for a Character's beats. */
export function chartElementSurface(element: ChartElement): Chart {
  return chartOf(element, { x: element.x, y: element.y })
}

/** Paint a chart element into a canvas the size of its box. */
export function paintChartCanvas(canvas: HTMLCanvasElement, element: ChartElement, props: Record<string, number>, time: number, pixelRatio = 1): void {
  const width = Math.max(1, Math.round(element.width * pixelRatio))
  const height = Math.max(1, Math.round(element.height * pixelRatio))
  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  ctx.clearRect(0, 0, element.width, element.height)
  let target: CustomTarget
  try {
    target = chartOf(element).target
  } catch {
    // Bad data: an empty box; the property panel says what is wrong.
    return
  }
  target.draw(ctx, { ...target, props }, time)
}
