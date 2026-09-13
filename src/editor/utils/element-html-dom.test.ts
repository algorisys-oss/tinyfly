// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { generateElementHtml } from './element-html'

describe('text element HTML and animated fill', () => {
  it('marks text elements so an animated fill colours the text, not the background', async () => {
    const { DOMAdapter } = await import('../../adapters/dom')
    const html = generateElementHtml({
      id: 't', name: 'Title', type: 'text', x: 0, y: 0, width: 100, height: 30, rotation: 0, opacity: 1,
      visible: true, locked: false, text: 'Hi', fontSize: 16, fontFamily: 'sans-serif', fontWeight: 400, fill: '#ffffff', textAlign: 'center',
    } as never)
    expect(html).toContain('data-element-type="text"')

    const host = document.createElement('div')
    host.innerHTML = html
    const el = host.firstElementChild as HTMLElement
    const adapter = new DOMAdapter()
    adapter.registerTarget('Title', el)
    adapter.applyState({ values: new Map([['Title', new Map([['fill', '#3ecf7a']])]]), currentTime: 0, playbackState: 'playing', direction: 'forward', loopIteration: 0 })
    expect(el.style.color).toMatch(/3ecf7a|62, 207, 122/)
    expect(el.style.backgroundColor).not.toMatch(/3ecf7a|62, 207, 122/)
  })
})
