import { describe, it, expect } from 'vitest'
import { mat4, quat } from '../../engine/math'
import { normalMatrix3, packLights, surfaceUniforms } from './gl-data'
import { LIGHT_CODE, MAX_LIGHTS, SHADING_CODE, SURFACE_FRAGMENT } from './shaders'
import type { ResolvedLight } from '../resolve-scene'

describe('WebGL2 packing', () => {
  it('packs lights into uniform arrays, with the default pair when there are none', () => {
    const lights: ResolvedLight[] = [
      { id: 'a', light: 'ambient', color: '#ff0000', intensity: 0.5, position: [0, 0, 0], direction: [0, -1, 0], angle: 30 },
      { id: 's', light: 'spot', color: '#ffffff', intensity: 2, position: [1, 2, 3], direction: [0, -1, 0], range: 9, angle: 20 },
    ]
    const packed = packLights(lights)
    expect(packed.count).toBe(2)
    expect([...packed.kind.slice(0, 2)]).toEqual([LIGHT_CODE.ambient, LIGHT_CODE.spot])
    expect([...packed.color.slice(0, 3)]).toEqual([1, 0, 0])
    expect([...packed.position.slice(3, 6)]).toEqual([1, 2, 3])
    expect(packed.range[1]).toBe(9)
    expect(packed.cone[2]).toBeCloseTo(Math.cos((20 * Math.PI) / 180), 6)
    expect(packed.cone[3]).toBeCloseTo(Math.cos((16 * Math.PI) / 180), 6)
    expect(packLights([]).count).toBe(2)
    const many = Array.from({ length: 12 }, () => lights[0])
    expect(packLights(many).count).toBe(MAX_LIGHTS)
  })

  it('numbers materials for the shader, an object colour over the material', () => {
    const toon = surfaceUniforms({ color: '#0000ff', shading: 'toon', bands: 4 }, undefined, 0.5)
    expect(toon).toEqual({ color: [0, 0, 1], opacity: 0.5, shading: SHADING_CODE.toon, bands: 4 })
    expect(surfaceUniforms({ color: '#0000ff' }, '#00ff00', 1).color).toEqual([0, 1, 0])
    expect(surfaceUniforms({ color: '#0000ff' }, undefined, 1).shading).toBe(SHADING_CODE.lambert)
  })

  it('turns normals as the inverse transpose: a stretched sphere stays round to the light', () => {
    const m = mat4.compose([5, 6, 7], quat.fromAxisAngle([0, 0, 1], 90), [2, 1, 1])
    const n = normalMatrix3(m)
    // A normal along +x on the unturned object: after scale and a 90° turn it points along +y (unit after normalising).
    const nx = n[0] * 1, ny = n[1] * 1, nz = n[2] * 1
    const length = Math.hypot(nx, ny, nz)
    expect(nx / length).toBeCloseTo(0, 6)
    expect(ny / length).toBeCloseTo(1, 6)
    expect(nz / length).toBeCloseTo(0, 6)
  })

  it('the fragment shader carries the same light model as the Canvas renderer', () => {
    for (const piece of ['smoothstep', 'pow(max(0.0, 1.0 - distance / u_lightRange[i]), 2.0)', 'max(light.r, max(light.g, light.b))', 'u_fogRange']) {
      expect(SURFACE_FRAGMENT).toContain(piece)
    }
  })
})
