import { describe, it, expect } from 'vitest'
import { mathSurface } from './math-surface'
import { linearMapFigure } from '../presets/linear-algebra'
import { graphSearchFigure } from '../presets/discrete'
import type { MathFigureSpec } from '../figure/figure-spec'
import { surfaceScript } from '../../characters'
import { deserializeTimeline } from '../../engine'

describe('mathSurface', () => {
  const figure = () => linearMapFigure({ width: 600, height: 600 })

  it('names places on a figure, in scene px', () => {
    const fig = mathSurface(figure(), { x: 100, y: 50 })
    expect(fig.box).toMatchObject({ left: 100, top: 50, width: 600, height: 600 })
    // î's tip is at world (1, 0): figure px (360, 300), scene (460, 350).
    const tip = fig.anchor('tip:basis.i')
    expect(tip.x).toBeCloseTo(460)
    expect(tip.y).toBeCloseTo(350)
    expect(fig.anchor('item:square').width).toBeGreaterThan(50)
    const graph = mathSurface(graphSearchFigure())
    // Node A sits at world (−3, 1.5) on a plane 8.4 units across 600 px.
    expect(graph.anchor('node:g:A').x).toBeCloseTo(((-3 + 4.2) / 8.4) * 600)
  })

  it('finds equation terms by their text', () => {
    const spec: MathFigureSpec = { width: 600, height: 300, items: [{ id: 'eq', kind: 'equation', steps: ['2x + 3 = 7'], at: [300, 150], screen: true, backdrop: false }] }
    const fig = mathSurface(spec)
    const plus3 = fig.anchor('term:eq:+ 3')
    const seven = fig.anchor('term:eq:7')
    expect(plus3.x).toBeLessThan(seven.x)
    expect(fig.anchor('term:eq:2x').x).toBeLessThan(plus3.x)
    expect(() => fig.anchor('term:eq:9')).toThrow(/no "9" in eq \(it reads "2x\+3=7"\)/)
  })

  it('records edits as tracks, and anchors follow them', () => {
    const fig = mathSurface(figure())
    fig.edit('set', 'value:M', { at: 1000, value: [2, 0, 0, 1] })
    fig.edit('drawOn', 'item:square', { at: 0 })
    const tracks = fig.tracks('fig')
    expect(tracks.map((t) => t.property).sort()).toEqual(['M', 'square.draw'])
    const timeline = deserializeTimeline({ id: 't', config: { duration: 3000 }, tracks })
    expect(timeline.getStateAtTime(2200).values.get('fig')!.get('M')).toEqual([2, 0, 0, 1])
    // î's tip moves from x = 1 to x = 2 (60 px further right).
    expect(fig.anchor('tip:basis.i', 2200).x - fig.anchor('tip:basis.i', 0).x).toBeCloseTo(60)
  })

  it('works with surfaceScript: beats aim at its places and trigger its edits', () => {
    const fig = mathSurface(figure(), { x: 20, y: 20 })
    const result = surfaceScript('teacher', { fig }, [
      { do: 'walk', to: 560 },
      { do: 'point', target: { surface: 'fig', anchor: 'tip:basis.i' }, then: { surface: 'fig', edit: 'set', anchor: 'value:M', value: [1, 1, 0, 1] } },
    ], { from: 760, ground: 640, height: 190 })
    expect(result.figureTracks.length).toBeGreaterThan(0)
    expect(result.tracks.some((t) => t.target === 'fig' && t.property === 'M')).toBe(true)
  })

  it('says what it cannot do', () => {
    const fig = mathSurface(figure())
    expect(() => fig.anchor('tip:nope')).toThrow(/item/)
    expect(() => fig.anchor('vertex:A')).toThrow(/anchor/)
    expect(() => fig.edit('wiggle', 'item:grid', { at: 0 })).toThrow(/edit/)
    expect(() => fig.edit('set', 'value:N', { at: 0, value: 1 })).toThrow(/value/)
    expect(() => fig.piece('item:grid')).toThrow(/do not come loose/)
  })
})
