/**
 * Keeps an audio/video element locked to the animation timeline's clock.
 *
 * The engine stays framework-agnostic — this helper depends only on a small
 * structural subset of `HTMLMediaElement`, so it is trivial to test and can also
 * drive any custom media source. The timeline remains the single source of truth
 * for time; the media follows it, and drift is corrected when it exceeds a
 * tolerance (seeking every frame would stutter playback).
 */

/** The minimal media interface MediaSync needs (satisfied by HTMLMediaElement). */
export interface SyncableMedia {
  /** Playback position in seconds. */
  currentTime: number
  /** Whether the media is currently paused. */
  readonly paused: boolean
  /** Playback rate multiplier. */
  playbackRate: number
  play(): Promise<void> | void
  pause(): void
}

export interface MediaSyncOptions {
  /** Seconds added to the timeline time before mapping to media time. Default 0. */
  offset?: number
  /**
   * Maximum allowed drift in seconds before the media is hard-corrected while
   * playing. Default 0.15s — small enough to stay in sync, large enough to avoid
   * constant re-seeking.
   */
  driftTolerance?: number
}

export class MediaSync {
  private media: SyncableMedia
  private offset: number
  private driftTolerance: number

  constructor(media: SyncableMedia, options: MediaSyncOptions = {}) {
    this.media = media
    this.offset = options.offset ?? 0
    this.driftTolerance = Math.max(0, options.driftTolerance ?? 0.15)
  }

  /** Map a timeline time (ms) to the media's time (seconds), never negative. */
  private targetTime(timelineTimeMs: number): number {
    return Math.max(0, timelineTimeMs / 1000 + this.offset)
  }

  /**
   * Reconcile the media with the timeline for the current frame.
   *
   * @param timelineTimeMs current timeline time in milliseconds
   * @param isPlaying whether the timeline is playing
   */
  update(timelineTimeMs: number, isPlaying: boolean): void {
    const target = this.targetTime(timelineTimeMs)

    if (isPlaying) {
      if (this.media.paused) {
        this.safePlay()
      }
      if (Math.abs(this.media.currentTime - target) > this.driftTolerance) {
        this.media.currentTime = target
      }
    } else {
      if (!this.media.paused) {
        this.media.pause()
      }
      // When paused, keep the frame exactly aligned (cheap, no stutter risk).
      if (this.media.currentTime !== target) {
        this.media.currentTime = target
      }
    }
  }

  /** Hard-align the media to a timeline time (used on explicit seeks). */
  seek(timelineTimeMs: number): void {
    this.media.currentTime = this.targetTime(timelineTimeMs)
  }

  /** Mirror the timeline playback rate onto the media. */
  setRate(rate: number): void {
    this.media.playbackRate = rate
  }

  /** Pause the media and release it. */
  dispose(): void {
    if (!this.media.paused) this.media.pause()
  }

  private safePlay(): void {
    const result = this.media.play()
    // HTMLMediaElement.play() returns a promise that can reject under autoplay
    // policies; swallow it so a blocked audio track never breaks the animation.
    if (result && typeof (result as Promise<void>).catch === 'function') {
      ;(result as Promise<void>).catch(() => {})
    }
  }
}

/**
 * Reconcile a media element that begins at a timeline offset.
 *
 * Before `startMs` the media stays silent at 0; from `startMs` onward it is
 * synced (via `sync`) to the elapsed time. Shared by the editor preview and the
 * embed player so both behave identically.
 */
export function syncMediaElement(
  sync: MediaSync,
  media: SyncableMedia,
  timelineMs: number,
  isPlaying: boolean,
  startMs: number
): void {
  const effective = timelineMs - startMs
  if (effective < 0) {
    if (!media.paused) media.pause()
    media.currentTime = 0
    return
  }
  sync.update(effective, isPlaying)
}
