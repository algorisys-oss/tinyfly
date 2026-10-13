import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { createSceneStore, type CharacterElement } from '../stores/scene-store'
import { characterElementPose, characterElementTarget, characterOf, characterControlValues, characterColorFields, castElementFields, bodyShapeChoice, withBodyShape } from './character-element'
import { trackPropertyLabel } from './track-labels'
import { sceneElementToCanvasTarget } from './scene-to-canvas'
import { characterJoints, drawCharacter, humanPose } from '../../characters'
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
  it.each(['fluid', 'stick', 'organic'] as const)('shows resolved %s appearance defaults without authoring overrides', figure => {
    const element = aCharacter({ figure, height: 250 })
    const before = JSON.stringify(element), who = characterOf(element)
    const values = characterControlValues(element)
    expect(values.lineWidth).toBe(who.lineWidth)
    expect(values.skin).toBe(who.skin)
    expect(values.ink).toBe(who.ink)
    expect(values.headSize).toBe(who.plan.head.size)
    expect(values.shoulderWidth).toBe(figure === 'stick' ? 0 : figure === 'organic' ? .07 : .06)
    expect(values.hipWidth).toBe(figure === 'stick' ? 0 : figure === 'organic' ? .045 : .022)
    expect(values.hands).toBe(figure === 'organic' ? 'natural' : 'dot')
    expect(values.faceStyle).toBe(figure === 'organic' ? 'anime' : 'simple')
    expect(values.irisColor).toBe(figure === 'organic' ? '#66422e' : '#4b7fce')
    expect(JSON.stringify(element)).toBe(before)
    expect(characterOf({ ...element, lineWidth: values.lineWidth + .1 }).lineWidth).toBeCloseTo(who.lineWidth + .1)
  })
  it('shows explicit appearance choices and resolved body outline overrides', () => {
    const element = aCharacter({ figure: 'organic', hands: 'dot', faceStyle: 'simple', faceShape: 'angular', irisColor: '#123456', eyeScale: .8, eyeLashes: false, body: { outline: { width: .25 } } })
    expect(characterControlValues(element)).toMatchObject({ hands: 'dot', faceStyle: 'simple', faceShape: 'angular', irisColor: '#123456', eyeScale: .8, eyeLashes: false, lineWidth: .25 })
  })
  it('shows imported body colour overrides without changing their JSON', () => {
    const element = aCharacter({ figure: 'organic', skin: '#ffffff', ink: '#000000', body: { fill: '#a86443', outline: { color: '#543210', width: 0 } } })
    const before = JSON.stringify(element)
    expect(characterControlValues(element)).toMatchObject({ skin: '#a86443', ink: '#543210', lineWidth: 0 })
    expect(JSON.stringify(element)).toBe(before)
  })
  it('edits active body colour overrides immutably and preserves unrelated authored fields', () => {
    const bodies: CharacterElement['body'][] = [undefined, { shading: { mode: 'none' } }, { fill: '#a86443' }, { outline: { color: '#543210', width: 0 } }, { fill: '#a86443', outline: { color: '#543210', width: 0 }, depth: .6 }]
    for (const body of bodies) {
      const original = aCharacter({ figure: 'organic', body })
      const before = JSON.stringify(original)
      let edited = { ...original, ...characterColorFields(original, 'skin', '#fedcba') }
      edited = { ...edited, ...characterColorFields(edited, 'ink', '#123456') }
      expect(characterOf(edited)).toMatchObject({ skin: '#fedcba', ink: '#123456' })
      expect(edited.body).toEqual(body ? { ...body, ...(body.fill !== undefined ? { fill: '#fedcba' } : {}), ...(body.outline?.color !== undefined ? { outline: { ...body.outline, color: '#123456' } } : {}) } : undefined)
      expect(JSON.stringify(original)).toBe(before)
      const restored = createSceneStore()
      restored.loadElements(JSON.parse(JSON.stringify([edited])))
      expect(characterOf(restored.elements()[0] as CharacterElement)).toMatchObject({ skin: '#fedcba', ink: '#123456' })
    }
  })
  it('preserves top cuts and trouser styles in saved editor JSON and rendering', () => {
    for (const fields of [{ top: 'dress' }, { top: 'shirt', trouserStyle: 'cargo' }] satisfies Partial<CharacterElement>[]) {
      const store = createSceneStore()
      store.addElement('character', { figure: 'organic', height: 250, outfit: 'basic', ...fields })
      const saved = JSON.parse(JSON.stringify(store.exportElements()))
      const restored = createSceneStore(); restored.loadElements(saved)
      const element = restored.elements()[0] as CharacterElement
      expect(element).toMatchObject(fields)
      const image = (who: ReturnType<typeof characterOf>) => {
        const canvas = createCanvas(300, 300), ctx = canvas.getContext('2d'); ctx.translate(150, 280)
        drawCharacter(ctx as unknown as CanvasRenderingContext2D, who, humanPose({ turn: .5 }))
        return canvas.toBuffer('image/png')
      }
      expect(image(characterOf(element)).equals(image(characterOf(store.elements()[0] as CharacterElement)))).toBe(true)
      expect(image(characterOf(element)).equals(image(characterOf({ ...element, top: undefined, trouserStyle: undefined })))).toBe(false)
    }
  })
  it('round-trips organic contours, material, small hands and leaf garments as editor JSON', () => {
    const store = createSceneStore()
    store.addElement('character', { figure: 'organic', outfit: 'leaves', leafOutfit: { top: true, color: '#648b34' }, body: { depth: .6, arm: [{ at: 0, width: .03 }, { at: 1, width: .012 }], shading: { mode: 'none' } }, handSize: .075, jawRoundness: 1, faceProjection: 'volume' })
    const restored = createSceneStore()
    restored.loadElements(JSON.parse(JSON.stringify(store.exportElements())))
    const who = characterOf(restored.elements()[0] as CharacterElement)
    expect(who.body).toMatchObject({ depth: .6, arm: [{ at: 0, width: .03 }, { at: 1, width: .012 }], shading: { mode: 'none' } })
    expect(who.face.jawRoundness).toBe(1)
    expect(who.face.projection).toBe('volume')
    expect(who.hands).toBe('cartoon'); expect(who.handSize).toBe(.075)
    expect(who.layers.parts?.spine?.over).toBeTypeOf('function')
    expect(characterElementTarget(restored.elements()[0] as CharacterElement).draw).toBeTypeOf('function')
  })
  it('preserves editable flowing locks through saved editor JSON and clears them on a style change', () => {
    const store = createSceneStore()
    const hairDetails = { locks: [{ width: 0.55, follow: 0.4, path: [
      { around: -40, up: 0.9 }, { around: 0, up: 0.85, lift: 0.1 },
      { around: 40, up: 0.6, lift: 0.1 }, { around: 80, up: 0.2 },
    ] }] }
    store.addElement('character', { hair: 'softSweep', hairDetails })
    const restored = createSceneStore()
    restored.loadElements(JSON.parse(JSON.stringify(store.exportElements())))
    const element = restored.elements()[0] as CharacterElement
    expect(characterOf(element).head.hair?.locks).toEqual(hairDetails.locks)
    expect(characterOf({ ...element, hair: 'short', hairDetails: undefined }).head.hair?.locks).toBeUndefined()
  })

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

describe('body shape picker', () => {
  it('stores a named shape as body data the character draws with', () => {
    const body = withBodyShape({ fill: '#e0b090', torso: [{ at: 0, width: 0.1 }, { at: 1, width: 0.02 }] }, 'pear')
    expect(body).toEqual({ fill: '#e0b090', measurements: 'pear' })
    expect(bodyShapeChoice(body)).toBe('pear')
    const who = characterOf(aCharacter({ figure: 'organic', body }))
    expect(who.body!.torsoBack[0].width).not.toBe(who.body!.torsoFront[0].width)
  })

  it('goes back to the standard torso, and leaves custom measurements alone', () => {
    expect(withBodyShape({ measurements: 'round' }, '')).toBeUndefined()
    const custom = { measurements: { height: 170, bust: 90, waist: 72, hip: 96 } }
    expect(bodyShapeChoice(custom)).toBe('custom')
    expect(withBodyShape(custom, 'custom')).toBe(custom)
  })
})
