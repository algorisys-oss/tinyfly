import { TinyflyPlayer, type PlayerOptions } from '../player/player'
import type { TimelineDefinition } from '../engine'
import { createControls, type Controls, type ControlsOptions } from './controls'

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
 * (`data-src="slice.json"`). Translated captions can sit beside it in a
 * `<script type="application/json" data-tinyfly-captions>`. `data-controls="false"`
 * leaves the controls out, and `data-labels` passes control labels as JSON.
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

  const inline = element.querySelector('script[data-tinyfly-timeline]')
  const source = element.getAttribute('data-src')
  const definition = inline ? parseJson<TimelineDefinition>(inline.textContent, 'timeline', element) : undefined
  if (!definition && !source) {
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
  await player.load(definition ?? source!)

  if (element.getAttribute('data-controls') !== 'false') {
    const labels = parseJson<ControlsOptions['labels']>(element.getAttribute('data-labels'), 'data-labels', element)
    const caption = element.querySelector('figcaption')
    entry.controls = createControls(player, element, {
      ...options.controls,
      labels: { ...options.controls?.labels, ...labels },
      // Inside the figure, before its figcaption, so the caption stays last.
      mount: undefined,
    })
    if (caption) element.insertBefore(entry.controls.element, caption)
    else element.appendChild(entry.controls.element)
  }
  return entry
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
