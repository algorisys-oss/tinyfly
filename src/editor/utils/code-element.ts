import type { CustomTarget } from '../../adapters/canvas'
import type { AnimationState } from '../../engine/types'
import { codePanel, type CodePanel } from '../../characters'
import type { CodeElement } from '../stores/scene-store'

/**
 * Code elements: the editor's bridge to `codePanel()`. The element is plain
 * data (the code, its language, font size, line numbers); these turn it into
 * a panel, a canvas target, a painted canvas, or a surface a Character's
 * beats aim at.
 */

/** The panel an element describes, laid out at `at` (default the origin: a target or a painted canvas draws local). */
export function codePanelOf(element: CodeElement, at: { x: number; y: number } = { x: 0, y: 0 }): CodePanel {
  return codePanel({
    code: element.code,
    language: element.language,
    x: at.x,
    y: at.y,
    width: element.width,
    fontSize: element.fontSize,
    lineNumbers: element.lineNumbers,
    ...(element.hidden?.length ? { hidden: element.hidden } : {}),
  })
}

/** How tall the panel is for its lines, px: the element's box follows it. */
export function codeElementHeight(element: CodeElement): number {
  return Math.max(1, Math.round(codePanelOf(element).target.height))
}

/** Is `property` one of a code panel's animatable values (`line.3.highlight`, `piece.1.x`, `insert.2.open`)? */
export const isCodeField = (property: string) => /^(line|piece|insert)\.\d+\./.test(property)

/** The panel's values at a moment: as laid out, then any animated values in `state` (tracks address an element by name, or by id). */
export function codeElementProps(element: CodeElement, state?: AnimationState | null): Record<string, number> {
  const props = { ...(codePanelOf(element).target.props as Record<string, number>) }
  for (const key of [element.id, element.name]) {
    const values = state?.values.get(key)
    if (!values) continue
    for (const [property, value] of values) if (typeof value === 'number' && property in props) props[property] = value
  }
  return props
}

/** A canvas target for the Canvas preview and the exporters; its props are the panel's animatable values. */
export function codeElementTarget(element: CodeElement): CustomTarget {
  const panel = codePanelOf(element)
  return {
    ...panel.target,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    opacity: element.opacity,
    rotate: element.rotation || undefined,
  }
}

/** The panel as a surface in the scene (its places in scene px), for a Character's beats. */
export function codeElementSurface(element: CodeElement): CodePanel {
  return codePanelOf(element, { x: element.x, y: element.y })
}

/** Paint a code element into a canvas the size of its box. */
export function paintCodeCanvas(canvas: HTMLCanvasElement, element: CodeElement, props: Record<string, number>, time: number, pixelRatio = 1): void {
  const width = Math.max(1, Math.round(element.width * pixelRatio))
  const height = Math.max(1, Math.round(element.height * pixelRatio))
  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  ctx.clearRect(0, 0, element.width, element.height)
  const target = codePanelOf(element).target
  target.draw(ctx, { ...target, props }, time)
}
