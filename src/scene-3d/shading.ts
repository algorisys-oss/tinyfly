import { vec3, type Vec3 } from '../engine/math'
import type { DrawTriangle, ResolvedCamera, ResolvedLight, ResolvedScene3D } from './resolve-scene'

/**
 * Stylized shading, pure: the colour of one triangle under the scene's
 * lights, as flat, smooth (lambert) or banded (toon) light, then fog. Light
 * intensity is a multiplier here (1 is full light); a point or spot light
 * fades to nothing at its `range`.
 */

export type Rgb = [number, number, number]

const COLOR_CACHE = new Map<string, Rgb>()

/** `#rgb`, `#rrggbb`, `rgb()` / `rgba()` as 0..1 channels; anything else is white. */
export function parseColor(color: string): Rgb {
  const cached = COLOR_CACHE.get(color)
  if (cached) return cached
  let rgb: Rgb = [1, 1, 1]
  const hex = color.trim().replace('#', '')
  if (color.trim().startsWith('#') && (hex.length === 3 || hex.length === 6)) {
    const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex
    rgb = [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16) / 255) as Rgb
  } else {
    const match = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/)
    if (match) rgb = [Number(match[1]) / 255, Number(match[2]) / 255, Number(match[3]) / 255]
  }
  if (COLOR_CACHE.size < 512) COLOR_CACHE.set(color, rgb)
  return rgb
}

/** A soft key light from upper right, plus ambient, for scenes that bring no lights of their own. */
const DEFAULT_LIGHTS: ResolvedLight[] = [
  { id: 'default-ambient', light: 'ambient', color: '#ffffff', intensity: 0.35, position: [0, 0, 0], direction: [0, -1, 0], angle: 30 },
  { id: 'default-key', light: 'directional', color: '#ffffff', intensity: 0.8, position: [3, 5, 4], direction: vec3.normalize([-3, -5, -4]), angle: 30 },
]

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/** The light reaching point `p` with normal `n`, as RGB (can exceed 1). */
export function lightAt(p: Vec3, n: Vec3, lights: ResolvedLight[]): Rgb {
  const total: Rgb = [0, 0, 0]
  for (const light of lights) {
    const color = parseColor(light.color)
    let amount: number
    if (light.light === 'ambient') {
      amount = light.intensity
    } else if (light.light === 'directional') {
      amount = light.intensity * Math.max(0, -vec3.dot(n, light.direction))
    } else {
      const toLight = vec3.subtract(light.position, p)
      const distance = vec3.length(toLight)
      const l = distance > 0 ? vec3.scale(toLight, 1 / distance) : n
      const fade = light.range ? Math.max(0, 1 - distance / light.range) ** 2 : 1
      amount = light.intensity * Math.max(0, vec3.dot(n, l)) * fade
      if (light.light === 'spot') {
        const outer = Math.cos((light.angle * Math.PI) / 180)
        const inner = Math.cos((light.angle * 0.8 * Math.PI) / 180)
        amount *= smoothstep(outer, inner, -vec3.dot(l, light.direction))
      }
    }
    total[0] += color[0] * amount
    total[1] += color[1] * amount
    total[2] += color[2] * amount
  }
  return total
}

/** Light quantised into `bands` steps, for the toon look. */
function band(value: number, bands: number): number {
  const steps = Math.max(2, Math.round(bands))
  return Math.min(1.2, Math.ceil(Math.min(1, value) * steps - 1e-9) / steps)
}

/** How much fog covers a point `distance` metres from the camera, 0..1. */
export function fogAmount(fog: ResolvedScene3D['fog'], distance: number): number {
  if (!fog) return 0
  return Math.min(1, Math.max(0, (distance - fog.near) / (fog.far - fog.near)))
}

/** The fill of one triangle: a CSS colour and its opacity. */
export function shadeTriangle(
  triangle: DrawTriangle,
  lights: ResolvedLight[],
  camera: ResolvedCamera,
  fog?: ResolvedScene3D['fog']
): { color: string; alpha: number } {
  const material = triangle.material
  const base = parseColor(triangle.color ?? material.color)
  const shading = material.shading ?? 'lambert'
  let rgb: Rgb
  if (shading === 'unlit') {
    rgb = [...base] as Rgb
  } else {
    const active = lights.length > 0 ? lights : DEFAULT_LIGHTS
    let light: Rgb
    if (shading === 'lambert') {
      // Average the light the three corners' smooth normals receive: curved shapes read as round.
      const sum: Rgb = [0, 0, 0]
      for (const n of triangle.vertexNormals) {
        const l = lightAt(triangle.centroid, n, active)
        sum[0] += l[0] / 3
        sum[1] += l[1] / 3
        sum[2] += l[2] / 3
      }
      light = sum
    } else {
      light = lightAt(triangle.centroid, triangle.normal, active)
      if (shading === 'toon') {
        // Band the brightness, not each channel, so coloured lights keep their hue.
        const level = Math.max(light[0], light[1], light[2])
        const scale = level > 0 ? band(level, material.bands ?? 3) / level : 0
        light = [light[0] * scale, light[1] * scale, light[2] * scale]
      }
    }
    rgb = [base[0] * light[0], base[1] * light[1], base[2] * light[2]]
  }
  // Emissive light is the surface's own: added after lighting, so it shines in the dark (and blooms).
  if (material.emissive) {
    const e = parseColor(material.emissive)
    rgb = [rgb[0] + e[0], rgb[1] + e[1], rgb[2] + e[2]]
  }
  const amount = fogAmount(fog, vec3.distance(triangle.centroid, camera.position))
  if (fog && amount > 0) {
    const f = parseColor(fog.color)
    rgb = [rgb[0] + (f[0] - rgb[0]) * amount, rgb[1] + (f[1] - rgb[1]) * amount, rgb[2] + (f[2] - rgb[2]) * amount]
  }
  const channel = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255)
  return { color: `rgb(${channel(rgb[0])}, ${channel(rgb[1])}, ${channel(rgb[2])})`, alpha: triangle.opacity }
}
