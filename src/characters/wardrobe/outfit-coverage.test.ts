import { describe, expect, it } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { character, characterJoints, characterPartsInView, drawCharacter, drawCharacterInView, type Character, type CharacterLayer } from '../character'
import { CHARACTER_CAST, castMember, type CastName } from '../cast'
import { humanPose, HUMAN_POSES } from '../species/human'
import type { ViewProjection } from '../rig/skeleton'
import type { Pose } from '../rig/body-plan'

const W = 280, H = 360
function render(who: Character, pose: Pose, withoutLegs = false) {
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)
  ctx.translate(W / 2, H - 10)
  const hide = (side: 'left' | 'right'): { clip: CharacterLayer; over: CharacterLayer } => ({
    clip: (ctx: CanvasRenderingContext2D) => { ctx.beginPath(); ctx.clip() },
    over: (ctx, joints, pen) => {
      // Keep shared garments and their outlines; remove just trousers.
      const clothes = { ...pen, shape: (points: Parameters<typeof pen.shape>[0], fill: string | null, outline: number) => {
        if (fill !== '#315b98') pen.shape(points, fill, outline)
      } }
      who.layers.parts?.[`leg.${side}`]?.over?.(ctx, joints, clothes, 0, pose)
    },
  })
  const reference = withoutLegs ? { ...who, layers: { ...who.layers, parts: { ...who.layers.parts, 'leg.left': hide('left'), 'leg.right': hide('right') } } } : who
  drawCharacter(ctx, reference, pose)
  return canvas.getContext('2d').getImageData(0, 0, W, H).data
}

const walk = { 'leg.left.swing': 28, 'leg.left.knee': 30, 'leg.right.swing': -18 }

describe('outfit coverage during turns', () => {
  it.each(Object.keys(CHARACTER_CAST) as CastName[])('%s: keeps near thighs and trouser roots behind the top', (name) => {
    let checked = 0
    const failures: string[] = []
    for (const over of [null, 'hoodie', 'cardigan', 'overalls', 'labCoat', 'apron', 'sari'] as const) {
      const who = character(castMember(name, 300, { outfit: { shirt: '#d14b3d', trousers: '#315b98', over, overColor: '#4ba076', sleeves: 'none' } }))
      for (const turn of [0, .5, 1, 1.5, 2, 2.5, 3, 3.5]) {
        const pose = humanPose({ ...walk, turn, lean: 12 })
        const reference = render(who, pose, true)
        const actual = render(who, pose)
        const hip = characterJoints(who, pose).points.hip
        // Only the torso above the hips: shared skirts/aprons may legitimately
        // overlap the shirt below this, and arms have the same pose in both.
        const until = Math.floor(H - 10 + hip.y - 2)
        for (let y = 0; y < until; y++) for (let x = 1; x < W - 1; x++) {
          const i = (y * W + x) * 4
          const isTop = (offset: number) =>
            (reference[offset] === 209 && reference[offset + 1] === 75 && reference[offset + 2] === 61) ||
            (reference[offset] === 75 && reference[offset + 1] === 160 && reference[offset + 2] === 118)
          if (![0, -8, 8, -W * 8, W * 8, -W * 8 - 8, -W * 8 + 8, W * 8 - 8, W * 8 + 8].every(offset => isTop(i + offset))) continue
          checked++
          if (actual[i] !== reference[i] || actual[i + 1] !== reference[i + 1] || actual[i + 2] !== reference[i + 2]) { if (failures.length < 12) failures.push(`${name}/${over}/${turn} at ${x},${y}`) }
        }
      }
    }
    expect(checked).toBeGreaterThan(1000)
    expect(failures).toEqual([])
  })

  it('uses the same clothing occlusion and order through translated cameras and split-part rendering', () => {
    const projection = (offset: number): ViewProjection => ({
      toView: ([x, y, z]) => [x, y, z + offset],
      toScreen: ([x, y]) => ({ x: W / 2 + x, y: H - 10 - y }),
    })
    for (const bottom of ['trousers', 'shorts', 'skirt'] as const) for (const over of [null, 'hoodie', 'cardigan', 'labCoat', 'apron', 'overalls', 'sari'] as const) {
      const who = character({ height: 280, outfit: { bottom, over }, skin: '#efbf9c' })
      for (const turn of [.5, 1.5, 2.5, 3.5]) {
        const pose = { ...HUMAN_POSES.crouch, ...walk, turn, lean: 22 }
        const draw = (offset: number, split = false) => {
          const canvas = createCanvas(W, H)
          const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
          const view = projection(offset)
          if (split) for (const part of characterPartsInView(who, pose, view, { height: 280 })) part.draw(ctx)
          else drawCharacterInView(ctx, who, pose, view, { height: 280 })
          return canvas.toBuffer('image/png')
        }
        const baseline = draw(0)
        for (const offset of [-1000, 1000]) expect(draw(offset).equals(baseline), `${bottom}/${over}/${turn}/${offset}`).toBe(true)
        expect(draw(-1000, true).equals(baseline), `split ${bottom}/${over}/${turn}`).toBe(true)
      }
    }
  })

  it('preserves exposed shins, feet and bare characters while removing the waist intrusion', () => {
    for (const look of ['clean', 'pencil', 'silhouette'] as const) for (const figure of ['fluid', 'stick'] as const) {
      const who = character({ height: 280, look, figure, outfit: { bottom: 'shorts' }, pencil: { construction: false } })
      const pose = humanPose({ ...walk, turn: .5 })
      const dressed = render(who, pose)
      const bare = render(character({ height: 280, look, figure, pencil: { construction: false } }), pose)
      const joints = characterJoints(who, pose)
      const below = Math.ceil(H - 10 + Math.max(joints.points['knee.left'].y, joints.points['knee.right'].y) + 12)
      if (look !== 'pencil') {
        let changed = 0, inkPixels = 0
        for (let i = below * W * 4; i < dressed.length; i += 4) {
          if (bare[i] < 150) inkPixels++
          if (Math.abs(dressed[i] - bare[i]) > 12) changed++
        }
        expect(changed).toBeLessThan(inkPixels * .01 + 1) // clipping antialiasing at the outer edge
      }
      for (const side of ['left', 'right']) {
        const ankle = joints.points[`ankle.${side}`]
        let ink = 0
        for (let y = Math.round(H - 10 + ankle.y - 5); y < Math.round(H - 10 + ankle.y + 5); y++) {
          for (let x = Math.round(W / 2 + ankle.x - 5); x < Math.round(W / 2 + ankle.x + 5); x++) if (dressed[(y * W + x) * 4] < 150) ink++
        }
        expect(ink).toBeGreaterThan(8)
      }
      expect(Buffer.from(render(who, pose)).equals(Buffer.from(dressed))).toBe(true)
    }
  })
})
