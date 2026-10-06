import type { Keyframe, Track } from '../../engine/types'
import { actKeyframes, type ActingKey, type ActingOptions, type ActingRig } from './acting'
import { HUMAN_ACTING_RIG, STICK_ACTING_RIG } from './rigs'
import { resolvePoseKeys, type PoseKey } from '../stick-figure'
import { resolveCharacterPoseKeys, type CharacterPoseKey } from '../character'
import { HUMAN_REST } from '../species/human'
import type { Pose } from '../rig/body-plan'

export interface ActTracksOptions extends ActingOptions {
  /** The rig's fields, if not the default for this figure */
  rig?: ActingRig
}

/** Keyframes per field as tracks on `target`, ids as `poseTracks` names them. */
function toTracks(target: string, keyframes: Record<string, Keyframe<number>[]>): Track[] {
  return Object.entries(keyframes).map(([field, frames]) => ({ id: `${target}-${field}`, target, property: field, keyframes: frames }))
}

/**
 * Like `poseTracks`, with acting: the stick figure winds up, overshoots and
 * settles, its limbs overlap, its eyes lead and it blinks as it turns. The
 * keys say where the poses are and when they are reached; the style says how
 * the figure gets there.
 *
 * ```ts
 * actTracks('hero', [
 *   { time: 0, pose: 'rest' },
 *   { time: 900, pose: 'wave' },
 *   { time: 2200, pose: 'surprised' },
 * ], { style: 'snappy' })
 * ```
 */
export function actTracks(target: string, keys: PoseKey[], options: ActTracksOptions = {}): Track[] {
  const poses = resolvePoseKeys(keys)
  const acting: ActingKey[] = keys.map((key, index) => ({ time: key.time, pose: { ...poses[index] }, easing: key.easing, act: key.act }))
  return toTracks(target, actKeyframes(acting, options.rig ?? STICK_ACTING_RIG, options))
}

/** Like `characterPoseTracks`, with acting (see {@link actTracks}). */
export function actCharacterTracks(target: string, keys: CharacterPoseKey[], options: ActTracksOptions & { rest?: Pose } = {}): Track[] {
  const rest = options.rest ?? HUMAN_REST
  const poses = resolveCharacterPoseKeys(keys, rest)
  // Fields a key leaves out keep rest, so every key carries every field.
  const acting: ActingKey[] = keys.map((key, index) => ({ time: key.time, pose: { ...rest, ...poses[index] }, easing: key.easing, act: key.act }))
  return toTracks(target, actKeyframes(acting, options.rig ?? HUMAN_ACTING_RIG, options))
}
