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

/**
 * A character (tinyfly's v2 human) standing in the scene. Drawing it needs the
 * characters add-on: `loadScene3D(scene, { kinds: [characterObjects] })` with
 * `characterObjects` from `@algorisys/tinyfly/characters`.
 */
export interface CharacterObject3D extends ObjectBase {
  kind: 'character'
  /** How it looks: `character()` options (figure, look, ink, skin, hands, …) */
  character?: Record<string, unknown>
  /** Height, metres (default 1.7) */
  height?: number
  /** Its pose: character pose fields (`arm.right.spread`, `turn`, …); tracks animate them */
  pose?: Record<string, number>
  /** A soft shadow on the ground under it (default true) */
  shadow?: boolean
  /** The gait it walks in when walking (`walk`, `run`, `sneak`, `strut`, `tired`, `bouncy`…; default walk); a `gait` track can change it */
  gait?: string
  /** How much of its gait is applied, 0..1 (default 0); its `walk` track (the gait's phase, in cycles) steps it — see `characterScript3D` */
  walking?: number
  /**
   * `pen` (default): drawn by its pens, in its 2D look (clean, pencil,
   * silhouette) seen in perspective. `solid`: built of shaded capsules and an
   * ellipsoid head, lit and outlined like the scene's meshes.
   */
  look?: 'pen' | 'solid'
  /** The solid look's colours and shading (default: a slate body, skin, toon with ink) */
  solid?: { color?: string; skin?: string; shading?: 'unlit' | 'flat' | 'lambert' | 'toon'; outline?: { width: number; color: string } | false }
}

/**
 * A prop (a car, a tree, a house, a horse, a bird…) named by its preset,
 * drawn with the characters' pens in its look. Like characters, it needs the
 * characters add-on: `loadScene3D(scene, { kinds: [characterObjects, propObjects] })`
 * with both from `@algorisys/tinyfly/characters`. It stands on its object's
 * ground and faces +z; `rotateY` turns it. Its controls (`door`, `wheelSpin`,
 * `spread`, …) are tracks on the object too.
 */
export interface PropObject3D extends ObjectBase {
  kind: 'prop'
  /** The preset: car, truck, bus, tractor, cart, trainCar, bike, motorbike, tree, house, helicopter, airplane, horse, dog, cat, cow, songbird, crow, chicken */
  prop: string
  /** The preset's options (colours, sizes) */
  options?: Record<string, unknown>
  /** Its control values as placed (`door: 1`, `lights: 1`); tracks animate them */
  values?: Record<string, number>
  /** clean (default), pencil or silhouette, as the figures */
  /**
   * clean (default), pencil or silhouette: drawn with the figures' pens. `mesh`: built of the scene's own
   * meshes, lit, outlined and depth-sorted with them (exact with the WebGL2 renderer); glass is see-through
   */
  look?: 'clean' | 'pencil' | 'silhouette' | 'mesh'
  /** The mesh look's shading (default toon) and outline width in px (default 2) */
  shading?: 'unlit' | 'flat' | 'lambert' | 'toon'
  outline?: number
  /** solid (default) or stick (line art) */
  style?: 'solid' | 'stick'
  /** Outline colour */
  ink?: string
  /** The paper a stick prop's shapes are filled with */
  paper?: string
  /** A contact shadow on the ground under it (default true) */
  shadow?: boolean
}

/** How a line or trail looks: a flat band facing the camera, drawn among the meshes by depth. */
export interface StrokeStyle3D {
  color: string
  /** Width, metres (default 0.05): it narrows with distance, like everything else */
  width?: number
  /** How much it narrows toward its start (a line's first point, a trail's tail), 0..1 */
  taper?: number
  /** How much it fades toward its start, 0..1 */
  fade?: number
  /** 0..1, default 1 */
  opacity?: number
  /** `normal` (default) paints over what is behind; `add` adds its light: glowing beams that feed bloom */
  blend?: 'normal' | 'add'
}

/** A polyline through `points` (in its own space, so it moves with its transform and parent). */
export interface LineObject3D extends ObjectBase, StrokeStyle3D {
  kind: 'line'
  points: Vec3Tuple[]
  /** Join the last point back to the first */
  closed?: boolean
}

/**
 * Where another object has been: a band through its positions over the last
 * `length` ms, narrowing and fading toward the tail (taper and fade default
 * to 1). It needs the earlier moments, so the renderer is given a way to ask
 * for them (`valuesAt` / `stateAt`); without one it draws nothing. Its own
 * transform is not used.
 */
export interface TrailObject3D extends ObjectBase, StrokeStyle3D {
  kind: 'trail'
  /** Id of the object it follows */
  follow: string
  /** How far back it reaches, ms */
  length: number
  /** Points along it (default 32) */
  samples?: number
  /** Motion that repeats every `period` ms: the trail wraps, so a loop's first frame shows the last lap */
  period?: number
}

export type Object3D = GroupObject | MeshObject | CameraObject | LightObject | CharacterObject3D | PropObject3D | LineObject3D | TrailObject3D

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
  /** Inked creases too, where faces meet at a sharp angle (default true); false for smooth surfaces built of facets: only their silhouettes */
  creases?: boolean
  /** Ink outline along silhouettes and creases, px */
  outline?: { width: number; color: string }
  /** Light the surface gives off itself, added after lighting (both modes): neon, screens, lamps; feeds bloom */
  emissive?: string
  // Realistic mode (glTF's metallic-roughness); stylized mode ignores these
  roughness?: number
  metalness?: number
}
