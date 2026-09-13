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
  TextTrack,
} from '../types'
import { isMotionPathTrack, isSpringTrack, isTextTrack, isInertiaTrack } from '../types'
import { TrackPlayer, SpringTrackPlayer, InertiaTrackPlayer, trackTargets } from './track'
import { getMotionPathPoint } from '../path/motion-path'
import { textAt } from '../text/text-value'

/** Anything that can produce per-target values at a time. */
type AnyTrackPlayer = TrackPlayer | SpringTrackPlayer | InertiaTrackPlayer

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
 * span. The track that starts later wins (ties: added later); see `Timeline.findConflicts`.
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
  private _textTracks: Map<string, TextTrack> = new Map()
  private _config: TimelineConfig
  private _currentTime = 0
  private _playbackState: PlaybackState = 'idle'
  private _direction: PlaybackDirection = 'forward'
  private _loopIteration = 0
  private _explicitDuration?: number
  /** Milliseconds still to wait at a loop boundary before the next iteration */
  private _repeatDelayRemaining = 0
  /**
   * A forward loop reached its end with a repeat delay armed: the playhead
   * holds on the last frame for the delay, then returns to the start.
   */
  private _wrapAfterDelay = false

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
    this._wrapAfterDelay = false
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
    this._wrapAfterDelay = false
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

      // The pause is over: a forward loop now goes back to the start.
      if (this._wrapAfterDelay) {
        this._wrapAfterDelay = false
        this._currentTime = 0
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

    if (this._hasSharedWrites()) {
      this._resolveShared(time, values)
    } else {
      // Fast path: every target+property is driven by one track, so there is
      // nothing to resolve.
      for (const [trackId, player] of this._trackPlayers) {
        const property = player.getTrack().property
        for (const { target, value, start } of player.getTargetValues(time)) {
          this._write(values, trackId, target, property, value, time - start)
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
   * Several tracks drive the same target+property. Which one applies at `time`:
   *
   * 1. Of the tracks that have started (their first keyframe, plus delay and
   *    stagger, is at or before `time`), the one that started LAST.
   * 2. If none has started yet, the one that starts FIRST — so the value before
   *    anything plays is the first animation's starting value.
   * 3. Ties on start time go to the track added LAST.
   *
   * This is what makes a sequence of tweens on one property play as a sequence:
   * a later tween holds its starting value, but does not apply it until its
   * turn. `findConflicts()` reports overlaps by the same rule.
   */
  private _resolveShared(time: number, values: Map<string, Map<string, AnimatableValue>>): void {
    const chosen = new Map<string, { trackId: string; target: string; property: string; value: AnimatableValue; start: number; started: boolean }>()

    for (const [trackId, player] of this._trackPlayers) {
      const property = player.getTrack().property
      for (const { target, value, start } of player.getTargetValues(time)) {
        const key = `${target}\u0000${property}`
        const started = start <= time
        const current = chosen.get(key)
        // Tracks are visited in insertion order, so on a tie this one was added later and wins.
        const wins =
          !current ||
          (started !== current.started ? started : started ? start >= current.start : start <= current.start)
        if (wins) chosen.set(key, { trackId, target, property, value, start, started })
      }
    }

    for (const { trackId, target, property, value, start } of chosen.values()) {
      this._write(values, trackId, target, property, value, time - start)
    }
  }

  /**
   * Write one track's value for a target, expanding the progress of motion paths
   * (into x/y/rotation) and text tracks (into the string). `elapsed` is the time
   * since this target's animation on the track started.
   */
  private _write(
    values: Map<string, Map<string, AnimatableValue>>,
    trackId: string,
    target: string,
    property: string,
    value: AnimatableValue,
    elapsed: number
  ): void {
    if (value === undefined) return

    let targetValues = values.get(target)
    if (!targetValues) {
      targetValues = new Map()
      values.set(target, targetValues)
    }

    const textTrack = this._textTracks.get(trackId)
    if (textTrack && typeof value === 'number') {
      targetValues.set('text', textAt(textTrack.textConfig, value, Math.max(0, elapsed)))
      return
    }

    const motionPathTrack = this._motionPathTracks.get(trackId)
    if (motionPathTrack && typeof value === 'number') {
      const point = getMotionPathPoint(motionPathTrack.motionPathConfig, value)
      targetValues.set('motionPathX', point.x)
      targetValues.set('motionPathY', point.y)
      if (motionPathTrack.motionPathConfig.autoRotate) {
        targetValues.set('motionPathRotate', point.angle)
      }
    } else {
      targetValues.set(property, value)
    }
  }

  /** Cached: does any target+property have more than one track? */
  private _sharedWrites: boolean | null = null

  private _hasSharedWrites(): boolean {
    if (this._sharedWrites === null) {
      const seen = new Set<string>()
      this._sharedWrites = false
      outer: for (const track of this._tracks) {
        for (const target of trackTargets(track)) {
          const key = `${target}\u0000${track.property}`
          if (seen.has(key)) {
            this._sharedWrites = true
            break outer
          }
          seen.add(key)
        }
      }
    }
    return this._sharedWrites
  }

  /**
   * Add a track to the timeline.
   */
  addTrack(track: AnyTrack): void {
    this._tracks.push(track)
    this._sharedWrites = null

    // Inertia tracks are computed from their parameters rather than interpolated.
    if (isInertiaTrack(track)) {
      this._trackPlayers.set(track.id, new InertiaTrackPlayer(track))
      return
    }

    // Spring tracks are simulated rather than interpolated.
    if (isSpringTrack(track)) {
      this._trackPlayers.set(track.id, new SpringTrackPlayer(track))
      this._springTracks.set(track.id, track)
      return
    }

    // Create a TrackPlayer for the keyframes (works for regular, motion path and text tracks)
    // Motion path and text tracks use number keyframes for progress (0-1)
    if (isTextTrack(track)) {
      this._trackPlayers.set(track.id, new TrackPlayer(track as unknown as Track<number>))
      this._textTracks.set(track.id, track)
    } else if (isMotionPathTrack(track)) {
      const regularTrack: Track<number> = {
        id: track.id,
        target: track.target,
        property: track.property,
        keyframes: track.keyframes,
        delay: track.delay,
        endDelay: track.endDelay,
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
   * Replace a track with a new version, keeping its place in the track order
   * (which decides ties when tracks overlap). The new track may have a
   * different id. Does nothing if no track has `trackId`.
   */
  replaceTrack(trackId: string, track: AnyTrack): void {
    const index = this._tracks.findIndex((t) => t.id === trackId)
    if (index < 0) return

    const after = this._tracks.slice(index + 1)
    this.removeTrack(trackId)
    for (const later of after) this.removeTrack(later.id)
    this.addTrack(track)
    for (const later of after) this.addTrack(later)
  }

  /**
   * Remove a track by its ID.
   */
  removeTrack(trackId: string): void {
    this._tracks = this._tracks.filter((t) => t.id !== trackId)
    this._sharedWrites = null
    this._trackPlayers.delete(trackId)
    this._motionPathTracks.delete(trackId)
    this._springTracks.delete(trackId)
    this._textTracks.delete(trackId)
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

    if (isSpringTrack(track as AnyTrack) || isInertiaTrack(track as AnyTrack)) {
      return { from: delay, to: player.getDuration() }
    }

    const keyframes = (track as Track).keyframes
    if (!keyframes || keyframes.length === 0) return undefined

    return { from: keyframes[0].time + delay, to: player.getDuration() }
  }

  /**
   * Overlapping writes to the same target+property.
   *
   * Where two spans overlap, the track that starts later wins from the moment it
   * starts (ties: the one added later) — see `_resolveShared`. That is
   * predictable but silent, so an authoring tool should call this and warn,
   * because a silently discarded stretch of a track looks like a bug.
   */
  findConflicts(): TrackConflict[] {
    const conflicts: TrackConflict[] = []

    // Compare each track against every track added before it. The one that
    // starts later wins; on equal starts, the one added later — matching evaluation.
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

        const laterWins = laterSpan.from >= earlierSpan.from
        for (const target of shared) {
          conflicts.push({
            target,
            property: later.property,
            losingTrackId: laterWins ? earlier.id : later.id,
            winningTrackId: laterWins ? later.id : earlier.id,
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
      } else if (this._repeatDelayRemaining > 0) {
        // Hold the finished frame through the pause (as GSAP does), rather than
        // snapping back to the start and waiting there.
        this._wrapAfterDelay = true
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
