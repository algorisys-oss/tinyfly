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
 * A bar or line chart as a scene object figures act on: they point at a
 * bar, highlight the dip, and stand on a bar as it grows.
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
 * ```
 *
 * The data is declared up front; the scale (`max`) is fixed when it is made
 * (from the data, or given), so a bar set past it grows out of the plot.
 * Its places follow the values: `anchor('bar:q1', time)` is the bar as it
 * stands at `time` (default: after every edit; a surface script aims beats
 * at it as laid out). A figure standing on a bar's top is carried up and
 * down with it (`ride()`). Edits are keys on its props: `bar.ID.value`,
 * `bar.ID.show`, `bar.ID.highlight` (or `point.ID.…` on a line chart).
 */

export type ChartKind = 'bar' | 'line'
export const CHART_KINDS: readonly ChartKind[] = ['bar', 'line']

export type ChartThemeName = 'light' | 'dark'

export interface ChartTheme {
  background: string
  text: string
  /** Axis and grid lines */
  grid: string
  /** Bars, the line and its points */
  color: string
  /** A highlighted bar or point */
  highlight: string
  font: string
}

export const CHART_THEMES: Record<ChartThemeName, ChartTheme> = {
  light: { background: '#ffffff', text: '#3b4252', grid: '#d8dee9', color: '#4c7bd9', highlight: '#e8833a', font: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
  dark: { background: '#1e2230', text: '#cdd6f4', grid: '#3a4055', color: '#89b4fa', highlight: '#fab387', font: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
}

/** One bar or point. */
export interface ChartDatum {
  id: string
  /** Under it, on the axis (default its id) */
  label?: string
  value: number
  /** Start at nothing: a bar flat on the axis, a point the line has not reached; brought in with `show` */
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
  /** The value at the top of the plot (default: a round number above the largest value) */
  max?: number
  title?: string
  theme?: ChartThemeName | Partial<ChartTheme>
  /** Value labels: decimal places (default 0), and text before and after the number */
  decimals?: number
  prefix?: string
  suffix?: string
  /** Show each value above its bar or point (default true) */
  values?: boolean
}

export interface Chart extends Surface {
  readonly kind: 'chart'
  readonly chartKind: ChartKind
  readonly target: CustomTarget
  readonly box: SurfaceBox
  /** The value at the top of the plot */
  readonly max: number
  /** The box at a named place, as it stands at `time`: `box`, `bar:ID` or `point:ID`, `label:ID`, `value:ID` */
  anchor(name: string, time?: number): SurfaceBox
  /** A chart has no pieces: this throws */
  piece(anchor: string): SurfacePiece
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
  create: 'chart({ x, y, width, height, kind: bar | line, data: [{ id, label?, value, hidden? }], max?, title?, theme?: light | dark, decimals?, prefix?, suffix?, values? })',
  anchors: {
    box: 'the whole chart',
    'bar:ID': 'a bar (bar charts), as it stands at the time: stand on its top (it carries a figure as it grows), point at it',
    'point:ID': 'a point on the line (line charts), as it stands at the time',
    'label:ID': 'its label under the axis',
    'value:ID': 'its value label, above it',
  },
  edits: {
    set: 'bar or point anchors; { at, value, duration? }: animate to a new value; its value label counts along',
    show: 'bar or point anchors given `hidden`; { at, duration?, on? }: grow a bar in from the axis, or draw the line out to a point (on: false takes it back)',
    highlight: 'bar or point anchors; { at, duration?, on? }: colour it out (on: false clears)',
  },
}

/** How long edits take by default, ms. */
const SET_DURATION = 600
const SHOW_DURATION = 500
const HIGHLIGHT_DURATION = 200

type ChartAnchor = { kind: 'box' } | { kind: 'bar' | 'point' | 'label' | 'value'; id: string }

export function chart(options: ChartOptions): Chart {
  if (!CHART_KINDS.includes(options.kind)) throw new Error(`chart: ${unknownName('kind', options.kind, CHART_KINDS)}`)
  const themeName = typeof options.theme === 'string' ? options.theme : 'light'
  if (!(themeName in CHART_THEMES)) throw new Error(`chart: ${unknownName('theme', themeName, Object.keys(CHART_THEMES))}`)
  const theme: ChartTheme = typeof options.theme === 'object' ? { ...CHART_THEMES.light, ...options.theme } : CHART_THEMES[themeName as ChartThemeName]
  if (!Array.isArray(options.data) || options.data.length === 0) throw new Error('chart: `data` needs at least one { id, value }')
  const ids = new Set<string>()
  for (const datum of options.data) {
    if (typeof datum?.id !== 'string' || !datum.id || datum.id.includes(':')) throw new Error(`chart: every datum needs an \`id\` without ":" (got ${JSON.stringify(datum?.id)})`)
    if (ids.has(datum.id)) throw new Error(`chart: two data are called "${datum.id}"`)
    if (typeof datum.value !== 'number' || !Number.isFinite(datum.value)) throw new Error(`chart: "${datum.id}" needs a \`value\`, a number`)
    ids.add(datum.id)
  }

  const kind = options.kind
  /** The prop prefix and anchor kind of its data: `bar` or `point`. */
  const item = kind === 'bar' ? 'bar' : 'point'
  const max = options.max ?? niceCeiling(Math.max(...options.data.map((d) => d.value)) * 1.1)
  if (!(max > 0)) throw new Error(`chart: \`max\` must be above 0 (got ${max})`)
  const fontSize = Math.max(10, Math.min(16, options.height / 20))
  // The plot, chart-local: room for the title above, labels below and the scale on the left.
  const plot = {
    left: fontSize * 3.6,
    right: options.width - fontSize,
    top: options.title ? fontSize * 3 : fontSize * 1.6,
    bottom: options.height - fontSize * 2.4,
  }
  const plotHeight = plot.bottom - plot.top
  const band = (plot.right - plot.left) / options.data.length
  const barWidth = band * 0.6
  const pointRadius = Math.max(4, fontSize * 0.35)
  const scale = plotHeight / max
  const indexOf = new Map(options.data.map((d, i) => [d.id, i]))
  const centreX = (id: string) => plot.left + band * (indexOf.get(id)! + 0.5)

  const log = editLog()
  const motion = pieceMotion(log)
  const props: Record<string, number> = {}
  for (const datum of options.data) {
    props[`${item}.${datum.id}.value`] = datum.value
    props[`${item}.${datum.id}.show`] = datum.hidden ? 0 : 1
    props[`${item}.${datum.id}.highlight`] = 0
  }
  /** A prop's recorded value at `time` (its starting value before any edit). */
  const at = (prop: string, time: number) => (log.keys(prop)?.length ? valueAt(log.keys(prop), time) : props[prop])
  /** How tall a bar stands (or how high a point sits) at `time`, px. */
  const heightAt = (id: string, time: number) => at(`${item}.${id}.value`, time) * (kind === 'bar' ? at(`${item}.${id}.show`, time) : 1) * scale

  const named = (name: string): ChartAnchor => {
    const { kind: anchorKind, rest } = parseAnchor(name)
    const fail = (why?: string) => anchorError('chart', name, CHART_SURFACE, why)
    if (anchorKind === 'box') {
      if (rest) throw fail('box takes no arguments')
      return { kind: 'box' }
    }
    if (anchorKind === 'bar' || anchorKind === 'point' || anchorKind === 'label' || anchorKind === 'value') {
      if (!rest) throw fail(`write it ${anchorKind}:ID`)
      if (!indexOf.has(rest)) throw fail(`there is no "${rest}" (data: ${[...indexOf.keys()].join(', ')})`)
      if ((anchorKind === 'bar' || anchorKind === 'point') && anchorKind !== item) throw fail(`a ${kind} chart has ${item}s, not ${anchorKind}s: ${item}:${rest}`)
      return { kind: anchorKind, id: rest }
    }
    throw fail()
  }
  /** A named place, chart-local, at `time`. */
  const local = (anchor: ChartAnchor, time: number): SurfaceBox => {
    if (anchor.kind === 'box') return surfaceBox(0, 0, options.width, options.height)
    const x = centreX(anchor.id)
    const top = plot.bottom - heightAt(anchor.id, time)
    if (anchor.kind === 'bar') return surfaceBox(x - barWidth / 2, top, barWidth, plot.bottom - top)
    if (anchor.kind === 'point') return surfaceBox(x - pointRadius, top - pointRadius, pointRadius * 2, pointRadius * 2)
    if (anchor.kind === 'label') return surfaceBox(x - band / 2, plot.bottom + fontSize * 0.4, band, fontSize * 1.4)
    // The value label sits just above the bar or point.
    const above = top - (kind === 'line' ? pointRadius : 0) - fontSize * 0.3
    return surfaceBox(x - band / 2, above - fontSize * 1.3, band, fontSize * 1.3)
  }
  const scene = (box: SurfaceBox) => surfaceBox(options.x + box.left, options.y + box.top, box.width, box.height)
  const label = (value: number) => `${options.prefix ?? ''}${value.toFixed(options.decimals ?? 0)}${options.suffix ?? ''}`

  const target: CustomTarget = {
    type: 'custom',
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    props,
    about: {
      kind: `${kind} chart`,
      summary: `A ${kind} chart of ${options.data.length} values (${options.data.map((d) => d.id).join(', ')}), scaled to ${max}. Its ${item}s and labels are places in the scene (anchor()); its edits record tracks (edit(), tracks()).`,
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
        ctx.fillText(options.title, plot.left, fontSize * 1.5)
        ctx.font = `${fontSize}px ${theme.font}`
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

      const heightOf = (id: string) => read(`${item}.${id}.value`) * (kind === 'bar' ? read(`${item}.${id}.show`) : 1) * scale
      const colourOf = (id: string) => mix(theme.color, theme.highlight, read(`${item}.${id}.highlight`))

      if (kind === 'line') {
        // The line runs through the points in order, each segment drawn out as its end point is shown.
        ctx.lineWidth = Math.max(2, fontSize * 0.2)
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.strokeStyle = theme.color
        ctx.beginPath()
        options.data.forEach((datum, i) => {
          const point = { x: centreX(datum.id), y: plot.bottom - heightOf(datum.id) }
          const shown = read(`point.${datum.id}.show`)
          if (i === 0) {
            if (shown > 0) ctx.moveTo(point.x, point.y)
            return
          }
          const before = options.data[i - 1]
          if (read(`point.${before.id}.show`) < 1 || shown <= 0) return
          const from = { x: centreX(before.id), y: plot.bottom - heightOf(before.id) }
          ctx.lineTo(from.x + (point.x - from.x) * shown, from.y + (point.y - from.y) * shown)
        })
        ctx.stroke()
      }

      ctx.textAlign = 'center'
      for (const datum of options.data) {
        const x = centreX(datum.id)
        const height = heightOf(datum.id)
        const shown = read(`${item}.${datum.id}.show`)
        ctx.fillStyle = colourOf(datum.id)
        if (kind === 'bar') {
          if (height > 0.5) {
            roundTop(ctx, x - barWidth / 2, plot.bottom - height, barWidth, height, Math.min(6, barWidth / 4))
            ctx.fill()
          }
        } else if (shown > 0) {
          ctx.beginPath()
          ctx.arc(x, plot.bottom - height, pointRadius * Math.min(1, shown * 1.5) * (1 + 0.3 * read(`point.${datum.id}.highlight`)), 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.fillStyle = theme.text
        ctx.fillText(datum.label ?? datum.id, x, plot.bottom + fontSize * 1.1)
        if (options.values !== false && shown > 0) {
          ctx.globalAlpha = Math.min(1, shown * 2)
          ctx.font = `600 ${fontSize}px ${theme.font}`
          ctx.fillStyle = mix(theme.text, theme.highlight, read(`${item}.${datum.id}.highlight`))
          const above = plot.bottom - height - (kind === 'line' ? pointRadius : 0) - fontSize * 0.95
          ctx.fillText(label(read(`${item}.${datum.id}.value`)), x, above)
          ctx.font = `${fontSize}px ${theme.font}`
          ctx.globalAlpha = 1
        }
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
      throw new Error(`chart: a chart has no pieces to come loose ("${name}"); change it with edit('set' | 'show' | 'highlight', …)`)
    },
    edit(name, anchors, edit) {
      const list = Array.isArray(anchors) ? anchors : [anchors]
      if (list.length === 0) throw new Error(`chart.edit: ${name} takes at least one anchor`)
      if (!(name in CHART_SURFACE.edits)) throw editError('chart', name, CHART_SURFACE)
      const data = list.map((anchor) => {
        const parsed = named(anchor)
        if (parsed.kind !== item) throw new Error(`chart.edit: ${name} takes ${item} anchors (${item}:ID), not "${anchor}"`)
        return (parsed as { id: string }).id
      })
      for (const id of data) {
        const key = (field: string) => `${item}.${id}.${field}`
        if (name === 'set') {
          if (typeof edit.value !== 'number' || !Number.isFinite(edit.value)) throw new Error('chart.edit: set needs `value`, a number')
          log.tween(key('value'), at(key('value'), edit.at), edit.value, edit, SET_DURATION)
        } else if (name === 'show') {
          log.tween(key('show'), at(key('show'), edit.at), edit.on === false ? 0 : 1, edit, SHOW_DURATION)
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
      const floors = options.data.map((datum) => {
        const start = heightAt(datum.id, 0)
        const windows = [...changingWindows(log.keys(`bar.${datum.id}.value`)), ...changingWindows(log.keys(`bar.${datum.id}.show`))]
        return { top: options.y + plot.bottom - start, offset: (time: number) => start - heightAt(datum.id, time), windows }
      })
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
  if (name.endsWith('.value')) return { description: 'Its value (the bar’s height or the point’s, and its value label)', unit: 'value' }
  if (name.endsWith('.show')) return { description: 'How much of it is shown: a bar grown in from the axis, the line drawn out to the point', unit: '0..1', min: 0, max: 1 }
  return { description: 'How much it is coloured out', unit: '0..1', min: 0, max: 1 }
}
