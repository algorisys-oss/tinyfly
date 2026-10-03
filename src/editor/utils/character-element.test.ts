import { describe, it, expect } from 'vitest'
import { createSceneStore, type CharacterElement } from '../stores/scene-store'
import { characterElementPose, characterElementTarget, characterOf, trackPropertyLabel } from './character-element'
import { sceneElementToCanvasTarget } from './scene-to-canvas'
import { HUMAN_REST } from '../../characters'
import type { AnimationState } from '../../engine/types'

function aCharacter(overrides: Partial<CharacterElement> = {}): CharacterElement {
  const store = createSceneStore()
  store.addElement('character', { x: 40, y: 30, width: 96, height: 120, ...overrides })
  return store.elements()[0] as CharacterElement
}

const stateWith = (target: string, values: Record<string, number>): AnimationState => ({
  values: new Map([[target, new Map(Object.entries(values))]]),
  currentTime: 0,
  playbackState: 'paused',
  direction: 'forward',
  loopIteration: 0,
})

describe('character elements', () => {
  it('pose: rest, then the element pose, then animated values by name or id', () => {
    const element = aCharacter({ pose: { turn: 1, 'arm.right.spread': 90 } })
    expect(characterElementPose(element)).toMatchObject({ ...HUMAN_REST, turn: 1, 'arm.right.spread': 90 })
    const animated = characterElementPose(element, stateWith(element.name, { 'arm.right.spread': 30, x: 50 }))
    expect(animated['arm.right.spread']).toBe(30)
    expect(animated.turn).toBe(1)
    expect(animated).not.toHaveProperty('x') // not a pose field
    expect(characterElementPose(element, stateWith(element.id, { turn: 2 })).turn).toBe(2)
  })

  it('is a canvas target in its box whose props are every pose field', () => {
    const element = aCharacter({ pose: { lean: 10 } })
    const target = characterElementTarget(element)
    expect([target.type, target.x, target.y, target.width, target.height]).toEqual(['custom', 40, 30, 96, 120])
    expect(target.props).toMatchObject({ ...HUMAN_REST, lean: 10 })
    expect(sceneElementToCanvasTarget(element)?.type).toBe('custom')
  })

  it('builds its character from its settings', () => {
    const element = aCharacter({ figure: 'stick', look: 'pencil', outfit: 'none', height: 200 })
    const who = characterOf(element)
    expect([who.figure, who.look, who.height]).toEqual(['stick', 'pencil', 200])
    expect(who.layers.parts).toBeUndefined()
    expect(characterOf(aCharacter()).layers.parts?.spine).toBeDefined() // dressed by default
  })

  it('labels pose tracks in plain language and leaves other properties alone', () => {
    expect(trackPropertyLabel('arm.left.elbow')).toBe('Left arm · elbow bend')
    expect(trackPropertyLabel('opacity')).toBe('opacity')
  })
})
