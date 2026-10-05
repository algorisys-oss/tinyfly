import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { loadScene3D, drawScene3D, resolveScene3D, type Scene3D } from '../scene-3d'
import { humanPlan, HUMAN_REST, HUMAN_POSES, characterObjects, skeletonInView, type ViewProjection } from './index'
import type { Pose } from './rig/body-plan'
import { solveSkeleton, rotY, type Skeleton } from './rig/skeleton'

const plan = humanPlan()
const H = 300
const flat = (toView: (v: [number, number, number]) => [number, number, number]): ViewProjection => ({
  toView,
  toScreen: (v) => ({ x: v[0], y: -v[1] }),
})

function expectSame(a: Skeleton, b: Skeleton) {
  for (const id of Object.keys(a.chains)) {
    a.chains[id].points.forEach((p, i) => {
      expect(p.x, `${id}[${i}].x`).toBeCloseTo(b.chains[id].points[i].x, 9)
      expect(p.y, `${id}[${i}].y`).toBeCloseTo(b.chains[id].points[i].y, 9)
      expect(a.chains[id].depths[i]).toBeCloseTo(b.chains[id].depths[i], 9)
    })
  }
  expect(a.head.center.x).toBeCloseTo(b.head.center.x, 9)
  expect(a.head.center.y).toBeCloseTo(b.head.center.y, 9)
  expect(a.head.rx).toBeCloseTo(b.head.rx, 9)
  expect(a.head.angle).toBeCloseTo(b.head.angle, 9)
  a.head.axes.forEach((axis, k) => axis.forEach((v, j) => expect(v).toBeCloseTo(b.head.axes[k][j], 9)))
  expect(a.groundY).toBeCloseTo(b.groundY, 9)
}

const POSES: Pose[] = [
  { ...HUMAN_REST },
  { ...HUMAN_POSES.wave, turn: 0.5 },
  { ...HUMAN_POSES.crouch, turn: 1, roll: 20 },
  { ...HUMAN_POSES.cheer, turn: 2.6, lift: 0.2 },
  { ...HUMAN_POSES.kneel, turn: 3.2, roll: -35 },
]

describe('skeletonInView', () => {
  it('seen front-on through a flat camera, it is the front-on figure exactly', () => {
    for (const pose of POSES) {
      expectSame(skeletonInView(plan, pose, { height: H }, flat((v) => v)), solveSkeleton(plan, pose, { height: H }))
    }
  })

  it("a camera on the figure's left, looking back at it, sees what turn 3 shows front-on", () => {
    const fromTheSide = flat(([x, y, z]) => [-z, y, x])
    for (const pose of [HUMAN_REST, HUMAN_POSES.point]) {
      expectSame(skeletonInView(plan, { ...pose, turn: 0 }, { height: H }, fromTheSide), solveSkeleton(plan, { ...pose, turn: 3 }, { height: H }))
    }
    expect(rotY([0, 0, 1], -Math.PI / 2)[0]).toBeCloseTo(-1, 12)
  })

  it('in perspective, a figure further away is smaller', () => {
    const perspective = (distance: number): ViewProjection => ({
      toView: ([x, y, z]) => [x, y - 0.9, z - distance],
      toScreen: ([x, y, z]) => ({ x: (x / -z) * 500, y: (-y / -z) * 500 }),
    })
    const near = skeletonInView(plan, HUMAN_REST, { height: 1.7 }, perspective(4))
    const far = skeletonInView(plan, HUMAN_REST, { height: 1.7 }, perspective(8))
    expect(near.height).toBeCloseTo(2 * far.height, 1)
    expect(near.head.rx).toBeGreaterThan(far.head.rx * 1.8)
  })
})

describe('characters in 3D scenes', () => {
  const W = 320
  const SIZE = { width: W, height: 240 }
  const scene = (extra: Scene3D['objects'] = []): Scene3D => ({
    id: 'stage',
    camera: 'cam',
    background: '#ffffff',
    materials: { red: { color: '#ff0000', shading: 'unlit' } },
    objects: [
      { id: 'cam', kind: 'camera', projection: 'perspective', fov: 40, near: 0.1, far: 50, position: [0, 1, 5], lookAt: [0, 0.9, 0] },
      { id: 'tum', kind: 'character', character: { look: 'clean', skin: '#f2c49b' } },
      ...extra,
    ],
  })

  it('needs the character kind, and says so', () => {
    expect(() => loadScene3D(scene())).toThrow(/kinds: \[characterObjects\]/)
    expect(() => loadScene3D(scene(), { kinds: [characterObjects] })).not.toThrow()
    expect(() => loadScene3D({ ...scene(), objects: [...scene().objects.slice(0, 1), { id: 'tum', kind: 'character', height: -1 }] }, { kinds: [characterObjects] })).toThrow(/height must be positive/)
  })

  const pixels = (json: Scene3D, values: Record<string, Record<string, number>> = {}) => {
    const ctx = createCanvas(SIZE.width, SIZE.height).getContext('2d') as unknown as CanvasRenderingContext2D
    const animated = new Map(Object.entries(values).map(([t, props]) => [t, new Map(Object.entries(props))]))
    drawScene3D(ctx, loadScene3D(json, { kinds: [characterObjects] }), animated, SIZE)
    return ctx.getImageData(0, 0, SIZE.width, SIZE.height).data
  }
  const differ = (a: Uint8ClampedArray, b: Uint8ClampedArray) => a.some((v, i) => v !== b[i])

  it('draws the character, posed by tracks on its object, deterministically', () => {
    const still = pixels(scene())
    expect(differ(still, pixels(scene()))).toBe(false)
    expect(still.some((v, i) => i % 4 === 0 && v < 100)).toBe(true) // ink was drawn
    expect(differ(still, pixels(scene(), { 'stage/tum': { 'arm.right.spread': 150 } }))).toBe(true)
    expect(differ(still, pixels(scene(), { 'stage/tum': { x: 0.5 } }))).toBe(true)
  })

  it('takes its place in the depth order: behind a box it is covered, in front it covers', () => {
    const frame = (z: number) => resolveScene3D(loadScene3D(scene([{ id: 'box', kind: 'mesh', geometry: { type: 'box', size: [1, 1, 1] }, material: 'red', position: [0, 0.5, z] }]), { kinds: [characterObjects] }), new Map(), SIZE)
    // The figure is its nearest drawable (its shadow lies behind it, on the ground).
    const figure = (f: ReturnType<typeof frame>) => f.drawables[f.drawables.length - 1]
    const behindBox = frame(1)
    expect(figure(behindBox).depth).toBeGreaterThan(behindBox.triangles[behindBox.triangles.length - 1].depth)
    const inFront = frame(-1)
    expect(figure(inFront).depth).toBeLessThan(inFront.triangles[0].depth)
  })

  it('draws nothing for a character behind the camera', () => {
    const behind = loadScene3D(scene().objects ? { ...scene(), objects: [scene().objects[0], { id: 'tum', kind: 'character', position: [0, 0, 8] }] } : scene(), { kinds: [characterObjects] })
    expect(resolveScene3D(behind, new Map(), SIZE).drawables).toHaveLength(0)
  })

  it('the solid look is real 3D: shaded, outlined triangles in the scene, sorted with its meshes', () => {
    const solid = loadScene3D(
      { ...scene(), objects: [scene().objects[0], { id: 'didi', kind: 'character', look: 'solid', solid: { color: '#7c3aed' } }] },
      { kinds: [characterObjects] }
    )
    const frame = resolveScene3D(solid, new Map(), SIZE)
    const mine = frame.triangles.filter((t) => t.objectId === 'didi')
    expect(mine.length).toBeGreaterThan(100)
    expect(mine.some((t) => t.material.color === '#7c3aed')).toBe(true)
    expect(mine.some((t) => t.outline.length > 0)).toBe(true)
    // Only its shadow is drawn whole; the body is triangles.
    expect(frame.drawables).toHaveLength(1)
    // It stands on the ground: its lowest point is at y = 0 in the world.
    const raised = resolveScene3D(solid, new Map([['stage/didi', new Map([['lift', 0.5]])]]), SIZE)
    const lowest = (f: typeof frame) => Math.max(...f.triangles.filter((t) => t.objectId === 'didi').flatMap((t) => t.screen.map((p) => p.y)))
    expect(lowest(raised)).toBeLessThan(lowest(frame))
  })
})

