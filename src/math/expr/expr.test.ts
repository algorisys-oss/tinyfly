import { describe, it, expect } from 'vitest'
import { expressionNames, parseExpression, ExpressionError } from './parse-expression'
import { compile, evaluate } from './evaluate'

const value = (source: string, scope = {}) => evaluate(parseExpression(source), scope)

describe('expressions', () => {
  it('follows the usual precedence', () => {
    expect(value('1 + 2 * 3')).toBe(7)
    expect(value('(1 + 2) * 3')).toBe(9)
    expect(value('2^3^2')).toBe(512) // right-associative
    expect(value('-2^2')).toBe(-4) // −(2²)
    expect(value('2^-1')).toBe(0.5)
    expect(value('10 / 4 / 5')).toBe(0.5)
  })

  it('multiplies implicitly between numbers, names and brackets', () => {
    expect(value('2x', { x: 3 })).toBe(6)
    expect(value('3(x + 1)', { x: 1 })).toBe(6)
    expect(value('2x^2', { x: 3 })).toBe(18)
    expect(value('(x + 1)(x - 1)', { x: 3 })).toBe(8)
  })

  it('reads constants, parameters and listed functions', () => {
    expect(value('sin(pi / 2)')).toBe(1)
    expect(value('max(a, b)', { a: 2, b: 5 })).toBe(5)
    expect(value('sigmoid(0)')).toBe(0.5)
    expect(value('1e-3 * 1000')).toBe(1)
    expect(expressionNames(parseExpression('k sin(x) + pi'))).toEqual(['k', 'x'])
  })

  it('gives NaN and infinities for plots to treat as gaps', () => {
    expect(value('1 / x', { x: 0 })).toBe(Infinity)
    expect(value('sqrt(x)', { x: -1 })).toBeNaN()
  })

  it('names the position of a mistake', () => {
    expect(() => parseExpression('1 +')).toThrow(/Unexpected end at 4/)
    expect(() => parseExpression('sin(x')).toThrow(/Expected "\)"/)
    expect(() => parseExpression('foo(x)')).toThrow(/Unknown function "foo"/)
    expect(() => parseExpression('max(1)')).toThrow(/takes 2 arguments, got 1/)
    expect(() => parseExpression('x # 2')).toThrow(ExpressionError)
  })

  it('cannot reach anything but its scope, constants and functions', () => {
    expect(() => value('constructor')).toThrow(/unknown name "constructor"/)
    expect(() => value('toString(1)')).toThrow(/Unknown function/)
    expect(() => value('y', { x: 1 })).toThrow(/unknown name "y"/)
  })

  it('compiles a function of one variable that reads parameters at call time', () => {
    const f = compile('a x^2 + b', 'x')
    expect(f(2, { a: 3, b: 1 })).toBe(13)
    expect(f(2, { a: 0, b: 1 })).toBe(1)
  })
})
