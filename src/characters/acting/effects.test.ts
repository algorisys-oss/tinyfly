import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { Timeline } from '../../engine/core/timeline'
import type { Track } from '../../engine/types'
import { stickFigureTarget } from '../stick-figure'
import { drawDustPuff, drawImpactStars, drawSpeedLines, drawStickSmear } from './effects'

const context = () => createCanvas(400, 400).getContext('2d') as unknown as CanvasRenderingContext2D
/** How many pixels have been drawn on. */
const inked = (ctx: CanvasRenderingContext2D) => {
  const data = ctx.getImageData(0, 0, 400, 400).data
  let count = 0
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++
  return count
}

/** A figure whose right arm swings up over `duration` ms, starting at 0. */
function swing(duration: number) {
  const tracks: Track[] = [{ id: 'arm', target: 'hero', property: 'rightShoulder', keyframes: [{ time: 0, value: 18 }, { time: duration, value: 170 }] }]
  const timeline = new Timeline({ id: 't', tracks })
  const target = stickFigureTarget({ x: 200, y: 350, style: { height: 300 } })
  const frame = (time: number) => ({ time, state: timeline.getStateAtTime(time), stateAt: (at: number) => timeline.getStateAtTime(at) })
  return { target, frame }
}

describe('drawStickSmear', () => {
  it('streaks a fast hand', () => {
    const { target, frame } = swing(150)
    const ctx = context()
    drawStickSmear(ctx, target, frame(100), 'hero', { parts: ['hands'] })
    expect(inked(ctx)).toBeGreaterThan(50)
  })

  it('draws nothing for a slow move, or without stateAt', () => {
    const slow = swing(8000)
    const ctx = context()
    drawStickSmear(ctx, slow.target, slow.frame(1000), 'hero')
    expect(inked(ctx)).toBe(0)
    const fast = swing(150)
    const { stateAt: _ignored, ...withoutStateAt } = fast.frame(100)
    drawStickSmear(ctx, fast.target, withoutStateAt, 'hero')
    expect(inked(ctx)).toBe(0)
  })

  it('draws the same frame the same way, whatever was drawn before', () => {
    const { target, frame } = swing(150)
    const a = context()
    drawStickSmear(a, target, frame(100), 'hero')
    const b = context()
    drawStickSmear(b, target, frame(40), 'hero')
    b.clearRect(0, 0, 400, 400)
    drawStickSmear(b, target, frame(100), 'hero')
    expect(Array.from(b.getImageData(0, 0, 400, 400).data)).toEqual(Array.from(a.getImageData(0, 0, 400, 400).data))
  })
})

describe('effects', () => {
  it('speed lines need at least two points', () => {
    const ctx = context()
    drawSpeedLines(ctx, [{ x: 10, y: 10 }])
    expect(inked(ctx)).toBe(0)
    drawSpeedLines(ctx, [{ x: 10, y: 10 }, { x: 100, y: 10 }, { x: 200, y: 20 }])
    expect(inked(ctx)).toBeGreaterThan(0)
  })

  it('puffs and stars show only while in progress', () => {
    for (const draw of [drawDustPuff, drawImpactStars]) {
      const ctx = context()
      draw(ctx, { x: 200, y: 200 }, 0)
      draw(ctx, { x: 200, y: 200 }, 1)
      expect(inked(ctx)).toBe(0)
      draw(ctx, { x: 200, y: 200 }, 0.4, { size: 60 })
      expect(inked(ctx)).toBeGreaterThan(0)
    }
  })
})
