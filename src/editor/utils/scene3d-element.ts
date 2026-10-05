import type { CustomTarget } from '../../adapters/canvas'
import type { AnimatableValue, AnimationState } from '../../engine/types'
import { drawScene3D, loadScene3D, type LoadedScene3D, type Object3D, type SceneValues } from '../../scene-3d'
import { characterObjects } from '../../characters'
import type { Scene3DElement } from '../stores/scene-store'

/**
 * 3D scene elements: the editor's bridge to `scene-3d`. The element holds the
 * scene as JSON; its animation is tracks on the element named
 * `<objectId>.<property>` (`cube.rotateY`, `tum.arm.right.spread`) and
 * `activeCamera`. These turn the element into a loaded scene, its values at a
 * moment, a canvas target (the Canvas preview and every export) and a painted
 * canvas (the DOM preview).
 */

/** The one property on the scene itself rather than an object. */
const SCENE_PROPERTIES = new Set(['activeCamera'])

/** Loaded scenes by their JSON: loading builds meshes, so do it once per version of a scene. */
const loadedCache = new Map<string, LoadedScene3D>()
const CACHE_LIMIT = 32

/** The element's scene, loaded (meshes built, characters ready). Throws with the scene's problems. */
export function loadedScene3D(element: Scene3DElement): LoadedScene3D {
  const key = JSON.stringify(element.scene)
  let loaded = loadedCache.get(key)
  if (!loaded) {
    loaded = loadScene3D(element.scene, { kinds: [characterObjects] })
    if (loadedCache.size >= CACHE_LIMIT) loadedCache.delete(loadedCache.keys().next().value!)
    loadedCache.set(key, loaded)
  }
  return loaded
}

/** The object a track property belongs to, and its own property: `tum.arm.right.spread` → `tum`, `arm.right.spread`. */
export function splitScene3DField(property: string): { object: string; property: string } | null {
  const dot = property.indexOf('.')
  if (dot <= 0 || dot === property.length - 1) return null
  return { object: property.slice(0, dot), property: property.slice(dot + 1) }
}

/** Is `property` one of this scene's animatable values (an object's, or the scene's cut)? */
export function isScene3DField(element: Scene3DElement, property: string): boolean {
  if (SCENE_PROPERTIES.has(property)) return true
  const field = splitScene3DField(property)
  return field !== null && element.scene.objects.some((object) => object.id === field.object)
}

/** Flat element values (`cube.rotateY`) as the scene's (`scene/cube` → `rotateY`). */
export function toSceneValues(element: Scene3DElement, flat: Iterable<[string, AnimatableValue]>): SceneValues {
  const out = new Map<string, Map<string, AnimatableValue>>()
  const at = (target: string) => {
    if (!out.has(target)) out.set(target, new Map())
    return out.get(target)!
  }
  for (const [property, value] of flat) {
    if (SCENE_PROPERTIES.has(property)) {
      at(element.scene.id).set(property, value)
      continue
    }
    const field = splitScene3DField(property)
    if (field) at(`${element.scene.id}/${field.object}`).set(field.property, value)
  }
  return out
}

/** The scene's values at a moment: the element's tracks, by id and then by name. */
export function scene3dValues(element: Scene3DElement, state?: AnimationState | null): SceneValues {
  const flat: Array<[string, AnimatableValue]> = []
  for (const key of [element.id, element.name]) {
    for (const entry of state?.values.get(key) ?? []) if (isScene3DField(element, entry[0])) flat.push(entry)
  }
  return toSceneValues(element, flat)
}

/** A canvas target for the Canvas preview and the exporters: tracks on the element reach the scene's objects. */
export function scene3dElementTarget(element: Scene3DElement): CustomTarget {
  const loaded = loadedScene3D(element)
  return {
    type: 'custom',
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    opacity: element.opacity,
    rotate: element.rotation || undefined,
    props: {},
    acceptsProp: (property) => isScene3DField(element, property),
    draw(ctx, target, time) {
      const values = toSceneValues(element, Object.entries(target.props ?? {}))
      drawScene3D(ctx, loaded, values, { width: element.width, height: element.height, time })
    },
  }
}

/** Paint a 3D scene element into a canvas the size of its box. */
export function paintScene3DCanvas(canvas: HTMLCanvasElement, element: Scene3DElement, values: SceneValues, time: number, pixelRatio = 1): void {
  const width = Math.max(1, Math.round(element.width * pixelRatio))
  const height = Math.max(1, Math.round(element.height * pixelRatio))
  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  ctx.clearRect(0, 0, element.width, element.height)
  try {
    drawScene3D(ctx, loadedScene3D(element), values, { width: element.width, height: element.height, time })
  } catch (error) {
    // A scene being edited into an invalid state shows its problem instead of nothing.
    ctx.fillStyle = '#7f1d1d'
    ctx.fillRect(0, 0, element.width, element.height)
    ctx.fillStyle = '#fecaca'
    ctx.font = '12px sans-serif'
    ctx.fillText(String((error as Error).message).split('\n')[1] ?? 'invalid scene', 8, 20, element.width - 16)
  }
}

/** A readable label for a 3D field: `cube · rotateY`. */
export function scene3dFieldLabel(property: string): string {
  if (property === 'activeCamera') return 'Camera (cut)'
  const field = splitScene3DField(property)
  return field ? `${field.object} · ${field.property}` : property
}

/** An id not yet used in the scene, from a base: `box`, `box-2`, … (no dots: they separate object from property). */
export function freeObjectId(objects: Object3D[], base: string): string {
  const clean = base.replace(/[^\w-]/g, '-') || 'object'
  const taken = new Set(objects.map((o) => o.id))
  if (!taken.has(clean)) return clean
  for (let i = 2; ; i++) if (!taken.has(`${clean}-${i}`)) return `${clean}-${i}`
}
