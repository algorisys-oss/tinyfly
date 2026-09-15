import { TinyflyPlayer, type PlayerOptions, type Scenario } from '../player/player'
import type { TimelineDefinition } from '../engine'
import { createControls, type Controls, type ControlsOptions } from './controls'
import { bindChoiceHotspots } from './choices'

/**
 * Declarative embeds, for pages where inline init scripts get deferred,
 * combined or stripped (CMS optimisation plugins): paste markup, load one
 * script, and every figure mounts itself.
 *
 *     <figure data-tinyfly-embed data-options='{"stepMode": true}' data-alt="How a slice grows">
 *       <svg viewBox="0 0 720 200">…<rect data-tinyfly="cell-0" …/>…</svg>
 *       <script type="application/json" data-tinyfly-timeline>{ …timeline JSON… }</script>
 *       <figcaption>Appending to a full slice allocates a new array.</figcaption>
 *     </figure>
 *
 *     <script src="…/tinyfly-embed.iife.js" data-tinyfly-auto></script>
 *
 * Or call `tinyfly.mountAll()` yourself. The timeline may also come from a URL
 * (`data-src="slice.json"`). A timeline without markers can take steps by time
 * from `data-markers="0,2300,3800"`. Translated captions can sit beside it in a
 * `<script type="application/json" data-tinyfly-captions>`. `data-controls="false"`
 * leaves the controls out, and `data-labels` passes control labels as JSON.
 *
 * Scenarios: give the figure several timelines, each with `data-scenario="id"` and
 * `data-scenario-label="What the reader sees"`, and the reader chooses which one
 * plays. The figure's own `data-scenario` picks the first shown,
 * `data-scenario-legend` names the choice, and `data-scenario-control="slider"`
 * makes it a stepped slider instead of a group of options. Elements with
 * `data-tinyfly-choose="id"` become buttons that choose that scenario.
 *
 * `data-fullscreen="true"` adds a full screen button to the controls.
 *
 * Embeds default to `playWhenVisible: true`. Each SVG without a role becomes a
 * labelled image (`role="img"`, named by `data-alt` or the figcaption), and the
 * step captions are announced as they change.
 */

export interface MountedEmbed {
  element: HTMLElement
  player: TinyflyPlayer
  controls?: Controls
}

export interface MountOptions {
  /** Player options applied to every embed (an embed's `data-options` win) */
  player?: PlayerOptions
  /** Controls options applied to every embed (`data-labels` win for labels) */
  controls?: ControlsOptions
}

const mounted = new WeakMap<Element, MountedEmbed>()
const unbindHotspots = new WeakMap<Element, () => void>()
let captionIds = 0

function parseJson<T>(text: string | null | undefined, what: string, element: Element): T | undefined {
  if (!text) return undefined
  try {
    return JSON.parse(text) as T
  } catch (error) {
    console.warn(`tinyfly: invalid ${what} JSON on`, element, error)
    return undefined
  }
}

/** Mount one embed (idempotent). */
export async function mount(element: HTMLElement, options: MountOptions = {}): Promise<MountedEmbed | undefined> {
  const existing = mounted.get(element)
  if (existing) return existing

  const inlineScripts = Array.from(element.querySelectorAll('script[data-tinyfly-timeline]'))
  const inline = inlineScripts[0]
  const source = element.getAttribute('data-src')
  // data-markers="0,2300,3800": steps by time, for timelines written without markers.
  const markerTimes = parseMarkerTimes(element.getAttribute('data-markers'))
  const scenarios =
    inlineScripts.length > 1 || inline?.hasAttribute('data-scenario') ? readScenarios(inlineScripts, markerTimes, element) : undefined
  if (scenarios && scenarios.length === 0) return undefined
  let definition = inline && !scenarios ? parseJson<TimelineDefinition>(inline.textContent, 'timeline', element) : undefined
  if (!definition && source && markerTimes) {
    // The markers must be added before the player sees the timeline, so fetch it here.
    const response = await fetch(source)
    if (response.ok) definition = (await response.json()) as TimelineDefinition
  }
  if (definition && markerTimes) definition = withMarkerTimes(definition, markerTimes)
  if (!definition && !source && !scenarios) {
    console.warn('tinyfly: embed has no timeline (a <script type="application/json" data-tinyfly-timeline> or data-src)', element)
    return undefined
  }

  const captions = parseJson<PlayerOptions['captions']>(element.querySelector('script[data-tinyfly-captions]')?.textContent, 'captions', element)
  const playerOptions: PlayerOptions = {
    playWhenVisible: true,
    ...options.player,
    ...(captions && { captions }),
    ...parseJson<PlayerOptions>(element.getAttribute('data-options'), 'data-options', element),
  }

  describeFigure(element)

  const player = new TinyflyPlayer(element, playerOptions)
  const entry: MountedEmbed = { element, player }
  mounted.set(element, entry)
  element.setAttribute('data-tinyfly-mounted', '')
  if (scenarios) {
    const initial = element.getAttribute('data-scenario') ?? undefined
    await player.loadScenarios(scenarios, { initial: scenarios.some((scenario) => scenario.id === initial) ? initial : undefined })
    unbindHotspots.set(element, bindChoiceHotspots(player, element))
  } else {
    await player.load(definition ?? source!)
  }

  if (element.getAttribute('data-controls') !== 'false') {
    const labels = parseJson<ControlsOptions['labels']>(element.getAttribute('data-labels'), 'data-labels', element)
    const caption = element.querySelector('figcaption')
    const legend = element.getAttribute('data-scenario-legend')
    const control = element.getAttribute('data-scenario-control')
    entry.controls = createControls(player, element, {
      ...options.controls,
      ...(element.getAttribute('data-fullscreen') === 'true' ? { fullscreen: true } : {}),
      ...(control === 'slider' || control === 'buttons' ? { scenarioControl: control } : {}),
      labels: { ...options.controls?.labels, ...labels, ...(legend ? { scenario: legend } : {}) },
      // Inside the figure, before its figcaption, so the caption stays last.
      mount: undefined,
    })
    if (caption) element.insertBefore(entry.controls.element, caption)
    else element.appendChild(entry.controls.element)
  }
  return entry
}

/** Every inline timeline as a scenario, skipping any whose JSON does not parse. */
function readScenarios(scripts: Element[], markerTimes: number[] | undefined, element: Element): Scenario[] {
  const scenarios: Scenario[] = []
  scripts.forEach((script, index) => {
    const timeline = parseJson<TimelineDefinition>(script.textContent, 'timeline', element)
    if (!timeline) return
    const id = script.getAttribute('data-scenario') || `scenario-${index + 1}`
    if (scenarios.some((scenario) => scenario.id === id)) {
      console.warn(`tinyfly: scenario id "${id}" is used more than once; the later one is skipped`, element)
      return
    }
    const label = script.getAttribute('data-scenario-label') ?? undefined
    scenarios.push({ id, label, timeline: markerTimes ? withMarkerTimes(timeline, markerTimes) : timeline })
  })
  return scenarios
}

/** The timeline with steps at these times, unless it already has markers. */
function withMarkerTimes(definition: TimelineDefinition, times: number[]): TimelineDefinition {
  if (definition.config.markers?.length) return definition
  return { ...definition, config: { ...definition.config, markers: times.map((time, i) => ({ id: `step-${i + 1}`, time })) } }
}

/** `"0, 2300, 3800"` → `[0, 2300, 3800]` (sorted, invalid entries skipped). */
function parseMarkerTimes(value: string | null): number[] | undefined {
  if (!value) return undefined
  const times = value
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number)
    .filter((time) => Number.isFinite(time) && time >= 0)
    .sort((a, b) => a - b)
  return times.length > 0 ? times : undefined
}

/** Mount every `[data-tinyfly-embed]` under `root` that is not mounted yet. */
export async function mountAll(root: ParentNode = document, options: MountOptions = {}): Promise<MountedEmbed[]> {
  const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-tinyfly-embed]'))
  const results = await Promise.all(elements.map((element) => mount(element, options)))
  return results.filter((result): result is MountedEmbed => result !== undefined)
}

/** Stop and remove an embed's player and controls. */
export function unmount(element: HTMLElement): void {
  const entry = mounted.get(element)
  if (!entry) return
  unbindHotspots.get(element)?.()
  unbindHotspots.delete(element)
  entry.controls?.destroy()
  entry.player.destroy()
  mounted.delete(element)
  element.removeAttribute('data-tinyfly-mounted')
}

/** Give the figure's SVG an accessible name, unless the author already did. */
function describeFigure(figure: HTMLElement): void {
  const svg = figure.querySelector('svg')
  if (!svg || svg.hasAttribute('role') || svg.hasAttribute('aria-hidden')) return
  const alt = figure.getAttribute('data-alt')
  const caption = figure.querySelector('figcaption')
  svg.setAttribute('role', 'img')
  if (alt) {
    svg.setAttribute('aria-label', alt)
  } else if (caption) {
    caption.id ||= `tinyfly-caption-${++captionIds}`
    svg.setAttribute('aria-labelledby', caption.id)
  }
}
