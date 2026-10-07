import { mat4, type Mat4, type Vec3 } from '../../engine/math'
import { prepareMesh, type PreparedMesh } from '../../scene-3d/load-scene'
import type { PlacedMesh } from '../../scene-3d/object-kind'
import { cylinderMesh } from '../../scene-3d/geometry/primitives'
import type { Material3D } from '../../scene-3d/scene-types'
import { controlValue, propShapeMesh, type PropPart, type SolvedPart } from './rig'
import type { Prop } from './target'
import type { PropShape } from './shapes'

/**
 * A prop's parts as the scene's own meshes (a prop object's `look: 'mesh'`):
 * shaded by the scene's lights, outlined along silhouettes and creases, and
 * sorted triangle by triangle with everything else, or with a depth buffer by
 * the WebGL2 renderer, so the order is exact. Each part's shape is built
 * once; a frame only places it.
 */

const cache = new WeakMap<PropShape, Map<string, PreparedMesh>>()

/**
 * A part's shape as a scene mesh: its faces fanned into triangles, wound so
 * they face the way the face does, leaving out the faces `hidden` says no
 * one can see (inside or against another part).
 */
export function propPartMesh(shape: PropShape, hidden?: boolean[]): PreparedMesh {
  const key = hidden?.some(Boolean) ? hidden.map((h) => (h ? 1 : 0)).join('') : ''
  let byKey = cache.get(shape)
  if (!byKey) cache.set(shape, (byKey = new Map()))
  const known = byKey.get(key)
  if (known) return known
  const source = propShapeMesh(shape)
  const mesh = { vertices: source.vertices, faces: source.faces.filter((_, f) => !hidden?.[f]) }
  const positions = mesh.vertices.flatMap((v) => [v[0], v[1], v[2]])
  // Corners stay shared between faces, so the scene finds the edges between them (outlines, creases);
  // each corner's normal is the average of its faces' (what smooth shading reads).
  const sums: Vec3[] = mesh.vertices.map(() => [0, 0, 0])
  const indices: number[] = []
  mesh.faces.forEach((face) => {
    for (const c of face.corners) for (const k of [0, 1, 2]) sums[c][k] += face.normal[k]
    const [first, ...rest] = face.corners
    for (let i = 0; i + 1 < rest.length; i++) {
      const [a, b, c] = [first, rest[i], rest[i + 1]]
      const [pa, pb, pc] = [mesh.vertices[a], mesh.vertices[b], mesh.vertices[c]]
      const u = [pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]]
      const v = [pc[0] - pa[0], pc[1] - pa[1], pc[2] - pa[2]]
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
      const along = n[0] * face.normal[0] + n[1] * face.normal[1] + n[2] * face.normal[2]
      indices.push(...(along >= 0 ? [a, b, c] : [a, c, b]))
    }
  })
  const normals = sums.flatMap((n) => {
    const length = Math.hypot(...n) || 1
    return [n[0] / length, n[1] / length, n[2] / length]
  })
  const prepared = prepareMesh({ positions, normals, indices })
  if (byKey.size >= 16) byKey.clear()
  byKey.set(key, prepared)
  return prepared
}

export interface PropMeshLook {
  /** How it is lit (default toon) */
  shading?: Material3D['shading']
  /** Outline colour (default near-black), and width in px (default 2; × each part's `outline`) */
  ink?: string
  outline?: number
}

/** How a part looks as a mesh: its fill, lit; its glow as light of its own; glass see-through; faded as it fades. */
export function propPartMaterial(part: PropPart, solved: Pick<SolvedPart, 'glow' | 'opacity'>, look: PropMeshLook = {}): Material3D {
  const ink = part.ink ?? look.ink ?? '#26262b'
  const width = (look.outline ?? 2) * (part.outline ?? 1)
  const glowing = part.glow && solved.glow > 0 ? scaleHex(part.glow.color, solved.glow) : undefined
  return {
    // A part with no fill (a spoked wheel's wire) is drawn in its ink.
    color: part.fill ?? ink,
    // A smooth shape (an ellipsoid, a tube) shows only its silhouette, not the facets it is built of.
    creases: propShapeMesh(part.shape).creases !== false,
    shading: look.shading ?? 'toon',
    ...(width > 0 ? { outline: { width, color: ink } } : {}),
    ...(glowing ? { emissive: glowing } : {}),
    ...(part.seeThrough ? { opacity: 0.45 * solved.opacity } : solved.opacity < 1 ? { opacity: solved.opacity } : {}),
  }
}

/** A `#rrggbb` colour scaled toward black by `t` (light of its own, as much as it glows). */
function scaleHex(color: string, t: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(color.trim())
  if (!match) return color
  const channels = [0, 2, 4].map((i) => Math.round(parseInt(match[1].slice(i, i + 2), 16) * Math.max(0, Math.min(1, t))))
  return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

const DISC = prepareMesh(cylinderMesh(1, 0.002, 28))

/** Its contact shadow as a mesh: a soft dark ellipse on the ground under it, smaller and fainter as it lifts. */
export function propShadowMesh(prop: Prop, values: Record<string, number>, world: Mat4): PlacedMesh {
  const rig = prop.rig
  const [across, along] = rig.footprint ?? [rig.length * 0.45, rig.length]
  const lift = Math.max(0, controlValue(rig, values, 'lift'))
  const shrink = Math.max(0, controlValue(rig, values, 'size')) / (1 + lift * 0.8)
  return {
    mesh: DISC,
    world: mat4.multiply(world, mat4.compose([0, 0.004, 0], [0, 0, 0, 1], [across * 0.55 * shrink || 1e-4, 1, along * 0.55 * shrink || 1e-4])),
    material: { color: '#000000', shading: 'unlit', opacity: 0.16 * shrink },
  }
}

