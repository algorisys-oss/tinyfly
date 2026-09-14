import { describe, it, expect } from 'vitest'
import { toAnimationDocument } from './animation-document'
import type { TimelineDefinition } from '../../engine/types'
import type { SceneElement } from '../stores/scene-store'

const rect = {
  id: 'el-1',
  type: 'rect',
  name: 'Box',
  x: 10,
  y: 20,
  width: 60,
  height: 40,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  fill: '#4a9eff',
  stroke: 'transparent',
  strokeWidth: 0,
  borderRadius: 4,
} as SceneElement

const timeline: TimelineDefinition = {
  id: 'promo',
  name: 'Promo',
  config: { duration: 2000, loop: -1 },
  tracks: [{ id: 't1', target: 'Box', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 1 }] }],
}

describe('toAnimationDocument', () => {
  it('bundles the elements, the tracks and the canvas', () => {
    const doc = toAnimationDocument(timeline, 2000, [rect], { width: 360, height: 640, background: '#111' })
    expect(doc.name).toBe('Promo')
    expect(doc.duration).toBe(2000)
    expect(doc.canvas).toEqual({ width: 360, height: 640, background: '#111' })
    expect(doc.elements).toEqual([rect])
    expect(doc.tracks).toEqual(timeline.tracks)
  })

  it('keeps playback options other than duration under config', () => {
    const doc = toAnimationDocument(timeline, 2000, [rect])
    expect(doc.config).toEqual({ loop: -1 })
  })

  it('omits config when duration is the only option', () => {
    const doc = toAnimationDocument({ ...timeline, config: { duration: 2000 } }, 2000, [rect])
    expect('config' in doc).toBe(false)
  })

  it('uses the timeline length when the definition has no duration', () => {
    const doc = toAnimationDocument({ ...timeline, config: {} }, 1234, [rect])
    expect(doc.duration).toBe(1234)
  })

  it('copies, so later edits in the editor do not change an exported document', () => {
    const els = [{ ...rect }]
    const source = timeline.tracks[0] as { keyframes: { value: number }[] }
    const doc = toAnimationDocument(timeline, 2000, els)
    els[0].x = 999
    source.keyframes[0].value = 42
    expect(doc.elements[0].x).toBe(10)
    expect((doc.tracks[0] as { keyframes: { value: number }[] }).keyframes[0].value).toBe(0)
    source.keyframes[0].value = 0
  })
})
