import type { Keyframe, Track } from '../../engine/types'
import { EXPRESSIONS, POSES, REST_POSE, withExpression, type ExpressionName, type PoseKey, type PoseName, type StickPose } from '../stick-figure'
import { GAITS, gaitStrideLength, type GaitName } from '../gaits'
import { actTracks } from './act-tracks'
import { GAGS, gag, gagDuration, type GagName } from './gags'
import { lipSyncOver, type SpokenLine } from './lip-sync'
import type { ActingOptions } from './acting'

/**
 * Beat scripts: a story written as what a character does, compiled into
 * acted tracks.
 *
 * ```ts
 * const { tracks, duration, lines } = scriptTracks('crow', [
 *   { do: 'walk', to: 600, mood: 'sad' },
 *   { do: 'look', toward: 900, mood: 'surprised' },
 *   { do: 'take' },
 *   { do: 'say', say: 'A pot of water!', mood: 'joyful' },
 *   { do: 'run', to: 880 },
 *   { do: 'cheer', for: 1200 },
 * ], { from: 200, height: 170, style: 'snappy' })
 * ```
 *
 * Each beat starts when the one before it ends (or at `at`). Walking beats
 * move the figure (its `x` track, as an offset from where it was placed at
 * `from`), turn it to face the way it goes, and pick the gait; pose beats key
 * a named pose; gag beats splice in a gag; `say` lip-syncs a line. The poses
 * then go through the acting pass, so the result winds up, overshoots and
 * overlaps like any `actTracks()` output. Everything is plain keyframes.
 */

/** The ways to get somewhere. */
export type GaitAction = GaitName
/** Everything a beat can do. */
export type Action = GaitAction | PoseName | GagName | 'look' | 'say' | 'hold' | 'stand' | 'face' | 'zip'

export interface Beat {
  /** What happens */
  do: Action
  /** When it starts, ms (default: when the beat before ends) */
  at?: number
  /** How long it takes, ms (default: the action's own length) */
  for?: number
  /** Walking: where to, scene x */
  to?: number
  /** `look` and `face`: a scene x, or `viewer` (front-on), `ahead` or `back` */
  toward?: number | 'viewer' | 'ahead' | 'back'
  /** The face for the beat */
  mood?: ExpressionName
  /** Spoken during the beat, lip-synced (with `do: 'say'`, the beat lasts as long as the line) */
  say?: string
  /** Joints to change on top of the action's pose */
  pose?: Partial<StickPose>
}

export interface ScriptOptions extends ActingOptions {
  /** Scene x the figure was placed at (its `x` track is an offset from here; default 0) */
  from?: number
  /** Figure height, px, for stride length (default 300, the stick figure's) */
  height?: number
  /** Which way it faces at the start (default 1, screen-right) */
  facing?: 1 | -1
  /** The pose it starts in (default rest) */
  start?: StickPose
  /** Lip-sync energy (default 1) */
  energy?: number
}

export interface ScriptResult {
  /** Every track the script writes, on the target */
  tracks: Track[]
  /** When the last beat ends, ms */
  duration: number
  /** The spoken lines with their times, for captions */
  lines: SpokenLine[]
  /** The key poses, before acting */
  keys: PoseKey[]
  /** When each beat starts and ends, ms */
  beats: Array<{ start: number; end: number }>
  /** Effects to draw, with when and where (scene x on the ground): dust where a zip leaves and where a take lands */
  effects: ScriptEffect[]
}

/** A cartoon effect a script asks for: draw it with `drawDustPuff` (progress from `time`, over `length` ms). */
export interface ScriptEffect {
  kind: 'dust'
  time: number
  /** Scene x on the ground */
  x: number
  /** How long it shows, ms */
  length: number
}

/** Time for one gait cycle (two steps), ms. */
export const GAIT_CYCLE_MS: Record<GaitName, number> = {
  walk: 1000,
  bouncy: 900,
  doubleBounce: 1100,
  sneak: 1600,
  strut: 1100,
  tired: 1500,
  run: 560,
}

/** The zip: legs wheel in place this long, then it shoots off this fast (px/ms), taking at least ZIP_MIN ms. */
const ZIP_WHEEL = 450
const ZIP_SPEED = 2.4
const ZIP_MIN = 160
/** Wheeling legs: run cycles while it spins up in place. */
const ZIP_WHEEL_CYCLES = 2.5

/** Default lengths, ms. */
const POSE_MOVE = 450
const POSE_BEAT = 1200
const LOOK_BEAT = 700
const TURN_AROUND = 320
const START_STOP = 220
/** Speech: ms per character, and the least a line takes. */
const SPEECH_PER_CHAR = 65
const SPEECH_MIN = 700

const isGait = (action: Action): action is GaitName => action in GAITS
const isGag = (action: Action): action is GagName => action in GAGS
const isPose = (action: Action): action is PoseName => action in POSES

/** How long a line takes to say, ms. */
export function speechDuration(text: string): number {
  return Math.max(SPEECH_MIN, Array.from(text).length * SPEECH_PER_CHAR)
}

/** Compile beats into tracks on `target` (a `stickFigureTarget`). */
export function scriptTracks(target: string, beats: Beat[], options: ScriptOptions = {}): ScriptResult {
  const from = options.from ?? 0
  const height = options.height ?? 300
  let x = from
  let facing: 1 | -1 = options.facing ?? 1
  let pose: StickPose = options.start ?? REST_POSE
  let walkPhase = 0
  let time = 0

  const keys: PoseKey[] = [{ time: 0, pose }]
  const xKeys: Keyframe<number>[] = [{ time: 0, value: 0 }]
  const walkKeys: Keyframe<number>[] = [{ time: 0, value: 0 }]
  const walkingKeys: Keyframe<number>[] = [{ time: 0, value: 0 }]
  const gaitKeys: Keyframe<string>[] = [{ time: 0, value: 'walk' }]
  const facingKeys: Keyframe<number>[] = [{ time: 0, value: facing }]
  const lines: SpokenLine[] = []
  const spans: Array<{ start: number; end: number }> = []
  const effects: ScriptEffect[] = []

  /** Key a pose (changes on the current one), with the beat's mood. */
  const keyPose = (at: number, changes: Partial<StickPose>, mood?: ExpressionName, act?: boolean) => {
    pose = { ...pose, ...changes }
    if (mood) pose = withExpression(pose, mood)
    keys.push({ time: at, pose, ...(act === false ? { act } : {}) })
  }
  /** Turn round to face `direction`: front-on, flip, back to profile. */
  const turnAround = (at: number, direction: 1 | -1, mood?: ExpressionName): number => {
    keyPose(at + TURN_AROUND / 2, { turn: 0 }, mood)
    facingKeys.push({ time: at + TURN_AROUND / 2, value: facing }, { time: at + TURN_AROUND / 2 + 1, value: direction })
    facing = direction
    keyPose(at + TURN_AROUND, { turn: 1 })
    return at + TURN_AROUND
  }
  /** Which way a scene x is from the figure, as a facing. */
  const directionTo = (scene: number): 1 | -1 => (scene < x ? -1 : 1)

  for (const beat of beats) {
    const start = Math.max(beat.at ?? time, time === 0 ? 0 : keys[keys.length - 1].time)
    let end = start
    const extra = beat.pose ?? {}

    if (isGait(beat.do)) {
      const goal = beat.to ?? x
      const direction = goal === x ? facing : directionTo(goal)
      let walkStart = start
      if (direction !== facing) walkStart = turnAround(start, direction, beat.mood)
      else if (pose.turn < 1) {
        walkStart = start + START_STOP
        keyPose(walkStart, { turn: 1, ...extra }, beat.mood)
      } else if (beat.mood || beat.pose) keyPose(start + START_STOP, extra, beat.mood)
      const distance = Math.abs(goal - x)
      const cycles = distance / gaitStrideLength(beat.do, height)
      const walkTime = beat.for ?? Math.max(START_STOP * 2, cycles * GAIT_CYCLE_MS[beat.do])
      const walkEnd = walkStart + walkTime
      gaitKeys.push({ time: walkStart, value: beat.do })
      walkingKeys.push({ time: walkStart, value: 0 }, { time: walkStart + START_STOP, value: 1, easing: 'ease-out' })
      walkingKeys.push({ time: walkEnd - START_STOP, value: 1 }, { time: walkEnd, value: 0, easing: 'ease-in' })
      walkKeys.push({ time: walkStart, value: walkPhase }, { time: walkEnd, value: walkPhase + cycles })
      xKeys.push({ time: walkStart, value: x - from }, { time: walkEnd, value: goal - from })
      walkPhase += cycles
      x = goal
      keyPose(walkEnd, {})
      end = walkEnd
    } else if (beat.do === 'zip') {
      // Wind up, wheel the legs in place, then shoot off; a dust cloud hangs where it stood.
      const goal = beat.to ?? x
      const direction = goal === x ? facing : directionTo(goal)
      let windStart = start
      if (direction !== facing) windStart = turnAround(start, direction, beat.mood)
      else if (pose.turn < 1) {
        windStart = start + START_STOP
        keyPose(windStart, { turn: 1 }, beat.mood)
      }
      const windUp = gag('windUp', { at: windStart, from: beat.mood ? withExpression(pose, beat.mood) : pose })
      keys.push(...windUp)
      pose = windUp[windUp.length - 1].pose as StickPose
      const wheel = windStart + gagDuration('windUp')
      const off = wheel + ZIP_WHEEL
      const zipEnd = off + Math.max(ZIP_MIN, Math.abs(goal - x) / ZIP_SPEED)
      gaitKeys.push({ time: wheel, value: 'run' })
      walkingKeys.push({ time: wheel, value: 0 }, { time: wheel + 80, value: 1, easing: 'ease-out' }, { time: zipEnd, value: 1 }, { time: zipEnd + 120, value: 0 })
      walkKeys.push({ time: wheel, value: walkPhase }, { time: off, value: walkPhase + ZIP_WHEEL_CYCLES, easing: 'ease-in' })
      walkPhase += ZIP_WHEEL_CYCLES + (zipEnd - off) / GAIT_CYCLE_MS.run * 1.5
      walkKeys.push({ time: zipEnd, value: walkPhase })
      xKeys.push({ time: off, value: x - from }, { time: zipEnd, value: goal - from, easing: 'ease-in' })
      effects.push({ kind: 'dust', time: off, x, length: 900 })
      x = goal
      keyPose(zipEnd, {})
      end = zipEnd
    } else if (isGag(beat.do)) {
      const keysOfGag = gag(beat.do, { at: start, from: beat.mood ? withExpression(pose, beat.mood) : pose })
      keys.push(...keysOfGag)
      pose = keysOfGag[keysOfGag.length - 1].pose as StickPose
      end = start + gagDuration(beat.do)
      // Landing raises dust: the take comes down 900 ms in, a landing 120 ms in.
      if (beat.do === 'take') effects.push({ kind: 'dust', time: start + 900, x, length: 500 })
      if (beat.do === 'land') effects.push({ kind: 'dust', time: start + 120, x, length: 500 })
    } else if (beat.do === 'look' || beat.do === 'face') {
      const toward = beat.toward ?? 'viewer'
      const length = beat.for ?? LOOK_BEAT
      if (toward === 'viewer') keyPose(start + POSE_MOVE, { turn: 0, lookX: 0, lookY: 0, ...extra }, beat.mood)
      else if (toward === 'ahead') keyPose(start + POSE_MOVE, { turn: beat.do === 'face' ? 1 : 0.6, lookX: 1, ...extra }, beat.mood)
      else if (toward === 'back') keyPose(start + POSE_MOVE, { turn: 0.2, lookX: -1, ...extra }, beat.mood)
      else {
        const direction = directionTo(toward)
        if (direction !== facing && beat.do === 'face') {
          turnAround(start, direction, beat.mood)
          keyPose(start + TURN_AROUND + 1, { lookX: 1, ...extra })
        } else if (direction !== facing) keyPose(start + POSE_MOVE, { turn: 0.25, lookX: -1, ...extra }, beat.mood)
        else keyPose(start + POSE_MOVE, { turn: beat.do === 'face' ? 1 : 0.6, lookX: 1, ...extra }, beat.mood)
      }
      end = start + Math.max(length, POSE_MOVE)
    } else if (isPose(beat.do) || beat.do === 'stand') {
      const named = beat.do === 'stand' ? REST_POSE : POSES[beat.do]
      // A named pose keeps the way the figure is turned unless it sets its own (sitting does).
      const turn = named.turn !== REST_POSE.turn ? named.turn : pose.turn
      const face = beat.mood ? EXPRESSIONS[beat.mood] : { lookX: pose.lookX, lookY: pose.lookY }
      keyPose(start + POSE_MOVE, { ...named, turn, ...face, ...extra })
      end = start + (beat.for ?? POSE_BEAT)
    } else {
      // say, hold: the pose stays (a mood or joints may change it).
      const length = beat.for ?? (beat.say ? speechDuration(beat.say) : POSE_BEAT)
      if (beat.mood || beat.pose) keyPose(start + Math.min(POSE_MOVE, length / 2), extra, beat.mood)
      end = start + length
    }

    if (beat.say) {
      // Speech starts once the beat's move has settled, and ends a little before the beat does.
      const begin = isGait(beat.do) || isGag(beat.do) ? start : start + Math.min(150, (end - start) / 4)
      const finish = isGait(beat.do) ? end : Math.max(begin + 200, end - 100)
      lines.push({ text: beat.say, start: begin, end: finish })
      if (beat.do === 'say') addTalkingHead(keys, pose, begin, finish)
    }
    // The pose holds to the end of the beat (the acting pass drifts long holds).
    if (end > keys[keys.length - 1].time) keys.push({ time: end, pose })
    spans.push({ start, end })
    time = end
  }

  const tracks = actTracks(target, mergeCloseKeys(keys), options)
  const extraTracks: Track[] = [
    { id: `${target}-x`, target, property: 'x', keyframes: xKeys },
    { id: `${target}-walk`, target, property: 'walk', keyframes: walkKeys },
    { id: `${target}-walking`, target, property: 'walking', keyframes: walkingKeys },
    { id: `${target}-gait`, target, property: 'gait', keyframes: gaitKeys },
    { id: `${target}-facing`, target, property: 'facing', keyframes: facingKeys },
  ].filter((track) => track.keyframes.length > 1 || track.property === 'x')
  return {
    tracks: [...lipSyncOver(target, tracks, lines, { energy: options.energy }), ...extraTracks],
    duration: time,
    lines,
    keys,
    beats: spans,
    effects,
  }
}

/** Keys this close (ms) are one key: the later pose, at the earlier time. */
const SAME_MOMENT = 30

function mergeCloseKeys(keys: PoseKey[]): PoseKey[] {
  const out: PoseKey[] = []
  for (const key of keys) {
    const last = out[out.length - 1]
    if (last && key.time - last.time < SAME_MOMENT) out[out.length - 1] = { ...key, time: last.time }
    else out.push(key)
  }
  return out
}

/**
 * While a line is spoken, the head bobs a little and the brows lift on the
 * stresses: small keys between the pose's own, so talking never freezes.
 */
function addTalkingHead(keys: PoseKey[], pose: StickPose, start: number, end: number): void {
  const beat = 520
  const after = keys.filter((key) => key.time > start)
  const before = keys.filter((key) => key.time <= start)
  const talking: PoseKey[] = []
  for (let time = start + beat, i = 0; time < end - beat / 2; time += beat, i++) {
    const nod = i % 2 === 0 ? 3 : -2
    talking.push({ time, pose: { ...pose, headTilt: pose.headTilt + nod, leftBrow: pose.leftBrow + (i % 2 === 0 ? 0.25 : 0), rightBrow: pose.rightBrow + (i % 2 === 0 ? 0.25 : 0) } })
  }
  if (talking.length > 0) talking.push({ time: end, pose })
  keys.length = 0
  keys.push(...before, ...talking.filter((key) => !after.some((other) => Math.abs(other.time - key.time) < 60)), ...after)
  keys.sort((a, b) => a.time - b.time)
}
