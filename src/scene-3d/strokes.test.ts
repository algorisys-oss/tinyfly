import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import type { AnimatableValue } from '../engine/types'
import { Timeline } from '../engine/core/timeline'
import { FrameRenderer } from '../headless/frame-renderer'
import { drawScene3D, loadScene3D, resolveScene3D, validateScene3D, type Object3D, type Scene3D } from './index'

const SIZE = { width: 400, height: 300 }

function scene(objects: Object3D[], extra: Partial<Scene3D> = {}): Scene3D {
  return {
    id: 'stage',
    camera: 'eye',
    materials: { red: { color: '#ff0000', shading: 'unlit' } },
    objects: [{ id: 'eye', kind: 'camera', projection: 'perspective', fov: 60, near: 0.1, far: 100, position: [0, 0, 5] }, ...objects],
    ...extra,
  }
}

const values = (entries: Record<string, Record<string, AnimatableValue>>) =>
  new Map(Object.entries(entries).map(([target, props]) => [target, new Map(Object.entries(props))]))

const line = (extra: Partial<Object3D> = {}): Object3D =>
  ({ id: 'beam', kind: 'line', points: [[-1, 0, 0], [0, 0, 0], [1, 0, 0]], width: 0.2, color: '#00ff00', ...extra }) as Object3D

describe('lines and trails: validation', () => {
  it('a line needs points; a trail something else to follow and a length', () => {
    const errors = validateScene3D(scene([
      { id: 'short', kind: 'line', points: [[0, 0, 0]], color: '#fff' },
      { id: 'lost', kind: 'trail', follow: 'nobody', length: 300, color: '#fff' },
      { id: 'self', kind: 'trail', follow: 'self', length: 0, color: '#fff', fade: 2 },
    ]))
    expect(errors.some((e) => e.includes('"short"') && e.includes('two or more points'))).toBe(true)
    expect(errors.some((e) => e.includes('"lost" follows "nobody"'))).toBe(true)
    expect(errors.some((e) => e.includes('"self" follows "self"'))).toBe(true)
    expect(errors.some((e) => e.includes('"self"') && e.includes('length'))).toBe(true)
    expect(errors.some((e) => e.includes('"self": fade'))).toBe(true)
  })

  it('loads without any added kind', () => {
    expect(() => loadScene3D(scene([line()]))).not.toThrow()
  })
})

describe('lines', () => {
  it('a band of segments, each placed among the triangles by its depth', () => {
    const frame = resolveScene3D(loadScene3D(scene([line({ points: [[-1, 0, -3], [0, 0, 0], [1, 0, 2]] } as Partial<Object3D>)])), new Map(), SIZE)
    const depths = frame.drawables.filter((d) => d.objectId === 'beam').map((d) => d.depth)
    expect(depths).toHaveLength(2)
    // Far to near.
    expect(depths[0]).toBeGreaterThan(depths[1])
  })

  it('narrows with distance, moves with its transform, and is cut at the near plane', () => {
    const draw = (extra: Partial<Object3D>) => {
      const ctx = createCanvas(SIZE.width, SIZE.height).getContext('2d') as unknown as CanvasRenderingContext2D
      drawScene3D(ctx, loadScene3D(scene([line(extra)])), undefined, SIZE)
      const data = ctx.getImageData(0, 0, SIZE.width, SIZE.height).data
      let rows = new Set<number>()
      let lit = 0
      for (let i = 0; i < data.length; i += 4) if (data[i + 1] > 128) { lit++; rows.add(Math.floor(i / 4 / SIZE.width)) }
      return { lit, rows: rows.size }
    }
    const near = draw({})
    const far = draw({ position: [0, 0, -5] })
    expect(near.rows).toBeGreaterThan(far.rows)
    expect(draw({ visible: false }).lit).toBe(0)
    // Through the camera: only what is in front is drawn, and nothing throws.
    expect(draw({ points: [[0, 0, -2], [0, 0, 10]] } as Partial<Object3D>).lit).toBeGreaterThan(0)
  })

  it('animates its colour, width and opacity', () => {
    const loaded = loadScene3D(scene([line()]))
    const pixel = (v: ReturnType<typeof values>) => {
      const ctx = createCanvas(SIZE.width, SIZE.height).getContext('2d') as unknown as CanvasRenderingContext2D
      drawScene3D(ctx, loaded, v, SIZE)
      return [...ctx.getImageData(200, 150, 1, 1).data]
    }
    expect(pixel(values({}))).toEqual([0, 255, 0, 255])
    expect(pixel(values({ 'stage/beam': { color: '#0000ff' } }))).toEqual([0, 0, 255, 255])
    expect(pixel(values({ 'stage/beam': { opacity: 0 } }))[3]).toBe(0)
    expect(resolveScene3D(loaded, values({ 'stage/beam': { width: 0 } }), SIZE).drawables).toHaveLength(0)
  })
})

describe('trails', () => {
  const definition = {
    id: 't',
    config: { duration: 1000 },
    tracks: [{ id: 'x', target: 'stage/comet', property: 'x', keyframes: [{ time: 0, value: -2 }, { time: 1000, value: 2 }] }],
  }
  const timeline = new Timeline(definition)
  const loaded = loadScene3D(scene([
    { id: 'comet', kind: 'group' },
    { id: 'tail', kind: 'trail', follow: 'comet', length: 500, samples: 11, width: 0.2, color: '#00ff00' },
  ]))
  const frameAt = (time: number, withPast = true) =>
    resolveScene3D(loaded, timeline.getStateAtTime(time).values, { ...SIZE, time, ...(withPast && { valuesAt: (t: number) => timeline.getStateAtTime(t).values }) })

  it('draws where the followed object has been, given the earlier moments', () => {
    const frame = frameAt(1000)
    expect(frame.drawables.filter((d) => d.objectId === 'tail')).toHaveLength(10)
    expect(frameAt(1000, false).drawables).toHaveLength(0)
  })

  it('reaches back `length` ms: from x 0 to x 2 at one second', () => {
    const ctx = createCanvas(SIZE.width, SIZE.height).getContext('2d') as unknown as CanvasRenderingContext2D
    drawScene3D(ctx, loaded, timeline.getStateAtTime(1000).values, { ...SIZE, time: 1000, valuesAt: (t) => timeline.getStateAtTime(t).values })
    // On a clear canvas the fade shows in the alpha.
    const cover = (x: number) => ctx.getImageData(x, 150, 1, 1).data[3]
    // About 52 px a metre here: x = 0 m is at 200 px, the head (2 m) near 304 px; x = -1 m is left of the tail.
    expect(cover(290)).toBeGreaterThan(cover(215))
    expect(cover(140)).toBe(0)
  })

  it('a video frame gives trails the earlier moments by itself', () => {
    const renderer = new FrameRenderer({
      width: SIZE.width,
      height: SIZE.height,
      background: '#000000',
      timeline: definition as never,
      draw: (ctx, frame) => drawScene3D(ctx, loaded, frame.state?.values, frame),
    })
    const ctx = createCanvas(SIZE.width, SIZE.height).getContext('2d') as unknown as CanvasRenderingContext2D
    renderer.render(ctx, 1000)
    expect(ctx.getImageData(290, 150, 1, 1).data[1]).toBeGreaterThan(100)
  })
})
