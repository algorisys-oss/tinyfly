import { hashSeed } from '../../engine/authoring/random'
import { createPen, type Look, type Pen, type PencilOptions } from '../look/pen'
import type { SolvedFace, SolvedPart, SolvedProp } from './rig'

/**
 * Drawing a solved prop with the characters' pens, so a car in the pencil
 * look boils like the figure beside it. Each part gets its own pen seeded by
 * its id: as a prop turns its parts change drawing order, and a pen seeded by
 * stroke order would make every line jump.
 */

export interface PropDrawOptions {
  look?: Look
  /** Outline colour (default near-black) */
  ink?: string
  /** Outline width, px (default from the prop's size) */
  lineWidth?: number
  /** ms, for the pencil's boil */
  time?: number
  seed?: number
  pencil?: PencilOptions
  /** Draws a rider (a figure in a seat or a doorway): seen only through the prop's see-through parts, and under its `overRider` parts (doors) */
  rider?: (ctx: CanvasRenderingContext2D) => void
  /** Draw its contact shadow on the ground (default true) */
  shadow?: boolean
  /**
   * `solid` (default): shaded shapes with outlines. `stick`: line art to go
   * with stick figures — tubes (legs, necks, tails, frames) drawn as single
   * even strokes, other shapes outlined and filled with the paper colour,
   * dark details (eyes, noses, tyres) kept dark.
   */
  style?: 'solid' | 'stick'
  /** The paper colour a stick prop's shapes are filled with (default cream) */
  paper?: string
  /** The fog's colour, for faces lit by a scene (`light`, `fog` on the solved faces) */
  fog?: string
}

/** Draws in the prop's own space: feet at 0, 0, up is −y. */
export function drawSolvedProp(ctx: CanvasRenderingContext2D, solved: SolvedProp, options: PropDrawOptions = {}): void {
  // One save for the whole prop: the many fills inside set their styles without saving them.
  ctx.save()
  drawSolvedPropInside(ctx, solved, options)
  ctx.restore()
}

function drawSolvedPropInside(ctx: CanvasRenderingContext2D, solved: SolvedProp, options: PropDrawOptions): void {
  const lineWidth = propLineWidth(solved, options)
  if (options.shadow !== false) drawPropShadow(ctx, solved, options)
  for (const part of solved.under) drawPart(ctx, part, lineWidth, options)
  if (options.rider) {
    // A rider is inside the prop: it shows only through the see-through parts (glass, an open doorway).
    // A prop with none (an open cart, a bike) shows the whole rider.
    ctx.save()
    if (solved.openings.length > 0) {
      ctx.beginPath()
      for (const opening of solved.openings) {
        ctx.moveTo(opening[0].x, opening[0].y)
        for (const p of opening.slice(1)) ctx.lineTo(p.x, p.y)
        ctx.closePath()
      }
      ctx.clip('nonzero')
    }
    options.rider(ctx)
    ctx.restore()
  }
  for (const part of solved.over) drawPart(ctx, part, lineWidth, options)
}

/** The outline width a prop is drawn with: weighted by how big it looks, so a cat drawn large and a bus drawn small both read. */
export function propLineWidth(solved: SolvedProp, options: Pick<PropDrawOptions, 'lineWidth'> = {}): number {
  return options.lineWidth ?? Math.max(1.3, solved.sizePx * 0.022)
}

/** Its contact shadow on the ground. */
export function drawPropShadow(ctx: CanvasRenderingContext2D, solved: SolvedProp, options: Pick<PropDrawOptions, 'ink'> = {}): void {
  if (solved.shadow.opacity <= 0 || solved.shadow.points.length < 3) return
  ctx.save()
  ctx.globalAlpha = solved.shadow.opacity
  fillPolygon(ctx, solved.shadow.points, options.ink ?? '#26262b', false)
  ctx.restore()
}

/**
 * One solved part on its own, with the prop's outline width
 * (`propLineWidth`): for drawing a prop's parts one by one among other
 * things, each at its own depth (a 3D scene).
 */
export function drawSolvedPart(ctx: CanvasRenderingContext2D, part: SolvedPart, lineWidth: number, options: PropDrawOptions = {}): void {
  ctx.save()
  drawPart(ctx, part, lineWidth, options)
  ctx.restore()
}

/**
 * Pieces of a prop drawn face by face, nearest last, each face followed by
 * its own outlines and marks: so a wheel tucked under a car's hood, or a
 * seat inside its cabin, is covered where the faces in front cover it. The
 * pieces need face outlines (solved with `slice`); a 3D scene draws a prop's
 * columns this way.
 */
export function drawSolvedFaces(ctx: CanvasRenderingContext2D, parts: SolvedPart[], lineWidth: number, options: PropDrawOptions = {}): void {
  const stick = options.style === 'stick'
  type Item = { depth: number; layer: number; part: SolvedPart; face?: SolvedFace }
  const items: Item[] = parts.flatMap((part): Item[] => {
    if (stick && part.part.solidOnly) return []
    // In line art a tube is one stroke along its middle, drawn at its own depth.
    const layer = part.part.layer ?? 0
    if (stick && part.spine) return [{ depth: part.depth, layer, part }]
    return part.faces.map((face) => ({ depth: face.depth, layer, part, face }))
  })
  // A face lying flat on another part's face, or just outside it (a light or a window on a body, a door on its
  // side, a wheel standing out past it), is drawn right after that face: by depth alone they would tie.
  // Only faces facing about the same way can lie on each other, so they are compared within a bucket per
  // direction (the axis the normal is nearest, and which way along it).
  const buckets = new Map<number, Item[]>()
  for (const item of items) {
    const n = item.face?.normal
    if (!item.face?.center || !n) continue
    const axis = Math.abs(n[0]) >= Math.abs(n[1]) && Math.abs(n[0]) >= Math.abs(n[2]) ? 0 : Math.abs(n[1]) >= Math.abs(n[2]) ? 1 : 2
    const bucket = axis * 2 + (n[axis] < 0 ? 1 : 0)
    buckets.set(bucket, [...(buckets.get(bucket) ?? []), item])
  }
  for (const faced of buckets.values()) {
    for (const item of faced) {
      const { center, normal } = item.face as Required<SolvedFace>
      for (const other of faced) {
        if (other.part.part.id === item.part.part.id) continue
        const under = other.face as Required<SolvedFace>
        const facing = under.normal[0] * normal[0] + under.normal[1] * normal[1] + under.normal[2] * normal[2]
        if (facing <= 0.8) continue
        const out = under.normal[0] * (center[0] - under.center[0]) + under.normal[1] * (center[1] - under.center[1]) + under.normal[2] * (center[2] - under.center[2])
        if (out > -ON_FACE / 5 && out < ON_FACE) {
          item.layer = Math.max(item.layer, other.layer)
          item.depth = Math.max(item.depth, other.depth + 1e-6)
        }
      }
    }
  }
  // Parts that sit into each other are drawn in their layers (wheels under a body, a cabin on it), then far to near.
  items.sort((a, b) => a.layer - b.layer || a.depth - b.depth)
  const pens = new Map<string, Pen>()
  const penOf = (part: SolvedPart) => {
    let pen = pens.get(part.part.id)
    if (!pen) pens.set(part.part.id, (pen = partPen(ctx, part, lineWidth, options)))
    return pen
  }
  ctx.save()
  const alpha = ctx.globalAlpha
  for (const { part, face } of items) {
    ctx.globalAlpha = alpha * part.opacity
    const pen = penOf(part)
    if (!face) pen.line(part.spine!, lineWidth * 1.15)
    else {
      // Lit by a scene, a part is lit first and then glows: a lit window shines in the dark.
      const fill = stick ? stickFill(part, options) : face.light ? sceneFill(part, face, options) : partFill(part)
      if (fill) {
        if (!stick && options.look === 'silhouette') pen.shape(face.points, fill, 0)
        // Pieces of one face meet along the cuts: a wider hairline of the face's own colour closes the seam.
        else fillPolygon(ctx, face.points, stick || face.light ? fill : shade(fill, face.tone), true, part.cut ? 1.6 : 0.8)
      }
      const weight = (part.part.outline ?? 1) * lineWidth
      if (weight > 0) for (const edge of face.edges ?? []) if (edge.length > 1) pen.line(edge, weight)
      for (const mark of face.marks ?? []) pen.line(mark, lineWidth * 0.7)
    }
  }
  ctx.restore()
}

/** How far outside a face's plane another face can be and count as lying on it, metres (facing within about 35° of it, which rules out a face it only touches at an edge). */
const ON_FACE = 0.05

/** A part's pen: seeded by its id, so its lines hold still as parts change drawing order. */
function partPen(ctx: CanvasRenderingContext2D, solved: SolvedPart, lineWidth: number, options: PropDrawOptions): Pen {
  return createPen(ctx, {
    look: options.look ?? 'clean',
    ink: solved.part.ink ?? options.ink ?? '#26262b',
    lineWidth,
    seed: hashSeed(`${options.seed ?? 0}:${solved.part.id}`),
    time: options.time ?? 0,
    pencil: { construction: false, rubbedOut: 0, ...options.pencil },
  })
}

/** Its fill, lit by its glow. */
function partFill(solved: SolvedPart): string | undefined {
  const { part } = solved
  return part.glow && solved.glow > 0 && part.fill ? mixColors(part.fill, part.glow.color, solved.glow) : part.fill
}

/** Its fill lit by a scene's light and fog, with its glow over the top. */
function sceneFill(solved: SolvedPart, face: SolvedFace, options: PropDrawOptions): string | undefined {
  const { part } = solved
  if (!part.fill) return undefined
  const shaded = lit(part.fill, face.light!, face.fog ?? 0, options.fog)
  return part.glow && solved.glow > 0 ? mixColors(shaded, part.glow.color, solved.glow) : shaded
}

/** Its fill in line art: the paper, or its own colour when that is dark (eyes, tyres) or lit. */
function stickFill(solved: SolvedPart, options: PropDrawOptions): string {
  const own = partFill(solved)
  return own && (isDark(own) || solved.glow > 0) ? own : options.paper ?? '#fbf8ef'
}

function drawPart(ctx: CanvasRenderingContext2D, solved: SolvedPart, lineWidth: number, options: PropDrawOptions): void {
  if (solved.opacity < 1) {
    ctx.save()
    ctx.globalAlpha *= solved.opacity
    drawPartOpaque(ctx, solved, lineWidth, options)
    ctx.restore()
  } else drawPartOpaque(ctx, solved, lineWidth, options)
}

function drawPartOpaque(ctx: CanvasRenderingContext2D, solved: SolvedPart, lineWidth: number, options: PropDrawOptions): void {
  if (options.style === 'stick') return drawPartStick(ctx, solved, lineWidth, options)
  const { part } = solved
  const pen = partPen(ctx, solved, lineWidth, options)
  const fill = partFill(solved)
  // Faces are filled opaque: a prop is solid, so what is behind must not show through (the pencil pen's
  // fills are translucent, which suits a figure's limbs but not a car's body). The look is in the outlines.
  // Each face is filled with a hairline of its own colour round it, so a round shape made of many small faces
  // shows no seams between them. A silhouette fills everything with the ink, through the pen.
  const silhouette = options.look === 'silhouette'
  for (const face of solved.faces) {
    if (!fill) continue
    if (silhouette) pen.shape(face.points, fill, 0)
    else fillPolygon(ctx, face.points, shade(fill, face.tone))
  }
  const weight = (part.outline ?? 1) * lineWidth
  if (weight > 0) for (const edge of solved.edges) if (edge.length > 1) pen.line(edge, weight)
  for (const mark of solved.marks) pen.line(mark, lineWidth * 0.7)
}

/** Line art: a tube is one stroke along its middle; a shape is its outline over paper (or its own colour when dark). */
function drawPartStick(ctx: CanvasRenderingContext2D, solved: SolvedPart, lineWidth: number, options: PropDrawOptions): void {
  const { part } = solved
  if (part.solidOnly) return
  const pen = partPen(ctx, solved, lineWidth, options)
  if (solved.spine) {
    pen.line(solved.spine, lineWidth * 1.15)
    return
  }
  const fill = stickFill(solved, options)
  for (const face of solved.faces) fillPolygon(ctx, face.points, fill)
  const weight = (part.outline ?? 1) * lineWidth
  if (weight > 0) for (const edge of solved.edges) if (edge.length > 1) pen.line(edge, weight)
  for (const mark of solved.marks) pen.line(mark, lineWidth * 0.7)
}

/** A colour dark enough to keep in line art (eyes, noses, tyres). */
function isDark(color: string): boolean {
  const rgb = parseHex(color)
  return rgb ? (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255 < 0.3 : false
}

/** Fills a polygon (setting the fill and stroke style it uses; it draws often, so it saves no state). */
function fillPolygon(ctx: CanvasRenderingContext2D, points: Array<{ x: number; y: number }>, color: string, seam = true, seamWidth = 0.8) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
  ctx.closePath()
  ctx.fill()
  if (seam) {
    ctx.strokeStyle = color
    ctx.lineWidth = seamWidth
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
}

/** `#rgb` / `#rrggbb` as numbers, or undefined for other colours (which are drawn unshaded). */
function parseHex(color: string): [number, number, number] | undefined {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (!match) return undefined
  const hex = match[1].length === 3 ? match[1].replace(/./g, (c) => c + c) : match[1]
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}

const toHex = (rgb: number[]) => `#${rgb.map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('')}`

/** A colour lit (tone above 1) or shaded (below 1). */
export function shade(color: string, tone: number): string {
  const rgb = parseHex(color)
  if (!rgb) return color
  return toHex(tone >= 1 ? rgb.map((c) => c + (255 - c) * (tone - 1) * 2) : rgb.map((c) => c * tone))
}

/** A colour under a scene's light (RGB, 1 is full light), then into its fog. */
export function lit(color: string, light: [number, number, number], fog: number, fogColor?: string): string {
  const rgb = parseHex(color)
  if (!rgb) return color
  let out = rgb.map((c, i) => c * light[i])
  const into = fogColor ? parseHex(fogColor) : undefined
  if (into && fog > 0) out = out.map((c, i) => c + (into[i] - c) * fog)
  return toHex(out)
}

/** `a` blended toward `b` by `t` (hex colours; otherwise `b` once past half). */
export function mixColors(a: string, b: string, t: number): string {
  const from = parseHex(a)
  const to = parseHex(b)
  if (!from || !to) return t < 0.5 ? a : b
  return toHex(from.map((c, i) => c + (to[i] - c) * t))
}
