import type { CustomTarget } from '../adapters/canvas/canvas-adapter'
import type { PropertyInfo } from '../adapters/canvas/target-properties'
import { unknownName } from '../engine/authoring/did-you-mean'
import type { Track } from '../engine/types'
import { changingWindows, editLog, valueAt, type EditOptions } from './surface/edit-log'
import { pieceMotion, SAMPLE_STEP, type FlingOptions, type SurfacePiece, type TimedPoint } from './surface/pieces'
import { rideFloors } from './surface/ride'
import { anchorError, editError, parseAnchor, type Surface, type SurfaceAbout, type SurfaceEditOptions } from './surface/surface'
import { surfaceBox, type SurfaceBox } from './surface/surface-box'

/**
 * A bar, line, pie or donut chart as a scene object figures act on: they
 * point at a bar, highlight the dip, stand on a bar as it grows, pull a
 * slice out of a pie and kick it away.
 *
 * ```ts
 * const sales = chart({
 *   x: 40, y: 30, width: 420, height: 280, kind: 'bar', title: 'Sales',
 *   data: [
 *     { id: 'q1', label: 'Q1', value: 40 },
 *     { id: 'q2', label: 'Q2', value: 25 },
 *     { id: 'q3', label: 'Q3', value: 55, hidden: true },
 *   ],
 * })
 * sales.edit('highlight', 'bar:q2', { at: 600 })
 * sales.edit('show', 'bar:q3', { at: 1200 })            // grows in from the axis
 * sales.edit('set', 'bar:q1', { at: 2000, value: 80 })  // and its value label counts up
 *
 * const traffic = chart({ x: 500, y: 30, width: 300, height: 280, kind: 'donut', data: [...] })
 * traffic.edit('pull', 'slice:mobile', { at: 400 })     // out from the centre
 * traffic.fling(traffic.piece('slice:other'), { at: 900 })
 * ```
 *
 * Several series (`series: [{ id: 'a' }, { id: 'b' }]`, values as
 * `values: { a: 10, b: 12 }`) draw grouped bars or one line each, with a
 * legend; their places are `bar:ID:SERIES`. A pie shows one series.
 *
 * The data is declared up front; the scale (`max`) is fixed when it is made
 * (from the data, or given), so a bar set past it grows out of the plot.
 * Its places follow the values: `anchor('bar:q1', time)` is the bar as it
 * stands at `time` (default: after every edit; a surface script aims beats
 * at it as laid out). A figure standing on a bar's top is carried up and
 * down with it (`ride()`). Edits are keys on its props: `bar.ID.value`,
 * `bar.ID.show`, `bar.ID.highlight` (or `point.ID.…` on a line chart,
 * `slice.ID.…` and `slice.ID.pull` on a pie; `bar.ID.SERIES.…` with several
 * series).
 */

export type ChartKind = 'bar' | 'line' | 'pie' | 'donut'
export const CHART_KINDS: readonly ChartKind[] = ['bar', 'line', 'pie', 'donut']

export type ChartThemeName = 'light' | 'dark'

export interface ChartTheme {
  background: string
  text: string
  /** Axis and grid lines */
  grid: string
  /** Bars, the line and its points (the first series) */
  color: string
  /** A highlighted bar, point or slice */
  highlight: string
  /** Slices and series in turn (the first is `color`) */
  palette: string[]
  font: string
}

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif'

export const CHART_THEMES: Record<ChartThemeName, ChartTheme> = {
  light: {
    background: '#ffffff',
    text: '#3b4252',
    grid: '#d8dee9',
    color: '#4c7bd9',
    highlight: '#e8833a',
    palette: ['#4c7bd9', '#3fa66b', '#b05cc9', '#d9c04c', '#4cb8c4', '#d95c6f', '#8a7a5a', '#6b7a99'],
    font: FONT,
  },
  dark: {
    background: '#1e2230',
    text: '#cdd6f4',
    grid: '#3a4055',
    color: '#89b4fa',
    highlight: '#fab387',
    palette: ['#89b4fa', '#a6e3a1', '#cba6f7', '#f9e2af', '#94e2d5', '#f38ba8', '#b4a58a', '#9399b2'],
    font: FONT,
  },
}

/** One of several series: its own colour, a bar in each group or a line of its own. */
export interface ChartSeries {
  id: string
  /** In the legend (default its id) */
  label?: string
  /** Its colour (default the theme's palette, in turn) */
  color?: string
}

/** One bar, point or slice. */
export interface ChartDatum {
  id: string
  /** Under it, on the axis (default its id) */
  label?: string
  /** Its value (one series) */
  value?: number
  /** Its value in each series, by series id (several series) */
  values?: Record<string, number>
  /** Start at nothing: a bar flat on the axis, a point the line has not reached, a slice of no width; brought in with `show` */
  hidden?: boolean
}

export interface ChartOptions {
  /** Top-left corner, scene px */
  x: number
  y: number
  width: number
  height: number
  kind: ChartKind
  data: ChartDatum[]
  /** Several series (bar and line charts): each datum then gives `values` by series id */
  series?: ChartSeries[]
  /** The value at the top of the plot (default: a round number above the largest value) */
  max?: number
  title?: string
  /** Axis titles (bar and line charts) */
  axis?: { x?: string; y?: string }
  /** Show the legend with several series (default true) */
  legend?: boolean
  theme?: ChartThemeName | Partial<ChartTheme>
  /** Value labels: decimal places (default 0), and text before and after the number */
  decimals?: number
  prefix?: string
  suffix?: string
  /** Show each value above its bar or point, or on its slice (default true) */
  values?: boolean
}

/** A slice of a pie or donut that has come loose. */
export interface ChartSlicePiece extends SurfacePiece {
  /** The datum it is the slice of */
  readonly datum: string
}

export interface Chart extends Surface {
  readonly kind: 'chart'
  readonly chartKind: ChartKind
  readonly target: CustomTarget
  readonly box: SurfaceBox
  /** The value at the top of the plot (pies: the total of the data) */
  readonly max: number
  /** The box at a named place, as it stands at `time`: `box`, `bar:ID`, `point:ID`, `slice:ID` (`:SERIES` after the id with several series), `label:ID`, `value:ID`, `legend:SERIES` */
  anchor(name: string, time?: number): SurfaceBox
  /** Make the slice at a `slice:` place a piece that can come loose (pies and donuts) */
  piece(anchor: string): ChartSlicePiece
  /** Change the chart at a time by name, at named places (see `CHART_SURFACE.edits`) */
  edit(name: string, anchor: string | string[], options: SurfaceEditOptions): Chart
  follow(piece: SurfacePiece, path: TimedPoint[]): Chart
  fling(piece: SurfacePiece, options: FlingOptions): Chart
  move(piece: SurfacePiece, options: EditOptions & { to: { x: number; y: number } }): Chart
  /** A figure's tracks with it carried up and down by the bar it stands on */
  ride(tracks: Track[], target: string, options: { ground: number; every?: number }): Track[]
  tracks(target: string): Track[]
}

/** A chart's anchors and edits, as data: for its `about`, the capability catalog and the checks. */
export const CHART_SURFACE: SurfaceAbout = {
  kind: 'chart',
  create:
    'chart({ x, y, width, height, kind: bar | line | pie | donut, data: [{ id, label?, value | values: { SERIES: value }, hidden? }], series?: [{ id, label?, color? }], max?, title?, axis?: { x?, y? }, legend?, theme?: light | dark, decimals?, prefix?, suffix?, values? })',
  anchors: {
    box: 'the whole chart',
    'bar:ID': 'a bar (bar charts; bar:ID:SERIES with several series), as it stands at the time: stand on its top (it carries a figure as it grows), point at it',
    'point:ID': 'a point on the line (line charts; point:ID:SERIES with several series), as it stands at the time',
    'slice:ID': 'a slice of a pie or donut, as it stands at the time (its middle; pulled out, it moves): point at it, make it a piece',
    'label:ID': 'its label: under the axis, or beside the slice',
    'value:ID': 'its value label: above the bar or point (value:ID:SERIES), or on the slice',
    'legend:SERIES': 'a series in the legend (several series)',
  },
  edits: {
    set: 'bar, point or slice anchors; { at, value, duration? }: animate to a new value; its value label counts along (a pie re-shares the circle)',
    show: 'bar, point or slice anchors given `hidden`; { at, duration?, on? }: grow a bar in from the axis, draw the line out to a point, or open a slice (on: false takes it back)',
    highlight: 'bar, point or slice anchors; { at, duration?, on? }: colour it out (on: false clears)',
    pull: 'slice anchors; { at, duration?, on? }: pull the slice out from the centre (on: false puts it back)',
  },
}

/** How long edits take by default, ms. */
const SET_DURATION = 600
const SHOW_DURATION = 500
const HIGHLIGHT_DURATION = 200
const PULL_DURATION = 400

/** How far a pulled slice stands out, as a share of the radius. */
const PULL_OUT = 0.14

type ItemKind = 'bar' | 'point' | 'slice'
type ChartAnchor = { kind: 'box' } | { kind: ItemKind | 'label' | 'value'; id: string; series: string } | { kind: 'legend'; series: string }

/** A slice's angles and middle at a time, chart-local. */
interface SliceAt {
  start: number
  sweep: number
  mid: number
  /** The middle of the slice's body, pulled out as far as it is */
  centre: { x: number; y: number }
  /** How far it is pulled out, px */
  out: number
}

const TAU = Math.PI * 2

export function chart(options: ChartOptions): Chart {
  if (!CHART_KINDS.includes(options.kind)) throw new Error(`chart: ${unknownName('kind', options.kind, CHART_KINDS)}`)
  const themeName = typeof options.theme === 'string' ? options.theme : 'light'
  if (!(themeName in CHART_THEMES)) throw new Error(`chart: ${unknownName('theme', themeName, Object.keys(CHART_THEMES))}`)
  const theme: ChartTheme = typeof options.theme === 'object' ? { ...CHART_THEMES.light, ...options.theme } : CHART_THEMES[themeName as ChartThemeName]
  if (!Array.isArray(options.data) || options.data.length === 0) throw new Error('chart: `data` needs at least one { id, value }')
  const kind = options.kind
  const round = kind === 'pie' || kind === 'donut'

  // Series: the ones given, else the one every datum's `value` is in.
  const multi = Array.isArray(options.series) && options.series.length > 1
  const series: ChartSeries[] = Array.isArray(options.series) && options.series.length > 0 ? options.series : [{ id: 'value' }]
  if (round && multi) throw new Error(`chart: a ${kind} shows one series (got ${series.length}); make a chart per series`)
  const seriesIds = new Set<string>()
  for (const s of series) {
    if (typeof s?.id !== 'string' || !s.id || /[:.]/.test(s.id)) throw new Error(`chart: every series needs an \`id\` without ":" or "." (got ${JSON.stringify(s?.id)})`)
    if (seriesIds.has(s.id)) throw new Error(`chart: two series are called "${s.id}"`)
    seriesIds.add(s.id)
  }
  const seriesIndex = new Map(series.map((s, i) => [s.id, i]))
  const colourOfSeries = (id: string) => series[seriesIndex.get(id)!].color ?? (seriesIndex.get(id) === 0 ? theme.color : theme.palette[seriesIndex.get(id)! % theme.palette.length])

  const ids = new Set<string>()
  const valueIn = (datum: ChartDatum, s: ChartSeries): number => {
    const value = datum.values?.[s.id] ?? (options.series ? undefined : datum.value) ?? datum.value
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(multi ? `chart: "${datum.id}" needs a value for series "${s.id}" (\`values: { ${s.id}: … }\`)` : `chart: "${datum.id}" needs a \`value\`, a number`)
    }
    return value
  }
  for (const datum of options.data) {
    if (typeof datum?.id !== 'string' || !datum.id || /[:.]/.test(datum.id)) throw new Error(`chart: every datum needs an \`id\` without ":" or "." (got ${JSON.stringify(datum?.id)})`)
    if (ids.has(datum.id)) throw new Error(`chart: two data are called "${datum.id}"`)
    for (const s of series) valueIn(datum, s)
    ids.add(datum.id)
  }

  /** The prop prefix and anchor kind of its data. */
  const item: ItemKind = kind === 'bar' ? 'bar' : kind === 'line' ? 'point' : 'slice'
  const largest = Math.max(...options.data.flatMap((d) => series.map((s) => valueIn(d, s))))
  const max = round ? options.data.reduce((sum, d) => sum + valueIn(d, series[0]), 0) : (options.max ?? niceCeiling(largest * 1.1))
  if (!round && !(max > 0)) throw new Error(`chart: \`max\` must be above 0 (got ${max})`)
  const fontSize = Math.max(10, Math.min(16, options.height / 20))
  const legend = multi && options.legend !== false
  const axisX = !round ? options.axis?.x : undefined
  const axisY = !round ? options.axis?.y : undefined
  // The plot, chart-local: room for the title above (and the legend), labels below (and the x title) and the scale on the left (and the y title).
  const legendTop = options.title ? fontSize * 2.3 : fontSize * 0.5
  const plot = {
    left: fontSize * 3.6 + (axisY ? fontSize * 1.5 : 0),
    right: options.width - fontSize,
    top: (options.title ? fontSize * 3 : fontSize * 1.6) + (legend ? fontSize * 1.6 : 0),
    bottom: options.height - fontSize * 2.4 - (axisX ? fontSize * 1.4 : 0),
  }
  const plotHeight = plot.bottom - plot.top
  const band = (plot.right - plot.left) / options.data.length
  // One bar centred in its band; several share the band side by side.
  const slot = multi ? (band * 0.72) / series.length : band * 0.6
  const barWidth = multi ? slot * 0.86 : slot
  const pointRadius = Math.max(4, fontSize * 0.35)
  const scale = plotHeight / max
  const indexOf = new Map(options.data.map((d, i) => [d.id, i]))
  const centreX = (id: string) => plot.left + band * (indexOf.get(id)! + 0.5)
  const barLeft = (id: string, s: string) => (multi ? centreX(id) - band * 0.36 + slot * seriesIndex.get(s)! + (slot - barWidth) / 2 : centreX(id) - barWidth / 2)
  const barCentreX = (id: string, s: string) => barLeft(id, s) + barWidth / 2

  // A pie: in the middle of the plot, with a ring of room for the labels.
  const pieBottom = options.height - fontSize * 1.2
  const pie = {
    cx: options.width / 2,
    cy: (plot.top + pieBottom) / 2,
    r: Math.max(10, Math.min(options.width / 2, (pieBottom - plot.top) / 2) - fontSize * 2.6),
  }
  const inner = kind === 'donut' ? pie.r * 0.55 : 0
  /** Where the middle of a slice's body sits, as a share of the radius. */
  const bodyAt = kind === 'donut' ? (inner + pie.r) / 2 : pie.r * 0.62

  // The legend: entries from the right, under the title.
  const legendBoxes = new Map<string, SurfaceBox>()
  if (legend) {
    let cursor = plot.right
    for (const s of [...series].reverse()) {
      const text = s.label ?? s.id
      const width = fontSize * 0.62 * text.length + fontSize * 1.9
      legendBoxes.set(s.id, surfaceBox(cursor - width, legendTop, width, fontSize * 1.4))
      cursor -= width + fontSize * 0.6
    }
  }

  const log = editLog()
  const motion = pieceMotion(log)
  const props: Record<string, number> = {}
  const keyOf = (id: string, s: string, field: string) => (multi ? `${item}.${id}.${s}.${field}` : `${item}.${id}.${field}`)
  for (const datum of options.data) {
    for (const s of series) {
      props[keyOf(datum.id, s.id, 'value')] = valueIn(datum, s)
      props[keyOf(datum.id, s.id, 'show')] = datum.hidden ? 0 : 1
      props[keyOf(datum.id, s.id, 'highlight')] = 0
      if (round) props[keyOf(datum.id, s.id, 'pull')] = 0
    }
  }
  /** A prop's recorded value at `time` (its starting value before any edit). */
  const at = (prop: string, time: number) => (log.keys(prop)?.length ? valueAt(log.keys(prop), time) : props[prop])
  /** How tall a bar stands (or how high a point sits) at `time`, px. */
  const heightAt = (id: string, s: string, time: number) => at(keyOf(id, s, 'value'), time) * (kind === 'bar' ? at(keyOf(id, s, 'show'), time) : 1) * scale

  /** Every slice's angles from a reader of the chart's props: the circle shared by value × show. */
  const slicesFrom = (read: (prop: string) => number): Map<string, SliceAt> => {
    const s = series[0].id
    const weights = options.data.map((d) => Math.max(0, read(keyOf(d.id, s, 'value'))) * Math.max(0, Math.min(1, read(keyOf(d.id, s, 'show')))))
    const total = weights.reduce((sum, w) => sum + w, 0)
    const out = new Map<string, SliceAt>()
    let angle = -Math.PI / 2
    options.data.forEach((d, i) => {
      const sweep = total > 0 ? (TAU * weights[i]) / total : 0
      const mid = angle + sweep / 2
      const pulled = Math.max(0, Math.min(1, read(keyOf(d.id, s, 'pull')))) * pie.r * PULL_OUT
      out.set(d.id, {
        start: angle,
        sweep,
        mid,
        out: pulled,
        centre: { x: pie.cx + Math.cos(mid) * (bodyAt + pulled), y: pie.cy + Math.sin(mid) * (bodyAt + pulled) },
      })
      angle += sweep
    })
    return out
  }
  const slicesAt = (time: number) => slicesFrom((prop) => at(prop, time))

  const named = (name: string): ChartAnchor => {
    const { kind: anchorKind, rest } = parseAnchor(name)
    const fail = (why?: string) => anchorError('chart', name, CHART_SURFACE, why)
    if (anchorKind === 'box') {
      if (rest) throw fail('box takes no arguments')
      return { kind: 'box' }
    }
    if (anchorKind === 'legend') {
      if (!legendBoxes.has(rest)) throw fail(legend ? `there is no series "${rest}" (series: ${series.map((s) => s.id).join(', ')})` : 'only a chart with several series has a legend')
      return { kind: 'legend', series: rest }
    }
    if (anchorKind === 'bar' || anchorKind === 'point' || anchorKind === 'slice' || anchorKind === 'label' || anchorKind === 'value') {
      if (!rest) throw fail(`write it ${anchorKind}:ID`)
      const colon = rest.indexOf(':')
      const id = colon < 0 ? rest : rest.slice(0, colon)
      const s = colon < 0 ? series[0].id : rest.slice(colon + 1)
      if (!indexOf.has(id)) throw fail(`there is no "${id}" (data: ${[...indexOf.keys()].join(', ')})`)
      if (!seriesIds.has(s)) throw fail(`there is no series "${s}" (series: ${series.map((x) => x.id).join(', ')})`)
      if (anchorKind === 'label' && colon >= 0) throw fail('a label is one per datum: label:ID')
      if ((anchorKind === 'bar' || anchorKind === 'point' || anchorKind === 'slice') && anchorKind !== item) throw fail(`a ${kind} chart has ${item}s, not ${anchorKind}s: ${item}:${id}`)
      return { kind: anchorKind, id, series: s }
    }
    throw fail()
  }
  /** A named place, chart-local, at `time`. */
  const local = (anchor: ChartAnchor, time: number): SurfaceBox => {
    if (anchor.kind === 'box') return surfaceBox(0, 0, options.width, options.height)
    if (anchor.kind === 'legend') return legendBoxes.get(anchor.series)!
    if (round) {
      const slice = slicesAt(time).get(anchor.id)!
      const size = Math.max(fontSize * 1.5, pie.r * 0.42)
      if (anchor.kind === 'slice') return surfaceBox(slice.centre.x - size / 2, slice.centre.y - size / 2, size, size)
      const labelBox = pieLabelBox(slice)
      if (anchor.kind === 'label') return labelBox
      // The value sits on a slice wide enough for it, else under its label outside.
      if (slice.sweep >= 0.3) return surfaceBox(slice.centre.x - fontSize * 1.6, slice.centre.y - fontSize * 0.65, fontSize * 3.2, fontSize * 1.3)
      return surfaceBox(labelBox.left, labelBox.bottom, labelBox.width, fontSize * 1.3)
    }
    const x = anchor.kind === 'label' ? centreX(anchor.id) : barCentreX(anchor.id, anchor.series)
    const top = plot.bottom - heightAt(anchor.id, anchor.series, time)
    if (anchor.kind === 'bar') return surfaceBox(x - barWidth / 2, top, barWidth, plot.bottom - top)
    if (anchor.kind === 'point') return surfaceBox(centreX(anchor.id) - pointRadius, top - pointRadius, pointRadius * 2, pointRadius * 2)
    if (anchor.kind === 'label') return surfaceBox(x - band / 2, plot.bottom + fontSize * 0.4, band, fontSize * 1.4)
    // The value label sits just above the bar or point.
    const above = top - (kind === 'line' ? pointRadius : 0) - fontSize * 0.3
    const width = multi && kind === 'bar' ? slot : band
    return surfaceBox((kind === 'line' ? centreX(anchor.id) : x) - width / 2, above - fontSize * 1.3, width, fontSize * 1.3)
  }
  /** A pie label's box: outside the rim at the slice's middle, reading away from the pie. */
  const pieLabelBox = (slice: SliceAt): SurfaceBox => {
    const reach = pie.r + slice.out + fontSize * 0.9
    const point = { x: pie.cx + Math.cos(slice.mid) * reach, y: pie.cy + Math.sin(slice.mid) * reach }
    const width = fontSize * 4.2
    const cos = Math.cos(slice.mid)
    const left = cos > 0.2 ? point.x : cos < -0.2 ? point.x - width : point.x - width / 2
    return surfaceBox(left, point.y - fontSize * 0.7, width, fontSize * 1.4)
  }
  const scene = (box: SurfaceBox) => surfaceBox(options.x + box.left, options.y + box.top, box.width, box.height)
  const label = (value: number) => `${options.prefix ?? ''}${value.toFixed(options.decimals ?? 0)}${options.suffix ?? ''}`

  // Slices that have come loose, by datum.
  const pieces = new Map<string, ChartSlicePiece>()

  const target: CustomTarget = {
    type: 'custom',
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    props,
    about: {
      kind: `${kind} chart`,
      summary: `A ${kind} chart of ${options.data.length} values (${options.data.map((d) => d.id).join(', ')})${multi ? ` in ${series.length} series (${series.map((s) => s.id).join(', ')})` : ''}${round ? '' : `, scaled to ${max}`}. Its ${item}s and labels are places in the scene (anchor()); its edits record tracks (edit(), tracks()).`,
      props: Object.fromEntries(Object.keys(props).map((name) => [name, describeChartProp(name)])),
      actions: CHART_SURFACE.edits,
    },
    draw(ctx, self) {
      const values = (self.props ?? {}) as Record<string, number>
      const read = (key: string) => Number(values[key] ?? props[key] ?? 0)
      ctx.save()
      ctx.fillStyle = theme.background
      roundRect(ctx, 0, 0, options.width, options.height, 8)
      ctx.fill()
      ctx.font = `${fontSize}px ${theme.font}`
      ctx.textBaseline = 'middle'

      if (options.title) {
        ctx.fillStyle = theme.text
        ctx.textAlign = 'left'
        ctx.font = `600 ${fontSize * 1.2}px ${theme.font}`
        ctx.fillText(options.title, round ? fontSize : plot.left, fontSize * 1.5)
        ctx.font = `${fontSize}px ${theme.font}`
      }
      if (legend) {
        ctx.textAlign = 'left'
        for (const s of series) {
          const box = legendBoxes.get(s.id)!
          ctx.fillStyle = colourOfSeries(s.id)
          roundRect(ctx, box.left, box.top + fontSize * 0.25, fontSize * 0.9, fontSize * 0.9, 2)
          ctx.fill()
          ctx.fillStyle = theme.text
          ctx.fillText(s.label ?? s.id, box.left + fontSize * 1.3, box.top + box.height / 2)
        }
      }

      if (round) {
        drawPie(ctx, read)
        ctx.restore()
        return
      }

      // The scale: four steps of grid, numbered on the left.
      ctx.lineWidth = 1
      ctx.textAlign = 'right'
      for (let step = 0; step <= 4; step++) {
        const y = plot.bottom - (plotHeight * step) / 4
        ctx.strokeStyle = theme.grid
        ctx.beginPath()
        ctx.moveTo(plot.left, y)
        ctx.lineTo(plot.right, y)
        ctx.stroke()
        ctx.fillStyle = theme.text
        ctx.globalAlpha = 0.7
        ctx.fillText(formatTick((max * step) / 4), plot.left - fontSize * 0.5, y)
        ctx.globalAlpha = 1
      }
      // Axis titles: along the left edge, and under the labels.
      if (axisY || axisX) {
        ctx.fillStyle = theme.text
        ctx.textAlign = 'center'
        ctx.globalAlpha = 0.85
        if (axisY) {
          ctx.save()
          ctx.translate(fontSize * 0.9, (plot.top + plot.bottom) / 2)
          ctx.rotate(-Math.PI / 2)
          ctx.fillText(axisY, 0, 0)
          ctx.restore()
        }
        if (axisX) ctx.fillText(axisX, (plot.left + plot.right) / 2, plot.bottom + fontSize * 2.3)
        ctx.globalAlpha = 1
      }

      const heightOf = (id: string, s: string) => read(keyOf(id, s, 'value')) * (kind === 'bar' ? read(keyOf(id, s, 'show')) : 1) * scale
      const colourOf = (id: string, s: string) => mix(colourOfSeries(s), theme.highlight, read(keyOf(id, s, 'highlight')))

      if (kind === 'line') {
        // Each series' line runs through its points in order, each segment drawn out as its end point is shown.
        ctx.lineWidth = Math.max(2, fontSize * 0.2)
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        for (const s of series) {
          ctx.strokeStyle = colourOfSeries(s.id)
          ctx.beginPath()
          options.data.forEach((datum, i) => {
            const point = { x: centreX(datum.id), y: plot.bottom - heightOf(datum.id, s.id) }
            const shown = read(keyOf(datum.id, s.id, 'show'))
            if (i === 0) {
              if (shown > 0) ctx.moveTo(point.x, point.y)
              return
            }
            const before = options.data[i - 1]
            if (read(keyOf(before.id, s.id, 'show')) < 1 || shown <= 0) return
            const from = { x: centreX(before.id), y: plot.bottom - heightOf(before.id, s.id) }
            ctx.lineTo(from.x + (point.x - from.x) * shown, from.y + (point.y - from.y) * shown)
          })
          ctx.stroke()
        }
      }

      ctx.textAlign = 'center'
      for (const datum of options.data) {
        for (const s of series) {
          const x = kind === 'bar' ? barCentreX(datum.id, s.id) : centreX(datum.id)
          const height = heightOf(datum.id, s.id)
          const shown = read(keyOf(datum.id, s.id, 'show'))
          ctx.fillStyle = colourOf(datum.id, s.id)
          if (kind === 'bar') {
            if (height > 0.5) {
              roundTop(ctx, x - barWidth / 2, plot.bottom - height, barWidth, height, Math.min(6, barWidth / 4))
              ctx.fill()
            }
          } else if (shown > 0) {
            ctx.beginPath()
            ctx.arc(x, plot.bottom - height, pointRadius * Math.min(1, shown * 1.5) * (1 + 0.3 * read(keyOf(datum.id, s.id, 'highlight'))), 0, Math.PI * 2)
            ctx.fill()
          }
          if (options.values !== false && shown > 0) {
            ctx.globalAlpha = Math.min(1, shown * 2)
            ctx.font = `600 ${multi ? fontSize * 0.85 : fontSize}px ${theme.font}`
            ctx.fillStyle = mix(theme.text, theme.highlight, read(keyOf(datum.id, s.id, 'highlight')))
            const above = plot.bottom - height - (kind === 'line' ? pointRadius : 0) - fontSize * 0.95
            ctx.fillText(label(read(keyOf(datum.id, s.id, 'value'))), x, above)
            ctx.font = `${fontSize}px ${theme.font}`
            ctx.globalAlpha = 1
          }
        }
        ctx.fillStyle = theme.text
        ctx.fillText(datum.label ?? datum.id, centreX(datum.id), plot.bottom + fontSize * 1.1)
      }

      // The axis, over the feet of the bars.
      ctx.strokeStyle = theme.text
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(plot.left, plot.bottom)
      ctx.lineTo(plot.right, plot.bottom)
      ctx.stroke()
      ctx.restore()
    },
  }

  /** The pie or donut: slices from the top clockwise, pulled out, coloured out, loose pieces where they went. */
  function drawPie(ctx: CanvasRenderingContext2D, read: (prop: string) => number) {
    const s = series[0].id
    const slices = slicesFrom(read)
    options.data.forEach((datum, i) => {
      const slice = slices.get(datum.id)!
      if (slice.sweep <= 1e-4) return
      const piece = pieces.get(datum.id)
      const offset = piece ? { x: read(`piece.${piece.id}.x`), y: read(`piece.${piece.id}.y`) } : { x: 0, y: 0 }
      const turned = piece ? (read(`piece.${piece.id}.rotate`) * Math.PI) / 180 : 0
      const opacity = piece ? read(`piece.${piece.id}.opacity`) : 1
      if (opacity <= 0) return
      ctx.save()
      ctx.globalAlpha = opacity
      // Pulled out along its middle, and carried and turned about its body as a piece.
      const centre = { x: pie.cx + Math.cos(slice.mid) * slice.out, y: pie.cy + Math.sin(slice.mid) * slice.out }
      ctx.translate(slice.centre.x + offset.x, slice.centre.y + offset.y)
      ctx.rotate(turned)
      ctx.translate(-slice.centre.x, -slice.centre.y)
      ctx.beginPath()
      ctx.arc(centre.x, centre.y, pie.r, slice.start, slice.start + slice.sweep)
      if (inner > 0) ctx.arc(centre.x, centre.y, inner, slice.start + slice.sweep, slice.start, true)
      else ctx.lineTo(centre.x, centre.y)
      ctx.closePath()
      ctx.fillStyle = mix(theme.palette[i % theme.palette.length], theme.highlight, read(keyOf(datum.id, s, 'highlight')))
      ctx.fill()
      ctx.strokeStyle = theme.background
      ctx.lineWidth = Math.max(1.5, fontSize * 0.15)
      ctx.stroke()
      // Its value on it, when there is room.
      if (options.values !== false && slice.sweep >= 0.3) {
        ctx.fillStyle = theme.background
        ctx.font = `600 ${fontSize}px ${theme.font}`
        ctx.textAlign = 'center'
        ctx.fillText(label(read(keyOf(datum.id, s, 'value'))), slice.centre.x, slice.centre.y)
        ctx.font = `${fontSize}px ${theme.font}`
      }
      ctx.restore()
      // Its label outside the rim, reading away from the pie, and a small value under it when the slice is too thin.
      const box = pieLabelBox(slice)
      const cos = Math.cos(slice.mid)
      ctx.globalAlpha = opacity
      ctx.fillStyle = theme.text
      ctx.textAlign = cos > 0.2 ? 'left' : cos < -0.2 ? 'right' : 'center'
      const textX = cos > 0.2 ? box.left : cos < -0.2 ? box.right : box.left + box.width / 2
      ctx.fillText(datum.label ?? datum.id, textX, box.top + box.height / 2)
      if (options.values !== false && slice.sweep < 0.3) {
        ctx.globalAlpha = opacity * 0.8
        ctx.fillText(label(read(keyOf(datum.id, s, 'value'))), textX, box.bottom + fontSize * 0.65)
      }
      ctx.globalAlpha = 1
    })
  }

  const self: Chart = {
    kind: 'chart',
    chartKind: kind,
    about: CHART_SURFACE,
    target,
    max,
    box: surfaceBox(options.x, options.y, options.width, options.height),
    anchor(name, time = Infinity) {
      return scene(local(named(name), time))
    },
    piece(name) {
      const anchor = named(name)
      if (anchor.kind !== 'slice') {
        throw new Error(round ? `chart: a piece is a slice, slice:ID, not "${name}"` : `chart: a ${item} is not a piece; slices of a pie or donut are (slice:ID). Change a ${item} with edit('set' | 'show' | 'highlight', …)`)
      }
      const existing = pieces.get(anchor.id)
      if (existing) return existing
      const piece: ChartSlicePiece = { id: pieces.size + 1, datum: anchor.id, home: scene(local(anchor, 0)) }
      pieces.set(anchor.id, piece)
      for (const field of ['x', 'y', 'rotate']) props[`piece.${piece.id}.${field}`] = 0
      props[`piece.${piece.id}.opacity`] = 1
      return piece
    },
    edit(name, anchors, edit) {
      const list = Array.isArray(anchors) ? anchors : [anchors]
      if (list.length === 0) throw new Error(`chart.edit: ${name} takes at least one anchor`)
      if (!(name in CHART_SURFACE.edits)) throw editError('chart', name, CHART_SURFACE)
      if (name === 'pull' && !round) throw new Error(`chart.edit: pull takes slice anchors of a pie or donut; a ${kind} chart has ${item}s`)
      const data = list.map((anchor) => {
        const parsed = named(anchor)
        if (parsed.kind !== item) throw new Error(`chart.edit: ${name} takes ${item} anchors (${item}:ID), not "${anchor}"`)
        return parsed
      })
      for (const { id, series: s } of data) {
        const key = (field: string) => keyOf(id, s, field)
        if (name === 'set') {
          if (typeof edit.value !== 'number' || !Number.isFinite(edit.value)) throw new Error('chart.edit: set needs `value`, a number')
          log.tween(key('value'), at(key('value'), edit.at), edit.value, edit, SET_DURATION)
        } else if (name === 'show') {
          log.tween(key('show'), at(key('show'), edit.at), edit.on === false ? 0 : 1, edit, SHOW_DURATION)
        } else if (name === 'pull') {
          log.tween(key('pull'), at(key('pull'), edit.at), edit.on === false ? 0 : 1, edit, PULL_DURATION)
        } else {
          log.tween(key('highlight'), at(key('highlight'), edit.at), edit.on === false ? 0 : 1, edit, HIGHLIGHT_DURATION)
        }
      }
      return self
    },
    follow(piece, path) {
      motion.follow(piece, path)
      return self
    },
    fling(piece, fling) {
      motion.fling(piece, fling)
      return self
    },
    move(piece, edit) {
      motion.move(piece, edit)
      return self
    },
    ride(tracks, figure, ride) {
      if (kind !== 'bar') return tracks
      // Each bar's top is a floor: as laid out, and how far it has moved since.
      const floors = options.data.flatMap((datum) =>
        series.map((s) => {
          const start = heightAt(datum.id, s.id, 0)
          const windows = [...changingWindows(log.keys(keyOf(datum.id, s.id, 'value'))), ...changingWindows(log.keys(keyOf(datum.id, s.id, 'show')))]
          return { top: options.y + plot.bottom - start, offset: (time: number) => start - heightAt(datum.id, s.id, time), windows }
        })
      )
      return rideFloors(tracks, figure, { ground: ride.ground, every: ride.every ?? SAMPLE_STEP, floors })
    },
    tracks: log.tracks,
  }
  return self
}

/** The smallest of 1, 2, 2.5, 5 × a power of ten at or above `value`. */
export function niceCeiling(value: number): number {
  if (!(value > 0)) return 1
  const power = 10 ** Math.floor(Math.log10(value))
  for (const step of [1, 2, 2.5, 5, 10]) if (step * power >= value - 1e-9) return step * power
  return 10 * power
}

/** A scale number: whole when it is, else to two places, trimmed. */
function formatTick(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)))
}

/** Two `#rrggbb` colours mixed, `t` of the way from `a` to `b`. */
function mix(a: string, b: string, t: number): string {
  if (t <= 0) return a
  if (t >= 1) return b
  const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return t < 0.5 ? a : b
  const [from, to] = [parse(a), parse(b)]
  return `#${from.map((c, i) => Math.round(c + (to[i] - c) * t).toString(16).padStart(2, '0')).join('')}`
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** A bar: rounded at the top, square on the axis. */
function roundTop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, h)
  ctx.beginPath()
  ctx.moveTo(x, y + h)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.lineTo(x + w - radius, y)
  ctx.arcTo(x + w, y, x + w, y + radius, radius)
  ctx.lineTo(x + w, y + h)
  ctx.closePath()
}

function describeChartProp(name: string): PropertyInfo {
  if (name.endsWith('.value')) return { description: 'Its value (the bar’s height, the point’s, or the slice’s share, and its value label)', unit: 'value' }
  if (name.endsWith('.show')) return { description: 'How much of it is shown: a bar grown in from the axis, the line drawn out to the point, a slice opened', unit: '0..1', min: 0, max: 1 }
  if (name.endsWith('.pull')) return { description: 'How far the slice is pulled out from the centre', unit: '0..1', min: 0, max: 1 }
  if (name.startsWith('piece.')) return { description: name.endsWith('.opacity') ? 'The loose slice’s opacity' : name.endsWith('.rotate') ? 'The loose slice’s turn, degrees' : 'The loose slice’s offset from home, px', unit: name.endsWith('.rotate') ? 'degrees' : name.endsWith('.opacity') ? '0..1' : 'px' }
  return { description: 'How much it is coloured out', unit: '0..1', min: 0, max: 1 }
}
