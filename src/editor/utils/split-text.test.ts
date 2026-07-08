import { describe, it, expect } from 'vitest'
import { measureTextLetters, textElementFont } from './split-text'
import type { TextElement } from '../stores/scene-store'

function makeText(overrides: Partial<TextElement> = {}): TextElement {
  return {
    type: 'text',
    id: 't1',
    name: 'Text 1',
    x: 100,
    y: 50,
    width: 240,
    height: 40,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    text: 'ABC',
    fontSize: 32,
    fontFamily: 'sans-serif',
    fontWeight: 700,
    fill: '#fff',
    textAlign: 'center',
    ...overrides,
  }
}

describe('measureTextLetters', () => {
  it('produces one layout box per non-whitespace glyph', () => {
    const letters = measureTextLetters(makeText({ text: 'ABC' }))
    expect(letters.map((l) => l.char)).toEqual(['A', 'B', 'C'])
  })

  it('skips whitespace but keeps it advancing the layout', () => {
    const letters = measureTextLetters(makeText({ text: 'A B' }))
    // No box for the space...
    expect(letters.map((l) => l.char)).toEqual(['A', 'B'])
    // ...but the space still pushed B to the right of a 2-letter word.
    const noSpace = measureTextLetters(makeText({ text: 'AB' }))
    expect(letters[1].x).toBeGreaterThan(noSpace[1].x)
  })

  it('returns an empty array for empty text', () => {
    expect(measureTextLetters(makeText({ text: '' }))).toEqual([])
  })

  it('lays letters out left to right in reading order', () => {
    const letters = measureTextLetters(makeText({ text: 'ABC' }))
    expect(letters[0].x).toBeLessThan(letters[1].x)
    expect(letters[1].x).toBeLessThan(letters[2].x)
  })

  it('inherits y and height from the source element', () => {
    const letters = measureTextLetters(makeText({ y: 77, height: 55 }))
    for (const l of letters) {
      expect(l.y).toBe(77)
      expect(l.height).toBe(55)
    }
  })

  it('respects text alignment when positioning the run', () => {
    const el = makeText({ text: 'ABC', x: 0, width: 300 })
    const left = measureTextLetters({ ...el, textAlign: 'left' })
    const center = measureTextLetters({ ...el, textAlign: 'center' })
    const right = measureTextLetters({ ...el, textAlign: 'right' })

    expect(left[0].x).toBeLessThan(center[0].x)
    expect(center[0].x).toBeLessThan(right[0].x)
    // Left-aligned run starts at the element's left edge.
    expect(left[0].x).toBe(0)
  })

  it('is deterministic — same input yields identical layout', () => {
    const el = makeText({ text: 'HELLO' })
    expect(measureTextLetters(el)).toEqual(measureTextLetters(el))
  })
})

describe('textElementFont', () => {
  it('builds a CSS font shorthand from the element', () => {
    expect(textElementFont(makeText({ fontWeight: 700, fontSize: 32, fontFamily: 'Arial' }))).toBe(
      '700 32px Arial'
    )
  })
})
