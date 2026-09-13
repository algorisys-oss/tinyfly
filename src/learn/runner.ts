import { createLive, Stage, type FrameScheduler, type LiveApi, type LiveTimeline } from '../compat/gsap'
import type { AnimatableValue, TimelineDefinition } from '../engine'
import type { CheckContext, Step } from './types'

/**
 * Runs a step's code: a fresh stage scoped to the preview, the step's markup, the
 * learner's code with `live` in scope, and a record of every timeline it builds.
 * Checks then read those timelines — their JSON, and their state at any time —
 * so a result never depends on how far playback has got.
 */

export interface RunResult {
  error?: string
  context: CheckContext
  timelines: LiveTimeline[]
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
  const timelines: LiveTimeline[] = []
  const keep = (timeline: LiveTimeline) => (timelines.push(timeline), timeline)
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
    new Function('live', 'root', code)(recording, root)
  } catch (thrown) {
    error = thrown instanceof Error ? thrown.message : String(thrown)
  }

  const namesFor = (selector: string): string[] => {
    const elements = [...root.querySelectorAll(selector)]
    return elements.flatMap((element) => stage.resolveTargets(element))
  }

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
      const [name] = namesFor(selector)
      if (!name) return undefined
      let value: AnimatableValue | undefined
      // Later timelines win, as they do on the stage.
      for (const timeline of timelines) {
        const engine = timeline.timeline
        const state = engine.getStateAtTime(Math.min(seconds * 1000, engine.duration))
        const next = state.values.get(name)?.get(property)
        if (next !== undefined) value = next
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
