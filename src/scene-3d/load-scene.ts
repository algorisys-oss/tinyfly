import type { Object3D, Scene3D } from './scene-types'
import type { ObjectKind } from './object-kind'
import { geometryMesh } from './geometry/primitives'
import { meshEdges, type Mesh } from './geometry/mesh'
import { validateScene3D } from './validate-scene'

/** A mesh with what outlines need: for each triangle, its three edges and the triangle across each (-1: none). */
export interface PreparedMesh extends Mesh {
  faceEdges: Array<Array<{ a: number; b: number; across: number }>>
}

/** A scene ready to render: validated, with its meshes built once. */
export interface LoadedScene3D {
  scene: Scene3D
  meshes: Map<string, PreparedMesh>
  /** Object kinds added at load (characters), by kind */
  kinds: Map<string, ObjectKind>
  /** What each such kind prepared for each of its objects, by id */
  prepared: Map<string, unknown>
}

export interface LoadOptions {
  /** Object kinds beyond the built-in ones, such as `characterObjects` from the characters add-on */
  kinds?: ObjectKind[]
}

export function prepareMesh(mesh: Mesh): PreparedMesh {
  const faceEdges: PreparedMesh['faceEdges'] = Array.from({ length: mesh.indices.length / 3 }, () => [])
  for (const edge of meshEdges(mesh)) {
    for (const face of edge.faces) {
      const across = edge.faces.find((other) => other !== face) ?? -1
      faceEdges[face].push({ a: edge.a, b: edge.b, across })
    }
  }
  return { ...mesh, faceEdges }
}

/**
 * Check a scene and build its meshes. Rendering a frame never loads or builds
 * anything, so frames stay quick, pure and in any order. Throws with every
 * problem listed when the scene is not valid.
 */
export function loadScene3D(scene: Scene3D, options: LoadOptions = {}): LoadedScene3D {
  const kinds = new Map((options.kinds ?? []).map((kind) => [kind.kind, kind]))
  const errors = validateScene3D(scene)
  for (const object of scene.objects as Object3D[]) {
    if (BUILT_IN.has(object.kind)) continue
    const kind = kinds.get(object.kind)
    if (!kind) errors.push(`"${object.id}" is a ${object.kind}: load the scene with that kind (for characters: loadScene3D(scene, { kinds: [characterObjects] }), from @algorisys/tinyfly/characters)`)
    else errors.push(...(kind.validate?.(object) ?? []).map((problem) => `"${object.id}": ${problem}`))
  }
  if (errors.length > 0) throw new Error(`scene-3d: "${scene.id}" is not valid:\n- ${errors.join('\n- ')}`)
  const meshes = new Map<string, PreparedMesh>()
  const prepared = new Map<string, unknown>()
  for (const object of scene.objects) {
    if (object.kind === 'mesh') meshes.set(object.id, prepareMesh(geometryMesh(object.geometry)))
    const kind = kinds.get(object.kind)
    if (kind?.prepare) prepared.set(object.id, kind.prepare(object))
  }
  return { scene, meshes, kinds, prepared }
}

const BUILT_IN = new Set(['group', 'mesh', 'camera', 'light', 'line', 'trail'])
