import { describe, it, expect, vi } from 'vitest'
import { Timeline } from './timeline'
import { createTrack } from './track'

describe('Timeline', () => {
  describe('construction', () => {
    it('should create an empty timeline', () => {
      const timeline = new Timeline({ id: 'test' })
      expect(timeline.id).toBe('test')
      expect(timeline.tracks).toHaveLength(0)
    })

    it('should create timeline with tracks', () => {
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
        id: 'test',
        tracks: [track],
      })

      expect(timeline.tracks).toHaveLength(1)
    })

    it('should auto-calculate duration from tracks', () => {
      const track1 = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 1 },
        ],
      })

      const track2 = createTrack({
        id: 'track-2',
        target: 'box',
        property: 'x',
        keyframes: [
          { time: 0, value: 0 },
          { time: 2000, value: 100 },
        ],
      })

      const timeline = new Timeline({
        id: 'test',
        tracks: [track1, track2],
      })

      expect(timeline.duration).toBe(2000)
    })

    it('should use explicit duration over auto-calculated', () => {
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
        id: 'test',
        tracks: [track],
        config: { duration: 5000 },
      })

      expect(timeline.duration).toBe(5000)
    })
  })

  describe('playback state', () => {
    it('should start in idle state', () => {
      const timeline = new Timeline({ id: 'test' })
      expect(timeline.playbackState).toBe('idle')
    })

    it('should be playing after play()', () => {
      const timeline = new Timeline({ id: 'test' })
      timeline.play()
      expect(timeline.playbackState).toBe('playing')
    })

    it('should be paused after pause()', () => {
      const timeline = new Timeline({ id: 'test' })
      timeline.play()
      timeline.pause()
      expect(timeline.playbackState).toBe('paused')
    })

    it('should be idle after stop()', () => {
      const timeline = new Timeline({ id: 'test' })
      timeline.play()
      timeline.stop()
      expect(timeline.playbackState).toBe('idle')
    })

    it('should reset time to 0 on stop()', () => {
      const timeline = new Timeline({ id: 'test' })
      timeline.seek(500)
      timeline.stop()
      expect(timeline.currentTime).toBe(0)
    })
  })

  describe('seek', () => {
    it('should seek to specific time', () => {
      const timeline = new Timeline({ id: 'test' })
      timeline.seek(500)
      expect(timeline.currentTime).toBe(500)
    })

    it('should clamp seek to 0', () => {
      const timeline = new Timeline({ id: 'test' })
      timeline.seek(-100)
      expect(timeline.currentTime).toBe(0)
    })

    it('should clamp seek to duration', () => {
      const track = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 1 },
        ],
      })

      const timeline = new Timeline({ id: 'test', tracks: [track] })
      timeline.seek(5000)
      expect(timeline.currentTime).toBe(1000)
    })
  })

  describe('direction', () => {
    it('should default to forward direction', () => {
      const timeline = new Timeline({ id: 'test' })
      expect(timeline.direction).toBe('forward')
    })

    it('should reverse direction', () => {
      const timeline = new Timeline({ id: 'test' })
      timeline.reverse()
      expect(timeline.direction).toBe('reverse')
    })

    it('should toggle direction on reverse()', () => {
      const timeline = new Timeline({ id: 'test' })
      timeline.reverse()
      timeline.reverse()
      expect(timeline.direction).toBe('forward')
    })
  })

  describe('getStateAtTime', () => {
    it('should return animation state with all track values', () => {
      const track1 = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 1 },
        ],
      })

      const track2 = createTrack({
        id: 'track-2',
        target: 'box',
        property: 'x',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 100 },
        ],
      })

      const timeline = new Timeline({
        id: 'test',
        tracks: [track1, track2],
      })

      const state = timeline.getStateAtTime(500)

      expect(state.values.get('box')?.get('opacity')).toBeCloseTo(0.5)
      expect(state.values.get('box')?.get('x')).toBeCloseTo(50)
    })

    it('should return state for multiple targets', () => {
      const track1 = createTrack({
        id: 'track-1',
        target: 'box1',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 1 },
        ],
      })

      const track2 = createTrack({
        id: 'track-2',
        target: 'box2',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 1 },
          { time: 1000, value: 0 },
        ],
      })

      const timeline = new Timeline({
        id: 'test',
        tracks: [track1, track2],
      })

      const state = timeline.getStateAtTime(500)

      expect(state.values.get('box1')?.get('opacity')).toBeCloseTo(0.5)
      expect(state.values.get('box2')?.get('opacity')).toBeCloseTo(0.5)
    })
  })

  describe('tick', () => {
    it('should advance time on tick when playing', () => {
      const timeline = new Timeline({ id: 'test', config: { duration: 1000 } })
      timeline.play()
      timeline.tick(100)
      expect(timeline.currentTime).toBe(100)
    })

    it('should not advance time when paused', () => {
      const timeline = new Timeline({ id: 'test' })
      timeline.seek(100)
      timeline.pause()
      timeline.tick(100)
      expect(timeline.currentTime).toBe(100)
    })

    it('should not advance time when idle', () => {
      const timeline = new Timeline({ id: 'test' })
      timeline.tick(100)
      expect(timeline.currentTime).toBe(0)
    })

    it('should advance in reverse when direction is reverse', () => {
      const timeline = new Timeline({ id: 'test', config: { duration: 1000 } })
      timeline.seek(500)
      timeline.play()
      timeline.reverse()
      timeline.tick(100)
      expect(timeline.currentTime).toBe(400)
    })

    it('should stop at duration end', () => {
      const timeline = new Timeline({ id: 'test', config: { duration: 1000 } })
      timeline.play()
      timeline.tick(1500)
      expect(timeline.currentTime).toBe(1000)
      expect(timeline.playbackState).toBe('idle')
    })

    it('should stop at 0 when reversing', () => {
      const timeline = new Timeline({ id: 'test', config: { duration: 1000 } })
      timeline.seek(500)
      timeline.play()
      timeline.reverse()
      timeline.tick(1000)
      expect(timeline.currentTime).toBe(0)
      expect(timeline.playbackState).toBe('idle')
    })

    it('should emit onUpdate callback', () => {
      const onUpdate = vi.fn()
      const track = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 1 },
        ],
      })

      const timeline = new Timeline({ id: 'test', tracks: [track] })
      timeline.onUpdate = onUpdate
      timeline.play()
      timeline.tick(500)

      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          currentTime: 500,
          playbackState: 'playing',
        })
      )
    })

    it('should emit onComplete callback when finished', () => {
      const onComplete = vi.fn()
      const timeline = new Timeline({ id: 'test', config: { duration: 1000 } })
      timeline.onComplete = onComplete
      timeline.play()
      timeline.tick(1000)

      expect(onComplete).toHaveBeenCalled()
    })
  })

  describe('looping', () => {
    it('should loop when loop count > 0', () => {
      const timeline = new Timeline({
        id: 'test',
        config: { duration: 1000, loop: 2 },
      })
      timeline.play()
      timeline.tick(1500)

      expect(timeline.currentTime).toBe(500)
      expect(timeline.loopIteration).toBe(1)
    })

    it('should stop after loop count exhausted', () => {
      const timeline = new Timeline({
        id: 'test',
        config: { duration: 1000, loop: 1 },
      })
      timeline.play()
      timeline.tick(2500)

      expect(timeline.playbackState).toBe('idle')
      expect(timeline.loopIteration).toBe(1)
    })

    it('should loop infinitely when loop is -1', () => {
      const timeline = new Timeline({
        id: 'test',
        config: { duration: 1000, loop: -1 },
      })
      timeline.play()
      timeline.tick(5500)

      expect(timeline.playbackState).toBe('playing')
      expect(timeline.loopIteration).toBe(5)
    })

    it('should alternate direction when alternate is true', () => {
      const timeline = new Timeline({
        id: 'test',
        config: { duration: 1000, loop: 2, alternate: true },
      })
      timeline.play()
      timeline.tick(1500) // Should be at 500 going reverse

      expect(timeline.direction).toBe('reverse')
      expect(timeline.currentTime).toBe(500)
    })
  })

  describe('speed', () => {
    it('should apply speed multiplier', () => {
      const timeline = new Timeline({
        id: 'test',
        config: { duration: 1000, speed: 2 },
      })
      timeline.play()
      timeline.tick(100) // 100ms * 2 = 200ms

      expect(timeline.currentTime).toBe(200)
    })

    it('should allow changing speed at runtime', () => {
      const timeline = new Timeline({ id: 'test', config: { duration: 1000 } })
      timeline.play()
      timeline.tick(100)
      timeline.speed = 0.5
      timeline.tick(100) // 100ms * 0.5 = 50ms

      expect(timeline.currentTime).toBe(150)
    })
  })

  describe('addTrack / removeTrack', () => {
    it('should add a track', () => {
      const timeline = new Timeline({ id: 'test' })
      const track = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 1 },
        ],
      })

      timeline.addTrack(track)

      expect(timeline.tracks).toHaveLength(1)
      expect(timeline.duration).toBe(1000)
    })

    it('should remove a track by id', () => {
      const track = createTrack({
        id: 'track-1',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 1 },
        ],
      })

      const timeline = new Timeline({ id: 'test', tracks: [track] })
      timeline.removeTrack('track-1')

      expect(timeline.tracks).toHaveLength(0)
    })
  })
})
