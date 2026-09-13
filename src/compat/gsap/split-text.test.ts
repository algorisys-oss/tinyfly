// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { splitText } from './split-text'
import { createLive } from './live'
import { Stage } from './stage'

/**
 * happy-dom has no layout, so tests that group lines give each word a
 * position: `tops` maps a word's text to its top edge.
 */
function layoutWords(tops: Record<string, number>) {
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const top = tops[this.textContent ?? ''] ?? 0
    return { top, bottom: top + 20, height: 20, left: 0, right: 50, width: 50, x: 0, y: top, toJSON: () => ({}) } as DOMRect
  })
}

let host: HTMLElement
beforeEach(() => {
  document.body.innerHTML = '<h1 id="title">Hello big <em>bright</em> world</h1>'
  host = document.getElementById('title')!
})
afterEach(() => vi.restoreAllMocks())

describe('splitText — words and chars', () => {
  it('wraps words and characters, keeping spaces as text so it still reads and wraps', () => {
    const split = splitText([host], { type: 'words,chars' })
    expect(split.words.map((w) => w.textContent)).toEqual(['Hello', 'big', 'bright', 'world'])
    expect(split.chars.map((c) => c.textContent).join('')).toBe('Hellobigbrightworld')
    expect(host.textContent).toBe('Hello big bright world')
    // Inline markup around a word is kept.
    expect(host.querySelector('em .word')?.textContent).toBe('bright')
    expect(split.words[0].style.display).toBe('inline-block')
    expect(split.chars[0].className).toBe('char')
  })

  it('keeps grapheme clusters whole', () => {
    host.textContent = 'hi 👍🏽'
    const split = splitText([host], { type: 'chars' })
    expect(split.chars.map((c) => c.textContent)).toEqual(['h', 'i', '👍🏽'])
    // Words were wrapped internally but not reported or classed.
    expect(split.words).toEqual([])
    expect(host.querySelector('.word')).toBeNull()
  })

  it('labels the element and hides the pieces from screen readers, unless told not to', () => {
    splitText([host], { type: 'words' })
    expect(host.getAttribute('aria-label')).toBe('Hello big bright world')
    expect(host.querySelector('.word')?.getAttribute('aria-hidden')).toBe('true')

    document.body.innerHTML = '<p id="p">plain text</p>'
    const p = document.getElementById('p')!
    splitText([p], { type: 'words', aria: false })
    expect(p.hasAttribute('aria-label')).toBe(false)
  })

  it('reverts to the original markup and attributes', () => {
    const before = host.innerHTML
    const split = splitText([host], { type: 'chars,words,lines', mask: 'lines' })
    split.revert()
    expect(host.innerHTML).toBe(before)
    expect(host.hasAttribute('aria-label')).toBe(false)
  })

  it('uses custom class names', () => {
    const split = splitText([host], { type: 'chars,words', charsClass: 'c', wordsClass: 'w' })
    expect(split.words[0].className).toBe('w')
    expect(split.chars[0].className).toBe('c')
  })
})

describe('splitText — lines', () => {
  it('groups words into lines by where they were laid out', () => {
    layoutWords({ Hello: 0, big: 0, bright: 30, world: 30 })
    const split = splitText([host], { type: 'lines,words' })
    expect(split.lines.map((l) => l.textContent?.trim())).toEqual(['Hello big', 'bright world'])
    expect(split.lines[0].style.display).toBe('block')
    expect(host.children.length).toBe(2)
  })

  it('clones inline markup into every line it spans', () => {
    document.body.innerHTML = '<p id="p">one <a href="#x">two three</a> four</p>'
    const p = document.getElementById('p')!
    layoutWords({ one: 0, two: 0, three: 30, four: 30 })
    const split = splitText([p], { type: 'lines' })
    expect(split.lines).toHaveLength(2)
    expect(split.lines[0].querySelector('a')?.textContent?.trim()).toBe('two')
    expect(split.lines[1].querySelector('a')?.textContent).toBe('three')
    expect(split.lines[1].querySelector('a')?.getAttribute('href')).toBe('#x')
    expect(p.textContent?.replace(/\s+/g, ' ').trim()).toBe('one two three four')
  })

  it('treats a word slightly lower on the same line (a larger font) as the same line, and <br> as a break', () => {
    document.body.innerHTML = '<p id="p">small BIG<br>next</p>'
    const p = document.getElementById('p')!
    layoutWords({ small: 4, BIG: 0, next: 4 })
    const split = splitText([p], { type: 'lines' })
    expect(split.lines.map((l) => l.textContent?.trim())).toEqual(['small BIG', 'next'])
  })

  it('wraps each line in a clipping mask', () => {
    layoutWords({ Hello: 0, big: 0, bright: 30, world: 30 })
    const split = splitText([host], { type: 'lines', mask: 'lines' })
    expect(split.masks).toHaveLength(2)
    expect(split.masks[0].className).toBe('line-mask')
    expect(split.masks[0].style.overflow).toBe('clip')
    expect(split.masks[0].firstElementChild).toBe(split.lines[0])
  })
})

describe('live.splitText', () => {
  it('resolves selectors within the stage root, and the pieces animate', () => {
    const live = createLive(new Stage({ root: document.body, scheduler: { request: () => 1, cancel: () => {} } }))
    const split = live.splitText('#title', { type: 'words' })
    expect(split.elements).toEqual([host])
    const tl = live.from(split.words, { y: 20, opacity: 0, duration: 0.5, stagger: 0.1, paused: true })
    expect(tl.duration()).toBeCloseTo(0.8)
  })
})
