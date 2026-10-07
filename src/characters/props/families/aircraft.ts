import type { ActingRig } from '../../acting/acting'
import type { PropPart, PropRig } from '../rig'
import type { PropAction, PropActionContext } from '../script'
import type { Prop } from '../target'

/**
 * Flying craft. A helicopter is a fuselage from a side profile, a tail boom,
 * skids, a main rotor and a tail rotor. Its rotors spin from `rotor`, keyed
 * exactly (they are not acted), and the main rotor reads as a blurred disc
 * once it is spinning fast. It takes off (the skids squash as it spools up,
 * then it lifts nose-down), flies with its nose down and banking into the
 * move, hovers with a bob, and lands with a squash and dust.
 */

export interface HelicopterSpec {
  kind?: string
  summary?: string
  colors?: { body?: string; glass?: string; trim?: string; rotor?: string }
}

/** A cartoon helicopter. */
export function helicopter(spec: HelicopterSpec = {}): Prop {
  const colors = { body: '#3f86c8', glass: '#cfeaf5', trim: '#2c2c33', rotor: '#3b3b44', ...spec.colors }
  const rotorHeight = 2.15
  const parts: PropPart[] = [
    {
      id: 'cabin',
      shape: { type: 'extrude', profile: [[-1.2, 0.6], [0.9, 0.55], [1.6, 0.85], [1.65, 1.25], [1.2, 1.75], [-0.6, 1.85], [-1.3, 1.45]], width: 1.5 },
      fill: colors.body,
    },
    {
      id: 'window',
      shape: { type: 'extrude', profile: [[0.75, 1.0], [1.6, 0.95], [1.6, 1.3], [1.15, 1.72], [0.6, 1.72]], width: 1.54 },
      fill: colors.glass,
      outline: 0.8,
    },
    { id: 'boom', shape: { type: 'tube', points: [[0, 1.4, -1.2], [0, 1.55, -3.4]], radius: 0.16, segments: 8 }, fill: colors.body },
    { id: 'fin', shape: { type: 'extrude', profile: [[-3.55, 1.45], [-3.2, 1.5], [-3.35, 2.25], [-3.6, 2.25]], width: 0.12 }, fill: colors.body },
    { id: 'mast', shape: { type: 'tube', points: [[0, 1.82, 0.1], [0, rotorHeight, 0.1]], radius: 0.07, segments: 6 }, fill: colors.trim },
    // The main rotor: a disc that is all but invisible until it spins up, and its two blades.
    { id: 'rotor-disc', shape: { type: 'cylinder', radius: 2.4, length: 0.01, axis: 'y', segments: 28 }, at: [0, rotorHeight + 0.02, 0.1], fill: '#c9d4dd', outline: 0.4, fade: { control: 'blur', from: 0, to: 0.45 } },
    { id: 'blades', shape: { type: 'box', size: [0.16, 0.03, 4.8] }, at: [0, rotorHeight + 0.05, 0.1], fill: colors.rotor, outline: 0.7, fade: { control: 'blur', from: 1, to: 0.3 } },
    { id: 'tail-rotor', shape: { type: 'box', size: [0.04, 0.9, 0.12] }, at: [0.12, 1.85, -3.45], fill: colors.rotor, outline: 0.6 },
    { id: 'skid-left', shape: { type: 'tube', points: [[0, 0.08, -1.1], [0, 0.08, 1.2], [0, 0.22, 1.45]], radius: 0.05, segments: 6 }, at: [0.7, 0, 0], fill: colors.trim },
    { id: 'skid-right', shape: { type: 'tube', points: [[0, 0.08, -1.1], [0, 0.08, 1.2], [0, 0.22, 1.45]], radius: 0.05, segments: 6 }, at: [-0.7, 0, 0], fill: colors.trim },
    { id: 'strut-left', shape: { type: 'tube', points: [[0.7, 0.08, 0.6], [0.55, 0.62, 0.5]], radius: 0.04, segments: 5 }, fill: colors.trim },
    { id: 'strut-right', shape: { type: 'tube', points: [[-0.7, 0.08, 0.6], [-0.55, 0.62, 0.5]], radius: 0.04, segments: 5 }, fill: colors.trim },
  ]
  const rig: PropRig = {
    parts,
    controls: {
      rotor: {
        description: 'How far the rotors have turned (keyed exactly, not acted; the blades blur into a disc when they spin fast)',
        unit: 'degrees',
        bind: [
          { parts: ['blades'], rotate: { axis: 'y', degrees: 1 } },
          { parts: ['tail-rotor'], rotate: { axis: 'x', degrees: 3, pivot: [0, 0, 0] } },
        ],
      },
      blur: { description: 'How blurred the main rotor is: 0 still blades, 1 a spinning disc', unit: '0..1', min: 0, max: 1 },
    },
    length: 5.2,
    height: 2.4,
    footprint: [1.8, 3.4],
    anchors: {
      seat: { at: [0, 0.75, 0.7] },
      door: { at: [-0.76, 1.0, 0.2] },
      rotor: { at: [0, rotorHeight, 0.1] },
      skids: { at: [0, 0, 0.2] },
      hook: { at: [0, 0.4, 0] },
    },
  }
  return {
    kind: spec.kind ?? 'helicopter',
    family: 'aircraft',
    summary: spec.summary ?? 'A cartoon helicopter: spools up and takes off, flies nose-down banking into its moves, hovers with a bob, and lands with a squash.',
    rig,
    actions: helicopterActions(),
    acting: AIRCRAFT_ACTING,
    colors: { body: colors.body, ink: '#26262b' },
    // In world metres: flies with its rotor spinning (a blur), at the height a beat gives.
    moves: { fly: { speed: 15, flies: true, hold: { blur: 1 }, perSecond: { rotor: FLYING_SPIN * 1000 } } },
  }
}

/** Lift leads; the body's pitch, roll and squash follow. */
export const AIRCRAFT_ACTING: ActingRig = {
  depth: { turn: 0, lift: 0, blur: 0, pitch: 1, roll: 1, squash: 1, lean: 1, size: 0 },
  limits: { turn: 0.08, pitch: 6, roll: 6, squash: 0.06, lift: 0.15 },
  eyes: [],
  headTurns: {},
  drift: [],
}

/** Rotor speed when flying: degrees per ms (about 7 turns a second, a blur). */
const FLYING_SPIN = 2.6

function helicopterActions(): Record<string, PropAction> {
  /** Keep the rotor turning at `rate` °/ms from `from` to `to` ms (it is keyed exactly; it does not settle or overshoot). */
  const spin = (context: PropActionContext, from: number, to: number, rate: number, easing?: 'ease-in' | 'ease-out') => {
    const start = context.values.rotor ?? 0
    context.set('rotor', from, start)
    // Spooling up or down covers half the angle a steady spin would.
    const angle = easing ? rate * (to - from) * 0.5 : rate * (to - from)
    context.set('rotor', to, start + angle, easing)
  }
  const flying = (context: PropActionContext) => context.values.lift > 0.05

  return {
    takeOff: {
      summary: 'Spools the rotor up (the skids squash as it bites), then lifts off nose-down to `height` metres (default 3).',
      uses: ['height'],
      run(context, beat, start) {
        const e = context.exaggeration
        const height = beat.height ?? 3
        spin(context, start, start + 900, FLYING_SPIN, 'ease-in')
        context.key(start + 900, { blur: 1 }, { act: false, easing: 'ease-in' })
        context.key(start + 700, { squash: 1 - 0.08 * e }, { act: false, easing: 'ease-in' })
        const lift = start + 1000
        context.key(lift + 150, { squash: 1 + 0.06 * e, lift: 0.3 }, { act: false, easing: 'ease-out' })
        context.key(lift + 1300, { squash: 1, lift: height, pitch: -4 * e }, { act: false, easing: 'ease-in-out' })
        context.key(lift + 1700, { pitch: 0 })
        spin(context, start + 900, lift + 1700, FLYING_SPIN)
        context.effect({ kind: 'dust', time: lift, x: context.x, y: context.floor, length: 900 })
        return { end: lift + 1700, contact: lift }
      },
    },
    fly: {
      summary: 'Flies to `to` (and to `height`, if given): nose down and banked into the move, nose up and leveling as it stops.',
      needs: ['to'],
      uses: ['height', 'speed', 'for'],
      run(context, beat, start) {
        const e = context.exaggeration
        const direction = Math.sign(beat.to! - context.x) as 1 | -1 | 0
        let t = start
        if (direction !== 0 && context.facing() !== direction) t = context.turnTo(t, direction > 0 ? 'right' : 'left')
        const distance = Math.abs(beat.to! - context.x)
        const travel = beat.for ?? Math.max(700, distance / (beat.speed ?? 0.3))
        const lift = beat.height ?? context.values.lift
        // Tip forward to go, bank into it, then flare (nose up) to stop.
        context.key(t + 300, { pitch: -9 * e, roll: 6 * e }, { act: false, easing: 'ease-out' })
        context.key(t + travel - 250, { pitch: -4 * e, roll: 3 * e, lift }, { act: false })
        context.key(t + travel, { pitch: 7 * e, roll: 0 }, { act: false, easing: 'ease-out' })
        context.key(t + travel + 450, { pitch: 0 })
        context.move(t, t + travel, beat.to!, { easing: 'ease-in-out' })
        spin(context, start, t + travel + 450, FLYING_SPIN)
        return { end: t + travel + 450, contact: t, release: t + travel }
      },
    },
    hover: {
      summary: 'Hovers in place for `for` ms (default 2000), bobbing gently.',
      uses: ['for'],
      run(context, beat, start) {
        const length = beat.for ?? 2000
        const base = context.values.lift
        const e = context.exaggeration
        for (let t = 350, i = 0; t < length; t += 350, i++) {
          context.key(start + t, { lift: base + (i % 2 === 0 ? 0.12 : -0.06) * e, roll: (i % 2 === 0 ? 1.5 : -1.5) * e }, { act: false, easing: 'ease-in-out' })
        }
        context.key(start + length, { lift: base, roll: 0 }, { act: false, easing: 'ease-in-out' })
        if (flying(context) || base > 0) spin(context, start, start + length, FLYING_SPIN)
        return { end: start + length }
      },
    },
    land: {
      summary: 'Settles down onto its skids: a flare, a squash on touchdown with dust, and the rotor spools down.',
      run(context, _beat, start) {
        const e = context.exaggeration
        const down = start + Math.max(900, context.values.lift * 450)
        context.key(start + 400, { pitch: 3 * e }, { act: false, easing: 'ease-out' })
        context.key(down, { lift: 0, pitch: 0, squash: 1 - 0.14 * e }, { act: false, easing: 'ease-in' })
        context.key(down + 280, { squash: 1 })
        spin(context, start, down, FLYING_SPIN)
        spin(context, down, down + 1600, FLYING_SPIN, 'ease-out')
        context.key(down + 1600, { blur: 0 }, { act: false, easing: 'ease-out' })
        context.effect({ kind: 'dust', time: down, x: context.x, y: context.floor, length: 800 })
        return { end: down + 1600, contact: down }
      },
    },
  }
}

// --- airplanes ----------------------------------------------------------------

export interface AirplaneSpec {
  kind?: string
  summary?: string
  colors?: { body?: string; wings?: string; glass?: string; trim?: string; stripe?: string }
}

/** A cartoon propeller plane: fuselage, wings, a tail, landing gear and a propeller that blurs into a disc. */
export function airplane(spec: AirplaneSpec = {}): Prop {
  const colors = { body: '#e9e4d8', wings: '#d9483b', glass: '#cfeaf5', trim: '#2c2c33', ...spec.colors }
  const nose = 3.15
  const parts: PropPart[] = [
    { id: 'fuselage', shape: { type: 'extrude', profile: [[-3.7, 1.55], [-2.6, 1.05], [2.4, 0.85], [3.0, 1.0], [3.1, 1.4], [2.7, 1.75], [1.4, 1.9], [-2.9, 1.85]], width: 1.0 }, fill: colors.body },
    { id: 'canopy', shape: { type: 'extrude', profile: [[0.4, 1.85], [1.6, 1.85], [1.1, 2.3], [0.5, 2.3]], width: 0.7 }, fill: colors.glass, outline: 0.8 },
    // Each wing (and each half of the tailplane) is its own part, so the near one draws in front of the fuselage
    // and the far one behind it.
    { id: 'wing-left', shape: { type: 'box', size: [3.6, 0.1, 1.35] }, at: [2.05, 1.15, 0.55], fill: colors.wings },
    { id: 'wing-right', shape: { type: 'box', size: [3.6, 0.1, 1.35] }, at: [-2.05, 1.15, 0.55], fill: colors.wings },
    { id: 'tailplane-left', shape: { type: 'box', size: [1.1, 0.07, 0.65] }, at: [0.6, 1.7, -3.35], fill: colors.wings },
    { id: 'tailplane-right', shape: { type: 'box', size: [1.1, 0.07, 0.65] }, at: [-0.6, 1.7, -3.35], fill: colors.wings },
    { id: 'fin', shape: { type: 'extrude', profile: [[-3.75, 1.75], [-3.0, 1.82], [-3.45, 2.75], [-3.8, 2.75]], width: 0.1 }, fill: colors.wings },
    { id: 'gear-left', shape: { type: 'tube', points: [[0.55, 0.95, 1.2], [0.75, 0.28, 1.3]], radius: 0.04, segments: 5 }, fill: colors.trim },
    { id: 'gear-right', shape: { type: 'tube', points: [[-0.55, 0.95, 1.2], [-0.75, 0.28, 1.3]], radius: 0.04, segments: 5 }, fill: colors.trim },
    { id: 'wheel-left', shape: { type: 'cylinder', radius: 0.26, length: 0.14, axis: 'x', segments: 14 }, at: [0.78, 0.26, 1.3], fill: colors.trim },
    { id: 'wheel-right', shape: { type: 'cylinder', radius: 0.26, length: 0.14, axis: 'x', segments: 14 }, at: [-0.78, 0.26, 1.3], fill: colors.trim },
    { id: 'tail-wheel', shape: { type: 'cylinder', radius: 0.12, length: 0.08, axis: 'x', segments: 10 }, at: [0, 0.12, -3.0], fill: colors.trim },
    { id: 'tail-strut', shape: { type: 'tube', points: [[0, 0.12, -3.0], [0, 1.2, -2.9]], radius: 0.03, segments: 5 }, fill: colors.trim },
    { id: 'spinner', shape: { type: 'ellipsoid', radii: [0.18, 0.18, 0.22], segments: 10 }, at: [0, 1.22, nose], fill: colors.wings, outline: 0.7 },
    { id: 'prop-disc', shape: { type: 'cylinder', radius: 0.95, length: 0.01, axis: 'z', segments: 24 }, at: [0, 1.22, nose + 0.08], fill: '#c9d4dd', outline: 0.4, fade: { control: 'blur', from: 0, to: 0.45 } },
    { id: 'propeller', shape: { type: 'box', size: [0.12, 1.85, 0.04] }, at: [0, 1.22, nose + 0.1], fill: colors.trim, outline: 0.6, fade: { control: 'blur', from: 1, to: 0.3 } },
  ]
  const rig: PropRig = {
    parts,
    controls: {
      rotor: { description: 'How far the propeller has turned (keyed exactly; it blurs into a disc at speed)', unit: 'degrees', bind: [{ parts: ['propeller'], rotate: { axis: 'z', degrees: 1 } }] },
      blur: { description: 'How blurred the propeller is: 0 still, 1 a spinning disc', unit: '0..1', min: 0, max: 1 },
    },
    length: 7.0,
    height: 2.8,
    footprint: [7.2, 6.5],
    anchors: {
      seat: { at: [0, 1.55, 1.0] },
      nose: { at: [0, 1.22, nose + 0.2] },
      tail: { at: [0, 1.6, -3.7] },
      wingtip: { at: [3.6, 1.15, 0.55] },
    },
  }
  return {
    kind: spec.kind ?? 'airplane',
    family: 'aircraft',
    summary: spec.summary ?? 'A propeller plane: takes off from a run, flies banked, loops the loop, and lands with a flare and a squash.',
    rig,
    actions: airplaneActions(),
    acting: AIRCRAFT_ACTING,
    colors: { body: colors.body, ink: '#26262b' },
    moves: { fly: { speed: 30, flies: true, hold: { blur: 1 }, perSecond: { rotor: FLYING_SPIN * 1000 } } },
  }
}

/** Propeller speed flying: degrees per ms. */
const PROP_SPIN = 3.2

function airplaneActions(): Record<string, PropAction> {
  const spin = (context: PropActionContext, from: number, to: number, easing?: 'ease-in' | 'ease-out') => {
    const start = context.values.rotor ?? 0
    context.set('rotor', from, start)
    context.set('rotor', to, start + PROP_SPIN * (to - from) * (easing ? 0.5 : 1), easing)
  }
  const face = (context: PropActionContext, start: number, toX: number) => {
    const direction = Math.sign(toX - context.x) as 1 | -1 | 0
    return direction !== 0 && context.facing() !== direction ? context.turnTo(start, direction > 0 ? 'right' : 'left') : start
  }
  return {
    takeOff: {
      summary: 'Spins the propeller up, runs along the ground toward `to`, lifts its nose and climbs to `height` metres (default 4).',
      needs: ['to'],
      uses: ['height', 'for'],
      run(context, beat, start) {
        const e = context.exaggeration
        const t = face(context, start, beat.to!)
        spin(context, t, t + 700, 'ease-in')
        context.key(t + 700, { blur: 1 }, { act: false, easing: 'ease-in' })
        const run = beat.for ?? 2600
        const from = context.x
        const liftAt = t + 700 + run * 0.55
        const liftX = from + (beat.to! - from) * 0.45
        context.move(t + 700, liftAt, liftX, { easing: 'ease-in' })
        context.key(liftAt, { pitch: 8 * e, squash: 1 + 0.04 * e }, { act: false, easing: 'ease-out' })
        context.key(t + 700 + run, { lift: beat.height ?? 4, pitch: 10 * e, squash: 1 }, { act: false, easing: 'ease-in-out' })
        context.move(liftAt, t + 700 + run, beat.to!)
        context.key(t + 700 + run + 500, { pitch: 0 })
        spin(context, t + 700, t + 700 + run + 500)
        context.effect({ kind: 'dust', time: liftAt, x: liftX, y: context.floor, length: 700 })
        return { end: t + 700 + run + 500, contact: liftAt }
      },
    },
    fly: {
      summary: 'Flies to `to` (and `height`), banking into the move and leveling out.',
      needs: ['to'],
      uses: ['height', 'speed', 'for'],
      run(context, beat, start) {
        const e = context.exaggeration
        const t = face(context, start, beat.to!)
        const travel = beat.for ?? Math.max(800, Math.abs(beat.to! - context.x) / (beat.speed ?? 0.45))
        const lift = beat.height ?? context.values.lift
        context.key(t + 350, { roll: 10 * e, pitch: lift > context.values.lift ? 6 * e : -3 * e }, { act: false, easing: 'ease-out' })
        context.key(t + travel - 300, { roll: 4 * e, lift }, { act: false })
        context.key(t + travel, { roll: 0, pitch: 0 })
        context.move(t, t + travel, beat.to!, { easing: 'ease-in-out' })
        spin(context, start, t + travel)
        return { end: t + travel, contact: t, release: t + travel }
      },
    },
    loop: {
      summary: 'Loops the loop: pulls up and over in a full circle (`for` ms, default 2400), carrying on the way it was going.',
      uses: ['for'],
      run(context, beat, start) {
        const length = beat.for ?? 2400
        const radius = 2.2 * context.exaggeration
        const facing = context.facing() || 1
        const steps = 16
        const x0 = context.x
        const lift0 = context.values.lift
        const pitch0 = context.values.pitch
        for (let i = 1; i <= steps; i++) {
          const a = (Math.PI * 2 * i) / steps
          const t = start + (length * i) / steps
          // Round a circle in the air: forward with the sine, up with the cosine, nose following round.
          context.key(t, { lift: lift0 + radius * (1 - Math.cos(a)), pitch: pitch0 + (360 * i) / steps }, { act: false })
          context.move(start + (length * (i - 1)) / steps, t, x0 + facing * (radius * Math.sin(a) + (i / steps) * radius * 1.2) * context.scale)
        }
        // Done: the nose has come round to where it was (360° on, which draws the same).
        context.key(start + length + 1, { pitch: pitch0 }, { act: false })
        spin(context, start, start + length)
        return { end: start + length + 1 }
      },
    },
    land: {
      summary: 'Comes down toward `to`: descends, flares nose-up, touches down with a squash and dust, rolls to a stop and the propeller spools down.',
      needs: ['to'],
      uses: ['for'],
      run(context, beat, start) {
        const e = context.exaggeration
        const t = face(context, start, beat.to!)
        const from = context.x
        const descent = beat.for ?? 2200
        const touch = t + descent
        const touchX = from + (beat.to! - from) * 0.7
        context.key(t + descent * 0.4, { pitch: -4 * e }, { act: false, easing: 'ease-out' })
        context.key(touch - 250, { pitch: 6 * e, lift: 0.15 }, { act: false, easing: 'ease-in-out' })
        context.key(touch, { lift: 0, pitch: 0, squash: 1 - 0.12 * e }, { act: false, easing: 'ease-in' })
        context.key(touch + 260, { squash: 1 })
        context.move(t, touch, touchX)
        context.move(touch, touch + 1200, beat.to!, { easing: 'ease-out' })
        spin(context, start, touch)
        spin(context, touch, touch + 1600, 'ease-out')
        context.key(touch + 1600, { blur: 0 }, { act: false, easing: 'ease-out' })
        context.effect({ kind: 'dust', time: touch, x: touchX, y: context.floor, length: 700 })
        return { end: touch + 1600, contact: touch }
      },
    },
  }
}
