import { describe, it, expect } from 'vitest'
import { createCanvas, type Canvas } from '@napi-rs/canvas'
import { character, characterJoints, drawCharacter, type CharacterOptions } from '../character'
import { HUMAN_REST, humanPose } from '../species/human'
import { basicOutfit } from './basic-outfit'

const TROUSERS = '#24476b'
const TIE = '#c0302a'

function render(options: CharacterOptions, turn = 0): Canvas {
  const canvas = createCanvas(240, 330)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 240, 330)
  ctx.translate(120, 320)
  drawCharacter(ctx, character({ height: 300, ...options }), humanPose({ turn }))
  return canvas
}

/** Pixels near `color` in a box around a drawing-space point (feet at 0, 0). */
function count(canvas: Canvas, color: string, x: number, y: number, r: number) {
  const [cr, cg, cb] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16))
  const data = canvas.getContext('2d').getImageData(Math.round(120 + x - r), Math.round(320 + y - r), r * 2, r * 2).data
  let n = 0
  for (let i = 0; i < data.length; i += 4) if (Math.abs(data[i] - cr) + Math.abs(data[i + 1] - cg) + Math.abs(data[i + 2] - cb) < 30) n++
  return n
}

describe('outfits', () => {
  const joints = characterJoints(character({ height: 300 }), HUMAN_REST)
  const shin = joints.chains['leg.left'][2]
  const knee = joints.points['knee.left']
  const midShin = { x: (knee.x + shin.x) / 2, y: (knee.y + shin.y) / 2 }

  it('keep the default T-shirt and trousers, and the outfit option draws the same as the layers', () => {
    const asData = render({ outfit: {} }).toBuffer('image/png')
    const asLayers = render({ layers: basicOutfit() }).toBuffer('image/png')
    expect(asData.equals(asLayers)).toBe(true)
    expect(count(render({ outfit: {} }), TROUSERS, midShin.x, midShin.y, 6)).toBeGreaterThan(10)
  })

  it('cut shorts above the knee and hang a skirt over both legs', () => {
    expect(count(render({ outfit: { bottom: 'shorts' } }), TROUSERS, midShin.x, midShin.y, 6)).toBe(0)
    const between = { x: 0, y: (joints.points['hip.left'].y + knee.y) / 2 }
    expect(count(render({ outfit: { bottom: 'skirt' } }), TROUSERS, between.x, between.y, 4)).toBeGreaterThan(20)
  })

  it('show a tie from the front, and not from behind', () => {
    const chest = joints.chains.spine[1]
    expect(count(render({ outfit: { tie: TIE } }, 0), TIE, chest.x, chest.y, 12)).toBeGreaterThan(10)
    expect(count(render({ outfit: { tie: TIE } }, 2), TIE, chest.x, chest.y, 12)).toBe(0)
  })
})

describe('more wardrobe', () => {
  const joints = characterJoints(character({ height: 300 }), HUMAN_REST)
  const ankle = joints.points['ankle.left']
  const base = render({ outfit: {} }).toBuffer('image/png')

  for (const over of ['hoodie', 'cardigan', 'overalls', 'sari'] as const) {
    it(`${over}: draws in every view, differently from the plain outfit`, () => {
      for (const turn of [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]) expect(() => render({ outfit: { over } }, turn)).not.toThrow()
      expect(render({ outfit: { over } }).toBuffer('image/png').equals(base)).toBe(false)
      expect(render({ outfit: { over } }, 2).toBuffer('image/png').equals(render({ outfit: {} }, 2).toBuffer('image/png'))).toBe(false)
    })
  }

  it('boots cover the foot and the ankle in their colour, and a sari drapes to the ankles', () => {
    const shod = render({ outfit: { shoes: 'boots', shoeColor: '#8b1a1a' } })
    expect(count(shod, '#8b1a1a', ankle.x, ankle.y, 8)).toBeGreaterThan(10)
    expect(count(render({ outfit: {} }), '#8b1a1a', ankle.x, ankle.y, 8)).toBe(0)
    const saree = render({ outfit: { over: 'sari', overColor: '#16a34a' } })
    expect(count(saree, '#16a34a', ankle.x, ankle.y - 14, 8)).toBeGreaterThan(10)
    // Overalls keep the trousers whatever `bottom` says, in the trousers' colour on the chest.
    const chest = { x: 0, y: -0.55 * 300 }
    expect(count(render({ outfit: { over: 'overalls', bottom: 'skirt' } }), TROUSERS, chest.x, chest.y, 8)).toBeGreaterThan(10)
  })
})
