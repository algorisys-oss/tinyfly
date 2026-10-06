import { describe, it, expect, beforeAll } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, existsSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createCanvas, Path2D } from '@napi-rs/canvas'
import { FrameRenderer, frameCount } from './frame-renderer'
import { ffmpegArgs } from './ffmpeg-args'
import { sceneCaptions } from './scene-captions'
import { renderVideo, renderStills } from './node-video'
import type { VideoScene } from './video-scene'
import type { TimelineDefinition } from '../engine/types'

const timeline: TimelineDefinition = {
  id: 'box',
  config: {
    duration: 1000,
    markers: [
      { id: 'start', time: 0, label: 'Start' },
      { id: 'half', time: 500, label: 'Half way' },
    ],
  },
  tracks: [
    {
      id: 'move',
      target: 'box',
      property: 'x',
      keyframes: [
        { time: 0, value: 0 },
        { time: 1000, value: 60 },
      ],
    },
    {
      id: 'wave',
      target: 'dot',
      property: 'size',
      keyframes: [
        { time: 0, value: 2 },
        { time: 1000, value: 10 },
      ],
    },
  ],
}

const scene = (): VideoScene => ({
  width: 80,
  height: 40,
  fps: 10,
  background: '#000000',
  timeline,
  targets: {
    box: { type: 'rect', x: 0, y: 0, width: 10, height: 10, fillStyle: '#ff0000' },
    dot: {
      type: 'custom',
      x: 0,
      y: 30,
      width: 10,
      height: 10,
      props: { size: 2 },
      draw: (ctx, target) => {
        ctx.fillStyle = '#00ff00'
        ctx.fillRect(0, 0, target.props?.size as number, 2)
      },
    },
  },
  draw: (ctx, frame) => {
    ctx.fillStyle = '#0000ff'
    ctx.fillRect(0, 20, (frame.time / 1000) * 80, 2)
  },
})

/** RGB at a pixel of a context. */
const pixel = (ctx: CanvasRenderingContext2D, x: number, y: number) => Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3))

describe('FrameRenderer', () => {
  beforeAll(() => {
    ;(globalThis as { Path2D?: unknown }).Path2D ??= Path2D
  })

  it('draws background, timeline targets, custom targets and the draw hook at a time', () => {
    const renderer = new FrameRenderer(scene())
    const ctx = createCanvas(80, 40).getContext('2d') as unknown as CanvasRenderingContext2D
    renderer.render(ctx, 500)

    expect(pixel(ctx, 70, 5)).toEqual([0, 0, 0]) // background
    expect(pixel(ctx, 35, 5)).toEqual([255, 0, 0]) // box moved to x=30
    expect(pixel(ctx, 5, 5)).toEqual([0, 0, 0]) // … and left x=0
    expect(pixel(ctx, 5, 30)).toEqual([0, 255, 0]) // custom target, size 6
    expect(pixel(ctx, 7, 30)).toEqual([0, 0, 0])
    expect(pixel(ctx, 39, 20)).toEqual([0, 0, 255]) // draw hook, half width
    expect(pixel(ctx, 41, 20)).toEqual([0, 0, 0])
  })

  it('is deterministic whatever order frames are drawn in', () => {
    const renderer = new FrameRenderer(scene())
    const ctx = createCanvas(80, 40).getContext('2d') as unknown as CanvasRenderingContext2D
    renderer.render(ctx, 300)
    const first = Array.from(ctx.getImageData(0, 0, 80, 40).data)
    renderer.render(ctx, 900)
    renderer.render(ctx, 300)
    expect(Array.from(ctx.getImageData(0, 0, 80, 40).data)).toEqual(first)
  })

  it('passes custom targets the frame time (so talk chatters and sketches boil)', () => {
    const times: number[] = []
    const watched = scene()
    watched.targets!.clock = { type: 'custom', x: 0, y: 0, width: 1, height: 1, draw: (_ctx, _target, time) => times.push(time) }
    const renderer = new FrameRenderer(watched)
    const ctx = createCanvas(80, 40).getContext('2d') as unknown as CanvasRenderingContext2D
    renderer.render(ctx, 0)
    renderer.render(ctx, 500)
    renderer.render(ctx, 900)
    expect(times).toEqual([0, 500, 900])
  })

  it('holds each drawing for several frames at a drawing rate (on twos)', () => {
    const times: number[] = []
    const sizes: number[] = []
    const watched = { ...scene(), drawingRate: 4 }
    watched.targets!.clock = { type: 'custom', x: 0, y: 0, width: 1, height: 1, draw: (_ctx, _target, time) => times.push(time) }
    let earlier: number | undefined
    watched.draw = (_ctx, frame) => {
      sizes.push(frame.state?.values.get('dot')?.get('size') as number)
      earlier = frame.stateAt?.(370).values.get('dot')?.get('size') as number
    }
    const renderer = new FrameRenderer(watched)
    const ctx = createCanvas(80, 40).getContext('2d') as unknown as CanvasRenderingContext2D
    for (const time of [0, 100, 200, 250, 600]) renderer.render(ctx, time)
    // Four drawings a second: a new one every 250 ms.
    expect(times).toEqual([0, 0, 0, 250, 500])
    expect(sizes).toEqual([2, 2, 2, 4, 6])
    expect(earlier).toBe(4)
  })

  it('sees the scene through a camera', () => {
    const camera = { ...scene(), camera: true, background: '#000000', draw: undefined }
    camera.timeline = {
      ...timeline,
      tracks: [...timeline.tracks, { id: 'pan', target: 'Camera', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 30 }] }],
    }
    const renderer = new FrameRenderer(camera)
    const ctx = createCanvas(80, 40).getContext('2d') as unknown as CanvasRenderingContext2D
    renderer.render(ctx, 0)
    expect(pixel(ctx, 5, 5)).toEqual([255, 0, 0])
    // Panned 30 px right: the box (0..10 wide, moving to x 60) is seen 30 px over.
    renderer.render(ctx, 1000)
    expect(pixel(ctx, 5, 5)).toEqual([0, 0, 0])
    expect(pixel(ctx, 79, 5)).toEqual([0, 0, 0])
    renderer.render(ctx, 500)
    expect(pixel(ctx, 30 + 15 + 5, 5)).toEqual([255, 0, 0])
  })

  it('draws the overlay in screen space, not through the camera', () => {
    const overlaid = {
      ...scene(),
      camera: true,
      background: '#000000',
      draw: undefined,
      overlay: (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 4, 4)
      },
    }
    overlaid.timeline = { ...timeline, tracks: [{ id: 'pan', target: 'Camera', property: 'x', keyframes: [{ time: 0, value: 40 }] }] }
    const renderer = new FrameRenderer(overlaid, { scale: 0.5 })
    const ctx = createCanvas(40, 20).getContext('2d') as unknown as CanvasRenderingContext2D
    renderer.render(ctx, 0)
    // The overlay's corner square stays in the corner (scaled with the output); the box is panned away.
    expect(pixel(ctx, 1, 1)).toEqual([255, 255, 255])
    expect(pixel(ctx, 3, 3)).toEqual([0, 0, 0])
  })

  it('scales the output', () => {
    const renderer = new FrameRenderer(scene(), { scale: 0.5 })
    expect([renderer.width, renderer.height]).toEqual([40, 20])
    const ctx = createCanvas(40, 20).getContext('2d') as unknown as CanvasRenderingContext2D
    renderer.render(ctx, 500)
    expect(pixel(ctx, 17, 2)).toEqual([255, 0, 0])
  })

  it('counts frames, times and stills', () => {
    const renderer = new FrameRenderer(scene())
    expect(renderer.frameCount).toBe(10)
    expect(renderer.frameTime(3)).toBe(300)
    expect(renderer.stillTimes()).toEqual([
      { id: 'start', time: 250 },
      { id: 'half', time: 750 },
    ])
    expect(frameCount(2000, 30)).toBe(60)
    expect(frameCount(2001, 30)).toBe(61)
    expect(frameCount(1, 30)).toBe(1)
  })

  it('takes stills mid-caption when the scene has captions', () => {
    const captions = [
      { id: 's0-l0', start: 100, end: 300, text: 'a' },
      { start: 600, end: 700, text: 'b' },
    ]
    expect(new FrameRenderer({ ...scene(), captions }).stillTimes()).toEqual([
      { id: 's0-l0', time: 200 },
      { id: 'line-1', time: 650 },
    ])
  })

  it('needs a duration', () => {
    expect(() => new FrameRenderer({ width: 10, height: 10 })).toThrow(/duration/)
    expect(new FrameRenderer({ width: 10, height: 10, duration: 250 }).stillTimes()).toEqual([{ id: 'middle', time: 125 }])
  })
})

describe('ffmpegArgs', () => {
  it('encodes raw RGBA from stdin, with optional audio', () => {
    const silent = ffmpegArgs({ width: 1920, height: 1080, fps: 30, output: 'out.mp4' })
    expect(silent.join(' ')).toContain('-f rawvideo -pix_fmt rgba -s 1920x1080 -r 30 -i -')
    expect(silent).not.toContain('-shortest')
    expect(silent.at(-1)).toBe('out.mp4')

    const voiced = ffmpegArgs({ width: 8, height: 8, fps: 24, output: 'o.mp4', audio: 'n.wav', crf: 18 })
    expect(voiced.join(' ')).toContain('-i - -i n.wav')
    expect(voiced.join(' ')).toContain('-crf 18')
    expect(voiced).toContain('-shortest')
  })
})

describe('sceneCaptions', () => {
  it('prefers the scene captions, then the timeline markers', () => {
    expect(sceneCaptions(scene()).map((cue) => cue.text)).toEqual(['Start', 'Half way'])
    expect(sceneCaptions({ ...scene(), captions: [{ start: 0, end: 1, text: 'x' }] })).toHaveLength(1)
    expect(sceneCaptions({ width: 1, height: 1, duration: 1 })).toEqual([])
  })
})

const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0

describe('renderVideo / renderStills', () => {
  it.skipIf(!hasFfmpeg)('writes a playable MP4 with every frame', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tinyfly-video-'))
    const output = join(dir, 'out.mp4')
    const progress: number[] = []
    const result = await renderVideo(scene(), { output, onProgress: (done) => progress.push(done) })
    expect(result.frames).toBe(10)
    expect(progress.at(-1)).toBe(10)
    expect(statSync(output).size).toBeGreaterThan(0)

    const probe = spawnSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames,width,height', '-of', 'csv=p=0', output])
    if (probe.status === 0) expect(probe.stdout.toString().trim()).toBe('80,40,10')
  })

  it.skipIf(!hasFfmpeg)('reports a missing ffmpeg clearly', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tinyfly-video-'))
    await expect(renderVideo(scene(), { output: join(dir, 'o.mp4'), ffmpeg: 'no-such-ffmpeg-binary' })).rejects.toThrow(
      /not found/
    )
  })

  it('writes one PNG per marker step', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tinyfly-stills-'))
    const files = await renderStills(scene(), { dir })
    expect(readdirSync(dir).sort()).toEqual(['0-start.png', '1-half.png'])
    expect(files.every((file) => existsSync(file))).toBe(true)
  })
})

describe('background function', () => {
  it('draws under the targets, with its context changes contained', () => {
    const renderer = new FrameRenderer({
      ...scene(),
      background: (ctx, frame) => {
        ctx.fillStyle = frame.time < 500 ? '#ffff00' : '#00ffff'
        ctx.fillRect(0, 0, frame.width, frame.height)
        ctx.globalAlpha = 0.1 // must not leak into the targets
      },
    })
    const ctx = createCanvas(80, 40).getContext('2d') as unknown as CanvasRenderingContext2D
    renderer.render(ctx, 600)
    expect(pixel(ctx, 70, 5)).toEqual([0, 255, 255])
    expect(pixel(ctx, 37, 5)).toEqual([255, 0, 0])
    renderer.render(ctx, 100)
    expect(pixel(ctx, 70, 5)).toEqual([255, 255, 0])
  })
})
