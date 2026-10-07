import type { EasingType, Keyframe, Track } from '../../engine/types'
import { Timeline } from '../../engine/core/timeline'
import { springFollow } from '../../engine/authoring/spring-follow'
import { closestName, unknownName } from '../../engine/authoring/did-you-mean'
import { actKeyframes, resolveActingStyle, type ActingKey, type ActingOptions } from '../acting/acting'
import type { ScriptBeatSpan } from '../acting/script'
import { PROP_COMMON_CONTROLS, controlValue } from './rig'
import { solveAt, type Prop } from './target'

/**
 * Prop beats: what a prop does, compiled into acted tracks, the way
 * `scriptTracks` does it for a figure.
 *
 * ```ts
 * const { tracks, beats, effects } = propScript('car', car(), [
 *   { do: 'drive', to: 520 },
 *   { do: 'turn', toward: 'viewer' },
 *   { do: 'honk' },
 *   { do: 'bump' },
 * ], { from: 120, ground: 300, style: 'snappy', exaggeration: 1.5 })
 * ```
 *
 * The animation principles live here, once for every prop. Families write
 * their actions as key poses of the controls (a drive rocks back, lunges,
 * dips its nose on the stop) and the acting pass adds the rest: wind-ups,
 * overshoot and settle, slow in and out, and overlap from the prop's acting
 * rig (what leads, what trails). `exaggeration` scales the style's wind-ups
 * and overshoots and every amplitude the actions use: 0.5 is restrained, 2
 * is a cartoon.
 */

export interface PropBeat {
  /** What happens: one of the prop's actions */
  do: string
  /** When it starts, ms (default: when the beat before ends) */
  at?: number
  /** How long it takes, ms (default: the action's own length) */
  for?: number
  /** Where to, scene x */
  to?: number
  /** `turn`: a quarter-turn value (0 the viewer, 1 right, 2 away, 3 left) or a word */
  toward?: number | 'viewer' | 'right' | 'away' | 'left'
  /** How fast, px per ms */
  speed?: number
  /** Doors: open (true) or shut */
  open?: boolean
  /** Lights, engines: on (true) or off */
  on?: boolean
  /** Height to climb to, metres */
  height?: number
  /** How hard the wind blows, 0..1 */
  wind?: number
}

export const PROP_BEAT_FIELDS = ['do', 'at', 'for', 'to', 'toward', 'speed', 'open', 'on', 'height', 'wind'] as const satisfies ReadonlyArray<keyof PropBeat>

export interface PropScriptOptions {
  /** Scene x its middle was placed at (its `x` track is an offset from here; default 0) */
  from?: number
  /** Scene y of the ground it was placed on (its `y` track is an offset; default 0) */
  ground?: number
  /** px per metre, as its target draws it (default 60) */
  scale?: number
  /** Acting style (default snappy) */
  style?: ActingOptions['style']
  /** How cartoony: 1 as designed, 0.5 restrained, 2 a cartoon (default 1) */
  exaggeration?: number
  /** Control values it starts with (default the target's defaults) */
  start?: Record<string, number>
}

/** A cartoon effect a prop script asks for, with when and where (scene px). */
export interface PropEffect {
  kind: 'dust' | 'exhaust' | 'skid' | 'honk' | 'leaves' | 'smoke'
  time: number
  x: number
  y: number
  /** How long it shows, ms */
  length: number
  /** Which way it streams: 1 right, −1 left */
  direction?: 1 | -1
  /** A skid's other end, scene x */
  toX?: number
  /** Where falling things land, scene y (leaves on the ground) */
  toY?: number
}

export interface PropScriptResult {
  tracks: Track[]
  duration: number
  beats: ScriptBeatSpan[]
  effects: PropEffect[]
}

/** What an action is given: the prop, where it is, and ways to key it. */
export interface PropActionContext {
  readonly prop: Prop
  /** px per metre */
  readonly scale: number
  readonly exaggeration: number
  /** Scene x of its middle, and its ground's scene y, now */
  readonly x: number
  readonly floor: number
  /** Its control values now (after the keys so far) */
  readonly values: Readonly<Record<string, number>>
  /** Which way it faces on screen: 1 right, −1 left, 0 toward or away from the viewer */
  facing(): 1 | -1 | 0
  /** Key the acted controls (turn, pitch, squash, a door…): the acting pass winds up, overshoots and overlaps them unless `act` is false */
  key(time: number, changes: Record<string, number>, options?: { act?: boolean; easing?: EasingType }): void
  /** Move its middle to a scene x (and floor), keyed exactly as given (not acted): from `from` to `to` ms */
  move(from: number, to: number, x: number, options?: { easing?: EasingType; floor?: number }): void
  /** Key a control exactly, not acted (wheels that must match the ground, a rotor's turns); key its value at a move's start first */
  set(control: string, time: number, value: number, easing?: EasingType): void
  /** Turn to face a quarter-turn value or a way; returns when it is facing it */
  turnTo(time: number, toward: NonNullable<PropBeat['toward']>): number
  /** Where one of its anchors is now, scene px (a chimney for smoke, a canopy for leaves) */
  anchor(name: string): { x: number; y: number }
  effect(effect: PropEffect): void
}

/** One thing a prop can do. */
export interface PropAction {
  /** One line: what it does */
  summary: string
  /** Beat fields it needs */
  needs?: Array<keyof PropBeat>
  /** Beat fields it reads */
  uses?: Array<keyof PropBeat>
  /** Key it, from `start` ms; say when it ends (and when it touches or lets go of something) */
  run(context: PropActionContext, beat: PropBeat, start: number): { end: number; contact?: number; release?: number }
}

const TOWARD: Record<string, number> = { viewer: 0, right: 1, away: 2, left: 3 }

/** How long a quarter turn takes, ms. */
const QUARTER_TURN = 420

/** The actions every prop has. */
export const PROP_COMMON_ACTIONS: Record<string, PropAction> = {
  hold: {
    summary: 'Holds still (`for` ms, default 1000).',
    run: (_context, beat, start) => ({ end: start + (beat.for ?? 1000) }),
  },
  turn: {
    summary: 'Turns to face `toward`: viewer, right, away, left, or a quarter-turn value (it turns in 3D, through the nearer way).',
    needs: ['toward'],
    run: (context, beat, start) => ({ end: context.turnTo(start, beat.toward!) }),
  },
  pop: {
    summary: 'Pops into being: grows from nothing, stretched, overshoots and settles (`for` ms, default 500).',
    uses: ['for'],
    run(context, beat, start) {
      const length = beat.for ?? 500
      const e = context.exaggeration
      context.key(start, { size: 0, squash: 1 }, { act: false })
      context.key(start + length * 0.6, { size: 1 + 0.15 * e, squash: 1 + 0.15 * e }, { act: false, easing: 'ease-out' })
      context.key(start + length, { size: 1, squash: 1 })
      return { end: start + length, contact: start }
    },
  },
  vanish: {
    summary: 'Shrinks away to nothing, with a little stretch first (`for` ms, default 400).',
    uses: ['for'],
    run(context, beat, start) {
      const length = beat.for ?? 400
      const e = context.exaggeration
      context.key(start + length * 0.3, { size: 1 + 0.08 * e, squash: 1 + 0.12 * e }, { act: false, easing: 'ease-out' })
      context.key(start + length, { size: 0, squash: 1 }, { act: false, easing: 'ease-in' })
      return { end: start + length, release: start + length }
    },
  },
}

/** Every action a prop's beats can use. */
export function propActions(prop: Prop): Record<string, PropAction> {
  return { ...PROP_COMMON_ACTIONS, ...prop.actions }
}

export interface PropBeatProblem {
  level: 'error' | 'warning'
  beat: number
  message: string
}

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/** Problems in a prop's beats, naming what was probably meant (as `checkBeats` does for figures). */
export function checkPropBeats(beats: unknown, prop: Prop): PropBeatProblem[] {
  if (!Array.isArray(beats)) return [{ level: 'error', beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof beats}).` }]
  const actions = propActions(prop)
  const names = Object.keys(actions)
  const problems: PropBeatProblem[] = []
  beats.forEach((beat: unknown, index) => {
    const error = (message: string) => problems.push({ level: 'error', beat: index, message })
    if (!beat || typeof beat !== 'object' || Array.isArray(beat)) return error(`Each beat must be an object like { do: '${names[names.length - 1]}' }.`)
    const fields = beat as Record<string, unknown>
    for (const key of Object.keys(fields)) {
      if (!(PROP_BEAT_FIELDS as readonly string[]).includes(key)) error(unknownName('beat field', key, PROP_BEAT_FIELDS, key === 'duration' ? 'for' : key === 'direction' ? 'toward' : undefined))
    }
    if (typeof fields.do !== 'string' || !names.includes(fields.do)) return error(unknownName(`${prop.kind} action`, fields.do, names))
    for (const field of actions[fields.do].needs ?? []) if (fields[field] === undefined) error(`\`${fields.do}\` needs \`${field}\`.`)
    for (const field of ['at', 'for', 'speed', 'height', 'wind'] as const) {
      if (fields[field] !== undefined && !(isNumber(fields[field]) && (fields[field] as number) >= 0)) error(`\`${field}\` must be a number ≥ 0 (got ${JSON.stringify(fields[field])}).`)
    }
    if (fields.to !== undefined && !isNumber(fields.to)) error(`\`to\` is a scene x in px (got ${JSON.stringify(fields.to)}).`)
    if (fields.toward !== undefined && !isNumber(fields.toward) && !(typeof fields.toward === 'string' && fields.toward in TOWARD)) {
      const guess = typeof fields.toward === 'string' ? closestName(fields.toward, Object.keys(TOWARD)) : undefined
      error(`\`toward\` is viewer, right, away, left or a quarter-turn number${guess ? ` (did you mean "${guess}"?)` : ''} (got ${JSON.stringify(fields.toward)}).`)
    }
    for (const field of ['open', 'on'] as const) {
      if (fields[field] !== undefined && typeof fields[field] !== 'boolean') error(`\`${field}\` is true or false (got ${JSON.stringify(fields[field])}).`)
    }
  })
  return problems
}

/** Compile a prop's beats into tracks on `target` (a `propTarget` of the same prop). Throws on problems (see `checkPropBeats`). */
export function propScript(target: string, prop: Prop, beats: PropBeat[], options: PropScriptOptions = {}): PropScriptResult {
  const errors = checkPropBeats(beats, prop).filter((p) => p.level === 'error')
  if (errors.length > 0) throw new Error(`propScript (${prop.kind}): ${errors.length} problem(s) in the beats:\n${errors.map((p) => `  beat ${p.beat}: ${p.message}`).join('\n')}`)
  const from = options.from ?? 0
  const ground = options.ground ?? 0
  const scale = options.scale ?? 60
  const exaggeration = options.exaggeration ?? 1
  const actions = propActions(prop)

  // Every control, at its starting value.
  const values: Record<string, number> = {}
  for (const name of [...Object.keys(PROP_COMMON_CONTROLS), ...Object.keys(prop.rig.controls)]) values[name] = options.start?.[name] ?? controlValue(prop.rig, {}, name)
  const keys: ActingKey[] = [{ time: 0, pose: { ...values } }]
  const direct = new Map<string, Keyframe<number>[]>()
  const effects: PropEffect[] = []
  let x = from
  let floor = ground

  /** Key a directly keyed control (x and y as offsets from where it was placed). */
  const setKey = (control: string, time: number, value: number, easing?: EasingType) => {
    const list = direct.get(control) ?? [{ time: 0, value: control === 'x' || control === 'y' ? 0 : values[control] }]
    list.push({ time, value, ...(easing ? { easing } : {}) })
    direct.set(control, list)
    if (control !== 'x' && control !== 'y') values[control] = value
  }
  /** Hold a directly keyed control at its current value up to `time`, so the next move starts there. */
  const hold = (control: string, time: number) => {
    const current = control === 'x' ? x - from : control === 'y' ? floor - ground : values[control]
    const list = direct.get(control)
    if (!list || list[list.length - 1].time < time) setKey(control, time, current)
  }

  const context: PropActionContext = {
    prop,
    scale,
    exaggeration,
    get x() {
      return x
    },
    get floor() {
      return floor
    },
    values,
    facing() {
      const s = Math.sin((values.turn * Math.PI) / 2)
      return Math.abs(s) < 0.5 ? 0 : s > 0 ? 1 : -1
    },
    key(time, changes, keyOptions = {}) {
      Object.assign(values, changes)
      keys.push({ time, pose: { ...values }, ...(keyOptions.act === false ? { act: false } : {}), ...(keyOptions.easing ? { easing: keyOptions.easing } : {}) })
    },
    move(start, end, toX, moveOptions = {}) {
      hold('x', start)
      setKey('x', end, toX - from, moveOptions.easing)
      x = toX
      if (moveOptions.floor !== undefined) {
        hold('y', start)
        setKey('y', end, moveOptions.floor - ground, moveOptions.easing)
        floor = moveOptions.floor
      }
    },
    set(control, time, value, easing) {
      setKey(control, time, value, easing)
    },
    turnTo(time, toward) {
      const target = typeof toward === 'number' ? toward : TOWARD[toward]
      // The representative of the target nearest the current turn; on a tie, the way that passes the viewer.
      const current = values.turn
      const candidates = [target - 4, target, target + 4].map((t) => ({ t, d: Math.abs(t - current) }))
      const best = candidates.sort((a, b) => a.d - b.d || Math.abs(a.t) - Math.abs(b.t))[0]
      if (best.d < 1e-3) return time
      const end = time + QUARTER_TURN * Math.max(1, best.d)
      context.key(end, { turn: best.t })
      return end
    },
    effect(effect) {
      effects.push(effect)
    },
    anchor(name) {
      const solved = solveAt(prop, values, scale)
      const anchor = solved.anchors[name]
      if (!anchor) throw new Error(`${prop.kind}: no anchor "${name}"`)
      return { x: x + anchor.point.x, y: floor + anchor.point.y }
    },
  }

  const spans: ScriptBeatSpan[] = []
  let time = 0
  for (const beat of beats) {
    const start = Math.max(beat.at ?? time, keys[keys.length - 1].time)
    const result = actions[beat.do].run(context, beat, start)
    // The pose holds to the end of the beat.
    if (result.end > keys[keys.length - 1].time) keys.push({ time: result.end, pose: { ...values } })
    spans.push({ start, end: result.end, ...(result.contact !== undefined ? { contact: result.contact } : {}), ...(result.release !== undefined ? { release: result.release } : {}) })
    time = result.end
  }

  const base = resolveActingStyle(options.style ?? 'snappy')
  const style = { ...base, anticipation: base.anticipation * exaggeration, overshoot: base.overshoot * exaggeration }
  const acted = actKeyframes(mergeCloseKeys(keys), prop.acting, { style })
  const tracks: Track[] = [
    // Controls keyed exactly (wheels, rotors) are not acted.
    ...Object.entries(acted)
      .filter(([property]) => !direct.has(property))
      .map(([property, keyframes]) => ({ id: `${target}-${property}`, target, property, keyframes })),
    ...[...direct].map(([property, keyframes]) => ({ id: `${target}-${property}`, target, property, keyframes: inOrder(keyframes) })),
  ]
  // Follow-through adds to whatever the beats keyed on the same control (a tail swished while it trails).
  for (const follow of followThrough(target, prop, tracks, time, keys[0].pose)) {
    const keyed = tracks.findIndex((t) => t.property === follow.property)
    if (keyed < 0) {
      tracks.push(follow)
      continue
    }
    const own = new Timeline({ id: `${target}-own`, tracks: [tracks[keyed]] })
    const ownAt = (time: number) => Number(own.getStateAtTime(time).values.get(target)?.get(follow.property) ?? 0)
    tracks[keyed] = { ...follow, keyframes: follow.keyframes.map((k) => ({ time: k.time, value: Number(k.value) + ownAt(k.time) })) }
  }
  return { tracks, duration: time, beats: spans, effects }
}

/** How long follow-through keeps moving after the last beat, ms. */
const FOLLOW_SETTLE = 1500

/** Tracks for the prop's follow-through controls: each trails what it follows on a spring (see `Prop.follow`). */
function followThrough(target: string, prop: Prop, tracks: Track[], duration: number, start: Record<string, number>): Track[] {
  if (!prop.follow?.length) return []
  const sampler = new Timeline({ id: `${target}-follow`, tracks: tracks.filter((t) => t.property === 'turn' || prop.follow!.some((f) => f.of === t.property)) })
  // A control with no track holds its starting value (x and y start at 0: they are offsets).
  const valueOf = (time: number, property: string) => {
    const value = sampler.getStateAtTime(time).values.get(target)?.get(property)
    return typeof value === 'number' ? value : (start[property] ?? 0)
  }
  return prop.follow.map((follow) => {
    const end = duration + FOLLOW_SETTLE
    const chase = springFollow((t) => valueOf(t, follow.of), { start: 0, end, stiffness: follow.stiffness, damping: follow.damping })
    const limit = follow.limit ?? Infinity
    const keyframes = chase.map(({ time, value }) => {
      // Lag along the way it faces on screen: a car going right that lags behind bends back.
      const facing = Math.sin((valueOf(time, 'turn') * Math.PI) / 2)
      const lag = (value - valueOf(time, follow.of)) * facing
      return { time, value: Math.max(-limit, Math.min(limit, lag * follow.per)) }
    })
    return { id: `${target}-${follow.control}`, target, property: follow.control, keyframes }
  })
}

/** Keys this close (ms) are one key: the later pose at the earlier time. */
const SAME_MOMENT = 20

function mergeCloseKeys(keys: ActingKey[]): ActingKey[] {
  const sorted = [...keys].sort((a, b) => a.time - b.time)
  const out: ActingKey[] = []
  for (const key of sorted) {
    const last = out[out.length - 1]
    if (last && key.time - last.time < SAME_MOMENT) out[out.length - 1] = { ...key, time: last.time }
    else out.push(key)
  }
  return out
}

/** Keyframes in time order; at one time, the last written wins. */
function inOrder(keyframes: Keyframe<number>[]): Keyframe<number>[] {
  const sorted = keyframes.map((k, i) => ({ k, i })).sort((a, b) => a.k.time - b.k.time || a.i - b.i)
  const out: Keyframe<number>[] = []
  for (const { k } of sorted) {
    if (out.length > 0 && out[out.length - 1].time === k.time) out[out.length - 1] = k
    else out.push(k)
  }
  return out
}
