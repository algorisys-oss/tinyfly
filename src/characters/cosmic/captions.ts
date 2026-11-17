import { popIn, roundedRect } from '../noir/noir-utils'
import { clamp01 } from './cosmic-utils'

/**
 * Burned-in short captions and label chips, the way science Shorts show
 * text: a caption of one to three words at a time, in step with the voice,
 * small and boxless near the lower third; and rounded chips that label
 * things ("~1%", "nucleus"). Text and fonts are the caller's; words split at
 * spaces, so Devanagari and other scripts that use spaces work as they are.
 */

/** A spoken line: its text and when it is spoken, ms. */
export interface CaptionLine {
  text: string
  start: number
  end: number
}

/** The line cut into chunks of `wordsPerChunk` words. */
export function captionChunks(text: string, wordsPerChunk = 2): string[] {
  if (!(wordsPerChunk >= 1)) throw new Error('captionChunks: wordsPerChunk must be at least 1')
  const words = text.split(/\s+/).filter(Boolean)
  const out: string[] = []
  for (let i = 0; i < words.length; i += wordsPerChunk) out.push(words.slice(i, i + wordsPerChunk).join(' '))
  return out
}

/**
 * The chunk showing at `time` (or null outside the line). Each chunk's share
 * of the line is its share of the characters (plus a little per chunk), an
 * estimate of when the voice reaches it that is close enough for one to
 * three words at a time.
 */
export function captionChunkAt(line: CaptionLine, time: number, wordsPerChunk = 2, hold = 150): string | null {
  if (time < line.start || time > line.end + hold) return null
  const chunks = captionChunks(line.text, wordsPerChunk)
  if (chunks.length === 0) return null
  const weights = chunks.map((c) => [...c].length + 2)
  const total = weights.reduce((a, b) => a + b, 0)
  const span = Math.max(1, line.end - line.start)
  const reached = clamp01((time - line.start) / span) * total
  let acc = 0
  for (let i = 0; i < chunks.length; i++) {
    acc += weights[i]
    if (reached <= acc) return chunks[i]
  }
  return chunks[chunks.length - 1]
}

export interface ShortCaptionOptions {
  /** The spoken lines (narration cues) */
  lines: ReadonlyArray<CaptionLine>
  /** Centre x and baseline y, px (for vertical video about 72% of the height; 16:9 about 86%) */
  x: number
  y: number
  /** Font size, px (default 48) */
  size?: number
  /** Font family (default 'sans-serif'); the weight is bold */
  font?: string
  color?: string
  /** Drop shadow colour (default a near-black); null for none */
  shadow?: string | null
  wordsPerChunk?: number
  /** Show lower case (default true, the reference look) */
  lowercase?: boolean
}

/** Draw the caption chunk for `time`; returns the text drawn, or null. */
export function drawShortCaption(ctx: CanvasRenderingContext2D, time: number, options: ShortCaptionOptions): string | null {
  const line = options.lines.find((l) => time >= l.start && time <= l.end + 150)
  if (!line) return null
  const chunk = captionChunkAt(line, time, options.wordsPerChunk ?? 2)
  if (!chunk) return null
  const text = options.lowercase === false ? chunk : chunk.toLocaleLowerCase()
  const size = options.size ?? 48
  ctx.save()
  ctx.font = `bold ${size}px ${options.font ?? 'sans-serif'}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  if (options.shadow !== null) {
    ctx.fillStyle = options.shadow ?? 'rgba(5,5,20,0.9)'
    ctx.fillText(text, options.x + size * 0.06, options.y + size * 0.08)
  }
  ctx.fillStyle = options.color ?? '#ffffff'
  ctx.fillText(text, options.x, options.y)
  ctx.restore()
  return text
}

export interface LabelChipOptions {
  text: string
  /** Centre of the chip, px */
  x: number
  y: number
  /** Font size, px (default 34) */
  size?: number
  font?: string
  /** Chip fill (default yellow) and text colour (default near-black) */
  fill?: string
  color?: string
  /** When it pops on, ms (default: already on) */
  at?: number
  /** Pop duration, ms (default 300) */
  pop?: number
}

/** A rounded label chip that pops on at `at`; returns its width (0 before it appears). */
export function drawLabelChip(ctx: CanvasRenderingContext2D, time: number, options: LabelChipOptions): number {
  const k = options.at === undefined ? 1 : popIn((time - options.at) / (options.pop ?? 300))
  if (!(k > 0)) return 0
  const size = options.size ?? 34
  ctx.save()
  ctx.font = `bold ${size}px ${options.font ?? 'sans-serif'}`
  const width = ctx.measureText(options.text).width + size * 0.9
  const height = size * 1.45
  ctx.translate(options.x, options.y)
  ctx.scale(k, k)
  ctx.fillStyle = options.fill ?? '#fde047'
  roundedRect(ctx, -width / 2, -height / 2, width, height, size * 0.3)
  ctx.fill()
  ctx.fillStyle = options.color ?? '#0f0f1e'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(options.text, 0, size * 0.04)
  ctx.restore()
  return width
}

/** A small corner note (e.g. "*not to scale"), right-aligned at (x, y). */
export function drawCornerNote(ctx: CanvasRenderingContext2D, options: { text: string; x: number; y: number; size?: number; font?: string; color?: string }): void {
  ctx.save()
  ctx.font = `600 ${options.size ?? 26}px ${options.font ?? 'sans-serif'}`
  ctx.textAlign = 'right'
  ctx.fillStyle = options.color ?? '#ffffff'
  ctx.fillText(options.text, options.x, options.y)
  ctx.restore()
}
