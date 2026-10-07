import type { Keyframe, Track } from '../../engine/types'
import type { Vec3 } from '../../engine/math'
import { Timeline } from '../../engine/core/timeline'
import type { Pose } from '../rig/body-plan'
import { stagePlanSpace } from '../rig/skeleton'
import { character, type CharacterOptions } from '../character'
import { HUMAN_POSES, HUMAN_REST } from '../species/human'
import { controlValue, propAnchors3D } from './rig'
import type { Prop } from './target'

/**
 * Riding in a 3D scene: a character carried by a prop, its hips kept on a
 * seat anchor (a horse's `saddle`, a cart's or a bike's `seat`) as the prop
 * moves, turns, bobs with its stride and pitches. Like `propRide` in 2D, it
 * reads the prop's tracks (from `propScript3D`) and writes the rider's `x`,
 * `y`, `z` and `rotateY`; `spliceTracks` puts them into the rider's own
 * script for the stretch it rides.
 *
 * ```js
 * const ride = propRide3D({ prop: horse(), propId: 'horse', propTracks: horseScript.tracks, scene: 'village',
 *   placement: { position: [-1, 0, 3] }, anchor: 'saddle', riderId: 'tum', pose: RIDING_POSES.astride,
 *   start: 2000, end: horseScript.duration })
 * const tumTracks = spliceTracks(tumScript.tracks, ride, { from: 2000, to: horseScript.duration })
 * ```
 *
 * Seat the rider in the pose given (the rider's own pose tracks should hold
 * it too). The rider is drawn part by part among the prop's parts, so a leg
 * astride a horse shows on each side of it.
 */
export interface PropRide3DOptions {
  prop: Prop
  /** The prop's object id in the scene */
  propId: string
  /** The prop's tracks (its `propScript3D` tracks) */
  propTracks: Track[]
  scene: string
  /** Where the prop's object was placed, as in the scene JSON: its position, its rotation about y, its control values */
  placement?: { position?: Vec3; heading?: number; values?: Record<string, number> }
  /** The anchor the rider sits on (`saddle`, `seat`) */
  anchor: string
  /** The rider's object id */
  riderId: string
  /** From and to, ms */
  start: number
  end: number
  /** The pose it rides in (default sitting): its hips go on the anchor */
  pose?: Pose
  /** The rider's look and build (its object's `character`), and height in metres (default 1.7) */
  character?: CharacterOptions
  height?: number
  /** Which way it faces from the prop's way, degrees (default 0: the way the prop faces) */
  facing?: number
  /** Getting on: hops up onto the seat from this point on the ground, [x, z] metres, over `for` ms (default 450) */
  mount?: { from: [number, number]; for?: number }
  /** Getting off: hops down from the seat to this point on the ground, over `for` ms (default 450) */
  dismount?: { to: [number, number]; for?: number }
  /** Sample spacing, ms (default 33) */
  every?: number
}

/** How high a rider hops getting on or off, metres above the straight line. */
const HOP = 0.35

/** Riding poses for a human: on a seat, and astride a saddle (legs apart round a horse's barrel). */
export const RIDING_POSES = {
  seated: HUMAN_POSES.sit,
  astride: { ...HUMAN_POSES.sit, 'leg.left.spread': 26, 'leg.right.spread': 26, 'leg.left.swing': 40, 'leg.right.swing': 40, 'leg.left.knee': 70, 'leg.right.knee': 70 } as Pose,
} satisfies Record<string, Pose>

const turnY = (v: Vec3, degrees: number): Vec3 => {
  const a = (degrees * Math.PI) / 180
  return [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)]
}

/** The rider's `x`, `y`, `z` and `rotateY` tracks while it rides (see the module's notes). */
export function propRide3D(options: PropRide3DOptions): Track[] {
  const target = `${options.scene}/${options.propId}`
  const timeline = new Timeline({ id: `${options.propId}-ride-3d`, tracks: options.propTracks.filter((t) => t.target === target) })
  const placement = options.placement ?? {}
  const [px, py, pz] = placement.position ?? [0, 0, 0]
  const rig = options.prop.rig
  // Where its hips are in its own space, in the riding pose: they go on the anchor.
  const who = character({ ...options.character, height: 1 })
  const pose: Pose = { ...HUMAN_REST, ...(options.pose ?? RIDING_POSES.seated) }
  const hip = stagePlanSpace(who.plan, pose, { height: options.height ?? 1.7, contact: who.contact }).hip
  const facing = options.facing ?? 0
  const every = options.every ?? 33
  const keys: Record<'x' | 'y' | 'z' | 'rotateY', Keyframe<number>[]> = { x: [], y: [], z: [], rotateY: [] }
  for (let time = options.start; ; time = Math.min(options.end, time + every)) {
    const own = timeline.getStateAtTime(time).values.get(target) ?? new Map()
    const number = (property: string, fallback: number) => {
      const value = own.get(property)
      return typeof value === 'number' ? value : fallback
    }
    const values: Record<string, number> = { ...placement.values }
    for (const name of Object.keys(rig.controls)) values[name] = number(name, placement.values?.[name] ?? controlValue(rig, {}, name))
    for (const name of ['pitch', 'roll', 'squash', 'lift', 'lean', 'size']) values[name] = number(name, placement.values?.[name] ?? controlValue(rig, {}, name))
    const anchor = propAnchors3D(rig, values)[options.anchor]
    if (!anchor) throw new Error(`propRide3D: ${options.prop.kind} has no anchor "${options.anchor}" (it has ${Object.keys(rig.anchors ?? {}).join(', ') || 'none'})`)
    const heading = number('rotateY', placement.heading ?? 0)
    const seat = turnY(anchor, heading)
    const world: Vec3 = [number('x', px) + seat[0], number('y', py) + seat[1], number('z', pz) + seat[2]]
    // The rider's object goes where its hips land on the seat.
    const riderHeading = heading + facing
    const hips = turnY(hip, riderHeading)
    let at: Vec3 = [world[0] - hips[0], world[1] - hips[1], world[2] - hips[2]]
    // Getting on and off: a hop between the ground and the moving seat.
    const hop = (ground: [number, number], u: number): Vec3 => {
      const e = u * u * (3 - 2 * u)
      return [ground[0] + (at[0] - ground[0]) * e, at[1] * e + HOP * Math.sin(Math.PI * u), ground[1] + (at[2] - ground[1]) * e]
    }
    const on = options.mount ? Math.max(1, options.mount.for ?? 450) : 0
    const off = options.dismount ? Math.max(1, options.dismount.for ?? 450) : 0
    if (options.mount && time < options.start + on) at = hop(options.mount.from, (time - options.start) / on)
    else if (options.dismount && time > options.end - off) at = hop(options.dismount.to, (options.end - time) / off)
    keys.x.push({ time, value: at[0] })
    keys.y.push({ time, value: at[1] })
    keys.z.push({ time, value: at[2] })
    keys.rotateY.push({ time, value: riderHeading })
    if (time >= options.end) break
  }
  const id = options.riderId
  const rider = `${options.scene}/${id}`
  return (Object.keys(keys) as Array<keyof typeof keys>).map((property) => ({ id: `${id}-${property}`, target: rider, property, keyframes: keys[property] }))
}
