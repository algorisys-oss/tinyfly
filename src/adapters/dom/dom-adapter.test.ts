import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DOMAdapter } from './dom-adapter'
import { Timeline } from '../../engine/core/timeline'
import { createTrack } from '../../engine/core/track'
import type { AnimationState, AnimatableValue } from '../../engine/types'

// Mock DOM element
function createMockElement(): HTMLElement {
  const style: Record<string, string> = {}
  return {
    style: new Proxy(style, {
      set(target, prop, value) {
        target[prop as string] = value
        return true
      },
      get(target, prop) {
        return target[prop as string] ?? ''
      },
    }),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
  } as unknown as HTMLElement
}

describe('DOMAdapter', () => {
  let adapter: DOMAdapter
  let mockElement: HTMLElement

  beforeEach(() => {
    adapter = new DOMAdapter()
    mockElement = createMockElement()
  })

  describe('registerTarget', () => {
    it('should register an element with a target id', () => {
      adapter.registerTarget('box', mockElement)
      expect(adapter.getTarget('box')).toBe(mockElement)
    })

    it('should return undefined for unregistered target', () => {
      expect(adapter.getTarget('unknown')).toBeUndefined()
    })

    it('should allow unregistering a target', () => {
      adapter.registerTarget('box', mockElement)
      adapter.unregisterTarget('box')
      expect(adapter.getTarget('box')).toBeUndefined()
    })
  })

  describe('applyState', () => {
    it('should apply numeric values to element style', () => {
      adapter.registerTarget('box', mockElement)

      const state = createMockState({
        box: { opacity: 0.5 },
      })

      adapter.applyState(state)

      expect(mockElement.style.opacity).toBe('0.5')
    })

    it('should apply string values to element style', () => {
      adapter.registerTarget('box', mockElement)

      const state = createMockState({
        box: { backgroundColor: '#ff0000' },
      })

      adapter.applyState(state)

      expect(mockElement.style.backgroundColor).toBe('#ff0000')
    })

    it('should apply transform values', () => {
      adapter.registerTarget('box', mockElement)

      const state = createMockState({
        box: { x: 100, y: 50, rotate: 45 },
      })

      adapter.applyState(state)

      expect(mockElement.style.transform).toContain('translateX(100px)')
      expect(mockElement.style.transform).toContain('translateY(50px)')
      expect(mockElement.style.transform).toContain('rotate(45deg)')
    })

    it('should apply scale transform', () => {
      adapter.registerTarget('box', mockElement)

      const state = createMockState({
        box: { scale: 1.5 },
      })

      adapter.applyState(state)

      expect(mockElement.style.transform).toContain('scale(1.5)')
    })

    it('should apply scaleX and scaleY separately', () => {
      adapter.registerTarget('box', mockElement)

      const state = createMockState({
        box: { scaleX: 2, scaleY: 0.5 },
      })

      adapter.applyState(state)

      expect(mockElement.style.transform).toContain('scaleX(2)')
      expect(mockElement.style.transform).toContain('scaleY(0.5)')
    })

    it('should handle multiple targets', () => {
      const element1 = createMockElement()
      const element2 = createMockElement()

      adapter.registerTarget('box1', element1)
      adapter.registerTarget('box2', element2)

      const state = createMockState({
        box1: { opacity: 0.3 },
        box2: { opacity: 0.7 },
      })

      adapter.applyState(state)

      expect(element1.style.opacity).toBe('0.3')
      expect(element2.style.opacity).toBe('0.7')
    })

    it('should skip unregistered targets', () => {
      adapter.registerTarget('box', mockElement)

      const state = createMockState({
        box: { opacity: 0.5 },
        unknown: { opacity: 1 },
      })

      // Should not throw
      expect(() => adapter.applyState(state)).not.toThrow()
      expect(mockElement.style.opacity).toBe('0.5')
    })

    it('should apply width and height with px units', () => {
      adapter.registerTarget('box', mockElement)

      const state = createMockState({
        box: { width: 200, height: 100 },
      })

      adapter.applyState(state)

      expect(mockElement.style.width).toBe('200px')
      expect(mockElement.style.height).toBe('100px')
    })

    it('should pass through string width/height values', () => {
      adapter.registerTarget('box', mockElement)

      const state = createMockState({
        box: { width: '50%', height: 'auto' },
      })

      adapter.applyState(state)

      expect(mockElement.style.width).toBe('50%')
      expect(mockElement.style.height).toBe('auto')
    })
  })

  describe('integration with Timeline', () => {
    it('should animate element properties via timeline', () => {
      adapter.registerTarget('box', mockElement)

      const track = createTrack({
        id: 'opacity-track',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 1 },
        ],
      })

      const timeline = new Timeline({
        id: 'test',
        tracks: [track],
      })

      timeline.onUpdate = (state) => adapter.applyState(state)

      timeline.play()
      timeline.tick(500)

      expect(parseFloat(mockElement.style.opacity)).toBeCloseTo(0.5, 1)
    })
  })

  describe('property mapping', () => {
    it('should map borderRadius correctly', () => {
      adapter.registerTarget('box', mockElement)

      const state = createMockState({
        box: { borderRadius: 10 },
      })

      adapter.applyState(state)

      expect(mockElement.style.borderRadius).toBe('10px')
    })

    it('should handle camelCase to kebab-case conversion for CSS', () => {
      adapter.registerTarget('box', mockElement)

      const state = createMockState({
        box: { fontSize: 16 },
      })

      adapter.applyState(state)

      expect(mockElement.style.fontSize).toBe('16px')
    })
  })

  describe('clearTarget', () => {
    it('should clear all registered targets', () => {
      adapter.registerTarget('box1', createMockElement())
      adapter.registerTarget('box2', createMockElement())

      adapter.clearTargets()

      expect(adapter.getTarget('box1')).toBeUndefined()
      expect(adapter.getTarget('box2')).toBeUndefined()
    })
  })
})

// Helper to create mock AnimationState
function createMockState(
  values: Record<string, Record<string, AnimatableValue>>
): AnimationState {
  const valuesMap = new Map<string, Map<string, AnimatableValue>>()

  for (const [target, props] of Object.entries(values)) {
    const propsMap = new Map<string, AnimatableValue>()
    for (const [prop, value] of Object.entries(props)) {
      propsMap.set(prop, value)
    }
    valuesMap.set(target, propsMap)
  }

  return {
    values: valuesMap,
    currentTime: 0,
    playbackState: 'playing',
    direction: 'forward',
    loopIteration: 0,
  }
}
