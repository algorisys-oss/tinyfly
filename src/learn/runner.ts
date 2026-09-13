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
  const recording: LiveApi = {
    ...live,
    to: (target, vars) => keep(live.to(target, vars)),
    from: (target, vars) => keep(live.from(target, vars)),
    fromTo: (target, fromVars, toVars) => keep(live.fromTo(target, fromVars, toVars)),
    set: (target, vars) => keep(live.set(target, vars)),
    timeline: (timelineOptions) => keep(live.timeline(timelineOptions)),
  }

  let error: string | undefined
  try {
    new Function('live', 'play', 'root', code)(recording, play, root)
  } catch (thrown) {
    error = thrown instanceof Error ? thrown.message : String(thrown)
  }

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
    duration() {
      return timelines.reduce((longest, timeline) => {
        const config = timeline.timeline.toDefinition().config
        if (config.loop === -1) return Infinity
        return Math.max(longest, timeline.duration() * ((config.loop ?? 0) + 1))
      }, 0)
    },
  }

  return { error, context, timelines, destroy: () => stage.destroy() }
}

export interface CheckResult {
  label: string
  passed: boolean
  message?: string
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
