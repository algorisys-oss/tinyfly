import type { Keyframe } from '../../engine/types'
import { DANCE_STYLES, FLIPS, danceFrame, danceTravel, flipPose, flipTravel, mirrorHumanPose, routineBeats, stickToHuman, HUMAN_REST, type DanceStyleName, type FlipName } from '../../characters'
import type { CharacterPose, DanceFrame } from '../../characters'

/**
 * Dances and flips for the editor's Character element: the stick figure's
 * dances, sampled a few times a beat, turned into v2 character pose fields
 * (`stickToHuman`) and written as ordinary keyframe tracks, so they save,
 * scrub, export and can be edited key by key like any other animation.
 */

export type PropertyKeyframes = { property: string; keyframes: Keyframe[] }

/**
 * Keyframes from poses sampled at times: one track per character field that
 * moves or leaves rest. Hand fields (no rest in `HUMAN_REST`) are kept whenever
 * they are there: a cartoon hand needs its whole shape.
 */
function tracksFromPoses(samples: Array<{ time: number; pose: CharacterPose }>): PropertyKeyframes[] {
  const poses = samples.map((s) => ({ time: Math.round(s.time), pose: s.pose }))
  return Object.keys(poses[0].pose)
    .filter((field) => !(field in HUMAN_REST) || poses.some((p) => p.pose[field] !== poses[0].pose[field] || p.pose[field] !== HUMAN_REST[field]))
    .map((field) => ({ property: field, keyframes: poses.map((p) => ({ time: p.time, value: p.pose[field] })) }))
}

/** A stick frame on the character: with its hand shapes when the character has cartoon hands. */
const onCharacter = (frame: DanceFrame, hands: boolean): CharacterPose => stickToHuman(frame.pose, hands ? frame.hands : undefined)

export interface CharacterDanceOptions {
  style: DanceStyleName
  /** One move on a loop; omit for the style's whole routine */
  move?: string
  bpm: number
  /** How many beats (default: the routine, or one loop of the move) */
  beats?: number
  /** Playhead, ms */
  start: number
  /** Keyframes per beat (default 4: enough for snaps and hits) */
  samplesPerBeat?: number
  /** Key the hand shapes too (for a character with cartoon hands) */
  hands?: boolean
  /** The character's height, px: with it a travelling dance (a glide, a moonwalk) moves it, as an `x` track */
  height?: number
  /** The `x` offset the character is at when the dance starts (default 0) */
  x?: number
  /** -1 for a character facing left: it dances the mirror image, and glides travel the other way */
  facing?: number
}

/** -1 when a character's `turn` faces it screen-left (between the back and the front, going round), else 1. */
export function facingOf(turn: number): number {
  const quarter = ((turn % 4) + 4) % 4
  return quarter > 2 && quarter < 4 ? -1 : 1
}

/**
 * A dance as character keyframe tracks from `start`, travelling (glides,
 * moonwalks) with `height`. Facing left, it is the mirror image, turned
 * between 3 (side-on, facing left, as the Side (left) view) and 4 (front-on),
 * the way flips face left too, and the travel goes the other way.
 */
export function characterDanceTracks(options: CharacterDanceOptions): PropertyKeyframes[] {
  const style = DANCE_STYLES[options.style]
  const beats = options.beats ?? (options.move ? style.moves[options.move].beats : routineBeats(style))
  const perBeat = options.samplesPerBeat ?? 4
  const msPerBeat = 60000 / options.bpm
  const count = Math.round(beats * perBeat)
  const beatAt = (i: number) => i / perBeat
  const timeAt = (i: number) => options.start + beatAt(i) * msPerBeat
  const facing = (options.facing ?? 1) < 0 ? -1 : 1
  const tracks = tracksFromPoses(
    Array.from({ length: count + 1 }, (_, i) => {
      const pose = onCharacter(danceFrame(style, beatAt(i), { move: options.move }), options.hands ?? false)
      if (facing > 0) return { time: timeAt(i), pose }
      // The mirror turns the other way (-0.9 for side-on); a whole turn on keeps it next to the Side (left) view.
      const mirrored = mirrorHumanPose(pose)
      return { time: timeAt(i), pose: { ...mirrored, turn: 4 + mirrored.turn } }
    })
  )
  const travel = (i: number) => facing * danceTravel(style, beatAt(i), { move: options.move })
  if (options.height !== undefined && Array.from({ length: count + 1 }, (_, i) => i).some((i) => travel(i) !== 0)) {
    const x0 = options.x ?? 0
    // Linear between samples: glides go at a steady speed, so the planted foot stays put.
    tracks.push({
      property: 'x',
      keyframes: Array.from({ length: count + 1 }, (_, i) => ({ time: Math.round(timeAt(i)), value: x0 + options.height! * travel(i), easing: 'linear' as const })),
    })
  }
  return tracks
}

export interface CharacterFlipOptions {
  /** Playhead, ms */
  start: number
  /** The character's height, px: with it the flip travels, as an `x` track */
  height?: number
  /** The `x` offset the character is at when the flip starts (default 0) */
  x?: number
  /** -1 for a character facing left (view `turn` 3): it flips and travels that way */
  facing?: number
  samples?: number
}

/** A flip as character keyframe tracks from `start`, at its natural speed, travelling with `height`. */
export function characterFlipTracks(flip: FlipName, options: CharacterFlipOptions): PropertyKeyframes[] {
  const move = FLIPS[flip]
  const samples = options.samples ?? 40
  const facing = (options.facing ?? 1) < 0 ? -1 : 1
  const at = (i: number) => options.start + (i / samples) * move.duration
  const tracks = tracksFromPoses(
    Array.from({ length: samples + 1 }, (_, i) => {
      const pose = stickToHuman(flipPose(flip, i / samples))
      if (facing > 0) return { time: at(i), pose }
      // Facing left, a flip done side-on is seen from the other side (turn 3),
      // turning the other way. One done front-on (a cartwheel, a side flip) is
      // its mirror image: it steps off on the other foot and wheels the other
      // way. (A whole turn on keeps it next to the Side (left) view.)
      if (move.view === 0) {
        const mirrored = mirrorHumanPose(pose)
        return { time: at(i), pose: { ...mirrored, turn: 4 + mirrored.turn } }
      }
      return { time: at(i), pose: { ...pose, turn: pose.turn > 0 ? 4 - pose.turn : pose.turn, roll: -pose.roll } }
    })
  )
  if (options.height !== undefined && move.travel !== 0) {
    const x0 = options.x ?? 0
    tracks.push({
      property: 'x',
      keyframes: Array.from({ length: samples + 1 }, (_, i) => ({
        time: Math.round(at(i)),
        value: x0 + facing * flipTravel(move, i / samples, options.height!),
      })),
    })
  }
  return tracks
}

/**
 * New keyframes merged into a target's existing tracks: keys already there
 * before the new ones start or after they end are kept, keys in between are
 * replaced. So a dance drops into the middle of a scene without wiping it.
 */
export function mergeKeyframes(
  existing: ReadonlyArray<{ target: string; property: string }>,
  target: string,
  added: PropertyKeyframes[]
): PropertyKeyframes[] {
  return added.map(({ property, keyframes }) => {
    const from = keyframes[0].time
    const to = keyframes[keyframes.length - 1].time
    const kept = existing
      .filter((track) => track.target === target && track.property === property && 'keyframes' in track)
      .flatMap((track) => (track as unknown as { keyframes: Keyframe[] }).keyframes)
      .filter((key) => key.time < from || key.time > to)
    return { property, keyframes: [...kept, ...keyframes].sort((a, b) => a.time - b.time) }
  })
}

/** Length of a dance in ms, for the panel's readout. */
export function danceLength(style: DanceStyleName, bpm: number, move?: string, beats?: number): number {
  const dance = DANCE_STYLES[style]
  const count = beats ?? (move ? dance.moves[move].beats : routineBeats(dance))
  return (count * 60000) / bpm
}
