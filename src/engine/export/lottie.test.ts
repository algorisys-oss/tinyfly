import { describe, it, expect } from 'vitest'
import { exportToLottie, exportToLottieJSON } from './lottie'
import { Timeline } from '../core/timeline'
import { createTrack } from '../core/track'

describe('Lottie Export', () => {
  describe('exportToLottie', () => {
    it('should export basic timeline structure', () => {
      const timeline = new Timeline({
        id: 'test',
        name: 'Test Animation',
        config: { duration: 1000 },
        tracks: [
          createTrack({
            id: 'track1',
            target: 'box',
            property: 'opacity',
            keyframes: [
              { time: 0, value: 0 },
              { time: 1000, value: 1 },
            ],
          }),
        ],
      })

      const result = exportToLottie(timeline)

      expect(result.v).toBe('5.7.4')
      expect(result.nm).toBe('Test Animation')
      expect(result.fr).toBe(60) // Default frame rate
      expect(result.ip).toBe(0)
      expect(result.op).toBeGreaterThan(0)
      expect(result.ddd).toBe(0) // 2D
      expect(result.layers.length).toBe(1)
    })

    it('should use custom options', () => {
      const timeline = new Timeline({
        id: 'test',
        config: { duration: 1000 },
        tracks: [
          createTrack({
            id: 'track1',
            target: 'box',
            property: 'opacity',
            keyframes: [{ time: 0, value: 1 }],
          }),
        ],
      })

      const result = exportToLottie(timeline, {
        name: 'Custom Name',
        frameRate: 30,
        width: 800,
        height: 600,
      })

      expect(result.nm).toBe('Custom Name')
      expect(result.fr).toBe(30)
      expect(result.w).toBe(800)
      expect(result.h).toBe(600)
    })

    it('should create animated opacity', () => {
      const timeline = new Timeline({
        id: 'test',
        config: { duration: 1000 },
        tracks: [
          createTrack({
            id: 'track1',
            target: 'box',
            property: 'opacity',
            keyframes: [
              { time: 0, value: 0 },
              { time: 1000, value: 1 },
            ],
          }),
        ],
      })

      const result = exportToLottie(timeline)
      const layer = result.layers[0]

      expect(layer.ks.o).toBeDefined()
      expect(layer.ks.o!.a).toBe(1) // Animated
    })

    it('should create animated position from x and y tracks', () => {
      const timeline = new Timeline({
        id: 'test',
        config: { duration: 1000 },
        tracks: [
          createTrack({
            id: 'track-x',
            target: 'box',
            property: 'x',
            keyframes: [
              { time: 0, value: 0 },
              { time: 1000, value: 100 },
            ],
          }),
          createTrack({
            id: 'track-y',
            target: 'box',
            property: 'y',
            keyframes: [
              { time: 0, value: 0 },
              { time: 1000, value: 50 },
            ],
          }),
        ],
      })

      const result = exportToLottie(timeline)
      const layer = result.layers[0]

      expect(layer.ks.p).toBeDefined()
      expect(layer.ks.p!.a).toBe(1) // Animated
    })

    it('should create animated rotation', () => {
      const timeline = new Timeline({
        id: 'test',
        config: { duration: 1000 },
        tracks: [
          createTrack({
            id: 'track1',
            target: 'box',
            property: 'rotate',
            keyframes: [
              { time: 0, value: 0 },
              { time: 1000, value: 360 },
            ],
          }),
        ],
      })

      const result = exportToLottie(timeline)
      const layer = result.layers[0]

      expect(layer.ks.r).toBeDefined()
      expect(layer.ks.r!.a).toBe(1) // Animated
    })

    it('should create animated scale', () => {
      const timeline = new Timeline({
        id: 'test',
        config: { duration: 1000 },
        tracks: [
          createTrack({
            id: 'track1',
            target: 'box',
            property: 'scale',
            keyframes: [
              { time: 0, value: 0 },
              { time: 1000, value: 1 },
            ],
          }),
        ],
      })

      const result = exportToLottie(timeline)
      const layer = result.layers[0]

      expect(layer.ks.s).toBeDefined()
      expect(layer.ks.s!.a).toBe(1) // Animated
    })

    it('should handle multiple targets as separate layers', () => {
      const timeline = new Timeline({
        id: 'test',
        config: { duration: 1000 },
        tracks: [
          createTrack({
            id: 'track1',
            target: 'box1',
            property: 'opacity',
            keyframes: [{ time: 0, value: 1 }],
          }),
          createTrack({
            id: 'track2',
            target: 'box2',
            property: 'opacity',
            keyframes: [{ time: 0, value: 0.5 }],
          }),
        ],
      })

      const result = exportToLottie(timeline)

      expect(result.layers.length).toBe(2)
      expect(result.layers[0].nm).toBe('box1')
      expect(result.layers[1].nm).toBe('box2')
    })

    it('should set static values for non-animated properties', () => {
      const timeline = new Timeline({
        id: 'test',
        config: { duration: 1000 },
        tracks: [
          createTrack({
            id: 'track1',
            target: 'box',
            property: 'opacity',
            keyframes: [{ time: 0, value: 0.5 }],
          }),
        ],
      })

      const result = exportToLottie(timeline)
      const layer = result.layers[0]

      // Single keyframe = not animated
      expect(layer.ks.o!.a).toBe(0)
    })

    it('should convert frame rate to frame numbers', () => {
      const timeline = new Timeline({
        id: 'test',
        config: { duration: 1000 },
        tracks: [
          createTrack({
            id: 'track1',
            target: 'box',
            property: 'opacity',
            keyframes: [{ time: 0, value: 1 }],
          }),
        ],
      })

      const result = exportToLottie(timeline, { frameRate: 30 })

      // 1000ms at 30fps = 30 frames
      expect(result.op).toBe(30)
    })
  })

  describe('exportToLottieJSON', () => {
    it('should return valid JSON string', () => {
      const timeline = new Timeline({
        id: 'test',
        config: { duration: 1000 },
        tracks: [
          createTrack({
            id: 'track1',
            target: 'box',
            property: 'opacity',
            keyframes: [{ time: 0, value: 1 }],
          }),
        ],
      })

      const json = exportToLottieJSON(timeline)

      expect(() => JSON.parse(json)).not.toThrow()
      const parsed = JSON.parse(json)
      expect(parsed.v).toBe('5.7.4')
    })
  })
})
