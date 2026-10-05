import type { Scene3D } from './scene-types'
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
export function loadScene3D(scene: Scene3D): LoadedScene3D {
  const errors = validateScene3D(scene)
  if (errors.length > 0) throw new Error(`scene-3d: "${scene.id}" is not valid:\n- ${errors.join('\n- ')}`)
  const meshes = new Map<string, PreparedMesh>()
  for (const object of scene.objects) {
    if (object.kind === 'mesh') meshes.set(object.id, prepareMesh(geometryMesh(object.geometry)))
  }
  return { scene, meshes }
}
