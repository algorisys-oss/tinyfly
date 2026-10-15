import { isMat2 } from '../linear/mat2'
import { isVec2, type Vec2 } from '../linear/vec2'
import type { MathFigureSpec } from '../figure/figure-spec'
import { layoutFigure, type MathProps } from '../figure/layout-figure'
import { planeOf } from '../figure/plane'
import { validateMathFigure } from '../figure/validate-spec'
import { displayListToSvgContent } from '../render/display-list-to-svg'

/**
 * A figure the reader changes by hand: sliders bound to number values, and
 * handles to drag on vector values or on a matrix's columns (drag î and ĵ to
 * build the matrix). Every change re-lays the figure out from its values, so
 * what the reader sees is exactly what the same values give in a video.
 *
 *     mathExplorable(element, linearMapFigure(), {
 *       drag: [{ matrix: 'M', column: 0 }, { matrix: 'M', column: 1 }],
 *       sliders: [{ value: 'k', min: 0, max: 4, step: 0.1, label: 'k' }],
 *     })
 */
export interface SliderControl {
  /** A number value of the figure */
  value: string
  min: number
  max: number
  step?: number
  /** What the reader sees beside the slider (default the value's name) */
  label?: string
}

/** A vector value's tip, or one column of a matrix value (0: where î lands, 1: ĵ). */
export type DragHandle = { vector: string } | { matrix: string; column: 0 | 1 }

export interface ExplorableOptions {
  sliders?: SliderControl[]
  drag?: DragHandle[]
  /** Round dragged coordinates to this step in world units (default 0.1; 0 for none) */
  snap?: number
  /** Called with the values after every change */
  onChange?: (values: MathProps) => void
}

export interface MathExplorable {
  /** Current values */
  readonly values: MathProps
  /** Change a value, as the reader would */
  set(name: string, value: number | number[]): void
  /** Remove the controls and listeners (the drawing stays) */
  destroy(): void
}

const SVG_NS = 'http://www.w3.org/2000/svg'

export function mathExplorable(element: HTMLElement, figure: MathFigureSpec, options: ExplorableOptions = {}): MathExplorable {
  validateMathFigure(figure)
  const values: MathProps = { ...(figure.values ?? {}) }
  for (const slider of options.sliders ?? []) {
    if (typeof values[slider.value] !== 'number') throw new Error(`mathExplorable: slider value "${slider.value}" is not a number value of the figure`)
  }
  for (const handle of options.drag ?? []) {
    if ('vector' in handle && !isVec2(values[handle.vector])) throw new Error(`mathExplorable: "${handle.vector}" is not a vector value of the figure`)
    if ('matrix' in handle && !isMat2(values[handle.matrix])) throw new Error(`mathExplorable: "${handle.matrix}" is not a matrix value of the figure`)
  }
  const plane = planeOf(figure)
  const doc = element.ownerDocument
  const svg = doc.createElementNS(SVG_NS, 'svg') as SVGSVGElement
  svg.setAttribute('viewBox', `0 0 ${figure.width} ${figure.height}`)
  svg.setAttribute('style', 'display:block;width:100%;height:auto;touch-action:none')
  svg.setAttribute('role', 'img')
  element.appendChild(svg)

  const handles = options.drag ?? []
  const handlePoint = (handle: DragHandle): Vec2 => {
    if ('vector' in handle) return values[handle.vector] as Vec2
    const [a, b, c, d] = values[handle.matrix] as number[]
    return handle.column === 0 ? [a, c] : [b, d]
  }
  const draw = () => {
    const rings = handles.map((handle) => {
      const [x, y] = plane.toScreen(handlePoint(handle))
      // A ring the reader can see and grab, over the tip.
      return `<circle cx="${x}" cy="${y}" r="${14 * plane.scale}" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.55)" stroke-width="${1.5 * plane.scale}" style="cursor:grab"/>`
    })
    svg.innerHTML = displayListToSvgContent(layoutFigure(figure, values)) + rings.join('')
    options.onChange?.({ ...values })
  }

  const set = (name: string, value: number | number[]) => {
    if (!(name in values)) throw new Error(`mathExplorable: no value "${name}"`)
    values[name] = value
    const input = sliderInputs.get(name)
    if (input && typeof value === 'number') {
      input.value = String(value)
      readouts.get(name)!.textContent = String(value)
    }
    draw()
  }

  // Sliders, in a row under the figure.
  const sliderInputs = new Map<string, HTMLInputElement>()
  const readouts = new Map<string, HTMLElement>()
  let panel: HTMLElement | undefined
  if (options.sliders?.length) {
    panel = doc.createElement('div')
    panel.setAttribute('style', 'display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;padding:8px 0;font:14px system-ui,sans-serif')
    for (const slider of options.sliders) {
      const label = doc.createElement('label')
      label.setAttribute('style', 'display:flex;align-items:center;gap:6px')
      const input = doc.createElement('input')
      input.type = 'range'
      input.min = String(slider.min)
      input.max = String(slider.max)
      input.step = String(slider.step ?? (slider.max - slider.min) / 100)
      input.value = String(values[slider.value])
      input.setAttribute('aria-label', slider.label ?? slider.value)
      const readout = doc.createElement('output')
      readout.textContent = String(values[slider.value])
      input.addEventListener('input', () => set(slider.value, Number(input.value)))
      label.append(slider.label ?? slider.value, input, readout)
      panel.appendChild(label)
      sliderInputs.set(slider.value, input)
      readouts.set(slider.value, readout)
    }
    element.appendChild(panel)
  }

  // Dragging: the nearest handle within reach of the pointer follows it.
  const snap = options.snap ?? 0.1
  const toWorld = (event: PointerEvent): Vec2 => {
    const box = svg.getBoundingClientRect()
    const sx = ((event.clientX - box.left) / (box.width || figure.width)) * figure.width
    const sy = ((event.clientY - box.top) / (box.height || figure.height)) * figure.height
    const [x, y] = plane.toWorld([sx, sy])
    const round = (v: number) => (snap > 0 ? Math.round(v / snap) * snap : v)
    return [Number(round(x).toFixed(6)), Number(round(y).toFixed(6))]
  }
  let dragging: DragHandle | undefined
  const onDown = (event: PointerEvent) => {
    const box = svg.getBoundingClientRect()
    const scale = figure.width / (box.width || figure.width)
    const pointer: Vec2 = [(event.clientX - box.left) * scale, (event.clientY - box.top) * scale]
    let best: { handle: DragHandle; distance: number } | undefined
    for (const handle of handles) {
      const [x, y] = plane.toScreen(handlePoint(handle))
      const distance = Math.hypot(x - pointer[0], y - pointer[1])
      if (distance < 30 * plane.scale * Math.max(1, scale) && (!best || distance < best.distance)) best = { handle, distance }
    }
    if (!best) return
    dragging = best.handle
    svg.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  }
  const onMove = (event: PointerEvent) => {
    if (!dragging) return
    const [x, y] = toWorld(event)
    if ('vector' in dragging) {
      set(dragging.vector, [x, y])
    } else {
      const [a, b, c, d] = values[dragging.matrix] as number[]
      set(dragging.matrix, dragging.column === 0 ? [x, b, y, d] : [a, x, c, y])
    }
  }
  const onUp = () => {
    dragging = undefined
  }
  svg.addEventListener('pointerdown', onDown)
  svg.addEventListener('pointermove', onMove)
  svg.addEventListener('pointerup', onUp)
  svg.addEventListener('pointercancel', onUp)

  draw()
  return {
    get values() {
      return { ...values }
    },
    set,
    destroy() {
      svg.removeEventListener('pointerdown', onDown)
      svg.removeEventListener('pointermove', onMove)
      svg.removeEventListener('pointerup', onUp)
      svg.removeEventListener('pointercancel', onUp)
      panel?.remove()
    },
  }
}
