import { describe, it, expect, vi } from 'vitest'
import { DOMAdapter } from './dom'
import { SVGAdapter } from './svg'
import type { AnimationState } from '../engine'

// The test environment is node, so adapters are exercised against style-bag
// mocks — the same approach the per-adapter test files use.
function createMockElement<T>(): T & { style: Record<string, string> } {
  const style: Record<string, string> = {}
  return {
    style: new Proxy(style, {
      set(target, prop, value) {
        target[prop as string] = value
        return true
      },
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return (name: string) => target[name] ?? ''
        }
        return target[prop as string] ?? ''
      },
    }),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(() => null),
    dataset: {},
  } as unknown as T & { style: Record<string, string> }
}

/**
 * transformOrigin (as originX/originY percentages) and perspective, added in
 * Phase 26G. They are kept as two numeric tracks rather than a CSS string so
 * they interpolate like every other property.
 */

function stateOf(values: Record<string, Record<string, number>>): AnimationState {
  const map = new Map<string, Map<string, number>>()
  for (const [target, props] of Object.entries(values)) {
    map.set(target, new Map(Object.entries(props)))
  }
  return {
    values: map as AnimationState['values'],
    currentTime: 0,
    playbackState: 'playing',
    direction: 'forward',
    loopIteration: 0,
  }
}

describe('DOMAdapter transform-origin', () => {
  const setup = () => {
    const el = createMockElement<HTMLElement>()
    const adapter = new DOMAdapter()
    adapter.registerTarget('box', el)
    return { el, adapter }
  }

  it('composes both axes into transform-origin', () => {
    const { el, adapter } = setup()
    adapter.applyState(stateOf({ box: { originX: 0, originY: 100 } }))
    expect(el.style.transformOrigin).toBe('0% 100%')
  })

  it('defaults the unset axis to 50%', () => {
    const { el, adapter } = setup()
    adapter.applyState(stateOf({ box: { originX: 25 } }))
    expect(el.style.transformOrigin).toBe('25% 50%')
  })

  it('leaves transform-origin alone when neither axis is animated', () => {
    const { el, adapter } = setup()
    adapter.applyState(stateOf({ box: { opacity: 0.5 } }))
    expect(el.style.transformOrigin).toBe('')
  })

  it('does not leak origin into the transform list', () => {
    const { el, adapter } = setup()
    adapter.applyState(stateOf({ box: { originX: 10, rotate: 45 } }))
    expect(el.style.transform).toBe('rotate(45deg)')
  })
})

describe('DOMAdapter perspective', () => {
  const setup = () => {
    const el = createMockElement<HTMLElement>()
    const adapter = new DOMAdapter()
    adapter.registerTarget('box', el)
    return { el, adapter }
  }

  it('emits perspective first so it affects the 3D functions after it', () => {
    const { el, adapter } = setup()
    adapter.applyState(stateOf({ box: { rotateY: 40, perspective: 800 } }))
    expect(el.style.transform).toBe('perspective(800px) rotateY(40deg)')
  })

  it('applies even with no other transform', () => {
    const { el, adapter } = setup()
    adapter.applyState(stateOf({ box: { perspective: 500 } }))
    expect(el.style.transform).toBe('perspective(500px)')
  })

  it('is not written out as a raw CSS property', () => {
    const { el, adapter } = setup()
    adapter.applyState(stateOf({ box: { perspective: 500 } }))
    expect(el.style.getPropertyValue('perspective')).toBe('')
  })
})

describe('SVGAdapter transform-origin', () => {
  const setup = () => {
    const el = createMockElement<SVGElement>()
    const adapter = new SVGAdapter()
    adapter.registerTarget('shape', el)
    return { el, adapter }
  }

  it('sets transform-origin and fill-box so percentages mean "this element"', () => {
    const { el, adapter } = setup()
    adapter.applyState(stateOf({ shape: { originX: 0, originY: 0 } }))
    expect(el.style.transformOrigin).toBe('0% 0%')
    expect(el.style.transformBox).toBe('fill-box')
  })

  it('emits perspective ahead of the other transform functions', () => {
    const { el, adapter } = setup()
    adapter.applyState(stateOf({ shape: { perspective: 600, rotateX: 30 } }))
    expect(el.style.transform.startsWith('perspective(600px)')).toBe(true)
  })
})
