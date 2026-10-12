import { describe, expect, it } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { character, characterJoints, drawCharacter } from './character'
import { humanPose, HUMAN_POSES } from './species/human'
import { humanGaitPose } from './species/human-motion'
import { SOFT_CARTOON_CAST, softCartoonCharacter, type SoftCartoonName } from './soft-cartoon-cast'

describe('soft cartoon child actors', () => {
  it.each(['constructor', 'toString', '__proto__', 'missing'])('rejects unknown actor %s', name => {
    expect(() => softCartoonCharacter(name as SoftCartoonName)).toThrow(`softCartoonCharacter: unknown actor '${name}'`)
  })

  it('has child proportions rather than uniformly scaled adult anatomy', () => {
    const adult = softCartoonCharacter('youngMan')
    for (const name of ['childBoy', 'childGirl'] as const) {
      const child = softCartoonCharacter(name)
      expect(child.height).toBeLessThan(adult.height)
      expect(child.plan.head.size).toBeGreaterThan(adult.plan.head.size)
      for (const id of ['arm.left', 'leg.left']) {
        const length = (who: typeof adult) => who.plan.chains.find(chain => chain.id === id)!.bones.reduce((n, bone) => n + bone.length, 0)
        expect(length(child)).toBeLessThan(length(adult))
      }
      expect(child.face.shape).toBe('round')
      expect(child.face.projection).toBe('volume')
    }
  })

  it('owns serializable proportions and preserves author overrides', () => {
    const options = JSON.parse(JSON.stringify(SOFT_CARTOON_CAST.childBoy))
    const first = character(options), second = softCartoonCharacter('childBoy')
    expect(characterJoints(first, HUMAN_POSES.sit)).toEqual(characterJoints(second, HUMAN_POSES.sit))
    options.body.torso[0].width = .2
    expect(first.body!.torso).toEqual(second.body!.torso)
    const custom = softCartoonCharacter('childGirl', { height: 250, skin: '#a87352', face: { iris: '#447799' }, outfit: null, leafOutfit: {}, body: { shading: { mode: 'none' } } })
    expect(custom.height).toBe(250); expect(custom.skin).toBe(custom.body!.fill)
    expect(custom.face.iris).toBe('#447799'); expect(custom.face.shape).toBe('round')
    expect(custom.body!.shading.mode).toBe('none')
  })

  it('renders deterministic grounded children through gestures, clothing and full turns', () => {
    const poses = [humanPose(), HUMAN_POSES.point, HUMAN_POSES.cheer, HUMAN_POSES.think, HUMAN_POSES.sit, humanGaitPose('walk', .25)]
    for (const name of ['childBoy', 'childGirl'] as const) for (const leaves of [false, true]) {
      const who = softCartoonCharacter(name, leaves ? { outfit: null, leafOutfit: { top: true } } : {})
      const ctx = createCanvas(320, 320).getContext('2d')
      const render = (pose: ReturnType<typeof humanPose>) => {
        ctx.clearRect(0, 0, 320, 320); ctx.save(); ctx.translate(160, 300)
        drawCharacter(ctx as unknown as CanvasRenderingContext2D, who, pose, 1234); ctx.restore()
        return Buffer.from(ctx.getImageData(0, 0, 320, 320).data)
      }
      for (const turn of [0, .5, 1, 1.5, 2, 3, 4]) for (const base of poses) {
        const pose = { ...base, turn }, joints = characterJoints(who, pose)
        expect(Math.max(...Object.values(joints.points).map(p => p.y))).toBeCloseTo(0, 5)
        expect(Object.values(joints.points).every(p => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true)
        const pixels = render(pose)
        expect(pixels.some(n => n > 0)).toBe(true)
        expect(render(pose).equals(pixels)).toBe(true)
      }
    }
  }, 20000)
})
