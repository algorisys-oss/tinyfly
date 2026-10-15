/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mountMath, mountAllMath } from './mount-math'
import { mathExplorable } from './explorable'
import { mathSteps } from '../steps/math-steps'
import { lesson } from '../../teach/lesson'
import { linearMapFigure } from '../presets/linear-algebra'

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', () => 1)
  vi.stubGlobal('cancelAnimationFrame', () => {})
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  document.body.innerHTML = ''
})
afterEach(() => vi.unstubAllGlobals())

function shearLesson() {
  const figure = linearMapFigure({ width: 400, height: 400 })
  const l = lesson({ id: 'shear' })
  const m = mathSteps(l, 'fig', figure)
  l.marker('start', { label: 'The identity' })
  m.applyMatrix([1, 1, 0, 1])
  l.marker('sheared', { label: 'A shear', pause: true })
  return { figure, timeline: l.definition() }
}

/** The text the figure's matrix label shows, in order. */
const matrixText = (element: Element) =>
  Array.from(element.querySelectorAll('svg[data-tinyfly-math-svg] text')).map((t) => t.textContent).join('')

describe('mountMath', () => {
  it('draws the figure into an SVG and redraws it as the player steps', async () => {
    const { figure, timeline } = shearLesson()
    document.body.innerHTML = `<figure data-tinyfly-math>
      <script type="application/json" data-tinyfly-figure>${JSON.stringify(figure)}</script>
      <script type="application/json" data-tinyfly-timeline>${JSON.stringify(timeline)}</script>
      <figcaption>Shear</figcaption>
    </figure>`
    const [mounted] = await mountAllMath(document)
    const element = mounted.element
    const svg = element.querySelector('svg[data-tinyfly-math-svg]')!
    expect(svg.getAttribute('viewBox')).toBe('0 0 400 400')
    // The SVG sits before the caption; the step controls are added too.
    expect(svg.nextElementSibling?.tagName.toLowerCase()).not.toBe('script')
    expect(element.querySelector('.tf-ctl-step')?.textContent).toBe('1 / 2') // the first marker is at 0
    expect(matrixText(element)).toContain('1001') // the identity: 1 0 / 0 1 (plus î ĵ labels)
    mounted.player!.goToMarker('sheared')
    expect(matrixText(element)).toContain('1101')
    // Idempotent.
    expect(await mountMath(element)).toBe(mounted)
  })

  it('draws a still figure with no timeline, and skips an invalid one', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    document.body.innerHTML = `<figure id="still" data-tinyfly-math><script type="application/json" data-tinyfly-figure>${JSON.stringify(linearMapFigure())}</script></figure>
      <figure id="bad" data-tinyfly-math><script type="application/json" data-tinyfly-figure>{"width": 0}</script></figure>`
    const mounted = await mountAllMath(document)
    expect(mounted).toHaveLength(1)
    expect(mounted[0].player).toBeUndefined()
    expect(document.querySelector('#still svg text')).not.toBeNull()
    expect(warn).toHaveBeenCalled()
  })
})

describe('mathExplorable', () => {
  it('redraws as sliders and set() change values, and reports them', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const changes: unknown[] = []
    const figure = { width: 300, height: 300, values: { k: 1 }, items: [{ id: 'f', kind: 'function' as const, expr: 'k x' }] }
    const explorable = mathExplorable(element, figure, { sliders: [{ value: 'k', min: 0, max: 3, step: 0.5 }], onChange: (v) => changes.push(v) })
    const before = element.querySelector('svg')!.innerHTML
    const input = element.querySelector('input[type=range]') as HTMLInputElement
    input.value = '2'
    input.dispatchEvent(new Event('input'))
    expect(explorable.values.k).toBe(2)
    expect(element.querySelector('svg')!.innerHTML).not.toBe(before)
    explorable.set('k', 0.5)
    expect(input.value).toBe('0.5')
    expect(changes.at(-1)).toEqual({ k: 0.5 })
    expect(() => explorable.set('n', 1)).toThrow(/no value "n"/)
    explorable.destroy()
    expect(element.querySelector('input')).toBeNull()
  })

  it('drags a matrix column: î follows the pointer, snapped', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const explorable = mathExplorable(element, linearMapFigure({ width: 600, height: 600 }), { drag: [{ matrix: 'M', column: 0 }, { matrix: 'M', column: 1 }] })
    const svg = element.querySelector('svg')!
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 600, height: 600, right: 600, bottom: 600, x: 0, y: 0, toJSON() {} })
    // î's tip is at world (1, 0): screen (360, 300).
    svg.dispatchEvent(new PointerEvent('pointerdown', { clientX: 362, clientY: 301, pointerId: 1 }))
    svg.dispatchEvent(new PointerEvent('pointermove', { clientX: 421, clientY: 241, pointerId: 1 }))
    expect(explorable.values.M).toEqual([2, 0, 1, 1])
    svg.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }))
    svg.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 100, pointerId: 1 }))
    expect(explorable.values.M).toEqual([2, 0, 1, 1])
  })

  it('refuses controls for values the figure does not have', () => {
    const element = document.createElement('div')
    expect(() => mathExplorable(element, linearMapFigure(), { sliders: [{ value: 'M', min: 0, max: 1 }] })).toThrow(/not a number value/)
    expect(() => mathExplorable(element, linearMapFigure(), { drag: [{ vector: 'v' }] })).toThrow(/not a vector value/)
  })
})
