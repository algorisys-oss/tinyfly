// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { convertToPath, pathDataOf, resolveMorphShape } from './live-morph'
import { createLive } from './live'
import { Stage, type FrameScheduler } from './stage'
import { hasKeyframes, type Track } from '../../engine'

const square = 'M0 0 L100 0 L100 100 L0 100 Z'

beforeEach(() => {
  document.body.innerHTML = `
    <svg>
      <path id="blob" class="shape" d="M0 0 L50 0 L50 50 Z" fill="red"></path>
      <path id="blob2" class="shape" d="M10 10 L60 10 L60 60 Z"></path>
      <circle id="ring" class="round" cx="50" cy="50" r="40" fill="blue" stroke-width="2"></circle>
      <rect id="box" x="0" y="0" width="100" height="100"></rect>
    </svg>
    <div id="wrapper"><svg><path d="M1 1 L2 2"></path></svg></div>
  `
})

const byId = (id: string) => document.getElementById(id)!

describe('pathDataOf', () => {
  it('reads paths, basic shapes, and the path inside a wrapper', () => {
    expect(pathDataOf(byId('blob'))).toBe('M0 0 L50 0 L50 50 Z')
    expect(pathDataOf(byId('ring'))).toMatch(/^M90 50 A40 40/)
    expect(pathDataOf(byId('wrapper'))).toBe('M1 1 L2 2')
    expect(pathDataOf(null)).toBeNull()
  })
})

describe('resolveMorphShape', () => {
  const query = (s: string) => document.querySelector(s)

  it('passes path data through, and resolves selectors, elements and { shape }', () => {
    const warn = vi.fn()
    expect(resolveMorphShape(square, query, warn)).toBe(square)
    expect(resolveMorphShape('#box', query, warn)).toMatch(/^M0 0 H100/)
    expect(resolveMorphShape(byId('blob'), query, warn)).toBe('M0 0 L50 0 L50 50 Z')
    expect(resolveMorphShape({ shape: '#blob' }, query, warn)).toBe('M0 0 L50 0 L50 50 Z')
    expect(warn).not.toHaveBeenCalled()
  })

  it('warns and returns empty when nothing is found', () => {
    const warn = vi.fn()
    expect(resolveMorphShape('#missing', query, warn)).toBe('')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('#missing'))
  })
})

describe('convertToPath', () => {
  it('replaces shapes with equivalent paths, keeping presentation attributes', () => {
    const [ring] = convertToPath('#ring')
    expect(ring.localName).toBe('path')
    expect(ring.getAttribute('d')).toMatch(/^M90 50 A40 40/)
    expect(ring.getAttribute('fill')).toBe('blue')
    expect(ring.getAttribute('stroke-width')).toBe('2')
    expect(ring.getAttribute('class')).toBe('round')
    expect(ring.hasAttribute('r')).toBe(false)
    expect(document.querySelector('circle')).toBeNull()
  })

  it('leaves paths and non-shapes as they are', () => {
    const blob = byId('blob')
    expect(convertToPath([blob, byId('wrapper')])).toEqual([blob, byId('wrapper')])
  })
})

describe('live morphSVG', () => {
  function setup() {
    let pending: ((t: number) => void) | null = null
    let now = 0
    const scheduler: FrameScheduler = { request: (cb) => ((pending = cb), 1), cancel: () => (pending = null) }
    const warnings: string[] = []
    const live = createLive(new Stage({ scheduler }))
    const run = (ms: number) => {
      for (let t = 0; t <= ms + 32; t += 16) {
        const cb = pending
        pending = null
        now += 16
        cb?.(now)
      }
    }
    return { live, run, warnings }
  }

  it('starts from the element\'s current shape and ends on the target', async () => {
    const { live, run } = setup()
    const tween = live.to('#blob', { morphSVG: '#box', duration: 0.2, ease: 'none' })
    const track = tween.timeline.tracks.filter(hasKeyframes)[0] as Track
    expect(track.keyframes[0].value).toBe('M0 0 L50 0 L50 50 Z')

    await Promise.resolve()
    run(100)
    const mid = byId('blob').getAttribute('d')!
    expect(mid).not.toBe('M0 0 L50 0 L50 50 Z')
    run(300)
    expect(byId('blob').getAttribute('d')).toMatch(/^M0 0 H100/)
  })

  it('gives every element its own start shape, staggered', () => {
    const { live } = setup()
    const tl = live.timeline({ paused: true }).to('.shape', { morphSVG: square, duration: 1, stagger: 0.25 })
    const tracks = tl.timeline.tracks.filter(hasKeyframes) as Track[]
    expect(tracks.map((t) => t.keyframes[0].value)).toEqual(['M0 0 L50 0 L50 50 Z', 'M10 10 L60 10 L60 60 Z'])
    expect(tracks.map((t) => t.delay)).toEqual([0, 250])
  })

  it('chains morphs from the last shape tinyfly applied', async () => {
    const { live, run } = setup()
    live.to('#blob', { morphSVG: square, duration: 0.1 })
    await Promise.resolve()
    run(200)
    const next = live.to('#blob', { morphSVG: '#box', duration: 0.1, paused: true })
    expect((next.timeline.tracks[0] as Track).keyframes[0].value).toBe(square)
  })

  it('warns and still plays the rest of the tween when the shape is missing', () => {
    const { live } = setup()
    const onWarning = vi.fn()
    const tl = live.timeline({ paused: true, onWarning }).to('#blob', { morphSVG: '#nope', opacity: 0.5 })
    expect(tl.timeline.tracks.map((t) => t.property)).toEqual(['opacity'])
    expect(onWarning).toHaveBeenCalled()
  })
})
