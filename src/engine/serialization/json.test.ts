import { describe, it, expect } from 'vitest'
import {
  serializeTimeline,
  deserializeTimeline,
  serializeTrack,
  deserializeTrack,
} from './json'
import { Timeline } from '../core/timeline'
import { createTrack } from '../core/track'
import type { TimelineDefinition, Track } from '../types'

describe('JSON serialization', () => {
  describe('serializeTrack', () => {
    it('should serialize a track to JSON-compatible object', () => {
      const track = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 1, easing: 'ease-out' },
        ],
      })

      const serialized = serializeTrack(track)

      expect(serialized).toEqual({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 1, easing: 'ease-out' },
        ],
      })
    })

    it('should be JSON stringifiable', () => {
      const track = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 1 },
        ],
      })

      const json = JSON.stringify(serializeTrack(track))
      const parsed = JSON.parse(json)

      expect(parsed.id).toBe('track-1')
      expect(parsed.keyframes).toHaveLength(2)
    })
  })

  describe('deserializeTrack', () => {
    it('should deserialize JSON object to track', () => {
      const data: Track = {
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 1, easing: 'ease-in' },
        ],
      }

      const track = deserializeTrack(data)

      expect(track.id).toBe('track-1')
      expect(track.target).toBe('box')
      expect(track.property).toBe('opacity')
      expect(track.keyframes).toHaveLength(2)
      expect(track.keyframes[1].easing).toBe('ease-in')
    })

    it('should sort keyframes by time', () => {
      const data: Track = {
        id: 'track-1',
        target: 'box',
        property: 'x',
        keyframes: [
          { time: 1000, value: 100 },
          { time: 0, value: 0 },
          { time: 500, value: 50 },
        ],
      }

      const track = deserializeTrack(data)

      expect(track.keyframes[0].time).toBe(0)
      expect(track.keyframes[1].time).toBe(500)
      expect(track.keyframes[2].time).toBe(1000)
    })
  })

  describe('serializeTimeline', () => {
    it('should serialize timeline to definition object', () => {
      const track = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 1 },
        ],
      })

      const timeline = new Timeline({
        id: 'timeline-1',
        name: 'Fade In',
        tracks: [track],
        config: { loop: 2, speed: 1.5 },
      })

      const serialized = serializeTimeline(timeline)

      expect(serialized.id).toBe('timeline-1')
      expect(serialized.name).toBe('Fade In')
      expect(serialized.config.loop).toBe(2)
      expect(serialized.config.speed).toBe(1.5)
      expect(serialized.tracks).toHaveLength(1)
    })

    it('should be JSON stringifiable', () => {
      const track = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 1 },
        ],
      })

      const timeline = new Timeline({
        id: 'timeline-1',
        tracks: [track],
      })

      const json = JSON.stringify(serializeTimeline(timeline))
      const parsed = JSON.parse(json)

      expect(parsed.id).toBe('timeline-1')
      expect(parsed.tracks).toHaveLength(1)
    })

    it('should handle empty timeline', () => {
      const timeline = new Timeline({ id: 'empty' })
      const serialized = serializeTimeline(timeline)

      expect(serialized.id).toBe('empty')
      expect(serialized.tracks).toHaveLength(0)
    })
  })

  describe('deserializeTimeline', () => {
    it('should deserialize definition to Timeline instance', () => {
      const definition: TimelineDefinition = {
        id: 'timeline-1',
        name: 'Fade In',
        config: { duration: 2000, loop: 1 },
        tracks: [
          {
            id: 'track-1',
            target: 'box',
            property: 'opacity',
            keyframes: [
              { time: 0, value: 0 },
              { time: 1000, value: 1 },
            ],
          },
        ],
      }

      const timeline = deserializeTimeline(definition)

      expect(timeline.id).toBe('timeline-1')
      expect(timeline.name).toBe('Fade In')
      expect(timeline.duration).toBe(2000)
      expect(timeline.tracks).toHaveLength(1)
    })

    it('should handle complex animations', () => {
      const definition: TimelineDefinition = {
        id: 'complex',
        config: { alternate: true, loop: -1 },
        tracks: [
          {
            id: 'opacity-track',
            target: 'element-1',
            property: 'opacity',
            keyframes: [
              { time: 0, value: 0 },
              { time: 500, value: 1, easing: 'ease-out' },
            ],
          },
          {
            id: 'x-track',
            target: 'element-1',
            property: 'x',
            keyframes: [
              { time: 0, value: 0 },
              { time: 1000, value: 200, easing: 'ease-in-out' },
            ],
          },
          {
            id: 'color-track',
            target: 'element-2',
            property: 'backgroundColor',
            keyframes: [
              { time: 0, value: '#ff0000' },
              { time: 1000, value: '#0000ff' },
            ],
          },
        ],
      }

      const timeline = deserializeTimeline(definition)

      expect(timeline.tracks).toHaveLength(3)
      expect(timeline.duration).toBe(1000)

      // Test that state computation works
      const state = timeline.getStateAtTime(500)
      expect(state.values.get('element-1')?.get('opacity')).toBeCloseTo(1)
      expect(state.values.get('element-1')?.get('x')).toBeDefined()
      expect(state.values.get('element-2')?.get('backgroundColor')).toBeDefined()
    })

    it('should roundtrip serialize/deserialize', () => {
      const original = new Timeline({
        id: 'roundtrip',
        name: 'Test Animation',
        config: { loop: 3, speed: 2, alternate: true },
        tracks: [
          createTrack({
            id: 'track-1',
            target: 'box',
            property: 'opacity',
            keyframes: [
              { time: 0, value: 0 },
              { time: 500, value: 0.5, easing: 'ease-in' },
              { time: 1000, value: 1, easing: 'ease-out' },
            ],
          }),
        ],
      })

      const json = JSON.stringify(serializeTimeline(original))
      const restored = deserializeTimeline(JSON.parse(json))

      expect(restored.id).toBe(original.id)
      expect(restored.name).toBe(original.name)
      expect(restored.tracks).toHaveLength(original.tracks.length)
      expect(restored.tracks[0].keyframes).toHaveLength(3)
    })
  })

  describe('edge cases', () => {
    it('should handle array values in keyframes', () => {
      const definition: TimelineDefinition = {
        id: 'array-values',
        config: {},
        tracks: [
          {
            id: 'transform-track',
            target: 'box',
            property: 'transform',
            keyframes: [
              { time: 0, value: [0, 0, 0] },
              { time: 1000, value: [100, 200, 45] },
            ],
          },
        ],
      }

      const timeline = deserializeTimeline(definition)
      const state = timeline.getStateAtTime(500)
      const transform = state.values.get('box')?.get('transform') as number[]

      expect(transform).toEqual([50, 100, 22.5])
    })

    it('should handle missing optional fields', () => {
      const minimal: TimelineDefinition = {
        id: 'minimal',
        config: {},
        tracks: [],
      }

      const timeline = deserializeTimeline(minimal)

      expect(timeline.id).toBe('minimal')
      expect(timeline.name).toBeUndefined()
      expect(timeline.tracks).toHaveLength(0)
    })
  })
})
