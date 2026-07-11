import { describe, it, expect } from 'vitest'
import { createEditorStore } from './editor-store'
import { createSceneStore } from './scene-store'

/** Wire an editor store and scene store together the way the editor does. */
function setup() {
  const store = createEditorStore()
  const sceneStore = createSceneStore()
  store.createNewTimeline('tl', 'Test')
  store.attachScene({
    getElements: sceneStore.exportElements,
    setElements: sceneStore.loadElements,
  })
  sceneStore.setHistoryHook(store.pushHistory)
  return { store, sceneStore }
}

describe('unified undo/redo (timeline + scene elements)', () => {
  it('undoes and redoes adding an element', () => {
    const { store, sceneStore } = setup()

    expect(store.canUndo()).toBe(false)
    sceneStore.addElement('rect', { name: 'Box' })
    expect(sceneStore.elements()).toHaveLength(1)
    expect(store.canUndo()).toBe(true)

    store.undo()
    expect(sceneStore.elements()).toHaveLength(0)
    expect(store.canRedo()).toBe(true)

    store.redo()
    expect(sceneStore.elements()).toHaveLength(1)
    expect(sceneStore.elements()[0].name).toBe('Box')
  })

  it('undoes an element property change', () => {
    const { store, sceneStore } = setup()
    const el = sceneStore.addElement('rect', { name: 'Box', x: 10 })

    sceneStore.updateElement(el.id, { x: 200 })
    expect(sceneStore.elements()[0].x).toBe(200)

    store.undo()
    expect(sceneStore.elements()[0].x).toBe(10)
  })

  it('treats a gesture (begin/endInteraction) as a single undo step', () => {
    const { store, sceneStore } = setup()
    const el = sceneStore.addElement('rect', { name: 'Box', x: 0 })

    // Simulate a drag: many updates between begin/end -> one undo step.
    sceneStore.beginInteraction()
    for (let x = 1; x <= 20; x++) sceneStore.updateElement(el.id, { x })
    sceneStore.endInteraction()
    expect(sceneStore.elements()[0].x).toBe(20)

    store.undo()
    expect(sceneStore.elements()[0].x).toBe(0) // back to before the drag, in one step
  })

  it('device preset is one undo step', () => {
    const { store, sceneStore } = setup()
    sceneStore.addDeviceFrame({ variant: 'phone', centerX: 150, centerY: 100, canvasWidth: 300, canvasHeight: 200 })
    expect(sceneStore.elements()).toHaveLength(3)

    store.undo()
    expect(sceneStore.elements()).toHaveLength(0)
  })

  it('a click with no mutation records no history', () => {
    const { store, sceneStore } = setup()
    sceneStore.addElement('rect', { name: 'Box' })
    const before = store.canUndo()

    // Gesture that produces no change (click without drag).
    sceneStore.beginInteraction()
    sceneStore.endInteraction()

    // No extra undo step was added.
    expect(store.canUndo()).toBe(before)
    store.undo()
    expect(sceneStore.elements()).toHaveLength(0) // undo removes the add, nothing spurious
  })

  it('undo restores a timeline track change too', () => {
    const { store, sceneStore } = setup()
    sceneStore.addElement('rect', { name: 'Box' })
    store.addTrack({ id: 't1', target: 'Box', property: 'opacity', keyframes: [{ time: 0, value: 1 }] })
    expect(store.state.timeline!.tracks).toHaveLength(1)

    store.undo()
    expect(store.state.timeline!.tracks).toHaveLength(0)
  })
})
