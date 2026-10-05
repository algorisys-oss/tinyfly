/**
 * A 3D scene as plain JSON: objects in world space (metres, right-handed,
 * +y up, +z toward the default camera), a camera to look through, lights and
 * materials. Its animation is ordinary tracks addressed to
 * `<sceneId>/<objectId>` (see `resolve-scene.ts`), so it plays on any
 * timeline and in any renderer.
 *
 * Angles are degrees; Euler rotations apply in YXZ order (yaw, pitch, roll),
 * as `quat.fromEuler`; quaternions are `[x, y, z, w]`.
 */

export type Vec3Tuple = [number, number, number]
export type QuatTuple = [number, number, number, number]

export interface Scene3D {
  /** The format of this scene (1) */
  formatVersion?: number
  id: string
  /** The camera at time 0; a film cuts between cameras with an `activeCamera` track on the scene */
  camera: string
  /** In order: parents before children; array order breaks depth ties */
  objects: Object3D[]
  materials?: Record<string, Material3D>
  /** Background colour, or 'transparent' (default) */
  background?: string
  /** Fog from `near` to `far` metres from the camera, toward `color` */
  fog?: { color: string; near: number; far: number }
  /** Realistic mode: an equirectangular HDR asset for light and reflections (stylized ignores it) */
  environment?: string
}

export interface Transform3D {
  /** Metres; default [0, 0, 0] */
  position?: Vec3Tuple
  /** Euler degrees, YXZ order (use `quaternion` instead for tumbling) */
  rotation?: Vec3Tuple
  quaternion?: QuatTuple
  /** One number for all three axes, or per axis; default 1 */
  scale?: Vec3Tuple | number
}

export interface ObjectBase extends Transform3D {
  /** Unique in the scene; tracks address it as `<sceneId>/<id>` */
  id: string
  name?: string
  /** Id of an earlier object this one moves with */
  parent?: string
  /** Default true */
  visible?: boolean
  /**
   * Draw-order group (default 0): lower layers draw first, whatever their
   * depth, then far to near within a layer. A floor at -1 never covers what
   * stands on it.
   */
  layer?: number
}

export interface GroupObject extends ObjectBase {
  kind: 'group'
}

export interface MeshObject extends ObjectBase {
  kind: 'mesh'
  geometry: Geometry3D
  /** A key of `materials` */
  material: string
}

export interface PerspectiveCamera extends ObjectBase {
  kind: 'camera'
  projection: 'perspective'
  /** Vertical field of view, degrees */
  fov: number
  /** Nearest and furthest distances drawn, metres */
  near: number
  far: number
  /** A point to look at, overriding the camera's rotation */
  lookAt?: Vec3Tuple
}

export interface OrthographicCamera extends ObjectBase {
  kind: 'camera'
  projection: 'orthographic'
  /** Height of the view, metres */
  height: number
  near: number
  far: number
  lookAt?: Vec3Tuple
}

export type CameraObject = PerspectiveCamera | OrthographicCamera

export interface LightObject extends ObjectBase {
  kind: 'light'
  light: 'ambient' | 'directional' | 'point' | 'spot'
  color: string
  /**
   * Strength. Stylized renderers read it as a multiplier (1 is full light);
   * the realistic renderer maps it to physical units.
   */
  intensity: number
  /** Directional and spot: they shine from their position toward this point (default the origin) */
  target?: Vec3Tuple
  /** Point and spot: the light fades to nothing at this distance, metres (default: no fade) */
  range?: number
  /** Spot: the cone's half-angle, degrees (default 30) */
  angle?: number
  /** Realistic mode: casts shadow maps */
  castShadow?: boolean
}

export type Object3D = GroupObject | MeshObject | CameraObject | LightObject

export type Geometry3D =
  | { type: 'box'; size: Vec3Tuple }
  | { type: 'sphere'; radius: number; segments?: number }
  | { type: 'cylinder'; radius: number; height: number; segments?: number }
  | { type: 'cone'; radius: number; height: number; segments?: number }
  | { type: 'plane'; size: [number, number]; segments?: number }
  | { type: 'torus'; radius: number; tube: number; segments?: number }
  /** An SVG path made solid, `depth` thick, scaled to `width` metres wide (default 1); subpaths inside others are holes */
  | { type: 'extrude'; path: string; depth: number; width?: number; curveSegments?: number }

export interface Material3D {
  // Both modes
  color: string
  /** 0..1, default 1 */
  opacity?: number
  /** Draw both sides (default: only the front, the side the outward normal faces) */
  doubleSided?: boolean
  // Stylized mode; realistic mode ignores these
  /** unlit: the colour as is; flat: lit per face; lambert: lit, smoothed; toon: lit in bands */
  shading?: 'unlit' | 'flat' | 'lambert' | 'toon'
  /** Toon: number of light bands (default 3) */
  bands?: number
  /** Ink outline along silhouettes and creases, px */
  outline?: { width: number; color: string }
  // Realistic mode (glTF's metallic-roughness); stylized mode ignores these
  roughness?: number
  metalness?: number
  emissive?: string
}
