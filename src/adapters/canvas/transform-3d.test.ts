import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { quat } from '../../engine/math'
import { CanvasAdapter } from './canvas-adapter'
import {
  affinePart,
  elementMatrix,
  has3dTransform,
  isAffine,
  isBackFacing,
  perspectiveMesh,
  projectPoint,
  triangleTransform,
} from '../transform-3d'

const pivot = { x: 0, y: 0 }
const none = { x: 0, y: 0 }

describe('elementMatrix', () => {
  it('needs the 3D path only for depth, 3D turns, quaternions and perspective', () => {
    expect(has3dTransform({ rotate: 10, scale: 2 })).toBe(false)
    expect(has3dTransform({ rotateY: 10 })).toBe(true)
    expect(has3dTransform({ z: 5 })).toBe(true)
    expect(has3dTransform({ perspective: 600 })).toBe(true)
    expect(has3dTransform({ quaternion: [0, 0, 0, 1] })).toBe(true)
  })

  it('without perspective, rotateY squashes across, as the 2D canvas approximation always did', () => {
    const m = elementMatrix({ rotateY: 60 }, none, pivot)
    expect(isAffine(m)).toBe(true)
    const [a, b, c, d] = affinePart(m)
    expect(a).toBeCloseTo(0.5, 12)
    expect(b).toBeCloseTo(0, 12)
    expect(c).toBeCloseTo(0, 12)
    expect(d).toBeCloseTo(1, 12)
  })

  it('composes in CSS order about the pivot: translate, rotate, rotateX, rotateY, scale', () => {
    // rotate(90deg) scale(2): the x axis turns to +y and doubles; moved by the offset.
    const m = elementMatrix({ rotate: 90, scale: 2 }, { x: 10, y: 20 }, { x: 50, y: 50 })
    const p = projectPoint(m, 60, 50)! // 10 px right of the pivot
    expect(p.x).toBeCloseTo(50 + 10, 9)
    expect(p.y).toBeCloseTo(50 + 20 + 20, 9)
  })

  it('perspective: the near edge grows and the far edge shrinks, as CSS perspective(500px) rotateY(60deg)', () => {
    const m = elementMatrix({ rotateY: 60, perspective: 500 }, none, pivot)
    expect(isAffine(m)).toBe(false)
    // x = ±100 turns to x = ±50, z = ∓86.6; seen from 500 px it lands at x / (1 - z / 500).
    expect(projectPoint(m, 100, 0)!.x).toBeCloseTo(50 / (1 + 86.60254 / 500), 3)
    expect(projectPoint(m, -100, 0)!.x).toBeCloseTo(-50 / (1 - 86.60254 / 500), 3)
    expect(projectPoint(m, -100, 100)!.y).toBeGreaterThan(projectPoint(m, 100, 100)!.y)
  })

  it('z moves toward the viewer: bigger with perspective, unchanged without', () => {
    expect(projectPoint(elementMatrix({ z: 100, perspective: 500 }, none, pivot), 100, 0)!.x).toBeCloseTo(125, 9)
    expect(projectPoint(elementMatrix({ z: 100 }, none, pivot), 100, 0)!.x).toBeCloseTo(100, 9)
  })

  it('a quaternion turns as the same Euler angles do', () => {
    const byQuat = elementMatrix({ quaternion: quat.fromAxisAngle([0, 1, 0], 40), perspective: 400 }, none, pivot)
    const byEuler = elementMatrix({ rotateY: 40, perspective: 400 }, none, pivot)
    for (const [x, y] of [[80, -30], [-60, 45]]) {
      expect(projectPoint(byQuat, x, y)!.x).toBeCloseTo(projectPoint(byEuler, x, y)!.x, 9)
      expect(projectPoint(byQuat, x, y)!.y).toBeCloseTo(projectPoint(byEuler, x, y)!.y, 9)
    }
  })

  it('knows its back: past 90° about y or x, but not a mirror', () => {
    expect(isBackFacing(elementMatrix({ rotateY: 60 }, none, pivot))).toBe(false)
    expect(isBackFacing(elementMatrix({ rotateY: 120 }, none, pivot))).toBe(true)
    expect(isBackFacing(elementMatrix({ rotateX: 150, perspective: 500 }, none, pivot))).toBe(true)
    expect(isBackFacing(elementMatrix({ scaleX: -1, rotateY: 0 }, none, pivot))).toBe(false)
  })
})

describe('perspective mesh', () => {
  it('maps every grid triangle exactly onto its projected corners', () => {
    const m = elementMatrix({ rotateX: 50, perspective: 400 }, none, { x: 50, y: 50 })
    const mesh = perspectiveMesh(m, { x: 0, y: 0, width: 100, height: 100 }, 4)
    expect(mesh).toHaveLength(32)
    for (const triangle of mesh) {
      const t = triangleTransform(triangle.source, triangle.target)!
      triangle.source.forEach((s, i) => {
        expect(t[0] * s.x + t[2] * s.y + t[4]).toBeCloseTo(triangle.target[i].x, 9)
        expect(t[1] * s.x + t[3] * s.y + t[5]).toBeCloseTo(triangle.target[i].y, 9)
      })
    }
  })

  it('leaves out triangles behind the viewer', () => {
    const m = elementMatrix({ z: 480, rotateX: 80, perspective: 500 }, none, { x: 50, y: 50 })
    const mesh = perspectiveMesh(m, { x: 0, y: 0, width: 100, height: 100 }, 4)
    expect(mesh.length).toBeLessThan(32)
  })
})

describe('CanvasAdapter in 3D', () => {
  const W = 400
  const H = 200
  /** Alpha along the middle row, after drawing one 200×100 card centred at (200, 100). */
  const render = (props: Record<string, unknown>) => {
    const ctx = createCanvas(W, H).getContext('2d') as unknown as CanvasRenderingContext2D
    const adapter = new CanvasAdapter()
    adapter.registerTarget('card', { type: 'rect', x: 100, y: 50, width: 200, height: 100, fillStyle: '#000', ...props } as never)
    adapter.render(ctx)
    const row = ctx.getImageData(0, 100, W, 1).data
    return Array.from({ length: W }, (_, x) => row[x * 4 + 3])
  }

  it('draws a card in perspective where CSS puts its corners', () => {
    const alpha = render({ rotateY: 60, perspective: 500 })
    const near = Math.round(200 - 50 / (1 - 86.60254 / 500)) // left edge, nearer the viewer
    const far = Math.round(200 + 50 / (1 + 86.60254 / 500))
    expect(alpha[near + 2]).toBe(255)
    expect(alpha[near - 2]).toBe(0)
    expect(alpha[far - 2]).toBe(255)
    expect(alpha[far + 2]).toBe(0)
  })

  it('leaves no seams between the mesh triangles', () => {
    const alpha = render({ rotateY: 35, rotateX: 20, perspective: 400 })
    const inside = alpha.slice(150, 250)
    expect(inside.every((a) => a === 255)).toBe(true)
  })

  it('a see-through card in perspective is evenly see-through: no darker grid where triangles overlap', () => {
    const alpha = render({ rotateY: 35, rotateX: 20, perspective: 400, opacity: 0.5 })
    const inside = alpha.slice(150, 250)
    expect(new Set(inside).size).toBe(1)
    expect(inside[0]).toBeGreaterThan(120)
    expect(inside[0]).toBeLessThan(135)
  })

  it('hides a card whose back faces the viewer when asked to', () => {
    expect(render({ rotateY: 150, perspective: 500 }).some((a) => a > 0)).toBe(true)
    expect(render({ rotateY: 150, perspective: 500, backfaceVisibility: 'hidden' }).every((a) => a === 0)).toBe(true)
  })

  it('without perspective, matches the flat rotateY squash it always drew', () => {
    const alpha = render({ rotateY: 60 })
    expect(alpha[152]).toBe(255)
    expect(alpha[148]).toBe(0)
    expect(alpha[248]).toBe(255)
    expect(alpha[252]).toBe(0)
  })
})
