import { mat4, type Vec3 } from '../../engine/math'
import { unknownName } from '../../engine/authoring/did-you-mean'
import type { ObjectKind, ObjectView } from '../../scene-3d/object-kind'
import { fogAmount, lightAt } from '../../scene-3d/shading'
import type { PropObject3D } from '../../scene-3d/scene-types'
import type { ViewProjection } from '../rig/skeleton'
import { propPartsInSpace, propShapeMesh, solveProp } from './rig'
import { hiddenFaces, solidsOf } from './hidden'
import { placedMesh } from './slice'
import { propPartMaterial, propPartMesh, propShadowMesh } from './mesh-3d'
import { drawPropShadow, drawSolvedFaces, propLineWidth } from './draw'
import { propPreset, PROP_PRESETS } from './presets'
import type { Prop } from './target'

/**
 * Props in 3D scenes: the `prop` object kind for `@algorisys/tinyfly/scene-3d`.
 * A prop is named by its preset in plain data, stands on its object's ground
 * (y = 0 in its own space), faces +z before any turn, and is solved through
 * the scene's camera, so it is seen in perspective and drawn with the
 * figures' pens (clean, pencil, silhouette; solid or stick). It is drawn a
 * column at a time, each at its own depth among the scene's other things, and what is closer
 * than the camera's near plane is cut away.
 *
 * ```js
 * const scene = loadScene3D(json, { kinds: [characterObjects, propObjects] })
 * // { kind: 'prop', id: 'car', prop: 'car', position: [2, 0, 0], rotation: [0, 30, 0], values: { door: 1 } }
 * ```
 *
 * Its controls are tracks on the object (`stage/car` `door`, `wheelSpin`),
 * next to its `x`, `rotateY` and the rest.
 */

/** Values on a prop object that move or show the object, not its controls. */
const OBJECT_PROPERTIES = new Set([
  'x', 'y', 'z', 'position',
  'rotateX', 'rotateY', 'rotateZ', 'quaternion',
  'scale', 'scaleX', 'scaleY', 'scaleZ',
  'visible', 'opacity', 'color',
])

/** The prop is cut into columns about this many metres across, so a figure by one end of a bus sorts right against it. */
const SLICE = 1

export const propObjects: ObjectKind = {
  kind: 'prop',

  validate(object) {
    const o = object as PropObject3D & Record<string, unknown>
    const problems = typeof o.prop === 'string' && o.prop in PROP_PRESETS ? [] : [unknownName('prop preset', o.prop, Object.keys(PROP_PRESETS))]
    // Easy to write and silently ignored otherwise: an object is turned by `rotation`; `rotateY` is only a track.
    for (const [axis, field] of [[0, 'rotateX'], [1, 'rotateY'], [2, 'rotateZ']] as const) {
      if (field in o) problems.push(`${field} is a track, not a field: place it turned with rotation: [${[0, 1, 2].map((k) => (k === axis ? o[field] : 0)).join(', ')}]`)
    }
    return problems
  },

  prepare(object): Prop {
    const o = object as PropObject3D
    return propPreset(o.prop, o.options)
  },

  // `lights` may be missing from a scene entry older than this add-on: treated as none.
  resolve({ object, prepared, values, world, camera, lights = [], fog, toScreen }): ObjectView | null {
    const o = object as PropObject3D
    const prop = prepared as Prop
    const controls: Record<string, number> = { ...o.values }
    for (const [property, value] of values) {
      if (typeof value === 'number' && !OBJECT_PROPERTIES.has(property)) controls[property] = value
    }
    // The scene's camera turns and tilts it: its own `turn` and `tilt` stay at rest.
    controls.turn = 0
    controls.tilt = 0
    const modelView = mat4.multiply(camera.view, world)
    const view: ViewProjection = {
      toView: (v: Vec3) => mat4.transformPoint(modelView, v),
      toScreen: (v: Vec3) => toScreen(v),
    }
    // Nothing when its middle is behind the camera.
    const middle = view.toView([0, prop.rig.height / 2, 0])
    if (-middle[2] <= camera.near) return null
    // The mesh look: its parts as the scene's own meshes, placed where they are this frame.
    if (o.look === 'mesh') {
      const placed = propPartsInSpace(prop.rig, controls)
      // Faces no one can see (inside or against another part) are left out, as the pen look leaves them out.
      const inSpace = placed.map(({ part, local }) => ({ part: part.id, mesh: propShapeMesh(part.shape), ...placedMesh(propShapeMesh(part.shape), local) }))
      const solids = solidsOf(inSpace)
      const parts = placed
        .map((p, i) => ({ ...p, hidden: hiddenFaces(p.part.id, inSpace[i].mesh, p.local, inSpace[i].key, solids) }))
        .filter(({ opacity }) => opacity > 0.01)
        .map(({ part, matrix, glow, opacity, hidden }) => ({
          mesh: propPartMesh(part.shape, hidden),
          world: mat4.multiply(world, matrix),
          material: propPartMaterial(part, { glow, opacity }, { shading: o.shading, ink: o.ink, outline: o.outline }),
        }))
      return { meshes: o.shadow === false ? parts : [propShadowMesh(prop, controls, world), ...parts] }
    }
    // How many px a metre is at its middle, for its outline weight.
    const a = toScreen(middle)
    const b = toScreen(view.toView([0, prop.rig.height / 2 + 1, 0]))
    const scale = Math.hypot(b.x - a.x, b.y - a.y)
    // Lit by the scene's lights, as its meshes are (when it brings any): each face at its place in the world.
    const light = lights.length === 0 ? undefined : (middle: Vec3, normal: Vec3) => {
      const p = mat4.transformPoint(world, middle)
      const turned: Vec3 = [world[0] * normal[0] + world[4] * normal[1] + world[8] * normal[2], world[1] * normal[0] + world[5] * normal[1] + world[9] * normal[2], world[2] * normal[0] + world[6] * normal[1] + world[10] * normal[2]]
      const length = Math.hypot(...turned) || 1
      const rgb = lightAt(p, [turned[0] / length, turned[1] / length, turned[2] / length], lights)
      return { light: rgb, fog: fogAmount(fog, Math.hypot(p[0] - camera.position[0], p[1] - camera.position[1], p[2] - camera.position[2])) }
    }
    const solved = solveProp(prop.rig, controls, view, scale, { perspective: true, near: camera.near, slice: SLICE, light })
    const draw = { look: o.look, style: o.style, ink: o.ink, paper: o.paper, fog: fog?.color }
    const lineWidth = propLineWidth(solved)
    // The prop is drawn a column at a time, each at its own depth, so what stands among its parts sorts with
    // them: a figure walking past a bus is covered by its front and covers its back. The shadow lies under all of it.
    const cells = solved.cells ?? []
    const farthest = Math.max(...cells.map((cell) => -cell.depth), -middle[2])
    return {
      drawables: [
        ...(o.shadow === false ? [] : [{ depth: farthest + prop.rig.length, draw: (ctx: CanvasRenderingContext2D) => drawPropShadow(ctx, solved, draw) }]),
        ...cells.map((cell) => ({
          depth: -cell.depth,
          draw(ctx: CanvasRenderingContext2D, frame: { time: number }) {
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            drawSolvedFaces(ctx, cell.parts, lineWidth, { ...draw, time: frame.time })
          },
        })),
      ],
    }
  },
}
