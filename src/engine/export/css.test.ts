import { describe, it, expect } from 'vitest'
import { exportToCSS } from './css'
import { Timeline } from '../core/timeline'
import { createTrack } from '../core/track'

describe('CSS Export', () => {
  describe('exportToCSS', () => {
    it('should export timeline with opacity animation', () => {
      const timeline = new Timeline({
        id: 'test',
        name: 'Test Animation',
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

      const result = exportToCSS(timeline)

      expect(result.css).toContain('@keyframes')
      expect(result.css).toContain('opacity')
      expect(result.css).toContain('0%')
      expect(result.css).toContain('100%')
      expect(result.keyframes.size).toBe(1)
      expect(result.selectors.size).toBe(1)
    })

    it('should export transform properties as combined transform', () => {
      const timeline = new Timeline({
        id: 'test',
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
            id: 'track-rotate',
            target: 'box',
            property: 'rotate',
            keyframes: [
              { time: 0, value: 0 },
              { time: 1000, value: 360 },
            ],
          }),
        ],
      })

      const result = exportToCSS(timeline)

      expect(result.css).toContain('transform')
      expect(result.css).toContain('translateX')
      expect(result.css).toContain('rotate')
    })

    it('should use custom class prefix', () => {
      const timeline = new Timeline({
        id: 'test',
        tracks: [
          createTrack({
            id: 'track1',
            target: 'element',
            property: 'opacity',
            keyframes: [{ time: 0, value: 1 }],
          }),
        ],
      })

      const result = exportToCSS(timeline, { classPrefix: 'my-anim' })

      expect(result.css).toContain('my-anim')
      expect(result.css).not.toContain('tinyfly')
    })

    it('should support minified output', () => {
      const timeline = new Timeline({
        id: 'test',
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

      const result = exportToCSS(timeline, { minify: true })

      // Minified should have no extra spaces/newlines
      expect(result.css).not.toContain('  ')
      expect(result.css.split('\n').length).toBeLessThan(10)
    })

    it('should map easing types to CSS timing functions', () => {
      const timeline = new Timeline({
        id: 'test',
        tracks: [
          createTrack({
            id: 'track1',
            target: 'box',
            property: 'opacity',
            keyframes: [
              { time: 0, value: 0, easing: 'ease-in-out' },
              { time: 500, value: 0.5, easing: 'ease-in-out' },
              { time: 1000, value: 1, easing: 'ease-in-out' },
            ],
          }),
        ],
      })

      const result = exportToCSS(timeline)

      // Should use ease-in-out as the dominant easing
      expect(result.css).toContain('ease-in-out')
    })

    it('should export only keyframes when includeAnimation is false', () => {
      const timeline = new Timeline({
        id: 'test',
        tracks: [
          createTrack({
            id: 'track1',
            target: 'box',
            property: 'opacity',
            keyframes: [{ time: 0, value: 1 }],
          }),
        ],
      })

      const result = exportToCSS(timeline, { includeAnimation: false })

      expect(result.selectors.size).toBe(0)
      expect(result.keyframes.size).toBe(1)
    })

    it('should handle multiple targets', () => {
      const timeline = new Timeline({
        id: 'test',
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

      const result = exportToCSS(timeline)

      expect(result.keyframes.size).toBe(2)
      expect(result.selectors.size).toBe(2)
    })

    it('should handle scale animation', () => {
      const timeline = new Timeline({
        id: 'test',
        tracks: [
          createTrack({
            id: 'track1',
            target: 'box',
            property: 'scale',
            keyframes: [
              { time: 0, value: 0 },
              { time: 500, value: 1.2 },
              { time: 1000, value: 1 },
            ],
          }),
        ],
      })

      const result = exportToCSS(timeline)

      expect(result.css).toContain('transform')
      expect(result.css).toContain('scale(')
    })

    it('should include animation duration and iteration count', () => {
      const timeline = new Timeline({
        id: 'test',
        config: { duration: 2000, loop: 3 },
        tracks: [
          createTrack({
            id: 'track1',
            target: 'box',
            property: 'opacity',
            keyframes: [
              { time: 0, value: 0 },
              { time: 2000, value: 1 },
            ],
          }),
        ],
      })

      const result = exportToCSS(timeline)

      expect(result.css).toContain('2.00s')
      expect(result.css).toContain('4') // loop + 1
    })

    it('should set alternate direction when configured', () => {
      const timeline = new Timeline({
        id: 'test',
        config: { alternate: true },
        tracks: [
          createTrack({
            id: 'track1',
            target: 'box',
            property: 'opacity',
            keyframes: [{ time: 0, value: 1 }],
          }),
        ],
      })

      const result = exportToCSS(timeline)

      expect(result.css).toContain('alternate')
    })
  })
})
