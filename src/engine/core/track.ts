import type { Track, Keyframe, AnimatableValue } from '../types'
import { getEasingFunction } from '../interpolation/easing'
import { getInterpolator } from '../interpolation/interpolators'

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

/**
 * TrackPlayer computes interpolated values for a track at any given time.
 */
export class TrackPlayer<T extends AnimatableValue = AnimatableValue> {
  private track: Track<T>

  constructor(track: Track<T>) {
    this.track = track
  }

  /**
   * Get the interpolated value at a specific time.
   */
  getValueAtTime(time: number): T | undefined {
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
   * Get the duration of this track (time of last keyframe).
   */
  getDuration(): number {
    const { keyframes } = this.track
    if (keyframes.length === 0) {
      return 0
    }
    return keyframes[keyframes.length - 1].time
  }

  /**
   * Get the track metadata.
   */
  getTrack(): Track<T> {
    return this.track
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
