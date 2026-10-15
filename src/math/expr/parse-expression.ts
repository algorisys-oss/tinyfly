/**
 * A small, safe expression language for functions written as data:
 * `"sin(x) * k"`, `"x^2 - 1"`, `"exp(-x^2 / 2) / sqrt(2 * pi)"`.
 *
 * - Numbers (`2`, `0.5`, `1e-3`), names (`x`, `t`, any parameter), `pi`, `e`
 * - `+ - * / ^` with the usual precedence; `^` binds right (`2^3^2` is 2^9),
 *   and tighter than unary minus (`-x^2` is −(x²))
 * - Function calls from a fixed list (see FUNCTIONS); nothing else is callable
 * - Implicit multiplication between a number and a name or bracket: `2x`, `3(x + 1)`
 *
 * Parsing builds a plain AST that can be evaluated many times. Nothing is ever
 * passed to `eval` or `Function`, so an expression can only read the names it
 * is given and call the listed functions.
 */
export type Expression =
  | { type: 'number'; value: number }
  | { type: 'name'; name: string }
  | { type: 'unary'; operator: '-' | '+'; operand: Expression }
  | { type: 'binary'; operator: '+' | '-' | '*' | '/' | '^'; left: Expression; right: Expression }
  | { type: 'call'; name: string; args: Expression[] }

/** Callable functions and how many arguments each takes. */
export const FUNCTIONS: Record<string, { arity: number; apply: (...args: number[]) => number }> = {
  sin: { arity: 1, apply: Math.sin },
  cos: { arity: 1, apply: Math.cos },
  tan: { arity: 1, apply: Math.tan },
  asin: { arity: 1, apply: Math.asin },
  acos: { arity: 1, apply: Math.acos },
  atan: { arity: 1, apply: Math.atan },
  atan2: { arity: 2, apply: Math.atan2 },
  sinh: { arity: 1, apply: Math.sinh },
  cosh: { arity: 1, apply: Math.cosh },
  tanh: { arity: 1, apply: Math.tanh },
  exp: { arity: 1, apply: Math.exp },
  ln: { arity: 1, apply: Math.log },
  log: { arity: 1, apply: Math.log10 },
  log2: { arity: 1, apply: Math.log2 },
  sqrt: { arity: 1, apply: Math.sqrt },
  abs: { arity: 1, apply: Math.abs },
  floor: { arity: 1, apply: Math.floor },
  ceil: { arity: 1, apply: Math.ceil },
  round: { arity: 1, apply: Math.round },
  sign: { arity: 1, apply: Math.sign },
  min: { arity: 2, apply: Math.min },
  max: { arity: 2, apply: Math.max },
  // The logistic function, common in ML lessons
  sigmoid: { arity: 1, apply: (x) => 1 / (1 + Math.exp(-x)) },
  relu: { arity: 1, apply: (x) => Math.max(0, x) },
}

export const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E, tau: Math.PI * 2 }

export class ExpressionError extends Error {
  readonly source: string
  /** 0-based index into the source */
  readonly position: number

  constructor(message: string, source: string, position: number) {
    super(`${message} at ${position + 1} in "${source}"`)
    this.name = 'ExpressionError'
    this.source = source
    this.position = position
  }
}

type Token =
  | { kind: 'number'; value: number; at: number }
  | { kind: 'name'; value: string; at: number }
  | { kind: 'op'; value: string; at: number }
  | { kind: 'end'; at: number }

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < source.length) {
    const ch = source[i]
    if (/\s/.test(ch)) {
      i++
      continue
    }
    const number = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(source.slice(i))
    if (number) {
      tokens.push({ kind: 'number', value: Number(number[0]), at: i })
      i += number[0].length
      continue
    }
    const name = /^[A-Za-z_][A-Za-z_0-9]*/.exec(source.slice(i))
    if (name) {
      tokens.push({ kind: 'name', value: name[0], at: i })
      i += name[0].length
      continue
    }
    if ('+-*/^(),'.includes(ch)) {
      tokens.push({ kind: 'op', value: ch, at: i })
      i++
      continue
    }
    throw new ExpressionError(`Unexpected "${ch}"`, source, i)
  }
  tokens.push({ kind: 'end', at: source.length })
  return tokens
}

/** Parse `source` into an AST; throws an ExpressionError naming the position. */
export function parseExpression(source: string): Expression {
  if (typeof source !== 'string') throw new TypeError('parseExpression: expected a string')
  const tokens = tokenize(source)
  let index = 0
  const peek = () => tokens[index]
  const isOp = (value: string) => {
    const token = peek()
    return token.kind === 'op' && token.value === value
  }
  const expect = (value: string) => {
    if (!isOp(value)) throw new ExpressionError(`Expected "${value}"`, source, peek().at)
    index++
  }

  // sum := product (('+' | '-') product)*
  const sum = (): Expression => {
    let left = product()
    while (isOp('+') || isOp('-')) {
      const operator = (tokens[index++] as { value: '+' | '-' }).value
      left = { type: 'binary', operator, left, right: product() }
    }
    return left
  }
  // product := unary (('*' | '/') unary | implicit unary)*
  const product = (): Expression => {
    let left = unary()
    for (;;) {
      if (isOp('*') || isOp('/')) {
        const operator = (tokens[index++] as { value: '*' | '/' }).value
        left = { type: 'binary', operator, left, right: unary() }
      } else if (peek().kind === 'name' || peek().kind === 'number' || isOp('(')) {
        // 2x, 3(x + 1), x y: multiplication without a sign.
        left = { type: 'binary', operator: '*', left, right: power() }
      } else {
        return left
      }
    }
  }
  // unary := ('-' | '+') unary | power
  const unary = (): Expression => {
    if (isOp('-') || isOp('+')) {
      const operator = (tokens[index++] as { value: '-' | '+' }).value
      return { type: 'unary', operator, operand: unary() }
    }
    return power()
  }
  // power := atom ('^' unary)?   (right-associative through unary)
  const power = (): Expression => {
    const base = atom()
    if (!isOp('^')) return base
    index++
    return { type: 'binary', operator: '^', left: base, right: unary() }
  }
  const atom = (): Expression => {
    const token = peek()
    if (token.kind === 'number') {
      index++
      return { type: 'number', value: token.value }
    }
    if (token.kind === 'name') {
      index++
      if (!isOp('(')) return { type: 'name', name: token.value }
      const fn = Object.prototype.hasOwnProperty.call(FUNCTIONS, token.value) ? FUNCTIONS[token.value] : undefined
      if (!fn) throw new ExpressionError(`Unknown function "${token.value}"`, source, token.at)
      index++
      const args: Expression[] = []
      if (!isOp(')')) {
        args.push(sum())
        while (isOp(',')) {
          index++
          args.push(sum())
        }
      }
      expect(')')
      if (args.length !== fn.arity) {
        throw new ExpressionError(`"${token.value}" takes ${fn.arity} argument${fn.arity === 1 ? '' : 's'}, got ${args.length}`, source, token.at)
      }
      return { type: 'call', name: token.value, args }
    }
    if (isOp('(')) {
      index++
      const inner = sum()
      expect(')')
      return inner
    }
    throw new ExpressionError(token.kind === 'end' ? 'Unexpected end' : `Unexpected "${(token as { value: string }).value}"`, source, token.at)
  }

  const tree = sum()
  if (peek().kind !== 'end') throw new ExpressionError(`Unexpected "${(peek() as { value: string }).value}"`, source, peek().at)
  return tree
}

/** Every variable name the expression reads (constants excluded), sorted. */
export function expressionNames(expression: Expression): string[] {
  const names = new Set<string>()
  const visit = (node: Expression): void => {
    if (node.type === 'name' && !(node.name in CONSTANTS)) names.add(node.name)
    else if (node.type === 'unary') visit(node.operand)
    else if (node.type === 'binary') {
      visit(node.left)
      visit(node.right)
    } else if (node.type === 'call') node.args.forEach(visit)
  }
  visit(expression)
  return [...names].sort()
}
