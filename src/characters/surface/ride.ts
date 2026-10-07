import { Timeline } from '../../engine/core/timeline'
import type { Keyframe, Track } from '../../engine/types'
import type { TimeWindow } from './edit-log'

/**
 * A figure carried by what it stands on: a line of code moving up as the one
 * above it is removed, a shelf sliding, a bar of a chart growing. A surface
 * says where its floors are and how they move; `rideFloors` rewrites the
 * figure's `y` track so its feet stay on them.
 */

/** Somewhere a figure can stand on a surface. */
export interface Floor {
  /** Its top as laid out (before it has moved), scene y */
  top: number
  /** How far it has moved at `time`, px (up is negative) */
  offset(time: number): number
  /** When it is moving */
  windows: TimeWindow[]
}

export interface RideOptions {
  /** The script's ground, scene y (the figure's y track is measured from it) */
  ground: number
  /** How often a moving stretch is sampled, ms */
  every: number
  floors: Floor[]
}

/**
 * `target`'s tracks with its `y` carried by the floor under its feet. Each
 * segment of the `y` track keeps its keys (and easing) where what is under
 * it does not move; where a floor under it moves (or it steps from one
 * floor to another that has moved), the segment is sampled every `every` ms.
 */
export function rideFloors(tracks: Track[], target: string, { ground, every, floors }: RideOptions): Track[] {
  if (floors.every((floor) => floor.windows.length === 0)) return tracks
  const yTrack = tracks.find((track) => track.target === target && track.property === 'y') as Track<number> | undefined
  const timeline = new Timeline({ id: `${target}-ride`, tracks: yTrack ? [yTrack] : [] })
  const yAt = (time: number) => (yTrack ? Number(timeline.getStateAtTime(time).values.get(target)?.get('y') ?? 0) : 0)
  /** The floor the feet are on at `time` (as laid out), or -1 when they are on none (in the air, on the ground). */
  const under = (time: number) => {
    const feet = ground + yAt(time)
    return floors.findIndex((floor) => Math.abs(floor.top - feet) < 0.5)
  }
  const keyTimes = (yTrack?.keyframes ?? []).map((key) => key.time)
  /**
   * How far the floor under the feet has moved at `time`, px (up is
   * negative). In the air, it blends from the floor it left to the floor it
   * lands on, so a hop off a moved floor lands back on it.
   */
  const carried = (time: number) => {
    const lift = (index: number) => (index < 0 ? 0 : floors[index].offset(time))
    const now = under(time)
    if (now >= 0) return lift(now)
    // On its own ground (not a floor), nothing carries it.
    if (Math.abs(yAt(time)) < 0.5) return 0
    const standing = (t: number) => under(t) >= 0 || Math.abs(yAt(t)) < 0.5
    const left = [...keyTimes].reverse().find((t) => t <= time && standing(t))
    const lands = keyTimes.find((t) => t >= time && standing(t))
    if (left === undefined && lands === undefined) return 0
    if (left === undefined) return lift(under(lands!))
    if (lands === undefined || lands === left) return lift(under(left))
    // From the floor it left to the floor it lands on, over the flight.
    return lift(under(left)) + ((lift(under(lands)) - lift(under(left))) * (time - left)) / (lands - left)
  }
  const windows = floors.flatMap((floor) => floor.windows)
  const moving = (a: number, b: number) => windows.some((w) => w.start < b && w.end > a) || carried(a) !== carried(b)
  const keys: Keyframe<number>[] = yTrack ? [...yTrack.keyframes] : [{ time: 0, value: 0 }]
  const out: Keyframe<number>[] = [{ ...keys[0], value: keys[0].value + carried(keys[0].time) }]
  // Every `every` ms, and exactly when a floor starts or stops moving.
  const sample = (a: number, b: number) => {
    const times = new Set<number>([b])
    for (let time = a + every; time < b; time += every) times.add(time)
    for (const w of windows) for (const edge of [w.start, w.end]) if (edge > a && edge < b) times.add(edge)
    for (const time of [...times].sort((p, q) => p - q)) out.push({ time, value: yAt(time) + carried(time) })
  }
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1].time
    const b = keys[i].time
    if (moving(a, b)) sample(a, b)
    else out.push({ ...keys[i], value: keys[i].value + carried(b) })
  }
  // Floors that move after its last key still carry it.
  const last = keys[keys.length - 1].time
  const end = Math.max(last, ...windows.map((w) => w.end))
  if (end > last) sample(last, end)
  const ridden: Track<number> = { id: yTrack?.id ?? `${target}-y`, target, property: 'y', keyframes: out }
  return yTrack ? tracks.map((track) => (track === yTrack ? ridden : track)) : [...tracks, ridden]
}
