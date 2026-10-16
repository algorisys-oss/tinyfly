import { describe, it, expect } from 'vitest'
import { parseTex, TexError } from './tex-parser'
import { layoutTex, type TexGlyph } from './tex-layout'
import { morphEquation } from './equation-morph'

const glyphs = (source: string, values?: Record<string, number>) =>
  layoutTex(source, { values }).pieces.filter((p): p is TexGlyph => p.kind === 'glyph')
const texts = (source: string) => glyphs(source).map((g) => g.text).join('')

describe('parseTex', () => {
  it('reads symbols, commands, scripts and environments', () => {
    expect(texts('x^2 + y_1 = \\alpha')).toBe('x2+y1=α')
    expect(texts('a - b \\cdot c \\le \\infty')).toBe('a−b·c≤∞')
    expect(texts('\\sin x + \\text{area}')).toBe('sinx+area')
    expect(texts('\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}')).toBe('1234')
    expect(texts("f'(x)")).toBe('f′(x)')
    expect(texts('A \\triangle B \\cup \\varnothing')).toBe('A△B∪∅')
    expect(texts('\\binom{n}{k}')).toBe('(nk)')
    expect(layoutTex('\\binom{n}{k}').pieces.some((p) => p.kind === 'rule')).toBe(false)
  })

  it('names the position of a mistake and suggests a command', () => {
    expect(() => parseTex('\\fracc{1}{2}')).toThrow(/Unknown command "\\fracc" \(did you mean "\\frac"\?\)/)
    expect(() => parseTex('x^')).toThrow(/Missing superscript/)
    expect(() => parseTex('{x')).toThrow(/Missing "}"/)
    expect(() => parseTex('x^2^3')).toThrow(/Double superscript/)
    expect(() => parseTex('a & b')).toThrow(TexError)
    expect(() => parseTex('\\begin{pmatrix} 1 \\end{bmatrix}')).toThrow(/ended by/)
    expect(() => parseTex('\\begin{array} 1 \\end{array}')).toThrow(/Unknown environment/)
  })
})

describe('layoutTex', () => {
  it('is deterministic: the same TeX gives the same numbers', () => {
    const source = '\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'
    expect(layoutTex(source)).toEqual(layoutTex(source))
  })

  it('raises superscripts, lowers subscripts and shrinks both', () => {
    const [x, two] = glyphs('x^2')
    expect(two.y).toBeLessThan(x.y)
    expect(two.size).toBeLessThan(x.size)
    const [, one] = glyphs('x_1')
    expect(one.y).toBeGreaterThan(0)
  })

  it('puts a numerator above a bar above a denominator', () => {
    const layout = layoutTex('\\frac{1}{2}')
    const [one, two] = layout.pieces.filter((p): p is TexGlyph => p.kind === 'glyph')
    const bar = layout.pieces.find((p) => p.kind === 'rule')!
    expect(one.y).toBeLessThan(bar.y as number)
    expect(two.y).toBeGreaterThan(bar.y as number)
    expect(layout.height).toBeGreaterThan(0.7)
    expect(layout.depth).toBeGreaterThan(0.3)
  })

  it('spaces binary operators and relations but not a leading minus', () => {
    const [a, plus, b] = glyphs('a + b')
    expect(plus.x - (a.x + a.width)).toBeCloseTo(4 / 18)
    expect(b.x - (plus.x + plus.width)).toBeCloseTo(4 / 18)
    const [minus, x] = glyphs('-x')
    expect(x.x).toBeCloseTo(minus.x + minus.width)
  })

  it('stacks display limits and sets them beside the operator inline', () => {
    const display = glyphs('\\sum_{i=1}^n i')
    const inline = layoutTex('\\sum_{i=1}^n i', { style: 'inline' }).pieces.filter((p): p is TexGlyph => p.kind === 'glyph')
    const sigma = display.find((g) => g.text === '∑')!
    const n = display.find((g) => g.text === 'n')!
    expect(n.x).toBeLessThan(sigma.x + sigma.width) // above it
    const inlineSigma = inline.find((g) => g.text === '∑')!
    expect(inline.find((g) => g.text === 'n')!.x).toBeGreaterThanOrEqual(inlineSigma.x + inlineSigma.width)
  })

  it('numbers plain terms by occurrence and lets \\id name a term', () => {
    expect(glyphs('x + x').map((g) => g.id)).toEqual(['x#1', '+#1', 'x#2'])
    expect(glyphs('\\id{lhs}{2x} = 4').map((g) => g.id)).toEqual(['lhs', 'lhs', '=#1', '4#1'])
  })

  it('shows live values, trimmed, with a real minus sign', () => {
    expect(glyphs('\\val{a}', { a: 1.5 }).map((g) => g.text).join('')).toBe('1.5')
    expect(glyphs('\\val{a:1}', { a: -0.04 }).map((g) => g.text).join('')).toBe('0')
    expect(glyphs('\\val{a}', { a: -2 }).map((g) => g.text).join('')).toBe('−2')
    expect(glyphs('\\val{a:0}', { a: 10 }).map((g) => g.text).join('')).toBe('10')
    expect(glyphs('\\val{a}', { a: 20.5 }).map((g) => g.text).join('')).toBe('20.5')
    expect(() => layoutTex('\\val{b}', { values: {} })).toThrow(/no value named "b"/)
  })

  it('colours a group', () => {
    expect(glyphs('\\color{red}{x} y').map((g) => g.color)).toEqual(['red', undefined])
  })
})

describe('morphEquation', () => {
  const from = { layout: layoutTex('2x + 3 = 7'), x: 0, y: 0 }
  const to = { layout: layoutTex('2x = 4'), x: 0, y: 0 }

  it('starts and ends exactly on the two equations', () => {
    expect(morphEquation(from, to, 0).map((p) => (p as TexGlyph).text).join('')).toBe('2x+3=7')
    expect(morphEquation(from, to, 1).map((p) => (p as TexGlyph).text).join('')).toBe('2x=4')
  })

  it('glides shared terms and fades the rest', () => {
    const middle = morphEquation(from, to, 0.5)
    const equals = middle.find((p) => p.id === '=#1') as TexGlyph & { opacity: number }
    const start = from.layout.pieces.find((p) => p.id === '=#1') as TexGlyph
    const end = to.layout.pieces.find((p) => p.id === '=#1') as TexGlyph
    expect(equals.opacity).toBe(1)
    expect(equals.x).toBeCloseTo((start.x + end.x) / 2)
    // + and 3 are fully gone by the middle; 4 has not appeared yet.
    expect(middle.some((p) => p.id === '+#1')).toBe(false)
    expect(morphEquation(from, to, 0.25).find((p) => p.id === '+#1')!.opacity).toBeCloseTo(0.5)
    expect(morphEquation(from, to, 0.75).find((p) => p.id === '4#1')!.opacity).toBeCloseTo(0.5)
  })
})
