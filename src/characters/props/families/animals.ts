import type { Vec3 } from '../../../engine/math'
import type { ActingRig } from '../../acting/acting'
import type { ControlSpec, PropAnchor, PropPart, PropRig } from '../rig'
import type { PropAction, PropActionContext } from '../script'
import type { Prop, PropMove } from '../target'
import { smoothPath } from '../shapes'

/**
 * Four-legged animals. Each is a prop: a body, a neck and head, four jointed
 * legs and a tail, seen from any side like the vehicles. `quadruped(spec)`
 * builds one from proportions; `horse()`, `dog()`, `cat()` and `cow()` are
 * presets.
 *
 * Their legs are worked out by the rig's `derive` from the gait (`gait`) and
 * the phase of the stride (`walk`): each gait has its own footfall pattern,
 * and the phase is keyed in step with the distance covered, so the feet keep
 * pace with the ground.
 *
 * Gaits (`gait`): 0 walk (four beats), 1 trot (diagonal pairs), 2 canter
 * (three beats, the body rocking), 3 gallop. A species has the ones it uses.
 */

export const ANIMAL_GAITS = ['walk', 'trot', 'canter', 'gallop'] as const
export type AnimalGait = (typeof ANIMAL_GAITS)[number]
/** The horse's gaits are all of them; kept as its own name for clarity. */
export const HORSE_GAITS = ANIMAL_GAITS
export type HorseGait = AnimalGait

type Leg = 'fl' | 'fr' | 'hl' | 'hr'
const LEGS: Leg[] = ['fl', 'fr', 'hl', 'hr']

interface GaitSpec {
  /** Where each leg is in the cycle (0..1): front left, front right, hind left, hind right */
  offsets: Record<Leg, number>
  /** Leg swing either side of straight down, degrees */
  swing: number
  /** Knee bend as a leg comes forward, degrees */
  lift: number
  /** Body bob, as a fraction of the leg's length, and rocking (canter, gallop), degrees */
  bob: number
  rock: number
  /** One full cycle at a horse's size, ms (a species scales it) */
  cycle: number
}

const GAITS: Record<AnimalGait, GaitSpec> = {
  walk: { offsets: { hl: 0, fl: 0.25, hr: 0.5, fr: 0.75 }, swing: 16, lift: 45, bob: 0.02, rock: 0, cycle: 1100 },
  trot: { offsets: { fl: 0, hr: 0, fr: 0.5, hl: 0.5 }, swing: 22, lift: 75, bob: 0.05, rock: 0, cycle: 640 },
  canter: { offsets: { hr: 0, hl: 0.33, fr: 0.33, fl: 0.66 }, swing: 30, lift: 70, bob: 0.08, rock: 5, cycle: 560 },
  gallop: { offsets: { hr: 0, hl: 0.1, fr: 0.5, fl: 0.6 }, swing: 40, lift: 80, bob: 0.1, rock: 7, cycle: 460 },
}

const RAD = Math.PI / 180

/** How a species is built: proportions in metres, its colours, its gaits, its voice and its own actions. */
export interface QuadrupedSpec {
  kind: string
  summary: string
  legs: {
    /** Hip to knee, knee to foot, and the foot's height */
    upper: number
    lower: number
    foot: number
    /** Foot (hoof, paw) across and front to back */
    footSize: [number, number]
    /** Front and hind hips: forward position; how far each side of the middle */
    front: number
    hind: number
    across: number
    /** Leg radius at the hip (front, hind) and below the knee */
    thickness: [number, number]
    lowerThickness: number
  }
  /** Body radii (across, up, front to back), and how far its middle sits above the hips */
  body: { radii: Vec3; rise: number }
  /** The neck: where it starts (prop space) and its line, and its radius */
  neck: { at: Vec3; points: Vec3[]; radius: number }
  /** The head, on the neck's end: where (neck space), its radii, how it is tipped */
  head: { at: Vec3; radii: Vec3; rotate?: Vec3 }
  /** A muzzle or snout on the head */
  muzzle?: { at: Vec3; radii: Vec3 }
  /** Ears on the head (mirrored left and right): where, radii, tip */
  ears: { at: Vec3; radii: Vec3; rotate?: Vec3 }
  /** Eyes on the head (mirrored): where, and their size */
  eyes: { at: Vec3; size: number }
  /** The tail: where it starts (prop space) and its line, and its radius */
  tail: { at: Vec3; points: Vec3[]; radius: number }
  /** A mane along the neck */
  mane?: { points: Vec3[]; radius: number }
  /** Anything else: horns, spots, an udder, whiskers */
  extras?: (colors: QuadrupedColors) => PropPart[]
  colors: QuadrupedColors
  /** Its gaits */
  gaits: AnimalGait[]
  /** Smaller animals step quicker: × each gait's cycle time (default 1) */
  cycleScale?: number
  /** What its call is called (`neigh`, `bark`, `meow`, `moo`): an action of that name */
  call: string
  /** It lowers its head to the ground to eat */
  grazes?: boolean
  anchors?: Record<string, PropAnchor>
  /** Its own actions (rear, wag, pounce…) */
  actions?: (helpers: QuadrupedHelpers) => Record<string, PropAction>
}

export interface QuadrupedColors {
  coat: string
  /** Mane, tail tip, darker parts */
  dark: string
  foot: string
  muzzle: string
  /** Inside the ears, spots */
  accent: string
}

/** What a species' own actions can use: its sizes and shared moves. */
export interface QuadrupedHelpers {
  /** Hip to foot, metres */
  legLength: number
  /** Hip to knee, knee to foot, the foot's height */
  upper: number
  lower: number
  foot: number
  front: number
  hind: number
  /** Its tail hangs down (a horse's) rather than curling up (a dog's) */
  tailHangs: boolean
  /** A sound from its mouth (honk lines from the muzzle) at `time` */
  call(context: PropActionContext, time: number): void
}

/** Ground covered by one full cycle of a gait: each foot sweeps 2 · L · sin(swing) while planted, twice a cycle. */
export function animalStrideLength(legLength: number, gait: AnimalGait): number {
  return 4 * legLength * Math.sin(GAITS[gait].swing * RAD)
}

/** A four-legged animal from a spec. */
export function quadruped(spec: QuadrupedSpec): Prop {
  const { legs, colors } = spec
  const leg = legs.upper + legs.lower + legs.foot
  const bodyY = leg + spec.body.rise
  const mirrored = (at: Vec3, side: number): Vec3 => [side * at[0], at[1], at[2]]
  const parts: PropPart[] = [
    { id: 'body', shape: { type: 'ellipsoid', radii: spec.body.radii, segments: 18 }, at: [0, bodyY, 0], fill: colors.coat },
    // The neck tapers from the shoulders up to the head.
    { id: 'neck', shape: { type: 'tube', points: spec.neck.points, radius: spec.neck.points.map((_, i, all) => spec.neck.radius * (1.25 - (0.4 * i) / Math.max(1, all.length - 1))), segments: 12 }, at: spec.neck.at, fill: colors.coat },
    { id: 'head', parent: 'neck', shape: { type: 'ellipsoid', radii: spec.head.radii, segments: 14 }, at: spec.head.at, rotate: spec.head.rotate, fill: colors.coat },
    ...tailParts(spec, colors, bodyY),
  ]
  if (spec.mane) parts.push({ id: 'mane', parent: 'neck', shape: { type: 'tube', points: spec.mane.points, radius: spec.mane.radius, segments: 6 }, fill: colors.dark, outline: 0.7 })
  if (spec.muzzle) parts.push({ id: 'muzzle', parent: 'head', shape: { type: 'ellipsoid', radii: spec.muzzle.radii, segments: 10 }, at: spec.muzzle.at, fill: colors.muzzle, outline: 0.8 })
  for (const side of [1, -1]) {
    const name = side > 0 ? 'left' : 'right'
    const earRotate = spec.ears.rotate ? mirrored(spec.ears.rotate, 1).map((v, i) => (i === 2 ? side * v : v)) as Vec3 : undefined
    parts.push(
      { id: `ear-${name}`, parent: 'head', shape: { type: 'ellipsoid', radii: spec.ears.radii, segments: 8 }, at: mirrored(spec.ears.at, side), rotate: earRotate, fill: colors.coat, outline: 0.7 },
      { id: `eye-${name}`, parent: 'head', shape: { type: 'ellipsoid', radii: [spec.eyes.size * 0.8, spec.eyes.size, spec.eyes.size * 0.9], segments: 8 }, at: mirrored(spec.eyes.at, side), fill: '#1d1d22', outline: 0.4 },
    )
  }
  parts.push(...(spec.extras?.(colors) ?? []))

  const controls: Record<string, ControlSpec> = {
    walk: { description: 'Phase of the stride, in full cycles (keyed in step with the distance covered)', unit: 'cycles' },
    walking: { description: 'How much of the gait is applied: 0 standing, 1 moving', unit: '0..1', min: 0, max: 1 },
    gait: { description: `Which gait: ${spec.gaits.map((g) => `${ANIMAL_GAITS.indexOf(g)} ${g}`).join(', ')}`, unit: 'index', min: 0, max: 3 },
    neck: { description: 'Neck bent down (+, eating, sniffing) or up (−, alert)', unit: 'degrees', bind: [{ parts: ['neck'], rotate: { axis: 'x', degrees: 1 } }] },
    // The tail bends along its length: each segment turns its share, so the whole tail curls.
    tail: { description: 'Tail flicked up and back (+), curling along its length, on a spring behind the motion', unit: 'degrees', bind: [{ parts: TAIL_SEGMENTS, rotate: { axis: 'x', degrees: 1 / TAIL_SEGMENTS.length } }] },
    wag: { description: 'Tail swung side to side, curling', unit: 'degrees', bind: [{ parts: TAIL_SEGMENTS, rotate: { axis: 'y', degrees: 1 / TAIL_SEGMENTS.length } }] },
  }
  for (const id of LEGS) {
    const front = id[0] === 'f'
    const side = id[1] === 'l' ? 1 : -1
    const hip = front ? legs.thickness[0] : legs.thickness[1]
    parts.push(
      // Tapered from the hip down, a rounded knee, a tapered lower leg and a rounded paw or hoof.
      { id: `${id}-upper`, shape: { type: 'tube', points: [[0, legs.upper * 0.2, 0], [0, -legs.upper * 0.5, 0], [0, -legs.upper, 0]], radius: [hip, hip * 0.85, legs.lowerThickness * 1.15], segments: 10 }, at: [side * legs.across, leg, front ? legs.front : legs.hind], fill: colors.coat },
      { id: `${id}-knee`, parent: `${id}-upper`, shape: { type: 'ellipsoid', radii: Array(3).fill(legs.lowerThickness * 1.08) as Vec3, segments: 10 }, at: [0, -legs.upper, 0], fill: colors.coat, solidOnly: true },
      { id: `${id}-lower`, parent: `${id}-upper`, shape: { type: 'tube', points: [[0, 0, 0], [0, -legs.lower, 0]], radius: [legs.lowerThickness * 1.1, legs.lowerThickness * 0.85], segments: 10 }, at: [0, -legs.upper, 0], fill: colors.coat },
      { id: `${id}-foot`, parent: `${id}-lower`, shape: { type: 'ellipsoid', radii: [legs.footSize[0] / 2, legs.foot / 2 + 0.004, legs.footSize[1] / 2], segments: 12 }, at: [0, -legs.lower - legs.foot / 2, legs.footSize[1] * 0.12], fill: colors.foot, outline: 0.8 },
    )
    // Forward swing turns the leg about −x (the foot comes forward); front knees fold the lower leg back, hind hocks forward.
    const label = `${front ? 'Front' : 'Hind'} ${side > 0 ? 'left' : 'right'} leg`
    controls[`${id}.swing`] = { description: `${label}: forward (+) or back (−) from the hip`, unit: 'degrees', bind: [{ parts: [`${id}-upper`], rotate: { axis: 'x', degrees: -1 } }] }
    controls[`${id}.knee`] = { description: `${label}: knee (hock) folded`, unit: 'degrees', bind: [{ parts: [`${id}-lower`], rotate: { axis: 'x', degrees: front ? 1 : -1 } }] }
    controls[`${id}.ankle`] = { description: `${label}: foot turned at the ankle (+ toe forward)`, unit: 'degrees', bind: [{ parts: [`${id}-foot`], rotate: { axis: 'x', degrees: -1, pivot: [0, legs.foot / 2, -legs.footSize[1] * 0.12] } }] }
  }
  const neckEnd = spec.neck.points[spec.neck.points.length - 1]
  const rig: PropRig = {
    parts,
    controls,
    length: spec.body.radii[2] * 2 + Math.max(0, spec.neck.at[2] + neckEnd[2] + spec.head.radii[2] - spec.body.radii[2]) + 0.3,
    height: spec.neck.at[1] + neckEnd[1] + spec.head.radii[1] * 2,
    footprint: [legs.across * 2 + spec.body.radii[0], (legs.front - legs.hind) * 1.4],
    anchors: {
      back: { at: [0, bodyY + spec.body.radii[1], -spec.body.radii[2] * 0.05] },
      head: { part: 'head', at: [0, 0, 0] },
      mouth: { part: spec.muzzle ? 'muzzle' : 'head', at: spec.muzzle ? [0, 0, spec.muzzle.radii[2]] : [0, 0, spec.head.radii[2]] },
      front: { at: [0, bodyY, spec.body.radii[2]] },
      ...spec.anchors,
    },
    derive: (values) => deriveGait(values, spec, leg),
  }
  const helpers: QuadrupedHelpers = {
    legLength: leg,
    upper: legs.upper,
    lower: legs.lower,
    foot: legs.foot,
    tailHangs: spec.tail.points[spec.tail.points.length - 1][1] < 0,
    front: legs.front,
    hind: legs.hind,
    call(context, time) {
      const mouth = context.anchor('mouth')
      context.effect({ kind: 'honk', time, x: mouth.x, y: mouth.y, length: 800, direction: (context.facing() || 1) as 1 | -1 })
    },
  }
  return {
    kind: spec.kind,
    family: 'animal',
    summary: spec.summary,
    rig,
    actions: { ...quadrupedActions(spec, helpers), ...spec.actions?.(helpers) },
    acting: QUADRUPED_ACTING,
    colors: { body: colors.coat, ink: '#26262b' },
    follow: [{ control: 'tail', of: 'x', per: 0.6, stiffness: 90, damping: 6, limit: 40 }],
    moves: quadrupedMoves(spec, leg),
  }
}

/**
 * Its gaits in world metres (`propScript3D`), named as its actions are: one
 * stride cycle per stride length covered, at the gait's own pace.
 */
function quadrupedMoves(spec: QuadrupedSpec, legLength: number): Record<string, PropMove> {
  const move = (gait: AnimalGait): PropMove => {
    const stride = animalStrideLength(legLength, gait)
    return {
      speed: stride / ((GAITS[gait].cycle * (spec.cycleScale ?? 1)) / 1000),
      set: { gait: ANIMAL_GAITS.indexOf(gait) },
      hold: { walking: 1 },
      perMetre: { walk: 1 / stride },
    }
  }
  const moves = Object.fromEntries(spec.gaits.map((gait) => [gait === 'gallop' && !spec.gaits.includes('canter') ? 'run' : gait, move(gait)]))
  if (spec.gaits.includes('gallop') && !moves.gallop) moves.gallop = move('gallop')
  return moves
}

/** The tail's segments, base to tip: each hangs from the one before. */
const TAIL_SEGMENTS = Array.from({ length: 7 }, (_, i) => (i === 0 ? 'tail' : `tail-${i}`))

/**
 * A fluid tail: a smooth curve through the spec's points, cut into segments
 * that each hang from the one before and taper toward a rounded tip. The
 * `tail` and `wag` controls turn every segment a share, so the tail curls
 * rather than swinging like a stick; in the stick look the segments' centre
 * lines join into one stroke.
 */
function tailParts(spec: QuadrupedSpec, colors: QuadrupedColors, bodyY: number): PropPart[] {
  const path = smoothPath(spec.tail.points, TAIL_SEGMENTS.length + 1)
  // Rooted on the body: its start moved onto the rump's surface at its height, a little inside, so it never floats.
  const [, ry, rz] = spec.body.radii
  const dy = (spec.tail.at[1] - bodyY) / ry
  const surface = Math.abs(dy) < 1 ? -rz * Math.sqrt(1 - dy * dy) : spec.tail.at[2]
  const root: Vec3 = [spec.tail.at[0], spec.tail.at[1], surface + Math.min(0.04, rz * 0.08)]
  const radius = (i: number) => spec.tail.radius * (1 - (0.5 * i) / TAIL_SEGMENTS.length)
  const parts: PropPart[] = TAIL_SEGMENTS.map((id, i) => {
    const from = path[i]
    const to = path[i + 1]
    const local: Vec3 = [to[0] - from[0], to[1] - from[1], to[2] - from[2]]
    const previous = i === 0 ? undefined : path[i - 1]
    return {
      id,
      ...(i > 0 ? { parent: TAIL_SEGMENTS[i - 1] } : {}),
      shape: { type: 'tube', points: [[0, 0, 0], local], radius: [radius(i), radius(i + 1)], segments: 8, joined: true },
      // The first segment starts where the tail does; each next one starts at the end of the one before.
      at: i === 0 ? root : ([from[0] - previous![0], from[1] - previous![1], from[2] - previous![2]] as Vec3),
      fill: colors.dark,
      outline: 0.8,
    }
  })
  const last = path[path.length - 1]
  const beforeLast = path[path.length - 2]
  parts.push({
    id: 'tail-tip',
    parent: TAIL_SEGMENTS[TAIL_SEGMENTS.length - 1],
    shape: { type: 'ellipsoid', radii: Array(3).fill(radius(TAIL_SEGMENTS.length) * 1.05) as Vec3, segments: 8 },
    at: [last[0] - beforeLast[0], last[1] - beforeLast[1], last[2] - beforeLast[2]],
    fill: colors.dark,
    outline: 0.8,
    solidOnly: true,
  })
  return parts
}

/** Legs, body bob and rock, and head bob from the gait, on top of the pose the controls already hold. */
function deriveGait(values: Record<string, number>, spec: QuadrupedSpec, leg: number): Record<string, number> {
  const walking = Math.max(0, Math.min(1, values.walking ?? 0))
  if (walking === 0) return {}
  const gaitName = ANIMAL_GAITS[Math.max(0, Math.min(3, Math.round(values.gait ?? 0)))]
  const gait = GAITS[spec.gaits.includes(gaitName) ? gaitName : spec.gaits[0]]
  const phase = values.walk ?? 0
  const out: Record<string, number> = {}
  for (const id of LEGS) {
    const angle = Math.PI * 2 * (phase + gait.offsets[id])
    // Planted while it sweeps back (stance), folded at the knee as it comes forward.
    out[`${id}.swing`] = (values[`${id}.swing`] ?? 0) + walking * gait.swing * Math.sin(angle)
    out[`${id}.knee`] = (values[`${id}.knee`] ?? 0) + walking * gait.lift * Math.max(0, Math.cos(angle))
  }
  const beat = Math.PI * 2 * phase
  out.lift = (values.lift ?? 0) + walking * gait.bob * leg * Math.abs(Math.sin(beat * 2))
  out.pitch = (values.pitch ?? 0) + walking * gait.rock * Math.sin(beat)
  out.neck = (values.neck ?? 0) + walking * (gait.rock > 0 ? -gait.rock * 1.4 : 5) * Math.sin(beat * 2)
  return out
}

/**
 * Sitting, worked out from the legs: the body pitched up about its front feet
 * (lowered so they stay down, the front legs kept upright), the lowered hind
 * hips' thighs lying forward, the lower legs reaching back down to the
 * ground, and the paws turned flat on it.
 */
export function sittingPose(h: Pick<QuadrupedHelpers, 'upper' | 'lower' | 'foot' | 'front' | 'hind' | 'legLength' | 'tailHangs'>): Record<string, number> {
  const pitch = 32
  const rise = Math.sin(pitch * RAD)
  // The hind hips come down this far as the body tips up about the front feet.
  const hipY = h.legLength - (h.front - h.hind) * rise
  // The thigh lies forward, a little below level (degrees from straight down, in the world).
  const thigh = 72
  const kneeY = hipY - h.upper * Math.cos(thigh * RAD)
  // The lower leg reaches back from the knee to put the foot on the ground.
  const reach = (kneeY - h.foot) / h.lower
  const back = reach >= 1 ? 0 : reach <= -1 ? 180 : Math.acos(reach) / RAD
  const pose: Record<string, number> = {
    pitch,
    // The front hips stay at standing height: tipping up raises them by front · sin, and swinging them round the
    // middle lowers them by leg · (1 − cos); the front legs are held upright, so both are taken back.
    lift: h.legLength * (1 - Math.cos(pitch * RAD)) - h.front * rise,
    neck: -10,
    // A hanging tail lifts clear of the ground behind the lowered rump; one that curls up tips back to lie behind.
    tail: h.tailHangs ? 35 : -40,
    'fl.swing': -pitch,
    'fr.swing': -pitch,
  }
  for (const id of ['hl', 'hr']) {
    // Swing is measured from the body, which is already tipped up by the pitch; the hock folds the lower leg
    // back by (thigh + back); the ankle turns the foot level again.
    pose[`${id}.swing`] = thigh - pitch
    pose[`${id}.knee`] = -(thigh + back)
    pose[`${id}.ankle`] = back
  }
  return pose
}

/** The body leads; the neck, legs and tail follow it. */
export const QUADRUPED_ACTING: ActingRig = {
  depth: { turn: 0, lift: 0, pitch: 1, roll: 1, squash: 1, neck: 2, tail: 3, wag: 3, 'fl.swing': 2, 'fr.swing': 2, 'hl.swing': 2, 'hr.swing': 2, 'fl.knee': 3, 'fr.knee': 3, 'hl.knee': 3, 'hr.knee': 3 },
  limits: { pitch: 6, neck: 8, tail: 10, wag: 8, 'fl.swing': 8, 'fr.swing': 8, 'hl.swing': 8, 'hr.swing': 8, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: [],
}
/** Kept for the horse's name. */
export const HORSE_ACTING = QUADRUPED_ACTING

/**
 * Lying down with the head up (a sphinx pose): the body lowered until the
 * folded hind legs and the belly are on the ground, the front legs stretched
 * forward along it, paws flat.
 */
export function lyingPose(h: Pick<QuadrupedHelpers, 'upper' | 'lower' | 'foot' | 'legLength' | 'tailHangs'>): Record<string, number> {
  // The hips come down to just above the folded hind leg's height.
  const hipY = (h.upper + h.lower) * 0.32
  // Front legs reach forward from the shoulders, a little below level, so the paws touch the ground ahead.
  const front = Math.asin(Math.min(1, hipY / (h.upper + h.lower + h.foot))) / RAD
  const pose: Record<string, number> = {
    pitch: 0,
    lift: hipY - h.legLength,
    neck: -14,
    tail: h.tailHangs ? 60 : -60,
    'fl.swing': 90 - front,
    'fr.swing': 90 - front,
    'fl.knee': 0,
    'fr.knee': 0,
    'fl.ankle': front,
    'fr.ankle': front,
  }
  for (const id of ['hl', 'hr']) {
    // The thigh lies forward under the body, the lower leg folded back flat beside it.
    pose[`${id}.swing`] = 70
    pose[`${id}.knee`] = -155
    pose[`${id}.ankle`] = 85
  }
  return pose
}

/** The actions every four-legged animal has: its gaits, sitting, lying down, jumping, its call, nodding, its tail. */
function quadrupedActions(spec: QuadrupedSpec, helpers: QuadrupedHelpers): Record<string, PropAction> {
  const cycleScale = spec.cycleScale ?? 1
  /** Move to `to` in a gait: the stride phase and the distance keyed together, so the feet keep pace. */
  const go = (gait: AnimalGait): PropAction => ({
    summary: {
      walk: 'Walks to `to` (four beats), its head bobbing.',
      trot: 'Trots to `to`: legs in diagonal pairs, the body bouncing.',
      canter: 'Canters to `to`: three beats, the body rocking.',
      gallop: 'Gallops (runs) to `to`: legs reaching, the body rocking hard, kicking up dust.',
    }[gait],
    needs: ['to'],
    uses: ['for'],
    run(context, beat, start) {
      const direction = Math.sign(beat.to! - context.x) as 1 | -1 | 0
      if (direction === 0) return { end: start }
      let t = start
      if (context.facing() !== direction) t = context.turnTo(t, direction > 0 ? 'right' : 'left')
      const e = context.exaggeration
      // A toss of the head before it sets off.
      context.key(t + 180, { neck: -12 * e }, { act: false, easing: 'ease-out' })
      const metres = Math.abs(beat.to! - context.x) / context.scale
      const cycles = metres / animalStrideLength(helpers.legLength, gait)
      const travel = beat.for ?? Math.max(500, cycles * GAITS[gait].cycle * cycleScale)
      const phase = context.values.walk ?? 0
      context.set('gait', t, context.values.gait ?? 0)
      context.set('gait', t + 1, ANIMAL_GAITS.indexOf(gait))
      context.set('walking', t, 0)
      context.set('walking', t + 240, 1, 'ease-out')
      context.set('walking', t + travel - 240, 1)
      context.set('walking', t + travel, 0, 'ease-in')
      // Phase and distance with the same easing, so they stay in step all the way.
      context.set('walk', t, phase)
      context.move(t, t + travel, beat.to!, { easing: 'ease-in-out' })
      context.set('walk', t + travel, phase + cycles, 'ease-in-out')
      context.key(t + travel + 300, { neck: 0 })
      if (gait === 'gallop' || gait === 'canter') {
        context.effect({ kind: 'dust', time: t + 200, x: context.x - direction * helpers.legLength * context.scale, y: context.floor, length: 700, direction: (-direction) as 1 | -1 })
        context.effect({ kind: 'dust', time: t + travel, x: beat.to! + direction * helpers.legLength * 0.6 * context.scale, y: context.floor, length: 600, direction })
      }
      return { end: t + travel + 300, contact: t, release: t + travel }
    },
  })
  const gaits = Object.fromEntries(spec.gaits.map((gait) => [gait === 'gallop' && !spec.gaits.includes('canter') ? 'run' : gait, go(gait)]))
  if (spec.gaits.includes('gallop') && !gaits.gallop) gaits.gallop = go('gallop')

  const actions: Record<string, PropAction> = {
    ...gaits,
    [spec.call]: {
      summary: `Throws its head up and ${spec.call}s.`,
      run(context, _beat, start) {
        const e = context.exaggeration
        context.key(start + 150, { neck: 10 * e }, { act: false, easing: 'ease-out' })
        context.key(start + 380, { neck: -28 * e, squash: 1.05 }, { act: false, easing: 'ease-out' })
        context.key(start + 680, { neck: -20 * e }, { act: false })
        context.key(start + 980, { neck: 0, squash: 1 })
        helpers.call(context, start + 380)
        return { end: start + 980, contact: start + 380 }
      },
    },
    sit: {
      summary: 'Sits on its haunches for `for` ms (default 1500): the rump goes down onto folded hind legs, paws flat on the ground, the front legs stay planted; then it gets up.',
      uses: ['for'],
      run(context, beat, start) {
        const pose = sittingPose(helpers)
        const sat = start + 450
        context.key(sat, pose, { act: false, easing: 'ease-in-out' })
        context.key(sat + (beat.for ?? 1500), pose, { act: false })
        const up = sat + (beat.for ?? 1500) + 450
        const rest: Record<string, number> = {}
        for (const key of Object.keys(pose)) rest[key] = 0
        context.key(up, rest)
        return { end: up, contact: sat, release: up - 450 }
      },
    },
    lie: {
      summary: 'Lies down for `for` ms (default 2000), head up and front paws forward (sinking back onto its haunches first), then gets up.',
      uses: ['for'],
      run(context, beat, start) {
        const pose = lyingPose(helpers)
        const half = { ...sittingPose(helpers) }
        const sat = start + 400
        const down = sat + 450
        context.key(sat, half, { act: false, easing: 'ease-in-out' })
        context.key(down, pose, { act: false, easing: 'ease-in-out' })
        context.key(down + (beat.for ?? 2000), pose, { act: false })
        const up = down + (beat.for ?? 2000) + 600
        const rest: Record<string, number> = {}
        for (const key of new Set([...Object.keys(pose), ...Object.keys(half)])) rest[key] = 0
        context.key(up, rest)
        return { end: up, contact: down, release: up - 600 }
      },
    },
    jump: {
      summary: 'Crouches and jumps (forward to `to`, or up on the spot), legs tucked in the air, landing with a squash and dust.',
      uses: ['to'],
      run(context, beat, start) {
        const e = context.exaggeration
        const height = helpers.legLength * 0.8 * e
        const crouch = start + 260
        const takeoff = crouch + 90
        const land = takeoff + 520
        context.key(crouch, { squash: 0.86, 'hl.knee': 40, 'hr.knee': 40, 'fl.knee': 25, 'fr.knee': 25, neck: 8 }, { act: false, easing: 'ease-out' })
        context.key(takeoff, { squash: 1.12, 'hl.knee': 0, 'hr.knee': 0, 'fl.knee': 0, 'fr.knee': 0, pitch: 8, 'fl.swing': 35, 'fr.swing': 35, 'hl.swing': -35, 'hr.swing': -35 }, { act: false, easing: 'ease-out' })
        context.key((takeoff + land) / 2, { lift: height, squash: 1, pitch: 0, 'fl.knee': 60, 'fr.knee': 60, 'hl.knee': 60, 'hr.knee': 60, 'fl.swing': 25, 'fr.swing': 25, 'hl.swing': -20, 'hr.swing': -20 }, { act: false, easing: 'ease-out' })
        context.key(land, { lift: 0, squash: 0.85, pitch: -4, 'fl.knee': 0, 'fr.knee': 0, 'hl.knee': 0, 'hr.knee': 0, 'fl.swing': 0, 'fr.swing': 0, 'hl.swing': 0, 'hr.swing': 0 }, { act: false, easing: 'ease-in' })
        context.key(land + 280, { squash: 1, pitch: 0, neck: 0 })
        if (beat.to !== undefined) {
          const direction = Math.sign(beat.to - context.x) as 1 | -1 | 0
          if (direction !== 0 && context.facing() !== direction) context.turnTo(start, direction > 0 ? 'right' : 'left')
          context.move(takeoff, land, beat.to)
        }
        context.effect({ kind: 'dust', time: land, x: context.x, y: context.floor, length: 550 })
        return { end: land + 280, contact: land }
      },
    },
    nod: {
      summary: 'Nods its head twice.',
      run(context, _beat, start) {
        context.key(start + 200, { neck: 20 }, { act: false, easing: 'ease-out' })
        context.key(start + 400, { neck: -5 }, { act: false, easing: 'ease-in-out' })
        context.key(start + 600, { neck: 18 }, { act: false, easing: 'ease-in-out' })
        context.key(start + 900, { neck: 0 })
        return { end: start + 900 }
      },
    },
    swish: {
      summary: 'Swishes its tail a few times.',
      uses: ['for'],
      run(context, beat, start) {
        const length = beat.for ?? 900
        for (let i = 1; i <= 4; i++) context.key(start + (length * i) / 5, { tail: i % 2 === 0 ? 10 : 35 }, { act: false, easing: 'ease-in-out' })
        context.key(start + length, { tail: 0 })
        return { end: start + length }
      },
    },
  }
  if (spec.grazes) {
    actions.graze = {
      summary: 'Lowers its head to graze for `for` ms (default 1800), nibbling, then looks up.',
      uses: ['for'],
      run(context, beat, start) {
        const length = beat.for ?? 1800
        context.key(start + 600, { neck: 75 }, { act: false, easing: 'ease-in-out' })
        for (let t = 900; t < 600 + length; t += 400) context.key(start + t, { neck: t % 800 === 100 ? 70 : 78 }, { act: false, easing: 'ease-in-out' })
        context.key(start + 600 + length + 500, { neck: 0 })
        return { end: start + 600 + length + 500 }
      },
    }
  }
  return actions
}

// --- presets ------------------------------------------------------------------

export interface AnimalOptions {
  kind?: string
  summary?: string
  colors?: Partial<QuadrupedColors>
}

/** A cartoon horse: walks, trots, canters and gallops, rears, bucks, neighs, grazes, swishes its tail. */
export function horse(options: AnimalOptions = {}): Prop {
  return quadruped({
    kind: options.kind ?? 'horse',
    summary: options.summary ?? 'A cartoon horse: walks, trots, canters and gallops with its hooves in step with the ground, rears, bucks, neighs, grazes and swishes its tail.',
    legs: { upper: 0.5, lower: 0.42, foot: 0.08, footSize: [0.12, 0.16], front: 0.62, hind: -0.62, across: 0.2, thickness: [0.075, 0.09], lowerThickness: 0.05 },
    body: { radii: [0.32, 0.36, 0.95], rise: 0.25 },
    neck: { at: [0, 1.42, 0.7], points: [[0, 0, 0], [0, 0.5, 0.3]], radius: 0.15 },
    head: { at: [0, 0.48, 0.5], radii: [0.13, 0.14, 0.3], rotate: [38, 0, 0] },
    muzzle: { at: [0, -0.02, 0.24], radii: [0.11, 0.1, 0.1] },
    ears: { at: [0.07, 0.16, -0.17], radii: [0.035, 0.1, 0.05] },
    eyes: { at: [0.115, 0.05, -0.04], size: 0.04 },
    tail: { at: [0, 1.4, -0.9], points: [[0, 0, 0], [0, -0.22, -0.2], [0, -0.62, -0.24]], radius: 0.08 },
    mane: { points: [[0, 0.1, -0.12], [0, 0.55, 0.17]], radius: 0.07 },
    colors: { coat: '#b5763a', dark: '#4a2e1a', foot: '#3a2a22', muzzle: '#8d5a2c', accent: '#e8c9a0', ...options.colors },
    gaits: ['walk', 'trot', 'canter', 'gallop'],
    call: 'neigh',
    grazes: true,
    // Where a cart's shaft tips meet it: along its sides, about the middle of its body.
    anchors: { hitch: { at: [0, 0.95, -0.15] }, saddle: { at: [0, 1.6, -0.05] } },
    actions: (h) => ({
      rear: {
        summary: 'Rears up on its hind legs, front legs tucked and pawing, neighs, and drops back down with dust.',
        uses: ['for'],
        run(context, beat, start) {
          const e = context.exaggeration
          const angle = Math.min(55, 32 * e)
          // Pitched up about its middle, then lifted so its hind hooves stay on the ground.
          const lift = -h.hind * Math.sin(angle * RAD)
          const hold = beat.for ?? 700
          context.key(start + 200, { pitch: -4, neck: 6, 'hl.knee': 12, 'hr.knee': 12 }, { act: false, easing: 'ease-out' })
          context.key(start + 520, { pitch: angle, lift, neck: -25, 'fl.swing': 55, 'fl.knee': 95, 'fr.swing': 40, 'fr.knee': 80, 'hl.knee': 0, 'hr.knee': 0 }, { act: false, easing: 'ease-out' })
          // Pawing the air.
          context.key(start + 520 + hold * 0.5, { 'fl.swing': 35, 'fl.knee': 70, 'fr.swing': 58, 'fr.knee': 100 }, { act: false, easing: 'ease-in-out' })
          context.key(start + 520 + hold, { 'fl.swing': 55, 'fl.knee': 95, 'fr.swing': 40, 'fr.knee': 80 }, { act: false, easing: 'ease-in-out' })
          const land = start + 520 + hold + 380
          context.key(land, { pitch: 0, lift: 0, neck: 8, squash: 0.94, 'fl.swing': 0, 'fl.knee': 0, 'fr.swing': 0, 'fr.knee': 0 }, { act: false, easing: 'ease-in' })
          context.key(land + 320, { neck: 0, squash: 1 })
          h.call(context, start + 520)
          context.effect({ kind: 'dust', time: land, x: context.x + (context.facing() || 1) * h.front * context.scale, y: context.floor, length: 600 })
          return { end: land + 320, contact: land }
        },
      },
      buck: {
        summary: 'Bucks: drops its head and kicks both hind legs up and back.',
        run(context, _beat, start) {
          const e = context.exaggeration
          const angle = Math.min(35, 18 * e)
          const lift = h.front * Math.sin(angle * RAD)
          context.key(start + 220, { pitch: 3, squash: 0.95 }, { act: false, easing: 'ease-out' })
          context.key(start + 480, { pitch: -angle, lift, neck: 30, 'hl.swing': -65, 'hr.swing': -60, 'hl.knee': 10, 'hr.knee': 10 }, { act: false, easing: 'ease-out' })
          context.key(start + 900, { pitch: 0, lift: 0, neck: 0, squash: 0.95, 'hl.swing': 0, 'hr.swing': 0, 'hl.knee': 0, 'hr.knee': 0 }, { act: false, easing: 'ease-in' })
          context.key(start + 1150, { squash: 1 })
          context.effect({ kind: 'dust', time: start + 900, x: context.x - (context.facing() || 1) * 0.6 * context.scale, y: context.floor, length: 600 })
          return { end: start + 1150, contact: start + 480 }
        },
      },
    }),
  })
}

/** A cartoon dog: walks, trots and runs, barks, wags its tail, sits, jumps, sniffs. */
export function dog(options: AnimalOptions = {}): Prop {
  return quadruped({
    kind: options.kind ?? 'dog',
    summary: options.summary ?? 'A cartoon dog: walks, trots and runs, barks, wags its tail, sits, jumps, sniffs the ground.',
    legs: { upper: 0.19, lower: 0.16, foot: 0.05, footSize: [0.07, 0.1], front: 0.24, hind: -0.24, across: 0.09, thickness: [0.04, 0.05], lowerThickness: 0.032 },
    body: { radii: [0.14, 0.15, 0.36], rise: 0.1 },
    neck: { at: [0, 0.56, 0.27], points: [[0, 0, 0], [0, 0.14, 0.06]], radius: 0.075 },
    head: { at: [0, 0.15, 0.08], radii: [0.12, 0.11, 0.13] },
    muzzle: { at: [0, -0.03, 0.13], radii: [0.065, 0.055, 0.08] },
    // Floppy ears hanging down the sides of the head.
    ears: { at: [0.11, 0.0, -0.02], radii: [0.025, 0.09, 0.05], rotate: [0, 0, 18] },
    eyes: { at: [0.08, 0.04, 0.08], size: 0.025 },
    tail: { at: [0, 0.58, -0.34], points: [[0, 0, 0], [0, 0.1, -0.08], [0, 0.2, -0.1]], radius: 0.03 },
    extras: (c) => [{ id: 'nose', parent: 'muzzle', shape: { type: 'ellipsoid', radii: [0.025, 0.02, 0.02], segments: 8 }, at: [0, 0.03, 0.08], fill: '#1d1d22', outline: 0.4 }, { id: 'patch', parent: 'body', shape: { type: 'ellipsoid', radii: [0.012, 0.09, 0.11], segments: 10 }, at: [0.135, 0.04, -0.06], fill: c.accent, outline: 0.5 }],
    colors: { coat: '#d9a066', dark: '#a8703a', foot: '#a8703a', muzzle: '#f0d2a8', accent: '#f6ead8', ...options.colors },
    gaits: ['walk', 'trot', 'gallop'],
    cycleScale: 0.55,
    call: 'bark',
    anchors: { leash: { part: 'neck', at: [0, 0.06, 0] } },
    actions: () => ({
      wag: {
        summary: 'Wags its tail fast for `for` ms (default 1200).',
        uses: ['for'],
        run(context, beat, start) {
          const length = beat.for ?? 1200
          for (let t = 80, i = 0; t < length; t += 80, i++) context.key(start + t, { wag: i % 2 === 0 ? 35 : -35, tail: 25 }, { act: false, easing: 'ease-in-out' })
          context.key(start + length, { wag: 0, tail: 0 })
          return { end: start + length }
        },
      },
      sniff: {
        summary: 'Puts its nose to the ground and sniffs (`for` ms, default 1400).',
        uses: ['for'],
        run(context, beat, start) {
          const length = beat.for ?? 1400
          context.key(start + 350, { neck: 70, pitch: -6 }, { act: false, easing: 'ease-in-out' })
          for (let t = 500, i = 0; t < length; t += 140, i++) context.key(start + t, { neck: i % 2 === 0 ? 74 : 66 }, { act: false })
          context.key(start + length + 300, { neck: 0, pitch: 0 })
          return { end: start + length + 300 }
        },
      },
    }),
  })
}

/** A cartoon cat: walks, trots and runs, meows, arches its back, pounces, sits, swishes its tail. */
export function cat(options: AnimalOptions = {}): Prop {
  return quadruped({
    kind: options.kind ?? 'cat',
    summary: options.summary ?? 'A cartoon cat: walks, trots and runs, meows, arches its back, pounces, sits and swishes its tail.',
    legs: { upper: 0.13, lower: 0.11, foot: 0.035, footSize: [0.05, 0.07], front: 0.17, hind: -0.18, across: 0.06, thickness: [0.028, 0.035], lowerThickness: 0.022 },
    body: { radii: [0.1, 0.105, 0.27], rise: 0.07 },
    neck: { at: [0, 0.39, 0.2], points: [[0, 0, 0], [0, 0.08, 0.04]], radius: 0.05 },
    head: { at: [0, 0.1, 0.05], radii: [0.095, 0.085, 0.085] },
    muzzle: { at: [0, -0.03, 0.07], radii: [0.04, 0.03, 0.03] },
    // Pointed ears standing up.
    ears: { at: [0.055, 0.085, -0.01], radii: [0.03, 0.055, 0.02], rotate: [0, 0, -12] },
    eyes: { at: [0.045, 0.02, 0.07], size: 0.022 },
    // A long tail curving up behind.
    tail: { at: [0, 0.42, -0.26], points: [[0, 0, 0], [0, 0.08, -0.12], [0, 0.24, -0.16], [0, 0.34, -0.1]], radius: 0.022 },
    extras: () => [{ id: 'nose', parent: 'muzzle', shape: { type: 'ellipsoid', radii: [0.014, 0.01, 0.01], segments: 8 }, at: [0, 0.015, 0.03], fill: '#e48a9a', outline: 0.4 }],
    colors: { coat: '#8f8a86', dark: '#5f5a57', foot: '#f2efe9', muzzle: '#f2efe9', accent: '#f2efe9', ...options.colors },
    gaits: ['walk', 'trot', 'gallop'],
    cycleScale: 0.5,
    call: 'meow',
    actions: (h) => ({
      arch: {
        summary: 'Arches its back, fur up and tail high, for `for` ms (default 1200): a startled cat.',
        uses: ['for'],
        run(context, beat, start) {
          const e = context.exaggeration
          const length = beat.for ?? 1200
          const up = { squash: 1 + 0.25 * e, neck: 25, tail: -45, 'fl.swing': -8, 'fr.swing': -8, 'hl.swing': 8, 'hr.swing': 8 }
          context.key(start + 180, up, { act: false, easing: 'ease-out' })
          context.key(start + 180 + length, up, { act: false })
          context.key(start + length + 520, { squash: 1, neck: 0, tail: 0, 'fl.swing': 0, 'fr.swing': 0, 'hl.swing': 0, 'hr.swing': 0 })
          return { end: start + length + 520, contact: start + 180 }
        },
      },
      pounce: {
        summary: 'Crouches low, wiggles, and pounces to `to`, landing with a squash.',
        needs: ['to'],
        run(context, beat, start) {
          const e = context.exaggeration
          const direction = Math.sign(beat.to! - context.x) as 1 | -1 | 0
          let t = start
          if (direction !== 0 && context.facing() !== direction) t = context.turnTo(t, direction > 0 ? 'right' : 'left')
          const low = { squash: 0.75, 'hl.knee': 60, 'hr.knee': 60, 'fl.knee': 45, 'fr.knee': 45, neck: 10, tail: -15 }
          context.key(t + 300, low, { act: false, easing: 'ease-out' })
          // The wiggle before the leap.
          for (let i = 1; i <= 4; i++) context.key(t + 300 + i * 110, { roll: i % 2 === 0 ? 3 : -3 }, { act: false })
          const takeoff = t + 300 + 5 * 110
          const land = takeoff + 480
          context.key(takeoff, { roll: 0, squash: 1.2, 'hl.knee': 0, 'hr.knee': 0, 'fl.knee': 0, 'fr.knee': 0, 'fl.swing': 45, 'fr.swing': 45, 'hl.swing': -45, 'hr.swing': -45, tail: 20 }, { act: false, easing: 'ease-out' })
          context.key((takeoff + land) / 2, { lift: h.legLength * 0.9 * e, squash: 1.1, pitch: -6 }, { act: false, easing: 'ease-out' })
          context.key(land, { lift: 0, squash: 0.8, pitch: 0, 'fl.swing': 0, 'fr.swing': 0, 'hl.swing': 0, 'hr.swing': 0, neck: 0, tail: 0 }, { act: false, easing: 'ease-in' })
          context.key(land + 260, { squash: 1 })
          context.move(takeoff, land, beat.to!)
          context.effect({ kind: 'dust', time: land, x: beat.to!, y: context.floor, length: 450 })
          return { end: land + 260, contact: land }
        },
      },
    }),
  })
}

/** A cartoon cow: walks, moos, grazes, swishes its tail; patches, horns and an udder. */
export function cow(options: AnimalOptions = {}): Prop {
  return quadruped({
    kind: options.kind ?? 'cow',
    summary: options.summary ?? 'A cartoon cow: walks and trots, moos, grazes, sits and swishes its tail.',
    legs: { upper: 0.42, lower: 0.36, foot: 0.08, footSize: [0.13, 0.15], front: 0.68, hind: -0.66, across: 0.24, thickness: [0.085, 0.1], lowerThickness: 0.06 },
    body: { radii: [0.4, 0.42, 1.0], rise: 0.32 },
    neck: { at: [0, 1.3, 0.85], points: [[0, 0, 0], [0, 0.22, 0.25]], radius: 0.19 },
    head: { at: [0, 0.18, 0.4], radii: [0.17, 0.19, 0.27], rotate: [30, 0, 0] },
    muzzle: { at: [0, -0.06, 0.22], radii: [0.15, 0.11, 0.1] },
    ears: { at: [0.17, 0.06, -0.12], radii: [0.11, 0.035, 0.05], rotate: [0, 0, -15] },
    eyes: { at: [0.13, 0.06, 0.02], size: 0.04 },
    tail: { at: [0, 1.48, -1.0], points: [[0, 0, 0], [0, -0.25, -0.12], [0, -0.7, -0.14]], radius: 0.035 },
    extras: (c) => [
      { id: 'horn-left', parent: 'head', shape: { type: 'tube', points: [[0, 0, 0], [0.08, 0.12, 0.02]], radius: 0.025, segments: 6 }, at: [0.1, 0.16, -0.14], fill: '#efe6d2', outline: 0.6 },
      { id: 'horn-right', parent: 'head', shape: { type: 'tube', points: [[0, 0, 0], [-0.08, 0.12, 0.02]], radius: 0.025, segments: 6 }, at: [-0.1, 0.16, -0.14], fill: '#efe6d2', outline: 0.6 },
      { id: 'udder', shape: { type: 'ellipsoid', radii: [0.16, 0.12, 0.18], segments: 10 }, at: [0, 0.98, -0.45], fill: '#f0a6b6', outline: 0.6 },
      { id: 'spot-1', parent: 'body', shape: { type: 'ellipsoid', radii: [0.02, 0.2, 0.26], segments: 10 }, at: [0.39, 0.06, 0.2], fill: c.accent, outline: 0.4 },
      { id: 'spot-2', parent: 'body', shape: { type: 'ellipsoid', radii: [0.02, 0.16, 0.22], segments: 10 }, at: [-0.39, 0.1, -0.35], fill: c.accent, outline: 0.4 },
      { id: 'spot-3', parent: 'body', shape: { type: 'ellipsoid', radii: [0.2, 0.02, 0.24], segments: 10 }, at: [0, 0.41, -0.2], fill: c.accent, outline: 0.4 },
    ],
    colors: { coat: '#f4f1ea', dark: '#2e2b2a', foot: '#3a3330', muzzle: '#f0b8c4', accent: '#2e2b2a', ...options.colors },
    gaits: ['walk', 'trot'],
    cycleScale: 1.15,
    call: 'moo',
    grazes: true,
  })
}

/** Ground covered by one full cycle of a horse's gait. */
export function horseStrideLength(gait: HorseGait): number {
  return animalStrideLength(1.0, gait)
}
