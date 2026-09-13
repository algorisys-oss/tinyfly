// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createLive, type LiveApi } from './live'
import { Stage, type FrameScheduler } from './stage'

/** Drive a stage by hand, and pointer events with a controlled clock. */
let clock = 0
let pending: ((t: number) => void) | null = null
let live: LiveApi

const run = (ms: number) => {
  for (let t = 0; t <= ms + 32; t += 16) {
    const cb = pending
    pending = null
    cb?.(t + clock)
  }
}

function pointer(el: Element, type: string, x: number, y: number, atMs: number) {
  clock = atMs
  el.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, bubbles: true }))
}

beforeEach(() => {
  document.body.innerHTML = '<div id="table"><div id="card"></div></div>'
  vi.spyOn(performance, 'now').mockImplementation(() => clock)
  const scheduler: FrameScheduler = { request: (cb) => ((pending = cb), 1), cancel: () => (pending = null) }
  live = createLive(new Stage({ scheduler }))
})

afterEach(() => vi.restoreAllMocks())

const card = () => document.getElementById('card')!

describe('live.draggable', () => {
  it('moves the element with the drag', () => {
    live.draggable('#card')
    pointer(card(), 'pointerdown', 0, 0, 0)
    pointer(card(), 'pointermove', 30, 10, 16)
    expect(card().style.transform).toBe('translateX(30px) translateY(10px)')
  })

  it('locks to one axis', () => {
    live.draggable('#card', { type: 'x' })
    pointer(card(), 'pointerdown', 0, 0, 0)
    pointer(card(), 'pointermove', 30, 40, 16)
    expect(card().style.transform).toBe('translateX(30px)')
  })

  it('keeps explicit bounds', () => {
    live.draggable('#card', { bounds: { minX: 0, maxX: 50 } })
    pointer(card(), 'pointerdown', 0, 0, 0)
    pointer(card(), 'pointermove', 200, 0, 16)
    expect(card().style.transform).toContain('translateX(50px)')
  })

  it('throws with the release velocity and settles on the nearest snap point', async () => {
    const onRelease = vi.fn()
    const onThrowComplete = vi.fn()
    live.draggable('#card', {
      type: 'x',
      inertia: { end: { x: [0, 100, 400] } },
      onRelease,
      onThrowComplete,
    })

    pointer(card(), 'pointerdown', 0, 0, 0)
    for (let i = 1; i <= 5; i++) pointer(card(), 'pointermove', i * 20, 0, i * 16)
    pointer(card(), 'pointerup', 100, 0, 5 * 16)

    const velocity = onRelease.mock.calls[0][0].x
    expect(velocity).toBeGreaterThan(0)

    await Promise.resolve()
    run(4000)
    // 100px dragged, then a free throw of velocity/4 more, snapped to the nearest end.
    const natural = 100 + velocity / 4
    const expected = [0, 100, 400].reduce((best, v) => (Math.abs(v - natural) < Math.abs(best - natural) ? v : best))
    expect(card().style.transform).toBe(`translateX(${expected}px)`)
    expect(onThrowComplete).toHaveBeenCalled()
  })

  it('snaps to the nearest point in 2D', async () => {
    const d = live.draggable('#card', { inertia: { end: [{ x: 0, y: 0 }, { x: 300, y: 300 }] } })
    pointer(card(), 'pointerdown', 0, 0, 0)
    for (let i = 1; i <= 4; i++) pointer(card(), 'pointermove', i * 40, i * 40, i * 16)
    pointer(card(), 'pointerup', 160, 160, 64)
    await Promise.resolve()
    run(4000)
    expect(d.position).toEqual({ x: 300, y: 300 })
  })

  it('stops a throw when the element is picked up again, from where it is', async () => {
    const d = live.draggable('#card', { type: 'x', inertia: true })
    pointer(card(), 'pointerdown', 0, 0, 0)
    for (let i = 1; i <= 5; i++) pointer(card(), 'pointermove', i * 30, 0, i * 16)
    pointer(card(), 'pointerup', 150, 0, 80)
    await Promise.resolve()
    run(120)

    const midThrow = d.position.x
    expect(midThrow).toBeGreaterThan(150)

    pointer(card(), 'pointerdown', 500, 0, 1000)
    pointer(card(), 'pointermove', 510, 0, 1016)
    run(500)
    expect(d.position.x).toBeCloseTo(midThrow + 10)
  })

  it('destroys cleanly', () => {
    const d = live.draggable('#card')
    d.destroy()
    pointer(card(), 'pointerdown', 0, 0, 0)
    pointer(card(), 'pointermove', 30, 0, 16)
    expect(card().style.transform).toBe('')
  })

  it('throws a clear error when the target is missing', () => {
    expect(() => live.draggable('#missing')).toThrow(/could not find/)
  })
})
