import { describe, it, expect } from 'vitest'
import { createEditorStore } from './editor-store'
import { isTextTrack, type TextTrack } from '../../engine'

/**
 * Text tracks in the editor. Assertions read the timeline directly: the store's
 * memos only recompute under the observer graph the running app provides.
 */
function setup() {
  const store = createEditorStore()
  store.createNewTimeline('tl', 'Text', { duration: 2000 })
  const textTracks = () => store.state.timeline!.tracks.filter(isTextTrack) as TextTrack[]
  return { store, textTracks }
}

describe('addTextTrack', () => {
  it('adds a 0 → 1 progress track at the given start and duration', () => {
    const { store, textTracks } = setup()
    store.addTextTrack({ target: 'title', textConfig: { from: 'a', to: 'b', mode: 'scramble' }, startMs: 500, durationMs: 800, easing: 'ease-out' })
    const [track] = textTracks()
    expect(track.keyframes).toEqual([{ time: 500, value: 0 }, { time: 1300, value: 1, easing: 'ease-out' }])
    expect(track.textConfig).toEqual({ from: 'a', to: 'b', mode: 'scramble' })
  })

  it('grows the scene to fit a track that ends past it', () => {
    const { store } = setup()
    store.addTextTrack({ target: 'title', textConfig: { to: 'x', mode: 'type' }, startMs: 1800, durationMs: 1000 })
    expect(store.state.timeline!.duration).toBeGreaterThanOrEqual(2800)
  })

  it('is undoable', () => {
    const { store, textTracks } = setup()
    store.addTextTrack({ target: 'title', textConfig: { to: 'x', mode: 'type' } })
    store.undo()
    expect(store.state.timeline!.tracks.filter(isTextTrack)).toHaveLength(0)
    expect(textTracks()).toHaveLength(0)
  })
})

describe('updateTextTrack', () => {
  it('changes settings without touching keyframes', () => {
    const { store, textTracks } = setup()
    const track = store.addTextTrack({ target: 'title', textConfig: { to: 'x', mode: 'scramble' } })!
    // Pretend the keyframes were baked into several.
    const baked: TextTrack = { ...track, keyframes: [{ time: 0, value: 0 }, { time: 300, value: 0.7 }, { time: 1000, value: 1 }] }
    store.state.timeline!.replaceTrack(track.id, baked)

    store.updateTextTrack(track.id, { chars: 'numbers', to: 'Done' })
    expect(textTracks()[0].keyframes).toHaveLength(3)
    expect(textTracks()[0].textConfig).toMatchObject({ chars: 'numbers', to: 'Done', mode: 'scramble' })
  })

  it('rebuilds the progress pair when timing or easing changes', () => {
    const { store, textTracks } = setup()
    const track = store.addTextTrack({ target: 'title', textConfig: { to: 'x', mode: 'type' }, startMs: 0, durationMs: 1000, easing: 'linear' })!
    store.updateTextTrack(track.id, { startMs: 200 })
    expect(textTracks()[0].keyframes.map((k) => k.time)).toEqual([200, 1200])
    store.updateTextTrack(track.id, { durationMs: 400, easing: 'ease-in' })
    expect(textTracks()[0].keyframes).toEqual([{ time: 200, value: 0 }, { time: 600, value: 1, easing: 'ease-in' }])
  })

  it('keeps the track in its place in the order', () => {
    const { store } = setup()
    const first = store.addTextTrack({ target: 'a', textConfig: { to: 'x', mode: 'type' } })!
    store.addTextTrack({ target: 'b', textConfig: { to: 'y', mode: 'type' } })
    store.updateTextTrack(first.id, { to: 'changed' })
    expect(store.state.timeline!.tracks.map((t) => t.target)).toEqual(['a', 'b'])
  })

  it('ignores tracks that are not text tracks', () => {
    const { store } = setup()
    store.addTrack({ id: 'op', target: 'box', property: 'opacity', keyframes: [{ time: 0, value: 0 }] })
    expect(() => store.updateTextTrack('op', { to: 'x' })).not.toThrow()
  })
})
