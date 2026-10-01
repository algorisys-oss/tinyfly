import { describe, it, expect, beforeAll } from 'vitest'
import { createCanvas, Path2D } from '@napi-rs/canvas'
import {
  EXPRESSIONS,
  withExpression,
  POSES,
  REST_POSE,
  blendPose,
  walkPose,
  strideLength,
  talkingMouth,
  drawStickFigure,
  stickFigureTarget,
  poseTracks,
  pose,
  rubberLimb,
  type StickPose,
  type StickStyle,
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

  it('walks in a scissor stride: one foot forward while the other is back', () => {
    // Screen x of a foot direction: the left limb spreads to -x, the right to +x.
    const leftFoot = (p: StickPose) => -Math.sin((p.leftHip * Math.PI) / 180)
    const rightFoot = (p: StickPose) => Math.sin((p.rightHip * Math.PI) / 180)
    const quarter = walkPose(0.25)
    expect(leftFoot(quarter)).toBeGreaterThan(0.3) // forward, the way it faces
    expect(rightFoot(quarter)).toBeLessThan(-0.3) // back
    expect(leftFoot(quarter)).toBeCloseTo(-rightFoot(quarter)) // evenly about the vertical
    expect(leftFoot(walkPose(0.75))).toBeLessThan(-0.3) // then the other way round
    expect(walkPose(1.25).leftHip).toBeCloseTo(quarter.leftHip)
    // The arm on the side of the forward foot swings back.
    expect(-Math.sin((quarter.leftShoulder * Math.PI) / 180)).toBeLessThan(0)
  })

  it('covers one stride length per cycle, in proportion to height', () => {
    // Foot sweep per cycle: forward and back twice across the hip.
    const foot = (p: StickPose) => -Math.sin((p.leftHip * Math.PI) / 180) * (0.24 + 0.22) * 300
    expect(strideLength(300)).toBeCloseTo(4 * (foot(walkPose(0.25)) - 0))
    expect(strideLength(600)).toBeCloseTo(2 * strideLength(300))
  })

  it('keeps raised arms and the face while walking', () => {
    const waving = walkPose(0.3, POSES.wave)
    expect(waving.rightShoulder).toBe(POSES.wave.rightShoulder)
    expect(waving.rightElbow).toBe(POSES.wave.rightElbow)
    expect(waving.smile).toBe(POSES.wave.smile)
    expect(waving.leftShoulder).not.toBe(POSES.wave.leftShoulder) // the hanging arm swings
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

describe('squash and stretch', () => {
  /** A 200 px figure, feet at (150, 320): at rest its head spans y 120..168. */
  const draw = (figure: StickPose, style: StickStyle = {}) => {
    const ctx = context(300, 340)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 300, 340)
    ctx.translate(150, 320)
    drawStickFigure(ctx, figure, { height: 200, color: '#000000', ...style })
    return ctx
  }

  it('stretches taller and squashes shorter, feet staying on the ground', () => {
    expect(inked(draw(REST_POSE), 120, 70, 60, 40)).toBe(false)
    expect(inked(draw(pose({ stretch: 1.3 })), 120, 70, 60, 40)).toBe(true)
    expect(inked(draw(REST_POSE), 120, 125, 60, 20)).toBe(true)
    expect(inked(draw(pose({ stretch: 0.7 })), 120, 125, 60, 20)).toBe(false)
    // The feet are where they were.
    expect(inked(draw(pose({ stretch: 0.7 })), 120, 310, 60, 10)).toBe(true)
  })

  it('treats a pose without stretch (written before it existed) as unstretched', () => {
    const { stretch: _omitted, ...old } = REST_POSE
    const pixels = (ctx: CanvasRenderingContext2D) => Array.from(ctx.getImageData(0, 0, 300, 340).data).join()
    expect(pixels(draw(old as StickPose))).toBe(pixels(draw(REST_POSE)))
  })

  it('has crouch (squashed) and jump (stretched) poses', () => {
    expect(POSES.crouch.stretch).toBeLessThan(1)
    expect(POSES.jump.stretch).toBeGreaterThan(1)
    expect(blendPose(POSES.crouch, POSES.jump, 0.5).stretch).toBeCloseTo((POSES.crouch.stretch + POSES.jump.stretch) / 2)
  })
})

describe('rubber limbs', () => {
  const root = { x: 0, y: 0 }
  const joint = { x: 10, y: 50 }
  const end = { x: 0, y: 100 }

  it('starts at the root, ends at the end, and passes through the joint', () => {
    for (const rubber of [0, 0.5, 1]) {
      const points = rubberLimb(root, joint, end, rubber, 16)
      expect(points[0]).toEqual(root)
      expect(points[16].x).toBeCloseTo(end.x)
      expect(points[16].y).toBeCloseTo(end.y)
      expect(points[8].x).toBeCloseTo(joint.x)
      expect(points[8].y).toBeCloseTo(joint.y)
    }
  })

  it('is two straight segments at 0 and a smooth curve at 1', () => {
    const jointed = rubberLimb(root, joint, end, 0, 16)
    expect(jointed[4].x).toBeCloseTo(5) // half way along the upper segment
    const hose = rubberLimb(root, joint, end, 1, 16)
    expect(hose[4].x).toBeGreaterThan(6) // the curve bulges past the straight segment
  })

  it('draws differently from jointed limbs, and blends with style.rubber', () => {
    const draw = (rubber?: number) => {
      const ctx = context(300, 340)
      ctx.translate(150, 320)
      drawStickFigure(ctx, POSES.cheer, { height: 300, rubber })
      return Array.from(ctx.getImageData(0, 0, 300, 340).data).join()
    }
    expect(draw(0)).toBe(draw())
    expect(draw(1)).not.toBe(draw(0))
    expect(draw(0.5)).not.toBe(draw(1))
  })
})

describe('expressions', () => {
  it('replace the whole face and keep the body', () => {
    const angry = withExpression(POSES.wave, 'angry')
    expect(angry.rightShoulder).toBe(POSES.wave.rightShoulder)
    expect(angry.browTilt).toBe(-1)
    expect(angry.mouth).toBe(0)
    expect(withExpression(REST_POSE, { leftEye: 0 }).rightEye).toBe(1)
  })

  it('all set the same face fields, so any two blend', () => {
    const fields = Object.keys(EXPRESSIONS.neutral).sort()
    for (const face of Object.values(EXPRESSIONS)) expect(Object.keys(face).sort()).toEqual(fields)
    const half = blendPose(withExpression(REST_POSE, 'happy'), withExpression(REST_POSE, 'sad'), 0.5)
    expect(half.smile).toBeCloseTo((EXPRESSIONS.happy.smile + EXPRESSIONS.sad.smile) / 2)
  })

  it('show on the face: wide eyes, shut eyes and raised brows draw differently', () => {
    const faceBox = (figure = REST_POSE) => {
      const ctx = drawOnWhite(figure)
      return Array.from(ctx.getImageData(110, 20, 80, 72).data).join()
    }
    const rest = faceBox()
    expect(faceBox(withExpression(REST_POSE, 'surprised'))).not.toBe(rest)
    expect(faceBox(withExpression(REST_POSE, 'sleepy'))).not.toBe(rest)
    expect(faceBox(withExpression(REST_POSE, { leftBrow: 1, rightBrow: 1 }))).not.toBe(rest)
    expect(faceBox(withExpression(REST_POSE, 'wink'))).not.toBe(faceBox(withExpression(REST_POSE, 'happy')))
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

  it('exposes rubber as a prop, starting at the style', () => {
    expect(stickFigureTarget({ x: 0, y: 0 }).props).toMatchObject({ rubber: 0, stretch: 1 })
    expect(stickFigureTarget({ x: 0, y: 0, style: { rubber: 1 } }).props).toMatchObject({ rubber: 1 })
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
  it('changes only the face when a key gives just an expression', () => {
    const tracks = poseTracks('hero', [
      { time: 0, pose: 'rest' },
      { time: 400, expression: 'surprised' },
    ])
    const props = tracks.map((t) => t.property)
    expect(props).toContain('leftEye')
    expect(props).toContain('leftBrow')
    expect(props).not.toContain('rightShoulder')
    expect(tracks.find((t) => t.property === 'leftEye')!.keyframes.map((k) => k.value)).toEqual([1, EXPRESSIONS.surprised.leftEye])
  })

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
