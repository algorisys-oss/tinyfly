import { describe, it, expect } from 'vitest'
import { layoutFigure } from './layout-figure'
import { validateMathFigure } from './validate-spec'
import type { MathFigureSpec } from './figure-spec'
import type { Shape } from './display-list'
import { clockFigure, graphSearchFigure, recursionTreeFigure, shortestPathFigure, vennFigure } from '../presets/discrete'
import { displayListToSvg } from '../render/display-list-to-svg'

const shapes = (spec: MathFigureSpec, props = {}) => layoutFigure(validateMathFigure(spec), props).shapes
const of = (list: Shape[], id: string) => list.filter((s) => s.id === id || s.id.startsWith(`${id}.`))
const text = (list: Shape[], id: string) => of(list, id).map((s) => (s.type === 'text' ? s.text : '')).join('')

describe('discrete items', () => {
  it('steps a search: finished nodes fill, the frontier shows, the next edge draws on', () => {
    const figure = graphSearchFigure({ search: 'bfs' })
    const at2 = shapes(figure, { step: 2 })
    expect(text(at2, 'readout')).toBe('visited2of8')
    // After A then B, the queue holds C (from A) and D (from B).
    expect(of(at2, 'g.frontier.box')).toHaveLength(2)
    expect(text(at2, 'g.frontier.label')).toBe('CD')
    expect(of(shapes(figure, { step: 2.5 }), 'g.reaching')).toHaveLength(1)
    expect(of(shapes(figure, { step: 2 }), 'g.reaching')).toHaveLength(0)
  })

  it('shows Dijkstra distances, ∞ until known', () => {
    const figure = shortestPathFigure({ target: 'G' })
    expect(text(shapes(figure, { step: 0 }), 'readout')).toBe('d(G)=∞')
    expect(text(shapes(figure, { step: 8 }), 'readout')).toBe('d(G)=11')
  })

  it('builds a recursion tree of naive Fibonacci calls', () => {
    const list = shapes(recursionTreeFigure({ n: 4 }), { step: 9 })
    expect(text(list, 'readout')).toBe('callsmade:9of9') // F4 makes 9 calls
    expect(of(list, 'calls.node')).toHaveLength(9)
  })

  it('shades a Venn region with clipped cells, in canvas and SVG', () => {
    const list = shapes(vennFigure({ highlight: 'A - B' }))
    const [region] = of(list, 'venn.region')
    expect(region.type === 'line' && region.clip?.map((c) => !!c.outside)).toEqual([false, true]) // in A, outside B
    const svg = displayListToSvg(layoutFigure(vennFigure({ highlight: 'A - B' })))
    expect(svg).toContain('clip-rule="evenodd"')
    expect(svg).toBe(displayListToSvg(layoutFigure(vennFigure({ highlight: 'A - B' }))))
  })

  it('reads a clock value mod its modulus', () => {
    expect(text(shapes(clockFigure({ modulus: 12 }), { value: 17 }), 'readout')).toContain('17≡5')
    expect(text(shapes(clockFigure({ modulus: 7 }), { value: -3 }), 'readout')).toContain('−3≡4')
  })

  it('says how to fix discrete items', () => {
    const base = { width: 600, height: 600 }
    expect(() => validateMathFigure({ ...base, items: [{ id: 'g', kind: 'graph', nodes: [{ id: 'A', at: [0, 0] }], edges: [['A', 'Q']] }] })).toThrow(/node/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'g', kind: 'graph', nodes: [{ id: 'A', at: [0, 0] }], edges: [], search: { kind: 'bfz' as never, start: 'A' } }] })).toThrow(/bfs/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'g', kind: 'graph', nodes: [{ id: 'A' }], edges: [] }] })).toThrow(/no "at"/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'v', kind: 'venn', sets: [{ id: 'A' }, { id: 'B' }], highlight: 'A & C' }] })).toThrow(/set/)
    expect(() => validateMathFigure({ ...base, items: [{ id: 'c', kind: 'clock', modulus: 1, value: 0 }] })).toThrow(/modulus/)
  })
})
