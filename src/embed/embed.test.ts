/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { TimelineDefinition } from '../engine'
import { TinyflyPlayer } from '../player/player'
import { createControls } from './controls'
import { mountAll, unmount } from './mount'
import { renderFrame, validateEmbed, validateScenarios, targetNamesIn } from './tools'

const lesson: TimelineDefinition = {
  id: 'slice',
  config: {
    duration: 2000,
    markers: [
      { id: 'one', time: 500, label: 'one' },
      { id: 'ask', time: 1000, label: 'think', pause: true, question: 'What is len(s)?' },
    ],
  },
  captions: { es: { one: 'uno', ask: 'piensa' } },
  tracks: [
    { id: 'x', target: 'cell', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 2000, value: 200 }] },
    { id: 'label', target: 'len', property: 'text', keyframes: [{ time: 0, value: 'len = 3' }, { time: 1000, value: 'len = 4' }] },
  ],
}

const svg = '<svg viewBox="0 0 400 100"><rect data-tinyfly="cell" width="40" height="40" style="fill: #eee"/><text data-tinyfly="len">len = 3</text></svg>'

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', () => 1)
  vi.stubGlobal('cancelAnimationFrame', () => {})
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  document.head.innerHTML = ''
  document.body.innerHTML = ''
})
afterEach(() => vi.unstubAllGlobals())

describe('controls', () => {
  it('reflects steps and captions, and steps with the keyboard inside the figure only', async () => {
    document.body.innerHTML = `<figure id="a" lang="es">${svg}</figure><figure id="b">${svg}</figure>`
    const figure = document.getElementById('a')!
    const player = new TinyflyPlayer(figure)
    await player.load(lesson)
    const controls = createControls(player, figure, { labels: { next: 'Siguiente' } })
    const bar = controls.element
    expect(bar.querySelector('[aria-label="Siguiente"]')).not.toBeNull()
    expect(bar.querySelector('.tf-ctl-step')!.textContent).toBe('0 / 2')

    player.goToMarker('one')
    expect(bar.querySelector('.tf-ctl-step')!.textContent).toBe('1 / 2')
    expect(bar.querySelector('.tf-ctl-caption')!.textContent).toBe('uno')
    expect(bar.querySelector('.tf-ctl-caption')!.getAttribute('aria-live')).toBe('polite')

    // A key pressed in another figure does nothing here.
    document.getElementById('b')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    expect(player.currentTime).toBe(500)
    figure.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    expect(player.currentTime).toBe(0)
    figure.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    expect(player.currentTime).toBe(0)

    player.goToMarker('ask')
    const question = bar.querySelector('.tf-ctl-question') as HTMLElement
    expect(question.hidden).toBe(false)
    expect(question.textContent).toContain('What is len(s)?')
    controls.destroy()
    expect(document.querySelector('.tf-ctl')).toBeNull()
  })
})

describe('mountAll', () => {
  it('mounts declarative embeds with controls, an accessible name, and data-options', async () => {
    document.body.innerHTML = `
      <figure data-tinyfly-embed data-options='{"initialFrame":"end"}' data-labels='{"play":"Reproducir"}'>
        ${svg}
        <script type="application/json" data-tinyfly-timeline>${JSON.stringify(lesson)}</script>
        <figcaption>How a slice grows</figcaption>
      </figure>
      <figure data-tinyfly-embed data-controls="false" data-alt="Second">${svg}<script type="application/json" data-tinyfly-timeline>${JSON.stringify(lesson)}</script></figure>`
    const embeds = await mountAll()
    expect(embeds).toHaveLength(2)
    const [first, second] = embeds
    expect(first.player.currentTime).toBe(2000)
    const rect = first.element.querySelector('rect') as unknown as HTMLElement
    expect(rect.style.transform).toBe('translateX(200px)')
    expect(first.element.querySelector('[aria-label="Reproducir"]')).not.toBeNull()
    // Controls sit before the figcaption; the SVG is named by it.
    expect(first.element.lastElementChild!.tagName).toBe('FIGCAPTION')
    const svgElement = first.element.querySelector('svg')!
    expect(svgElement.getAttribute('role')).toBe('img')
    expect(svgElement.getAttribute('aria-labelledby')).toBe(first.element.querySelector('figcaption')!.id)
    expect(second.controls).toBeUndefined()
    expect(second.element.querySelector('svg')!.getAttribute('aria-label')).toBe('Second')

    // Idempotent, and unmount tears down.
    expect(await mountAll()).toHaveLength(2)
    expect(document.querySelectorAll('.tf-ctl')).toHaveLength(1)
    unmount(first.element)
    expect(document.querySelectorAll('.tf-ctl')).toHaveLength(0)
  })
})

describe('mount details', () => {
  it('takes steps from data-markers when the timeline has none', async () => {
    const plain: TimelineDefinition = { id: 'p', config: { duration: 1000 }, tracks: lesson.tracks }
    document.body.innerHTML = `<figure data-tinyfly-embed data-markers="900, 0,x, 400">${svg}<script type="application/json" data-tinyfly-timeline>${JSON.stringify(plain)}</script></figure>`
    const [entry] = await mountAll()
    expect(entry.player.markers).toEqual([
      { id: 'step-1', time: 0 },
      { id: 'step-2', time: 400 },
      { id: 'step-3', time: 900 },
    ])
    // No labels or captions: the caption line is hidden; the counter uses stepFormat.
    const caption = entry.controls!.element.querySelector('.tf-ctl-caption') as HTMLElement
    expect(caption.hidden).toBe(true)
    unmount(entry.element)
  })

  it('formats the visible step counter from labels', async () => {
    document.body.innerHTML = `<figure id="f">${svg}</figure>`
    const figure = document.getElementById('f')!
    const player = new TinyflyPlayer(figure)
    await player.load(lesson)
    const controls = createControls(player, figure, { labels: { stepFormat: '第 {index} 步，共 {total} 步' } })
    player.goToMarker('ask')
    expect(controls.element.querySelector('.tf-ctl-step')!.textContent).toBe('第 2 步，共 2 步')
    controls.destroy()
  })
})

describe('validateEmbed', () => {
  it('passes a good embed', () => {
    const problems = validateEmbed(lesson, { markup: svg })
    expect(problems.filter((problem) => problem.level === 'error')).toEqual([])
  })

  it('reports missing targets, bad markers, late keyframes and orphan captions', () => {
    const broken: TimelineDefinition = {
      ...lesson,
      config: {
        duration: 1500,
        markers: [
          { id: 'b', time: 1200 },
          { id: 'a', time: 400 },
          { id: 'a', time: 9000 },
        ],
      },
      captions: { en: { ghost: 'nobody' } },
    }
    const messages = validateEmbed(broken, { markup: '<svg><rect data-tinyfly="cell"/><g data-tinyfly="unused"/></svg>' }).map((problem) => `${problem.level}: ${problem.message}`)
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/error: track "x" has a keyframe at 2000ms, after the 1500ms duration/),
        expect.stringMatching(/error: marker "a" comes before "b"/),
        expect.stringMatching(/error: marker id "a" is used more than once/),
        expect.stringMatching(/error: marker "a" at 9000ms is outside/),
        expect.stringMatching(/error: caption "ghost" \(en\) has no marker/),
        expect.stringMatching(/error: track "label" targets "len", but no element/),
        expect.stringMatching(/warning: data-tinyfly="unused" is never animated/),
      ])
    )
    expect(targetNamesIn(svg)).toEqual(['cell', 'len'])
  })
})

describe('renderFrame', () => {
  it('writes a frame into the markup, merging styles and replacing text', () => {
    const end = renderFrame(svg, lesson, 'end')
    expect(end).toContain('<rect data-tinyfly="cell" width="40" height="40" style="fill: #eee; transform: translateX(200px); transform-box: fill-box; transform-origin: 50% 50%" />')
    expect(end).toContain('<text data-tinyfly="len">len = 4</text>')
    const atMarker = renderFrame(svg, lesson, 'one')
    expect(atMarker).toContain('translateX(50px)')
    expect(atMarker).toContain('>len = 3</text>')
  })
})

describe('scenarios in embeds', () => {
  const quick: TimelineDefinition = {
    id: 'quick',
    config: { duration: 500, markers: [{ id: 'one', time: 250, label: 'one, fast' }] },
    tracks: [{ id: 'x', target: 'cell', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 50 }] }],
  }
  const scenarioScripts = (extra = '') =>
    `<script type="application/json" data-tinyfly-timeline data-scenario="slow" data-scenario-label="Slow path">${JSON.stringify(lesson)}</script>` +
    `<script type="application/json" data-tinyfly-timeline data-scenario="fast" data-scenario-label="Fast path" ${extra}>${JSON.stringify(quick)}</script>`

  it('mounts every timeline as a scenario, with a labelled choice group that switches', async () => {
    document.body.innerHTML = `<figure data-tinyfly-embed data-scenario="fast" data-scenario-legend="Path">${svg}${scenarioScripts()}</figure>`
    const [entry] = await mountAll()
    expect(entry.player.scenarios.map((scenario) => scenario.label)).toEqual(['Slow path', 'Fast path'])
    expect(entry.player.scenario).toBe('fast')

    const group = entry.controls!.element.querySelector('.tf-ctl-choices') as HTMLFieldSetElement
    expect(group.querySelector('legend')!.textContent).toBe('Path')
    const radios = Array.from(group.querySelectorAll<HTMLInputElement>('input[type="radio"]'))
    expect(radios.map((radio) => radio.parentElement!.textContent)).toEqual(['Slow path', 'Fast path'])
    expect(radios[1].checked).toBe(true)
    // One name per figure, so two figures' groups never share a selection.
    expect(radios[0].name).toBe(radios[1].name)

    radios[0].checked = true
    radios[0].dispatchEvent(new Event('change', { bubbles: true }))
    expect(entry.player.scenario).toBe('slow')

    // Switching from code updates the group too.
    entry.player.setScenario('fast')
    expect(radios[1].checked).toBe(true)
    unmount(entry.element)
  })

  it('a stepped slider, for scenarios that are points on a scale', async () => {
    document.body.innerHTML = `<figure data-tinyfly-embed data-scenario-control="slider" data-scenario-legend="Servers">${svg}${scenarioScripts()}</figure>`
    const [entry] = await mountAll()
    const slider = entry.controls!.element.querySelector('.tf-ctl-choice-slider input[type="range"]') as HTMLInputElement
    const output = entry.controls!.element.querySelector('.tf-ctl-choice-slider output')!
    expect(slider.min).toBe('0')
    expect(slider.max).toBe('1')
    expect(slider.getAttribute('aria-label')).toBe('Servers')
    expect(output.textContent).toBe('Slow path')
    slider.value = '1'
    slider.dispatchEvent(new Event('input', { bubbles: true }))
    expect(entry.player.scenario).toBe('fast')
    expect(output.textContent).toBe('Fast path')
    expect(slider.getAttribute('aria-valuetext')).toBe('Fast path')
    unmount(entry.element)
  })

  it('data-markers gives steps to each scenario that has none', async () => {
    const plain: TimelineDefinition = { id: 'p', config: { duration: 1000 }, tracks: lesson.tracks }
    document.body.innerHTML =
      `<figure data-tinyfly-embed data-markers="0, 400">${svg}` +
      `<script type="application/json" data-tinyfly-timeline data-scenario="a">${JSON.stringify(plain)}</script>` +
      `<script type="application/json" data-tinyfly-timeline data-scenario="b">${JSON.stringify(lesson)}</script></figure>`
    const [entry] = await mountAll()
    expect(entry.player.markers.map((marker) => marker.id)).toEqual(['step-1', 'step-2'])
    entry.player.setScenario('b')
    expect(entry.player.markers.map((marker) => marker.id)).toEqual(['one', 'ask'])
    // A scenario without a label shows its id.
    expect(entry.player.scenarios[0].label).toBe('a')
    unmount(entry.element)
  })

  it('elements marked data-tinyfly-choose are buttons that pick a scenario, with or without controls', async () => {
    const hotspotSvg = svg.replace('</svg>', '<circle data-tinyfly-choose="fast" aria-label="Take the fast path" r="5"/></svg>')
    document.body.innerHTML = `<figure data-tinyfly-embed data-controls="false">${hotspotSvg}${scenarioScripts()}</figure>`
    const [entry] = await mountAll()
    const hotspot = entry.element.querySelector('[data-tinyfly-choose]') as unknown as HTMLElement
    expect(hotspot.getAttribute('role')).toBe('button')
    expect(hotspot.getAttribute('tabindex')).toBe('0')
    expect(hotspot.getAttribute('aria-pressed')).toBe('false')
    hotspot.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(entry.player.scenario).toBe('fast')
    expect(hotspot.getAttribute('aria-pressed')).toBe('true')

    entry.player.setScenario('slow')
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    hotspot.dispatchEvent(enter)
    expect(entry.player.scenario).toBe('fast')
    expect(enter.defaultPrevented).toBe(true)
    unmount(entry.element)
    expect(hotspot.hasAttribute('role')).toBe(false)
  })

  it('Space on a hotspot chooses; it does not also play the figure', async () => {
    const hotspotSvg = svg.replace('</svg>', '<circle data-tinyfly-choose="fast" r="5"/></svg>')
    document.body.innerHTML = `<figure data-tinyfly-embed>${hotspotSvg}${scenarioScripts()}</figure>`
    const [entry] = await mountAll()
    const hotspot = entry.element.querySelector('[data-tinyfly-choose]') as unknown as HTMLElement
    // No aria-label of its own: it is named after the scenario.
    expect(hotspot.getAttribute('aria-label')).toBe('Fast path')
    hotspot.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }))
    expect(entry.player.scenario).toBe('fast')
    expect(entry.player.isPlaying).toBe(false)
    unmount(entry.element)
  })

  it('a single timeline shows no choices', async () => {
    document.body.innerHTML = `<figure data-tinyfly-embed>${svg}<script type="application/json" data-tinyfly-timeline>${JSON.stringify(lesson)}</script></figure>`
    const [entry] = await mountAll()
    expect(entry.player.scenarios).toEqual([])
    expect(entry.controls!.element.querySelector('.tf-ctl-choices, .tf-ctl-choice-slider')).toBeNull()
    unmount(entry.element)
  })
})

describe('validateScenarios', () => {
  it('checks each scenario, ids, hotspots, and never-animated elements across all of them', () => {
    const other: TimelineDefinition = {
      id: 'other',
      config: { duration: 1000 },
      tracks: [{ id: 'y', target: 'ghost', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 5 }] }],
    }
    const markup = svg.replace('</svg>', '<g data-tinyfly="spare"/><circle data-tinyfly-choose="missing"/><circle data-tinyfly-choose="b"/></svg>')
    const messages = validateScenarios(
      [
        { id: 'a', timeline: lesson },
        { id: 'b', timeline: other },
        { id: 'b', timeline: other },
      ],
      { markup }
    ).map((problem) => `${problem.level}: ${problem.message}`)
    expect(messages).toEqual(
      expect.arrayContaining([
        'error: scenario id "b" is used more than once',
        expect.stringMatching(/^error: scenario "b": track "y" targets "ghost", but no element/),
        'error: data-tinyfly-choose="missing" names no scenario',
        'warning: data-tinyfly="spare" is never animated in any scenario',
      ])
    )
    // cell and len are animated in scenario "a" only: not reported as unused.
    expect(messages.some((message) => /"cell" is never animated|"len" is never animated/.test(message))).toBe(false)
    expect(messages.some((message) => message.includes('data-tinyfly-choose="b"'))).toBe(false)
  })

  it('warns that one scenario is not a choice', () => {
    const messages = validateScenarios([{ id: 'only', timeline: lesson }], { markup: svg }).map((problem) => `${problem.level}: ${problem.message}`)
    expect(messages).toContain('warning: only one scenario, so the reader has nothing to choose')
  })
})
