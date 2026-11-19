import { DeckState, type DeckSlideSpec, type DeckTimer, type DeckTimerFrame } from './deck-state'
import { DEFAULT_DECK_LABELS, fillLabel, type DeckLabels } from './deck-labels'
import { DECK_CSS } from './deck-styles'
import { createPresenterView, type PresenterView } from './presenter-view'

/**
 * A presentation on a page: slides stepped through with a clicker or the
 * keyboard, each with an optional scene that plays as the presenter clicks.
 *
 *     <main id="deck">
 *       <section data-slide="intro" data-title="Hello">
 *         <h1>Hello</h1>
 *         <p data-step="1">Shown on the first click</p>
 *         <aside data-notes>What to say here.</aside>
 *       </section>
 *     </main>
 *     <script>tinyfly.createDeck('#deck', { scenes: { intro: () => ({ marks: [800, 2400], draw }) } })</script>
 *
 * Markup:
 * - `[data-slide="id"]` is a slide; `data-title` names it for the presenter.
 * - `[data-step="k"]` appears on click `k` and stays (`data-reveal`: `pop`,
 *   `fade` or `none` instead of the default rise). It gets `tf-on` from its step
 *   on and `tf-now` on its step, for the page's own CSS.
 * - `[data-notes]` holds the slide's speaker notes (never shown on the slide).
 * - `<button data-timer="30">` is a countdown of that many seconds on the step
 *   of the `[data-step]` around it. Next starts it, Next again ends it early.
 * - `canvas[data-scene]` is where the slide's scene draws; one is added when
 *   the scene draws and the slide has none.
 *
 * The deck is a fixed-size stage (1920 × 1080 by default) scaled to fit the
 * window, so every layout is in the same pixels on any screen.
 */

/** What a scene is given each frame. */
export interface DeckFrame {
  /** The slide's scene clock in ms: plays up to the current step's mark and waits there */
  time: number
  /** A clock that never stops, in ms, for motion that loops while the scene waits */
  clock: number
  /** The slide's current step (0 until the first click) */
  step: number
  /** The slide's countdown while it runs and after it ends, or null */
  timer: DeckTimerFrame | null
  width: number
  height: number
}

export interface DeckScene {
  /** Scene times in ms: `marks[0]` ends the entrance, `marks[k]` ends click `k` */
  marks?: number[]
  /** Paint the slide's canvas (already cleared) */
  draw?(ctx: CanvasRenderingContext2D, frame: DeckFrame): void
  /** Update anything else for this frame (SVG, DOM, a tinyfly timeline's seek) */
  update?(frame: DeckFrame): void
}

export interface DeckSceneContext {
  width: number
  height: number
  /** The slide's element */
  el: HTMLElement
}

/** Builds a slide's scene, the first time the slide (or the one before it) is shown. */
export type DeckSceneFactory = (context: DeckSceneContext) => DeckScene

export interface DeckOptions {
  /** Stage size in px (default 1920 × 1080) */
  width?: number
  height?: number
  /** Scene factories by slide id */
  scenes?: Record<string, DeckSceneFactory>
  /** The deck's name, for the presenter window (default: the page title) */
  title?: string
  /** The talk's length in minutes, for the presenter's countdown */
  slotMinutes?: number
  /** Visible text; missing entries use English */
  labels?: Partial<DeckLabels>
  /** Keep the slide and step in the URL hash (`#5.2`) and start from it (default true) */
  hash?: boolean
  /** Listen for keys on the window (default true) */
  keyboard?: boolean
  /** Scale the stage to its container, or the window when that is `<body>` (default true) */
  fit?: boolean
  /** Run the frame loop (default true). With false, call `render(now)` yourself */
  autoStart?: boolean
  /** Called after every change of slide, step or countdown */
  onChange?: (deck: Deck) => void
}

export interface Deck {
  readonly state: DeckState
  readonly element: HTMLElement
  next(): void
  prev(): void
  /** Show a slide by its number (1 is the first) at a step, playing into it */
  goTo(slide: number, step?: number | 'last'): void
  /**
   * Show a slide exactly as a step ends, or at scene time `ms`: for rehearsing
   * and for screenshots of one moment.
   */
  seek(slide: number, step?: number | 'last', ms?: number): void
  replay(): void
  /** Start or end the current step's countdown */
  toggleTimer(): void
  /** Toggle a black or white screen */
  blank(kind?: 'black' | 'white'): void
  openPresenter(): void
  /** Advance and draw one frame at `now` (ms). The frame loop calls this */
  render(now: number): void
  destroy(): void
}

interface SlideView {
  el: HTMLElement
  fragments: HTMLElement[]
  timerButtons: HTMLElement[]
  canvas: HTMLCanvasElement | null
  ctx: CanvasRenderingContext2D | null
  scene: DeckScene | null
  built: boolean
}

const NEXT_KEYS = ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter', 'n', 'N']
const PREV_KEYS = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace']
const INTERACTIVE = 'a, button, input, select, textarea, label, [data-timer]'
const IDLE_MS = 2000
const GOTO_MS = 2500
/** A tab left in the background must not jump the scene on return. */
const MAX_FRAME_MS = 100

function stepOf(el: Element | null): number {
  return el ? Math.max(0, Number((el as HTMLElement).dataset.step) || 0) : 0
}

function injectStyles(doc: Document): void {
  if (doc.querySelector('style[data-tinyfly-deck]')) return
  const style = doc.createElement('style')
  style.setAttribute('data-tinyfly-deck', '')
  style.textContent = DECK_CSS
  doc.head.appendChild(style)
}

function fillHelp(help: HTMLElement, labels: DeckLabels): void {
  const rows: [string[], string][] = [
    [['→', 'Space', 'N'], labels.helpNext],
    [['←', 'Backspace'], labels.helpPrev],
    [['1…9', 'Enter'], labels.helpGoTo],
    [['Home', 'End'], labels.helpEnds],
    [['B', 'W'], labels.helpBlank],
    [['F'], labels.helpFullscreen],
    [['R'], labels.helpReplay],
    [['T'], labels.helpTimer],
    [['P'], labels.helpPresenter],
    [['?'], labels.helpHelp],
  ]
  const doc = help.ownerDocument
  const heading = doc.createElement('h2')
  heading.textContent = labels.helpTitle
  const table = doc.createElement('table')
  for (const [keys, text] of rows) {
    const row = table.insertRow()
    const keyCell = row.insertCell()
    for (const key of keys) {
      const kbd = doc.createElement('kbd')
      kbd.textContent = key
      keyCell.appendChild(kbd)
    }
    row.insertCell().textContent = text
  }
  help.replaceChildren(heading, table)
}

export function createDeck(root: HTMLElement | string, options: DeckOptions = {}): Deck {
  const found = typeof root === 'string' ? document.querySelector<HTMLElement>(root) : root
  if (!found) throw new Error(`createDeck: no element matches ${String(root)}`)
  const element: HTMLElement = found
  const doc = element.ownerDocument
  const view = doc.defaultView as Window
  const width = options.width ?? 1920
  const height = options.height ?? 1080
  const labels: DeckLabels = { ...DEFAULT_DECK_LABELS, ...options.labels }
  const scenes = options.scenes ?? {}
  const useHash = options.hash !== false
  const fitsWindow = options.fit !== false && element.parentElement === doc.body

  injectStyles(doc)
  element.classList.add('tf-deck')
  element.style.width = `${width}px`
  element.style.height = `${height}px`
  if (fitsWindow) doc.documentElement.classList.add('tf-deck-page')

  // ---- Slides ---------------------------------------------------------------
  const slideEls = [...element.querySelectorAll<HTMLElement>('[data-slide]')]
  if (slideEls.length === 0) throw new Error('createDeck: the deck has no [data-slide] elements')
  const views: SlideView[] = []
  const specs: DeckSlideSpec[] = slideEls.map((el) => {
    const fragments = [...el.querySelectorAll<HTMLElement>('[data-step]')]
    const timerButtons = [...el.querySelectorAll<HTMLElement>('[data-timer]')]
    views.push({ el, fragments, timerButtons, canvas: el.querySelector('canvas[data-scene]'), ctx: null, scene: null, built: false })
    return {
      id: el.dataset.slide || '',
      title: el.dataset.title,
      notes: [...el.querySelectorAll('[data-notes]')].map((note) => (note.textContent || '').trim()).join('\n\n'),
      fragmentSteps: fragments.reduce((max, fragment) => Math.max(max, stepOf(fragment)), 0),
      timers: timerButtons.map((button) => ({
        step: stepOf(button.closest('[data-step]')),
        seconds: Number(button.dataset.timer) > 0 ? Number(button.dataset.timer) : 30,
      })),
    }
  })
  const state = new DeckState(specs)

  // ---- Overlays -------------------------------------------------------------
  const overlay = (className: string): HTMLElement => {
    const el = doc.createElement('div')
    el.className = className
    element.appendChild(el)
    return el
  }
  const progress = overlay('tf-deck-progress')
  const blankEl = overlay('tf-deck-blank')
  const gotoEl = overlay('tf-deck-goto')
  const help = overlay('tf-deck-help')
  fillHelp(help, labels)

  let shown = -1
  let destroyed = false

  /** Build a slide's scene and canvas the first time it is needed. */
  function build(index: number): void {
    const slideView = views[index]
    if (!slideView || slideView.built) return
    slideView.built = true
    const id = state.slides[index].id
    const factory = scenes[id]
    if (!factory) return
    try {
      slideView.scene = factory({ width, height, el: slideView.el })
    } catch (error) {
      console.error(`tinyfly deck: the scene for slide "${id}" failed to build`, error)
      return
    }
    const scene = slideView.scene
    if (scene.draw) {
      if (!slideView.canvas) {
        slideView.canvas = doc.createElement('canvas')
        slideView.canvas.setAttribute('data-scene', '')
        slideView.el.appendChild(slideView.canvas)
      }
      slideView.canvas.width = width
      slideView.canvas.height = height
      slideView.ctx = slideView.canvas.getContext('2d')
    }
    state.setMarks(index, scene.marks)
  }

  // ---- Writing the state to the page -----------------------------------------
  function renderTimer(button: HTMLElement, timer: DeckTimer, now: number): void {
    button.dataset.state = timer.state
    const holder = button.closest<HTMLElement>('[data-step]')
    if (holder) holder.dataset.timerState = timer.state
    if (timer.state === 'running') {
      const left = state.secondsLeft(timer, now)
      const done = (100 * (1 - left / timer.seconds)).toFixed(1)
      button.innerHTML = `<i style="width:${done}%"></i><b>${Math.ceil(left) || 1}</b>`
    } else {
      const span = doc.createElement('span')
      span.textContent = timer.state === 'done' ? labels.timerDone : fillLabel(labels.timerStart, { seconds: timer.seconds })
      button.replaceChildren(span)
    }
  }

  function renderTimers(index: number, now: number): void {
    views[index].timerButtons.forEach((button, k) => renderTimer(button, state.slides[index].timers[k], now))
  }

  function sync(now: number = view.performance.now()): void {
    const index = state.index
    const slide = state.slide
    if (shown !== index) {
      if (shown >= 0) {
        views[shown].el.classList.remove('tf-current')
        renderTimers(shown, now)
      }
      views[index].el.classList.add('tf-current')
      shown = index
      // Build the next slide ahead of time so its first frame is instant.
      if (views[index + 1] && !views[index + 1].built) view.setTimeout(() => !destroyed && build(index + 1), 50)
    }
    for (const fragment of views[index].fragments) {
      const k = stepOf(fragment)
      fragment.classList.toggle('tf-on', slide.step >= k)
      fragment.classList.toggle('tf-now', slide.step === k)
    }
    views[index].el.dataset.currentStep = String(slide.step)
    renderTimers(index, now)
    const last = state.slides.length - 1
    progress.style.width = `${last > 0 ? (index / last) * 100 : 100}%`
    if (useHash) {
      try {
        view.history.replaceState(null, '', `#${index + 1}${slide.step ? `.${slide.step}` : ''}`)
      } catch {
        // Some embedders forbid changing the URL; the deck works without it.
      }
    }
    presenter.update()
    options.onChange?.(deck)
  }

  function show(index: number, step: number | 'last', play: boolean): void {
    const i = Math.max(0, Math.min(state.slides.length - 1, index))
    build(i)
    state.goTo(i, step, { play })
    sync()
  }

  // ---- Commands -------------------------------------------------------------
  function next(): void {
    // The slide after this one may not be built yet (a jump, then a fast click).
    if (state.slide.step >= state.slide.steps) build(state.index + 1)
    state.next(view.performance.now())
    sync()
  }

  function prev(): void {
    if (state.slide.step === 0) build(state.index - 1)
    if (state.prev()) sync()
  }

  function toggleTimer(timer?: DeckTimer): void {
    if (state.toggleTimer(view.performance.now(), timer ?? state.stepTimer())) sync()
  }

  function blank(kind: 'black' | 'white' = 'black'): void {
    const white = kind === 'white'
    const on = !(blankEl.classList.contains('tf-on') && blankEl.classList.contains('tf-white') === white)
    blankEl.classList.toggle('tf-white', white)
    blankEl.classList.toggle('tf-on', on)
  }

  function fullscreen(): void {
    if (doc.fullscreenElement) void doc.exitFullscreen()
    else void doc.documentElement.requestFullscreen?.().catch(() => {})
  }

  // ---- Typing a slide number --------------------------------------------------
  let digits = ''
  let digitTimeout: ReturnType<typeof setTimeout> | undefined
  function setDigits(value: string): void {
    digits = value
    gotoEl.classList.toggle('tf-on', value !== '')
    gotoEl.textContent = fillLabel(labels.goTo, { slide: value })
    clearTimeout(digitTimeout)
    if (value) digitTimeout = setTimeout(() => setDigits(''), GOTO_MS)
  }

  // ---- Input ----------------------------------------------------------------
  function onKey(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    const key = event.key
    if (/^[0-9]$/.test(key)) setDigits(digits + key)
    else if (key === 'Enter' && digits) {
      show(parseInt(digits, 10) - 1, 0, true)
      setDigits('')
    } else if (NEXT_KEYS.includes(key)) next()
    else if (PREV_KEYS.includes(key)) prev()
    else if (key === 'Home') show(0, 0, true)
    else if (key === 'End') show(state.slides.length - 1, 'last', false)
    else if (key === 'b' || key === 'B' || key === '.') blank('black')
    else if (key === 'w' || key === 'W' || key === ',') blank('white')
    else if (key === 'f' || key === 'F' || key === 'F5') fullscreen()
    else if (key === 'r' || key === 'R') {
      state.replay()
      sync()
    } else if (key === 't' || key === 'T') toggleTimer()
    else if (key === 'p' || key === 'P') presenter.open()
    else if (key === '?' || key === 'h' || key === 'H') help.classList.toggle('tf-on')
    else if (key === 'Escape') {
      help.classList.remove('tf-on')
      blankEl.classList.remove('tf-on')
      setDigits('')
    } else return
    event.preventDefault()
  }

  function onClick(event: MouseEvent): void {
    const target = event.target as Element | null
    const button = target?.closest<HTMLElement>('[data-timer]')
    if (button) {
      const k = views[state.index].timerButtons.indexOf(button)
      if (k >= 0) toggleTimer(state.slide.timers[k])
      return
    }
    if (target?.closest(INTERACTIVE)) return
    next()
  }

  function onContextMenu(event: MouseEvent): void {
    event.preventDefault()
    prev()
  }

  let idleTimeout: ReturnType<typeof setTimeout> | undefined
  function onMouseMove(): void {
    element.classList.remove('tf-idle')
    clearTimeout(idleTimeout)
    idleTimeout = setTimeout(() => element.classList.add('tf-idle'), IDLE_MS)
  }

  // ---- Fitting the stage --------------------------------------------------------
  function fit(): void {
    const parent = element.parentElement
    const availableWidth = fitsWindow || !parent ? view.innerWidth : parent.clientWidth
    const availableHeight = fitsWindow || !parent ? view.innerHeight : parent.clientHeight
    if (!(availableWidth > 0 && availableHeight > 0)) return
    const scale = Math.min(availableWidth / width, availableHeight / height)
    const x = (availableWidth - width * scale) / 2
    const y = (availableHeight - height * scale) / 2
    element.style.transform = `translate(${x}px, ${y}px) scale(${scale})`
  }

  // ---- Frames -----------------------------------------------------------------
  let lastFrame: number | null = null
  function render(now: number): void {
    const dt = lastFrame === null ? 0 : Math.min(MAX_FRAME_MS, now - lastFrame)
    lastFrame = now
    const slide = state.slide
    const running = slide.timers.filter((timer) => timer.state === 'running').length
    state.advance(dt, now)
    const stillRunning = slide.timers.filter((timer) => timer.state === 'running').length
    if (stillRunning !== running) sync(now)
    else if (running > 0) renderTimers(state.index, now)

    const slideView = views[state.index]
    const scene = slideView.scene
    if (!scene) return
    const frame: DeckFrame = { time: slide.time, clock: now, step: slide.step, timer: state.timerFrame(now), width, height }
    try {
      scene.update?.(frame)
      if (scene.draw && slideView.ctx) {
        slideView.ctx.clearRect(0, 0, width, height)
        scene.draw(slideView.ctx, frame)
      }
    } catch (error) {
      console.error(`tinyfly deck: the scene for slide "${slide.id}" failed and was stopped`, error)
      slideView.scene = null
    }
  }

  let raf = 0
  function loop(now: number): void {
    if (destroyed) return
    render(now)
    raf = view.requestAnimationFrame(loop)
  }

  function destroy(): void {
    if (destroyed) return
    destroyed = true
    view.cancelAnimationFrame(raf)
    clearTimeout(digitTimeout)
    clearTimeout(idleTimeout)
    view.removeEventListener('keydown', onKey)
    view.removeEventListener('resize', fit)
    view.removeEventListener('mousemove', onMouseMove)
    element.removeEventListener('click', onClick)
    element.removeEventListener('contextmenu', onContextMenu)
    presenter.close()
    for (const el of [progress, blankEl, gotoEl, help]) el.remove()
    if (fitsWindow) doc.documentElement.classList.remove('tf-deck-page')
  }

  const deck: Deck = {
    state,
    element,
    next,
    prev,
    goTo: (slide, step = 0) => show(slide - 1, step, true),
    seek(slide, step = 0, ms) {
      show(slide - 1, step, false)
      if (ms !== undefined) state.slide.time = state.slide.target = ms
    },
    replay() {
      state.replay()
      sync()
    },
    toggleTimer: () => toggleTimer(),
    blank,
    openPresenter: () => presenter.open(),
    render,
    destroy,
  }

  const presenter: PresenterView = createPresenterView({
    state,
    labels,
    title: options.title ?? doc.title,
    slotMinutes: options.slotMinutes,
    onNext: next,
    onPrev: prev,
    onKey,
  })

  // ---- Start ------------------------------------------------------------------
  if (options.keyboard !== false) view.addEventListener('keydown', onKey)
  element.addEventListener('click', onClick)
  element.addEventListener('contextmenu', onContextMenu)
  view.addEventListener('mousemove', onMouseMove)
  if (options.fit !== false) {
    view.addEventListener('resize', fit)
    fit()
  }
  const fromHash = useHash ? /^#(\d+)(?:\.(\d+))?/.exec(view.location.hash) : null
  if (fromHash) show(Number(fromHash[1]) - 1, Number(fromHash[2] || 0), false)
  else show(0, 0, true)
  if (options.autoStart !== false) raf = view.requestAnimationFrame(loop)

  return deck
}
