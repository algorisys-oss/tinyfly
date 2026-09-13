import { describe, it, expect } from 'vitest'
import { createEditorStore, createSceneStore, createProjectStore } from '../stores'
import type { ProjectBackend } from '../stores/project-store'
import { applySample } from './apply-sample'
import { getSampleById, sampleDefinitions } from './sample-definitions'

/** An in-memory project backend, so the test never touches IndexedDB. */
const memoryBackend: ProjectBackend = {
  loadProjects: () => new Map(),
  saveProjects: () => {},
  loadCurrentProjectId: () => null,
  saveCurrentProjectId: () => {},
}

function withStores<T>(fn: (stores: {
  store: ReturnType<typeof createEditorStore>
  sceneStore: ReturnType<typeof createSceneStore>
  projectStore: ReturnType<typeof createProjectStore>
}) => T): T {
  return fn({
    store: createEditorStore(),
    sceneStore: createSceneStore(),
    projectStore: createProjectStore({ backend: memoryBackend }),
  })
}

// store.tracks() is a memo that only recomputes inside a reactive root, so these
// read tracks straight off the timeline (as editor-store.test.ts does).
describe('applySample', () => {
  it('loads a sample\'s elements and tracks into the editor', () => {
    withStores((stores) => {
      const sample = getSampleById('letter-drop-bounce')!
      applySample(stores, sample)
      expect(stores.sceneStore.exportElements()).toHaveLength(sample.elements.length)
      expect(stores.store.state.timeline!.tracks).toHaveLength(sample.tracks.length)
    })
  })

  it('replaces whatever was loaded before', () => {
    withStores((stores) => {
      applySample(stores, getSampleById('letter-drop-bounce')!)
      const fade = getSampleById('fade-in-out')!
      applySample(stores, fade)
      expect(stores.sceneStore.exportElements()).toHaveLength(fade.elements.length)
      expect(stores.store.state.timeline!.tracks).toHaveLength(fade.tracks.length)
    })
  })

  it('converts motion path tracks through the editor store', () => {
    withStores((stores) => {
      const sample = sampleDefinitions.find((s) => s.tracks.some((t) => t.property === 'motionPath'))!
      applySample(stores, sample)
      expect(stores.store.state.timeline!.tracks.some((t) => t.property === 'motionPath')).toBe(true)
    })
  })
})

describe('applySample with engine feature tracks', () => {
  it('loads text and inertia tracks with their settings', () => {
    withStores((stores) => {
      applySample(stores, getSampleById('decode-headline')!)
      const tracks = stores.store.state.timeline!.tracks
      const headline = tracks.find((t) => t.target === 'Headline' && t.property === 'text') as unknown as { textConfig: { to: string }; keyframes: { time: number }[] }
      expect(headline.textConfig.to).toBe('TINYFLY')
      expect(headline.keyframes.map((k) => k.time)).toEqual([0, 1400])

      applySample(stores, getSampleById('throw-and-settle')!)
      const loose = stores.store.state.timeline!.tracks.find((t) => t.target === 'Loose') as unknown as { kind: string; inertia: { friction: number } }
      expect(loose.kind).toBe('inertia')
      expect(loose.inertia.friction).toBe(2)
    })
  })

  it('plays each new sample through to its intended end state', () => {
    withStores((stores) => {
      const endState = (id: string) => {
        applySample(stores, getSampleById(id)!)
        const tl = stores.store.state.timeline!
        return tl.getStateAtTime(Math.max(tl.duration, 5000)).values
      }
      expect(endState('decode-headline').get('Subtitle')?.get('text')).toBe('animation engine')
      expect(endState('scramble-countdown').get('Count')?.get('text')).toBe('GO!')
      const throws = endState('throw-and-settle')
      expect(['Loose', 'Normal', 'Tight'].map((n) => throws.get(n)?.get('x'))).toEqual([240, 240, 120])
      expect(endState('stats-decode-sample').get('Revenue')?.get('text')).toBe('$9,742')
    })
  })
})
