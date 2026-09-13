import type { LiveTimeline, LiveTimelineOptions } from './live'
import type { Stage, TargetInput } from './stage'
import type { TweenVars } from './vars'
import { layoutRect } from './layout'

/**
 * Flip for the live runtime: animate elements from where they were to where a
 * layout change put them — GSAP's `Flip.getState` / `Flip.from`.
 *
 *     const state = live.getFlipState('.item')
 *     grid.classList.toggle('compact')          // any DOM or class change
 *     live.flipFrom(state, { duration: 0.6, ease: 'power2.inOut', stagger: 0.03 })
 *
 * Measurement is the only DOM work, and it happens once per call: where each
 * element *appears* before the change (including any transform it is animating
 * with, so interrupting a flip mid-way continues smoothly), and where it is
 * *laid out* after (ignoring transforms). Each element then gets an ordinary
 * `fromTo` tween from the offset back to rest, so the compiled result is plain
 * track data like everything else.
 *
 * Offsets are measured between centres, because scale happens about an
 * element's centre (the CSS default origin); measuring corners would leave a
 * resized element off by half its change in size.
 */

interface Box {
  cx: number
  cy: number
  width: number
  height: number
}

/** What `getFlipState` recorded: each element and where it appeared. */
export interface FlipState {
  readonly elements: Element[]
  readonly boxes: Map<Element, Box | null>
}

export interface FlipVars {
  duration?: number
  ease?: string
  /** Seconds between each element's start, in document order */
  stagger?: number
  /** Animate size changes with scaleX/scaleY (default true). Off: position only. */
  scale?: boolean
  /**
   * Elements that may have appeared during the change and should animate in —
   * a selector, element or list. Anything in it that was not visible before
   * but is now gets the `enter` animation.
   */
  targets?: TargetInput
  /**
   * How newly visible elements come in: the values they start from (they end at
   * their natural values), or `false` for no entrance. Default: fade and grow in.
   */
  enter?: TweenVars | false
  onComplete?: () => void
}

const DEFAULT_ENTER: TweenVars = { opacity: 0, scale: 0.6 }

/** Where an element appears on screen, transforms included; null if not rendered. */
function visualBox(element: Element): Box | null {
  const rect = element.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return null
  return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2, width: rect.width, height: rect.height }
}

/** Where an element is laid out, ignoring its own transform; null if not rendered. */
function layoutBox(element: Element): Box | null {
  const rect = layoutRect(element)
  if (rect.width === 0 && rect.height === 0) return null
  return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2, width: rect.width, height: rect.height }
}

export function getFlipState(stage: Stage, targets: TargetInput): FlipState {
  const names = stage.resolveTargets(targets)
  const elements = names.map((name) => stage.elementFor(name)).filter((el): el is Element => !!el)
  const boxes = new Map<Element, Box | null>()
  for (const element of elements) boxes.set(element, visualBox(element))
  return { elements, boxes }
}

/** A flip that is still running on an element, so a new one can take over. */
const running = new WeakMap<Element, LiveTimeline>()

export function flipFrom(
  stage: Stage,
  createTimeline: (options: LiveTimelineOptions) => LiveTimeline,
  state: FlipState,
  vars: FlipVars = {}
): LiveTimeline {
  const duration = vars.duration ?? 0.6
  const ease = vars.ease ?? 'power2.inOut'
  const each = vars.stagger ?? 0
  const withScale = vars.scale !== false
  const enter = vars.enter === undefined ? DEFAULT_ENTER : vars.enter

  // Everything this flip covers: what was recorded, plus any `targets` that may
  // have appeared, in document order so a stagger reads naturally.
  const candidates = new Set<Element>(state.elements)
  if (vars.targets !== undefined) {
    for (const name of stage.resolveTargets(vars.targets)) {
      const element = stage.elementFor(name)
      if (element) candidates.add(element)
    }
  }
  const ordered = [...candidates].sort((a, b) =>
    a === b ? 0 : a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  )

  const tl = createTimeline({ onComplete: vars.onComplete })
  let index = 0

  for (const element of ordered) {
    const before = state.boxes.get(element) ?? null
    const after = layoutBox(element)
    if (!after) continue // not rendered now: nothing to show

    // Take over from a flip still running on this element — only its part of
    // that flip, so other elements it covers keep going. The "before" box was
    // measured with that flip's transform applied, so the new tween continues
    // from exactly where the element appears.
    const [name] = stage.resolveTargets(element)
    running.get(element)?.timeline.removeTracks({ target: name })

    const delay = index * each

    if (!before) {
      if (enter === false) continue
      tl.fromTo(element, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...enter }, { ...restValues(enter), x: 0, y: 0, scaleX: 1, scaleY: 1, duration, ease, delay }, 0)
      running.set(element, tl)
      index++
      continue
    }

    const dx = before.cx - after.cx
    const dy = before.cy - after.cy
    const sx = withScale ? before.width / after.width : 1
    const sy = withScale ? before.height / after.height : 1
    const moved = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5 || Math.abs(sx - 1) > 0.001 || Math.abs(sy - 1) > 0.001

    if (!moved) {
      // Nothing to animate — unless a previous flip left it mid-way, in which
      // case settle it (its tracks there were just removed).
      const offset = (property: string, rest: number) => {
        const value = stage.appliedValue(name, property)
        return typeof value === 'number' && Math.abs(value - rest) > 1e-6
      }
      if (offset('x', 0) || offset('y', 0) || offset('scaleX', 1) || offset('scaleY', 1)) {
        tl.set(element, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0)
      }
      continue
    }

    tl.fromTo(
      element,
      { x: dx, y: dy, scaleX: sx, scaleY: sy },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, duration, ease, delay },
      0
    )
    running.set(element, tl)
    index++
  }

  return tl
}

/** The natural value each entrance property animates to. */
function restValues(from: TweenVars): TweenVars {
  const rest: TweenVars = {}
  for (const property of Object.keys(from)) {
    rest[property] = property === 'opacity' || property.startsWith('scale') ? 1 : 0
  }
  return rest
}
