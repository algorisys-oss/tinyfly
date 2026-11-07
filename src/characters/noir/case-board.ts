import type { Point } from '../../adapters/canvas/sketch'
import { partialPath, pathLength } from '../../adapters/canvas/polyline'
import { createRandom } from '../../engine/authoring/random'
import { unknownName } from '../../engine/authoring/did-you-mean'
import { fontOf, NOIR_FONT, popIn, progressIn, roundedRect, smooth, wrapText } from './noir-utils'
import { NOIR_AMBER, NOIR_INK, NOIR_RED } from './overlays'

/**
 * A detective's case board as plain data: a cork board with pinned cards
 * (photos of suspects, notes about clues), red string between them, and the
 * marker's work over them (a cross-out, a single strike, a scribble-out, a
 * ring round a card), each drawn on over time.
 *
 * ```ts
 * const board = caseBoard({
 *   x: 60, y: 110, width: 1800, height: 900,
 *   cards: [
 *     { id: 'victim', x: 900, y: 240, title: 'The victim', note: 'Lift 2 · 9:40' },
 *     { id: 'aunt', x: 270, y: 190, title: 'The aunt', note: 'a grudge', at: 400 },
 *     { id: 'wire', x: 600, y: 200, kind: 'note', title: 'alarm wire: cut', at: 1200 },
 *   ],
 *   strings: [{ from: 'victim', to: 'aunt', at: 900 }, { from: 'victim', to: 'wire', at: 1500 }],
 *   marks: [{ on: 'aunt', kind: 'cross', at: 4000, duration: 1400 }],
 * })
 * drawCaseBoard(ctx, board, time, { drawCard: (ctx, card, area) => …draw a portrait in area… })
 * const tip = caseBoardMarkerTip(board, time) // where the marker's nib is, for a hand
 * ```
 *
 * Card positions are relative to the board's top-left; `x`, `y` is where a
 * card is pinned (its top centre). Times are ms. Text is the caller's.
 */

export type CaseCardKind = 'photo' | 'note'
export type CaseMarkKind = 'cross' | 'strike' | 'scribble' | 'circle'

export const CASE_CARD_KINDS: readonly CaseCardKind[] = ['photo', 'note']
export const CASE_MARK_KINDS: Record<CaseMarkKind, string> = {
  cross: 'two diagonals across the card, one after the other (ruled out)',
  strike: 'one diagonal, bottom-left to top-right (half ruled out)',
  scribble: 'a zigzag back and forth across the card (scribbled out)',
  circle: 'a loose ring round the card (this one)',
}

export interface CaseCard {
  id: string
  /** Where it is pinned (its top centre), relative to the board */
  x: number
  y: number
  /** `photo` (default): a print with a picture area, a title and a red note; `note`: a coloured slip with handwriting */
  kind?: CaseCardKind
  title?: string
  note?: string
  /** Size, px (default photo 220 × 260, note 220 × 124) */
  width?: number
  height?: number
  /** Tilt, degrees (default a small seeded tilt) */
  angle?: number
  /** Paper colour (default photo cream, note yellow) */
  color?: string
  /** When it is pinned up (pops on), ms (default 0: already up) */
  at?: number
  /** A pulsing amber outline from `at` for `duration` ms */
  highlight?: { at: number; duration: number }
}

export interface CaseString {
  from: string
  to: string
  /** When it starts to stretch from `from` to `to`, ms (default 0) and how long that takes (default 600) */
  at?: number
  duration?: number
  color?: string
}

export interface CaseMark {
  /** The card it goes over */
  on: string
  kind: CaseMarkKind
  /** When the marker starts, ms, and how long the stroke takes (default 1400) */
  at: number
  duration?: number
  color?: string
  /** Stroke width, px (default 16; 18 for a scribble) */
  width?: number
}

export interface CaseBoardOptions {
  /** The board's top-left and size, scene px */
  x: number
  y: number
  width: number
  height: number
  cards: CaseCard[]
  strings?: CaseString[]
  marks?: CaseMark[]
  /** Cork colour (default a warm brown) and frame colour */
  cork?: string
  frame?: string
  ink?: string
  /** Font family for titles (default system-ui) and for handwriting on notes (default the same) */
  font?: string
  handFont?: string
  /** Seed for the cork's grain and the cards' default tilts (default 1) */
  seed?: number
}

export interface CaseBoard extends Required<Omit<CaseBoardOptions, 'cards' | 'strings' | 'marks'>> {
  cards: Array<Required<Omit<CaseCard, 'title' | 'note' | 'highlight'>> & Pick<CaseCard, 'title' | 'note' | 'highlight'>>
  strings: Array<Required<CaseString>>
  marks: Array<Required<CaseMark>>
}

/** A resolved card on a board (every default filled in). */
export type CaseBoardCard = CaseBoard['cards'][number]

/** Check and resolve a case board: every default spelled out, every id checked (with a did-you-mean). */
export function caseBoard(options: CaseBoardOptions): CaseBoard {
  const seed = options.seed ?? 1
  const random = createRandom(seed)
  const ids = new Set<string>()
  const cards = options.cards.map((c) => {
    if (!c.id) throw new Error('caseBoard: every card needs an id')
    if (ids.has(c.id)) throw new Error(`caseBoard: two cards have the id "${c.id}"`)
    ids.add(c.id)
    const kind = c.kind ?? 'photo'
    if (!CASE_CARD_KINDS.includes(kind)) throw new Error(`caseBoard: ${unknownName('card kind', kind, CASE_CARD_KINDS)}`)
    const tilt = (random.next() - 0.5) * 6
    return {
      id: c.id,
      x: c.x,
      y: c.y,
      kind,
      title: c.title,
      note: c.note,
      width: c.width ?? 220,
      height: c.height ?? (kind === 'photo' ? 260 : 124),
      angle: c.angle ?? tilt,
      color: c.color ?? (kind === 'photo' ? '#f5f1e8' : '#fef08a'),
      at: c.at ?? 0,
      highlight: c.highlight,
    }
  })
  const known = [...ids]
  const check = (id: string, where: string) => {
    if (!ids.has(id)) throw new Error(`caseBoard: ${where}: ${unknownName('card', id, known)}`)
  }
  const strings = (options.strings ?? []).map((s, i) => {
    check(s.from, `strings[${i}].from`)
    check(s.to, `strings[${i}].to`)
    return { from: s.from, to: s.to, at: s.at ?? 0, duration: s.duration ?? 600, color: s.color ?? '#b91c1c' }
  })
  const marks = (options.marks ?? []).map((m, i) => {
    check(m.on, `marks[${i}].on`)
    if (!(m.kind in CASE_MARK_KINDS)) throw new Error(`caseBoard: marks[${i}]: ${unknownName('mark', m.kind, Object.keys(CASE_MARK_KINDS))}`)
    return { on: m.on, kind: m.kind, at: m.at, duration: m.duration ?? 1400, color: m.color ?? NOIR_RED, width: m.width ?? (m.kind === 'scribble' ? 18 : 16) }
  })
  return {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    cards,
    strings,
    marks,
    cork: options.cork ?? '#9a6b43',
    frame: options.frame ?? '#4a2f1e',
    ink: options.ink ?? NOIR_INK,
    font: options.font ?? NOIR_FONT,
    handFont: options.handFont ?? options.font ?? NOIR_FONT,
    seed,
  }
}

const cardOf = (board: CaseBoard, id: string): CaseBoardCard => {
  const card = board.cards.find((c) => c.id === id)
  if (!card) throw new Error(unknownName('card', id, board.cards.map((c) => c.id)))
  return card
}

/** A card-local point (origin at the pin, x right, y down the card) in scene px, turned with the card. */
function onCard(board: CaseBoard, card: CaseBoardCard, p: Point): Point {
  const a = (card.angle * Math.PI) / 180
  return { x: board.x + card.x + p.x * Math.cos(a) - p.y * Math.sin(a), y: board.y + card.y + p.x * Math.sin(a) + p.y * Math.cos(a) }
}

/** Where a card is: its pin and its four corners, scene px. */
export function caseCardBox(board: CaseBoard, id: string): { pin: Point; center: Point; corners: Point[]; width: number; height: number } {
  const card = cardOf(board, id)
  const w = card.width / 2
  const h = card.height
  return {
    pin: onCard(board, card, { x: 0, y: 0 }),
    center: onCard(board, card, { x: 0, y: h / 2 }),
    corners: [{ x: -w, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: -w, y: h }].map((p) => onCard(board, card, p)),
    width: card.width,
    height: card.height,
  }
}

/** A mark's stroke path, scene px (a cross is its two diagonals end to end, drawn in turn). */
export function caseMarkPath(board: CaseBoard, mark: Pick<CaseMark, 'on' | 'kind'>): Point[][] {
  const card = cardOf(board, mark.on)
  const w = card.width / 2 - 10
  const top = 8
  const bottom = card.height - 8
  const at = (x: number, y: number) => onCard(board, card, { x, y })
  if (mark.kind === 'cross') return [[at(-w, top), at(w, bottom)], [at(w, top), at(-w, bottom)]]
  if (mark.kind === 'strike') return [[at(-w, bottom), at(w, top)]]
  if (mark.kind === 'scribble') {
    const mid = card.height / 2
    const band = card.height * 0.33
    return [Array.from({ length: 15 }, (_, i) => at(-w + (i * 2 * w) / 14, i % 2 ? mid - band : mid + band))]
  }
  // A loose ring: a little more than once round, starting at the top-left.
  return [Array.from({ length: 41 }, (_, i) => {
    const a = -2.4 + (i / 40) * Math.PI * 2.15
    const wobble = 1 + 0.04 * Math.sin(i * 1.7)
    return at(Math.cos(a) * (w + 30) * wobble, card.height / 2 + Math.sin(a) * (card.height / 2 + 26) * wobble)
  })]
}

/** How far each stroke of a mark is drawn at `time` (each stroke 0..1, in turn, shared out by length). */
function markProgress(paths: Point[][], progress: number): number[] {
  const lengths = paths.map(pathLength)
  const total = lengths.reduce((a, b) => a + b, 0) || 1
  let left = progress * total
  return lengths.map((l) => {
    const k = l > 0 ? Math.min(1, Math.max(0, left / l)) : 1
    left -= l
    return k
  })
}

/** Where the marker's nib is at `time` (scene px), or null when no mark is being drawn. */
export function caseBoardMarkerTip(board: CaseBoard, time: number): Point | null {
  let tip: Point | null = null
  for (const mark of board.marks) {
    if (time <= mark.at || time >= mark.at + mark.duration) continue
    const paths = caseMarkPath(board, mark)
    const ks = markProgress(paths, smooth(progressIn(time, mark.at, mark.duration)))
    const i = Math.max(0, ks.findIndex((k) => k < 1))
    const part = partialPath(paths[i], ks[i])
    tip = part[part.length - 1]
  }
  return tip
}

/** A red push pin with a highlight. */
export function drawPushPin(ctx: CanvasRenderingContext2D, x: number, y: number, options: { color?: string; radius?: number; ink?: string } = {}): void {
  const r = options.radius ?? 11
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = options.color ?? NOIR_RED
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = options.ink ?? NOIR_INK
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x - r * 0.27, y - r * 0.27, r * 0.27, 0, Math.PI * 2)
  ctx.fillStyle = '#fca5a5'
  ctx.fill()
  ctx.restore()
}

/** The first `progress` (0..1) of a marker stroke along points; returns the nib's point. */
export function drawMarkerStroke(ctx: CanvasRenderingContext2D, points: Point[], progress: number, options: { color?: string; width?: number } = {}): Point | null {
  if (progress <= 0 || points.length < 2) return null
  const part = partialPath(points, progress)
  ctx.save()
  ctx.strokeStyle = options.color ?? NOIR_RED
  ctx.lineWidth = options.width ?? 16
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(part[0].x, part[0].y)
  for (const p of part.slice(1)) ctx.lineTo(p.x, p.y)
  ctx.stroke()
  ctx.restore()
  return part[part.length - 1]
}

export interface DrawCaseBoardOptions {
  /**
   * Draws a card's picture (a suspect's portrait, a clue's sketch) inside
   * `area`, in the card's own frame (origin at the pin), clipped to the area.
   */
  drawCard?: (ctx: CanvasRenderingContext2D, card: CaseBoardCard, area: { x: number; y: number; width: number; height: number }, time: number) => void
}

/** Draw the board as it is at `time`: cork, strings, cards, pins and the marker's work. Returns the marker's nib, if a mark is being drawn. */
export function drawCaseBoard(ctx: CanvasRenderingContext2D, board: CaseBoard, time: number, options: DrawCaseBoardOptions = {}): Point | null {
  const { x, y, width, height, ink } = board
  ctx.save()
  // the cork, its grain and the frame
  roundedRect(ctx, x, y, width, height, 10)
  ctx.fillStyle = board.cork
  ctx.fill()
  ctx.save()
  ctx.clip()
  const grain = createRandom(board.seed + 7)
  ctx.fillStyle = 'rgba(60,35,15,0.25)'
  const specks = Math.round((width * height) / 3000)
  for (let i = 0; i < specks; i++) {
    ctx.beginPath()
    ctx.arc(x + grain.next() * width, y + grain.next() * height, 2 + grain.next() * 2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
  roundedRect(ctx, x, y, width, height, 10)
  ctx.lineWidth = 22
  ctx.strokeStyle = board.frame
  ctx.stroke()

  const shown = (c: CaseBoardCard) => (time >= c.at ? popIn(progressIn(time, c.at, 350)) : 0)
  // the strings, stretching from one pin to the other
  for (const s of board.strings) {
    const k = smooth(progressIn(time, s.at, s.duration))
    if (k <= 0 || shown(cardOf(board, s.from)) <= 0) continue
    const a = caseCardBox(board, s.from).pin
    const b = caseCardBox(board, s.to).pin
    ctx.strokeStyle = s.color
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k)
    ctx.stroke()
  }
  // the cards, then their pins
  for (const card of board.cards) {
    const k = shown(card)
    if (k <= 0) continue
    const w = card.width
    const h = card.height
    ctx.save()
    // Pinned up: it drops the last few px onto its pin as it pops in.
    ctx.translate(x + card.x, y + card.y - 40 * (1 - Math.min(1, k)))
    ctx.rotate((card.angle * Math.PI) / 180)
    ctx.scale(k, k)
    roundedRect(ctx, -w / 2, 0, w, h, 3)
    ctx.fillStyle = card.color
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = ink
    ctx.stroke()
    const photo = card.kind === 'photo'
    const area = photo ? { x: -w / 2 + 18, y: 18, width: w - 36, height: h * 0.62 } : { x: -w / 2 + 12, y: 14, width: w - 24, height: h * 0.45 }
    if (photo) {
      ctx.fillStyle = '#1e2530'
      ctx.fillRect(area.x, area.y, area.width, area.height)
    }
    if (options.drawCard) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(area.x, area.y, area.width, area.height)
      ctx.clip()
      options.drawCard(ctx, card, area, time)
      ctx.restore()
    }
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    const below = area.y + area.height
    if (photo) {
      if (card.title) {
        ctx.font = fontOf(28, 800, board.font)
        ctx.fillStyle = ink
        ctx.fillText(card.title, 0, below + (h - below) * 0.45, w - 16)
      }
      if (card.note) {
        ctx.font = fontOf(19, 600, board.font)
        ctx.fillStyle = '#7f1d1d'
        ctx.fillText(card.note, 0, below + (h - below) * 0.8, w - 16)
      }
    } else {
      const text = [card.title, card.note].filter(Boolean).join('\n')
      ctx.font = fontOf(26, 700, board.handFont)
      ctx.fillStyle = ink
      const lines = wrapText(ctx, text, w - 20)
      const top = options.drawCard ? below + 8 : (h - lines.length * 30) / 2
      lines.forEach((l, i) => ctx.fillText(l, 0, top + 24 + i * 30, w - 12))
    }
    if (card.highlight && time >= card.highlight.at && time <= card.highlight.at + card.highlight.duration) {
      ctx.strokeStyle = NOIR_AMBER
      ctx.lineWidth = 8
      ctx.globalAlpha *= 0.6 + 0.4 * Math.sin(((time - card.highlight.at) / 1000) * 6)
      ctx.strokeRect(-w / 2 - 8, -8, w + 16, h + 16)
    }
    ctx.restore()
    const pin = caseCardBox(board, card.id).pin
    drawPushPin(ctx, pin.x, pin.y - 40 * (1 - Math.min(1, k)), { ink })
  }
  // the marker's work
  for (const mark of board.marks) {
    if (time <= mark.at) continue
    const paths = caseMarkPath(board, mark)
    const ks = markProgress(paths, smooth(progressIn(time, mark.at, mark.duration)))
    paths.forEach((p, i) => drawMarkerStroke(ctx, p, ks[i], { color: mark.color, width: mark.width }))
  }
  ctx.restore()
  return caseBoardMarkerTip(board, time)
}
