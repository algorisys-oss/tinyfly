import type { CustomTarget } from '../adapters/canvas/canvas-adapter'
import type { PropertyInfo } from '../adapters/canvas/target-properties'
import { unknownName } from '../engine/authoring/did-you-mean'
import type { Track } from '../engine/types'
import { changingWindows, editLog, valueAt, type EditOptions } from './surface/edit-log'
import { pieceMotion, SAMPLE_STEP, type FlingOptions, type SurfacePiece, type TimedPoint } from './surface/pieces'
import { rideFloors } from './surface/ride'
import { anchorError, editError, parseAnchor, type Surface, type SurfaceAbout, type SurfaceEditOptions } from './surface/surface'
import { surfaceBox, type SurfaceBox } from './surface/surface-box'

/**
 * A code listing as a scene object characters can act on: they stand on its
 * lines, point at its tokens and swipe lines away.
 *
 * ```ts
 * const code = codePanel({ code: source, language: 'go', x: 40, y: 30 })
 * const line = code.line(7)                    // where line 7 is: stand on line.top, point at its centre
 * const word = code.token(7, 'Println')        // where a word on it is
 * code.highlight(7, { at: 1200 })              // timed edits, in ms
 * code.remove(7, { at: 2400, duration: 300, from: 'right' })
 * const scene = { targets: { code: code.target, hero }, tracks: [...code.tracks('code'), ...script.tracks] }
 * ```
 *
 * Layout is fixed-width arithmetic (characters are `charWidth` em wide, lines
 * `lineHeight` em apart), never measured from a font, so anchors are the same
 * in a browser, a worker or a build script. Lines are numbered from 1, as an
 * editor numbers them. Edits are recorded on the panel and written out by
 * `tracks()` as plain keyframes on the panel's props: `line.N.highlight`,
 * `line.N.strike`, `line.N.wipe`, `line.N.reveal` and `line.N.shift`.
 *
 * Words can come loose: `piece(n, text)` makes a word a piece that can be
 * carried (`follow` a path, such as a hand's), thrown or kicked away
 * (`fling`), moved (`move`), and replaced by typing new text into its place
 * (`write`), or dropped into another line (`drop`). Pieces animate
 * `piece.K.x`, `.y` (offsets from home), `.rotate`, `.opacity`, `.write` and
 * `.away` (its old place closing). New text can be typed into a line
 * (`insert`); an insert or a drop opens room in its line (`insert.K.open`,
 * `insert.K.type`).
 */

export type CodeLanguage = 'go' | 'rust' | 'csharp' | 'javascript' | 'typescript' | 'python' | 'plain'

export interface CodeTheme {
  background: string
  gutter: string
  text: string
  keyword: string
  string: string
  number: string
  comment: string
  highlight: string
  strike: string
  font: string
}

export const CODE_THEME: CodeTheme = {
  background: '#1e1e2e',
  gutter: '#6c7086',
  text: '#cdd6f4',
  keyword: '#cba6f7',
  string: '#a6e3a1',
  number: '#fab387',
  comment: '#7f849c',
  highlight: 'rgba(249, 226, 175, 0.22)',
  strike: '#f38ba8',
  font: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
}

export interface CodePanelOptions {
  code: string
  language?: CodeLanguage
  /** Top-left corner of the panel, scene px */
  x: number
  y: number
  /** px (default 16) */
  fontSize?: number
  /** Line spacing, em (default 1.6) */
  lineHeight?: number
  /** Width of a character, em (default 0.6, which most monospace fonts are) */
  charWidth?: number
  /** Inside the panel's edge, px (default 12) */
  padding?: number
  /** Show line numbers (default true) */
  lineNumbers?: boolean
  /** Panel width, px (default: fits the longest line) */
  width?: number
  /** Lines that start hidden, to be typed in with `type()` */
  hidden?: number[]
  theme?: Partial<CodeTheme>
}

/** A place on the panel, scene px. Stand on `top`; point at `x`, `y` (the centre). */
export type CodeBox = SurfaceBox

export type CodeEditOptions = EditOptions

export type { TimedPoint }

/** How a removed line goes: wiped away, knocked off the panel, or out of focus. */
export type CodeRemoveStyle = 'wipe' | 'fly' | 'blur'
export const REMOVE_STYLES: readonly CodeRemoveStyle[] = ['wipe', 'fly', 'blur']

export interface CodeRemoveOptions extends CodeEditOptions {
  /** `wipe` (default) erases it from one side; `fly` knocks it off the panel, blurring as it goes; `blur` fades it out of focus where it is */
  style?: CodeRemoveStyle
  /** The side the wipe starts from, or the side `fly` knocks it from (default left: it flies right) */
  from?: 'left' | 'right'
  /** How long the lines below take to close the gap, ms (default 250) */
  close?: number
}

/** A word that can come loose from its line: made by `piece()`. Its `home` is where it sits in its line. */
export interface CodePiece extends SurfacePiece {
  readonly line: number
  readonly column: number
  readonly text: string
}

export type CodeFlingOptions = FlingOptions

export interface CodePanel extends Surface {
  readonly kind: 'code'
  /** The canvas target that draws the panel; put it in the scene's targets */
  readonly target: CustomTarget
  readonly lines: readonly string[]
  /** The whole panel */
  readonly box: CodeBox
  /** Where line `n`'s text is (its width is the text's, at least one character). At `time`, after the gaps of removed lines have closed. */
  line(n: number, time?: number): CodeBox
  /** Where the `occurrence`th `text` on line `n` is (default the first) */
  token(n: number, text: string, occurrence?: number, time?: number): CodeBox
  /** Tint a line, or clear it with `on: false` */
  highlight(n: number | number[], options: CodeEditOptions & { on?: boolean }): CodePanel
  /** Strike a line through, left to right */
  strike(n: number | number[], options: CodeEditOptions): CodePanel
  /** Wipe lines away, then close the gap: the lines below move up */
  remove(n: number | number[], options: CodeRemoveOptions): CodePanel
  /** Type a hidden line in, character by character */
  type(n: number, options: CodeEditOptions): CodePanel
  /** Make the `occurrence`th `text` on line `n` a piece that can come loose */
  piece(n: number, text: string, occurrence?: number): CodePiece
  /** Make the word at a token anchor (`token:7:Println`) a piece that can come loose */
  piece(anchor: string): CodePiece
  /** The box at a named place: `box`, `line:N`, `token:N:TEXT` (`token:N#K:TEXT` for the Kth), `spot:N:C` or `spot:N:C:W` */
  anchor(name: string, time?: number): CodeBox
  /** Change the panel at a time by name, at named places (see `CODE_SURFACE.edits`): `edit('highlight', 'line:4', { at: 1200 })` */
  edit(name: string, anchor: string | string[], options: SurfaceEditOptions): CodePanel
  /** Carry a piece along a path of scene points (its centre follows them) */
  follow(piece: CodePiece, path: TimedPoint[]): CodePanel
  /** Throw or kick a piece away: it flies on a ballistic arc, spinning, and fades */
  fling(piece: CodePiece, options: CodeFlingOptions): CodePanel
  /** Move a piece's centre to a scene point (back home: its `home` centre) */
  move(piece: CodePiece, options: CodeEditOptions & { to: { x: number; y: number } }): CodePanel
  /** Type new text into a piece's place in its line; the rest of the line makes room */
  write(piece: CodePiece, text: string, options: CodeEditOptions): CodePanel
  /**
   * A place in line `n`: `width` characters (default 1) starting at `column`
   * (0 is before its first character, its length just past its end), after
   * any room inserts before it have opened. Aim a `put` or a `write` here.
   */
  spot(n: number, column: number, width?: number, time?: number): CodeBox
  /** Type new text into line `n` before `column`; the rest of the line makes room as it is typed */
  insert(n: number, column: number, text: string, options: CodeEditOptions): CodePanel
  /**
   * Put a piece into line `n` before `column`: it moves there as the line
   * opens room for it, and its old place closes. Into its own line, it slides
   * along (linear by default) and the text it passes closes up behind it.
   */
  drop(piece: CodePiece, n: number, column: number, options: CodeEditOptions): CodePanel
  /** Where a piece dropped into line `n` before `column` would land (its own line closes up behind it) */
  landing(piece: CodePiece, n: number, column: number, time?: number): CodeBox
  /**
   * A figure's tracks with it carried along by the line it stands on: while
   * its feet are on a line's top (as laid out, before any gaps closed), its
   * `y` moves with that line. `ground` is the script's `ground`.
   */
  ride(tracks: Track[], target: string, options: { ground: number; every?: number }): Track[]
  /** The recorded edits as tracks on `target` (the panel's key in the scene) */
  tracks(target: string): Track[]
}

/** A named place on a code panel, parsed. */
type CodeAnchor =
  | { kind: 'box' }
  | { kind: 'line'; n: number }
  | { kind: 'token'; n: number; text: string; occurrence: number }
  | { kind: 'spot'; n: number; column: number; width: number }

/** A code panel's anchors and edits, as data: for its `about`, the capability catalog and the checks. */
export const CODE_SURFACE: SurfaceAbout = {
  kind: 'code',
  create: 'codePanel({ code, language?, x, y, fontSize?, lineHeight?, width?, hidden? })',
  anchors: {
    box: 'the whole panel',
    'line:N': 'line N’s text (lines count from 1): stand on top, point at x, y, swipe left to right',
    'token:N:TEXT': 'the first TEXT on line N (token:N#K:TEXT for the Kth): a word, which can come loose as a piece',
    'spot:N:C': 'a place in line N before column C (0 is before its first character); spot:N:C:W is W characters wide. Aim a put or a write here',
  },
  edits: {
    highlight: 'line anchors; { at, duration?, on? }: tint lines (on: false clears)',
    strike: 'line anchors; { at, duration? }: strike lines through, left to right',
    remove: 'line anchors; { at, duration?, style?: wipe | fly | blur, from?: left | right, close? }: take lines away; the lines below close the gap',
    type: 'line anchors given in `hidden`; { at, duration? }: type them in',
    insert: 'a spot; { at, text, duration? }: type new text into the line there; the line makes room',
    write: 'a token; { at, text, duration? }: write new text into the word’s place',
    drop: 'a token; { at, into: a spot, duration? }: put the word into a line there',
    move: 'a token; { at, to: an anchor name or { x, y }, duration? }: move the word there',
    fling: 'a token; { at, velocity?, spin?, gravity?, duration? }: throw or kick the word away on a spinning arc',
  },
}

/** How far a `fly` removal throws the line, as a fraction of the panel width, and its blur at the end, px. */
const FLY_DISTANCE = 0.9
const MAX_BLUR = 8

export function codePanel(options: CodePanelOptions): CodePanel {
  const theme = { ...CODE_THEME, ...options.theme }
  const lines = options.code.replace(/\t/g, '    ').replace(/\n$/, '').split('\n')
  const fontSize = options.fontSize ?? 16
  const lineHeight = (options.lineHeight ?? 1.6) * fontSize
  const charWidth = (options.charWidth ?? 0.6) * fontSize
  const padding = options.padding ?? 12
  const gutter = options.lineNumbers === false ? 0 : (String(lines.length).length + 2) * charWidth
  const longest = Math.max(1, ...lines.map((line) => line.length))
  const width = options.width ?? padding * 2 + gutter + longest * charWidth
  const height = padding * 2 + lines.length * lineHeight
  const textLeft = options.x + padding + gutter
  const hidden = new Set(options.hidden ?? [])
  const language = options.language ?? 'plain'
  if (!CODE_LANGUAGES.includes(language)) throw new Error(`codePanel: ${unknownName('language', language, CODE_LANGUAGES)}`)
  /** Each line's colour per column. */
  const colours = lines.map((line) => codeTokens(line, language).flatMap((token) => Array.from(token.text, () => theme[token.kind])))

  const log = editLog()
  const motion = pieceMotion(log)
  /** Lines removed, and when their gap has closed. */
  const removals: Array<{ line: number; closed: number }> = []
  /** How each removed line goes, and from which side. */
  const removeStyle = new Map<number, { style: CodeRemoveStyle; from: 'left' | 'right' }>()
  const pieces: Array<CodePiece & { written?: string }> = []
  /** Room opened in a line: typed text, or the place a dropped piece lands. */
  const inserts: Array<{ id: number; line: number; column: number; chars: number; text?: string; at: number }> = []

  const check = (n: number) => {
    if (!Number.isInteger(n) || n < 1 || n > lines.length) throw new Error(`codePanel: no line ${n} (it has ${lines.length})`)
  }
  const tween = log.tween
  const lastValue = log.last
  const record = (n: number, field: string, from: number, to: number, edit: CodeEditOptions, defaultDuration = 300) => {
    check(n)
    tween(`line.${n}.${field}`, from, to, edit, defaultDuration)
  }
  /** Rows line `n` has moved up by at `time` (the closed gaps above it). */
  const rowsUp = (n: number, time: number) => removals.filter((r) => r.line < n && r.closed <= time).length
  const box = surfaceBox

  const lineTop = (n: number) => options.y + padding + (n - 1) * lineHeight
  const all = (n: number | number[]) => (Array.isArray(n) ? n : [n])
  const columnOf = (n: number, text: string, occurrence: number) => {
    let column = -1
    for (let k = 0; k < occurrence; k++) {
      column = lines[n - 1].indexOf(text, column + 1)
      if (column < 0) throw new Error(`codePanel: line ${n} has no ${occurrence > 1 ? `${occurrence}th ` : ''}"${text}"`)
    }
    return column
  }

  const props: Record<string, number> = {}
  lines.forEach((_, i) => {
    const n = i + 1
    props[`line.${n}.highlight`] = 0
    props[`line.${n}.strike`] = 0
    props[`line.${n}.wipe`] = 0
    props[`line.${n}.reveal`] = hidden.has(n) ? 0 : 1
    props[`line.${n}.shift`] = 0
  })

  const target: CustomTarget = {
    type: 'custom',
    x: options.x,
    y: options.y,
    width,
    height,
    props,
    about: {
      kind: 'code panel',
      summary: `${lines.length} lines of ${language} code. Its lines and words are places in the scene (line(), token(), spot()); its edits are methods that record tracks (tracks()).`,
      // Pieces and inserts add props as they are made; these describe them by pattern.
      get props() {
        return describeCodeProps(Object.keys(props))
      },
      actions: CODE_PANEL_EDITS,
    },
    draw(ctx, self) {
      const values = (self.props ?? {}) as Record<string, number>
      const read = (key: string) => Number(values[key] ?? props[key])
      const left = padding + gutter
      const rowTop = (n: number) => padding + (n - 1) * lineHeight - read(`line.${n}.shift`) * lineHeight
      ctx.fillStyle = theme.background
      roundRect(ctx, 0, 0, width, height, 8)
      ctx.fill()
      ctx.font = `${fontSize}px ${theme.font}`
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'left'
      /** Characters of line `n` from `start` to `end`, drawn from x, with the line's colours. */
      const text = (n: number, start: number, end: number, x: number, middle: number) => {
        const line = lines[n - 1]
        for (let column = start; column < end; column++) {
          if (line[column] === ' ') continue
          ctx.fillStyle = colours[n - 1][column]
          ctx.fillText(line[column], x + (column - start) * charWidth, middle)
        }
      }
      // The panel clips what it draws: a line knocked off it, or a piece thrown out, leaves at the edge.
      ctx.save()
      roundRect(ctx, 0, 0, width, height, 8)
      ctx.clip()

      lines.forEach((line, i) => {
        const n = i + 1
        const gone = read(`line.${n}.wipe`)
        if (gone >= 1) return
        const top = rowTop(n)
        const middle = top + lineHeight / 2
        const textWidth = Math.max(1, line.length) * charWidth
        const shown = Math.round(read(`line.${n}.reveal`) * line.length)
        const how = removeStyle.get(n) ?? { style: 'wipe', from: 'left' }
        ctx.save()
        if (gone > 0) leaving(ctx, how, gone, { left: left - gutter, top, width: gutter + textWidth + charWidth, height: lineHeight }, width)
        const tint = read(`line.${n}.highlight`)
        if (tint > 0) {
          ctx.globalAlpha *= Math.min(1, tint)
          ctx.fillStyle = theme.highlight
          ctx.fillRect(left - charWidth / 2, top, textWidth + charWidth, lineHeight)
          ctx.globalAlpha /= Math.min(1, tint)
        }
        if (gutter > 0 && shown > 0) {
          ctx.fillStyle = theme.gutter
          ctx.textAlign = 'right'
          ctx.fillText(String(n), left - charWidth, middle)
          ctx.textAlign = 'left'
        }
        // The line in runs between its slots: a piece leaves a gap (or what was written there, or closes
        // once it has gone elsewhere), and an insert opens room (typing its text in); the rest moves to make room.
        const slots = [
          ...pieces.filter((p) => p.line === n).map((piece) => ({ column: piece.column, length: piece.text.length, piece, insert: undefined })),
          ...inserts.filter((r) => r.line === n).map((insert) => ({ column: insert.column, length: 0, piece: undefined, insert })),
        ].sort((a, b) => a.column - b.column || a.length - b.length)
        let column = 0
        let x = left
        for (const slot of slots) {
          text(n, column, Math.min(slot.column, shown), x, middle)
          x += (slot.column - column) * charWidth
          let room = slot.length
          let typed = ''
          if (slot.piece) {
            const written = slot.piece.written ?? ''
            const progress = read(`piece.${slot.piece.id}.write`)
            if (written && progress > 0) {
              typed = written.slice(0, Math.round(progress * written.length))
              room = slot.length + (written.length - slot.length) * Math.min(1, progress * 2)
            } else room = slot.length * (1 - read(`piece.${slot.piece.id}.away`))
          } else if (slot.insert) {
            room = slot.insert.chars * read(`insert.${slot.insert.id}.open`)
            if (slot.insert.text) typed = slot.insert.text.slice(0, Math.round(read(`insert.${slot.insert.id}.type`) * slot.insert.text.length))
          }
          ctx.fillStyle = theme.text
          for (let k = 0; k < typed.length; k++) if (typed[k] !== ' ') ctx.fillText(typed[k], x + k * charWidth, middle)
          x += room * charWidth
          column = slot.column + slot.length
        }
        text(n, column, Math.max(column, shown), x, middle)
        const strike = read(`line.${n}.strike`)
        if (strike > 0) {
          ctx.strokeStyle = theme.strike
          ctx.lineWidth = Math.max(1.5, fontSize / 10)
          ctx.beginPath()
          ctx.moveTo(left, middle)
          ctx.lineTo(left + textWidth * Math.min(1, strike), middle)
          ctx.stroke()
        }
        ctx.restore()
      })

      // Pieces draw over the lines, at home in their line unless carried, thrown or moved.
      for (const piece of pieces) {
        const opacity = read(`piece.${piece.id}.opacity`)
        if (opacity <= 0 || read(`line.${piece.line}.wipe`) >= 1) continue
        const cx = left + (piece.column + piece.text.length / 2) * charWidth + read(`piece.${piece.id}.x`)
        const cy = rowTop(piece.line) + lineHeight / 2 + read(`piece.${piece.id}.y`)
        ctx.save()
        ctx.globalAlpha = Math.min(1, opacity)
        ctx.translate(cx, cy)
        ctx.rotate((read(`piece.${piece.id}.rotate`) * Math.PI) / 180)
        text(piece.line, piece.column, piece.column + piece.text.length, (-piece.text.length * charWidth) / 2, 0)
        ctx.restore()
      }
      ctx.restore()
    },
  }

  /** A named place on the panel, parsed (lines are checked when it is used). */
  const named = (name: string): CodeAnchor => {
    const { kind, rest } = parseAnchor(name)
    const fail = (why?: string) => anchorError('codePanel', name, CODE_SURFACE, why)
    if (kind === 'box') {
      if (rest) throw fail('box takes no arguments')
      return { kind }
    }
    if (kind === 'line') {
      if (!/^\d+$/.test(rest)) throw fail('write it line:N')
      return { kind, n: Number(rest) }
    }
    if (kind === 'token') {
      const match = /^(\d+)(?:#(\d+))?:(.+)$/.exec(rest)
      if (!match) throw fail('write it token:N:TEXT, or token:N#K:TEXT for the Kth')
      return { kind, n: Number(match[1]), occurrence: match[2] ? Number(match[2]) : 1, text: match[3] }
    }
    if (kind === 'spot') {
      const match = /^(\d+):(\d+)(?::(\d+))?$/.exec(rest)
      if (!match) throw fail('write it spot:N:C, or spot:N:C:W for W characters')
      return { kind, n: Number(match[1]), column: Number(match[2]), width: match[3] ? Number(match[3]) : 1 }
    }
    throw fail()
  }
  /** The places named, each of `kind`. */
  const namedAll = <K extends CodeAnchor['kind']>(edit: string, names: string | string[], kind: K, one = false) => {
    const list = Array.isArray(names) ? names : [names]
    if (list.length === 0 || (one && list.length > 1)) throw new Error(`codePanel.edit: ${edit} takes ${one ? 'one' : 'at least one'} ${kind} anchor`)
    return list.map((name) => {
      const anchor = named(name)
      if (anchor.kind !== kind) throw new Error(`codePanel.edit: ${edit} takes ${kind} anchors (${kind}:…), not "${name}"`)
      return anchor as Extract<CodeAnchor, { kind: K }>
    })
  }
  const text = (edit: string, options: SurfaceEditOptions) => {
    if (typeof options.text !== 'string') throw new Error(`codePanel.edit: ${edit} needs \`text\` (the text to write)`)
    return options.text
  }

  const panel: CodePanel = {
    kind: 'code',
    about: CODE_SURFACE,
    target,
    lines,
    box: box(options.x, options.y, width, height),
    line(n, time = Infinity) {
      check(n)
      return box(textLeft, lineTop(n) - rowsUp(n, time) * lineHeight, Math.max(1, lines[n - 1].length) * charWidth, lineHeight)
    },
    token(n, text, occurrence = 1, time = Infinity) {
      check(n)
      const column = columnOf(n, text, occurrence)
      return box(textLeft + column * charWidth, lineTop(n) - rowsUp(n, time) * lineHeight, text.length * charWidth, lineHeight)
    },
    highlight(n, edit) {
      for (const line of all(n)) {
        const was = lastValue(`line.${line}.highlight`, 0)
        record(line, 'highlight', was, edit.on === false ? 0 : 1, edit, 200)
      }
      return panel
    },
    strike(n, edit) {
      for (const line of all(n)) record(line, 'strike', lastValue(`line.${line}.strike`, 0), 1, edit)
      return panel
    },
    remove(n, edit) {
      const removed = all(n)
      const style = edit.style ?? 'wipe'
      if (!REMOVE_STYLES.includes(style)) throw new Error(`codePanel.remove: ${unknownName('style', style, REMOVE_STYLES)}`)
      const defaultDuration = style === 'wipe' ? 300 : 450
      const wiped = edit.at + (edit.duration ?? defaultDuration)
      const close = edit.close ?? 250
      for (const line of removed) {
        record(line, 'wipe', 0, 1, { ...edit, easing: edit.easing ?? (style === 'fly' ? 'ease-in' : undefined) }, defaultDuration)
        removeStyle.set(line, { style, from: edit.from ?? 'left' })
        removals.push({ line, closed: wiped + close })
      }
      // Every line below moves up by the removed lines above it.
      for (let line = 1; line <= lines.length; line++) {
        if (removed.includes(line)) continue
        const above = removed.filter((r) => r < line).length
        if (above === 0) continue
        const was = lastValue(`line.${line}.shift`, 0)
        record(line, 'shift', was, was + above, { at: wiped, duration: close, easing: 'ease-in-out' })
      }
      return panel
    },
    type(n, edit) {
      record(n, 'reveal', 0, 1, { duration: lines[n - 1].length * 45, ...edit })
      return panel
    },
    piece(at: number | string, text?: string, occurrence: number = 1) {
      if (typeof at === 'string') {
        const anchor = named(at)
        if (anchor.kind !== 'token') throw new Error(`codePanel.piece: a piece is a word, token:N:TEXT, not "${at}"`)
        return panel.piece(anchor.n, anchor.text, anchor.occurrence)
      }
      const n = at
      if (text === undefined) throw new Error('codePanel.piece: which word? piece(n, text) or piece("token:N:TEXT")')
      check(n)
      const column = columnOf(n, text, occurrence)
      const existing = pieces.find((p) => p.line === n && p.column === column && p.text === text)
      if (existing) return existing
      if (pieces.some((p) => p.line === n && column < p.column + p.text.length && p.column < column + text.length))
        throw new Error(`codePanel: "${text}" on line ${n} overlaps another piece`)
      const piece = { id: pieces.length + 1, line: n, column, text, home: panel.token(n, text, occurrence, 0) }
      pieces.push(piece)
      for (const field of ['x', 'y', 'rotate', 'write', 'away']) props[`piece.${piece.id}.${field}`] = 0
      props[`piece.${piece.id}.opacity`] = 1
      return piece
    },
    follow(piece, path) {
      motion.follow(piece, path)
      return panel
    },
    fling(piece, fling) {
      motion.fling(piece, fling)
      return panel
    },
    move(piece, edit) {
      motion.move(piece, edit)
      return panel
    },
    write(piece, text, edit) {
      ;(piece as CodePiece & { written?: string }).written = text
      tween(`piece.${piece.id}.write`, 0, 1, { duration: Math.max(1, text.length) * 70, ...edit })
      return panel
    },
    spot(n, column, chars = 1, time = Infinity) {
      check(n)
      // Room opened before this column by inserts made by `time`.
      const opened = inserts.filter((r) => r.line === n && r.column <= column && r.at <= time).reduce((sum, r) => sum + r.chars, 0)
      return box(textLeft + (column + opened) * charWidth, lineTop(n) - rowsUp(n, time) * lineHeight, chars * charWidth, lineHeight)
    },
    insert(n, column, text, edit) {
      check(n)
      const insert = { id: inserts.length + 1, line: n, column, chars: text.length, text, at: edit.at }
      inserts.push(insert)
      props[`insert.${insert.id}.open`] = 0
      props[`insert.${insert.id}.type`] = 0
      const duration = edit.duration ?? text.length * 70
      // Room opens a little ahead of the typing, so letters never land on the text after them.
      tween(`insert.${insert.id}.open`, 0, 1, { at: edit.at, duration: duration * 0.6, easing: 'ease-out' })
      tween(`insert.${insert.id}.type`, 0, 1, { at: edit.at, duration })
      return panel
    },
    drop(piece, n, column, edit) {
      check(n)
      const duration = edit.duration ?? 250
      // Along its own line the room it leaves and the room it lands in change together, at the slide's pace.
      const sameLine = n === piece.line
      const easing = edit.easing ?? (sameLine ? 'linear' : 'ease-out')
      const landing = panel.landing(piece, n, column, edit.at)
      const insert = { id: inserts.length + 1, line: n, column, chars: piece.text.length, at: edit.at }
      inserts.push(insert)
      props[`insert.${insert.id}.open`] = 0
      tween(`insert.${insert.id}.open`, 0, 1, { at: edit.at, duration, easing: sameLine ? easing : 'ease-out' })
      tween(`piece.${piece.id}.away`, lastValue(`piece.${piece.id}.away`, 0), 1, { at: edit.at, duration, easing: sameLine ? easing : 'ease-in-out' })
      motion.cutAfter(piece, edit.at)
      panel.move(piece, { at: edit.at, duration, easing, to: { x: landing.x, y: landing.y } })
      tween(`piece.${piece.id}.rotate`, log.valueAt(`piece.${piece.id}.rotate`, edit.at), 0, { at: edit.at, duration })
      return panel
    },
    landing(piece, n, column, time = Infinity) {
      const spot = panel.spot(n, column, piece.text.length, time)
      // Further along its own line, everything after its old place has moved back to close it.
      const closed = n === piece.line && column > piece.column ? piece.text.length * charWidth : 0
      return box(spot.left - closed, spot.top, spot.width, spot.height)
    },
    ride(tracks, target, ride) {
      const floors = lines.map((_, i) => {
        const shifts = log.keys(`line.${i + 1}.shift`) ?? []
        return { top: lineTop(i + 1), offset: (time: number) => -valueAt(shifts, time) * lineHeight, windows: changingWindows(shifts) }
      })
      return rideFloors(tracks, target, { ground: ride.ground, every: ride.every ?? SAMPLE_STEP, floors })
    },
    tracks: log.tracks,
    anchor(name, time = Infinity) {
      const anchor = named(name)
      if (anchor.kind === 'box') return panel.box
      if (anchor.kind === 'line') return panel.line(anchor.n, time)
      if (anchor.kind === 'token') return panel.token(anchor.n, anchor.text, anchor.occurrence, time)
      return panel.spot(anchor.n, anchor.column, anchor.width, time)
    },
    edit(name, anchors, options) {
      const lineNumbers = () => namedAll(name, anchors, 'line').map((anchor) => anchor.n)
      if (name === 'highlight') return panel.highlight(lineNumbers(), options)
      if (name === 'strike') return panel.strike(lineNumbers(), options)
      if (name === 'remove') return panel.remove(lineNumbers(), options as CodeRemoveOptions)
      if (name === 'type') {
        for (const n of lineNumbers()) panel.type(n, options)
        return panel
      }
      if (name === 'insert') {
        const [spot] = namedAll(name, anchors, 'spot', true)
        return panel.insert(spot.n, spot.column, text(name, options), options)
      }
      if (name === 'write' || name === 'drop' || name === 'move' || name === 'fling') {
        const [token] = namedAll(name, anchors, 'token', true)
        const word = panel.piece(token.n, token.text, token.occurrence)
        if (name === 'write') return panel.write(word, text(name, options), options)
        if (name === 'fling') return panel.fling(word, options as CodeFlingOptions)
        if (name === 'drop') {
          const into = typeof options.into === 'string' ? named(options.into) : undefined
          if (into?.kind !== 'spot') throw new Error('codePanel.edit: drop needs `into`, a spot anchor (spot:N:C)')
          return panel.drop(word, into.n, into.column, options)
        }
        const to = typeof options.to === 'string' ? panel.anchor(options.to, options.at) : (options.to as { x: number; y: number } | undefined)
        if (!to || typeof to.x !== 'number' || typeof to.y !== 'number') throw new Error('codePanel.edit: move needs `to`, an anchor name or { x, y }')
        return panel.move(word, { ...options, to })
      }
      throw editError('codePanel', name, CODE_SURFACE)
    },
  }

  return panel
}

/**
 * Clip, move and blur a row on its way out, by how far it has gone (0..1):
 * `wipe` erases it from one side, `fly` knocks it off sideways as it blurs
 * and fades, `blur` takes it out of focus where it is.
 */
function leaving(
  ctx: CanvasRenderingContext2D,
  how: { style: CodeRemoveStyle; from: 'left' | 'right' },
  gone: number,
  row: { left: number; top: number; width: number; height: number },
  panelWidth: number
): void {
  if (how.style === 'wipe') {
    ctx.beginPath()
    if (how.from === 'right') ctx.rect(row.left, row.top, row.width * (1 - gone), row.height)
    else ctx.rect(row.left + gone * row.width, row.top, row.width * (1 - gone), row.height)
    ctx.clip()
    return
  }
  const blur = MAX_BLUR * gone
  if (blur > 0.2 && 'filter' in ctx) ctx.filter = `blur(${blur.toFixed(1)}px)`
  ctx.globalAlpha *= 1 - gone
  if (how.style === 'fly') {
    // A shove: it slides off the way it was pushed, tipping a little as it goes.
    const direction = how.from === 'right' ? -1 : 1
    ctx.translate(direction * gone * FLY_DISTANCE * panelWidth, 0)
    ctx.rotate(direction * gone * 0.08)
  } else {
    // Out of focus: it swells a little about its middle as it fades.
    const scale = 1 + 0.08 * gone
    const cx = row.left + row.width / 2
    const cy = row.top + row.height / 2
    ctx.translate(cx, cy)
    ctx.scale(scale, scale)
    ctx.translate(-cx, -cy)
  }
}

/** What a code panel's methods do, for its `about` and the capability catalog. */
export const CODE_PANEL_EDITS: Record<string, string> = {
  highlight: 'highlight(n | n[], { at, duration?, on? }): tint lines (on: false clears)',
  strike: 'strike(n | n[], { at, duration? }): strike lines through, left to right',
  remove: 'remove(n | n[], { at, duration?, style?: wipe | fly | blur, from?: left | right, close? }): take lines away; the lines below close the gap',
  type: 'type(n, { at, duration? }): type in a line given in `hidden`',
  piece: 'piece(n, text, occurrence?): make a word a piece that can come loose (returns it, with its home box)',
  follow: 'follow(piece, path): carry a piece along timed points (handPath() gives a hand’s)',
  fling: 'fling(piece, { at, velocity?, spin?, gravity?, duration? }): throw or kick a piece away on a spinning arc',
  move: 'move(piece, { at, to: { x, y }, duration?, easing? }): move a piece’s centre to a point',
  write: 'write(piece, text, { at, duration? }): type new text into a piece’s place',
  insert: 'insert(n, column, text, { at, duration? }): type new text into a line; the line makes room',
  drop: 'drop(piece, n, column, { at, duration? }): put a piece into a line (into its own line it slides, the text closing behind it)',
  ride: 'ride(tracks, figureId, { ground }): a figure’s tracks with it carried by the line it stands on',
}

/** Descriptions for a code panel's props, by the pattern of their names. */
function describeCodeProps(names: string[]): Record<string, PropertyInfo> {
  const patterns: Array<[RegExp, PropertyInfo]> = [
    [/^line\.\d+\.highlight$/, { description: 'How much the line is tinted', unit: '0..1', min: 0, max: 1 }],
    [/^line\.\d+\.strike$/, { description: 'How far the strike-through has drawn', unit: '0..1', min: 0, max: 1 }],
    [/^line\.\d+\.wipe$/, { description: 'How far the line has gone (wiped, flown off or blurred)', unit: '0..1', min: 0, max: 1 }],
    [/^line\.\d+\.reveal$/, { description: 'How much of the line is typed in', unit: '0..1', min: 0, max: 1 }],
    [/^line\.\d+\.shift$/, { description: 'How many rows the line has moved up', unit: 'rows' }],
    [/^piece\.\d+\.(x|y)$/, { description: 'The piece moved from its home', unit: 'px' }],
    [/^piece\.\d+\.rotate$/, { description: 'The piece turned', unit: 'degrees' }],
    [/^piece\.\d+\.opacity$/, { description: 'How opaque the piece is', unit: '0..1', min: 0, max: 1 }],
    [/^piece\.\d+\.write$/, { description: 'How much of the text written into its place is typed', unit: '0..1', min: 0, max: 1 }],
    [/^piece\.\d+\.away$/, { description: 'How far its old place has closed', unit: '0..1', min: 0, max: 1 }],
    [/^insert\.\d+\.open$/, { description: 'How much room the insert has opened', unit: '0..1', min: 0, max: 1 }],
    [/^insert\.\d+\.type$/, { description: 'How much of the inserted text is typed', unit: '0..1', min: 0, max: 1 }],
  ]
  const out: Record<string, PropertyInfo> = {}
  for (const name of names) {
    const match = patterns.find(([pattern]) => pattern.test(name))
    if (match) out[name] = match[1]
  }
  return out
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

// --- syntax colours ---------------------------------------------------------

export interface CodeToken {
  text: string
  kind: 'text' | 'keyword' | 'string' | 'number' | 'comment'
}

const KEYWORDS: Record<CodeLanguage, string[]> = {
  go: ['break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else', 'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface', 'map', 'package', 'range', 'return', 'select', 'struct', 'switch', 'type', 'var', 'nil', 'true', 'false'],
  rust: ['as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'else', 'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while', 'Some', 'None', 'Ok', 'Err'],
  csharp: ['abstract', 'async', 'await', 'base', 'bool', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default', 'do', 'else', 'enum', 'false', 'finally', 'for', 'foreach', 'if', 'in', 'int', 'interface', 'internal', 'is', 'namespace', 'new', 'null', 'object', 'out', 'override', 'private', 'protected', 'public', 'readonly', 'ref', 'return', 'sealed', 'static', 'string', 'struct', 'switch', 'this', 'throw', 'true', 'try', 'using', 'var', 'virtual', 'void', 'while'],
  javascript: ['async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default', 'delete', 'do', 'else', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'null', 'of', 'return', 'static', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'undefined', 'var', 'void', 'while', 'yield'],
  typescript: [],
  python: ['and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'False', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'None', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'True', 'try', 'while', 'with', 'yield'],
  plain: [],
}
KEYWORDS.typescript = [...KEYWORDS.javascript, 'enum', 'interface', 'type', 'implements', 'private', 'public', 'readonly', 'keyof', 'as', 'declare', 'namespace']

/** The languages a code panel colours. */
export const CODE_LANGUAGES = Object.keys(KEYWORDS) as CodeLanguage[]

const LINE_COMMENT: Record<CodeLanguage, string | null> = {
  go: '//',
  rust: '//',
  csharp: '//',
  javascript: '//',
  typescript: '//',
  python: '#',
  plain: null,
}

/** Split one line into coloured runs: strings, line comments, numbers, keywords and the rest. */
export function codeTokens(line: string, language: CodeLanguage): CodeToken[] {
  const keywords = new Set(KEYWORDS[language])
  const comment = LINE_COMMENT[language]
  const out: CodeToken[] = []
  const push = (text: string, kind: CodeToken['kind']) => {
    const last = out[out.length - 1]
    if (last && last.kind === kind) last.text += text
    else out.push({ text, kind })
  }
  let i = 0
  while (i < line.length) {
    const char = line[i]
    if (language !== 'plain' && comment && line.startsWith(comment, i)) {
      push(line.slice(i), 'comment')
      break
    }
    if (language !== 'plain' && (char === '"' || char === "'" || char === '`')) {
      let end = i + 1
      while (end < line.length && line[end] !== char) end += line[end] === '\\' ? 2 : 1
      push(line.slice(i, end + 1), 'string')
      i = end + 1
      continue
    }
    const word = /^[A-Za-z_][A-Za-z0-9_]*/.exec(line.slice(i))
    if (word) {
      push(word[0], keywords.has(word[0]) ? 'keyword' : 'text')
      i += word[0].length
      continue
    }
    const number = /^\d[\d_.]*/.exec(line.slice(i))
    if (number && language !== 'plain') {
      push(number[0], 'number')
      i += number[0].length
      continue
    }
    push(char, 'text')
    i++
  }
  return out
}
