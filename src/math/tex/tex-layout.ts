import { advance, extent, AXIS_HEIGHT, RULE } from './glyph-metrics'
import { parseTex, type TexClass, type TexNode } from './tex-parser'

/**
 * Typesets a parsed TeX tree into positioned pieces, in ems.
 *
 * Coordinates: x grows right from the left edge, y grows DOWN from the
 * baseline (screen convention), so a superscript has a negative y.
 *
 * Every piece carries an `id`. Plain symbols are numbered by their text and
 * occurrence (`x#1`, `=#1`, `2#2`), so two steps of an equation pair up their
 * matching terms with no extra markup; `\id{name}{…}` names a whole term
 * explicitly. Pure: the same TeX and values always give the same layout.
 */
export interface TexGlyph {
  kind: 'glyph'
  text: string
  /** Left edge of the glyph's advance cell; draw it centred in `width` */
  x: number
  /** Baseline */
  y: number
  width: number
  size: number
  italic: boolean
  color?: string
  id: string
}

export interface TexRule {
  kind: 'rule'
  x: number
  /** Top edge */
  y: number
  width: number
  height: number
  color?: string
  id: string
}

export interface TexStroke {
  kind: 'stroke'
  points: [number, number][]
  width: number
  color?: string
  id: string
}

export type TexPiece = TexGlyph | TexRule | TexStroke

export interface TexLayout {
  width: number
  /** Above the baseline */
  height: number
  /** Below the baseline */
  depth: number
  pieces: TexPiece[]
}

export interface TexLayoutOptions {
  /** `display` (default) puts big-operator limits above and below; `inline` beside */
  style?: 'display' | 'inline'
  /** Live numbers for `\val{name}` */
  values?: Record<string, number>
}

/** 0 display, 1 text, 2 script, 3 scriptscript */
type Level = 0 | 1 | 2 | 3
const SIZES = [1, 1, 0.7, 0.5]
const scriptLevel = (level: Level): Level => (level <= 1 ? 2 : 3)
const fracLevel = (level: Level): Level => Math.min(3, level + 1) as Level

interface Box {
  width: number
  height: number
  depth: number
  pieces: TexPiece[]
}

interface Context {
  level: Level
  color?: string
  /** An explicit `\id` in force: every piece inside takes it */
  id?: string
  values: Record<string, number>
  counts: Map<string, number>
}

const empty = (): Box => ({ width: 0, height: 0, depth: 0, pieces: [] })

function shift(box: Box, dx: number, dy: number): TexPiece[] {
  return box.pieces.map((piece) => {
    if (piece.kind === 'stroke') return { ...piece, points: piece.points.map(([x, y]) => [x + dx, y + dy] as [number, number]) }
    return { ...piece, x: piece.x + dx, y: piece.y + dy }
  })
}

function nextId(ctx: Context, key: string): string {
  if (ctx.id) return ctx.id
  const n = (ctx.counts.get(key) ?? 0) + 1
  ctx.counts.set(key, n)
  return `${key}#${n}`
}

function glyph(text: string, italic: boolean, ctx: Context, scale = 1, idKey = text): Box {
  const size = SIZES[ctx.level] * scale
  const width = advance(text) * size
  const { height, depth } = extent(text)
  return {
    width,
    height: height * size,
    depth: depth * size,
    pieces: [{ kind: 'glyph', text, x: 0, y: 0, width, size, italic, ...(ctx.color ? { color: ctx.color } : {}), id: nextId(ctx, idKey) }],
  }
}

/** Glyphs side by side, upright, as one word (operator names, \text, values). */
function word(text: string, ctx: Context, idKey: string): Box {
  const box = empty()
  const id = nextId(ctx, idKey)
  const size = SIZES[ctx.level]
  for (const ch of text) {
    // Upright text sets a little tighter than maths italic.
    const width = (ch === ' ' ? 0.28 : /[A-Za-z]/.test(ch) ? advance(ch) - 0.04 : advance(ch)) * size
    if (ch !== ' ') {
      const { height, depth } = extent(ch)
      box.pieces.push({ kind: 'glyph', text: ch, x: box.width, y: 0, width, size, italic: false, ...(ctx.color ? { color: ctx.color } : {}), id })
      box.height = Math.max(box.height, height * size)
      box.depth = Math.max(box.depth, depth * size)
    }
    box.width += width
  }
  return box
}

/** The class a node has for spacing. */
function classOf(node: TexNode): TexClass {
  switch (node.type) {
    case 'symbol': return node.cls
    case 'bigop':
    case 'opname': return 'op'
    case 'scripts': return classOf(node.base)
    case 'id':
    case 'color': return classOf(node.body)
    default: return 'ord'
  }
}

/** TeX's spacing between neighbouring classes, in mu (1/18 em); none in scripts. */
function spaceBetween(left: TexClass, right: TexClass): number {
  if (left === 'bin' || right === 'bin') return 4
  if (left === 'rel' || right === 'rel') return left === 'open' || right === 'close' || right === 'punct' ? 0 : 5
  if (left === 'punct') return 3
  if (left === 'op' && (right === 'ord' || right === 'op')) return 3
  if (right === 'op' && left === 'ord') return 3
  return 0
}

function layoutList(nodes: TexNode[], ctx: Context): Box {
  const box = empty()
  let previous: TexClass | undefined
  nodes.forEach((node) => {
    if (node.type === 'space') {
      box.width += node.width * SIZES[ctx.level]
      return
    }
    let cls = classOf(node)
    // A binary operator with nothing to its left is unary: −x, not a minus with a gap.
    if (cls === 'bin' && (previous === undefined || previous === 'bin' || previous === 'rel' || previous === 'open' || previous === 'punct' || previous === 'op')) cls = 'ord'
    if (previous !== undefined && ctx.level <= 1) box.width += (spaceBetween(previous, cls) / 18) * SIZES[ctx.level]
    const child = layoutNode(node, ctx)
    box.pieces.push(...shift(child, box.width, 0))
    box.width += child.width
    box.height = Math.max(box.height, child.height)
    box.depth = Math.max(box.depth, child.depth)
    previous = cls
  })
  return box
}

function format(value: number, digits: number): string {
  if (!Number.isFinite(value)) return value > 0 ? '∞' : value < 0 ? '−∞' : '?'
  const fixed = value.toFixed(digits)
  // Trailing zeros after a decimal point only: 10 stays 10.
  const text = fixed.includes('.') ? fixed.replace(/\.?0+$/, '') : fixed
  const clean = text === '-0' ? '0' : text
  return clean.replace('-', '−')
}

function layoutNode(node: TexNode, ctx: Context): Box {
  const size = SIZES[ctx.level]
  switch (node.type) {
    case 'symbol':
      return glyph(node.text, node.italic, ctx)
    case 'group':
      return layoutList(node.body, ctx)
    case 'space':
      return { ...empty(), width: node.width * size }
    case 'text':
      return word(node.text, ctx, `text:${node.text}`)
    case 'opname':
      return word(node.text, ctx, node.text)
    case 'value': {
      const value = ctx.values[node.name]
      if (value === undefined) throw new Error(`\\val{${node.name}}: no value named "${node.name}"`)
      return word(format(value, node.digits), { ...ctx, id: ctx.id ?? `val:${node.name}` }, `val:${node.name}`)
    }
    case 'bigop':
      return glyph(node.text, false, ctx, ctx.level === 0 ? 1.4 : 1.1)
    case 'color':
      return layoutNode(node.body, { ...ctx, color: node.color })
    case 'id':
      return layoutNode(node.body, { ...ctx, id: node.id })
    case 'scripts':
      return layoutScripts(node, ctx)
    case 'frac':
      return layoutFrac(node, ctx)
    case 'sqrt':
      return layoutSqrt(node, ctx)
    case 'accent':
      return layoutAccent(node, ctx)
    case 'matrix':
      return layoutMatrix(node, ctx)
  }
}

function layoutScripts(node: Extract<TexNode, { type: 'scripts' }>, ctx: Context): Box {
  const base = layoutNode(node.base, ctx)
  const inner = { ...ctx, level: scriptLevel(ctx.level) }
  const sup = node.sup ? layoutNode(node.sup, inner) : undefined
  const sub = node.sub ? layoutNode(node.sub, inner) : undefined
  const size = SIZES[ctx.level]
  const stacked = ctx.level === 0 && ((node.base.type === 'bigop' && node.base.limits) || (node.base.type === 'opname' && node.base.limits))
  const box: Box = { ...base, pieces: [...base.pieces] }

  if (stacked) {
    // Limits centred above and below the operator.
    const width = Math.max(base.width, sup?.width ?? 0, sub?.width ?? 0)
    const pieces = shift(base, (width - base.width) / 2, 0)
    let height = base.height
    let depth = base.depth
    const gap = 0.12 * size
    if (sup) {
      const y = -(base.height + gap + sup.depth)
      pieces.push(...shift(sup, (width - sup.width) / 2, y))
      height = -y + sup.height
    }
    if (sub) {
      const y = base.depth + gap + sub.height
      pieces.push(...shift(sub, (width - sub.width) / 2, y))
      depth = y + sub.depth
    }
    return { width, height, depth, pieces }
  }

  let supShift = sup ? Math.max(0.42 * size, base.height - 0.3 * size, sup.depth + 0.25 * size) : 0
  let subShift = sub ? Math.max(0.2 * size, base.depth + 0.12 * size, sub.height - 0.4 * size) : 0
  if (sup && sub) {
    // Keep a clear gap between the two.
    const gap = supShift - sup.depth - (sub.height - subShift)
    if (gap < 0.2 * size) subShift += 0.2 * size - gap
  }
  const x = base.width + 0.03 * size
  let width = base.width
  if (sup) {
    box.pieces.push(...shift(sup, x, -supShift))
    box.height = Math.max(box.height, supShift + sup.height)
    width = Math.max(width, x + sup.width)
  } else {
    supShift = 0
  }
  if (sub) {
    box.pieces.push(...shift(sub, x, subShift))
    box.depth = Math.max(box.depth, subShift + sub.depth)
    width = Math.max(width, x + sub.width)
  }
  box.width = width + 0.04 * size
  return box
}

function layoutFrac(node: Extract<TexNode, { type: 'frac' }>, ctx: Context): Box {
  const inner = { ...ctx, level: fracLevel(ctx.level) }
  const num = layoutNode(node.num, inner)
  const den = layoutNode(node.den, inner)
  const size = SIZES[ctx.level]
  const rule = RULE * size
  const axis = AXIS_HEIGHT * size
  const gap = (ctx.level === 0 ? 0.16 : 0.1) * size
  const pad = 0.1 * size
  const width = Math.max(num.width, den.width) + pad * 2
  const numY = -(axis + rule / 2 + gap + num.depth)
  const denY = -axis + rule / 2 + gap + den.height
  return {
    width,
    height: -numY + num.height,
    depth: denY + den.depth,
    pieces: [
      ...shift(num, (width - num.width) / 2, numY),
      ...(node.bar === false ? [] : [{ kind: 'rule' as const, x: 0, y: -axis - rule / 2, width, height: rule, ...(ctx.color ? { color: ctx.color } : {}), id: nextId(ctx, 'frac') }]),
      ...shift(den, (width - den.width) / 2, denY),
    ],
  }
}

function layoutSqrt(node: Extract<TexNode, { type: 'sqrt' }>, ctx: Context): Box {
  const body = layoutNode(node.body, ctx)
  const size = SIZES[ctx.level]
  const top = Math.max(body.height, 0.7 * size) + 0.14 * size
  const bottom = Math.max(body.depth, 0.05 * size) + 0.05 * size
  const sign = 0.56 * size
  const width = sign + body.width + 0.08 * size
  // A tick up, a stroke down to the baseline, the long rise, then the vinculum over the body.
  const points: [number, number][] = [
    [0.02 * size, -0.36 * size], [0.13 * size, -0.44 * size], [0.3 * size, bottom], [sign - 0.04 * size, -top], [width, -top],
  ]
  return {
    width,
    height: top + RULE * size,
    depth: bottom,
    pieces: [{ kind: 'stroke', points, width: RULE * size, ...(ctx.color ? { color: ctx.color } : {}), id: nextId(ctx, 'sqrt') }, ...shift(body, sign, 0)],
  }
}

function layoutAccent(node: Extract<TexNode, { type: 'accent' }>, ctx: Context): Box {
  const body = layoutNode(node.body, ctx)
  const size = SIZES[ctx.level]
  const y = -(body.height + 0.12 * size)
  const left = 0.04 * size
  const right = Math.max(body.width - 0.02 * size, left + 0.3 * size)
  const color = ctx.color ? { color: ctx.color } : {}
  const id = nextId(ctx, node.accent)
  let points: [number, number][][]
  if (node.accent === 'vec') {
    const head = 0.12 * size
    points = [[[left, y], [right, y]], [[right - head, y - head * 0.7], [right, y], [right - head, y + head * 0.7]]]
  } else if (node.accent === 'hat') {
    const middle = (left + right) / 2
    points = [[[middle - 0.16 * size, y + 0.02 * size], [middle, y - 0.12 * size], [middle + 0.16 * size, y + 0.02 * size]]]
  } else {
    points = [[[left, y], [right, y]]]
  }
  return {
    width: Math.max(body.width, right + 0.02 * size),
    height: -y + 0.14 * size,
    depth: body.depth,
    pieces: [...body.pieces, ...points.map((line): TexStroke => ({ kind: 'stroke', points: line, width: RULE * size * 0.9, ...color, id }))],
  }
}

function layoutMatrix(node: Extract<TexNode, { type: 'matrix' }>, ctx: Context): Box {
  const inner = { ...ctx, level: Math.max(ctx.level, 1) as Level }
  const size = SIZES[inner.level]
  const cells = node.rows.map((row) => row.map((cell) => layoutNode(cell, inner)))
  const columns = Math.max(...cells.map((row) => row.length))
  const columnWidths = Array.from({ length: columns }, (_, c) => Math.max(0, ...cells.map((row) => row[c]?.width ?? 0)))
  const rowHeights = cells.map((row) => Math.max(0.7 * size, ...row.map((cell) => cell.height)))
  const rowDepths = cells.map((row) => Math.max(0.2 * size, ...row.map((cell) => cell.depth)))
  const columnGap = 0.9 * size
  const rowGap = 0.25 * size
  const delimiter = node.delimiters === 'matrix' ? 0 : 0.55 * size
  const contentWidth = columnWidths.reduce((sum, w) => sum + w, 0) + columnGap * (columns - 1)
  const total = rowHeights.reduce((sum, h, r) => sum + h + rowDepths[r], 0) + rowGap * (cells.length - 1)
  // Centre the block on the maths axis.
  const top = -AXIS_HEIGHT * size - total / 2
  const pieces: TexPiece[] = []
  let y = top
  cells.forEach((row, r) => {
    y += rowHeights[r]
    let x = delimiter
    row.forEach((cell, c) => {
      pieces.push(...shift(cell, x + (columnWidths[c] - cell.width) / 2, y))
      x += columnWidths[c] + columnGap
    })
    y += rowDepths[r] + rowGap
  })
  const width = contentWidth + delimiter * 2
  const bottom = top + total
  const color = ctx.color ? { color: ctx.color } : {}
  const stroke = (points: [number, number][], key: string): TexStroke => ({ kind: 'stroke', points, width: RULE * size * 1.1, ...color, id: nextId(ctx, key) })
  const pad = 0.08 * size
  if (node.delimiters === 'pmatrix') {
    // Parentheses as flattened arcs.
    const paren = (side: 1 | -1): [number, number][] => {
      const xEdge = side === 1 ? delimiter * 0.75 : width - delimiter * 0.75
      const bulge = side * delimiter * 0.5
      return Array.from({ length: 17 }, (_, k) => {
        const t = k / 16
        return [xEdge - bulge * Math.sin(Math.PI * t), top - pad + (total + pad * 2) * t] as [number, number]
      })
    }
    pieces.push(stroke(paren(1), '('), stroke(paren(-1), ')'))
  } else if (node.delimiters === 'bmatrix') {
    const tick = delimiter * 0.35
    const l = delimiter * 0.2
    const r = width - delimiter * 0.2
    pieces.push(
      stroke([[l + tick, top - pad], [l, top - pad], [l, bottom + pad], [l + tick, bottom + pad]], '['),
      stroke([[r - tick, top - pad], [r, top - pad], [r, bottom + pad], [r - tick, bottom + pad]], ']'),
    )
  } else if (node.delimiters === 'vmatrix') {
    pieces.push(stroke([[delimiter * 0.4, top - pad], [delimiter * 0.4, bottom + pad]], '|'), stroke([[width - delimiter * 0.4, top - pad], [width - delimiter * 0.4, bottom + pad]], '|'))
  }
  return { width, height: -top + pad, depth: bottom + pad, pieces }
}

/** Typeset TeX source (or an already-parsed tree) into pieces, in ems. */
export function layoutTex(source: string | TexNode, options: TexLayoutOptions = {}): TexLayout {
  const tree = typeof source === 'string' ? parseTex(source) : source
  const ctx: Context = { level: options.style === 'inline' ? 1 : 0, values: options.values ?? {}, counts: new Map() }
  const box = layoutNode(tree, ctx)
  return { width: box.width, height: box.height, depth: box.depth, pieces: box.pieces }
}
