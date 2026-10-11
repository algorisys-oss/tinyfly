import type { Keyframe, Track } from '../../engine/types'
import { Timeline } from '../../engine/core/timeline'
import { scriptTracks, type Beat, type ScriptOptions, type ScriptResult } from './script'
import { lipSyncOver } from './lip-sync'
import { actCharacterTracks } from './act-tracks'
import { stickToHuman } from '../stick-to-human'
import { mirrorHumanPose, HUMAN_REST } from '../species/human'
import { humanGaitStrideLength } from '../species/human-motion'
import { GAITS, gaitStrideLength, type Gait } from '../gaits'
import { resolvePoseKeys } from '../stick-figure'
import { characterJoints, type Character, type CharacterPoseKey } from '../character'

/**
 * Beat scripts for v2 characters: the same beats `scriptTracks` compiles for
 * the stick figure (walk and the other gaits, `say`, `look`, `face`, poses,
 * gags, `zip`, `leap`, `grab`, `throw`, `kick`, `put`, `write`, `push`, your
 * own actions and gaits), compiled into tracks for a `characterTarget`.
 *
 * ```js
 * const amy = character(castMember('youngWoman', 170))
 * const script = characterScript('amy', amy, [
 *   { do: 'walk', to: 330, mood: 'happy' },
 *   { do: 'say', say: 'Is that box ticking?', mood: 'worried' },
 *   { do: 'take' },
 *   { do: 'zip', to: -200 },
 * ], { from: 90 })
 * const timeline = deserializeTimeline({ id: 'scene', tracks: script.tracks })
 * ```
 *
 * How it works: the stick-figure script plans the story (timing, where the
 * figure is, which way it faces, its gait, its speech); its key poses are
 * taken onto the human body (`stickToHuman`, mirrored when it faces left, so
 * the character's `turn` runs negative that way); the human acting pass then
 * winds up, overshoots and overlaps on this body, and the lines are
 * lip-synced over its mouth. The walk phase is rekeyed to the character's own
 * stride (its height and legs), so its feet stay planted. The `walk`,
 * `walking` and `gait` tracks step the gait as the target draws, as the 3D
 * character object does.
 *
 * Hands reach in the stick figure's proportions, so a `grab` or a `point`
 * lands near its target on the human body, not exactly on it.
 */

export type CharacterScriptOptions = Omit<ScriptOptions, 'height'>

export interface CharacterScriptResult extends Omit<ScriptResult, 'keys'> {
  /** The key poses on the human body, before acting */
  keys: CharacterPoseKey[]
}

/** The tracks the stick-figure script writes beside its pose: taken as they are. */
const CARRIED = new Set(['x', 'y', 'walking', 'gait'])

/** Thigh plus shin as a fraction of the height, as `humanGaitStrideLength` has it. */
const LEG = 0.215 + 0.205

/**
 * Ground one gait cycle covers for this character, px: its own height and
 * legs (a child's are shorter), so the feet stay planted.
 */
export function characterStrideLength(who: Character, gait: Gait | string | undefined, stride = 1): number {
  // Thigh plus shin, measured along the bones (the rest pose splays the legs a little).
  const { points } = characterJoints(who, HUMAN_REST)
  const hip = points['hip.left']
  const knee = points['knee.left']
  const ankle = points['ankle.left']
  const legPx = hip && knee && ankle ? Math.hypot(knee.x - hip.x, knee.y - hip.y) + Math.hypot(ankle.x - knee.x, ankle.y - knee.y) : LEG * who.height
  return humanGaitStrideLength(gait, legPx / LEG, stride)
}

export function characterScript(target: string, who: Character, beats: Beat[], options: CharacterScriptOptions = {}): CharacterScriptResult {
  const planned = scriptTracks(target, beats, { ...options, height: who.height })

  // Which way it faces at each moment: the facing track steps between ±1.
  const facingKeys = (planned.tracks.find((track) => track.property === 'facing')?.keyframes ?? []) as Keyframe<number>[]
  const facingAt = (time: number) => {
    let facing: number = options.facing ?? 1
    for (const key of facingKeys) if (key.time <= time) facing = key.value
    return facing
  }

  // The key poses on the human body, mirrored when the figure faces left.
  const stickPoses = resolvePoseKeys(planned.keys)
  const keys: CharacterPoseKey[] = planned.keys.map((key, index) => {
    const human = stickToHuman(stickPoses[index])
    return {
      time: key.time,
      pose: facingAt(key.time) < 0 ? mirrorHumanPose(human) : human,
      ...(key.easing ? { easing: key.easing } : {}),
      ...(key.act === false ? { act: false } : {}),
    }
  })
  // The acting options (style, exaggeration…) carry over; `rest` and `start` are stick poses, used by the plan above.
  const { rest: _rest, start: _start, ...acting } = options
  const acted = actCharacterTracks(target, keys, acting)
  const voiced = lipSyncOver(target, acted, planned.lines, { energy: options.energy })

  const carried = planned.tracks.filter((track) => CARRIED.has(track.property))
  const walk = planned.tracks.find((track) => track.property === 'walk')
  const tracks = walk ? [...voiced, ...carried, rekeyedWalk(target, walk, planned.tracks, who, options)] : [...voiced, ...carried]
  return { tracks, duration: planned.duration, lines: planned.lines, keys, beats: planned.beats, effects: planned.effects }
}

/**
 * The walk phase keyed for the character's stride: the stick-figure script
 * keyed it as distance over its own stride, so each step between keys is
 * scaled by the two strides' ratio for the gait in use then.
 */
function rekeyedWalk(target: string, walk: Track, tracks: Track[], who: Character, options: CharacterScriptOptions): Track {
  const gaitTrack = tracks.find((track) => track.property === 'gait')
  const gaits = gaitTrack ? new Timeline({ id: `${target}-gait-of`, tracks: [gaitTrack] }) : undefined
  const gaitAt = (time: number): Gait | string | undefined => {
    const name = gaits?.getStateAtTime(time).values.get(target)?.get('gait')
    if (typeof name !== 'string') return undefined
    return (GAITS as Record<string, Gait>)[name] ?? options.gaits?.[name] ?? name
  }
  const keys = walk.keyframes as Keyframe<number>[]
  const out: Keyframe<number>[] = []
  let phase = keys[0]?.value ?? 0
  keys.forEach((key, index) => {
    if (index > 0) {
      const previous = keys[index - 1]
      const gait = gaitAt((previous.time + key.time) / 2)
      const stick = gaitStrideLength(gait, who.height)
      const human = characterStrideLength(who, gait)
      phase += (key.value - previous.value) * (human > 0 ? stick / human : 1)
    } else {
      phase = key.value
    }
    out.push({ ...key, value: phase })
  })
  return { ...walk, keyframes: out }
}
