import { describe, it, expect } from 'vitest'
import { Timeline } from '../engine/core/timeline'
import { LIGHTING_PRESETS, ground, lightingPreset, lightingTracks } from './lighting'
import { loadScene3D, resolveScene3D, validateScene3D, type Scene3D } from './index'

const stage = (mood: 'day' | 'dusk' | 'night' | 'stage'): Scene3D => {
  const light = lightingPreset(mood)
  const floor = ground({ size: 10 })
  return {
    id: 'set',
    camera: 'cam',
    background: light.background,
    fog: light.fog,
    materials: { ...floor.materials, red: { color: '#ff0000', shading: 'flat' } },
    objects: [
      { id: 'cam', kind: 'camera', projection: 'perspective', fov: 50, near: 0.1, far: 60, position: [0, 3, 8], lookAt: [0, 0.5, 0] },
      ...light.objects,
      ...floor.objects,
      { id: 'box', kind: 'mesh', geometry: { type: 'box', size: [1, 1, 1] }, material: 'red', position: [0, 0.5, 0], shadow: true },
    ],
  }
}

describe('lighting for mood', () => {
  it('presets give a valid scene its lights, sky and fog, with the same light ids', () => {
    for (const mood of ['day', 'dusk', 'night', 'stage'] as const) {
      expect(validateScene3D(stage(mood)), mood).toEqual([])
      expect(lightingPreset(mood).objects.map((l) => l.id).slice(0, 3)).toEqual(['key', 'fill', 'sky'])
    }
    expect(lightingPreset('stage').objects.some((l) => l.id === 'spot' && l.light === 'spot')).toBe(true)
    expect(lightingPreset('night', { prefix: 'set' }).objects[0].id).toBe('set-key')
    expect(() => lightingPreset('noon' as never)).toThrow(/unknown mood/)
    // Presets are copied, never shared.
    const a = lightingPreset('day')
    a.objects[0].intensity = 0
    expect(LIGHTING_PRESETS.day.lights[0].intensity).toBe(0.95)
  })

  it('tracks take the lights from one mood to another, fading a spot that only one has', () => {
    const tracks = lightingTracks('day', 'stage', { scene: 'set', start: 0, end: 1000 })
    const timeline = new Timeline({ id: 't', tracks })
    const at = (time: number, id: string, property: string) => timeline.getStateAtTime(time).values.get(`set/${id}`)?.get(property)
    expect(at(0, 'key', 'intensity')).toBe(0.95)
    expect(at(1000, 'key', 'intensity')).toBeCloseTo(0.15, 9)
    expect(at(0, 'spot', 'intensity')).toBe(0)
    expect(at(1000, 'spot', 'intensity')).toBeCloseTo(1.1, 9)
    expect(at(1000, 'key', 'color')).toBe('#ffffff')
    expect(at(1000, 'key', 'position')).toEqual([2, 6, 4])
    // The lit scene is darker at night than by day.
    const brightness = (mood: 'day' | 'night') => {
      const frame = resolveScene3D(loadScene3D(stage(mood)), new Map(), { width: 100, height: 60 })
      return frame.lights.reduce((sum, l) => sum + l.intensity, 0)
    }
    expect(brightness('night')).toBeLessThan(brightness('day') / 2)
    expect(ground().objects[0].layer).toBe(-1)
  })
})
