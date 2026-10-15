import { describe, it, expect, beforeAll } from 'vitest'
import { createCanvas, Path2D } from '@napi-rs/canvas'
import { layoutFigure } from '../figure/layout-figure'
import { displayListToSvg } from './display-list-to-svg'
import { drawDisplayList } from './draw-display-list'
import { arrowGeometry } from './arrow'
import { mathTarget } from '../targets/math-target'
import { mathSteps } from '../steps/math-steps'
import { lesson } from '../../teach/lesson'
import { deserializeTimeline, type Track } from '../../engine'
import { checkTracks } from '../../adapters/canvas/target-properties'
import { linearMapFigure } from '../presets/linear-algebra'
import { mathFigureToSvg } from '../index'

const pixels = (draw: (ctx: CanvasRenderingContext2D) => void) => {
  const canvas = createCanvas(300, 300)
  draw(canvas.getContext('2d') as unknown as CanvasRenderingContext2D)
  return canvas.toBuffer('image/png').toString('base64')
}

describe('renderers', () => {
  beforeAll(() => {
    ;(globalThis as { Path2D?: unknown }).Path2D ??= Path2D
  })

  it('stops an arrow shaft where its head begins', () => {
    const { shaft, head } = arrowGeometry([[0, 0], [100, 0]], 20)
    expect(shaft.at(-1)).toEqual([80, 0])
    expect(head![0]).toEqual([100, 0])
  })

  it('draws the same pixels for the same values, and different ones for different values', () => {
    const spec = linearMapFigure({ width: 300, height: 300 })
    const at = (M: number[]) => pixels((ctx) => drawDisplayList(ctx, layoutFigure(spec, { M })))
    expect(at([1, 1, 0, 1])).toBe(at([1, 1, 0, 1]))
    expect(at([1, 1, 0, 1])).not.toBe(at([1, 0, 0, 1]))
  })

  it('writes standalone, accessible, escaped SVG', () => {
    const svg = mathFigureToSvg(linearMapFigure(), { M: [1, 1, 0, 1] }, { title: 'A shear <M>' })
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"')).toBe(true)
    expect(svg).toContain('aria-label="A shear &lt;M&gt;"')
    expect(svg).toContain('<text')
    expect(svg).toBe(mathFigureToSvg(linearMapFigure(), { M: [1, 1, 0, 1] }, { title: 'A shear <M>' }))
    expect(displayListToSvg({ width: 10, height: 10, shapes: [] })).not.toContain('<rect')
  })
})

describe('mathTarget and mathSteps', () => {
  it('is a custom canvas target whose props a timeline drives, checked like any target', () => {
    const figure = linearMapFigure()
    const target = mathTarget(figure, { x: 20, y: 10 })
    expect(target.type).toBe('custom')
    expect(target.acceptsProp('M')).toBe(true)
    expect(target.acceptsProp('basis.draw')).toBe(true)
    expect(target.acceptsProp('nope')).toBe(false)
    const l = lesson({ id: 'shear' })
    const m = mathSteps(l, 'fig', figure, { hidden: ['basis'] })
    m.drawOn('basis')
    l.marker('basis', { label: 'î and ĵ', pause: true })
    m.applyMatrix([1, 1, 0, 1])
    const definition = l.definition()
    expect(checkTracks(definition.tracks as Track[], { fig: target as never })).toEqual([])
    const timeline = deserializeTimeline(definition)
    const state = (time: number) => timeline.getStateAtTime(time).values.get('fig')!
    expect(state(0).get('basis.draw')).toBe(0)
    expect(state(900).get('basis.draw')).toBe(1)
    expect(state(900).get('M')).toEqual([1, 0, 0, 1])
    const middle = state(900 + 800).get('M') as number[]
    expect(middle[1]).toBeGreaterThan(0)
    expect(middle[1]).toBeLessThan(1)
    expect(state(definition.config.duration ?? 0).get('M')).toEqual([1, 1, 0, 1])
    expect(definition.config.markers?.map((marker) => marker.id)).toEqual(['basis'])
  })

  it('refuses unknown items and values', () => {
    const l = lesson({ id: 'x' })
    const m = mathSteps(l, 'fig', linearMapFigure())
    expect(() => m.drawOn('basiss')).toThrow(/no item "basiss"/)
    expect(() => m.toValue('N', 1)).toThrow(/no value "N"/)
  })
})
