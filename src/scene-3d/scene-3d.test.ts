import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { quat } from '../engine/math'
import type { AnimatableValue } from '../engine/types'
import { Timeline } from '../engine/core/timeline'
import {
  drawScene3D,
  loadScene3D,
  orbitPosition,
  dollyPosition,
  resolveScene3D,
  shadeTriangle,
  validateScene3D,
  Scene3DAdapter,
  Canvas2DRenderer,
  type Scene3D,
} from './index'

const SIZE = { width: 400, height: 300 }

function scene(extra: Partial<Scene3D> = {}): Scene3D {
  return {
    id: 'stage',
    camera: 'front',
    materials: { red: { color: '#ff0000', shading: 'flat', outline: { width: 2, color: '#000000' } }, floor: { color: '#888888', shading: 'unlit' } },
    objects: [
      { id: 'front', kind: 'camera', projection: 'perspective', fov: 60, near: 0.1, far: 100, position: [0, 0, 5] },
      { id: 'side', kind: 'camera', projection: 'orthographic', height: 4, near: 0.1, far: 100, position: [5, 0, 0], lookAt: [0, 0, 0] },
      { id: 'box', kind: 'mesh', geometry: { type: 'box', size: [1, 1, 1] }, material: 'red' },
    ],
    ...extra,
  }
}

const values = (entries: Record<string, Record<string, AnimatableValue>>) =>
  new Map(Object.entries(entries).map(([target, props]) => [target, new Map(Object.entries(props))]))

/** The screen box of everything drawn for one object. */
function screenBox(frame: ReturnType<typeof resolveScene3D>, objectId: string) {
  const points = frame.triangles.filter((t) => t.objectId === objectId).flatMap((t) => t.screen)
  return {
    left: Math.min(...points.map((p) => p.x)),
    right: Math.max(...points.map((p) => p.x)),
    top: Math.min(...points.map((p) => p.y)),
    bottom: Math.max(...points.map((p) => p.y)),
  }
}

describe('validateScene3D', () => {
  it('accepts a good scene', () => {
    expect(validateScene3D(scene())).toEqual([])
  })

  it('names every problem in plain words', () => {
    const bad: Scene3D = {
      id: 'stage',
      camera: 'box',
      materials: {},
      objects: [
        { id: 'box', kind: 'mesh', geometry: { type: 'box', size: [1, 0, 1] }, material: 'missing', parent: 'later' },
        { id: 'box', kind: 'camera', projection: 'perspective', fov: 200, near: 1, far: 0.5 },
      ],
    }
    const errors = validateScene3D(bad)
    expect(errors.join('\n')).toMatch(/must be an earlier object/)
    expect(errors.join('\n')).toMatch(/material "missing"/)
    expect(errors.join('\n')).toMatch(/sizes must be positive/)
    expect(errors.join('\n')).toMatch(/share the id "box"/)
    expect(errors.join('\n')).toMatch(/fov/)
    expect(errors.join('\n')).toMatch(/near must be above 0/)
    expect(() => loadScene3D(bad)).toThrow(/is not valid/)
  })

  it('refuses a channel animated two ways, and tracks for missing objects', () => {
    const errors = validateScene3D(scene(), [
      { target: 'stage/box', property: 'x' },
      { target: 'stage/box', property: 'position' },
      { target: 'stage/box', property: 'rotateY' },
      { target: 'stage/box', property: 'quaternion' },
      { target: 'stage/ghost', property: 'x' },
    ])
    expect(errors).toHaveLength(3)
  })
})

describe('resolveScene3D', () => {
  const loaded = loadScene3D(scene())

  it('looks down -z from the camera: a unit box 5 m away fills the right share of the view', () => {
    const frame = resolveScene3D(loaded, new Map(), SIZE)
    const box = screenBox(frame, 'box')
    // The front face is 4.5 m away; with a 60° vertical view, 1 m there is 300 / (2·4.5·tan 30°) px.
    const px = SIZE.height / (2 * 4.5 * Math.tan(Math.PI / 6))
    expect(box.right - box.left).toBeCloseTo(px, 6)
    expect((box.left + box.right) / 2).toBeCloseTo(SIZE.width / 2, 6)
    expect((box.top + box.bottom) / 2).toBeCloseTo(SIZE.height / 2, 6)
  })

  it('culls back faces: a box seen face-on shows one face (two triangles)', () => {
    const frame = resolveScene3D(loaded, new Map(), SIZE)
    expect(frame.triangles.filter((t) => t.objectId === 'box')).toHaveLength(2)
  })

  it('animates position, rotation and scale from tracks addressed <scene>/<object>', () => {
    const moved = screenBox(resolveScene3D(loaded, values({ 'stage/box': { x: 1 } }), SIZE), 'box')
    const still = screenBox(resolveScene3D(loaded, new Map(), SIZE), 'box')
    expect(moved.left).toBeGreaterThan(still.left)
    const turned = resolveScene3D(loaded, values({ 'stage/box': { rotateY: 45 } }), SIZE)
    expect(turned.triangles.filter((t) => t.objectId === 'box')).toHaveLength(4) // two faces now
    const viaQuat = resolveScene3D(loaded, values({ 'stage/box': { quaternion: quat.fromAxisAngle([0, 1, 0], 45) } }), SIZE)
    expect(screenBox(viaQuat, 'box').left).toBeCloseTo(screenBox(turned, 'box').left, 9)
    const big = screenBox(resolveScene3D(loaded, values({ 'stage/box': { scale: 2 } }), SIZE), 'box')
    expect(big.right - big.left).toBeGreaterThan(2 * (still.right - still.left) * 0.9)
  })

  it('cuts to another camera with an activeCamera track on the scene', () => {
    const frame = resolveScene3D(loaded, values({ stage: { activeCamera: 'side' } }), SIZE)
    expect(frame.camera.id).toBe('side')
    expect(frame.camera.orthographic).toBe(true)
    // Orthographic 4 m tall: the 1 m box is a quarter of the height, whatever the distance.
    const box = screenBox(frame, 'box')
    expect(box.bottom - box.top).toBeCloseTo(SIZE.height / 4, 6)
    // An unknown camera id keeps the scene's camera.
    expect(resolveScene3D(loaded, values({ stage: { activeCamera: 'nope' } }), SIZE).camera.id).toBe('front')
  })

  it('hides objects with visible 0, and their children with them', () => {
    const withChild = loadScene3D(scene({
      objects: [...scene().objects, { id: 'kid', kind: 'mesh', geometry: { type: 'sphere', radius: 0.2 }, material: 'red', parent: 'box', position: [0, 1, 0] }],
    }))
    const frame = resolveScene3D(withChild, values({ 'stage/box': { visible: 0 } }), SIZE)
    expect(frame.triangles).toHaveLength(0)
  })

  it('children move with their parent', () => {
    const withChild = loadScene3D(scene({
      objects: [...scene().objects, { id: 'kid', kind: 'mesh', geometry: { type: 'sphere', radius: 0.2 }, material: 'red', parent: 'box', position: [0, 1, 0] }],
    }))
    const kidWorld = resolveScene3D(withChild, values({ 'stage/box': { x: 2 } }), SIZE).worlds.get('kid')!
    expect([kidWorld[12], kidWorld[13], kidWorld[14]]).toEqual([2, 1, 0])
  })

  it('clips at the near plane instead of drawing what is behind the camera', () => {
    const floor = loadScene3D(scene({
      objects: [...scene().objects, { id: 'floor', kind: 'mesh', geometry: { type: 'plane', size: [40, 40] }, material: 'floor', position: [0, -1, 0] }],
    }))
    const frame = resolveScene3D(floor, new Map(), SIZE)
    const ys = frame.triangles.filter((t) => t.objectId === 'floor').flatMap((t) => t.screen.map((p) => p.y))
    expect(ys.every(Number.isFinite)).toBe(true)
    expect(Math.min(...ys)).toBeGreaterThan(SIZE.height / 2) // the floor stays below the horizon
  })

  it('draws far to near, in a total order that never changes, and by layer first', () => {
    const many = loadScene3D(scene({
      objects: [
        scene().objects[0],
        { id: 'near', kind: 'mesh', geometry: { type: 'box', size: [1, 1, 1] }, material: 'red', position: [0, 0, 2] },
        { id: 'far', kind: 'mesh', geometry: { type: 'box', size: [1, 1, 1] }, material: 'red', position: [0, 0, -2] },
        { id: 'ground', kind: 'mesh', geometry: { type: 'plane', size: [10, 10] }, material: 'floor', position: [0, -0.5, 4], layer: -1 },
      ],
    }))
    const frame = resolveScene3D(many, new Map(), SIZE)
    const order = frame.triangles.map((t) => t.objectId)
    expect(order[0]).toBe('ground')
    expect(order.lastIndexOf('far')).toBeLessThan(order.indexOf('near'))
    const again = resolveScene3D(many, new Map(), SIZE).triangles.map((t) => `${t.objectId}:${t.face}`)
    expect(again).toEqual(frame.triangles.map((t) => `${t.objectId}:${t.face}`))
  })

  it('inks silhouettes and creases: a box seen at an angle has its outline', () => {
    const frame = resolveScene3D(loaded, values({ 'stage/box': { rotateY: 30, rotateX: 20 } }), SIZE)
    const edges = frame.triangles.flatMap((t) => t.outline)
    // Three faces show: 6 silhouette edges plus 3 creases where they meet.
    expect(edges).toHaveLength(9)
  })
})

describe('camera helpers', () => {
  it('orbits around a target and dollies toward it', () => {
    const p = orbitPosition([0, 0, 0], 90, 0, 5)
    expect(p[0]).toBeCloseTo(5, 9)
    expect(p[2]).toBeCloseTo(0, 9)
    expect(orbitPosition([0, 0, 0], 0, 90, 2)[1]).toBeCloseTo(2, 9)
    expect(dollyPosition([0, 0, 10], [0, 0, 0], 4)).toEqual([0, 0, 6])
    expect(dollyPosition([0, 0, 10], [0, 0, 0], 40)[2]).toBeGreaterThan(0)
  })
})

describe('shading', () => {
  const frameWith = (extra: Partial<Scene3D>) => resolveScene3D(loadScene3D(scene(extra)), new Map(), SIZE)

  it('lights a face by how squarely it faces the light', () => {
    const lit = frameWith({ objects: [...scene().objects, { id: 'lamp', kind: 'light', light: 'directional', color: '#ffffff', intensity: 1, position: [0, 0, 10] }] })
    const face = lit.triangles[0]
    expect(shadeTriangle(face, lit.lights, lit.camera).color).toBe('rgb(255, 0, 0)')
    const dark = frameWith({ objects: [...scene().objects, { id: 'lamp', kind: 'light', light: 'directional', color: '#ffffff', intensity: 1, position: [0, 0, -10] }] })
    expect(shadeTriangle(dark.triangles[0], dark.lights, dark.camera).color).toBe('rgb(0, 0, 0)')
  })

  it('a scene with no lights gets a soft default, and unlit ignores light', () => {
    const frame = frameWith({})
    const shaded = shadeTriangle(frame.triangles[0], frame.lights, frame.camera).color
    expect(shaded).not.toBe('rgb(255, 0, 0)')
    expect(shaded).not.toBe('rgb(0, 0, 0)')
    const unlit = { ...frame.triangles[0], material: { color: '#ff0000', shading: 'unlit' as const } }
    expect(shadeTriangle(unlit, frame.lights, frame.camera).color).toBe('rgb(255, 0, 0)')
  })

  it('toon light comes in bands; fog fades toward its colour with distance', () => {
    const frame = frameWith({ objects: [...scene().objects, { id: 'lamp', kind: 'light', light: 'directional', color: '#ffffff', intensity: 1, position: [3, 1, 4] }] })
    const toon = { ...frame.triangles[0], material: { color: '#ffffff', shading: 'toon' as const, bands: 2 } }
    expect(['rgb(255, 255, 255)', 'rgb(128, 128, 128)']).toContain(shadeTriangle(toon, frame.lights, frame.camera).color)
    const fogged = shadeTriangle(frame.triangles[0], frame.lights, frame.camera, { color: '#0000ff', near: 0, far: 1 })
    expect(fogged.color).toBe('rgb(0, 0, 255)')
  })

  it('emissive light shines in the dark, added after lighting', () => {
    const dark = frameWith({ objects: [...scene().objects, { id: 'lamp', kind: 'light', light: 'directional', color: '#ffffff', intensity: 1, position: [0, 0, -10] }] })
    const glowing = { ...dark.triangles[0], material: { color: '#ff0000', emissive: '#00ffff' } }
    expect(shadeTriangle(glowing, dark.lights, dark.camera).color).toBe('rgb(0, 255, 255)')
  })
})

describe('rendering', () => {
  it('draws the same pixels every time (deterministic), on its own or from a timeline', () => {
    const loaded = loadScene3D(scene({ background: '#102030' }))
    const timeline = new Timeline({
      id: 'spin',
      tracks: [{ id: 'turn', target: 'stage/box', property: 'rotateY', keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 90 }] }],
    })
    const render = () => {
      const ctx = createCanvas(SIZE.width, SIZE.height).getContext('2d') as unknown as CanvasRenderingContext2D
      drawScene3D(ctx, loaded, timeline.getStateAtTime(400).values, SIZE)
      return ctx.getImageData(0, 0, SIZE.width, SIZE.height).data
    }
    const a = render()
    const b = render()
    expect(a.every((v, i) => v === b[i])).toBe(true)
    // Something red was drawn in the middle.
    const mid = (SIZE.height / 2) * SIZE.width * 4 + (SIZE.width / 2) * 4
    expect(a[mid]).toBeGreaterThan(a[mid + 2])
  })

  it('the adapter plays a scene from a timeline state', () => {
    const ctx = createCanvas(SIZE.width, SIZE.height).getContext('2d') as unknown as CanvasRenderingContext2D
    const adapter = new Scene3DAdapter(new Canvas2DRenderer(ctx), SIZE)
    adapter.registerScene(loadScene3D(scene({ background: '#000000' })))
    adapter.applyState({ values: values({ 'stage/box': { x: 3 } }) })
    adapter.render()
    const centre = ctx.getImageData(SIZE.width / 2, SIZE.height / 2, 1, 1).data
    expect(centre[0]).toBe(0) // the box moved away from the centre
  })
})
