import { createRandom } from '../../../engine/authoring/random'
import type { Vec3 } from '../../../engine/math'
import type { ActingRig } from '../../acting/acting'
import type { PropPart, PropRig } from '../rig'
import type { PropAction, PropActionContext } from '../script'
import type { Prop } from '../target'

/**
 * The world the figures stand in: trees and houses. They mostly stay put,
 * but they are never still: a tree sways in gusts with its canopy trailing
 * its trunk (overlapping action), shakes and sheds leaves; a house opens its
 * door, lights its windows, puffs smoke and shakes when a door slams.
 * Both face the viewer by default (`turn` 0) and turn like any prop.
 */

// --- trees -------------------------------------------------------------------

export interface TreeSpec {
  kind?: string
  summary?: string
  /** Trunk height to the canopy, metres (default 2.4) */
  height?: number
  trunkRadius?: number
  /** Canopy: main radius (default 1.1), the number of extra lobes (default 7), and a seed for their placement */
  canopy?: { radius?: number; lobes?: number; seed?: number; shape?: 'round' | 'tall' }
  colors?: { trunk?: string; leaves?: string }
}

/** A tree: a trunk and a canopy of round lobes, swaying in the wind. */
export function tree(spec: TreeSpec = {}): Prop {
  const height = spec.height ?? 2.4
  const trunkRadius = spec.trunkRadius ?? 0.16
  const radius = spec.canopy?.radius ?? 1.1
  const tall = spec.canopy?.shape === 'tall'
  const colors = { trunk: '#8a5a3b', leaves: '#5cae5a', ...spec.colors }
  const random = createRandom(spec.canopy?.seed ?? 7)
  const parts: PropPart[] = [
    { id: 'trunk', shape: { type: 'tube', points: [[0, 0, 0], [0.06, height * 0.5, 0], [-0.02, height, 0]], radius: trunkRadius, segments: 8 }, fill: colors.trunk },
    { id: 'branch', parent: 'trunk', shape: { type: 'tube', points: [[0, 0, 0], [0.45, 0.4, 0.1]], radius: trunkRadius * 0.45, segments: 6 }, at: [0.04, height * 0.62, 0], fill: colors.trunk },
    { id: 'canopy', parent: 'trunk', shape: { type: 'ellipsoid', radii: [radius, radius * (tall ? 1.35 : 0.88), radius], segments: 14 }, at: [-0.02, height + radius * 0.55, 0], fill: colors.leaves },
  ]
  const lobes = spec.canopy?.lobes ?? 7
  for (let i = 0; i < lobes; i++) {
    // Lobes round the canopy's upper half, a little in front and behind, so it reads round from any side.
    const around = (Math.PI * 2 * i) / lobes + random.next() * 0.6
    const up = (random.next() - 0.25) * radius * (tall ? 1.1 : 0.7)
    const size = radius * (0.48 + random.next() * 0.22)
    const at: Vec3 = [Math.cos(around) * radius * 0.78, up, Math.sin(around) * radius * 0.6]
    parts.push({ id: `lobe-${i}`, parent: 'canopy', shape: { type: 'ellipsoid', radii: [size, size * 0.86, size], segments: 12 }, at, fill: colors.leaves })
  }
  const rig: PropRig = {
    parts,
    controls: {
      sway: { description: 'The whole tree bending in the wind, about its base', unit: 'degrees', bind: [{ parts: ['trunk'], rotate: { axis: 'z', degrees: 1 } }] },
      canopySway: { description: 'The canopy bending further than the trunk (it trails the sway)', unit: 'degrees', bind: [{ parts: ['canopy'], rotate: { axis: 'z', degrees: 1, pivot: [0, -radius * 0.8, 0] } }] },
    },
    length: radius * 2.2,
    height: height + radius * 2,
    footprint: [radius * 1.6, radius * 1.6],
    anchors: {
      canopy: { part: 'canopy', at: [0, 0, 0] },
      top: { part: 'canopy', at: [0, radius * 0.9, 0] },
      base: { at: [0, 0, 0] },
      branch: { part: 'branch', at: [0.45, 0.4, 0.1] },
    },
  }
  return {
    kind: spec.kind ?? 'tree',
    family: 'plant',
    summary: spec.summary ?? 'A tree: sways in the wind with its canopy trailing, shakes, sheds leaves, pops up.',
    rig,
    actions: treeActions(),
    acting: TREE_ACTING,
    colors: { body: colors.leaves },
  }
}

/** The trunk leads; the canopy follows it a beat later (overlapping action). */
export const TREE_ACTING: ActingRig = {
  depth: { sway: 1, canopySway: 2, size: 0, squash: 1 },
  limits: { sway: 2, canopySway: 3, squash: 0.08 },
  eyes: [],
  headTurns: {},
  drift: [],
}

function treeActions(): Record<string, PropAction> {
  /** Falling leaves from the canopy, drifting the way the wind blows. */
  const leaves = (context: PropActionContext, time: number, length: number, direction: 1 | -1) => {
    const canopy = context.anchor('canopy')
    context.effect({ kind: 'leaves', time, x: canopy.x, y: canopy.y, length, direction, toY: context.floor })
  }
  return {
    sway: {
      summary: 'Sways in gusts of `wind` (0..1, default 0.5) for `for` ms (default 3000); the canopy trails the trunk, and a strong wind sheds leaves.',
      uses: ['wind', 'for'],
      run(context, beat, start) {
        const wind = beat.wind ?? 0.5
        const length = beat.for ?? 3000
        const e = context.exaggeration
        const step = 260
        // Gusts: a slow swell with a quicker flutter on top, the canopy a step behind and further.
        let previous = 0
        for (let t = step; t < length; t += step) {
          const gust = 0.55 + 0.45 * Math.sin((t / length) * Math.PI * 2.3)
          const flutter = Math.sin(t / 170) * 0.35
          const angle = -wind * 9 * e * (gust + flutter * wind)
          context.key(start + t, { sway: angle, canopySway: previous * 1.3 }, { act: false, easing: 'ease-in-out' })
          previous = angle
        }
        context.key(start + length, { sway: 0, canopySway: 0 })
        if (wind > 0.45) for (let t = 0; t < length; t += 700) leaves(context, start + t, 2200, 1)
        return { end: start + length }
      },
    },
    shake: {
      summary: 'Shakes (something hit it): a quick wobble that dies away, shedding leaves.',
      uses: ['for'],
      run(context, beat, start) {
        const length = beat.for ?? 900
        const e = context.exaggeration
        const swings = 6
        for (let i = 1; i <= swings; i++) {
          const fade = 1 - i / (swings + 1)
          const side = i % 2 === 0 ? 1 : -1
          context.key(start + (length * i) / (swings + 1), { sway: side * 5 * e * fade, canopySway: -side * 6 * e * fade }, { act: false, easing: 'ease-in-out' })
        }
        context.key(start + length, { sway: 0, canopySway: 0 })
        leaves(context, start + 60, 1800, 1)
        leaves(context, start + 260, 1800, -1)
        return { end: start + length, contact: start }
      },
    },
    shedLeaves: {
      summary: 'Leaves fall from the canopy for `for` ms (default 2000).',
      uses: ['for'],
      run(context, beat, start) {
        const length = beat.for ?? 2000
        for (let t = 0; t < length; t += 500) leaves(context, start + t, 2000, t % 1000 === 0 ? 1 : -1)
        return { end: start + length }
      },
    },
  }
}

// --- houses -------------------------------------------------------------------

export interface HouseSpec {
  kind?: string
  summary?: string
  /** Across, front to back, wall height, roof height and overhang, metres */
  width?: number
  depth?: number
  wallHeight?: number
  roofHeight?: number
  overhang?: number
  /** The front door: across position of its middle, size */
  door?: { at?: number; width?: number; height?: number }
  /** Front windows: across position of the middle, height of the bottom, size */
  windows?: Array<{ at: number; low: number; width: number; height: number }>
  /** A chimney on the roof (across, front to back) */
  chimney?: { at?: number; back?: number } | false
  colors?: { walls?: string; roof?: string; door?: string; doorway?: string; glass?: string; lit?: string; chimney?: string }
}

/** A house: walls, a gable roof, a front door on a hinge, windows that light up, a chimney that smokes. */
export function house(spec: HouseSpec = {}): Prop {
  const width = spec.width ?? 4
  const depth = spec.depth ?? 3.2
  const wall = spec.wallHeight ?? 2.5
  const roof = spec.roofHeight ?? 1.5
  const overhang = spec.overhang ?? 0.25
  const colors = { walls: '#f1d9a8', roof: '#b8433a', door: '#7a4b2a', doorway: '#3a2a22', glass: '#bfe3f2', lit: '#ffd66b', chimney: '#9b5a45', ...spec.colors }
  const front = depth / 2 + 0.01
  const doorWidth = spec.door?.width ?? 0.9
  const doorHeight = spec.door?.height ?? 1.9
  const doorAt = spec.door?.at ?? 0
  const windows = spec.windows ?? [
    { at: -1.25, low: 1.0, width: 0.8, height: 0.8 },
    { at: 1.25, low: 1.0, width: 0.8, height: 0.8 },
  ]
  const parts: PropPart[] = [
    { id: 'walls', shape: { type: 'box', size: [width, wall, depth] }, at: [0, wall / 2, 0], fill: colors.walls },
    {
      id: 'roof',
      shape: { type: 'extrude', profile: [[-depth / 2 - overhang, wall], [depth / 2 + overhang, wall], [0, wall + roof]], width: width + overhang * 2 },
      fill: colors.roof,
      // It sits down on the walls: in a 3D scene it is drawn over their tops, and the chimney sorts with it.
      layer: 1,
    },
    // The doorway behind the door shows when it opens.
    { id: 'doorway', shape: { type: 'panel', points: [[0, 0], [doorWidth, 0], [doorWidth, doorHeight], [0, doorHeight]], facing: 'front' }, at: [doorAt - doorWidth / 2, 0, front - 0.005], fill: colors.doorway, outline: 0.6, seeThrough: true },
    // The door, hinged on its left edge (the panel's origin); drawn over a rider, so a figure in the doorway shows only when it opens.
    { id: 'door', shape: { type: 'panel', points: [[0, 0], [doorWidth, 0], [doorWidth, doorHeight], [0, doorHeight]], facing: 'front' }, at: [doorAt - doorWidth / 2, 0, front + 0.005], fill: colors.door, outline: 0.8, overRider: true },
  ]
  windows.forEach((w, i) => {
    parts.push({
      id: `window-${i}`,
      shape: { type: 'panel', points: [[-w.width / 2, w.low], [w.width / 2, w.low], [w.width / 2, w.low + w.height], [-w.width / 2, w.low + w.height]], facing: 'front' },
      // A centimetre out from the wall, as the side windows are: never in its very plane (a depth buffer can't
      // tell which is in front).
      at: [w.at, 0, front + 0.01],
      fill: colors.glass,
      outline: 0.8,
      glow: { control: 'lights', color: colors.lit },
    })
  })
  for (const side of [1, -1]) {
    parts.push({
      id: `side-window-${side > 0 ? 'left' : 'right'}`,
      shape: { type: 'panel', points: [[-0.4, 1.0], [0.4, 1.0], [0.4, 1.8], [-0.4, 1.8]], facing: side > 0 ? 'left' : 'right' },
      at: [side * (width / 2 + 0.01), 0, 0],
      fill: colors.glass,
      outline: 0.8,
      glow: { control: 'lights', color: colors.lit },
    })
  }
  const chimney = spec.chimney === false ? undefined : { at: spec.chimney?.at ?? width * 0.28, back: spec.chimney?.back ?? -depth * 0.18 }
  if (chimney) {
    // Its base sits down in the roof, its top above the ridge.
    const slopeAt = wall + roof * (1 - Math.abs(chimney.back) / (depth / 2 + overhang))
    const top = wall + roof + 0.45
    parts.push({ id: 'chimney', shape: { type: 'box', size: [0.42, top - slopeAt + 0.3, 0.42] }, at: [chimney.at, (top + slopeAt - 0.3) / 2, chimney.back], fill: colors.chimney, layer: 1 })
  }
  const rig: PropRig = {
    parts,
    controls: {
      door: { description: 'The front door open: 0 shut, 1 open', unit: '0..1', min: 0, max: 1, bind: [{ parts: ['door'], rotate: { axis: 'y', degrees: -80 } }] },
      lights: { description: 'The windows lit: 0 dark, 1 lit', unit: '0..1', min: 0, max: 1 },
    },
    length: depth + overhang * 2,
    height: wall + roof + 0.6,
    footprint: [width + 0.6, depth + 0.6],
    anchors: {
      door: { at: [doorAt, doorHeight / 2, front] },
      doorstep: { at: [doorAt, 0, front + 0.4] },
      ridge: { at: [0, wall + roof, 0] },
      ...(chimney ? { chimney: { at: [chimney.at, wall + roof + 0.5, chimney.back] } } : {}),
    },
  }
  return {
    kind: spec.kind ?? 'house',
    family: 'building',
    summary: spec.summary ?? 'A house: opens its door, lights its windows, puffs chimney smoke, shakes, pops up.',
    rig,
    actions: houseActions(Boolean(chimney)),
    acting: HOUSE_ACTING,
    colors: { body: colors.walls },
  }
}

export const HOUSE_ACTING: ActingRig = {
  depth: { door: 1, lights: 0, roll: 1, squash: 1, size: 0 },
  limits: { door: 0.1, roll: 1.5, squash: 0.05 },
  eyes: [],
  headTurns: {},
  drift: [],
}

function houseActions(hasChimney: boolean): Record<string, PropAction> {
  return {
    door: {
      summary: 'Opens the front door (`open: true`) or shuts it (`open: false`).',
      needs: ['open'],
      run(context, beat, start) {
        context.key(start + 500, { door: beat.open ? 1 : 0 })
        return { end: start + 650, contact: start + 500 }
      },
    },
    lights: {
      summary: 'Lights the windows (`on: true`) or puts them out.',
      needs: ['on'],
      run(context, beat, start) {
        context.key(start + 150, { lights: beat.on ? 1 : 0 }, { act: false })
        return { end: start + 300, contact: start + 150 }
      },
    },
    shake: {
      summary: 'Shakes, as when a door slams or something lands on it: a squash and a wobble that dies away, with dust.',
      uses: ['for'],
      run(context, beat, start) {
        const length = beat.for ?? 700
        const e = context.exaggeration
        context.key(start + 80, { squash: 1 - 0.06 * e }, { act: false, easing: 'ease-out' })
        for (let i = 1; i <= 5; i++) {
          const fade = 1 - i / 6
          context.key(start + 80 + (length * i) / 6, { roll: (i % 2 === 0 ? 1 : -1) * 2.2 * e * fade, squash: 1 + 0.02 * fade }, { act: false, easing: 'ease-in-out' })
        }
        context.key(start + length + 80, { roll: 0, squash: 1 })
        context.effect({ kind: 'dust', time: start + 80, x: context.x, y: context.floor, length: 600 })
        return { end: start + length + 80, contact: start + 80 }
      },
    },
    ...(hasChimney
      ? {
          smoke: {
            summary: 'Starts smoke puffing from the chimney for `for` ms (default 3000), drifting with the wind; the next beat starts at once (the smoke carries on).',
            uses: ['for', 'wind'],
            run(context: PropActionContext, beat: { for?: number; wind?: number }, start: number) {
              const length = beat.for ?? 3000
              const top = context.anchor('chimney')
              context.effect({ kind: 'smoke', time: start, x: top.x, y: top.y, length: length + 1500, direction: (beat.wind ?? 0.4) >= 0 ? 1 : -1 })
              return { end: start + 50, release: start + length }
            },
          } satisfies PropAction,
        }
      : {}),
  }
}
