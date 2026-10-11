import { unknownName } from '../../engine/authoring/did-you-mean'
import { Timeline } from '../../engine/core/timeline'
import type { Track } from '../../engine/types'
import { changingWindows, editLog, type EditKey, type EditOptions } from '../surface/edit-log'
import { pieceMotion, SAMPLE_STEP, type FlingOptions, type SurfacePiece, type TimedPoint } from '../surface/pieces'
import { rideFloors, type Floor } from '../surface/ride'
import { anchorError, editError, parseAnchor, type Surface, type SurfaceAbout, type SurfaceEditOptions } from '../surface/surface'
import { surfaceBox, type SurfaceBox } from '../surface/surface-box'
import { propControls, solveAt, type PropTarget } from './target'

/**
 * A prop as a surface: its state is something a figure changes. A figure
 * opens the car's door, switches the house's lights on, shakes the tree.
 *
 * ```ts
 * const car = propTarget({ x: 300, y: 380, prop: carPreset() })
 * const carSurface = propSurface(car)
 * carSurface.anchor('control:door')                 // where the door is
 * carSurface.edit('switch', 'control:door', { at: 1200 })            // opens it
 * carSurface.edit('switch', 'control:lights', { at: 2000, on: false })
 *
 * surfaceScript('hero', { car: carSurface }, [
 *   { do: 'grab', target: { surface: 'car', anchor: 'control:door' },
 *     then: { surface: 'car', edit: 'switch', anchor: 'control:door', until: 'end' } },
 * ])
 * ```
 *
 * Its places: `anchor:NAME` (one of the rig's anchors, as posed),
 * `part:ID` (one of its parts, as seen: `window-1`, `wheel-0-left`),
 * `control:NAME` (where the parts that control moves or lights are), and
 * `box`. They are worked out at a time from the prop's values then: its
 * starting values, the edits made here, and the prop's own tracks when it is
 * scripted too (`tracks`, from its `propScript`), so the places follow a car
 * that drives off. Edits are keys on its controls, written out by `tracks()`
 * on the prop target's id. Do not key a control both here and in its own
 * script: the later track wins.
 *
 * A part can come loose: `piece('part:wheel-0-left')` makes it a piece that
 * `fling`, `follow` and `move` carry off (or the `fling` and `move` edits),
 * drawn where it went. Every anchor and part is a floor: a figure standing
 * on the roof (`onto: { surface, anchor: 'anchor:roof' }`) is carried with
 * it as the prop lifts, drives or is squashed (`ride()`).
 */
export interface PropSurfaceOptions {
  /** The prop's own tracks (its `propScript` result), so its places follow it as it moves */
  tracks?: Track[]
}

export interface PropSurface extends Surface {
  readonly kind: 'prop'
  readonly prop: PropTarget
  /** The box at a named place, at `time` (default: after every edit): `box`, `anchor:NAME`, `part:ID`, `control:NAME` */
  anchor(name: string, time?: number): SurfaceBox
  /** Make the part at a `part:` place a piece that can come loose (with the parts built on it: a wheel and its hub) */
  piece(anchor: string): PropPiece
  /** Change the prop at a time: `set` a control to a value, or `switch` it on (open) or off (shut) */
  edit(name: string, anchor: string | string[], options: SurfaceEditOptions): PropSurface
  follow(piece: SurfacePiece, path: TimedPoint[]): PropSurface
  fling(piece: SurfacePiece, options: FlingOptions): PropSurface
  move(piece: SurfacePiece, options: EditOptions & { to: { x: number; y: number } }): PropSurface
  /** A figure's tracks with it carried by the anchor or part it stands on, as the prop moves */
  ride(tracks: Track[], target: string, options: { ground: number; every?: number }): Track[]
  tracks(target: string): Track[]
}

/** A part of a prop that has come loose. */
export interface PropPiece extends SurfacePiece {
  /** The part's id */
  readonly part: string
}

export const PROP_SURFACE: SurfaceAbout = {
  kind: 'prop',
  create: 'propSurface(propTarget({ x, y, prop }), { tracks? }): its controls and anchors are those the catalog lists for its preset',
  anchors: {
    box: 'the prop’s whole box',
    'anchor:NAME': 'one of its rig’s anchors (door, seat, branch, ridge…), as posed at the time',
    'part:ID': 'one of its parts as seen at the time (window-1, door-left, wheel-0-left…); it can come loose as a piece',
    'control:NAME': 'where the parts a control moves or lights are (control:door is the doors, control:lights the lamps; a control of the whole prop, like lift, is its box)',
  },
  edits: {
    set: 'control anchors; { at, value, duration? }: move a control to a value',
    switch: 'control anchors; { at, on?, duration? }: a control to its full value (open, on), or back to its rest value with on: false',
    move: 'a part; { at, to: an anchor name or { x, y }, duration? }: carry the part there, loose',
    fling: 'a part; { at, velocity?, spin?, gravity?, duration? }: knock the part off on a spinning arc',
  },
}

/** How long an edit takes by default, ms; and the size of an anchor's box, metres. */
const EDIT_DURATION = 400
const ANCHOR_SIZE = 0.2

type PropPlace = { kind: 'box' } | { kind: 'anchor' | 'part' | 'control'; name: string }

export function propSurface(target: PropTarget, options: PropSurfaceOptions = {}): PropSurface {
  const { prop } = target
  const controls = propControls(prop)
  const controlNames = Object.keys(controls)
  const anchorNames = Object.keys(prop.rig.anchors ?? {})
  const partIds = prop.rig.parts.map((part) => part.id)
  const log = editLog()
  const motion = pieceMotion(log)
  const own = options.tracks?.length ? new Timeline({ id: `${prop.kind}-surface`, tracks: options.tracks }) : undefined
  const ownEnd = Math.max(0, ...(options.tracks ?? []).flatMap((track) => track.keyframes.map((key) => key.time)))
  // Parts that have come loose, by part id; the target draws them where they went.
  const pieces = new Map<string, PropPiece>()
  const loose = new Map<string, number>()
  ;(target as { loose?: Map<string, number> }).loose = loose
  const props = target.props as Record<string, number>

  /** Its control values and how far it has moved, at `time`. */
  const stateAt = (time: number) => {
    const values = { ...(target.props as Record<string, number>) }
    let dx = 0
    let dy = 0
    if (own) {
      const state = own.getStateAtTime(Math.min(time, ownEnd))
      for (const map of state.values.values()) {
        for (const [property, value] of map) {
          if (typeof value !== 'number') continue
          if (property === 'x') dx = value
          else if (property === 'y') dy = value
          else if (property in values) values[property] = value
        }
      }
    }
    for (const name of controlNames) if (log.keys(name)?.length) values[name] = log.valueAt(name, time)
    return { values, origin: { x: target.x + target.width / 2 + dx, y: target.y + target.height + dy } }
  }

  const named = (name: string): PropPlace => {
    const { kind, rest } = parseAnchor(name)
    const fail = (why?: string) => anchorError(prop.kind, name, PROP_SURFACE, why)
    if (kind === 'box') {
      if (rest) throw fail('box takes no arguments')
      return { kind }
    }
    if (kind === 'anchor') {
      if (!anchorNames.includes(rest)) throw fail(unknownName(`${prop.kind} anchor`, rest, anchorNames))
      return { kind, name: rest }
    }
    if (kind === 'part') {
      if (!partIds.includes(rest)) throw fail(unknownName(`${prop.kind} part`, rest, partIds))
      return { kind, name: rest }
    }
    if (kind === 'control') {
      if (!controlNames.includes(rest)) throw fail(unknownName(`${prop.kind} control`, rest, controlNames))
      return { kind, name: rest }
    }
    throw fail()
  }

  /** The parts a control moves (its bindings) or lights (their glow). */
  const partsOf = (control: string) => {
    const bound = (prop.rig.controls[control]?.bind ?? []).flatMap((binding) => binding.parts)
    const lit = prop.rig.parts.filter((part) => part.glow?.control === control).map((part) => part.id)
    return new Set([...bound, ...lit])
  }

  /** The prop solved at a time, kept while nothing changes (a ride samples many places at the same times). */
  const solvedFrames = new Map<number, ReturnType<typeof stateAt> & { solved: ReturnType<typeof solveAt> }>()
  const frameAt = (time: number) => {
    let frame = solvedFrames.get(time)
    if (!frame) {
      const state = stateAt(time)
      solvedFrames.set(time, (frame = { ...state, solved: solveAt(prop, state.values, target.propScale) }))
    }
    return frame
  }

  const place = (name: string, time: number): SurfaceBox => {
    const parsed = named(name)
    const { values: _values, origin, solved } = frameAt(time)
    if (parsed.kind === 'box') return surfaceBox(origin.x - target.width / 2, origin.y - target.height, target.width, target.height)
    if (parsed.kind === 'anchor') {
      const point = solved.anchors[parsed.name].point
      const size = ANCHOR_SIZE * target.propScale
      return surfaceBox(origin.x + point.x - size / 2, origin.y + point.y - size / 2, size, size)
    }
    if (parsed.kind === 'part') return partsBox(new Set([parsed.name]), `part "${parsed.name}" is`)
    const ids = partsOf(parsed.name)
    // A control that moves the whole prop (turn, lift, squash…) is the whole prop.
    if (ids.size === 0) return surfaceBox(origin.x - target.width / 2, origin.y - target.height, target.width, target.height)
    return partsBox(ids, `the parts control "${parsed.name}" moves are`)

    /** The box round these parts as seen, scene px. */
    function partsBox(ids: Set<string>, what: string): SurfaceBox {
      const points = [...solved.under, ...solved.over].filter((part) => ids.has(part.part.id)).flatMap((part) => part.faces.flatMap((face) => face.points))
      if (points.length === 0) {
        const when = Number.isFinite(time) ? `at ${time} ms` : 'after its edits'
        throw new Error(`${prop.kind}: ${what} turned away from the viewer ${when}; aim at an anchor (${anchorNames.map((n) => `anchor:${n}`).join(', ') || 'none'}) or box`)
      }
      const xs = points.map((p) => p.x)
      const ys = points.map((p) => p.y)
      const left = Math.min(...xs)
      const top = Math.min(...ys)
      return surfaceBox(origin.x + left, origin.y + top, Math.max(...xs) - left, Math.max(...ys) - top)
    }
  }

  /** A place, or nothing when it is turned away at that time. */
  const tryPlace = (name: string, time: number): SurfaceBox | undefined => {
    try {
      return place(name, time)
    } catch {
      return undefined
    }
  }

  const self: PropSurface = {
    kind: 'prop',
    prop: target,
    about: PROP_SURFACE,
    target,
    box: surfaceBox(target.x, target.y, target.width, target.height),
    anchor(name, time = Infinity) {
      return place(name, time)
    },
    piece(name) {
      const parsed = named(name)
      if (parsed.kind !== 'part') throw new Error(`${prop.kind}: a piece is a part, part:ID (${partIds.slice(0, 6).map((id) => `part:${id}`).join(', ')}…), not "${name}"`)
      const existing = pieces.get(parsed.name)
      if (existing) return existing
      // The part and everything built on it (a wheel and its hub) come loose together.
      const family = [parsed.name]
      for (let i = 0; i < family.length; i++) for (const part of prop.rig.parts) if (part.parent === family[i] && !family.includes(part.id)) family.push(part.id)
      const piece: PropPiece = { id: pieces.size + 1, part: parsed.name, home: place(name, 0) }
      pieces.set(parsed.name, piece)
      for (const id of family) loose.set(id, piece.id)
      for (const field of ['x', 'y', 'rotate']) props[`piece.${piece.id}.${field}`] = 0
      props[`piece.${piece.id}.opacity`] = 1
      return piece
    },
    edit(name, anchors, edit) {
      if (!(name in PROP_SURFACE.edits)) throw editError(prop.kind, name, PROP_SURFACE)
      const list = Array.isArray(anchors) ? anchors : [anchors]
      if (list.length === 0) throw new Error(`${prop.kind}.edit: ${name} takes at least one anchor`)
      solvedFrames.clear()
      if (name === 'move' || name === 'fling') {
        if (list.length > 1) throw new Error(`${prop.kind}.edit: ${name} takes one part anchor`)
        const piece = self.piece(list[0])
        if (name === 'fling') return self.fling(piece, edit as unknown as FlingOptions)
        const to = edit.to as string | { x: number; y: number } | undefined
        if (!to) throw new Error(`${prop.kind}.edit: move needs \`to\`, an anchor name or { x, y }`)
        const box = typeof to === 'string' ? place(to, edit.at) : undefined
        return self.move(piece, { ...edit, to: box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : (to as { x: number; y: number }) })
      }
      for (const anchor of list) {
        const parsed = named(anchor)
        if (parsed.kind !== 'control') throw new Error(`${prop.kind}.edit: ${name} takes control anchors (control:${controlNames.join(', control:')}), not "${anchor}"`)
        const spec = controls[parsed.name]
        let value: number
        if (name === 'set') {
          if (typeof edit.value !== 'number' || !Number.isFinite(edit.value)) throw new Error(`${prop.kind}.edit: set needs \`value\`, a number (${parsed.name}: ${spec.description})`)
          value = edit.value
        } else {
          value = edit.on === false ? (spec.default ?? spec.min ?? 0) : (spec.max ?? 1)
        }
        log.tween(parsed.name, stateAt(edit.at).values[parsed.name], value, edit, EDIT_DURATION)
      }
      return self
    },
    follow(piece, path) {
      solvedFrames.clear()
      motion.follow(piece, path)
      return self
    },
    fling(piece, fling) {
      solvedFrames.clear()
      motion.fling(piece, fling)
      return self
    },
    move(piece, edit) {
      solvedFrames.clear()
      motion.move(piece, edit)
      return self
    },
    ride(tracks, figure, ride) {
      // When the prop moves at all: its own tracks and the edits made here.
      const windows = [
        ...controlNames.flatMap((name) => changingWindows(log.keys(name))),
        ...(options.tracks ?? []).flatMap((track) => changingWindows(track.keyframes.filter((key) => typeof key.value === 'number') as EditKey[])),
      ]
      if (windows.length === 0) return tracks
      // Every anchor and part is a floor: where it is as laid out, and how far it has moved since.
      const floors: Floor[] = [...anchorNames.map((name) => `anchor:${name}`), ...partIds.map((id) => `part:${id}`)].flatMap((name) => {
        const start = tryPlace(name, 0)
        if (!start) return []
        return [{ top: start.top, offset: (time: number) => (tryPlace(name, time)?.top ?? start.top) - start.top, windows }]
      })
      return rideFloors(tracks, figure, { ground: ride.ground, every: ride.every ?? SAMPLE_STEP, floors })
    },
    tracks: log.tracks,
  }
  return self
}
