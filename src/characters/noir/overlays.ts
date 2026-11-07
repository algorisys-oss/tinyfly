import type { Point } from '../../adapters/canvas/sketch'
import { clamp01, fadeWindow, fontOf, NOIR_FONT, popIn, progressIn, roundedRect, smooth, withAlpha, wrapText } from './noir-utils'

/**
 * Detective overlays for canvas scenes: the red magnifier that marks a clue,
 * an evidence folder, a wall clock and a time chip, a freeze-frame name card
 * for a suspect, a first-person narration box and a comic speech bubble.
 *
 * Every function takes the time (ms) and plain options and draws the same
 * thing for the same input. Text is always the caller's (any language, any
 * font family); nothing is measured except with the context's own font.
 */

export const NOIR_RED = '#d7263d'
export const NOIR_AMBER = '#f5b942'
export const NOIR_CREAM = '#efe6d2'
export const NOIR_INK = '#111111'

// ------------------------------------------------------------------ the clue marker

export interface ClueMarkerOptions {
  /** Centre of the ring, scene px */
  x: number
  y: number
  /** Ring radius, px (default 46) */
  radius?: number
  /** When it pops on, ms */
  at: number
  /** How long it stays, ms (default 3000), fading out over the last 400 */
  duration?: number
  color?: string
  /** Ring width, px (default 6; the handle is 10/6 of it) */
  lineWidth?: number
}

/**
 * How the clue marker shows at `time`: `opacity` (pops on over 300 ms, fades
 * out over the last 400) and `scale` (a gentle pulse), or opacity 0 outside
 * its window.
 */
export function clueMarkerAt(time: number, options: Pick<ClueMarkerOptions, 'at' | 'duration'>): { opacity: number; scale: number } {
  const duration = options.duration ?? 3000
  if (!(time >= options.at && time <= options.at + duration)) return { opacity: 0, scale: 1 }
  const opacity = clamp01(popIn(progressIn(time, options.at, 300))) * (1 - smooth(progressIn(time, options.at + duration - 400, 400)))
  return { opacity, scale: 1 + 0.08 * Math.sin(((time - options.at) / 1000) * 7) }
}

/** The red magnifier: a pulsing ring with a handle, over something worth noticing. Returns its opacity. */
export function drawClueMarker(ctx: CanvasRenderingContext2D, time: number, options: ClueMarkerOptions): number {
  const { opacity, scale } = clueMarkerAt(time, options)
  if (opacity <= 0) return 0
  const r = options.radius ?? 46
  const lw = options.lineWidth ?? 6
  const { x, y } = options
  ctx.save()
  ctx.globalAlpha *= Math.min(1, opacity)
  ctx.strokeStyle = options.color ?? NOIR_RED
  ctx.lineWidth = lw
  ctx.beginPath()
  ctx.arc(x, y, r * scale, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = (lw * 10) / 6
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x + r * 0.72 * scale, y + r * 0.72 * scale)
  ctx.lineTo(x + r * 1.35, y + r * 1.35)
  ctx.stroke()
  ctx.restore()
  return opacity
}

// ------------------------------------------------------------------ props

export interface EvidenceFolderOptions {
  /** Centre, scene px */
  x: number
  y: number
  /** 1 = 68 × 48 px (default 1) */
  scale?: number
  /** Tilt, degrees (default 0) */
  angle?: number
  color?: string
  ink?: string
  /** A short label on its front, in the caller's font (default none) */
  label?: string
  labelColor?: string
  font?: string
}

/** An evidence folder: a tabbed folder with a stripe (and an optional label). */
export function drawEvidenceFolder(ctx: CanvasRenderingContext2D, options: EvidenceFolderOptions): void {
  const ink = options.ink ?? NOIR_INK
  const color = options.color ?? '#b91c1c'
  ctx.save()
  ctx.translate(options.x, options.y)
  ctx.rotate(((options.angle ?? 0) * Math.PI) / 180)
  const s = options.scale ?? 1
  ctx.scale(s, s)
  ctx.lineJoin = 'round'
  ctx.strokeStyle = ink
  ctx.lineWidth = 3
  ctx.fillStyle = color
  roundedRect(ctx, -34, -30, 26, 10, 3) // the tab
  ctx.fill()
  ctx.stroke()
  roundedRect(ctx, -34, -24, 68, 48, 4)
  ctx.fill()
  ctx.stroke()
  ctx.strokeStyle = '#fca5a5'
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-22, -6)
  ctx.lineTo(22, -6)
  ctx.stroke()
  if (options.label) {
    ctx.fillStyle = options.labelColor ?? NOIR_CREAM
    ctx.font = fontOf(13, 800, options.font ?? NOIR_FONT)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(options.label, 0, 9, 60)
  }
  ctx.restore()
}

export interface ClockFaceOptions {
  x: number
  y: number
  /** Default 52 px */
  radius?: number
  /** 0–23 (with minutes, the hour hand moves between hours) */
  hours: number
  minutes: number
  face?: string
  ink?: string
}

/** A wall clock showing a time: a face with twelve ticks, an hour and a minute hand. */
export function drawClockFace(ctx: CanvasRenderingContext2D, options: ClockFaceOptions): void {
  const r = options.radius ?? 52
  const ink = options.ink ?? NOIR_INK
  const { x, y } = options
  ctx.save()
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = options.face ?? '#f5f0e1'
  ctx.fill()
  ctx.strokeStyle = ink
  ctx.lineWidth = r * 0.115
  ctx.stroke()
  ctx.lineWidth = r * 0.058
  ctx.beginPath()
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    ctx.moveTo(x + Math.sin(a) * r * 0.77, y - Math.cos(a) * r * 0.77)
    ctx.lineTo(x + Math.sin(a) * r * 0.88, y - Math.cos(a) * r * 0.88)
  }
  ctx.stroke()
  const hand = (angle: number, length: number, width: number) => {
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.sin(angle) * length, y - Math.cos(angle) * length)
    ctx.stroke()
  }
  const { hour, minute } = clockHandAngles(options.hours, options.minutes)
  hand(hour, r * 0.5, r * 0.115)
  hand(minute, r * 0.77, r * 0.077)
  ctx.restore()
}

/** The clock's hand angles, radians clockwise from 12. */
export function clockHandAngles(hours: number, minutes: number): { hour: number; minute: number } {
  const m = ((minutes % 60) + 60) % 60
  return { hour: ((((hours % 12) + 12) % 12 + m / 60) / 12) * Math.PI * 2, minute: (m / 60) * Math.PI * 2 }
}

export interface TimeChipOptions {
  /** Top-left corner, scene px */
  x: number
  y: number
  /** Its text: a time, a place, a day ("Tuesday · 9:40 PM") */
  text: string
  /** Font size, px (default 30) */
  size?: number
  font?: string
  /** Text and border colour (default amber) */
  color?: string
  background?: string
  /** When it fades in, ms (default 100), over 400 ms */
  at?: number
}

/** A time/place chip in a corner: amber text in a black box. Returns its width. */
export function drawTimeChip(ctx: CanvasRenderingContext2D, time: number, options: TimeChipOptions): number {
  const size = options.size ?? 30
  const color = options.color ?? NOIR_AMBER
  ctx.save()
  ctx.font = fontOf(size, 800, options.font ?? NOIR_FONT)
  const width = ctx.measureText(options.text).width + size * 1.66
  const height = size * 1.87
  ctx.globalAlpha *= smooth(progressIn(time, options.at ?? 100, 400))
  roundedRect(ctx, options.x, options.y, width, height, 6)
  ctx.fillStyle = options.background ?? '#000000'
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(options.text, options.x + width / 2, options.y + height / 2 + size * 0.04)
  ctx.restore()
  return width
}

// ------------------------------------------------------------------ the name card

export interface NameCardOptions {
  /** The suspect's name */
  name: string
  /** A second line: who they are, a motive (default none) */
  role?: string
  /** When it shows, ms, and for how long (default 2600) */
  at: number
  duration?: number
  /** The suspect's head, scene px: the card goes beside it */
  anchor: Point
  /** Which side of the head (default auto: right of a head in the left 57% of the frame) */
  side?: 'auto' | 'left' | 'right'
  /** The frame, for the dimming and the auto side (default 1920 × 1080) */
  frame?: { width: number; height: number }
  /** Dim the rest of the frame to this (default 0.35; 0 for none) */
  dim?: number
  color?: string
  ink?: string
  nameSize?: number
  roleSize?: number
  font?: string
  /** Tilt, degrees (default -3.4) */
  tilt?: number
}

/** A freeze-frame name card: the frame dims and a slanted red band names the suspect beside their head. Returns its opacity. */
export function drawNameCard(ctx: CanvasRenderingContext2D, time: number, options: NameCardOptions): number {
  const k = fadeWindow(time, options.at, options.duration ?? 2600, 250, 300)
  if (k <= 0) return 0
  const frame = options.frame ?? { width: 1920, height: 1080 }
  const nameSize = options.nameSize ?? 64
  const roleSize = options.roleSize ?? 30
  const family = options.font ?? NOIR_FONT
  const side = options.side === 'left' || options.side === 'right' ? options.side : options.anchor.x < frame.width * 0.57 ? 'right' : 'left'
  ctx.save()
  const dim = options.dim ?? 0.35
  if (dim > 0) {
    ctx.fillStyle = `rgba(0,0,0,${dim * k})`
    ctx.fillRect(0, 0, frame.width, frame.height)
  }
  const gap = nameSize * 2.2
  ctx.translate(options.anchor.x + (side === 'right' ? gap : -gap), options.anchor.y + nameSize * 0.6)
  ctx.rotate(((options.tilt ?? -3.4) * Math.PI) / 180)
  ctx.globalAlpha *= k
  ctx.font = fontOf(nameSize, 800, family)
  const nameW = ctx.measureText(options.name).width
  ctx.font = fontOf(roleSize, 700, family)
  const roleW = options.role ? ctx.measureText(options.role).width : 0
  const pad = nameSize * 0.47
  const w = Math.max(nameW, roleW) + pad * 2 + 10
  const top = -nameSize * 1.1
  const h = options.role ? nameSize + roleSize + nameSize * 0.95 : nameSize * 1.6
  const x0 = side === 'right' ? 0 : -w
  roundedRect(ctx, x0, top, w, h, 4)
  ctx.fillStyle = options.color ?? NOIR_RED
  ctx.fill()
  ctx.strokeStyle = options.ink ?? NOIR_INK
  ctx.lineWidth = 5
  ctx.stroke()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#ffffff'
  ctx.font = fontOf(nameSize, 800, family)
  const nameY = options.role ? top + nameSize * 1.1 + nameSize * 0.22 : top + h / 2 + nameSize * 0.35
  ctx.fillText(options.name, x0 + pad, nameY)
  if (options.role) {
    ctx.font = fontOf(roleSize, 700, family)
    ctx.fillStyle = NOIR_CREAM
    ctx.fillText(options.role, x0 + pad, nameY + roleSize * 1.45)
  }
  ctx.restore()
  return k
}

// ------------------------------------------------------------------ narration and speech

/** How a line of text shows over its window: `opacity` and `reveal` (0..1 of its words typed on). */
export function lineReveal(time: number, start: number, end: number, typeDuration?: number): { opacity: number; reveal: number } {
  const opacity = smooth(progressIn(time, start - 50, 300)) * (1 - smooth(progressIn(time, end, 250)))
  const typing = typeDuration ?? Math.min(1600, Math.max(0, end - start) * 0.5)
  return { opacity: time < start - 50 || time > end + 250 ? 0 : opacity, reveal: progressIn(time, start, typing) }
}

/** The first `reveal` (0..1) of the words across all lines: whole words, so every script types on cleanly. */
function typedLines(lines: string[], reveal: number): string[] {
  const total = lines.reduce((n, l) => n + l.split(' ').filter(Boolean).length, 0)
  let left = Math.round(clamp01(reveal) * total)
  return lines.map((l) => {
    const words = l.split(' ').filter(Boolean)
    const shown = words.slice(0, Math.max(0, Math.min(words.length, left)))
    left -= words.length
    return shown.join(' ')
  })
}

export interface NarrationBoxOptions {
  text: string
  /** The line's start and end, ms */
  start: number
  end: number
  /** Who narrates: a small tag on the box's top-left (default none) */
  speaker?: string
  /** The box's left edge and width, and where its bottom sits, scene px (default a 1920 × 1080 frame's) */
  x?: number
  width?: number
  bottom?: number
  /** Font size, px (default 42) */
  size?: number
  font?: string
  background?: string
  ink?: string
  tagColor?: string
  /** How long the words take to type on, ms (default half the line, at most 1600) */
  typeDuration?: number
}

/** A first-person narration box along the bottom: cream paper, the narrator's tag, the words typed on. Returns its opacity. */
export function drawNarrationBox(ctx: CanvasRenderingContext2D, time: number, options: NarrationBoxOptions): number {
  const { opacity, reveal } = lineReveal(time, options.start, options.end, options.typeDuration)
  if (opacity <= 0 || !options.text) return 0
  const x = options.x ?? 150
  const width = options.width ?? 1620
  const bottom = options.bottom ?? 1040
  const size = options.size ?? 42
  const family = options.font ?? NOIR_FONT
  const ink = options.ink ?? NOIR_INK
  const lineHeight = size * 1.29
  ctx.save()
  ctx.font = fontOf(size, 700, family)
  const lines = wrapText(ctx, options.text, width - size * 1.4)
  const top = bottom - lines.length * lineHeight - size * 0.72
  ctx.globalAlpha *= opacity
  roundedRect(ctx, x, top, width, bottom - top, 6)
  ctx.fillStyle = options.background ?? withAlpha('rgb(239,230,210)', 0.96)
  ctx.fill()
  ctx.strokeStyle = ink
  ctx.lineWidth = 5
  ctx.stroke()
  if (options.speaker) {
    ctx.font = fontOf(size * 0.57, 800, family)
    const tagW = ctx.measureText(options.speaker).width + size * 1.4
    roundedRect(ctx, x, top - size * 0.72, tagW, size * 0.86, 4)
    ctx.fillStyle = options.tagColor ?? NOIR_RED
    ctx.fill()
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(options.speaker, x + tagW / 2, top - size * 0.29)
  }
  ctx.font = fontOf(size, 700, family)
  ctx.fillStyle = ink
  ctx.textBaseline = 'alphabetic'
  // Typed words appear in place: each line is laid out as it will end, then shown up to the typed word.
  const typed = typedLines(lines, reveal)
  lines.forEach((line, i) => {
    const full = ctx.measureText(line).width
    ctx.textAlign = 'left'
    ctx.fillText(typed[i], x + width / 2 - full / 2, top + size * 1.38 + i * lineHeight)
  })
  ctx.restore()
  return opacity
}

export interface SpeechBubbleOptions {
  text: string
  /** The line's start and end, ms */
  start: number
  end: number
  /** Where the tail points (the speaker's head), scene px */
  tail: Point
  /** The speaker's name on a dark tag (default none) */
  speaker?: string
  /** The widest a text line may be, px (default 640) */
  maxWidth?: number
  size?: number
  font?: string
  /** The area the bubble keeps inside (default a 1920 × 1080 frame, 40 px in) */
  bounds?: { x: number; y: number; width: number; height: number }
  /** The lowest the bubble's centre may sit, scene y (default none) */
  maxCenterY?: number
  /** Gap between the bubble and the head, px (default 70) */
  gap?: number
  fill?: string
  ink?: string
  tagColor?: string
  tagText?: string
}

/** A crisp comic speech bubble above a speaker, its tail to their head; pops on and shrinks away. Returns its scale. */
export function drawSpeechBubble(ctx: CanvasRenderingContext2D, time: number, options: SpeechBubbleOptions): number {
  const t0 = options.start - 50
  const t1 = options.end + 300
  const k = popIn(progressIn(time, t0, 280)) * (1 - smooth(progressIn(time, t1, 220)))
  if (!(time >= t0 && time <= t1 + 220) || k <= 0.01) return 0
  const size = options.size ?? 40
  const family = options.font ?? NOIR_FONT
  const ink = options.ink ?? NOIR_INK
  const fill = options.fill ?? '#ffffff'
  const bounds = options.bounds ?? { x: 40, y: 40, width: 1840, height: 1000 }
  const head = options.tail
  ctx.save()
  ctx.font = fontOf(size, 700, family)
  const lines = wrapText(ctx, options.text, options.maxWidth ?? 640)
  const lineHeight = size * 1.3
  const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + size * 1.75
  const bh = lines.length * lineHeight + size * 1.25
  const tagRoom = options.speaker ? size * 0.5 : 0
  const cx = Math.min(bounds.x + bounds.width - bw / 2, Math.max(bounds.x + bw / 2, head.x))
  let cy = Math.min(head.y - (options.gap ?? 70) - bh / 2, options.maxCenterY ?? Infinity)
  cy = Math.max(bounds.y + tagRoom + bh / 2, cy)
  const tip = { x: head.x + (cx - head.x) * 0.2, y: Math.max(cy + bh / 2 + 16, head.y - 14) }
  ctx.translate(tip.x, tip.y)
  ctx.scale(k, k)
  ctx.translate(-tip.x, -tip.y)
  ctx.fillStyle = fill
  ctx.strokeStyle = ink
  ctx.lineWidth = 5
  ctx.lineJoin = 'round'
  const bx = Math.min(Math.max(tip.x, cx - bw / 2 + 50), cx + bw / 2 - 50)
  ctx.beginPath() // the tail
  ctx.moveTo(bx - 22, cy + bh / 2 - 4)
  ctx.lineTo(tip.x, tip.y)
  ctx.lineTo(bx + 22, cy + bh / 2 - 4)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  roundedRect(ctx, cx - bw / 2, cy - bh / 2, bw, bh, 26)
  ctx.fill()
  ctx.stroke()
  ctx.fillRect(bx - 19, cy + bh / 2 - 8, 38, 6) // the tail opens into the bubble
  if (options.speaker) {
    const tag = size * 0.68
    ctx.font = fontOf(tag, 800, family)
    const tw = ctx.measureText(options.speaker).width + tag * 1.1
    roundedRect(ctx, cx - bw / 2 + 18, cy - bh / 2 - tag * 0.74, tw, tag * 1.4, 6)
    ctx.fillStyle = options.tagColor ?? ink
    ctx.fill()
    ctx.fillStyle = options.tagText ?? NOIR_CREAM
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(options.speaker, cx - bw / 2 + 18 + tag * 0.55, cy - bh / 2 - tag * 0.04)
  }
  ctx.font = fontOf(size, 700, family)
  ctx.fillStyle = ink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  lines.forEach((l, i) => ctx.fillText(l, cx, cy - bh / 2 + size * 1.65 + i * lineHeight))
  ctx.restore()
  return k
}
