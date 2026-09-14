import type { LessonBuilder, StepOptions } from './lesson'

/**
 * Diagram primitives for computer-science teaching: each returns SVG markup with
 * `data-tinyfly` names, its geometry, and step helpers that write to a
 * `lesson()`. Put the pieces in a `figure()` and embed the result.
 *
 *     const slice = cells({ id: 's', values: [1, 2, 3, ''], x: 20, y: 40 })
 *     const ptr = pointer({ id: 'len', label: 'len', x: slice.center(2).x, y: 110 })
 *     const l = lesson({ id: 'append' })
 *     l.marker('before', { label: 'len 3, cap 4' })
 *     slice.write(l, 3, 4)
 *     ptr.moveTo(l, slice.center(3).x)
 *     const markup = figure({ width: 360, height: 150, children: [slice, ptr] })
 *
 * Helpers only: nothing here is in the engine, and everything they produce is
 * ordinary markup and keyframes.
 */

export interface Piece {
  /** SVG markup for this piece */
  svg: string
}

export interface Theme {
  stroke: string
  fill: string
  text: string
  accent: string
  muted: string
  font: string
}

export const DEFAULT_THEME: Theme = {
  stroke: '#3f3f46',
  fill: '#ffffff',
  text: '#18181b',
  accent: '#f97316',
  muted: '#e4e4e7',
  font: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
}

const escape = (value: unknown) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

/** An `<svg>` holding pieces, scaled by its viewBox. */
export function figure(options: { width: number; height: number; children: Piece[]; title?: string; theme?: Partial<Theme> }): string {
  const theme = { ...DEFAULT_THEME, ...options.theme }
  const title = options.title ? `<title>${escape(options.title)}</title>` : ''
  return (
    `<svg viewBox="0 0 ${options.width} ${options.height}" width="100%" style="max-width:${options.width}px;font-family:${escape(theme.font)}" xmlns="http://www.w3.org/2000/svg">` +
    title +
    options.children.map((child) => child.svg).join('') +
    '</svg>'
  )
}

// --- cells: an array or slice ----------------------------------------------

export interface Cells extends Piece {
  /** `data-tinyfly` name of cell i's box, and of its value text */
  cell(index: number): string
  value(index: number): string
  /** Centre of cell i */
  center(index: number): { x: number; y: number }
  /** Colour a cell (and optionally back again later) */
  highlight(lesson: LessonBuilder, index: number, fill?: string, options?: StepOptions): void
  /** Put a value into a cell: it fades in */
  write(lesson: LessonBuilder, index: number, value: string | number, options?: StepOptions): void
}

export function cells(options: {
  id: string
  values: Array<string | number>
  x?: number
  y?: number
  size?: number
  gap?: number
  /** Index labels under the cells (default true) */
  indexes?: boolean
  theme?: Partial<Theme>
}): Cells {
  const theme = { ...DEFAULT_THEME, ...options.theme }
  const { id, values, x = 0, y = 0, size = 48, gap = 6 } = options
  const cellName = (i: number) => `${id}-cell-${i}`
  const valueName = (i: number) => `${id}-value-${i}`
  const left = (i: number) => x + i * (size + gap)

  const svg = values
    .map((value, i) => {
      const cx = left(i) + size / 2
      const empty = value === '' || value === undefined
      return (
        `<rect data-tinyfly="${cellName(i)}" x="${left(i)}" y="${y}" width="${size}" height="${size}" rx="6" fill="${empty ? theme.muted : theme.fill}" stroke="${theme.stroke}" stroke-width="2"/>` +
        `<text data-tinyfly="${valueName(i)}" x="${cx}" y="${y + size / 2}" text-anchor="middle" dominant-baseline="central" font-size="${size * 0.4}" fill="${theme.text}">${escape(value)}</text>` +
        (options.indexes === false ? '' : `<text x="${cx}" y="${y + size + 16}" text-anchor="middle" font-size="12" fill="${theme.stroke}">${i}</text>`)
      )
    })
    .join('')

  return {
    svg,
    cell: cellName,
    value: valueName,
    center: (i) => ({ x: left(i) + size / 2, y: y + size / 2 }),
    highlight(lesson, index, fill = theme.accent, stepOptions) {
      lesson.initial(cellName(index), { fill: values[index] === '' ? theme.muted : theme.fill })
      lesson.to(cellName(index), { fill }, stepOptions)
    },
    write(lesson, index, value, stepOptions) {
      lesson.initial(valueName(index), { opacity: values[index] === '' ? 0 : 1, text: String(values[index] ?? '') })
      lesson.initial(cellName(index), { fill: values[index] === '' ? theme.muted : theme.fill })
      lesson.set(valueName(index), { text: String(value) })
      lesson.together(() => {
        lesson.to(valueName(index), { opacity: 1 }, stepOptions)
        lesson.to(cellName(index), { fill: theme.fill }, stepOptions)
      })
    },
  }
}

// --- pointer: an arrow with a label that retargets --------------------------

export interface Pointer extends Piece {
  name: string
  moveTo(lesson: LessonBuilder, x: number, options?: StepOptions): void
}

/** An upward arrow at `x` (its tip at `y`), labelled underneath. Moves along x. */
export function pointer(options: { id: string; label: string; x: number; y: number; theme?: Partial<Theme> }): Pointer {
  const theme = { ...DEFAULT_THEME, ...options.theme }
  const { id, label, x, y } = options
  const svg =
    `<g data-tinyfly="${id}">` +
    `<path d="M${x} ${y} l-8 12 h5 v14 h6 v-14 h5 z" fill="${theme.accent}"/>` +
    `<text x="${x}" y="${y + 44}" text-anchor="middle" font-size="13" fill="${theme.text}">${escape(label)}</text>` +
    '</g>'
  return {
    svg,
    name: id,
    moveTo(lesson, targetX, stepOptions) {
      lesson.to(id, { x: targetX - x }, stepOptions)
    },
  }
}

// --- stack: frames that push and pop ----------------------------------------

export interface Stack extends Piece {
  frame(index: number): string
  push(lesson: LessonBuilder, label: string, options?: StepOptions): void
  pop(lesson: LessonBuilder, options?: StepOptions): void
}

/** A call stack growing upwards from its base, with room for `capacity` frames. */
export function stack(options: { id: string; x: number; y: number; width?: number; frameHeight?: number; capacity: number; theme?: Partial<Theme> }): Stack {
  const theme = { ...DEFAULT_THEME, ...options.theme }
  const { id, x, y, width = 160, frameHeight = 34, capacity } = options
  const frameName = (i: number) => `${id}-frame-${i}`
  const labelName = (i: number) => `${id}-label-${i}`
  const top = (i: number) => y + (capacity - 1 - i) * (frameHeight + 4)
  let depth = 0

  const svg =
    Array.from({ length: capacity }, (_, i) =>
      `<g data-tinyfly="${frameName(i)}" style="opacity:0">` +
      `<rect x="${x}" y="${top(i)}" width="${width}" height="${frameHeight}" rx="4" fill="${theme.fill}" stroke="${theme.stroke}" stroke-width="2"/>` +
      `<text data-tinyfly="${labelName(i)}" x="${x + 10}" y="${top(i) + frameHeight / 2}" dominant-baseline="central" font-size="13" fill="${theme.text}"></text>` +
      '</g>'
    ).join('') +
    `<line x1="${x - 6}" y1="${y + capacity * (frameHeight + 4)}" x2="${x + width + 6}" y2="${y + capacity * (frameHeight + 4)}" stroke="${theme.stroke}" stroke-width="3"/>`

  return {
    svg,
    frame: frameName,
    push(lesson, label, stepOptions) {
      if (depth >= capacity) throw new Error(`stack "${id}" is full (capacity ${capacity})`)
      const i = depth++
      lesson.initial(frameName(i), { opacity: 0, y: -12 })
      lesson.set(labelName(i), { text: label })
      lesson.to(frameName(i), { opacity: 1, y: 0 }, stepOptions)
    },
    pop(lesson, stepOptions) {
      if (depth === 0) throw new Error(`stack "${id}" is empty`)
      const i = --depth
      lesson.to(frameName(i), { opacity: 0, y: -12 }, stepOptions)
    },
  }
}

// --- queue / channel: values handed through ---------------------------------

export interface Queue extends Piece {
  /** A value token enters from the left and waits at the back of the queue */
  send(lesson: LessonBuilder, label: string, options?: StepOptions): void
  /** The front token leaves to the right */
  receive(lesson: LessonBuilder, options?: StepOptions): void
}

/** A horizontal buffer (a Go channel, a queue) with `capacity` slots. */
export function queue(options: { id: string; x: number; y: number; capacity: number; slot?: number; label?: string; theme?: Partial<Theme> }): Queue {
  const theme = { ...DEFAULT_THEME, ...options.theme }
  const { id, x, y, capacity, slot = 44 } = options
  const tokenName = (i: number) => `${id}-token-${i}`
  const tokenLabel = (i: number) => `${id}-token-label-${i}`
  const width = capacity * slot
  // Tokens live at the entry point; x moves them into slots. Enough for every send.
  const tokens = capacity * 3
  let sent = 0
  let received = 0

  const svg =
    `<rect x="${x}" y="${y}" width="${width}" height="${slot}" rx="${slot / 2}" fill="${theme.muted}" stroke="${theme.stroke}" stroke-width="2"/>` +
    (options.label ? `<text x="${x + width / 2}" y="${y + slot + 18}" text-anchor="middle" font-size="13" fill="${theme.text}">${escape(options.label)}</text>` : '') +
    Array.from({ length: tokens }, (_, i) =>
      `<g data-tinyfly="${tokenName(i)}" style="opacity:0">` +
      `<circle cx="${x - slot / 2}" cy="${y + slot / 2}" r="${slot * 0.36}" fill="${theme.accent}"/>` +
      `<text data-tinyfly="${tokenLabel(i)}" x="${x - slot / 2}" y="${y + slot / 2}" text-anchor="middle" dominant-baseline="central" font-size="13" fill="#fff"></text>` +
      '</g>'
    ).join('')

  const slotX = (position: number) => slot * (capacity - position)

  return {
    svg,
    send(lesson, label, stepOptions) {
      const waiting = sent - received
      if (waiting >= capacity) throw new Error(`queue "${id}" is full (capacity ${capacity})`)
      if (sent >= tokens) throw new Error(`queue "${id}" has no tokens left`)
      const i = sent++
      lesson.initial(tokenName(i), { opacity: 0, x: 0 })
      lesson.set(tokenLabel(i), { text: label })
      lesson.together(() => {
        lesson.to(tokenName(i), { opacity: 1 }, { ...stepOptions, duration: 150 })
        lesson.to(tokenName(i), { x: slotX(waiting) }, stepOptions)
      })
    },
    receive(lesson, stepOptions) {
      if (received === sent) throw new Error(`queue "${id}" is empty`)
      const front = received++
      lesson.together(() => {
        lesson.to(tokenName(front), { x: width + slot, opacity: 0 }, stepOptions)
        for (let i = front + 1; i < sent; i++) lesson.to(tokenName(i), { x: slotX(i - received) }, stepOptions)
      })
    },
  }
}

// --- table: key-value buckets -------------------------------------------------

export interface Table extends Piece {
  row(key: string): string
  /** Set a key's value, highlighting its row */
  put(lesson: LessonBuilder, key: string, value: string | number, options?: StepOptions): void
}

/** A two-column key → value table (a map, a hash bucket, a symbol table). */
export function table(options: { id: string; x: number; y: number; keys: string[]; values?: Array<string | number>; width?: number; rowHeight?: number; theme?: Partial<Theme> }): Table {
  const theme = { ...DEFAULT_THEME, ...options.theme }
  const { id, x, y, keys, width = 200, rowHeight = 30 } = options
  const index = (key: string) => {
    const i = keys.indexOf(key)
    if (i === -1) throw new Error(`table "${id}" has no key "${key}"`)
    return i
  }
  const rowName = (key: string) => `${id}-row-${index(key)}`
  const valueName = (i: number) => `${id}-value-${i}`

  const svg = keys
    .map((key, i) => {
      const top = y + i * rowHeight
      return (
        `<rect data-tinyfly="${id}-row-${i}" x="${x}" y="${top}" width="${width}" height="${rowHeight}" fill="${theme.fill}" stroke="${theme.stroke}"/>` +
        `<text x="${x + 10}" y="${top + rowHeight / 2}" dominant-baseline="central" font-size="13" fill="${theme.text}">${escape(key)}</text>` +
        `<text data-tinyfly="${valueName(i)}" x="${x + width - 10}" y="${top + rowHeight / 2}" text-anchor="end" dominant-baseline="central" font-size="13" fill="${theme.text}">${escape(options.values?.[i] ?? '')}</text>`
      )
    })
    .join('')

  return {
    svg,
    row: rowName,
    put(lesson, key, value, stepOptions) {
      const i = index(key)
      lesson.initial(rowName(key), { fill: theme.fill })
      lesson.initial(valueName(i), { text: String(options.values?.[i] ?? '') })
      lesson.together(() => {
        lesson.to(rowName(key), { fill: theme.accent }, { ...stepOptions, duration: 200 })
        lesson.set(valueName(i), { text: String(value) })
      })
      lesson.to(rowName(key), { fill: theme.fill }, stepOptions)
    },
  }
}

// --- pipeline: a request through stages ----------------------------------------

export interface Pipeline extends Piece {
  token: string
  /** Move the request to stage i */
  advance(lesson: LessonBuilder, stage: number, options?: StepOptions): void
}

/** Stages in a row (middleware, a compiler, a build) with a request token travelling through. */
export function pipeline(options: { id: string; x: number; y: number; stages: string[]; stageWidth?: number; gap?: number; theme?: Partial<Theme> }): Pipeline {
  const theme = { ...DEFAULT_THEME, ...options.theme }
  const { id, x, y, stages, stageWidth = 110, gap = 28 } = options
  const height = 44
  const centerX = (i: number) => x + i * (stageWidth + gap) + stageWidth / 2
  const token = `${id}-request`

  const svg =
    stages
      .map((stage, i) => {
        const left = x + i * (stageWidth + gap)
        const arrow = i < stages.length - 1 ? `<path d="M${left + stageWidth + 4} ${y + height / 2} h${gap - 10} m-6 -5 l6 5 l-6 5" fill="none" stroke="${theme.stroke}" stroke-width="2"/>` : ''
        return (
          `<rect x="${left}" y="${y}" width="${stageWidth}" height="${height}" rx="8" fill="${theme.fill}" stroke="${theme.stroke}" stroke-width="2"/>` +
          `<text x="${left + stageWidth / 2}" y="${y + height / 2}" text-anchor="middle" dominant-baseline="central" font-size="13" fill="${theme.text}">${escape(stage)}</text>` +
          arrow
        )
      })
      .join('') + `<circle data-tinyfly="${token}" cx="${centerX(0)}" cy="${y - 14}" r="8" fill="${theme.accent}"/>`

  return {
    svg,
    token,
    advance(lesson, stage, stepOptions) {
      if (stage < 0 || stage >= stages.length) throw new Error(`pipeline "${id}" has no stage ${stage}`)
      lesson.to(token, { x: centerX(stage) - centerX(0) }, stepOptions)
    },
  }
}
