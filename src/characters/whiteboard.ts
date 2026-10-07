import type { CustomTarget } from '../adapters/canvas/canvas-adapter'
import type { PropertyInfo } from '../adapters/canvas/target-properties'
import { unknownName } from '../engine/authoring/did-you-mean'
import { createRandom, hashSeed } from '../engine/authoring/random'
import type { Track } from '../engine/types'
import { editLog, type EditOptions } from './surface/edit-log'
import { pieceMotion, type FlingOptions, type SurfacePiece, type TimedPoint } from './surface/pieces'
import { anchorError, editError, parseAnchor, type Surface, type SurfaceAbout, type SurfaceEditOptions } from './surface/surface'
import { surfaceBox, type SurfaceBox } from './surface/surface-box'

/**
 * A whiteboard (or a chalkboard) as a scene object figures act on: they
 * write on it, circle and underline what matters, strike terms out, carry a
 * term across the equals sign and erase it all.
 *
 * ```ts
 * const board = whiteboard({
 *   x: 40, y: 30, width: 600, height: 340, theme: 'chalkboard',
 *   items: [
 *     { id: 'eq', text: '2x + 4 = 10', at: [60, 80] },
 *     { id: 'step', text: '2x = 6', at: [60, 160], hidden: true },
 *     { id: 'ring', mark: 'circle', around: 'term:eq:+ 4', hidden: true },
 *   ],
 * })
 * board.edit('draw', 'mark:ring', { at: 800 })
 * board.edit('fling', 'term:eq:+ 4', { at: 1600 })
 * board.edit('write', 'text:step', { at: 2400 })
 * ```
 *
 * Everything on it is declared up front as plain data (`items`), so its
 * places are known before anything plays. Text is laid out by arithmetic
 * (each character a fixed `charWidth` em cell, drawn centred in it), never
 * measured from a font, and marks get a hand-drawn wobble from a seed made
 * of their id, so the same board is drawn the same everywhere. Items with
 * `hidden: true` start unwritten (text) or undrawn (marks).
 *
 * Its places: `box`, `text:ID`, `term:ID:TEXT` (the first TEXT in that
 * text; `term:ID#K:TEXT` for the Kth), `mark:ID`. A term can come loose as a
 * piece. Edits are recorded as keys on its props (`text.ID.write`,
 * `mark.ID.draw`, `strike.K.draw`, `piece.K.x`…) and written out by
 * `tracks()`.
 */

export type BoardThemeName = 'whiteboard' | 'chalkboard'

export interface BoardTheme {
  background: string
  frame: string
  /** The default colour of text and marks */
  ink: string
  /** Named colours an item's `color` can use (any CSS colour works too) */
  colors: Record<string, string>
  font: string
  /** Mark line width, as a fraction of the font size */
  stroke: number
  /** Ink opacity (chalk is a little see-through) */
  opacity: number
}

const HAND_FONT = '"Segoe Print", "Bradley Hand", "Comic Sans MS", "Chalkboard SE", cursive'

export const BOARD_THEMES: Record<BoardThemeName, BoardTheme> = {
  whiteboard: {
    background: '#f7f7f2',
    frame: '#b8bcc4',
    ink: '#1f2a44',
    colors: { ink: '#1f2a44', red: '#d03b3b', blue: '#2f6fd0', green: '#2e9a52', orange: '#e07b1a' },
    font: HAND_FONT,
    stroke: 0.09,
    opacity: 1,
  },
  chalkboard: {
    background: '#2f4a3a',
    frame: '#7a5a3a',
    ink: '#f1f1e8',
    colors: { ink: '#f1f1e8', red: '#f2a3a3', blue: '#a8c8f0', green: '#b7e4a8', orange: '#f5c98a', yellow: '#f6ef9a' },
    font: HAND_FONT,
    stroke: 0.1,
    opacity: 0.9,
  },
}

/** The marks a board can draw. */
export type BoardMarkKind = 'circle' | 'box' | 'underline' | 'arrow'
export const BOARD_MARKS: readonly BoardMarkKind[] = ['circle', 'box', 'underline', 'arrow']

/** Text on the board. */
export interface BoardText {
  id: string
  text: string
  /** Its top-left corner, px from the board's top-left */
  at: [number, number]
  /** Font size, px (default the board's `fontSize`) */
  size?: number
  /** A theme colour name (`red`, `blue`…) or any CSS colour (default the theme's ink) */
  color?: string
  /** Start unwritten, to be written in with the `write` edit */
  hidden?: boolean
}

/** A hand-drawn mark: a circle, box or underline around a place, or an arrow from one place to another. */
export interface BoardMark {
  id: string
  mark: BoardMarkKind
  /** `circle`, `box`, `underline`: the place it goes around (an item before it: `text:ID`, `term:ID:TEXT`, `mark:ID`) */
  around?: string
  /** `arrow`: from one place to another */
  from?: string
  to?: string
  color?: string
  /** Start undrawn, to be drawn in with the `draw` edit */
  hidden?: boolean
}

export type BoardItem = BoardText | BoardMark

export interface WhiteboardOptions {
  /** Top-left corner, scene px */
  x: number
  y: number
  width: number
  height: number
  theme?: BoardThemeName | Partial<BoardTheme>
  /** px (default 28) */
  fontSize?: number
  /** Width of a character cell, em (default 0.55) */
  charWidth?: number
  items?: BoardItem[]
}

/** A term that can come loose from its text: made by `piece()`. */
export interface BoardPiece extends SurfacePiece {
  readonly text: string
  /** The text item it is part of, and where in it */
  readonly item: string
  readonly column: number
}

export interface Whiteboard extends Surface {
  readonly kind: 'board'
  readonly target: CustomTarget
  readonly box: SurfaceBox
  /** The box at a named place: `box`, `text:ID`, `term:ID:TEXT` (`term:ID#K:TEXT` for the Kth), `mark:ID` */
  anchor(name: string, time?: number): SurfaceBox
  /** Make the term at a `term:` place a piece that can come loose */
  piece(anchor: string): BoardPiece
  /** Change the board at a time by name, at named places (see `WHITEBOARD_SURFACE.edits`) */
  edit(name: string, anchor: string | string[], options: SurfaceEditOptions): Whiteboard
  follow(piece: SurfacePiece, path: TimedPoint[]): Whiteboard
  fling(piece: SurfacePiece, options: FlingOptions): Whiteboard
  move(piece: SurfacePiece, options: EditOptions & { to: { x: number; y: number } }): Whiteboard
  /** A board has nothing to stand on that moves: the tracks come back as they are */
  ride(tracks: Track[], target: string, options: { ground: number; every?: number }): Track[]
  tracks(target: string): Track[]
}

/** A board's anchors and edits, as data: for its `about`, the capability catalog and the checks. */
export const WHITEBOARD_SURFACE: SurfaceAbout = {
  kind: 'board',
  create: 'whiteboard({ x, y, width, height, theme?: whiteboard | chalkboard, fontSize?, items: [{ id, text, at: [x, y], size?, color?, hidden? } | { id, mark: circle | box | underline | arrow, around? | from?, to?, color?, hidden? }] })',
  anchors: {
    box: 'the whole board',
    'text:ID': 'a text item: write along it from left to right, point at it',
    'term:ID:TEXT': 'the first TEXT in text ID (term:ID#K:TEXT for the Kth): a term, which can come loose as a piece',
    'mark:ID': 'a mark (circle, box, underline or arrow)',
  },
  edits: {
    write: 'text anchors given `hidden`; { at, duration? }: write them in by hand. Or a term; { at, text, duration? }: write new text in its place (move or erase the term first)',
    draw: 'mark anchors given `hidden`; { at, duration? }: draw them in',
    erase: 'text, term or mark anchors; { at, duration? }: wipe them off',
    strike: 'text or term anchors; { at, duration? }: cross them out',
    move: 'a term; { at, to: an anchor name or { x, y }, duration? }: move the term there',
    fling: 'a term; { at, velocity?, spin?, gravity?, duration? }: throw or knock the term off on a spinning arc',
  },
}

/** Text written per character, ms, and the least a write takes. */
const WRITE_PER_CHAR = 90
const WRITE_MIN = 300
/** Room left around what a mark goes around, as a fraction of the font size. */
const MARK_PAD = 0.3

type Placed = { kind: 'text'; item: BoardText; size: number; color: string; box: SurfaceBox } | { kind: 'mark'; item: BoardMark; color: string; points: Point[]; box: SurfaceBox }
type Point = { x: number; y: number }
type BoardAnchor = { kind: 'box' } | { kind: 'text'; id: string } | { kind: 'term'; id: string; text: string; occurrence: number } | { kind: 'mark'; id: string }

export function whiteboard(options: WhiteboardOptions): Whiteboard {
  const themeName = typeof options.theme === 'string' ? options.theme : 'whiteboard'
  if (!(themeName in BOARD_THEMES)) throw new Error(`whiteboard: ${unknownName('theme', themeName, Object.keys(BOARD_THEMES))}`)
  const theme: BoardTheme = typeof options.theme === 'object' ? { ...BOARD_THEMES.whiteboard, ...options.theme } : BOARD_THEMES[themeName as BoardThemeName]
  const fontSize = options.fontSize ?? 28
  const cell = options.charWidth ?? 0.55
  const colorOf = (color: string | undefined) => (color === undefined ? theme.ink : theme.colors[color] ?? color)
  /** Board-local box → scene box. */
  const scene = (box: SurfaceBox) => surfaceBox(options.x + box.left, options.y + box.top, box.width, box.height)

  const log = editLog()
  const motion = pieceMotion(log)
  const props: Record<string, number> = {}
  const placed = new Map<string, Placed>()
  const pieces: BoardPiece[] = []
  /** Strikes through text or terms, board-local. */
  const strikes: Array<{ id: number; box: SurfaceBox }> = []

  /** Where the `occurrence`th `text` sits in text item `id`, board-local. */
  const termBox = (id: string, text: string, occurrence: number, name: string) => {
    const found = placed.get(id)
    if (!found || found.kind !== 'text') throw anchorError('whiteboard', name, WHITEBOARD_SURFACE, `there is no text "${id}" (texts: ${texts().join(', ') || 'none'})`)
    let column = -1
    for (let k = 0; k < occurrence; k++) {
      column = found.item.text.indexOf(text, column + 1)
      if (column < 0) throw anchorError('whiteboard', name, WHITEBOARD_SURFACE, `text "${id}" has no ${occurrence > 1 ? `${occurrence}th ` : ''}"${text}"`)
    }
    const width = found.size * cell
    return { column, box: surfaceBox(found.box.left + column * width, found.box.top, text.length * width, found.box.height) }
  }
  const texts = () => [...placed.values()].filter((p) => p.kind === 'text').map((p) => p.item.id)

  const named = (name: string): BoardAnchor => {
    const { kind, rest } = parseAnchor(name)
    const fail = (why?: string) => anchorError('whiteboard', name, WHITEBOARD_SURFACE, why)
    if (kind === 'box') {
      if (rest) throw fail('box takes no arguments')
      return { kind }
    }
    if (kind === 'text' || kind === 'mark') {
      if (!rest) throw fail(`write it ${kind}:ID`)
      return { kind, id: rest }
    }
    if (kind === 'term') {
      const match = /^([^:#]+)(?:#(\d+))?:(.+)$/.exec(rest)
      if (!match) throw fail('write it term:ID:TEXT, or term:ID#K:TEXT for the Kth')
      return { kind, id: match[1], occurrence: match[2] ? Number(match[2]) : 1, text: match[3] }
    }
    throw fail()
  }
  /** A named place, board-local. */
  const local = (name: string): SurfaceBox => {
    const anchor = named(name)
    if (anchor.kind === 'box') return surfaceBox(0, 0, options.width, options.height)
    if (anchor.kind === 'term') return termBox(anchor.id, anchor.text, anchor.occurrence, name).box
    const found = placed.get(anchor.id)
    if (!found || found.kind !== anchor.kind) {
      const ids = [...placed.values()].filter((p) => p.kind === anchor.kind).map((p) => p.item.id)
      throw anchorError('whiteboard', name, WHITEBOARD_SURFACE, `there is no ${anchor.kind} "${anchor.id}" (${anchor.kind}s: ${ids.join(', ') || 'none'})`)
    }
    return found.box
  }

  // Lay the items out, in order: a mark goes around (or between) items before it.
  for (const item of options.items ?? []) {
    if (!item || typeof item.id !== 'string' || !item.id || /[:#]/.test(item.id)) throw new Error(`whiteboard: every item needs an \`id\` without ":" or "#" (got ${JSON.stringify(item?.id)})`)
    if (placed.has(item.id)) throw new Error(`whiteboard: two items are called "${item.id}"`)
    if ('text' in item) {
      if (!Array.isArray(item.at) || item.at.length !== 2 || !item.at.every((n) => typeof n === 'number')) throw new Error(`whiteboard: text "${item.id}" needs \`at\`, [x, y] from the board's top-left`)
      const size = item.size ?? fontSize
      const box = surfaceBox(item.at[0], item.at[1], Math.max(1, item.text.length) * size * cell, size * 1.3)
      placed.set(item.id, { kind: 'text', item, size, color: colorOf(item.color), box })
      props[`text.${item.id}.write`] = item.hidden ? 0 : 1
      props[`text.${item.id}.erase`] = 0
      continue
    }
    if (!BOARD_MARKS.includes(item.mark)) throw new Error(`whiteboard: mark "${item.id}": ${unknownName('mark', item.mark, BOARD_MARKS)}`)
    const needs = item.mark === 'arrow' ? (['from', 'to'] as const) : (['around'] as const)
    for (const field of needs) if (typeof item[field] !== 'string') throw new Error(`whiteboard: ${item.mark} "${item.id}" needs \`${field}\`, a place on the board (an item before it)`)
    const points = markPoints(item, local, fontSize)
    placed.set(item.id, { kind: 'mark', item, color: colorOf(item.color), points, box: boundsOf(points) })
    props[`mark.${item.id}.draw`] = item.hidden ? 0 : 1
    props[`mark.${item.id}.erase`] = 0
  }

  const piecesIn = (id: string) => pieces.filter((piece) => piece.item === id)

  const target: CustomTarget = {
    type: 'custom',
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    props,
    about: {
      kind: 'whiteboard',
      summary: `A board with ${placed.size} items. Its texts, terms and marks are places in the scene (anchor()); its edits record tracks (edit(), tracks()).`,
      get props() {
        return describeBoardProps(Object.keys(props))
      },
      actions: WHITEBOARD_SURFACE.edits,
    },
    draw(ctx, self) {
      const values = (self.props ?? {}) as Record<string, number>
      const read = (key: string) => Number(values[key] ?? props[key] ?? 0)
      ctx.save()
      ctx.fillStyle = theme.background
      roundRect(ctx, 0, 0, options.width, options.height, 10)
      ctx.fill()
      ctx.lineWidth = Math.max(4, options.width * 0.012)
      ctx.strokeStyle = theme.frame
      ctx.stroke()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalAlpha = theme.opacity

      for (const p of placed.values()) {
        ctx.save()
        wipe(ctx, p.box, read(`${p.kind}.${p.item.id}.erase`))
        if (p.kind === 'text') {
          const loose = piecesIn(p.item.id)
          const shown = read(`text.${p.item.id}.write`) * p.item.text.length
          ctx.font = `${p.size}px ${theme.font}`
          ctx.fillStyle = p.color
          for (let k = 0; k < Math.ceil(shown); k++) {
            if (p.item.text[k] === ' ' || loose.some((piece) => k >= piece.column && k < piece.column + piece.text.length)) continue
            ctx.globalAlpha = theme.opacity * Math.min(1, shown - k)
            ctx.fillText(p.item.text[k], p.box.left + (k + 0.5) * p.size * cell, p.box.y)
          }
        } else {
          stroke(ctx, p.points, read(`mark.${p.item.id}.draw`), p.color, fontSize * theme.stroke, p.item.mark === 'arrow')
        }
        ctx.restore()
      }

      for (const strike of strikes) {
        const drawn = read(`strike.${strike.id}.draw`)
        if (drawn <= 0) continue
        const { box } = strike
        const tilt = box.height * 0.15
        stroke(ctx, [{ x: box.left - 3, y: box.y + tilt }, { x: box.right + 3, y: box.y - tilt }], drawn, theme.colors.red ?? theme.ink, fontSize * theme.stroke * 0.8, false)
      }

      for (const piece of pieces) {
        const found = placed.get(piece.item) as Extract<Placed, { kind: 'text' }>
        const width = found.size * cell
        ctx.font = `${found.size}px ${theme.font}`
        ctx.fillStyle = found.color
        // New text written into its place.
        const written = (piece as BoardPiece & { written?: string }).written
        if (written) {
          const shown = read(`piece.${piece.id}.write`) * written.length
          const left = piece.home.x - options.x - (written.length * width) / 2
          for (let k = 0; k < Math.ceil(shown); k++) {
            if (written[k] === ' ') continue
            ctx.globalAlpha = theme.opacity * Math.min(1, shown - k)
            ctx.fillText(written[k], left + (k + 0.5) * width, piece.home.y - options.y)
          }
        }
        const opacity = read(`piece.${piece.id}.opacity`) * Math.min(1, read(`text.${piece.item}.write`) * found.item.text.length - piece.column)
        if (opacity <= 0) continue
        ctx.save()
        const home = { x: piece.home.x - options.x, y: piece.home.y - options.y }
        const offset = { x: read(`piece.${piece.id}.x`), y: read(`piece.${piece.id}.y`) }
        wipe(ctx, surfaceBox(home.x + offset.x - piece.home.width / 2, home.y + offset.y - piece.home.height / 2, piece.home.width, piece.home.height), read(`piece.${piece.id}.erase`))
        // Still in its text, it goes when the text is wiped off.
        if (Math.hypot(offset.x, offset.y) < 1) wipe(ctx, found.box, read(`text.${piece.item}.erase`))
        ctx.globalAlpha = theme.opacity * Math.min(1, opacity)
        ctx.translate(home.x + offset.x, home.y + offset.y)
        ctx.rotate((read(`piece.${piece.id}.rotate`) * Math.PI) / 180)
        for (let k = 0; k < piece.text.length; k++) if (piece.text[k] !== ' ') ctx.fillText(piece.text[k], (k + 0.5 - piece.text.length / 2) * width, 0)
        ctx.restore()
      }
      ctx.restore()
    },
  }

  const board: Whiteboard = {
    kind: 'board',
    about: WHITEBOARD_SURFACE,
    target,
    box: surfaceBox(options.x, options.y, options.width, options.height),
    anchor(name) {
      return scene(local(name))
    },
    piece(name) {
      const anchor = named(name)
      if (anchor.kind !== 'term') throw new Error(`whiteboard.piece: a piece is a term, term:ID:TEXT, not "${name}"`)
      const { column, box } = termBox(anchor.id, anchor.text, anchor.occurrence, name)
      const existing = pieces.find((p) => p.item === anchor.id && p.column === column && p.text === anchor.text)
      if (existing) return existing
      if (pieces.some((p) => p.item === anchor.id && column < p.column + p.text.length && p.column < column + anchor.text.length))
        throw new Error(`whiteboard: "${anchor.text}" in "${anchor.id}" overlaps another piece`)
      const piece: BoardPiece = { id: pieces.length + 1, item: anchor.id, column, text: anchor.text, home: scene(box) }
      pieces.push(piece)
      for (const field of ['x', 'y', 'rotate', 'erase', 'write']) props[`piece.${piece.id}.${field}`] = 0
      props[`piece.${piece.id}.opacity`] = 1
      return piece
    },
    edit(name, anchors, edit) {
      const list = Array.isArray(anchors) ? anchors : [anchors]
      if (list.length === 0) throw new Error(`whiteboard.edit: ${name} takes at least one anchor`)
      const parsed = list.map((anchor) => ({ name: anchor, anchor: named(anchor) }))
      // Every place must be on the board before it is changed.
      for (const { name: anchor } of parsed) local(anchor)
      const only = (kinds: BoardAnchor['kind'][], one = false) => {
        const wrong = parsed.find((p) => !kinds.includes(p.anchor.kind))
        if (wrong) throw new Error(`whiteboard.edit: ${name} takes ${kinds.join(' or ')} anchors, not "${wrong.name}"`)
        if (one && parsed.length > 1) throw new Error(`whiteboard.edit: ${name} takes one ${kinds.join(' or ')} anchor`)
      }
      const termPiece = () => board.piece(parsed[0].name)

      if (name === 'write') {
        if (parsed.some((p) => p.anchor.kind === 'term')) {
          only(['term'], true)
          if (typeof edit.text !== 'string') throw new Error('whiteboard.edit: write into a term needs `text` (the new text)')
          const piece = termPiece() as BoardPiece & { written?: string }
          piece.written = edit.text
          log.tween(`piece.${piece.id}.write`, 0, 1, { duration: Math.max(WRITE_MIN, edit.text.length * WRITE_PER_CHAR), ...edit })
          return board
        }
        only(['text'])
        for (const { anchor } of parsed) {
          const id = (anchor as { id: string }).id
          const text = (placed.get(id) as Extract<Placed, { kind: 'text' }>).item.text
          log.tween(`text.${id}.write`, 0, 1, { duration: Math.max(WRITE_MIN, text.length * WRITE_PER_CHAR), ...edit })
        }
        return board
      }
      if (name === 'draw') {
        only(['mark'])
        for (const { anchor } of parsed) log.tween(`mark.${(anchor as { id: string }).id}.draw`, 0, 1, { duration: 500, ...edit })
        return board
      }
      if (name === 'erase') {
        only(['text', 'term', 'mark'])
        for (const p of parsed) {
          const key = p.anchor.kind === 'term' ? `piece.${board.piece(p.name).id}.erase` : `${p.anchor.kind}.${(p.anchor as { id: string }).id}.erase`
          log.tween(key, 0, 1, { duration: 400, ...edit })
        }
        return board
      }
      if (name === 'strike') {
        only(['text', 'term'])
        for (const p of parsed) {
          const strike = { id: strikes.length + 1, box: local(p.name) }
          strikes.push(strike)
          props[`strike.${strike.id}.draw`] = 0
          log.tween(`strike.${strike.id}.draw`, 0, 1, { duration: 250, ...edit })
        }
        return board
      }
      if (name === 'move') {
        only(['term'], true)
        const to = typeof edit.to === 'string' ? board.anchor(edit.to) : (edit.to as { x: number; y: number } | undefined)
        if (!to || typeof to.x !== 'number' || typeof to.y !== 'number') throw new Error('whiteboard.edit: move needs `to`, an anchor name or { x, y }')
        return board.move(termPiece(), { ...edit, to })
      }
      if (name === 'fling') {
        only(['term'], true)
        return board.fling(termPiece(), edit as FlingOptions)
      }
      throw editError('whiteboard', name, WHITEBOARD_SURFACE)
    },
    follow(piece, path) {
      motion.follow(piece, path)
      return board
    },
    fling(piece, fling) {
      motion.fling(piece, fling)
      return board
    },
    move(piece, edit) {
      motion.move(piece, edit)
      return board
    },
    ride(tracks) {
      return tracks
    },
    tracks: log.tracks,
  }
  return board
}

/** A mark's line, board-local, with a hand-drawn wobble seeded by its id. */
function markPoints(mark: BoardMark, local: (name: string) => SurfaceBox, fontSize: number): Point[] {
  const random = createRandom(hashSeed(mark.id))
  const jitter = (amount: number) => (random.next() * 2 - 1) * amount
  const pad = fontSize * MARK_PAD
  if (mark.mark === 'arrow') {
    const from = local(mark.from!)
    const to = local(mark.to!)
    const start = edgeToward(from, to, pad * 0.6)
    const end = edgeToward(to, from, pad * 0.6)
    // A slight bow, as a hand draws it.
    const bow = Math.hypot(end.x - start.x, end.y - start.y) * (0.06 + jitter(0.04))
    const normal = normalOf(start, end)
    const mid = { x: (start.x + end.x) / 2 + normal.x * bow, y: (start.y + end.y) / 2 + normal.y * bow }
    const line: Point[] = []
    for (let k = 0; k <= 24; k++) {
      const t = k / 24
      line.push({ x: (1 - t) ** 2 * start.x + 2 * (1 - t) * t * mid.x + t * t * end.x, y: (1 - t) ** 2 * start.y + 2 * (1 - t) * t * mid.y + t * t * end.y })
    }
    return line
  }
  const box = local(mark.around!)
  if (mark.mark === 'underline') {
    const y = box.bottom + pad * 0.4
    return [
      { x: box.left - pad * 0.3, y: y + jitter(2) },
      { x: box.x, y: y + 2 + jitter(2) },
      { x: box.right + pad * 0.5, y: y - 1 + jitter(3) },
    ]
  }
  if (mark.mark === 'box') {
    const l = box.left - pad
    const r = box.right + pad
    const t = box.top - pad * 0.6
    const b = box.bottom + pad * 0.6
    const corner = (x: number, y: number) => ({ x: x + jitter(pad * 0.2), y: y + jitter(pad * 0.2) })
    const first = corner(l, t)
    // Back past the first corner a little: a hand overshoots where it started.
    return [first, corner(r, t), corner(r, b), corner(l, b), first, { x: first.x + pad * 0.8, y: first.y + jitter(2) }]
  }
  // circle: an oval round it, a little more than one turn, wobbling and opening out as it goes.
  const rx = box.width / 2 + pad
  const ry = box.height / 2 + pad * 0.6
  const start = -2.2 + jitter(0.3)
  const phase = random.next() * Math.PI * 2
  const turns = 1.12
  const steps = 64
  const points: Point[] = []
  for (let k = 0; k <= steps * turns; k++) {
    const t = k / steps
    const angle = start + t * Math.PI * 2
    const wobble = 1 + 0.035 * Math.sin(t * Math.PI * 4 + phase) + 0.06 * t
    points.push({ x: box.x + Math.cos(angle) * rx * wobble, y: box.y + Math.sin(angle) * ry * wobble })
  }
  return points
}

/** Where a line from `box`'s centre toward `other`'s leaves `box`, `gap` px out. */
function edgeToward(box: SurfaceBox, other: SurfaceBox, gap: number): Point {
  const dx = other.x - box.x
  const dy = other.y - box.y
  if (dx === 0 && dy === 0) return { x: box.x, y: box.y }
  const scale = Math.min(dx === 0 ? Infinity : (box.width / 2 + gap) / Math.abs(dx), dy === 0 ? Infinity : (box.height / 2 + gap) / Math.abs(dy))
  return { x: box.x + dx * scale, y: box.y + dy * scale }
}

function normalOf(a: Point, b: Point): Point {
  const length = Math.hypot(b.x - a.x, b.y - a.y) || 1
  return { x: -(b.y - a.y) / length, y: (b.x - a.x) / length }
}

function boundsOf(points: Point[]): SurfaceBox {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const left = Math.min(...xs)
  const top = Math.min(...ys)
  return surfaceBox(left, top, Math.max(...xs) - left, Math.max(...ys) - top)
}

/** Stroke the first `drawn` (0..1) of a line, by length; an arrow grows its head over the last part. */
function stroke(ctx: CanvasRenderingContext2D, points: Point[], drawn: number, color: string, width: number, head: boolean): void {
  if (drawn <= 0 || points.length < 2) return
  const lengths = [0]
  for (let k = 1; k < points.length; k++) lengths.push(lengths[k - 1] + Math.hypot(points[k].x - points[k - 1].x, points[k].y - points[k - 1].y))
  const total = lengths[lengths.length - 1]
  const reach = total * Math.min(1, drawn / (head ? 0.85 : 1))
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let k = 1; k < points.length; k++) {
    if (lengths[k] <= reach) {
      ctx.lineTo(points[k].x, points[k].y)
      continue
    }
    const t = (reach - lengths[k - 1]) / (lengths[k] - lengths[k - 1] || 1)
    ctx.lineTo(points[k - 1].x + (points[k].x - points[k - 1].x) * t, points[k - 1].y + (points[k].y - points[k - 1].y) * t)
    break
  }
  ctx.stroke()
  if (!head || drawn <= 0.85) return
  const grown = (drawn - 0.85) / 0.15
  const tip = points[points.length - 1]
  const back = points[points.length - 3] ?? points[0]
  const angle = Math.atan2(tip.y - back.y, tip.x - back.x)
  const size = width * 4.5 * grown
  ctx.beginPath()
  for (const side of [-1, 1]) {
    ctx.moveTo(tip.x, tip.y)
    ctx.lineTo(tip.x - Math.cos(angle + side * 0.45) * size, tip.y - Math.sin(angle + side * 0.45) * size)
  }
  ctx.stroke()
}

/** Clip away the part of `box` an eraser has wiped, left to right (0 nothing, 1 all of it). */
function wipe(ctx: CanvasRenderingContext2D, box: SurfaceBox, erased: number): void {
  if (erased <= 0) return
  const margin = 8
  ctx.beginPath()
  ctx.rect(box.left - margin + erased * (box.width + margin * 2), box.top - margin * 4, (1 - erased) * (box.width + margin * 2), box.height + margin * 8)
  ctx.clip()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Descriptions for a board's props, by the pattern of their names. */
function describeBoardProps(names: string[]): Record<string, PropertyInfo> {
  const patterns: Array<[RegExp, PropertyInfo]> = [
    [/^text\..+\.write$/, { description: 'How much of the text is written', unit: '0..1', min: 0, max: 1 }],
    [/^(text|mark)\..+\.erase$/, { description: 'How far it has been wiped off, left to right', unit: '0..1', min: 0, max: 1 }],
    [/^mark\..+\.draw$/, { description: 'How much of the mark is drawn', unit: '0..1', min: 0, max: 1 }],
    [/^strike\.\d+\.draw$/, { description: 'How far the strike-through has drawn', unit: '0..1', min: 0, max: 1 }],
    [/^piece\.\d+\.(x|y)$/, { description: 'The term moved from its home', unit: 'px' }],
    [/^piece\.\d+\.rotate$/, { description: 'The term turned', unit: 'degrees' }],
    [/^piece\.\d+\.opacity$/, { description: 'How opaque the term is', unit: '0..1', min: 0, max: 1 }],
    [/^piece\.\d+\.erase$/, { description: 'How far the term has been wiped off', unit: '0..1', min: 0, max: 1 }],
    [/^piece\.\d+\.write$/, { description: 'How much of the text written into its place is written', unit: '0..1', min: 0, max: 1 }],
  ]
  const out: Record<string, PropertyInfo> = {}
  for (const name of names) {
    const match = patterns.find(([pattern]) => pattern.test(name))
    if (match) out[name] = match[1]
  }
  return out
}
