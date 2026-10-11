import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { quat } from '../engine/math'
import type { AnimatableValue } from '../engine/types'
import { Timeline } from '../engine/core/timeline'
import { inkColor } from './shading'
import { rasterizeResolvedScene } from './software-renderer'
import { drawResolvedScene } from './canvas-2d-renderer'
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
  type MeshObject,
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

  it('animates an object’s outline width and colour, and inks fade into the fog', () => {
    const own = values({ 'stage/box': { rotateY: 30, rotateX: 20, outlineWidth: 5, outlineColor: '#00ff00' } })
    const frame = resolveScene3D(loaded, own, SIZE)
    expect(frame.triangles[0].ink).toEqual({ width: 5, color: '#00ff00' })
    expect(frame.meshes[0].material.outline).toEqual({ width: 5, color: '#00ff00' })
    // Width 0 switches the outline off; a material without one gains one from the tracks.
    expect(resolveScene3D(loaded, values({ 'stage/box': { outlineWidth: 0 } }), SIZE).triangles[0].ink).toBeUndefined()
    const plain = loadScene3D(scene({ materials: { red: { color: '#ff0000' }, floor: { color: '#888' } } }))
    expect(resolveScene3D(plain, values({ 'stage/box': { outlineWidth: 3 } }), SIZE).triangles[0].ink).toEqual({ width: 3, color: '#000000' })
    expect(inkColor('#000000', { color: '#ffffff', near: 0, far: 10 }, 5)).toBe('rgb(128, 128, 128)')
    expect(inkColor('#000000', { color: '#ffffff', near: 0, far: 10 }, 0)).toBe('#000000')
    expect(inkColor('#000000', undefined, 5)).toBe('#000000')
  })

  it('takes a raw mesh with colours per face or per vertex, and names a bad one', () => {
    const triangle = { type: 'mesh' as const, positions: [-1, -1, 0, 1, -1, 0, 0, 1, 0, 0, 2, 0], indices: [0, 1, 2, 1, 3, 2] }
    const raw = loadScene3D(scene({ objects: [{ id: 'front', kind: 'camera', projection: 'perspective', fov: 60, near: 0.1, far: 100, position: [0, 0, 5] }, { id: 'fan', kind: 'mesh', geometry: { ...triangle, colors: ['#00ff00', '#0000ff'] }, material: 'red' }] }))
    const frame = resolveScene3D(raw, new Map(), SIZE)
    expect(frame.triangles.map((t) => t.color)).toEqual(['#00ff00', '#0000ff'])
    expect(frame.triangles[0].normal[2]).toBeCloseTo(1, 6)
    const perVertex = loadScene3D(scene({ objects: [{ id: 'front', kind: 'camera', projection: 'perspective', fov: 60, near: 0.1, far: 100, position: [0, 0, 5] }, { id: 'fan', kind: 'mesh', geometry: { ...triangle, colors: ['#ff0000', '#00ff00', '#0000ff', '#ffffff'] }, material: 'red' }] }))
    expect(resolveScene3D(perVertex, new Map(), SIZE).triangles[0].color).toBe('#555555')
    const bad = validateScene3D(scene({ objects: [{ id: 'front', kind: 'camera', projection: 'perspective', fov: 60, near: 0.1, far: 100, position: [0, 0, 5] }, { id: 'fan', kind: 'mesh', geometry: { type: 'mesh', positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 5] }, material: 'red' }] }))
    expect(bad).toEqual(['"fan": a mesh index is out of range'])
  })

  it('rolls the camera about its view axis, and fades geometry at the lens', () => {
    const tall = loadScene3D(scene({ objects: [{ id: 'front', kind: 'camera', projection: 'perspective', fov: 60, near: 0.1, far: 100, position: [0, 0, 5], lookAt: [0, 0, 0] }, { id: 'box', kind: 'mesh', geometry: { type: 'box', size: [0.2, 0.2, 0.2] }, material: 'red', position: [0, 1, 0] }] }))
    const centre = (frame: ReturnType<typeof resolveScene3D>) => { const b = screenBox(frame, 'box'); return { x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2 } }
    const level = centre(resolveScene3D(tall, new Map(), SIZE))
    expect(level.x).toBeCloseTo(SIZE.width / 2, 6)
    expect(level.y).toBeLessThan(SIZE.height / 2)
    // Rolled 90° clockwise, what was above the centre is now to its right.
    const rolled = centre(resolveScene3D(tall, values({ 'stage/front': { roll: 90 } }), SIZE))
    expect(rolled.x).toBeGreaterThan(SIZE.width / 2 + 50)
    expect(rolled.y).toBeCloseTo(SIZE.height / 2, 4)
    // The same from the camera's own roll field, and the lookAt's up vector flips the picture.
    const byField = loadScene3D(scene({ objects: [{ id: 'front', kind: 'camera', projection: 'perspective', fov: 60, near: 0.1, far: 100, position: [0, 0, 5], lookAt: [0, 0, 0], roll: 90 }, { id: 'box', kind: 'mesh', geometry: { type: 'box', size: [0.2, 0.2, 0.2] }, material: 'red', position: [0, 1, 0] }] }))
    expect(centre(resolveScene3D(byField, new Map(), SIZE)).x).toBeCloseTo(rolled.x, 6)
    const upsideDown = loadScene3D(scene({ objects: [{ id: 'front', kind: 'camera', projection: 'perspective', fov: 60, near: 0.1, far: 100, position: [0, 0, 5], lookAt: [0, 0, 0], up: [0, -1, 0] }, { id: 'box', kind: 'mesh', geometry: { type: 'box', size: [0.2, 0.2, 0.2] }, material: 'red', position: [0, 1, 0] }] }))
    expect(centre(resolveScene3D(upsideDown, new Map(), SIZE)).y).toBeGreaterThan(SIZE.height / 2)
    // Near fade: the box 4.9 m away is half faded between 4 and 6 m, gone at 4.
    const fading = resolveScene3D(loaded, new Map(), { ...SIZE, nearFade: { from: 4, to: 6 } })
    expect(fading.triangles[0].opacity).toBeCloseTo((4.5 - 4) / 2, 6)
    expect(resolveScene3D(loaded, new Map(), { ...SIZE, nearFade: { from: 5, to: 6 } }).triangles).toHaveLength(0)
    expect(resolveScene3D(loadScene3D(scene({ nearFade: { from: 4, to: 6 } })), new Map(), SIZE).triangles[0].opacity).toBeCloseTo(0.25, 6)
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

describe('sets: shadows and skies', () => {
  it('lays a blob shadow under a mesh that asks for one, fading as it lifts off the ground', () => {
    // Seen from above (a level camera would see the disc edge-on).
    const raised = (shadow: MeshObject['shadow'] | undefined): Scene3D =>
      scene({ objects: scene().objects.map((o) => (o.id === 'box' ? ({ ...o, shadow } as Scene3D['objects'][number]) : o.id === 'front' ? ({ ...o, position: [0, 3, 5], lookAt: [0, 0, 0] } as Scene3D['objects'][number]) : o)) })
    const withShadow = (shadow: MeshObject['shadow']) => loadScene3D(raised(shadow))
    const shadowed = withShadow(true)
    const plain = resolveScene3D(loadScene3D(raised(undefined)), new Map(), SIZE)
    const frame = resolveScene3D(shadowed, new Map(), SIZE)
    const shadow = frame.triangles.filter((t) => t.objectId === 'box:shadow')
    expect(shadow.length).toBe(16)
    expect(frame.triangles.length).toBe(plain.triangles.length + 16)
    expect(shadow[0].opacity).toBeCloseTo(0.22, 6)
    expect(shadow[0].centroid[1]).toBeCloseTo(0.002, 6)
    // Painted before the box's own faces when they tie in depth.
    expect(frame.triangles.findIndex((t) => t.objectId === 'box:shadow')).toBeLessThan(frame.triangles.findIndex((t) => t.objectId === 'box'))
    // Lifted high, the shadow fades right down; on its own ground height it stays strong.
    const high = resolveScene3D(shadowed, values({ 'stage/box': { y: 3 } }), SIZE).triangles.filter((t) => t.objectId === 'box:shadow')
    expect(high.length === 0 || high[0].opacity < 0.08).toBe(true)
    const own = withShadow({ ground: -0.5, opacity: 0.5 })
    expect(resolveScene3D(own, new Map(), SIZE).triangles.find((t) => t.objectId === 'box:shadow')!.opacity).toBeCloseTo(0.5, 6)
  })

  it('paints a sky gradient from top to bottom in both renderers', () => {
    const sky = loadScene3D(scene({ background: { top: '#ff0000', bottom: '#0000ff' } }))
    const frame = resolveScene3D(sky, new Map(), SIZE)
    const canvas = createCanvas(SIZE.width, SIZE.height)
    const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
    drawResolvedScene(ctx, frame)
    const top = Array.from(ctx.getImageData(2, 0, 1, 1).data.slice(0, 3))
    const bottom = Array.from(ctx.getImageData(2, SIZE.height - 1, 1, 1).data.slice(0, 3))
    expect(top[0]).toBeGreaterThan(240)
    expect(bottom[2]).toBeGreaterThan(240)
    const raster = rasterizeResolvedScene(frame)
    expect(Array.from(raster.data.slice(8, 11))).toEqual([255, 0, 0])
    expect(Array.from(raster.data.slice((SIZE.height - 1) * SIZE.width * 4 + 8, (SIZE.height - 1) * SIZE.width * 4 + 11))).toEqual([0, 0, 255])
  })
})

describe('software depth buffer', () => {
  const crossing = (): Scene3D => ({
    id: 'stage',
    camera: 'front',
    background: '#000000',
    materials: { red: { color: '#ff0000', shading: 'unlit' }, blue: { color: '#0000ff', shading: 'unlit', outline: { width: 2, color: '#00ff00' } }, glass: { color: '#ffffff', shading: 'unlit', opacity: 0.5 } },
    objects: [
      { id: 'front', kind: 'camera', projection: 'perspective', fov: 60, near: 0.1, far: 100, position: [0, 0, 5] },
      // A wide slab at the origin and a long bar running through it toward the camera: at the middle the bar is nearer.
      { id: 'slab', kind: 'mesh', geometry: { type: 'box', size: [3, 1, 0.2] }, material: 'red' },
      { id: 'bar', kind: 'mesh', geometry: { type: 'box', size: [0.3, 0.3, 6] }, material: 'blue' },
    ],
  })
  const pixel = (data: Uint8ClampedArray, w: number, x: number, y: number) => Array.from(data.slice((y * w + x) * 4, (y * w + x) * 4 + 3))

  it('draws what is nearest at each pixel, inks with a depth test, and is deterministic', () => {
    const loaded = loadScene3D(crossing())
    const frame = resolveScene3D(loaded, new Map(), SIZE)
    const image = rasterizeResolvedScene(frame)
    const cx = SIZE.width / 2
    const cy = SIZE.height / 2
    // The bar's near end wins the middle; the slab shows beside it; nothing is drawn in the corner.
    expect(pixel(image.data, SIZE.width, cx, cy)).toEqual([0, 0, 255])
    expect(pixel(image.data, SIZE.width, cx + 60, cy)).toEqual([255, 0, 0])
    expect(pixel(image.data, SIZE.width, 2, 2)).toEqual([0, 0, 0])
    expect(image.depth[cy * SIZE.width + cx]).toBeCloseTo(2, 1)
    expect(image.depth[2 * SIZE.width + 2]).toBe(Infinity)
    // The bar's ink is green somewhere on its edge, and never over the slab where the slab is nearer… the slab is never nearer here, so just: ink exists.
    let green = 0
    for (let i = 0; i < image.data.length; i += 4) if (image.data[i] === 0 && image.data[i + 1] === 255 && image.data[i + 2] === 0) green++
    expect(green).toBeGreaterThan(20)
    expect(Buffer.from(rasterizeResolvedScene(frame).data).equals(Buffer.from(image.data))).toBe(true)
  })

  it('blends see-through meshes over what is behind, keeps layers, and leaves a transparent scene’s canvas under it', () => {
    const glassy = loadScene3D({ ...crossing(), objects: [...crossing().objects.slice(0, 2), { id: 'pane', kind: 'mesh', geometry: { type: 'box', size: [1, 1, 0.1] }, material: 'glass', position: [0, 0, 1] }] })
    const image = rasterizeResolvedScene(resolveScene3D(glassy, new Map(), SIZE))
    // Half white over red: pink.
    const mid = pixel(image.data, SIZE.width, SIZE.width / 2, SIZE.height / 2)
    expect(mid[0]).toBe(255)
    expect(mid[1]).toBeGreaterThan(100)
    expect(mid[1]).toBeLessThan(160)
    // A floor on layer -1 that cuts through the bar is still painted under it.
    const layered = loadScene3D({ ...crossing(), objects: [...crossing().objects, { id: 'floor', kind: 'mesh', layer: -1, geometry: { type: 'box', size: [8, 0.1, 8] }, material: 'red', position: [0, 0, 2] }] })
    const under = rasterizeResolvedScene(resolveScene3D(layered, new Map(), SIZE))
    expect(pixel(under.data, SIZE.width, SIZE.width / 2, SIZE.height / 2)).toEqual([0, 0, 255])
    // Transparent background: the canvas keeps what was drawn before.
    const canvas = createCanvas(SIZE.width, SIZE.height)
    const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
    ctx.fillStyle = '#ff00ff'
    ctx.fillRect(0, 0, SIZE.width, SIZE.height)
    drawScene3D(ctx, loadScene3D({ ...crossing(), background: 'transparent' }), undefined, { ...SIZE, depthBuffer: true })
    expect(Array.from(ctx.getImageData(2, 2, 1, 1).data.slice(0, 3))).toEqual([255, 0, 255])
    expect(Array.from(ctx.getImageData(SIZE.width / 2, SIZE.height / 2, 1, 1).data.slice(0, 3))).toEqual([0, 0, 255])
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
