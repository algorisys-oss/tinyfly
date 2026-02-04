import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SVGAdapter } from './svg-adapter'
import type { AnimationState, AnimatableValue } from '../../engine/types'

type MockSVGElement = SVGElement & { _attributes: Record<string, string> }

// Mock SVG element
function createMockSVGElement(): MockSVGElement {
  const attributes: Record<string, string> = {}
  const style: Record<string, string> = {}

  return {
    setAttribute: vi.fn((name: string, value: string) => {
      attributes[name] = value
    }),
    getAttribute: vi.fn((name: string) => attributes[name] ?? null),
    style: new Proxy(style, {
      set(target, prop, value) {
        target[prop as string] = value
        return true
      },
      get(target, prop) {
        return target[prop as string] ?? ''
      },
    }),
    // Expose attributes for testing
    _attributes: attributes,
  } as unknown as MockSVGElement
}

describe('SVGAdapter', () => {
  let adapter: SVGAdapter
  let mockElement: MockSVGElement

  beforeEach(() => {
    adapter = new SVGAdapter()
    mockElement = createMockSVGElement()
  })

  describe('registerTarget', () => {
    it('should register an SVG element with a target id', () => {
      adapter.registerTarget('circle', mockElement)
      expect(adapter.getTarget('circle')).toBe(mockElement)
    })

    it('should return undefined for unregistered target', () => {
      expect(adapter.getTarget('unknown')).toBeUndefined()
    })

    it('should allow unregistering a target', () => {
      adapter.registerTarget('circle', mockElement)
      adapter.unregisterTarget('circle')
      expect(adapter.getTarget('circle')).toBeUndefined()
    })
  })

  describe('applyState', () => {
    it('should apply fill attribute', () => {
      adapter.registerTarget('circle', mockElement)

      const state = createMockState({
        circle: { fill: '#ff0000' },
      })

      adapter.applyState(state)

      expect(mockElement.setAttribute).toHaveBeenCalledWith('fill', '#ff0000')
    })

    it('should apply stroke and strokeWidth attributes', () => {
      adapter.registerTarget('rect', mockElement)

      const state = createMockState({
        rect: { stroke: '#000000', strokeWidth: 2 },
      })

      adapter.applyState(state)

      expect(mockElement.setAttribute).toHaveBeenCalledWith('stroke', '#000000')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('stroke-width', '2')
    })

    it('should apply opacity via fill-opacity and stroke-opacity', () => {
      adapter.registerTarget('shape', mockElement)

      const state = createMockState({
        shape: { opacity: 0.5 },
      })

      adapter.applyState(state)

      expect(mockElement.setAttribute).toHaveBeenCalledWith('fill-opacity', '0.5')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('stroke-opacity', '0.5')
    })

    it('should apply geometric attributes', () => {
      adapter.registerTarget('rect', mockElement)

      const state = createMockState({
        rect: { x: 10, y: 20, width: 100, height: 50 },
      })

      adapter.applyState(state)

      // x and y are now treated as transforms for consistency with DOM adapter
      expect(mockElement.style.transform).toContain('translate(10px, 20px)')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('width', '100')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('height', '50')
    })

    it('should apply circle-specific attributes', () => {
      adapter.registerTarget('circle', mockElement)

      const state = createMockState({
        circle: { cx: 50, cy: 50, r: 25 },
      })

      adapter.applyState(state)

      expect(mockElement.setAttribute).toHaveBeenCalledWith('cx', '50')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('cy', '50')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('r', '25')
    })

    it('should apply transform for x/y position offset', () => {
      adapter.registerTarget('group', mockElement)

      const state = createMockState({
        group: { translateX: 100, translateY: 50 },
      })

      adapter.applyState(state)

      // Transforms are now applied via CSS style for transform-origin support
      expect(mockElement.style.transform).toContain('translate(100px, 50px)')
    })

    it('should apply rotation transform', () => {
      adapter.registerTarget('shape', mockElement)

      const state = createMockState({
        shape: { rotate: 45 },
      })

      adapter.applyState(state)

      expect(mockElement.style.transform).toContain('rotate(45deg)')
    })

    it('should apply scale transform', () => {
      adapter.registerTarget('shape', mockElement)

      const state = createMockState({
        shape: { scale: 1.5 },
      })

      adapter.applyState(state)

      expect(mockElement.style.transform).toContain('scale(1.5)')
    })

    it('should compose multiple transforms', () => {
      adapter.registerTarget('shape', mockElement)

      const state = createMockState({
        shape: { translateX: 100, translateY: 50, rotate: 45, scale: 2 },
      })

      adapter.applyState(state)

      const transform = mockElement.style.transform
      expect(transform).toContain('translate(100px, 50px)')
      expect(transform).toContain('rotate(45deg)')
      expect(transform).toContain('scale(2)')
    })

    it('should handle multiple targets', () => {
      const element1 = createMockSVGElement()
      const element2 = createMockSVGElement()

      adapter.registerTarget('circle1', element1)
      adapter.registerTarget('circle2', element2)

      const state = createMockState({
        circle1: { fill: '#ff0000' },
        circle2: { fill: '#00ff00' },
      })

      adapter.applyState(state)

      expect(element1.setAttribute).toHaveBeenCalledWith('fill', '#ff0000')
      expect(element2.setAttribute).toHaveBeenCalledWith('fill', '#00ff00')
    })

    it('should skip unregistered targets', () => {
      adapter.registerTarget('circle', mockElement)

      const state = createMockState({
        circle: { fill: '#ff0000' },
        unknown: { fill: '#00ff00' },
      })

      expect(() => adapter.applyState(state)).not.toThrow()
    })

    it('should apply path d attribute', () => {
      adapter.registerTarget('path', mockElement)

      const state = createMockState({
        path: { d: 'M 0 0 L 100 100' },
      })

      adapter.applyState(state)

      expect(mockElement.setAttribute).toHaveBeenCalledWith('d', 'M 0 0 L 100 100')
    })
  })

  describe('clearTargets', () => {
    it('should clear all registered targets', () => {
      adapter.registerTarget('circle1', createMockSVGElement())
      adapter.registerTarget('circle2', createMockSVGElement())

      adapter.clearTargets()

      expect(adapter.getTarget('circle1')).toBeUndefined()
      expect(adapter.getTarget('circle2')).toBeUndefined()
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
