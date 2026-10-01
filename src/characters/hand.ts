import type { CustomTarget } from '../adapters/canvas'
import { partialPath, pointAlong } from '../adapters/canvas/polyline'
import { sketchPen, type Point, type SketchPen, type SketchStyle } from '../adapters/canvas/sketch'

/**
 * The animator's hand: a cartoon hand holding a pencil or an eraser, reaching
 * in from off screen, with the tool's tip at a point. Put the point on the end
 * of a stroke being drawn on (or erased) and the hand draws it.
 *
 * Shapes are drawn in the tool's frame: the tip at (0, 0) and the tool lying
 * along +x, rotated by `angle`. Everything is plain Canvas 2D.
 */

export interface PencilStyle {
  /** Lean, degrees (default -30: the pencil up and to the right of its tip) */
  angle?: number
  /** Pencil length, px (default 240) */
  length?: number
  /** Body colour (default yellow) */
  color?: string
  /** Outline colour (default graphite) */
  outline?: string
}

/** A pencil with its tip at `at`. Pass a pen to outline it in sketched strokes. */
export function drawPencil(ctx: CanvasRenderingContext2D, at: Point, style: PencilStyle = {}, pen?: SketchPen): void {
  const length = style.length ?? 240
  const half = 9
  const cone = 28
  const cap = length - 22
  ctx.save()
  ctx.translate(at.x, at.y)
  ctx.rotate(((style.angle ?? -30) * Math.PI) / 180)
  ctx.fillStyle = style.color ?? '#f4c542'
  ctx.fillRect(cone, -half, cap - cone, 2 * half)
  ctx.fillStyle = '#e8b4a0'
  ctx.fillRect(cap, -half, length - cap, 2 * half)
  ctx.fillStyle = '#f1dcbf'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(cone, -half)
  ctx.lineTo(cone, half)
  ctx.closePath()
  ctx.fill()
  // The graphite point.
  ctx.fillStyle = style.outline ?? '#2f2f33'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(cone * 0.35, -half * 0.35)
  ctx.lineTo(cone * 0.35, half * 0.35)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = style.outline ?? '#2f2f33'
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  const shapes: Point[][] = [
    [{ x: 0, y: 0 }, { x: cone, y: -half }, { x: length, y: -half }, { x: length, y: half }, { x: cone, y: half }, { x: 0, y: 0 }],
    [{ x: cone, y: -half }, { x: cone, y: half }],
    [{ x: cap, y: -half }, { x: cap, y: half }],
  ]
  for (const shape of shapes) strokeShape(ctx, shape, pen)
  ctx.restore()
}

export interface EraserStyle {
  /** Eraser length along its body, px (default 90) */
  length?: number
  /** Eraser thickness, px (default 34) */
  thickness?: number
  /** Lean, degrees (default -35: the body up and to the right of the tip) */
  angle?: number
  /** Rubber colour (default pink) */
  color?: string
  /** Outline colour (default graphite) */
  outline?: string
}

/**
 * A rubber eraser whose rubbing end is at `at`. Pass a pen to outline it in
 * sketched strokes; without one the outline is clean.
 */
export function drawEraser(ctx: CanvasRenderingContext2D, at: Point, style: EraserStyle = {}, pen?: SketchPen): void {
  const length = style.length ?? 90
  const thickness = style.thickness ?? 34
  ctx.save()
  ctx.translate(at.x, at.y)
  ctx.rotate(((style.angle ?? -35) * Math.PI) / 180)
  const top = -thickness / 2
  ctx.fillStyle = style.color ?? '#f4a7b9'
  ctx.fillRect(0, top, length, thickness)
  // A paper sleeve over the far half, as on a block eraser.
  ctx.fillStyle = '#e9edf2'
  ctx.fillRect(length * 0.45, top, length * 0.55, thickness)
  ctx.strokeStyle = style.outline ?? '#2f2f33'
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  const corners = [
    { x: 0, y: top },
    { x: length, y: top },
    { x: length, y: -top },
    { x: 0, y: -top },
    { x: 0, y: top },
  ]
  const sleeve = [{ x: length * 0.45, y: top }, { x: length * 0.45, y: -top }]
  if (pen) {
    pen.line(corners)
    pen.line(sleeve)
  } else {
    for (const shape of [corners, sleeve]) {
      ctx.beginPath()
      ctx.moveTo(shape[0].x, shape[0].y)
      for (const point of shape.slice(1)) ctx.lineTo(point.x, point.y)
      ctx.stroke()
    }
  }
  ctx.restore()
}

export interface HandStyle {
  /** What the hand holds (default pencil) */
  tool?: 'pencil' | 'eraser'
  /** Lean of the tool, degrees (default -30) */
  angle?: number
  /** Size, 1 is a pencil 240 px long (default 1) */
  scale?: number
  /** Skin colour */
  skin?: string
  /** Sleeve colour */
  sleeve?: string
  /** Outline colour (default graphite) */
  outline?: string
}

/**
 * A hand holding a pencil or an eraser with the tool's tip at `at`, its arm
 * reaching in from off screen. Pass a pen to sketch it: the tools are outlined
 * in pencil strokes and the hand shifts with the boil.
 */
export function drawHand(ctx: CanvasRenderingContext2D, at: Point, style: HandStyle = {}, pen?: SketchPen): void {
  const tool = style.tool ?? 'pencil'
  const skin = style.skin ?? '#f1c9a5'
  const outline = style.outline ?? '#2f2f33'
  // Fingers and thumb sit on either side of the tool's body; an eraser is
  // shorter than a pencil, so the hand grips it nearer the tip.
  const half = tool === 'eraser' ? 17 : 9
  const grip = tool === 'eraser' ? -40 : 0
  const wobble = pen ? pen.nudge(0.6) : { x: 0, y: 0 }

  ctx.save()
  ctx.translate(at.x + wobble.x, at.y + wobble.y)
  ctx.rotate(((style.angle ?? -30) * Math.PI) / 180)
  ctx.scale(style.scale ?? 1, style.scale ?? 1)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // A rounded limb: an outline stroke with a narrower fill stroke on top.
  const limb = (from: Point, to: Point, width: number, fill: string) => {
    for (const [colour, w] of [
      [outline, width + 6],
      [fill, width],
    ] as const) {
      ctx.strokeStyle = colour
      ctx.lineWidth = w
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
    }
  }

  // The forearm runs off screen, right and a little down from the palm.
  ctx.save()
  ctx.translate(grip, 0)
  const palm = { x: 165, y: -half - 26 }
  const reach = (distance: number) => ({ x: palm.x + distance * 0.8, y: palm.y + distance * 0.6 })
  limb(palm, reach(2000), 64, skin)
  limb(reach(110), reach(2000), 92, style.sleeve ?? '#5b7db1')

  ctx.fillStyle = skin
  ctx.strokeStyle = outline
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.ellipse(palm.x, palm.y, 54, 40, 0.25, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  if (tool === 'eraser') drawEraser(ctx, { x: 0, y: 0 }, { angle: 0, outline }, pen)
  else drawPencil(ctx, { x: 0, y: 0 }, { angle: 0, outline }, pen)

  // Thumb under the tool, index finger along its top, the others curled over it.
  ctx.translate(grip, 0)
  limb({ x: 150, y: half + 8 }, { x: 92, y: half + 12 }, 22, skin)
  limb({ x: 140, y: -half - 18 }, { x: 58, y: -half - 6 }, 20, skin)
  limb({ x: 150, y: -half - 30 }, { x: 112, y: -half + 2 }, 20, skin)
  limb({ x: 172, y: -half - 30 }, { x: 140, y: -half + 4 }, 20, skin)
  ctx.restore()
}

/** A circle as points, starting at the top and running a little past a full turn, to draw on. */
export function circlePath(cx: number, cy: number, r: number, overshoot = 0.08, segments = 32): Point[] {
  const sweep = Math.PI * 2 * (1 + overshoot)
  const points: Point[] = []
  for (let i = 0; i <= segments; i++) {
    const angle = -Math.PI / 2 + (sweep * i) / segments
    points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r })
  }
  return points
}

export interface DrawnPathOptions {
  /** The stroke, in scene coordinates */
  path: Point[]
  /** A smooth curve through the points (true) or straight segments between them (default false) */
  smooth?: boolean
  /** Line colour (default graphite) */
  color?: string
  /** Line width (default 5) */
  lineWidth?: number
  /** Draw in sketched pencil strokes; omit for clean lines */
  sketch?: SketchStyle
  /** Show the hand drawing it (default true); a style changes it */
  hand?: boolean | HandStyle
}

/**
 * A `custom` canvas target that draws a stroke on. Its `draw` prop (0..1) is
 * how much of the path is drawn, so drawing on is a timeline track; while it is
 * between 0 and 1, a hand holds the pencil at the end of the line.
 */
export function drawnPathTarget(options: DrawnPathOptions): CustomTarget {
  const { path } = options
  const xs = path.map((p) => p.x)
  const ys = path.map((p) => p.y)
  const left = Math.min(...xs)
  const top = Math.min(...ys)
  const handStyle = options.hand === false ? undefined : options.hand === true || options.hand === undefined ? {} : options.hand
  return {
    type: 'custom',
    x: left,
    y: top,
    width: Math.max(1, Math.max(...xs) - left),
    height: Math.max(1, Math.max(...ys) - top),
    props: { draw: 0 },
    draw(ctx, target, time) {
      const progress = Math.min(1, Math.max(0, Number(target.props?.draw ?? 0)))
      // Back to scene coordinates, which the path is written in.
      ctx.translate(-left, -top)
      ctx.strokeStyle = options.color ?? '#2f2f33'
      ctx.lineWidth = options.lineWidth ?? 5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      const pen = options.sketch ? sketchPen(ctx, options.sketch, time) : undefined
      if (progress > 0) {
        if (pen) {
          if (options.smooth) pen.curve(path, progress)
          else pen.line(path, progress)
        } else {
          strokeShape(ctx, partialPath(path, progress))
        }
      }
      if (handStyle && progress > 0 && progress < 1) drawHand(ctx, pointAlong(path, progress), handStyle, pen)
    },
  }
}

/** Stroke an open shape: sketched with a pen, or clean. */
function strokeShape(ctx: CanvasRenderingContext2D, points: Point[], pen?: SketchPen): void {
  if (points.length < 2) return
  if (pen) return pen.line(points)
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (const point of points.slice(1)) ctx.lineTo(point.x, point.y)
  ctx.stroke()
}
