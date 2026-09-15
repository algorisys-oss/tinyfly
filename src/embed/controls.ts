import type { TinyflyPlayer } from '../player/player'

/**
 * Controls for a teaching animation: play / pause, step back and forward
 * (through markers), restart, a scrub bar, speed, the current step's caption, a
 * question to answer before the next step is revealed, and — when the player has
 * scenarios — a choice between them (a group of options, or a stepped slider).
 * With `fullscreen: true`, a button shows the figure full screen: through the
 * Fullscreen API where the browser has it, and as a fixed overlay where it
 * doesn't (iPhone Safari supports element fullscreen only on iPad).
 *
 * Kept out of the player and engine builds. Styled only through CSS custom
 * properties on the bar (`--tf-ctl-fg`, `--tf-ctl-bg`, `--tf-ctl-accent`,
 * `--tf-ctl-radius`, `--tf-ctl-font`); every class is prefixed `tf-ctl`, so no
 * page styles are touched. All visible text comes from `labels`, so each page
 * can speak its own language.
 *
 * Keys work while focus is inside the figure, so several figures on one page
 * never react to the same key: Space plays or pauses, ← and → step, Home restarts,
 * and F toggles full screen when it's enabled.
 */

export interface ControlLabels {
  play: string
  pause: string
  prev: string
  next: string
  restart: string
  scrub: string
  speed: string
  reveal: string
  /** Announced before the step number, e.g. "Step" → "Step 2 of 5" */
  step: string
  of: string
  /**
   * The visible step counter, with `{index}` and `{total}`: `"{index} / {total}"`
   * (default), `"Step {index} of {total}"`, `"第 {index} 步，共 {total} 步"`.
   */
  stepFormat: string
  /** Names the scenario choice: "Scenario", or what is being chosen ("Cache", "Servers") */
  scenario: string
  fullscreen: string
  exitFullscreen: string
}

export const DEFAULT_LABELS: ControlLabels = {
  play: 'Play',
  pause: 'Pause',
  prev: 'Previous step',
  next: 'Next step',
  restart: 'Restart',
  scrub: 'Position',
  speed: 'Speed',
  reveal: 'Reveal',
  step: 'Step',
  of: 'of',
  stepFormat: '{index} / {total}',
  scenario: 'Scenario',
  fullscreen: 'Full screen',
  exitFullscreen: 'Exit full screen',
}

export interface ControlsOptions {
  /** Visible and announced text; missing entries use English */
  labels?: Partial<ControlLabels>
  /** Speed choices (default [0.5, 1, 2]); an empty list hides the speed control */
  speeds?: number[]
  /** Show the current step's caption under the bar (default true) */
  captions?: boolean
  /** The element keys are listened on (default: the player's container) */
  keyboardScope?: HTMLElement
  /** Where to put the bar (default: right after the player's container) */
  mount?: HTMLElement
  /**
   * How the reader chooses a scenario: `'buttons'` (default), a group of options,
   * or `'slider'`, for scenarios that are points on a scale (1, 10, 100 servers).
   */
  scenarioControl?: 'buttons' | 'slider'
  /** Add a full screen button for the player's container (default false). F toggles it too. */
  fullscreen?: boolean
}

export interface FullscreenControl {
  /** Whether the figure is full screen now, by either route */
  readonly active: boolean
  enter(): Promise<void>
  exit(): Promise<void>
}

export interface Controls {
  readonly element: HTMLElement
  /** Present when `fullscreen` was enabled */
  readonly fullscreen?: FullscreenControl
  destroy(): void
}

const STYLE_ID = 'tinyfly-controls-style'

const STYLES = `
.tf-ctl { --tf-ctl-fg: #1d1d1f; --tf-ctl-bg: #f4f2ee; --tf-ctl-accent: #c2410c; --tf-ctl-radius: 8px;
  font: 14px/1.4 var(--tf-ctl-font, system-ui, sans-serif); color: var(--tf-ctl-fg); margin-top: 8px; }
.tf-ctl-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 6px; border-radius: var(--tf-ctl-radius); background: var(--tf-ctl-bg); }
.tf-ctl-btn { min-width: 36px; height: 36px; padding: 0 10px; border: 0; border-radius: calc(var(--tf-ctl-radius) - 2px); background: transparent; color: inherit; font: inherit; cursor: pointer; }
.tf-ctl-btn:hover { background: color-mix(in srgb, var(--tf-ctl-fg) 8%, transparent); }
.tf-ctl-btn:focus-visible, .tf-ctl-scrub:focus-visible, .tf-ctl-speed:focus-visible { outline: 2px solid var(--tf-ctl-accent); outline-offset: 2px; }
.tf-ctl-btn[disabled] { opacity: 0.4; cursor: default; }
.tf-ctl-primary { background: var(--tf-ctl-accent); color: #fff; }
.tf-ctl-primary:hover { background: var(--tf-ctl-accent); filter: brightness(1.08); }
.tf-ctl-scrub { flex: 1 1 120px; min-width: 80px; accent-color: var(--tf-ctl-accent); }
.tf-ctl-speed { height: 32px; border: 0; border-radius: 6px; background: transparent; color: inherit; font: inherit; }
.tf-ctl-step { font-variant-numeric: tabular-nums; opacity: 0.75; padding: 0 4px; }
.tf-ctl-caption { margin: 6px 2px 0; min-height: 1.4em; }
.tf-ctl-question { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 6px 2px 0; font-weight: 600; }
.tf-ctl-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The hidden attribute only hides through the browser's default stylesheet; any rule
   above that sets display would override it, so enforce it for everything here. */
.tf-ctl [hidden] { display: none !important; }
.tf-ctl-choices { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 8px 0 0; padding: 0; border: 0; }
.tf-ctl-choices legend { float: left; margin-right: 4px; padding: 0; font-weight: 600; }
.tf-ctl-choice { position: relative; display: inline-flex; }
.tf-ctl-choice input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.tf-ctl-choice span { display: inline-block; padding: 6px 12px; border-radius: var(--tf-ctl-radius); background: var(--tf-ctl-bg); cursor: pointer; }
.tf-ctl-choice input:checked + span { background: var(--tf-ctl-accent); color: #fff; }
.tf-ctl-choice input:focus-visible + span { outline: 2px solid var(--tf-ctl-accent); outline-offset: 2px; }
.tf-ctl-choice-slider { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 8px 0 0; }
.tf-ctl-choice-slider span { font-weight: 600; }
.tf-ctl-choice-slider input { flex: 1 1 140px; accent-color: var(--tf-ctl-accent); }
.tf-ctl-choice-slider input:focus-visible { outline: 2px solid var(--tf-ctl-accent); outline-offset: 2px; }
.tf-ctl-choice-slider output { font-variant-numeric: tabular-nums; min-width: 4em; }
.tf-ctl-fullscreen { margin-left: auto; display: inline-flex; align-items: center; justify-content: center; }
.tf-ctl-fullscreen svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
/* Full screen, by either route. The figure becomes a column: the drawing takes the room
   that's left after the controls and captions. !important because the host page's own
   figure rules (a max-width, a min-width that makes a diagram scroll on phones) would
   otherwise keep the drawing at its in-page size. */
.tf-fullscreen { box-sizing: border-box !important; display: flex !important; flex-direction: column; width: 100% !important; max-width: none !important; height: 100vh; height: 100dvh; margin: 0 !important; padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left)) !important; overflow: auto !important; background: var(--tf-fullscreen-bg, #fff); }
.tf-fullscreen > * { flex: none; }
.tf-fullscreen > svg, .tf-fullscreen > canvas { flex: 1 1 0; min-height: 0; width: 100% !important; min-width: 0 !important; height: 100% !important; }
.tf-fullscreen-overlay { position: fixed !important; inset: 0; z-index: 2147483000; }
/* A short landscape screen (a phone on its side): stacking the controls under the drawing
   leaves the drawing a thin strip, so put them in a column beside it instead. */
@media (orientation: landscape) and (max-height: 520px) {
  .tf-fullscreen { display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(200px, 34%); grid-auto-rows: min-content; column-gap: 12px; align-content: start; }
  .tf-fullscreen > svg, .tf-fullscreen > canvas { grid-column: 1; grid-row: 1 / span 12; height: calc(100vh - 24px) !important; height: calc(100dvh - 24px) !important; }
  .tf-fullscreen > :not(svg):not(canvas) { grid-column: 2; }
}
`

let choiceGroups = 0

function ensureStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return
  const style = doc.createElement('style')
  style.id = STYLE_ID
  style.textContent = STYLES
  doc.head.appendChild(style)
}

export function createControls(player: TinyflyPlayer, container: HTMLElement, options: ControlsOptions = {}): Controls {
  const doc = container.ownerDocument
  ensureStyles(doc)
  const labels = { ...DEFAULT_LABELS, ...options.labels }
  const speeds = options.speeds ?? [0.5, 1, 2]
  const hasMarkers = () => player.markers.length > 0
  /** Whether any step could show a caption: a label, or a caption in any language. */
  const hasAnyCaption = () => player.markers.some((marker) => marker.label !== undefined || player.caption(marker.id) !== undefined)

  const root = doc.createElement('div')
  root.className = 'tf-ctl'

  const bar = doc.createElement('div')
  bar.className = 'tf-ctl-bar'
  bar.setAttribute('role', 'group')

  const button = (label: string, text: string, onClick: () => void, extra = '') => {
    const element = doc.createElement('button')
    element.type = 'button'
    element.className = `tf-ctl-btn ${extra}`.trim()
    element.setAttribute('aria-label', label)
    element.title = label
    element.textContent = text
    element.addEventListener('click', onClick)
    return element
  }

  const restart = button(labels.restart, '⟲', () => {
    player.pause()
    player.seek(0)
  })
  const prev = button(labels.prev, '◀', () => player.prev())
  const toggle = button(labels.play, '▶', () => (player.isPlaying ? player.pause() : playFromEnd()), 'tf-ctl-primary')
  const next = button(labels.next, '▶|', () => player.next())

  const playFromEnd = () => {
    if (player.currentTime >= player.duration - 0.5) player.seek(0)
    player.play()
  }

  const scrub = doc.createElement('input')
  scrub.type = 'range'
  scrub.className = 'tf-ctl-scrub'
  scrub.min = '0'
  scrub.max = '1000'
  scrub.step = '1'
  scrub.setAttribute('aria-label', labels.scrub)
  scrub.addEventListener('input', () => {
    player.pause()
    player.seek((Number(scrub.value) / 1000) * player.duration)
  })

  const step = doc.createElement('span')
  step.className = 'tf-ctl-step'

  const speed = doc.createElement('select')
  speed.className = 'tf-ctl-speed'
  speed.setAttribute('aria-label', labels.speed)
  for (const value of speeds) {
    const option = doc.createElement('option')
    option.value = String(value)
    option.textContent = `${value}×`
    if (value === 1) option.selected = true
    speed.appendChild(option)
  }
  speed.addEventListener('change', () => player.setSpeed(Number(speed.value)))

  bar.append(restart, prev, toggle, next, scrub, step)
  if (speeds.length > 0) bar.append(speed)
  root.append(bar)

  const fullscreen = options.fullscreen ? createFullscreen(container, doc, labels) : undefined
  if (fullscreen) bar.append(fullscreen.button)

  // Captions and questions are announced politely as they change.
  const caption = doc.createElement('p')
  caption.className = 'tf-ctl-caption'
  caption.setAttribute('aria-live', 'polite')
  if (options.captions !== false) root.append(caption)

  const question = doc.createElement('div')
  question.className = 'tf-ctl-question'
  question.hidden = true
  const questionText = doc.createElement('span')
  const reveal = button(labels.reveal, labels.reveal, () => player.play(), 'tf-ctl-primary')
  question.append(questionText, reveal)
  root.append(question)

  const choices = createScenarioChoice(player, doc, labels.scenario, options.scenarioControl ?? 'buttons')
  if (choices) root.append(choices.element)

  const mountPoint = options.mount
  if (mountPoint) mountPoint.appendChild(root)
  else container.insertAdjacentElement('afterend', root)

  const update = () => {
    const playing = player.isPlaying
    toggle.textContent = playing ? '❚❚' : '▶'
    toggle.setAttribute('aria-label', playing ? labels.pause : labels.play)
    toggle.title = playing ? labels.pause : labels.play
    const duration = player.duration
    if (doc.activeElement !== scrub) scrub.value = String(duration > 0 ? Math.round((player.currentTime / duration) * 1000) : 0)

    const markers = player.markers
    prev.hidden = next.hidden = step.hidden = markers.length === 0
    if (markers.length > 0) {
      const current = player.currentMarker
      const index = current ? markers.indexOf(current) + 1 : 0
      step.textContent = labels.stepFormat.replace('{index}', String(index)).replace('{total}', String(markers.length))
      step.setAttribute('aria-label', `${labels.step} ${index} ${labels.of} ${markers.length}`)
      prev.disabled = player.currentTime <= 0.5
      next.disabled = player.currentTime >= duration - 0.5

      const text = player.caption() ?? ''
      if (caption.textContent !== text) caption.textContent = text
      // Figures that draw their step text inside the SVG have nothing to caption:
      // no strip under the bar. With any caption at all, the line keeps its height
      // so the bar does not jump as steps change.
      caption.hidden = !hasAnyCaption()
      const waiting = !playing && current?.question !== undefined && Math.abs(player.currentTime - current.time) < 1
      question.hidden = !waiting
      if (waiting && questionText.textContent !== current!.question) questionText.textContent = current!.question!
    } else {
      question.hidden = true
      caption.hidden = true
    }
    choices?.update()
  }
  const unsubscribe = player.subscribe(update)
  update()

  // Keys only while focus is within this figure (or its controls).
  const scope = options.keyboardScope ?? container
  if (!scope.hasAttribute('tabindex') && scope.tabIndex < 0) scope.tabIndex = 0
  // The bar may sit inside the scope, so one key press can reach both listeners.
  const handled = new WeakSet<Event>()
  const onKey = (event: KeyboardEvent) => {
    if (handled.has(event)) return
    handled.add(event)
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT') return
    if (event.key === ' ' && target.tagName === 'BUTTON') return
    switch (event.key) {
      case ' ':
        event.preventDefault()
        if (player.isPlaying) player.pause()
        else playFromEnd()
        break
      case 'ArrowRight':
        if (!hasMarkers()) return
        event.preventDefault()
        player.next()
        break
      case 'ArrowLeft':
        if (!hasMarkers()) return
        event.preventDefault()
        player.prev()
        break
      case 'Home':
        event.preventDefault()
        player.pause()
        player.seek(0)
        break
      case 'f':
      case 'F':
        if (!fullscreen) return
        event.preventDefault()
        void (fullscreen.active ? fullscreen.exit() : fullscreen.enter())
        break
    }
  }
  scope.addEventListener('keydown', onKey)
  root.addEventListener('keydown', onKey)

  return {
    element: root,
    fullscreen: fullscreen && {
      get active() {
        return fullscreen.active
      },
      enter: fullscreen.enter,
      exit: fullscreen.exit,
    },
    destroy() {
      fullscreen?.destroy()
      unsubscribe()
      scope.removeEventListener('keydown', onKey)
      root.removeEventListener('keydown', onKey)
      root.remove()
    },
  }
}

/** The reader's choice between the player's scenarios, or nothing when there is only one. */
function createScenarioChoice(
  player: TinyflyPlayer,
  doc: Document,
  legend: string,
  kind: 'buttons' | 'slider'
): { element: HTMLElement; update(): void } | undefined {
  const scenarios = player.scenarios
  if (scenarios.length < 2) return undefined

  if (kind === 'slider') {
    const element = doc.createElement('div')
    element.className = 'tf-ctl-choice-slider'
    const name = doc.createElement('span')
    name.textContent = legend
    name.setAttribute('aria-hidden', 'true')
    const slider = doc.createElement('input')
    slider.type = 'range'
    slider.min = '0'
    slider.max = String(scenarios.length - 1)
    slider.step = '1'
    slider.setAttribute('aria-label', legend)
    const output = doc.createElement('output')
    output.setAttribute('aria-hidden', 'true')
    slider.addEventListener('input', () => {
      const chosen = scenarios[Number(slider.value)]
      if (chosen) player.setScenario(chosen.id)
    })
    element.append(name, slider, output)
    const update = () => {
      const index = Math.max(0, scenarios.findIndex((scenario) => scenario.id === player.scenario))
      if (doc.activeElement !== slider) slider.value = String(index)
      const label = scenarios[index].label
      if (output.textContent !== label) output.textContent = label
      slider.setAttribute('aria-valuetext', label)
    }
    return { element, update }
  }

  const element = doc.createElement('fieldset')
  element.className = 'tf-ctl-choices'
  const title = doc.createElement('legend')
  title.textContent = legend
  element.append(title)
  const groupName = `tf-ctl-scenario-${++choiceGroups}`
  const radios = scenarios.map((scenario) => {
    const label = doc.createElement('label')
    label.className = 'tf-ctl-choice'
    const radio = doc.createElement('input')
    radio.type = 'radio'
    radio.name = groupName
    radio.value = scenario.id
    radio.addEventListener('change', () => {
      if (radio.checked) player.setScenario(scenario.id)
    })
    const text = doc.createElement('span')
    text.textContent = scenario.label
    label.append(radio, text)
    element.append(label)
    return radio
  })
  const update = () => {
    for (const radio of radios) {
      const checked = radio.value === player.scenario
      if (radio.checked !== checked) radio.checked = checked
    }
  }
  return { element, update }
}

type FullscreenDocument = Document & {
  webkitFullscreenEnabled?: boolean
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
}
type FullscreenElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }

const EXPAND_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'
const COLLAPSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>'

/**
 * Full screen for one figure. The Fullscreen API when the browser offers it for
 * elements; otherwise, or if the browser refuses, a fixed overlay that covers the
 * viewport and stops the page behind it from scrolling. Both routes add the
 * `tf-fullscreen` class, which the styles use to lay the figure out.
 */
function createFullscreen(container: HTMLElement, doc: Document, labels: ControlLabels) {
  const fsDoc = doc as FullscreenDocument
  const target = container as FullscreenElement
  const button = doc.createElement('button')
  button.type = 'button'
  button.className = 'tf-ctl-btn tf-ctl-fullscreen'

  let mode: 'native' | 'overlay' | undefined
  let savedOverflow = ''

  const render = () => {
    const on = mode !== undefined
    button.innerHTML = on ? COLLAPSE_ICON : EXPAND_ICON
    const label = on ? labels.exitFullscreen : labels.fullscreen
    button.setAttribute('aria-label', label)
    button.title = label
    button.setAttribute('aria-pressed', String(on))
    container.classList.toggle('tf-fullscreen', on)
    container.classList.toggle('tf-fullscreen-overlay', mode === 'overlay')
  }

  const nativeElement = () => fsDoc.fullscreenElement ?? fsDoc.webkitFullscreenElement ?? null
  const onNativeChange = () => {
    if (nativeElement() === container) mode = 'native'
    else if (mode === 'native') mode = undefined
    render()
  }
  const onOverlayKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') void exit()
  }

  const openOverlay = () => {
    mode = 'overlay'
    savedOverflow = doc.documentElement.style.overflow
    doc.documentElement.style.overflow = 'hidden'
    doc.addEventListener('keydown', onOverlayKey)
    render()
  }

  async function enter(): Promise<void> {
    if (mode) return
    const request = target.requestFullscreen?.bind(target) ?? target.webkitRequestFullscreen?.bind(target)
    const enabled = fsDoc.fullscreenEnabled ?? fsDoc.webkitFullscreenEnabled ?? false
    if (request && enabled) {
      try {
        await request()
        if (nativeElement() === container) {
          mode = 'native'
          render()
          return
        }
      } catch {
        // Refused (no user gesture, a policy, an iframe without allowfullscreen): use the overlay.
      }
    }
    openOverlay()
  }

  async function exit(): Promise<void> {
    if (mode === 'overlay') {
      doc.removeEventListener('keydown', onOverlayKey)
      doc.documentElement.style.overflow = savedOverflow
      mode = undefined
      render()
    } else if (mode === 'native') {
      mode = undefined
      render()
      const leave = fsDoc.exitFullscreen?.bind(fsDoc) ?? fsDoc.webkitExitFullscreen?.bind(fsDoc)
      if (nativeElement() === container && leave) await leave()
    }
  }

  button.addEventListener('click', () => void (mode ? exit() : enter()))
  doc.addEventListener('fullscreenchange', onNativeChange)
  doc.addEventListener('webkitfullscreenchange', onNativeChange)
  render()

  return {
    button,
    get active() {
      return mode !== undefined
    },
    enter,
    exit,
    destroy() {
      void exit()
      doc.removeEventListener('fullscreenchange', onNativeChange)
      doc.removeEventListener('webkitfullscreenchange', onNativeChange)
      button.remove()
    },
  }
}
