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

describe('keyframe multi-select + copy/paste', () => {
  function setupWithTrack() {
    const { store, tracks } = setup()
    store.addTrack({
      id: 'trk',
      target: 'box',
      property: 'opacity',
      keyframes: [
        { time: 0, value: 0 },
        { time: 500, value: 1 },
        { time: 1000, value: 0 },
      ],
    })
    return { store, tracks }
  }

  it('toggles keyframes in and out of the multi-selection', () => {
    const { store } = setupWithTrack()
    store.toggleKeyframeSelection('trk', 0)
    store.toggleKeyframeSelection('trk', 2)
    expect(store.state.selectedKeyframes).toEqual([
      { trackId: 'trk', index: 0 },
      { trackId: 'trk', index: 2 },
    ])
    expect(store.isKeyframeSelected('trk', 0)).toBe(true)
    expect(store.isKeyframeSelected('trk', 1)).toBe(false)

    store.toggleKeyframeSelection('trk', 0) // toggle off
    expect(store.isKeyframeSelected('trk', 0)).toBe(false)
    expect(store.state.selectedKeyframes).toHaveLength(1)
  })

  it('copies selected keyframes and pastes them at the playhead', () => {
    const { store, tracks } = setupWithTrack()
    store.selectKeyframes([
      { trackId: 'trk', index: 0 },
      { trackId: 'trk', index: 1 },
    ])
    expect(store.copySelectedKeyframes()).toBe(2)
    expect(store.hasKeyframeClipboard()).toBe(true)

    // Paste at 2000ms: earliest copied time is 0, so offset = 2000.
    store.pasteKeyframes(2000)
    const times = tracks()[0].keyframes.map((k) => k.time)
    // Original 0/500/1000 plus pasted 2000/2500.
    expect(times).toEqual([0, 500, 1000, 2000, 2500])
  })

  it('selects the pasted keyframes', () => {
    const { store } = setupWithTrack()
    store.selectKeyframes([{ trackId: 'trk', index: 1 }]) // time 500
    store.copySelectedKeyframes()
    store.pasteKeyframes(1000) // 500 -> 1000, merges next to existing 1000
    // Two keyframes now sit at 1000ms; the pasted one is selected.
    expect(store.state.selectedKeyframes).toHaveLength(1)
  })

  it('deletes all selected keyframes', () => {
    const { store, tracks } = setupWithTrack()
    store.selectKeyframes([
      { trackId: 'trk', index: 0 },
      { trackId: 'trk', index: 2 },
    ])
    expect(store.deleteSelectedKeyframes()).toBe(2)
    expect(tracks()[0].keyframes.map((k) => k.time)).toEqual([500])
    expect(store.state.selectedKeyframes).toHaveLength(0)
  })

  it('pastes onto multiple source tracks preserving relative timing', () => {
    const { store, tracks } = setup()
    store.addTrack({ id: 'a', target: 'x', property: 'x', keyframes: [{ time: 100, value: 0 }] })
    store.addTrack({ id: 'b', target: 'y', property: 'y', keyframes: [{ time: 300, value: 0 }] })
    store.selectKeyframes([
      { trackId: 'a', index: 0 },
      { trackId: 'b', index: 0 },
    ])
    store.copySelectedKeyframes()
    // Earliest = 100; paste at 1000 -> offset 900. a:100->1000, b:300->1200.
    store.pasteKeyframes(1000)
    const a = tracks().find((t) => t.id === 'a')!.keyframes.map((k) => k.time)
    const b = tracks().find((t) => t.id === 'b')!.keyframes.map((k) => k.time)
    expect(a).toEqual([100, 1000])
    expect(b).toEqual([300, 1200])
  })
})

describe('camera', () => {
  // store.tracks() is a memo that only updates in a reactive root — read the
  // timeline directly in tests (see setup()).
  const rawTracks = (store: ReturnType<typeof createEditorStore>) => store.state.timeline!.tracks

  it('adds pan/zoom/rotate tracks on the "Camera" target', () => {
    const store = createEditorStore()
    store.createNewTimeline('tl', 'Cam', { duration: 2000 })
    expect(store.hasCamera()).toBe(false)
    store.addCamera()
    expect(store.hasCamera()).toBe(true)
    const cam = rawTracks(store).filter((t) => t.target === 'Camera')
    expect(cam.map((t) => t.property).sort()).toEqual(['rotate', 'scale', 'x', 'y'])
    const scale = cam.find((t) => t.property === 'scale')!
    expect(scale.keyframes.map((k) => k.value)).toEqual([1, 1])
  })

  it('is a no-op when a camera already exists', () => {
    const store = createEditorStore()
    store.createNewTimeline('tl', 'Cam', { duration: 2000 })
    store.addCamera()
    const n = rawTracks(store).length
    store.addCamera()
    expect(rawTracks(store).length).toBe(n)
  })

  it('removes all camera tracks', () => {
    const store = createEditorStore()
    store.createNewTimeline('tl', 'Cam', { duration: 2000 })
    store.addCamera()
    store.removeCamera()
    expect(store.hasCamera()).toBe(false)
    expect(rawTracks(store).some((t) => t.target === 'Camera')).toBe(false)
  })
})
