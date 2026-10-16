import { unknownName } from '../../engine/authoring/did-you-mean'
import type { AnimatableValue, EasingType, Track } from '../../engine/types'
import type { MathFigureSpec } from '../figure/figure-spec'
import type { Shape } from '../figure/display-list'
import { layoutFigure, type MathProps } from '../figure/layout-figure'
import { validateMathFigure } from '../figure/validate-spec'
import { mathTarget, type MathCanvasTarget } from '../targets/math-target'

/**
 * A maths figure as a surface figures act on, the way a code panel or a
 * whiteboard is one: its places have names, so a beat can point at them as
 * plain data, and its edits are recorded on the figure's own props.
 *
 *     const fig = mathSurface(linearMapFigure(), { x: 40, y: 40 })
 *     surfaceScript('teacher', { fig }, [
 *       { do: 'point', target: { surface: 'fig', anchor: 'tip:basis.i' }, say: 'î lands here',
 *         then: { surface: 'fig', edit: 'set', anchor: 'value:M', value: [2, 1, 0, 1] } },
 *     ], { from: 640, ground: 400 })
 *
 * It has the shape of the characters module's Surface without importing it,
 * so the maths module stays independent of characters. Parts of a figure do
 * not come loose: `piece`, `follow`, `fling` and `move` say so.
 */
export interface MathSurfaceBox {
  x: number
  y: number
  left: number
  right: number
  top: number
  bottom: number
  width: number
  height: number
}

export interface MathSurfaceEdit {
  /** When, ms */
  at: number
  duration?: number
  easing?: EasingType
  /** `set`: the new value (a number, [x, y] or [a, b, c, d]); `step`: the equation step */
  value?: number | number[]
  to?: number
}

export interface MathSurface {
  readonly kind: 'math'
  readonly target: MathCanvasTarget
  readonly box: MathSurfaceBox
  readonly about: { kind: string; create: string; anchors: Record<string, string>; edits: Record<string, string> }
  /** The box round a named place, scene px, as the figure is at `time` (default after every edit) */
  anchor(name: string, time?: number): MathSurfaceBox
  /** Change the figure at a time (see `about.edits`) */
  edit(name: string, anchor: string | string[], options: MathSurfaceEdit): MathSurface
  piece(anchor: string): never
  follow(): never
  fling(): never
  move(): never
  /** Figures standing on a maths figure are not carried: their tracks come back as they are */
  ride(tracks: Track[], target: string, options: { ground: number; every?: number }): Track[]
  /** The recorded edits as tracks on `target` (the figure's key in the scene) */
  tracks(target: string): Track[]
}

export const MATH_SURFACE: MathSurface['about'] = {
  kind: 'math',
  create: 'mathSurface(figure, { x, y })',
  anchors: {
    box: 'the whole figure',
    'item:ID': 'everything an item draws',
    'tip:ID': 'the tip of a vector (tip:basis.i, tip:basis.j for î and ĵ)',
    'point:ID': 'a point (also a point riding a curve)',
    'node:GRAPH:NODE': 'a node of a graph item',
    'term:ID:TEXT': 'glyphs of an equation or label, matched by their text (term:eq:2x, term:eq#2:x for the second)',
    'value:NAME': 'a value of the figure (for the set edit; the box is the whole figure)',
  },
  edits: {
    drawOn: 'item:ID — draws the item on (default 900 ms)',
    erase: 'item:ID — undraws it (default 600 ms)',
    show: 'item:ID — fades it in (default 500 ms)',
    hide: 'item:ID — fades it out (default 500 ms)',
    step: 'item:ID of an equation, { to } — moves to that step, terms gliding (default 900 ms)',
    set: 'value:NAME, { value } — tweens a value: a number, [x, y] or [a, b, c, d] (default 1200 ms)',
  },
}

type Key = { time: number; value: AnimatableValue; easing?: EasingType }

const mix = (a: AnimatableValue, b: AnimatableValue, t: number): AnimatableValue => {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * t
  if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => v + ((b[i] ?? v) - v) * t)
  return t < 1 ? a : b
}

/** A recorded prop's value at `time`: linear between keys, held outside them. */
function valueAt(keys: Key[], time: number): AnimatableValue {
  const sorted = [...keys].sort((a, b) => a.time - b.time)
  if (time <= sorted[0].time) return sorted[0].value
  for (let i = 1; i < sorted.length; i++) {
    if (time <= sorted[i].time) {
      const a = sorted[i - 1]
      const b = sorted[i]
      return b.time === a.time ? b.value : mix(a.value, b.value, (time - a.time) / (b.time - a.time))
    }
  }
  return sorted[sorted.length - 1].value
}

/** The box round some shapes, figure px. */
function boundsOf(shapes: Shape[]): { left: number; top: number; right: number; bottom: number } | undefined {
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity
  const take = (x: number, y: number) => {
    left = Math.min(left, x)
    right = Math.max(right, x)
    top = Math.min(top, y)
    bottom = Math.max(bottom, y)
  }
  for (const shape of shapes) {
    if (shape.type === 'line' || shape.type === 'arrow') shape.points.forEach(([x, y]) => take(x, y))
    else if (shape.type === 'circle') {
      take(shape.x - shape.r, shape.y - shape.r)
      take(shape.x + shape.r, shape.y + shape.r)
    } else {
      // Text has no measured width here; glyphs average about half their size.
      const width = shape.size * 0.55 * shape.text.length
      const x0 = shape.align === 'center' ? shape.x - width / 2 : shape.align === 'right' ? shape.x - width : shape.x
      take(x0, shape.y - shape.size * 0.75)
      take(x0 + width, shape.y + shape.size * 0.25)
    }
  }
  return Number.isFinite(left) ? { left, top, right, bottom } : undefined
}

/** How typed text and drawn glyphs compare: no spaces, and the ASCII minus as the maths one. */
const normalise = (text: string) => text.replace(/\s+/g, '').replace(/-/g, '−').replace(/\*/g, '∗')

/** A maths figure placed at `x`, `y` (its top-left corner, scene px) as a surface. */
export function mathSurface(figure: MathFigureSpec, place: { x?: number; y?: number } = {}): MathSurface {
  validateMathFigure(figure)
  const x0 = place.x ?? 0
  const y0 = place.y ?? 0
  const target = mathTarget(figure, { x: x0, y: y0 })
  const keys = new Map<string, Key[]>()
  const itemIds = figure.items.map((item) => item.id)
  const scene = (b: { left: number; top: number; right: number; bottom: number }): MathSurfaceBox => ({
    left: x0 + b.left, top: y0 + b.top, right: x0 + b.right, bottom: y0 + b.bottom,
    width: b.right - b.left, height: b.bottom - b.top, x: x0 + (b.left + b.right) / 2, y: y0 + (b.top + b.bottom) / 2,
  })
  const whole = scene({ left: 0, top: 0, right: figure.width, bottom: figure.height })

  /** What a prop starts as: its value, or an item's draw / opacity / step. */
  const initial = (prop: string): AnimatableValue => {
    if (!prop.includes('.')) {
      const value = figure.values?.[prop]
      if (value === undefined) throw new Error(`mathSurface: ${unknownName('value', prop, Object.keys(figure.values ?? {}))}`)
      return value
    }
    const [id, field] = prop.split('.')
    const item = figure.items.find((i) => i.id === id)!
    if (field === 'step') return item.kind === 'equation' ? item.step ?? 0 : 0
    return (item as { draw?: number; opacity?: number })[field as 'draw' | 'opacity'] ?? 1
  }
  const at = (prop: string, time: number): AnimatableValue => {
    const list = keys.get(prop)
    return list?.length ? valueAt(list, time) : initial(prop)
  }
  const tween = (prop: string, to: AnimatableValue, edit: MathSurfaceEdit, duration: number) => {
    const from = at(prop, edit.at)
    keys.set(prop, [...(keys.get(prop) ?? []), { time: edit.at, value: from }, { time: edit.at + (edit.duration ?? duration), value: to, ...(edit.easing ? { easing: edit.easing } : {}) }])
  }
  const propsAt = (time: number): MathProps => {
    const props: MathProps = {}
    for (const prop of keys.keys()) props[prop] = at(prop, time) as number | number[]
    return props
  }
  const itemOf = (name: string, rest: string) => {
    // The item is the first part: basis.i is part of the item basis.
    const id = rest.split(':')[0].split('#')[0].split('.')[0]
    if (!itemIds.includes(id)) throw new Error(`mathSurface: ${name}: ${unknownName('item', id, itemIds)}`)
    return id
  }

  const surface: MathSurface = {
    kind: 'math',
    target,
    box: whole,
    about: MATH_SURFACE,
    anchor(name, time = Infinity) {
      const colon = name.indexOf(':')
      const kind = colon < 0 ? name : name.slice(0, colon)
      const rest = colon < 0 ? '' : name.slice(colon + 1)
      if (kind === 'box' || kind === 'value') return whole
      if (!(['item', 'tip', 'point', 'node', 'term'] as string[]).includes(kind)) {
        throw new Error(`mathSurface: ${unknownName('anchor', kind, Object.keys(MATH_SURFACE.anchors).map((a) => a.split(':')[0]))}`)
      }
      const shapes = layoutFigure(figure, propsAt(time)).shapes
      const under = (prefix: string) => shapes.filter((s) => s.id === prefix || s.id.startsWith(`${prefix}.`))
      let found: Shape[] = []
      if (kind === 'item') found = under(itemOf(name, rest))
      else if (kind === 'tip') {
        // A vector's arrow (or î / ĵ of a basis): a small box round its tip.
        itemOf(name, rest)
        const arrow = shapes.find((s) => s.type === 'arrow' && (s.id === rest || s.id === `${rest}.0`))
        if (!arrow || arrow.type !== 'arrow') throw new Error(`mathSurface: no vector at "${name}" (a vector item id, or basis.i / basis.j)`)
        const [tx, ty] = arrow.points[arrow.points.length - 1]
        const r = arrow.width * 2.5
        return scene({ left: tx - r, top: ty - r, right: tx + r, bottom: ty + r })
      } else if (kind === 'point') found = shapes.filter((s) => s.id === itemOf(name, rest) && s.type === 'circle')
      else if (kind === 'node') {
        const [graph, node] = rest.split(':')
        itemOf(name, graph)
        found = shapes.filter((s) => s.id === `${graph}.node.${node}`)
      } else {
        // term:ID:TEXT or term:ID#K:TEXT — consecutive glyphs whose text matches.
        const match = /^([^:#]+)(?:#(\d+))?:(.+)$/.exec(rest)
        if (!match) throw new Error(`mathSurface: "${name}" should be term:ID:TEXT`)
        const [, id, nth, text] = match
        itemOf(name, id)
        const glyphs = under(id).filter((s): s is Extract<Shape, { type: 'text' }> => s.type === 'text' && !s.id.includes('.backdrop'))
        const wanted = normalise(text)
        const joined = glyphs.map((g) => normalise(g.text)).join('')
        let from = -1
        for (let k = 0, start = 0; k < Number(nth ?? 1); k++, start = from + 1) {
          from = joined.indexOf(wanted, start)
          if (from < 0) break
        }
        if (from < 0) throw new Error(`mathSurface: no "${text}" in ${id} (it reads "${joined}")`)
        // Map character offsets back to glyphs.
        let offset = 0
        found = glyphs.filter((g) => {
          const length = normalise(g.text).length
          const inside = offset < from + wanted.length && offset + length > from
          offset += length
          return inside
        })
      }
      const bounds = boundsOf(found)
      if (!bounds) throw new Error(`mathSurface: "${name}" is not drawn at ${time === Infinity ? 'the end' : `${time} ms`}`)
      return scene(bounds)
    },
    edit(name, anchors, edit) {
      if (!(name in MATH_SURFACE.edits)) throw new Error(`mathSurface.edit: ${unknownName('edit', name, Object.keys(MATH_SURFACE.edits))}`)
      for (const anchor of Array.isArray(anchors) ? anchors : [anchors]) {
        const [kind, rest = ''] = [anchor.slice(0, anchor.indexOf(':')), anchor.slice(anchor.indexOf(':') + 1)]
        if (name === 'set') {
          if (kind !== 'value') throw new Error(`mathSurface.edit: set takes value:NAME, not "${anchor}"`)
          if (edit.value === undefined) throw new Error('mathSurface.edit: set needs `value`')
          initial(rest)
          tween(rest, edit.value, edit, 1200)
          continue
        }
        if (kind !== 'item') throw new Error(`mathSurface.edit: ${name} takes item:ID, not "${anchor}"`)
        const id = itemOf(anchor, rest)
        if (name === 'drawOn') tween(`${id}.draw`, 1, edit, 900)
        else if (name === 'erase') tween(`${id}.draw`, 0, edit, 600)
        else if (name === 'show') tween(`${id}.opacity`, 1, edit, 500)
        else if (name === 'hide') tween(`${id}.opacity`, 0, edit, 500)
        else {
          if (typeof edit.to !== 'number') throw new Error('mathSurface.edit: step needs `to`, the step number')
          tween(`${id}.step`, edit.to, edit, 900)
        }
      }
      return surface
    },
    piece(anchor): never {
      throw new Error(`mathSurface: parts of a figure do not come loose ("${anchor}"); change it with edits (${Object.keys(MATH_SURFACE.edits).join(', ')})`)
    },
    follow(): never {
      throw new Error('mathSurface: parts of a figure do not come loose; use edits instead')
    },
    fling(): never {
      throw new Error('mathSurface: parts of a figure do not come loose; use edits instead')
    },
    move(): never {
      throw new Error('mathSurface: parts of a figure do not come loose; use edits instead')
    },
    ride: (tracks) => tracks,
    tracks(name) {
      return [...keys].map(([property, list]) => ({
        id: `${name}-${property}`,
        target: name,
        property,
        keyframes: [...list].sort((a, b) => a.time - b.time).map((k) => ({ time: k.time, value: k.value, ...(k.easing ? { easing: k.easing } : {}) })),
      }))
    },
  }
  return surface
}
