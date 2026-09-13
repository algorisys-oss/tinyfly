import type { Track, Keyframe, AnimatableValue, SpringTrack, InertiaTrack, StaggerConfig } from '../types'
import { getEasingFunction } from '../interpolation/easing'
import { getInterpolator } from '../interpolation/interpolators'
import { staggerOffset, staggerSpan } from './stagger'
import { SpringSampler } from './spring'
import { inertiaDuration, inertiaValueAt } from './inertia'

/**
 * Create a track with sorted keyframes.
 */
export function createTrack<T extends AnimatableValue>(
  options: Track<T>
): Track<T> {
  const sortedKeyframes = [...options.keyframes].sort((a, b) => a.time - b.time)
  return {
    ...options,
    keyframes: sortedKeyframes,
  }
}

/** One target's value at a point in time. */
export interface TargetValue<T extends AnimatableValue = AnimatableValue> {
  target: string
  value: T
  /** When this target's animation on the track starts, in timeline milliseconds */
  start: number
}

/**
 * The targets a track drives, in order. A track either names one `target` or
 * fans across `targets`; the multi-target form is what runtime stagger uses.
 */
export function trackTargets(track: { target: string; targets?: string[] }): string[] {
  return track.targets && track.targets.length > 0 ? track.targets : [track.target]
}

/**
 * Time offset applied to a track's own timeline for the target at `index`:
 * its `delay` plus its share of any stagger.
 */
function offsetFor(
  index: number,
  count: number,
  delay: number | undefined,
  stagger: StaggerConfig | undefined
): number {
  const base = delay ?? 0
  if (!stagger || count <= 1) return base
  return base + staggerOffset(index, count, stagger)
}

/**
 * TrackPlayer computes interpolated values for a track at any given time.
 */
export class TrackPlayer<T extends AnimatableValue = AnimatableValue> {
  private track: Track<T>
  private targets: string[]

  constructor(track: Track<T>) {
    this.track = track
    this.targets = trackTargets(track)
  }

  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(time: number): T | undefined {
    return this.valueForOffset(time - offsetFor(0, this.targets.length, this.track.delay, this.track.stagger))
  }

  /**
   * Every target's value at a specific time, in target order.
   *
   * Single-target tracks yield one entry; staggered tracks yield one per target,
   * each sampled at its own offset time.
   */
  getTargetValues(time: number): TargetValue<T>[] {
    const count = this.targets.length
    const out: TargetValue<T>[] = []

    for (let i = 0; i < count; i++) {
      const offset = offsetFor(i, count, this.track.delay, this.track.stagger)
      const value = this.valueForOffset(time - offset)
      if (value === undefined) continue
      out.push({ target: this.targets[i], value, start: offset + this.track.keyframes[0].time })
    }

    return out
  }

  /**
   * Get the duration of this track — the last keyframe, plus any delay, the
   * widest stagger offset, and any trailing hold.
   */
  getDuration(): number {
    const { keyframes } = this.track
    if (keyframes.length === 0) {
      return 0
    }

    const last = keyframes[keyframes.length - 1].time
    const spread = this.track.stagger ? staggerSpan(this.targets.length, this.track.stagger) : 0
    return last + (this.track.delay ?? 0) + spread + (this.track.endDelay ?? 0)
  }

  /**
   * Get the track metadata.
   */
  getTrack(): Track<T> {
    return this.track
  }

  /** Interpolated value at a time already shifted into the track's own frame. */
  private valueForOffset(time: number): T | undefined {
    const { keyframes } = this.track

    if (keyframes.length === 0) {
      return undefined
    }

    if (keyframes.length === 1) {
      return keyframes[0].value
    }

    // Before first keyframe
    if (time <= keyframes[0].time) {
      return keyframes[0].value
    }

    // After last keyframe
    if (time >= keyframes[keyframes.length - 1].time) {
      return keyframes[keyframes.length - 1].value
    }

    // Find surrounding keyframes
    const { from, to } = this.findSurroundingKeyframes(time)
    if (!from || !to) {
      return undefined
    }

    // Exact match on keyframe
    if (from.time === time) {
      return from.value
    }

    // Calculate progress between keyframes
    const segmentDuration = to.time - from.time
    const segmentProgress = (time - from.time) / segmentDuration

    // Apply easing (easing is defined on the "to" keyframe)
    const easingFn = getEasingFunction(to.easing)
    const easedProgress = easingFn(segmentProgress)

    // Interpolate value
    const interpolator = getInterpolator(from.value)
    return interpolator(from.value, to.value, easedProgress)
  }

  /**
   * Find the keyframes surrounding a given time.
   */
  private findSurroundingKeyframes(
    time: number
  ): { from: Keyframe<T> | null; to: Keyframe<T> | null } {
    const { keyframes } = this.track

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
        return { from: keyframes[i], to: keyframes[i + 1] }
      }
    }

    return { from: null, to: null }
  }
}

/**
 * SpringTrackPlayer evaluates a spring track.
 *
 * Mirrors `TrackPlayer`'s surface so `Timeline` can treat both the same way.
 * The underlying `SpringSampler` caches its simulation, so scrubbing is cheap
 * after the first pass.
 */
export class SpringTrackPlayer {
  private track: SpringTrack
  private targets: string[]
  private sampler: SpringSampler

  constructor(track: SpringTrack) {
    this.track = track
    this.targets = trackTargets(track)
    this.sampler = new SpringSampler(track.spring)
  }

  getValueAtTime(time: number): number {
    return this.sampler.valueAt(time - offsetFor(0, this.targets.length, this.track.delay, this.track.stagger))
  }

  getTargetValues(time: number): TargetValue<number>[] {
    const count = this.targets.length
    const out: TargetValue<number>[] = []

    for (let i = 0; i < count; i++) {
      const offset = offsetFor(i, count, this.track.delay, this.track.stagger)
      out.push({ target: this.targets[i], value: this.sampler.valueAt(time - offset), start: offset })
    }

    return out
  }

  /** Settle time plus delay and the widest stagger offset. */
  getDuration(): number {
    const spread = this.track.stagger ? staggerSpan(this.targets.length, this.track.stagger) : 0
    return this.sampler.settleTime() + (this.track.delay ?? 0) + spread
  }

  getTrack(): SpringTrack {
    return this.track
  }
}

/**
 * InertiaTrackPlayer evaluates a throw. The motion is closed-form, so there is
 * nothing to simulate or cache: each value is computed directly from time.
 */
export class InertiaTrackPlayer {
  private track: InertiaTrack
  private targets: string[]
  private duration: number

  constructor(track: InertiaTrack) {
    this.track = track
    this.targets = trackTargets(track)
    this.duration = inertiaDuration(track.inertia)
  }

  getValueAtTime(time: number): number {
    return inertiaValueAt(this.track.inertia, time - offsetFor(0, this.targets.length, this.track.delay, this.track.stagger))
  }

  getTargetValues(time: number): TargetValue<number>[] {
    const count = this.targets.length
    const out: TargetValue<number>[] = []
    for (let i = 0; i < count; i++) {
      const offset = offsetFor(i, count, this.track.delay, this.track.stagger)
      out.push({ target: this.targets[i], value: inertiaValueAt(this.track.inertia, time - offset), start: offset })
    }
    return out
  }

  /** Settle time plus delay and the widest stagger offset. */
  getDuration(): number {
    const spread = this.track.stagger ? staggerSpan(this.targets.length, this.track.stagger) : 0
    return this.duration + (this.track.delay ?? 0) + spread
  }

  getTrack(): InertiaTrack {
    return this.track
  }
}
