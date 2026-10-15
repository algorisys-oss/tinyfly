import type { AnimatableValue } from '../../engine/types'
import type { LessonBuilder, StepOptions } from '../../teach/lesson'
import type { MathFigureSpec } from '../figure/figure-spec'

/**
 * Lesson steps for a maths figure, written on a `lesson()` builder from
 * `@algorisys/tinyfly/teach`. Every helper writes ordinary tracks on the
 * figure's target, so the result is plain timeline JSON with markers and
 * captions, playable in the embed player, a video or the editor.
 *
 *     const l = lesson({ id: 'shear' })
 *     const m = mathSteps(l, 'fig', figure, { hidden: ['basis'] })
 *     m.drawOn('basis')
 *     l.marker('basis', { label: 'î and ĵ', pause: true })
 *     m.applyMatrix([1, 1, 0, 1])
 *     l.marker('sheared', { label: 'A shear keeps î and moves ĵ', pause: true })
 */
export interface MathSteps {
  /** Animate a value (a number, vector or matrix) to `value` */
  toValue(name: string, value: AnimatableValue, options?: StepOptions): MathSteps
  /** Move the matrix value (default `M`) to `matrix`: the plane transforms */
  applyMatrix(matrix: number[], options?: StepOptions & { name?: string }): MathSteps
  /** Draw an item on, like a pen (default 900 ms) */
  drawOn(itemId: string, options?: StepOptions): MathSteps
  /** Fade an item in or out */
  fadeIn(itemId: string, options?: StepOptions): MathSteps
  fadeOut(itemId: string, options?: StepOptions): MathSteps
  /** Move an equation to step `step`, its terms gliding (default 900 ms) */
  showStep(itemId: string, step: number, options?: StepOptions): MathSteps
}

export function mathSteps(
  l: LessonBuilder,
  target: string,
  figure: MathFigureSpec,
  options: { hidden?: string[] } = {},
): MathSteps {
  const ids = new Set(figure.items.map((item) => item.id))
  const known = (itemId: string) => {
    if (!ids.has(itemId)) throw new Error(`mathSteps: no item "${itemId}" (items: ${[...ids].join(', ')})`)
  }
  // Starting values: every figure value, each equation at its first step, hidden items undrawn.
  const initial: Record<string, AnimatableValue> = { ...(figure.values ?? {}) }
  for (const item of figure.items) {
    initial[`${item.id}.draw`] = item.draw ?? 1
    initial[`${item.id}.opacity`] = item.opacity ?? 1
    if (item.kind === 'equation') initial[`${item.id}.step`] = item.step ?? 0
  }
  for (const itemId of options.hidden ?? []) {
    known(itemId)
    initial[`${itemId}.draw`] = 0
  }
  l.initial(target, initial)

  const steps: MathSteps = {
    toValue(name, value, stepOptions) {
      if (!(name in initial)) throw new Error(`mathSteps: no value "${name}" (values: ${Object.keys(figure.values ?? {}).join(', ')})`)
      l.to(target, { [name]: value }, { duration: 1200, ...stepOptions })
      return steps
    },
    applyMatrix(matrix, stepOptions = {}) {
      const { name = 'M', ...rest } = stepOptions
      if (matrix.length !== 4 || !matrix.every(Number.isFinite)) throw new Error('mathSteps.applyMatrix: expected [a, b, c, d]')
      return steps.toValue(name, matrix, { duration: 1600, ...rest })
    },
    drawOn(itemId, stepOptions) {
      known(itemId)
      l.to(target, { [`${itemId}.draw`]: 1 }, { duration: 900, ...stepOptions })
      return steps
    },
    fadeIn(itemId, stepOptions) {
      known(itemId)
      l.set(target, { [`${itemId}.draw`]: 1, [`${itemId}.opacity`]: 0 })
      l.to(target, { [`${itemId}.opacity`]: 1 }, { duration: 500, ...stepOptions })
      return steps
    },
    fadeOut(itemId, stepOptions) {
      known(itemId)
      l.to(target, { [`${itemId}.opacity`]: 0 }, { duration: 500, ...stepOptions })
      return steps
    },
    showStep(itemId, step, stepOptions) {
      known(itemId)
      l.to(target, { [`${itemId}.step`]: step }, { duration: 900, ...stepOptions })
      return steps
    },
  }
  return steps
}
