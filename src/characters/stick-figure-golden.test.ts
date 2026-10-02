import { describe, it, expect } from 'vitest'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { POSES, blendPose, drawStickFigure, pose, withExpression, type StickPose, type StickStyle } from './stick-figure'

/**
 * Golden frames: figures drawn by tinyfly 0.75.0. With `classic: true`, and
 * without `layers` or `shoulderWidth`, the figure must still draw exactly
 * these pixels. Set UPDATE_GOLDEN=1 to rewrite them (only when a
 * change to the look is intended).
 */
const GOLDEN_DIR = join(__dirname, 'golden')

const WALK_075 = pose({
  lean: 4,
  leftShoulder: 20.92324335849338,
  rightShoulder: 90,
  rightElbow: 0,
  leftHip: -22.825356391083687,
  rightHip: -22.825356391083687,
  rightKnee: 9.27050983124842,
  smile: 0.4,
})

const CASES: Array<{ name: string; figure: StickPose; style: StickStyle; time?: number }> = [
  { name: 'rest', figure: POSES.rest, style: {} },
  { name: 'wave-left', figure: POSES.wave, style: { facing: -1 } },
  { name: 'think-lean-tilt', figure: { ...POSES.think, lean: 12, headTilt: -15 }, style: {} },
  { name: 'hips-rubber', figure: POSES.handsOnHips, style: { rubber: 1 } },
  { name: 'crouch-left-rubber', figure: POSES.crouch, style: { facing: -1, rubber: 0.6 } },
  { name: 'jump', figure: POSES.jump, style: { label: 'Tum' } },
  // walkPose(0.3, POSES.point) as 0.75.0 computed it (the walk has since gained lean and elbow swing).
  { name: 'walk-stretch', figure: { ...WALK_075, stretch: 0.8 }, style: { rubber: 0.5 } },
  { name: 'shocked', figure: withExpression(POSES.surprised, 'shocked'), style: { headFill: '#F2C49B' } },
  { name: 'crying-lean-left', figure: { ...withExpression(POSES.sad, 'crying'), lean: -10 }, style: { facing: -1 } },
  { name: 'sketch', figure: POSES.cheer, style: { sketch: { seed: 3 } }, time: 500 },
  {
    name: 'sketch-left-rubber',
    figure: { ...blendPose(POSES.shrug, POSES.wave, 0.4), lean: 8, headTilt: 10, stretch: 1.2 },
    style: { sketch: { roughness: 3 }, facing: -1, rubber: 0.8 },
    time: 1250,
  },
  { name: 'pose-blink', figure: pose({ blink: 1, smile: 1, lookX: 1 }), style: { color: '#3A1010' } },
]

function render(figure: StickPose, style: StickStyle, time = 0) {
  const canvas = createCanvas(300, 340)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 300, 340)
  ctx.translate(150, 330)
  drawStickFigure(ctx, figure, { height: 260, classic: true, ...style }, time)
  return canvas
}

describe('golden frames (the classic 0.75.0 look)', () => {
  for (const { name, figure, style, time } of CASES) {
    it(`draws ${name} pixel-identically`, async () => {
      const canvas = render(figure, style, time)
      const file = join(GOLDEN_DIR, `${name}.png`)
      if (process.env.UPDATE_GOLDEN) {
        mkdirSync(GOLDEN_DIR, { recursive: true })
        writeFileSync(file, canvas.toBuffer('image/png'))
      }
      expect(existsSync(file), `missing golden ${file}`).toBe(true)
      const golden = await loadImage(readFileSync(file))
      const reference = createCanvas(300, 340)
      reference.getContext('2d').drawImage(golden, 0, 0)
      const expected = reference.getContext('2d').getImageData(0, 0, 300, 340).data
      const actual = canvas.getContext('2d').getImageData(0, 0, 300, 340).data
      let differing = 0
      for (let i = 0; i < actual.length; i++) if (actual[i] !== expected[i]) differing++
      expect(differing).toBe(0)
    })
  }
})
