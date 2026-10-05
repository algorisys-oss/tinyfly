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
    dataset: {} as DOMStringMap,
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

    it('should drive a child <path> d attribute for shape morphs', () => {
      const setAttr = vi.fn()
      const wrapper = {
        style: {},
        dataset: {},
        tagName: 'DIV',
        querySelector: (s: string) => (s === 'path' ? { setAttribute: setAttr } : null),
      } as unknown as HTMLElement
      adapter.registerTarget('poly', wrapper)

      adapter.applyState(createMockState({ poly: { d: 'M 0 0 L 10 10 Z' } }))

      expect(setAttr).toHaveBeenCalledWith('d', 'M 0 0 L 10 10 Z')
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

    it('should compose clip-path from clip-inset properties', () => {
      adapter.registerTarget('box', mockElement)

      const state = createMockState({
        box: { clipTop: 10, clipRight: 20, clipBottom: 30, clipLeft: 40 },
      })

      adapter.applyState(state)

      expect(mockElement.style.clipPath).toBe('inset(10% 20% 30% 40%)')
    })

    it('should default missing clip sides to 0 (reveal wipe)', () => {
      adapter.registerTarget('box', mockElement)

      // Only clipRight animated — the other sides should be 0.
      adapter.applyState(createMockState({ box: { clipRight: 100 } }))
      expect(mockElement.style.clipPath).toBe('inset(0% 100% 0% 0%)')

      adapter.applyState(createMockState({ box: { clipRight: 0 } }))
      expect(mockElement.style.clipPath).toBe('inset(0% 0% 0% 0%)')
    })

    it('should compose a filter from blur', () => {
      adapter.registerTarget('box', mockElement)
      adapter.applyState(createMockState({ box: { blur: 6 } }))
      expect(mockElement.style.filter).toBe('blur(6px)')
    })

    it('should compose a glow filter with its colour', () => {
      adapter.registerTarget('box', mockElement)
      adapter.applyState(
        createMockState({ box: { glow: 14, glowColor: '#66d9ff' } as Record<string, AnimatableValue> })
      )
      expect(mockElement.style.filter).toBe('drop-shadow(0 0 14px #66d9ff)')
    })

    it('should apply a shine sweep as a text-clipped gradient', () => {
      mockElement.style.color = '#c0c0c0'
      adapter.registerTarget('box', mockElement)

      adapter.applyState(createMockState({ box: { shine: 0.5 } }))

      // Base colour captured, text made transparent, background clipped to text.
      expect(mockElement.dataset.shineBase).toBe('#c0c0c0')
      expect(mockElement.style.color).toBe('transparent')
      expect(mockElement.style.backgroundClip).toBe('text')
      // Highlight position tracks progress: -20 + 0.5*140 = 50%.
      expect(mockElement.style.backgroundPosition).toContain('50% 0')
      // Base colour is used for the solid layer.
      expect(mockElement.style.backgroundImage).toContain('#c0c0c0')
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

describe('DOMAdapter quaternion', () => {
  it('writes a rotation quaternion as a CSS matrix3d, column-major', () => {
    const adapter = new DOMAdapter()
    const element = createMockElement()
    adapter.registerTarget('card', element)
    const turn = [0, 0, Math.sin(Math.PI / 4), Math.cos(Math.PI / 4)] // 90° about z, as rotate(90deg)
    adapter.applyState(createMockState({ card: { quaternion: turn, x: 10 } }))
    expect(element.style.transform).toContain('matrix3d(0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)')
    expect(element.style.transform).toContain('translateX(10px)')
  })

  it('normalises the quaternion and ignores values that are not one', () => {
    const adapter = new DOMAdapter()
    const element = createMockElement()
    adapter.registerTarget('card', element)
    adapter.applyState(createMockState({ card: { quaternion: [0, 0, 0, 2] } }))
    expect(element.style.transform).toBe('matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)')
    const other = createMockElement()
    adapter.registerTarget('other', other)
    adapter.applyState(createMockState({ other: { quaternion: [1, 2, 3] } }))
    expect(other.style.transform).toBe('')
  })
})

describe('DOMAdapter transform order', () => {
  it('writes transforms in one order, whatever order the tracks came in: perspective, translate, rotate, scale, skew', () => {
    const adapter = new DOMAdapter()
    const element = createMockElement()
    adapter.registerTarget('card', element)
    adapter.applyState(createMockState({ card: { skewX: 5, scale: 2, rotateY: 30, rotate: 10, x: 40, perspective: 600, z: 20, rotateX: 15 } }))
    expect(element.style.transform).toBe(
      'perspective(600px) translateX(40px) translateZ(20px) rotate(10deg) rotateX(15deg) rotateY(30deg) scale(2) skewX(5deg)'
    )
  })

  it('gives a parent perspective for its children, with a vanishing point', () => {
    const adapter = new DOMAdapter()
    const element = createMockElement()
    adapter.registerTarget('deck', element)
    adapter.applyState(createMockState({ deck: { childPerspective: 800, perspectiveOriginX: 30 } }))
    expect(element.style.perspective).toBe('800px')
    expect(element.style.perspectiveOrigin).toBe('30% 50%')
    expect(element.style.transform).toBe('')
  })

  it('passes transformStyle and backfaceVisibility through as CSS', () => {
    const adapter = new DOMAdapter()
    const element = createMockElement()
    adapter.registerTarget('card', element)
    adapter.applyState(createMockState({ card: { transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' } }))
    expect(element.style.transformStyle).toBe('preserve-3d')
    expect(element.style.backfaceVisibility).toBe('hidden')
  })
})

describe('DOMAdapter perspective 0', () => {
  it('is no perspective, as on Canvas and WebGL (CSS would clamp it to 1px)', () => {
    const adapter = new DOMAdapter()
    const element = createMockElement()
    adapter.registerTarget('card', element)
    adapter.applyState(createMockState({ card: { perspective: 0, rotateY: 30 } }))
    expect(element.style.transform).toBe('rotateY(30deg)')
  })
})
