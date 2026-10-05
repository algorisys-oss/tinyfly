import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { drawResolvedScene, loadScene3D, resolveScene3D, type Scene3D } from './index'

const W = 400
const H = 300

/** How much of a frame's ink is actually dark: sample every outline edge every pixel, inset from its ends. */
function inkCoverage(json: Scene3D): { dark: number; samples: number } {
  const frame = resolveScene3D(loadScene3D(json), new Map(), { width: W, height: H })
  const ctx = createCanvas(W, H).getContext('2d') as unknown as CanvasRenderingContext2D
  drawResolvedScene(ctx, frame)
  const data = ctx.getImageData(0, 0, W, H).data
  let dark = 0
  let samples = 0
  for (const triangle of frame.triangles) {
    for (const [p, q] of triangle.outline) {
      const length = Math.hypot(q.x - p.x, q.y - p.y)
      for (let d = 2; d < length - 2; d += 1) {
        const x = Math.round(p.x + ((q.x - p.x) * d) / length)
        const y = Math.round(p.y + ((q.y - p.y) * d) / length)
        if (x < 0 || y < 0 || x >= W || y >= H) continue
        samples++
        const i = (y * W + x) * 4
        if (data[i] < 90 && data[i + 1] < 90 && data[i + 2] < 90) dark++
      }
    }
  }
  return { dark, samples }
}

describe('Canvas 2D renderer: ink on subdivided meshes', () => {
  it('stays whole: neighbouring faces drawn after an edge never nick its ink', () => {
    const coverage = inkCoverage({
      id: 'stage',
      camera: 'cam',
      background: '#ffffff',
      materials: { pale: { color: '#e0f0ff', shading: 'unlit', outline: { width: 3, color: '#000000' } } },
      objects: [
        { id: 'cam', kind: 'camera', projection: 'perspective', fov: 50, near: 0.1, far: 50, position: [3, 4, 6], lookAt: [0, 0, 0] },
        // A finely divided floor: its rim is inked, and every rim edge has neighbours at about its depth.
        { id: 'floor', kind: 'mesh', geometry: { type: 'plane', size: [4, 4], segments: 16 }, material: 'pale' },
      ],
    })
    expect(coverage.samples).toBeGreaterThan(300)
    expect(coverage.dark / coverage.samples).toBeGreaterThan(0.995)
  })

  it('a nearer object still covers ink behind it', () => {
    const json: Scene3D = {
      id: 'stage',
      camera: 'cam',
      background: '#ffffff',
      materials: {
        inked: { color: '#ffffff', shading: 'unlit', outline: { width: 4, color: '#000000' } },
        red: { color: '#ff0000', shading: 'unlit' },
      },
      objects: [
        { id: 'cam', kind: 'camera', projection: 'perspective', fov: 50, near: 0.1, far: 50, position: [0, 0, 6], lookAt: [0, 0, 0] },
        { id: 'back', kind: 'mesh', geometry: { type: 'box', size: [2, 2, 0.2] }, material: 'inked' },
        { id: 'front', kind: 'mesh', geometry: { type: 'box', size: [3, 0.6, 0.2] }, material: 'red', position: [0, 0, 1.5] },
      ],
    }
    const frame = resolveScene3D(loadScene3D(json), new Map(), { width: W, height: H })
    const ctx = createCanvas(W, H).getContext('2d') as unknown as CanvasRenderingContext2D
    drawResolvedScene(ctx, frame)
    // Where the red bar crosses the back box's left edge, red wins.
    const backLeft = Math.min(...frame.triangles.filter((t) => t.objectId === 'back').flatMap((t) => t.screen.map((p) => p.x)))
    const pixel = ctx.getImageData(Math.round(backLeft), H / 2, 1, 1).data
    expect(pixel[0]).toBeGreaterThan(200)
    expect(pixel[1]).toBeLessThan(60)
  })
})
