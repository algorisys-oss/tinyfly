import { describe, it, expect } from 'vitest'
import { expandSymbolInstances, hasSymbolInstances, shownSymbolId } from './expand-symbols'
import type { SceneElement } from '../stores/scene-store'
import type { SymbolDefinition } from '../stores/scene-types'

function rect(over: Partial<SceneElement> = {}): SceneElement {
  return {
    id: 'r',
    type: 'rect',
    name: 'R',
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fill: '#fff',
    stroke: '#000',
    strokeWidth: 0,
    borderRadius: 0,
    ...over,
  } as SceneElement
}

function instance(symbolId: string, over: Partial<SceneElement> = {}): SceneElement {
  return {
    id: 'inst',
    type: 'symbol',
    name: 'Instance',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    symbolId,
    ...over,
  } as SceneElement
}

function symbol(elements: SceneElement[], over: Partial<SymbolDefinition> = {}): SymbolDefinition {
  return { id: 's', name: 'S', width: 100, height: 100, elements, timeline: null, created: 0, modified: 0, ...over }
}

describe('expandSymbolInstances', () => {
  it('passes non-symbol elements through unchanged', () => {
    const els = [rect({ id: 'a' }), rect({ id: 'b' })]
    const out = expandSymbolInstances(els, () => undefined)
    expect(out).toHaveLength(2)
    expect(out.map((e) => e.id)).toEqual(['a', 'b'])
  })

  it('drops instances whose symbol is missing', () => {
    const out = expandSymbolInstances([instance('gone')], () => undefined)
    expect(out).toEqual([])
  })

  it('translates + scales children into the instance box', () => {
    const sym = symbol([rect({ id: 'c', x: 10, y: 20, width: 10, height: 10 })])
    // Instance at (200,100), 200x100 → scale 2x horizontally, 1x vertically.
    const out = expandSymbolInstances(
      [instance(sym.id, { x: 200, y: 100, width: 200, height: 100 })],
      (id) => (id === sym.id ? sym : undefined)
    )
    expect(out).toHaveLength(1)
    const c = out[0]
    expect(c.width).toBe(20) // 10 * 2
    expect(c.height).toBe(10) // 10 * 1
    // centre maps: localCentre (15,25) → inst.x + 15*2 = 230, inst.y + 25*1 = 125; top-left = centre - size/2
    expect(c.x).toBeCloseTo(230 - 10)
    expect(c.y).toBeCloseTo(125 - 5)
  })

  it('multiplies opacity by the instance opacity', () => {
    const sym = symbol([rect({ opacity: 0.5 })])
    const out = expandSymbolInstances(
      [instance(sym.id, { opacity: 0.5 })],
      (id) => (id === sym.id ? sym : undefined)
    )
    expect(out[0].opacity).toBeCloseTo(0.25)
  })

  it('adds the instance rotation to box children', () => {
    const sym = symbol([rect({ rotation: 10 })])
    const out = expandSymbolInstances(
      [instance(sym.id, { rotation: 30 })],
      (id) => (id === sym.id ? sym : undefined)
    )
    expect(out[0].rotation).toBe(40)
  })

  it('expands nested symbols recursively', () => {
    const inner = symbol([rect({ id: 'leaf' })], { id: 'inner' })
    const outer = symbol([instance('inner', { id: 'nested' })], { id: 'outer' })
    const lookup = (id: string) => (id === 'inner' ? inner : id === 'outer' ? outer : undefined)
    const out = expandSymbolInstances([instance('outer')], lookup)
    expect(out).toHaveLength(1)
    expect(out[0].type).toBe('rect')
  })
})

describe('shownSymbolId (symbol swap)', () => {
  const inst = { symbolId: 'base', swapSet: ['a', 'b', 'c'] }

  it('returns the base symbol when there is no swap set', () => {
    expect(shownSymbolId({ symbolId: 'base' }, 2)).toBe('base')
    expect(shownSymbolId({ symbolId: 'base', swapSet: [] }, 2)).toBe('base')
  })

  it('returns the base symbol when swapIndex is missing', () => {
    expect(shownSymbolId(inst, undefined)).toBe('base')
  })

  it('floors the index (step / hold behaviour)', () => {
    expect(shownSymbolId(inst, 0)).toBe('a')
    expect(shownSymbolId(inst, 0.9)).toBe('a')
    expect(shownSymbolId(inst, 1)).toBe('b')
    expect(shownSymbolId(inst, 1.99)).toBe('b')
    expect(shownSymbolId(inst, 2)).toBe('c')
  })

  it('clamps out-of-range indices to the set', () => {
    expect(shownSymbolId(inst, -5)).toBe('a')
    expect(shownSymbolId(inst, 99)).toBe('c')
  })
})

describe('hasSymbolInstances', () => {
  it('detects symbol elements', () => {
    expect(hasSymbolInstances([rect(), instance('x')])).toBe(true)
    expect(hasSymbolInstances([rect()])).toBe(false)
  })
})
