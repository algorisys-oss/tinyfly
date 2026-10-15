import type { Expression } from './parse-expression'

/**
 * Symbolic derivatives of parsed expressions, so slopes, tangent lines and
 * Taylor polynomials are exact rather than finite differences (which grow
 * noisy past the second derivative). Every function in FUNCTIONS has a rule;
 * results are simplified enough to stay small when differentiated again.
 * Pure: the same expression always gives the same derivative.
 */

const num = (value: number): Expression => ({ type: 'number', value })
const ZERO = num(0)
const ONE = num(1)

const isNum = (e: Expression): e is { type: 'number'; value: number } => e.type === 'number'
/** True when `e` is exactly the number `value` (not a type guard: false says nothing about its type). */
const is = (e: Expression, value: number): boolean => e.type === 'number' && e.value === value

function add(a: Expression, b: Expression): Expression {
  if (isNum(a) && isNum(b)) return num(a.value + b.value)
  if (is(a, 0)) return b
  if (is(b, 0)) return a
  return { type: 'binary', operator: '+', left: a, right: b }
}

function sub(a: Expression, b: Expression): Expression {
  if (isNum(a) && isNum(b)) return num(a.value - b.value)
  if (is(b, 0)) return a
  if (is(a, 0)) return neg(b)
  return { type: 'binary', operator: '-', left: a, right: b }
}

function mul(a: Expression, b: Expression): Expression {
  if (isNum(a) && isNum(b)) return num(a.value * b.value)
  if (is(a, 0) || is(b, 0)) return ZERO
  if (is(a, 1)) return b
  if (is(b, 1)) return a
  // Numbers to the front, merged: 2 * (3 * x) is 6 * x.
  if (isNum(b)) return mul(b, a)
  if (isNum(a) && b.type === 'binary' && b.operator === '*' && isNum(b.left)) return mul(num(a.value * b.left.value), b.right)
  return { type: 'binary', operator: '*', left: a, right: b }
}

function div(a: Expression, b: Expression): Expression {
  if (is(a, 0)) return ZERO
  if (is(b, 1)) return a
  if (isNum(a) && isNum(b) && b.value !== 0) return num(a.value / b.value)
  return { type: 'binary', operator: '/', left: a, right: b }
}

function pow(a: Expression, b: Expression): Expression {
  if (is(b, 0)) return ONE
  if (is(b, 1)) return a
  if (isNum(a) && isNum(b)) return num(a.value ** b.value)
  return { type: 'binary', operator: '^', left: a, right: b }
}

function neg(a: Expression): Expression {
  if (isNum(a)) return num(-a.value)
  if (a.type === 'unary' && a.operator === '-') return a.operand
  return { type: 'unary', operator: '-', operand: a }
}

const call = (name: string, ...args: Expression[]): Expression => ({ type: 'call', name, args })

/** True when the expression does not read `variable`. */
function constant(e: Expression, variable: string): boolean {
  switch (e.type) {
    case 'number': return true
    case 'name': return e.name !== variable
    case 'unary': return constant(e.operand, variable)
    case 'binary': return constant(e.left, variable) && constant(e.right, variable)
    case 'call': return e.args.every((arg) => constant(arg, variable))
  }
}

/** d/d`variable` of `e`, simplified. Throws for functions with no derivative rule (floor, round …). */
export function differentiate(e: Expression, variable = 'x'): Expression {
  if (constant(e, variable)) return ZERO
  switch (e.type) {
    case 'number':
      return ZERO
    case 'name':
      return e.name === variable ? ONE : ZERO
    case 'unary':
      return e.operator === '-' ? neg(differentiate(e.operand, variable)) : differentiate(e.operand, variable)
    case 'binary': {
      const { left: f, right: g } = e
      const df = () => differentiate(f, variable)
      const dg = () => differentiate(g, variable)
      switch (e.operator) {
        case '+': return add(df(), dg())
        case '-': return sub(df(), dg())
        case '*': return add(mul(df(), g), mul(f, dg()))
        case '/': return div(sub(mul(df(), g), mul(f, dg())), pow(g, num(2)))
        case '^':
          if (constant(g, variable)) {
            // Power rule: (f^n)' = n f^(n-1) f'
            const exponent = isNum(g) ? num(g.value - 1) : sub(g, ONE)
            return mul(mul(g, pow(f, exponent)), df())
          }
          if (constant(f, variable)) {
            // (a^g)' = a^g ln(a) g'
            return mul(mul(e, call('ln', f)), dg())
          }
          // f^g = exp(g ln f)
          return mul(e, add(mul(dg(), call('ln', f)), div(mul(g, df()), f)))
      }
      break
    }
    case 'call': {
      const [u, v] = e.args
      const du = () => differentiate(u, variable)
      const chain = (outer: Expression) => mul(outer, du())
      switch (e.name) {
        case 'sin': return chain(call('cos', u))
        case 'cos': return chain(neg(call('sin', u)))
        case 'tan': return chain(div(ONE, pow(call('cos', u), num(2))))
        case 'asin': return chain(div(ONE, call('sqrt', sub(ONE, pow(u, num(2))))))
        case 'acos': return chain(neg(div(ONE, call('sqrt', sub(ONE, pow(u, num(2)))))))
        case 'atan': return chain(div(ONE, add(ONE, pow(u, num(2)))))
        case 'sinh': return chain(call('cosh', u))
        case 'cosh': return chain(call('sinh', u))
        case 'tanh': return chain(sub(ONE, pow(call('tanh', u), num(2))))
        case 'exp': return chain(e)
        case 'ln': return chain(div(ONE, u))
        case 'log': return chain(div(ONE, mul(u, num(Math.LN10))))
        case 'log2': return chain(div(ONE, mul(u, num(Math.LN2))))
        case 'sqrt': return chain(div(ONE, mul(num(2), e)))
        case 'abs': return chain(call('sign', u))
        case 'sigmoid': return chain(mul(e, sub(ONE, e)))
        case 'relu': return chain(div(add(call('sign', u), ONE), num(2)))
        case 'atan2': {
          // atan2(y, x)' = (x y' − y x') / (x² + y²)
          const dv = differentiate(v, variable)
          return div(sub(mul(v, du()), mul(u, dv)), add(pow(u, num(2)), pow(v, num(2))))
        }
        case 'min':
        case 'max': {
          // Piecewise: the derivative of whichever argument is chosen.
          const pick = e.name === 'max' ? 1 : -1
          const dv = differentiate(v, variable)
          const choose = div(add(ONE, mul(num(pick), call('sign', sub(u, v)))), num(2))
          return add(mul(choose, du()), mul(sub(ONE, choose), dv))
        }
      }
      throw new Error(`differentiate: "${e.name}" has no derivative rule`)
    }
  }
  throw new Error('differentiate: malformed expression')
}

/** The n-th derivative (n = 0 gives the expression itself). */
export function nthDerivative(e: Expression, n: number, variable = 'x'): Expression {
  let result = e
  for (let k = 0; k < n; k++) result = differentiate(result, variable)
  return result
}

/** Back to source text, for showing or caching a derived expression. */
export function expressionToString(e: Expression): string {
  switch (e.type) {
    case 'number': return e.value < 0 ? `(${e.value})` : String(e.value)
    case 'name': return e.name
    case 'unary': return `(${e.operator}${expressionToString(e.operand)})`
    case 'binary': return `(${expressionToString(e.left)} ${e.operator} ${expressionToString(e.right)})`
    case 'call': return `${e.name}(${e.args.map(expressionToString).join(', ')})`
  }
}
