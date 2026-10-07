import { mat4, type Mat4, type Vec3 } from '../../engine/math'
import type { Mesh } from './shapes'

/**
 * Faces no one can see: inside another solid part of the same prop, or lying
 * against one of its faces (a house's wall tops under its roof, a car body's
 * top under its cabin, a tyre's tread inside the fender, the top of a leg
 * inside a horse's barrel). Drawn face by face among other things (a 3D
 * scene), such faces would show wherever the order of the faces in front is
 * not exact; left out, their edges become outlines where the parts meet.
 * Only whole faces are left out: where a part sits partly into another (a
 * cabin into a car's body), its `layer` says which is drawn over.
 *
 * Only convex closed shapes hide faces (boxes, cylinders, ellipsoids, convex
 * profiles): for them, inside is behind every face's plane.
 */

export interface Solid {
  part: string
  /** Where it is (its placement's cache key) */
  key: string
  planes: Array<{ normal: Vec3; offset: number }>
  low: Vec3
  high: Vec3
}

/** How close to a plane counts as on it, metres. */
const ON = 0.004
/** How far a face may stick out past a side it stands across and still be inside, metres. */
const POKE = 0.05

const convexCache = new WeakMap<Mesh, boolean>()

/** A closed mesh with every point behind every face's plane. */
function isConvex(mesh: Mesh): boolean {
  let known = convexCache.get(mesh)
  if (known === undefined) {
    known =
      !mesh.joined && !mesh.walls && mesh.faces.length >= 4 &&
      mesh.faces.every((face) => {
        const p = mesh.vertices[face.corners[0]]
        return mesh.vertices.every((v) => face.normal[0] * (v[0] - p[0]) + face.normal[1] * (v[1] - p[1]) + face.normal[2] * (v[2] - p[2]) <= 1e-6)
      })
    convexCache.set(mesh, known)
  }
  return known
}

const solidCache = new WeakMap<Mesh, Solid['planes']>()

/** The prop's convex solid parts, from their meshes placed in one space (with their bounds there). */
export function solidsOf(parts: Array<{ part: string; key: string; mesh: Mesh; inSpace: Mesh; low: Vec3; high: Vec3 }>): Solid[] {
  return parts
    .filter(({ mesh }) => isConvex(mesh))
    .map(({ part, key, inSpace, low, high }) => {
      let planes = solidCache.get(inSpace)
      if (!planes) {
        planes = inSpace.faces.map((face) => {
          const p = inSpace.vertices[face.corners[0]]
          return { normal: face.normal, offset: face.normal[0] * p[0] + face.normal[1] * p[1] + face.normal[2] * p[2] }
        })
        solidCache.set(inSpace, planes)
      }
      return { part, key, planes, low, high }
    })
}

/**
 * Whether a face of `part` (its corners and outward normal, in the prop's
 * space) is hidden by another solid: all of it inside, or on one of its faces
 * and facing into it. A face may stick a little out past a side it stands
 * across (a tyre's tread past a car's side), not past one it lies along (a
 * door on a car's side shows).
 */
export function isHidden(part: string, corners: Vec3[], normal: Vec3, solids: Solid[]): boolean {
  const middle = corners.reduce<Vec3>((sum, p) => [sum[0] + p[0] / corners.length, sum[1] + p[1] / corners.length, sum[2] + p[2] / corners.length], [0, 0, 0])
  for (const solid of solids) {
    if (solid.part === part) continue
    if ([0, 1, 2].some((k) => middle[k] < solid.low[k] - POKE || middle[k] > solid.high[k] + POKE)) continue
    const hidden = solid.planes.every((plane) => {
      const facing = plane.normal[0] * normal[0] + plane.normal[1] * normal[1] + plane.normal[2] * normal[2]
      const sides = corners.map((p) => plane.normal[0] * p[0] + plane.normal[1] * p[1] + plane.normal[2] * p[2] - plane.offset)
      // Lying on this face: hidden only when it faces into the solid (a wall top against a roof's underside).
      if (sides.every((side) => Math.abs(side) <= ON)) return facing < -0.9
      const allowed = Math.abs(facing) < 0.5 ? POKE : ON
      return sides.every((side) => side <= allowed)
    })
    if (hidden) return true
  }
  return false
}

const hiddenCache = new WeakMap<Mesh, Map<string, boolean[]>>()

/**
 * Which faces of a part (or a cut piece of one) are hidden, by face index,
 * with `local` placing its mesh among `solids`. Cached by where it and the
 * solids are, so a prop that holds still pays for this once.
 */
export function hiddenFaces(part: string, mesh: Mesh, local: Mat4, localKey: string, solids: Solid[]): boolean[] {
  const key = `${localKey}|${solids.map((solid) => solid.key).join(';')}`
  let byKey = hiddenCache.get(mesh)
  if (!byKey) hiddenCache.set(mesh, (byKey = new Map()))
  let flags = byKey.get(key)
  if (!flags) {
    if (byKey.size >= 48) byKey.clear()
    const turn = (v: Vec3): Vec3 => {
      const n: Vec3 = [local[0] * v[0] + local[4] * v[1] + local[8] * v[2], local[1] * v[0] + local[5] * v[1] + local[9] * v[2], local[2] * v[0] + local[6] * v[1] + local[10] * v[2]]
      const length = Math.hypot(...n) || 1
      return [n[0] / length, n[1] / length, n[2] / length]
    }
    const placed = mesh.vertices.map((v) => mat4.transformPoint(local, v))
    flags = mesh.faces.map((face) => isHidden(part, face.corners.map((c) => placed[c]), turn(face.normal), solids))
    byKey.set(key, flags)
  }
  return flags
}

