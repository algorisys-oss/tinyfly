import { createLive, Stage, type FrameScheduler, type LiveApi, type LiveTimeline } from '../compat/gsap'
import { deserializeTimeline, type AnimatableValue, type Timeline, type TimelineDefinition } from '../engine'
import { DOMAdapter } from '../adapters/dom'
import type { CheckContext, Step } from './types'

/**
 * Runs a step's code: a fresh stage scoped to the preview, the step's markup, the
 * learner's code with `live` and `play` in scope, and a record of every timeline
 * it builds. `play(animation)` plays a timeline written as JSON on the preview's
 * `data-tinyfly` elements, for lessons about the data itself.
 * Checks then read those timelines — their JSON, and their state at any time —
 * so a result never depends on how far playback has got.
 */

/** A timeline the preview can pause, scrub and replay: a live timeline, or one `play()` started. */
export interface Playable {
  readonly timeline: Timeline
  pause(): unknown
  restart(): unknown
  progress(value?: number): number
  duration(): number
  toDefinition(): TimelineDefinition
}

export interface RunResult {
  error?: string
  context: CheckContext
  timelines: Playable[]
  /** Stop everything the run started */
  destroy(): void
}

export interface RunOptions {
  /** Frame scheduling for the preview (default: requestAnimationFrame). Tests pass a manual one. */
  scheduler?: FrameScheduler
  /** Answer `prefers-reduced-motion` queries this way while the code runs, instead of asking the browser */
  reducedMotion?: boolean
}

export function runStep(step: Step, code: string, root: HTMLElement, options: RunOptions = {}): RunResult {
  root.innerHTML = step.markup
  const stage = new Stage({ root, scheduler: options.scheduler })
  const live = createLive(stage)
  const timelines: Playable[] = []
  const keep = (timeline: LiveTimeline) => (timelines.push(timeline), timeline)
  const play = (definition: TimelineDefinition) => {
    const playable = playDefinition(definition, root, live)
    timelines.push(playable)
    return playable
  }
  const calls: { method: string; args: unknown[] }[] = []
  const record = <F extends (...args: never[]) => unknown>(method: string, fn: F): F =>
    ((...args: Parameters<F>) => {
      calls.push({ method, args })
      return fn(...args)
    }) as F
  const recording: LiveApi = {
    ...live,
    draggable: record('draggable', live.draggable),
    flip: record('flip', live.flip),
    getFlipState: record('getFlipState', live.getFlipState),
    flipFrom: record('flipFrom', live.flipFrom),
    splitText: record('splitText', live.splitText),
    scrollTrigger: record('scrollTrigger', live.scrollTrigger),
    imageSequence: record('imageSequence', live.imageSequence),
    pageTransition: record('pageTransition', live.pageTransition),
    quickTo: record('quickTo', (target, property, vars) => {
      const setter = live.quickTo(target, property, vars)
      timelines.push(setter.tween)
      return setter
    }),
    ticker: { add: record('ticker.add', live.ticker.add), remove: record('ticker.remove', live.ticker.remove) },
    to: record('to', (target, vars) => keep(live.to(target, vars))),
    from: record('from', (target, vars) => keep(live.from(target, vars))),
    fromTo: record('fromTo', (target, fromVars, toVars) => keep(live.fromTo(target, fromVars, toVars))),
    set: record('set', (target, vars) => keep(live.set(target, vars))),
    timeline: record('timeline', (timelineOptions) => keep(live.timeline(timelineOptions))),
  }

  let error: string | undefined
  const restoreMedia = options.reducedMotion === undefined ? undefined : emulateReducedMotion(options.reducedMotion)
  try {
    new Function('live', 'play', 'root', code)(recording, play, root)
  } catch (thrown) {
    error = thrown instanceof Error ? thrown.message : String(thrown)
  } finally {
    restoreMedia?.()
  }
  const reruns: RunResult[] = []

  // An element is known by its stage name (live) and by its data-tinyfly name (play).
  const namesFor = (selector: string): string[] =>
    [...root.querySelectorAll(selector)].flatMap((element) => {
      const dataName = element.getAttribute('data-tinyfly')
      return [...(dataName ? [dataName] : []), ...stage.resolveTargets(element)]
    })

  const context: CheckContext = {
    root,
    get definitions(): TimelineDefinition[] {
      return timelines.map((timeline) => timeline.toDefinition())
    },
    targets: namesFor,
    tracks(selector, property) {
      const names = selector ? new Set(namesFor(selector)) : undefined
      return timelines.flatMap((timeline) =>
        timeline.toDefinition().tracks.filter((track) => {
          const covered = [track.target, ...(track.targets ?? [])]
          return (!names || covered.some((name) => names.has(name))) && (!property || track.property === property)
        })
      )
    },
    valueAt(selector, property, seconds) {
      const element = root.querySelector(selector)
      if (!element) return undefined
      const names = namesFor(selector).slice(0, element.hasAttribute('data-tinyfly') ? 2 : 1)
      let value: AnimatableValue | undefined
      // Later timelines win, as they do on the stage.
      for (const timeline of timelines) {
        const engine = timeline.timeline
        const state = engine.getStateAtTime(Math.min(seconds * 1000, engine.duration))
        for (const name of names) {
          const next = state.values.get(name)?.get(property)
          if (next !== undefined) value = next
        }
      }
      return value
    },
    calls: (method) => (method ? calls.filter((call) => call.method === method) : [...calls]),
    fire(selector, type, init = {}) {
      const element = root.querySelector(selector)
      if (!element) throw new Error(`There is no \`${selector}\` in the preview.`)
      const EventType = type.startsWith('pointer') && typeof PointerEvent === 'function' ? PointerEvent : MouseEvent
      element.dispatchEvent(new EventType(type, { bubbles: true, cancelable: true, clientX: init.clientX ?? 0, clientY: init.clientY ?? 0 }))
    },
    rerun(rerunOptions) {
      const again = runStep(step, code, offscreenRoot(root), { ...options, ...rerunOptions })
      reruns.push(again)
      if (again.error) throw new Error(again.error)
      return again.context
    },
    duration() {
      return timelines.reduce((longest, timeline) => {
        const config = timeline.timeline.toDefinition().config
        if (config.loop === -1) return Infinity
        return Math.max(longest, timeline.duration() * ((config.loop ?? 0) + 1))
      }, 0)
    },
  }

  return {
    error,
    context,
    timelines,
    destroy: () => {
      for (const again of reruns.splice(0)) again.destroy()
      stage.destroy()
      if (root.hasAttribute('data-learn-offscreen')) root.remove()
    },
  }
}

export interface CheckResult {
  label: string
  passed: boolean
  message?: string
}

/**
 * Check code without touching the preview: run it again in a hidden copy laid out
 * at the preview's width, where nothing plays, so checks can fire clicks and hovers
 * freely. The copy is removed afterwards.
 */
export function checkIsolated(step: Step, code: string, preview: HTMLElement): CheckResult[] {
  const root = offscreenRoot(preview)
  const run = runStep(step, code, root, { scheduler: { request: () => 0, cancel: () => {} } })
  try {
    return checkStep(step, run)
  } finally {
    run.destroy()
  }
}

/** Run a step's checks against a run. A check that throws fails with its error. */
export function checkStep(step: Step, run: RunResult): CheckResult[] {
  if (run.error) return step.checks.map((check) => ({ label: check.label, passed: false, message: run.error }))
  return step.checks.map((check) => {
    try {
      const outcome = check.test(run.context)
      return outcome === true ? { label: check.label, passed: true } : { label: check.label, passed: false, message: outcome }
    } catch (thrown) {
      return { label: check.label, passed: false, message: thrown instanceof Error ? thrown.message : String(thrown) }
    }
  })
}

/**
 * Play a timeline definition on the preview: its tracks target `data-tinyfly`
 * names. It runs on the stage's frame loop (so it stops with the run), loops as
 * its config says, and can be paused, scrubbed and replayed like a live timeline.
 */
function playDefinition(definition: TimelineDefinition, root: HTMLElement, live: LiveApi): Playable {
  const timeline = deserializeTimeline(definition)
  // JSON copied from the studio names its own elements; give any target the
  // preview doesn't have a placeholder box, so it still has something to move.
  const missing = [...new Set(timeline.tracks.flatMap((track) => [track.target, ...(track.targets ?? [])]))].filter(
    (name) => ![...root.querySelectorAll('[data-tinyfly]')].some((element) => element.getAttribute('data-tinyfly') === name)
  )
  if (missing.length) {
    const holder = root.querySelector('.stage') ?? root
    for (const name of missing) {
      const box = root.ownerDocument.createElement('div')
      box.className = 'box placeholder'
      box.setAttribute('data-tinyfly', name)
      box.title = name
      holder.appendChild(box)
    }
  }
  const adapter = new DOMAdapter()
  for (const element of root.querySelectorAll('[data-tinyfly]')) {
    adapter.registerTarget(element.getAttribute('data-tinyfly')!, element as HTMLElement)
  }
  const render = () => adapter.applyState(timeline.getStateAtTime(timeline.currentTime))
  let playing = true
  live.ticker.add((_time, deltaTime) => {
    if (!playing) return
    timeline.tick(deltaTime)
    render()
  })
  timeline.play()
  render()

  return {
    timeline,
    pause: () => {
      playing = false
      timeline.pause()
    },
    restart: () => {
      timeline.stop()
      timeline.play()
      playing = true
      render()
    },
    progress: (value?: number) => {
      const duration = timeline.duration
      if (value !== undefined && duration > 0) {
        timeline.seek(value * duration)
        render()
      }
      return duration > 0 ? timeline.currentTime / duration : 0
    },
    duration: () => timeline.duration / 1000,
    toDefinition: () => timeline.toDefinition(),
  }
}

/**
 * Make `window.matchMedia` answer `prefers-reduced-motion` queries as given (other
 * queries still ask the browser) until the returned function restores it. Setups
 * read `matches` when they are added, so this only needs to last while code runs.
 */
function emulateReducedMotion(reduce: boolean): () => void {
  if (typeof window === 'undefined') return () => {}
  const original = window.matchMedia
  window.matchMedia = (query: string) => {
    const emulated = /prefers-reduced-motion:\s*reduce/.test(query) ? reduce : /prefers-reduced-motion:\s*no-preference/.test(query) ? !reduce : undefined
    if (emulated === undefined && typeof original === 'function') return original.call(window, query)
    return {
      matches: emulated ?? false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList
  }
  return () => {
    window.matchMedia = original
  }
}

/**
 * A hidden element beside `like`, as wide, for running code out of sight. It is in
 * the document, so text wraps and SVG measures as in the preview; it is removed
 * when the run using it is destroyed. Outside a document it is simply detached.
 */
function offscreenRoot(like: HTMLElement): HTMLElement {
  const document = like.ownerDocument
  const root = document.createElement('div')
  root.setAttribute('data-learn-offscreen', '')
  root.setAttribute('aria-hidden', 'true')
  const width = like.getBoundingClientRect().width
  Object.assign(root.style, { position: 'fixed', left: '-10000px', top: '0', width: width > 0 ? `${width}px` : '600px', visibility: 'hidden', pointerEvents: 'none' })
  if (like.isConnected) document.body.appendChild(root)
  return root
}
