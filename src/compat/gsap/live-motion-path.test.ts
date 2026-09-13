// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolveLiveMotionPath } from './live-motion-path'
import { createLive } from './live'
import { Stage, type FrameScheduler } from './stage'
import { isMotionPathTrack, type MotionPathTrack } from '../../engine'

/**
 * The live runtime resolves a motion path's element references into data.
 * happy-dom has no layout, so element geometry is stubbed per test.
 */

beforeEach(() => {
  document.body.innerHTML = `
    <svg><path id="route" d="M0 0 L100 0"></path><circle id="ring" cx="50" cy="50" r="40"></circle></svg>
    <div id="plane"></div><div id="plane2"></div>
  `
})

const byId = (id: string) => document.getElementById(id)!
const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top }) as DOMRect

const context = (targets: Element[] = [byId('plane')], warn = vi.fn()) => ({
  query: (selector: string) => document.querySelector(selector),
  targets,
  warn,
})

describe('resolveLiveMotionPath', () => {
  it('passes data and points through untouched', () => {
    expect(resolveLiveMotionPath('M0 0 L1 1', context()).path).toBe('M0 0 L1 1')
    expect(resolveLiveMotionPath([{ x: 1, y: 2 }], context()).path).toEqual([{ x: 1, y: 2 }])
  })

  it('reads a path element by selector or reference', () => {
    expect(resolveLiveMotionPath('#route', context()).path).toBe('M0 0 L100 0')
    expect(resolveLiveMotionPath({ path: byId('route') }, context()).path).toBe('M0 0 L100 0')
  })

  it('converts basic shapes to path data', () => {
    expect(resolveLiveMotionPath('#ring', context()).path).toMatch(/^M90 50 A40 40/)
  })

  it('warns when the element is missing or has no geometry', () => {
    const warn = vi.fn()
    resolveLiveMotionPath('#nope', context(undefined, warn))
    resolveLiveMotionPath('#plane', context(undefined, warn))
    expect(warn).toHaveBeenCalledTimes(2)
  })

  it('keeps autoRotate, start and end', () => {
    expect(resolveLiveMotionPath({ path: '#route', autoRotate: 90, start: 0.1 }, context())).toMatchObject({ autoRotate: 90, start: 0.1 })
  })

  it('aligns the path over its element, centring the follower on it', () => {
    ;(byId('route') as unknown as { getScreenCTM: () => DOMMatrix }).getScreenCTM = () =>
      ({ a: 2, b: 0, c: 0, d: 2, e: 300, f: 200 }) as DOMMatrix
    byId('plane').getBoundingClientRect = () => rect(50, 40, 20, 10)

    const resolved = resolveLiveMotionPath({ path: '#route', align: true }, context())
    // Translation: CTM offset minus the follower's layout origin minus half its size.
    expect(resolved.matrix).toEqual([2, 0, 0, 2, 300 - 50 - 10, 200 - 40 - 5])
  })

  it('honours alignOrigin', () => {
    ;(byId('route') as unknown as { getScreenCTM: () => DOMMatrix }).getScreenCTM = () =>
      ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }) as DOMMatrix
    byId('plane').getBoundingClientRect = () => rect(0, 0, 20, 10)
    expect(resolveLiveMotionPath({ path: '#route', align: true, alignOrigin: [0, 1] }, context()).matrix).toEqual([1, 0, 0, 1, 0, -10])
  })

  it('measures the follower without its own transform', () => {
    const plane = byId('plane')
    plane.style.transform = 'translateX(500px)'
    let seen = ''
    plane.getBoundingClientRect = () => ((seen = plane.style.transform), rect(0, 0, 0, 0))
    resolveLiveMotionPath({ path: 'M0 0 L1 0', align: '#route' }, context())
    expect(seen).toBe('none')
    expect(plane.style.transform).toBe('translateX(500px)')
  })

  it('aligns to an HTML element by its top-left corner', () => {
    const box = document.createElement('div')
    box.id = 'box'
    document.body.appendChild(box)
    box.getBoundingClientRect = () => rect(100, 100, 50, 50)
    byId('plane').getBoundingClientRect = () => rect(0, 0, 0, 0)
    expect(resolveLiveMotionPath({ path: 'M0 0 L1 0', align: '#box' }, context()).matrix).toEqual([1, 0, 0, 1, 100, 100])
  })

  it('warns when followers that share an alignment are laid out apart', () => {
    const warn = vi.fn()
    ;(byId('route') as unknown as { getScreenCTM: () => DOMMatrix }).getScreenCTM = () =>
      ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }) as DOMMatrix
    byId('plane').getBoundingClientRect = () => rect(0, 0, 10, 10)
    byId('plane2').getBoundingClientRect = () => rect(0, 80, 10, 10)
    resolveLiveMotionPath({ path: '#route', align: true }, context([byId('plane'), byId('plane2')], warn))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('first target'))
  })

  it('warns that align: true needs a path element', () => {
    const warn = vi.fn()
    resolveLiveMotionPath({ path: 'M0 0 L1 0', align: true }, context(undefined, warn))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('align: true'))
  })
})

describe('live.to() with motionPath', () => {
  function setup() {
    let pending: ((t: number) => void) | null = null
    let now = 0
    const scheduler: FrameScheduler = { request: (cb) => ((pending = cb), 1), cancel: () => (pending = null) }
    const live = createLive(new Stage({ scheduler }))
    const run = (ms: number) => {
      for (let t = 0; t <= ms + 16; t += 16) {
        const cb = pending
        pending = null
        now += 16
        cb?.(now)
      }
    }
    return { live, run }
  }

  it('moves an element along a path element', async () => {
    const { live, run } = setup()
    const tween = live.to('#plane', { motionPath: { path: '#route', autoRotate: true }, duration: 0.2, ease: 'none' })
    await Promise.resolve()
    run(300)
    expect(byId('plane').style.transform).toContain('translateX(100px)')
    expect((tween.timeline.tracks.find(isMotionPathTrack) as MotionPathTrack).motionPathConfig.pathData).toBe('M0 0 L100 0')
  })
})
