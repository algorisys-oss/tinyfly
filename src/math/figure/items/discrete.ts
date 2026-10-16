import { searchEvents, treeLayout, type GraphEdge, type SearchEvent } from '../../discrete/graph-search'
import { parseSetExpression, regionCells } from '../../discrete/set-expression'
import { normalize, type Vec2 } from '../../linear/vec2'
import { layoutTex } from '../../tex/tex-layout'
import type { ClockItem, GraphItem, VennItem } from '../figure-spec'
import { texToShapes, trimPolylines, UI_FONT, type Shape } from '../display-list'
import { colorOf, numOf, type ItemContext, type Values } from '../item-context'
import { ellipsePoints } from './shapes'

/** A graph's edges in object form. */
export function graphEdges(item: GraphItem): GraphEdge[] {
  return item.edges.map((edge) => (Array.isArray(edge) ? { from: edge[0], to: edge[1], ...(edge[2] !== undefined ? { weight: edge[2] } : {}) } : edge))
}

/** Where each node is, in world units: its own `at`, else its place in the tree layout. */
export function graphPositions(item: GraphItem): Map<string, Vec2> {
  const at = new Map<string, Vec2>()
  if (item.tree) {
    const [across, down] = item.tree.spacing ?? [1.2, 1.2]
    const [x0, y0] = item.tree.at ?? [0, 0]
    for (const [id, [x, y]] of treeLayout(item.tree.root, item.nodes.map((n) => n.id), graphEdges(item))) at.set(id, [x0 + x * across, y0 + y * down])
  }
  for (const node of item.nodes) if (node.at) at.set(node.id, node.at)
  return at
}

export interface SearchState {
  events: SearchEvent[]
  /** Events fully done */
  done: number
  /** How far the next event is, 0..1 */
  partial: number
}

/** The search shown at the current `step` (all of it when no step is given). */
export function searchState(item: GraphItem, values: Values): SearchState | undefined {
  if (!item.search) return undefined
  const events = searchEvents(item.search.kind, item.search.start, item.nodes.map((n) => n.id), graphEdges(item), item.directed)
  const step = item.step === undefined ? events.length : Math.min(events.length, Math.max(0, numOf(values, item.step)))
  const done = Math.floor(step)
  return { events, done, partial: done < events.length ? step - done : 0 }
}

const FRONTIER_NAMES = { bfs: 'queue', dfs: 'stack', dijkstra: 'open' } as const

export function layoutGraph(item: GraphItem, ctx: ItemContext): Shape[] {
  const { plane, theme } = ctx
  const where = graphPositions(item)
  const edges = graphEdges(item)
  const state = searchState(item, ctx.values)
  const r = (item.radius ?? 18) * plane.scale
  const ink = colorOf(theme, item.color, theme.ink)
  const grey = colorOf(theme, 'grey', theme.colors.grey)
  const found = colorOf(theme, 'yellow', theme.colors.yellow)
  const waiting = colorOf(theme, 'blue', theme.colors.blue)
  const shapes: Shape[] = []

  // What the search has done: finished nodes, tree edges, the frontier.
  const doneEvents = state ? state.events.slice(0, state.done) : []
  const finished = new Set(doneEvents.map((e) => e.node))
  const treeEdges = new Set(doneEvents.filter((e) => e.parent !== undefined).map((e) => `${e.parent}>${e.node}`))
  const last = doneEvents.at(-1)
  const frontier = new Set(last?.frontier ?? [])
  const next = state && state.partial > 0 ? state.events[state.done] : undefined
  const isTree = (a: string, b: string) => treeEdges.has(`${a}>${b}`) || (!item.directed && treeEdges.has(`${b}>${a}`))

  const screen = (id: string) => plane.toScreen(where.get(id) ?? [0, 0])
  /** The part of an edge between the two node circles. */
  const between = (a: string, b: string): [Vec2, Vec2] => {
    const p = screen(a)
    const q = screen(b)
    const [ux, uy] = normalize([q[0] - p[0], q[1] - p[1]])
    return [[p[0] + ux * r, p[1] + uy * r], [q[0] - ux * r, q[1] - uy * r]]
  }
  const showWeights = item.weights ?? item.search?.kind === 'dijkstra'
  edges.forEach((edge, k) => {
    const [a, b] = between(edge.from, edge.to)
    const tree = isTree(edge.from, edge.to)
    const color = tree ? found : grey
    const width = (tree ? 4 : 2) * plane.scale
    const [line] = trimPolylines([[a, b]], ctx.draw)
    if (!line) return
    shapes.push(item.directed
      ? { type: 'arrow', id: `${item.id}.edge.${k}`, points: line, stroke: color, width, head: 11 * plane.scale, opacity: ctx.opacity }
      : { type: 'line', id: `${item.id}.edge.${k}`, points: line, stroke: color, width, opacity: ctx.opacity })
    if (showWeights && ctx.draw >= 1) {
      const middle: Vec2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
      const [nx, ny] = normalize([-(b[1] - a[1]), b[0] - a[0]])
      const size = 14 * plane.scale
      shapes.push({ type: 'text', id: `${item.id}.weight.${k}`, text: String(edge.weight ?? 1), x: middle[0] + nx * size * 0.9, y: middle[1] + ny * size * 0.9 + size * 0.35, size, font: UI_FONT, color: tree ? found : grey, align: 'center', opacity: ctx.opacity })
    }
  })
  // The edge the search is crossing right now, drawn on toward the node it reaches.
  if (next?.parent !== undefined) {
    const [a, b] = between(next.parent, next.node)
    const [line] = trimPolylines([[a, b]], next.parent ? state!.partial : 1)
    if (line) shapes.push({ type: 'line', id: `${item.id}.reaching`, points: line, stroke: found, width: 4 * plane.scale, opacity: ctx.opacity })
  }

  const distances = last?.distances
  for (const node of item.nodes) {
    const [x, y] = screen(node.id)
    const isDone = finished.has(node.id)
    const isNext = next?.node === node.id && state!.partial >= 0.999
    const waitingHere = !isDone && frontier.has(node.id)
    const fill = isDone || isNext ? found : waitingHere ? waiting : theme.background
    shapes.push({ type: 'circle', id: `${item.id}.node.${node.id}`, x, y, r, fill, stroke: isDone ? found : waitingHere ? waiting : ink, width: 2 * plane.scale, opacity: ctx.opacity * Math.min(1, ctx.draw * 1.5) })
    if (last?.node === node.id) {
      // A ring round the node just finished.
      shapes.push({ type: 'circle', id: `${item.id}.current`, x, y, r: r * 1.35, stroke: found, width: 2 * plane.scale, opacity: ctx.opacity * 0.8 })
    }
    const labelColor = isDone || waitingHere || isNext ? theme.background : ink
    shapes.push(...texToShapes(layoutTex(node.label ?? node.id, { style: 'inline' }), { x, y, size: r * 0.95, color: labelColor, opacity: ctx.opacity * ctx.draw, idPrefix: `${item.id}.label.${node.id}.` }))
    if (distances) {
      const d = distances[node.id]
      const size = 13 * plane.scale
      shapes.push({ type: 'text', id: `${item.id}.distance.${node.id}`, text: d === Infinity ? '∞' : String(Math.round(d * 100) / 100), x, y: y + r + size * 1.15, size, font: UI_FONT, color: waiting, align: 'center', opacity: ctx.opacity })
    }
  }

  // The queue (or stack, or open set) as a row of labels.
  if (item.frontier && item.search && ctx.draw >= 1) {
    const [fx, fy] = item.frontier
    const size = 16 * plane.scale
    const name = FRONTIER_NAMES[item.search.kind]
    shapes.push({ type: 'text', id: `${item.id}.frontier.name`, text: `${name}:`, x: fx, y: fy + size * 0.35, size, font: UI_FONT, color: grey, align: 'left', opacity: ctx.opacity })
    const box = size * 1.9
    ;[...frontier].forEach((id, k) => {
      const left = fx + size * 4 + k * (box + size * 0.4)
      const label = item.nodes.find((n) => n.id === id)?.label ?? id
      shapes.push({ type: 'line', id: `${item.id}.frontier.box.${k}`, points: [[left, fy - box / 2], [left + box, fy - box / 2], [left + box, fy + box / 2], [left, fy + box / 2]], closed: true, fill: waiting, opacity: ctx.opacity * 0.9 })
      shapes.push(...texToShapes(layoutTex(label, { style: 'inline' }), { x: left + box / 2, y: fy, size: size * 1.05, color: theme.background, opacity: ctx.opacity, idPrefix: `${item.id}.frontier.label.${k}.` }))
    })
  }
  return shapes
}

/** Centres of a Venn diagram's circles, around (0, 0), in units of the radius. */
function vennCentres(count: number): Vec2[] {
  if (count === 2) return [[-0.6, 0], [0.6, 0]]
  return [0, 1, 2].map((k): Vec2 => {
    const angle = Math.PI / 2 + (k * 2 * Math.PI) / 3
    return [0.62 * Math.cos(angle), 0.62 * Math.sin(angle) - 0.1]
  })
}

export function layoutVenn(item: VennItem, ctx: ItemContext): Shape[] {
  const { plane, theme } = ctx
  const radius = item.radius ?? 1.5
  const [cx, cy] = item.at ?? [0, 0]
  const centres = vennCentres(item.sets.length).map(([x, y]): Vec2 => [cx + x * radius, cy + y * radius])
  const circles = centres.map(([x, y]) => ellipsePoints(x, y, radius, radius, 96).map(plane.toScreen))
  // The universe: a box with room round the circles.
  const xs = centres.map(([x]) => x)
  const ys = centres.map(([, y]) => y)
  const pad = radius * 0.35
  const box: Vec2[] = ([[Math.min(...xs) - radius - pad, Math.min(...ys) - radius - pad], [Math.max(...xs) + radius + pad, Math.min(...ys) - radius - pad], [Math.max(...xs) + radius + pad, Math.max(...ys) + radius + pad], [Math.min(...xs) - radius - pad, Math.max(...ys) + radius + pad]] as Vec2[]).map(plane.toScreen)
  const shapes: Shape[] = []
  const ids = item.sets.map((set) => set.id)
  if (item.highlight) {
    // Each cell of the region: the universe clipped inside its sets and outside the rest.
    const colour = colorOf(theme, item.highlightColor, theme.colors.yellow)
    regionCells(parseSetExpression(item.highlight), ids).forEach((cell, k) => {
      shapes.push({
        type: 'line', id: `${item.id}.region.${k}`, points: box, closed: true, fill: colour, opacity: ctx.opacity * ctx.draw * 0.55,
        clip: ids.map((id, i) => ({ points: circles[i], outside: !cell.includes(id) })),
      })
    })
  }
  if (item.universe !== false) {
    shapes.push({ type: 'line', id: `${item.id}.universe`, points: box, closed: true, stroke: colorOf(theme, 'grey', theme.colors.grey), width: 2 * plane.scale, opacity: ctx.opacity })
    const [ux, uy] = box[3]
    shapes.push(...texToShapes(layoutTex('U', { style: 'inline' }), { x: ux + 16 * plane.scale, y: uy + 20 * plane.scale, size: 22 * plane.scale, color: colorOf(theme, 'grey', theme.colors.grey), opacity: ctx.opacity, idPrefix: `${item.id}.universe.` }))
  }
  const palette = ['blue', 'red', 'green']
  item.sets.forEach((set, i) => {
    const colour = colorOf(theme, set.color ?? palette[i], theme.colors.blue)
    for (const points of trimPolylines([[...circles[i], circles[i][0]]], ctx.draw)) {
      shapes.push({ type: 'line', id: `${item.id}.set.${set.id}`, points, stroke: colour, width: 3 * plane.scale, opacity: ctx.opacity })
    }
    // The label just outside its circle, away from the middle.
    const [dx, dy] = normalize([centres[i][0] - cx || (i === 0 ? -1 : 1), centres[i][1] - cy])
    const [lx, ly] = plane.toScreen([centres[i][0] + dx * radius * 0.78, centres[i][1] + dy * radius * 0.78 + (item.sets.length === 2 ? radius * 0.85 : 0)])
    shapes.push(...texToShapes(layoutTex(set.label ?? set.id, { style: 'inline' }), { x: lx, y: ly, size: 26 * plane.scale, color: colour, opacity: ctx.opacity * ctx.draw, idPrefix: `${item.id}.label.${set.id}.` }))
  })
  return shapes
}

/** The hour a clock value shows: value mod modulus, in 0..modulus − 1. */
export const clockHour = (value: number, modulus: number) => ((Math.round(value) % modulus) + modulus) % modulus

export function layoutClock(item: ClockItem, ctx: ItemContext): Shape[] {
  const { plane, theme } = ctx
  const n = item.modulus
  const [cx, cy] = item.at ?? [0, 0]
  const radius = item.radius ?? 2
  const value = numOf(ctx.values, item.value)
  const ink = colorOf(theme, item.color, theme.ink)
  const hand = colorOf(theme, 'yellow', theme.colors.yellow)
  /** Hour h's direction: 0 at the top, clockwise. */
  const at = (h: number, scale: number): Vec2 => {
    const angle = Math.PI / 2 - (h / n) * 2 * Math.PI
    return plane.toScreen([cx + Math.cos(angle) * radius * scale, cy + Math.sin(angle) * radius * scale])
  }
  const shapes: Shape[] = []
  for (const points of trimPolylines([ellipsePoints(cx, cy, radius, radius, 120).map(plane.toScreen)], ctx.draw)) {
    shapes.push({ type: 'line', id: `${item.id}.face`, points, stroke: ink, width: 3 * plane.scale, opacity: ctx.opacity })
  }
  const current = clockHour(value, n)
  for (let h = 0; h < n; h++) {
    const [x, y] = at(h, 0.8)
    const size = Math.min(26, 220 / n + 8) * plane.scale
    shapes.push({ type: 'line', id: `${item.id}.tick.${h}`, points: [at(h, 0.95), at(h, 1)], stroke: ink, width: 2 * plane.scale, opacity: ctx.opacity * ctx.draw })
    shapes.push({ type: 'text', id: `${item.id}.hour.${h}`, text: String(h), x, y: y + size * 0.35, size, font: UI_FONT, color: h === current ? hand : ink, align: 'center', opacity: ctx.opacity * ctx.draw })
  }
  if (ctx.draw >= 1) {
    const centre = plane.toScreen([cx, cy])
    shapes.push({ type: 'arrow', id: `${item.id}.hand`, points: [centre, at(value, 0.62)], stroke: hand, width: 5 * plane.scale, head: 16 * plane.scale, opacity: ctx.opacity })
    shapes.push({ type: 'circle', id: `${item.id}.pin`, x: centre[0], y: centre[1], r: 6 * plane.scale, fill: hand, opacity: ctx.opacity })
  }
  return shapes
}
