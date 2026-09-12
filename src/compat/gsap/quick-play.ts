import { Timeline } from '../../engine'
import { DOMAdapter } from '../../adapters/dom'

/**
 * Wire a timeline to the DOM and drive it.
 *
 * This is the twelve lines of boilerplate every tinyfly example opens with —
 * register targets, set `onUpdate`, run a rAF loop — reduced to one call. It is
 * the honest reason GSAP feels lighter than us for a quick animation, and it is
 * worth having whether or not anyone uses the rest of the compat layer.
 *
 * The engine still owns the animation; this only feeds it deltas.
 */

export interface QuickPlayOptions {
  /** Timeline to play */
  timeline: Timeline
  /**
   * Map of target name → element or CSS selector. The adapter resolves each to
   * an element; the engine still only ever sees names.
   */
  targets: Record<string, Element | string>
  /** Start immediately (default: true) */
  autoplay?: boolean
  /** Called on each frame with the engine's state */
  onUpdate?: (state: ReturnType<Timeline['getStateAtTime']>) => void
  /** Called when the timeline completes */
  onComplete?: () => void
}

export interface QuickPlayHandle {
  timeline: Timeline
  adapter: DOMAdapter
  play(): void
  pause(): void
  restart(): void
  seek(seconds: number): void
  /** Stop the loop and release the targets. */
  destroy(): void
}

export function quickPlay(options: QuickPlayOptions): QuickPlayHandle {
  const { timeline } = options
  const adapter = new DOMAdapter()

  for (const [name, elementOrSelector] of Object.entries(options.targets)) {
    const element =
      typeof elementOrSelector === 'string'
        ? document.querySelector(elementOrSelector)
        : elementOrSelector

    if (!element) {
      throw new Error(`quickPlay: no element found for target "${name}" (${String(elementOrSelector)})`)
    }

    adapter.registerTarget(name, element as HTMLElement)
  }

  timeline.onUpdate = (state) => {
    adapter.applyState(state)
    options.onUpdate?.(state)
  }
  if (options.onComplete) timeline.onComplete = options.onComplete

  let rafId: number | null = null
  let lastTime: number | null = null
  let destroyed = false

  const frame = (timestamp: number) => {
    if (destroyed) return

    const delta = lastTime === null ? 0 : timestamp - lastTime
    lastTime = timestamp
    if (delta > 0) timeline.tick(delta)

    rafId = requestAnimationFrame(frame)
  }

  const startLoop = () => {
    if (rafId !== null || destroyed) return
    lastTime = null
    rafId = requestAnimationFrame(frame)
  }

  const stopLoop = () => {
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = null
    lastTime = null
  }

  // Render frame 0 before anything plays, so the page never flashes unstyled.
  adapter.applyState(timeline.getStateAtTime(timeline.currentTime))

  if (options.autoplay !== false) {
    timeline.play()
    startLoop()
  }

  return {
    timeline,
    adapter,
    play() {
      timeline.play()
      startLoop()
    },
    pause() {
      timeline.pause()
      stopLoop()
    },
    restart() {
      timeline.stop()
      timeline.play()
      startLoop()
    },
    seek(seconds: number) {
      timeline.seek(seconds * 1000)
      adapter.applyState(timeline.getStateAtTime(timeline.currentTime))
    },
    destroy() {
      destroyed = true
      stopLoop()
      timeline.stop()
      adapter.clearTargets()
    },
  }
}
