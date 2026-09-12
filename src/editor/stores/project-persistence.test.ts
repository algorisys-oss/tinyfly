import { describe, it, expect } from 'vitest'
import { createStore, unwrap } from 'solid-js/store'

/**
 * Regression cover for a data-loss bug found by driving the real editor.
 *
 * IndexedDB writes of a project were failing with `DataCloneError`, so the only
 * record that ever persisted was the initial empty project. The moment the
 * canvas had anything on it, every save was silently dropped — the editor kept
 * working from memory, and the loss only showed up after a reload.
 *
 * Cause: project records come straight out of a Solid store. **In the browser**
 * those are Proxies (they carry `Symbol(solid-proxy)` / `Symbol(store-node)`),
 * and the structured clone algorithm rejects a proxy outright. The fix unwraps
 * before writing, with a JSON round-trip as a retry.
 *
 * A caveat about what these tests can and cannot cover: under Vitest's Node
 * environment `createStore` does not proxy at all — `state === unwrap(state)` —
 * so the failure itself is not reproducible here. What is asserted below are
 * the properties the fix depends on regardless of environment. The proxy
 * behaviour itself was verified against a real browser.
 */

const sampleProject = () => ({
  id: 'p1',
  name: 'Test',
  created: 1,
  modified: 2,
  canvas: { width: 800, height: 600, background: '#252525' },
  activeSceneId: 's1',
  symbols: [],
  scenes: [
    {
      id: 's1',
      name: 'Scene 1',
      order: 0,
      elements: [{ id: 'e1', type: 'rect', x: 0, y: 0, width: 10, height: 10 }],
      timeline: { id: 't1', config: { duration: 1000 }, tracks: [] },
    },
  ],
})

describe('persisting a project', () => {
  it('unwrap yields something structured-clone will accept', () => {
    const [state] = createStore(sampleProject())
    expect(() => structuredClone(unwrap(state))).not.toThrow()
  })

  it('unwrap preserves the data exactly', () => {
    const original = sampleProject()
    const [state] = createStore(original)
    expect(JSON.parse(JSON.stringify(unwrap(state)))).toEqual(
      JSON.parse(JSON.stringify(original))
    )
  })

  it('unwrap keeps nested scenes, elements and the timeline intact', () => {
    const [state] = createStore(sampleProject())
    const raw = unwrap(state) as ReturnType<typeof sampleProject>

    expect(raw.scenes).toHaveLength(1)
    expect(raw.scenes[0].elements[0].id).toBe('e1')
    expect(raw.scenes[0].timeline.config.duration).toBe(1000)
  })

  it('the JSON retry path is lossless for this format', () => {
    // The persisted format is JSON by contract — the LocalStorage backend
    // stores exactly this — so the fallback cannot drop anything a reader
    // would have seen.
    const [state] = createStore(sampleProject())
    const viaJson = JSON.parse(JSON.stringify(unwrap(state)))

    expect(() => structuredClone(viaJson)).not.toThrow()
    expect(viaJson).toEqual(JSON.parse(JSON.stringify(sampleProject())))
  })

  it('survives a project with no elements — the case that used to save fine', () => {
    const empty = {
      ...sampleProject(),
      scenes: [{ id: 's1', name: 'S', order: 0, elements: [], timeline: null }],
    }
    const [state] = createStore(empty)
    expect(() => structuredClone(unwrap(state))).not.toThrow()
  })

  it('survives a project with many elements', () => {
    const big = sampleProject()
    big.scenes[0].elements = Array.from({ length: 200 }, (_, i) => ({
      id: `e${i}`, type: 'rect', x: i, y: i, width: 10, height: 10,
    }))
    const [state] = createStore(big)

    expect(() => structuredClone(unwrap(state))).not.toThrow()
    expect((unwrap(state) as typeof big).scenes[0].elements).toHaveLength(200)
  })
})
