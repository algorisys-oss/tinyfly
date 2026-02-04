import { describe, it, expect } from 'vitest'
import {
  allPresets,
  presetsByCategory,
  getPresetById,
  resolvePresetKeyframe,
  fadeIn,
  pulse,
  fadeOut,
  float,
} from './animation-presets'

describe('animation presets', () => {
  describe('preset definitions', () => {
    it('all presets have required fields', () => {
      for (const preset of allPresets) {
        expect(preset.id).toBeDefined()
        expect(preset.name).toBeDefined()
        expect(preset.description).toBeDefined()
        expect(preset.category).toBeDefined()
        expect(preset.duration).toBeGreaterThan(0)
        expect(preset.tracks.length).toBeGreaterThan(0)
      }
    })

    it('all preset tracks have valid keyframes', () => {
      for (const preset of allPresets) {
        for (const track of preset.tracks) {
          expect(track.property).toBeDefined()
          expect(track.keyframes.length).toBeGreaterThan(0)

          for (const kf of track.keyframes) {
            expect(kf.timePercent).toBeGreaterThanOrEqual(0)
            expect(kf.timePercent).toBeLessThanOrEqual(1)
            expect(kf.value).toBeDefined()
          }
        }
      }
    })

    it('contains expected number of presets', () => {
      expect(allPresets.length).toBe(32) // 17 original + 15 text presets
    })
  })

  describe('presetsByCategory', () => {
    it('categorizes entrance presets correctly', () => {
      expect(presetsByCategory.entrance.length).toBe(6)
      expect(presetsByCategory.entrance.map((p) => p.id)).toContain('fade-in')
      expect(presetsByCategory.entrance.map((p) => p.id)).toContain('slide-in-left')
    })

    it('categorizes emphasis presets correctly', () => {
      expect(presetsByCategory.emphasis.length).toBe(5)
      expect(presetsByCategory.emphasis.map((p) => p.id)).toContain('pulse')
      expect(presetsByCategory.emphasis.map((p) => p.id)).toContain('bounce')
    })

    it('categorizes exit presets correctly', () => {
      expect(presetsByCategory.exit.length).toBe(3)
      expect(presetsByCategory.exit.map((p) => p.id)).toContain('fade-out')
    })

    it('categorizes motion presets correctly', () => {
      expect(presetsByCategory.motion.length).toBe(3)
      expect(presetsByCategory.motion.map((p) => p.id)).toContain('float')
    })
  })

  describe('getPresetById', () => {
    it('returns preset by id', () => {
      const preset = getPresetById('fade-in')
      expect(preset).toBeDefined()
      expect(preset?.name).toBe('Fade In')
    })

    it('returns undefined for unknown id', () => {
      const preset = getPresetById('unknown-preset')
      expect(preset).toBeUndefined()
    })
  })

  describe('resolvePresetKeyframe', () => {
    it('converts time percentage to milliseconds', () => {
      const resolved = resolvePresetKeyframe(
        { timePercent: 0.5, value: 1 },
        1000
      )
      expect(resolved.time).toBe(500)
    })

    it('preserves absolute values', () => {
      const resolved = resolvePresetKeyframe(
        { timePercent: 0, value: 100 },
        1000
      )
      expect(resolved.value).toBe(100)
    })

    it('resolves positive relative values', () => {
      const resolved = resolvePresetKeyframe(
        { timePercent: 0, value: '+50' },
        1000,
        100
      )
      expect(resolved.value).toBe(150)
    })

    it('resolves negative relative values', () => {
      const resolved = resolvePresetKeyframe(
        { timePercent: 0, value: '-30' },
        1000,
        100
      )
      expect(resolved.value).toBe(70)
    })

    it('preserves easing', () => {
      const resolved = resolvePresetKeyframe(
        { timePercent: 1, value: 1, easing: 'ease-out' },
        1000
      )
      expect(resolved.easing).toBe('ease-out')
    })
  })

  describe('specific presets', () => {
    it('fadeIn has opacity track from 0 to 1', () => {
      expect(fadeIn.tracks.length).toBe(1)
      expect(fadeIn.tracks[0].property).toBe('opacity')
      expect(fadeIn.tracks[0].keyframes[0].value).toBe(0)
      expect(fadeIn.tracks[0].keyframes[1].value).toBe(1)
    })

    it('pulse has scale track that returns to 1', () => {
      expect(pulse.tracks.length).toBe(1)
      expect(pulse.tracks[0].property).toBe('scale')
      expect(pulse.tracks[0].keyframes[0].value).toBe(1)
      expect(pulse.tracks[0].keyframes[2].value).toBe(1)
    })

    it('fadeOut has opacity track from 1 to 0', () => {
      expect(fadeOut.tracks.length).toBe(1)
      expect(fadeOut.tracks[0].property).toBe('opacity')
      expect(fadeOut.tracks[0].keyframes[0].value).toBe(1)
      expect(fadeOut.tracks[0].keyframes[1].value).toBe(0)
    })

    it('float has y track with relative values', () => {
      expect(float.tracks.length).toBe(1)
      expect(float.tracks[0].property).toBe('y')
      expect(float.tracks[0].keyframes[0].value).toBe(0)
      expect(float.tracks[0].keyframes[1].value).toBe('-15')
    })
  })
})
