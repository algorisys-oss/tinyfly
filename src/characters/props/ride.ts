import type { Keyframe, Track } from '../../engine/types'
import { Timeline } from '../../engine/core/timeline'
import { propAt, solveAt, type PropTarget } from './target'

/**
 * Riding: a figure carried by a prop, its feet kept where a seat anchor puts
 * them as the prop drives, bumps and turns toward the camera. Like
 * `code.ride()`, it reads the prop's tracks and writes the figure's.
 *
 * ```ts
 * const ride = propRide({ prop: carTarget, propId: 'car', propTracks: carScript.tracks, anchor: 'seat',
 *   figure: { x: 80, y: 300 }, figureId: 'hero', start: 2400, end: 9000, offset: { y: seatHeight(100) } })
 * const heroTracks = spliceTracks(heroScript.tracks, ride, { from: 2400, to: 9000 })
 * ```
 */
export interface PropRideOptions {
  prop: PropTarget
  /** The prop target's id in the scene */
  propId: string
  /** The prop's tracks (its script's) */
  propTracks: Track[]
  /** The anchor the figure rides at (`seat`) */
  anchor: string
  /** Where the figure was placed (its feet), scene px: its tracks are offsets from here */
  figure: { x: number; y: number }
  /** The figure target's id */
  figureId: string
  /** From and to, ms */
  start: number
  end: number
  /** Where the figure's feet are from the anchor, px (a seated stick figure: `{ y: seatHeight(height) }`, so its hips are on the seat) */
  offset?: { x?: number; y?: number }
  /** Also turn the figure with the prop: its `turn` and `facing` (default true) */
  turn?: boolean
  /** Sample spacing, ms (default 33) */
  every?: number
}

/** The figure's `x` and `y` (and `turn`, `facing`) tracks while it rides. */
export function propRide(options: PropRideOptions): Track[] {
  const timeline = new Timeline({ id: `${options.propId}-ride`, tracks: options.propTracks.filter((t) => t.target === options.propId) })
  const every = options.every ?? 33
  const xs: Keyframe<number>[] = []
  const ys: Keyframe<number>[] = []
  const turns: Keyframe<number>[] = []
  const facings: Keyframe<number>[] = []
  let facing = 1
  for (let time = options.start; ; time = Math.min(options.end, time + every)) {
    const at = propAt(options.prop, { time, state: timeline.getStateAtTime(time) }, options.propId)
    const point = at.anchor(options.anchor)
    xs.push({ time, value: point.x + (options.offset?.x ?? 0) - options.figure.x })
    ys.push({ time, value: point.y + (options.offset?.y ?? 0) - options.figure.y })
    // The prop's quarter turns as the figure's: side-on is profile (turn 1) facing that way, front-on is turn 0.
    const across = Math.sin((at.values.turn * Math.PI) / 2)
    if (Math.abs(across) > 0.15) facing = across > 0 ? 1 : -1
    turns.push({ time, value: Math.abs(across) })
    facings.push({ time, value: facing })
    if (time >= options.end) break
  }
  const id = options.figureId
  const tracks: Track[] = [
    { id: `${id}-x`, target: id, property: 'x', keyframes: xs },
    { id: `${id}-y`, target: id, property: 'y', keyframes: ys },
  ]
  if (options.turn !== false) {
    tracks.push({ id: `${id}-turn`, target: id, property: 'turn', keyframes: turns }, { id: `${id}-facing`, target: id, property: 'facing', keyframes: stepped(facings) })
  }
  return tracks
}

/** Facing flips as a step (two keys a millisecond apart), never a slide through 0. */
function stepped(keys: Keyframe<number>[]): Keyframe<number>[] {
  const out: Keyframe<number>[] = []
  for (const key of keys) {
    const last = out[out.length - 1]
    if (last && last.value !== key.value) out.push({ time: key.time - 1, value: last.value })
    if (!last || last.value !== key.value || key === keys[keys.length - 1]) out.push(key)
  }
  return out
}

/**
 * `base` tracks with `replacement` keys taking over between `from` and `to`
 * ms, property by property: keys of `base` inside the window are dropped,
 * and the replacement's are spliced in (a figure's script, with a ride in the
 * middle). Properties only in `replacement` are added.
 */
export function spliceTracks(base: Track[], replacement: Track[], window: { from: number; to: number }): Track[] {
  const byKey = (track: Track) => `${track.target}\u0000${track.property}`
  const replacing = new Map(replacement.map((track) => [byKey(track), track]))
  const out = base.map((track) => {
    const other = replacing.get(byKey(track))
    if (!other) return track
    replacing.delete(byKey(track))
    const keep = (track.keyframes ?? []).filter((k) => k.time < window.from || k.time > window.to)
    const merged = [...keep, ...(other.keyframes ?? [])].sort((a, b) => a.time - b.time)
    return { ...track, keyframes: merged } as Track
  })
  return [...out, ...replacing.values()]
}

/**
 * Towing: a prop pulled by another (a cart behind a horse, a trailer behind
 * a car). The towed prop turns with the leader and keeps its own anchor
 * (`shafts`) on the leader's (`hitch`); its wheels roll exactly the distance
 * it covers. Returns its `x`, `turn` and `wheelSpin` tracks.
 *
 * ```ts
 * const cartTracks = propTow({ leader: horseTarget, leaderId: 'horse', leaderTracks: horseScript.tracks, hitch: 'hitch',
 *   towed: cartTarget, towedId: 'cart', anchor: 'shafts', start: 0, end: horseScript.duration })
 * ```
 */
export interface PropTowOptions {
  leader: PropTarget
  leaderId: string
  leaderTracks: Track[]
  /** The leader's anchor the towed prop hangs on */
  hitch: string
  towed: PropTarget
  towedId: string
  /** The towed prop's anchor that meets the hitch */
  anchor: string
  start: number
  end: number
  every?: number
}

export function propTow(options: PropTowOptions): Track[] {
  const timeline = new Timeline({ id: `${options.leaderId}-tow`, tracks: options.leaderTracks.filter((t) => t.target === options.leaderId) })
  const every = options.every ?? 33
  const towed = options.towed
  const placedX = towed.x + towed.width / 2
  const values = towed.props as Record<string, number>
  const radius = towed.prop.wheelRadius
  const xs: Keyframe<number>[] = []
  const turns: Keyframe<number>[] = []
  const spins: Keyframe<number>[] = []
  let spin = values.wheelSpin ?? 0
  let lastX: number | undefined
  for (let time = options.start; ; time = Math.min(options.end, time + every)) {
    const lead = propAt(options.leader, { time, state: timeline.getStateAtTime(time) }, options.leaderId)
    const hitch = lead.anchor(options.hitch)
    const turn = lead.values.turn
    // Where the towed prop's anchor sits from its middle, turned the leader's way.
    const own = solveAt(towed.prop, { ...values, turn }, towed.propScale).anchors[options.anchor]
    if (!own) throw new Error(`propTow: ${towed.prop.kind} has no anchor "${options.anchor}"`)
    const x = hitch.x - own.point.x
    if (lastX !== undefined && radius) {
      const facing = Math.sin((turn * Math.PI) / 2)
      spin += (((x - lastX) * (facing || 1)) / towed.propScale / radius) * (180 / Math.PI)
    }
    lastX = x
    xs.push({ time, value: x - placedX })
    turns.push({ time, value: turn })
    spins.push({ time, value: spin })
    if (time >= options.end) break
  }
  const id = options.towedId
  return [
    { id: `${id}-x`, target: id, property: 'x', keyframes: xs },
    { id: `${id}-turn`, target: id, property: 'turn', keyframes: turns },
    ...(radius ? [{ id: `${id}-wheelSpin`, target: id, property: 'wheelSpin', keyframes: spins }] : []),
  ]
}
