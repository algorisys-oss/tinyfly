/**
 * Smooth scrolling without moving the page into a transformed wrapper.
 *
 * Wheel scrolling is intercepted and eased toward its destination, but the
 * browser's own scroll position is what moves — `window.scrollY` (or the
 * scroller's `scrollTop`) follows the eased value each frame. So everything that
 * reads the scroll position keeps working unchanged: `ScrollDriver` ranges,
 * sticky pins, `position: fixed`, anchor links, find-in-page and scroll
 * restoration. Touch, keyboard and scrollbar scrolling stay native; when they move
 * the page, smoothing picks up from wherever it is.
 *
 *     const smooth = new SmoothScroll({ smooth: 1, effects: true })
 *     smooth.start()
 *     smooth.scrollTo('#contact')
 *
 * **Effects.** Elements with `data-speed` scroll at that fraction of the page's
 * speed (`0.5` half, `1.5` faster), sitting at their natural place when centred in
 * the viewport. Elements with `data-lag` (seconds) catch up with the page after
 * it moves. Both are written to the CSS `translate` property, so they compose
 * with animated `transform`s on the same element.
 *
 * With `prefers-reduced-motion: reduce` there is no smoothing and no effects.
 */

import { easeInOutCubic, type EasingFunction } from '../engine'
import { ScrollDriver } from './scroll-driver'

export interface SmoothScrollFrames {
  request(callback: (timestamp: number) => void): number
  cancel(id: number): void
}

export interface SmoothScrollOptions {
  /** Scrolling element (default: the window) */
  scroller?: HTMLElement | null
  /** Seconds to catch up with the wheel — larger is smoother and later. Default 0.8; 0 turns smoothing off. */
  smooth?: number
  /** Multiplies wheel distance. Default 1. */
  wheelMultiplier?: number
  /** Parallax effects: `true` for `[data-speed], [data-lag]`, or your own selector. Default false. */
  effects?: boolean | string
  /** Force reduced motion on or off; by default `prefers-reduced-motion` is asked. */
  reducedMotion?: boolean
  /** After each frame the position changed */
  onUpdate?: (self: SmoothScrollState) => void
  /** Frame scheduling (default requestAnimationFrame); tests pass a manual one. */
  frames?: SmoothScrollFrames
}

export interface SmoothScrollState {
  /** Scroll offset the page shows, px */
  scroll: number
  /** Where smoothing is heading, px */
  target: number
  /** 0..1 through the scrollable length */
  progress: number
  /** px/s, positive scrolling down */
  velocity: number
}

export interface ScrollToOptions {
  /** Seconds for the trip (default: from distance, 0.4–1.2s). 0 jumps. */
  duration?: number
  /** Added to the destination, px (e.g. `-80` for a fixed header) */
  offset?: number
  ease?: EasingFunction
}

interface Effect {
  element: HTMLElement
  /** data-speed, or undefined */
  speed?: number
  /** data-lag seconds, or undefined */
  lag?: number
  /** Scroll offset at which the element is centred in the viewport */
  centre: number
  /** The page position this element has caught up to (lag) */
  lagged: number
  /** The offset currently applied, px */
  shift: number
  saved: string
}

/** Every started smoother, so `SmoothScroll.refreshAll()` can re-measure them. */
const active = new Set<SmoothScroll>()

const LINE_PX = 16
/** Closer than this, smoothing has arrived. */
const SETTLED_PX = 0.5
/** A scroll event this far from what was written came from somewhere else. */
const FOREIGN_PX = 2

export class SmoothScroll {
  private readonly options: SmoothScrollOptions
  private readonly frames: SmoothScrollFrames
  private running = false
  private reduced = false

  private current = 0
  private target = 0
  private written: number | null = null
  private velocityPxPerSecond = 0

  private frameId: number | null = null
  private lastTime: number | null = null
  private journey: { from: number; to: number; ms: number; ease: EasingFunction; elapsed: number } | null = null
  private pausedState = false
  private effects: Effect[] = []

  private readonly onWheel = (event: WheelEvent) => this.wheel(event)
  private readonly onScroll = () => this.nativeScroll()
  private readonly onResize = () => this.refresh()
  private readonly onLoad = () => this.refresh()
  /** Scroll triggers measure with effect layers at rest, and effects measure after pins. */
  private stopListening: (() => void) | null = null

  constructor(options: SmoothScrollOptions = {}) {
    this.options = options
    this.frames = options.frames ?? {
      request: (callback) => requestAnimationFrame(callback),
      cancel: (id) => cancelAnimationFrame(id),
    }
  }

  start(): this {
    if (this.running || typeof window === 'undefined') return this
    this.running = true
    this.reduced =
      this.options.reducedMotion ?? (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    this.current = this.target = this.position()
    const source = this.options.scroller ?? window
    source.addEventListener('wheel', this.onWheel as EventListener, { passive: false })
    source.addEventListener('scroll', this.onScroll, { passive: true })
    window.addEventListener('resize', this.onResize, { passive: true })
    window.addEventListener('load', this.onLoad)
    active.add(this)
    this.stopListening = ScrollDriver.onRefresh({ beforeRefresh: () => this.rest(), afterRefresh: () => this.refresh() })
    this.refresh()
    return this
  }

  /** Re-measure every started smoother, after layout changes a resize would not catch. */
  static refreshAll(): void {
    for (const smoother of active) smoother.refresh()
  }

  stop(): this {
    if (!this.running) return this
    this.running = false
    const source = this.options.scroller ?? window
    source.removeEventListener('wheel', this.onWheel as EventListener)
    source.removeEventListener('scroll', this.onScroll)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('load', this.onLoad)
    active.delete(this)
    this.stopListening?.()
    this.stopListening = null
    this.cancelFrame()
    this.journey = null
    return this
  }

  /** Stop, and put every effect element back where it was. */
  destroy(): void {
    this.stop()
    for (const effect of this.effects) setTranslate(effect.element, effect.saved)
    this.effects = []
  }

  /** GSAP's name for `destroy()`. */
  kill(): void {
    this.destroy()
  }

  get state(): SmoothScrollState {
    const limit = this.limit()
    return { scroll: this.current, target: this.target, progress: limit > 0 ? this.current / limit : 0, velocity: this.velocityPxPerSecond }
  }

  /** Stop responding to the wheel (e.g. while a modal is open); `paused(false)` resumes. */
  paused(value?: boolean): boolean {
    if (value !== undefined) {
      this.pausedState = value
      if (value) {
        this.target = this.current
        this.journey = null
      }
    }
    return this.pausedState
  }

  /**
   * Scroll to an offset, an element or a selector, eased. Wheel input during the
   * trip takes over from wherever it has got to.
   */
  scrollTo(destination: number | string | Element, options: ScrollToOptions = {}): void {
    if (!this.running) return
    const to = this.clamp(this.resolve(destination) + (options.offset ?? 0))
    const distance = Math.abs(to - this.current)
    const seconds = this.reduced ? 0 : (options.duration ?? Math.min(1.2, Math.max(0.4, distance / 2500)))
    if (seconds <= 0) {
      this.journey = null
      this.current = this.target = to
      this.write(to)
      this.applyEffects(0)
      return
    }
    this.target = to
    this.journey = { from: this.current, to, ms: seconds * 1000, ease: options.ease ?? easeInOutCubic, elapsed: 0 }
    this.requestFrame()
  }

  /** Re-measure the scrollable length and every effect element (resizes do this). */
  refresh(): void {
    if (!this.running) return
    this.rest()
    this.effects = []
    const selector = this.options.effects === true ? '[data-speed], [data-lag]' : this.options.effects || ''
    if (selector && !this.reduced) {
      const root = this.options.scroller ?? document
      const scroll = this.position()
      const viewport = this.viewportHeight()
      const hostTop = this.options.scroller?.getBoundingClientRect().top ?? 0
      for (const element of root.querySelectorAll<HTMLElement>(selector)) {
        const speed = Number.parseFloat(element.dataset.speed ?? '')
        const lag = Number.parseFloat(element.dataset.lag ?? '')
        const box = element.getBoundingClientRect()
        const top = box.top - hostTop + scroll
        this.effects.push({
          element,
          speed: Number.isFinite(speed) ? speed : undefined,
          lag: Number.isFinite(lag) && lag > 0 ? lag : undefined,
          centre: top + box.height / 2 - viewport / 2,
          lagged: scroll,
          shift: 0,
          saved: element.style.getPropertyValue('translate'),
        })
      }
    }
    this.current = this.target = this.clamp(this.position())
    this.applyEffects(0)
  }

  /** Put effect elements at their natural place, for measuring. */
  private rest(): void {
    for (const effect of this.effects) setTranslate(effect.element, effect.saved)
  }

  // --- input ----------------------------------------------------------------

  private wheel(event: WheelEvent): void {
    if (this.pausedState || this.reduced || (this.options.smooth ?? 0.8) <= 0) return
    // Pinch-zoom, sideways scrolling and scrollable areas inside the page stay native.
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
    if (this.nestedScrollerTakes(event)) return

    const unit = event.deltaMode === 1 ? LINE_PX : event.deltaMode === 2 ? this.viewportHeight() : 1
    const delta = event.deltaY * unit * (this.options.wheelMultiplier ?? 1)
    const next = this.clamp(this.target + delta)
    // At an end, let the browser have the event (overscroll, the parent page).
    if (next === this.target && next === this.current) return
    event.preventDefault()
    this.journey = null
    this.target = next
    this.requestFrame()
  }

  /** A scroll that this smoother did not write: follow it. */
  private nativeScroll(): void {
    const position = this.position()
    if (this.written !== null && Math.abs(position - this.written) <= FOREIGN_PX) return
    this.written = null
    this.journey = null
    this.cancelFrame()
    this.current = this.target = position
    this.requestFrame() // effects with lag still need frames
  }

  private nestedScrollerTakes(event: WheelEvent): boolean {
    const boundary = this.options.scroller ?? document.documentElement
    for (let node = event.target as HTMLElement | null; node && node !== boundary && node !== document.body; node = node.parentElement) {
      if (node.hasAttribute?.('data-smooth-ignore')) return true
      const style = getComputedStyle(node)
      if (!/(auto|scroll)/.test(style.overflowY) || node.scrollHeight <= node.clientHeight) continue
      const canScroll = event.deltaY < 0 ? node.scrollTop > 0 : node.scrollTop + node.clientHeight < node.scrollHeight - 1
      if (canScroll) return true
    }
    return false
  }

  // --- frames ---------------------------------------------------------------

  private requestFrame(): void {
    if (this.frameId !== null || !this.running) return
    this.frameId = this.frames.request((time) => this.frame(time))
  }

  private cancelFrame(): void {
    if (this.frameId !== null) this.frames.cancel(this.frameId)
    this.frameId = null
    this.lastTime = null
  }

  private frame(time: number): void {
    this.frameId = null
    const deltaMs = this.lastTime === null ? 1000 / 60 : Math.min(100, time - this.lastTime)
    this.lastTime = time
    const before = this.current

    if (this.journey) {
      const journey = this.journey
      journey.elapsed += deltaMs
      const t = Math.min(1, journey.elapsed / journey.ms)
      this.current = journey.from + (journey.to - journey.from) * journey.ease(t)
      if (t >= 1) this.journey = null
    } else if (this.current !== this.target) {
      // Exponential approach: the same feel at any frame rate. `smooth` seconds covers ~95%.
      const tau = ((this.options.smooth ?? 0.8) * 1000) / 3
      this.current += (this.target - this.current) * (1 - Math.exp(-deltaMs / tau))
      if (Math.abs(this.target - this.current) < SETTLED_PX) this.current = this.target
    }

    if (this.current !== before) this.write(this.current)
    this.velocityPxPerSecond = deltaMs > 0 ? ((this.current - before) * 1000) / deltaMs : 0
    const lagging = this.applyEffects(deltaMs)
    if (this.current !== before) this.options.onUpdate?.(this.state)

    if (this.journey || this.current !== this.target || lagging) this.requestFrame()
    else {
      this.lastTime = null
      this.velocityPxPerSecond = 0
    }
  }

  /** Position every effect for the current scroll; true while a lag is still catching up. */
  private applyEffects(deltaMs: number): boolean {
    let lagging = false
    const scroll = this.current
    for (const effect of this.effects) {
      let y = 0
      if (effect.speed !== undefined) y += (scroll - effect.centre) * (1 - effect.speed)
      if (effect.lag !== undefined) {
        const tau = (effect.lag * 1000) / 3
        effect.lagged = deltaMs === 0 ? scroll : effect.lagged + (scroll - effect.lagged) * (1 - Math.exp(-deltaMs / tau))
        if (Math.abs(scroll - effect.lagged) < SETTLED_PX) effect.lagged = scroll
        else lagging = true
        y += scroll - effect.lagged
      }
      setTranslate(effect.element, y === 0 ? effect.saved : `0 ${round(y)}px`)
      effect.shift = y
    }
    return lagging
  }

  // --- geometry -------------------------------------------------------------

  private write(offset: number): void {
    const rounded = Math.round(offset)
    this.written = rounded
    const scroller = this.options.scroller
    if (scroller) scroller.scrollTop = rounded
    else window.scrollTo({ top: rounded, behavior: 'instant' })
  }

  private position(): number {
    const scroller = this.options.scroller
    return scroller ? scroller.scrollTop : window.scrollY
  }

  private viewportHeight(): number {
    const scroller = this.options.scroller
    return scroller ? scroller.clientHeight : window.innerHeight
  }

  private limit(): number {
    const scroller = this.options.scroller ?? document.documentElement
    return Math.max(0, scroller.scrollHeight - this.viewportHeight())
  }

  private clamp(offset: number): number {
    return Math.max(0, Math.min(this.limit(), offset))
  }

  private resolve(destination: number | string | Element): number {
    if (typeof destination === 'number') return destination
    const root = this.options.scroller ?? document
    const element = typeof destination === 'string' ? root.querySelector(destination) : destination
    if (!element) return this.current
    const hostTop = this.options.scroller?.getBoundingClientRect().top ?? 0
    // Measured without this element's own effect offset.
    const shift = this.effects.find((effect) => effect.element === element)?.shift ?? 0
    return element.getBoundingClientRect().top - hostTop + this.position() - shift
  }
}

/** The CSS `translate` property, which composes with any animated `transform`. */
function setTranslate(element: HTMLElement, value: string): void {
  if (value) element.style.setProperty('translate', value)
  else element.style.removeProperty('translate')
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
