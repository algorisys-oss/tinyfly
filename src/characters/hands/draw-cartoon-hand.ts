import type { Point } from '../../adapters/canvas/sketch'
import { taperedLine, taperedOutline } from '../look/tapered-line'
import { createPen, unfilledPen, type Look, type Pen, type PencilOptions } from '../look/pen'
import { handJoints, handJointsAt, type FingerJoints, type FingerName, type HandJoints, type HandPose, type HandRigStyle } from './hand-rig'
import type { SkinShading } from '../body/organic-body'
import { shadeSkinOutline } from '../look/skin-shading'

/**
 * Drawing a posed hand: the palm and each finger are parts, drawn far to near
 * through a {@link Pen}, so a hand matches any look (clean, pencil,
 * silhouette) and boils with a pencil figure.
 */

export interface CartoonHandStyle extends HandRigStyle {
  /** Join a native forearm without outlining the wrist's interior edge. */
  connected?: boolean
  shading?: SkinShading
  /** Skin fill (default a warm tan); a glove is just another colour */
  skin?: string
  /** Outline colour (default graphite) */
  ink?: string
  /** Outline width, px (default 3.5% of the size) */
  lineWidth?: number
  /** Look, when no `pen` is given (default clean) */
  look?: Look
  /** Pencil wobble seed (default 1) */
  seed?: number
  pencil?: PencilOptions
  /** Draw with this pen instead of making one: share a character's pen so the hand matches it */
  pen?: Pen
  /** Nails on fingertips that face the viewer (default true) */
  nails?: boolean
  /**
   * Something held, drawn among the hand's parts at `depth` (px toward the
   * viewer, the palm being about 0): a pencil between the thumb and fingers,
   * a cup behind them. Drawn in the same space as the hand.
   */
  prop?: { depth: number; draw: (pen: Pen) => void }
}

const DEFAULT_SKIN = '#f1c9a5'
const DEFAULT_INK = '#2f2f33'

/**
 * Draw a hand in a pose with its wrist at `at`. `time` (ms) picks the
 * pencil's boil frame. Returns the joints as drawn, for attaching props.
 */
export function drawCartoonHand(ctx: CanvasRenderingContext2D, at: Point, pose: HandPose, style: CartoonHandStyle = {}, time = 0): HandJoints {
  const joints = handJointsAt(handJoints(pose, style), at)
  const ink = style.ink ?? DEFAULT_INK
  const lineWidth = style.lineWidth ?? joints.size * 0.035
  let pen =
    style.pen ??
    createPen(ctx, {
      look: style.look ?? 'clean',
      ink,
      lineWidth,
      seed: style.seed ?? 1,
      time,
      pencil: { construction: false, ...style.pencil },
    })
  const skin = style.skin ?? DEFAULT_SKIN
  if (skin === 'none') pen = unfilledPen(ctx, pen)
  const nails = style.nails ?? true

  type Part = { depth: number; draw: () => void }
  const parts: Part[] = [
    {
      depth: joints.palmDepth,
      draw: () => drawPalm(ctx, pen, joints, skin, lineWidth, style),
    },
  ]
  for (const finger of Object.values(joints.fingers) as FingerJoints[]) {
    const depth = finger.depths.reduce((sum, d) => sum + d, 0) / finger.depths.length
    parts.push({
      depth,
      draw: () => drawFinger(ctx, pen, finger, skin, lineWidth, nails),
    })
  }
  if (style.prop) {
    const prop = style.prop
    parts.push({ depth: prop.depth, draw: () => prop.draw(pen) })
  }

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  // Far to near; a stable sort keeps the listed order for ties.
  for (const part of [...parts].sort((a, b) => a.depth - b.depth)) part.draw()
  ctx.restore()
  return joints
}

function drawPalm(ctx: CanvasRenderingContext2D, pen: Pen, joints: HandJoints, skin: string, lineWidth: number, style: CartoonHandStyle) {
  pen.shape(joints.palm, skin === 'none' ? null : skin, style.connected ? 0 : lineWidth)
  if (skin !== 'none' && style.shading && pen.look === 'clean') {
    const center = joints.palm.reduce((sum, point) => ({ x: sum.x + point.x / joints.palm.length, y: sum.y + point.y / joints.palm.length }), { x: 0, y: 0 })
    shadeSkinOutline(ctx, joints.palm, center, style.shading)
  }
  if (style.connected && lineWidth > 0 && (pen.look !== 'silhouette' || skin === 'none')) {
    const { up } = joints.axes
    let run: Point[] = []
    for (let i = 0; i <= joints.palm.length; i++) {
      const point = joints.palm[i % joints.palm.length], next = joints.palm[(i + 1) % joints.palm.length]
      const along = ((point.x + next.x) / 2 - joints.wrist.x) * up.x + ((point.y + next.y) / 2 - joints.wrist.y) * up.y
      if (along < joints.size * 0.08) {
        if (run.length > 1) pen.line(run, lineWidth)
        run = []
      } else {
        if (run.length === 0) run.push(point)
        run.push(next)
      }
    }
    if (run.length > 1) pen.line(run, lineWidth)
  }
  // The back of a curled hand: a bump over each knuckle.
  if (joints.palmFacing < -0.3 && pen.look !== 'silhouette') {
    const { up } = joints.axes
    for (const [name, finger] of Object.entries(joints.fingers) as [FingerName, FingerJoints][]) {
      const curl = joints.curls[name] ?? 0
      if (name === 'thumb' || curl < 0.5) continue
      const k = finger.points[0]
      const r = finger.widths[0] * 0.42
      const centre = { x: k.x - up.x * r * 0.2, y: k.y - up.y * r * 0.2 }
      const facing = Math.atan2(up.y, up.x)
      const arc = Array.from({ length: 7 }, (_, i) => {
        const a = facing - Math.PI / 2 + (Math.PI * i) / 6
        return { x: centre.x + Math.cos(a) * r, y: centre.y + Math.sin(a) * r }
      })
      pen.line(arc, lineWidth * 0.6)
    }
  }
  // The inside of the hand shows a crease across the palm.
  if (joints.palmFacing > 0.45 && pen.look !== 'silhouette') {
    const { up, across } = joints.axes
    const s = joints.size
    const w = joints.wrist
    const at = (x: number, y: number): Point => ({
      x: w.x + (across.x * x + up.x * y) * s,
      y: w.y + (across.y * x + up.y * y) * s,
    })
    const mirror = joints.side === 'left' ? -1 : 1
    pen.line([at(-0.15 * mirror, 0.36), at(-0.04 * mirror, 0.3), at(0.1 * mirror, 0.33)], lineWidth * 0.5)
  }
}

/**
 * A finger: an ink stroke a line width wider than the finger, then the skin
 * stroke on top, along its joints smoothed so bends come out round. Near the
 * knuckle the ink is left out, so the finger joins the palm without a seam.
 */
function drawFinger(ctx: CanvasRenderingContext2D, pen: Pen, finger: FingerJoints, skin: string, lineWidth: number, nails: boolean) {
  const { widths } = finger
  const points = smooth(finger.points, 2)
  const base = finger.points[0]
  const tip = points[points.length - 1]
  const from = widths[0]
  const to = widths[widths.length - 1]

  ctx.save()
  // Everything except a disc round the knuckle (a silhouette has no seams to hide).
  if (pen.look !== 'silhouette' || skin === 'none') {
    ctx.beginPath()
    ctx.rect(base.x - 1e5, base.y - 1e5, 2e5, 2e5)
    const r = from / 2 + lineWidth * 1.6
    ctx.moveTo(base.x + r, base.y)
    ctx.arc(base.x, base.y, r, 0, Math.PI * 2)
    ctx.clip('evenodd')
  }
  if (skin === 'none') {
    const outline = taperedOutline(points, from, to)
    const before = points[points.length - 2]
    const angle = Math.atan2(tip.y - before.y, tip.x - before.x)
    const cap = Array.from({ length: 13 }, (_, i) => {
      const a = angle + Math.PI / 2 - i * Math.PI / 12
      return { x: tip.x + Math.cos(a) * to / 2, y: tip.y + Math.sin(a) * to / 2 }
    })
    pen.shape([...outline.slice(0, points.length), ...cap.slice(1), ...outline.slice(points.length)], null, lineWidth)
  } else pen.limb(points, from + 2 * lineWidth, to + 2 * lineWidth)
  ctx.restore()
  if (skin !== 'none' && pen.look !== 'silhouette') {
    ctx.fillStyle = skin
    taperedLine(ctx, points, from, to)
  }

  if (skin === 'none' || pen.look === 'silhouette' || !nails || finger.nail < 0.25) return
  // The nail sits on the back of the fingertip, foreshortened as it turns away.
  const before = points[points.length - 2]
  const along = unit({ x: tip.x - before.x, y: tip.y - before.y }) ?? {
    x: 0,
    y: -1,
  }
  const centre = {
    x: tip.x - along.x * to * 0.22 + finger.back.x * to * 0.1,
    y: tip.y - along.y * to * 0.22 + finger.back.y * to * 0.1,
  }
  pen.ellipse(centre.x, centre.y, to * 0.24 * Math.max(0.35, finger.nail), to * 0.19, Math.atan2(along.y, along.x), '#f8e3d3', lineWidth * 0.45)
}

/** Round a polyline's corners (Chaikin), keeping its ends where they are. */
function smooth(points: Point[], passes: number): Point[] {
  let out = points
  for (let pass = 0; pass < passes; pass++) {
    if (out.length < 3) return out
    const next: Point[] = [out[0]]
    for (let i = 0; i < out.length - 1; i++) {
      const a = out[i]
      const b = out[i + 1]
      if (i > 0) next.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 })
      if (i < out.length - 2) next.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 })
    }
    next.push(out[out.length - 1])
    out = next
  }
  return out
}

const unit = (v: Point): Point | null => {
  const length = Math.hypot(v.x, v.y)
  return length > 1e-6 ? { x: v.x / length, y: v.y / length } : null
}
