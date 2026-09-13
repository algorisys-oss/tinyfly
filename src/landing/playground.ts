import { createLive, Stage, type LiveApi, type LiveTimeline } from '../compat/gsap'

/**
 * The landing page's "code becomes motion" panel: edit a few lines of `live`
 * code and see the animation and the JSON it compiles to.
 *
 * Each run gets a fresh stage scoped to the preview, so selectors only match the
 * preview's boxes and nothing from the previous run keeps playing. The code is
 * the visitor's own, run in their own page, the same as pasting it into a console.
 */

export const DEFAULT_SNIPPET = `live.timeline({ repeat: -1, yoyo: true, repeatDelay: 0.4 })
  .to('.box', { x: 160, rotate: 180, duration: 1, ease: 'power3.inOut', stagger: 0.12 })
  .to('.box', { scale: 0.5, duration: 0.5, ease: 'back.out' }, '-=0.3')`

const PREVIEW_MARKUP = '<div class="box"></div><div class="box"></div><div class="box"></div>'

export interface PlaygroundResult {
  /** The compiled timelines, as JSON text; empty when nothing was built */
  json: string
  error?: string
}

export interface Playground {
  run(code: string): PlaygroundResult
  destroy(): void
}

export function createPlayground(preview: HTMLElement): Playground {
  let stage: Stage | undefined

  const reset = () => {
    stage?.destroy()
    preview.innerHTML = PREVIEW_MARKUP
    stage = new Stage({ root: preview })
    return createLive(stage)
  }

  return {
    run(code) {
      const live = reset()
      const built: LiveTimeline[] = []
      // Record what the snippet builds, to show its JSON.
      const recording: LiveApi = {
        ...live,
        to: (target, vars) => keep(built, live.to(target, vars)),
        from: (target, vars) => keep(built, live.from(target, vars)),
        fromTo: (target, fromVars, toVars) => keep(built, live.fromTo(target, fromVars, toVars)),
        set: (target, vars) => keep(built, live.set(target, vars)),
        timeline: (options) => keep(built, live.timeline(options)),
      }
      try {
        new Function('live', code)(recording)
      } catch (error) {
        return { json: '', error: error instanceof Error ? error.message : String(error) }
      }
      const definitions = built.map((timeline) => timeline.toDefinition())
      return { json: JSON.stringify(definitions.length === 1 ? definitions[0] : definitions, null, 2) }
    },
    destroy() {
      stage?.destroy()
      stage = undefined
    },
  }
}

function keep(list: LiveTimeline[], timeline: LiveTimeline): LiveTimeline {
  list.push(timeline)
  return timeline
}
