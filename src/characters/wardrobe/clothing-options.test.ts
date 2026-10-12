import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { character, drawCharacter, drawCharacterInView, characterJointsInView, type CharacterOptions } from '../character'
import { softCartoonCharacter, type SoftCartoonName } from '../soft-cartoon-cast'
import { HUMAN_POSES, humanPose } from '../species/human'
import { basicOutfit, type BasicOutfitOptions } from './basic-outfit'
import { createPen } from '../look/pen'
import { rotY, type ViewProjection } from '../rig/skeleton'
import { outfitPreset, OUTFIT_PRESETS, type OutfitCategory } from './outfit-preset'

function render(options: CharacterOptions, turn = 0) {
  const canvas = createCanvas(260, 360)
  const ctx = canvas.getContext('2d')
  ctx.translate(130, 350)
  drawCharacter(ctx as unknown as CanvasRenderingContext2D, character({ figure: 'organic', height: 320, ...options }), humanPose({ turn }))
  return canvas
}
const pixels = (options: CharacterOptions, turn = 0) => render(options, turn).toBuffer('image/png')

describe('editable clothing', () => {
  const camera = (angle: number): ViewProjection => ({ toView: v => rotY(v, angle), toScreen: ([x, y]) => ({ x, y: -y }) })
  const cameraPixels = (outfit: BasicOutfitOptions, angle: number, headTurn = 0) => {
    const canvas = createCanvas(260, 360), ctx = canvas.getContext('2d'); ctx.translate(130, 350)
    drawCharacterInView(ctx as unknown as CanvasRenderingContext2D, character({ figure: 'organic', height: 320, outfit }), humanPose({ turn: 0, 'head.turn': headTurn }), camera(angle), { height: 320 })
    return canvas.toBuffer('image/png')
  }
  it('hides front necklines, buttons and pockets when the camera sees an authored front pose from behind', () => {
    for (const outfit of [{ top: 'shirt', collar: false }, { top: 'blouse' }, { top: 'tshirt' }, { trouserStyle: 'jeans' }, { trouserStyle: 'cargo' }] satisfies BasicOutfitOptions[]) {
      expect(cameraPixels(outfit, 0).equals(cameraPixels({ collar: false }, 0))).toBe(false)
      expect(cameraPixels(outfit, Math.PI).equals(cameraPixels({ collar: false }, Math.PI))).toBe(true)
    }
  })
  it('uses camera-relative body direction independently of head yaw, retaining authored turn', () => {
    const who = character({ figure: 'organic' })
    for (const angle of [-Math.PI / 4, Math.PI / 4, Math.PI]) {
      for (const headTurn of [-1, 0, 1]) {
        const joints = characterJointsInView(who, humanPose({ turn: 0, 'head.turn': headTurn }), camera(angle), { height: 300 })
        expect(joints.turn).toBe(0)
        expect(joints.bodyForward?.[0]).toBeCloseTo(Math.sin(angle))
        expect(joints.bodyForward?.[2]).toBeCloseTo(Math.cos(angle))
      }
    }
  })
  it('places shirt details consistently on opposite camera sides and equivalent authored turns', () => {
    const outfit = outfitPreset('formal', { trouserStyle: 'jeans' })
    const who = character({ figure: 'organic', height: 320, outfit })
    const shirtPixels = (turn: number, angle: number) => {
      const canvas = createCanvas(260, 360), ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
      ctx.translate(130, 350)
      const pose = humanPose({ turn }), joints = characterJointsInView(who, pose, camera(angle), { height: 320 })
      const pen = createPen(ctx, { look: who.look, ink: who.ink, lineWidth: who.lineWidth, seed: 1, time: 0 })
      who.layers.parts?.spine?.over?.(ctx, joints, pen, 0, pose)
      return ctx.getImageData(0, 0, 260, 360).data
    }
    for (const turn of [-.5, .5]) {
      const first = shirtPixels(turn, 0), second = shirtPixels(0, turn * Math.PI / 2)
      // Equivalent transforms can differ at antialiased edges by floating-point rounding.
      const difference = first.reduce((sum, value, i) => sum + Math.abs(value - second[i]), 0) / first.length
      expect(difference).toBeLessThan(.1)
    }
  })
  it('returns owned JSON presets with editable colours and accessories', () => {
    for (const category of ['everyday', 'formal', 'casual'] as const) {
      const first = outfitPreset(category)
      expect(JSON.parse(JSON.stringify(first))).toEqual(first)
      first.shirt = '#ff0000'
      expect(outfitPreset(category)).toEqual(OUTFIT_PRESETS[category])
      expect(outfitPreset(category, { shirt: '#123456', trousers: '#345678', tie: '#abcdef' })).toMatchObject({ shirt: '#123456', trousers: '#345678', tie: '#abcdef' })
    }
    expect(outfitPreset('formal', { top: 'blouse' })).toMatchObject({ collar: false, tie: null })
    expect(outfitPreset('formal', { top: 'blouse', collar: true, tie: '#123456' })).toMatchObject({ collar: true, tie: '#123456' })
    expect(outfitPreset('casual', { top: 'dress', bottom: 'shorts' }).bottom).toBe('skirt')
  })

  it('rejects unknown categories and new garment options at construction', () => {
    for (const category of ['unknown', 'constructor', '__proto__']) expect(() => outfitPreset(category as OutfitCategory)).toThrow('unknown category')
    expect(() => basicOutfit({ top: 'unknown' as BasicOutfitOptions['top'] })).toThrow('unknown top')
    expect(() => basicOutfit({ trouserStyle: 'unknown' as BasicOutfitOptions['trouserStyle'] })).toThrow('unknown trouser style')
  })

  it('renders distinct T-shirts, buttoned shirts, blouses and dresses', () => {
    const outputs = ['tshirt', 'shirt', 'blouse', 'dress'].map(top => pixels({ outfit: { top: top as BasicOutfitOptions['top'], collar: false } }))
    for (let i = 0; i < outputs.length; i++) for (let j = i + 1; j < outputs.length; j++) expect(outputs[i].equals(outputs[j])).toBe(false)
  })

  it('renders distinct plain, jean and cargo details on trousers and shorts', () => {
    for (const bottom of ['trousers', 'shorts'] as const) {
      const outputs = ['plain', 'jeans', 'cargo'].map(trouserStyle => pixels({ outfit: { bottom, trouserStyle: trouserStyle as BasicOutfitOptions['trouserStyle'] } }))
      expect(outputs[0].equals(outputs[1])).toBe(false)
      expect(outputs[0].equals(outputs[2])).toBe(false)
      expect(outputs[1].equals(outputs[2])).toBe(false)
    }
  })

  it('uses a single dress colour and overrides a conflicting bottom cut', () => {
    const base = pixels({ outfit: { top: 'dress', shirt: '#9876ab', trousers: '#112233', bottom: 'trousers' } })
    expect(base.equals(pixels({ outfit: { top: 'dress', shirt: '#9876ab', trousers: '#ff0000', bottom: 'shorts' } }))).toBe(true)
    expect(base.equals(pixels({ outfit: { top: 'dress', shirt: '#cc8844' } }))).toBe(false)
  })

  it('snapshots garment options rather than retaining mutable caller data', () => {
    const options: BasicOutfitOptions = { top: 'shirt', trouserStyle: 'cargo', collar: true, tie: '#123456' }
    const layers = basicOutfit(options), before = pixels({ layers })
    options.top = 'dress'; options.trouserStyle = 'plain'; options.collar = false; options.tie = null
    expect(before.equals(pixels({ layers }))).toBe(true)
  })

  it('keeps seams, buttons and pockets inside existing coverage through turns', () => {
    for (const turn of [0, .5, 1, 2, 3, 3.5]) {
      const baseline = render({ outfit: { collar: false } }, turn).getContext('2d').getImageData(0, 0, 260, 360).data
      for (const outfit of [{ top: 'shirt', collar: false }, { top: 'blouse' }, { trouserStyle: 'jeans' }, { bottom: 'trousers', trouserStyle: 'cargo' }] satisfies BasicOutfitOptions[]) {
        const actual = render({ outfit }, turn).getContext('2d').getImageData(0, 0, 260, 360).data
        let escaped = 0
        for (let i = 3; i < actual.length; i += 4) if (baseline[i] === 0 && actual[i] > 0) escaped++
        expect(escaped).toBe(0)
      }
    }
  }, 20000)

  it('fits adults and children deterministically while walking, sitting and turning', () => {
    for (const name of ['youngMan', 'youngWoman', 'childBoy', 'childGirl'] satisfies SoftCartoonName[]) {
      for (const outfit of [outfitPreset('formal'), outfitPreset('formal', { top: 'blouse', bottom: 'skirt' }), outfitPreset('casual', { top: 'dress' }), outfitPreset('casual', { bottom: 'shorts', trouserStyle: 'cargo' })]) {
        const actor = softCartoonCharacter(name, { height: 260, outfit })
        for (const pose of [humanPose({ turn: .5, walk: 1, walking: 1 }), humanPose({ ...HUMAN_POSES.sit, turn: 1 }), humanPose({ turn: 2 })]) {
          const draw = () => {
            const canvas = createCanvas(320, 320), ctx = canvas.getContext('2d')
            ctx.translate(160, 300)
            drawCharacter(ctx as unknown as CanvasRenderingContext2D, actor, pose, 1500)
            return canvas.toBuffer('image/png')
          }
          expect(draw().equals(draw())).toBe(true)
        }
      }
    }
  }, 20000)
})
