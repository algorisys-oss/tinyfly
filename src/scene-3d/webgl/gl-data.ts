import type { ResolvedLight } from '../resolve-scene'
import { parseColor } from '../shading'
import { LIGHT_CODE, MAX_LIGHTS, SHADING_CODE } from './shaders'
import type { Material3D } from '../scene-types'
import { mat4, vec3 } from '../../engine/math'

/**
 * Pure packing for the WebGL2 renderer: lights into uniform arrays, materials
 * into shader numbers, normal matrices. No GL here, so it is tested in Node.
 */

export interface LightUniforms {
  count: number
  kind: Int32Array
  color: Float32Array
  intensity: Float32Array
  position: Float32Array
  direction: Float32Array
  range: Float32Array
  /** Spot cone: cos(outer angle), cos(inner angle) */
  cone: Float32Array
}

/** The soft default light of `shading.ts`, for scenes with no lights. */
const DEFAULT_LIGHTS: ResolvedLight[] = [
  { id: 'default-ambient', light: 'ambient', color: '#ffffff', intensity: 0.35, position: [0, 0, 0], direction: [0, -1, 0], angle: 30 },
  { id: 'default-key', light: 'directional', color: '#ffffff', intensity: 0.8, position: [3, 5, 4], direction: vec3.normalize([-3, -5, -4]), angle: 30 },
]

/** The scene's lights as uniform arrays (the first {@link MAX_LIGHTS}; the default pair when there are none). */
export function packLights(lights: ResolvedLight[]): LightUniforms {
  const used = (lights.length > 0 ? lights : DEFAULT_LIGHTS).slice(0, MAX_LIGHTS)
  const out: LightUniforms = {
    count: used.length,
    kind: new Int32Array(MAX_LIGHTS),
    color: new Float32Array(MAX_LIGHTS * 3),
    intensity: new Float32Array(MAX_LIGHTS),
    position: new Float32Array(MAX_LIGHTS * 3),
    direction: new Float32Array(MAX_LIGHTS * 3),
    range: new Float32Array(MAX_LIGHTS),
    cone: new Float32Array(MAX_LIGHTS * 2),
  }
  used.forEach((light, i) => {
    out.kind[i] = LIGHT_CODE[light.light]
    out.color.set(parseColor(light.color), i * 3)
    out.intensity[i] = light.intensity
    out.position.set(light.position, i * 3)
    out.direction.set(light.direction, i * 3)
    out.range[i] = light.range ?? 0
    out.cone[i * 2] = Math.cos((light.angle * Math.PI) / 180)
    out.cone[i * 2 + 1] = Math.cos((light.angle * 0.8 * Math.PI) / 180)
  })
  return out
}

/** A material's numbers for the surface shader, with an object's own colour and opacity over it. */
export function surfaceUniforms(material: Material3D, color: string | undefined, opacity: number) {
  return {
    color: parseColor(color ?? material.color),
    emissive: material.emissive ? parseColor(material.emissive) : ([0, 0, 0] as [number, number, number]),
    opacity,
    shading: SHADING_CODE[material.shading ?? 'lambert'],
    bands: material.bands ?? 3,
  }
}

/** The 3×3 normal matrix (inverse transpose of the upper 3×3), column-major, from a column-major 4×4. */
export function normalMatrix3(m: number[]): Float32Array {
  const n = mat4.transpose(mat4.invert(m) ?? mat4.identity())
  return new Float32Array([n[0], n[1], n[2], n[4], n[5], n[6], n[8], n[9], n[10]])
}
