import { describe, it, expect } from 'vitest'
import { buildWriteOn, canWriteOn } from './build-write-on'
import type { SceneElement } from '../stores/scene-store'

const element = (type: string, extra: Record<string, unknown> = {}) =>
  ({ id: type, name: `${type}-1`, type, x: 0, y: 0, width: 100, height: 100, rotation: 0, opacity: 1, visible: true, locked: false, ...extra }) as unknown as SceneElement

describe('buildWriteOn', () => {
  it('draws on paths, rects, circles and lines, not text or images', () => {
    for (const type of ['path', 'rect', 'circle', 'line']) expect(canWriteOn(element(type)), type).toBe(true)
    for (const type of ['text', 'image', 'group']) expect(canWriteOn(element(type)), type).toBe(false)
    expect(canWriteOn(null)).toBe(false)
    expect(buildWriteOn(element('text'), 900)).toEqual([])
  })

  it('gives a shape a drawOn track from 0 to 1 over the duration', () => {
    const tracks = buildWriteOn(element('rect'), 1200)
    expect(tracks).toEqual([
      {
        target: 'rect-1',
        property: 'drawOn',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1200, value: 1, easing: 'ease-out' },
        ],
      },
    ])
  })

  it('also gives a path dash tracks, so DOM and SVG draw it on', () => {
    const tracks = buildWriteOn(element('path', { d: 'M0,0 L300,0 L300,400' }), 900)
    expect(tracks.map((t) => t.property)).toEqual(['drawOn', 'strokeDasharray', 'strokeDashoffset'])
    expect(tracks[1].keyframes).toEqual([{ time: 0, value: 700 }])
    expect(tracks[2].keyframes.map((k) => k.value)).toEqual([700, 0])
  })
})
