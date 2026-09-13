// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { createLive, type LiveApi } from './live'
import { Stage, type FrameScheduler } from './stage'

/**
 * happy-dom has no layout, so each element's box is set by hand. Moving an
 * element in a "layout change" means updating its box. A box reflects the
 * element's current transform the way a browser would: layout position plus
 * translate, size times scale about the centre.
 */
const layout = new Map<Element, { left: number; top: number; width: number; height: number } | null>()

function place(el: Element, left: number, top: number, width = 50, height = 50) {
  layout.set(el, { left, top, width, height })
}

function installGeometry(el: Element) {
  el.getBoundingClientRect = () => {
    const box = layout.get(el)
    if (!box) return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0, x: 0, y: 0 } as DOMRect
    const t = (el as HTMLElement).style.transform
    const read = (fn: string, fallback: number) => {
      const m = t.match(new RegExp(`${fn}\\(([-\\d.]+)`))
      return m ? Number(m[1]) : fallback
    }
    const none = t === 'none' || t === ''
    const tx = none ? 0 : read('translateX', 0)
    const ty = none ? 0 : read('translateY', 0)
    const sx = none ? 1 : read('scaleX', 1)
    const sy = none ? 1 : read('scaleY', 1)
    const width = box.width * sx
    const height = box.height * sy
    const left = box.left + tx + (box.width - width) / 2
    const top = box.top + ty + (box.height - height) / 2
    return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top } as DOMRect
  }
}

let live: LiveApi
let pending: ((t: number) => void) | null = null
let now = 0
const run = (ms: number) => {
  for (let t = 0; t <= ms + 32; t += 16) {
    const cb = pending
    pending = null
    now += 16
    cb?.(now)
  }
}
const items = () => [...document.querySelectorAll('.item')]
const centre = (el: Element) => {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }
}

beforeEach(() => {
  layout.clear()
  document.body.innerHTML = '<div class="item" id="a"></div><div class="item" id="b"></div><div class="item" id="c"></div>'
  items().forEach((el, i) => {
    installGeometry(el)
    place(el, i * 60, 0)
  })
  const scheduler: FrameScheduler = { request: (cb) => ((pending = cb), 1), cancel: () => (pending = null) }
  live = createLive(new Stage({ scheduler }))
})

describe('live flip', () => {
  it('starts each element where it was and ends where the layout put it', async () => {
    const [a] = items()
    const before = centre(a)
    live.flip('.item', () => place(a, 200, 100), { duration: 0.5, ease: 'none' })
    // Autoplay applies the first frame: visually unchanged, despite the layout change.
    await Promise.resolve()
    expect(centre(a).x).toBeCloseTo(before.x)
    expect(centre(a).y).toBeCloseTo(before.y)

    run(600)
    expect(centre(a).x).toBeCloseTo(225)
    expect(centre(a).y).toBeCloseTo(125)
    expect((a as HTMLElement).style.transform).toContain('translateX(0px)')
  })

  it('animates size with scale, keeping centres aligned', async () => {
    const [a] = items()
    live.flip('.item', () => place(a, 0, 0, 200, 100), { duration: 0.5, ease: 'none' })
    await Promise.resolve() // autoplay applies the first frame
    const start = centre(a)
    expect(start.w).toBeCloseTo(50)
    expect(start.h).toBeCloseTo(50)
    expect(start.x).toBeCloseTo(25)
    run(600)
    expect(centre(a).w).toBeCloseTo(200)
    expect(centre(a).x).toBeCloseTo(100)
  })

  it('moves only, when scale is off', async () => {
    const [a] = items()
    live.flip('.item', () => place(a, 100, 0, 200, 100), { scale: false, duration: 0.2 })
    await Promise.resolve() // autoplay applies the first frame
    expect((a as HTMLElement).style.transform).not.toContain('scaleX(0.25)')
  })

  it('leaves unmoved elements alone', async () => {
    const [a, b] = items()
    const tl = live.flip('.item', () => place(a, 300, 0), { duration: 0.2 })
    const targets = new Set(tl.timeline.tracks.filter((t) => t.property === 'x').map((t) => t.target))
    expect(targets.size).toBe(1)
    expect(b.getAttribute('style') ?? '').not.toContain('translateX(')
  })

  it('staggers elements in document order', () => {
    const [a, b, c] = items()
    const tl = live.flip('.item', () => {
      place(a, 0, 100)
      place(b, 60, 100)
      place(c, 120, 100)
    }, { duration: 0.5, stagger: 0.1 })
    const delays = ['a', 'b', 'c'].map((id) => tl.timeline.tracks.find((t) => t.target === `#${id}` && t.property === 'y')?.delay)
    expect(delays).toEqual([0, 100, 200])
  })

  it('fades newly visible elements in', async () => {
    const [, , c] = items()
    layout.set(c, null) // hidden before
    live.flip('.item', () => place(c, 120, 0), { duration: 0.3, ease: 'none' })
    await Promise.resolve() // autoplay applies the first frame
    expect((c as HTMLElement).style.opacity).toBe('0')
    run(400)
    expect((c as HTMLElement).style.opacity).toBe('1')
  })

  it('can skip the entrance', () => {
    const [, , c] = items()
    layout.set(c, null)
    const tl = live.flip('.item', () => place(c, 120, 0), { enter: false })
    expect(tl.timeline.tracks.some((t) => t.target === '#c')).toBe(false)
  })

  it('continues smoothly when a flip is interrupted', async () => {
    const [a] = items()
    live.flip('.item', () => place(a, 300, 0), { duration: 1, ease: 'none' })
    await Promise.resolve()
    run(500)
    const midway = centre(a)
    expect(midway.x).toBeGreaterThan(40)
    expect(midway.x).toBeLessThan(310)

    // Flip back mid-way: the new flip starts from where it appears right now.
    live.flip('.item', () => place(a, 0, 0), { duration: 1, ease: 'none' })
    await Promise.resolve() // autoplay applies the first frame
    expect(centre(a).x).toBeCloseTo(midway.x, 0)
    run(1100)
    expect(centre(a).x).toBeCloseTo(25)
  })

  it('works with getFlipState and flipFrom separately', async () => {
    const [a] = items()
    const state = live.getFlipState('.item')
    place(a, 0, 200)
    live.flipFrom(state, { duration: 0.2, ease: 'none' })
    await Promise.resolve() // autoplay applies the first frame
    expect(centre(a).y).toBeCloseTo(25)
    run(300)
    expect(centre(a).y).toBeCloseTo(225)
  })

  it('calls onComplete', async () => {
    const [a] = items()
    let done = false
    live.flip('.item', () => place(a, 100, 0), { duration: 0.2, onComplete: () => (done = true) })
    await Promise.resolve()
    run(300)
    expect(done).toBe(true)
  })
})
