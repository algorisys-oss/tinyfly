// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { ensureSvgTransformBox } from './svg-transform-box'
import { DOMAdapter } from './dom'
import { SVGAdapter } from './svg'

const NS = 'http://www.w3.org/2000/svg'
const state = (target: string, props: Record<string, number>) => ({
  values: new Map([[target, new Map(Object.entries(props))]]),
  currentTime: 0,
  playbackState: 'playing' as const,
  direction: 'forward' as const,
  loopIteration: 0,
})

describe('ensureSvgTransformBox', () => {
  it('pivots SVG content around its own centre', () => {
    const svg = document.createElementNS(NS, 'svg')
    const rect = document.createElementNS(NS, 'rect')
    svg.appendChild(rect)
    ensureSvgTransformBox(rect)
    expect(rect.style.transformBox).toBe('fill-box')
    expect(rect.style.transformOrigin).toBe('50% 50%')
  })

  it('leaves an origin the author set', () => {
    const rect = document.createElementNS(NS, 'rect')
    document.createElementNS(NS, 'svg').appendChild(rect)
    rect.style.transformBox = 'view-box'
    rect.style.transformOrigin = '0 0'
    ensureSvgTransformBox(rect)
    expect(rect.style.transformBox).toBe('view-box')
    expect(rect.style.transformOrigin).toBe('0 0')
  })

  it('does nothing to HTML elements', () => {
    const div = document.createElement('div')
    ensureSvgTransformBox(div)
    expect(div.style.transformBox).toBe('')
  })

  it('is applied by both adapters when they transform SVG content', () => {
    const svg = document.createElementNS(NS, 'svg')
    const a = document.createElementNS(NS, 'rect')
    const b = document.createElementNS(NS, 'rect')
    svg.append(a, b)

    const dom = new DOMAdapter()
    dom.registerTarget('a', a as unknown as HTMLElement)
    dom.applyState(state('a', { rotate: 90 }))
    expect(a.style.transformBox).toBe('fill-box')

    const svgAdapter = new SVGAdapter()
    svgAdapter.registerTarget('b', b)
    svgAdapter.applyState(state('b', { rotate: 90 }))
    expect(b.style.transformBox).toBe('fill-box')
  })
})
