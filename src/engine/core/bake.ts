import type { AnyTrack, Track, Keyframe, EasingType, KeyframedTrack, SpringTrack, InertiaTrack } from '../types'
import { isSpringTrack, isInertiaTrack, hasKeyframes } from '../types'
import { getEasingFunction } from '../interpolation/easing'
import { getInterpolator } from '../interpolation/interpolators'
import { SpringSampler } from './spring'
import { inertiaDuration, inertiaRest, inertiaValueAt } from './inertia'

/**
 * Baking: turning a computed animation into plain keyframes.
 *
 * Two callers need this. Export formats (CSS, Lottie, GIF) can only express
 * keyframes, so a spring track has to be sampled before it can leave the
 * engine. And the GSAP compat layer offers eases we have no closed form for
 * (elastic, bounce, steps), which are handled the same way.
 *
 * Baking is lossy in file size, not in fidelity: sampling a deterministic
 * simulation at a fixed rate always produces the same keyframes.
 */

/** Default sampling interval, in milliseconds (60fps). */
export const DEFAULT_BAKE_INTERVAL_MS = 1000 / 60

export interface BakeOptions {
  /** Milliseconds between sampled keyframes (default: one 60fps frame) */
  intervalMs?: number
  /**
   * Drop a sample when it sits within this distance of the straight line
   * between its neighbours. Keeps baked output small without visible change.
   * Set to 0 to keep every sample.
   */
  tolerance?: number
}

/**
 * Sample a spring track into an ordinary keyframe track.
 *
 * The result is `linear`-eased between samples — the curve lives in the sample
 * positions, not in the easing.
 */
export function bakeSpringTrack(track: AnyTrack, options: BakeOptions = {}): Track<number> {
  if (!isSpringTrack(track)) {
    throw new Error(`bakeSpringTrack: track "${track.id}" is not a spring track`)
  }
  const sampler = new SpringSampler(track.spring)
  return bakeComputedTrack(track, (t) => sampler.valueAt(t), sampler.settleTime(), track.spring.from, track.spring.to, options)
}

/**
 * Sample an inertia track into an ordinary keyframe track, the same way
 * springs are baked.
 */
export function bakeInertiaTrack(track: AnyTrack, options: BakeOptions = {}): Track<number> {
  if (!isInertiaTrack(track)) {
    throw new Error(`bakeInertiaTrack: track "${track.id}" is not an inertia track`)
  }
  const config = track.inertia
  return bakeComputedTrack(
    track,
    (t) => inertiaValueAt(config, t),
    inertiaDuration(config),
    config.from,
    inertiaRest(config),
    options
  )
}

/** Sample a track whose value is computed from time (spring or inertia) into keyframes. */
function bakeComputedTrack(
  track: SpringTrack | InertiaTrack,
  valueAt: (timeMs: number) => number,
  settle: number,
  startValue: number,
  restValue: number,
  options: BakeOptions
): Track<number> {
  const interval = options.intervalMs ?? DEFAULT_BAKE_INTERVAL_MS
  const tolerance = options.tolerance ?? 0.01
  const delay = track.delay ?? 0

  const samples: Keyframe<number>[] = []
  for (let t = 0; t <= settle; t += interval) {
    samples.push({ time: t + delay, value: valueAt(t), easing: 'linear' })
  }

  // Always land exactly on the resting value.
  const last = samples[samples.length - 1]
  if (!last || last.time < settle + delay) {
    samples.push({ time: settle + delay, value: restValue, easing: 'linear' })
  } else {
    last.value = restValue
  }

  // A delayed track holds its start value until it begins.
  if (delay > 0) {
    samples.unshift({ time: 0, value: startValue, easing: 'linear' })
  }

  return {
    id: track.id,
    target: track.target,
    property: track.property,
    keyframes: tolerance > 0 ? simplifyKeyframes(samples, tolerance) : samples,
    ...(track.targets && { targets: [...track.targets] }),
    ...(track.stagger && { stagger: { ...track.stagger } }),
  }
}

/**
 * Replace a keyframe segment's easing with sampled intermediate keyframes.
 *
 * Used for eases that cannot be represented as a single cubic-bezier — elastic,
 * bounce and steps overshoot or jump, which a bezier cannot do. The segment
 * keeps its endpoints and gains `linear` samples in between.
 */
export function bakeEasing<T extends Keyframe['value']>(
  from: Keyframe<T>,
  to: Keyframe<T>,
  easing: EasingType | ((t: number) => number),
  options: BakeOptions = {}
): Keyframe<T>[] {
  const interval = options.intervalMs ?? DEFAULT_BAKE_INTERVAL_MS
  const easingFn = typeof easing === 'function' ? easing : getEasingFunction(easing)
  const interpolator = getInterpolator(from.value)
  const span = to.time - from.time

  if (span <= 0) return [to]

  const out: Keyframe<T>[] = []
  for (let t = interval; t < span; t += interval) {
    const progress = t / span
    out.push({
      time: from.time + t,
      value: interpolator(from.value, to.value, easingFn(progress)) as T,
      easing: 'linear',
    })
  }

  out.push({ ...to, easing: 'linear' })
  return out
}

/**
 * Any track as a keyframed track — springs and inertia get baked, everything
 * else passes through untouched. Export paths use this so they never see a
 * computed track.
 */
export function toKeyframedTrack(track: AnyTrack, options?: BakeOptions): KeyframedTrack {
  if (isSpringTrack(track)) return bakeSpringTrack(track, options)
  if (isInertiaTrack(track)) return bakeInertiaTrack(track, options)
  return track
}

/** Bake a whole track list for export. */
export function toKeyframedTracks(tracks: AnyTrack[], options?: BakeOptions): KeyframedTrack[] {
  return tracks.filter(hasKeyframes).concat(
    tracks.filter(isSpringTrack).map((t) => bakeSpringTrack(t, options)),
    tracks.filter(isInertiaTrack).map((t) => bakeInertiaTrack(t, options))
  )
}

/**
 * Drop keyframes that lie within `tolerance` of the line between their
 * neighbours. A plain sequential pass — not Douglas–Peucker — because sampled
 * springs are smooth and dense, so the simple version removes nearly as much
 * for a fraction of the complexity.
 */
export function simplifyKeyframes(
  keyframes: Keyframe<number>[],
  tolerance: number
): Keyframe<number>[] {
  if (keyframes.length <= 2) return keyframes

  const out: Keyframe<number>[] = [keyframes[0]]

  for (let i = 1; i < keyframes.length - 1; i++) {
    const prev = out[out.length - 1]
    const current = keyframes[i]
    const next = keyframes[i + 1]

    const span = next.time - prev.time
    if (span <= 0) continue

    const t = (current.time - prev.time) / span
    const straightLine = prev.value + (next.value - prev.value) * t

    if (Math.abs(current.value - straightLine) > tolerance) {
      out.push(current)
    }
  }

  out.push(keyframes[keyframes.length - 1])
  return out
}
