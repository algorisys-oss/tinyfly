/**
 * `@algorisys/tinyfly/scene-3d/webgl`: the WebGL2 renderer for 3D scenes. A
 * depth buffer, light per pixel and inverted-hull outlines, for scenes too
 * big or too tangled for the Canvas 2D renderer. Its own entry, so pages
 * without it never download it.
 *
 * ```js
 * import { loadScene3D, resolveScene3D } from '@algorisys/tinyfly/scene-3d'
 * import { WebGL2Renderer } from '@algorisys/tinyfly/scene-3d/webgl'
 * const renderer = new WebGL2Renderer(canvas.getContext('webgl2'), { overlay })
 * renderer.render(resolveScene3D(scene, values, { width, height }))
 * ```
 */
export { WebGL2Renderer } from './webgl2-renderer'
export { packLights, surfaceUniforms, normalMatrix3, type LightUniforms } from './gl-data'
export { MAX_LIGHTS, SHADING_CODE, LIGHT_CODE } from './shaders'
