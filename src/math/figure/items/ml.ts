import { forward, seededNetwork } from '../../ml/network'
import { colorAt, blendOver } from '../../ml/colormap'
import { contourLines, sampleGrid } from '../../ml/contours'
import { descentPath, surface } from '../../ml/descent'
import { accuracy, blobs, logLoss, predict, trainLogistic, type LogisticModel } from '../../ml/classify'
import { assign, inertia, kmeansHistory } from '../../ml/kmeans'
import { lerp, type Vec2 } from '../../linear/vec2'
import { layoutTex } from '../../tex/tex-layout'
import type { ClassifierItem, ContoursItem, DescentItem, HeatmapItem, KMeansItem, NetworkItem } from '../figure-spec'
import { texToShapes, trimPolylines, UI_FONT, type Shape } from '../display-list'
import { colorOf, numOf, vecOf, type ItemContext, type Values } from '../item-context'

const memo = <T>(cache: Map<string, T>, key: string, make: () => T): T => {
  let value = cache.get(key)
  if (value === undefined) {
    value = make()
    if (cache.size > 32) cache.clear()
    cache.set(key, value)
  }
  return value
}

/** A value that counts something (epochs, steps, iterations): NaN or ±∞ count as 0. */
const count = (v: number) => (Number.isFinite(v) ? v : 0)

const view = (ctx: Pick<ItemContext, 'plane'>) => ({ x: ctx.plane.x, y: ctx.plane.y, w: ctx.plane.x[1] - ctx.plane.x[0], h: ctx.plane.y[1] - ctx.plane.y[0] })

// ── network ────────────────────────────────────────────────────────────────

/** Every layer's activations, and how far they have flowed. */
export function networkState(item: NetworkItem, values: Values) {
  const network = seededNetwork(item.layers, item.seed ?? item.id)
  const inputs = Array.from({ length: item.layers[0] }, (_, i) => (item.inputs?.[i] === undefined ? 0.5 : numOf(values, item.inputs[i])))
  const activations = forward(network, inputs, item.activation ?? 'sigmoid')
  const flow = item.flow === undefined ? item.layers.length - 1 : Math.min(item.layers.length - 1, Math.max(0, count(numOf(values, item.flow))))
  return { network, activations, flow }
}

export function layoutNetwork(item: NetworkItem, ctx: ItemContext): Shape[] {
  const { plane, theme } = ctx
  const { network, activations, flow } = networkState(item, ctx.values)
  const v = view(ctx)
  const [w, h] = item.size ?? [v.w * 0.75, v.h * 0.7]
  const [cx, cy] = item.at ?? [(v.x[0] + v.x[1]) / 2, (v.y[0] + v.y[1]) / 2]
  const r = (item.radius ?? 16) * plane.scale
  const layers = item.layers
  /** Node j of layer l, in screen px. */
  const node = (l: number, j: number): Vec2 => {
    const x = cx - w / 2 + (layers.length === 1 ? w / 2 : (l / (layers.length - 1)) * w)
    const spacing = Math.min(h / Math.max(1, layers[l] - 1), h * 0.3)
    const y = cy + ((layers[l] - 1) / 2 - j) * spacing
    return plane.toScreen([x, y])
  }
  const positive = colorOf(theme, 'blue', theme.colors.blue)
  const negative = colorOf(theme, 'red', theme.colors.red)
  const shapes: Shape[] = []
  const maxWeight = Math.max(...network.weights.flat(2).map(Math.abs), 1e-9)
  // Edges, faint until the flow reaches them; pulses run along the layer being fed.
  network.weights.forEach((rows, l) => {
    rows.forEach((row, j) => {
      row.forEach((weight, i) => {
        const a = node(l, i)
        const b = node(l + 1, j)
        const lit = Math.min(1, Math.max(0, flow - l))
        const colour = weight >= 0 ? positive : negative
        const width = (0.6 + 3 * (Math.abs(weight) / maxWeight)) * plane.scale
        for (const points of trimPolylines([[a, b]], ctx.draw)) {
          shapes.push({ type: 'line', id: `${item.id}.w.${l}.${j}.${i}`, points, stroke: colour, width, opacity: ctx.opacity * (0.18 + 0.5 * lit) })
        }
        if (lit > 0 && lit < 1) {
          const [px, py] = lerp(a, b, lit)
          shapes.push({ type: 'circle', id: `${item.id}.pulse.${l}.${j}.${i}`, x: px, y: py, r: r * 0.22, fill: colorOf(theme, 'yellow', theme.colors.yellow), opacity: ctx.opacity * (0.5 + 0.5 * Math.abs(activations[l][i] ?? 0)) })
        }
      })
    })
  })
  // Nodes: dark until reached, then filled by their activation.
  layers.forEach((count, l) => {
    const reached = Math.min(1, Math.max(0, flow - l + 1))
    for (let j = 0; j < count; j++) {
      const [x, y] = node(l, j)
      const a = activations[l][j] ?? 0
      const shade = item.activation === 'relu' ? Math.min(1, a / 2) : item.activation === 'tanh' ? (a + 1) / 2 : a
      shapes.push({ type: 'circle', id: `${item.id}.node.${l}.${j}`, x, y, r, fill: theme.background, stroke: colorOf(theme, item.color, theme.ink), width: 2 * plane.scale, opacity: ctx.opacity * Math.min(1, ctx.draw * 1.5) })
      if (reached > 0) shapes.push({ type: 'circle', id: `${item.id}.value.${l}.${j}`, x, y, r: r * 0.86, fill: colorAt('viridis', shade), opacity: ctx.opacity * reached })
    }
  })
  // Labels beside the inputs and outputs.
  const label = (tex: string, at: Vec2, align: 'left' | 'right', id: string) =>
    shapes.push(...texToShapes(layoutTex(tex, { values: ctx.scope, style: 'inline' }), { x: at[0], y: at[1], size: 20 * plane.scale, color: theme.ink, align, opacity: ctx.opacity * ctx.draw, idPrefix: `${item.id}.${id}.` }))
  item.labels?.inputs?.forEach((tex, j) => {
    const [x, y] = node(0, j)
    label(tex, [x - r * 1.5, y], 'right', `in${j}`)
  })
  item.labels?.outputs?.forEach((tex, j) => {
    const [x, y] = node(layers.length - 1, j)
    label(tex, [x + r * 1.5, y], 'left', `out${j}`)
  })
  return shapes
}

// ── heatmap and contours ───────────────────────────────────────────────────

const softmaxRow = (row: number[]) => {
  const max = Math.max(...row)
  const exps = row.map((v) => Math.exp(v - max))
  const sum = exps.reduce((s, v) => s + v, 0)
  return exps.map((v) => v / sum)
}

/** The cells a heatmap shows: given (optionally softmaxed by row) or sampled from its expression. */
export function heatmapCells(item: HeatmapItem, ctx: Pick<ItemContext, 'plane' | 'scope'>): { cells: number[][]; box: [Vec2, Vec2] } {
  if (item.cells) {
    const v = view(ctx)
    const [w, h] = item.size ?? [v.w * 0.7, v.h * 0.7]
    const at = item.at ?? [(v.x[0] + v.x[1]) / 2 - w / 2, (v.y[0] + v.y[1]) / 2 - h / 2]
    return { cells: item.softmax ? item.cells.map(softmaxRow) : item.cells, box: [at, [at[0] + w, at[1] + h]] }
  }
  const [[x0, x1], [y0, y1]] = item.region ?? [ctx.plane.x, ctx.plane.y]
  const n = item.resolution ?? 48
  const f = surface(item.expr!)
  // Rows top first, each cell sampled at its centre.
  const cells = Array.from({ length: n }, (_, row) => Array.from({ length: n }, (_, col) => f(x0 + ((col + 0.5) / n) * (x1 - x0), y1 - ((row + 0.5) / n) * (y1 - y0), ctx.scope)))
  return { cells, box: [[x0, y0], [x1, y1]] }
}

export function layoutHeatmap(item: HeatmapItem, ctx: ItemContext): Shape[] {
  const { plane, theme } = ctx
  const { cells, box } = heatmapCells(item, ctx)
  const flat = cells.flat().filter(Number.isFinite)
  const [low, high] = item.range ?? [Math.min(...flat), Math.max(...flat)]
  const rows = cells.length
  const cols = cells[0]?.length ?? 0
  const [[bx0, by0], [bx1, by1]] = box
  const cw = (bx1 - bx0) / cols
  const ch = (by1 - by0) / rows
  const shapes: Shape[] = []
  const map = item.colormap ?? 'viridis'
  // Cells appear row by row as the item draws on.
  const shownRows = Math.ceil(rows * ctx.draw)
  for (let row = 0; row < shownRows; row++) {
    for (let col = 0; col < cols; col++) {
      const value = cells[row][col]
      if (!Number.isFinite(value)) continue
      const t = high === low ? 0.5 : (value - low) / (high - low)
      const left = bx0 + col * cw
      const top = by1 - row * ch
      // A hair of overlap hides seams between neighbouring cells.
      const pts = ([[left, top - ch], [left + cw * 1.01, top - ch], [left + cw * 1.01, top + ch * 0.01], [left, top + ch * 0.01]] as Vec2[]).map(plane.toScreen)
      // Opaque, pre-mixed with the background: dimmed cells overlap without seams.
      shapes.push({ type: 'line', id: `${item.id}.${row}.${col}`, points: pts, closed: true, fill: blendOver(colorAt(map, t), theme.background, ctx.opacity) })
      if (item.values) {
        const [x, y] = plane.toScreen([left + cw / 2, top - ch / 2])
        const size = Math.min(16 * plane.scale, Math.abs(cw * plane.unitX) * 0.32)
        shapes.push({ type: 'text', id: `${item.id}.v.${row}.${col}`, text: value.toFixed(2).replace(/^0/, ''), x, y: y + size * 0.35, size, font: UI_FONT, color: t > 0.6 ? '#111' : '#eee', align: 'center', opacity: ctx.opacity })
      }
    }
  }
  const size = Math.min(22 * plane.scale, Math.abs(ch * plane.unitY) * 0.6)
  item.rowLabels?.forEach((tex, row) => {
    const [x, y] = plane.toScreen([bx0, by1 - (row + 0.5) * ch])
    shapes.push(...texToShapes(layoutTex(tex, { style: 'inline' }), { x: x - size * 0.5, y, size, color: theme.ink, align: 'right', opacity: ctx.opacity * ctx.draw, idPrefix: `${item.id}.row.${row}.` }))
  })
  item.colLabels?.forEach((tex, col) => {
    const [x, y] = plane.toScreen([bx0 + (col + 0.5) * cw, by1])
    shapes.push(...texToShapes(layoutTex(tex, { style: 'inline' }), { x, y: y - size * 0.8, size, color: theme.ink, opacity: ctx.opacity * ctx.draw, idPrefix: `${item.id}.col.${col}.` }))
  })
  return shapes
}

const CONTOURS = new Map<string, Vec2[][][]>()

export function layoutContours(item: ContoursItem, ctx: ItemContext): Shape[] {
  const region = item.region ?? [ctx.plane.x, ctx.plane.y]
  const n = item.resolution ?? 80
  const numbers = Object.entries(ctx.scope).filter(([k]) => !k.includes('.'))
  const lines = memo(CONTOURS, JSON.stringify([item.expr, item.levels, region, n, numbers]), () => {
    const f = surface(item.expr)
    const grid = sampleGrid((x, y) => f(x, y, ctx.scope), region[0], region[1], n)
    const finite = grid.values.flat().filter(Number.isFinite)
    const low = Math.min(...finite)
    const high = Math.max(...finite)
    const count = typeof item.levels === 'number' ? item.levels : 10
    const levels = Array.isArray(item.levels) ? item.levels : Array.from({ length: count }, (_, k) => low + ((high - low) * (k + 1)) / (count + 1))
    return levels.map((level) => contourLines(grid.values, grid.x0, grid.y0, grid.dx, grid.dy, level))
  })
  const shapes: Shape[] = []
  const map = item.colormap ?? 'viridis'
  lines.forEach((group, k) => {
    const colour = item.color ? colorOf(ctx.theme, item.color, ctx.theme.ink) : colorAt(map, lines.length === 1 ? 0.6 : 0.15 + (0.85 * k) / (lines.length - 1))
    trimPolylines(group.map((line) => line.map(ctx.plane.toScreen)), ctx.draw).forEach((points, j) => {
      shapes.push({ type: 'line', id: `${item.id}.${k}.${j}`, points, stroke: colour, width: (item.width ?? 1.8) * ctx.plane.scale, opacity: ctx.opacity })
    })
  })
  return shapes
}

// ── descent ────────────────────────────────────────────────────────────────

const PATHS = new Map<string, Vec2[]>()

/** The descent path so far: whole steps plus the fraction of the next. */
export function descentState(item: DescentItem, values: Values, scope: Record<string, number>) {
  const start = vecOf(values, item.start)
  const rate = numOf(values, item.rate)
  const momentum = item.momentum === undefined ? 0 : numOf(values, item.momentum)
  const steps = Math.min(500, Math.max(0, count(numOf(values, item.steps))))
  const numbers = Object.entries(scope).filter(([k]) => !k.includes('.'))
  const path = memo(PATHS, JSON.stringify([item.expr, start, rate, momentum, numbers]), () => descentPath(item.expr, start, rate, 500, momentum, scope))
  const whole = Math.min(path.length - 1, Math.floor(steps))
  const fraction = whole < path.length - 1 ? steps - whole : 0
  const here = fraction > 0 ? lerp(path[whole], path[whole + 1], fraction) : path[whole]
  return { path: path.slice(0, whole + 1), here, step: whole, diverged: path.length < 501 && steps > path.length - 1 }
}

export function layoutDescent(item: DescentItem, ctx: ItemContext): Shape[] {
  const { path, here } = descentState(item, ctx.values, ctx.scope)
  const colour = colorOf(ctx.theme, item.color, ctx.theme.colors.red)
  const screen = [...path, here].map(ctx.plane.toScreen)
  const shapes: Shape[] = []
  if (screen.length >= 2) shapes.push({ type: 'line', id: `${item.id}.path`, points: screen, stroke: colour, width: (item.width ?? 2.5) * ctx.plane.scale, opacity: ctx.opacity * 0.9 })
  path.forEach((p, k) => {
    const [x, y] = ctx.plane.toScreen(p)
    shapes.push({ type: 'circle', id: `${item.id}.step.${k}`, x, y, r: 3 * ctx.plane.scale, fill: colour, opacity: ctx.opacity * 0.8 })
  })
  const [x, y] = ctx.plane.toScreen(here)
  shapes.push({ type: 'circle', id: `${item.id}.ball`, x, y, r: 8 * ctx.plane.scale, fill: colorOf(ctx.theme, 'yellow', ctx.theme.colors.yellow), stroke: ctx.theme.background, width: 2 * ctx.plane.scale, opacity: ctx.opacity })
  return shapes
}

// ── classifier ─────────────────────────────────────────────────────────────

const TRAINING = new Map<string, { data: { point: Vec2; label: number }[]; models: LogisticModel[] }>()

export function classifierState(item: ClassifierItem, values: Values) {
  const centres = item.centres ?? [[-1.5, -1], [1.5, 1]]
  const epochs = Math.min(500, Math.max(0, count(numOf(values, item.epochs))))
  const [w0, w1, b0] = item.start ?? [0.9, -1.1, 0.8]
  const { data, models } = memo(TRAINING, JSON.stringify([centres, item.count, item.spread, item.seed ?? item.id, item.rate, w0, w1, b0]), () => {
    const data = blobs(centres, item.count ?? 40, item.spread ?? 0.9, item.seed ?? item.id)
    return { data, models: trainLogistic(data, 500, item.rate ?? 0.5, { w: [w0, w1], b: b0 }) }
  })
  const whole = Math.floor(epochs)
  const t = epochs - whole
  const a = models[whole]
  const b = models[Math.min(models.length - 1, whole + 1)]
  const model: LogisticModel = { w: lerp(a.w, b.w, t), b: a.b + (b.b - a.b) * t }
  return { data, model, epochs }
}

export function layoutClassifier(item: ClassifierItem, ctx: ItemContext): Shape[] {
  const { plane, theme } = ctx
  const { data, model } = classifierState(item, ctx.values)
  const shapes: Shape[] = []
  const classColours = [colorOf(theme, 'blue', theme.colors.blue), colorOf(theme, 'orange', theme.colors.orange)]
  if (item.probability !== false) {
    // P(class 1) as a soft field: blue where it is low, orange where high.
    const n = 32
    const [x0, x1] = plane.x
    const [y0, y1] = plane.y
    const cw = (x1 - x0) / n
    const ch = (y1 - y0) / n
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const p = predict(model, [x0 + (col + 0.5) * cw, y0 + (row + 0.5) * ch])
        const pts = ([[x0 + col * cw, y0 + row * ch], [x0 + (col + 1.02) * cw, y0 + row * ch], [x0 + (col + 1.02) * cw, y0 + (row + 1.02) * ch], [x0 + col * cw, y0 + (row + 1.02) * ch]] as Vec2[]).map(plane.toScreen)
        shapes.push({ type: 'line', id: `${item.id}.p.${row}.${col}`, points: pts, closed: true, fill: blendOver(p >= 0.5 ? classColours[1] : classColours[0], theme.background, ctx.opacity * Math.abs(p - 0.5) * 0.5) })
      }
    }
  }
  data.forEach(({ point, label }, k) => {
    const [x, y] = plane.toScreen(point)
    shapes.push({ type: 'circle', id: `${item.id}.pt.${k}`, x, y, r: 4.5 * plane.scale, fill: classColours[label], stroke: theme.background, width: 1 * plane.scale, opacity: ctx.opacity * ctx.draw })
  })
  // The boundary w·x + b = 0, across the view.
  const [w0, w1] = model.w
  if (Math.hypot(w0, w1) > 1e-6) {
    const [x0, x1] = plane.x
    const [y0, y1] = plane.y
    const line: Vec2[] = Math.abs(w1) > Math.abs(w0)
      ? [[x0, -(w0 * x0 + model.b) / w1], [x1, -(w0 * x1 + model.b) / w1]]
      : [[-(w1 * y0 + model.b) / w0, y0], [-(w1 * y1 + model.b) / w0, y1]]
    shapes.push({ type: 'line', id: `${item.id}.boundary`, points: line.map(plane.toScreen), stroke: theme.ink, width: 3 * plane.scale, opacity: ctx.opacity, dash: [12 * plane.scale, 8 * plane.scale] })
  }
  return shapes
}

// ── k-means ────────────────────────────────────────────────────────────────

const CLUSTERS = new Map<string, { points: Vec2[]; history: Vec2[][] }>()

export function kmeansState(item: KMeansItem, values: Values) {
  const { points, history } = memo(CLUSTERS, JSON.stringify([item.centres, item.count, item.spread, item.seed ?? item.id, item.k]), () => {
    const points = blobs(item.centres, item.count ?? 30, item.spread ?? 0.7, item.seed ?? item.id).map((d) => d.point)
    // Start from the k points nearest the middle of all the data: deterministic, and the
    // centroids visibly travel out to their clusters.
    const k = item.k ?? item.centres.length
    const mean: Vec2 = [points.reduce((s, p) => s + p[0], 0) / points.length, points.reduce((s, p) => s + p[1], 0) / points.length]
    const start = [...points].sort((a, b) => Math.hypot(a[0] - mean[0], a[1] - mean[1]) - Math.hypot(b[0] - mean[0], b[1] - mean[1])).slice(0, k)
    return { points, history: kmeansHistory(points, k, 20, start) }
  })
  const iteration = Math.min(history.length - 1, Math.max(0, count(numOf(values, item.iteration))))
  const whole = Math.floor(iteration)
  const t = iteration - whole
  const centroids = history[whole].map((c, j) => lerp(c, history[Math.min(history.length - 1, whole + 1)][j], t))
  return { points, history, centroids, owners: assign(points, history[whole]), iteration, iterations: history.length - 1 }
}

export function layoutKMeans(item: KMeansItem, ctx: ItemContext): Shape[] {
  const { plane, theme } = ctx
  const { points, centroids, owners, history, iteration } = kmeansState(item, ctx.values)
  const palette = ['blue', 'orange', 'green', 'pink', 'purple', 'teal'].map((name) => colorOf(theme, name, theme.colors.blue))
  const shapes: Shape[] = []
  points.forEach((p, k) => {
    const [x, y] = plane.toScreen(p)
    shapes.push({ type: 'circle', id: `${item.id}.pt.${k}`, x, y, r: 4.5 * plane.scale, fill: palette[owners[k] % palette.length], opacity: ctx.opacity * ctx.draw * 0.85 })
  })
  centroids.forEach((c, j) => {
    // The trail each centroid has taken so far.
    const trail = history.slice(0, Math.floor(iteration) + 1).map((h) => h[j])
    trail.push(c)
    if (trail.length >= 2) shapes.push({ type: 'line', id: `${item.id}.trail.${j}`, points: trail.map(plane.toScreen), stroke: palette[j % palette.length], width: 2 * plane.scale, opacity: ctx.opacity * 0.7, dash: [6 * plane.scale, 5 * plane.scale] })
    const [x, y] = plane.toScreen(c)
    const s = 11 * plane.scale
    shapes.push({ type: 'line', id: `${item.id}.centroid.${j}`, points: [[x, y - s], [x + s, y], [x, y + s], [x - s, y]], closed: true, fill: palette[j % palette.length], stroke: theme.ink, width: 2.5 * plane.scale, opacity: ctx.opacity })
  })
  return shapes
}

/** Derived numbers for the ML items, for TeX readouts. */
export function mlDerived(item: NetworkItem | DescentItem | ClassifierItem | KMeansItem, values: Values, scope: Record<string, number>): Record<string, number> {
  switch (item.kind) {
    case 'network': {
      const { activations } = networkState(item, values)
      return Object.fromEntries(activations[activations.length - 1].map((v, j) => [`${item.id}.out${j}`, v]))
    }
    case 'descent': {
      const { here, step } = descentState(item, values, scope)
      return { [`${item.id}.x`]: here[0], [`${item.id}.y`]: here[1], [`${item.id}.loss`]: surface(item.expr)(here[0], here[1], scope), [`${item.id}.step`]: step }
    }
    case 'classifier': {
      const { data, model, epochs } = classifierState(item, values)
      return { [`${item.id}.accuracy`]: accuracy(model, data), [`${item.id}.loss`]: logLoss(model, data), [`${item.id}.epoch`]: Math.floor(epochs) }
    }
    case 'kmeans': {
      const { points, centroids, iteration, iterations } = kmeansState(item, values)
      return { [`${item.id}.inertia`]: inertia(points, centroids), [`${item.id}.iteration`]: Math.floor(iteration), [`${item.id}.iterations`]: iterations }
    }
  }
}
