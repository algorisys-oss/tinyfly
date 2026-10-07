import { mat4, quat, vec3, type Mat4, type Quat, type Vec3 } from '../engine/math'
import type { AnimatableValue } from '../engine/types'
import type { LoadedScene3D, PreparedMesh } from './load-scene'
import type { CameraObject, LightObject, LineObject3D, Material3D, Object3D, Scene3D, TrailObject3D } from './scene-types'
import { lookAtView, projectionMatrix } from './camera'
import type { Drawable } from './object-kind'
import { strokeDrawables, type StrokeLook } from './strokes'
import { trailSamples } from '../engine/path/trail'

/**
 * From a loaded scene and the animation's values at one moment to plain data
 * a renderer draws: world matrices, the camera, lights in world space, and
 * every visible triangle on screen, sorted far to near. Pure: no canvas, no
 * GPU, the same input always gives the same frame.
 *
 * Tracks address objects as `<sceneId>/<objectId>`:
 * - every object: `x`, `y`, `z` or `position`; `rotateX`, `rotateY`,
 *   `rotateZ` (degrees, YXZ) or `quaternion` (a slerp track); `scale` or
 *   `scaleX` / `scaleY` / `scaleZ`; `visible` (0 or 1); `opacity`;
 * - meshes and lights: `color`; lights: `intensity`, `target`;
 * - lines and trails: `color`, `width`, `opacity`; trails: `length`;
 * - cameras: `fov` (perspective), `height` (orthographic), `lookAt`;
 * - the scene itself, `<sceneId>`: `activeCamera` (a camera's id: a cut is one keyframe).
 */

/** Animated values by target, then property: an `AnimationState`'s `values`. */
export type SceneValues = ReadonlyMap<string, ReadonlyMap<string, AnimatableValue>>

export interface ScreenPoint {
  x: number
  y: number
}

export interface ResolvedCamera {
  id: string
  view: Mat4
  projection: Mat4
  /** World position */
  position: Vec3
  /** The way it looks, unit length */
  forward: Vec3
  orthographic: boolean
  near: number
  far: number
}

export interface ResolvedLight {
  id: string
  light: LightObject['light']
  color: string
  intensity: number
  position: Vec3
  /** Directional and spot: the way the light travels, unit length */
  direction: Vec3
  range?: number
  /** Spot: the cone's half-angle, degrees */
  angle: number
}

export interface DrawTriangle {
  objectId: string
  objectIndex: number
  /** The object's draw-order group: lower first */
  layer: number
  face: number
  /** On the canvas, px (y down) */
  screen: [ScreenPoint, ScreenPoint, ScreenPoint]
  /** Distance in front of the camera, metres: what the draw order sorts by */
  depth: number
  /** World centre of the face (lighting, fog) */
  centroid: Vec3
  /** World face normal, unit, toward the viewer */
  normal: Vec3
  /** World vertex normals, for smooth shading */
  vertexNormals: [Vec3, Vec3, Vec3]
  material: Material3D
  /** The object's own colour, over the material's (an animated `color`) */
  color?: string
  /** The object's opacity times the material's */
  opacity: number
  /** Edges to ink on top of this triangle (silhouettes, creases, open rims), when the material has an outline */
  outline: Array<[ScreenPoint, ScreenPoint]>
}

/**
 * A visible mesh in world space, for renderers that keep geometry 3D (the
 * WebGL2 renderer): the scene's meshes and those added kinds place.
 */
export interface ResolvedMesh {
  objectId: string
  objectIndex: number
  mesh: PreparedMesh
  world: Mat4
  material: Material3D
  /** An animated colour over the material's */
  color?: string
  /** The object's opacity times the material's */
  opacity: number
}

/** A drawable from an added object kind, in the draw order. */
export interface ResolvedDrawable extends Drawable {
  objectId: string
  objectIndex: number
  layer: number
}

export interface ResolvedScene3D {
  id: string
  width: number
  height: number
  /** ms: the moment drawn (for looks that move with time, such as a boiling pencil line) */
  time: number
  background?: string
  fog?: Scene3D['fog']
  camera: ResolvedCamera
  lights: ResolvedLight[]
  /** World matrices by object id */
  worlds: Map<string, Mat4>
  /** By layer, then far to near: draw in this order */
  triangles: DrawTriangle[]
  /** Objects of added kinds (characters), each placed among the triangles by layer and depth */
  drawables: ResolvedDrawable[]
  /** Every visible mesh in world space (renderers with a depth buffer draw these instead of `triangles`) */
  meshes: ResolvedMesh[]
}

/** Edges sharper than this (between face normals) are inked as creases. */
const CREASE_COS = Math.cos((30 * Math.PI) / 180)

const EMPTY: ReadonlyMap<string, AnimatableValue> = new Map()

const num = (value: AnimatableValue | undefined): number | undefined => (typeof value === 'number' ? value : undefined)
const vec = (value: AnimatableValue | undefined, length: number): number[] | undefined =>
  Array.isArray(value) && value.length === length ? value : undefined

/** An object's own transform, its animated values over its authored ones. */
function localMatrix(object: Object3D, values: ReadonlyMap<string, AnimatableValue>): Mat4 {
  const p = object.position ?? [0, 0, 0]
  const position = (vec(values.get('position'), 3) as Vec3 | undefined) ?? [
    num(values.get('x')) ?? p[0],
    num(values.get('y')) ?? p[1],
    num(values.get('z')) ?? p[2],
  ]
  let rotation: Quat
  const animatedQuat = vec(values.get('quaternion'), 4) as Quat | undefined
  const euler = ['rotateX', 'rotateY', 'rotateZ'].map((k) => num(values.get(k)))
  if (animatedQuat) rotation = quat.normalize(animatedQuat)
  else if (euler.some((v) => v !== undefined)) {
    const r = object.rotation ?? [0, 0, 0]
    rotation = quat.fromEuler(euler[0] ?? r[0], euler[1] ?? r[1], euler[2] ?? r[2])
  } else if (object.quaternion) rotation = quat.normalize(object.quaternion)
  else rotation = object.rotation ? quat.fromEuler(...object.rotation) : quat.identity()
  const s = typeof object.scale === 'number' ? [object.scale, object.scale, object.scale] : object.scale ?? [1, 1, 1]
  const uniform = num(values.get('scale'))
  const scale: Vec3 = [
    num(values.get('scaleX')) ?? uniform ?? s[0],
    num(values.get('scaleY')) ?? uniform ?? s[1],
    num(values.get('scaleZ')) ?? uniform ?? s[2],
  ]
  return mat4.compose(position, rotation, scale)
}

const translationOf = (m: Mat4): Vec3 => [m[12], m[13], m[14]]

function resolveCamera(camera: CameraObject, world: Mat4, values: ReadonlyMap<string, AnimatableValue>, aspect: number): ResolvedCamera {
  const position = translationOf(world)
  const lookAt = (vec(values.get('lookAt'), 3) as Vec3 | undefined) ?? camera.lookAt
  const view = lookAt ? lookAtView(position, lookAt) : (mat4.invert(world) ?? mat4.identity())
  const projection =
    camera.projection === 'perspective'
      ? projectionMatrix({ ...camera, fov: num(values.get('fov')) ?? camera.fov }, aspect)
      : projectionMatrix({ ...camera, height: num(values.get('height')) ?? camera.height }, aspect)
  return {
    id: camera.id,
    view,
    projection,
    position,
    forward: vec3.normalize([-view[2], -view[6], -view[10]]),
    orthographic: camera.projection === 'orthographic',
    near: camera.near,
    far: camera.far,
  }
}

/** The upper-left 3×3 of the inverse transpose: turns normals as the matrix turns surfaces. */
function normalMatrix(world: Mat4): Mat4 {
  return mat4.transpose(mat4.invert(world) ?? mat4.identity())
}

function turnNormal(n: Mat4, x: number, y: number, z: number): Vec3 {
  return vec3.normalize([n[0] * x + n[4] * y + n[8] * z, n[1] * x + n[5] * y + n[9] * z, n[2] * x + n[6] * y + n[10] * z])
}

/** Keep the part of a view-space polygon in front of the near plane (z ≤ -near). */
function clipNear(points: Vec3[], near: number): Vec3[] {
  const inside = (p: Vec3) => -p[2] >= near
  const out: Vec3[] = []
  for (let i = 0; i < points.length; i++) {
    const current = points[i]
    const next = points[(i + 1) % points.length]
    if (inside(current)) out.push(current)
    if (inside(current) !== inside(next)) {
      const t = (-near - current[2]) / (next[2] - current[2])
      out.push(vec3.lerp(current, next, t))
    }
  }
  return out
}

export interface ResolveOptions {
  /** Canvas size, px */
  width: number
  height: number
  /** ms: the moment drawn, for looks that move with time (default 0) */
  time?: number
  /**
   * The animated values at another moment (an `AnimationState`'s `values`):
   * trails ask where what they follow was. Without it, trails draw nothing.
   */
  valuesAt?: (time: number) => SceneValues
}

/** The frame at these animated values (an `AnimationState`'s `values`, or none for the scene as authored). */
export function resolveScene3D(loaded: LoadedScene3D, values: SceneValues = new Map(), options: ResolveOptions): ResolvedScene3D {
  const { scene } = loaded
  const valuesOf = (id: string) => values.get(`${scene.id}/${id}`) ?? EMPTY

  // World matrices, parents first.
  const worlds = new Map<string, Mat4>()
  const visible = new Map<string, boolean>()
  for (const object of scene.objects) {
    const own = valuesOf(object.id)
    const local = localMatrix(object, own)
    const parent = object.parent ? worlds.get(object.parent) : undefined
    worlds.set(object.id, parent ? mat4.multiply(parent, local) : local)
    const shown = num(own.get('visible')) !== undefined ? num(own.get('visible'))! > 0.5 : object.visible !== false
    visible.set(object.id, shown && (object.parent ? visible.get(object.parent) !== false : true))
  }

  // The camera: the scene's, unless an activeCamera track has cut to another.
  const cut = values.get(scene.id)?.get('activeCamera')
  const cameraId = typeof cut === 'string' && scene.objects.some((o) => o.id === cut && o.kind === 'camera') ? cut : scene.camera
  const cameraObject = scene.objects.find((o) => o.id === cameraId) as CameraObject
  const camera = resolveCamera(cameraObject, worlds.get(cameraId)!, valuesOf(cameraId), options.width / options.height)
  const toScreen = (view: Vec3): ScreenPoint => {
    const ndc = mat4.transformPoint(camera.projection, view)
    return { x: ((ndc[0] + 1) / 2) * options.width, y: ((1 - ndc[1]) / 2) * options.height }
  }

  const lights: ResolvedLight[] = []
  for (const object of scene.objects) {
    if (object.kind !== 'light' || !visible.get(object.id)) continue
    const own = valuesOf(object.id)
    const position = translationOf(worlds.get(object.id)!)
    const target = (vec(own.get('target'), 3) as Vec3 | undefined) ?? object.target ?? [0, 0, 0]
    const color = own.get('color')
    lights.push({
      id: object.id,
      light: object.light,
      color: typeof color === 'string' ? color : object.color,
      intensity: num(own.get('intensity')) ?? object.intensity,
      position,
      direction: vec3.normalize(vec3.subtract(target, position)),
      range: object.range,
      angle: object.angle ?? 30,
    })
  }

  const triangles: Array<DrawTriangle & { part: number }> = []
  const meshes: ResolvedMesh[] = []
  scene.objects.forEach((object, objectIndex) => {
    if (object.kind !== 'mesh' || !visible.get(object.id)) return
    const mesh = loaded.meshes.get(object.id)
    const material = scene.materials?.[object.material]
    if (!mesh || !material) return
    const own = valuesOf(object.id)
    const world = worlds.get(object.id)!
    const normals = normalMatrix(world)
    const color = own.get('color')
    const opacity = (num(own.get('opacity')) ?? 1) * (material.opacity ?? 1)
    if (opacity <= 0) return
    meshes.push({ objectId: object.id, objectIndex, mesh, world, material, color: typeof color === 'string' ? color : undefined, opacity })
    triangles.push(...meshTriangles(mesh, world, normals, camera, toScreen, material, {
      objectId: object.id,
      objectIndex,
      layer: object.layer ?? 0,
      color: typeof color === 'string' ? color : undefined,
      opacity,
    }))
  })

  // Objects of added kinds: their meshes join the triangles; their drawables are drawn whole, at their depth.
  const drawables: ResolvedDrawable[] = []
  scene.objects.forEach((object, objectIndex) => {
    const kind = loaded.kinds.get(object.kind)
    if (!kind || !visible.get(object.id)) return
    const view = kind.resolve({
      object,
      prepared: loaded.prepared.get(object.id),
      values: valuesOf(object.id),
      world: worlds.get(object.id)!,
      camera,
      lights,
      fog: scene.fog,
      width: options.width,
      height: options.height,
      toScreen,
    })
    if (!view) return
    const layer = object.layer ?? 0
    for (const drawable of view.drawables ?? []) drawables.push({ ...drawable, objectId: object.id, objectIndex, layer })
    for (const placed of view.meshes ?? []) {
      meshes.push({ objectId: object.id, objectIndex, mesh: placed.mesh, world: placed.world, material: placed.material, opacity: placed.material.opacity ?? 1 })
      triangles.push(...meshTriangles(placed.mesh, placed.world, normalMatrix(placed.world), camera, toScreen, placed.material, {
        objectId: object.id,
        objectIndex,
        layer,
        opacity: placed.material.opacity ?? 1,
      }))
    }
  })
  // Lines and trails: a band of segments, each placed among the triangles by its depth.
  const strokeView = { camera, height: options.height, fog: scene.fog, toScreen }
  scene.objects.forEach((object, objectIndex) => {
    if ((object.kind !== 'line' && object.kind !== 'trail') || !visible.get(object.id)) return
    const own = valuesOf(object.id)
    const stroke = object.kind === 'line' ? linePoints(object, worlds.get(object.id)!) : trailPoints(object, scene, values, options)
    if (!stroke) return
    const look = strokeLook(object, own)
    if (look.opacity <= 0 || look.width <= 0) return
    const layer = object.layer ?? 0
    for (const drawable of strokeDrawables(stroke.points, stroke.ages, look, strokeView)) drawables.push({ ...drawable, objectId: object.id, objectIndex, layer })
  })
  drawables.sort((p, q) => p.layer - q.layer || q.depth - p.depth || p.objectIndex - q.objectIndex)

  // By layer, then far to near; ties broken by object, face and part, so the order is total and never flickers.
  triangles.sort((p, q) => p.layer - q.layer || q.depth - p.depth || p.objectIndex - q.objectIndex || p.face - q.face || p.part - q.part)

  return {
    id: scene.id,
    width: options.width,
    height: options.height,
    background: scene.background,
    fog: scene.fog,
    camera,
    lights,
    worlds,
    triangles,
    drawables,
    meshes,
    time: options.time ?? 0,
  }
}

function strokeLook(object: LineObject3D | TrailObject3D, values: ReadonlyMap<string, AnimatableValue>): StrokeLook {
  const color = values.get('color')
  const trail = object.kind === 'trail'
  return {
    color: typeof color === 'string' ? color : object.color,
    width: num(values.get('width')) ?? object.width ?? 0.05,
    taper: object.taper ?? (trail ? 1 : 0),
    fade: object.fade ?? (trail ? 1 : 0),
    opacity: (num(values.get('opacity')) ?? 1) * (object.opacity ?? 1),
    additive: object.blend === 'add',
  }
}

/** A line's points in the world; ages run from 1 at its first point to 0 at its last. */
function linePoints(line: LineObject3D, world: Mat4): { points: Vec3[]; ages: number[] } {
  const local = line.closed ? [...line.points, line.points[0]] : line.points
  const points = local.map((p) => mat4.transformPoint(world, p as Vec3))
  return { points, ages: points.map((_, i) => 1 - i / (points.length - 1)) }
}

/** Where a trail's object was over the last `length` ms, tail first. */
function trailPoints(trail: TrailObject3D, scene: Scene3D, values: SceneValues, options: ResolveOptions): { points: Vec3[]; ages: number[] } | null {
  if (!options.valuesAt) return null
  const time = options.time ?? 0
  const length = num(values.get(`${scene.id}/${trail.id}`)?.get('length')) ?? trail.length
  const samples = trailSamples(
    (at) => translationOf(worldOf(scene, trail.follow, at === time ? values : options.valuesAt!(at))),
    time,
    { length, samples: trail.samples ?? 32, period: trail.period }
  )
  return samples.length >= 2 ? { points: samples.map((s) => s.at), ages: samples.map((s) => s.age) } : null
}

/** One object's world matrix at these values: its own transform under its parents'. */
function worldOf(scene: Scene3D, id: string, values: SceneValues): Mat4 {
  const object = scene.objects.find((o) => o.id === id)
  if (!object) return mat4.identity()
  const local = localMatrix(object, values.get(`${scene.id}/${id}`) ?? EMPTY)
  return object.parent ? mat4.multiply(worldOf(scene, object.parent, values), local) : local
}

function meshTriangles(
  mesh: PreparedMesh,
  world: Mat4,
  normals: Mat4,
  camera: ResolvedCamera,
  toScreen: (view: Vec3) => ScreenPoint,
  material: Material3D,
  owner: { objectId: string; objectIndex: number; layer: number; color?: string; opacity: number }
): Array<DrawTriangle & { part: number }> {
  const count = mesh.positions.length / 3
  const worldPoints: Vec3[] = []
  const viewPoints: Vec3[] = []
  for (let i = 0; i < count; i++) {
    const p = mat4.transformPoint(world, [mesh.positions[i * 3], mesh.positions[i * 3 + 1], mesh.positions[i * 3 + 2]])
    worldPoints.push(p)
    viewPoints.push(mat4.transformPoint(camera.view, p))
  }
  const faces = mesh.indices.length / 3
  const faceNormals: Vec3[] = []
  const facing: boolean[] = []
  for (let f = 0; f < faces; f++) {
    const [a, b, c] = [0, 1, 2].map((k) => worldPoints[mesh.indices[f * 3 + k]])
    const n = vec3.normalize(vec3.cross(vec3.subtract(b, a), vec3.subtract(c, a)))
    faceNormals.push(n)
    const toEye = camera.orthographic ? vec3.scale(camera.forward, -1) : vec3.subtract(camera.position, a)
    facing.push(vec3.dot(n, toEye) > 0)
  }
  const inFront = (i: number) => -viewPoints[i][2] >= camera.near
  const out: Array<DrawTriangle & { part: number }> = []
  for (let f = 0; f < faces; f++) {
    const front = facing[f]
    if (!front && !material.doubleSided) continue
    const ids = [mesh.indices[f * 3], mesh.indices[f * 3 + 1], mesh.indices[f * 3 + 2]]
    const view = ids.map((i) => viewPoints[i])
    if (view.every((p) => -p[2] > camera.far)) continue
    const clipped = clipNear(view, camera.near)
    if (clipped.length < 3) continue
    const flip = front ? 1 : -1
    const normal = vec3.scale(faceNormals[f], flip)
    const vertexNormals = ids.map((i) => vec3.scale(turnNormal(normals, mesh.normals[i * 3], mesh.normals[i * 3 + 1], mesh.normals[i * 3 + 2]), flip)) as [Vec3, Vec3, Vec3]
    const centroid = vec3.scale(vec3.add(vec3.add(worldPoints[ids[0]], worldPoints[ids[1]]), worldPoints[ids[2]]), 1 / 3)
    const depth = -(view[0][2] + view[1][2] + view[2][2]) / 3

    // Ink: open rims, silhouettes (the face across turns away) and creases, each edge once.
    const outline: Array<[ScreenPoint, ScreenPoint]> = []
    if (material.outline && front) {
      for (const edge of mesh.faceEdges[f]) {
        const across = edge.across
        const silhouette = across === -1 || !facing[across]
        const crease = material.creases !== false && !silhouette && f < across && vec3.dot(faceNormals[f], faceNormals[across]) < CREASE_COS
        if ((silhouette || crease) && inFront(edge.a) && inFront(edge.b)) outline.push([toScreen(viewPoints[edge.a]), toScreen(viewPoints[edge.b])])
      }
    }

    const screen = clipped.map(toScreen)
    for (let k = 1; k + 1 < screen.length; k++) {
      out.push({
        objectId: owner.objectId,
        objectIndex: owner.objectIndex,
        layer: owner.layer,
        face: f,
        part: k - 1,
        screen: [screen[0], screen[k], screen[k + 1]],
        depth,
        centroid,
        normal,
        vertexNormals,
        material,
        color: owner.color,
        opacity: owner.opacity,
        outline: k === 1 ? outline : [],
      })
    }
  }
  return out
}
