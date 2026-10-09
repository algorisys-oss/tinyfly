import { describe, it, expect } from 'vitest'
import { createCanvas, type Canvas } from '@napi-rs/canvas'
import { character, characterJoints, drawCharacter, type CharacterOptions } from '../character'
import { HUMAN_BUILDS, HUMAN_EXPRESSIONS, HUMAN_REST, humanPose } from '../species/human'
import { CHARACTER_CAST, castMember } from '../cast'
import { HAIR_STYLES, hairRegion, resolveHair } from './hair'
import { FACIAL_HAIR_STYLES, resolveFacialHair } from './facial-hair'
import { GLASSES_STYLES } from './glasses'
import { HAT_STYLES } from './hats'
import { resolveHeadLook } from './head-look'
import { shellOutlines, spherePoint } from './shell'
import type { Pose } from '../rig/body-plan'

const W = 240
const H = 360
const FEET = 340
const VIEWS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]

/** Draw a character standing at the bottom middle of a canvas; returns the canvas. */
function render(options: CharacterOptions, pose: Pose = {}, time = 0) {
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.fillStyle = '#fbf6ec'
  ctx.fillRect(0, 0, W, H)
  ctx.translate(W / 2, FEET)
  drawCharacter(ctx, character({ height: 300, ...options }), humanPose(pose), time)
  return canvas
}

/** The colour at a point of the character's drawing space (feet at 0, 0). */
function pixelAt(canvas: Canvas, x: number, y: number): [number, number, number] {
  const data = canvas.getContext('2d').getImageData(Math.round(W / 2 + x), Math.round(FEET + y), 1, 1).data
  return [data[0], data[1], data[2]]
}

const hex = (color: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)) as [number, number, number]
const near = (a: [number, number, number], b: [number, number, number], tolerance = 24) => a.every((value, i) => Math.abs(value - b[i]) <= tolerance)

describe('head looks', () => {
  it('leave plain characters exactly as they were', () => {
    const plain = render({}).toBuffer('image/png')
    const explicit = render({ hair: null, facialHair: null, glasses: null, hat: null, ears: false }).toBuffer('image/png')
    const bald = render({ hair: 'bald' }).toBuffer('image/png')
    expect(explicit.equals(plain)).toBe(true)
    expect(bald.equals(plain)).toBe(true)
  })

  it('resolve presets to explicit data, field changes winning', () => {
    const hair = resolveHair({ style: 'bob', color: '#9a4426', hairline: { front: 0.2 } })
    expect(hair.length).toBe(HAIR_STYLES.bob.length)
    expect(hair.color).toBe('#9a4426')
    expect(hair.hairline.front).toBe(0.2)
    expect(hair.hairline.back).toBe(HAIR_STYLES.bob.hairline.back)
    // Plain JSON: it survives a round trip unchanged.
    const look = resolveHeadLook({ hair: 'twinBraids', facialHair: 'vanDyke', glasses: 'round', hat: 'cap', ears: true })
    expect(JSON.parse(JSON.stringify(look))).toEqual(look)
    expect(look.facialHair).toEqual({ color: look.hair!.color, moustache: 'chevron', beard: 'goatee' })
    expect(resolveFacialHair('fullBeard').color).toMatch(/^#/)
    expect(() => resolveHair({ style: 'mohawk' as never })).toThrow(/unknown style/)
    expect(() => character({ hat: 'crown' as never })).toThrow(/unknown style/)
  })

  it('cover the back of the head and leave the face clear from the front', () => {
    const joints = characterJoints(character({ height: 300 }), HUMAN_REST)
    const { x, y } = joints.head.center
    const color = hex(resolveHair('sidePart').color)
    expect(near(pixelAt(render({ hair: 'sidePart' }, { turn: 2 }), x, y), color)).toBe(true)
    expect(near(pixelAt(render({ hair: 'sidePart' }, { turn: 0 }), x, y), [255, 255, 255])).toBe(true)
  })

  it('hang long hair behind the body from the front and over it from behind', () => {
    const joints = characterJoints(character({ height: 300 }), HUMAN_REST)
    const neck = joints.points.neck
    const below = { x: neck.x, y: neck.y + 30 }
    const color = hex(resolveHair('longStraight').color)
    expect(near(pixelAt(render({ hair: 'longStraight' }, { turn: 0 }), below.x, below.y), color)).toBe(false)
    expect(near(pixelAt(render({ hair: 'longStraight' }, { turn: 2 }), below.x, below.y), color)).toBe(true)
  })

  it('keep a side ponytail on the same side of the head through a turn', () => {
    // Tied over the character's left ear: screen right from the front, screen left from behind.
    const joints = characterJoints(character({ height: 300 }), HUMAN_REST)
    const color = hex(resolveHair('sidePonytail').color)
    const columnHas = (canvas: Canvas, x: number) =>
      Array.from({ length: 60 }, (_, i) => pixelAt(canvas, x, joints.head.center.y + 10 + i)).some((p) => near(p, color))
    const reach = joints.head.rx * 1.05
    expect(columnHas(render({ hair: 'sidePonytail' }, { turn: 0 }), reach)).toBe(true)
    expect(columnHas(render({ hair: 'sidePonytail' }, { turn: 2 }), -reach)).toBe(true)
  })

  it('leave the mouth readable in a full beard', () => {
    const joints = characterJoints(character({ height: 300 }), HUMAN_REST)
    const { x, y } = joints.head.center
    const beard = hex(resolveFacialHair('fullBeard').color)
    const canvas = render({ facialHair: 'fullBeard' }, { mouth: 0, smile: 0 })
    // Beside the mouth is beard; just below the mouth's line is the opening, in skin.
    expect(near(pixelAt(canvas, x + joints.head.rx * 0.6, y + joints.head.ry * 0.7), beard)).toBe(true)
    expect(near(pixelAt(canvas, x + joints.head.rx * 0.12, y + joints.head.ry * 0.5), [255, 255, 255])).toBe(true)
  })

  it('draw every style in every view and look, the same each time', () => {
    const options: CharacterOptions[] = [
      ...Object.keys(HAIR_STYLES).map((hair) => ({ hair: hair as keyof typeof HAIR_STYLES, ears: true })),
      ...Object.keys(FACIAL_HAIR_STYLES).map((facialHair) => ({ facialHair: facialHair as keyof typeof FACIAL_HAIR_STYLES })),
      ...Object.keys(GLASSES_STYLES).map((glasses) => ({ glasses: glasses as keyof typeof GLASSES_STYLES })),
      ...Object.keys(HAT_STYLES).map((hat) => ({ hat: hat as keyof typeof HAT_STYLES, hair: 'bob' as const })),
    ]
    for (const option of options) {
      for (const turn of VIEWS) expect(() => render(option, { turn, 'head.nod': 10 })).not.toThrow()
    }
    const busy: CharacterOptions = { hair: 'highPonytail', facialHair: 'fullBeard', glasses: 'round', hat: 'beanie', ears: true, look: 'pencil' }
    expect(render(busy, { turn: 0.7 }, 500).toBuffer('image/png').equals(render(busy, { turn: 0.7 }, 500).toBuffer('image/png'))).toBe(true)
  })
})

describe('shell regions', () => {
  it('split into the part facing the viewer and the part facing away', () => {
    const head = characterJoints(character({ height: 300 }), HUMAN_REST).head
    const cap = { inside: (_around: number, up: number) => up - 0.3, position: spherePoint }
    const front = shellOutlines(head, cap)
    expect(front.near.length).toBeGreaterThan(0)
    expect(front.far.length).toBeGreaterThan(0)
    // A patch on the back of the head has nothing facing the viewer from the front.
    const back = { inside: (around: number) => Math.abs(around) - 2.6, position: spherePoint }
    expect(shellOutlines(head, back).near).toHaveLength(0)
    expect(shellOutlines(head, hairRegion(resolveHair('bob'), 0.05)).near.length).toBeGreaterThan(0)
  })
})

describe('builds, cast and expressions', () => {
  it('keep the standard build unchanged and shorten a child’s legs', () => {
    expect(characterJoints(character({ build: 'standard' }), HUMAN_REST)).toEqual(characterJoints(character(), HUMAN_REST))
    const knee = (build: keyof typeof HUMAN_BUILDS) => -characterJoints(character({ build, height: 300 }), HUMAN_REST).points['knee.left'].y
    expect(knee('child')).toBeLessThan(knee('standard'))
    expect(knee('tall')).toBeGreaterThan(knee('standard'))
    expect(() => character({ build: 'giant' as never })).toThrow(/unknown build/)
  })

  it('give every cast member a scale and options that make a character', () => {
    for (const name of Object.keys(CHARACTER_CAST) as Array<keyof typeof CHARACTER_CAST>) {
      const options = castMember(name, 300)
      expect(options.height).toBe(Math.round(300 * CHARACTER_CAST[name].scale))
      expect(() => render(options, { turn: 0.5 })).not.toThrow()
    }
    expect(castMember('grandpa', 300, { look: 'pencil' }).look).toBe('pencil')
  })

  it('set the same face fields in every expression, marks included', () => {
    const fields = Object.keys(HUMAN_EXPRESSIONS.neutral).sort()
    expect(fields).toEqual(expect.arrayContaining(['blush', 'tears', 'sweat']))
    for (const face of Object.values(HUMAN_EXPRESSIONS)) expect(Object.keys(face).sort()).toEqual(fields)
    expect(HUMAN_EXPRESSIONS.crying.tears).toBe(1)
    expect(HUMAN_EXPRESSIONS.embarrassed.blush).toBe(1)
  })

  it('draw a blush on the cheeks', () => {
    const joints = characterJoints(character({ height: 300 }), HUMAN_REST)
    // Just below the hatch lines.
    const cheek = { x: joints.head.center.x + joints.head.rx * 0.5, y: joints.head.center.y + joints.head.ry * 0.21 }
    const [r, g] = pixelAt(render({}, { blush: 1 }), cheek.x, cheek.y)
    expect(r - g).toBeGreaterThan(40)
    expect(pixelAt(render({}, {}), cheek.x, cheek.y)).toEqual([255, 255, 255])
  })
})
