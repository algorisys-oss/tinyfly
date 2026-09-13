import { ScrollDriver, type TriggerPosition } from '../../drivers'
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
  /** `"<element edge> <viewport edge>"`, default `'top bottom'` */
  start?: TriggerPosition
  /** Default `'bottom top'`; `'+=600'` / `'+=150%'` measure from the start */
  end?: TriggerPosition
  /** `true` ties progress to scroll exactly; a number smooths over that many seconds */
  scrub?: boolean | number
  /** Hold the trigger (`true`) or another element in place through the range */
  pin?: boolean | string | Element
  /** Scroll container (element or selector); default the window */
  scroller?: string | HTMLElement
  /**
   * Without `scrub`: what to do on enter, leave, enter back, leave back — each one
   * of play, pause, resume, reverse, restart, reset, complete, none.
   * Default `'play none none none'`.
   */
  toggleActions?: string
  /** Stop watching after the first enter (the animation keeps playing) */
  once?: boolean
  onUpdate?: (self: ScrollTriggerSelf) => void
  onEnter?: () => void
  onLeave?: () => void
  onEnterBack?: () => void
  onLeaveBack?: () => void
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

  driver = new ScrollDriver({
    trigger,
    start: vars.start,
    end: vars.end,
    scrub: scrub === false ? undefined : scrub,
    pin: vars.pin === true ? true : element(vars.pin as string | Element | undefined),
    scroller: element(vars.scroller) as HTMLElement | undefined,
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
