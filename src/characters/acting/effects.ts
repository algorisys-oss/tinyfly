import type { CustomTarget } from '../../adapters/canvas'
import type { Point } from '../../adapters/canvas/sketch'
import type { FrameInfo } from '../../headless/video-scene'
import { hashSeed } from '../../engine/authoring/random'
import { stickFigureAt, type StickJoints } from '../stick-figure'

/**
 * Cartoon motion effects, drawn on a Canvas 2D context: speed lines behind
 * fast hands, feet and heads (the smear that sells a zip), and the dust puff
 * and impact stars of a landing or a crash.
 *
 * Like trails, smears are not a history of frames: they ask where the figure
 * was at earlier times (`frame.stateAt`), so any frame draws the same way
 * whether it is rendered in order, out of order, or scrubbed to.
 */

export interface SpeedLineStyle {
  color?: string
  /** Stroke width at the head of a line, px (default 2) */
  lineWidth?: number
  /** Parallel lines per streak (default 3) */
  lines?: number
  /** Gap between parallel lines, px (default 5) */
  spacing?: number
  /** Opacity at the head (default 0.7); lines fade toward the tail */
  opacity?: number
}

/**
 * Streaks along a path, oldest point first: parallel lines that follow it,
 * fading and thinning toward the tail.
 */
export function drawSpeedLines(ctx: CanvasRenderingContext2D, path: Point[], style: SpeedLineStyle = {}): void {
  if (path.length < 2) return
  const lines = Math.max(1, Math.round(style.lines ?? 3))
  const spacing = style.spacing ?? 5
  const width = style.lineWidth ?? 2
  const opacity = style.opacity ?? 0.7
  ctx.save()
  ctx.strokeStyle = style.color ?? '#222'
  ctx.lineCap = 'round'
  for (let line = 0; line < lines; line++) {
    const offset = (line - (lines - 1) / 2) * spacing
    // The middle line runs longest, the outer ones start later: a tapered bundle.
    const skip = Math.floor((Math.abs(offset) / Math.max(spacing, 1)) * (path.length / 6))
    for (let i = skip + 1; i < path.length; i++) {
      const a = path[i - 1]
      const b = path[i]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const length = Math.hypot(dx, dy) || 1
      const nx = -dy / length
      const ny = dx / length
      const age = 1 - i / (path.length - 1)
      ctx.globalAlpha = opacity * (1 - age)
      ctx.lineWidth = width * (1 - age * 0.7)
      ctx.beginPath()
      ctx.moveTo(a.x + nx * offset, a.y + ny * offset)
      ctx.lineTo(b.x + nx * offset, b.y + ny * offset)
      ctx.stroke()
    }
  }
  ctx.restore()
}

export interface SmearOptions extends SpeedLineStyle {
  /** How far back the streaks reach, ms (default 120) */
  length?: number
  /** Points along each streak (default 8) */
  samples?: number
  /**
   * Speed (in figure heights per second) below which nothing is drawn; above
   * it, streaks fade in (default 1.2, a brisk arm swing)
   */
  threshold?: number
  /** Which parts streak (default hands, toes and head) */
  parts?: Array<'hands' | 'toes' | 'head' | 'body'>
}

type SmearPart = { name: string; at: (joints: StickJoints) => Point }

const PARTS: Record<NonNullable<SmearOptions['parts']>[number], SmearPart[]> = {
  hands: [
    { name: 'left hand', at: (joints) => joints.hands.left },
    { name: 'right hand', at: (joints) => joints.hands.right },
  ],
  toes: [
    { name: 'left toe', at: (joints) => joints.toes.left },
    { name: 'right toe', at: (joints) => joints.toes.right },
  ],
  head: [{ name: 'head', at: (joints) => joints.head.center }],
  body: [
    { name: 'hip', at: (joints) => joints.hip },
    { name: 'neck', at: (joints) => joints.neck },
  ],
}

/**
 * Speed lines behind a stick figure's fast-moving parts, in scene space:
 * call it from a scene's `draw` (or `background`, to put them behind the
 * figure). `id` is the figure's key in the scene's targets. Needs a frame
 * with `stateAt` (video scenes have it); without one it draws nothing.
 */
export function drawStickSmear(ctx: CanvasRenderingContext2D, target: CustomTarget, frame: Pick<FrameInfo, 'time' | 'state' | 'stateAt'>, id: string, options: SmearOptions = {}): void {
  const stateAt = frame.stateAt
  if (!stateAt) return
  const length = options.length ?? 120
  const samples = Math.max(2, Math.round(options.samples ?? 8))
  const start = Math.max(0, frame.time - length)
  if (frame.time - start < 1) return
  const poses: StickJoints[] = []
  for (let i = 0; i < samples; i++) {
    const time = start + ((frame.time - start) * i) / (samples - 1)
    poses.push(stickFigureAt(target, { time, state: stateAt(time) }, id).joints)
  }
  const height = poses[poses.length - 1].height
  const threshold = (options.threshold ?? 1.2) * height
  const parts = (options.parts ?? ['hands', 'toes', 'head']).flatMap((name) => PARTS[name])
  for (const part of parts) {
    const path = poses.map(part.at)
    let travelled = 0
    for (let i = 1; i < path.length; i++) travelled += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y)
    const speed = travelled / ((frame.time - start) / 1000)
    if (speed <= threshold) continue
    // Fade in over the first half of the threshold above it, so streaks never pop.
    const strength = Math.min(1, (speed - threshold) / (threshold * 0.5))
    drawSpeedLines(ctx, path, { ...options, opacity: (options.opacity ?? 0.7) * strength, spacing: options.spacing ?? height * 0.02 })
  }
}

export interface PuffOptions {
  /** Overall size, px (default 40) */
  size?: number
  color?: string
  /** Varies the puff's shape (default 1) */
  seed?: number
}

/**
 * A dust puff at a point on the ground, `progress` 0 (just kicked up) → 1
 * (gone): a few round clouds that billow outward and fade.
 */
export function drawDustPuff(ctx: CanvasRenderingContext2D, at: Point, progress: number, options: PuffOptions = {}): void {
  if (progress <= 0 || progress >= 1) return
  const size = options.size ?? 40
  const seed = options.seed ?? 1
  // The puff starts already open (clouds side by side, not piled on one
  // point, which reads as a scribble) and billows out from there.
  const grow = 0.45 + 0.55 * (1 - (1 - progress) ** 3)
  ctx.save()
  ctx.strokeStyle = options.color ?? '#555'
  ctx.lineWidth = Math.max(1, size * 0.03)
  // A quick fade in, so the first frame does not pop, then a fade out.
  ctx.globalAlpha = Math.min(1, progress / 0.08) * (1 - progress)
  for (let i = 0; i < 5; i++) {
    const jitter = (hashSeed(`${seed}:puff:${i}`) % 1000) / 1000
    const side = i - 2
    const x = at.x + side * size * 0.3 * grow
    const y = at.y - size * (0.06 + 0.12 * jitter) * grow + Math.abs(side) * size * 0.03
    const r = size * (0.11 + 0.07 * jitter) * grow
    ctx.beginPath()
    ctx.arc(x, y, r, Math.PI * 0.95, Math.PI * 2.05)
    ctx.stroke()
  }
  ctx.restore()
}

/**
 * Impact stars around a point, `progress` 0 → 1: little stars burst out,
 * spin and fade (a bonk on the head, a crash into a wall).
 */
export function drawImpactStars(ctx: CanvasRenderingContext2D, at: Point, progress: number, options: PuffOptions = {}): void {
  if (progress <= 0 || progress >= 1) return
  const size = options.size ?? 40
  const count = 5
  const burst = 1 - (1 - progress) ** 2
  ctx.save()
  ctx.strokeStyle = options.color ?? '#222'
  ctx.lineWidth = Math.max(1, size * 0.035)
  ctx.lineJoin = 'round'
  ctx.globalAlpha = progress < 0.7 ? 1 : (1 - progress) / 0.3
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + ((i - (count - 1) / 2) * Math.PI) / (count + 1)
    const reach = size * (0.3 + 0.7 * burst)
    const cx = at.x + Math.cos(angle) * reach
    const cy = at.y + Math.sin(angle) * reach
    starPath(ctx, cx, cy, size * 0.14, progress * Math.PI + i)
    ctx.stroke()
  }
  ctx.restore()
}

/** A five-pointed star outline. */
function starPath(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, rotation: number): void {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.45
    const a = rotation + (i * Math.PI) / 5 - Math.PI / 2
    const px = x + Math.cos(a) * r
    const py = y + Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}
