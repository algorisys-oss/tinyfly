import { describe, it, expect } from 'vitest'
import { beatAudio, beatGridOf, tapTempo } from './beat-grid'
import { createSceneStore, type AudioElement } from '../stores/scene-store'

const audio = (changes: Partial<AudioElement>): AudioElement => {
  const store = createSceneStore()
  const element = store.addElement('audio') as AudioElement
  return { ...element, ...changes }
}

describe('the beat grid', () => {
  it('comes from the first audio element with a tempo, shifted to where it starts', () => {
    const silent = audio({ name: 'voice' })
    const music = audio({ name: 'music', bpm: 128, beatOffset: 120, startTime: 2000, beatsPerBar: 3 })
    expect(beatAudio([silent, music])?.name).toBe('music')
    expect(beatGridOf([silent, music])).toEqual({ bpm: 128, offset: 2120, beatsPerBar: 3 })
  })

  it('is absent without a tempo', () => {
    expect(beatGridOf([audio({})])).toBeNull()
    expect(beatGridOf([audio({ bpm: 0 })])).toBeNull()
  })
})

describe('tap tempo', () => {
  it('needs three taps, and reads the median gap', () => {
    expect(tapTempo([0, 500])).toBeNull()
    expect(tapTempo([0, 500, 1000, 1500])).toBe(120)
    // One late tap does not throw it.
    expect(tapTempo([0, 500, 1000, 1640, 2000, 2500])).toBe(120)
  })

  it('starts a new count after a pause', () => {
    expect(tapTempo([0, 300, 600, 5000, 5600, 6200])).toBe(100)
  })
})
