import { describe, it, expect } from 'vitest'
import { createCanvas, type Canvas } from '@napi-rs/canvas'
import { character, characterJoints, characterPoseTracks, drawCharacter, type CharacterOptions } from './character'
import { HUMAN_REST, humanPose } from './species/human'
import { resolveHair } from './head/hair'
import { hairFollow, hairFollowTracks, hairMotionAt } from './hair-follow'
import type { Pose } from './rig/body-plan'

const W = 240
const H = 360
const FEET = 340

function render(options: CharacterOptions, pose: Pose = {}) {
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.fillStyle = '#fbf6ec'
  ctx.fillRect(0, 0, W, H)
  ctx.translate(W / 2, FEET)
  drawCharacter(ctx, character({ height: 300, ...options }), humanPose(pose), 0)
  return canvas
}

const pixelAt = (canvas: Canvas, x: number, y: number): [number, number, number] => {
  const data = canvas.getContext('2d').getImageData(Math.round(W / 2 + x), Math.round(FEET + y), 1, 1).data
  return [data[0], data[1], data[2]]
}
const hex = (color: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)) as [number, number, number]
const near = (a: [number, number, number], b: [number, number, number], tolerance = 24) => a.every((value, i) => Math.abs(value - b[i]) <= tolerance)

/** The leftmost and rightmost columns (character space) a colour reaches within a band of rows. */
function reachOf(canvas: Canvas, color: [number, number, number], fromY: number, toY: number): { left: number; right: number } {
  let left = Infinity
  let right = -Infinity
  for (let y = fromY; y <= toY; y += 2) {
    for (let x = -W / 2 + 1; x < W / 2 - 1; x += 1) {
      if (near(pixelAt(canvas, x, y), color)) {
        left = Math.min(left, x)
        right = Math.max(right, x)
      }
    }
  }
  return { left, right }
}

describe('hair in motion', () => {
  const joints = characterJoints(character({ height: 300 }), HUMAN_REST)
  const head = joints.head

  it('swings a ponytail round the head toward the character’s left for a positive swing', () => {
    // Seen from behind the ponytail hangs down the back in full view, and the character's left is screen-left.
    const hair = { style: 'highPonytail' as const, ties: [{ kind: 'ponytail' as const, at: 'high' as const, length: 3 }] }
    const color = hex(resolveHair(hair).color)
    const band = [head.center.y + head.ry * 1.15, head.center.y + head.ry * 2.1] as const
    const still = reachOf(render({ hair }, { turn: 2 }), color, ...band)
    const swungLeft = reachOf(render({ hair }, { turn: 2, 'hair.swing': 40 }), color, ...band)
    const swungRight = reachOf(render({ hair }, { turn: 2, 'hair.swing': -40 }), color, ...band)
    expect(still.left).toBeLessThan(Infinity)
    expect(swungLeft.left).toBeLessThan(still.left - 4)
    expect(swungRight.right).toBeGreaterThan(still.right + 4)
  })

  it('streams long hair back behind a profile, and lifts or drops its ends', () => {
    // Facing screen-right, back is screen-left: trailing hair reaches further left.
    const color = hex(resolveHair('longStraight').color)
    const band = [head.center.y + head.ry * 1.3, head.center.y + head.ry * 2.2] as const
    const still = reachOf(render({ hair: 'longStraight' }, { turn: 1 }), color, ...band)
    const trailing = reachOf(render({ hair: 'longStraight' }, { turn: 1, 'hair.trail': 1 }), color, ...band)
    expect(trailing.left).toBeLessThan(still.left - 6)
    // Dropped hair reaches lower than lifted hair.
    const lowest = (pose: Pose) => {
      const canvas = render({ hair: 'longStraight' }, pose)
      for (let y = head.center.y + head.ry * 3.5; y > head.center.y; y -= 1) {
        for (let x = -60; x <= 60; x += 2) if (near(pixelAt(canvas, x, y), color)) return y
      }
      return -Infinity
    }
    expect(lowest({ turn: 1, 'hair.lift': -0.6 })).toBeGreaterThan(lowest({ turn: 1, 'hair.lift': 0.6 }) + 4)
  })

  it('leaves the cap and short hair where they are', () => {
    const still = render({ hair: 'short' }, { turn: 0.5 }).toBuffer('image/png')
    const moving = render({ hair: 'short' }, { turn: 0.5, 'hair.swing': 30, 'hair.trail': 1, 'hair.lift': 0.5 }).toBuffer('image/png')
    expect(moving.equals(still)).toBe(true)
  })

  it('draws moving hair the same every time', () => {
    const pose: Pose = { turn: 0.7, 'hair.swing': -25, 'hair.trail': 0.4, 'hair.lift': -0.2 }
    const a = render({ hair: 'twinBraids', look: 'pencil' }, pose).toBuffer('image/png')
    const b = render({ hair: 'twinBraids', look: 'pencil' }, pose).toBuffer('image/png')
    expect(a.equals(b)).toBe(true)
  })
})

describe('hairFollow', () => {
  it('lags behind a quick head turn, toward where the hair was, then settles', () => {
    // The head turns 60° toward its left over 200 ms, from 500 ms.
    const headTurn = (t: number) => 60 * Math.min(1, Math.max(0, (t - 500) / 200))
    const keys = hairFollow((t) => ({ x: 0, y: 0, turn: 0, headTurn: headTurn(t) }), { end: 3000, headRadius: 20 })
    const at = (time: number) => hairMotionAt(keys, time)
    expect(at(400)['hair.swing']).toBe(0)
    // Just after the turn the ends are still toward the character's right.
    expect(at(720)['hair.swing']).toBeLessThan(-10)
    expect(Math.abs(at(3000)['hair.swing'])).toBeLessThan(0.5)
    expect(at(720)['hair.trail']).toBe(0)
    expect(at(720)['hair.lift']).toBe(0)
  })

  it('streams back on a run and drops on a jump', () => {
    // Facing screen-right, 400 px/s from rest; a jump of 60 px at 2 s.
    const x = (t: number) => (t < 1000 ? 0 : (t - 1000) * 0.4)
    const y = (t: number) => (t > 2000 && t < 2400 ? -60 * Math.sin(((t - 2000) / 400) * Math.PI) : 0)
    const keys = hairFollow((t) => ({ x: x(t), y: y(t), turn: 1 }), { end: 4000, headRadius: 20 })
    const at = (time: number) => hairMotionAt(keys, time)
    expect(at(1300)['hair.trail']).toBeGreaterThan(0.3)
    expect(Math.abs(at(1300)['hair.swing'])).toBeLessThan(1e-6)
    expect(at(2150)['hair.lift']).toBeLessThan(-0.1)
    // Facing screen-left the same run streams the hair the same way: back.
    const left = hairFollow((t) => ({ x: -x(t), y: 0, turn: -1 }), { end: 4000, headRadius: 20 })
    expect(hairMotionAt(left, 1300)['hair.trail']).toBeGreaterThan(0.3)
  })

  it('is the same every time, and amount 0 pins the hair', () => {
    const sample = (t: number) => ({ x: t * 0.2, y: 0, turn: 1 })
    const a = hairFollow(sample, { end: 1500, headRadius: 20 })
    const b = hairFollow(sample, { end: 1500, headRadius: 20 })
    expect(a).toEqual(b)
    for (const key of hairFollow(sample, { end: 1500, headRadius: 20, amount: 0 })) expect(Math.abs(key.trail)).toBe(0)
  })
})

describe('hairFollowTracks', () => {
  const walkAcross = (target: string) => [
    ...characterPoseTracks(target, [{ time: 0, pose: { turn: 1 } }, { time: 2000, pose: { turn: 1 } }, { time: 2400, pose: { turn: 3 } }]),
    { id: `${target}-x`, target, property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 2000, value: 600 }] },
  ]

  it('adds hair tracks that lag a moving target, and settle after it', () => {
    const amy = character({ height: 300, hair: 'longWaves' })
    const tracks = walkAcross('amy')
    const added = hairFollowTracks('amy', tracks, amy)
    const properties = added.map((track) => track.property)
    expect(properties).toContain('hair.trail')
    expect(properties).toContain('hair.swing')
    const trail = added.find((track) => track.property === 'hair.trail')!
    const valueAt = (time: number) => Number(trail.keyframes.reduce((best, key) => (Math.abs(key.time - time) < Math.abs(best.time - time) ? key : best)).value)
    expect(valueAt(1000)).toBeGreaterThan(0.2)
    expect(Math.abs(valueAt(3900))).toBeLessThan(0.05)
    expect(trail.keyframes[trail.keyframes.length - 1].time).toBe(2400 + 1500)
    for (const track of added) expect(track.target).toBe('amy')
  })

  it('adds nothing for hair that has nothing to swing', () => {
    expect(hairFollowTracks('bob', walkAcross('bob'), character({ height: 300, hair: 'short' }))).toEqual([])
    expect(hairFollowTracks('bob', walkAcross('bob'), character({ height: 300, hair: 'topBun' }))).toEqual([])
    expect(hairFollowTracks('bob', walkAcross('bob'), character({ height: 300 }))).toEqual([])
  })

  it('adds the lag onto a flick written by hand', () => {
    const amy = character({ height: 300, hair: 'highPonytail' })
    const tracks = [...walkAcross('amy'), { id: 'amy-hair.swing', target: 'amy', property: 'hair.swing', keyframes: [{ time: 0, value: 20 }, { time: 4000, value: 20 }] }]
    const swing = hairFollowTracks('amy', tracks, amy).find((track) => track.property === 'hair.swing')!
    expect(Number(swing.keyframes[0].value)).toBeCloseTo(20, 6)
  })
})

describe('hairFollowTracks follows the head', () => {
  it('bobs with a bouncing gait that moves no x or y track', () => {
    const amy = character({ height: 300, hair: 'longWaves' })
    const tracks = [
      { id: 'amy-turn', target: 'amy', property: 'turn', keyframes: [{ time: 0, value: 1 }, { time: 3000, value: 1 }] },
      { id: 'amy-walk', target: 'amy', property: 'walk', keyframes: [{ time: 0, value: 0 }, { time: 3000, value: 3 }] },
      { id: 'amy-walking', target: 'amy', property: 'walking', keyframes: [{ time: 0, value: 1 }, { time: 3000, value: 1 }] },
      { id: 'amy-gait', target: 'amy', property: 'gait', keyframes: [{ time: 0, value: 'run' }] },
    ]
    const lift = hairFollowTracks('amy', tracks, amy).find((track) => track.property === 'hair.lift')
    expect(lift).toBeDefined()
    const values = lift!.keyframes.filter((key) => key.time > 500 && key.time < 3000).map((key) => Number(key.value))
    expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(0.05)
  })
})
