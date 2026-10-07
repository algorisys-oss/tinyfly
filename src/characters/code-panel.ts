import type { CustomTarget } from '../adapters/canvas/canvas-adapter'
import type { PropertyInfo } from '../adapters/canvas/target-properties'
import { unknownName } from '../engine/authoring/did-you-mean'
import { Timeline } from '../engine/core/timeline'
import type { EasingType, Keyframe, Track } from '../engine/types'

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
export interface CodeBox {
  x: number
  y: number
  left: number
  right: number
  top: number
  bottom: number
  width: number
  height: number
}

export interface CodeEditOptions {
  /** When the edit starts, ms */
  at: number
  /** ms (default 300) */
  duration?: number
  easing?: EasingType
}

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

/** A word that can come loose from its line: made by `piece()`. */
export interface CodePiece {
  /** Its key in the panel's props (`piece.K.x`…) */
  readonly id: number
  readonly line: number
  readonly column: number
  readonly text: string
  /** Where it sits in its line */
  readonly home: CodeBox
}

/** A point at a time, scene px: a path for a piece to follow (see `handPath`). */
export interface TimedPoint {
  time: number
  x: number
  y: number
}

export interface CodeFlingOptions {
  /** When it leaves, ms */
  at: number
  /** px/ms (default: how fast it was moving along its `follow` path at `at`, or up and to the right) */
  velocity?: { x: number; y: number }
  /** Turns, degrees per ms (default 0.6, signed by the throw's direction) */
  spin?: number
  /** px/ms² (default 0.0016) */
  gravity?: number
  /** How long it flies before it is gone, ms (default 900) */
  duration?: number
}

export interface CodePanel {
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

type Edit = { time: number; value: number; easing?: EasingType }

/** Gravity and spin of a fling, and how often its arc is sampled, ms. */
const FLING_GRAVITY = 0.0016
const FLING_SPIN = 0.6
const FLING_STEP = 33
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

  const edits = new Map<string, Edit[]>()
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
  const push = (key: string, ...keys: Edit[]) => edits.set(key, [...(edits.get(key) ?? []), ...keys])
  /** An edit from one value to another, as a start and an end key. */
  const tween = (key: string, from: number, to: number, edit: CodeEditOptions, defaultDuration = 300) =>
    push(key, { time: edit.at, value: from }, { time: edit.at + (edit.duration ?? defaultDuration), value: to, ...(edit.easing ? { easing: edit.easing } : {}) })
  const record = (n: number, field: string, from: number, to: number, edit: CodeEditOptions, defaultDuration = 300) => {
    check(n)
    tween(`line.${n}.${field}`, from, to, edit, defaultDuration)
  }
  /** Rows line `n` has moved up by at `time` (the closed gaps above it). */
  const rowsUp = (n: number, time: number) => removals.filter((r) => r.line < n && r.closed <= time).length
  const box = (left: number, top: number, w: number, h: number): CodeBox => ({
    x: left + w / 2,
    y: top + h / 2,
    left,
    right: left + w,
    top,
    bottom: top + h,
    width: w,
    height: h,
  })

  const lineTop = (n: number) => options.y + padding + (n - 1) * lineHeight
  const all = (n: number | number[]) => (Array.isArray(n) ? n : [n])
  const lastValue = (key: string, fallback: number) => {
    const list = edits.get(key)
    return list ? [...list].sort((a, b) => a.time - b.time)[list.length - 1].value : fallback
  }
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

  /** Where a piece's centre is at `time`, scene px, from its recorded x/y keys. */
  const pieceAt = (piece: CodePiece, time: number) => ({
    x: piece.home.x + valueAt(edits.get(`piece.${piece.id}.x`), time),
    y: piece.home.y + valueAt(edits.get(`piece.${piece.id}.y`), time),
  })
  /** Drop a piece's x/y keys after `time` (a fling takes over from there). */
  const cutAfter = (piece: CodePiece, time: number) => {
    for (const field of ['x', 'y', 'rotate']) {
      const key = `piece.${piece.id}.${field}`
      const kept = (edits.get(key) ?? []).filter((k) => k.time <= time)
      edits.set(key, kept)
    }
  }

  const panel: CodePanel = {
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
    piece(n, text, occurrence = 1) {
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
      for (const point of path) {
        push(`piece.${piece.id}.x`, { time: point.time, value: point.x - piece.home.x })
        push(`piece.${piece.id}.y`, { time: point.time, value: point.y - piece.home.y })
      }
      return panel
    },
    fling(piece, fling) {
      const start = pieceAt(piece, fling.at)
      const velocity = fling.velocity ?? pathVelocity(piece, fling.at) ?? { x: 0.5, y: -0.6 }
      const gravity = fling.gravity ?? FLING_GRAVITY
      const duration = fling.duration ?? 900
      const spin = (fling.spin ?? FLING_SPIN) * (velocity.x < 0 ? -1 : 1)
      const turned = valueAt(edits.get(`piece.${piece.id}.rotate`), fling.at)
      cutAfter(piece, fling.at)
      for (let t = 0; t <= duration; t += FLING_STEP) {
        const x = start.x + velocity.x * t
        const y = start.y + velocity.y * t + 0.5 * gravity * t * t
        push(`piece.${piece.id}.x`, { time: fling.at + t, value: x - piece.home.x })
        push(`piece.${piece.id}.y`, { time: fling.at + t, value: y - piece.home.y })
        push(`piece.${piece.id}.rotate`, { time: fling.at + t, value: turned + spin * t })
      }
      tween(`piece.${piece.id}.opacity`, 1, 0, { at: fling.at + duration * 0.6, duration: duration * 0.4 })
      return panel
    },
    move(piece, edit) {
      const from = pieceAt(piece, edit.at)
      tween(`piece.${piece.id}.x`, from.x - piece.home.x, edit.to.x - piece.home.x, edit, 400)
      tween(`piece.${piece.id}.y`, from.y - piece.home.y, edit.to.y - piece.home.y, edit, 400)
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
      cutAfter(piece, edit.at)
      panel.move(piece, { at: edit.at, duration, easing, to: { x: landing.x, y: landing.y } })
      tween(`piece.${piece.id}.rotate`, valueAt(edits.get(`piece.${piece.id}.rotate`), edit.at), 0, { at: edit.at, duration })
      return panel
    },
    landing(piece, n, column, time = Infinity) {
      const spot = panel.spot(n, column, piece.text.length, time)
      // Further along its own line, everything after its old place has moved back to close it.
      const closed = n === piece.line && column > piece.column ? piece.text.length * charWidth : 0
      return box(spot.left - closed, spot.top, spot.width, spot.height)
    },
    ride(tracks, target, ride) {
      return rideLines(tracks, target, ride.ground, ride.every ?? FLING_STEP)
    },
    tracks(id) {
      return [...edits].filter(([, keys]) => keys.length > 0).map(([property, keys]) => ({
        id: `${id}-${property}`,
        target: id,
        property,
        keyframes: inTimeOrder(keys),
      }))
    },
  }

  /**
   * `target`'s tracks with its `y` carried by the line under its feet. Each
   * segment of the `y` track keeps its keys (and easing) where what is under
   * it does not move; where a line under it moves (or it steps from one
   * line to another that has moved), the segment is sampled every `every` ms.
   */
  function rideLines(tracks: Track[], target: string, ground: number, every: number): Track[] {
    const shifts = lines.map((_, i) => edits.get(`line.${i + 1}.shift`) ?? [])
    if (shifts.every((keys) => keys.length === 0)) return tracks
    const yTrack = tracks.find((track) => track.target === target && track.property === 'y') as Track<number> | undefined
    const timeline = new Timeline({ id: `${target}-ride`, tracks: yTrack ? [yTrack] : [] })
    const yAt = (time: number) => (yTrack ? Number(timeline.getStateAtTime(time).values.get(target)?.get('y') ?? 0) : 0)
    /** The line whose top the feet are on at `time` (as laid out), or -1 when they are on none (in the air, on the ground). */
    const under = (time: number) => {
      const feet = ground + yAt(time)
      return lines.findIndex((_, i) => Math.abs(lineTop(i + 1) - feet) < 0.5)
    }
    const keyTimes = (yTrack?.keyframes ?? []).map((key) => key.time)
    /**
     * How far the line under the feet has moved at `time`, px (up is
     * negative). In the air, it blends from the line it left to the line it
     * lands on, so a hop off a moved line lands back on it.
     */
    const carried = (time: number) => {
      const lift = (index: number) => (index < 0 ? 0 : -valueAt(shifts[index], time) * lineHeight)
      const now = under(time)
      if (now >= 0) return lift(now)
      // On its own ground (not a line), nothing carries it.
      if (Math.abs(yAt(time)) < 0.5) return 0
      const standing = (t: number) => under(t) >= 0 || Math.abs(yAt(t)) < 0.5
      const left = [...keyTimes].reverse().find((t) => t <= time && standing(t))
      const lands = keyTimes.find((t) => t >= time && standing(t))
      if (left === undefined && lands === undefined) return 0
      if (left === undefined) return lift(under(lands!))
      if (lands === undefined || lands === left) return lift(under(left))
      // From the floor it left to the floor it lands on, over the flight.
      return lift(under(left)) + ((lift(under(lands)) - lift(under(left))) * (time - left)) / (lands - left)
    }
    // When any line is moving.
    const windows = shifts.flatMap((keys) => {
      const sorted = [...keys].sort((a, b) => a.time - b.time)
      return sorted.slice(1).flatMap((key, i) => (key.value !== sorted[i].value ? [{ start: sorted[i].time, end: key.time }] : []))
    })
    const moving = (a: number, b: number) => windows.some((w) => w.start < b && w.end > a) || carried(a) !== carried(b)
    const keys: Keyframe<number>[] = yTrack ? [...yTrack.keyframes] : [{ time: 0, value: 0 }]
    const out: Keyframe<number>[] = [{ ...keys[0], value: keys[0].value + carried(keys[0].time) }]
    // Every `every` ms, and exactly when a line starts or stops moving.
    const sample = (a: number, b: number) => {
      const times = new Set<number>([b])
      for (let time = a + every; time < b; time += every) times.add(time)
      for (const w of windows) for (const edge of [w.start, w.end]) if (edge > a && edge < b) times.add(edge)
      for (const time of [...times].sort((p, q) => p - q)) out.push({ time, value: yAt(time) + carried(time) })
    }
    for (let i = 1; i < keys.length; i++) {
      const a = keys[i - 1].time
      const b = keys[i].time
      if (moving(a, b)) sample(a, b)
      else out.push({ ...keys[i], value: keys[i].value + carried(b) })
    }
    // Lines that move after its last key still carry it.
    const last = keys[keys.length - 1].time
    const end = Math.max(last, ...windows.map((w) => w.end))
    if (end > last) sample(last, end)
    const ridden: Track<number> = { id: yTrack?.id ?? `${target}-y`, target, property: 'y', keyframes: out }
    return yTrack ? tracks.map((track) => (track === yTrack ? ridden : track)) : [...tracks, ridden]
  }

  /** How fast a piece was moving along its recorded path just before `time`, px/ms. */
  function pathVelocity(piece: CodePiece, time: number): { x: number; y: number } | undefined {
    const xs = edits.get(`piece.${piece.id}.x`)
    if (!xs || xs.length < 2) return undefined
    const before = pieceAt(piece, time - FLING_STEP)
    const now = pieceAt(piece, time)
    return { x: (now.x - before.x) / FLING_STEP, y: (now.y - before.y) / FLING_STEP }
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

/** A recorded prop's value at `time`: linear between its keys, held before the first and after the last (0 with none). */
function valueAt(keys: Edit[] | undefined, time: number): number {
  if (!keys || keys.length === 0) return 0
  const sorted = [...keys].sort((a, b) => a.time - b.time)
  if (time <= sorted[0].time) return sorted[0].value
  for (let i = 1; i < sorted.length; i++) {
    if (time <= sorted[i].time) {
      const a = sorted[i - 1]
      const b = sorted[i]
      return b.time === a.time ? b.value : a.value + ((b.value - a.value) * (time - a.time)) / (b.time - a.time)
    }
  }
  return sorted[sorted.length - 1].value
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

/**
 * Keys in time order. Each edit is a (start, end) pair, so the value holds
 * flat between edits and a later edit starts where the earlier one ended.
 */
function inTimeOrder(keys: Edit[]): Keyframe<number>[] {
  const sorted = [...keys].sort((a, b) => a.time - b.time)
  return sorted.map((key) => ({ time: key.time, value: key.value, ...(key.easing ? { easing: key.easing } : {}) }))
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
