import type { Keyframe, Track } from '../../engine/types'
import { Timeline } from '../../engine/core/timeline'
import {
  actCharacterTracks,
  characterPoseTracks,
  humanGag,
  humanGaitPose,
  humanGaitStrideLength,
  lipSyncOver,
  mixPoses,
  GAIT_CYCLE_MS,
  type ActingStyleName,
  type CharacterPose,
  type CharacterPoseKey,
  type GagName,
  type GaitName,
  type SpokenLine,
} from '../../characters'
import { isCharacterField } from './character-element'
import type { PropertyKeyframes } from './character-dance'

/**
 * Acting for the editor's Character element.
 *
 * A character's motion is keyed poses. With acting on, the element keeps its
 * plain key poses (`CharacterActing.keys`) and its tracks are generated from
 * them by the acting pass, so keying another pose, adding a gag or saying a
 * line re-acts the whole performance instead of acting on top of acted
 * tracks. Turning acting off writes the plain poses back. Either way the
 * timeline holds ordinary keyframes, so it saves, exports and plays anywhere.
 *
 * Gags and gaits are the human plan's own (`humanGag`, `humanGaitPose`),
 * posed in the character's frame, so they read from any view.
 */

/** A key pose with the whole pose resolved (every field). */
export interface KeyPose extends CharacterPoseKey {
  pose: CharacterPose
}

/** What an acted character keeps: its plain key poses, the style, and its spoken lines. */
export interface CharacterActing {
  style: ActingStyleName
  keys: KeyPose[]
  lines?: SpokenLine[]
}

/** The character fields a set of tracks animates on `target`. */
const characterTracksOf = (tracks: ReadonlyArray<Track | { target: string; property: string }>, target: string) =>
  tracks.filter((track): track is Track => track.target === target && isCharacterField(track.property) && 'keyframes' in track)

/**
 * The key poses a character's tracks hold: one key at every time any of its
 * fields is keyed, with the whole pose there (fields not keyed at that time
 * take their animated value). `rest` is the element's own pose.
 */
export function keyPosesOf(tracks: ReadonlyArray<Track | { target: string; property: string }>, target: string, rest: CharacterPose): KeyPose[] {
  const own = characterTracksOf(tracks, target)
  const times = [...new Set(own.flatMap((track) => track.keyframes.map((key) => key.time)))].sort((a, b) => a - b)
  if (times.length === 0) return []
  const timeline = new Timeline({ id: 'keys', tracks: own })
  return times.map((time) => {
    const pose: CharacterPose = { ...rest }
    for (const [field, value] of timeline.getStateAtTime(time).values.get(target) ?? []) if (typeof value === 'number') pose[field] = value
    return { time, pose }
  })
}

/** Plain key poses as tracks (`none`), or acted, with the spoken lines lip-synced over the mouth. */
export function actingTracks(target: string, acting: CharacterActing, rest: CharacterPose): PropertyKeyframes[] {
  const keys = acting.keys
  if (keys.length === 0) return []
  const tracks = acting.style === 'none' ? characterPoseTracks(target, keys, rest) : actCharacterTracks(target, keys, { style: acting.style, rest })
  return lipSyncOver(target, tracks, acting.lines ?? [], { rest }).map((track) => ({ property: track.property, keyframes: track.keyframes as Keyframe[] }))
}

/**
 * Tracks to write for a target: `fresh`, plus an empty list for each
 * character field the target animates now but `fresh` leaves out (so it is
 * removed: a blink the acting added, gone when acting is off).
 */
export function withRemovals(existing: ReadonlyArray<Track | { target: string; property: string }>, target: string, fresh: PropertyKeyframes[]): PropertyKeyframes[] {
  const kept = new Set(fresh.map((track) => track.property))
  const stale = characterTracksOf(existing, target)
    .map((track) => track.property)
    .filter((property) => !kept.has(property))
  return [...fresh, ...[...new Set(stale)].map((property) => ({ property, keyframes: [] }))]
}

/** `added` keys put into `keys`: keys inside the span they cover are replaced, the rest kept, in time order. */
export function spliceKeys(keys: KeyPose[], added: KeyPose[]): KeyPose[] {
  if (added.length === 0) return keys
  const from = added[0].time
  const to = added[added.length - 1].time
  return [...keys.filter((key) => key.time < from || key.time > to), ...added].sort((a, b) => a.time - b.time)
}

/** A key pose upserted at `time`: replacing a key within a millisecond, else added. */
export function upsertKey(keys: KeyPose[], time: number, pose: CharacterPose): KeyPose[] {
  const others = keys.filter((key) => Math.abs(key.time - time) >= 1)
  return [...others, { time, pose }].sort((a, b) => a.time - b.time)
}

export interface GagOptions {
  /** Playhead, ms */
  start: number
  /** The character's pose at the playhead (its view is kept) */
  pose: CharacterPose
}

/**
 * A gag as character key poses from `start`, built on the character's pose
 * in its own frame, so it reads the same from any view. Keys after the first
 * are marked `act: false`: a gag's timing is already acted.
 */
export function characterGagKeys(name: GagName, options: GagOptions): KeyPose[] {
  return humanGag(name, { at: options.start, from: options.pose }).map((key) => ({ ...key, time: Math.round(key.time) }))
}

export interface WalkOptions {
  /** Playhead, ms */
  start: number
  /** How far, px: positive walks screen-right, negative screen-left */
  distance: number
  /** The character's height, px */
  height: number
  /** The character's pose at the playhead (the walk starts and ends in it, turned to walk) */
  pose: CharacterPose
  /** Its `x` offset at the playhead */
  x?: number
  /** Keys per gait cycle (default 8) */
  samplesPerCycle?: number
}

/** Easing in and out of a walk, ms. */
const WALK_RAMP = 250

/**
 * A walk in a gait as character keys (`act: false`: a cycle is already
 * timed) and an `x` track, from `start`. The character turns side-on to the
 * way it walks (the Side or Side (left) view) and walks forward in its own
 * frame, easing into the stride and out of it, its feet planted. Its face and
 * hands keep the pose it starts in.
 */
export function characterWalk(gait: GaitName, options: WalkOptions): { keys: KeyPose[]; x: Keyframe[]; end: number } {
  const direction = options.distance < 0 ? -1 : 1
  const cycles = Math.abs(options.distance) / humanGaitStrideLength(gait, options.height)
  const duration = Math.max(WALK_RAMP * 2, cycles * GAIT_CYCLE_MS[gait])
  const samples = Math.max(4, Math.ceil(cycles * (options.samplesPerCycle ?? 8)))
  const x0 = options.x ?? 0
  const side: CharacterPose = { ...options.pose, turn: direction > 0 ? 1 : 3 }
  const keys: KeyPose[] = []
  const x: Keyframe[] = []
  for (let i = 0; i <= samples; i++) {
    const along = i / samples
    const time = Math.round(options.start + along * duration)
    const elapsed = along * duration
    const weight = Math.max(0, Math.min(1, elapsed / WALK_RAMP, (duration - elapsed) / WALK_RAMP))
    keys.push({ time, pose: mixPoses(side, humanGaitPose(gait, along * cycles, side), weight), ...(i > 0 ? { act: false } : {}) })
    // Linear between samples: a steady pace keeps the planted foot still.
    x.push({ time, value: x0 + direction * Math.abs(options.distance) * along, easing: 'linear' })
  }
  return { keys, x, end: options.start + duration }
}
