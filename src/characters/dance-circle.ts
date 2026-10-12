import { character, mixPoses, type Character } from './character'
import { danceJoint, plantDanceFoot, type DancePartner } from './dance-contact'
import { humanDanceFrame, type HumanDanceName, type HumanDanceStyle } from './human-dance'
import type { Pose } from './rig/body-plan'
import type { GroundPoint } from './ground-path'
import type { Track } from '../engine/types'
import { HUMAN_REST } from './species/human'

export interface DanceCircleOptions {
  /** Ground center [x,z], default [0,0]. */
  center?: GroundPoint
  /** Positive radius in the same units as character height. */
  radius: number
  /** Positive integer member count, default 8 for direct sampling; must match targets when baking. */
  count?: number
  /** Beats per revolution, positive; default 32. */
  beatsPerTurn?: number
  /** Initial angle in degrees: 0 places the first dancer along +z. */
  angle?: number
  /** Clockwise viewed from above (+1, default), or counterclockwise (-1). */
  direction?: 1 | -1
  /** Default inward; numeric heading in degrees (0 faces +z, 90 faces +x). */
  facing?: 'inward' | 'outward' | 'tangent' | number
  /** Extra signed/fractional body revolutions per orbit, independent of travel. Default 0. */
  spins?: number
  /** Local routine, default garba. */
  style?: HumanDanceName | HumanDanceStyle
  /** Body used for contact geometry, default a human of height 1.7. Match the rendered build. */
  character?: Character
  /** Base pose; formation heading overrides turn. Use the same base when rendering baked tracks. */
  pose?: Pose
  /** Lock each support toe during its stance, then release smoothly. Default true. */
  plantFeet?: boolean
}

export interface DanceCircleMember extends DancePartner {
  /** World heading in degrees, also included in pose.turn as quarter-turns. */
  heading: number
  strike: number
  /** True only for a reachable plant at full stance weight; false during release or with planting disabled. */
  planted: boolean
}

/**
 * A deterministic circle formation: world x/z travel, body heading and the
 * local dance have separate phases. Sample by absolute beat, in any order.
 * All placement units match the character's height (default 1.7 metres).
 */
export function danceCircleAt(beat: number, options: DanceCircleOptions): DanceCircleMember[] {
  const count = options.count ?? 8
  const period = options.beatsPerTurn ?? 32
  if (!Number.isFinite(beat) || !Number.isFinite(options.radius) || options.radius <= 0 || !Number.isInteger(count) || count < 1 || !Number.isFinite(period) || period <= 0) throw new Error('danceCircleAt: finite beat, positive radius/beatsPerTurn and a positive integer count are required')
  const center = options.center ?? [0, 0]
  const direction = options.direction ?? 1
  if (center.length !== 2 || !center.every(Number.isFinite) || !Number.isFinite(options.angle ?? 0) || !Number.isFinite(options.spins ?? 0) || ![1, -1].includes(direction)
    || (options.facing !== undefined && !(typeof options.facing === 'number' ? Number.isFinite(options.facing) : ['inward', 'outward', 'tangent'].includes(options.facing)))) throw new Error('danceCircleAt: center, angle, spins and facing must be finite; direction is 1 or -1')
  const who = options.character ?? character({ height: 1.7 })
  const style = options.style ?? 'garba'
  const placement = (at: number, i: number): DancePartner & { heading: number; strike: number } => {
    const angle = (options.angle ?? 0) + 360 * i / count + direction * 360 * at / period
    const radians = angle * Math.PI / 180
    const facing = options.facing ?? 'inward'
    const heading = (typeof facing === 'number' ? facing : angle + (facing === 'inward' ? 180 : facing === 'tangent' ? direction * 90 : 0)) + (options.spins ?? 0) * 360 * at / period
    const frame = humanDanceFrame(style, at, { ...options.pose, turn: heading / 90 })
    return { character: who, position: [center[0] + options.radius * Math.sin(radians), 0, center[1] + options.radius * Math.cos(radians)], pose: frame.pose, heading, strike: frame.strike }
  }
  const contact = humanDanceFrame(style, beat).contact
  return Array.from({ length: count }, (_, i) => {
    const placed = placement(beat, i)
    if (options.plantFeet === false) return { ...placed, planted: false }
    const anchor = placement(contact.start, i)
    const target = danceJoint(anchor, `leg.${contact.side}`, 3)
    const plant = plantDanceFoot(placed, contact.side, target)
    return {
      ...placed, pose: mixPoses(placed.pose, plant.pose, contact.weight),
      position: [placed.position[0], plant.position[1] * contact.weight, placed.position[2]],
      planted: plant.reached && contact.weight === 1,
    }
  })
}

/**
 * Bake a formation into ordinary scene tracks. With zero roll, heading uses
 * rotateY; rolled poses keep heading in turn and set rotateY to zero so yaw
 * precedes roll and grounding exactly as in direct sampling.
 * Requires beats; bpm defaults to 120 (independent of style), start to 0 ms
 * and samplesPerBeat to 16. Member count comes from targets.length. Keys are
 * linear; unchanged base/rest pose fields are omitted, placement is retained.
 */
export function danceCircleTracks(targets: string[], options: DanceCircleOptions & { bpm?: number; beats: number; start?: number; samplesPerBeat?: number }): Track[] {
  if (options.count !== undefined && options.count !== targets.length) throw new Error('danceCircleTracks: count must match targets.length')
  const bpm = options.bpm ?? 120
  const density = options.samplesPerBeat ?? 16
  if (!targets.length || ![bpm, options.beats, density].every((n) => Number.isFinite(n) && n > 0)) throw new Error('danceCircleTracks: targets and positive finite bpm, beats and samplesPerBeat are required')
  if (!Number.isFinite(options.start ?? 0)) throw new Error('danceCircleTracks: start must be finite')
  const count = Math.max(1, Math.ceil(options.beats * density))
  const samples = Array.from({ length: count + 1 }, (_, i) => ({ time: (options.start ?? 0) + options.beats * i / count * 60000 / bpm, members: danceCircleAt(options.beats * i / count, { ...options, count: targets.length }) }))
  const keepPoseTurn = samples.some((sample) => sample.members.some((member) => member.pose.roll !== 0))
  const placementFields = new Set(['x', 'y', 'z', 'rotateY', ...(keepPoseTurn ? ['turn', 'roll'] : [])])
  return targets.flatMap((target, index) => {
    const values = samples.map((sample) => {
      const member = sample.members[index]
      const { turn: _turn, ...pose } = member.pose
      return { time: sample.time, pose: { ...(keepPoseTurn ? member.pose : pose), x: member.position[0], y: member.position[1], z: member.position[2], rotateY: keepPoseTurn ? 0 : member.heading } }
    })
    return Object.keys(values[0].pose).filter((field) => placementFields.has(field) || values.some((sample) => (sample.pose as Pose)[field] !== (options.pose?.[field] ?? HUMAN_REST[field]))).map((field) => ({
      id: `${target}-circle-${field}`, target, property: field,
      keyframes: values.map((sample) => ({ time: sample.time, value: (sample.pose as Pose)[field], easing: 'linear' as const })),
    }))
  })
}
