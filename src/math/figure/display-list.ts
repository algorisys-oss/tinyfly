import type { Vec2 } from '../linear/vec2'
import type { TexLayout, TexPiece } from '../tex/tex-layout'
import { fontFor } from '../tex/glyph-metrics'

/**
 * What a figure looks like at one moment, as plain shapes in screen pixels
 * (y down). Layout produces it as a pure function of the figure and its
 * values; the canvas and SVG renderers only draw it, so a figure looks the
 * same in a video, a canvas demo and an embedded SVG.
 */
export type Shape =
  | {
      type: 'line'
      id: string
      points: Vec2[]
      closed?: boolean
      stroke?: string
      width?: number
      fill?: string
      opacity?: number
      dash?: number[]
      /**
       * Draw only inside every one of these polygons (or, with `outside`,
       * only outside it): how a Venn diagram shades A ∩ B or A − B.
       */
      clip?: { points: Vec2[]; outside?: boolean }[]
    }
  | {
      type: 'arrow'
      id: string
      points: Vec2[]
      stroke: string
      width: number
      /** Arrowhead length, px */
      head: number
      opacity?: number
    }
  | {
      type: 'circle'
      id: string
      x: number
      y: number
      r: number
      fill?: string
      stroke?: string
      width?: number
      opacity?: number
    }
  | {
      type: 'text'
      id: string
      text: string
      x: number
      y: number
      /** Font size, px */
      size: number
      /** CSS font family */
      font: string
      italic?: boolean
      color: string
      align: 'left' | 'center' | 'right'
      opacity?: number
    }

export interface DisplayList {
  width: number
  height: number
  background?: string
  shapes: Shape[]
}

/** Font for axis numbers and plain labels. */
export const UI_FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif'

const distance = (a: Vec2, b: Vec2) => Math.hypot(b[0] - a[0], b[1] - a[1])

/**
 * The first `fraction` (0..1) of a run of polylines by total length, as
 * though one pen drew them in order: what "draw it on" shows part way.
 */
export function trimPolylines(lines: Vec2[][], fraction: number): Vec2[][] {
  if (fraction >= 1) return lines
  if (fraction <= 0) return []
  const lengths = lines.map((line) => line.slice(1).reduce((sum, p, i) => sum + distance(line[i], p), 0))
  let remaining = lengths.reduce((sum, l) => sum + l, 0) * fraction
  const out: Vec2[][] = []
  for (const [k, line] of lines.entries()) {
    if (remaining <= 0) break
    if (lengths[k] <= remaining) {
      out.push(line)
      remaining -= lengths[k]
      continue
    }
    const part: Vec2[] = [line[0]]
    for (let i = 1; i < line.length; i++) {
      const step = distance(line[i - 1], line[i])
      if (step >= remaining) {
        const t = step === 0 ? 0 : remaining / step
        part.push([line[i - 1][0] + (line[i][0] - line[i - 1][0]) * t, line[i - 1][1] + (line[i][1] - line[i - 1][1]) * t])
        break
      }
      part.push(line[i])
      remaining -= step
    }
    out.push(part)
    remaining = 0
  }
  return out
}

export interface TexPlacement {
  /** Where the layout's anchor point lands, px */
  x: number
  y: number
  /** Font size, px (1 em of the layout) */
  size: number
  color: string
  /** Which point of the layout sits at x, y (default centre/middle) */
  align?: 'left' | 'center' | 'right'
  baseline?: 'baseline' | 'middle'
  opacity?: number
  /** Prefixed to every piece's id, so several equations in one figure stay apart */
  idPrefix: string
  /** Colour names TeX's \\color{…} may use (a theme's palette), mapped to CSS colours */
  palette?: Record<string, string>
}

/** The origin (left edge, baseline) of a layout placed by `place`, in px. */
export function texOrigin(layout: TexLayout, place: Pick<TexPlacement, 'x' | 'y' | 'size' | 'align' | 'baseline'>): Vec2 {
  const align = place.align ?? 'center'
  const left = align === 'left' ? 0 : align === 'right' ? -layout.width : -layout.width / 2
  const top = place.baseline === 'baseline' ? 0 : (layout.height - layout.depth) / 2
  return [place.x + left * place.size, place.y + top * place.size]
}

/** Typeset pieces (in ems, from a layout or a morph) as shapes at a placement. */
export function texPiecesToShapes(
  pieces: (TexPiece & { opacity?: number })[],
  origin: Vec2,
  place: TexPlacement,
): Shape[] {
  const [ox, oy] = origin
  const s = place.size
  const base = place.opacity ?? 1
  return pieces.map((piece): Shape => {
    const color = (piece.color && place.palette?.[piece.color]) ?? piece.color ?? place.color
    const opacity = base * (piece.opacity ?? 1)
    const id = `${place.idPrefix}${piece.id}`
    if (piece.kind === 'glyph') {
      return {
        type: 'text', id, text: piece.text, x: ox + (piece.x + piece.width / 2) * s, y: oy + piece.y * s,
        size: piece.size * s, font: fontFor(piece.text), italic: piece.italic, color, align: 'center', opacity,
      }
    }
    if (piece.kind === 'rule') {
      const x = ox + piece.x * s
      const y = oy + piece.y * s
      const w = piece.width * s
      const h = Math.max(1, piece.height * s)
      return { type: 'line', id, points: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], closed: true, fill: color, opacity }
    }
    return { type: 'line', id, points: piece.points.map(([x, y]) => [ox + x * s, oy + y * s] as Vec2), stroke: color, width: Math.max(1, piece.width * s), opacity }
  })
}

/** A whole layout as shapes. */
export function texToShapes(layout: TexLayout, place: TexPlacement): Shape[] {
  return texPiecesToShapes(layout.pieces, texOrigin(layout, place), place)
}
