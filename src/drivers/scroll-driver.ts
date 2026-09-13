import type { Timeline } from '../engine'
import type { Driver } from './types'
import { triggerDistance, clamp01, smoothToward, type TriggerPosition } from './scroll-math'
import { ScrollPin } from './scroll-pin'

/**
 * Ties a timeline's playhead to scroll position ("scrubbing"), optionally
 * pinning an element while it does.
 *
 * All the geometry lives in `scroll-math.ts`; this class is the DOM shell. It is
 * built so scrolling costs almost nothing:
 *
 * - **Layout is read on refresh, not on scroll.** Start and end are resolved to
 *   absolute scroll offsets when the driver starts and when the window resizes.
 *   A scroll event then reads one number — the scroll offset — and does no
 *   layout work at all.
 * - **Smoothing runs only while it has somewhere to go.** With `scrub: <seconds>`
 *   a frame loop eases the playhead toward the scroll position and stops once it
 *   arrives; the next scroll starts it again.
 * - **Pinning uses the browser's sticky positioning** (see `scroll-pin.ts`), so
 *   nothing is written per frame to hold an element in place.
 *
 * The engine is untouched — from its point of view this is just a caller of
 * `seek()`. Without a `timeline` the driver only reports progress and fires its
 * callbacks, for callers that decide what scrolling does.
 */

export interface ScrollDriverOptions {
  /** The timeline to scrub. Optional: without one, only progress and callbacks. */
  timeline?: Timeline
  /** Element whose position defines the range */
  trigger: Element
  /**
   * Where the range begins, as `"<element edge> <viewport edge>"`
   * (default: `'top bottom'` — when the element's top reaches the viewport's bottom).
   */
  start?: TriggerPosition | (() => TriggerPosition)
  /**
   * Where it ends (default: `'bottom top'`). `'+=600'` means 600px of scrolling
   * after the start, and `'+=150%'` one and a half viewport heights. A function
   * (for either) is called again on every refresh, so it can depend on layout.
   */
  end?: TriggerPosition | (() => TriggerPosition)
  /**
   * `true` maps scroll position to time exactly (snappy, frame-accurate).
   * A number smooths the playhead toward its target over that many seconds.
   */
  scrub?: boolean | number
  /**
   * Hold an element in place while scrolling through the range: `true` pins the
   * trigger. Content after it is pushed down by the pinned distance.
   */
  pin?: boolean | Element
  /** Scroll container (default: the window) */
  scroller?: HTMLElement | null
  /**
   * Called when progress (0..1) or velocity changes. Velocity is the scroll speed
   * in pixels per second, positive scrolling down; it drops back to 0 shortly
   * after scrolling stops, with one last call.
   */
  onUpdate?: (progress: number, velocity: number) => void
  /**
   * Called at the start of every refresh after the first, before anything is
   * measured — where an animation rebuilds for the new layout.
   */
  onRefresh?: () => void
  /** Scrolled into the active range, going down */
  onEnter?: () => void
  /** Scrolled out of the active range, going down */
  onLeave?: () => void
  /** Scrolled back into the active range, going up */
  onEnterBack?: () => void
  /** Scrolled back out of the active range, going up */
  onLeaveBack?: () => void
}

/** Where the scroll position is relative to the range. */
type Zone = 'before' | 'active' | 'after'

/** Scrolling that has been still this long counts as stopped (velocity 0). */
const IDLE_MS = 120

/** Every started driver, in start order, so a resize refreshes them top-down. */
const started: ScrollDriver[] = []
const refreshAll = () => {
  for (const driver of started) driver.refresh()
}

/** The viewport size at the last refresh, to recognise resizes that change nothing that matters. */
let lastViewport = { width: 0, height: 0 }

/**
 * On touch devices the address bar showing and hiding resizes the viewport's
 * height as you scroll. Re-measuring then makes pins jump mid-scroll, and
 * nothing that depends on width has changed, so those resizes are skipped.
 */
const onResize = () => {
  const width = window.innerWidth
  const height = window.innerHeight
  const heightOnly = width === lastViewport.width && height !== lastViewport.height
  const small = Math.abs(height - lastViewport.height) < lastViewport.height * 0.25
  const touch = typeof navigator !== 'undefined' && (navigator.maxTouchPoints ?? 0) > 0
  if (heightOnly && small && touch) return
  lastViewport = { width, height }
  refreshAll()
}

export class ScrollDriver implements Driver {
  private readonly timeline?: Timeline
  private readonly options: ScrollDriverOptions
  private running = false
  private pin: ScrollPin | null = null

  /** The range, as absolute scroll offsets. */
  private startPx = 0
  private endPx = 0

  /** Progress the page is actually at */
  private targetProgress = 0
  /** Progress the playhead is showing (differs from target only while smoothing) */
  private displayProgress = 0
  private zone: Zone = 'before'
  /** Until the first measurement, smoothing starts at the page's position rather than easing from 0. */
  private measured = false

  private lastScroll: number | null = null
  private lastScrollTime = 0
  private velocityPxPerSecond = 0
  private idleTimer: ReturnType<typeof setTimeout> | null = null
  private lastEmitted: [number, number] | null = null

  private rafId: number | null = null
  private lastFrameTime: number | null = null
  private readonly onScroll = () => this.update()

  constructor(options: ScrollDriverOptions) {
    this.timeline = options.timeline
    this.options = options
  }

  start(): void {
    if (this.running) return
    this.running = true

    // The timeline is driven entirely by scroll, so it must not also advance on
    // its own clock.
    this.timeline?.pause()

    const pinned = this.options.pin === true ? this.options.trigger : this.options.pin || null
    if (pinned) this.pin = new ScrollPin(pinned as HTMLElement)

    this.scrollTarget()?.addEventListener('scroll', this.onScroll, { passive: true })
    if (started.length === 0 && typeof window !== 'undefined') {
      lastViewport = { width: window.innerWidth, height: window.innerHeight }
      window.addEventListener('resize', onResize, { passive: true })
    }
    started.push(this)

    this.refresh()
  }

  stop(): void {
    if (!this.running) return
    this.running = false

    this.scrollTarget()?.removeEventListener('scroll', this.onScroll)
    started.splice(started.indexOf(this), 1)
    if (started.length === 0 && typeof window !== 'undefined') {
      window.removeEventListener('resize', onResize)
    }

    this.stopSmoothing()
    if (this.idleTimer !== null) clearTimeout(this.idleTimer)
    this.idleTimer = null
  }

  /** Stop, and remove any pin spacer. */
  destroy(): void {
    this.stop()
    this.pin?.destroy()
    this.pin = null
  }

  /**
   * Re-measure every started driver, in the order they started. Call after a
   * layout change a resize would not catch (images or fonts loading).
   */
  static refreshAll(): void {
    refreshAll()
  }

  /** Current scroll progress, 0..1. */
  get progress(): number {
    return this.targetProgress
  }

  /** Scroll speed in pixels per second (0 once scrolling has stopped). */
  get velocity(): number {
    return this.velocityPxPerSecond
  }

  /**
   * Measure the page again and update. Resizes do this automatically (for every
   * driver, in the order they started, so a pin above pushes the ones below);
   * call it after changing layout yourself — images or fonts loading, content
   * added above the trigger.
   */
  refresh(): void {
    if (!this.running) return
    if (this.measured) this.options.onRefresh?.()
    const scroll = this.scrollPosition()

    this.pin?.release()
    const rect = this.triggerRect()
    if (rect) {
      const viewport = this.viewportHeight()
      this.startPx = scroll + triggerDistance(rect, viewport, resolvePosition(this.options.start) ?? 'top bottom')
      this.endPx = this.resolveEnd(rect, viewport, scroll)

      if (this.pin) {
        // Pinned at the offset the element has when the range starts.
        const pinRect = this.relativeRect(this.pin.element.getBoundingClientRect())
        this.pin.apply(pinRect.top - (this.startPx - scroll), this.endPx - this.startPx)
      }
    }

    this.lastScroll = null
    // The first measurement shows the page's position straight away rather
    // than easing in from 0.
    this.updateFrom(scroll, !this.measured)
    this.measured = true
  }

  /** Same as `refresh()`. */
  sample(): void {
    this.refresh()
  }

  /**
   * Update from the current scroll position, or from `scrollPosition` when a
   * smooth-scrolling library (or anything else) owns the scroll value. Costs no
   * layout reads.
   */
  update(scrollPosition?: number): void {
    if (!this.running) return
    this.updateFrom(scrollPosition ?? this.scrollPosition(), false)
  }

  // --- internals ----------------------------------------------------------

  private updateFrom(scroll: number, snap: boolean): void {
    this.trackVelocity(scroll)

    const span = this.endPx - this.startPx
    const previousZone = this.zone
    this.targetProgress = span > 0 ? clamp01((scroll - this.startPx) / span) : scroll >= this.startPx ? 1 : 0
    this.zone = span > 0 ? (scroll <= this.startPx ? 'before' : scroll >= this.endPx ? 'after' : 'active') : scroll >= this.startPx ? 'after' : 'before'
    this.fireBoundaryCallbacks(previousZone, this.zone)

    if (snap || this.smoothing() <= 0) {
      this.displayProgress = this.targetProgress
      this.applyProgress()
    } else {
      this.emitUpdate()
      this.startSmoothing()
    }
  }

  /** Seconds of smoothing, or 0 for exact tracking. */
  private smoothing(): number {
    const scrub = this.options.scrub
    return typeof scrub === 'number' ? Math.max(0, scrub) : 0
  }

  private resolveEnd(rect: { top: number; bottom: number; height: number }, viewport: number, scroll: number): number {
    const end = resolvePosition(this.options.end) ?? 'bottom top'
    const relative = typeof end === 'string' ? end.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null
    if (relative) {
      const amount = Number.parseFloat(relative[1])
      return this.startPx + (relative[2] === '%' ? (viewport * amount) / 100 : amount)
    }
    return scroll + triggerDistance(rect, viewport, end)
  }

  private applyProgress(): void {
    const duration = this.timeline?.duration ?? 0
    if (this.timeline && duration > 0) this.timeline.seek(this.displayProgress * duration)
    this.emitUpdate()
  }

  private emitUpdate(): void {
    if (!this.options.onUpdate) return
    const next: [number, number] = [this.displayProgress, this.velocityPxPerSecond]
    if (this.lastEmitted && this.lastEmitted[0] === next[0] && this.lastEmitted[1] === next[1]) return
    this.lastEmitted = next
    this.options.onUpdate(next[0], next[1])
  }

  private trackVelocity(scroll: number): void {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    if (this.lastScroll !== null && now > this.lastScrollTime && scroll !== this.lastScroll) {
      this.velocityPxPerSecond = ((scroll - this.lastScroll) / (now - this.lastScrollTime)) * 1000
    }
    if (this.lastScroll === null || scroll !== this.lastScroll) {
      this.lastScroll = scroll
      this.lastScrollTime = now
    }

    if (this.velocityPxPerSecond === 0 || typeof setTimeout === 'undefined') return
    if (this.idleTimer !== null) clearTimeout(this.idleTimer)
    this.idleTimer = setTimeout(() => {
      this.idleTimer = null
      this.velocityPxPerSecond = 0
      this.emitUpdate()
    }, IDLE_MS)
  }

  /**
   * Emit enter/leave callbacks as the scroll position moves between zones. A jump
   * straight across the range (a fast flick, or loading the page scrolled past
   * it) fires both edges in order.
   */
  private fireBoundaryCallbacks(previous: Zone, current: Zone): void {
    if (previous === current) return
    const { onEnter, onLeave, onEnterBack, onLeaveBack } = this.options
    if (previous === 'before') {
      onEnter?.()
      if (current === 'after') onLeave?.()
    } else if (previous === 'after') {
      onEnterBack?.()
      if (current === 'before') onLeaveBack?.()
    } else if (current === 'after') {
      onLeave?.()
    } else {
      onLeaveBack?.()
    }
  }

  private startSmoothing(): void {
    if (this.rafId !== null || typeof requestAnimationFrame === 'undefined') return

    const frame = (timestamp: number) => {
      this.rafId = null
      if (!this.running) return

      const delta = this.lastFrameTime === null ? 16.67 : timestamp - this.lastFrameTime
      this.lastFrameTime = timestamp

      this.displayProgress = smoothToward(this.displayProgress, this.targetProgress, this.smoothing(), delta)
      const settled = Math.abs(this.targetProgress - this.displayProgress) < 1e-4
      if (settled) this.displayProgress = this.targetProgress
      this.applyProgress()

      if (settled) this.lastFrameTime = null
      else this.rafId = requestAnimationFrame(frame)
    }

    this.rafId = requestAnimationFrame(frame)
  }

  private stopSmoothing(): void {
    if (this.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId)
    }
    this.rafId = null
    this.lastFrameTime = null
  }

  private scrollTarget(): EventTarget | null {
    return this.options.scroller ?? (typeof window !== 'undefined' ? window : null)
  }

  private scrollPosition(): number {
    const scroller = this.options.scroller
    if (scroller) return scroller.scrollTop ?? 0
    return typeof window !== 'undefined' ? (window.scrollY ?? 0) : 0
  }

  private triggerRect(): { top: number; bottom: number; height: number } | null {
    const el = this.options.trigger as Element & { getBoundingClientRect?: () => DOMRect }
    if (typeof el?.getBoundingClientRect !== 'function') return null
    return this.relativeRect(el.getBoundingClientRect())
  }

  /** A viewport rect, relative to the scroll container when there is one. */
  private relativeRect(box: { top: number; bottom: number; height: number }): { top: number; bottom: number; height: number } {
    const scroller = this.options.scroller
    if (scroller && typeof scroller.getBoundingClientRect === 'function') {
      const host = scroller.getBoundingClientRect()
      return { top: box.top - host.top, bottom: box.bottom - host.top, height: box.height }
    }
    return { top: box.top, bottom: box.bottom, height: box.height }
  }

  private viewportHeight(): number {
    const scroller = this.options.scroller
    if (scroller) return scroller.clientHeight
    return typeof window !== 'undefined' ? window.innerHeight : 0
  }
}

function resolvePosition(position: TriggerPosition | (() => TriggerPosition) | undefined): TriggerPosition | undefined {
  return typeof position === 'function' ? position() : position
}

/** Convenience wrapper: create a started ScrollDriver. */
export function scrubOnScroll(options: ScrollDriverOptions): ScrollDriver {
  const driver = new ScrollDriver(options)
  driver.start()
  return driver
}
