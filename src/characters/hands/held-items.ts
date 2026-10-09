import type { Point } from '../../adapters/canvas/sketch'
import type { CharacterJoints, CharacterLayer, CharacterLayers } from '../character'
import type { Pose } from '../rig/body-plan'
import type { Pen } from '../look/pen'

/**
 * Things a character holds: a mug, a phone, a book, bags, an umbrella, a
 * broom, a parcel. Each is plain data (`holding: { right: 'mug' }`) drawn at
 * the hand's grip, so it follows the hand through any pose, gait or turn, and
 * sorts with that arm (behind the body when the arm is). An item held in
 * `both` hands sits between them.
 *
 * Whether an item shows is a pose field, `held.left`, `held.right` or
 * `held.both` (shown unless it is below 0.5), so a track can let go of it: a
 * parcel handed over is the giver's `held.both` going to 0 at the moment the
 * taker's goes to 1, with their hands meeting there (see `meetHands`).
 * `handGrip` gives the grip for drawing anything else in a hand.
 */

export type HeldItemName = 'mug' | 'phone' | 'book' | 'bag' | 'briefcase' | 'umbrella' | 'broom' | 'parcel'

export interface HeldItem {
  item: HeldItemName
  /** Main colour (each item has its own default) */
  color: string
}

export type HeldItemSpec = HeldItemName | Partial<HeldItem> & { item: HeldItemName }

export type HoldingSide = 'left' | 'right' | 'both'

/** What each hand holds, every choice spelled out. */
export type Holding = Partial<Record<HoldingSide, HeldItem>>

export type HoldingSpec = Partial<Record<HoldingSide, HeldItemSpec>>

/** Every item, with its default colour and the hands it takes. */
export const HELD_ITEMS = {
  mug: { color: '#e2493b', hands: 'one' },
  phone: { color: '#2b2f36', hands: 'one' },
  book: { color: '#3a6ea5', hands: 'either' },
  bag: { color: '#e9d8b4', hands: 'one' },
  briefcase: { color: '#6b4630', hands: 'one' },
  umbrella: { color: '#3c9a6e', hands: 'one' },
  broom: { color: '#c8963e', hands: 'one' },
  parcel: { color: '#c9a06a', hands: 'both' },
} satisfies Record<HeldItemName, { color: string; hands: 'one' | 'both' | 'either' }>

export function resolveHolding(spec: HoldingSpec): Holding {
  const out: Holding = {}
  for (const side of ['left', 'right', 'both'] as const) {
    const own = spec[side]
    if (!own) continue
    const item = typeof own === 'string' ? own : own.item
    const known = HELD_ITEMS[item] as (typeof HELD_ITEMS)[HeldItemName] | undefined
    if (!known) throw new Error(`holding: unknown item '${item}'`)
    if (side === 'both' && known.hands === 'one') throw new Error(`holding: a ${item} is held in one hand ('left' or 'right'), not 'both'`)
    if (side !== 'both' && known.hands === 'both') throw new Error(`holding: a ${item} is held in both hands ('both')`)
    out[side] = { item, color: (typeof own === 'object' ? own.color : undefined) ?? known.color }
  }
  return out
}

/** Where a hand grips, on the screen: the point, the forearm's direction and its depth toward the viewer. */
export interface Grip {
  point: Point
  /** Unit vector along the forearm, elbow to hand */
  along: Point
  /** Depth toward the viewer (px), to sort with the body */
  depth: number
}

/** A hand's grip from a character's joints (drawing space; see `characterJoints`). */
export function handGrip(joints: CharacterJoints, side: 'left' | 'right'): Grip {
  const arm = joints.chains[`arm.${side}`]
  const hand = arm[arm.length - 1]
  const elbow = arm[arm.length - 2]
  const length = Math.hypot(hand.x - elbow.x, hand.y - elbow.y) || 1
  const along = { x: (hand.x - elbow.x) / length, y: (hand.y - elbow.y) / length }
  // A little past the wrist, in the palm.
  const reach = joints.lineWidth * 0.5
  return { point: { x: hand.x + along.x * reach, y: hand.y + along.y * reach }, along, depth: joints.parts[`arm.${side}`]?.depth ?? 0 }
}

/** Points of a rectangle centred at `c`, `w` across and `h` tall, turned by `angle` (radians). */
function box(c: Point, w: number, h: number, angle = 0): Point[] {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [w / 2, h / 2],
    [-w / 2, h / 2],
  ].map(([x, y]) => ({ x: c.x + x * cos - y * sin, y: c.y + x * sin + y * cos }))
}

const arc = (c: Point, r: number, from: number, to: number, samples = 12): Point[] =>
  Array.from({ length: samples + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / samples
    return { x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r }
  })

/**
 * Draw an item held at a grip. `H` is the character's height (sizes follow
 * it), `outline` the line width for its edges; `facing` (-1..1) is which way
 * the character faces across the screen, for items with a front (a mug's
 * handle, a broom's sweep); `headTop` (screen y of the top of the head) lifts
 * an umbrella's canopy clear of the head.
 */
export function drawHeldItem(pen: Pen, held: HeldItem, grip: Grip, H: number, outline: number, facing = 1, headTop?: number): void {
  const { point: p, along } = grip
  const s = H / 300
  switch (held.item) {
    case 'mug': {
      const body = box({ x: p.x, y: p.y - 4 * s }, 20 * s, 24 * s)
      pen.line(arc({ x: p.x + 10 * s * Math.sign(facing || 1), y: p.y - 4 * s }, 7 * s, -Math.PI / 2, Math.PI / 2).map((q) => ({ x: p.x + (q.x - p.x) * Math.sign(facing || 1), y: q.y })), outline)
      pen.shape(body, held.color, outline)
      return
    }
    case 'phone': {
      const angle = Math.atan2(along.y, along.x) - Math.PI / 2
      pen.shape(box(p, 13 * s, 24 * s, angle), held.color, outline)
      pen.shape(box(p, 9 * s, 17 * s, angle), '#8fd0f5', 0)
      return
    }
    case 'book': {
      // An open book: two pages, their spine at the grip.
      const w = 26 * s
      const h = 34 * s
      pen.shape([{ x: p.x, y: p.y - h / 2 }, { x: p.x - w, y: p.y - h / 2 - 3 * s }, { x: p.x - w, y: p.y + h / 2 - 3 * s }, { x: p.x, y: p.y + h / 2 }], held.color, outline)
      pen.shape([{ x: p.x, y: p.y - h / 2 }, { x: p.x + w, y: p.y - h / 2 - 3 * s }, { x: p.x + w, y: p.y + h / 2 - 3 * s }, { x: p.x, y: p.y + h / 2 }], held.color, outline)
      for (const side of [-1, 1]) {
        for (const k of [0.3, 0.5, 0.7]) {
          const y = p.y - h / 2 + h * k
          pen.line([{ x: p.x + side * 5 * s, y }, { x: p.x + side * (w - 5 * s), y: y - 2 * s }], Math.max(0.8, outline * 0.5))
        }
      }
      return
    }
    case 'bag': {
      const top = p.y + 10 * s
      pen.line([{ x: p.x - 9 * s, y: top }, { x: p.x - 5 * s, y: p.y - 2 * s }, { x: p.x + 5 * s, y: p.y - 2 * s }, { x: p.x + 9 * s, y: top }], outline)
      pen.shape([{ x: p.x - 17 * s, y: top }, { x: p.x + 17 * s, y: top }, { x: p.x + 20 * s, y: top + 40 * s }, { x: p.x - 20 * s, y: top + 40 * s }], held.color, outline)
      return
    }
    case 'briefcase': {
      pen.line(arc({ x: p.x, y: p.y + 6 * s }, 7 * s, Math.PI, Math.PI * 2), outline)
      pen.shape(box({ x: p.x, y: p.y + 22 * s }, 46 * s, 32 * s), held.color, outline)
      pen.line([{ x: p.x - 23 * s, y: p.y + 14 * s }, { x: p.x + 23 * s, y: p.y + 14 * s }], Math.max(0.8, outline * 0.6))
      return
    }
    case 'umbrella': {
      // Held up: the shaft rises from the hand to an open canopy just over the head.
      const r = 78 * s
      const rim = (headTop ?? p.y - 120 * s) - 14 * s
      const top = { x: p.x, y: Math.min(p.y - 60 * s, rim - r * 0.55) }
      pen.line([{ x: p.x, y: p.y + 10 * s }, top], outline)
      pen.line(arc({ x: p.x + 5 * s, y: p.y + 10 * s }, 5 * s, Math.PI, 0, 8), outline)
      const canopy = [...arc({ x: top.x, y: top.y + r * 0.55 }, r, Math.PI, Math.PI * 2, 24)]
      const scallops: Point[] = []
      for (let i = 4; i >= 0; i--) {
        const x0 = top.x - r + (2 * r * i) / 5
        scallops.push(...arc({ x: x0 + r / 5, y: top.y + r * 0.55 }, r / 5, 0, -Math.PI, 6).reverse())
      }
      pen.shape([...canopy, ...scallops], held.color, outline)
      return
    }
    case 'broom': {
      // The handle runs through the grip and on down to the floor side of the hand.
      const dir = { x: along.x * 0.4 + 0.25 * Math.sign(facing || 1), y: Math.max(0.6, along.y) }
      const l = Math.hypot(dir.x, dir.y)
      const d = { x: dir.x / l, y: dir.y / l }
      const top = { x: p.x - d.x * 40 * s, y: p.y - d.y * 40 * s }
      const end = { x: p.x + d.x * 120 * s, y: p.y + d.y * 120 * s }
      pen.line([top, end], outline * 1.1)
      const n = { x: -d.y, y: d.x }
      const bristles = [
        { x: end.x + n.x * 6 * s, y: end.y + n.y * 6 * s },
        { x: end.x - n.x * 6 * s, y: end.y - n.y * 6 * s },
        { x: end.x - n.x * 16 * s + d.x * 34 * s, y: end.y - n.y * 16 * s + d.y * 34 * s },
        { x: end.x + n.x * 16 * s + d.x * 34 * s, y: end.y + n.y * 16 * s + d.y * 34 * s },
      ]
      pen.shape(bristles, held.color, outline)
      return
    }
    case 'parcel': {
      const c = { x: p.x, y: p.y - 6 * s }
      pen.shape(box(c, 50 * s, 40 * s), held.color, outline)
      pen.line([{ x: c.x - 25 * s, y: c.y - 6 * s }, { x: c.x + 25 * s, y: c.y - 6 * s }], Math.max(0.8, outline * 0.7))
      pen.line([{ x: c.x, y: c.y - 20 * s }, { x: c.x, y: c.y + 20 * s }], Math.max(0.8, outline * 0.7))
      return
    }
  }
}

/** Is a held item showing in this pose? (`held.<side>`, shown unless below 0.5) */
export const isHeld = (pose: Pose, side: HoldingSide) => (pose[`held.${side}`] ?? 1) >= 0.5

/** Which way the character faces across the screen, from its turn: +1 toward screen right. */
const facingOf = (turn: number) => Math.sin((turn * Math.PI) / 2)

/** Layers that draw what a character holds, shown or hidden by the pose's `held.*` fields. */
export function holdingLayers(holding: Holding): CharacterLayers {
  const outline = (j: CharacterJoints) => Math.max(1, j.lineWidth * 0.45)
  const one = (side: 'left' | 'right'): CharacterLayer => (_ctx, j, pen, _time, pose) => {
    const held = holding[side]
    if (held && isHeld(pose ?? {}, side)) drawHeldItem(pen, held, handGrip(j, side), j.height, outline(j), facingOf(j.turn), j.head.center.y - j.head.ry)
  }
  const both: CharacterLayer = (_ctx, j, pen, _time, pose) => {
    const held = holding.both
    if (!held || !isHeld(pose ?? {}, 'both')) return
    const left = handGrip(j, 'left')
    const right = handGrip(j, 'right')
    const grip: Grip = {
      point: { x: (left.point.x + right.point.x) / 2, y: (left.point.y + right.point.y) / 2 },
      along: { x: (left.along.x + right.along.x) / 2, y: (left.along.y + right.along.y) / 2 },
      depth: (left.depth + right.depth) / 2,
    }
    drawHeldItem(pen, held, grip, j.height, outline(j), facingOf(j.turn), j.head.center.y - j.head.ry)
  }
  const layers: CharacterLayers = { parts: {} }
  if (holding.left) layers.parts!['arm.left'] = { over: one('left') }
  if (holding.right) layers.parts!['arm.right'] = { over: one('right') }
  if (holding.both) {
    // Between the hands: drawn with whichever arm is nearer, so it goes behind the body with them.
    const nearer = (side: 'left' | 'right'): CharacterLayer => (ctx, j, pen, t, pose) => {
      const other = side === 'left' ? 'right' : 'left'
      const isNearer = side === 'left' ? j.parts['arm.left'].depth >= j.parts['arm.right'].depth : j.parts['arm.right'].depth > j.parts[`arm.${other}`].depth
      if (isNearer) both(ctx, j, pen, t, pose)
    }
    for (const side of ['left', 'right'] as const) layers.parts![`arm.${side}`] = { ...layers.parts![`arm.${side}`], over: chain(layers.parts![`arm.${side}`]?.over, nearer(side)) }
  }
  return layers
}

/** Two layers in turn. */
function chain(a: CharacterLayer | undefined, b: CharacterLayer): CharacterLayer {
  return a ? (ctx, j, pen, t, pose) => { a(ctx, j, pen, t, pose); b(ctx, j, pen, t, pose) } : b
}
