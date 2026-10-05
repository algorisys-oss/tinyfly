import type { Mat4, Vec3 } from '../engine/math'
import type { AnimatableValue } from '../engine/types'
import type { Material3D, Object3D } from './scene-types'
import type { PreparedMesh } from './load-scene'
import type { ResolvedCamera, ResolvedScene3D, ScreenPoint } from './resolve-scene'

/**
 * A kind of scene object beyond the built-in meshes, lights and cameras,
 * added when a scene is loaded: characters come this way, from the
 * characters add-on, so this entry stays small. The scene JSON is the same
 * either way; only drawing it needs the kind.
 */
export interface ObjectKind {
  /** The `kind` in the scene JSON it handles, e.g. 'character' */
  kind: string
  /** Problems with one object of this kind, as sentences */
  validate?(object: Object3D): string[]
  /** Built once when the scene loads; handed back to `resolve` */
  prepare?(object: Object3D): unknown
  /** The object at one moment: meshes to place in the world and things to draw, or null for nothing */
  resolve(context: ObjectContext): ObjectView | null
}

/** What an object of an added kind shows at one moment. */
export interface ObjectView {
  /** Meshes in world space: shaded, outlined and depth-sorted like the scene's own */
  meshes?: PlacedMesh[]
  /** Things drawn whole, each at its depth (a pen-drawn figure, a shadow) */
  drawables?: Drawable[]
}

export interface PlacedMesh {
  mesh: PreparedMesh
  /** Where it is: its world matrix */
  world: Mat4
  material: Material3D
}

export interface ObjectContext {
  object: Object3D
  prepared: unknown
  /** Its animated values (target `<sceneId>/<objectId>`) */
  values: ReadonlyMap<string, AnimatableValue>
  /** Its world matrix */
  world: Mat4
  camera: ResolvedCamera
  /** Canvas size, px */
  width: number
  height: number
  /** A view-space point on the canvas, px */
  toScreen(view: Vec3): ScreenPoint
}

/** Something a kind draws, placed in the scene's draw order by its depth. */
export interface Drawable {
  /** Distance in front of the camera, metres (the triangles sort by the same) */
  depth: number
  draw(ctx: CanvasRenderingContext2D, frame: ResolvedScene3D): void
}
