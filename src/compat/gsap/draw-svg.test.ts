// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { drawSegment, drawSvgProperties } from './draw-svg-vars'
import { createLive, type LiveApi } from './live'
import { Stage, type FrameScheduler } from './stage'
import { timeline } from './index'

describe('drawSegment', () => {
  it('reads booleans, px numbers, percentages and mixed pairs', () => {
    expect(drawSegment(true, 200)).toEqual([0, 200])
    expect(drawSegment(false, 200)).toEqual([0, 0])
    expect(drawSegment(50, 200)).toEqual([0, 50])
    expect(drawSegment('25%', 200)).toEqual([0, 50])
    expect(drawSegment('20% 80%', 200)).toEqual([40, 160])
    expect(drawSegment('10 50%', 200)).toEqual([10, 100])
    expect(drawSegment('90% 10%', 200)).toEqual([20, 180])
  })

  it('clamps to the stroke and rejects nonsense', () => {
    expect(drawSegment('0% 150%', 200)).toEqual([0, 200])
    expect(drawSegment(-5, 200)).toEqual([0, 0])
    expect(() => drawSegment('half', 200)).toThrow(/drawSVG/)
  })

  it('turns a segment into one dash and an offset', () => {
    expect(drawSvgProperties('25% 75%', 400)).toEqual({ strokeDasharray: [200, 400], strokeDashoffset: -100 })
  })
})

describe('drawSVG on live', () => {
  let live: LiveApi
  let pending: ((t: number) => void) | null = null
  let now = 0
  const scheduler: FrameScheduler = { request: (cb) => ((pending = cb), 1), cancel: () => (pending = null) }
  const frame = (ms: number) => {
    const cb = pending
    pending = null
    now += ms
    cb?.(now)
  }
  const flush = () => Promise.resolve()

  beforeEach(() => {
    document.body.innerHTML = `<svg><path id="a" d="M0 0 L100 0"/><path id="b" d="M0 0 L300 0"/><rect id="r"/></svg><div id="div"></div>`
    const lengths: Record<string, number> = { a: 100, b: 300, r: 40 }
    for (const [id, length] of Object.entries(lengths)) {
      ;(document.getElementById(id) as unknown as { getTotalLength: () => number }).getTotalLength = () => length
    }
    live = createLive(new Stage({ scheduler }))
  })

  const dash = (id: string) => {
    const style = (document.getElementById(id) as unknown as HTMLElement).style
    return { array: style.strokeDasharray.replace(/\s+/g, ''), offset: Number(style.strokeDashoffset) }
  }

  it('draws a stroke in with from(drawSVG: 0), ending fully drawn', async () => {
    live.from('#a', { drawSVG: 0, duration: 1, ease: 'none' })
    await flush()
    frame(0)
    expect(dash('a').array).toBe('0,100')
    frame(500)
    expect(dash('a').array).toBe('50,100')
    frame(600)
    expect(dash('a')).toEqual({ array: '100,100', offset: 0 })
  })

  it('animates a segment, each element with its own length, staggered', async () => {
    live.to(['#a', '#b'], { drawSVG: '25% 75%', duration: 1, ease: 'none', stagger: 0.5 })
    await flush()
    frame(0)
    frame(1600)
    expect(dash('a')).toEqual({ array: '50,100', offset: -25 })
    expect(dash('b')).toEqual({ array: '150,300', offset: -75 })
  })

  it('works in fromTo across several shapes', async () => {
    live.fromTo(['#a', '#r'], { drawSVG: '50% 50%' }, { drawSVG: true, duration: 0.5 })
    await flush()
    frame(0)
    frame(600)
    expect(dash('a')).toEqual({ array: '100,100', offset: 0 })
    expect(dash('r')).toEqual({ array: '40,40', offset: 0 })
  })

  it('warns and skips the draw on something with no stroke length, keeping the rest', async () => {
    const warnings: string[] = []
    live.timeline({ onWarning: (m) => warnings.push(m) }).to('#div', { drawSVG: 0, opacity: 0.5, duration: 0.1 })
    await flush()
    frame(0)
    frame(200)
    expect(warnings.join()).toMatch(/drawSVG needs an SVG shape/)
    expect((document.getElementById('div') as HTMLElement).style.opacity).toBe('0.5')
  })

  it('is rejected by the compiling timeline, which has no page to measure', () => {
    expect(() => timeline().to('shape', { drawSVG: '50%' })).toThrow(/drawSVG needs the stroke length/)
  })
})
