import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createProjectStore } from './project-store'
import type { SceneElement } from './scene-store'

// Minimal localStorage mock (matches project-store.test.ts).
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((k: string) => store[k] ?? null),
    setItem: vi.fn((k: string, v: string) => {
      store[k] = v
    }),
    removeItem: vi.fn((k: string) => {
      delete store[k]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

function rect(id: string, name: string): SceneElement {
  return {
    id,
    type: 'rect',
    name,
    x: 0,
    y: 0,
    width: 40,
    height: 40,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fill: '#4a9eff',
    stroke: '#000',
    strokeWidth: 0,
    borderRadius: 0,
  } as SceneElement
}

describe('Symbol Library', () => {
  beforeEach(() => localStorageMock.clear())

  it('starts with an empty Library', () => {
    const store = createProjectStore()
    expect(store.getSymbols()).toEqual([])
    expect(store.currentProject().symbols).toEqual([])
  })

  it('creates a symbol from elements and defaults its size to the canvas', () => {
    const store = createProjectStore()
    const els = [rect('a', 'A'), rect('b', 'B')]
    const sym = store.createSymbol('Button', els)

    expect(sym.name).toBe('Button')
    expect(sym.elements).toHaveLength(2)
    expect(sym.width).toBe(store.currentProject().canvas.width)
    expect(store.getSymbols()).toHaveLength(1)
    expect(store.getSymbol(sym.id)?.name).toBe('Button')
  })

  it('deep-clones the source elements (later edits do not leak in)', () => {
    const store = createProjectStore()
    const els = [rect('a', 'A')]
    const sym = store.createSymbol('S', els)
    ;(els[0] as { name: string }).name = 'Mutated'
    expect(store.getSymbol(sym.id)?.elements[0].name).toBe('A')
  })

  it('honours an explicit size and timeline', () => {
    const store = createProjectStore()
    const sym = store.createSymbol('S', [rect('a', 'A')], {
      width: 120,
      height: 80,
      timeline: { id: 't', config: { duration: 1000 }, tracks: [] },
    })
    expect(sym.width).toBe(120)
    expect(sym.height).toBe(80)
    expect(store.getSymbol(sym.id)?.timeline?.config.duration).toBe(1000)
  })

  it('renames and updates a symbol', () => {
    const store = createProjectStore()
    const sym = store.createSymbol('Old', [rect('a', 'A')])
    store.renameSymbol(sym.id, 'New')
    expect(store.getSymbol(sym.id)?.name).toBe('New')

    store.updateSymbol(sym.id, { elements: [rect('a', 'A'), rect('c', 'C')] })
    expect(store.getSymbol(sym.id)?.elements).toHaveLength(2)
  })

  it('counts instances across scenes and blocks deletion while in use', () => {
    const store = createProjectStore()
    const sym = store.createSymbol('S', [rect('a', 'A')])

    // No instances yet → deletable.
    expect(store.symbolInstanceCount(sym.id)).toBe(0)

    // Inject an instance element into the active scene's persisted state.
    const instance = {
      id: 'inst-1',
      type: 'symbol' as const,
      name: 'Instance',
      x: 0,
      y: 0,
      width: 40,
      height: 40,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      symbolId: sym.id,
    }
    store.saveActiveSceneState([instance as unknown as SceneElement], null)

    expect(store.symbolInstanceCount(sym.id)).toBe(1)
    expect(store.deleteSymbol(sym.id)).toBe(false) // blocked while in use
    expect(store.getSymbols()).toHaveLength(1)

    // Remove the instance, then deletion succeeds.
    store.saveActiveSceneState([], null)
    expect(store.deleteSymbol(sym.id)).toBe(true)
    expect(store.getSymbols()).toHaveLength(0)
  })

  it('persists symbols with the project (survives a reload)', () => {
    const store = createProjectStore()
    store.createSymbol('Persisted', [rect('a', 'A')])
    store.saveNow()

    // A fresh store loads from the same (mock) localStorage.
    const reloaded = createProjectStore()
    expect(reloaded.getSymbols().map((s) => s.name)).toContain('Persisted')
  })
})
