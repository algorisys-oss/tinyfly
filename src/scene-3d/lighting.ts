import type { Keyframe, Track } from '../engine/types'
import type { LightObject, MeshObject, Material3D, Scene3D, SkyGradient } from './scene-types'

/**
 * Light for mood, as data: presets (day, dusk, night, a stage spotlight)
 * that give a scene its lights, sky and fog in one go, tracks that take the
 * lights from one mood to another over a span, and a ground to stand things
 * on. Every preset uses the same light ids (`key`, `fill`, `sky`, `spot`),
 * so a change of mood is a change of values, never of objects.
 */

export interface LightingMood {
  /** The lights, with the ids `key`, `fill`, `sky` and `spot` (a spot only where the mood has one) */
  lights: Array<Omit<LightObject, 'id'> & { id: 'key' | 'fill' | 'sky' | 'spot' }>
  background: SkyGradient
  fog: NonNullable<Scene3D['fog']>
}

export const LIGHTING_PRESETS: Record<'day' | 'dusk' | 'night' | 'stage', LightingMood> = {
  day: {
    lights: [
      { id: 'key', kind: 'light', light: 'directional', color: '#fff6e0', intensity: 0.95, position: [4, 8, 3] },
      { id: 'fill', kind: 'light', light: 'directional', color: '#cfe3ff', intensity: 0.3, position: [-5, 3, -2] },
      { id: 'sky', kind: 'light', light: 'ambient', color: '#bcd4ea', intensity: 0.4 },
    ],
    background: { top: '#5aa9e6', bottom: '#dff1ff' },
    fog: { color: '#dff1ff', near: 14, far: 40 },
  },
  dusk: {
    lights: [
      { id: 'key', kind: 'light', light: 'directional', color: '#ffb067', intensity: 0.8, position: [6, 2.5, 2] },
      { id: 'fill', kind: 'light', light: 'directional', color: '#7b6bd6', intensity: 0.25, position: [-4, 3, -3] },
      { id: 'sky', kind: 'light', light: 'ambient', color: '#b58ab3', intensity: 0.3 },
    ],
    background: { top: '#4a3a7a', bottom: '#ff9a62' },
    fog: { color: '#d9826f', near: 10, far: 30 },
  },
  night: {
    lights: [
      { id: 'key', kind: 'light', light: 'directional', color: '#9db7ff', intensity: 0.35, position: [-3, 7, 2] },
      { id: 'fill', kind: 'light', light: 'directional', color: '#3b4a7a', intensity: 0.12, position: [4, 2, -3] },
      { id: 'sky', kind: 'light', light: 'ambient', color: '#243357', intensity: 0.25 },
    ],
    background: { top: '#060a1c', bottom: '#1b2650' },
    fog: { color: '#101a3a', near: 6, far: 22 },
  },
  stage: {
    lights: [
      { id: 'key', kind: 'light', light: 'directional', color: '#ffffff', intensity: 0.15, position: [2, 6, 4] },
      { id: 'fill', kind: 'light', light: 'directional', color: '#402040', intensity: 0.08, position: [-4, 3, -2] },
      { id: 'sky', kind: 'light', light: 'ambient', color: '#1a1020', intensity: 0.2 },
      { id: 'spot', kind: 'light', light: 'spot', color: '#ffe9b0', intensity: 1.1, position: [0, 7, 2], target: [0, 0, 0], angle: 22, range: 16 },
    ],
    background: { top: '#05030a', bottom: '#120a1c' },
    fog: { color: '#0a0612', near: 8, far: 24 },
  },
}

export type LightingPresetName = keyof typeof LIGHTING_PRESETS

export interface LightingOptions {
  /** Put this before each light's id (default none): `set-key`, `set-fill`… */
  prefix?: string
}

/** A mood's lights as scene objects, with its sky and fog to spread into the scene. */
export function lightingPreset(name: LightingPresetName, options: LightingOptions = {}): { objects: LightObject[]; background: SkyGradient; fog: NonNullable<Scene3D['fog']> } {
  const mood = LIGHTING_PRESETS[name]
  if (!mood) throw new Error(`lightingPreset: unknown mood "${name}" (day, dusk, night, stage)`)
  const prefix = options.prefix ? `${options.prefix}-` : ''
  return {
    objects: mood.lights.map((light) => ({ ...light, id: `${prefix}${light.id}`, position: light.position ? [...light.position] as [number, number, number] : undefined, target: light.target ? [...light.target] as [number, number, number] : undefined })),
    background: { ...mood.background },
    fog: { ...mood.fog },
  }
}

export interface LightingTrackOptions extends LightingOptions {
  scene: string
  /** ms */
  start: number
  end: number
  easing?: Track['keyframes'][number]['easing']
}

/**
 * Tracks that take a scene's lights from one mood to another over a span:
 * each light's `color`, `intensity`, `position` and `target` keyed at the
 * start and the end. A light one mood has and the other lacks fades out (or
 * in). The scene must hold the preset's lights (see `lightingPreset`).
 */
export function lightingTracks(from: LightingPresetName, to: LightingPresetName, options: LightingTrackOptions): Track[] {
  const a = LIGHTING_PRESETS[from]
  const b = LIGHTING_PRESETS[to]
  if (!a || !b) throw new Error(`lightingTracks: unknown mood "${!a ? from : to}" (day, dusk, night, stage)`)
  const prefix = options.prefix ? `${options.prefix}-` : ''
  const ids = new Set([...a.lights.map((l) => l.id), ...b.lights.map((l) => l.id)])
  const tracks: Track[] = []
  for (const id of ids) {
    const was = a.lights.find((l) => l.id === id)
    const will = b.lights.find((l) => l.id === id)
    const target = `${options.scene}/${prefix}${id}`
    const key = <T extends number | string | number[]>(property: string, first: T, last: T) => {
      const keyframes: Keyframe<T>[] = [{ time: options.start, value: first }, { time: options.end, value: last, easing: options.easing ?? 'ease-in-out' }]
      tracks.push({ id: `${target}-${property}`, target, property, keyframes })
    }
    key('intensity', was?.intensity ?? 0, will?.intensity ?? 0)
    key('color', was?.color ?? will!.color, will?.color ?? was!.color)
    const p0 = was?.position ?? will?.position
    const p1 = will?.position ?? was?.position
    if (p0 && p1) key('position', [...p0], [...p1])
    const t0 = was?.target ?? will?.target
    const t1 = will?.target ?? was?.target
    if (t0 && t1) key('target', [...t0], [...t1])
  }
  return tracks
}

export interface GroundOptions {
  id?: string
  /** Metres across (default 24) */
  size?: number
  color?: string
  /** Faces per side (default 24): more lets light pools and fog fall across it */
  segments?: number
  /** Its height (default 0, the scene's ground) */
  y?: number
}

/** A ground to stand things on: a floor plane on layer −1 and its material, to spread into a scene. */
export function ground(options: GroundOptions = {}): { objects: MeshObject[]; materials: Record<string, Material3D> } {
  const id = options.id ?? 'ground'
  const size = options.size ?? 24
  return {
    objects: [{ id, kind: 'mesh', layer: -1, geometry: { type: 'plane', size: [size, size], segments: options.segments ?? 24 }, material: id, position: [0, options.y ?? 0, 0] }],
    materials: { [id]: { color: options.color ?? '#3b4252', shading: 'flat' } },
  }
}
