/**
 * `@algorisys/tinyfly/scene-3d`: 3D scenes as JSON (cameras, lights,
 * meshes), animated by ordinary tracks addressed to `<sceneId>/<objectId>`,
 * drawn by a Canvas 2D renderer in the stylized look (flat, smooth, toon,
 * outlines, fog) in browsers, Workers and Node. No DOM, no GPU, no glTF
 * here: those are separate entries, so this one stays small.
 */
export type * from './scene-types'
export { validateScene3D } from './validate-scene'
export { loadScene3D, prepareMesh, type LoadedScene3D, type PreparedMesh } from './load-scene'
export { resolveScene3D, type ResolvedScene3D, type ResolvedCamera, type ResolvedLight, type DrawTriangle, type SceneValues, type ScreenPoint, type ResolveOptions } from './resolve-scene'
export { lookAtView, orbitPosition, dollyPosition, projectionMatrix } from './camera'
export { shadeTriangle, lightAt, fogAmount, parseColor } from './shading'
export { Canvas2DRenderer, drawResolvedScene, type Renderer3D } from './canvas-2d-renderer'
export { Scene3DAdapter, drawScene3D } from './scene-3d-adapter'
export { boxMesh, planeMesh, sphereMesh, cylinderMesh, coneMesh, torusMesh, geometryMesh } from './geometry/primitives'
export { MeshBuilder, meshEdges, type Mesh, type MeshEdge } from './geometry/mesh'
export { extrudeMesh, type ExtrudeOptions } from './geometry/extrude'
export { triangulate, signedArea, pointInPolygon, type Point2 } from './geometry/triangulate'
