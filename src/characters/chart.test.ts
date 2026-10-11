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
    expect(() => sales.piece('bar:q1')).toThrow(/a bar is not a piece; slices of a pie or donut are/)
    expect(() => make({ kind: 'scatter' as never })).toThrow(/Unknown kind "scatter"/)
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

const PIE: ChartOptions = {
  x: 10,
  y: 20,
  width: 300,
  height: 300,
  kind: 'pie',
  data: [
    { id: 'a', label: 'A', value: 1 },
    { id: 'b', label: 'B', value: 1 },
    { id: 'c', label: 'C', value: 1 },
    { id: 'd', label: 'D', value: 1, hidden: true },
  ],
}
const pie = (options: Partial<ChartOptions> = {}) => chart({ ...PIE, ...options })
const centreOf = (box: { left: number; top: number; width: number; height: number }) => ({ x: box.left + box.width / 2, y: box.top + box.height / 2 })

describe('pie and donut charts', () => {
  it('share the circle by value from the top clockwise, hidden slices closed', () => {
    const p = pie()
    const box = p.anchor('box')
    const centre = centreOf(box)
    const a = centreOf(p.anchor('slice:a'))
    const b = centreOf(p.anchor('slice:b'))
    const c = centreOf(p.anchor('slice:c'))
    // Three equal slices: A's middle is up and to the right, B's straight down, C's up and to the left.
    expect(a.x).toBeGreaterThan(centre.x)
    expect(a.y).toBeLessThan(centre.y)
    expect(Math.abs(b.x - centre.x)).toBeLessThan(1)
    expect(b.y).toBeGreaterThan(centre.y)
    expect(c.x).toBeLessThan(centre.x)
    expect(Math.abs(a.y - c.y)).toBeLessThan(1)
    expect(p.max).toBe(4)
    // Its label sits outside the slice, further from the centre.
    const label = centreOf(p.anchor('label:a'))
    expect(Math.hypot(label.x - centre.x, label.y - centre.y)).toBeGreaterThan(Math.hypot(a.x - centre.x, a.y - centre.y))
  })

  it('re-share the circle as a slice opens or is set', () => {
    const p = pie().edit('show', 'slice:d', { at: 1000, duration: 500 }).edit('set', 'slice:a', { at: 2000, value: 3 })
    const centre = centreOf(p.anchor('box'))
    // Before D opens, B is straight down; with four equal slices B's middle is down and to the right.
    expect(Math.abs(centreOf(p.anchor('slice:b', 500)).x - centre.x)).toBeLessThan(1)
    expect(centreOf(p.anchor('slice:b', 1600)).x).toBeGreaterThan(centre.x + 5)
    // A set to 3 of 6 (D is open by then) takes the right half of the circle: its middle is level
    // with the centre, C's (the middle of the other half) is level on the left, B and D above and below it.
    const a = centreOf(p.anchor('slice:a'))
    const b = centreOf(p.anchor('slice:b'))
    const c = centreOf(p.anchor('slice:c'))
    const d = centreOf(p.anchor('slice:d'))
    expect(a.x).toBeGreaterThan(centre.x + 10)
    expect(c.x).toBeLessThan(centre.x - 10)
    expect(Math.abs(a.y - c.y)).toBeLessThan(1)
    expect(Math.abs(b.x - d.x)).toBeLessThan(1)
    expect(b.y).toBeGreaterThan(c.y + 5)
    expect(d.y).toBeLessThan(c.y - 5)
  })

  it('pull a slice out from the centre, and only on a pie', () => {
    const p = pie().edit('pull', 'slice:a', { at: 0, duration: 100 })
    const centre = centreOf(p.anchor('box'))
    const before = centreOf(p.anchor('slice:a', 0))
    const after = centreOf(p.anchor('slice:a', 100))
    expect(Math.hypot(after.x - centre.x, after.y - centre.y)).toBeGreaterThan(Math.hypot(before.x - centre.x, before.y - centre.y) + 5)
    expect(p.tracks('t').some((track) => track.property === 'slice.a.pull')).toBe(true)
    expect(() => make().edit('pull', 'bar:q1', { at: 0 })).toThrow(/pull takes slice anchors of a pie or donut/)
    expect(() => pie().edit('set', 'label:a', { at: 0, value: 2 })).toThrow(/set takes slice anchors/)
    expect(() => pie({ series: [{ id: 'x' }, { id: 'y' }] })).toThrow(/a pie shows one series/)
  })

  it('let a slice come loose as a piece that is flung away', () => {
    const p = pie({ kind: 'donut' })
    const slice = p.piece('slice:b')
    expect(slice.datum).toBe('b')
    expect(p.piece('slice:b')).toBe(slice)
    p.fling(slice, { at: 500, velocity: { x: 0.4, y: -0.5 } })
    const timeline = new Timeline({ id: 'p', tracks: p.tracks('p') })
    const at = (time: number, prop: string) => timeline.getStateAtTime(time).values.get('p')?.get(prop) as number
    expect(at(400, 'piece.1.x')).toBe(0)
    expect(at(900, 'piece.1.x')).toBeGreaterThan(100)
    expect(at(1400, 'piece.1.opacity')).toBeLessThan(0.05)
    expect(() => p.piece('label:b')).toThrow(/a piece is a slice, slice:ID/)
  })

  it('draw in both themes, slices, labels and a loose piece', () => {
    for (const kind of ['pie', 'donut'] as const)
      for (const theme of ['light', 'dark'] as const) {
        const p = pie({ kind, theme, title: 'Traffic' })
        const piece = p.piece('slice:c')
        const calls: string[] = []
        const ctx = new Proxy({}, { get: (_, key) => (typeof key === 'string' && !['font', 'fillStyle', 'strokeStyle', 'lineWidth', 'globalAlpha', 'textAlign', 'textBaseline', 'lineCap', 'lineJoin'].includes(key) ? () => calls.push(String(key)) : undefined), set: () => true }) as unknown as CanvasRenderingContext2D
        p.target.draw(ctx, { ...p.target, props: { ...p.target.props, 'slice.a.pull': 1, 'slice.b.highlight': 0.5, [`piece.${piece.id}.x`]: 40, [`piece.${piece.id}.rotate`]: 30 } }, 0)
        expect(calls.filter((call) => call === 'arc').length).toBeGreaterThanOrEqual(kind === 'donut' ? 6 : 3)
        expect(calls.filter((call) => call === 'fillText').length).toBeGreaterThanOrEqual(6)
      }
  })
})

describe('several series and axis titles', () => {
  const GROUPED: ChartOptions = {
    ...BARS,
    title: undefined,
    series: [{ id: 'plan', label: 'Plan' }, { id: 'actual', label: 'Actual', color: '#3fa66b' }],
    data: [
      { id: 'q1', label: 'Q1', values: { plan: 40, actual: 50 } },
      { id: 'q2', label: 'Q2', values: { plan: 20, actual: 10 } },
    ],
    axis: { x: 'Quarter', y: 'Sales (k)' },
  }

  it('stand grouped bars side by side in each band, with a legend', () => {
    const c = chart(GROUPED)
    const plan = c.anchor('bar:q1:plan')
    const actual = c.anchor('bar:q1:actual')
    expect(c.anchor('bar:q1')).toEqual(plan)
    expect(actual.left).toBeGreaterThanOrEqual(plan.right)
    expect(actual.bottom).toBe(plan.bottom)
    expect(actual.height).toBeCloseTo(plan.height * 1.25)
    expect(actual.right).toBeLessThan(c.anchor('bar:q2:plan').left)
    expect(c.anchor('value:q1:actual').bottom).toBeLessThan(actual.top)
    const legend = c.anchor('legend:actual')
    expect(legend.top).toBeLessThan(plan.top)
    expect(c.anchor('legend:plan').right).toBeLessThan(legend.left)
    expect(c.anchor('label:q1').width).toBeGreaterThan(plan.width)
    expect(() => c.anchor('bar:q1:forecast')).toThrow(/there is no series "forecast" \(series: plan, actual\)/)
    expect(() => c.anchor('label:q1:plan')).toThrow(/a label is one per datum/)
    expect(() => make().anchor('legend:plan')).toThrow(/only a chart with several series has a legend/)
    expect(() => chart({ ...GROUPED, data: [{ id: 'q1', values: { plan: 1 } }] })).toThrow(/needs a value for series "actual"/)
  })

  it('key and ride each series on its own', () => {
    const c = chart(GROUPED).edit('set', 'bar:q2:actual', { at: 0, duration: 100, value: 60 }).edit('highlight', 'bar:q1', { at: 0 })
    const timeline = new Timeline({ id: 'g', tracks: c.tracks('g') })
    const at = (time: number, prop: string) => timeline.getStateAtTime(time).values.get('g')?.get(prop) as number
    expect(at(200, 'bar.q2.actual.value')).toBe(60)
    expect(at(200, 'bar.q1.plan.highlight')).toBe(1)
    expect(c.target.props?.['bar.q2.plan.value']).toBe(20)
    expect(c.tracks('g').some((track) => track.property === 'bar.q2.plan.value')).toBe(false)
    const ground = c.anchor('bar:q2:actual', 0).top
    const ridden = c.ride([{ id: 'hero-y', target: 'hero', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 300, value: 0 }] }], 'hero', { ground })
    const y = new Timeline({ id: 'r', tracks: ridden }).getStateAtTime(300).values.get('hero')?.get('y') as number
    expect(y).toBeCloseTo(c.anchor('bar:q2:actual').top - ground)
  })

  it('draw several lines and the axis titles, and make room for them', () => {
    const lines = chart({ ...GROUPED, kind: 'line' })
    expect(lines.anchor('point:q1:actual').top).toBeLessThan(lines.anchor('point:q1:plan').top)
    const calls: string[] = []
    const ctx = new Proxy({}, { get: (_, key) => (typeof key === 'string' && !['font', 'fillStyle', 'strokeStyle', 'lineWidth', 'globalAlpha', 'textAlign', 'textBaseline', 'lineCap', 'lineJoin'].includes(key) ? () => calls.push(String(key)) : undefined), set: () => true }) as unknown as CanvasRenderingContext2D
    lines.target.draw(ctx, lines.target, 0)
    expect(calls.filter((call) => call === 'stroke').length).toBeGreaterThanOrEqual(7)
    expect(calls.filter((call) => call === 'rotate').length).toBe(1)
    // The y title pushes the plot right; the x title lifts the axis.
    expect(chart({ ...BARS, axis: { y: 'Sales' } }).anchor('bar:q1').left).toBeGreaterThan(make().anchor('bar:q1').left)
    expect(chart({ ...BARS, axis: { x: 'Quarter' } }).anchor('bar:q1').bottom).toBeLessThan(make().anchor('bar:q1').bottom)
  })
})
