import type { Keyframe, Track } from '../engine/types'
import { Timeline } from '../engine/core/timeline'
import { lookFields } from './character-script-3d'

/**
 * Staging characters in a 3D scene: looking at something that moves (another
 * character, the camera), and spots to stand several figures on without
 * overlap. Pure functions over tracks: the result is more tracks.
 */

export type Vec3 = [number, number, number]

/** Where an object is at a time, from its tracks over its authored place: `x`, `y`, `z` or a `position` track. */
export function objectPositionAt(tracks: ReadonlyArray<Track>, target: string, base: Vec3 = [0, 0, 0]): (time: number) => Vec3 {
  const own = tracks.filter((track) => track.target === target)
  const timeline = new Timeline({ id: `${target}-position`, tracks: own })
  return (time) => {
    const values = timeline.getStateAtTime(time).values.get(target)
    const vector = values?.get('position')
    if (Array.isArray(vector) && vector.length === 3) return [vector[0], vector[1], vector[2]] as Vec3
    const n = (property: string, fallback: number) => {
      const v = values?.get(property)
      return typeof v === 'number' ? v : fallback
    }
    return [n('x', base[0]), n('y', base[1]), n('z', base[2])]
  }
}

export interface LookAtTracksOptions {
  scene: string
  /** The character's object id */
  character: string
  /** Where it looks: a point, a function of time, an object's id (sampled from the tracks over `objects`), or `camera` (the camera's id) */
  at: Vec3 | ((time: number) => Vec3) | { object: string; eyeHeight?: number } | { camera: string }
  start: number
  end: number
  /** The character's height, metres (default 1.7): its eyes are near the top */
  height?: number
  /** Authored positions of objects the tracks move from, by id (the character's own too) */
  objects?: Record<string, Vec3>
  /** Key spacing, ms (default 66) */
  every?: number
}

/**
 * Tracks that keep a character's head and eyes on something as both move:
 * `head.turn`, `head.nod`, `lookX` and `lookY` keyed from where the
 * character stands and faces (its `x`, `z`, `rotateY` tracks) and where the
 * target is at each moment. Add them after the character's own tracks.
 */
export function characterLookAtTracks(tracks: ReadonlyArray<Track>, options: LookAtTracksOptions): Track[] {
  const target = `${options.scene}/${options.character}`
  const height = options.height ?? 1.7
  const every = Math.max(1, options.every ?? 66)
  const base = options.objects?.[options.character] ?? [0, 0, 0]
  const own = new Timeline({ id: `${target}-own`, tracks: tracks.filter((track) => track.target === target) })
  const at = options.at
  const pointAt: (time: number) => Vec3 =
    typeof at === 'function' ? at
    : Array.isArray(at) ? () => at
    : 'camera' in at ? objectPositionAt(tracks, `${options.scene}/${at.camera}`, options.objects?.[at.camera] ?? [0, 1.6, 8])
    : (() => {
        const sampler = objectPositionAt(tracks, `${options.scene}/${at.object}`, options.objects?.[at.object] ?? [0, 0, 0])
        const eye = at.eyeHeight ?? height * 0.9
        return (time: number) => { const p = sampler(time); return [p[0], p[1] + eye, p[2]] as Vec3 }
      })()
  const fields = ['head.turn', 'head.nod', 'lookX', 'lookY'] as const
  const keys: Record<(typeof fields)[number], Keyframe<number>[]> = { 'head.turn': [], 'head.nod': [], lookX: [], lookY: [] }
  for (let time = options.start; ; time = Math.min(options.end, time + every)) {
    const values = own.getStateAtTime(time).values.get(target)
    const n = (property: string, fallback: number) => {
      const v = values?.get(property)
      return typeof v === 'number' ? v : fallback
    }
    const look = lookFields({ x: n('x', base[0]), z: n('z', base[2]), heading: n('rotateY', 0), eyeHeight: n('y', base[1]) + height * 0.9 }, pointAt(time))
    for (const field of fields) keys[field].push({ time, value: look[field] ?? 0 })
    if (time >= options.end) break
  }
  return fields.map((field) => ({ id: `${target}-lookAt-${field}`, target, property: field, keyframes: keys[field] }))
}

export interface StageSpotsOptions {
  /** How many figures */
  count: number
  /** The middle of the group, [x, z] metres (default the origin) */
  centre?: [number, number]
  /** Room between figures, metres (default 1.2: shoulder to shoulder with a gap) */
  spacing?: number
  /** `line` (across, facing +z), `arc` (a shallow curve facing its middle), `circle` (facing in), `cluster` (a loose group, seeded) */
  shape?: 'line' | 'arc' | 'circle' | 'cluster'
  /** `line` and `arc`: the way the line runs, degrees (default 90: along x) */
  heading?: number
  /** `arc`: how far it bends, degrees (default 60) */
  bend?: number
  seed?: number
}

/** Places and headings for several figures that do not overlap. */
export function stageSpots(options: StageSpotsOptions): Array<{ position: [number, number]; heading: number }> {
  const count = Math.max(1, Math.round(options.count))
  const [cx, cz] = options.centre ?? [0, 0]
  const spacing = options.spacing ?? 1.2
  const shape = options.shape ?? 'line'
  const out: Array<{ position: [number, number]; heading: number }> = []
  if (shape === 'circle') {
    const radius = count < 2 ? 0 : Math.max(spacing, (spacing * count) / (Math.PI * 2))
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      const x = cx + Math.sin(a) * radius
      const z = cz + Math.cos(a) * radius
      out.push({ position: [x, z], heading: ((Math.atan2(cx - x, cz - z) * 180) / Math.PI + 360) % 360 })
    }
    return out
  }
  if (shape === 'cluster') {
    let state = (options.seed ?? 1) >>> 0 || 7
    const random = () => { state ^= state << 13; state >>>= 0; state ^= state >> 17; state ^= state << 5; state >>>= 0; return state / 0x100000000 }
    const placed: Array<[number, number]> = []
    for (let i = 0; i < count; i++) {
      let best: [number, number] = [cx, cz]
      let bestGap = -Infinity
      for (let tries = 0; tries < 24; tries++) {
        const r = Math.sqrt(random()) * spacing * Math.max(1, Math.sqrt(count) * 0.9)
        const a = random() * Math.PI * 2
        const candidate: [number, number] = [cx + Math.cos(a) * r, cz + Math.sin(a) * r]
        const gap = placed.length === 0 ? Infinity : Math.min(...placed.map((p) => Math.hypot(p[0] - candidate[0], p[1] - candidate[1])))
        if (gap > bestGap) { bestGap = gap; best = candidate }
        if (gap >= spacing) break
      }
      placed.push(best)
      out.push({ position: best, heading: 0 })
    }
    return out
  }
  // A line or an arc across the heading: figures from one end to the other, facing forward (or the arc's middle).
  const along = ((options.heading ?? 90) * Math.PI) / 180
  const width = spacing * (count - 1)
  const bend = ((options.bend ?? 60) * Math.PI) / 180
  for (let i = 0; i < count; i++) {
    const u = count === 1 ? 0 : i / (count - 1) - 0.5
    const s = u * width
    let x = cx + Math.sin(along) * s
    let z = cz + Math.cos(along) * s
    let heading = ((options.heading ?? 90) - 90 + 360) % 360
    if (shape === 'arc') {
      // Bowed back at the ends, each figure turned a little toward the middle.
      const depth = (1 - Math.cos(u * bend)) * width * 0.5
      x -= Math.cos(along) * depth
      z += Math.sin(along) * depth
      heading = (heading - u * (options.bend ?? 60) + 360) % 360
    }
    out.push({ position: [x, z], heading })
  }
  return out
}
