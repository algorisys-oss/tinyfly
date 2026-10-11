import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { createSceneStore, type CodeElement } from '../stores/scene-store'
import { codeElementHeight, codeElementProps, codeElementSurface, codeElementTarget, isCodeField, paintCodeCanvas } from './code-element'
import { sceneElementToCanvasTarget } from './scene-to-canvas'
import type { AnimationState } from '../../engine/types'

function aCode(overrides: Partial<CodeElement> = {}): CodeElement {
  const store = createSceneStore()
  store.addElement('code', { x: 30, y: 20, width: 360, ...overrides })
  return store.elements()[0] as CodeElement
}

describe('code elements', () => {
  it('are named Code, sized to their lines, and are custom targets whose props are the panel’s values', () => {
    const element = aCode()
    expect(element.name).toBe('Code 1')
    const short = codeElementHeight(aCode({ code: 'one' }))
    const tall = codeElementHeight(aCode({ code: 'one\ntwo\nthree\nfour' }))
    expect(tall).toBeGreaterThan(short + 30)
    const target = codeElementTarget(element)
    expect([target.type, target.x, target.y, target.width]).toEqual(['custom', 30, 20, 360])
    expect(target.props).toHaveProperty('line.1.highlight', 0)
    expect(target.props).toHaveProperty('line.1.reveal', 1)
    expect(sceneElementToCanvasTarget(element)?.type).toBe('custom')
    expect(isCodeField('line.3.strike')).toBe(true)
    expect(isCodeField('opacity')).toBe(false)
  })

  it('take animated values by name or id, start hidden lines unrevealed, and paint', () => {
    const element = aCode({ hidden: [2] })
    expect(codeElementProps(element)['line.2.reveal']).toBe(0)
    const state: AnimationState = { values: new Map([[element.name, new Map<string, number>([['line.1.highlight', 1], ['x', 40]])]]), currentTime: 0, playbackState: 'paused', direction: 'forward', loopIteration: 0 }
    const props = codeElementProps(element, state)
    expect(props['line.1.highlight']).toBe(1)
    expect(props).not.toHaveProperty('x')
    const canvas = createCanvas(10, 10) as unknown as HTMLCanvasElement
    expect(() => paintCodeCanvas(canvas, element, props, 0, 1)).not.toThrow()
    expect(canvas.width).toBe(360)
  })

  it('are surfaces in the scene: their lines are places in scene px', () => {
    const element = aCode()
    const line = codeElementSurface(element).anchor('line:2')
    expect(line.left).toBeGreaterThan(30)
    expect(line.top).toBeGreaterThan(20)
    expect(line.top).toBeLessThan(20 + element.height)
  })
})
