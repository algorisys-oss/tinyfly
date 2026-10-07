import type { AnimatableValue, Track } from '../../engine/types'
import { unknownName } from '../../engine/authoring/did-you-mean'
import type { CanvasTarget, CustomTarget } from './canvas-adapter'

/**
 * What can be animated on a canvas target, said as data: each property with
 * what it does, its unit and range, and which target types have it. Code (or
 * a language model) can ask a target what it supports with `describeTarget`,
 * and check tracks against their targets with `checkTracks` before playing
 * them, instead of finding out from a figure that does not move.
 */

export type CanvasTargetType = CanvasTarget['type']

/** One animatable property. */
export interface PropertyInfo {
  description: string
  /** What a value is: a number (most), a colour, a string, or a list */
  kind?: 'number' | 'color' | 'string' | 'list'
  /** px, degrees, ms, 0..1, … */
  unit?: string
  min?: number
  max?: number
}

/** What a custom target says about itself: what it is, its props and what it can do. */
export interface TargetAbout {
  /** A short name for what it is: `stick figure`, `code panel` */
  kind: string
  summary: string
  /** Its props, described (props it does not describe are still listed, without a description) */
  props?: Record<string, PropertyInfo>
  /** What it can do, by name, with a line each (a stick figure's beat actions) */
  actions?: Record<string, string>
}

const ALL: readonly CanvasTargetType[] = ['rect', 'circle', 'text', 'line', 'path', 'image', 'custom']
const OUTLINED: readonly CanvasTargetType[] = ['rect', 'circle', 'line', 'path']

/** Every property a canvas target can animate, and the types that have it. */
export const CANVAS_PROPERTIES: Record<string, PropertyInfo & { types: readonly CanvasTargetType[] }> = {
  x: { description: 'Moves it right by this much from where it was placed (an offset; the target’s own x is its place)', unit: 'px', types: ALL },
  y: { description: 'Moves it down by this much from where it was placed (an offset)', unit: 'px', types: ALL },
  opacity: { description: 'How opaque it is', unit: '0..1', min: 0, max: 1, types: ALL },
  rotate: { description: 'Turns it clockwise about its origin', unit: 'degrees', types: ALL },
  rotateX: { description: 'Tips it about the horizontal axis (3D; shows with perspective)', unit: 'degrees', types: ALL },
  rotateY: { description: 'Turns it about the vertical axis (3D; shows with perspective)', unit: 'degrees', types: ALL },
  z: { description: 'Depth toward the viewer (shows with perspective)', unit: 'px', types: ALL },
  perspective: { description: 'Distance from the viewer: nearer parts grow, further ones shrink', unit: 'px', min: 1, types: ALL },
  scale: { description: 'Size, both ways', unit: 'factor', types: ALL },
  scaleX: { description: 'Width factor', unit: 'factor', types: ALL },
  scaleY: { description: 'Height factor', unit: 'factor', types: ALL },
  skewX: { description: 'Slants it sideways', unit: 'degrees', types: ALL },
  skewY: { description: 'Slants it up and down', unit: 'degrees', types: ALL },
  originX: { description: 'Transform pivot across its box', unit: '% (0 left, 50 centre, 100 right)', min: 0, max: 100, types: ALL },
  originY: { description: 'Transform pivot down its box', unit: '% (0 top, 50 centre, 100 bottom)', min: 0, max: 100, types: ALL },
  fill: { description: 'Fill colour (also written fillStyle)', kind: 'color', types: ALL },
  stroke: { description: 'Outline colour (also written strokeStyle)', kind: 'color', types: ALL },
  strokeWidth: { description: 'Outline width (also written lineWidth)', unit: 'px', min: 0, types: ALL },
  clipTop: { description: 'Hides this much from the top edge, for reveals', unit: '% of its height', min: 0, max: 100, types: ALL },
  clipRight: { description: 'Hides this much from the right edge', unit: '% of its width', min: 0, max: 100, types: ALL },
  clipBottom: { description: 'Hides this much from the bottom edge', unit: '% of its height', min: 0, max: 100, types: ALL },
  clipLeft: { description: 'Hides this much from the left edge', unit: '% of its width', min: 0, max: 100, types: ALL },
  blur: { description: 'Gaussian blur', unit: 'px', min: 0, types: ALL },
  brightness: { description: 'Brightness factor (1 unchanged)', unit: 'factor', min: 0, types: ALL },
  glow: { description: 'Soft glow around it, in glowColor', unit: 'px', min: 0, types: ALL },
  glowColor: { description: 'Colour of the glow', kind: 'color', types: ALL },
  shadowX: { description: 'Drop shadow offset right', unit: 'px', types: ALL },
  shadowY: { description: 'Drop shadow offset down', unit: 'px', types: ALL },
  shadowBlur: { description: 'Drop shadow softness', unit: 'px', min: 0, types: ALL },
  shadowColor: { description: 'Drop shadow colour', kind: 'color', types: ALL },
  shine: { description: 'A highlight sweeping across the fill', unit: '0..1 (progress)', min: 0, max: 1, types: ALL },
  drawOn: { description: 'How much of the outline is drawn, for drawing a shape on; the fill appears when it is complete', unit: '0..1', min: 0, max: 1, types: OUTLINED },
  width: { description: 'Box width', unit: 'px', min: 0, types: ['rect', 'image'] },
  height: { description: 'Box height', unit: 'px', min: 0, types: ['rect', 'image'] },
  borderRadius: { description: 'Rounded corners', unit: 'px', min: 0, types: ['rect', 'image'] },
  radius: { description: 'Circle radius', unit: 'px', min: 0, types: ['circle'] },
  x2: { description: 'Line end, x', unit: 'px', types: ['line'] },
  y2: { description: 'Line end, y', unit: 'px', types: ['line'] },
  d: { description: 'SVG path data; tween between paths to morph', kind: 'string', types: ['path'] },
  text: { description: 'The text shown (a text track types or scrambles it)', kind: 'string', types: ['text'] },
  fontSize: { description: 'Font size', unit: 'px', min: 0, types: ['text'] },
  fontWeight: { description: 'Font weight', unit: '100..900', min: 100, max: 900, types: ['text'] },
  motionPath: { description: 'Moves it along an SVG path (a motion-path track writes motionPathX/Y and, aligned, rotate)', kind: 'string', types: ALL },
  quaternion: { description: 'A rotation as [x, y, z, w] (a track with interpolation: "slerp")', kind: 'list', types: ALL },
}

/** Alternative spellings the canvas adapter accepts, and what they mean. */
const ALIASES: Record<string, string> = { fillStyle: 'fill', strokeStyle: 'stroke', lineWidth: 'strokeWidth', rotateZ: 'rotate', motionPathX: 'x', motionPathY: 'y', motionPathRotate: 'rotate' }

/** Wrong names people reach for, and what they meant. */
const PROPERTY_HINTS: Record<string, string> = {
  rotation: 'rotate',
  angle: 'rotate',
  alpha: 'opacity',
  fade: 'opacity',
  color: 'fill',
  colour: 'fill',
  background: 'fill',
  size: 'scale',
  left: 'x',
  top: 'y',
  translateX: 'x',
  translateY: 'y',
  r: 'radius',
  path: 'd',
  content: 'text',
}

export interface TargetDescription {
  type: CanvasTargetType
  /** For a custom target that says (`about`): what it is, and a line about it */
  kind?: string
  summary?: string
  /** Everything a track can animate on it, with its value now */
  properties: Array<PropertyInfo & { name: string; value?: AnimatableValue }>
  /** What it can do, when it says (a stick figure's actions) */
  actions?: Record<string, string>
}

/**
 * What a target can animate: the canvas properties of its type with their
 * current values, then (for a custom target) its own props, described when
 * the target says what they are, and what it can do.
 */
export function describeTarget(target: CanvasTarget): TargetDescription {
  const own = target as unknown as Record<string, AnimatableValue>
  const properties: TargetDescription['properties'] = Object.entries(CANVAS_PROPERTIES)
    .filter(([, info]) => info.types.includes(target.type))
    .map(([name, { types: _types, ...info }]) => ({ name, ...info, ...(own[name] !== undefined && typeof own[name] !== 'object' ? { value: own[name] } : {}) }))
  if (target.type !== 'custom') return { type: target.type, properties }
  const about = (target as CustomTarget).about
  for (const [name, value] of Object.entries(target.props ?? {})) {
    properties.push({ name, description: about?.props?.[name]?.description ?? '', ...about?.props?.[name], value })
  }
  return { type: 'custom', ...(about ? { kind: about.kind, summary: about.summary } : {}), properties, ...(about?.actions ? { actions: about.actions } : {}) }
}

/** Every property name a track may use on this target. */
export function animatableProperties(target: CanvasTarget): string[] {
  const names = describeTarget(target).properties.map((property) => property.name)
  return [...names, ...Object.keys(ALIASES).filter((alias) => names.includes(ALIASES[alias]))]
}

export interface TrackProblem {
  level: 'error' | 'warning'
  /** The track's id */
  track: string
  message: string
}

/**
 * Problems in tracks played on these targets: a target that is not there,
 * a property the target cannot animate (with the one probably meant), keys
 * out of time order, and values of the wrong kind. Custom targets that take
 * any property (`acceptsProp`) are checked by that.
 */
export function checkTracks(tracks: Track[], targets: Record<string, CanvasTarget>): TrackProblem[] {
  const problems: TrackProblem[] = []
  const ids = Object.keys(targets)
  for (const track of tracks) {
    const error = (message: string) => problems.push({ level: 'error', track: track.id, message })
    const target = targets[track.target]
    if (!target) {
      error(unknownName('target', track.target, ids))
      continue
    }
    const allowed = animatableProperties(target)
    const accepts = target.type === 'custom' && (target as CustomTarget).acceptsProp?.(track.property)
    if (!allowed.includes(track.property) && !accepts) {
      error(`${track.target}: ${unknownName('property', track.property, allowed, PROPERTY_HINTS[track.property])}`)
      continue
    }
    const keys = track.keyframes ?? []
    for (let i = 1; i < keys.length; i++) {
      if (keys[i].time < keys[i - 1].time) error(`${track.target}.${track.property}: keyframes out of time order (${keys[i - 1].time} ms, then ${keys[i].time} ms).`)
    }
    const info = CANVAS_PROPERTIES[ALIASES[track.property] ?? track.property] ?? (target as CustomTarget).about?.props?.[track.property]
    const wantsNumber = info && (info.kind ?? 'number') === 'number'
    for (const key of keys) {
      if (wantsNumber && typeof key.value !== 'number') {
        error(`${track.target}.${track.property}: values are numbers${info.unit ? ` (${info.unit})` : ''} (got ${JSON.stringify(key.value)} at ${key.time} ms).`)
        break
      }
      if (wantsNumber && typeof key.value === 'number' && ((info.min !== undefined && key.value < info.min) || (info.max !== undefined && key.value > info.max))) {
        problems.push({ level: 'warning', track: track.id, message: `${track.target}.${track.property}: ${key.value} at ${key.time} ms is outside ${info.min ?? '−∞'}..${info.max ?? '∞'}${info.unit ? ` (${info.unit})` : ''}.` })
        break
      }
    }
  }
  return problems
}
