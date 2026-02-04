import type {
  Track,
  TimelineConfig,
  TimelineDefinition,
  AnimationState,
  PlaybackState,
  PlaybackDirection,
  AnimatableValue,
  AnyTrack,
  MotionPathTrack,
} from '../types'
import { isMotionPathTrack } from '../types'
import { TrackPlayer } from './track'
import { getMotionPathPoint } from '../path/motion-path'

export type UpdateCallback = (state: AnimationState) => void
export type CompleteCallback = () => void

export interface TimelineOptions {
  id: string
  name?: string
  tracks?: AnyTrack[]
  config?: TimelineConfig
}

/**
 * Timeline orchestrates playback of multiple tracks.
 */
export class Timeline {
  readonly id: string
  readonly name?: string

  private _tracks: AnyTrack[] = []
  private _trackPlayers: Map<string, TrackPlayer> = new Map()
  private _motionPathTracks: Map<string, MotionPathTrack> = new Map()
  private _config: TimelineConfig
  private _currentTime = 0
  private _playbackState: PlaybackState = 'idle'
  private _direction: PlaybackDirection = 'forward'
  private _loopIteration = 0
  private _explicitDuration?: number

  onUpdate: UpdateCallback | null = null
  onComplete: CompleteCallback | null = null

  constructor(options: TimelineOptions) {
    this.id = options.id
    this.name = options.name
    this._config = options.config ?? {}
    this._explicitDuration = options.config?.duration

    if (options.tracks) {
      for (const track of options.tracks) {
        this.addTrack(track)
      }
    }
  }

  get tracks(): AnyTrack[] {
    return [...this._tracks]
  }

  get duration(): number {
    if (this._explicitDuration !== undefined) {
      return this._explicitDuration
    }
    return this._calculateDuration()
  }

  get currentTime(): number {
    return this._currentTime
  }

  get playbackState(): PlaybackState {
    return this._playbackState
  }

  get direction(): PlaybackDirection {
    return this._direction
  }

  get loopIteration(): number {
    return this._loopIteration
  }

  get speed(): number {
    return this._config.speed ?? 1
  }

  set speed(value: number) {
    this._config.speed = value
  }

  /**
   * Start or resume playback.
   * If at the end and direction is forward, reset to beginning.
   * If at the beginning and direction is reverse, reset to end.
   */
  play(): void {
    const duration = this.duration

    // If at the end and going forward, reset to beginning
    if (this._direction === 'forward' && this._currentTime >= duration && duration > 0) {
      this._currentTime = 0
      this._loopIteration = 0
    }
    // If at the beginning and going reverse, reset to end
    else if (this._direction === 'reverse' && this._currentTime <= 0 && duration > 0) {
      this._currentTime = duration
      this._loopIteration = 0
    }

    this._playbackState = 'playing'
  }

  /**
   * Pause playback at current position.
   */
  pause(): void {
    this._playbackState = 'paused'
  }

  /**
   * Stop playback and reset to beginning.
   */
  stop(): void {
    this._playbackState = 'idle'
    this._currentTime = 0
    this._loopIteration = 0
    this._direction = 'forward'
  }

  /**
   * Seek to a specific time.
   */
  seek(time: number): void {
    const maxTime = this.duration > 0 ? this.duration : Infinity
    this._currentTime = Math.max(0, Math.min(time, maxTime))
  }

  /**
   * Toggle or set playback direction.
   */
  reverse(): void {
    this._direction = this._direction === 'forward' ? 'reverse' : 'forward'
  }

  /**
   * Advance the timeline by delta milliseconds.
   * Call this from your animation loop or clock.
   */
  tick(delta: number): void {
    if (this._playbackState !== 'playing') {
      return
    }

    const duration = this.duration
    if (duration <= 0) {
      return
    }

    const scaledDelta = delta * this.speed
    let timeToProcess = scaledDelta
    const maxIterations = 1000 // Safety limit for very fast playback

    for (let i = 0; i < maxIterations && timeToProcess > 0 && this._playbackState === 'playing'; i++) {
      if (this._direction === 'forward') {
        const timeUntilEnd = duration - this._currentTime

        if (timeToProcess >= timeUntilEnd) {
          // Will reach or pass the end
          timeToProcess -= timeUntilEnd
          this._currentTime = duration

          if (!this._handleEndReached()) {
            break
          }
          // _handleEndReached may change direction or wrap time
        } else {
          // Normal advancement
          this._currentTime += timeToProcess
          timeToProcess = 0
        }
      } else {
        // Reverse direction
        const timeUntilStart = this._currentTime

        if (timeToProcess >= timeUntilStart) {
          // Will reach or pass the start
          timeToProcess -= timeUntilStart
          this._currentTime = 0

          if (!this._handleStartReached()) {
            break
          }
          // _handleStartReached may change direction or wrap time
        } else {
          // Normal advancement (in reverse)
          this._currentTime -= timeToProcess
          timeToProcess = 0
        }
      }
    }

    // Emit update
    const state = this.getStateAtTime(this._currentTime)
    this.onUpdate?.(state)
  }

  /**
   * Get the animation state at a specific time.
   */
  getStateAtTime(time: number): AnimationState {
    const values = new Map<string, Map<string, AnimatableValue>>()

    for (const [trackId, player] of this._trackPlayers) {
      const track = player.getTrack()
      const value = player.getValueAtTime(time)

      if (value === undefined) continue

      if (!values.has(track.target)) {
        values.set(track.target, new Map())
      }

      const targetValues = values.get(track.target)!

      // Check if this is a motion path track
      const motionPathTrack = this._motionPathTracks.get(trackId)
      if (motionPathTrack && typeof value === 'number') {
        // Expand motion path progress to x, y, and optionally rotation
        const point = getMotionPathPoint(motionPathTrack.motionPathConfig, value)
        targetValues.set('motionPathX', point.x)
        targetValues.set('motionPathY', point.y)
        if (motionPathTrack.motionPathConfig.autoRotate) {
          targetValues.set('motionPathRotate', point.angle)
        }
      } else {
        targetValues.set(track.property, value)
      }
    }

    return {
      values,
      currentTime: this._currentTime,
      playbackState: this._playbackState,
      direction: this._direction,
      loopIteration: this._loopIteration,
    }
  }

  /**
   * Add a track to the timeline.
   */
  addTrack(track: AnyTrack): void {
    this._tracks.push(track)

    // Create a TrackPlayer for the keyframes (works for both regular and motion path tracks)
    // Motion path tracks use number keyframes for progress (0-1)
    if (isMotionPathTrack(track)) {
      const regularTrack: Track<number> = {
        id: track.id,
        target: track.target,
        property: track.property,
        keyframes: track.keyframes,
      }
      this._trackPlayers.set(track.id, new TrackPlayer(regularTrack))
      this._motionPathTracks.set(track.id, track)
    } else {
      this._trackPlayers.set(track.id, new TrackPlayer(track))
    }
  }

  /**
   * Remove a track by its ID.
   */
  removeTrack(trackId: string): void {
    this._tracks = this._tracks.filter((t) => t.id !== trackId)
    this._trackPlayers.delete(trackId)
    this._motionPathTracks.delete(trackId)
  }

  /**
   * Export timeline as a serializable definition.
   */
  toDefinition(): TimelineDefinition {
    return {
      id: this.id,
      name: this.name,
      config: { ...this._config },
      tracks: [...this._tracks],
    }
  }

  private _calculateDuration(): number {
    let maxDuration = 0
    for (const [, player] of this._trackPlayers) {
      maxDuration = Math.max(maxDuration, player.getDuration())
    }
    return maxDuration
  }

  /**
   * Handle reaching the end of the timeline.
   * Returns true if we looped and should continue, false if we stopped.
   */
  private _handleEndReached(): boolean {
    const loopConfig = this._config.loop ?? 0

    // Check if we should loop
    if (loopConfig === -1 || this._loopIteration < loopConfig) {
      this._loopIteration++

      if (this._config.alternate) {
        this._direction = 'reverse'
        // Stay at duration, will move backward from here
      } else {
        this._currentTime = 0
      }
      return true
    } else {
      // Stop at end
      this._playbackState = 'idle'
      this.onComplete?.()
      return false
    }
  }

  /**
   * Handle reaching the start of the timeline (in reverse).
   * Returns true if we looped and should continue, false if we stopped.
   */
  private _handleStartReached(): boolean {
    const loopConfig = this._config.loop ?? 0

    // Check if we should loop (when going in reverse with alternate)
    if (this._config.alternate && (loopConfig === -1 || this._loopIteration < loopConfig)) {
      this._loopIteration++
      this._direction = 'forward'
      // Stay at 0, will move forward from here
      return true
    } else {
      // Stop at start
      this._playbackState = 'idle'
      this.onComplete?.()
      return false
    }
  }
}
