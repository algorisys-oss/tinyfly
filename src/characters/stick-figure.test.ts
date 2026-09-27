import { describe, it, expect, beforeAll } from 'vitest'
import { createCanvas, Path2D } from '@napi-rs/canvas'
import {
  POSES,
  REST_POSE,
  blendPose,
  walkPose,
  talkingMouth,
  drawStickFigure,
  stickFigureTarget,
  poseTracks,
  pose,
} from './stick-figure'
import { FrameRenderer } from '../headless/frame-renderer'

const context = (width: number, height: number) =>
  createCanvas(width, height).getContext('2d') as unknown as CanvasRenderingContext2D

/** Whether any pixel in the box is dark (ink on a white canvas). */
function inked(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): boolean {
  const data = ctx.getImageData(x, y, w, h).data
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 0 && data[i] < 128) return true
  return false
}

function drawOnWhite(figure = REST_POSE, facing = 1) {
  const ctx = context(300, 340)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 300, 340)
  ctx.translate(150, 320)
  drawStickFigure(ctx, figure, { height: 300, color: '#000000', facing })
  return ctx
}

describe('poses', () => {
  it('blends every joint linearly', () => {
    const half = blendPose(REST_POSE, POSES.wave, 0.5)
    expect(half.rightShoulder).toBe((REST_POSE.rightShoulder + POSES.wave.rightShoulder) / 2)
    expect(blendPose(REST_POSE, POSES.wave, 0)).toEqual(REST_POSE)
    expect(blendPose(REST_POSE, POSES.wave, 1)).toEqual(POSES.wave)
  })

  it('walks in a repeating scissor stride', () => {
    const quarter = walkPose(0.25)
    expect(quarter.leftHip - REST_POSE.leftHip).toBeCloseTo(22)
    expect(quarter.rightHip - REST_POSE.rightHip).toBeCloseTo(-22)
    expect(walkPose(1.25).leftHip).toBeCloseTo(quarter.leftHip)
    expect(walkPose(0).leftHip).toBeCloseTo(REST_POSE.leftHip)
    // The upper body keeps the base pose's other joints.
    expect(walkPose(0.3, POSES.wave).rightElbow).toBe(POSES.wave.rightElbow)
  })

  it('talks deterministically within 0..1', () => {
    const samples = Array.from({ length: 200 }, (_, i) => talkingMouth(i * 17))
    expect(Math.min(...samples)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...samples)).toBeLessThanOrEqual(1)
    expect(talkingMouth(1234)).toBe(talkingMouth(1234))
  })
})

describe('drawStickFigure', () => {
  it('raises the right hand above the head when waving', () => {
    // Head top is at y = 20; a raised right hand is above the shoulders, right of the head.
    expect(inked(drawOnWhite(REST_POSE), 190, 40, 80, 60)).toBe(false)
    expect(inked(drawOnWhite(POSES.wave), 190, 40, 80, 60)).toBe(true)
  })

  it('mirrors when facing left', () => {
    expect(inked(drawOnWhite(POSES.wave, -1), 30, 40, 80, 60)).toBe(true)
    expect(inked(drawOnWhite(POSES.wave, -1), 190, 40, 80, 60)).toBe(false)
  })
})

describe('stickFigureTarget', () => {
  beforeAll(() => {
    ;(globalThis as { Path2D?: unknown }).Path2D ??= Path2D
  })

  it('stands its feet at x/y and exposes the pose as props', () => {
    const target = stickFigureTarget({ x: 400, y: 600, pose: { smile: 1 }, style: { height: 200 } })
    expect([target.x, target.y, target.width, target.height]).toEqual([320, 400, 160, 200])
    expect(target.props).toMatchObject({ smile: 1, walk: 0, walking: 0, talk: 0, rightShoulder: REST_POSE.rightShoulder })
  })

  it('is posed by timeline tracks', () => {
    const scene = {
      width: 300,
      height: 340,
      background: '#ffffff',
      targets: { hero: stickFigureTarget({ x: 150, y: 320, style: { height: 300, color: '#000000' } }) },
      timeline: {
        id: 't',
        config: { duration: 1000 },
        tracks: poseTracks('hero', [
          { time: 0, pose: 'rest' },
          { time: 1000, pose: 'wave' },
        ]),
      },
    }
    const renderer = new FrameRenderer(scene)
    const ctx = context(300, 340)
    renderer.render(ctx, 0)
    expect(inked(ctx, 190, 40, 80, 60)).toBe(false)
    renderer.render(ctx, 1000)
    expect(inked(ctx, 190, 40, 80, 60)).toBe(true)
  })
})

describe('poseTracks', () => {
  it('applies a pose that holds still, even from a single key', () => {
    const tracks = poseTracks('hero', [{ time: 0, pose: 'wave' }])
    const shoulder = tracks.find((t) => t.property === 'rightShoulder')!
    expect(shoulder.keyframes).toEqual([{ time: 0, value: POSES.wave.rightShoulder }])
    expect(tracks.some((t) => t.property === 'leftShoulder')).toBe(false)
  })

  it('makes one track per changing joint, building each key on the last', () => {
    const tracks = poseTracks('hero', [
      { time: 0, pose: {} },
      { time: 500, pose: { rightShoulder: 120 }, easing: 'ease-out' },
      { time: 900, pose: { mouth: 1 } },
    ])
    expect(tracks.map((t) => t.property).sort()).toEqual(['mouth', 'rightShoulder'])
    const shoulder = tracks.find((t) => t.property === 'rightShoulder')!
    expect(shoulder.id).toBe('hero-rightShoulder')
    expect(shoulder.keyframes).toEqual([
      { time: 0, value: REST_POSE.rightShoulder },
      { time: 500, value: 120, easing: 'ease-out' },
      { time: 900, value: 120 },
    ])
  })

  it('accepts named poses', () => {
    const tracks = poseTracks('hero', [
      { time: 0, pose: 'rest' },
      { time: 400, pose: 'cheer' },
    ])
    const changed = Object.keys(POSES.cheer).filter(
      (k) => POSES.cheer[k as keyof typeof REST_POSE] !== REST_POSE[k as keyof typeof REST_POSE]
    )
    expect(tracks.map((t) => t.property).sort()).toEqual(changed.sort())
    expect(pose({ blink: 1 }).blink).toBe(1)
  })
})
