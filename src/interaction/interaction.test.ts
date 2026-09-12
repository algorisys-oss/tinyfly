import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Observer } from './observer'
import { Draggable } from './draggable'
import { Timeline, createTrack } from '../engine'

/**
 * The interaction layer is live input with no serializable form — these tests
 * drive it through a fake event target rather than a real DOM.
 */

class FakeTarget implements EventTarget {
  listeners = new Map<string, Set<EventListener>>()

  addEventListener(type: string, fn: EventListenerOrEventListenerObject | null): void {
    if (!fn) return
    const set = this.listeners.get(type) ?? new Set()
    set.add(fn as EventListener)
    this.listeners.set(type, set)
  }

  removeEventListener(type: string, fn: EventListenerOrEventListenerObject | null): void {
    if (!fn) return
    this.listeners.get(type)?.delete(fn as EventListener)
  }

  dispatchEvent(): boolean {
    return true
  }

  /** Fire a synthetic pointer event. */
  emit(type: string, props: Record<string, unknown> = {}): void {
    const event = { type, cancelable: true, preventDefault: vi.fn(), ...props } as unknown as Event
    for (const fn of this.listeners.get(type) ?? []) fn(event)
  }

  count(type: string): number {
    return this.listeners.get(type)?.size ?? 0
  }
}

const drag = (target: FakeTarget, path: Array<[number, number]>) => {
  target.emit('pointerdown', { clientX: path[0][0], clientY: path[0][1] })
  for (const [x, y] of path.slice(1)) {
    target.emit('pointermove', { clientX: x, clientY: y })
  }
}

describe('Observer', () => {
  let target: FakeTarget

  beforeEach(() => {
    target = new FakeTarget()
  })

  it('registers pointer listeners on start', () => {
    new Observer({ target }).start()
    expect(target.count('pointerdown')).toBe(1)
    expect(target.count('pointermove')).toBe(1)
  })

  it('removes listeners on stop', () => {
    const observer = new Observer({ target })
    observer.start()
    observer.stop()
    expect(target.count('pointerdown')).toBe(0)
    expect(target.count('pointermove')).toBe(0)
  })

  it('ignores a second start', () => {
    const observer = new Observer({ target })
    observer.start()
    observer.start()
    expect(target.count('pointerdown')).toBe(1)
  })

  it('reports a press', () => {
    const onPress = vi.fn()
    new Observer({ target, onPress }).start()
    target.emit('pointerdown', { clientX: 10, clientY: 20 })
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('ignores movement below the tolerance', () => {
    const onMove = vi.fn()
    new Observer({ target, onMove, tolerance: 10 }).start()
    drag(target, [[0, 0], [3, 0], [5, 0]])
    expect(onMove).not.toHaveBeenCalled()
  })

  it('starts reporting once the tolerance is passed', () => {
    const onMove = vi.fn()
    new Observer({ target, onMove, tolerance: 5 }).start()
    drag(target, [[0, 0], [20, 0]])
    expect(onMove).toHaveBeenCalledTimes(1)
  })

  it('accumulates total movement across a gesture', () => {
    const onMove = vi.fn()
    new Observer({ target, onMove, tolerance: 0 }).start()
    drag(target, [[0, 0], [10, 5], [30, 15]])

    const last = onMove.mock.calls[onMove.mock.calls.length - 1][0]
    expect(last.totalX).toBe(30)
    expect(last.totalY).toBe(15)
  })

  it('reports per-event deltas', () => {
    const onMove = vi.fn()
    new Observer({ target, onMove, tolerance: 0 }).start()
    drag(target, [[0, 0], [10, 0], [25, 0]])

    const last = onMove.mock.calls[onMove.mock.calls.length - 1][0]
    expect(last.deltaX).toBe(15)
  })

  it('does not report movement without a press', () => {
    const onMove = vi.fn()
    new Observer({ target, onMove, tolerance: 0 }).start()
    target.emit('pointermove', { clientX: 50, clientY: 50 })
    expect(onMove).not.toHaveBeenCalled()
  })

  it('reports a release and clears the dragging flag', () => {
    const onRelease = vi.fn()
    new Observer({ target, onRelease, tolerance: 0 }).start()
    drag(target, [[0, 0], [20, 0]])
    target.emit('pointerup', {})

    expect(onRelease).toHaveBeenCalledTimes(1)
    expect(onRelease.mock.calls[0][0].isDragging).toBe(false)
  })

  it('treats pointercancel as a release', () => {
    const onRelease = vi.fn()
    new Observer({ target, onRelease, tolerance: 0 }).start()
    drag(target, [[0, 0], [20, 0]])
    target.emit('pointercancel', {})
    expect(onRelease).toHaveBeenCalledTimes(1)
  })

  it('handles touch input', () => {
    const onMove = vi.fn()
    new Observer({ target, type: ['touch'], onMove, tolerance: 0 }).start()

    target.emit('touchstart', { touches: [{ clientX: 0, clientY: 0 }] })
    target.emit('touchmove', { touches: [{ clientX: 40, clientY: 0 }] })

    expect(onMove.mock.calls[0][0].totalX).toBe(40)
  })

  it('reports wheel movement without a press', () => {
    const onMove = vi.fn()
    new Observer({ target, type: ['wheel'], onMove }).start()
    target.emit('wheel', { deltaX: 0, deltaY: 120 })

    expect(onMove).toHaveBeenCalledTimes(1)
    expect(onMove.mock.calls[0][0].deltaY).toBe(120)
  })

  it('tracks a non-zero velocity while moving', () => {
    const observer = new Observer({ target, tolerance: 0 })
    observer.start()
    drag(target, [[0, 0], [50, 0], [120, 0]])
    expect(Math.abs(observer.velocity.x)).toBeGreaterThan(0)
  })
})

describe('Draggable', () => {
  let target: FakeTarget

  beforeEach(() => {
    target = new FakeTarget()
  })

  it('starts at the origin', () => {
    expect(new Draggable({ target }).position).toEqual({ x: 0, y: 0 })
  })

  it('honours an initial position', () => {
    const d = new Draggable({ target, initialX: 40, initialY: 10 })
    expect(d.position).toEqual({ x: 40, y: 10 })
  })

  it('follows the drag on both axes', () => {
    const d = new Draggable({ target })
    d.start()
    drag(target, [[0, 0], [60, 30]])
    expect(d.position).toEqual({ x: 60, y: 30 })
  })

  it('locks to the x axis', () => {
    const d = new Draggable({ target, axis: 'x' })
    d.start()
    drag(target, [[0, 0], [60, 30]])
    expect(d.position).toEqual({ x: 60, y: 0 })
  })

  it('locks to the y axis', () => {
    const d = new Draggable({ target, axis: 'y' })
    d.start()
    drag(target, [[0, 0], [60, 30]])
    expect(d.position).toEqual({ x: 0, y: 30 })
  })

  it('clamps to bounds', () => {
    const d = new Draggable({ target, bounds: { minX: -10, maxX: 25 } })
    d.start()
    drag(target, [[0, 0], [200, 0]])
    expect(d.position.x).toBe(25)

    drag(target, [[0, 0], [-200, 0]])
    expect(d.position.x).toBe(-10)
  })

  it('snaps to a grid', () => {
    const d = new Draggable({ target, snap: 25 })
    d.start()
    drag(target, [[0, 0], [63, 0]])
    expect(d.position.x).toBe(75)
  })

  it('resumes from the previous position on a second gesture', () => {
    const d = new Draggable({ target })
    d.start()
    drag(target, [[0, 0], [50, 0]])
    target.emit('pointerup', {})
    drag(target, [[100, 0], [130, 0]])
    expect(d.position.x).toBe(80)
  })

  it('calls onDrag with the new position', () => {
    const onDrag = vi.fn()
    const d = new Draggable({ target, onDrag })
    d.start()
    drag(target, [[0, 0], [30, 0]])
    expect(onDrag).toHaveBeenLastCalledWith({ x: 30, y: 0 }, expect.anything())
  })

  it('setPosition applies bounds and snapping', () => {
    const d = new Draggable({ target, snap: 10, bounds: { maxX: 50 } })
    d.setPosition(999, 23)
    expect(d.position).toEqual({ x: 50, y: 20 })
  })

  it('removes listeners on destroy', () => {
    const d = new Draggable({ target })
    d.start()
    d.destroy()
    expect(target.count('pointerdown')).toBe(0)
  })
})

describe('Draggable scrub mode', () => {
  let target: FakeTarget

  const buildTimeline = () =>
    new Timeline({
      id: 'tl',
      tracks: [
        createTrack({
          id: 'o',
          target: 'box',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 0 },
            { time: 1000, value: 1 },
          ],
        }),
      ],
    })

  beforeEach(() => {
    target = new FakeTarget()
  })

  it('maps drag distance onto the playhead', () => {
    const timeline = buildTimeline()
    new Draggable({ target, mode: 'scrub', timeline, scrubDistance: 500 }).start()

    drag(target, [[0, 0], [250, 0]])
    expect(timeline.currentTime).toBe(500)
  })

  it('clamps at the end of the timeline', () => {
    const timeline = buildTimeline()
    new Draggable({ target, mode: 'scrub', timeline, scrubDistance: 500 }).start()

    drag(target, [[0, 0], [9999, 0]])
    expect(timeline.currentTime).toBe(1000)
  })

  it('clamps at the start', () => {
    const timeline = buildTimeline()
    new Draggable({ target, mode: 'scrub', timeline, scrubDistance: 500 }).start()

    drag(target, [[0, 0], [-9999, 0]])
    expect(timeline.currentTime).toBe(0)
  })

  it('pauses the timeline so it does not also self-advance', () => {
    const timeline = buildTimeline()
    timeline.play()
    new Draggable({ target, mode: 'scrub', timeline, scrubDistance: 500 }).start()

    drag(target, [[0, 0], [100, 0]])
    expect(timeline.playbackState).toBe('paused')
  })

  it('scrubs on the y axis when locked to it', () => {
    const timeline = buildTimeline()
    new Draggable({ target, mode: 'scrub', timeline, axis: 'y', scrubDistance: 200 }).start()

    drag(target, [[0, 0], [0, 100]])
    expect(timeline.currentTime).toBe(500)
  })

  it('does nothing without a timeline', () => {
    const d = new Draggable({ target, mode: 'scrub', scrubDistance: 500 })
    d.start()
    expect(() => drag(target, [[0, 0], [100, 0]])).not.toThrow()
  })
})
