/**
 * Pen-tool geometry. Pure and unit-tested: turns a sequence of pen nodes
 * (anchors with optional bezier handles) into an SVG path `d`, and localises it
 * into an element box so it plugs into the existing PathElement rendering.
 */

export interface PenHandle {
  x: number
  y: number
}

export interface PenNode {
  x: number
  y: number
  /** Incoming control handle (shapes the curve from the previous anchor). */
  hIn?: PenHandle
  /** Outgoing control handle (shapes the curve to the next anchor). */
  hOut?: PenHandle
}

const r = (n: number) => Math.round(n * 100) / 100

/** One segment: cubic bezier if either endpoint has a handle, else a line. */
function segment(a: PenNode, b: PenNode): string {
  if (a.hOut || b.hIn) {
    const c1 = a.hOut ?? { x: a.x, y: a.y }
    const c2 = b.hIn ?? { x: b.x, y: b.y }
    return ` C ${r(c1.x)} ${r(c1.y)} ${r(c2.x)} ${r(c2.y)} ${r(b.x)} ${r(b.y)}`
  }
  return ` L ${r(b.x)} ${r(b.y)}`
}

/** Build an SVG path `d` from pen nodes (in whatever coord space they're given). */
export function buildPenPath(nodes: PenNode[], closed: boolean): string {
  if (nodes.length === 0) return ''
  let d = `M ${r(nodes[0].x)} ${r(nodes[0].y)}`
  for (let i = 1; i < nodes.length; i++) d += segment(nodes[i - 1], nodes[i])
  if (closed && nodes.length >= 2) {
    d += segment(nodes[nodes.length - 1], nodes[0])
    d += ' Z'
  }
  return d
}

export interface PenBounds {
  x: number
  y: number
  width: number
  height: number
}

/** Bounding box of the anchors and their handles (a superset of the visible path). */
export function penNodesBounds(nodes: PenNode[]): PenBounds {
  if (nodes.length === 0) return { x: 0, y: 0, width: 0, height: 0 }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const consider = (x: number, y: number) => {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  for (const n of nodes) {
    consider(n.x, n.y)
    if (n.hIn) consider(n.hIn.x, n.hIn.y)
    if (n.hOut) consider(n.hOut.x, n.hOut.y)
  }
  return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) }
}

export interface LocalizedPenPath extends PenBounds {
  /** Path data in local coordinates (relative to x/y), ready for a PathElement. */
  d: string
}

/**
 * Localise pen nodes into an element box: returns the box (x/y/width/height) and
 * a `d` in local coordinates, matching how PathElement authors its `d`.
 */
export function localizePenPath(nodes: PenNode[], closed: boolean): LocalizedPenPath {
  const b = penNodesBounds(nodes)
  const shift = (h: PenHandle): PenHandle => ({ x: h.x - b.x, y: h.y - b.y })
  const local = nodes.map((n) => ({
    x: n.x - b.x,
    y: n.y - b.y,
    ...(n.hIn && { hIn: shift(n.hIn) }),
    ...(n.hOut && { hOut: shift(n.hOut) }),
  }))
  return { ...b, d: buildPenPath(local, closed) }
}

/** Mirror a handle across its anchor (for symmetric drag handles). */
export function mirrorHandle(anchorX: number, anchorY: number, h: PenHandle): PenHandle {
  return { x: 2 * anchorX - h.x, y: 2 * anchorY - h.y }
}
