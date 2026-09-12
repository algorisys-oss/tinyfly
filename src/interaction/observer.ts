/**
 * Unified pointer / wheel / touch input.
 *
 * GSAP's Observer in miniature: one event source that normalises mouse, touch
 * and wheel into the same delta+velocity shape, so `Draggable` and any
 * scroll-like gesture can be written once.
 *
 * This lives outside the engine and outside the default player bundle — it is
 * live interaction, which by definition has no serializable representation.
 */

export interface ObserverState {
  /** Movement since the last event, in pixels */
  deltaX: number
  deltaY: number
  /** Smoothed speed in pixels per second */
  velocityX: number
  velocityY: number
  /** Total movement since the gesture began */
  totalX: number
  totalY: number
  /** Whether a press/touch is currently down */
  isDragging: boolean
  /** The originating event, for callers that need modifiers or targets */
  event: Event
}

export type ObserverCallback = (state: ObserverState) => void

export interface ObserverOptions {
  /** Element to listen on */
  target: EventTarget
  /** Which input kinds to observe (default: pointer and touch, not wheel) */
  type?: Array<'pointer' | 'touch' | 'wheel'>
  /** Gesture started */
  onPress?: ObserverCallback
  /** Pointer moved while down, or the wheel turned */
  onMove?: ObserverCallback
  /** Gesture ended */
  onRelease?: ObserverCallback
  /**
   * Ignore movements smaller than this many pixels before starting a drag,
   * so a click is not mistaken for a drag (default: 3).
   */
  tolerance?: number
  /** Call preventDefault on handled events (default: true) */
  preventDefault?: boolean
}

/** Smoothing applied to velocity, 0..1. Higher follows recent movement faster. */
const VELOCITY_SMOOTHING = 0.3

export class Observer {
  private options: ObserverOptions
  private target: EventTarget
  private running = false

  private dragging = false
  private passedTolerance = false
  private lastX = 0
  private lastY = 0
  private startX = 0
  private startY = 0
  private velocityX = 0
  private velocityY = 0
  private lastTime = 0

  constructor(options: ObserverOptions) {
    this.options = options
    this.target = options.target
  }

  start(): void {
    if (this.running) return
    this.running = true

    const types = this.options.type ?? ['pointer', 'touch']

    if (types.includes('pointer')) {
      this.target.addEventListener('pointerdown', this.onPointerDown)
      this.target.addEventListener('pointermove', this.onPointerMove)
      this.target.addEventListener('pointerup', this.onPointerUp)
      this.target.addEventListener('pointercancel', this.onPointerUp)
    }

    if (types.includes('touch')) {
      this.target.addEventListener('touchstart', this.onTouchStart, { passive: false })
      this.target.addEventListener('touchmove', this.onTouchMove, { passive: false })
      this.target.addEventListener('touchend', this.onTouchEnd)
    }

    if (types.includes('wheel')) {
      this.target.addEventListener('wheel', this.onWheel, { passive: false })
    }
  }

  stop(): void {
    if (!this.running) return
    this.running = false

    this.target.removeEventListener('pointerdown', this.onPointerDown)
    this.target.removeEventListener('pointermove', this.onPointerMove)
    this.target.removeEventListener('pointerup', this.onPointerUp)
    this.target.removeEventListener('pointercancel', this.onPointerUp)
    this.target.removeEventListener('touchstart', this.onTouchStart)
    this.target.removeEventListener('touchmove', this.onTouchMove)
    this.target.removeEventListener('touchend', this.onTouchEnd)
    this.target.removeEventListener('wheel', this.onWheel)
  }

  destroy(): void {
    this.stop()
  }

  /** Current velocity, in pixels per second. Read it on release for inertia. */
  get velocity(): { x: number; y: number } {
    return { x: this.velocityX, y: this.velocityY }
  }

  // --- gesture lifecycle --------------------------------------------------

  private begin(x: number, y: number, event: Event): void {
    this.dragging = true
    this.passedTolerance = false
    this.startX = x
    this.startY = y
    this.lastX = x
    this.lastY = y
    this.velocityX = 0
    this.velocityY = 0
    this.lastTime = now()

    this.options.onPress?.(this.stateFrom(0, 0, event))
  }

  private move(x: number, y: number, event: Event): void {
    if (!this.dragging) return

    const deltaX = x - this.lastX
    const deltaY = y - this.lastY
    this.lastX = x
    this.lastY = y

    const totalX = x - this.startX
    const totalY = y - this.startY

    // Hold off until the gesture is clearly a drag, so a click with a shaky
    // hand does not move anything.
    const tolerance = this.options.tolerance ?? 3
    if (!this.passedTolerance) {
      if (Math.hypot(totalX, totalY) < tolerance) return
      this.passedTolerance = true
    }

    this.updateVelocity(deltaX, deltaY)

    if (this.options.preventDefault !== false && event.cancelable) event.preventDefault()
    this.options.onMove?.(this.stateFrom(deltaX, deltaY, event))
  }

  private end(event: Event): void {
    if (!this.dragging) return
    this.dragging = false
    this.options.onRelease?.(this.stateFrom(0, 0, event))
  }

  private updateVelocity(deltaX: number, deltaY: number): void {
    const time = now()
    const elapsed = Math.max(1, time - this.lastTime)
    this.lastTime = time

    const instantX = (deltaX / elapsed) * 1000
    const instantY = (deltaY / elapsed) * 1000

    this.velocityX += (instantX - this.velocityX) * VELOCITY_SMOOTHING
    this.velocityY += (instantY - this.velocityY) * VELOCITY_SMOOTHING
  }

  private stateFrom(deltaX: number, deltaY: number, event: Event): ObserverState {
    return {
      deltaX,
      deltaY,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      totalX: this.lastX - this.startX,
      totalY: this.lastY - this.startY,
      isDragging: this.dragging,
      event,
    }
  }

  // --- listeners ----------------------------------------------------------

  private onPointerDown = (e: Event) => {
    const pe = e as PointerEvent
    this.begin(pe.clientX, pe.clientY, e)
  }

  private onPointerMove = (e: Event) => {
    const pe = e as PointerEvent
    this.move(pe.clientX, pe.clientY, e)
  }

  private onPointerUp = (e: Event) => this.end(e)

  private onTouchStart = (e: Event) => {
    const touch = (e as TouchEvent).touches[0]
    if (touch) this.begin(touch.clientX, touch.clientY, e)
  }

  private onTouchMove = (e: Event) => {
    const touch = (e as TouchEvent).touches[0]
    if (touch) this.move(touch.clientX, touch.clientY, e)
  }

  private onTouchEnd = (e: Event) => this.end(e)

  private onWheel = (e: Event) => {
    const we = e as WheelEvent
    if (this.options.preventDefault !== false && we.cancelable) we.preventDefault()

    // A wheel has no press/release, so report it as a standalone move.
    this.updateVelocity(we.deltaX, we.deltaY)
    this.options.onMove?.({
      deltaX: we.deltaX,
      deltaY: we.deltaY,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      totalX: 0,
      totalY: 0,
      isDragging: false,
      event: e,
    })
  }
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}
