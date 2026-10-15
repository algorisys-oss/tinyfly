import { closestName } from '../../engine/authoring/did-you-mean'

/**
 * The TeX subset tinyfly typesets, parsed into a small tree.
 *
 * Supported:
 * - Letters (italic), digits, `+ - = < > ( ) [ ] | , . ; : ! '`
 * - `^` and `_` with a single token or a `{group}`
 * - `\frac{a}{b}`, `\sqrt{x}`, `\vec{v}`, `\hat{x}`, `\bar{x}`
 * - Big operators `\sum \prod \int` (limits from `_` and `^`), and named
 *   operators `\sin \cos \tan \log \ln \exp \det \lim \max \min \arg`
 * - Greek letters and the symbols in SYMBOLS (`\cdot \times \le \to \infty` …)
 * - `\begin{pmatrix} a & b \\ c & d \end{pmatrix}` (also `bmatrix`, `vmatrix`, `matrix`)
 * - `\text{words}`, `\color{name or #hex}{…}`, spacing `\, \; \quad \qquad`
 * - `\id{name}{…}`: names a term, so an equation step can move it to its
 *   place in the next step (see equation-morph.ts)
 * - `\val{name}` or `\val{name:2}`: a live number from the figure's values,
 *   with up to that many decimals (default 2), so a matrix shown in TeX
 *   follows the matrix being animated
 *
 * Anything else is an error that names the position, never a silent guess.
 */
export type TexClass = 'ord' | 'bin' | 'rel' | 'open' | 'close' | 'punct' | 'op'

export type TexNode =
  | { type: 'symbol'; text: string; cls: TexClass; italic: boolean }
  | { type: 'group'; body: TexNode[] }
  | { type: 'scripts'; base: TexNode; sup?: TexNode; sub?: TexNode }
  | { type: 'frac'; num: TexNode; den: TexNode }
  | { type: 'sqrt'; body: TexNode }
  | { type: 'accent'; accent: 'vec' | 'hat' | 'bar'; body: TexNode }
  | { type: 'bigop'; text: string; limits: boolean }
  | { type: 'opname'; text: string; limits: boolean }
  | { type: 'matrix'; delimiters: 'pmatrix' | 'bmatrix' | 'vmatrix' | 'matrix'; rows: TexNode[][] }
  | { type: 'text'; text: string }
  | { type: 'color'; color: string; body: TexNode }
  | { type: 'id'; id: string; body: TexNode }
  | { type: 'value'; name: string; digits: number }
  | { type: 'space'; width: number }

const GREEK: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ',
  iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ',
  upsilon: 'υ', phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
}

/** Symbol commands: the glyph and its spacing class. */
export const SYMBOLS: Record<string, [string, TexClass]> = {
  cdot: ['·', 'bin'], times: ['×', 'bin'], div: ['÷', 'bin'], pm: ['±', 'bin'], mp: ['∓', 'bin'], circ: ['∘', 'bin'],
  cup: ['∪', 'bin'], cap: ['∩', 'bin'], land: ['∧', 'bin'], lor: ['∨', 'bin'], setminus: ['∖', 'bin'],
  le: ['≤', 'rel'], leq: ['≤', 'rel'], ge: ['≥', 'rel'], geq: ['≥', 'rel'], ne: ['≠', 'rel'], neq: ['≠', 'rel'],
  approx: ['≈', 'rel'], sim: ['∼', 'rel'], equiv: ['≡', 'rel'], propto: ['∝', 'rel'], to: ['→', 'rel'],
  rightarrow: ['→', 'rel'], leftarrow: ['←', 'rel'], mapsto: ['↦', 'rel'], Rightarrow: ['⇒', 'rel'],
  implies: ['⇒', 'rel'], iff: ['⇔', 'rel'], Leftrightarrow: ['⇔', 'rel'], in: ['∈', 'rel'], notin: ['∉', 'rel'],
  subset: ['⊂', 'rel'], subseteq: ['⊆', 'rel'], supset: ['⊃', 'rel'], mid: ['|', 'rel'], perp: ['⊥', 'rel'],
  infty: ['∞', 'ord'], partial: ['∂', 'ord'], nabla: ['∇', 'ord'], forall: ['∀', 'ord'], exists: ['∃', 'ord'],
  emptyset: ['∅', 'ord'], neg: ['¬', 'ord'], ldots: ['…', 'ord'], cdots: ['⋯', 'ord'], prime: ['′', 'ord'],
  hbar: ['ℏ', 'ord'], ell: ['ℓ', 'ord'], degree: ['°', 'ord'], lVert: ['‖', 'open'], rVert: ['‖', 'close'],
  langle: ['⟨', 'open'], rangle: ['⟩', 'close'], lbrace: ['{', 'open'], rbrace: ['}', 'close'],
}

const BIG_OPS: Record<string, [string, boolean]> = { sum: ['∑', true], prod: ['∏', true], int: ['∫', false], oint: ['∮', false] }
const OP_NAMES: Record<string, boolean> = {
  sin: false, cos: false, tan: false, log: false, ln: false, exp: false, det: false, tr: false, rank: false,
  lim: true, max: true, min: true, argmax: true, argmin: true, arg: false, sup: true, inf: true, Pr: false, E: false, Var: false,
}
const SPACES: Record<string, number> = { ',': 3 / 18, ':': 4 / 18, ';': 5 / 18, '!': -3 / 18, quad: 1, qquad: 2 }
const MATRICES = new Set(['pmatrix', 'bmatrix', 'vmatrix', 'matrix'])

export class TexError extends Error {
  readonly source: string
  /** 0-based index into the source */
  readonly position: number

  constructor(message: string, source: string, position: number) {
    super(`${message} at ${position + 1} in "${source}"`)
    this.name = 'TexError'
    this.source = source
    this.position = position
  }
}

/** Every command the parser knows, for "did you mean" messages and discovery. */
export const TEX_COMMANDS = [
  ...Object.keys(GREEK), ...Object.keys(SYMBOLS), ...Object.keys(BIG_OPS), ...Object.keys(OP_NAMES), ...Object.keys(SPACES).filter((k) => k.length > 1),
  'frac', 'sqrt', 'vec', 'hat', 'bar', 'text', 'color', 'id', 'val', 'begin', 'end', 'left', 'right',
].sort()

/** Parse a TeX string into a group node. */
export function parseTex(source: string): TexNode {
  if (typeof source !== 'string') throw new TypeError('parseTex: expected a string')
  let i = 0

  const skipSpace = () => {
    while (i < source.length && /\s/.test(source[i])) i++
  }
  const fail = (message: string, at = i): never => {
    throw new TexError(message, source, at)
  }
  const readCommandName = (): string => {
    // After a backslash: letters, or one non-letter (\, \; \\ \{).
    const start = i
    if (/[A-Za-z]/.test(source[i] ?? '')) {
      while (/[A-Za-z]/.test(source[i] ?? '')) i++
    } else if (i < source.length) {
      i++
    } else {
      fail('A backslash with no command')
    }
    return source.slice(start, i)
  }
  /** The raw text of a `{…}` argument, for names and colours. */
  const readRawArgument = (what: string): string => {
    skipSpace()
    if (source[i] !== '{') fail(`Expected "{" for ${what}`)
    const close = source.indexOf('}', i)
    if (close < 0) fail(`Missing "}" for ${what}`)
    const text = source.slice(i + 1, close)
    i = close + 1
    return text
  }
  /** One argument: a `{group}` or a single token. */
  const readArgument = (what: string): TexNode => {
    skipSpace()
    if (i >= source.length) fail(`Missing ${what}`)
    if (source[i] === '{') {
      i++
      const body = readList('}')
      i++
      return { type: 'group', body }
    }
    const atom = readAtom()
    if (!atom) fail(`Missing ${what}`)
    return atom as TexNode
  }

  /** Read nodes until `end` ('}' or the end of input, or a matrix's & / \\ / \end). */
  const readList = (end: '}' | '' | 'cell'): TexNode[] => {
    const nodes: TexNode[] = []
    for (;;) {
      skipSpace()
      if (i >= source.length) {
        if (end === '}') fail('Missing "}"')
        if (end === 'cell') fail('Missing \\end')
        return nodes
      }
      if (end === '}' && source[i] === '}') return nodes
      if (source[i] === '}') fail('Unexpected "}"')
      if (end === 'cell' && (source[i] === '&' || source.startsWith('\\\\', i) || source.startsWith('\\end', i))) return nodes
      if (source[i] === '^' || source[i] === '_') {
        const at = i
        const isSup = source[i] === '^'
        i++
        const script = readArgument(isSup ? 'superscript' : 'subscript')
        let base = nodes.pop() ?? { type: 'group', body: [] }
        if (base.type !== 'scripts') base = { type: 'scripts', base }
        if (base.type === 'scripts') {
          if ((isSup && base.sup) || (!isSup && base.sub)) fail(`Double ${isSup ? 'superscript' : 'subscript'}`, at)
          if (isSup) base.sup = script
          else base.sub = script
        }
        nodes.push(base)
        continue
      }
      if (source[i] === "'") {
        // f' is f^{′}
        i++
        const prime: TexNode = { type: 'symbol', text: '′', cls: 'ord', italic: false }
        const base = nodes.pop() ?? { type: 'group', body: [] }
        nodes.push(base.type === 'scripts' && !base.sup ? { ...base, sup: prime } : { type: 'scripts', base, sup: prime })
        continue
      }
      const atom = readAtom()
      if (atom) nodes.push(atom)
    }
  }

  const readAtom = (): TexNode | undefined => {
    const ch = source[i]
    if (ch === '{') {
      i++
      const body = readList('}')
      i++
      return { type: 'group', body }
    }
    if (ch === '&') fail('"&" outside a matrix')
    if (ch === '\\') {
      const at = i
      i++
      const name = readCommandName()
      if (name === '\\') fail('"\\\\" outside a matrix', at)
      if (name in SPACES) return { type: 'space', width: SPACES[name] }
      if (name === '{' || name === '}') return { type: 'symbol', text: name, cls: name === '{' ? 'open' : 'close', italic: false }
      if (name === '|') return { type: 'symbol', text: '‖', cls: 'ord', italic: false }
      if (Object.prototype.hasOwnProperty.call(GREEK, name)) {
        // Lowercase Greek is italic in TeX; capitals are upright.
        return { type: 'symbol', text: GREEK[name], cls: 'ord', italic: name[0] === name[0].toLowerCase() }
      }
      if (Object.prototype.hasOwnProperty.call(SYMBOLS, name)) {
        const [text, cls] = SYMBOLS[name]
        return { type: 'symbol', text, cls, italic: false }
      }
      if (Object.prototype.hasOwnProperty.call(BIG_OPS, name)) {
        const [text, limits] = BIG_OPS[name]
        return { type: 'bigop', text, limits }
      }
      if (Object.prototype.hasOwnProperty.call(OP_NAMES, name)) return { type: 'opname', text: name, limits: OP_NAMES[name] }
      switch (name) {
        case 'frac':
          return { type: 'frac', num: readArgument('numerator'), den: readArgument('denominator') }
        case 'sqrt':
          return { type: 'sqrt', body: readArgument('the square root\'s body') }
        case 'vec':
        case 'hat':
        case 'bar':
          return { type: 'accent', accent: name, body: readArgument(`\\${name}'s body`) }
        case 'text':
          return { type: 'text', text: readRawArgument('\\text') }
        case 'color': {
          const color = readRawArgument('\\color').trim()
          if (!/^(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)$/.test(color)) fail(`"${color}" is not a colour name or #hex`, at)
          return { type: 'color', color, body: readArgument('\\color\'s body') }
        }
        case 'id': {
          const id = readRawArgument('\\id').trim()
          if (!/^[\w.-]+$/.test(id)) fail(`"${id}" is not a term id (letters, digits, _ . -)`, at)
          return { type: 'id', id, body: readArgument('\\id\'s body') }
        }
        case 'val': {
          const raw = readRawArgument('\\val').trim()
          const match = /^([A-Za-z_][\w.]*)(?::(\d))?$/.exec(raw)
          if (!match) fail(`"${raw}" is not a value name (name or name:digits)`, at)
          return { type: 'value', name: match![1], digits: match![2] === undefined ? 2 : Number(match![2]) }
        }
        case 'left':
        case 'right': {
          // Delimiters at their natural size; the matrix environments size their own.
          skipSpace()
          const delimiter = source[i] === '\\' ? (i++, readCommandName()) : source[i++]
          if (delimiter === '.') return { type: 'space', width: 0 }
          const map: Record<string, string> = { '(': '(', ')': ')', '[': '[', ']': ']', '|': '|', '{': '{', '}': '}', langle: '⟨', rangle: '⟩', '|.': '‖' }
          const text = map[delimiter]
          if (!text) fail(`"${delimiter}" is not a delimiter`, at)
          return { type: 'symbol', text, cls: name === 'left' ? 'open' : 'close', italic: false }
        }
        case 'begin': {
          const env = readRawArgument('\\begin').trim()
          if (!MATRICES.has(env)) fail(`Unknown environment "${env}" (use ${[...MATRICES].join(', ')})`, at)
          const rows: TexNode[][] = [[]]
          for (;;) {
            const cell = readList('cell')
            rows[rows.length - 1].push({ type: 'group', body: cell })
            if (source[i] === '&') {
              i++
            } else if (source.startsWith('\\\\', i)) {
              i += 2
              rows.push([])
            } else {
              i += 4 // \end
              const closing = readRawArgument('\\end').trim()
              if (closing !== env) fail(`\\begin{${env}} ended by \\end{${closing}}`)
              break
            }
          }
          // A trailing \\ leaves an empty last row.
          if (rows.length > 1 && rows[rows.length - 1].every((cell) => cell.type === 'group' && cell.body.length === 0)) rows.pop()
          return { type: 'matrix', delimiters: env as 'pmatrix', rows }
        }
        case 'end':
          return fail('\\end without \\begin', at)
      }
      const guess = closestName(name, TEX_COMMANDS)
      return fail(`Unknown command "\\${name}"${guess ? ` (did you mean "\\${guess}"?)` : ''}`, at)
    }
    i++
    if (/[A-Za-z]/.test(ch)) return { type: 'symbol', text: ch, cls: 'ord', italic: true }
    if (/[0-9.]/.test(ch)) return { type: 'symbol', text: ch, cls: 'ord', italic: false }
    if (ch === '+') return { type: 'symbol', text: '+', cls: 'bin', italic: false }
    if (ch === '-') return { type: 'symbol', text: '−', cls: 'bin', italic: false }
    if (ch === '*') return { type: 'symbol', text: '∗', cls: 'bin', italic: false }
    if ('=<>'.includes(ch)) return { type: 'symbol', text: ch, cls: 'rel', italic: false }
    if ('(['.includes(ch)) return { type: 'symbol', text: ch, cls: 'open', italic: false }
    if (')]'.includes(ch)) return { type: 'symbol', text: ch, cls: 'close', italic: false }
    if (',;'.includes(ch)) return { type: 'symbol', text: ch, cls: 'punct', italic: false }
    if ('|/!:'.includes(ch)) return { type: 'symbol', text: ch, cls: ch === ':' ? 'rel' : 'ord', italic: false }
    return fail(`Unexpected "${ch}"`, i - 1)
  }

  const body = readList('')
  return { type: 'group', body }
}
