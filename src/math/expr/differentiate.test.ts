import { describe, it, expect } from 'vitest'
import { parseExpression } from './parse-expression'
import { differentiate, expressionToString } from './differentiate'
import { compile, compileDerivative } from './evaluate'

/** A central difference, to check symbolic answers against. */
const numeric = (source: string, x: number, scope = {}) => {
  const f = compile(source)
  const h = 1e-5
  return (f(x + h, scope) - f(x - h, scope)) / (2 * h)
}

describe('differentiate', () => {
  const cases = [
    'x^3 - 2x + 1', 'sin(x) cos(x)', 'exp(-x^2 / 2)', 'ln(x^2 + 1)', '1 / (1 + x^2)', 'sqrt(x^2 + 4)',
    'tan(x)', 'atan(x)', 'x^x', '2^x', 'sigmoid(3x)', 'tanh(x)', 'asin(x / 2)', 'log(x)', 'k sin(k x)', 'cosh(x) - sinh(x)',
  ]
  for (const source of cases) {
    it(`matches a finite difference for ${source}`, () => {
      const d = compileDerivative(source, 1)
      for (const x of [0.3, 0.9, 1.7]) expect(d(x, { k: 2 })).toBeCloseTo(numeric(source, x, { k: 2 }), 5)
    })
  }

  it('simplifies as it goes', () => {
    expect(expressionToString(differentiate(parseExpression('5')))).toBe('0')
    expect(expressionToString(differentiate(parseExpression('3x')))).toBe('3')
    expect(expressionToString(differentiate(parseExpression('x^2')))).toBe('(2 * x)')
  })

  it('takes higher derivatives exactly', () => {
    const fourth = compileDerivative('sin(x)', 4)
    expect(fourth(0.7)).toBeCloseTo(Math.sin(0.7), 12)
    expect(compileDerivative('exp(2x)', 3)(0)).toBeCloseTo(8, 12)
    expect(compileDerivative('x^5', 5)(3)).toBe(120)
    expect(compileDerivative('x^5', 6)(3)).toBe(0)
  })

  it('refuses what has no derivative rule, and bad orders', () => {
    expect(() => differentiate(parseExpression('floor(x)'))).toThrow(/no derivative rule/)
    expect(() => compileDerivative('x', -1)).toThrow(/whole number/)
  })
})
