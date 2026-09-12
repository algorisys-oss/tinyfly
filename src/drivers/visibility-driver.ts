import type { Timeline } from '../engine'
import type { Driver } from './types'

/**
 * Plays a timeline when its trigger element scrolls into view.
 *
 * This covers the single most common scroll-related request — "animate it when
 * it appears" — without any of the geometry that scrubbing needs. If you want
 * the animation tied to scroll *position*, use `ScrollDriver` instead.
 */

export type VisibilityBehaviour =
  /** Play the first time it appears, then never again (default) */
  | 'once'
  /** Play every time it appears */
  | 'repeat'
  /** Play on appear, and rewind to the start when it leaves */
  | 'reset'

export interface VisibilityDriverOptions {
  /** The timeline to play */
  timeline: Timeline
  /** Element whose visibility gates playback */
  trigger: Element
  /** What to do on each appearance (default: 'once') */
  behaviour?: VisibilityBehaviour
  /**
   * Fraction of the element that must be visible to count as "in view", 0..1
   * (default: 0.15). Passed straight to IntersectionObserver.
   */
  threshold?: number
  /** Margin around the viewport, in CSS margin syntax (e.g. '0px 0px -10% 0px') */
  rootMargin?: string
  /** Scroll container, when not the viewport */
  root?: Element | null
  /** Called whenever the trigger enters the viewport */
  onEnter?: () => void
  /** Called whenever the trigger leaves the viewport */
  onLeave?: () => void
}

export class VisibilityDriver implements Driver {
  private timeline: Timeline
  private trigger: Element
  private behaviour: VisibilityBehaviour
  private options: VisibilityDriverOptions
  private observer: IntersectionObserver | null = null
  private hasPlayed = false
  private running = false

  constructor(options: VisibilityDriverOptions) {
    this.timeline = options.timeline
    this.trigger = options.trigger
    this.behaviour = options.behaviour ?? 'once'
    this.options = options
  }

  start(): void {
    if (this.running) return
    this.running = true

    if (typeof IntersectionObserver === 'undefined') {
      // No observer (SSR, an old browser, a worker): play immediately rather
      // than leaving the animation stuck at frame 0 forever.
      this.enter()
      return
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) this.enter()
          else this.leave()
        }
      },
      {
        threshold: this.options.threshold ?? 0.15,
        rootMargin: this.options.rootMargin,
        root: this.options.root ?? null,
      }
    )

    this.observer.observe(this.trigger)
  }

  stop(): void {
    this.running = false
    this.observer?.disconnect()
    this.observer = null
  }

  destroy(): void {
    this.stop()
  }

  /** Forget that the animation has played, so 'once' can fire again. */
  reset(): void {
    this.hasPlayed = false
    this.timeline.stop()
  }

  private enter(): void {
    this.options.onEnter?.()

    if (this.behaviour === 'once' && this.hasPlayed) return

    this.hasPlayed = true
    // Rewind first so a repeat plays from the top rather than resuming.
    if (this.behaviour !== 'once') this.timeline.seek(0)
    this.timeline.play()
  }

  private leave(): void {
    this.options.onLeave?.()

    if (this.behaviour === 'reset') {
      this.timeline.stop()
    }
  }
}

/** Convenience wrapper: create a started VisibilityDriver. */
export function playWhenVisible(options: VisibilityDriverOptions): VisibilityDriver {
  const driver = new VisibilityDriver(options)
  driver.start()
  return driver
}
