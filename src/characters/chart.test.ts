import { describe, expect, it } from 'vitest'
import { Timeline } from '../engine/core/timeline'
import { surfaceScript } from './acting/surface-script'
import { chart, niceCeiling, type ChartOptions } from './chart'

const BARS: ChartOptions = {
  x: 40,
  y: 30,
  width: 400,
  height: 300,
  kind: 'bar',
  max: 100,
  title: 'Sales',
  data: [
    { id: 'q1', label: 'Q1', value: 40 },
    { id: 'q2', label: 'Q2', value: 20 },
    { id: 'q3', label: 'Q3', value: 60, hidden: true },
  ],
}
const make = (options: Partial<ChartOptions> = {}) => chart({ ...BARS, ...options })

describe('chart', () => {
  it('stands bars on the axis, as tall as their values', () => {
    const sales = make()
    const q1 = sales.anchor('bar:q1')
    const q2 = sales.anchor('bar:q2')
    expect(q1.bottom).toBe(q2.bottom)
    expect(q1.height).toBeCloseTo(q2.height * 2)
    expect(q1.x).toBeLessThan(q2.x)
    // A hidden bar is flat on the axis.
    expect(sales.anchor('bar:q3').height).toBe(0)
    expect(sales.anchor('label:q1').top).toBeGreaterThan(q1.bottom)
    expect(sales.anchor('value:q1').bottom).toBeLessThan(q1.top)
  })

  it('moves its places with the values, over time', () => {
    const sales = make().edit('set', 'bar:q2', { at: 1000, duration: 500, value: 80 }).edit('show', 'bar:q3', { at: 0 })
    expect(sales.anchor('bar:q2', 0).height).toBeCloseTo(sales.anchor('bar:q1').height / 2)
    expect(sales.anchor('bar:q2', 1250).height).toBeCloseTo(sales.anchor('bar:q1').height * 1.25)
    expect(sales.anchor('bar:q2').height).toBeCloseTo(sales.anchor('bar:q1').height * 2)
    expect(sales.anchor('bar:q3').height).toBeCloseTo(sales.anchor('bar:q1').height * 1.5)
  })

  it('records its edits by name as tracks, each from where the last left it', () => {
    const sales = make()
      .edit('set', 'bar:q1', { at: 0, value: 70 })
      .edit('set', 'bar:q1', { at: 2000, value: 10 })
      .edit('highlight', ['bar:q1', 'bar:q2'], { at: 500 })
      .edit('show', 'bar:q3', { at: 800, duration: 400 })
    const timeline = new Timeline({ id: 'c', tracks: sales.tracks('sales') })
    const at = (time: number, prop: string) => timeline.getStateAtTime(time).values.get('sales')?.get(prop) as number
    expect(at(0, 'bar.q1.value')).toBe(40)
    expect(at(1000, 'bar.q1.value')).toBe(70)
    expect(at(3000, 'bar.q1.value')).toBe(10)
    expect(at(1000, 'bar.q2.highlight')).toBe(1)
    expect(at(1000, 'bar.q3.show')).toBeCloseTo(0.5)
  })

  it('carries a figure standing on a bar as it grows', () => {
    const sales = make()
    const ground = sales.anchor('bar:q2', 0).top
    sales.edit('set', 'bar:q2', { at: 1000, duration: 1000, value: 70 })
    const tracks = [{ id: 'hero-y', target: 'hero', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 3000, value: 0 }] }]
    const ridden = sales.ride(tracks, 'hero', { ground })
    const timeline = new Timeline({ id: 'r', tracks: ridden })
    const y = (time: number) => timeline.getStateAtTime(time).values.get('hero')?.get('y') as number
    const rise = sales.anchor('bar:q2').top - ground
    expect(y(500)).toBe(0)
    expect(y(1500)).toBeCloseTo(rise / 2, 0)
    expect(y(3000)).toBeCloseTo(rise)
  })

  it('draws a line chart out point by point', () => {
    const line = make({ kind: 'line', title: undefined })
    expect(line.anchor('point:q1').height).toBeGreaterThan(0)
    expect(() => line.anchor('bar:q1')).toThrow(/a line chart has points, not bars: point:q1/)
    const timeline = new Timeline({ id: 'l', tracks: line.edit('show', 'point:q3', { at: 0, duration: 100 }).tracks('l') })
    expect(timeline.getStateAtTime(50).values.get('l')?.get('point.q3.show')).toBeCloseTo(0.5)
  })

  it('says what is wrong, naming what it has', () => {
    const sales = make()
    expect(() => sales.anchor('barr:q1')).toThrow(/Unknown anchor "barr": did you mean "bar"\?/)
    expect(() => sales.anchor('bar:q9')).toThrow(/there is no "q9" \(data: q1, q2, q3\)/)
    expect(() => sales.edit('grow', 'bar:q1', { at: 0 })).toThrow(/Unknown edit "grow"/)
    expect(() => sales.edit('set', 'bar:q1', { at: 0 })).toThrow(/set needs `value`/)
    expect(() => sales.edit('set', 'label:q1', { at: 0, value: 3 })).toThrow(/set takes bar anchors/)
    expect(() => sales.piece('bar:q1')).toThrow(/a chart has no pieces/)
    expect(() => make({ kind: 'pie' as never })).toThrow(/Unknown kind "pie"/)
    expect(() => make({ data: [{ id: 'a', value: 1 }, { id: 'a', value: 2 }] })).toThrow(/two data are called "a"/)
  })

  it('rounds its scale up to a plain number', () => {
    expect(niceCeiling(66)).toBe(100)
    expect(niceCeiling(19)).toBe(20)
    expect(niceCeiling(2.2)).toBe(2.5)
    expect(make({ max: undefined }).max).toBe(100)
  })

  it('draws without throwing, in both themes and both kinds', () => {
    for (const kind of ['bar', 'line'] as const)
      for (const theme of ['light', 'dark'] as const) {
        const c = make({ kind, theme })
        const calls: string[] = []
        const ctx = new Proxy({}, { get: (_, key) => (typeof key === 'string' && !['font', 'fillStyle', 'strokeStyle', 'lineWidth', 'globalAlpha', 'textAlign', 'textBaseline', 'lineCap', 'lineJoin'].includes(key) ? () => calls.push(String(key)) : undefined), set: () => true }) as unknown as CanvasRenderingContext2D
        c.target.draw(ctx, { ...c.target, props: { ...c.target.props, [`${kind === 'bar' ? 'bar' : 'point'}.q1.highlight`]: 0.5 } }, 0)
        expect(calls.filter((call) => call === 'fillText').length).toBeGreaterThanOrEqual(8)
      }
  })
})

describe('chart with surfaceScript', () => {
  it('a figure leaps onto a bar and rides it up as it grows', () => {
    const sales = make()
    const result = surfaceScript(
      'hero',
      { sales },
      [
        { do: 'leap', to: sales.anchor('bar:q2').x, onto: { surface: 'sales', anchor: 'bar:q2' } },
        { do: 'cheer', for: 1200, then: { surface: 'sales', edit: 'set', anchor: 'bar:q2', value: 90, at: 'start', until: 'end' } },
      ],
      { from: 500, ground: 330, height: 80 }
    )
    const [leap, cheer] = result.beats
    const timeline = new Timeline({ id: 's', tracks: result.tracks })
    const y = (time: number) => 330 + (timeline.getStateAtTime(time).values.get('hero')?.get('y') as number)
    expect(y(leap.end)).toBeCloseTo(sales.anchor('bar:q2', 0).top)
    expect(y(cheer.end)).toBeCloseTo(sales.anchor('bar:q2').top)
  })
})
