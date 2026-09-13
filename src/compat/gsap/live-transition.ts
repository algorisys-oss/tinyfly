import type { LiveApi, LiveTimeline, LiveTimelineOptions } from './live'
import type { Stage, TargetInput } from './stage'
import type { TweenVars } from './vars'
import { flipFrom, getFlipState, restValues } from './live-flip'

/**
 * Page transitions for client-side routing: animate the old view out, swap the DOM,
 * carry shared elements across, and animate the new view in.
 *
 *     await live.pageTransition({
 *       from: '.page',
 *       update: () => router.render(nextRoute),   // may return a promise
 *       to: '.page',
 *       shared: '[data-flip-id]',
 *     })
 *
 * Shared elements are matched by `data-flip-id`, as in Flip: a thumbnail on the old
 * page and the hero on the new one can be different elements. With `native: true`,
 * browsers that have the View Transitions API do the whole transition themselves
 * (shared elements get `view-transition-name`s from their flip ids); others fall
 * back to the tinyfly version, so the call works everywhere.
 */

export interface PageTransitionOptions {
  /** Change the page: swap views, render a route. May return a promise. */
  update: () => void | Promise<void>
  /** The view leaving (animated out before `update`) */
  from?: TargetInput
  /** The view arriving, resolved after `update` */
  to?: TargetInput | (() => TargetInput)
  /** Selector for elements carried across by `data-flip-id` */
  shared?: string
  /** How the old view leaves: the values it animates to, or `false` (default: fade and lift) */
  leave?: TweenVars | false
  /** How the new view arrives: the values it starts from, or `false` (default: fade and drop in) */
  enter?: TweenVars | false
  /** Seconds for each phase (default 0.35) */
  duration?: number
  ease?: string
  /** Use the browser's View Transitions API when it has one (default false) */
  native?: boolean
}

const DEFAULT_LEAVE: TweenVars = { opacity: 0, y: -16 }
const DEFAULT_ENTER: TweenVars = { opacity: 0, y: 16 }

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => Promise<void>) => { finished: Promise<void> }
}

export async function pageTransition(
  api: LiveApi,
  stage: Stage,
  createTimeline: (options: LiveTimelineOptions) => LiveTimeline,
  options: PageTransitionOptions
): Promise<void> {
  const root = stage.collector?.scope ?? stage.root
  const doc = (root as Node).ownerDocument ?? (root as Document)
  const sharedNow = () => (options.shared ? [...root.querySelectorAll(options.shared)] : [])

  if (options.native && typeof (doc as ViewTransitionDocument).startViewTransition === 'function') {
    return nativeTransition(doc as ViewTransitionDocument, options, sharedNow)
  }

  const duration = options.duration ?? 0.35
  const ease = options.ease ?? 'power2.inOut'
  const played = (build: (onComplete: () => void) => LiveTimeline | void) =>
    new Promise<void>((resolve) => {
      if (!build(resolve)) resolve()
    })

  // Record shared elements where they are now, before anything moves.
  const before = sharedNow()
  const state = before.length ? getFlipState(stage, before) : undefined

  const leaving = options.from !== undefined ? partsToAnimate(stage, options.from, options.shared) : []
  if (leaving.length && options.leave !== false) {
    const leave = options.leave ?? DEFAULT_LEAVE
    await played((onComplete) => api.to(leaving, { ...leave, duration, ease, onComplete }))
  }

  await options.update()

  const arrivals: Promise<void>[] = []
  const to = typeof options.to === 'function' ? options.to() : options.to
  const arriving = to !== undefined ? partsToAnimate(stage, to, options.shared) : []
  if (arriving.length && options.enter !== false) {
    const enter = options.enter ?? DEFAULT_ENTER
    arrivals.push(played((onComplete) => api.fromTo(arriving, enter, { ...restValues(enter), duration, ease, onComplete })))
  }
  if (state) {
    const arrived = sharedNow().filter((element) => !before.includes(element))
    if (arrived.length) {
      arrivals.push(
        played((onComplete) =>
          flipFrom(stage, createTimeline, state, {
            targets: arrived,
            duration: duration * 1.4,
            ease,
            enter: false,
            onComplete,
          })
        )
      )
    }
  }
  await Promise.all(arrivals)
}

/**
 * What a leave or enter animates. Without shared elements, the view itself. With
 * them, the view's children that neither are nor contain a shared element: moving
 * or fading the whole view would drag the shared elements along, when they should
 * fly across on their own.
 */
function partsToAnimate(stage: Stage, view: TargetInput, shared: string | undefined): Element[] {
  const elements = stage.resolveTargets(view).map((name) => stage.elementFor(name)).filter((el): el is Element => !!el)
  if (!shared) return elements
  return elements.flatMap((element) => {
    if (!element.querySelector(shared) && !element.matches(shared)) return [element]
    return [...element.children].filter((child) => !child.matches(shared) && !child.querySelector(shared))
  })
}

/** The browser animates: shared elements are named for it by their flip ids. */
async function nativeTransition(
  doc: ViewTransitionDocument,
  options: PageTransitionOptions,
  sharedNow: () => Element[]
): Promise<void> {
  const name = (element: Element, on: boolean) => {
    const id = (element as HTMLElement).dataset?.flipId
    if (id) (element as HTMLElement).style.setProperty('view-transition-name', on ? `tf-${id.replace(/[^\w-]/g, '-')}` : '')
  }
  const before = sharedNow()
  before.forEach((element) => name(element, true))
  let after: Element[] = []
  const transition = doc.startViewTransition!(async () => {
    before.forEach((element) => name(element, false))
    await options.update()
    after = sharedNow()
    after.forEach((element) => name(element, true))
  })
  await transition.finished
  after.forEach((element) => name(element, false))
}
