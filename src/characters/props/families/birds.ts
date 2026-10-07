import type { Vec3 } from '../../../engine/math'
import type { ActingRig } from '../../acting/acting'
import type { ControlSpec, PropPart, PropRig } from '../rig'
import type { PropAction, PropActionContext } from '../script'
import type { Prop, PropMove } from '../target'

/**
 * Birds. A bird is a prop: a body, a head with a beak and eyes, two wings
 * hinged at the shoulders, a tail and two thin legs, seen from any side.
 * Its wings fold back along the body at rest and spread out (`spread`); they
 * flap from the shoulders (`flap`, and the rig's `derive` beats them from a
 * phase, `wingbeat`, while `flapping` is on, so wingbeats keep a rhythm).
 * Its head pecks (`peck`), and its legs step (a chicken walks) or it hops.
 *
 * `bird(spec)` builds one from proportions; `songbird()`, `crow()` and
 * `chicken()` are presets.
 */

export interface BirdSpec {
  kind: string
  summary: string
  /** Body radii (across, up, front to back), and how high its middle is */
  body: { radii: Vec3; height: number }
  /** Head: where its middle is (prop space) and its radius */
  head: { at: Vec3; radius: number }
  /** Beak: its length and its thickness at the head */
  beak: { length: number; thickness: number }
  /** Wings: the shoulder (prop space, left side; mirrored), span and chord */
  wing: { shoulder: Vec3; span: number; chord: number }
  /** Tail feathers: where they start, their length and width, and how far the tip is raised, degrees (default 15) */
  tail: { at: Vec3; length: number; width: number; raised?: number }
  /** Leg length (hip to foot) and the hips' spacing */
  legs: { length: number; across: number }
  /** A crest or comb on the head, and wattles */
  comb?: boolean
  colors: { body: string; wing: string; beak: string; legs: string; belly?: string; comb?: string }
  /** What its call is called: `tweet`, `caw`, `cluck` */
  call: string
  /** How fast its wings beat in flight, beats per second (default 4) */
  beatsPerSecond?: number
  /** How far its body tips forward to peck, degrees (default 12) */
  stoop?: number
  /** How far its neck stretches down as it pecks, metres at a full peck (default 0; a chicken reaches) */
  neckReach?: number
  /** It can fly (default true; a chicken only flutters) */
  flies?: boolean
}

/** How long a folded wing is, × its span. */
const FOLDED = 0.6
/** The peck angle the actions use, degrees: a full jab. */
const FULL_PECK = 75
/** How far a folded wing is rolled about its length, degrees, to lie against the body. */
const FOLDED_ROLL = 80

/** A bird from a spec. */
export function bird(spec: BirdSpec): Prop {
  const { colors } = spec
  const [rx, ry, rz] = spec.body.radii
  const tailRaised = ((spec.tail.raised ?? 15) * Math.PI) / 180
  const tailOut = spec.tail.length * 0.4
  const parts: PropPart[] = [
    { id: 'body', shape: { type: 'ellipsoid', radii: spec.body.radii, segments: 16 }, at: [0, spec.body.height, 0], fill: colors.body },
    // The head hangs from a neck joint at the front of the body, so it can peck.
    { id: 'neck', shape: { type: 'ellipsoid', radii: [rx * 0.55, ry * 0.55, rz * 0.3], segments: 10 }, at: [0, spec.body.height + ry * 0.45, rz * 0.65], fill: colors.body, outline: 0.5, solidOnly: true },
    {
      id: 'head',
      parent: 'neck',
      shape: { type: 'ellipsoid', radii: [spec.head.radius, spec.head.radius * 1.02, spec.head.radius * 1.05], segments: 14 },
      at: [spec.head.at[0], spec.head.at[1] - (spec.body.height + ry * 0.45), spec.head.at[2] - rz * 0.65],
      fill: colors.body,
    },
    {
      id: 'beak',
      parent: 'head',
      shape: { type: 'tube', points: [[0, 0, 0], [0, -spec.beak.thickness * 0.4, spec.beak.length]], radius: [spec.beak.thickness, spec.beak.thickness * 0.08], segments: 8 },
      at: [0, -spec.head.radius * 0.1, spec.head.radius * 0.8],
      fill: colors.beak,
      outline: 0.8,
    },
    // The tail fans back from its root, its tip raised: its middle lies along that line, a little way out.
    { id: 'tail', shape: { type: 'ellipsoid', radii: [spec.tail.width / 2, 0.012 * (rz / 0.08), spec.tail.length / 2], segments: 10 }, at: [spec.tail.at[0], spec.tail.at[1] + tailOut * Math.sin(tailRaised), spec.tail.at[2] - tailOut * Math.cos(tailRaised)], rotate: [spec.tail.raised ?? 15, 0, 0], fill: colors.wing, outline: 0.8 },
  ]
  if (colors.belly) parts.push({ id: 'belly', parent: 'body', shape: { type: 'ellipsoid', radii: [rx * 0.82, ry * 0.7, rz * 0.75], segments: 12 }, at: [0, -ry * 0.25, rz * 0.12], fill: colors.belly, outline: 0.4 })
  if (spec.comb) {
    const r = spec.head.radius
    parts.push(
      { id: 'comb', parent: 'head', shape: { type: 'extrude', profile: [[-r * 0.5, r * 0.6], [r * 0.6, r * 0.6], [r * 0.5, r * 1.3], [r * 0.15, r * 1.05], [-r * 0.05, r * 1.4], [-r * 0.3, r * 1.05], [-r * 0.6, r * 1.25]], width: r * 0.25 }, fill: colors.comb ?? '#d9372e', outline: 0.7 },
      { id: 'wattle', parent: 'head', shape: { type: 'ellipsoid', radii: [r * 0.15, r * 0.35, r * 0.2], segments: 8 }, at: [0, -r * 0.7, r * 0.6], fill: colors.comb ?? '#d9372e', outline: 0.6 },
    )
  }
  for (const side of [1, -1]) {
    const name = side > 0 ? 'left' : 'right'
    const r = spec.head.radius
    parts.push({ id: `eye-${name}`, parent: 'head', shape: { type: 'ellipsoid', radii: [r * 0.16, r * 0.2, r * 0.18], segments: 8 }, at: [side * r * 0.72, r * 0.18, r * 0.42], fill: '#1d1d22', outline: 0.3 })
    // The wing hangs from its shoulder; at rest it is turned back to lie along the body, drooping a
    // little toward the tail, and folded shorter (`spread` opens it out to its full span).
    parts.push({
      id: `wing-${name}`,
      shape: { type: 'ellipsoid', radii: [0.004, 0.004, 0.004], segments: 4 },
      at: [side * spec.wing.shoulder[0], spec.wing.shoulder[1], spec.wing.shoulder[2]],
      rotate: [-8, side * 90, 0],
      outline: 0,
    })
    parts.push({
      id: `wing-${name}-blade`,
      parent: `wing-${name}`,
      shape: { type: 'ellipsoid', radii: [(spec.wing.span * FOLDED) / 2, spec.wing.chord * 0.1, spec.wing.chord / 2], segments: 12 },
      at: [(side * spec.wing.span * FOLDED) / 2, 0, -spec.wing.chord * 0.1],
      // Folded, the blade is rolled about its length so it lies flat against the body's side.
      rotate: [-FOLDED_ROLL, 0, 0],
      fill: colors.wing,
      outline: 0.8,
    })
    // The flight feathers: a narrower blade swept back from the outer half, so the wing tapers to a point.
    parts.push({
      id: `wing-${name}-tip`,
      parent: `wing-${name}-blade`,
      shape: { type: 'ellipsoid', radii: [(spec.wing.span * FOLDED) / 2.4, spec.wing.chord * 0.06, spec.wing.chord * 0.3], segments: 10 },
      at: [(side * spec.wing.span * FOLDED) / 4, 0, -spec.wing.chord * 0.3],
      rotate: [0, side * 14, 0],
      fill: colors.wing,
      outline: 0.8,
    })
    // Legs: thin tubes down from the hips, with toes forward.
    parts.push({ id: `leg-${name}`, shape: { type: 'tube', points: [[0, 0, 0], [0, -spec.legs.length, 0]], radius: Math.max(0.004, spec.legs.length * 0.05), segments: 5 }, at: [side * spec.legs.across, spec.legs.length, 0], fill: colors.legs, outline: 0.6 })
    parts.push({ id: `toes-${name}`, parent: `leg-${name}`, shape: { type: 'tube', points: [[0, 0, -spec.legs.length * 0.15], [0, 0, spec.legs.length * 0.35]], radius: Math.max(0.003, spec.legs.length * 0.04), segments: 5 }, at: [0, -spec.legs.length, 0], fill: colors.legs, outline: 0.6 })
  }
  const controls: Record<string, ControlSpec> = {
    spread: {
      description: 'Wings: 0 folded back along the body, 1 spread out',
      unit: '0..1',
      min: 0,
      max: 1,
      bind: [
        { parts: ['wing-left'], rotate: { axis: 'y', degrees: -90 } },
        { parts: ['wing-right'], rotate: { axis: 'y', degrees: 90 } },
        { parts: ['wing-left-blade'], translate: [(spec.wing.span * (1 - FOLDED)) / 2, 0, 0], rotate: { axis: 'x', degrees: FOLDED_ROLL }, scale: [1 / FOLDED, 1, 1] },
        { parts: ['wing-right-blade'], translate: [(-spec.wing.span * (1 - FOLDED)) / 2, 0, 0], rotate: { axis: 'x', degrees: FOLDED_ROLL }, scale: [1 / FOLDED, 1, 1] },
      ],
    },
    flap: {
      description: 'Wings raised (+) or lowered (−) at the shoulders',
      unit: 'degrees',
      bind: [
        { parts: ['wing-left'], rotate: { axis: 'z', degrees: 1 } },
        { parts: ['wing-right'], rotate: { axis: 'z', degrees: -1 } },
      ],
    },
    wingbeat: { description: 'Phase of the wingbeat, in beats (keyed steadily while flapping)', unit: 'beats' },
    flapping: { description: 'How hard the wings beat: 0 still, 1 full beats', unit: '0..1', min: 0, max: 1 },
    peck: {
      description: 'Head bobbed down and forward (+, pecking) or up (−)',
      unit: 'degrees',
      bind: [{ parts: ['neck'], rotate: { axis: 'x', degrees: 1 }, translate: [0, -(spec.neckReach ?? 0) / FULL_PECK, 0] }],
    },
    step: { description: 'Phase of a walk, in steps (a chicken’s legs)', unit: 'steps' },
    stepping: { description: 'How much of the walk is applied', unit: '0..1', min: 0, max: 1 },
    'leg.left': { description: 'Left leg swung forward (+)', unit: 'degrees', bind: [{ parts: ['leg-left'], rotate: { axis: 'x', degrees: -1 } }] },
    'leg.right': { description: 'Right leg swung forward (+)', unit: 'degrees', bind: [{ parts: ['leg-right'], rotate: { axis: 'x', degrees: -1 } }] },
  }
  const rig: PropRig = {
    parts,
    controls,
    length: rz * 2 + spec.tail.length + spec.beak.length,
    height: spec.head.at[1] + spec.head.radius,
    footprint: [rx * 2.2, rz * 2.4],
    anchors: {
      beak: { part: 'beak', at: [0, 0, spec.beak.length] },
      head: { part: 'head', at: [0, 0, 0] },
      back: { at: [0, spec.body.height + ry, 0] },
      feet: { at: [0, 0, 0] },
    },
    derive: (values) => {
      const out: Record<string, number> = {}
      const flapping = Math.max(0, Math.min(1, values.flapping ?? 0))
      if (flapping > 0) out.flap = (values.flap ?? 0) + flapping * 48 * Math.sin(Math.PI * 2 * (values.wingbeat ?? 0))
      const stepping = Math.max(0, Math.min(1, values.stepping ?? 0))
      if (stepping > 0) {
        const swing = Math.sin(Math.PI * 2 * (values.step ?? 0))
        out['leg.left'] = (values['leg.left'] ?? 0) + stepping * 28 * swing
        out['leg.right'] = (values['leg.right'] ?? 0) - stepping * 28 * swing
        out.peck = (values.peck ?? 0) + stepping * 12 * Math.sin(Math.PI * 4 * (values.step ?? 0))
      }
      return out
    },
  }
  return {
    kind: spec.kind,
    family: 'bird',
    summary: spec.summary,
    rig,
    actions: birdActions(spec),
    acting: BIRD_ACTING,
    colors: { body: colors.body, ink: '#26262b' },
    moves: birdMoves(spec),
  }
}

/** How it gets about in world metres (`propScript3D`): it walks with its head bobbing, and (most birds) flies. */
function birdMoves(spec: BirdSpec): Record<string, PropMove> {
  // As its walk action: a step every 420 ms, each its legs' length and a fifth; a step is half the `step` cycle.
  const stride = spec.legs.length * 1.2
  const moves: Record<string, PropMove> = { walk: { speed: stride / 0.42, hold: { stepping: 1 }, perMetre: { step: 0.5 / stride } } }
  if (spec.flies !== false) {
    moves.fly = { speed: 4 + spec.wing.span * 12, flies: true, hold: { flapping: 1, spread: 1 }, perSecond: { wingbeat: spec.beatsPerSecond ?? 4 } }
  }
  return moves
}

export const BIRD_ACTING: ActingRig = {
  depth: { turn: 0, lift: 0, pitch: 1, roll: 1, squash: 1, spread: 1, flap: 2, peck: 2 },
  limits: { pitch: 6, roll: 6, squash: 0.06, peck: 8, flap: 10, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: [],
}

function birdActions(spec: BirdSpec): Record<string, PropAction> {
  const beats = (spec.beatsPerSecond ?? 4) / 1000
  /** Keep the wings beating from `from` to `to` ms. */
  const beatWings = (context: PropActionContext, from: number, to: number) => {
    const phase = context.values.wingbeat ?? 0
    context.set('wingbeat', from, phase)
    context.set('wingbeat', to, phase + (to - from) * beats)
  }
  const face = (context: PropActionContext, start: number, toX: number) => {
    const direction = Math.sign(toX - context.x) as 1 | -1 | 0
    return direction !== 0 && context.facing() !== direction ? context.turnTo(start, direction > 0 ? 'right' : 'left') : start
  }
  const callAt = (context: PropActionContext, time: number) => {
    const beak = context.anchor('beak')
    context.effect({ kind: 'honk', time, x: beak.x, y: beak.y, length: 600, direction: (context.facing() || 1) as 1 | -1 })
  }

  const actions: Record<string, PropAction> = {
    hop: {
      summary: 'Hops to `to` in little bounces, wings twitching.',
      needs: ['to'],
      run(context, beat, start) {
        const t = face(context, start, beat.to!)
        const from = context.x
        const distance = Math.abs(beat.to! - from)
        const hops = Math.max(1, Math.round(distance / (spec.body.radii[2] * 3 * context.scale)))
        const each = 260
        for (let i = 0; i < hops; i++) {
          const s = t + i * each
          context.key(s + 60, { squash: 0.85 }, { act: false, easing: 'ease-out' })
          context.key(s + 150, { squash: 1.1, lift: spec.legs.length * 1.4, spread: 0.15 }, { act: false, easing: 'ease-out' })
          context.key(s + each, { squash: 0.9, lift: 0, spread: 0 }, { act: false, easing: 'ease-in' })
          context.move(s + 60, s + each, from + ((beat.to! - from) * (i + 1)) / hops, { easing: 'ease-in-out' })
        }
        context.key(t + hops * each + 120, { squash: 1 })
        return { end: t + hops * each + 120 }
      },
    },
    walk: {
      summary: 'Walks to `to` on its two legs, its head bobbing with each step.',
      needs: ['to'],
      uses: ['for'],
      run(context, beat, start) {
        const t = face(context, start, beat.to!)
        const metres = Math.abs(beat.to! - context.x) / context.scale
        const stride = spec.legs.length * 1.2
        const steps = metres / stride
        const travel = beat.for ?? Math.max(400, steps * 420)
        const phase = context.values.step ?? 0
        context.set('stepping', t, 0)
        context.set('stepping', t + 150, 1, 'ease-out')
        context.set('stepping', t + travel - 150, 1)
        context.set('stepping', t + travel, 0, 'ease-in')
        context.set('step', t, phase)
        context.move(t, t + travel, beat.to!, { easing: 'ease-in-out' })
        context.set('step', t + travel, phase + steps / 2, 'ease-in-out')
        return { end: t + travel, contact: t, release: t + travel }
      },
    },
    peck: {
      summary: 'Pecks at the ground (`for` ms, default 900): quick jabs of the head.',
      uses: ['for'],
      run(context, beat, start) {
        const length = beat.for ?? 900
        const jabs = Math.max(1, Math.round(length / 300))
        context.key(start + 120, { pitch: -(spec.stoop ?? 12) }, { act: false, easing: 'ease-out' })
        for (let i = 0; i < jabs; i++) {
          context.key(start + 120 + i * 300 + 90, { peck: FULL_PECK }, { act: false, easing: 'ease-in' })
          context.key(start + 120 + i * 300 + 260, { peck: 20 }, { act: false, easing: 'ease-out' })
        }
        context.key(start + 120 + jabs * 300 + 200, { peck: 0, pitch: 0 })
        return { end: start + 120 + jabs * 300 + 200, contact: start + 210 }
      },
    },
    flap: {
      summary: 'Flaps its wings on the spot (`for` ms, default 900), lifting a little.',
      uses: ['for'],
      run(context, beat, start) {
        const length = beat.for ?? 900
        context.key(start + 120, { spread: 1 }, { act: false, easing: 'ease-out' })
        context.set('flapping', start, 0)
        context.set('flapping', start + 150, 1, 'ease-out')
        context.set('flapping', start + length - 150, 1)
        context.set('flapping', start + length, 0, 'ease-in')
        beatWings(context, start, start + length)
        context.key(start + length * 0.5, { lift: spec.legs.length * 0.6 }, { act: false, easing: 'ease-out' })
        context.key(start + length, { lift: 0, spread: 0 }, { act: false, easing: 'ease-in' })
        return { end: start + length + 80 }
      },
    },
    [spec.call]: {
      summary: `${spec.call[0].toUpperCase()}${spec.call.slice(1)}s: its head comes up and its beak opens to call.`,
      run(context, _beat, start) {
        context.key(start + 120, { peck: -25, squash: 1.06 }, { act: false, easing: 'ease-out' })
        context.key(start + 500, { peck: -20 }, { act: false })
        context.key(start + 760, { peck: 0, squash: 1 })
        callAt(context, start + 150)
        return { end: start + 760, contact: start + 150 }
      },
    },
  }
  if (spec.flies !== false) {
    actions.fly = {
      summary: 'Takes off (a crouch and a leap, wings beating) and flies to `to` at `height` metres (default 2); `land` brings it down.',
      needs: ['to'],
      uses: ['height', 'for'],
      run(context, beat, start) {
        const e = context.exaggeration
        const t = face(context, start, beat.to!)
        const height = beat.height ?? 2
        const travel = beat.for ?? Math.max(700, Math.abs(beat.to! - context.x) / 0.35)
        const airborne = context.values.lift > spec.legs.length
        const off = airborne ? t : t + 200
        if (!airborne) {
          context.key(t + 160, { squash: 1 - 0.18 * e, spread: 0.6 }, { act: false, easing: 'ease-out' })
          context.effect({ kind: 'dust', time: off, x: context.x, y: context.floor, length: 400 })
        }
        context.key(off + 100, { spread: 1, squash: 1.08, pitch: 10 }, { act: false, easing: 'ease-out' })
        context.set('flapping', off, context.values.flapping ?? 0)
        context.set('flapping', off + 100, 1, 'ease-out')
        context.set('flapping', off + travel, 0.6)
        beatWings(context, off, off + travel)
        context.key(off + travel * 0.4, { lift: height, pitch: -5, squash: 1 }, { act: false, easing: 'ease-out' })
        context.key(off + travel, { lift: height, pitch: 0 }, { act: false, easing: 'ease-in-out' })
        context.move(off, off + travel, beat.to!, { easing: 'ease-in-out' })
        return { end: off + travel, contact: off, release: off + travel }
      },
    }
    actions.land = {
      summary: 'Comes down to the floor it is over (or to `height` metres above it, a branch or a roof): wings braking, a squash on touchdown.',
      uses: ['height', 'to'],
      run(context, beat, start) {
        const length = 700
        const down = beat.height ?? 0
        context.set('flapping', start, context.values.flapping ?? 1)
        context.set('flapping', start + length - 120, 1)
        context.set('flapping', start + length, 0, 'ease-in')
        beatWings(context, start, start + length)
        context.key(start + length * 0.6, { pitch: 14 }, { act: false, easing: 'ease-out' })
        context.key(start + length, { lift: down, pitch: 0, squash: 0.85 }, { act: false, easing: 'ease-in' })
        if (beat.to !== undefined) context.move(start, start + length, beat.to, { easing: 'ease-out' })
        context.key(start + length + 160, { squash: 1, spread: 0 })
        return { end: start + length + 200, contact: start + length }
      },
    }
  } else {
    actions.flutter = {
      summary: 'Flutters up a little way and back down, wings beating hard (a chicken’s flight).',
      run(context, _beat, start) {
        const length = 900
        context.key(start + 100, { spread: 1, squash: 0.9 }, { act: false, easing: 'ease-out' })
        context.set('flapping', start + 80, 0)
        context.set('flapping', start + 160, 1, 'ease-out')
        context.set('flapping', start + length - 100, 1)
        context.set('flapping', start + length, 0, 'ease-in')
        beatWings(context, start + 80, start + length)
        context.key(start + length * 0.5, { lift: spec.legs.length * 2.5, squash: 1.08 }, { act: false, easing: 'ease-out' })
        context.key(start + length, { lift: 0, squash: 0.85, spread: 0 }, { act: false, easing: 'ease-in' })
        context.key(start + length + 160, { squash: 1 })
        return { end: start + length + 160, contact: start + length }
      },
    }
  }
  return actions
}

// --- presets ------------------------------------------------------------------

/** A small songbird: hops, pecks, tweets, flies and lands. */
export function songbird(options: { colors?: Partial<BirdSpec['colors']> } = {}): Prop {
  return bird({
    kind: 'songbird',
    summary: 'A small songbird: hops, pecks, tweets, flaps, flies and lands (on the ground, a branch or a roof).',
    body: { radii: [0.05, 0.05, 0.075], height: 0.085 },
    head: { at: [0, 0.145, 0.065], radius: 0.036 },
    beak: { length: 0.03, thickness: 0.01 },
    wing: { shoulder: [0.04, 0.1, 0.03], span: 0.11, chord: 0.06 },
    tail: { at: [0, 0.095, -0.07], length: 0.07, width: 0.045 },
    legs: { length: 0.04, across: 0.018 },
    colors: { body: '#7b6a58', wing: '#5c4c3d', beak: '#e7a43a', legs: '#c47a35', belly: '#e9c8a3', ...options.colors },
    call: 'tweet',
    beatsPerSecond: 9,
  })
}

/** A crow: walks, hops, pecks, caws, flies and lands. */
export function crow(options: { colors?: Partial<BirdSpec['colors']> } = {}): Prop {
  return bird({
    kind: 'crow',
    summary: 'A crow: walks and hops, pecks, caws, flaps, flies and lands (on the ground, a branch or a roof).',
    body: { radii: [0.09, 0.09, 0.17], height: 0.2 },
    head: { at: [0, 0.32, 0.15], radius: 0.065 },
    beak: { length: 0.08, thickness: 0.022 },
    wing: { shoulder: [0.07, 0.24, 0.06], span: 0.32, chord: 0.14 },
    tail: { at: [0, 0.2, -0.15], length: 0.16, width: 0.09 },
    legs: { length: 0.1, across: 0.035 },
    colors: { body: '#2b2b33', wing: '#1e1e25', beak: '#3b3b44', legs: '#3b3b44', ...options.colors },
    call: 'caw',
    beatsPerSecond: 4,
  })
}

/** A chicken: walks with a bobbing head, pecks, clucks, flutters (it cannot really fly). */
export function chicken(options: { colors?: Partial<BirdSpec['colors']> } = {}): Prop {
  return bird({
    kind: 'chicken',
    summary: 'A chicken: walks with a bobbing head, pecks, clucks, and flutters up and down (it cannot really fly).',
    body: { radii: [0.13, 0.14, 0.19], height: 0.3 },
    head: { at: [0, 0.5, 0.16], radius: 0.07 },
    beak: { length: 0.05, thickness: 0.02 },
    wing: { shoulder: [0.11, 0.34, 0.04], span: 0.24, chord: 0.15 },
    tail: { at: [0, 0.38, -0.15], length: 0.16, width: 0.13, raised: 50 },
    legs: { length: 0.17, across: 0.05 },
    comb: true,
    stoop: 20,
    neckReach: 0.12,
    colors: { body: '#f4ede0', wing: '#e6dccb', beak: '#e7a43a', legs: '#e7a43a', comb: '#d9372e', ...options.colors },
    call: 'cluck',
    flies: false,
  })
}
