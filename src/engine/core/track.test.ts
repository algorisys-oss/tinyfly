import { describe, it, expect } from 'vitest'
import { TrackPlayer, createTrack } from './track'

describe('createTrack', () => {
  it('should create a track with the given properties', () => {
    const track = createTrack({
      id: 'track-1',
      target: 'box',
      property: 'opacity',
      keyframes: [
        { time: 0, value: 0 },
        { time: 1000, value: 1 },
      ],
    })

    expect(track.id).toBe('track-1')
    expect(track.target).toBe('box')
    expect(track.property).toBe('opacity')
    expect(track.keyframes).toHaveLength(2)
  })

  it('should sort keyframes by time', () => {
    const track = createTrack({
      id: 'track-1',
      target: 'box',
      property: 'opacity',
      keyframes: [
        { time: 1000, value: 1 },
        { time: 0, value: 0 },
        { time: 500, value: 0.5 },
      ],
    })

    expect(track.keyframes[0].time).toBe(0)
    expect(track.keyframes[1].time).toBe(500)
    expect(track.keyframes[2].time).toBe(1000)
  })
})

describe('TrackPlayer', () => {
  describe('getValueAtTime', () => {
    it('should return first keyframe value before first keyframe', () => {
      const track = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 100, value: 0.5 },
          { time: 1000, value: 1 },
        ],
      })
      const player = new TrackPlayer(track)

      expect(player.getValueAtTime(0)).toBe(0.5)
      expect(player.getValueAtTime(50)).toBe(0.5)
    })

    it('should return last keyframe value after last keyframe', () => {
      const track = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 1 },
        ],
      })
      const player = new TrackPlayer(track)

      expect(player.getValueAtTime(1000)).toBe(1)
      expect(player.getValueAtTime(2000)).toBe(1)
    })

    it('should return exact keyframe value at keyframe time', () => {
      const track = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 500, value: 0.5 },
          { time: 1000, value: 1 },
        ],
      })
      const player = new TrackPlayer(track)

      expect(player.getValueAtTime(0)).toBe(0)
      expect(player.getValueAtTime(500)).toBe(0.5)
      expect(player.getValueAtTime(1000)).toBe(1)
    })

    it('should interpolate between keyframes (linear)', () => {
      const track = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 1, easing: 'linear' },
        ],
      })
      const player = new TrackPlayer(track)

      expect(player.getValueAtTime(250)).toBeCloseTo(0.25)
      expect(player.getValueAtTime(500)).toBeCloseTo(0.5)
      expect(player.getValueAtTime(750)).toBeCloseTo(0.75)
    })

    it('should apply easing to interpolation', () => {
      const track = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 1, easing: 'ease-in-quad' },
        ],
      })
      const player = new TrackPlayer(track)

      // ease-in-quad at t=0.5 should be 0.25
      expect(player.getValueAtTime(500)).toBeCloseTo(0.25)
    })

    it('should interpolate colors', () => {
      const track = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'backgroundColor',
        keyframes: [
          { time: 0, value: '#000000' },
          { time: 1000, value: '#ffffff', easing: 'linear' },
        ],
      })
      const player = new TrackPlayer(track)

      const midColor = player.getValueAtTime(500) as string
      expect(midColor.toLowerCase()).toBe('#808080')
    })

    it('should interpolate arrays', () => {
      const track = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'transform',
        keyframes: [
          { time: 0, value: [0, 0, 0] },
          { time: 1000, value: [100, 200, 300], easing: 'linear' },
        ],
      })
      const player = new TrackPlayer(track)

      expect(player.getValueAtTime(500)).toEqual([50, 100, 150])
    })

    it('should handle single keyframe', () => {
      const track = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [{ time: 500, value: 0.5 }],
      })
      const player = new TrackPlayer(track)

      expect(player.getValueAtTime(0)).toBe(0.5)
      expect(player.getValueAtTime(500)).toBe(0.5)
      expect(player.getValueAtTime(1000)).toBe(0.5)
    })

    it('should handle empty keyframes', () => {
      const track = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [],
      })
      const player = new TrackPlayer(track)

      expect(player.getValueAtTime(500)).toBeUndefined()
    })

    it('should use linear easing by default', () => {
      const track = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 1 }, // no easing specified
        ],
      })
      const player = new TrackPlayer(track)

      expect(player.getValueAtTime(500)).toBeCloseTo(0.5)
    })
  })

  describe('getDuration', () => {
    it('should return duration based on last keyframe', () => {
      const track = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 1 },
        ],
      })
      const player = new TrackPlayer(track)

      expect(player.getDuration()).toBe(1000)
    })

    it('should return 0 for empty keyframes', () => {
      const track = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [],
      })
      const player = new TrackPlayer(track)

      expect(player.getDuration()).toBe(0)
    })
  })
})
