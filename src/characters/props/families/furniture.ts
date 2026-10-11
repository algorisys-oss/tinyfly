import type { ActingRig } from '../../acting/acting'
import type { PropPart, PropRig } from '../rig'
import type { PropAction, PropActionContext } from '../script'
import type { Prop } from '../target'
import type { EasingType } from '../../../engine/types'

/**
 * Furniture: a chair, a desk, a bed, a door and a wheelchair, with the places
 * a figure uses them at as anchors (`seat`, `top`, `mattress`, `handle`…) so
 * a script can sit, work, lie and go through. They stand on the ground facing the viewer
 * (`turn` 0) and turn like any prop; a chair tips back on its rear legs, a
 * desk's drawer slides out, a bed's mattress gives when someone lands on it,
 * and a door opens on its hinge, slams, and rattles when knocked.
 */

export interface ChairSpec {
  kind?: string
  summary?: string
  /** Seat width and depth, seat height, and the back's height above the floor, metres */
  width?: number
  depth?: number
  seatHeight?: number
  backHeight?: number
  colors?: { wood?: string; seat?: string }
}

/** A chair: a seat on four legs with a back; tips back on its rear legs. */
export function chair(spec: ChairSpec = {}): Prop {
  const width = spec.width ?? 0.46
  const depth = spec.depth ?? 0.46
  const seatHeight = spec.seatHeight ?? 0.46
  const backHeight = spec.backHeight ?? 0.95
  const colors = { wood: '#8a5a3b', seat: '#c48a4a', ...spec.colors }
  const thick = 0.05
  const legRadius = 0.025
  const parts: PropPart[] = [
    { id: 'seat', shape: { type: 'box', size: [width, thick, depth] }, at: [0, seatHeight - thick / 2, 0], fill: colors.seat },
    { id: 'back', shape: { type: 'box', size: [width, backHeight - seatHeight, thick] }, at: [0, (backHeight + seatHeight) / 2, -depth / 2 + thick / 2], fill: colors.wood },
  ]
  for (const [x, z, name] of [[-1, 1, 'front-left'], [1, 1, 'front-right'], [-1, -1, 'back-left'], [1, -1, 'back-right']] as const) {
    parts.push({ id: `leg-${name}`, shape: { type: 'tube', points: [[0, 0, 0], [0, seatHeight - thick, 0]], radius: legRadius, segments: 6 }, at: [x * (width / 2 - legRadius * 1.5), 0, z * (depth / 2 - legRadius * 1.5)], fill: colors.wood })
  }
  const rig: PropRig = {
    parts,
    controls: {
      tip: { description: 'Tipped back on its rear legs (+), degrees', unit: 'degrees', min: 0, max: 60, bind: [{ parts: parts.map((p) => p.id), rotate: { axis: 'x', degrees: 1, pivot: [0, 0, -depth / 2 + legRadius * 1.5] } }] },
    },
    length: depth,
    height: backHeight,
    footprint: [width, depth],
    anchors: {
      seat: { at: [0, seatHeight, 0] },
      back: { at: [0, backHeight, -depth / 2] },
      front: { at: [0, 0, depth / 2 + 0.3] },
    },
  }
  return {
    kind: spec.kind ?? 'chair',
    family: 'furniture',
    summary: spec.summary ?? 'A chair: a seat to sit on (`seat`), tips back on its rear legs and settles, or falls over.',
    rig,
    actions: chairActions(),
    acting: CHAIR_ACTING,
    colors: { body: colors.seat },
  }
}

export const CHAIR_ACTING: ActingRig = {
  depth: { tip: 1, roll: 1, squash: 1, size: 0 },
  limits: { tip: 2, roll: 1, squash: 0.05 },
  eyes: [],
  headTurns: {},
  drift: [],
}

function chairActions(): Record<string, PropAction> {
  return {
    tip: {
      summary: 'Tips back on its rear legs for `for` ms (default 1200), rocking a little, then settles down.',
      uses: ['for'],
      run(context, beat, start) {
        const degrees = 18 * context.exaggeration
        const length = beat.for ?? 1200
        context.key(start + 350, { tip: degrees }, { easing: 'ease-out' })
        context.key(start + 350 + length * 0.4, { tip: degrees * 0.85 }, { act: false, easing: 'ease-in-out' })
        context.key(start + 350 + length * 0.7, { tip: degrees }, { act: false, easing: 'ease-in-out' })
        context.key(start + 350 + length, { tip: 0 }, { easing: 'ease-in' })
        return { end: start + 350 + length, contact: start + 350 }
      },
    },
    fall: {
      summary: 'Falls over backwards onto its back and bounces, with dust.',
      uses: ['for'],
      run(context, beat, start) {
        const length = beat.for ?? 700
        context.key(start + length * 0.6, { tip: 90 }, { act: false, easing: 'ease-in' })
        context.key(start + length * 0.75, { tip: 82 }, { act: false, easing: 'ease-out' })
        context.key(start + length, { tip: 90 }, { act: false, easing: 'ease-in' })
        context.effect({ kind: 'dust', time: start + length * 0.6, x: context.x, y: context.floor, length: 600 })
        return { end: start + length, contact: start + length * 0.6 }
      },
    },
  }
}

export interface DeskSpec {
  kind?: string
  summary?: string
  /** Across, front to back, and the top's height, metres */
  width?: number
  depth?: number
  height?: number
  colors?: { wood?: string; top?: string; knob?: string }
}

/** A desk: a top on four legs, with a drawer that slides out of the front. */
export function desk(spec: DeskSpec = {}): Prop {
  const width = spec.width ?? 1.4
  const depth = spec.depth ?? 0.7
  const height = spec.height ?? 0.75
  const colors = { wood: '#8a5a3b', top: '#a9754a', knob: '#2b2b2b', ...spec.colors }
  const thick = 0.04
  const legRadius = 0.03
  const drawerHeight = 0.14
  const drawerWidth = width * 0.4
  const parts: PropPart[] = [
    { id: 'top', shape: { type: 'box', size: [width, thick, depth] }, at: [0, height - thick / 2, 0], fill: colors.top },
    // The drawer: a box under the top on the left, sliding forward on its control.
    { id: 'drawer', shape: { type: 'box', size: [drawerWidth, drawerHeight, depth * 0.8] }, at: [-width / 2 + drawerWidth / 2 + 0.05, height - thick - drawerHeight / 2, 0], fill: colors.wood },
    { id: 'knob', parent: 'drawer', shape: { type: 'ellipsoid', radii: [0.02, 0.02, 0.015], segments: 8 }, at: [0, 0, depth * 0.4 + 0.012], fill: colors.knob, outline: 0.6 },
  ]
  for (const [x, z, name] of [[-1, 1, 'front-left'], [1, 1, 'front-right'], [-1, -1, 'back-left'], [1, -1, 'back-right']] as const) {
    parts.push({ id: `leg-${name}`, shape: { type: 'tube', points: [[0, 0, 0], [0, height - thick, 0]], radius: legRadius, segments: 6 }, at: [x * (width / 2 - legRadius * 2), 0, z * (depth / 2 - legRadius * 2)], fill: colors.wood })
  }
  const rig: PropRig = {
    parts,
    controls: {
      drawer: { description: 'The drawer out: 0 shut, 1 open', unit: '0..1', min: 0, max: 1, bind: [{ parts: ['drawer'], translate: [0, 0, depth * 0.5] }] },
    },
    length: depth,
    height,
    footprint: [width, depth],
    anchors: {
      top: { at: [0, height, 0] },
      edge: { at: [0, height, depth / 2] },
      drawer: { part: 'drawer', at: [0, 0, depth * 0.4] },
      chair: { at: [0, 0, depth / 2 + 0.35] },
    },
  }
  return {
    kind: spec.kind ?? 'desk',
    family: 'furniture',
    summary: spec.summary ?? 'A desk: a top to work at (`top`, `edge`), a drawer that opens (`drawer`), a place for a chair in front (`chair`).',
    rig,
    actions: {
      drawer: {
        summary: 'Opens the drawer (`open: true`) or shuts it (`open: false`).',
        needs: ['open'],
        run(context, beat, start) {
          context.key(start + 400, { drawer: beat.open ? 1 : 0 }, { easing: beat.open ? 'ease-out' : 'ease-in' })
          return { end: start + 500, contact: start + 400 }
        },
      },
    },
    acting: DESK_ACTING,
    colors: { body: colors.top },
  }
}

export const DESK_ACTING: ActingRig = {
  depth: { drawer: 1, roll: 1, squash: 1, size: 0 },
  limits: { drawer: 0.08, roll: 1, squash: 0.04 },
  eyes: [],
  headTurns: {},
  drift: [],
}

export interface BedSpec {
  kind?: string
  summary?: string
  /** Length (head to foot), width, the mattress top's height, and the headboard's height, metres */
  length?: number
  width?: number
  height?: number
  headboard?: number
  colors?: { wood?: string; mattress?: string; blanket?: string; pillow?: string }
}

/** A bed: a frame with a headboard, a mattress with a blanket, a pillow; the mattress gives when someone lands on it. */
export function bed(spec: BedSpec = {}): Prop {
  const length = spec.length ?? 2.0
  const width = spec.width ?? 1.0
  const height = spec.height ?? 0.55
  const headboard = spec.headboard ?? 0.95
  const colors = { wood: '#8a5a3b', mattress: '#f1ece2', blanket: '#5b7fb0', pillow: '#fbf8f2', ...spec.colors }
  const frameHeight = 0.3
  const mattressHeight = height - frameHeight
  // The bed lies along z: the head end at the back (−z), the foot toward the viewer.
  const parts: PropPart[] = [
    { id: 'frame', shape: { type: 'box', size: [width, frameHeight, length] }, at: [0, frameHeight / 2, 0], fill: colors.wood },
    { id: 'headboard', shape: { type: 'box', size: [width + 0.06, headboard - frameHeight, 0.06] }, at: [0, (headboard + frameHeight) / 2, -length / 2 - 0.03], fill: colors.wood },
    { id: 'mattress', shape: { type: 'box', size: [width - 0.04, mattressHeight, length - 0.04] }, at: [0, frameHeight + mattressHeight / 2, 0], fill: colors.mattress },
    { id: 'blanket', parent: 'mattress', shape: { type: 'box', size: [width - 0.02, 0.04, length * 0.62] }, at: [0, mattressHeight / 2 + 0.02, length * 0.19], fill: colors.blanket, outline: 0.7 },
    { id: 'pillow', parent: 'mattress', shape: { type: 'ellipsoid', radii: [width * 0.32, 0.07, 0.22], segments: 12 }, at: [0, mattressHeight / 2 + 0.06, -length / 2 + 0.32], fill: colors.pillow, outline: 0.7 },
  ]
  const rig: PropRig = {
    parts,
    controls: {
      give: { description: 'The mattress pressed down: 1 as made, below squashed (someone landed on it)', unit: 'factor', default: 1, min: 0.5, max: 1.2, bind: [{ parts: ['mattress'], scale: [1, 1, 1] }] },
    },
    length,
    height: headboard,
    footprint: [width, length],
    anchors: {
      mattress: { part: 'mattress', at: [0, mattressHeight / 2, 0] },
      pillow: { part: 'mattress', at: [0, mattressHeight / 2 + 0.1, -length / 2 + 0.32] },
      foot: { at: [0, height, length / 2] },
      side: { at: [width / 2 + 0.25, 0, 0] },
    },
  }
  return {
    kind: spec.kind ?? 'bed',
    family: 'furniture',
    summary: spec.summary ?? 'A bed: a mattress to lie on (`mattress`, `pillow`) that gives and springs back when someone lands on it (`bounce`), a side to sit on (`side`).',
    rig,
    actions: {
      bounce: {
        summary: 'The mattress gives (someone landed on it) and springs back over `for` ms (default 700).',
        uses: ['for'],
        run(context, beat, start) {
          const length = beat.for ?? 700
          const e = context.exaggeration
          context.key(start + 90, { give: 1 - 0.18 * e }, { act: false, easing: 'ease-out' })
          context.key(start + length * 0.45, { give: 1 + 0.05 * e }, { act: false, easing: 'ease-in-out' })
          context.key(start + length * 0.7, { give: 1 - 0.04 * e }, { act: false, easing: 'ease-in-out' })
          context.key(start + length, { give: 1 })
          return { end: start + length, contact: start + 90 }
        },
      },
    },
    acting: BED_ACTING,
    colors: { body: colors.blanket },
  }
}

export const BED_ACTING: ActingRig = {
  depth: { give: 1, roll: 1, squash: 1, size: 0 },
  limits: { give: 0.03, roll: 0.5, squash: 0.03 },
  eyes: [],
  headTurns: {},
  drift: [],
}

export interface DoorSpec {
  kind?: string
  summary?: string
  /** The opening's width and height, metres */
  width?: number
  height?: number
  /** Which side the hinge is on, seen from the front (default left) */
  hinge?: 'left' | 'right'
  colors?: { frame?: string; door?: string; handle?: string; beyond?: string }
}

/** A door in its frame: opens on its hinge, slams, and rattles when knocked; the doorway behind shows when it opens. */
export function door(spec: DoorSpec = {}): Prop {
  const width = spec.width ?? 0.9
  const height = spec.height ?? 2.05
  const hinge = spec.hinge ?? 'left'
  const colors = { frame: '#d9d2c3', door: '#7a4b2a', handle: '#c9a227', beyond: '#2a2f3a', ...spec.colors }
  const post = 0.1
  const sign = hinge === 'left' ? 1 : -1
  // The panel's origin is its hinged edge: the character's left is +x, so the viewer's left is +x too, front-on.
  const panelPoints: [number, number][] = sign > 0 ? [[0, 0], [-width, 0], [-width, height], [0, height]] : [[0, 0], [width, 0], [width, height], [0, height]]
  const parts: PropPart[] = [
    { id: 'post-left', shape: { type: 'box', size: [post, height + post, post] }, at: [width / 2 + post / 2, (height + post) / 2, 0], fill: colors.frame },
    { id: 'post-right', shape: { type: 'box', size: [post, height + post, post] }, at: [-width / 2 - post / 2, (height + post) / 2, 0], fill: colors.frame },
    { id: 'lintel', shape: { type: 'box', size: [width + post * 2, post, post] }, at: [0, height + post / 2, 0], fill: colors.frame },
    { id: 'beyond', shape: { type: 'panel', points: [[-width / 2, 0], [width / 2, 0], [width / 2, height], [-width / 2, height]], facing: 'front' }, at: [0, 0, -0.03], fill: colors.beyond, outline: 0.4, seeThrough: true },
    { id: 'door', shape: { type: 'panel', points: panelPoints, facing: 'front' }, at: [sign * width / 2, 0, 0.005], fill: colors.door, outline: 0.9, overRider: true },
    { id: 'handle', parent: 'door', shape: { type: 'ellipsoid', radii: [0.03, 0.03, 0.03], segments: 8 }, at: [-sign * (width - 0.1), height * 0.47, 0.03], fill: colors.handle, outline: 0.5 },
  ]
  const rig: PropRig = {
    parts,
    controls: {
      open: { description: 'How far the door is open: 0 shut, 1 open wide', unit: '0..1', min: 0, max: 1, bind: [{ parts: ['door'], rotate: { axis: 'y', degrees: sign * -95 } }] },
    },
    length: 0.3,
    height: height + post,
    footprint: [width + post * 2, 0.3],
    anchors: {
      handle: { part: 'door', at: [-sign * (width - 0.1), height * 0.47, 0.03] },
      doorway: { at: [0, 0, 0] },
      front: { at: [0, 0, 0.5] },
      beyond: { at: [0, 0, -0.5] },
    },
  }
  return {
    kind: spec.kind ?? 'door',
    family: 'furniture',
    summary: spec.summary ?? 'A door in its frame: opens and shuts on its hinge (`open`), slams, rattles when knocked; a figure goes through the `doorway` from `front` to `beyond`.',
    rig,
    actions: doorActions(),
    acting: DOOR_ACTING,
    colors: { body: colors.door },
  }
}

export const DOOR_ACTING: ActingRig = {
  depth: { open: 1, roll: 1, squash: 1, size: 0 },
  limits: { open: 0.08, roll: 0.6, squash: 0.03 },
  eyes: [],
  headTurns: {},
  drift: [],
}

function doorActions(): Record<string, PropAction> {
  return {
    open: {
      summary: 'Opens the door (`open: true`, default) or shuts it (`open: false`), over `for` ms (default 600).',
      uses: ['open', 'for'],
      run(context, beat, start) {
        const length = beat.for ?? 600
        context.key(start + length, { open: beat.open === false ? 0 : 1 }, { easing: 'ease-in-out' })
        return { end: start + length + 80, contact: start + length }
      },
    },
    slam: {
      summary: 'Slams shut: a fast swing, a shudder in the frame, dust.',
      run(context, _beat, start) {
        const e = context.exaggeration
        context.key(start + 180, { open: 0 }, { act: false, easing: 'ease-in' })
        for (let i = 1; i <= 4; i++) context.key(start + 180 + i * 70, { roll: (i % 2 === 0 ? 1 : -1) * 1.2 * e * (1 - i / 5) }, { act: false })
        context.key(start + 180 + 5 * 70, { roll: 0 })
        context.effect({ kind: 'dust', time: start + 180, x: context.x, y: context.floor, length: 500 })
        return { end: start + 180 + 5 * 70, contact: start + 180 }
      },
    },
    knock: {
      summary: 'Someone knocks three times: the door rattles over `for` ms (default 700).',
      uses: ['for'],
      run(context, beat, start) {
        const times = 3
        const length = beat.for ?? 700
        const e = context.exaggeration
        for (let i = 0; i < times; i++) {
          const at = start + (length * (i + 0.5)) / times
          context.key(at, { open: 0.03 * e }, { act: false, easing: 'ease-out' })
          context.key(at + 60, { open: 0 }, { act: false, easing: 'ease-in' })
        }
        return { end: start + length, contact: start + length / (times * 2) }
      },
    },
  }
}

export interface WheelchairSpec {
  /** Seat width, metres (default 0.5) */
  width?: number
  /** Seat height off the ground, metres (default 0.5) */
  seatHeight?: number
  /** The big wheels' radius, metres (default 0.3) */
  wheelRadius?: number
  colors?: { frame?: string; seat?: string; tyre?: string }
  kind?: string
  summary?: string
}

/** How fast a wheelchair rolls itself, metres per second. */
const WHEELCHAIR_SPEED = 1.4

/**
 * A wheelchair: a seat and back on a frame, two big rimmed wheels at the back
 * (hand rims a rider turns), two castors at the front, footrests and push
 * handles. Any character rides it (`propRide3D` on its `seat` in the
 * `wheeling` pose); a pusher stands at `handles`. It is an accessory, not an
 * age or a build: who sits in it is the story's choice.
 */
export function wheelchair(spec: WheelchairSpec = {}): Prop {
  const width = spec.width ?? 0.5
  const seatHeight = spec.seatHeight ?? 0.5
  const radius = spec.wheelRadius ?? 0.3
  const castor = 0.08
  const colors = { frame: '#2b2f36', seat: '#3c6ea5', tyre: '#1f2328', ...spec.colors }
  const thick = 0.04
  const tube = 0.018
  const depth = 0.44
  const backHeight = seatHeight + 0.5
  const axleZ = -0.08
  const side = width / 2 + 0.06
  const parts: PropPart[] = [
    { id: 'seat', shape: { type: 'box', size: [width, thick, depth] }, at: [0, seatHeight - thick / 2, 0], fill: colors.seat },
    { id: 'back', shape: { type: 'box', size: [width, backHeight - seatHeight - 0.02, thick] }, at: [0, (backHeight + seatHeight) / 2, -depth / 2 + thick / 2], fill: colors.seat },
    // Footrests: a bar in front, low, with two plates.
    { id: 'footrest', shape: { type: 'box', size: [width * 0.8, 0.02, 0.14] }, at: [0, 0.12, depth / 2 + 0.22], fill: colors.frame },
  ]
  const frameParts: string[] = []
  for (const [x, name] of [[-1, 'left'], [1, 'right']] as const) {
    const sx = x * side
    const add = (id: string, points: Array<[number, number, number]>, r = tube) => {
      parts.push({ id, shape: { type: 'tube', points, radius: r, segments: 6 }, fill: colors.frame, outline: 0.7 })
      frameParts.push(id)
    }
    // The frame: a back post with a push handle, the seat rail, a leg down to the castor, and a strut to the footrest.
    add(`post-${name}`, [[sx, seatHeight - 0.1, -depth / 2], [sx, backHeight + 0.04, -depth / 2], [sx, backHeight + 0.04, -depth / 2 - 0.14]])
    add(`rail-${name}`, [[sx, seatHeight - 0.03, -depth / 2], [sx, seatHeight - 0.03, depth / 2]])
    add(`leg-${name}`, [[sx, seatHeight - 0.03, depth / 2], [sx * 0.85, castor, depth / 2 + 0.06]])
    add(`strut-${name}`, [[sx * 0.85, castor + 0.08, depth / 2 + 0.04], [sx * 0.8, 0.13, depth / 2 + 0.22]])
    add(`armrest-${name}`, [[sx, seatHeight + 0.22, -depth / 2 + 0.02], [sx, seatHeight + 0.22, depth / 2 - 0.08]], tube * 1.3)
    // The big wheel, with a hand rim outside it.
    parts.push({
      id: `wheel-${name}`,
      shape: { type: 'cylinder', radius, length: 0.04, axis: 'x', segments: 20, spokes: 8 },
      at: [sx + x * 0.03, radius, axleZ],
      ink: colors.tyre,
      outline: 1.3,
    })
    parts.push({ id: `rim-${name}`, shape: { type: 'cylinder', radius: radius * 0.9, length: 0.012, axis: 'x', segments: 20 }, at: [x * 0.045, 0, 0], parent: `wheel-${name}`, ink: colors.frame, outline: 0.8 })
    parts.push({
      id: `castor-${name}`,
      shape: { type: 'cylinder', radius: castor, length: 0.03, axis: 'x', segments: 12, spokes: 3 },
      at: [sx * 0.85, castor, depth / 2 + 0.06],
      fill: colors.tyre,
    })
  }
  const everything = parts.map((p) => p.id).filter((id) => !id.startsWith('rim-'))
  const rig: PropRig = {
    parts,
    controls: {
      wheelSpin: {
        description: 'How far the big wheels have turned, degrees (keyed with the distance rolled, so they never skate); the castors turn faster',
        unit: 'degrees',
        bind: [
          { parts: ['wheel-left', 'wheel-right'], rotate: { axis: 'x', degrees: 1 } },
          { parts: ['castor-left', 'castor-right'], rotate: { axis: 'x', degrees: radius / castor } },
        ],
      },
      tip: {
        description: 'Tipped back on its big wheels (+), degrees: a wheelie, or a helper tipping it up a kerb',
        unit: 'degrees',
        min: 0,
        max: 45,
        bind: [{ parts: everything, rotate: { axis: 'x', degrees: 1, pivot: [0, radius, axleZ] } }],
      },
    },
    length: depth + 0.4,
    height: backHeight + 0.04,
    footprint: [side * 2 + 0.1, depth + 0.4],
    anchors: {
      seat: { at: [0, seatHeight, 0.02] },
      handles: { at: [0, 0, -depth / 2 - 0.5] },
      front: { at: [0, 0, depth / 2 + 0.6] },
      footrest: { at: [0, 0.13, depth / 2 + 0.22] },
    },
  }
  return {
    kind: spec.kind ?? 'wheelchair',
    family: 'furniture',
    summary: spec.summary ?? 'A wheelchair: rolls to `to` with its wheels turning the distance (roll), brakes, tips back on its big wheels (wheelie); its `seat` is ridden in the `wheeling` pose and a pusher stands at `handles`.',
    rig,
    actions: wheelchairActions(radius),
    acting: WHEELCHAIR_ACTING,
    colors: { body: colors.seat, ink: colors.frame },
    wheelRadius: radius,
    moves: { roll: { speed: WHEELCHAIR_SPEED, perMetre: { wheelSpin: 180 / (Math.PI * radius) } } },
  }
}

export const WHEELCHAIR_ACTING: ActingRig = {
  depth: { wheelSpin: 0, tip: 1, roll: 1, squash: 1, size: 0 },
  limits: { tip: 2, roll: 1, squash: 0.03 },
  eyes: [],
  headTurns: {},
  drift: [],
}

/** Turn the wheels in step with a move, so they roll exactly the distance covered. */
function rollWheels(context: PropActionContext, start: number, end: number, toX: number, easing: EasingType, radius: number, locked = false): void {
  const facing = context.facing() || Math.sign(toX - context.x) || 1
  const spin = context.values.wheelSpin ?? 0
  const metres = ((toX - context.x) * facing) / context.scale
  context.set('wheelSpin', start, spin)
  context.move(start, end, toX, { easing })
  context.set('wheelSpin', end, locked ? spin : spin + (metres / radius) * (180 / Math.PI), easing)
}

function wheelchairActions(radius: number): Record<string, PropAction> {
  return {
    roll: {
      summary: 'Rolls to `to` at `speed` px/ms (or over `for` ms): a small push-off, the wheels turning exactly the distance, and a gentle stop.',
      needs: ['to'],
      uses: ['speed', 'for'],
      run(context, beat, start) {
        const direction = Math.sign(beat.to! - context.x) as 1 | -1 | 0
        if (direction === 0) return { end: start }
        let t = start
        if (context.facing() !== direction) t = context.turnTo(t, direction > 0 ? 'right' : 'left')
        const distance = Math.abs(beat.to! - context.x)
        const length = beat.for ?? Math.max(300, distance / (beat.speed ?? (WHEELCHAIR_SPEED * context.scale) / 1000))
        context.key(t + 150, { tip: 1.5 * context.exaggeration }, { act: false, easing: 'ease-out' })
        rollWheels(context, t, t + length, beat.to!, 'ease-in-out', radius)
        context.key(t + length, { tip: 0 }, { easing: 'ease-out' })
        return { end: t + length }
      },
    },
    brake: {
      summary: 'Stops short at `to`: the wheels lock and it skids the last bit, tipping forward a touch.',
      needs: ['to'],
      uses: ['for'],
      run(context, beat, start) {
        const direction = Math.sign(beat.to! - context.x) as 1 | -1 | 0
        if (direction === 0) return { end: start }
        const length = beat.for ?? 500
        rollWheels(context, start, start + length, beat.to!, 'ease-out', radius, true)
        context.key(start + length, { tip: 0 }, { easing: 'ease-out' })
        context.effect({ kind: 'dust', time: start + length * 0.5, x: beat.to!, y: context.floor, length: 500 })
        return { end: start + length, contact: start + length }
      },
    },
    wheelie: {
      summary: 'Tips back onto its big wheels, balances there for `for` ms (default 1200), and drops down.',
      uses: ['for'],
      run(context, beat, start) {
        const degrees = 24 * context.exaggeration
        const length = beat.for ?? 1200
        context.key(start + 300, { tip: degrees }, { easing: 'ease-out' })
        context.key(start + 300 + length * 0.5, { tip: degrees * 0.9 }, { act: false, easing: 'ease-in-out' })
        context.key(start + 300 + length, { tip: degrees }, { act: false, easing: 'ease-in-out' })
        context.key(start + 300 + length + 250, { tip: 0 }, { easing: 'ease-in' })
        context.effect({ kind: 'dust', time: start + 300 + length + 250, x: context.x, y: context.floor, length: 400 })
        return { end: start + 300 + length + 250, contact: start + 300 + length + 250 }
      },
    },
  }
}
