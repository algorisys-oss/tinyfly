import { describe, it, expect } from 'vitest'
import { parseAnimation } from './animation-generator'

const VALID = {
  name: 'Title Reveal',
  description: 'Headline fades up',
  duration: 1600,
  canvas: { width: 800, height: 450 },
  elements: [
    { type: 'text', name: 'Headline', x: 80, y: 150, width: 640, height: 60, text: 'tinyfly' },
    { type: 'rect', name: 'Bar', x: 340, y: 230, width: 120, height: 6, fill: '#4a9eff' },
  ],
  tracks: [
    { target: 'Headline', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 1, easing: 'ease-out' }] },
    { target: 'Bar', property: 'clipRight', keyframes: [{ time: 300, value: 100 }, { time: 1000, value: 0 }] },
  ],
}

describe('parseAnimation', () => {
  it('parses a clean JSON object', () => {
    const anim = parseAnimation(JSON.stringify(VALID))
    expect(anim).not.toBeNull()
    expect(anim?.name).toBe('Title Reveal')
    expect(anim?.elements).toHaveLength(2)
    expect(anim?.tracks).toHaveLength(2)
  })

  it('strips ```json markdown fences', () => {
    const wrapped = '```json\n' + JSON.stringify(VALID) + '\n```'
    expect(parseAnimation(wrapped)?.name).toBe('Title Reveal')
  })

  it('extracts JSON when the model adds prose around it', () => {
    const noisy = `Sure! Here is your animation:\n${JSON.stringify(VALID)}\nHope that helps.`
    expect(parseAnimation(noisy)?.duration).toBe(1600)
  })

  it('rejects a track targeting an unknown element name', () => {
    const bad = { ...VALID, tracks: [{ target: 'Ghost', property: 'x', keyframes: [{ time: 0, value: 0 }] }] }
    expect(parseAnimation(JSON.stringify(bad))).toBeNull()
  })

  it('rejects an element missing a name', () => {
    const bad = { ...VALID, elements: [{ type: 'rect', x: 0, y: 0, width: 10, height: 10 }], tracks: [] }
    expect(parseAnimation(JSON.stringify(bad))).toBeNull()
  })

  it('rejects a non-positive duration', () => {
    expect(parseAnimation(JSON.stringify({ ...VALID, duration: 0 }))).toBeNull()
  })

  it('rejects empty elements', () => {
    expect(parseAnimation(JSON.stringify({ ...VALID, elements: [], tracks: [] }))).toBeNull()
  })

  it('rejects a track with no keyframes', () => {
    const bad = { ...VALID, tracks: [{ target: 'Bar', property: 'x', keyframes: [] }] }
    expect(parseAnimation(JSON.stringify(bad))).toBeNull()
  })

  it('returns null on non-JSON garbage', () => {
    expect(parseAnimation('the model refused to answer')).toBeNull()
  })

  it('allows an animation with no tracks (static scene)', () => {
    const anim = parseAnimation(JSON.stringify({ ...VALID, tracks: [] }))
    expect(anim?.tracks).toHaveLength(0)
  })
})
