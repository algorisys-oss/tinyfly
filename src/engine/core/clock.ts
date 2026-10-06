export interface ClockConfig {
  /** Playback speed multiplier (1 = normal) */
  speed?: number
}

export type TickCallback = (delta: number, currentTime: number) => void

/**
 * Manual clock for testing and non-RAF environments.
 * Time only advances when tick() is called explicitly.
 */
export class ManualClock {
  private _currentTime = 0
  private _isRunning = false

  onTick: TickCallback | null = null

  get currentTime(): number {
    return this._currentTime
  }

  get isRunning(): boolean {
    return this._isRunning
  }

  start(): void {
    this._isRunning = true
  }

  stop(): void {
    this._isRunning = false
  }

  tick(delta: number): void {
    this._currentTime += delta
    this.onTick?.(delta, this._currentTime)
  }

  reset(): void {
    this._currentTime = 0
  }

  seek(time: number): void {
    this._currentTime = time
  }
}

/**
 * RAF-based clock for browser environments.
 * Automatically advances time based on requestAnimationFrame.
 */
export class Clock {
  private _currentTime = 0
  private _isRunning = false
  private _lastFrameTime: number | null = null
  private _rafId: number | null = null
  private _speed: number

  onTick: TickCallback | null = null

  constructor(config: ClockConfig = {}) {
    this._speed = config.speed ?? 1
  }

  get currentTime(): number {
    return this._currentTime
  }

  get isRunning(): boolean {
    return this._isRunning
  }

  get speed(): number {
    return this._speed
  }

  set speed(value: number) {
    this._speed = value
  }

  start(): void {
    if (this._isRunning) return

    this._isRunning = true
    this._lastFrameTime = null
    this._scheduleFrame()
  }

  stop(): void {
    this._isRunning = false
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId)
      this._rafId = null
    }
  }

  reset(): void {
    this._currentTime = 0
    this._lastFrameTime = null
  }

  seek(time: number): void {
    this._currentTime = time
  }

  private _scheduleFrame(): void {
    this._rafId = requestAnimationFrame(this._onFrame.bind(this))
  }

  private _onFrame(timestamp: number): void {
    if (!this._isRunning) return

    if (this._lastFrameTime !== null) {
      const realDelta = timestamp - this._lastFrameTime
      const scaledDelta = realDelta * this._speed
      this._currentTime += scaledDelta
      this.onTick?.(scaledDelta, this._currentTime)
    }

    this._lastFrameTime = timestamp
    this._scheduleFrame()
  }
}

/**
 * Time held to the last drawing: animating "on twos" (12 drawings a second
 * against a 24 fps film) means each pose shows for two frames. Given a
 * time in ms and the drawings per second, the time of the drawing on screen.
 * A rate of 0 (or less) leaves time continuous.
 */
export function heldTime(time: number, drawingsPerSecond: number): number {
  if (!(drawingsPerSecond > 0)) return time
  const step = 1000 / drawingsPerSecond
  // The epsilon keeps a frame exactly on a drawing (float error) on that drawing.
  return Math.floor(time / step + 1e-9) * step
}
