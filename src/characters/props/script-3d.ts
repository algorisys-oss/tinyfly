import type { EasingType, Keyframe, Track } from '../../engine/types'
import { getEasingFunction } from '../../engine/interpolation/easing'
import { unknownName } from '../../engine/authoring/did-you-mean'
import type { ActingOptions } from '../acting/acting'
import { controlValue, PROP_COMMON_CONTROLS } from './rig'
import { propActions, propScript, type PropBeat } from './script'
import { along, groundPath, headingOf, inverse, isGroundPoint, tidy, turnBetween, type GroundPoint } from '../ground-path'
import type { Prop, PropMove } from './target'

export type { GroundPoint } from '../ground-path'

/**
 * Prop beats in world metres, for 3D scenes: a car drives to a point or
 * along a road through points, a horse walks a path, a crow flies round the
 * village, each turning to face the way it goes. Wheels and strides are
 * keyed with the distance covered (from the prop's `moves`), so wheels roll
 * and feet step exactly; wingbeats and rotors keep time. Every other action
 * (a honk, a bark, a peck, a door) plays as it does in 2D, its controls only.
 *
 * ```js
 * const car = propScript3D('car', car(), [
 *   { do: 'drive', through: [[4, 3], [8, 0], [8, -6]] },
 *   { do: 'honk' },
 *   { do: 'face', toward: [0, 0] },
 * ], { scene: 'village', position: [-9, 3], heading: 90 })
 * ```
 *
 * The tracks are the scene object's own: `x`, `z` and `rotateY` (absolute,
 * in metres and degrees), and its controls.
 */

export interface PropBeat3D {
  /** One of its moves (`drive`, `walk`, `trot`, `fly`…), `face`, `hold`, or one of its actions (`honk`, `bark`…) */
  do: string
  /** When it starts, ms (default: when the beat before ends) */
  at?: number
  /** How long it takes, ms (default: the distance at its move's speed, or the action's own length) */
  for?: number
  /** A move: where to, [x, z] metres */
  to?: GroundPoint
  /** A move: a path through these points, [x, z] metres each; it curves smoothly through them */
  through?: GroundPoint[]
  /** `face`: a point [x, z] to face, or a heading in degrees (0 faces +z, 90 faces +x) */
  toward?: GroundPoint | number
  /** A move: metres per second (default its own speed) */
  speed?: number
  /** A flying move: how high, metres; or an action's height (a bird's `land` on a roof) */
  height?: number
  /** An action: doors open (true) or shut */
  open?: boolean
  /** An action: lights or engines on (true) or off */
  on?: boolean
  /** An action: how hard the wind blows, 0..1 */
  wind?: number
}

export const PROP_BEAT_3D_FIELDS = ['do', 'at', 'for', 'to', 'through', 'toward', 'speed', 'height', 'open', 'on', 'wind'] as const satisfies ReadonlyArray<keyof PropBeat3D>

export interface PropScript3DOptions {
  /** The scene's id: the tracks target `<scene>/<id>` */
  scene: string
  /** Where it was placed, [x, z] metres (its object's position) */
  position?: GroundPoint
  /** Which way it faces at first, degrees (its object's rotation about y; 0 faces +z) */
  heading?: number
  /** Control values it starts with (default its defaults) */
  values?: Record<string, number>
  /** For its actions: acting style and how cartoony (see `propScript`) */
  style?: ActingOptions['style']
  exaggeration?: number
}

export interface PropScript3DResult {
  tracks: Track[]
  duration: number
  beats: Array<{ do: string; start: number; end: number }>
  /** Where it ends up, which way it faces, and its controls then */
  end: { position: GroundPoint; heading: number; values: Record<string, number> }
}

export interface PropBeat3DProblem {
  beat: number
  message: string
}

/** Metres between keys along a path. */
const SAMPLE = 0.25
/** How long turning to face a new way takes, ms per degree (a half turn in 0.8 s), and at least. */
const TURN_PER_DEGREE = 800 / 180
const TURN_LEAST = 220
/** How long controls held while moving take to come in and go out, ms (at most a quarter of the move). */
const EASE_IN_OUT = 300
/** Actions that only make sense on a 2D stage: their 3D form is a move or `face`. */
const STAGE_ONLY = ['turn']


/** The actions it can play in 3D (not the ones that move it across a 2D stage). */
function sceneActions(prop: Prop): string[] {
  const actions = propActions(prop)
  const moves = Object.keys(prop.moves ?? {})
  return Object.keys(actions).filter((name) => !moves.includes(name) && !STAGE_ONLY.includes(name) && !(actions[name].needs ?? []).includes('to'))
}

/** Problems in 3D prop beats, naming what was probably meant. */
export function checkPropBeats3D(beats: unknown, prop: Prop): PropBeat3DProblem[] {
  if (!Array.isArray(beats)) return [{ beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof beats}).` }]
  const moves = Object.keys(prop.moves ?? {})
  const actions = sceneActions(prop)
  const names = [...moves, 'face', 'hold', ...actions.filter((name) => name !== 'hold')]
  const problems: PropBeat3DProblem[] = []
  beats.forEach((beat: unknown, index) => {
    const error = (message: string) => problems.push({ beat: index, message })
    if (!beat || typeof beat !== 'object' || Array.isArray(beat)) return error(`Each beat must be an object like { do: '${names[0] ?? 'hold'}' }.`)
    const fields = beat as Record<string, unknown>
    const hints: Record<string, string> = { duration: 'for', path: 'through', points: 'through', position: 'to', heading: 'toward', direction: 'toward' }
    for (const key of Object.keys(fields)) if (!(PROP_BEAT_3D_FIELDS as readonly string[]).includes(key)) error(unknownName('beat field', key, PROP_BEAT_3D_FIELDS, hints[key]))
    if (typeof fields.do !== 'string' || !names.includes(fields.do)) {
      const hint = fields.do === 'turn' ? 'face' : undefined
      return error(unknownName(`${prop.kind} 3D beat`, fields.do, names, hint))
    }
    if (moves.includes(fields.do)) {
      if (fields.to === undefined && fields.through === undefined) error(`\`${fields.do}\` needs \`to\` ([x, z] metres) or \`through\` (a list of them).`)
      if (fields.to !== undefined && !isGroundPoint(fields.to)) error(`\`to\` is a point on the ground, [x, z] metres (got ${JSON.stringify(fields.to)}).`)
      if (fields.through !== undefined && !(Array.isArray(fields.through) && fields.through.length > 0 && fields.through.every(isGroundPoint))) error('`through` is a list of points on the ground, each [x, z] metres.')
    }
    if (fields.do === 'face' && !(isGroundPoint(fields.toward) || typeof fields.toward === 'number')) error('`face` needs `toward`: a point [x, z] or a heading in degrees.')
  })
  return problems
}

/** Compiles 3D prop beats into the scene object's tracks (see the module's notes). */
export function propScript3D(id: string, prop: Prop, beats: PropBeat3D[], options: PropScript3DOptions): PropScript3DResult {
  const problems = checkPropBeats3D(beats, prop)
  if (problems.length > 0) throw new Error(`propScript3D (${prop.kind}): ${problems.length} problem(s) in the beats:\n${problems.map((p) => `  beat ${p.beat}: ${p.message}`).join('\n')}`)
  const values: Record<string, number> = {}
  for (const name of [...Object.keys(PROP_COMMON_CONTROLS), ...Object.keys(prop.rig.controls)]) values[name] = options.values?.[name] ?? controlValue(prop.rig, {}, name)
  let [x, z] = options.position ?? [0, 0]
  let heading = options.heading ?? 0
  const keys = new Map<string, Keyframe<number>[]>()
  const key = (property: string, time: number, value: number, easing: EasingType = 'linear') => {
    const list = keys.get(property) ?? []
    list.push({ time, value, easing })
    keys.set(property, list)
  }
  /** A control (or x, z, rotateY) keyed at its value now, so a change keyed next starts from there. */
  const hold = (property: string, time: number, value: number) => key(property, time, value)
  key('x', 0, x)
  key('z', 0, z)
  key('rotateY', 0, heading)

  const turnTo = (start: number, toward: number): number => {
    const delta = turnBetween(heading, toward)
    if (Math.abs(delta) < 1) return start
    const length = Math.max(TURN_LEAST, Math.abs(delta) * TURN_PER_DEGREE)
    hold('rotateY', start, heading)
    heading += delta
    key('rotateY', start + length, heading, 'ease-in-out')
    return start + length
  }

  const move = (spec: PropMove, beat: PropBeat3D, start: number): number => {
    const path = groundPath([[x, z], ...(beat.through ?? [beat.to!])])
    if (path.length < 2) return start
    const t = turnTo(start, headingOf(path[0].point, path[1].point))
    const length = path[path.length - 1].at
    const travel = beat.for ?? (length / (beat.speed ?? spec.speed)) * 1000
    const ease = getEasingFunction('ease-in-out')
    const ramp = Math.min(EASE_IN_OUT, travel / 4)
    // Controls it sets off with, and those it holds while moving.
    for (const [control, value] of Object.entries(spec.set ?? {})) {
      hold(control, t, values[control])
      key(control, t + 1, value)
      values[control] = value
    }
    const height = spec.flies ? (beat.height ?? (values.lift > 0.05 ? values.lift : 2)) : undefined
    // A flier staying up keeps its holds (its wings beating) into the next beat; everything else eases them out.
    const staysUp = height !== undefined && height > 0.05
    for (const [control, value] of Object.entries(spec.hold ?? {})) {
      hold(control, t, values[control])
      key(control, t + ramp, value, 'ease-out')
      if (!staysUp) {
        key(control, t + travel - ramp, value)
        key(control, t + travel, 0, 'ease-in')
      }
      values[control] = staysUp ? value : 0
    }
    if (height !== undefined) {
      hold('lift', t, values.lift)
      key('lift', t + Math.min(travel * 0.35, 1400), height, 'ease-out')
      key('lift', t + travel, height)
      values.lift = height
    }
    // Along the path, a key every SAMPLE metres: where it is, which way it faces, and the controls kept in
    // step. Distance follows an ease in and out, so it sets off and stops gently; the time each sample is
    // reached is worked out from that, so wheels and feet keep pace with the ground all the way.
    const startValues = { ...values }
    let facing = heading
    for (let s = 0; ; s = Math.min(length, s + SAMPLE)) {
      const time = t + inverse(ease, s / length) * travel
      const { point, direction } = along(path, s)
      facing += turnBetween(facing, headingOf([0, 0], direction))
      key('x', time, point[0])
      key('z', time, point[1])
      key('rotateY', time, facing)
      for (const [control, rate] of Object.entries(spec.perMetre ?? {})) key(control, time, startValues[control] + s * rate)
      for (const [control, rate] of Object.entries(spec.perSecond ?? {})) key(control, time, startValues[control] + ((time - t) / 1000) * rate)
      if (s >= length) break
    }
    for (const [control, rate] of Object.entries(spec.perMetre ?? {})) values[control] = startValues[control] + length * rate
    for (const [control, rate] of Object.entries(spec.perSecond ?? {})) values[control] = startValues[control] + (travel / 1000) * rate
    const end = path[path.length - 1].point
    ;[x, z] = end
    heading = facing
    return t + travel
  }

  /** Any other action, as it plays in 2D: its controls only (where it stands and turns is the scene's). */
  const act = (beat: PropBeat3D, start: number): number => {
    // Its own fields only: where and when are the scene's.
    const own = Object.fromEntries(Object.entries(beat).filter(([field]) => !['at', 'to', 'through', 'toward'].includes(field))) as PropBeat
    const compiled = propScript(id, prop, [own], { start: { ...values, turn: 1 }, scale: 100, style: options.style, exaggeration: options.exaggeration })
    for (const track of compiled.tracks) {
      if (STAGE_PROPERTIES.includes(track.property)) continue
      const frames = (track.keyframes ?? []) as Keyframe<number>[]
      const from = values[track.property]
      if (frames.every((frame) => frame.value === from)) continue
      hold(track.property, start, from)
      for (const frame of frames) if (frame.time > 0) keys.get(track.property)!.push({ ...frame, time: start + frame.time })
      values[track.property] = frames[frames.length - 1].value
    }
    return start + compiled.duration
  }

  const spans: PropScript3DResult['beats'] = []
  let time = 0
  for (const beat of beats) {
    const start = beat.at ?? time
    let end = start
    const spec = prop.moves?.[beat.do]
    if (spec) end = move(spec, beat, start)
    else if (beat.do === 'face') end = turnTo(start, typeof beat.toward === 'number' ? beat.toward : headingOf([x, z], beat.toward!))
    else if (beat.do === 'hold') end = start + (beat.for ?? 1000)
    else end = act(beat, start)
    spans.push({ do: beat.do, start, end })
    time = end
  }

  const target = `${options.scene}/${id}`
  const tracks: Track[] = [...keys].map(([property, frames]) => ({
    id: `${id}-${property}`,
    target,
    property,
    keyframes: tidy(frames),
  }))
  return { tracks, duration: time, beats: spans, end: { position: [x, z], heading, values: { ...values } } }
}

/** Properties a 2D action keys that place it on a 2D stage: in a scene, where it is and its heading are the scene's. */
const STAGE_PROPERTIES = ['x', 'y', 'turn', 'facing', 'tilt']
