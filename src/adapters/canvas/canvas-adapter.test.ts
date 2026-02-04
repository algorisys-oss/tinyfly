import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CanvasAdapter, isGradient } from './canvas-adapter'
import type { CanvasTarget, LinearGradient, RadialGradient } from './canvas-adapter'
import type { AnimationState, AnimatableValue } from '../../engine/types'

// Mock Path2D for Node.js environment
class MockPath2D {
  d?: string
  constructor(d?: string) {
    this.d = d
  }
}
;(globalThis as unknown as { Path2D: typeof MockPath2D }).Path2D = MockPath2D

describe('CanvasAdapter', () => {
  let adapter: CanvasAdapter
  let mockCtx: CanvasRenderingContext2D
  let mockGradient: CanvasGradient

  beforeEach(() => {
    adapter = new CanvasAdapter()
    mockGradient = {
      addColorStop: vi.fn(),
    } as unknown as CanvasGradient
    mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      globalAlpha: 1,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      font: '',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      beginPath: vi.fn(),
      rect: vi.fn(),
      arc: vi.fn(),
      arcTo: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      closePath: vi.fn(),
      clearRect: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      drawImage: vi.fn(),
      createLinearGradient: vi.fn(() => mockGradient),
      createRadialGradient: vi.fn(() => mockGradient),
    } as unknown as CanvasRenderingContext2D
  })

  describe('registerTarget', () => {
    it('should register a canvas target', () => {
      const target: CanvasTarget = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }

      adapter.registerTarget('box', target)
      expect(adapter.getTarget('box')).toEqual(target)
    })

    it('should allow unregistering a target', () => {
      adapter.registerTarget('box', { type: 'rect', x: 0, y: 0, width: 50, height: 50 })
      adapter.unregisterTarget('box')
      expect(adapter.getTarget('box')).toBeUndefined()
    })
  })

  describe('applyState', () => {
    it('should update target properties from state', () => {
      const target: CanvasTarget = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }

      adapter.registerTarget('box', target)

      const state = createMockState({
        box: { x: 50, y: 25, opacity: 0.5 },
      })

      adapter.applyState(state)

      // x/y are stored as animation offsets (like CSS transforms), not on target directly
      const offset = adapter.getAnimationOffset('box')!
      expect(offset.x).toBe(50)
      expect(offset.y).toBe(25)
      // Other properties are stored on target
      expect(adapter.getTarget('box')!.opacity).toBe(0.5)
    })

    it('should handle multiple targets', () => {
      adapter.registerTarget('box1', { type: 'rect', x: 0, y: 0, width: 50, height: 50 })
      adapter.registerTarget('box2', { type: 'circle', x: 100, y: 100, radius: 25 })

      const state = createMockState({
        box1: { x: 10 },
        box2: { x: 200 },
      })

      adapter.applyState(state)

      // x/y values are stored as animation offsets (applied via ctx.translate during render)
      expect(adapter.getAnimationOffset('box1')!.x).toBe(10)
      expect(adapter.getAnimationOffset('box2')!.x).toBe(200)
    })

    it('should preserve unmodified properties', () => {
      const target: CanvasTarget = {
        type: 'rect',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        fillStyle: '#ff0000',
      }

      adapter.registerTarget('box', target)

      const state = createMockState({
        box: { x: 10 },
      })

      adapter.applyState(state)

      const updated = adapter.getTarget('box')! as CanvasTarget & { width: number }
      // Original position is preserved; x offset is stored separately
      expect(updated.x).toBe(50)
      expect(updated.width).toBe(100)
      expect(updated.fillStyle).toBe('#ff0000')
      // Animation offset is stored separately
      expect(adapter.getAnimationOffset('box')!.x).toBe(10)
    })
  })

  describe('render', () => {
    it('should render a rect target', () => {
      adapter.registerTarget('box', {
        type: 'rect',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        fillStyle: '#ff0000',
      })

      adapter.render(mockCtx)

      expect(mockCtx.save).toHaveBeenCalled()
      expect(mockCtx.fillStyle).toBe('#ff0000')
      expect(mockCtx.beginPath).toHaveBeenCalled()
      expect(mockCtx.rect).toHaveBeenCalledWith(10, 20, 100, 50)
      expect(mockCtx.fill).toHaveBeenCalled()
      expect(mockCtx.restore).toHaveBeenCalled()
    })

    it('should render a circle target', () => {
      adapter.registerTarget('circle', {
        type: 'circle',
        x: 50,
        y: 50,
        radius: 25,
        fillStyle: '#00ff00',
      })

      adapter.render(mockCtx)

      expect(mockCtx.beginPath).toHaveBeenCalled()
      expect(mockCtx.arc).toHaveBeenCalledWith(50, 50, 25, 0, Math.PI * 2)
      expect(mockCtx.fill).toHaveBeenCalled()
    })

    it('should apply opacity', () => {
      adapter.registerTarget('box', {
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        opacity: 0.5,
      })

      adapter.render(mockCtx)

      expect(mockCtx.globalAlpha).toBe(0.5)
    })

    it('should apply transforms', () => {
      adapter.registerTarget('box', {
        type: 'rect',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        rotate: 45,
        scale: 1.5,
      })

      adapter.render(mockCtx)

      expect(mockCtx.translate).toHaveBeenCalled()
      expect(mockCtx.rotate).toHaveBeenCalled()
      expect(mockCtx.scale).toHaveBeenCalled()
    })

    it('should render stroke when strokeStyle is set', () => {
      adapter.registerTarget('box', {
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        strokeStyle: '#000000',
        lineWidth: 2,
      })

      adapter.render(mockCtx)

      expect(mockCtx.strokeStyle).toBe('#000000')
      expect(mockCtx.lineWidth).toBe(2)
      expect(mockCtx.stroke).toHaveBeenCalled()
    })

    it('should render targets in registration order', () => {
      const renderOrder: string[] = []

      adapter.registerTarget('first', {
        type: 'rect',
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        fillStyle: '#ff0000',
      })

      adapter.registerTarget('second', {
        type: 'rect',
        x: 50,
        y: 50,
        width: 50,
        height: 50,
        fillStyle: '#00ff00',
      })

      // Track fill order via fillStyle changes
      mockCtx.fill = vi.fn(() => {
        renderOrder.push(mockCtx.fillStyle as string)
      })

      adapter.render(mockCtx)

      expect(renderOrder).toEqual(['#ff0000', '#00ff00'])
    })
  })

  describe('clearTargets', () => {
    it('should remove all targets', () => {
      adapter.registerTarget('box1', { type: 'rect', x: 0, y: 0, width: 50, height: 50 })
      adapter.registerTarget('box2', { type: 'rect', x: 0, y: 0, width: 50, height: 50 })

      adapter.clearTargets()

      expect(adapter.getTarget('box1')).toBeUndefined()
      expect(adapter.getTarget('box2')).toBeUndefined()
    })
  })

  describe('text rendering', () => {
    it('should render text with fillText', () => {
      adapter.registerTarget('label', {
        type: 'text',
        x: 100,
        y: 50,
        text: 'Hello World',
        fontSize: 24,
        fontFamily: 'Arial',
        fontWeight: 700,
        textAlign: 'center',
        fillStyle: '#ffffff',
      })

      adapter.render(mockCtx)

      expect(mockCtx.font).toBe('700 24px Arial')
      expect(mockCtx.textAlign).toBe('center')
      expect(mockCtx.fillText).toHaveBeenCalledWith('Hello World', 100, 50)
    })

    it('should render text with strokeText when strokeStyle is set', () => {
      adapter.registerTarget('label', {
        type: 'text',
        x: 100,
        y: 50,
        text: 'Outlined',
        strokeStyle: '#000000',
      })

      adapter.render(mockCtx)

      expect(mockCtx.strokeText).toHaveBeenCalledWith('Outlined', 100, 50)
    })
  })

  describe('line rendering', () => {
    it('should render a line', () => {
      adapter.registerTarget('line', {
        type: 'line',
        x: 0,
        y: 0,
        x2: 100,
        y2: 100,
        strokeStyle: '#ff0000',
        lineWidth: 2,
        lineCap: 'round',
      })

      adapter.render(mockCtx)

      expect(mockCtx.lineCap).toBe('round')
      expect(mockCtx.moveTo).toHaveBeenCalledWith(0, 0)
      expect(mockCtx.lineTo).toHaveBeenCalledWith(100, 100)
      expect(mockCtx.stroke).toHaveBeenCalled()
    })
  })

  describe('path rendering', () => {
    it('should render an SVG path', () => {
      adapter.registerTarget('curve', {
        type: 'path',
        x: 10,
        y: 20,
        d: 'M 0 0 Q 50 50 100 0',
        strokeStyle: '#00ff00',
        lineWidth: 3,
        lineCap: 'round',
        lineJoin: 'round',
      })

      adapter.render(mockCtx)

      expect(mockCtx.lineCap).toBe('round')
      expect(mockCtx.lineJoin).toBe('round')
      expect(mockCtx.translate).toHaveBeenCalledWith(10, 20)
      expect(mockCtx.stroke).toHaveBeenCalled()
    })
  })

  describe('image rendering', () => {
    it('should render an image when image is provided', () => {
      const mockImage = {} as HTMLImageElement

      adapter.registerTarget('img', {
        type: 'image',
        x: 50,
        y: 50,
        width: 200,
        height: 150,
        image: mockImage,
      })

      adapter.render(mockCtx)

      expect(mockCtx.drawImage).toHaveBeenCalledWith(mockImage, 50, 50, 200, 150)
    })

    it('should not render image when image is null', () => {
      adapter.registerTarget('img', {
        type: 'image',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        image: null,
      })

      adapter.render(mockCtx)

      expect(mockCtx.drawImage).not.toHaveBeenCalled()
    })
  })

  describe('gradient support', () => {
    it('should create linear gradient for fillStyle', () => {
      const gradient: LinearGradient = {
        type: 'linear',
        angle: 90,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' },
        ],
      }

      adapter.registerTarget('gradientBox', {
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fillStyle: gradient,
      })

      adapter.render(mockCtx)

      expect(mockCtx.createLinearGradient).toHaveBeenCalled()
      expect(mockGradient.addColorStop).toHaveBeenCalledWith(0, '#ff0000')
      expect(mockGradient.addColorStop).toHaveBeenCalledWith(1, '#0000ff')
      expect(mockCtx.fill).toHaveBeenCalled()
    })

    it('should create radial gradient for fillStyle', () => {
      const gradient: RadialGradient = {
        type: 'radial',
        centerX: 0.5,
        centerY: 0.5,
        radius: 0.5,
        stops: [
          { offset: 0, color: '#ffffff' },
          { offset: 1, color: '#000000' },
        ],
      }

      adapter.registerTarget('radialBox', {
        type: 'circle',
        x: 50,
        y: 50,
        radius: 40,
        fillStyle: gradient,
      })

      adapter.render(mockCtx)

      expect(mockCtx.createRadialGradient).toHaveBeenCalled()
      expect(mockGradient.addColorStop).toHaveBeenCalledWith(0, '#ffffff')
      expect(mockGradient.addColorStop).toHaveBeenCalledWith(1, '#000000')
    })
  })

  describe('border radius', () => {
    it('should render rect with rounded corners', () => {
      adapter.registerTarget('roundedBox', {
        type: 'rect',
        x: 10,
        y: 10,
        width: 100,
        height: 80,
        borderRadius: 10,
        fillStyle: '#4a9eff',
      })

      adapter.render(mockCtx)

      // Should use arcTo for rounded corners
      expect(mockCtx.arcTo).toHaveBeenCalled()
      expect(mockCtx.fill).toHaveBeenCalled()
    })
  })
})

describe('isGradient', () => {
  it('should return true for linear gradient', () => {
    const gradient: LinearGradient = {
      type: 'linear',
      angle: 45,
      stops: [{ offset: 0, color: '#000' }],
    }
    expect(isGradient(gradient)).toBe(true)
  })

  it('should return true for radial gradient', () => {
    const gradient: RadialGradient = {
      type: 'radial',
      centerX: 0.5,
      centerY: 0.5,
      radius: 0.5,
      stops: [{ offset: 0, color: '#000' }],
    }
    expect(isGradient(gradient)).toBe(true)
  })

  it('should return false for string color', () => {
    expect(isGradient('#ff0000')).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(isGradient(undefined)).toBe(false)
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
