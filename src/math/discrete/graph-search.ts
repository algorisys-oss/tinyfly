/**
 * Graph searches as lists of events, so a figure can show any moment of
 * one: which nodes are done, what waits in the queue or stack, and which
 * edges the search used to reach each node. Pure and deterministic:
 * neighbours are taken in the order the nodes are listed, so the same
 * graph always gives the same story.
 */
export interface GraphEdge {
  from: string
  to: string
  /** For shortest paths (default 1) */
  weight?: number
}

export type SearchKind = 'bfs' | 'dfs' | 'dijkstra'
export const SEARCH_KINDS: readonly SearchKind[] = ['bfs', 'dfs', 'dijkstra']

/** One step: a node is reached (and finished) through an edge from `parent`. */
export interface SearchEvent {
  node: string
  /** The node it was reached from (none for the start) */
  parent?: string
  /** What waits to be visited after this step: the queue (bfs), the stack (dfs) or the open set (dijkstra) */
  frontier: string[]
  /** Shortest distances known after this step (dijkstra only; Infinity when unknown) */
  distances?: Record<string, number>
}

/** Neighbours of each node, in the order the nodes are listed. */
export function adjacency(nodes: string[], edges: GraphEdge[], directed: boolean): Map<string, { to: string; weight: number }[]> {
  const order = new Map(nodes.map((id, i) => [id, i]))
  const map = new Map<string, { to: string; weight: number }[]>(nodes.map((id) => [id, []]))
  for (const edge of edges) {
    const weight = edge.weight ?? 1
    map.get(edge.from)?.push({ to: edge.to, weight })
    if (!directed) map.get(edge.to)?.push({ to: edge.from, weight })
  }
  for (const list of map.values()) list.sort((a, b) => (order.get(a.to) ?? 0) - (order.get(b.to) ?? 0))
  return map
}

function bfs(start: string, neighbours: Map<string, { to: string }[]>): SearchEvent[] {
  const events: SearchEvent[] = []
  const seen = new Set([start])
  const queue: { node: string; parent?: string }[] = [{ node: start }]
  while (queue.length > 0) {
    const { node, parent } = queue.shift()!
    for (const { to } of neighbours.get(node) ?? []) {
      if (seen.has(to)) continue
      seen.add(to)
      queue.push({ node: to, parent: node })
    }
    events.push({ node, ...(parent !== undefined ? { parent } : {}), frontier: queue.map((q) => q.node) })
  }
  return events
}

function dfs(start: string, neighbours: Map<string, { to: string }[]>): SearchEvent[] {
  const events: SearchEvent[] = []
  const done = new Set<string>()
  const stack: { node: string; parent?: string }[] = [{ node: start }]
  while (stack.length > 0) {
    const { node, parent } = stack.pop()!
    if (done.has(node)) continue
    done.add(node)
    // Pushed in reverse, so the first-listed neighbour is explored first.
    const next = (neighbours.get(node) ?? []).filter(({ to }) => !done.has(to)).reverse()
    for (const { to } of next) stack.push({ node: to, parent: node })
    events.push({ node, ...(parent !== undefined ? { parent } : {}), frontier: [...new Set(stack.map((s) => s.node).filter((n) => !done.has(n)))].reverse() })
  }
  return events
}

function dijkstra(start: string, nodes: string[], neighbours: Map<string, { to: string; weight: number }[]>): SearchEvent[] {
  const events: SearchEvent[] = []
  const distance: Record<string, number> = Object.fromEntries(nodes.map((id) => [id, Infinity]))
  const parentOf: Record<string, string | undefined> = {}
  const order = new Map(nodes.map((id, i) => [id, i]))
  distance[start] = 0
  const done = new Set<string>()
  for (;;) {
    // The nearest open node; ties go to the one listed first.
    let node: string | undefined
    for (const id of nodes) {
      if (done.has(id) || distance[id] === Infinity) continue
      if (node === undefined || distance[id] < distance[node] || (distance[id] === distance[node] && order.get(id)! < order.get(node)!)) node = id
    }
    if (node === undefined) break
    done.add(node)
    for (const { to, weight } of neighbours.get(node) ?? []) {
      if (done.has(to)) continue
      if (distance[node] + weight < distance[to]) {
        distance[to] = distance[node] + weight
        parentOf[to] = node
      }
    }
    const open = nodes.filter((id) => !done.has(id) && distance[id] < Infinity).sort((a, b) => distance[a] - distance[b])
    events.push({ node, ...(parentOf[node] !== undefined ? { parent: parentOf[node] } : {}), frontier: open, distances: { ...distance } })
  }
  return events
}

const CACHE = new Map<string, SearchEvent[]>()

/** Every step of a search from `start`; nodes it cannot reach never appear. */
export function searchEvents(kind: SearchKind, start: string, nodes: string[], edges: GraphEdge[], directed = false): SearchEvent[] {
  const key = JSON.stringify([kind, start, nodes, edges, directed])
  const cached = CACHE.get(key)
  if (cached) return cached
  if (!nodes.includes(start)) throw new Error(`graph search: no node "${start}"`)
  const neighbours = adjacency(nodes, edges, directed)
  const events = kind === 'bfs' ? bfs(start, neighbours) : kind === 'dfs' ? dfs(start, neighbours) : dijkstra(start, nodes, neighbours)
  if (CACHE.size > 64) CACHE.clear()
  CACHE.set(key, events)
  return events
}

/**
 * Positions for a tree drawn top down from `root`: each level one unit lower,
 * leaves one unit apart, each parent centred over its children. Nodes the
 * root cannot reach are left out.
 */
export function treeLayout(root: string, nodes: string[], edges: GraphEdge[]): Map<string, [number, number]> {
  const children = adjacency(nodes, edges, true)
  // Undirected input still makes a tree: take each node's unvisited neighbours as children.
  const undirected = adjacency(nodes, edges, false)
  const kids = new Map<string, string[]>()
  const seen = new Set([root])
  const queue = [root]
  while (queue.length) {
    const node = queue.shift()!
    const list = (children.get(node)?.length ? children.get(node)! : undirected.get(node) ?? []).map((n) => n.to).filter((n) => !seen.has(n))
    list.forEach((n) => seen.add(n))
    kids.set(node, list)
    queue.push(...list)
  }
  const at = new Map<string, [number, number]>()
  let nextLeaf = 0
  const place = (node: string, depth: number): number => {
    const list = kids.get(node) ?? []
    const x = list.length === 0 ? nextLeaf++ : list.map((child) => place(child, depth + 1)).reduce((sum, v, _i, all) => sum + v / all.length, 0)
    at.set(node, [x, depth === 0 ? 0 : -depth])
    return x
  }
  place(root, 0)
  // Centre the tree on x = 0.
  const xs = [...at.values()].map(([x]) => x)
  const middle = (Math.min(...xs) + Math.max(...xs)) / 2
  for (const [id, [x, y]] of at) at.set(id, [x - middle, y])
  return at
}
