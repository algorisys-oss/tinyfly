import type { GraphEdgeSpec, GraphNode, MathFigureSpec, MathItem, MathThemeName } from '../figure/figure-spec'

/**
 * Ready-made discrete maths figures. Each returns a plain MathFigureSpec
 * whose moving part is a number value:
 *
 * - graphSearchFigure / shortestPathFigure / recursionTreeFigure: `step`,
 *   how many search steps are done (fractional: the next node being reached)
 * - clockFigure: `value`, the number the hand points at (mod the modulus)
 * - vennFigure: no values; animate the item's draw, or show one figure per region
 */
export interface DiscreteOptions {
  width?: number
  height?: number
  theme?: MathThemeName
}

const size = (options: DiscreteOptions) => ({ width: options.width ?? 600, height: options.height ?? 600, ...(options.theme ? { theme: options.theme } : {}) })

const readout = (options: DiscreteOptions, tex: string): MathItem => ({
  id: 'readout', kind: 'label', screen: true, align: 'left', size: 22,
  at: [(options.width ?? 600) * 0.05, (options.height ?? 600) * 0.07], tex,
})

/** A small graph of eight nodes (A–H), for searches. */
export const SAMPLE_GRAPH: { nodes: GraphNode[]; edges: [string, string, number][] } = {
  nodes: [
    { id: 'A', at: [-3, 1.5] }, { id: 'B', at: [-1, 2.5] }, { id: 'C', at: [-1, 0.5] }, { id: 'D', at: [1, 2.5] },
    { id: 'E', at: [1, 0.5] }, { id: 'F', at: [-1, -1.5] }, { id: 'G', at: [3, 1.5] }, { id: 'H', at: [1.5, -1.5] },
  ],
  edges: [['A', 'B', 4], ['A', 'C', 2], ['B', 'D', 5], ['C', 'B', 1], ['C', 'E', 8], ['C', 'F', 3], ['D', 'G', 3], ['E', 'G', 2], ['E', 'D', 2], ['F', 'H', 6], ['H', 'E', 1]],
}

/** Breadth-first or depth-first search on a graph, step by step, with its queue or stack. */
export function graphSearchFigure(options: DiscreteOptions & { search?: 'bfs' | 'dfs'; start?: string; nodes?: GraphNode[]; edges?: GraphEdgeSpec[] } = {}): MathFigureSpec {
  const { width, height } = size(options)
  return {
    ...size(options), x: [-4.2, 4.2], y: [-3.6, 3.6], values: { step: 0 },
    items: [
      { id: 'g', kind: 'graph', nodes: options.nodes ?? SAMPLE_GRAPH.nodes, edges: options.edges ?? SAMPLE_GRAPH.edges.map(([a, b]) => [a, b] as [string, string]), search: { kind: options.search ?? 'bfs', start: options.start ?? 'A' }, step: 'step', frontier: [width * 0.06, height * 0.92] },
      readout(options, '\\text{visited } \\val{g.visited:0} \\text{ of } \\val{g.steps:0}'),
    ],
  }
}

/** Dijkstra's shortest paths on a weighted graph: each node settles at its distance from the start. */
export function shortestPathFigure(options: DiscreteOptions & { start?: string; target?: string; nodes?: GraphNode[]; edges?: GraphEdgeSpec[] } = {}): MathFigureSpec {
  const { width, height } = size(options)
  const target = options.target ?? 'G'
  return {
    ...size(options), x: [-4.2, 4.2], y: [-3.6, 3.6], values: { step: 0 },
    items: [
      { id: 'g', kind: 'graph', nodes: options.nodes ?? SAMPLE_GRAPH.nodes, edges: options.edges ?? SAMPLE_GRAPH.edges, search: { kind: 'dijkstra', start: options.start ?? 'A' }, step: 'step', frontier: [width * 0.06, height * 0.92] },
      readout(options, `d(${target}) = \\val{g.d.${target}:0}`),
    ],
  }
}

/** The call tree of a naive recursive Fibonacci, F(n) = F(n − 1) + F(n − 2), visited in call order. */
export function recursionTreeFigure(options: DiscreteOptions & { n?: number } = {}): MathFigureSpec {
  const n = Math.min(6, Math.max(1, options.n ?? 5))
  const nodes: GraphNode[] = []
  const edges: [string, string][] = []
  const call = (k: number): string => {
    const id = `c${nodes.length}`
    nodes.push({ id, label: `F_{${k}}` })
    if (k >= 2) {
      edges.push([id, call(k - 1)])
      edges.push([id, call(k - 2)])
    }
    return id
  }
  call(n)
  const leaves = nodes.filter((node) => !edges.some(([from]) => from === node.id)).length
  const across = Math.max(leaves * 0.75, 4)
  return {
    ...size(options), x: [-across, across], y: [-(n + 0.2) * 1.05, 1.2], values: { step: 0 },
    items: [
      { id: 'calls', kind: 'graph', nodes, edges, directed: true, tree: { root: 'c0', spacing: [1.3, 1.05], at: [0, 0] }, search: { kind: 'dfs', start: 'c0' }, step: 'step', radius: 17 },
      readout(options, `\\text{calls made: } \\val{calls.visited:0} \\text{ of } \\val{calls.steps:0}`),
    ],
  }
}

/** Two or three sets as a Venn diagram with a set expression shaded. */
export function vennFigure(options: DiscreteOptions & { sets?: string[]; highlight?: string; label?: string } = {}): MathFigureSpec {
  const sets = (options.sets ?? ['A', 'B']).map((id) => ({ id }))
  const items: MathItem[] = [{ id: 'venn', kind: 'venn', sets, highlight: options.highlight ?? 'A & B', radius: 1.6, at: [0, -0.3] }]
  if (options.label !== undefined) items.push(readout(options, options.label))
  return { ...size(options), x: [-4, 4], y: [-4, 4], items }
}

/** A clock of `modulus` hours with the hand at `value` (mod modulus). */
export function clockFigure(options: DiscreteOptions & { modulus?: number; value?: number } = {}): MathFigureSpec {
  const modulus = options.modulus ?? 12
  return {
    ...size(options), x: [-3, 3], y: [-3, 3], values: { value: options.value ?? 0 },
    items: [
      { id: 'clock', kind: 'clock', modulus, value: 'value', radius: 2.2, at: [0, -0.2] },
      readout(options, `\\val{value:0} \\equiv \\val{clock.hour:0} \\pmod{${modulus}}`.replace('\\pmod', '\\;(\\text{mod } ').replace(`{${modulus}}`, `${modulus})`)),
    ],
  }
}

