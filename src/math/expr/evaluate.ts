import { CONSTANTS, FUNCTIONS, parseExpression, type Expression } from './parse-expression'
import { nthDerivative } from './differentiate'

/** Variable values by name: `{ x: 1.5, k: 2 }`. */
export type Scope = Record<string, number>

/**
 * The value of a parsed expression for the given variables. Throws when a
 * name is neither in `scope` nor a constant. Results can be NaN or ±Infinity
 * (`1/0`, `sqrt(-1)`): plotting treats those as gaps.
 */
export function evaluate(expression: Expression, scope: Scope = {}): number {
  switch (expression.type) {
    case 'number':
      return expression.value
    case 'name': {
      // Own properties only: names like "constructor" never reach Object.prototype.
      if (Object.prototype.hasOwnProperty.call(scope, expression.name)) return scope[expression.name]
      if (Object.prototype.hasOwnProperty.call(CONSTANTS, expression.name)) return CONSTANTS[expression.name]
      throw new Error(`evaluate: unknown name "${expression.name}"`)
    }
    case 'unary': {
      const value = evaluate(expression.operand, scope)
      return expression.operator === '-' ? -value : value
    }
    case 'binary': {
      const left = evaluate(expression.left, scope)
      const right = evaluate(expression.right, scope)
      switch (expression.operator) {
        case '+': return left + right
        case '-': return left - right
        case '*': return left * right
        case '/': return left / right
        case '^': return left ** right
      }
      break
    }
    case 'call':
      return FUNCTIONS[expression.name].apply(...expression.args.map((arg) => evaluate(arg, scope)))
  }
  throw new Error('evaluate: malformed expression')
}

const CACHE = new Map<string, Expression>()

/**
 * A function of one variable from source text, parsed once:
 * `compile('sin(k x)', 'x')` gives `(x, scope) => number`. Parameters other
 * than the variable come from `scope` at call time.
 */
export function compile(source: string, variable = 'x'): (value: number, scope?: Scope) => number {
  let expression = CACHE.get(source)
  if (!expression) {
    expression = parseExpression(source)
    if (CACHE.size < 256) CACHE.set(source, expression)
  }
  const tree = expression
  return (value, scope = {}) => evaluate(tree, { ...scope, [variable]: value })
}

const DERIVATIVES = new Map<string, Expression>()

/**
 * The n-th derivative of a function of one variable from source text,
 * differentiated symbolically once and cached: `compileDerivative('sin(x)', 1)`
 * evaluates cos(x). n = 0 is the function itself.
 */
export function compileDerivative(source: string, n: number, variable = 'x'): (value: number, scope?: Scope) => number {
  if (!Number.isInteger(n) || n < 0) throw new Error(`compileDerivative: order must be a whole number ≥ 0, got ${n}`)
  const key = `${variable}|${n}|${source}`
  let tree = DERIVATIVES.get(key)
  if (!tree) {
    let base = CACHE.get(source)
    if (!base) base = parseExpression(source)
    tree = nthDerivative(base, n, variable)
    if (DERIVATIVES.size < 512) DERIVATIVES.set(key, tree)
  }
  const derived = tree
  return (value, scope = {}) => evaluate(derived, { ...scope, [variable]: value })
}
