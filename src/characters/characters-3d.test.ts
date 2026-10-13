import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { loadScene3D, drawScene3D, resolveScene3D, type Scene3D } from '../scene-3d'
import { humanPlan, HUMAN_REST, HUMAN_POSES, characterObjects, skeletonInView, type ViewProjection, type Character } from './index'
import type { Pose } from './rig/body-plan'
import { solveSkeleton, rotY, type Skeleton } from './rig/skeleton'
import { character, characterJointsInView, characterPartsInView, mirrorHumanPose, humanPose, SOFT_CARTOON_CAST, type CharacterOptions } from './index'
import { mat4 } from '../engine/math'

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

  it.each(['youngMan', 'youngWoman', 'childBoy', 'childGirl'] as const)('keeps %s rear scalp covered when scene parts sort independently', name => {
    const size = { width: 500, height: 450 }
    for (const yaw of [0, 45, 75, 145, 180, 225, 270, 315]) for (const nod of [-20, 0, 30]) for (const headTurn of [-30, 0, 30]) {
      const angle = yaw * Math.PI / 180
      const options: CharacterOptions = { ...SOFT_CARTOON_CAST[name], hair: { style: name === 'youngWoman' || name === 'childGirl' ? 'flowingBob' : 'softSweep', color: '#804020' }, body: { shading: { mode: 'none' } }, outfit: null }
      const pose = humanPose({ turn: yaw / 90 + 2, lean: 22, 'head.nod': nod, 'head.turn': headTurn })
      const json: Scene3D = { ...scene(), objects: [
        { id: 'cam', kind: 'camera', projection: 'perspective', fov: 40, near: .1, far: 50, position: [Math.sin(angle) * 4, 2.4, Math.cos(angle) * 4], lookAt: [0, .95, 0] },
        { id: 'actor', kind: 'character', height: 1.7, character: { ...options }, pose, shadow: false },
      ] }
      const loaded = loadScene3D(json, { kinds: [characterObjects] }), frame = resolveScene3D(loaded, new Map(), size)
      const projection: ViewProjection = { toView: v => mat4.transformPoint(frame.camera.view, v), toScreen: v => {
        const ndc = mat4.transformPoint(frame.camera.projection, v)
        return { x: (ndc[0] + 1) * size.width / 2, y: (1 - ndc[1]) * size.height / 2 }
      } }
      const head = characterJointsInView(character(options), pose, projection, { height: 1.7 }).head
      expect(head.axes[2][2]).toBeLessThan(-.3)
      const canvas = createCanvas(size.width, size.height), ctx = canvas.getContext('2d')
      drawScene3D(ctx as unknown as CanvasRenderingContext2D, loaded, undefined, size)
      const pixels = ctx.getImageData(Math.round(head.center.x) - 3, Math.round(head.center.y) - 3, 7, 7).data
      let covered = 0
      for (let i = 0; i < pixels.length; i += 4) if ([128, 64, 32].every((v, k) => Math.abs(v - pixels[i + k]) < 10)) covered++
      expect(covered, `${name} camera ${yaw} nod ${nod} head ${headTurn}: skin showing through rear hair`).toBeGreaterThan(35)
    }
  }, 15000)

  it.each(['youngMan', 'youngWoman', 'childBoy', 'childGirl'] as const)('keeps %s wrists over waist garments in globally sorted scene pixels', name => {
    const size = { width: 500, height: 450 }
    const camera: Scene3D['objects'][number] = { id: 'cam', kind: 'camera', projection: 'orthographic', height: 2.5, near: .1, far: 50, position: [0, 1, 5] }
    for (const leaves of [false, true]) for (const mirrored of [false, true]) for (const t of [.2, .3, .4, .5, .6]) {
      const preset: CharacterOptions = SOFT_CARTOON_CAST[name]
      const options: CharacterOptions = { ...preset, body: { ...preset.body, shading: { mode: 'none' } }, ...(leaves ? { outfit: null, leafOutfit: { top: true } } : {}) }
      const blended = humanPose(Object.fromEntries(Object.keys(HUMAN_REST).map(key => [key, HUMAN_REST[key] + ((HUMAN_POSES.think[key] ?? HUMAN_REST[key]) - HUMAN_REST[key]) * t])))
      const pose = mirrored ? mirrorHumanPose({ ...blended, turn: .15 }) : { ...blended, turn: .15 }
      const json: Scene3D = { ...scene(), objects: [camera, { id: 'actor', kind: 'character', height: 1.7, character: { ...options }, pose, shadow: false }] }
      const loaded = loadScene3D(json, { kinds: [characterObjects] })
      const frame = resolveScene3D(loaded, new Map(), size)
      const projection: ViewProjection = { toView: v => mat4.transformPoint(frame.camera.view, v), toScreen: v => {
        const ndc = mat4.transformPoint(frame.camera.projection, v)
        return { x: (ndc[0] + 1) * size.width / 2, y: (1 - ndc[1]) * size.height / 2 }
      } }
      const who = character(options)
      const joints = characterJointsInView(who, pose, projection, { height: 1.7 })
      const wrist = joints.points[`hand.${mirrored ? 'left' : 'right'}`]
      const image = (objects: Scene3D['objects']) => {
        const ctx = createCanvas(size.width, size.height).getContext('2d') as unknown as CanvasRenderingContext2D
        drawScene3D(ctx, loadScene3D({ ...json, objects }, { kinds: [characterObjects] }), undefined, size)
        return ctx.getImageData(Math.round(wrist.x) - 3, Math.round(wrist.y) - 3, 7, 7).data
      }
      const skin = [1, 3, 5].map(i => parseInt(who.skin.slice(i, i + 2), 16))
      const count = (data: Uint8ClampedArray, rgb: number[]) => {
        let matches = 0
        for (let i = 0; i < data.length; i += 4) if (rgb.every((v, k) => Math.abs(v - data[i + k]) < 8)) matches++
        return matches
      }
      expect(count(image(json.objects), skin), `${leaves} ${mirrored} ${t}`).toBeGreaterThan(12)
      const box = (z: number): Scene3D['objects'][number] => ({ id: 'box', kind: 'mesh', geometry: { type: 'box', size: [1, 2, .1] }, material: 'red', position: [0, 1, z] })
      expect(count(image([...json.objects, box(1)]), [255, 0, 0])).toBe(49)
      expect(count(image([...json.objects, box(-1)]), skin)).toBeGreaterThan(12)
    }
  })

  it.each(['fluid', 'stick'] as const)('preserves raw part depth sorting and scene pixels for %s figures', figure => {
    for (const turn of [-.7, 0, .7, 1.5]) {
      const pose = humanPose({ ...HUMAN_POSES.think, turn })
      const options: CharacterOptions = { figure, skin: '#f2c49b', outfit: { shirt: '#72958b', trousers: '#6b6888', bottom: 'skirt' } }
      const json: Scene3D = { ...scene(), objects: [scene().objects[0], { id: 'actor', kind: 'character', height: 1.7, character: { ...options }, pose, shadow: false }] }
      const frame = resolveScene3D(loadScene3D(json, { kinds: [characterObjects] }), new Map(), SIZE)
      const projection: ViewProjection = { toView: v => mat4.transformPoint(frame.camera.view, v), toScreen: v => {
        const ndc = mat4.transformPoint(frame.camera.projection, v)
        return { x: (ndc[0] + 1) * SIZE.width / 2, y: (1 - ndc[1]) * SIZE.height / 2 }
      } }
      const parts = characterPartsInView(character(options), pose, projection, { height: 1.7 })
      expect(parts.every(part => part.sortDepth === undefined)).toBe(true)
      const ctx = createCanvas(SIZE.width, SIZE.height).getContext('2d') as unknown as CanvasRenderingContext2D
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, SIZE.width, SIZE.height)
      parts.map((part, index) => ({ part, depth: part.depth + index * 1e-6 })).sort((a, b) => a.depth - b.depth).forEach(({ part }) => part.draw(ctx))
      expect(Buffer.from(pixels(json)).equals(Buffer.from(ctx.getImageData(0, 0, SIZE.width, SIZE.height).data))).toBe(true)
    }
  })

  it.each(['youngMan', 'youngWoman', 'childBoy', 'childGirl'] as const)('keeps %s leaning body parts behind a box between them and the head', name => {
    const size = { width: 500, height: 450 }
    const options: CharacterOptions = { ...SOFT_CARTOON_CAST[name], outfit: null, hair: null, body: { shading: { mode: 'none' } } }
    const pose = humanPose({ lean: 45, 'arm.left.spread': 100, 'arm.right.spread': 100, 'arm.left.elbow': 0, 'arm.right.elbow': 0 })
    const json: Scene3D = { ...scene(), objects: [
      { id: 'cam', kind: 'camera', projection: 'orthographic', height: 2.5, near: .1, far: 50, position: [0, 1, 5] },
      { id: 'actor', kind: 'character', height: 1.7, character: { ...options }, pose, shadow: false },
    ] }
    const frame = resolveScene3D(loadScene3D(json, { kinds: [characterObjects] }), new Map(), size)
    const projection: ViewProjection = { toView: v => mat4.transformPoint(frame.camera.view, v), toScreen: v => {
      const ndc = mat4.transformPoint(frame.camera.projection, v)
      return { x: (ndc[0] + 1) * size.width / 2, y: (1 - ndc[1]) * size.height / 2 }
    } }
    const who = character(options)
    const parts = characterPartsInView(who, pose, projection, { height: 1.7 })
    const head = parts.find(part => part.part === 'head')!
    const bodyDepth = Math.max(...parts.filter(part => part.part === 'spine' || part.part.startsWith('leg.')).map(part => part.depth))
    expect(head.depth - bodyDepth).toBeGreaterThan(.1)
    const z = 5 + (head.depth + bodyDepth) / 2
    const ctx = createCanvas(size.width, size.height).getContext('2d') as unknown as CanvasRenderingContext2D
    drawScene3D(ctx, loadScene3D(json, { kinds: [characterObjects] }), undefined, size)
    const before = ctx.getImageData(0, 0, size.width, size.height).data
    json.objects.push({ id: 'box', kind: 'mesh', geometry: { type: 'box', size: [2, 2.5, .001] }, material: 'red', position: [0, 1.25, z] })
    drawScene3D(ctx, loadScene3D(json, { kinds: [characterObjects] }), undefined, size)
    const joints = characterJointsInView(who, pose, projection, { height: 1.7 })
    for (const id of ['spine', 'leg.left', 'leg.right']) {
      const point = joints.bodyContours![id].samples[6].center
      expect(Array.from(ctx.getImageData(Math.round(point.x), Math.round(point.y), 1, 1).data), id).toEqual([255, 0, 0, 255])
    }
    const point = { x: Math.round(joints.head.center.x - joints.head.rx * .5), y: Math.round(joints.head.center.y) }
    const offset = (point.y * size.width + point.x) * 4
    expect(Array.from(ctx.getImageData(point.x, point.y, 1, 1).data)).toEqual(Array.from(before.slice(offset, offset + 4)))
    expect(Array.from(before.slice(offset, offset + 3))).not.toEqual([255, 255, 255])
    for (const part of parts.filter(part => !part.part.startsWith('arm.'))) expect(part.sortDepth).toBe(part.depth)
  })

  it('allows a world object between an organic rear arm and foreground arm', () => {
    const size = { width: 500, height: 450 }
    const pose = humanPose({ turn: .6, 'arm.left.swing': -40, 'arm.right.swing': 40 })
    const options: CharacterOptions = { figure: 'organic', body: { shading: { mode: 'none' } } }
    const json: Scene3D = { ...scene(), objects: [
      { id: 'cam', kind: 'camera', projection: 'orthographic', height: 2.5, near: .1, far: 50, position: [0, 1, 5] },
      { id: 'actor', kind: 'character', height: 1.7, character: { ...options }, pose, shadow: false },
    ] }
    const frame = resolveScene3D(loadScene3D(json, { kinds: [characterObjects] }), new Map(), size)
    const projection: ViewProjection = { toView: v => mat4.transformPoint(frame.camera.view, v), toScreen: v => {
      const ndc = mat4.transformPoint(frame.camera.projection, v)
      return { x: (ndc[0] + 1) * size.width / 2, y: (1 - ndc[1]) * size.height / 2 }
    } }
    const who = character(options)
    const arms = characterPartsInView(who, pose, projection, { height: 1.7 }).filter(part => part.part.startsWith('arm.'))
    const [rear, front] = arms.sort((a, b) => a.sortDepth! - b.sortDepth!)
    expect(front.sortDepth! - rear.sortDepth!).toBeGreaterThan(.1)
    const z = 5 + (rear.sortDepth! + front.sortDepth!) / 2
    json.objects.push({ id: 'box', kind: 'mesh', geometry: { type: 'box', size: [2, 2, .001] }, material: 'red', position: [0, 1, z] })
    const ctx = createCanvas(size.width, size.height).getContext('2d') as unknown as CanvasRenderingContext2D
    drawScene3D(ctx, loadScene3D(json, { kinds: [characterObjects] }), undefined, size)
    const joints = characterJointsInView(who, pose, projection, { height: 1.7 })
    for (const arm of [rear, front]) {
      const wrist = joints.points[arm.part.replace('arm.', 'hand.')]
      const pixel = ctx.getImageData(Math.round(wrist.x), Math.round(wrist.y), 1, 1).data
      const color = arm === rear ? '#ff0000' : who.skin
      expect(Array.from(pixel)).toEqual([...([1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16))), 255])
    }
  })

  it.each([
    { intensity: 1, color: '#ffffff' },
    { intensity: .3, color: '#6070a0' },
    { intensity: .3, color: '#6070a0', fog: { color: '#c0d0e0', near: 0, far: 10 } },
    { intensity: 1, color: '#ffffff', fog: { color: '#c0d0e0', near: 0, far: 4 } },
  ])('shares scene lighting and fog across organic body, face and hands: %j', ({ intensity, color, fog }) => {
    const base = '#f2c49b'
    const options = { figure: 'organic', skin: '#ffffff', body: { fill: base, shading: { mode: 'none' } } }
    const actor: Scene3D['objects'][number] = { id: 'tum', kind: 'character', shadow: false, character: options }
    const amount = fog ? Math.min(1, Math.hypot(5, 1 - 1.7 * .6) / fog.far) : 0
    const expected = '#' + [1, 3, 5].map(i => {
      const lit = parseInt(base.slice(i, i + 2), 16) * parseInt(color.slice(i, i + 2), 16) / 255 * intensity
      const into = fog ? parseInt(fog.color.slice(i, i + 2), 16) : 0
      return Math.round(lit + (into - lit) * amount).toString(16).padStart(2, '0')
    }).join('')
    const original = JSON.stringify(options)
    const loaded = loadScene3D({ ...scene(), fog, objects: [scene().objects[0], actor, { id: 'sky', kind: 'light', light: 'ambient', color, intensity }] }, { kinds: [characterObjects] })
    const who = (loaded.prepared.get('tum') as { who: Character }).who
    const material = JSON.stringify({ skin: who.skin, body: who.body })
    const ctx = createCanvas(SIZE.width, SIZE.height).getContext('2d') as unknown as CanvasRenderingContext2D
    drawScene3D(ctx, loaded, undefined, SIZE)
    const actual = ctx.getImageData(0, 0, SIZE.width, SIZE.height).data
    const reference = pixels({ ...scene(), objects: [scene().objects[0], { ...actor, character: { ...options, body: { ...options.body, fill: expected } } }] })
    expect(Buffer.from(actual).equals(Buffer.from(reference))).toBe(true)
    expect(JSON.stringify(options)).toBe(original)
    expect(JSON.stringify({ skin: who.skin, body: who.body })).toBe(material)
    expect(differ(actual, pixels({ ...scene(), objects: [scene().objects[0], actor] }))).toBe(intensity !== 1 || !!fog)
  })

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

  it('is lit by the scene: its skin dims at night, and a scene with no lights leaves it as it was', () => {
    const lit = (lights: Scene3D['objects']) => {
      const ctx = createCanvas(SIZE.width, SIZE.height).getContext('2d') as unknown as CanvasRenderingContext2D
      drawScene3D(ctx, loadScene3D({ ...scene(), objects: [...scene().objects, ...lights] }, { kinds: [characterObjects] }), undefined, SIZE)
      return ctx.getImageData(0, 0, SIZE.width, SIZE.height).data
    }
    const plain = lit([])
    // The face's fill, where it is unlit (warm pixels, red well above blue), measured at the same pixels lit.
    const skin = (data: Uint8ClampedArray) => {
      let sum = 0
      let count = 0
      for (let i = 0; i < plain.length; i += 4) if (plain[i] > plain[i + 2] + 30) { sum += data[i] + data[i + 1] + data[i + 2]; count++ }
      expect(count).toBeGreaterThan(50)
      return sum / count
    }
    expect(lit([]).every((v, i) => v === plain[i])).toBe(true)
    const day = lit([{ id: 'sun', kind: 'light', light: 'directional', color: '#ffffff', intensity: 1, position: [0, 3, 5] }, { id: 'sky', kind: 'light', light: 'ambient', color: '#ffffff', intensity: 0.5 }])
    const night = lit([{ id: 'sky', kind: 'light', light: 'ambient', color: '#6070a0', intensity: 0.3 }])
    expect(skin(day)).toBeCloseTo(skin(plain), -1)
    expect(skin(night)).toBeLessThan(skin(day) * 0.6)
  })
})

