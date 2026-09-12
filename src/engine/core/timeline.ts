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
  SpringTrack,
} from '../types'
import { isMotionPathTrack, isSpringTrack } from '../types'
import { TrackPlayer, SpringTrackPlayer, trackTargets } from './track'
import { getMotionPathPoint } from '../path/motion-path'

/** Anything that can produce per-target values at a time. */
type AnyTrackPlayer = TrackPlayer | SpringTrackPlayer

/** Selects a subset of a timeline's tracks. All given fields must match. */
export interface TrackFilter {
  /** Match tracks driving this target (including one of a multi-target set) */
  target?: string
  /** Match tracks driving this property */
  property?: string
  /** Match tracks whose active span overlaps [from, to] in milliseconds */
  timeRange?: { from: number; to: number }
  /** Match a track by id */
  id?: string
}

/**
 * Two tracks writing the same property of the same target over an overlapping
 * span. The later-added track wins; see `Timeline.findConflicts`.
 */
export interface TrackConflict {
  target: string
  property: string
  /** Track whose values are discarded where the spans overlap */
  losingTrackId: string
  /** Track whose values are applied */
  winningTrackId: string
}

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
  private _trackPlayers: Map<string, AnyTrackPlayer> = new Map()
  private _motionPathTracks: Map<string, MotionPathTrack> = new Map()
  private _springTracks: Map<string, SpringTrack> = new Map()
  private _config: TimelineConfig
  private _currentTime = 0
  private _playbackState: PlaybackState = 'idle'
  private _direction: PlaybackDirection = 'forward'
  private _loopIteration = 0
  private _explicitDuration?: number
  /** Milliseconds still to wait at a loop boundary before the next iteration */
  private _repeatDelayRemaining = 0

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

  /**
   * Set an explicit timeline duration (ms). Pass `undefined` to fall back to the
   * duration calculated from the last keyframe across all tracks.
   */
  setDuration(duration: number | undefined): void {
    this._explicitDuration = duration
    if (duration !== undefined) {
      this._config = { ...this._config, duration }
    }
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
    this._repeatDelayRemaining = 0
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
    // An explicit seek cancels any pending between-loops pause.
    this._repeatDelayRemaining = 0
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

    // A pending repeat delay holds the playhead at the loop boundary. It is
    // consumed from the same scaled delta, so `speed` affects the pause too.
    if (this._repeatDelayRemaining > 0) {
      const consumed = Math.min(this._repeatDelayRemaining, timeToProcess)
      this._repeatDelayRemaining -= consumed
      timeToProcess -= consumed

      if (this._repeatDelayRemaining > 0) {
        // Still waiting — emit the held frame and stop here.
        this.onUpdate?.(this.getStateAtTime(this._currentTime))
        return
      }
    }

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

    // Tracks are evaluated in insertion order and write into a shared per-target
    // map, so when two tracks drive the same target+property over overlapping
    // times, the LAST TRACK ADDED WINS. That is the documented conflict rule —
    // see `findConflicts()`, which surfaces such overlaps so an editor can warn
    // rather than letting one silently swallow the other.
    for (const [trackId, player] of this._trackPlayers) {
      const track = player.getTrack()

      for (const { target, value } of player.getTargetValues(time)) {
        if (value === undefined) continue

        if (!values.has(target)) {
          values.set(target, new Map())
        }

        const targetValues = values.get(target)!

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

    // Spring tracks are simulated rather than interpolated.
    if (isSpringTrack(track)) {
      this._trackPlayers.set(track.id, new SpringTrackPlayer(track))
      this._springTracks.set(track.id, track)
      return
    }

    // Create a TrackPlayer for the keyframes (works for both regular and motion path tracks)
    // Motion path tracks use number keyframes for progress (0-1)
    if (isMotionPathTrack(track)) {
      const regularTrack: Track<number> = {
        id: track.id,
        target: track.target,
        property: track.property,
        keyframes: track.keyframes,
        delay: track.delay,
        targets: track.targets,
        stagger: track.stagger,
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
    this._springTracks.delete(trackId)
  }

  /**
   * Tracks matching a filter. All provided fields must match (AND).
   *
   * This is the closest principled equivalent to GSAP's per-tween handle: we
   * have no live tween objects to hold, so a "tween" is addressed by describing
   * the tracks it produced.
   */
  getTracks(filter: TrackFilter = {}): AnyTrack[] {
    return this._tracks.filter((track) => this._matches(track, filter))
  }

  /**
   * Remove every track matching a filter. Returns the ids removed.
   *
   * `timeline.removeTracks({ target: 'box' })` is the equivalent of killing all
   * tweens on an element.
   */
  removeTracks(filter: TrackFilter = {}): string[] {
    const doomed = this.getTracks(filter).map((t) => t.id)
    for (const id of doomed) {
      this.removeTrack(id)
    }
    return doomed
  }

  /**
   * The time span a track is active over: [start, end] in milliseconds.
   */
  getTrackSpan(trackId: string): { from: number; to: number } | undefined {
    const player = this._trackPlayers.get(trackId)
    if (!player) return undefined

    const track = player.getTrack()
    const delay = track.delay ?? 0

    if (isSpringTrack(track as AnyTrack)) {
      return { from: delay, to: player.getDuration() }
    }

    const keyframes = (track as Track).keyframes
    if (!keyframes || keyframes.length === 0) return undefined

    return { from: keyframes[0].time + delay, to: player.getDuration() }
  }

  /**
   * Overlapping writes to the same target+property.
   *
   * The engine resolves these as last-added-wins (see `getStateAtTime`), which
   * is predictable but silent — an authoring tool should call this and warn,
   * because a silently discarded track looks like a bug in the animation.
   */
  findConflicts(): TrackConflict[] {
    const conflicts: TrackConflict[] = []

    // Compare each track against every track added before it. The earlier one
    // loses, matching evaluation order.
    for (let i = 0; i < this._tracks.length; i++) {
      const later = this._tracks[i]
      const laterSpan = this.getTrackSpan(later.id)
      if (!laterSpan) continue

      for (let j = 0; j < i; j++) {
        const earlier = this._tracks[j]
        if (earlier.property !== later.property) continue

        const shared = trackTargets(earlier).filter((t) => trackTargets(later).includes(t))
        if (shared.length === 0) continue

        const earlierSpan = this.getTrackSpan(earlier.id)
        if (!earlierSpan) continue

        const overlaps = earlierSpan.from <= laterSpan.to && laterSpan.from <= earlierSpan.to
        if (!overlaps) continue

        for (const target of shared) {
          conflicts.push({
            target,
            property: later.property,
            losingTrackId: earlier.id,
            winningTrackId: later.id,
          })
        }
      }
    }

    return conflicts
  }

  private _matches(track: AnyTrack, filter: TrackFilter): boolean {
    if (filter.id !== undefined && track.id !== filter.id) return false
    if (filter.property !== undefined && track.property !== filter.property) return false
    if (filter.target !== undefined && !trackTargets(track).includes(filter.target)) return false

    if (filter.timeRange) {
      const span = this.getTrackSpan(track.id)
      if (!span) return false
      if (span.to < filter.timeRange.from || span.from > filter.timeRange.to) return false
    }

    return true
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

  /** Start the between-iterations pause, if the timeline configures one. */
  private _armRepeatDelay(): void {
    this._repeatDelayRemaining = this._config.repeatDelay ?? 0
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
      this._armRepeatDelay()

      if (this._config.alternate) {
        this._direction = 'reverse'
        // Stay at duration, will move backward from here
      } else {
        this._currentTime = 0
      }
      return this._repeatDelayRemaining === 0
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
      this._armRepeatDelay()
      this._direction = 'forward'
      // Stay at 0, will move forward from here
      return this._repeatDelayRemaining === 0
    } else {
      // Stop at start
      this._playbackState = 'idle'
      this.onComplete?.()
      return false
    }
  }
}
