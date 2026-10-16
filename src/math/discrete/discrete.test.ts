import { describe, it, expect } from 'vitest'
import { searchEvents, treeLayout, type GraphEdge } from './graph-search'
import { inRegion, parseSetExpression, regionCells, setNames } from './set-expression'

const nodes = ['A', 'B', 'C', 'D', 'E']
const edges: GraphEdge[] = [
  { from: 'A', to: 'B', weight: 4 }, { from: 'A', to: 'C', weight: 1 }, { from: 'C', to: 'B', weight: 2 },
  { from: 'B', to: 'D', weight: 1 }, { from: 'C', to: 'E', weight: 7 }, { from: 'D', to: 'E', weight: 1 },
]

describe('graph searches', () => {
  it('visits breadth first, level by level, with the queue after each step', () => {
    const events = searchEvents('bfs', 'A', nodes, edges)
    expect(events.map((e) => e.node)).toEqual(['A', 'B', 'C', 'D', 'E'])
    expect(events[0].frontier).toEqual(['B', 'C'])
    expect(events.map((e) => e.parent)).toEqual([undefined, 'A', 'A', 'B', 'C'])
  })

  it('visits depth first, first-listed neighbour first, with the stack', () => {
    const events = searchEvents('dfs', 'A', nodes, edges)
    expect(events.map((e) => e.node)).toEqual(['A', 'B', 'C', 'E', 'D'])
    expect(events[0].frontier).toEqual(['B', 'C'])
  })

  it('settles nodes nearest first with shortest distances (Dijkstra)', () => {
    const events = searchEvents('dijkstra', 'A', nodes, edges)
    expect(events.map((e) => e.node)).toEqual(['A', 'C', 'B', 'D', 'E'])
    expect(events.at(-1)!.distances).toEqual({ A: 0, B: 3, C: 1, D: 4, E: 5 })
    expect(events.find((e) => e.node === 'B')!.parent).toBe('C') // 1 + 2 beats 4
  })

  it('follows direction when directed, and skips what it cannot reach', () => {
    expect(searchEvents('bfs', 'D', nodes, edges, true).map((e) => e.node)).toEqual(['D', 'E'])
    expect(() => searchEvents('bfs', 'Z', nodes, edges)).toThrow(/no node "Z"/)
  })

  it('lays a tree out top down, parents centred over their children', () => {
    const at = treeLayout('r', ['r', 'a', 'b', 'c'], [{ from: 'r', to: 'a' }, { from: 'r', to: 'b' }, { from: 'a', to: 'c' }])
    expect(at.get('r')![1]).toBe(0)
    expect(at.get('c')![1]).toBe(-2)
    expect(at.get('r')![0]).toBeCloseTo((at.get('a')![0] + at.get('b')![0]) / 2)
  })
})

describe('set expressions', () => {
  it('parses operators, complements and aliases with precedence', () => {
    const e = parseSetExpression("A | B & C'")
    expect(inRegion(e, new Set(['A']))).toBe(true)
    expect(inRegion(e, new Set(['B', 'C']))).toBe(false)
    expect(inRegion(e, new Set(['B']))).toBe(true)
    expect(setNames(parseSetExpression('(A ∪ B) ∩ ¬C'))).toEqual(['A', 'B', 'C'])
  })

  it('lists the Venn cells of a region, De Morgan included', () => {
    expect(regionCells(parseSetExpression('A & B'), ['A', 'B'])).toEqual([['A', 'B']])
    expect(regionCells(parseSetExpression('A ^ B'), ['A', 'B'])).toEqual([['A'], ['B']])
    const left = regionCells(parseSetExpression("(A | B)'"), ['A', 'B'])
    const right = regionCells(parseSetExpression("A' & B'"), ['A', 'B'])
    expect(left).toEqual(right)
    expect(left).toEqual([[]])
  })

  it('names the position of a mistake', () => {
    expect(() => parseSetExpression('A &')).toThrow(/unexpected end/)
    expect(() => parseSetExpression('(A | B')).toThrow(/expected "\)"/)
    expect(() => parseSetExpression('A # B')).toThrow(/unexpected "#"/)
  })
})
