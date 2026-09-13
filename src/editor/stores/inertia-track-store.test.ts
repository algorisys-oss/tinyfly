import { describe, it, expect } from 'vitest'
import { createEditorStore } from './editor-store'
import { isInertiaTrack, inertiaDuration, type InertiaTrack } from '../../engine'

function setup() {
  const store = createEditorStore()
  store.createNewTimeline('tl', 'Inertia', { duration: 500 })
  const throws = () => store.state.timeline!.tracks.filter(isInertiaTrack) as InertiaTrack[]
  store.addInertiaTrack({ id: 'throw', target: 'card', property: 'x', inertia: { from: 0, velocity: 800 } })
  return { store, throws }
}

describe('inertia tracks in the editor', () => {
  it('adds a track and grows the scene to its settle time', () => {
    const { store, throws } = setup()
    expect(throws()).toHaveLength(1)
    expect(store.state.timeline!.duration).toBeGreaterThanOrEqual(inertiaDuration({ from: 0, velocity: 800 }))
  })

  it('updates parameters, and clears optional ones with null', () => {
    const { store, throws } = setup()
    store.updateInertia('throw', { velocity: 1200, max: 150, end: [0, 100] })
    expect(throws()[0].inertia).toEqual({ from: 0, velocity: 1200, max: 150, end: [0, 100] })
    store.updateInertia('throw', { max: null, end: null, delay: 250 })
    expect(throws()[0].inertia).toEqual({ from: 0, velocity: 1200 })
    expect(throws()[0].delay).toBe(250)
  })

  it('is undoable and keeps the track order', () => {
    const { store, throws } = setup()
    store.addTrack({ id: 'fade', target: 'card', property: 'opacity', keyframes: [{ time: 0, value: 1 }] })
    store.updateInertia('throw', { friction: 8 })
    expect(store.state.timeline!.tracks.map((t) => t.id)).toEqual(['throw', 'fade'])
    store.undo()
    expect(throws()[0].inertia.friction).toBeUndefined()
  })
})
