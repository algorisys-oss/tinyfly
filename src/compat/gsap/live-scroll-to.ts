import type { LiveApi, LiveTimeline } from './live'
import type { Stage } from './stage'
import { createScrollTrigger, type ScrollTriggerVars } from './live-scroll'
import type { ScrollDriver } from '../../drivers'

/**
 * Scrolling as an animation (GSAP's ScrollToPlugin), and grouped scroll reveals
 * (GSAP's `ScrollTrigger.batch`).
 *
 *     live.scrollTo('#pricing', { duration: 1, offset: 80 })
 *     live.to(window, { scrollTo: { y: '#pricing', offsetY: 80 }, duration: 1 })
 *
 *     live.scrollBatch('.card', { onEnter: (cards) => live.from(cards, { y: 40, opacity: 0, stagger: 0.1 }) })
 *
 * `scrollTo` tweens a plain `{ x, y }` and writes it to the scroller each frame,
 * so it is an ordinary live timeline: eased, killable, with callbacks. The
 * destination is measured once, when it starts. Wheel, touch or key input stops
 * it (`autoKill`), so it never fights the reader.
 */

export type ScrollDestination = number | string | Element | { x?: number | string | Element; y?: number | string | Element }

export interface ScrollToVars {
  /** Seconds (default 1) */
  duration?: number
  /** Default 'power2.inOut' */
  ease?: string
  /** Pixels to stop short of an element or selector, e.g. a fixed header's height */
  offset?: number
  offsetX?: number
  offsetY?: number
  /** Scroll an element instead of the window */
  scroller?: string | HTMLElement
  /** Stop when the reader scrolls (default true) */
  autoKill?: boolean
  onStart?: () => void
  onUpdate?: () => void
  onComplete?: () => void
}

export function scrollTo(live: LiveApi, stage: Stage, destination: ScrollDestination, vars: ScrollToVars = {}): LiveTimeline {
  const root = stage.collector?.scope ?? stage.root
  const scroller = typeof vars.scroller === 'string' ? root.querySelector<HTMLElement>(vars.scroller) : (vars.scroller ?? null)
  const current = {
    x: scroller ? scroller.scrollLeft : window.scrollX,
    y: scroller ? scroller.scrollTop : window.scrollY,
  }
  const limit = {
    x: scroller ? scroller.scrollWidth - scroller.clientWidth : document.documentElement.scrollWidth - window.innerWidth,
    y: scroller ? scroller.scrollHeight - scroller.clientHeight : document.documentElement.scrollHeight - window.innerHeight,
  }

  const resolve = (axis: 'x' | 'y', value: number | string | Element | undefined): number => {
    if (value === undefined) return current[axis]
    if (typeof value === 'number') return value
    if (value === 'max') return limit[axis]
    const element = typeof value === 'string' ? root.querySelector(value) : value
    if (!element) return current[axis]
    const box = element.getBoundingClientRect()
    const host = scroller?.getBoundingClientRect()
    const offset = (axis === 'x' ? vars.offsetX : vars.offsetY) ?? vars.offset ?? 0
    return axis === 'x' ? box.left - (host?.left ?? 0) + current.x - offset : box.top - (host?.top ?? 0) + current.y - offset
  }

  const target =
    typeof destination === 'object' && destination !== null && !('nodeType' in destination)
      ? { x: resolve('x', destination.x), y: resolve('y', destination.y) }
      : { x: current.x, y: resolve('y', destination as number | string | Element) }
  const clamped = { x: Math.max(0, Math.min(limit.x, target.x)), y: Math.max(0, Math.min(limit.y, target.y)) }

  const position = { ...current }
  const write = () => {
    if (scroller) {
      scroller.scrollLeft = position.x
      scroller.scrollTop = position.y
    } else {
      window.scrollTo({ left: position.x, top: position.y, behavior: 'instant' })
    }
  }

  const events = ['wheel', 'touchstart', 'keydown']
  const source: EventTarget = scroller ?? window
  const stop = () => {
    tween.kill()
    detach()
  }
  const detach = () => {
    for (const type of events) source.removeEventListener(type, stop)
  }

  const tween: LiveTimeline = live.to(position, {
    x: clamped.x,
    y: clamped.y,
    duration: vars.duration ?? 1,
    ease: vars.ease ?? 'power2.inOut',
    onStart: vars.onStart,
    onUpdate: () => {
      write()
      vars.onUpdate?.()
    },
    onComplete: () => {
      detach()
      vars.onComplete?.()
    },
  })
  if (vars.autoKill !== false) for (const type of events) source.addEventListener(type, stop, { passive: true })
  return tween
}

export interface ScrollBatchVars extends Omit<ScrollTriggerVars, 'trigger' | 'onEnter' | 'onLeave' | 'onEnterBack' | 'onLeaveBack' | 'onUpdate'> {
  /** Seconds to collect elements that cross together (default 0.1) */
  interval?: number
  /** Call as soon as this many have collected */
  batchMax?: number
  onEnter?: (elements: Element[]) => void
  onLeave?: (elements: Element[]) => void
  onEnterBack?: (elements: Element[]) => void
  onLeaveBack?: (elements: Element[]) => void
}

type BatchEdge = 'onEnter' | 'onLeave' | 'onEnterBack' | 'onLeaveBack'

/** One trigger per element; elements crossing the same edge close together arrive in one call. */
export function scrollBatch(stage: Stage, targets: string | Element | ArrayLike<Element>, vars: ScrollBatchVars): ScrollDriver[] {
  const root = stage.collector?.scope ?? stage.root
  const elements = typeof targets === 'string' ? [...root.querySelectorAll(targets)] : 'nodeType' in targets ? [targets as Element] : Array.from(targets)
  const { interval = 0.1, batchMax, onEnter, onLeave, onEnterBack, onLeaveBack, ...triggerVars } = vars
  const callbacks: Record<BatchEdge, ((elements: Element[]) => void) | undefined> = { onEnter, onLeave, onEnterBack, onLeaveBack }
  const queues: Record<BatchEdge, Element[]> = { onEnter: [], onLeave: [], onEnterBack: [], onLeaveBack: [] }
  const timers: Partial<Record<BatchEdge, ReturnType<typeof setTimeout>>> = {}

  const flush = (edge: BatchEdge) => {
    if (timers[edge] !== undefined) clearTimeout(timers[edge])
    timers[edge] = undefined
    const batch = queues[edge].splice(0)
    if (batch.length > 0) callbacks[edge]?.(batch)
  }
  const queue = (edge: BatchEdge, element: Element) => {
    if (!callbacks[edge]) return
    queues[edge].push(element)
    if (batchMax !== undefined && queues[edge].length >= batchMax) return flush(edge)
    if (timers[edge] === undefined) timers[edge] = setTimeout(() => flush(edge), interval * 1000)
  }

  return elements
    .map((element) =>
      createScrollTrigger(stage, {
        ...triggerVars,
        trigger: element,
        onEnter: () => queue('onEnter', element),
        onLeave: () => queue('onLeave', element),
        onEnterBack: () => queue('onEnterBack', element),
        onLeaveBack: () => queue('onLeaveBack', element),
      })
    )
    .filter((driver): driver is ScrollDriver => driver !== undefined)
}
