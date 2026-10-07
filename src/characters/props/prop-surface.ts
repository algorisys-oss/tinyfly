import { unknownName } from '../../engine/authoring/did-you-mean'
import { Timeline } from '../../engine/core/timeline'
import type { Track } from '../../engine/types'
import { editLog, type EditOptions } from '../surface/edit-log'
import { pieceMotion, type FlingOptions, type SurfacePiece, type TimedPoint } from '../surface/pieces'
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
  /** A prop has no pieces: this throws */
  piece(anchor: string): SurfacePiece
  /** Change the prop at a time: `set` a control to a value, or `switch` it on (open) or off (shut) */
  edit(name: string, anchor: string | string[], options: SurfaceEditOptions): PropSurface
  follow(piece: SurfacePiece, path: TimedPoint[]): PropSurface
  fling(piece: SurfacePiece, options: FlingOptions): PropSurface
  move(piece: SurfacePiece, options: EditOptions & { to: { x: number; y: number } }): PropSurface
  /** Nothing on a prop carries a figure yet: the tracks come back as they are */
  ride(tracks: Track[], target: string, options: { ground: number; every?: number }): Track[]
  tracks(target: string): Track[]
}

export const PROP_SURFACE: SurfaceAbout = {
  kind: 'prop',
  create: 'propSurface(propTarget({ x, y, prop }), { tracks? }): its controls and anchors are those the catalog lists for its preset',
  anchors: {
    box: 'the prop’s whole box',
    'anchor:NAME': 'one of its rig’s anchors (door, seat, branch, ridge…), as posed at the time',
    'part:ID': 'one of its parts as seen at the time (window-1, door-left, wheel-0-left…)',
    'control:NAME': 'where the parts a control moves or lights are (control:door is the doors, control:lights the lamps)',
  },
  edits: {
    set: 'control anchors; { at, value, duration? }: move a control to a value',
    switch: 'control anchors; { at, on?, duration? }: a control to its full value (open, on), or back to its rest value with on: false',
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

  const place = (name: string, time: number): SurfaceBox => {
    const parsed = named(name)
    const { values, origin } = stateAt(time)
    if (parsed.kind === 'box') return surfaceBox(origin.x - target.width / 2, origin.y - target.height, target.width, target.height)
    const solved = solveAt(prop, values, target.propScale)
    if (parsed.kind === 'anchor') {
      const point = solved.anchors[parsed.name].point
      const size = ANCHOR_SIZE * target.propScale
      return surfaceBox(origin.x + point.x - size / 2, origin.y + point.y - size / 2, size, size)
    }
    if (parsed.kind === 'part') return partsBox(new Set([parsed.name]), `part "${parsed.name}" is`)
    const ids = partsOf(parsed.name)
    if (ids.size === 0) throw new Error(`${prop.kind}: control "${parsed.name}" moves no parts of its own (it moves the whole ${prop.kind}): aim at box`)
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
      throw new Error(`${prop.kind}: a prop has no pieces to come loose ("${name}"); change it with edit('set' | 'switch', 'control:NAME', …)`)
    },
    edit(name, anchors, edit) {
      if (!(name in PROP_SURFACE.edits)) throw editError(prop.kind, name, PROP_SURFACE)
      const list = Array.isArray(anchors) ? anchors : [anchors]
      if (list.length === 0) throw new Error(`${prop.kind}.edit: ${name} takes at least one control anchor`)
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
      motion.follow(piece, path)
      return self
    },
    fling(piece, fling) {
      motion.fling(piece, fling)
      return self
    },
    move(piece, edit) {
      motion.move(piece, edit)
      return self
    },
    ride(tracks) {
      return tracks
    },
    tracks: log.tracks,
  }
  return self
}
