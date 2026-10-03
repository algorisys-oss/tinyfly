import type { CustomTarget } from '../adapters/canvas'
import { partialPath, pointAlong } from '../adapters/canvas/polyline'
import { sketchPen, type Point, type SketchPen, type SketchStyle } from '../adapters/canvas/sketch'
import { HAND_SHAPES, handJoints, type HandJoints } from './hands/hand-rig'
import { drawCartoonHand } from './hands/draw-cartoon-hand'

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
  /** Size, 1 is a pencil 190 px long (default 1) */
  scale?: number
  /** Skin colour */
  skin?: string
  /** Sleeve colour */
  sleeve?: string
  /** Outline colour (default graphite) */
  outline?: string
  /**
   * Length of the forearm shown past the wrist, px before scaling (default 300).
   * The sleeve fades out toward its end, so the arm never needs to reach the
   * edge of the frame.
   */
  arm?: number
  /**
   * 0 the tip is on the paper, 1 lifted: the hand rises off the page and a soft
   * shadow marks the point below it (see {@link handAt}).
   */
  lift?: number
}

/** Hand length (wrist to fingertip) at scale 1, px. */
const HAND_SIZE = 150
/** How far up the tool the fingertips hold it, px at scale 1. */
const GRIP_REACH = { pencil: 44, eraser: 30 }

/**
 * A right hand holding a pencil or an eraser with the tool's tip at `at`: the
 * cartoon hand rig (`drawCartoonHand`) in its `pencilGrip` shape, the tool
 * held between the thumb and fingers, and the forearm leaving toward the
 * lower right with its sleeve fading out. Pass a pen to sketch the tool's
 * outline; the hand shifts with the boil.
 */
export function drawHand(ctx: CanvasRenderingContext2D, at: Point, style: HandStyle = {}, pen?: SketchPen): void {
  const tool = style.tool ?? 'pencil'
  const skin = style.skin ?? '#f1c9a5'
  const outline = style.outline ?? '#2f2f33'
  const scale = style.scale ?? 1
  const lift = Math.min(1, Math.max(0, style.lift ?? 0))
  const toolAngle = ((style.angle ?? -30) * Math.PI) / 180
  const wobble = pen ? pen.nudge(0.6) : { x: 0, y: 0 }
  const size = HAND_SIZE * scale * (1 + 0.05 * lift)

  // Lifted: a shadow stays on the paper under the tip while the hand rises.
  if (lift > 0) {
    ctx.save()
    ctx.fillStyle = outline
    ctx.globalAlpha = 0.15 * lift
    ctx.beginPath()
    ctx.ellipse(at.x, at.y, 9 * scale, 4 * scale, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  const tip = { x: at.x + wobble.x + 6 * lift * scale, y: at.y + wobble.y - 18 * lift * scale }

  // Turn the hand so the tool, which lies from the fingertips back over the
  // web of the thumb, leans at the asked angle.
  const pose = HAND_SHAPES.pencilGrip
  const grip = (joints: HandJoints) => {
    const thumb = joints.fingers.thumb!
    const index = joints.fingers.index!
    const middle = joints.fingers.middle!
    const pinch = mean([thumb.points[3], index.points[3], middle.points[3]])
    const web = mean([thumb.points[1], index.points[0]])
    const depth = (thumb.depths[3] + index.depths[3] + middle.depths[3]) / 3
    return { pinch, direction: Math.atan2(web.y - pinch.y, web.x - pinch.x), depth }
  }
  const upright = handJoints(pose, { size })
  const angle = toolAngle - grip(upright).direction
  const turned = handJoints(pose, { size, angle: (angle * 180) / Math.PI })
  const held = grip(turned)
  const reach = GRIP_REACH[tool] * scale
  const toolTipInHand = { x: held.pinch.x - Math.cos(toolAngle) * reach, y: held.pinch.y - Math.sin(toolAngle) * reach }
  const wrist = { x: tip.x - toolTipInHand.x, y: tip.y - toolTipInHand.y }

  // The forearm, behind the hand, away from the fingers.
  const up = turned.axes.up
  drawForearm(ctx, wrist, { x: -up.x, y: -up.y }, size, style.arm ?? 300 * scale, skin, style.sleeve ?? '#5b7db1', outline)

  drawCartoonHand(ctx, wrist, pose, {
    size,
    angle: (angle * 180) / Math.PI,
    skin,
    ink: outline,
    lineWidth: 3 * scale,
    prop: {
      depth: held.depth,
      draw: () => {
        ctx.save()
        ctx.translate(tip.x, tip.y)
        ctx.scale(scale, scale)
        if (tool === 'eraser') drawEraser(ctx, { x: 0, y: 0 }, { angle: (toolAngle * 180) / Math.PI, outline }, pen)
        else drawPencil(ctx, { x: 0, y: 0 }, { angle: (toolAngle * 180) / Math.PI, length: 190, outline }, pen)
        ctx.restore()
      },
    },
  })
}

const mean = (points: Point[]): Point => ({
  x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
  y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
})

/** A forearm from the wrist along `direction`, its sleeve fading out toward the end. */
function drawForearm(
  ctx: CanvasRenderingContext2D,
  wrist: Point,
  direction: Point,
  handSize: number,
  length: number,
  skin: string,
  sleeve: string,
  outline: string
) {
  const across = { x: -direction.y, y: direction.x }
  const half = handSize * 0.15
  const along = (d: number, side: number, width: number) => ({
    x: wrist.x + direction.x * d + across.x * side * width,
    y: wrist.y + direction.y * d + across.y * side * width,
  })
  const end = along(length, 0, 0)
  const fade = (colour: string) => {
    const gradient = ctx.createLinearGradient(wrist.x, wrist.y, end.x, end.y)
    gradient.addColorStop(0, colour)
    gradient.addColorStop(0.6, colour)
    gradient.addColorStop(1, transparent(colour))
    return gradient
  }
  const cuff = Math.min(handSize * 0.55, length * 0.35)
  ctx.save()
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.lineWidth = 3 * (handSize / HAND_SIZE)
  // Bare wrist, out to the cuff.
  ctx.beginPath()
  ctx.moveTo(along(-handSize * 0.1, -1, half).x, along(-handSize * 0.1, -1, half).y)
  ctx.lineTo(along(cuff + 4, -1, half * 1.1).x, along(cuff + 4, -1, half * 1.1).y)
  ctx.lineTo(along(cuff + 4, 1, half * 1.1).x, along(cuff + 4, 1, half * 1.1).y)
  ctx.lineTo(along(-handSize * 0.1, 1, half).x, along(-handSize * 0.1, 1, half).y)
  ctx.closePath()
  ctx.fillStyle = skin
  ctx.fill()
  ctx.strokeStyle = outline
  ctx.beginPath()
  ctx.moveTo(along(0, -1, half).x, along(0, -1, half).y)
  ctx.lineTo(along(cuff, -1, half * 1.1).x, along(cuff, -1, half * 1.1).y)
  ctx.moveTo(along(0, 1, half).x, along(0, 1, half).y)
  ctx.lineTo(along(cuff, 1, half * 1.1).x, along(cuff, 1, half * 1.1).y)
  ctx.stroke()
  // The sleeve: outlined across its cuff and down its sides, fading with it.
  const shape = [along(cuff, -1, half * 1.3), along(length, -1, half * 1.5), along(length, 1, half * 1.5), along(cuff, 1, half * 1.3)]
  ctx.beginPath()
  shape.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
  ctx.closePath()
  ctx.fillStyle = fade(sleeve)
  ctx.fill()
  ctx.strokeStyle = fade(outline)
  ctx.beginPath()
  ctx.moveTo(shape[1].x, shape[1].y)
  ctx.lineTo(shape[0].x, shape[0].y)
  ctx.lineTo(shape[3].x, shape[3].y)
  ctx.lineTo(shape[2].x, shape[2].y)
  ctx.stroke()
  ctx.restore()
}

/** One stroke the hand draws (or rubs out), timed in ms, for {@link handAt}. */
export interface HandStroke {
  /** When the tip starts along the path, ms */
  start: number
  /** When it reaches the end, ms */
  end: number
  /** The stroke, in scene coordinates */
  path: Point[]
  /** What the hand holds for this stroke (default pencil) */
  tool?: 'pencil' | 'eraser'
}

export interface HandMotionOptions {
  /** Where the hand waits off the page, scene coordinates (default far lower right: 2000, 1400) */
  offstage?: Point
  /** Time to come in from offstage before the first stroke of a run, ms (default 450) */
  enter?: number
  /** Time to leave after the last stroke of a run, ms (default 450) */
  exit?: number
  /** Strokes closer together than this (ms) are one run: the hand moves between them instead of leaving (default 1500) */
  linger?: number
}

/** Where the hand is at a moment: see {@link handAt}. */
export interface HandPosition {
  /** The tool's tip, scene coordinates */
  at: Point
  tool: 'pencil' | 'eraser'
  /** 0 on the paper (drawing), 1 lifted (travelling); pass it to {@link drawHand} as `lift` */
  lift: number
  /** Whether the tip is drawing a stroke right now */
  drawing: boolean
}

/**
 * Where the animator's hand is at `time` (ms), given the strokes it draws.
 * During a stroke the tip follows it. Between strokes of a run it lifts and
 * glides from where one ended to where the next begins, eased in and out; it
 * comes in from `offstage` before a run and goes back after one. Returns null
 * while the hand is off the page. Pure: the same strokes and time always give
 * the same answer, so a scene can be scrubbed.
 */
export function handAt(strokes: HandStroke[], time: number, options: HandMotionOptions = {}): HandPosition | null {
  const offstage = options.offstage ?? { x: 2000, y: 1400 }
  const enter = options.enter ?? 450
  const exit = options.exit ?? 450
  const linger = options.linger ?? 1500
  const sorted = [...strokes].filter((s) => s.path.length > 0).sort((a, b) => a.start - b.start)
  const toolOf = (s: HandStroke) => s.tool ?? 'pencil'
  const ease = (k: number) => {
    const c = Math.min(1, Math.max(0, k))
    return c * c * (3 - 2 * c)
  }
  const lerp = (a: Point, b: Point, k: number) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k })

  const current = sorted.find((s) => time >= s.start && time <= s.end)
  if (current) {
    const span = current.end - current.start
    const progress = span > 0 ? (time - current.start) / span : 1
    return { at: pointAlong(current.path, progress), tool: toolOf(current), lift: 0, drawing: true }
  }

  const previous = [...sorted].reverse().find((s) => s.end < time)
  const next = sorted.find((s) => s.start > time)
  const endOf = (s: HandStroke) => s.path[s.path.length - 1]

  // Between two strokes of a run: lift, glide, put the tip down.
  if (previous && next && next.start - previous.end <= linger) {
    const k = (time - previous.end) / (next.start - previous.end)
    // A tool change happens at the far point of the trip, where it is swapped.
    const tool = k < 0.5 ? toolOf(previous) : toolOf(next)
    return { at: lerp(endOf(previous), next.path[0], ease(k)), tool, lift: Math.sin(Math.PI * k), drawing: false }
  }
  // Coming in for the next run, or leaving after the last one.
  if (next && next.start - time <= enter) {
    const k = 1 - (next.start - time) / enter
    return { at: lerp(offstage, next.path[0], ease(k)), tool: toolOf(next), lift: 1 - ease(k), drawing: false }
  }
  if (previous && time - previous.end <= exit) {
    const k = (time - previous.end) / exit
    return { at: lerp(endOf(previous), offstage, ease(k)), tool: toolOf(previous), lift: ease(k), drawing: false }
  }
  return null
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

/** A colour at zero alpha, for fading it out (hex colours; anything else fades through transparent black). */
function transparent(colour: string): string {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(colour.trim())
  if (!hex) return 'rgba(0, 0, 0, 0)'
  const digits = hex[1].length === 3 ? [...hex[1]].map((d) => d + d).join('') : hex[1]
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16))
  return `rgba(${r}, ${g}, ${b}, 0)`
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
