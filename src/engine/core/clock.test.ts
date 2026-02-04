import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Clock, ManualClock } from './clock'

describe('Clock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('ManualClock', () => {
    it('should start at time 0', () => {
      const clock = new ManualClock()
      expect(clock.currentTime).toBe(0)
    })

    it('should not be running by default', () => {
      const clock = new ManualClock()
      expect(clock.isRunning).toBe(false)
    })

    it('should advance time with tick()', () => {
      const clock = new ManualClock()
      clock.tick(100)
      expect(clock.currentTime).toBe(100)
    })

    it('should accumulate time over multiple ticks', () => {
      const clock = new ManualClock()
      clock.tick(50)
      clock.tick(50)
      expect(clock.currentTime).toBe(100)
    })

    it('should call onTick callback with delta', () => {
      const clock = new ManualClock()
      const onTick = vi.fn()
      clock.onTick = onTick

      clock.tick(100)

      expect(onTick).toHaveBeenCalledWith(100, 100)
    })

    it('should call onTick with correct currentTime and delta', () => {
      const clock = new ManualClock()
      const onTick = vi.fn()
      clock.onTick = onTick

      clock.tick(50)
      expect(onTick).toHaveBeenCalledWith(50, 50)

      clock.tick(30)
      expect(onTick).toHaveBeenCalledWith(30, 80)
    })

    it('should reset time to 0', () => {
      const clock = new ManualClock()
      clock.tick(100)
      clock.reset()
      expect(clock.currentTime).toBe(0)
    })

    it('should seek to specific time', () => {
      const clock = new ManualClock()
      clock.seek(500)
      expect(clock.currentTime).toBe(500)
    })

    it('should set running state with start()', () => {
      const clock = new ManualClock()
      clock.start()
      expect(clock.isRunning).toBe(true)
    })

    it('should set running state with stop()', () => {
      const clock = new ManualClock()
      clock.start()
      clock.stop()
      expect(clock.isRunning).toBe(false)
    })
  })

  describe('Clock (RAF-based)', () => {
    let rafCallback: ((time: number) => void) | null = null
    let rafId = 0

    beforeEach(() => {
      rafCallback = null
      rafId = 0
      vi.stubGlobal('requestAnimationFrame', (cb: (time: number) => void) => {
        rafCallback = cb
        return ++rafId
      })
      vi.stubGlobal('cancelAnimationFrame', vi.fn())
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should not be running by default', () => {
      const clock = new Clock()
      expect(clock.isRunning).toBe(false)
    })

    it('should start running when start() is called', () => {
      const clock = new Clock()
      clock.start()
      expect(clock.isRunning).toBe(true)
    })

    it('should stop running when stop() is called', () => {
      const clock = new Clock()
      clock.start()
      clock.stop()
      expect(clock.isRunning).toBe(false)
    })

    it('should call requestAnimationFrame when started', () => {
      const clock = new Clock()
      clock.start()
      expect(rafCallback).not.toBeNull()
    })

    it('should call onTick with delta on each frame', () => {
      const clock = new Clock()
      const onTick = vi.fn()
      clock.onTick = onTick

      clock.start()

      // Simulate first frame at t=0
      rafCallback!(0)

      // Simulate second frame at t=16.67ms
      rafCallback!(16.67)

      expect(onTick).toHaveBeenCalledWith(expect.any(Number), expect.any(Number))
    })

    it('should reset currentTime to 0', () => {
      const clock = new Clock()
      clock.start()
      rafCallback!(0)
      rafCallback!(100)

      clock.reset()
      expect(clock.currentTime).toBe(0)
    })

    it('should seek to specific time', () => {
      const clock = new Clock()
      clock.seek(500)
      expect(clock.currentTime).toBe(500)
    })

    it('should apply speed multiplier', () => {
      const clock = new Clock({ speed: 2 })
      const onTick = vi.fn()
      clock.onTick = onTick

      clock.start()
      rafCallback!(0)
      rafCallback!(100) // 100ms real time = 200ms with speed 2

      // Second call should have delta of 200 (100 * 2)
      expect(onTick).toHaveBeenLastCalledWith(200, 200)
    })

    it('should handle speed changes', () => {
      const clock = new Clock()
      clock.speed = 0.5

      const onTick = vi.fn()
      clock.onTick = onTick

      clock.start()
      rafCallback!(0)
      rafCallback!(100) // 100ms real time = 50ms with speed 0.5

      expect(onTick).toHaveBeenLastCalledWith(50, 50)
    })
  })
})
