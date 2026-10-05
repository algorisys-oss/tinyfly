import { describe, it, expect } from 'vitest'
import { stickToHuman } from './stick-to-human'
import { POSES, pose } from './stick-figure'
import { DANCE_STYLES, dancePose, routineBeats, type DanceStyleName } from './dance'
import { FLIPS, flipPose, type FlipName } from './acrobatics'
import { HUMAN_REST, humanFieldLabel } from './species/human'
import { HAND_SHAPES } from './hands/hand-rig'
import { MUDRAS, danceFrame } from './dance'
import { character, characterJoints, drawCharacter } from './character'
import { createCanvas } from '@napi-rs/canvas'

describe('stickToHuman', () => {
  it('gives every character field, all finite', () => {
    const human = stickToHuman(POSES.rest)
    expect(Object.keys(human).sort()).toEqual(Object.keys(HUMAN_REST).sort())
    expect(Object.values(human).every(Number.isFinite)).toBe(true)
  })

  it('front-on, spreads limbs sideways and swaps sides (the stick right is on screen-right)', () => {
    const human = stickToHuman(pose({ rightShoulder: 90, rightElbow: 30, leftHip: 40 }))
    expect(human['arm.left.spread']).toBe(90)
    expect(human['arm.left.bend']).toBe(30)
    expect(human['arm.left.swing']).toBe(0)
    // Front-on a stick leg lies in the picture: a v2 leg turned out 90° at the hip.
    expect(human['leg.right.swing']).toBe(40)
    expect(human['leg.right.rotate']).toBe(90)
    expect(human.turn).toBe(0)
  })

  it('side-on, swings limbs forward and back', () => {
    // Side-on, forward is a positive angle on the right and a negative one on the left.
    const human = stickToHuman(pose({ turn: 1, rightHip: 30, leftHip: -30, leftShoulder: 45 }))
    expect(human['leg.left.swing']).toBe(30)
    expect(human['leg.right.swing']).toBe(30)
    expect(human['arm.right.swing']).toBe(-45)
    expect(human['leg.left.spread']).toBe(0)
    expect(human['leg.left.rotate']).toBe(0)
    expect(human.turn).toBe(1)
  })

  it('bends front-on knees out over the toes, as the stick figure does', () => {
    const who = character({ height: 300 })
    const aramandi = characterJoints(who, stickToHuman(pose({ leftHip: 42, rightHip: 42, leftKnee: 82, rightKnee: 82 })))
    const { points } = aramandi
    // The knees are further out than the hips and the feet: bent sideways, not forward.
    expect(points['knee.left'].x).toBeGreaterThan(points['hip.left'].x + 30)
    expect(points['knee.right'].x).toBeLessThan(points['hip.right'].x - 30)
    expect(points['knee.left'].x).toBeGreaterThan(points['ankle.left'].x)
  })

  it('reads a front-on knee bend as a plié, which lowers the hips', () => {
    const who = character({ height: 300 })
    const standing = characterJoints(who, stickToHuman(POSES.rest))
    const plie = characterJoints(who, stickToHuman(pose({ leftHip: 20, rightHip: 20, leftKnee: 40, rightKnee: 40 })))
    expect(plie.points.hip.y).toBeGreaterThan(standing.points.hip.y + 5)
  })

  it('carries ankles (sign flipped), lean, rise and spin', () => {
    const human = stickToHuman(pose({ turn: 1, rightAnkle: 40, lean: 10, rise: 0.3, spin: 180 }))
    expect(human['leg.left.ankle']).toBe(-40)
    expect(human.lean).toBe(10)
    expect(human.lift).toBe(0.3)
    expect(human.roll).toBe(180)
  })

  it('converts every dance and flip to finite poses', () => {
    for (const name of Object.keys(DANCE_STYLES) as DanceStyleName[]) {
      for (let beat = 0; beat < routineBeats(name); beat += 0.5) {
        expect(Object.values(stickToHuman(dancePose(name, beat))).every(Number.isFinite), `${name} @ ${beat}`).toBe(true)
      }
    }
    for (const name of Object.keys(FLIPS) as FlipName[]) {
      for (let p = 0; p <= 1; p += 0.05) expect(Object.values(stickToHuman(flipPose(name, p))).every(Number.isFinite)).toBe(true)
    }
  })
})

describe('feet and hands on the character', () => {
  it('turns the feet out with toeOut', () => {
    expect(stickToHuman(pose({ rightFootOut: 0.5 }))['leg.left.toeOut']).toBe(35)
    const who = character({ figure: 'fluid', height: 300 })
    const toes = (p: Record<string, number>) => characterJoints(who, { ...HUMAN_REST, ...p }).points['toe.left']
    const rest = toes({})
    const out = toes({ 'leg.left.toeOut': 60 })
    expect(Math.abs(out.x - rest.x)).toBeGreaterThan(2)
  })

  it('carries hand shapes, turned from how a hand hangs, and rolls them by the wrist', () => {
    const human = stickToHuman(pose({ rightWrist: 30 }), { right: MUDRAS.alapadma, left: HAND_SHAPES.fist })
    // The stick right hand is the character's left.
    expect(human['hand.left.spread']).toBe(MUDRAS.alapadma.spread)
    expect(human['hand.right.index.curl']).toBe(HAND_SHAPES.fist['index.curl'])
    expect(human['hand.left.roll']).toBe(30)
    // Front-on a left hand hangs thumb-on (turn 1 + 0): palm-out alapadma (turn 2) is one more.
    expect(human['hand.left.turn']).toBe(MUDRAS.alapadma.turn - 1)
    // Without hands, no hand fields.
    expect(Object.keys(stickToHuman(pose({ rightWrist: 30 }))).some((k) => k.startsWith('hand.'))).toBe(false)
  })

  it('draws a dance frame with cartoon hands', () => {
    const frame = danceFrame('bharatanatyam', 0, { move: 'alapadma' })
    const human = stickToHuman(frame.pose, frame.hands)
    expect(Object.values(human).every(Number.isFinite)).toBe(true)
  })

  it('labels the new fields in plain words', () => {
    expect(humanFieldLabel('leg.left.toeOut')).toBe('Left leg · toes out / in')
    expect(humanFieldLabel('hand.right.index.curl')).toBe('Right hand · index curl')
    expect(humanFieldLabel('hand.left.spread')).toBe('Left hand · finger spread')
    expect(humanFieldLabel('hand.left.turn')).toBe('Left hand · wrist turn')
  })
})

describe('natural hands', () => {
  it('draw five slimmer fingers instead of the glove', () => {
    const draw = (handStyle: 'glove' | 'natural') => {
      const ctx = createCanvas(300, 340).getContext('2d') as unknown as CanvasRenderingContext2D
      ctx.translate(150, 330)
      const frame = danceFrame('bharatanatyam', 0, { move: 'alapadma' })
      drawCharacter(ctx, character({ height: 300, hands: 'cartoon', handStyle }), stickToHuman(frame.pose, frame.hands))
      return ctx.getImageData(0, 0, 300, 340).data
    }
    const glove = draw('glove')
    const natural = draw('natural')
    expect(glove.every((v, i) => v === natural[i])).toBe(false)
    expect(character({ handStyle: 'natural' }).handSize).toBeLessThan(character({}).handSize)
  }, 30000)
})
