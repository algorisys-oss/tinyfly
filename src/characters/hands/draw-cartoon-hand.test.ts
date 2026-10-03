import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { drawCartoonHand } from './draw-cartoon-hand'
import { HAND_SHAPES, type HandShapeName } from './hand-rig'

const paper = () => {
  const ctx = createCanvas(300, 300).getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 300, 300)
  return ctx
}
const pixels = (ctx: CanvasRenderingContext2D) => ctx.getImageData(0, 0, 300, 300).data

/** Share of the canvas that is not white. */
function covered(ctx: CanvasRenderingContext2D): number {
  const data = pixels(ctx)
  let count = 0
  for (let i = 0; i < data.length; i += 4) if (data[i] < 245 || data[i + 1] < 245 || data[i + 2] < 245) count++
  return count / (data.length / 4)
}

describe('drawCartoonHand', () => {
  it('draws every shape, in every look, deterministically', () => {
    for (const name of Object.keys(HAND_SHAPES) as HandShapeName[]) {
      for (const look of ['clean', 'pencil', 'silhouette'] as const) {
        const a = paper()
        const b = paper()
        drawCartoonHand(a, { x: 150, y: 260 }, HAND_SHAPES[name], { size: 200, look }, 500)
        drawCartoonHand(b, { x: 150, y: 260 }, HAND_SHAPES[name], { size: 200, look }, 500)
        expect(covered(a), `${name} ${look}`).toBeGreaterThan(0.02)
        expect(Buffer.from(pixels(a)).equals(Buffer.from(pixels(b))), `${name} ${look}`).toBe(true)
      }
    }
  })

  it('fills with the skin colour and returns the joints as drawn', () => {
    const ctx = paper()
    const joints = drawCartoonHand(ctx, { x: 150, y: 260 }, HAND_SHAPES.open, { size: 200, skin: '#00ff00' })
    const [r, g, b] = ctx.getImageData(150, 200, 1, 1).data
    expect([r, g, b]).toEqual([0, 255, 0])
    expect(joints.wrist).toEqual({ x: 150, y: 260 })
  })

  it('draws a held prop among the fingers at its depth', () => {
    const order: string[] = []
    const ctx = paper()
    drawCartoonHand(ctx, { x: 150, y: 260 }, HAND_SHAPES.hold, {
      size: 200,
      prop: { depth: 1e6, draw: () => order.push('front') },
    })
    drawCartoonHand(ctx, { x: 150, y: 260 }, HAND_SHAPES.hold, {
      size: 200,
      prop: {
        depth: -1e6,
        draw: () => {
          order.push('back')
          // Drawn first, so the hand covers it.
          ctx.fillStyle = '#ff0000'
          ctx.fillRect(140, 150, 20, 20)
        },
      },
    })
    expect(order).toEqual(['front', 'back'])
  })
})
