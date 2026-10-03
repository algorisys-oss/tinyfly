import type { Point } from '../../adapters/canvas/sketch'
import { taperedLine } from '../look/tapered-line'
import { createPen, type Look, type Pen, type PencilOptions } from '../look/pen'
import { handJoints, handJointsAt, type FingerJoints, type FingerName, type HandJoints, type HandPose, type HandRigStyle } from './hand-rig'

/**
 * Drawing a posed hand: the palm and each finger are parts, drawn far to near
 * through a {@link Pen}, so a hand matches any look (clean, pencil,
 * silhouette) and boils with a pencil figure.
 */

export interface CartoonHandStyle extends HandRigStyle {
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
  const pen =
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
  const nails = style.nails ?? true

  type Part = { depth: number; draw: () => void }
  const parts: Part[] = [
    {
      depth: joints.palmDepth,
      draw: () => drawPalm(pen, joints, skin, lineWidth),
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

function drawPalm(pen: Pen, joints: HandJoints, skin: string, lineWidth: number) {
  pen.shape(joints.palm, skin, lineWidth)
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
  if (pen.look !== 'silhouette') {
    ctx.beginPath()
    ctx.rect(base.x - 1e5, base.y - 1e5, 2e5, 2e5)
    const r = from / 2 + lineWidth * 1.6
    ctx.moveTo(base.x + r, base.y)
    ctx.arc(base.x, base.y, r, 0, Math.PI * 2)
    ctx.clip('evenodd')
  }
  pen.limb(points, from + 2 * lineWidth, to + 2 * lineWidth)
  ctx.restore()
  if (pen.look !== 'silhouette') {
    ctx.fillStyle = skin
    taperedLine(ctx, points, from, to)
  }

  if (pen.look === 'silhouette' || !nails || finger.nail < 0.25) return
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
