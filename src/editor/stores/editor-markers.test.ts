import { describe, it, expect } from 'vitest'
import { createEditorStore } from './editor-store'
import { serializeTimeline, deserializeTimeline } from '../../engine'

/**
 * Steps (markers) and captions in the editor store: edits, selection, undo, and
 * export. Store memos only update inside a reactive root, so these read the
 * timeline itself.
 */

type Store = ReturnType<typeof createEditorStore>

function withStore(run: (store: Store) => void) {
  const store = createEditorStore()
  store.createNewTimeline('t', 'Lesson', { duration: 3000 })
  run(store)
}

const markersOf = (store: Store) => store.state.timeline!.markers
const captionsOf = (store: Store) => store.state.timeline!.captions

describe('editor markers', () => {
  it('adds a step at the playhead, selects it, and undoes', () => {
    withStore((store) => {
      store.seek(1200)
      const id = store.addMarker()!
      expect(id).toBe('step-1')
      expect(markersOf(store)).toEqual([{ id: 'step-1', time: 1200, label: 'Step 1' }])
      expect(store.state.selectedMarkerId).toBe('step-1')
      store.undo()
      expect(markersOf(store)).toEqual([])
      expect(store.state.selectedMarkerId).toBeNull()
      store.redo()
      expect(markersOf(store)).toHaveLength(1)
    })
  })

  it('renames with captions, refuses taken ids, and deletes with its captions', () => {
    withStore((store) => {
      store.addMarker(0)
      store.addMarker(1000)
      expect(store.addCaptionLanguage('ES')).toBe('es')
      expect(store.state.pendingCaptionLanguages).toEqual(['es'])
      expect(store.addCaptionLanguage('english!')).toBeUndefined()
      store.setMarkerCaption('es', 'step-2', 'crece')
      expect(store.updateMarker('step-2', { id: 'grow', label: 'grow', pause: true, question: 'Next?' })).toBeUndefined()
      expect(store.state.selectedMarkerId).toBe('grow')
      expect(captionsOf(store)).toEqual({ es: { grow: 'crece' } })
      expect(store.updateMarker('grow', { id: 'step-1' })).toMatch(/already/)

      const exported = JSON.parse(store.exportJSON()!)
      expect(exported.config.markers).toEqual([
        { id: 'step-1', time: 0, label: 'Step 1' },
        { id: 'grow', time: 1000, label: 'grow', pause: true, question: 'Next?' },
      ])
      expect(exported.captions).toEqual({ es: { grow: 'crece' } })

      store.deleteMarker('grow')
      expect(markersOf(store).map((marker) => marker.id)).toEqual(['step-1'])
      expect(captionsOf(store)).toBeUndefined()
      store.undo()
      expect(captionsOf(store)).toEqual({ es: { grow: 'crece' } })
    })
  })

  it('moves a step live during a drag as one undo step', () => {
    withStore((store) => {
      store.addMarker(500)
      store.pushHistory()
      for (const time of [600, 900, 1400]) store.moveMarkerLive('step-1', time)
      expect(markersOf(store)[0].time).toBe(1400)
      store.undo()
      expect(markersOf(store)[0].time).toBe(500)
    })
  })

  it('selecting a keyframe or track clears the step, and steps navigate the playhead', () => {
    withStore((store) => {
      store.addMarker(0)
      store.addMarker(2000)
      store.seek(1000)
      expect(store.seekToMarker(1)?.id).toBe('step-2')
      expect(store.currentTime()).toBe(2000)
      expect(store.seekToMarker(-1)?.id).toBe('step-1')
      store.selectMarker('step-2')
      store.addTrack({ id: 'x', target: 'box', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 1 }] })
      store.selectKeyframe('x', 1)
      expect(store.state.selectedMarkerId).toBeNull()
    })
  })

  it('editing captions never changes an earlier undo snapshot', () => {
    withStore((store) => {
      store.addMarker(0)
      store.setMarkerCaption('es', 'step-1', 'uno')
      const before = serializeTimeline(store.state.timeline!)
      store.setMarkerCaption('es', 'step-1', 'dos')
      expect(before.captions).toEqual({ es: { 'step-1': 'uno' } })
      store.undo()
      expect(captionsOf(store)).toEqual({ es: { 'step-1': 'uno' } })
      expect(deserializeTimeline(before).captions).toEqual({ es: { 'step-1': 'uno' } })
    })
  })
})
