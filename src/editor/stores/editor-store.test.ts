import { describe, it, expect } from 'vitest'
import { createEditorStore, MIN_DURATION_MS } from './editor-store'
import type { AnyTrack, Keyframe } from '../../engine'
import { hasKeyframes, isSpringTrack, serializeTimeline, deserializeTimeline } from '../../engine'

/** Narrow to a keyframed track. Every track in these tests is keyframed. */
function kfs(track: AnyTrack): Keyframe[] {
  if (!hasKeyframes(track)) throw new Error(`track ${track.id} has no keyframes`)
  return track.keyframes
}
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
      return kfs(track)[0].time
    }

    expect(startOf('a')).toBe(0)
    expect(startOf('b')).toBe(100)
    expect(startOf('c')).toBe(200)
  })

  it('honours an initial startTime for the whole run', () => {
    const { store, tracks } = setup()
    store.applyPresetStaggered(FADE_UP, ['a', 'b'], { staggerMs: 50, startTime: 1000 })

    const startOf = (target: string) =>
      kfs(tracks().find((t) => t.target === target && t.property === 'opacity')!)[0].time

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
      kfs(tracks().find((t) => t.target === target && t.property === 'opacity')!)[0].time
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
    const times = kfs(tracks()[0]).map((k) => k.time)
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
    expect(kfs(tracks()[0]).map((k) => k.time)).toEqual([500])
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
    const a = kfs(tracks().find((t) => t.id === 'a')!).map((k) => k.time)
    const b = kfs(tracks().find((t) => t.id === 'b')!).map((k) => k.time)
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
    expect(kfs(scale).map((k) => k.value)).toEqual([1, 1])
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

  it('getCameraValue defaults to identity (0/0/1/0) with no camera', () => {
    const store = createEditorStore()
    store.createNewTimeline('tl', 'Cam', { duration: 2000 })
    expect(store.getCameraValue('x')).toBe(0)
    expect(store.getCameraValue('scale')).toBe(1)
    expect(store.getCameraValue('rotate')).toBe(0)
  })

  it('setCameraValue keyframes a camera prop at the playhead', () => {
    const store = createEditorStore()
    store.createNewTimeline('tl', 'Cam', { duration: 2000 })
    store.addCamera()
    store.seek(1000)
    store.setCameraValue('scale', 2)
    const scale = rawTracks(store).find((t) => t.target === 'Camera' && t.property === 'scale')!
    const kf = kfs(scale).find((k) => k.time === 1000)!
    expect(kf.value).toBe(2)
    expect(store.getCameraValue('scale')).toBe(2)
  })

  it('setCameraValue updates an existing keyframe at the same time (no dup)', () => {
    const store = createEditorStore()
    store.createNewTimeline('tl', 'Cam', { duration: 2000 })
    store.addCamera()
    store.seek(1000)
    store.setCameraValue('x', 50)
    store.setCameraValue('x', 80)
    const x = rawTracks(store).find((t) => t.target === 'Camera' && t.property === 'x')!
    expect(kfs(x).filter((k) => k.time === 1000)).toHaveLength(1)
    expect(store.getCameraValue('x')).toBe(80)
  })

  it('setCameraValue creates the track when the prop has none', () => {
    const store = createEditorStore()
    store.createNewTimeline('tl', 'Cam', { duration: 2000 })
    // No addCamera() — setting a value should create the track from scratch.
    store.seek(500)
    store.setCameraValue('rotate', 30)
    expect(store.hasCamera()).toBe(true)
    expect(store.getCameraValue('rotate')).toBe(30)
  })
})

describe('duration', () => {
  const track = (store: ReturnType<typeof createEditorStore>, id: string) =>
    store.state.timeline!.tracks.find((t) => t.id === id)!

  function withTrack(duration = 2000) {
    const store = createEditorStore()
    store.createNewTimeline('tl', 'Test', { duration })
    store.addTrack({
      id: 'opacity-1',
      target: 'Box',
      property: 'opacity',
      keyframes: [
        { time: 0, value: 0 },
        { time: 1000, value: 1 },
      ],
    })
    return store
  }

  it('extends when a keyframe is dragged past the end', () => {
    const store = withTrack()
    store.updateKeyframe('opacity-1', 1, { time: 4000 })
    expect(store.state.timeline!.duration).toBe(4000)
  })

  it('extends when a keyframe is added past the end', () => {
    const store = withTrack()
    store.selectTrack('opacity-1')
    store.addKeyframe(3500, 0.5)
    expect(store.state.timeline!.duration).toBe(3500)
  })

  it('extends when a new track reaches past the end', () => {
    const store = withTrack()
    store.addTracks([
      { target: 'Box', property: 'x', keyframes: [{ time: 5000, value: 100 }] },
    ])
    expect(store.state.timeline!.duration).toBe(5000)
  })

  it('does not shrink when keyframes move back inside the range', () => {
    const store = withTrack()
    store.updateKeyframe('opacity-1', 1, { time: 500 })
    expect(store.state.timeline!.duration).toBe(2000)
  })

  it('keeps every keyframe reachable after an extend', () => {
    const store = withTrack()
    store.updateKeyframe('opacity-1', 1, { time: 4000 })
    store.seek(4000)
    expect(store.currentTime()).toBe(4000)
    expect(kfs(track(store, 'opacity-1'))[1].time).toBe(4000)
  })

  it('setDuration can trim below the last keyframe', () => {
    const store = withTrack()
    store.setDuration(600)
    expect(store.state.timeline!.duration).toBe(600)
    expect(store.lastKeyframeTime()).toBe(1000)
  })

  it('setDuration pulls the playhead back inside the new range', () => {
    const store = withTrack()
    store.seek(1800)
    store.setDuration(600)
    expect(store.currentTime()).toBe(600)
  })

  it('setDuration clamps to the minimum', () => {
    const store = withTrack()
    store.setDuration(0)
    expect(store.state.timeline!.duration).toBe(MIN_DURATION_MS)
  })

  it('setDuration is undoable', () => {
    const store = withTrack()
    store.setDuration(5000)
    store.undo()
    expect(store.state.timeline!.duration).toBe(2000)
  })

  it('fitDurationToKeyframes shrink-wraps to the last keyframe', () => {
    const store = withTrack()
    store.fitDurationToKeyframes()
    expect(store.state.timeline!.duration).toBe(1000)
  })

  it('seek never reports a time past the end', () => {
    const store = withTrack()
    store.seek(9999)
    expect(store.currentTime()).toBe(2000)
  })
})

/**
 * Conflict surfacing (Phase 26F). The engine resolves two tracks on the same
 * target+property as last-added-wins; the store exposes that so the UI can mark
 * the track whose values never reach the screen.
 *
 * Assertions read the timeline directly, for the reason documented above: the
 * store's computed values are memos that only recompute under the observer
 * graph the real app provides.
 */
describe('track conflicts', () => {
  const setupWithTracks = () => {
    const store = createEditorStore()
    store.createNewTimeline('tl', 'Conflicts')
    return store
  }

  const timelineOf = (store: ReturnType<typeof createEditorStore>) => store.state.timeline!

  const fade = (id: string, target = 'box', from = 0, to = 1000) => ({
    id,
    target,
    property: 'opacity',
    keyframes: [
      { time: from, value: 0 },
      { time: to, value: 1 },
    ],
  })

  it('reports none for a single track', () => {
    const store = setupWithTracks()
    store.addTrack(fade('a'))
    expect(timelineOf(store).findConflicts()).toEqual([])
  })

  it('reports none when tracks drive different targets', () => {
    const store = setupWithTracks()
    store.addTrack(fade('a', 'box'))
    store.addTrack(fade('b', 'other'))
    expect(timelineOf(store).findConflicts()).toEqual([])
  })

  it('reports none when spans do not overlap', () => {
    const store = setupWithTracks()
    store.addTrack(fade('a', 'box', 0, 500))
    store.addTrack(fade('b', 'box', 900, 1400))
    expect(timelineOf(store).findConflicts()).toEqual([])
  })

  it('reports an overlap on the same target and property', () => {
    const store = setupWithTracks()
    store.addTrack(fade('a'))
    store.addTrack(fade('b'))

    const conflicts = timelineOf(store).findConflicts()
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].losingTrackId).toBe('a')
    expect(conflicts[0].winningTrackId).toBe('b')
  })

  it('names the winner as the track that actually renders', () => {
    const store = setupWithTracks()
    store.addTrack({
      id: 'a', target: 'box', property: 'opacity',
      keyframes: [{ time: 0, value: 0.2 }, { time: 1000, value: 0.2 }],
    })
    store.addTrack({
      id: 'b', target: 'box', property: 'opacity',
      keyframes: [{ time: 0, value: 0.9 }, { time: 1000, value: 0.9 }],
    })

    const timeline = timelineOf(store)
    expect(timeline.findConflicts()[0].winningTrackId).toBe('b')
    expect(timeline.getStateAtTime(500).values.get('box')?.get('opacity')).toBe(0.9)
  })

  it('clears once the duplicate is removed', () => {
    const store = setupWithTracks()
    store.addTrack(fade('a'))
    store.addTrack(fade('b'))
    expect(timelineOf(store).findConflicts()).toHaveLength(1)

    store.removeTrack('b')
    expect(timelineOf(store).findConflicts()).toEqual([])
  })

  it('exposes the conflict accessors the track panel reads', () => {
    const store = setupWithTracks()
    expect(store.trackConflicts()).toEqual([])
    expect(store.overriddenTrackIds().size).toBe(0)
  })
})

/**
 * Spring authoring (Phase 26C follow-up). Springs are edited as parameters, so
 * the store replaces the track rather than mutating it — the timeline memoises
 * a sampler per spring when the track is added, and editing in place would
 * leave the old simulation cached.
 */
describe('spring tracks', () => {
  const setup = () => {
    const store = createEditorStore()
    store.createNewTimeline('tl', 'Springs')
    return store
  }

  const timelineOf = (store: ReturnType<typeof createEditorStore>) => store.state.timeline!

  const addSpring = (store: ReturnType<typeof createEditorStore>, overrides = {}) =>
    store.addSpringTrack({
      id: 's1',
      target: 'box',
      property: 'scale',
      spring: { from: 0, to: 1, stiffness: 180, damping: 12 },
      ...overrides,
    })

  it('adds a spring track', () => {
    const store = setup()
    addSpring(store)

    const track = timelineOf(store).tracks[0]
    expect(track.id).toBe('s1')
    expect(hasKeyframes(track)).toBe(false)
  })

  it('the added spring produces values', () => {
    const store = setup()
    addSpring(store)

    const timeline = timelineOf(store)
    expect(timeline.getStateAtTime(0).values.get('box')?.get('scale')).toBe(0)
    expect(timeline.getStateAtTime(60).values.get('box')?.get('scale')).toBeGreaterThan(0)
  })

  it('extends the scene to fit the settle time', () => {
    const store = setup()
    addSpring(store)
    // A spring decides its own duration; the scene has to reach it or the tail
    // is silently cut off. (Read the timeline, not store.duration() — that is a
    // memo, per the note above.)
    expect(timelineOf(store).duration).toBeGreaterThan(0)
    expect(timelineOf(store).duration).toBeGreaterThanOrEqual(
      timelineOf(store).getTrackSpan('s1')!.to
    )
  })

  it('requiredDurationMs accounts for springs, which have no keyframes', () => {
    const store = setup()
    addSpring(store)
    // lastKeyframeTime() alone would report 0 here.
    expect(store.requiredDurationMs()).toBeGreaterThan(0)
  })

  it('requiredDurationMs takes the later of keyframes and springs', () => {
    const store = setup()
    addSpring(store)
    const springEnd = store.requiredDurationMs()

    store.addTrack({
      id: 'late',
      target: 'box',
      property: 'x',
      keyframes: [{ time: 0, value: 0 }, { time: springEnd + 5000, value: 1 }],
    })
    expect(store.requiredDurationMs()).toBe(springEnd + 5000)
  })

  it('updates a spring parameter', () => {
    const store = setup()
    addSpring(store)
    store.updateSpring('s1', { stiffness: 400 })

    const track = timelineOf(store).tracks[0]
    expect(isSpringTrack(track) && track.spring.stiffness).toBe(400)
  })

  it('the edit actually changes the motion — the cached sampler is rebuilt', () => {
    const store = setup()
    addSpring(store)
    const before = timelineOf(store).getStateAtTime(40).values.get('box')!.get('scale')

    store.updateSpring('s1', { stiffness: 500 })
    const after = timelineOf(store).getStateAtTime(40).values.get('box')!.get('scale')

    expect(after).not.toBe(before)
  })

  it('keeps parameters that were not changed', () => {
    const store = setup()
    addSpring(store)
    store.updateSpring('s1', { damping: 4 })

    const track = timelineOf(store).tracks[0]
    expect(isSpringTrack(track) && track.spring.stiffness).toBe(180)
    expect(isSpringTrack(track) && track.spring.from).toBe(0)
  })

  it('updates the delay', () => {
    const store = setup()
    addSpring(store)
    store.updateSpring('s1', { delay: 250 })

    const track = timelineOf(store).tracks[0]
    expect(track.delay).toBe(250)
    expect(timelineOf(store).getTrackSpan('s1')!.from).toBe(250)
  })

  it('grows the scene when an edit makes the spring slower to settle', () => {
    const store = setup()
    addSpring(store, { spring: { from: 0, to: 1, stiffness: 400, damping: 30 } })
    const before = timelineOf(store).duration

    store.updateSpring('s1', { damping: 2 }) // barely damped: takes far longer
    expect(timelineOf(store).duration).toBeGreaterThan(before)
  })

  it('ignores an update to a track that is not a spring', () => {
    const store = setup()
    store.addTrack({
      id: 'plain',
      target: 'box',
      property: 'x',
      keyframes: [{ time: 0, value: 0 }, { time: 100, value: 1 }],
    })
    expect(() => store.updateSpring('plain', { stiffness: 400 })).not.toThrow()

    const track = timelineOf(store).tracks[0]
    expect(hasKeyframes(track)).toBe(true)
  })

  it('ignores an update to a missing track', () => {
    const store = setup()
    expect(() => store.updateSpring('nope', { stiffness: 400 })).not.toThrow()
  })

  it('is undoable', () => {
    const store = setup()
    addSpring(store)
    store.updateSpring('s1', { stiffness: 400 })
    store.undo()

    const track = timelineOf(store).tracks[0]
    expect(isSpringTrack(track) && track.spring.stiffness).toBe(180)
  })

  it('survives a JSON round-trip with its parameters intact', () => {
    const store = setup()
    addSpring(store, { spring: { from: 2, to: 9, stiffness: 250, damping: 7, mass: 1.5 } })

    const restored = deserializeTimeline(serializeTimeline(timelineOf(store)))
    const track = restored.tracks[0]
    expect(isSpringTrack(track) && track.spring).toEqual({
      from: 2, to: 9, stiffness: 250, damping: 7, mass: 1.5,
    })
  })
})
