import { ScrollDriver, type ContainerAxis, type MarkerOptions, type SnapOption, type SnapTo, type TriggerPosition } from '../../drivers'
import { getEasingFunction, type Timeline } from '../../engine'
import { mapEase } from './ease-map'
import type { Stage } from './stage'

/**
 * `scrollTrigger` for the live runtime — GSAP's ScrollTrigger vars, built on
 * `ScrollDriver`:
 *
 *     live.timeline({ scrollTrigger: { trigger: '.panels', start: 'top top', end: '+=2000', scrub: 0.5, pin: true } })
 *       .to('.track', { x: -1600, ease: 'none' })
 *
 *     live.from('.card', { y: 60, opacity: 0, scrollTrigger: { start: 'top 80%', toggleActions: 'play none none reverse' } })
 *
 * With `scrub`, scroll position is the playhead. Without it, crossing the range's
 * edges plays, reverses, resets… the animation according to `toggleActions`.
 */

export interface ScrollTriggerSelf {
  /** 0..1 through the range */
  progress: number
  /** Scroll speed in px/s, positive scrolling down; 0 shortly after scrolling stops */
  velocity: number
  /** 1 scrolling down, -1 up */
  direction: 1 | -1
}

export interface ScrollTriggerVars {
  /** Element (or selector) defining the range. Default: the animation's first target. */
  trigger?: string | Element
  /** `"<element edge> <viewport edge>"`, default `'top bottom'`; a function is re-run on refresh */
  start?: TriggerPosition | (() => TriggerPosition)
  /** Default `'bottom top'`; `'+=600'` / `'+=150%'` measure from the start; a function is re-run on refresh */
  end?: TriggerPosition | (() => TriggerPosition)
  /**
   * On every refresh (a resize), rebuild the animation so function values and
   * start values are read again for the new layout.
   */
  invalidateOnRefresh?: boolean
  /** `true` ties progress to scroll exactly; a number smooths over that many seconds */
  scrub?: boolean | number
  /** Hold the trigger (`true`) or another element in place through the range */
  pin?: boolean | string | Element
  /** Scroll container (element or selector); default the window */
  scroller?: string | HTMLElement
  /** The scroller scrolls sideways: `'left right'` positions, horizontal pins */
  horizontal?: boolean
  /** `false`: content after the pin scrolls up underneath it instead of being pushed down */
  pinSpacing?: boolean
  /**
   * Without `scrub`: what to do on enter, leave, enter back, leave back — each one
   * of play, pause, resume, reverse, restart, reset, complete, none.
   * Default `'play none none none'`.
   */
  toggleActions?: string
  /** Stop watching after the first enter (the animation keeps playing) */
  once?: boolean
  /**
   * After scrolling stops inside the range, scroll on to the nearest point: a
   * progress step (`1 / 3`), progress points, `'labels'` (the timeline's labels),
   * a function, or `{ snapTo, duration, delay, ease }` with an ease name.
   */
  snap?: LiveSnap
  /** Show start and end markers while developing (`true`, or colours, indent, id) */
  markers?: boolean | MarkerOptions
  /**
   * The animation moving this trigger's container sideways (a pinned horizontal
   * section's tween). Start and end are then horizontal: `'left right'` is when the
   * trigger's left edge reaches the viewport's right edge.
   */
  containerAnimation?: ContainerAnimation
  onUpdate?: (self: ScrollTriggerSelf) => void
  onEnter?: () => void
  onLeave?: () => void
  onEnterBack?: () => void
  onLeaveBack?: () => void
}

type SnapPoints = number | number[] | 'labels' | ((progress: number) => number)
export type LiveSnap =
  | SnapPoints
  | { snapTo: SnapPoints; duration?: number | { min: number; max: number }; delay?: number; ease?: string }

/** What `containerAnimation` needs from a live timeline. */
export interface ContainerAnimation {
  readonly timeline: Timeline
  readonly scrollTrigger: ScrollDriver | undefined
  progress(value?: number): number
}

/** What a scroll trigger controls: the parts of a live timeline it needs. */
export interface ScrollControlled {
  play(): unknown
  pause(): unknown
  resume(): unknown
  reverse(): unknown
  restart(): unknown
  progress(value?: number): number
  reversed(): boolean
  invalidate?(): unknown
  /** Label times as progress (0..1), for `snap: 'labels'` */
  labelProgresses?(): number[]
}

type ToggleAction = 'play' | 'pause' | 'resume' | 'reverse' | 'restart' | 'reset' | 'complete' | 'none'

function runAction(target: ScrollControlled, action: string): void {
  switch (action as ToggleAction) {
    // Play forward from wherever it is; reverse() flips a reversed timeline and plays.
    // Neither restarts an animation that is already at that end.
    case 'play':
      if (target.progress() >= 1) break
      if (target.reversed()) target.reverse()
      else target.play()
      break
    case 'reverse':
      if (target.progress() <= 0) break
      if (target.reversed()) target.play()
      else target.reverse()
      break
    case 'pause': target.pause(); break
    case 'resume': target.resume(); break
    case 'restart': target.restart(); break
    case 'reset': target.pause(); target.progress(0); break
    case 'complete': target.pause(); target.progress(1); break
    default: break
  }
}

/**
 * Create and start a scroll trigger. `animation` is what it controls, if
 * anything; `fallbackTrigger` is used when the vars name no trigger.
 */
export function createScrollTrigger(
  stage: Stage,
  vars: ScrollTriggerVars,
  animation?: ScrollControlled,
  fallbackTrigger?: Element,
  warn: (message: string) => void = () => {}
): ScrollDriver | undefined {
  const element = (value: string | Element | undefined): Element | undefined =>
    typeof value === 'string' ? stage.query(value) ?? undefined : value

  const trigger = element(vars.trigger) ?? fallbackTrigger
  if (!trigger) {
    warn(`gsap-compat: scrollTrigger has no trigger element${typeof vars.trigger === 'string' ? ` for "${vars.trigger}"` : ''}`)
    return undefined
  }

  const scrub = vars.scrub === undefined || vars.scrub === false ? false : vars.scrub
  const actions = (vars.toggleActions ?? 'play none none none').trim().split(/\s+/)
  let lastProgress = 0

  let driver: ScrollDriver
  const edge = (index: number, callback?: () => void) => () => {
    callback?.()
    if (animation && !scrub) runAction(animation, actions[index] ?? 'none')
    if (vars.once && index === 0) queueMicrotask(() => driver.destroy())
  }

  const container = vars.containerAnimation ? containerAxis(stage, vars.containerAnimation, trigger, warn) : undefined

  driver = new ScrollDriver({
    trigger,
    start: vars.start,
    end: vars.end,
    scrub: scrub === false ? undefined : scrub,
    pin: vars.pin === true ? true : element(vars.pin as string | Element | undefined),
    scroller: element(vars.scroller) as HTMLElement | undefined,
    horizontal: vars.horizontal,
    pinSpacing: vars.pinSpacing,
    onRefresh: vars.invalidateOnRefresh && animation?.invalidate ? () => animation.invalidate!() : undefined,
    snap: vars.snap === undefined ? undefined : resolveSnap(vars.snap, animation),
    markers: vars.markers,
    container,
    onUpdate: (progress, velocity) => {
      if (animation && scrub !== false) animation.progress(progress)
      if (vars.onUpdate) {
        const direction = progress < lastProgress || velocity < 0 ? -1 : 1
        vars.onUpdate({ progress, velocity, direction })
      }
      lastProgress = progress
    },
    onEnter: edge(0, vars.onEnter),
    onLeave: edge(1, vars.onLeave),
    onEnterBack: edge(2, vars.onEnterBack),
    onLeaveBack: edge(3, vars.onLeaveBack),
  })

  // Show the animation's starting state until the trigger says otherwise, so a
  // `from()` reveal does not flash its final state first.
  if (animation && scrub === false) animation.progress(0)

  driver.start()
  return stage.own(driver)
}

/** Turn `snap` vars into the driver's option: label points and ease names resolved. */
function resolveSnap(snap: LiveSnap, animation: ScrollControlled | undefined): SnapOption {
  // Labels are read when snapping, so a rebuilt timeline's labels are the ones used.
  const toSnapTo = (value: SnapPoints): SnapTo =>
    value === 'labels' ? (progress) => nearest(progress, animation?.labelProgresses?.() ?? []) : value
  if (typeof snap !== 'object' || Array.isArray(snap)) return toSnapTo(snap)
  const mapped = snap.ease ? mapEase(snap.ease) : undefined
  return {
    snapTo: toSnapTo(snap.snapTo),
    duration: snap.duration,
    delay: snap.delay,
    ease: mapped ? mapped.fn ?? getEasingFunction(mapped.easing) : undefined,
  }
}

function nearest(progress: number, points: number[]): number {
  return points.reduce((best, point) => (Math.abs(point - progress) < Math.abs(best - progress) ? point : best), points[0] ?? progress)
}

/**
 * How a container animation moves `trigger` along x: the tracks animating `x` on
 * the trigger's ancestors (usually the one track sliding the row), sampled at any
 * progress of the container's timeline.
 */
function containerAxis(stage: Stage, animation: ContainerAnimation, trigger: Element, warn: (message: string) => void): ContainerAxis | undefined {
  const movers = () =>
    animation.timeline
      .getTracks({ property: 'x' })
      .map((track) => track.target)
      .filter((name) => {
        const element = stage.elementFor(name)
        return !!element && element !== trigger && element.contains(trigger)
      })

  if (movers().length === 0) {
    warn('gsap-compat: containerAnimation does not move an ancestor of the trigger along x')
  }
  return {
    range: () => {
      const driver = animation.scrollTrigger
      if (!driver) warn('gsap-compat: containerAnimation needs its own scrollTrigger (created before this one)')
      return { start: driver?.startOffset ?? 0, end: driver?.endOffset ?? 0 }
    },
    progress: () => animation.progress(),
    shiftAt: (progress) => {
      const state = animation.timeline.getStateAtTime(progress * animation.timeline.duration)
      let shift = 0
      for (const name of movers()) {
        const value = state.values.get(name)?.get('x')
        if (typeof value === 'number') shift += value
      }
      return shift
    },
  }
}
