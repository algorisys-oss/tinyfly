import type { EasingType } from '../../../engine/types'
import type { Vec3 } from '../../../engine/math'
import type { ActingRig } from '../../acting/acting'
import type { PropPart, PropRig, ControlSpec, ControlBinding, PropAnchor } from '../rig'
import type { PropAction, PropActionContext } from '../script'
import type { Prop } from '../target'
import { shade } from '../draw'

/**
 * Wheeled vehicles: a body from a side profile, an optional cabin of glass,
 * wheels that turn by exactly the distance driven (no skating), doors on
 * hinges, lights and an antenna that trails the motion. `car()` is a preset;
 * trucks, buses, tractors and carts are the same family with other settings.
 *
 * Its actions: `drive` (a rock back, a lunge, a nose-dive stop that settles),
 * `brake` (a skid with the wheels locked), `bump`, `honk`, `door`, `lights`,
 * plus `turn` and `hold`, which every prop has.
 */

export interface VehicleSpec {
  kind?: string
  summary?: string
  /** Body side profile: (forward, up) points round its outline, metres (its middle is forward 0); none for a bike, which is all frame */
  body?: Array<[number, number]>
  /** Body width, metres */
  width: number
  /** Frame tubes (a bike's, a cart's shafts): points in prop space, and a radius */
  frame?: Array<{ points: Vec3[]; radius?: number; color?: string }>
  /** Windows along both sides: forward range and height range */
  windows?: Array<{ from: number; to: number; low: number; high: number }>
  /** Anything else, as parts (a cargo box, a seat, a lamp) */
  extras?: PropPart[]
  /** A cabin of glass on top: its side profile, and its width (default 85% of the body's) */
  cabin?: { profile: Array<[number, number]>; width?: number; pillars?: number[] }
  /**
   * Wheels: forward position, how far each side of the middle (both sides get
   * one; `side: 0` puts one wheel on the middle line, as on a bike), radius and
   * thickness. `style`: `hub` a hubcap with spokes (default), `spoked` thin
   * wire or wooden spokes and no hub (bikes, carts).
   */
  wheels: Array<{ forward: number; side: number; radius: number; thickness?: number; style?: 'hub' | 'spoked' }>
  /** Its usual driving speed in a 3D scene, metres per second (default 6) */
  speed?: number
  /** Doors on each side: forward range and height range, metres; hinged at the front */
  door?: { from: number; to: number; low: number; high: number }
  /** Headlights and tail lights: across positions, height range, and the front and back faces' forward position */
  lights?: { across: number; low: number; high: number; front: number; back: number; size?: number }
  /** A whip antenna on the roof, trailing the motion: where it stands (across, up, forward) */
  antenna?: Vec3
  /** Where a driver sits (across, seat height, forward) */
  seat?: Vec3
  /** More anchors (a cart's shaft tips, where it hitches to a horse) */
  anchors?: Record<string, PropAnchor>
  colors?: { body?: string; trim?: string; glass?: string; tyre?: string; hub?: string; light?: string; tail?: string; inside?: string; seat?: string }
}

const COLORS = { body: '#e8574a', trim: '#3b3b44', glass: '#bfe3f2', tyre: '#2c2c33', hub: '#c9ccd3', light: '#fff4b8', tail: '#ff5a4f', inside: '#3b3640', seat: '#6d5d55' }

/** A wheeled vehicle from a spec: the family's rig, actions and acting. */
export function vehicle(spec: VehicleSpec): Prop {
  const colors = { ...COLORS, ...spec.colors }
  const parts: PropPart[] = []
  const { forwardMost, backMost, top } = extentOf(spec)

  if (spec.body) parts.push({ id: 'body', shape: { type: 'extrude', profile: spec.body, width: spec.width }, fill: colors.body })
  for (const [i, tube] of (spec.frame ?? []).entries()) {
    parts.push({ id: `frame-${i}`, shape: { type: 'tube', points: tube.points, radius: tube.radius ?? 0.035, segments: 6 }, fill: tube.color ?? colors.body, outline: 0.7 })
  }
  for (const [i, w] of (spec.windows ?? []).entries()) {
    for (const side of [1, -1]) {
      parts.push({
        id: `window-${i}-${side > 0 ? 'left' : 'right'}`,
        shape: { type: 'panel', points: [[w.from, w.low], [w.to, w.low], [w.to, w.high], [w.from, w.high]], facing: side > 0 ? 'left' : 'right' },
        at: [side * (spec.width / 2 + 0.01), 0, 0],
        fill: colors.glass,
        outline: 0.7,
        seeThrough: true,
        glow: spec.lights ? { control: 'lights', color: '#ffe9a3' } : undefined,
      })
    }
  }
  for (const extra of spec.extras ?? []) parts.push(extra)
  if (spec.cabin) {
    const cabinWidth = spec.cabin.width ?? spec.width * 0.85
    // Glass: a rider shows through it.
    parts.push({ id: 'cabin', shape: { type: 'extrude', profile: spec.cabin.profile, width: cabinWidth }, fill: colors.glass, outline: 0.9, seeThrough: true, layer: 1 })
    const low = Math.min(...spec.cabin.profile.map(([, v]) => v))
    const high = Math.max(...spec.cabin.profile.map(([, v]) => v))
    for (const [i, forward] of (spec.cabin.pillars ?? []).entries()) {
      parts.push({ id: `pillar-${i}`, shape: { type: 'box', size: [cabinWidth + 0.02, high - low, 0.1] }, at: [0, (low + high) / 2, forward], fill: colors.body, outline: 0.8, layer: 1 })
    }
  }
  // Wheels of different sizes turn at different rates: `wheelSpin` is the turn of a wheel of the reference
  // radius (the first wheel's), and each wheel turns by that × reference ÷ its own radius, so none skates.
  const reference = spec.wheels[0]?.radius ?? 0.4
  const wheelBindings: ControlBinding[] = []
  spec.wheels.forEach((wheel, i) => {
    const sides = wheel.side === 0 ? [0] : [1, -1]
    const thickness = wheel.thickness ?? (wheel.style === 'spoked' ? 0.05 : 0.26)
    for (const side of sides) {
      const id = `wheel-${i}-${side > 0 ? 'left' : side < 0 ? 'right' : 'middle'}`
      wheelBindings.push({ parts: [id], rotate: { axis: 'x', degrees: reference / wheel.radius } })
      parts.push({
        id,
        shape: { type: 'cylinder', radius: wheel.radius, length: thickness, axis: 'x', segments: 20, spokes: wheel.style === 'spoked' ? 8 : 0 },
        at: [side * wheel.side, wheel.radius, wheel.forward],
        fill: wheel.style === 'spoked' ? undefined : colors.tyre,
        ink: wheel.style === 'spoked' ? colors.tyre : undefined,
        outline: wheel.style === 'spoked' ? 1.3 : 1,
      })
      if (wheel.style === 'spoked') continue
      // A hubcap on the outside (both sides of a wheel on the middle line), with spokes that show it turning;
      // it turns with its wheel, its parent.
      for (const face of side === 0 ? [1, -1] : [side]) {
        parts.push({
          id: `${id}-hub${side === 0 ? (face > 0 ? '-left' : '-right') : ''}`,
          parent: id,
          shape: { type: 'cylinder', radius: wheel.radius * 0.55, length: 0.02, axis: 'x', segments: 14, spokes: 5 },
          at: [face * (thickness / 2 + 0.012), 0, 0],
          fill: colors.hub,
          outline: 0.6,
        })
      }
    }
  })
  const controls: Record<string, ControlSpec> = {
    wheelSpin: {
      description: 'How far the wheels have turned (keyed exactly with the distance driven, so they never skate)',
      unit: 'degrees',
      bind: wheelBindings,
    },
  }
  if (spec.door) {
    const { from, to, low, high } = spec.door
    const outline: Array<[number, number]> = [[from, low], [to, low], [to, high], [from, high]]
    for (const side of [1, -1]) {
      const name = side > 0 ? 'left' : 'right'
      // The doorway: the dark inside of the car with a seat back, seen when the door swings open.
      // A rider shows through it (climbing in), and the door, drawn over a rider, covers it when shut.
      parts.push({
        id: `doorway-${name}`,
        shape: { type: 'panel', points: outline, facing: side > 0 ? 'left' : 'right' },
        at: [side * (spec.width / 2 + 0.004), 0, 0],
        fill: colors.inside,
        outline: 0.5,
        seeThrough: true,
      })
      const seatFrom = from + (to - from) * 0.15
      const seatTo = from + (to - from) * 0.55
      parts.push({
        id: `seat-back-${name}`,
        shape: { type: 'panel', points: [[seatFrom, low + 0.05], [seatTo, low + 0.05], [seatTo - 0.08, high - 0.06], [seatFrom + 0.06, high - 0.04]], facing: side > 0 ? 'left' : 'right' },
        at: [side * (spec.width / 2 + 0.006), 0, 0],
        fill: colors.seat,
        outline: 0.4,
      })
      parts.push({
        id: `door-${name}`,
        shape: { type: 'panel', points: outline.map(([u, v]) => [u - to, v]), facing: side > 0 ? 'left' : 'right' },
        // The panel's origin is at its hinge (its front edge), just outside the body.
        at: [side * (spec.width / 2 + 0.01), 0, to],
        fill: colors.body,
        outline: 0.7,
        overRider: true,
      })
    }
    controls.door = {
      description: 'Doors open: 0 shut, 1 open (hinged at the front)',
      unit: '0..1',
      min: 0,
      max: 1,
      bind: [
        // Each swings outward: its back edge (behind the hinge, −z) moves away from the middle.
        { parts: ['door-left'], rotate: { axis: 'y', degrees: -70 } },
        { parts: ['door-right'], rotate: { axis: 'y', degrees: 70 } },
      ],
    }
  }
  if (spec.lights) {
    const { across, low, high, front, back } = spec.lights
    const half = (spec.lights.size ?? 0.32) / 2
    const lamp: Array<[number, number]> = [[-half, low], [half, low], [half, high], [-half, high]]
    for (const side of [1, -1]) {
      parts.push({ id: `headlight-${side}`, shape: { type: 'panel', points: lamp, facing: 'front' }, at: [side * across, 0, front], fill: colors.light, outline: 0.6, glow: { control: 'lights', color: '#ffffff' } })
      parts.push({ id: `taillight-${side}`, shape: { type: 'panel', points: lamp, facing: 'back' }, at: [side * across, 0, back], fill: shade(colors.tail, 0.62), outline: 0.6, glow: { control: 'lights', color: colors.tail } })
    }
    controls.lights = { description: 'Lights on: 0 off, 1 on', unit: '0..1', min: 0, max: 1 }
  }
  if (spec.antenna) {
    parts.push({ id: 'antenna', shape: { type: 'tube', points: [[0, 0, 0], [0, 0.75, 0]], radius: 0.018, segments: 5 }, at: spec.antenna, fill: colors.trim, outline: 0.6 })
    parts.push({ id: 'antenna-tip', parent: 'antenna', shape: { type: 'ellipsoid', radii: [0.05, 0.05, 0.05], segments: 8 }, at: [0, 0.77, 0], fill: colors.tail, outline: 0.6 })
    controls.antenna = {
      description: 'Antenna bend (follow-through: it trails the motion on a spring)',
      unit: 'degrees',
      bind: [{ parts: ['antenna'], rotate: { axis: 'x', degrees: 1 } }],
    }
  }

  const rig: PropRig = {
    parts,
    controls,
    length: forwardMost - backMost,
    height: top,
    footprint: [spec.width, forwardMost - backMost],
    anchors: {
      ...(spec.seat ? { seat: { at: spec.seat } } : {}),
      front: { at: [0, top * 0.45, forwardMost] },
      back: { at: [0, top * 0.45, backMost] },
      roof: { at: [0, top, 0] },
      // The door on its right side: the side seen when it faces screen-right.
      ...(spec.door ? { door: { at: [-spec.width / 2, (spec.door.low + spec.door.high) / 2, (spec.door.from + spec.door.to) / 2] } } : {}),
      ...spec.anchors,
    },
  }
  return {
    kind: spec.kind ?? 'vehicle',
    family: 'vehicle',
    summary: spec.summary ?? 'A wheeled vehicle',
    rig,
    actions: vehicleActions(spec),
    acting: VEHICLE_ACTING,
    colors: { body: colors.body, ink: '#26262b' },
    follow: spec.antenna ? [{ control: 'antenna', of: 'x', per: 0.9, stiffness: 140, damping: 7, limit: 35 }] : undefined,
    wheelRadius: reference,
    // In world metres: its wheels turn 180/π degrees per wheel radius covered.
    ...(spec.wheels.length > 0 ? { moves: { drive: { speed: spec.speed ?? 6, perMetre: { wheelSpin: 180 / (Math.PI * reference) } } } } : {}),
  }
}

/** How far it reaches front and back, and how tall it is, from its body, frame, cabin and wheels. */
function extentOf(spec: VehicleSpec): { forwardMost: number; backMost: number; top: number } {
  const forwards = [
    ...(spec.body ?? []).map(([u]) => u),
    ...(spec.frame ?? []).flatMap((t) => t.points.map((p) => p[2])),
    ...spec.wheels.flatMap((w) => [w.forward + w.radius, w.forward - w.radius]),
  ]
  const ups = [
    ...(spec.body ?? []).map(([, v]) => v),
    ...(spec.cabin?.profile ?? []).map(([, v]) => v),
    ...(spec.frame ?? []).flatMap((t) => t.points.map((p) => p[1])),
    ...spec.wheels.map((w) => w.radius * 2),
  ]
  return { forwardMost: Math.max(...forwards), backMost: Math.min(...forwards), top: Math.max(...ups) }
}

/** How a vehicle's controls act: the turn and lift lead, the body's pitch and squash follow, doors and antenna trail. */
export const VEHICLE_ACTING: ActingRig = {
  depth: { turn: 0, lift: 0, lights: 0, pitch: 1, roll: 1, squash: 1, lean: 1, door: 2 },
  limits: { turn: 0.08, pitch: 5, roll: 4, lean: 0.1, squash: 0.06, door: 0.12, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: [],
}

/** Turn a vehicle's wheels in step with a move: they roll exactly the distance it covers. */
function roll(context: PropActionContext, start: number, end: number, toX: number, easing: EasingType, radius: number, locked = false): void {
  const facing = context.facing() || Math.sign(toX - context.x) || 1
  const spin = context.values.wheelSpin ?? 0
  const metres = ((toX - context.x) * facing) / context.scale
  context.set('wheelSpin', start, spin)
  context.move(start, end, toX, { easing })
  context.set('wheelSpin', end, locked ? spin : spin + (metres / radius) * (180 / Math.PI), easing)
}

/** Default speed, px per ms. */
const SPEED = 0.4

function vehicleActions(spec: VehicleSpec): Record<string, PropAction> {
  const radius = spec.wheels[0]?.radius ?? 0.4
  const { forwardMost, backMost } = extentOf(spec)
  const halfLength = (forwardMost - backMost) / 2

  /** Face the way it will go, rock back and squat (the wind-up), then lunge; returns the launch time. */
  const windUp = (context: PropActionContext, start: number, direction: 1 | -1): number => {
    const e = context.exaggeration
    let t = start
    if (context.facing() !== direction) t = context.turnTo(t, direction > 0 ? 'right' : 'left')
    context.key(t + 200, { pitch: 4 * e, squash: 1 - 0.07 * e, lean: -0.1 * e }, { act: false, easing: 'ease-out' })
    roll(context, t, t + 200, context.x - direction * 0.15 * e * context.scale, 'ease-out', radius)
    context.effect({ kind: 'exhaust', time: t + 150, x: context.x - direction * halfLength * context.scale, y: context.floor - 0.3 * context.scale, length: 900, direction: (-direction) as 1 | -1 })
    return t + 260
  }

  /** The stop: the nose dives and the body sways forward, then settles (the acting pass overshoots it back). */
  const stop = (context: PropActionContext, at: number, hard: boolean) => {
    const e = context.exaggeration * (hard ? 1.8 : 1)
    context.key(at, { pitch: -5 * e, lean: -0.08 * e, squash: 0.95 }, { act: false, easing: 'ease-out' })
    context.key(at + 380, { pitch: 0, lean: 0, squash: 1 })
  }

  return {
    drive: {
      summary: 'Drives to `to`: rocks back and squats, lunges forward stretched, and stops with a nose-dive that settles; wheels roll exactly the distance.',
      needs: ['to'],
      uses: ['speed', 'for'],
      run(context, beat, start) {
        const direction = Math.sign(beat.to! - context.x) as 1 | -1 | 0
        if (direction === 0) return { end: start }
        const launch = windUp(context, start, direction)
        const e = context.exaggeration
        const distance = Math.abs(beat.to! - context.x)
        const travel = beat.for ?? Math.max(500, distance / (beat.speed ?? SPEED))
        context.effect({ kind: 'dust', time: launch, x: context.x - direction * halfLength * context.scale, y: context.floor, length: 600, direction: (-direction) as 1 | -1 })
        context.key(launch + 140, { pitch: -1.5 * e, squash: 1 + 0.05 * e, lean: 0.12 * e }, { act: false, easing: 'ease-out' })
        context.key(launch + Math.max(160, travel - 160), { pitch: 0, lean: 0.08 * e, squash: 1.02 }, { act: false })
        roll(context, launch, launch + travel, beat.to!, 'ease-in-out', radius)
        stop(context, launch + travel, false)
        return { end: launch + travel + 380, contact: launch, release: launch + travel }
      },
    },
    brake: {
      summary: 'Drives toward `to` and slams on the brakes: the wheels lock and it skids the last stretch, nose diving, leaving skid marks.',
      needs: ['to'],
      uses: ['speed', 'for'],
      run(context, beat, start) {
        const direction = Math.sign(beat.to! - context.x) as 1 | -1 | 0
        if (direction === 0) return { end: start }
        const launch = windUp(context, start, direction)
        const e = context.exaggeration
        const from = context.x
        const distance = Math.abs(beat.to! - from)
        const travel = beat.for ?? Math.max(600, distance / (beat.speed ?? SPEED * 1.2))
        const skidAt = launch + travel * 0.55
        const skidX = from + (beat.to! - from) * 0.65
        context.key(launch + 140, { pitch: -1.5 * e, squash: 1 + 0.06 * e, lean: 0.14 * e }, { act: false, easing: 'ease-out' })
        roll(context, launch, skidAt, skidX, 'ease-in', radius)
        // Locked wheels: it slides, nose down.
        context.key(skidAt + 80, { pitch: -7 * e, lean: -0.12 * e, squash: 0.94 }, { act: false, easing: 'ease-out' })
        roll(context, skidAt, launch + travel, beat.to!, 'ease-out', radius, true)
        context.effect({ kind: 'skid', time: skidAt, x: skidX, toX: beat.to!, y: context.floor, length: travel * 0.45 + 1500 })
        context.effect({ kind: 'dust', time: launch + travel, x: beat.to! + direction * halfLength * context.scale, y: context.floor, length: 600, direction })
        stop(context, launch + travel, true)
        return { end: launch + travel + 380, contact: skidAt, release: launch + travel }
      },
    },
    bump: {
      summary: 'Hits a bump: squashes, hops up stretched, lands squashed with dust, and springs back.',
      uses: ['for'],
      run(context, _beat, start) {
        const e = context.exaggeration
        context.key(start + 90, { squash: 1 - 0.16 * e, pitch: 3 * e }, { act: false, easing: 'ease-out' })
        context.key(start + 300, { lift: 0.35 * e, squash: 1 + 0.12 * e, pitch: -3 * e }, { act: false, easing: 'ease-out' })
        context.key(start + 540, { lift: 0, squash: 1 - 0.2 * e, pitch: 0 }, { act: false, easing: 'ease-in' })
        context.key(start + 820, { squash: 1 })
        context.effect({ kind: 'dust', time: start + 540, x: context.x, y: context.floor, length: 500 })
        return { end: start + 820, contact: start + 540 }
      },
    },
    honk: {
      summary: 'Honks: a stretch and squash pulse, with honk lines from the front.',
      run(context, _beat, start) {
        const e = context.exaggeration
        context.key(start + 110, { squash: 1 + 0.12 * e, lean: 0.04 * e }, { act: false, easing: 'ease-out' })
        context.key(start + 240, { squash: 1 - 0.06 * e, lean: 0 }, { act: false })
        context.key(start + 520, { squash: 1 })
        const facing = context.facing()
        context.effect({ kind: 'honk', time: start + 60, x: context.x + (facing || 1) * halfLength * context.scale, y: context.floor - 0.7 * context.scale, length: 700, direction: (facing || 1) as 1 | -1 })
        return { end: start + 520, contact: start + 60 }
      },
    },
    ...(spec.door
      ? {
          door: {
            summary: 'Opens the doors (`open: true`) or shuts them (`open: false`).',
            needs: ['open'],
            run(context: PropActionContext, beat: { open?: boolean }, start: number) {
              context.key(start + 450, { door: beat.open ? 1 : 0 })
              return { end: start + 600, contact: start + 450 }
            },
          } satisfies PropAction,
        }
      : {}),
    ...(spec.lights
      ? {
          lights: {
            summary: 'Switches the lights on (`on: true`) or off.',
            needs: ['on'],
            run(context: PropActionContext, beat: { on?: boolean }, start: number) {
              context.key(start + 120, { lights: beat.on ? 1 : 0 }, { act: false })
              return { end: start + 300, contact: start + 120 }
            },
          } satisfies PropAction,
        }
      : {}),
  }
}

/** A cartoon car: a rounded red body, a glass cabin, four wheels, doors, lights, a whip antenna and a driver's seat. */
export function car(options: { colors?: VehicleSpec['colors']; antenna?: boolean } = {}): Prop {
  return vehicle({
    kind: 'car',
    summary: 'A cartoon car: drives, brakes, bumps, honks, opens its doors, lights up, and turns toward the camera.',
    body: [[-2.0, 0.32], [2.0, 0.32], [2.08, 0.52], [1.98, 0.82], [1.05, 0.95], [-1.72, 0.98], [-2.02, 0.86], [-2.08, 0.5]],
    width: 1.8,
    cabin: { profile: [[-1.5, 0.94], [0.92, 0.94], [0.3, 1.52], [-1.22, 1.54]], width: 1.56, pillars: [-0.42] },
    wheels: [
      { forward: 1.28, side: 0.8, radius: 0.4 },
      { forward: -1.28, side: 0.8, radius: 0.4 },
    ],
    door: { from: -0.4, to: 0.88, low: 0.36, high: 0.92 },
    lights: { across: 0.58, low: 0.55, high: 0.72, front: 2.05, back: -2.06 },
    antenna: options.antenna === false ? undefined : [0.5, 1.5, -1.05],
    seat: [0, 0.3, -0.15],
    colors: options.colors,
  })
}

/** A box truck: a cab with a glass windscreen, a cargo box, and two rear axles. */
export function truck(options: { colors?: VehicleSpec['colors']; cargo?: string } = {}): Prop {
  return vehicle({
    kind: 'truck',
    summary: 'A box truck: drives, brakes, bumps, honks, opens its cab doors, lights up, turns toward the camera.',
    body: [[-3.2, 0.5], [3.1, 0.5], [3.15, 0.95], [3.0, 1.85], [2.3, 2.25], [1.2, 2.25], [1.2, 1.0], [-3.2, 1.0]],
    width: 2.0,
    cabin: { profile: [[1.6, 1.35], [2.95, 1.35], [2.85, 1.85], [2.3, 2.15], [1.6, 2.15]], width: 2.04 },
    extras: [{ id: 'cargo', shape: { type: 'box', size: [2.1, 1.75, 4.2] }, at: [0, 1.9, -1.05], fill: options.cargo ?? '#f1f1ee' }],
    wheels: [
      { forward: 2.2, side: 0.85, radius: 0.48, thickness: 0.32 },
      { forward: -1.4, side: 0.85, radius: 0.48, thickness: 0.32 },
      { forward: -2.45, side: 0.85, radius: 0.48, thickness: 0.32 },
    ],
    door: { from: 1.4, to: 2.25, low: 0.6, high: 1.9 },
    lights: { across: 0.7, low: 0.62, high: 0.82, front: 3.13, back: -3.22, size: 0.28 },
    seat: [0, 1.15, 1.9],
    colors: { body: '#2f6fb7', ...options.colors },
  })
}

/** A bus: a long box with a row of windows down each side and a front door. */
export function bus(options: { colors?: VehicleSpec['colors'] } = {}): Prop {
  return vehicle({
    kind: 'bus',
    summary: 'A bus: drives, brakes, bumps, honks, opens its front doors, lights its windows, turns toward the camera.',
    body: [[-4.5, 0.45], [4.5, 0.45], [4.6, 0.9], [4.55, 2.9], [4.3, 3.0], [-4.4, 3.0], [-4.55, 2.75], [-4.55, 0.6]],
    width: 2.4,
    windows: Array.from({ length: 6 }, (_, i) => ({ from: -4.0 + i * 1.18, to: -4.0 + i * 1.18 + 1.0, low: 1.55, high: 2.6 })),
    extras: [{ id: 'windscreen', shape: { type: 'panel', points: [[-1.05, 1.35], [1.05, 1.35], [1.05, 2.75], [-1.05, 2.75]], facing: 'front' }, at: [0, 0, 4.58], fill: '#bfe3f2', outline: 0.8, seeThrough: true }],
    wheels: [
      { forward: 3.0, side: 1.0, radius: 0.5, thickness: 0.34 },
      { forward: -2.8, side: 1.0, radius: 0.5, thickness: 0.34 },
    ],
    door: { from: 3.2, to: 4.2, low: 0.5, high: 2.6 },
    lights: { across: 0.85, low: 0.65, high: 0.85, front: 4.6, back: -4.56, size: 0.3 },
    seat: [0, 1.2, 3.6],
    colors: { body: '#f2c230', ...options.colors },
  })
}

/** A tractor: big rear wheels, small front ones, a narrow hood, a glass cab and an exhaust stack. */
export function tractor(options: { colors?: VehicleSpec['colors'] } = {}): Prop {
  return vehicle({
    kind: 'tractor',
    summary: 'A tractor: big rear wheels and small front ones turning at their own rates; drives, brakes, bumps, honks.',
    body: [[-0.5, 0.75], [2.0, 0.75], [2.12, 1.25], [1.9, 1.52], [-0.5, 1.52]],
    width: 1.0,
    cabin: { profile: [[-1.35, 1.0], [-0.25, 1.0], [-0.25, 2.55], [-1.35, 2.55]], width: 1.35 },
    extras: [
      { id: 'roof', shape: { type: 'box', size: [1.55, 0.1, 1.35] }, at: [0, 2.62, -0.8], fill: '#3f9b47' },
      { id: 'exhaust', shape: { type: 'tube', points: [[0.28, 1.5, 1.25], [0.28, 2.35, 1.25]], radius: 0.06, segments: 6 }, fill: '#3b3b44', outline: 0.7 },
    ],
    wheels: [
      { forward: -0.85, side: 0.85, radius: 0.78, thickness: 0.45 },
      { forward: 1.55, side: 0.7, radius: 0.42, thickness: 0.26 },
    ],
    lights: { across: 0.3, low: 1.0, high: 1.18, front: 2.1, back: -0.52, size: 0.2 },
    seat: [0, 1.25, -0.8],
    colors: { body: '#3f9b47', hub: '#e9c64a', ...options.colors },
  })
}

/** A wooden cart: a plank bed on one axle of big spoked wheels, with shafts for a horse (or a figure) to pull. */
export function cart(options: { colors?: VehicleSpec['colors'] } = {}): Prop {
  const wood = options.colors?.body ?? '#a8743f'
  return vehicle({
    kind: 'cart',
    summary: 'A wooden cart on spoked wheels with shafts: rolls when pulled (drive), bumps, tips.',
    body: [[-1.25, 0.78], [1.25, 0.78], [1.35, 1.18], [-1.35, 1.18]],
    width: 1.4,
    frame: [
      { points: [[0.5, 0.9, 1.0], [0.5, 0.95, 2.7]], radius: 0.05, color: wood },
      { points: [[-0.5, 0.9, 1.0], [-0.5, 0.95, 2.7]], radius: 0.05, color: wood },
    ],
    wheels: [{ forward: 0, side: 0.82, radius: 0.66, style: 'spoked' }],
    seat: [0, 1.2, 0],
    anchors: { shafts: { at: [0, 0.95, 2.7] } },
    colors: { body: wood, tyre: '#5a3a1f', ...options.colors },
  })
}

/** A railway carriage: a long body with a rounded roof, windows down the sides and bogie wheels. */
export function trainCar(options: { colors?: VehicleSpec['colors'] } = {}): Prop {
  return vehicle({
    kind: 'train carriage',
    summary: 'A railway carriage: rolls along (drive), brakes, lights its windows, turns toward the camera.',
    body: [[-4.0, 0.72], [4.0, 0.72], [4.0, 2.8], [3.6, 3.12], [-3.6, 3.12], [-4.0, 2.8]],
    width: 2.6,
    windows: Array.from({ length: 5 }, (_, i) => ({ from: -3.3 + i * 1.4, to: -3.3 + i * 1.4 + 1.0, low: 1.7, high: 2.5 })),
    wheels: [
      { forward: 3.0, side: 1.0, radius: 0.36, thickness: 0.16 },
      { forward: 2.2, side: 1.0, radius: 0.36, thickness: 0.16 },
      { forward: -2.2, side: 1.0, radius: 0.36, thickness: 0.16 },
      { forward: -3.0, side: 1.0, radius: 0.36, thickness: 0.16 },
    ],
    lights: { across: 0.9, low: 1.0, high: 1.2, front: 4.01, back: -4.01, size: 0.22 },
    seat: [0, 1.0, 1.5],
    colors: { body: '#2f7d6d', ...options.colors },
  })
}

/** A bicycle: a wire-spoked pair of wheels on a diamond frame, a saddle and handlebars. */
export function bike(options: { colors?: VehicleSpec['colors'] } = {}): Prop {
  const frame = options.colors?.body ?? '#e0473b'
  const bb: Vec3 = [0, 0.32, -0.05]
  const seat: Vec3 = [0, 0.86, -0.22]
  const head: Vec3 = [0, 0.9, 0.42]
  const front: Vec3 = [0, 0.34, 0.56]
  const rear: Vec3 = [0, 0.34, -0.56]
  return vehicle({
    kind: 'bike',
    summary: 'A bicycle: rides (drive) with its wire wheels turning, brakes, bumps, rings its bell (honk).',
    width: 0.5,
    frame: [
      { points: [rear, bb] }, { points: [bb, seat] }, { points: [seat, rear] }, { points: [seat, head] }, { points: [bb, head] }, { points: [head, front] },
      { points: [[0.24, 0.98, 0.44], [-0.24, 0.98, 0.44]], radius: 0.025, color: '#3b3b44' },
      { points: [head, [0, 0.98, 0.44]], radius: 0.025, color: '#3b3b44' },
    ],
    extras: [{ id: 'saddle', shape: { type: 'ellipsoid', radii: [0.08, 0.035, 0.15], segments: 10 }, at: [0, 0.89, -0.22], fill: '#3b3b44', outline: 0.7 }],
    wheels: [
      { forward: 0.56, side: 0, radius: 0.34, style: 'spoked' },
      { forward: -0.56, side: 0, radius: 0.34, style: 'spoked' },
    ],
    seat: [0, 0.9, -0.22],
    colors: { body: frame, tyre: '#2c2c33', ...options.colors },
  })
}

/** A motorbike: a tank and saddle, an engine block, forks, handlebars and a headlight. */
export function motorbike(options: { colors?: VehicleSpec['colors'] } = {}): Prop {
  return vehicle({
    kind: 'motorbike',
    summary: 'A motorbike: rides (drive) with a lunge, brakes into a skid, bumps, honks, lights up.',
    body: [[-0.62, 0.62], [0.42, 0.62], [0.55, 0.95], [0.3, 1.02], [-0.1, 0.92], [-0.8, 0.88], [-0.86, 0.72]],
    width: 0.4,
    frame: [
      { points: [[0, 0.33, 0.78], [0, 1.05, 0.5]], radius: 0.04, color: '#8c8f98' },
      { points: [[0.3, 1.08, 0.48], [-0.3, 1.08, 0.48]], radius: 0.025, color: '#3b3b44' },
      { points: [[0.12, 0.42, -0.2], [0.12, 0.5, -0.95]], radius: 0.04, color: '#8c8f98' },
    ],
    extras: [{ id: 'engine', shape: { type: 'box', size: [0.38, 0.34, 0.5] }, at: [0, 0.45, 0.05], fill: '#5b5f6a', outline: 0.8 }],
    wheels: [
      { forward: 0.78, side: 0, radius: 0.33, thickness: 0.14 },
      { forward: -0.72, side: 0, radius: 0.33, thickness: 0.14 },
    ],
    lights: { across: 0, low: 0.9, high: 1.04, front: 0.62, back: -0.87, size: 0.14 },
    seat: [0, 0.92, -0.3],
    colors: { body: '#1f1f26', hub: '#c9ccd3', ...options.colors },
  })
}
