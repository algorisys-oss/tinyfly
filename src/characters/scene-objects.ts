import { mat4, quat, vec3, type Mat4, type Vec3 } from '../engine/math'
import type { ObjectKind, ObjectView, PlacedMesh } from '../scene-3d/object-kind'
import type { CharacterObject3D, Material3D } from '../scene-3d/scene-types'
import { cylinderMesh, sphereMesh } from '../scene-3d/geometry/primitives'
import { prepareMesh, type PreparedMesh } from '../scene-3d/load-scene'
import type { BodyPlan, Pose } from './rig/body-plan'
import { stagePlanSpace, type StagedSpace, type ViewProjection } from './rig/skeleton'
import { character, drawCharacterInView, type Character, type CharacterOptions } from './character'
import { HUMAN_REST } from './species/human'

/**
 * Characters in 3D scenes: the `character` object kind for
 * `@algorisys/tinyfly/scene-3d`. A character stands on its object's ground
 * (y = 0 in its own space, so a character at y 0 stands on the floor), faces
 * +z before any turn, and is drawn by the scene's camera in its look: clean,
 * pencil or silhouette, with its face and hands.
 *
 * ```js
 * import { loadScene3D } from '@algorisys/tinyfly/scene-3d'
 * import { characterObjects } from '@algorisys/tinyfly/characters'
 * const scene = loadScene3D(json, { kinds: [characterObjects] })
 * ```
 *
 * Its pose fields are tracks on the object too (`stage/hero` `arm.right.spread`,
 * `turn`, …), next to its `x`, `rotateY` and the rest.
 */

/** Values on a character object that move or show the object, not pose it. */
const OBJECT_PROPERTIES = new Set([
  'x', 'y', 'z', 'position',
  'rotateX', 'rotateY', 'rotateZ', 'quaternion',
  'scale', 'scaleX', 'scaleY', 'scaleZ',
  'visible', 'opacity', 'color',
])

/** The default height of a person, metres. */
const DEFAULT_HEIGHT = 1.7

/** A soft shadow on the ground under the hips: a projected ellipse. */
function drawShadow(ctx: CanvasRenderingContext2D, projection: ViewProjection, radius: number): void {
  const points = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2
    const view = projection.toView([Math.cos(a) * radius, 0, Math.sin(a) * radius * 0.8])
    return view[2] < -1e-3 ? projection.toScreen(view) : null
  })
  if (points.some((p) => p === null)) return
  ctx.beginPath()
  points.forEach((p, i) => (i === 0 ? ctx.moveTo(p!.x, p!.y) : ctx.lineTo(p!.x, p!.y)))
  ctx.closePath()
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)'
  ctx.fill()
}

/** Unit shapes the solid look scales onto each bone, built once. */
interface Prepared {
  who: Character
  cylinder: PreparedMesh
  sphere: PreparedMesh
}

/** Turns +y onto `direction` (unit). */
function alignUp(direction: Vec3): Mat4 {
  const d = vec3.dot([0, 1, 0], direction)
  if (d > 0.999999) return mat4.identity()
  if (d < -0.999999) return mat4.fromQuat(quat.fromAxisAngle([1, 0, 0], 180))
  const axis = vec3.cross([0, 1, 0], direction)
  return mat4.fromQuat(quat.fromAxisAngle(axis, (Math.acos(d) * 180) / Math.PI))
}

/**
 * The solid look: a capsule along every bone (thick as the bone's own width),
 * skin-coloured hands and an ellipsoid head with two eyes, placed in the
 * object's world.
 */
function solidMeshes(o: CharacterObject3D, prepared: Prepared, plan: BodyPlan, staged: StagedSpace, world: Mat4): PlacedMesh[] {
  const look = o.solid ?? {}
  const outline = look.outline === false ? undefined : (look.outline ?? { width: 2, color: '#0f172a' })
  const body: Material3D = { color: look.color ?? '#475569', shading: look.shading ?? 'toon', outline }
  const skin: Material3D = { color: look.skin ?? '#f2c49b', shading: look.shading ?? 'toon', outline }
  const eye: Material3D = { color: '#0f172a', shading: 'unlit' }
  const unit = staged.height * 0.034
  const placed: PlacedMesh[] = []
  const put = (mesh: PreparedMesh, local: Mat4, material: Material3D) => placed.push({ mesh, world: mat4.multiply(world, local), material })
  const ball = (at: Vec3, r: number, material: Material3D) => put(prepared.sphere, mat4.compose(at, [0, 0, 0, 1], [r, r, r]), material)
  for (const chain of plan.chains) {
    const joints = staged.chains[chain.id]
    const thick = chain.id === 'spine' ? 1.9 : 1
    chain.bones.forEach((bone, i) => {
      const a = joints[i]
      const b = joints[i + 1]
      const length = vec3.distance(a, b)
      const [w0, w1] = bone.width ?? [1, 1]
      const r = unit * thick * (w0 + w1) / 2
      if (length > 1e-6) {
        const middle = vec3.lerp(a, b, 0.5)
        const turn = alignUp(vec3.normalize(vec3.subtract(b, a)))
        put(prepared.cylinder, mat4.multiply(mat4.translation(middle), mat4.multiply(turn, mat4.scaling([r, length, r]))), body)
      }
      ball(a, unit * thick * w0, body)
      ball(b, unit * thick * w1, body)
    })
    // Hands: the end of each arm.
    if (chain.id.startsWith('arm.')) ball(joints[joints.length - 1], unit * 1.5, skin)
  }
  // The head: an ellipsoid along its own axes, with two eyes on its front.
  const { center, rx, ry, axes } = staged.head
  const basis: Mat4 = [...axes[0], 0, ...axes[1], 0, ...axes[2], 0, ...center, 1]
  put(prepared.sphere, mat4.multiply(basis, mat4.scaling([rx, ry, rx])), skin)
  // Eyes: thin discs just outside the head's surface, so they always sort in front of it.
  for (const side of [-1, 1]) {
    const d = vec3.normalize([side * 0.36, 0.15, 0.92])
    const on = vec3.add(center, vec3.add(vec3.add(vec3.scale(axes[0], d[0] * rx * 1.04), vec3.scale(axes[1], d[1] * ry * 1.04)), vec3.scale(axes[2], d[2] * rx * 1.04)))
    const disc: Mat4 = [...axes[0], 0, ...axes[1], 0, ...axes[2], 0, ...on, 1]
    put(prepared.sphere, mat4.multiply(disc, mat4.scaling([rx * 0.11, ry * 0.14, rx * 0.03])), eye)
  }
  return placed
}

export const characterObjects: ObjectKind = {
  kind: 'character',

  validate(object) {
    const o = object as CharacterObject3D
    return o.height !== undefined && !(o.height > 0) ? ['a character\'s height must be positive'] : []
  },

  prepare(object): Prepared {
    // Proportions only: the size comes from the scene (its height, the camera).
    return {
      who: character({ ...((object as CharacterObject3D).character as CharacterOptions | undefined), height: 1 }),
      cylinder: prepareMesh(cylinderMesh(1, 1, 16)),
      sphere: prepareMesh(sphereMesh(1, 20)),
    }
  },

  resolve({ object, prepared, values, world, camera, toScreen }): ObjectView | null {
    const o = object as CharacterObject3D
    const parts = prepared as Prepared
    const who = parts.who
    const pose: Pose = { ...HUMAN_REST, ...o.pose }
    for (const [property, value] of values) {
      if (typeof value === 'number' && !OBJECT_PROPERTIES.has(property)) pose[property] = value
    }
    const height = o.height ?? DEFAULT_HEIGHT
    const modelView = mat4.multiply(camera.view, world)
    const projection: ViewProjection = {
      toView: (v: Vec3) => mat4.transformPoint(modelView, v),
      toScreen: (v: Vec3) => toScreen(v),
    }
    // Drawn whole at the depth of its middle; nothing when that is behind the camera.
    const middle = projection.toView([0, height / 2, 0])
    const depth = -middle[2]
    if (depth <= camera.near) return null
    // The shadow lies on the ground under it: drawn before anything of it.
    const shadow = o.shadow === false ? [] : [{ depth: depth + height, draw: (ctx: CanvasRenderingContext2D) => drawShadow(ctx, projection, height * 0.18) }]
    if (o.look === 'solid') {
      const staged = stagePlanSpace(who.plan, pose, { height, contact: who.contact })
      return { meshes: solidMeshes(o, parts, who.plan, staged, world), drawables: shadow }
    }
    return {
      drawables: [
        ...shadow,
        {
          depth,
          draw(ctx, frame) {
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            drawCharacterInView(ctx, who, pose, projection, { height, time: frame.time })
          },
        },
      ],
    }
  },
}
