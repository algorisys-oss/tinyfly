// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { setTextContent } from './text-content'

describe('setTextContent', () => {
  it('updates a lone text node in place, so frameworks keep their reference', () => {
    const el = document.createElement('div')
    el.textContent = 'before'
    const node = el.firstChild
    setTextContent(el, 'after')
    expect(el.firstChild).toBe(node)
    expect(el.textContent).toBe('after')
  })

  it('replaces mixed or empty content', () => {
    const el = document.createElement('div')
    el.innerHTML = '<b>a</b> b'
    setTextContent(el, 'plain')
    expect(el.innerHTML).toBe('plain')

    const empty = document.createElement('div')
    setTextContent(empty, 'x')
    expect(empty.textContent).toBe('x')
  })
})
