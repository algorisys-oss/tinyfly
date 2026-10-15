import type { AnimatableValue } from '../../engine/types'
import type { MathFigureSpec } from '../figure/figure-spec'
import { layoutFigure, type MathProps } from '../figure/layout-figure'
import { validateMathFigure } from '../figure/validate-spec'
import { drawDisplayList } from '../render/draw-display-list'

/**
 * A maths figure as a canvas target: register it with a CanvasAdapter (or a
 * headless video scene's `targets`) and a timeline animates its values and
 * item props as plain tracks:
 *
 *     { target: 'fig', property: 'M', keyframes: [{ time: 0, value: [1,0,0,1] }, { time: 1500, value: [2,1,0,1] }] }
 *     { target: 'fig', property: 'grid.draw', keyframes: … }
 *
 * It has the shape of the canvas adapter's custom target (`type: 'custom'`)
 * without importing it, so the maths module stays independent of adapters.
 */
export interface MathCanvasTarget {
  type: 'custom'
  x: number
  y: number
  width: number
  height: number
  props: Record<string, AnimatableValue>
  acceptsProp(property: string): boolean
  draw(ctx: CanvasRenderingContext2D, target: { props?: Record<string, AnimatableValue> }): void
  about: {
    kind: string
    summary: string
    props: Record<string, { description: string; kind?: 'number' | 'list'; unit?: string; min?: number; max?: number }>
  }
}

/** Every prop a figure accepts: its values by name, and each item's draw, opacity (and an equation's step). */
export function mathFigureProps(spec: MathFigureSpec): MathCanvasTarget['about']['props'] {
  const props: MathCanvasTarget['about']['props'] = {}
  for (const [name, value] of Object.entries(spec.values ?? {})) {
    const shape = typeof value === 'number' ? 'number' : value.length === 2 ? '[x, y] vector' : '[a, b, c, d] matrix'
    props[name] = { description: `The value ${name} (a ${shape})`, kind: typeof value === 'number' ? 'number' : 'list' }
  }
  for (const item of spec.items) {
    props[`${item.id}.draw`] = { description: `How much of the ${item.kind} "${item.id}" is drawn`, unit: '0..1', min: 0, max: 1 }
    props[`${item.id}.opacity`] = { description: `Opacity of the ${item.kind} "${item.id}"`, unit: '0..1', min: 0, max: 1 }
    if (item.kind === 'equation') {
      props[`${item.id}.step`] = { description: `Which step of "${item.id}" shows; in between, terms glide`, unit: 'step', min: 0, max: item.steps.length - 1 }
    }
  }
  return props
}

/** A canvas target that draws `spec`, placed at x, y (its top left corner). */
export function mathTarget(spec: MathFigureSpec, place: { x?: number; y?: number } = {}): MathCanvasTarget {
  validateMathFigure(spec)
  const described = mathFigureProps(spec)
  const props: Record<string, AnimatableValue> = { ...(spec.values ?? {}) }
  return {
    type: 'custom',
    x: place.x ?? 0,
    y: place.y ?? 0,
    width: spec.width,
    height: spec.height,
    props,
    acceptsProp: (property) => Object.prototype.hasOwnProperty.call(described, property),
    draw(ctx, target) {
      drawDisplayList(ctx, layoutFigure(spec, (target.props ?? {}) as MathProps))
    },
    about: {
      kind: 'math figure',
      summary: `A ${spec.width}×${spec.height} maths figure with ${spec.items.map((item) => `${item.kind} "${item.id}"`).join(', ')}. Animate its values by name and each item's draw / opacity (an equation's step).`,
      props: described,
    },
  }
}
