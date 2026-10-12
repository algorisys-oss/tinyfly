import { describe, it, expect } from 'vitest'
import { createSceneStore, type CharacterElement } from '../stores/scene-store'
import { characterElementPose, characterElementTarget, characterOf, castElementFields } from './character-element'
import { trackPropertyLabel } from './track-labels'
import { sceneElementToCanvasTarget } from './scene-to-canvas'
import { characterJoints, humanPose } from '../../characters'
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
  it('preserves anime cast appearance through saved editor JSON and clears it for a regular cast', () => {
    const store = createSceneStore()
    store.addElement('character', { ...castElementFields('animeOlderWoman'), x: 0, y: 0, width: 150, height: 250 })
    const saved = JSON.parse(JSON.stringify(store.exportElements()))
    const restored = createSceneStore()
    restored.loadElements(saved)
    const element = restored.elements()[0] as CharacterElement
    expect(characterOf(element).face).toMatchObject({ style: 'anime', iris: '#7a6998', ageLines: 0.8 })
    expect(element.build).toMatchObject({ headSize: 0.25, proportions: 'thin' })
    expect(element.hands).toBe('natural')
    expect(element.shoes).toBe('boots')
    expect(characterOf({ ...element, ...castElementFields('boy') }).face.style).toBeUndefined()
  })

  it('pose: rest, then the element pose, then animated values by name or id', () => {
    const element = aCharacter({ pose: { turn: 1, 'arm.right.spread': 90 } })
    expect(characterElementPose(element)).toMatchObject({ ...HUMAN_REST, turn: 1, 'arm.right.spread': 90 })
    const animated = characterElementPose(element, stateWith(element.name, { 'arm.right.spread': 30, x: 50 }))
    expect(animated['arm.right.spread']).toBe(30)
    expect(animated.turn).toBe(1)
    expect(animated).not.toHaveProperty('x') // not a pose field
    expect(characterElementPose(element, stateWith(element.id, { turn: 2 })).turn).toBe(2)
  })

  it('steps its gait from walk, walking and gait tracks (a beat script’s walk)', () => {
    const element = aCharacter({ pose: { turn: 1 } })
    const standing = characterElementPose(element)
    const state: AnimationState = { ...stateWith(element.name, { walk: 0.25, walking: 1 }), values: new Map([[element.name, new Map<string, number | string>([['walk', 0.25], ['walking', 1], ['gait', 'run']])]]) }
    const stepping = characterElementPose(element, state)
    expect(stepping['leg.left.swing']).not.toBeCloseTo(standing['leg.left.swing'] ?? 0, 1)
    expect(stepping.turn).toBe(1)
    expect(stepping).not.toHaveProperty('gait')
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
    const shaped = characterOf(aCharacter({ teeth: true, feet: 'big' }))
    expect(shaped.face).toEqual({ teeth: true, tongue: false })
    const footLength = (who: ReturnType<typeof characterOf>) => Math.abs(characterJoints(who, humanPose({ turn: 1 })).points['toe.left'].x - characterJoints(who, humanPose({ turn: 1 })).points['ankle.left'].x)
    expect(footLength(shaped)).toBeGreaterThan(footLength(characterOf(aCharacter())))
  })

  it('labels pose tracks in plain language and leaves other properties alone', () => {
    expect(trackPropertyLabel('arm.left.elbow')).toBe('Left arm · elbow bend')
    expect(trackPropertyLabel('opacity')).toBe('opacity')
  })
})

describe('character hands', () => {
  it('maps the Hands option to the character: round, gloves or natural hands', () => {
    expect(characterOf(aCharacter({})).hands).toBe('dot')
    const gloves = characterOf(aCharacter({ hands: 'cartoon' }))
    expect([gloves.hands, gloves.handStyle]).toEqual(['cartoon', 'glove'])
    const natural = characterOf(aCharacter({ hands: 'natural' }))
    expect([natural.hands, natural.handStyle]).toEqual(['cartoon', 'natural'])
  })

  it('preserves manga face and custom hair options through editor JSON and resets them for ordinary casts', () => {
    const fields = castElementFields('mangaRival')
    const store = createSceneStore()
    store.addElement('character', { ...fields, height: 300 })
    const saved = JSON.parse(JSON.stringify(store.exportElements()))
    const loaded = createSceneStore()
    loaded.loadElements(saved)
    const who = characterOf(loaded.elements()[0] as CharacterElement)
    expect(who.face).toMatchObject({ style: 'anime', shape: 'angular', jawWidth: 0.9, chinWidth: 0.25, eyeScale: 0.75, eyeAspect: 0.55, nose: true })
    expect(who.head.hair).toMatchObject({ color: '#e6e0cc', volume: 0.16 })
    expect(who.head.hair?.spikes?.length).toBeGreaterThan(0)
    const reset = characterOf(aCharacter({ ...fields, ...castElementFields('man') }))
    expect(reset.face.shape).toBeUndefined()
    expect(reset.face.jawWidth).toBeUndefined()
    expect(reset.head.hair?.spikes).toBeUndefined()
    const changed = characterOf(aCharacter({ ...fields, hair: 'bob', hairDetails: undefined }))
    expect(changed.face).toEqual(who.face)
    expect(changed.head.hair?.spikes).toBeUndefined()
  })

  it('applies animated hand fields to the pose', () => {
    const element = aCharacter({ hands: 'natural' })
    const state = { values: new Map([[element.name, new Map([['hand.right.index.curl', 0.9]])]]) } as unknown as AnimationState
    expect(characterElementPose(element, state)['hand.right.index.curl']).toBe(0.9)
    expect(trackPropertyLabel('hand.right.index.curl')).toBe('Right hand · index curl')
  })
})
