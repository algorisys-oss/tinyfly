import { naturalRest } from '../../engine'
import { Draggable, type DragAxis, type DragBounds } from '../../interaction/draggable'
import type { LiveApi, LiveTimeline } from './live'
import type { Stage, TargetInput } from './stage'
import { layoutRect } from './layout'
import { resistanceToFriction } from './inertia-vars'

/**
 * Drag an element, and optionally throw it with inertia on release — GSAP's
 * Draggable with `inertia: true`.
 *
 *     live.draggable('.card', { bounds: '.table', inertia: { end: slots } })
 *
 * Dragging writes the position straight to the stage (no timeline per move).
 * Releasing builds an ordinary `inertia` tween from the drag's release velocity,
 * so the throw itself is plain, serializable track data like anything else.
 * Pressing again mid-throw stops it and picks the element up where it is.
 */

export interface LiveThrowOptions {
  /** Decay rate per second (default 4); higher stops sooner */
  friction?: number
  /** GSAP-style resistance (100 ≈ friction 4); ignored if `friction` is set */
  resistance?: number
  /**
   * Where the element may come to rest: a grid increment, per-axis increments or
   * values (`{ x: [0, 200], y: 50 }`), or a list of points — the one nearest to
   * where the throw would naturally stop wins.
   */
  end?: number | Array<{ x: number; y: number }> | { x?: number | number[]; y?: number | number[] }
}

export interface LiveDraggableOptions {
  /** Which axes move: 'x', 'y' or 'x,y' (default); `'rotation'` spins it about its centre (knobs, dials) */
  type?: 'x' | 'y' | 'x,y' | 'rotation'
  /**
   * Keep the element inside another element (selector or element), or explicit
   * offsets; for rotation, `{ minRotation, maxRotation }` in degrees
   */
  bounds?: string | Element | DragBounds | RotationBounds
  /** Snap to a grid of this size, in pixels (degrees, for rotation), while dragging */
  snap?: number
  /** Throw on release. `true` uses the defaults. */
  inertia?: boolean | LiveThrowOptions
  onPress?: () => void
  onDrag?: (position: { x: number; y: number }) => void
  /** Called on release with the release velocity, in pixels per second */
  onRelease?: (velocity: { x: number; y: number }) => void
  /** Called when a throw comes to rest */
  onThrowComplete?: () => void
}

export interface RotationBounds {
  minRotation?: number
  maxRotation?: number
}

export interface LiveDraggable {
  /** The underlying interaction (undefined for `type: 'rotation'`, which tracks the pointer itself) */
  readonly draggable: Draggable | undefined
  /** Where the element is now */
  readonly position: { x: number; y: number }
  /** Its rotation in degrees */
  readonly rotation: number
  /** Stop listening and stop any throw in progress */
  destroy(): void
}

const AXIS: Record<'x' | 'y' | 'x,y', DragAxis> = { x: 'x', y: 'y', 'x,y': 'both' }

const isElement = (value: unknown): value is Element =>
  typeof value === 'object' && value !== null && (value as Node).nodeType === 1

/** Offsets the element can move by and stay inside `container`. */
function boundsWithin(element: Element, container: Element): DragBounds {
  const self = layoutRect(element)
  const box = container.getBoundingClientRect()
  return {
    minX: box.left - self.left,
    maxX: box.right - self.right,
    minY: box.top - self.top,
    maxY: box.bottom - self.bottom,
  }
}

/** The resting place for one axis, given per-axis `end` options. */
function axisEnd(end: number | number[] | undefined): number | number[] | undefined {
  return Array.isArray(end) ? [...end] : end
}

export function createLiveDraggable(
  live: LiveApi,
  stage: Stage,
  target: TargetInput,
  options: LiveDraggableOptions = {}
): LiveDraggable {
  const [name] = stage.resolveTargets(target)
  const element = name ? stage.elementFor(name) : undefined
  if (!name || !element) {
    throw new Error(`gsap-compat: live.draggable could not find ${String(target)}`)
  }

  if (options.type === 'rotation') return createRotationDraggable(live, stage, name, element, options)

  const axis = AXIS[(options.type ?? 'x,y') as 'x' | 'y' | 'x,y']
  const position = () => {
    const x = stage.appliedValue(name, 'x')
    const y = stage.appliedValue(name, 'y')
    return { x: typeof x === 'number' ? x : 0, y: typeof y === 'number' ? y : 0 }
  }

  const boundsElement =
    typeof options.bounds === 'string' ? stage.query(options.bounds) : isElement(options.bounds) ? options.bounds : null
  const explicitBounds = !boundsElement && options.bounds && !isElement(options.bounds) ? (options.bounds as DragBounds) : undefined
  // Offsets are measured from where the element is laid out, which a resize can
  // change — so element bounds are re-measured at the start of every drag.
  const dragOptions = { bounds: explicitBounds ?? (boundsElement ? boundsWithin(element, boundsElement) : undefined) }

  let currentThrow: LiveTimeline | null = null
  const stopThrow = () => {
    currentThrow?.kill()
    currentThrow = null
  }

  const throwFrom = (velocity: { x: number; y: number }) => {
    const settings: LiveThrowOptions = options.inertia === true ? {} : (options.inertia as LiveThrowOptions)
    const friction = settings.friction ?? (settings.resistance !== undefined ? resistanceToFriction(settings.resistance) : 4)
    const from = position()
    const bounds = dragOptions.bounds ?? {}

    let endX: number | number[] | undefined
    let endY: number | number[] | undefined
    const end = settings.end
    if (Array.isArray(end)) {
      // Points: aim both axes at the point nearest the natural resting place.
      const restX = naturalRest({ from: from.x, velocity: axis === 'y' ? 0 : velocity.x, friction })
      const restY = naturalRest({ from: from.y, velocity: axis === 'x' ? 0 : velocity.y, friction })
      let best = end[0]
      for (const point of end) {
        if (Math.hypot(point.x - restX, point.y - restY) < Math.hypot(best.x - restX, best.y - restY)) best = point
      }
      if (best) {
        endX = [best.x]
        endY = [best.y]
      }
    } else if (typeof end === 'number') {
      endX = end
      endY = end
    } else if (end) {
      endX = axisEnd(end.x)
      endY = axisEnd(end.y)
    }

    const inertia: Record<string, unknown> = {}
    if (axis !== 'y') inertia.x = { velocity: velocity.x, friction, min: bounds.minX, max: bounds.maxX, end: endX }
    if (axis !== 'x') inertia.y = { velocity: velocity.y, friction, min: bounds.minY, max: bounds.maxY, end: endY }

    currentThrow = live.to(element, { inertia, onComplete: () => options.onThrowComplete?.() })
  }

  const draggable = new Draggable({
    target: element,
    axis,
    snap: options.snap,
    get bounds() {
      return dragOptions.bounds
    },
    getPosition: position,
    onPress: () => {
      stopThrow()
      if (boundsElement) dragOptions.bounds = boundsWithin(element, boundsElement)
      options.onPress?.()
    },
    onDrag: (next) => {
      stage.apply(name, axis === 'x' ? { x: next.x } : axis === 'y' ? { y: next.y } : { x: next.x, y: next.y })
      options.onDrag?.(next)
    },
    onRelease: () => {
      const velocity = draggable.velocity
      options.onRelease?.(velocity)
      if (options.inertia) throwFrom(velocity)
    },
  })
  draggable.start()

  return {
    draggable,
    get position() {
      return position()
    },
    get rotation() {
      const rotate = stage.appliedValue(name, 'rotate')
      return typeof rotate === 'number' ? rotate : 0
    },
    destroy() {
      stopThrow()
      draggable.destroy()
    },
  }
}

/**
 * `type: 'rotation'`: the angle of the pointer about the element's centre turns
 * it. Dragging past ±180° keeps turning (no jump), bounds clamp in degrees, and a
 * release with `inertia` spins on as an ordinary inertia tween on `rotate`.
 */
function createRotationDraggable(live: LiveApi, stage: Stage, name: string, element: Element, options: LiveDraggableOptions): LiveDraggable {
  const bounds = (typeof options.bounds === 'object' && options.bounds !== null && !isElement(options.bounds) ? options.bounds : {}) as RotationBounds
  const rotation = () => {
    const rotate = stage.appliedValue(name, 'rotate')
    return typeof rotate === 'number' ? rotate : 0
  }
  const clamp = (degrees: number) => Math.min(bounds.maxRotation ?? Infinity, Math.max(bounds.minRotation ?? -Infinity, degrees))

  let currentThrow: LiveTimeline | null = null
  let pressed = false
  let pointerId: number | undefined
  let centre = { x: 0, y: 0 }
  let lastAngle = 0
  let unclamped = 0
  let samples: Array<{ time: number; rotation: number }> = []

  const angleOf = (event: PointerEvent) => (Math.atan2(event.clientY - centre.y, event.clientX - centre.x) * 180) / Math.PI

  const onDown = (event: PointerEvent) => {
    if (pressed) return
    currentThrow?.kill()
    currentThrow = null
    pressed = true
    pointerId = event.pointerId
    ;(element as HTMLElement).setPointerCapture?.(event.pointerId)
    const box = element.getBoundingClientRect()
    centre = { x: box.left + box.width / 2, y: box.top + box.height / 2 }
    lastAngle = angleOf(event)
    unclamped = rotation()
    samples = [{ time: performance.now(), rotation: unclamped }]
    options.onPress?.()
  }

  const onMove = (event: PointerEvent) => {
    if (!pressed || event.pointerId !== pointerId) return
    const angle = angleOf(event)
    // The shortest turn since the last move, so crossing ±180° keeps going.
    let delta = angle - lastAngle
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    lastAngle = angle
    unclamped += delta
    let next = clamp(unclamped)
    if (options.snap) next = clamp(Math.round(next / options.snap) * options.snap)
    stage.apply(name, { rotate: next })
    const now = performance.now()
    samples.push({ time: now, rotation: next })
    while (samples.length > 2 && now - samples[0].time > 100) samples.shift()
    const position = { x: 0, y: 0 }
    options.onDrag?.(position)
  }

  const onUp = (event: PointerEvent) => {
    if (!pressed || event.pointerId !== pointerId) return
    pressed = false
    const first = samples[0]
    const last = samples[samples.length - 1]
    const seconds = first && last ? (last.time - first.time) / 1000 : 0
    const velocity = seconds > 0 ? (last.rotation - first.rotation) / seconds : 0
    options.onRelease?.({ x: velocity, y: 0 })
    if (!options.inertia) return
    const settings: LiveThrowOptions = options.inertia === true ? {} : options.inertia
    const friction = settings.friction ?? (settings.resistance !== undefined ? resistanceToFriction(settings.resistance) : 4)
    const end = typeof settings.end === 'number' || Array.isArray(settings.end) ? settings.end : undefined
    currentThrow = live.to(element, {
      inertia: {
        rotate: {
          velocity,
          friction,
          min: bounds.minRotation,
          max: bounds.maxRotation,
          end: Array.isArray(end) ? (end as unknown as number[]).filter((value) => typeof value === 'number') : end,
        },
      },
      onComplete: () => options.onThrowComplete?.(),
    })
  }

  element.addEventListener('pointerdown', onDown as EventListener)
  element.addEventListener('pointermove', onMove as EventListener)
  element.addEventListener('pointerup', onUp as EventListener)
  element.addEventListener('pointercancel', onUp as EventListener)
  ;(element as HTMLElement).style.touchAction = 'none'

  return {
    draggable: undefined,
    position: { x: 0, y: 0 },
    get rotation() {
      return rotation()
    },
    destroy() {
      currentThrow?.kill()
      element.removeEventListener('pointerdown', onDown as EventListener)
      element.removeEventListener('pointermove', onMove as EventListener)
      element.removeEventListener('pointerup', onUp as EventListener)
      element.removeEventListener('pointercancel', onUp as EventListener)
    },
  }
}
