import type { Keyframe, Track } from '../../engine/types'
import type { Vec3 } from '../../engine/math'
import { Timeline } from '../../engine/core/timeline'
import type { Pose } from '../rig/body-plan'
import { stagePlanSpace } from '../rig/skeleton'
import { character, type CharacterOptions, type CharacterPoseKey } from '../character'
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

/**
 * Riding poses for a human: on a seat, astride a saddle (legs apart round a
 * horse's barrel), driving (hands forward on a wheel) and on a bike's saddle
 * (leaning to the handlebars; the legs cycle with `pedallingPose`), and
 * wheeling a wheelchair (sitting up, the arms down at the sides to the hand
 * rims).
 */
export const RIDING_POSES = {
  seated: HUMAN_POSES.sit,
  astride: { ...HUMAN_POSES.sit, 'leg.left.spread': 26, 'leg.right.spread': 26, 'leg.left.swing': 40, 'leg.right.swing': 40, 'leg.left.knee': 70, 'leg.right.knee': 70 } as Pose,
  driving: { ...HUMAN_POSES.sit, 'arm.left.swing': 52, 'arm.right.swing': 52, 'arm.left.spread': 8, 'arm.right.spread': 8, 'arm.left.elbow': 38, 'arm.right.elbow': 38, lean: 4 } as Pose,
  wheeling: { ...HUMAN_POSES.sit, 'arm.left.swing': -6, 'arm.right.swing': -6, 'arm.left.spread': 16, 'arm.right.spread': 16, 'arm.left.elbow': 28, 'arm.right.elbow': 28, 'leg.left.knee': 80, 'leg.right.knee': 80 } as Pose,
  cycling: { ...HUMAN_POSES.sit, lean: 22, bend: 10, 'head.nod': -14, 'arm.left.swing': 58, 'arm.right.swing': 58, 'arm.left.spread': 10, 'arm.right.spread': 10, 'arm.left.elbow': 22, 'arm.right.elbow': 22, 'leg.left.spread': 6, 'leg.right.spread': 6 } as Pose,
} satisfies Record<string, Pose>

/** How far a pedalling knee lifts and the thigh swings, degrees, either side of the cycling pose. */
const PEDAL_SWING = 22
const PEDAL_KNEE = 38

/**
 * The cycling pose with the legs part way round the pedals: `phase` 0 → 1
 * is one turn of the cranks (the left foot at the top at 0, the right half a
 * turn behind), built on `base` (default `RIDING_POSES.cycling`).
 */
export function pedallingPose(phase: number, base: Pose = RIDING_POSES.cycling): Pose {
  const angle = phase * Math.PI * 2
  const leg = (offset: number) => ({
    swing: (base['leg.left.swing'] ?? 40) + PEDAL_SWING * Math.cos(angle + offset),
    // The knee straightens as the foot pushes down and over the bottom of the stroke.
    knee: (base['leg.left.knee'] ?? 70) + PEDAL_KNEE * (0.5 + 0.5 * Math.cos(angle + offset)) - PEDAL_KNEE * 0.5,
    ankle: 12 * Math.sin(angle + offset),
  })
  const left = leg(0)
  const right = leg(Math.PI)
  return {
    ...base,
    'leg.left.swing': left.swing,
    'leg.left.knee': left.knee,
    'leg.left.ankle': left.ankle,
    'leg.right.swing': right.swing,
    'leg.right.knee': right.knee,
    'leg.right.ankle': right.ankle,
  }
}

export interface PedallingOptions {
  /** From and to, ms */
  start: number
  end: number
  /** Turns of the cranks per second (default 1.2) */
  cadence?: number
  /** The pose the legs cycle on (default `RIDING_POSES.cycling`) */
  base?: Pose
  /** Keys per turn (default 8) */
  samplesPerTurn?: number
}

/**
 * Pose keys that pedal from `start` to `end` (`act: false`: a cycle is
 * already timed), for a rider's own pose tracks (`characterPoseTracks` or
 * `actCharacterTracks`) while `propRide3D` or `propRide` carries it.
 */
export function pedallingKeys(options: PedallingOptions): CharacterPoseKey[] {
  const cadence = options.cadence ?? 1.2
  const perTurn = Math.max(2, options.samplesPerTurn ?? 8)
  const step = 1000 / cadence / perTurn
  const keys: CharacterPoseKey[] = []
  for (let time = options.start, i = 0; time < options.end; time += step, i++) {
    keys.push({ time: Math.round(time), pose: pedallingPose(((time - options.start) / 1000) * cadence, options.base), ...(i > 0 ? { act: false } : {}) })
  }
  keys.push({ time: options.end, pose: pedallingPose(((options.end - options.start) / 1000) * cadence, options.base), act: false })
  return keys
}

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
