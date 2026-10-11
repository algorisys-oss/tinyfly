import type { AnimatableValue, EasingType, Keyframe, Track, TrackInterpolation } from '../types'
import { TrackPlayer } from '../core/track'

/**
 * A keyframe curve over any input, not just time: the same keys and easings a
 * track has, read at a number of your own. A face that opens its eyes as it
 * grows on screen, a colour that cools with depth, a line width that follows
 * a zoom's scale.
 *
 *     const glow = curve([{ at: 0, value: '#223' }, { at: 300, value: '#ff2bd6', easing: 'ease-out' }])
 *     ctx.strokeStyle = glow(distanceToCamera)
 *
 * Before the first key the curve holds its first value, after the last its
 * last; between keys it eases exactly as a track does.
 */

export interface CurveKey<T extends AnimatableValue = number> {
  /** The input this key is at */
  at: number
  value: T
  /** Easing into this key from the one before (ignored on the first) */
  easing?: EasingType
}

export interface CurveOptions {
  /** How values blend (default by their type: numbers, colours, arrays) */
  interpolation?: TrackInterpolation
}

/** A function of the input from keys, holding the first and last values beyond them. */
export function curve<T extends AnimatableValue = number>(keys: ReadonlyArray<CurveKey<T>>, options: CurveOptions = {}): (x: number) => T {
  if (keys.length === 0) throw new Error('curve: needs at least one key')
  const keyframes: Keyframe<T>[] = keys.map((key) => ({ time: key.at, value: key.value, easing: key.easing })).sort((a, b) => a.time - b.time)
  const track: Track<T> = { id: 'curve', target: 'curve', property: 'value', keyframes, interpolation: options.interpolation }
  const player = new TrackPlayer(track)
  return (x: number) => player.getValueAtTime(x) as T
}
