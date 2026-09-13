// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLive, type LiveApi } from './live'
import { Stage } from './stage'

/**
 * Page transitions. Frames are driven by a timer-backed scheduler so the promise
 * resolves as animations complete; layout boxes are given by hand.
 */

let live: LiveApi
let stage: Stage
const boxes = new Map<Element, { left: number; top: number; width: number; height: number }>()

beforeEach(() => {
  vi.useFakeTimers()
  let now = 0
  stage = new Stage({
    scheduler: {
      request: (cb) => setTimeout(() => cb((now += 16)), 16) as unknown as number,
      cancel: (id) => clearTimeout(id),
    },
  })
  live = createLive(stage)
  boxes.clear()
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const box = boxes.get(this) ?? { left: 0, top: 0, width: 0, height: 0 }
    return { ...box, right: box.left + box.width, bottom: box.top + box.height, x: box.left, y: box.top, toJSON: () => ({}) } as DOMRect
  })
  document.body.innerHTML = '<main id="app"><div class="page" id="list"><div class="thumb" data-flip-id="p1"></div></div></main>'
  boxes.set(document.querySelector('.thumb')!, { left: 10, top: 10, width: 50, height: 50 })
})

afterEach(() => {
  stage.destroy()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const run = async (promise: Promise<void>) => {
  let done = false
  promise.then(() => (done = true))
  for (let i = 0; i < 200 && !done; i++) await vi.advanceTimersByTimeAsync(16)
  return done
}

describe('live.pageTransition', () => {
  it('animates the old view out, then updates, then animates the new view in', async () => {
    const order: string[] = []
    const list = document.getElementById('list')!
    const finished = await run(
      live.pageTransition({
        from: '.page',
        to: '.page',
        duration: 0.1,
        update: () => {
          order.push(`update (old opacity ${list.style.opacity})`)
          list.outerHTML = '<div class="page" id="detail"><h1>Detail</h1></div>'
        },
      })
    )
    expect(finished).toBe(true)
    expect(order).toEqual(['update (old opacity 0)'])
    expect(document.getElementById('detail')!.style.opacity).toBe('1')
  })

  it('waits for an async update', async () => {
    let resolved = false
    const finished = await run(
      live.pageTransition({
        leave: false,
        duration: 0.05,
        update: () => new Promise<void>((resolve) => setTimeout(() => ((resolved = true), resolve()), 100)),
      })
    )
    expect(finished && resolved).toBe(true)
  })

  it('carries a shared element across: the new one starts where the old one was', async () => {
    const promise = live.pageTransition({
      shared: '[data-flip-id]',
      leave: false,
      enter: false,
      duration: 0.2,
      ease: 'none',
      update: () => {
        document.getElementById('app')!.innerHTML = '<div class="page"><div class="hero" data-flip-id="p1"></div></div>'
        boxes.set(document.querySelector('.hero')!, { left: 100, top: 200, width: 300, height: 150 })
      },
    })
    await vi.advanceTimersByTimeAsync(20)
    const hero = document.querySelector('.hero') as HTMLElement
    // Starts over the thumbnail: centre (35, 35) is (250, 275) shifted by (-215, -240).
    expect(hero.style.transform).toContain('translateX(-215px)')
    expect(await run(promise)).toBe(true)
    expect(hero.style.transform).toContain('translateX(0px)')
  })

  it('hands the whole change to the View Transitions API when asked and available', async () => {
    const names: string[] = []
    ;(document as unknown as { startViewTransition: unknown }).startViewTransition = (update: () => Promise<void>) => {
      names.push((document.querySelector('.thumb') as HTMLElement).style.getPropertyValue('view-transition-name'))
      const finished = update().then(() => {
        names.push((document.querySelector('.hero') as HTMLElement).style.getPropertyValue('view-transition-name'))
      })
      return { finished }
    }
    const update = vi.fn(() => {
      document.getElementById('app')!.innerHTML = '<div class="hero" data-flip-id="p1"></div>'
    })
    await live.pageTransition({ native: true, shared: '[data-flip-id]', update })
    expect(update).toHaveBeenCalledTimes(1)
    expect(names).toEqual(['tf-p1', 'tf-p1'])
    expect((document.querySelector('.hero') as HTMLElement).style.getPropertyValue('view-transition-name')).toBe('')
    delete (document as unknown as { startViewTransition?: unknown }).startViewTransition
  })
})
