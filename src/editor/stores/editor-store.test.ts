import { describe, it, expect } from 'vitest'
import { createEditorStore } from './editor-store'
import type { AnimationPreset } from '../presets'

const FADE_UP: AnimationPreset = {
  id: 'test-fade-up',
  name: 'Test Fade Up',
  description: 'test',
  category: 'text',
  duration: 500,
  tracks: [
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 1, value: 1 },
      ],
    },
    {
      property: 'y',
      keyframes: [
        { timePercent: 0, value: '+30' },
        { timePercent: 1, value: 0 },
      ],
    },
  ],
}

function setup() {
  const store = createEditorStore()
  store.createNewTimeline('tl', 'Test')
  // Read tracks straight off the timeline. store.tracks() is a createMemo that
  // only recomputes inside a reactive root (present in the real app, not here).
  const tracks = () => store.state.timeline!.tracks
  return { store, tracks }
}

describe('applyPresetStaggered', () => {
  it('creates a full set of tracks for every target', () => {
    const { store, tracks } = setup()
    const ids = store.applyPresetStaggered(FADE_UP, ['a', 'b', 'c'], { staggerMs: 100 })
    // 3 targets * 2 tracks each
    expect(ids).toHaveLength(6)
    expect(tracks()).toHaveLength(6)
  })

  it('offsets each target by the stagger amount', () => {
    const { store, tracks } = setup()
    store.applyPresetStaggered(FADE_UP, ['a', 'b', 'c'], { staggerMs: 100 })

    const startOf = (target: string) => {
      const track = tracks().find((t) => t.target === target && t.property === 'opacity')!
      return track.keyframes[0].time
    }

    expect(startOf('a')).toBe(0)
    expect(startOf('b')).toBe(100)
    expect(startOf('c')).toBe(200)
  })

  it('honours an initial startTime for the whole run', () => {
    const { store, tracks } = setup()
    store.applyPresetStaggered(FADE_UP, ['a', 'b'], { staggerMs: 50, startTime: 1000 })

    const startOf = (target: string) =>
      tracks().find((t) => t.target === target && t.property === 'opacity')!.keyframes[0].time

    expect(startOf('a')).toBe(1000)
    expect(startOf('b')).toBe(1050)
  })

  it('targets each track at the provided target name', () => {
    const { store, tracks } = setup()
    store.applyPresetStaggered(FADE_UP, ['letter-1', 'letter-2'], { staggerMs: 60 })
    const targets = new Set(tracks().map((t) => t.target))
    expect(targets).toEqual(new Set(['letter-1', 'letter-2']))
  })

  it('returns an empty array with no targets', () => {
    const { store } = setup()
    expect(store.applyPresetStaggered(FADE_UP, [], { staggerMs: 60 })).toEqual([])
  })

  it('defaults the stagger when none is supplied', () => {
    const { store, tracks } = setup()
    store.applyPresetStaggered(FADE_UP, ['a', 'b'])
    const startOf = (target: string) =>
      tracks().find((t) => t.target === target && t.property === 'opacity')!.keyframes[0].time
    // Default stagger is 60ms.
    expect(startOf('b') - startOf('a')).toBe(60)
  })
})
