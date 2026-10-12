import { describe, expect, it } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { ANIME_CAST, castMember, type AnimeCastName } from './cast'
import { character, drawCharacterHead, type CharacterOptions } from './character'
import { humanPose, HUMAN_EXPRESSIONS } from './species/human'
import type { Pose } from './rig/body-plan'

const render = (options: CharacterOptions, pose: Pose = {}) => {
  const canvas = createCanvas(260, 260)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 260, 260)
  drawCharacterHead(ctx, character(options), humanPose(pose), { x: 130, y: 130, radius: 90 })
  return canvas
}
const irisPixels = (pose: Pose) => {
  const canvas = render({ face: { style: 'anime', iris: '#347acd' } }, pose)
  const data = canvas.getContext('2d').getImageData(0, 0, 260, 260).data
  let count = 0
  for (let i = 0; i < data.length; i += 4) if (Math.abs(data[i] - 52) < 12 && Math.abs(data[i + 1] - 122) < 12 && Math.abs(data[i + 2] - 205) < 12) count++
  return count
}

describe('colour anime characters', () => {
  it('turns coloured eyes with the head and closes them with blink and lid', () => {
    const front = irisPixels({})
    expect(front).toBeGreaterThan(150)
    expect(irisPixels({ turn: 1 })).toBeGreaterThan(0)
    expect(irisPixels({ turn: 1 })).toBeLessThan(front)
    expect(irisPixels({ turn: 2 })).toBe(0)
    expect(irisPixels({ blink: 1 })).toBe(0)
    expect(irisPixels({ lid: 1 })).toBe(0)
    expect(irisPixels({ lid: 0.6 })).toBeLessThan(front)
  })

  it('uses shared eye and gaze fields, with expressions that change the rendered face', () => {
    expect(irisPixels({ 'eye.left': 0 })).toBeLessThan(irisPixels({}))
    const who = { face: { style: 'anime' as const, iris: '#347acd' } }
    const neutral = render(who).toBuffer('image/png')
    for (const name of ['surprised', 'determined', 'crying', 'sleepy'] as const) {
      expect(render(who, HUMAN_EXPRESSIONS[name]).toBuffer('image/png').equals(neutral)).toBe(false)
    }
    expect(render(who, { lookX: 1, lookY: -1 }).toBuffer('image/png').equals(neutral)).toBe(false)
  })

  it('preserves the plain face and allows anime details to be changed independently', () => {
    expect(render({ face: { style: 'simple', ageLines: 0 } }).toBuffer('image/png').equals(render({}).toBuffer('image/png'))).toBe(true)
    const standard = render({ face: { style: 'anime' } }).toBuffer('image/png')
    expect(render({ face: { style: 'anime', lashes: false } }).toBuffer('image/png').equals(standard)).toBe(false)
    expect(render({ face: { style: 'anime', ageLines: 0.8 } }).toBuffer('image/png').equals(standard)).toBe(false)
  })

  it('keeps every age preset as editable JSON that renders deterministically in all views', () => {
    expect(Object.keys(ANIME_CAST)).toHaveLength(8)
    expect(castMember('animeBoy', 300).height).toBeLessThan(castMember('animeMan', 300).height!)
    for (const name of Object.keys(ANIME_CAST) as AnimeCastName[]) {
      const options = castMember(name, 300)
      const restored = JSON.parse(JSON.stringify(options)) as CharacterOptions
      expect(restored).toEqual(options)
      for (const turn of [0, 0.5, 1, 2, 3]) {
        const pose = { ...HUMAN_EXPRESSIONS.surprised, turn, 'head.nod': 12, roll: -8 }
        expect(render(restored, pose).toBuffer('image/png').equals(render(options, pose).toBuffer('image/png'))).toBe(true)
      }
    }
    expect(castMember('animeOlderWoman', 300, { face: { style: 'simple' } }).face?.style).toBe('simple')
  }, 20000)
})
