import { describe, it, expect } from 'vitest'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { drawScene3D, loadScene3D, orbitPosition, type Scene3D } from './index'
import type { AnimatableValue } from '../engine/types'

/**
 * Golden frames: 3D scenes drawn by the Canvas 2D renderer. Rendering is
 * deterministic, so the same scene must draw exactly these pixels. Set
 * UPDATE_GOLDEN=1 to rewrite them, only when a change to the look is intended.
 */
const GOLDEN_DIR = join(__dirname, 'golden')
const W = 480
const H = 270

const STAR = 'M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z'
const RING =
  'M 0 -50 C 28 -50 50 -28 50 0 C 50 28 28 50 0 50 C -28 50 -50 28 -50 0 C -50 -28 -28 -50 0 -50 Z ' +
  'M 0 -25 C -14 -25 -25 -14 -25 0 C -25 14 -14 25 0 25 C 14 25 25 14 25 0 C 25 -14 14 -25 0 -25 Z'

const base = (materials: Scene3D['materials'], objects: Scene3D['objects'], extra: Partial<Scene3D> = {}, floorSegments = 8): Scene3D => ({
  id: 'stage',
  camera: 'cam',
  background: '#1e293b',
  materials: { floor: { color: '#334155', shading: 'flat' }, ...materials },
  objects: [
    { id: 'cam', kind: 'camera', projection: 'perspective', fov: 45, near: 0.1, far: 50, position: orbitPosition([0, 0.6, 0], 25, 22, 7), lookAt: [0, 0.6, 0] },
    { id: 'sun', kind: 'light', light: 'directional', color: '#ffffff', intensity: 0.9, position: [4, 6, 3] },
    { id: 'sky', kind: 'light', light: 'ambient', color: '#9bb4c7', intensity: 0.35 },
    { id: 'floor', kind: 'mesh', layer: -1, geometry: { type: 'plane', size: [14, 14], segments: floorSegments }, material: 'floor' },
    ...objects,
  ],
  ...extra,
})

const CASES: Array<{ name: string; scene: Scene3D; values?: Record<string, Record<string, AnimatableValue>> }> = [
  {
    name: 'primitives-toon',
    scene: base(
      {
        red: { color: '#ef4444', shading: 'toon', outline: { width: 2, color: '#0f172a' } },
        blue: { color: '#4a9eff', shading: 'lambert' },
        gold: { color: '#f1c40f', shading: 'flat', outline: { width: 1.5, color: '#0f172a' } },
        green: { color: '#2ecc71', shading: 'toon', bands: 4 },
      },
      [
        { id: 'box', kind: 'mesh', geometry: { type: 'box', size: [1.2, 1.2, 1.2] }, material: 'red', position: [-1.8, 0.6, 0], rotation: [0, 30, 0] },
        { id: 'ball', kind: 'mesh', geometry: { type: 'sphere', radius: 0.7, segments: 20 }, material: 'blue', position: [0, 0.7, 0.8] },
        { id: 'cone', kind: 'mesh', geometry: { type: 'cone', radius: 0.6, height: 1.4, segments: 20 }, material: 'gold', position: [1.8, 0.7, 0] },
        { id: 'ring', kind: 'mesh', geometry: { type: 'torus', radius: 0.6, tube: 0.2, segments: 24 }, material: 'green', position: [0, 1.3, -2], rotation: [70, 0, 0] },
      ],
      { fog: { color: '#1e293b', near: 7, far: 16 } }
    ),
  },
  {
    name: 'extruded-star-and-ring',
    scene: base(
      {
        gold: { color: '#f1c40f', shading: 'toon', outline: { width: 2, color: '#0f172a' } },
        mint: { color: '#2ecc71', shading: 'flat', outline: { width: 2, color: '#0f172a' } },
      },
      [
        { id: 'star', kind: 'mesh', geometry: { type: 'extrude', path: STAR, depth: 0.3, width: 1.8 }, material: 'gold', position: [-1.1, 0.95, 0] },
        { id: 'ring', kind: 'mesh', geometry: { type: 'extrude', path: RING, depth: 0.3, width: 1.4, curveSegments: 10 }, material: 'mint', position: [1.2, 0.75, 0] },
      ]
    ),
    values: { 'stage/star': { rotateY: 25 }, 'stage/ring': { rotateY: -35 } },
  },
  {
    name: 'spot-and-point-lights',
    scene: base(
      { white: { color: '#f8fafc', shading: 'lambert' } },
      [
        { id: 'spot', kind: 'light', light: 'spot', color: '#ffd166', intensity: 1.2, position: [0, 5, 0], target: [0, 0, 0], angle: 22, range: 10 },
        { id: 'bulb', kind: 'light', light: 'point', color: '#4a9eff', intensity: 1, position: [2, 1, 1.5], range: 4 },
        { id: 'pillar', kind: 'mesh', geometry: { type: 'cylinder', radius: 0.4, height: 1.6, segments: 24 }, material: 'white', position: [0, 0.8, 0] },
      ],
      {},
      40
    ),
  },
]

function render(scene: Scene3D, values?: Record<string, Record<string, AnimatableValue>>) {
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  const animated = new Map(Object.entries(values ?? {}).map(([target, props]) => [target, new Map(Object.entries(props))]))
  drawScene3D(ctx, loadScene3D(scene), animated, { width: W, height: H })
  return canvas
}

describe('scene-3d golden frames', () => {
  for (const { name, scene, values } of CASES) {
    it(`draws ${name} pixel-identically`, async () => {
      const canvas = render(scene, values)
      const file = join(GOLDEN_DIR, `${name}.png`)
      if (process.env.UPDATE_GOLDEN) {
        mkdirSync(GOLDEN_DIR, { recursive: true })
        writeFileSync(file, canvas.toBuffer('image/png'))
      }
      expect(existsSync(file), `missing golden ${file}`).toBe(true)
      const golden = await loadImage(readFileSync(file))
      const reference = createCanvas(W, H)
      reference.getContext('2d').drawImage(golden, 0, 0)
      const expected = reference.getContext('2d').getImageData(0, 0, W, H).data
      const actual = canvas.getContext('2d').getImageData(0, 0, W, H).data
      let differing = 0
      for (let i = 0; i < actual.length; i++) if (actual[i] !== expected[i]) differing++
      expect(differing).toBe(0)
    })
  }
})
