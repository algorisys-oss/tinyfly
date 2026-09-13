import { describe, it, expect } from 'vitest'
import { timeline } from './timeline'
import { desugarMorph, morphShapeOf } from './morph-vars'
import { hasKeyframes, type Track } from '../../engine'

const circle = 'M100 50 A50 50 0 1 1 0 50 A50 50 0 1 1 100 50 Z'
const square = 'M0 0 L100 0 L100 100 L0 100 Z'

const dTrack = (tl: ReturnType<typeof timeline>) =>
  tl.timeline.tracks.filter(hasKeyframes).find((t) => t.property === 'd') as Track

describe('desugarMorph', () => {
  it('turns morphSVG into d', () => {
    expect(desugarMorph({ morphSVG: square, duration: 1 })).toEqual({ d: square, duration: 1 })
    expect(desugarMorph({ morphSVG: { shape: square } })).toEqual({ d: square })
  })

  it('leaves vars without morphSVG alone', () => {
    const vars = { x: 1 }
    expect(desugarMorph(vars)).toBe(vars)
  })

  it('rejects selectors with a pointer to live.to()', () => {
    expect(() => desugarMorph({ morphSVG: '#star' })).toThrow(/live\.to\(\)/)
  })

  it('reads the shape from either form', () => {
    expect(morphShapeOf('#a')).toBe('#a')
    expect(morphShapeOf({ shape: '#b' })).toBe('#b')
  })
})

describe('morphSVG in timelines', () => {
  it('compiles fromTo to a d track between the two shapes', () => {
    const tl = timeline()
    tl.fromTo('shape', { d: circle }, { morphSVG: square, duration: 1, ease: 'none' })
    expect(dTrack(tl).keyframes.map((k) => k.value)).toEqual([circle, square])
  })

  it('morphs through intermediate shapes when played', () => {
    const tl = timeline()
    tl.fromTo('shape', { d: circle }, { morphSVG: square, duration: 1, ease: 'none' })
    const mid = tl.timeline.getStateAtTime(500).values.get('shape')!.get('d') as string
    expect(mid).not.toBe(circle)
    expect(mid).not.toBe(square)
    expect(mid.startsWith('M')).toBe(true)
  })

  it('chains: the next morph starts from the last shape', () => {
    const tl = timeline()
    tl.fromTo('shape', { d: circle }, { morphSVG: square, duration: 1 })
    tl.to('shape', { morphSVG: circle, duration: 1 })
    const tracks = tl.timeline.tracks.filter((t) => t.property === 'd') as Track[]
    expect(tracks[1].keyframes[0].value).toBe(square)
  })

  it('refuses to morph from nothing', () => {
    expect(() => timeline().to('shape', { morphSVG: square })).toThrow(/no starting shape/)
  })
})

describe('value chaining beyond numbers', () => {
  it('starts a colour tween from the colour last authored', () => {
    const tl = timeline()
    tl.fromTo('box', { backgroundColor: '#ff0000' }, { backgroundColor: '#00ff00', duration: 1 })
    tl.to('box', { backgroundColor: '#0000ff', duration: 1 })
    const colours = tl.timeline.tracks.filter((t) => t.property === 'backgroundColor') as Track[]
    expect(colours[1].keyframes[0].value).toBe('#00ff00')
  })
})

describe('start values of the wrong kind', () => {
  it('starts a colour with no known start from its end value, with a warning', () => {
    const warnings: string[] = []
    const tl = timeline({ onWarning: (m) => warnings.push(m) })
    tl.to('box', { color: '#ff0000', duration: 1 })
    const track = tl.timeline.tracks[0] as Track
    expect(track.keyframes.map((k) => k.value)).toEqual(['#ff0000', '#ff0000'])
    expect(warnings.some((m) => m.includes('Use fromTo()'))).toBe(true)
  })
})
