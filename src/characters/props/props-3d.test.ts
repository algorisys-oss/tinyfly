import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { loadScene3D, drawScene3D, resolveScene3D, type Scene3D } from '../../scene-3d'
import { propObjects } from './scene-objects'
import { propPartMaterial, propPartMesh } from './mesh-3d'
import { propShapeMesh } from './rig'
import { characterObjects } from '../scene-objects'
import { cutMesh, gridCuts } from './slice'
import { boxMesh } from './shapes'
import { clipPolygon, clipPolyline } from './clip'
import { propPreset } from './presets'
import { solveProp } from './rig'

describe('props in 3D scenes', () => {
  const SIZE = { width: 320, height: 240 }
  const scene = (objects: Scene3D['objects'] = [{ id: 'car', kind: 'prop', prop: 'car' }]): Scene3D => ({
    id: 'stage',
    camera: 'cam',
    background: '#ffffff',
    objects: [{ id: 'cam', kind: 'camera', projection: 'perspective', fov: 40, near: 0.1, far: 50, position: [3, 1.5, 6], lookAt: [0, 0.6, 0] }, ...objects],
  })

  it('names a preset, and says which one was meant when the name is wrong', () => {
    expect(() => loadScene3D(scene())).toThrow(/load the scene with that kind/)
    expect(() => loadScene3D(scene(), { kinds: [propObjects] })).not.toThrow()
    expect(() => loadScene3D(scene([{ id: 'c', kind: 'prop', prop: 'chiken' }]), { kinds: [propObjects] })).toThrow(/"c": Unknown prop preset "chiken": did you mean "chicken"\?/)
    expect(() => propPreset('hors')).toThrow(/did you mean "horse"/)
    expect(() => loadScene3D(scene([{ id: 'c', kind: 'prop', prop: 'car', rotateY: 90 } as never]), { kinds: [propObjects] })).toThrow(/rotateY is a track, not a field: place it turned with rotation: \[0, 90, 0\]/)
  })

  const pixels = (json: Scene3D, values: Record<string, Record<string, number>> = {}) => {
    const ctx = createCanvas(SIZE.width, SIZE.height).getContext('2d') as unknown as CanvasRenderingContext2D
    const animated = new Map(Object.entries(values).map(([t, props]) => [t, new Map(Object.entries(props))]))
    drawScene3D(ctx, loadScene3D(json, { kinds: [propObjects] }), animated, SIZE)
    return ctx.getImageData(0, 0, SIZE.width, SIZE.height).data
  }
  const differ = (a: Uint8ClampedArray, b: Uint8ClampedArray) => a.some((v, i) => v !== b[i])

  it('draws the prop, its controls moved by tracks on its object, deterministically', () => {
    const still = pixels(scene())
    expect(differ(still, pixels(scene()))).toBe(false)
    expect(still.some((v, i) => i % 4 === 0 && v < 100)).toBe(true)
    expect(differ(still, pixels(scene(), { 'stage/car': { door: 1 } }))).toBe(true)
    expect(differ(pixels(scene([{ id: 'car', kind: 'prop', prop: 'car', values: { door: 1 } }])), pixels(scene(), { 'stage/car': { door: 1 } }))).toBe(false)
  })

  it('is seen in perspective: further away is smaller, and a face turned from the eye is left out', () => {
    const frame = (z: number) => resolveScene3D(loadScene3D(scene([{ id: 'car', kind: 'prop', prop: 'car', position: [0, 0, z] }]), { kinds: [propObjects] }), new Map(), SIZE)
    const near = frame(0).drawables
    const far = frame(-6).drawables
    expect(near[0].depth).toBeLessThan(far[0].depth)
    // Up close, a box's face square-on to the view direction but off to one side shows in perspective, not in a flat view.
    const prop = propPreset('house')
    const flat = { toView: (v: [number, number, number]) => v, toScreen: (v: [number, number, number]) => ({ x: v[0], y: -v[1] }) }
    const offToTheRight = { toView: (v: [number, number, number]): [number, number, number] => [v[0] - 6, v[1] - 1, v[2] - 3], toScreen: (v: [number, number, number]) => ({ x: v[0] / -v[2], y: v[1] / v[2] }) }
    const faces = (solved: ReturnType<typeof solveProp>) => [...solved.under, ...solved.over].reduce((n, p) => n + p.faces.length, 0)
    expect(faces(solveProp(prop.rig, {}, offToTheRight, 100, { perspective: true }))).not.toBe(faces(solveProp(prop.rig, {}, flat, 100)))
  })

  it('draws nothing for a prop behind the camera', () => {
    const behind = loadScene3D(scene([{ id: 'car', kind: 'prop', prop: 'car', position: [6, 0, 14] }]), { kinds: [propObjects] })
    expect(resolveScene3D(behind, new Map(), SIZE).drawables).toHaveLength(0)
  })

  it('sorts each piece at its own depth: a bus hides a figure behind its front end, not one beside its back', () => {
    const at = (objects: Scene3D['objects']) => {
      const ctx = createCanvas(SIZE.width, SIZE.height).getContext('2d') as unknown as CanvasRenderingContext2D
      drawScene3D(ctx, loadScene3D({ ...scene(objects), objects: [{ id: 'cam', kind: 'camera', projection: 'perspective', fov: 50, near: 0.1, far: 60, position: [11, 1.6, 4], lookAt: [0, 1, 0] }, ...objects] }, { kinds: [propObjects, characterObjects] }), undefined, SIZE)
      return ctx.getImageData(0, 0, SIZE.width, SIZE.height).data
    }
    const changed = (a: Uint8ClampedArray, b: Uint8ClampedArray) => a.reduce((n, v, i) => n + (i % 4 === 0 && v !== b[i] ? 1 : 0), 0)
    const bus = { id: 'bus', kind: 'prop' as const, prop: 'bus', rotation: [0, 90, 0] as [number, number, number] }
    const figure = (position: [number, number, number]) => ({ id: 'tum', kind: 'character' as const, position })
    const empty = at([])
    const busOnly = at([bus])
    // Behind the bus's front end, as the camera sees it: mostly hidden (its feet show under the chassis).
    const behind: [number, number, number] = [2.5, 0, -2.4]
    expect(changed(busOnly, at([bus, figure(behind)]))).toBeLessThan(changed(empty, at([figure(behind)])) * 0.4)
    // Beside its back, on the camera's side: all of it shows.
    const beside: [number, number, number] = [-3, 0, 2.2]
    expect(changed(busOnly, at([bus, figure(beside)]))).toBeGreaterThan(changed(empty, at([figure(beside)])) * 0.9)
  })

  it('cuts a big shape into columns that cover it exactly, joined so the cuts draw no outline', () => {
    const box = boxMesh([4, 1, 2.2])
    expect(gridCuts(-2, 2, 1)).toEqual([-2, -1, 0, 1, 2])
    expect(gridCuts(-0.5, 0.5, 1)).toEqual([-0.5, 0.5])
    const pieces = cutMesh(box, gridCuts(-2, 2, 1), gridCuts(-1.1, 1.1, 1))
    expect(pieces).toHaveLength(8) // 4 along its length, 2 across
    expect(pieces.every((piece) => piece.mesh.walls?.x.length === 3 && piece.mesh.walls.z.length === 1)).toBe(true)
    const area = (points: number[][]) => {
      // A planar polygon's area: half the length of the sum of its edge cross products.
      const sum = [0, 0, 0]
      points.forEach((a, i) => {
        const b = points[(i + 1) % points.length]
        sum[0] += a[1] * b[2] - a[2] * b[1]
        sum[1] += a[2] * b[0] - a[0] * b[2]
        sum[2] += a[0] * b[1] - a[1] * b[0]
      })
      return Math.hypot(...sum) / 2
    }
    const total = (meshes: Array<typeof box>) => meshes.reduce((n, m) => n + m.faces.reduce((k, f) => k + area(f.corners.map((c) => m.vertices[c])), 0), 0)
    expect(total(pieces.map((piece) => piece.mesh))).toBeCloseTo(total([box]), 9)
  })

  it('leaves out faces no one can see, and keeps those lying on a part', () => {
    const view = { toView: (v: [number, number, number]): [number, number, number] => [v[0] * 0.8 - v[2] * 0.6, v[1] - 6, -v[0] * 0.6 - v[2] * 0.8 - 14], toScreen: (v: [number, number, number]) => ({ x: (v[0] / -v[2]) * 400, y: (-v[1] / -v[2]) * 400 }) }
    const seen = (prop: ReturnType<typeof propPreset>, id: string, values: Record<string, number> = {}) =>
      solveProp(prop.rig, values, view, 50, { perspective: true, near: 0.1, slice: 1 }).cells!.flatMap((cell) => cell.parts).filter((p) => p.part.id === id).flatMap((p) => p.faces)
    // A house's wall tops lie against its roof's underside: never drawn. Its walls' sides are.
    const house = propPreset('house')
    expect(seen(house, 'walls').some((face) => face.normal![1] > 0.9)).toBe(false)
    expect(seen(house, 'walls').length).toBeGreaterThan(0)
    // A car's door lies on its side, facing the same way: drawn. Its tread is inside the fender: the top is not.
    const car = propPreset('car')
    expect(seen(car, 'door-left').length + seen(car, 'door-right').length).toBeGreaterThan(0)
    // Pieces cut from one shape keep their own outlines, and none along the cuts.
    const body = solveProp(car.rig, {}, view, 50, { perspective: true, near: 0.1, slice: 1 }).cells!.flatMap((cell) => cell.parts).filter((p) => p.part.id === 'body')
    expect(body.length).toBeGreaterThan(2)
    expect(body.every((p) => p.cut)).toBe(true)
    expect(body.some((p) => p.faces.some((face) => (face.edges ?? []).length > 0))).toBe(true)
  })

  it('clips at the near plane: what is behind the eye is cut away', () => {
    expect(clipPolygon([[0, 0, -2], [1, 0, -2], [1, 0, 1], [0, 0, 1]], 0.5).every((p) => p[2] <= -0.5)).toBe(true)
    expect(clipPolygon([[0, 0, 1], [1, 0, 1], [0, 1, 1]], 0.5)).toEqual([])
    expect(clipPolyline([[0, 0, -2], [0, 0, 2], [1, 0, -2]], 0.5)).toEqual([[[0, 0, -2], [0, 0, -0.5]], [[0.625, 0, -0.5], [1, 0, -2]]])
    // A camera inside a house still draws it, without anything turned inside out behind the eye.
    const inside = resolveScene3D(loadScene3D({ ...scene([{ id: 'home', kind: 'prop', prop: 'house' }]), objects: [{ id: 'cam', kind: 'camera', projection: 'perspective', fov: 60, near: 0.1, far: 30, position: [0, 1.2, 0.5], lookAt: [0, 1.2, -3] }, { id: 'home', kind: 'prop', prop: 'house', position: [0, 0, 0] }] }, { kinds: [propObjects] }), new Map(), SIZE)
    expect(inside.drawables.length).toBeGreaterThan(0)
  })

  it('is lit by the scene’s lights as its meshes are, its windows glowing over the top', () => {
    const lights = (color: string, intensity: number) => [
      { id: 'sun', kind: 'light' as const, light: 'directional' as const, color, intensity, position: [4, 8, 5] as [number, number, number] },
      { id: 'sky', kind: 'light' as const, light: 'ambient' as const, color, intensity: intensity * 0.5 },
    ]
    const at = (extra: Scene3D['objects'], house: Record<string, unknown> = {}) => {
      const ctx = createCanvas(SIZE.width, SIZE.height).getContext('2d') as unknown as CanvasRenderingContext2D
      const json: Scene3D = { ...scene(), objects: [scene().objects[0], ...extra, { id: 'home', kind: 'prop', prop: 'house', position: [0, 0, -2], ...house }] }
      drawScene3D(ctx, loadScene3D(json, { kinds: [propObjects] }), undefined, SIZE)
      return ctx.getImageData(0, 0, SIZE.width, SIZE.height).data
    }
    const brightness = (data: Uint8ClampedArray) => {
      let sum = 0
      let count = 0
      for (let i = 0; i < data.length; i += 4) if (data[i] + data[i + 1] + data[i + 2] < 740) { sum += data[i] + data[i + 1] + data[i + 2]; count++ }
      return sum / Math.max(1, count)
    }
    const unlit = at([])
    const day = at(lights('#ffffff', 0.9))
    const night = at(lights('#7080c0', 0.3))
    expect(unlit.some((v, i) => v !== day[i])).toBe(true)
    expect(brightness(night)).toBeLessThan(brightness(day) * 0.7)
    // At night, lit windows glow full yellow: brighter than the same windows unlit.
    const glowing = at(lights('#7080c0', 0.3), { values: { lights: 1 } })
    let yellow = 0
    for (let i = 0; i < glowing.length; i += 4) if (glowing[i] > 220 && glowing[i + 1] > 180 && glowing[i + 2] < 160) yellow++
    expect(yellow).toBeGreaterThan(20)
  })

  it('the mesh look builds it of the scene’s own meshes: lit, glass see-through, glow its own light, hidden faces left out', () => {
    const resolve = (values: Record<string, number> = {}) =>
      resolveScene3D(loadScene3D(scene([{ id: 'car', kind: 'prop', prop: 'car', look: 'mesh', values }]), { kinds: [propObjects] }), new Map(), SIZE)
    const frame = resolve()
    const mine = frame.triangles.filter((t) => t.objectId === 'car')
    expect(mine.length).toBeGreaterThan(200)
    // Nothing drawn whole: its shadow is a mesh too.
    expect(frame.drawables).toHaveLength(0)
    expect(mine.some((t) => t.material.color === '#000000' && (t.material.opacity ?? 1) < 0.2)).toBe(true)
    // Glass is see-through; a smooth part shows no creases.
    expect(mine.some((t) => t.material.color === '#bfe3f2' && (t.material.opacity ?? 1) < 0.5)).toBe(true)
    const prop = propPreset('car')
    const antenna = prop.rig.parts.find((p) => p.id === 'antenna')!
    expect(propPartMaterial(antenna, { glow: 0, opacity: 1 }).creases).toBe(false)
    // Lit headlights glow with their own light.
    expect(resolve({ lights: 1 }).triangles.some((t) => t.objectId === 'car' && t.material.emissive)).toBe(true)
    // A tyre's tread inside the fender is left out: fewer triangles than the shape has.
    const wheel = prop.rig.parts.find((p) => p.id.startsWith('wheel-0'))!
    const whole = propPartMesh(wheel.shape).indices.length
    const hidden = propPartMesh(wheel.shape, propShapeMesh(wheel.shape).faces.map((_, i) => i < 3))
    expect(hidden.indices.length).toBeLessThan(whole)
  })
})

