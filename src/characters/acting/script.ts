import type { Keyframe, Track } from '../../engine/types'
import { EXPRESSIONS, POSES, REST_POSE, stickFigureJoints, withExpression, type ExpressionName, type PoseKey, type PoseName, type StickPose } from '../stick-figure'
import { GAITS, gaitStrideLength, type GaitName } from '../gaits'
import { actTracks } from './act-tracks'
import { GAGS, gag, gagDuration, type GagName } from './gags'
import { lipSyncOver, type SpokenLine } from './lip-sync'
import { assertBeats } from './beat-check'
import { expandBeats, stepsDuration, type Cast, type GaitDefinition, type StepsAction } from './custom'
import { stepsToKeys } from './gags'
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
 *
 * Beats can also act on things in the scene (a code panel's lines, a prop):
 * `leap` jumps to a spot and lands on a new floor (`onto`, a scene y), `point`
 * with a `target` aims the arm at it, and `swipe` sweeps an arm across it.
 * Those beats report a `contact` time (and a `release`), so the thing they
 * touch can react on the right frame:
 *
 * ```ts
 * const line = code.line(7)
 * const script = scriptTracks('hero', [
 *   { do: 'leap', to: line.right + 30, onto: code.line(8).top },
 *   { do: 'point', target: line, say: 'Unreachable!' },
 *   { do: 'swipe', target: line },
 * ], { from: 600, ground: 330, height: 110 })
 * const swipe = script.beats[2]
 * code.remove(7, { at: swipe.contact!, duration: swipe.release! - swipe.contact!, from: 'right' })
 * ```
 */

/** The ways to get somewhere. */
export type GaitAction = GaitName
/** Everything a beat can do. */
export type Action = GaitAction | PoseName | GagName | 'look' | 'say' | 'hold' | 'stand' | 'face' | 'zip' | 'leap' | 'swipe' | 'grab' | 'throw' | 'kick' | 'put' | 'write' | 'push' | 'go'

/** Something in the scene a beat acts on: a point, or a box (a `CodeBox` fits). */
export interface BeatTarget {
  /** The centre, scene px */
  x: number
  y: number
  /** A box's left and right edges, for `swipe` (default the centre) */
  left?: number
  right?: number
}

export interface Beat {
  /** What happens: a built-in action, or one of the cast's own actions and gaits */
  do: Action | (string & {})
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
  /**
   * `point`, `swipe`, `grab`, `kick`, `put`: what to aim at; `throw`: where to
   * throw toward; `write`: where it writes (its `left` to `right`); `push`: the
   * thing it pushes, along to `to`
   */
  target?: BeatTarget
  /**
   * The floor it ends the beat on, scene y. `leap` lands on it; any other
   * beat is carried there over the beat (a line it stands on moving up).
   */
  onto?: number
}

export interface ScriptOptions extends ActingOptions, Cast {
  /** The gait `go` walks in (a built-in or one of `gaits`; default walk) */
  gait?: string
  /** The stance `stand` returns to (default rest) */
  rest?: StickPose
  /** Scene x the figure was placed at (its `x` track is an offset from here; default 0) */
  from?: number
  /** Scene y of its feet as placed (its `y` track is an offset from here; default 0) */
  ground?: number
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
  /** When each beat starts and ends, ms, and when an acting beat touches its target and lets go */
  beats: ScriptBeatSpan[]
  /** Effects to draw, with when and where (scene x on the ground): dust where a zip leaves and where a take lands */
  effects: ScriptEffect[]
}

export interface ScriptBeatSpan {
  start: number
  end: number
  /**
   * `leap`: when it lands. `point`: when the arm arrives. `swipe`: when the
   * hand reaches the target. `grab`: when the hand closes on it. `kick`: when
   * the foot meets it. `throw`: when it lets go. `put`: when the hand sets it
   * down. `write`: when the pen touches. `push`: when the hands meet it.
   */
  contact?: number
  /**
   * `swipe`: when the hand has crossed the target. `point`: when the beat
   * ends. `throw`: when it lets go. `write`: when the writing is done. `push`:
   * when it has been pushed to `to`.
   */
  release?: number
}

/** A cartoon effect a script asks for: draw it with `drawDustPuff` (progress from `time`, over `length` ms). */
export interface ScriptEffect {
  kind: 'dust'
  time: number
  /** Scene x on the ground */
  x: number
  /** Scene y of the floor it is on */
  y: number
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
  shove: 1300,
  run: 560,
}

/** The zip: legs wheel in place this long, then it shoots off this fast (px/ms), taking at least ZIP_MIN ms. */
const ZIP_WHEEL = 450
const ZIP_SPEED = 2.4
const ZIP_MIN = 160
/** Wheeling legs: run cycles while it spins up in place. */
const ZIP_WHEEL_CYCLES = 2.5

/** Leap: crouch, then take off; flight time per px travelled, and its limits; the hop above the higher floor (× height). */
const LEAP_CROUCH = 200
const LEAP_TAKEOFF = 340
const LEAP_MS_PER_PX = 1.1
const LEAP_FLIGHT = [380, 900]
const LEAP_HOP = 0.35

/** Swipe: wind-up, the hold before the strike, how long the hand takes across, follow-through and settle. */
const SWIPE_WIND = 300
const SWIPE_HOLD = 150
const SWIPE_ACROSS = 260
/** Swipe: how fast it slides along a wide target, px/ms. */
const SWIPE_SPEED = 1.2
const SWIPE_FOLLOW = 160
const SWIPE_SETTLE = 400

/** Grab: stepping in, reaching, and lifting the thing overhead. */
const GRAB_STEP = 300
const GRAB_REACH = 450
const GRAB_LIFT = 500
/** Throw: wind-up, the hold, the throw itself, follow-through and settle. */
const THROW_WIND = 350
const THROW_HOLD = 150
const THROW_ARM = 120
const THROW_FOLLOW = 180
const THROW_SETTLE = 420
/** Kick: stepping in, the leg drawn back, the kick, follow-through and settle. */
const KICK_STEP = 300
const KICK_WIND = 300
const KICK_STRIKE = 140
const KICK_FOLLOW = 150
const KICK_SETTLE = 450

/** Put: stepping in, reaching, the hand lingering, and the arm coming back. */
const PUT_REACH = 450
const PUT_LINGER = 150
const PUT_BACK = 350
/** Write: reaching to the spot, how long writing takes per px (at least WRITE_MIN), a scribble stroke, and settling. */
const WRITE_REACH = 400
const WRITE_MS_PER_PX = 12
const WRITE_MIN = 600
const WRITE_STROKE = 90
const WRITE_SETTLE = 400
/** Push: stepping up to it, setting the hands, pushing speed (px/ms) and the hands coming away. */
const PUSH_SET = 200
const PUSH_SPEED = 0.09
const PUSH_AWAY = 350

/** Default lengths, ms. */
const POSE_MOVE = 450
const POSE_BEAT = 1200
const LOOK_BEAT = 700
const TURN_AROUND = 320
const START_STOP = 220
/** Speech: ms per character, and the least a line takes. */
const SPEECH_PER_CHAR = 65
const SPEECH_MIN = 700

const isGag = (action: string): action is GagName => action in GAGS
const isPose = (action: string): action is PoseName => action in POSES

/** How long a line takes to say, ms. */
export function speechDuration(text: string): number {
  return Math.max(SPEECH_MIN, Array.from(text).length * SPEECH_PER_CHAR)
}

/**
 * Compile beats into tracks on `target` (a `stickFigureTarget`). Throws when a
 * beat has an unknown action, mood, joint or field, or misses a field its
 * action needs: the message names what was probably meant (see `checkBeats`).
 */
export function scriptTracks(target: string, written: Beat[], options: ScriptOptions = {}): ScriptResult {
  const cast: Cast = { actions: options.actions, gaits: options.gaits }
  assertBeats(written, cast)
  // `go` walks in its own gait; actions built from beats become those beats (checked again: a custom action can be wrong too).
  const goGait = options.gait ?? 'walk'
  const beats = expandBeats(written, options.actions).map((beat) => (beat.do === 'go' ? { ...beat, do: goGait } : beat))
  assertBeats(beats, cast, 'scriptTracks (after expanding custom actions)')
  /** The spec of a gait name, built in or the cast's. */
  const gaitOf = (name: string): GaitDefinition | undefined => (GAITS as Record<string, GaitDefinition>)[name] ?? options.gaits?.[name]
  const cycleOf = (name: string) => (GAIT_CYCLE_MS as Record<string, number>)[name] ?? options.gaits?.[name]?.cycle ?? 1000
  const stepsOf = (name: string) => {
    const definition = options.actions?.[name]
    return definition && 'steps' in definition ? (definition as StepsAction) : undefined
  }
  const from = options.from ?? 0
  const ground = options.ground ?? 0
  const height = options.height ?? 300
  let x = from
  let floor = ground
  let facing: 1 | -1 = options.facing ?? 1
  let pose: StickPose = options.start ?? REST_POSE
  let walkPhase = 0
  let time = 0

  const keys: PoseKey[] = [{ time: 0, pose }]
  const xKeys: Keyframe<number>[] = [{ time: 0, value: 0 }]
  const yKeys: Keyframe<number>[] = [{ time: 0, value: 0 }]
  const walkKeys: Keyframe<number>[] = [{ time: 0, value: 0 }]
  const walkingKeys: Keyframe<number>[] = [{ time: 0, value: 0 }]
  const gaitKeys: Keyframe<string>[] = [{ time: 0, value: 'walk' }]
  const facingKeys: Keyframe<number>[] = [{ time: 0, value: facing }]
  const lines: SpokenLine[] = []
  const spans: ScriptBeatSpan[] = []
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
  /** Turn to face a scene x if it is behind; returns when it is facing it. */
  const faceToward = (at: number, sceneX: number, mood?: ExpressionName): number =>
    directionTo(sceneX) !== facing ? turnAround(at, directionTo(sceneX), mood) : at
  /**
   * The angle to key for the right arm (or leg) of `body` to point at a scene
   * point. Limb angles are measured from the body (an arm from the chest), so a
   * leaning or bent body is measured first: the limb's direction at angle 0 is
   * subtracted. Past straight up the angle keeps growing (reaching behind)
   * rather than wrapping.
   */
  const aim = (body: StickPose, sceneX: number, sceneY: number, limb: 'arm' | 'leg' = 'arm'): number => {
    const arm = limb === 'arm'
    const joints = stickFigureJoints({ ...body, ...(arm ? { rightShoulder: 0, rightElbow: 0 } : { rightHip: 0, rightKnee: 0 }) }, { height, facing })
    const root = arm ? joints.shoulders.right : joints.hip
    const hanging = arm ? joints.elbows.right : joints.knees.right
    const along = (dx: number, dy: number) => (Math.atan2(facing * dx, dy) * 180) / Math.PI
    const angle = along(sceneX - (x + root.x), sceneY - (floor + root.y)) - along(hanging.x - root.x, hanging.y - root.y)
    const wrapped = ((angle % 360) + 360) % 360
    return wrapped > 270 ? wrapped - 360 : wrapped
  }
  /**
   * Where to stand so the straight right arm (palm) or leg (foot) of `body`
   * just reaches a scene point: the limb's length and where it starts are
   * measured, and the figure stands that far back along the ground.
   */
  const standToReach = (body: StickPose, sceneX: number, sceneY: number, limb: 'arm' | 'leg'): number => {
    const arm = limb === 'arm'
    const joints = stickFigureJoints({ ...body, ...(arm ? { rightShoulder: 90, rightElbow: 0, rightWrist: 0 } : { rightHip: 90, rightKnee: 0 }) }, { height, facing })
    const root = arm ? joints.shoulders.right : joints.hip
    const end = arm ? { x: (joints.hands.right.x + joints.fingertips.right.x) / 2, y: (joints.hands.right.y + joints.fingertips.right.y) / 2 } : joints.feet.right
    const length = Math.hypot(end.x - root.x, end.y - root.y)
    const dy = sceneY - (floor + root.y)
    const across = Math.abs(dy) < length ? Math.sqrt(length * length - dy * dy) : length * 0.1
    return sceneX - root.x - facing * across
  }
  /** Where the right palm of `body` is, scene px (between the wrist and the fingertips). */
  const palmOf = (body: StickPose) => {
    const joints = stickFigureJoints(body, { height, facing })
    return { x: x + (joints.hands.right.x + joints.fingertips.right.x) / 2, y: floor + (joints.hands.right.y + joints.fingertips.right.y) / 2 }
  }
  /**
   * The right arm of `body` bent to put the palm on a scene point (as near as
   * it reaches): two-bone IK. The upper arm and forearm are measured, the
   * law of cosines gives the bend, and of the two ways to bend the elbow the
   * one that lands nearer (then the lower elbow) wins.
   */
  const reachArm = (body: StickPose, sceneX: number, sceneY: number): Pick<StickPose, 'rightShoulder' | 'rightElbow'> => {
    const straight = { ...body, rightWrist: 0, rightElbow: 0, rightShoulder: aim(body, sceneX, sceneY) }
    const joints = stickFigureJoints(straight, { height, facing })
    const shoulder = { x: x + joints.shoulders.right.x, y: floor + joints.shoulders.right.y }
    const elbow = { x: x + joints.elbows.right.x, y: floor + joints.elbows.right.y }
    const palm = palmOf(straight)
    const upper = Math.hypot(elbow.x - shoulder.x, elbow.y - shoulder.y)
    const fore = Math.hypot(palm.x - elbow.x, palm.y - elbow.y)
    const distance = Math.min(upper + fore - 0.01, Math.max(Math.abs(upper - fore) + 0.01, Math.hypot(sceneX - shoulder.x, sceneY - shoulder.y)))
    const degrees = (radians: number) => (radians * 180) / Math.PI
    const atShoulder = degrees(Math.acos((upper * upper + distance * distance - fore * fore) / (2 * upper * distance)))
    const bend = 180 - degrees(Math.acos((upper * upper + fore * fore - distance * distance) / (2 * upper * fore)))
    let best = { rightShoulder: straight.rightShoulder, rightElbow: 0 }
    let bestScore = Infinity
    for (const side of [1, -1]) {
      for (const elbowSign of [1, -1]) {
        const candidate = { rightShoulder: straight.rightShoulder + side * atShoulder, rightElbow: elbowSign * bend }
        const tried = { ...body, rightWrist: 0, ...candidate }
        const reached = palmOf(tried)
        const miss = Math.hypot(reached.x - sceneX, reached.y - sceneY)
        // Among equally good bends, the elbow that hangs lower looks natural.
        const score = miss - stickFigureJoints(tried, { height, facing }).elbows.right.y * 0.001
        if (score < bestScore) {
          bestScore = score
          best = candidate
        }
      }
    }
    return best
  }
  /** Step to a scene x over `ms` from `at`; returns when it gets there. */
  const stepTo = (at: number, sceneX: number, ms: number): number => {
    if (Math.abs(sceneX - x) < 2) return at
    xKeys.push({ time: at, value: x - from }, { time: at + ms, value: sceneX - from, easing: 'ease-in-out' })
    x = sceneX
    return at + ms
  }

  for (const beat of beats) {
    const start = Math.max(beat.at ?? time, time === 0 ? 0 : keys[keys.length - 1].time)
    let end = start
    let contactAt: number | undefined
    let releaseAt: number | undefined
    const extra = beat.pose ?? {}

    const ownSteps = stepsOf(beat.do)
    if (gaitOf(beat.do)) {
      const goal = beat.to ?? x
      const direction = goal === x ? facing : directionTo(goal)
      let walkStart = start
      if (direction !== facing) walkStart = turnAround(start, direction, beat.mood)
      else if (pose.turn < 1) {
        walkStart = start + START_STOP
        keyPose(walkStart, { turn: 1, ...extra }, beat.mood)
      } else if (beat.mood || beat.pose) keyPose(start + START_STOP, extra, beat.mood)
      const distance = Math.abs(goal - x)
      const cycles = distance / gaitStrideLength(gaitOf(beat.do), height)
      const walkTime = beat.for ?? Math.max(START_STOP * 2, cycles * cycleOf(beat.do))
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
      effects.push({ kind: 'dust', time: off, x, y: floor, length: 900 })
      x = goal
      keyPose(zipEnd, {})
      end = zipEnd
    } else if (beat.do === 'leap') {
      // Crouch, spring up, arc over to the spot, and land squashed on the new floor.
      const goal = beat.to ?? x
      const landing = beat.onto ?? floor
      let crouchStart = goal === x ? start : faceToward(start, goal, beat.mood)
      if (pose.turn < 1) {
        crouchStart += START_STOP
        keyPose(crouchStart, { turn: 1 }, beat.mood)
      }
      const body = { leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50 }
      keyPose(crouchStart + LEAP_CROUCH, { stretch: 0.75, bend: 12, leftHip: 22, rightHip: 22, ...body }, beat.mood, false)
      const takeoff = crouchStart + LEAP_TAKEOFF
      keyPose(takeoff - 40, { stretch: 0.72 }, undefined, false)
      keyPose(takeoff, { stretch: 1.2, bend: -6, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4 }, undefined, false)
      const distance = Math.hypot(goal - x, landing - floor)
      const flight = beat.for ?? Math.min(LEAP_FLIGHT[1], Math.max(LEAP_FLIGHT[0], 300 + distance * LEAP_MS_PER_PX))
      // The top of the arc is a hop above the higher floor; time up and down go as the square root of each drop.
      const apex = Math.min(floor, landing) - LEAP_HOP * height
      const up = Math.sqrt(floor - apex)
      const down = Math.sqrt(landing - apex)
      const top = takeoff + (flight * up) / (up + down)
      const contact = takeoff + flight
      keyPose(top, { stretch: 1, bend: 4, leftHip: -55, leftKnee: -80, rightHip: 55, rightKnee: 80, leftShoulder: 110, rightShoulder: 110 }, undefined, false)
      keyPose(contact, { stretch: 0.72, bend: 12, leftShoulder: 75, rightShoulder: 75, leftElbow: 0, rightElbow: 0, leftHip: 18, rightHip: 18, leftKnee: 0, rightKnee: 0 }, undefined, false)
      keyPose(contact + 180, { stretch: 1.05, bend: -3 }, undefined, false)
      keyPose(contact + 340, { stretch: 1, bend: 0, leftHip: REST_POSE.leftHip, rightHip: REST_POSE.rightHip, leftShoulder: REST_POSE.leftShoulder, rightShoulder: REST_POSE.rightShoulder, leftElbow: REST_POSE.leftElbow, rightElbow: REST_POSE.rightElbow }, undefined, false)
      xKeys.push({ time: takeoff, value: x - from }, { time: contact, value: goal - from })
      yKeys.push(
        { time: takeoff, value: floor - ground },
        { time: top, value: apex - ground, easing: 'ease-out-quad' },
        { time: contact, value: landing - ground, easing: 'ease-in-quad' }
      )
      x = goal
      floor = landing
      effects.push({ kind: 'dust', time: contact, x, y: floor, length: 500 })
      end = contact + 340
      contactAt = contact
    } else if (beat.do === 'point' && beat.target) {
      // Turn toward the target if it is behind, then aim a straight arm at it and look at it.
      const target = beat.target
      const ready = faceToward(start, target.x, beat.mood)
      const body: StickPose = { ...pose, ...(beat.mood ? EXPRESSIONS[beat.mood] : {}), turn: Math.max(pose.turn, 0.6), rightElbow: 0, rightWrist: 0, ...extra }
      const head = stickFigureJoints(body, { height, facing }).head.center
      const dx = Math.abs(target.x - (x + head.x))
      const dy = target.y - (floor + head.y)
      const reach = ready + POSE_MOVE
      keyPose(reach, { ...body, rightShoulder: aim(body, target.x, target.y), lookX: 1, lookY: clampUnit(dy / Math.max(1, Math.hypot(dx, dy))) * 0.8 })
      end = reach + (beat.for ?? POSE_BEAT)
      contactAt = reach
      releaseAt = end
    } else if (beat.do === 'swipe') {
      // Step in and wind the arm up behind the head, then slide along the target
      // with the arm straight out so the hand crosses it edge to edge; follow through, settle.
      const target = beat.target ?? { x: x + facing * height * 0.5, y: floor - height * 0.6 }
      const direction = directionTo(target.x)
      const ready = faceToward(start, target.x, beat.mood)
      const near = direction === 1 ? (target.left ?? target.x) : (target.right ?? target.x)
      const far = direction === 1 ? (target.right ?? target.x) : (target.left ?? target.x)
      const windUp: StickPose = { ...pose, turn: 1, lean: -10, bend: -8, rightElbow: 40, lookX: 1, ...extra }
      keyPose(ready + SWIPE_WIND, { ...windUp, rightShoulder: aim(windUp, x - facing * height * 0.3, floor - height * 1.1) }, beat.mood, false)
      const strike: StickPose = { ...pose, lean: 6, bend: 4, rightElbow: 0, rightWrist: 0 }
      const swept: StickPose = { ...pose, lean: 14, bend: 12, rightElbow: 0, rightWrist: 0 }
      stepTo(ready, standToReach(strike, near, target.y, 'arm'), SWIPE_WIND + SWIPE_HOLD)
      keyPose(ready + SWIPE_WIND + SWIPE_HOLD, { lean: -12 }, undefined, false)
      const contact = ready + SWIPE_WIND + SWIPE_HOLD + 80
      keyPose(contact, { ...strike, rightShoulder: aim(strike, near, target.y) }, undefined, false)
      const across = contact + (beat.for ?? Math.max(SWIPE_ACROSS, Math.abs(far - near) / SWIPE_SPEED))
      xKeys.push({ time: contact, value: x - from })
      x = standToReach(swept, far, target.y, 'arm')
      xKeys.push({ time: across, value: x - from })
      keyPose(across, { ...swept, rightShoulder: aim(swept, far, target.y) }, undefined, false)
      keyPose(across + SWIPE_FOLLOW, { lean: 16, bend: 14, rightShoulder: aim(pose, far + direction * height * 0.4, target.y + height * 0.25) }, undefined, false)
      keyPose(across + SWIPE_FOLLOW + SWIPE_SETTLE, { lean: 0, bend: 0, rightShoulder: REST_POSE.rightShoulder, rightElbow: REST_POSE.rightElbow })
      end = across + SWIPE_FOLLOW + SWIPE_SETTLE
      contactAt = contact
      releaseAt = across
    } else if (beat.do === 'grab' && beat.target) {
      // Step in if it is out of reach, reach for it (bending down to something low), then lift it overhead.
      const target = beat.target
      const facingReady = faceToward(start, target.x, beat.mood)
      // Something low is reached crouched over it.
      const low = target.y > floor - height * 0.5
      // In profile, so the arm reaches straight out toward it (turned to the viewer, it would swing across).
      const reaching: StickPose = {
        ...pose,
        turn: 1,
        rightElbow: 0,
        bend: low ? 35 : 0,
        lean: low ? 12 : 0,
        stretch: low ? 0.75 : 1,
        lookX: 1,
        lookY: low ? 0.8 : 0,
        ...extra,
      }
      const ready = stepTo(facingReady, standToReach(reaching, target.x, target.y, 'arm'), GRAB_STEP)
      const contact = ready + GRAB_REACH
      keyPose(contact, { ...reaching, rightShoulder: aim(reaching, target.x, target.y) }, beat.mood, false)
      keyPose(contact + 120, {}, undefined, false)
      keyPose(contact + GRAB_LIFT, { bend: 0, lean: -3, stretch: 1, rightShoulder: 165, rightElbow: 20, lookY: -0.6 })
      end = contact + GRAB_LIFT + 150
      contactAt = contact
    } else if (beat.do === 'throw') {
      // Wind the arm back over the shoulder, then throw it forward and up, and let go.
      const toward = beat.target?.x ?? beat.to ?? x + facing * height
      const ready = faceToward(start, toward, beat.mood)
      const back: StickPose = { ...pose, turn: 1, lean: -12, bend: -10, rightElbow: 60, stretch: 0.95, lookX: 1, lookY: -0.3, ...extra }
      keyPose(ready + THROW_WIND, { ...back, rightShoulder: aim(back, x - facing * height * 0.4, floor - height * 1.05) }, beat.mood, false)
      keyPose(ready + THROW_WIND + THROW_HOLD, { lean: -14 }, undefined, false)
      const release = ready + THROW_WIND + THROW_HOLD + THROW_ARM
      const forward: StickPose = { ...pose, lean: 14, bend: 12, rightElbow: 0, stretch: 1.04 }
      keys.push({ time: release, pose: (pose = { ...forward, rightShoulder: aim(forward, x + facing * height, floor - height * 1.1) }), easing: 'ease-in', act: false })
      keyPose(release + THROW_FOLLOW, { lean: 18, bend: 14, rightShoulder: 55, stretch: 1 }, undefined, false)
      keyPose(release + THROW_FOLLOW + THROW_SETTLE, { lean: 0, bend: 0, rightShoulder: REST_POSE.rightShoulder, rightElbow: REST_POSE.rightElbow, lookY: 0 })
      end = release + THROW_FOLLOW + THROW_SETTLE
      contactAt = release
      releaseAt = release
    } else if (beat.do === 'kick' && beat.target) {
      // Step up beside it, draw the leg back, and kick through it, arms out for balance.
      const target = beat.target
      const facingReady = faceToward(start, target.x, beat.mood)
      const strike: StickPose = { ...pose, turn: 1, lean: -12, bend: -6, rightKnee: 0, leftShoulder: 100, rightShoulder: 70 }
      const ready = stepTo(facingReady, standToReach(strike, target.x, target.y, 'leg'), KICK_STEP)
      const arms = { leftShoulder: 70, rightShoulder: 50, leftElbow: -20, rightElbow: 20 }
      keyPose(ready + KICK_WIND, { turn: 1, lean: 8, bend: 6, rightHip: -40, rightKnee: 80, lookX: 1, lookY: 0.7, ...arms, ...extra }, beat.mood, false)
      const contact = ready + KICK_WIND + KICK_STRIKE
      const kickAngle = aim(strike, target.x, target.y, 'leg')
      keys.push({ time: contact, pose: (pose = { ...pose, ...strike, rightHip: kickAngle }), easing: 'ease-in', act: false })
      keyPose(contact + KICK_FOLLOW, { lean: -15, rightHip: kickAngle + 20 }, undefined, false)
      keyPose(contact + KICK_FOLLOW + KICK_SETTLE, {
        lean: 0,
        bend: 0,
        rightHip: REST_POSE.rightHip,
        rightKnee: 0,
        leftShoulder: REST_POSE.leftShoulder,
        rightShoulder: REST_POSE.rightShoulder,
        leftElbow: REST_POSE.leftElbow,
        rightElbow: REST_POSE.rightElbow,
        lookY: 0,
      })
      end = contact + KICK_FOLLOW + KICK_SETTLE
      contactAt = contact
    } else if (beat.do === 'put' && beat.target) {
      // Step to where the arm just reaches the spot, set the thing down, and bring the arm back.
      const target = beat.target
      const facingReady = faceToward(start, target.x, beat.mood)
      const low = target.y > floor - height * 0.5
      const reaching: StickPose = { ...pose, turn: 1, rightElbow: 0, rightWrist: 0, bend: low ? 35 : 0, lean: low ? 12 : 0, stretch: low ? 0.75 : 1, lookX: 1, lookY: low ? 0.8 : 0, ...extra }
      const ready = stepTo(facingReady, standToReach(reaching, target.x, target.y, 'arm'), GRAB_STEP)
      const contact = ready + PUT_REACH
      keyPose(contact, { ...reaching, rightShoulder: aim(reaching, target.x, target.y) }, beat.mood, false)
      keyPose(contact + PUT_LINGER, {}, undefined, false)
      keyPose(contact + PUT_LINGER + PUT_BACK, { bend: 0, lean: 0, stretch: 1, rightShoulder: REST_POSE.rightShoulder, rightElbow: REST_POSE.rightElbow, lookY: 0 })
      end = contact + PUT_LINGER + PUT_BACK
      contactAt = contact
    } else if (beat.do === 'write' && beat.target) {
      // Reach the pen to the spot, then scribble along it left to right while the text goes in,
      // shuffling along with the pen when the line is longer than the arm reaches.
      const target = beat.target
      const left = target.left ?? target.x
      const right = target.right ?? target.x
      const facingReady = faceToward(start, (left + right) / 2, beat.mood)
      const writing: StickPose = { ...pose, turn: 1, rightElbow: 0, rightWrist: 0, ...EXPRESSIONS.thinking, lookX: 1, lookY: 0, ...extra }
      // Stand a little inside arm's length of the pen, so the elbow has room to bend either way.
      const standFor = (penX: number) => standToReach(writing, penX, target.y, 'arm') + facing * height * 0.08
      /** Whether the pen reaches a scene x from where the figure stands now. */
      const reachable = (penX: number) => {
        const palm = palmOf({ ...writing, ...reachArm(writing, penX, target.y), rightWrist: 0 })
        return Math.hypot(palm.x - penX, palm.y - target.y) < 2
      }
      const first = facing === 1 ? left : right
      const ready = stepTo(facingReady, standFor((left + right) / 2), GRAB_STEP)
      // Too wide to write from one place: it starts at the first letter and moves along with the pen.
      const slides = !reachable(left) || !reachable(right)
      const contact = slides ? stepTo(ready, standFor(left), GRAB_STEP) + WRITE_REACH : ready + WRITE_REACH
      keyPose(contact, { ...writing, ...reachArm(writing, slides ? left : first, target.y) }, beat.mood, false)
      const length = beat.for ?? Math.max(WRITE_MIN, Math.abs(right - left) * WRITE_MS_PER_PX)
      if (slides) xKeys.push({ time: contact, value: x - from })
      // Writing runs left to right on the page, whichever way the figure faces.
      for (let t = WRITE_STROKE, i = 0; t <= length; t += WRITE_STROKE, i++) {
        const along = left + ((right - left) * Math.min(t, length)) / length
        if (slides) {
          x = standFor(along)
          xKeys.push({ time: contact + t, value: x - from })
        }
        const wiggle = (i % 2 === 0 ? -1 : 1) * height * 0.02
        keyPose(contact + t, reachArm(writing, along, target.y + wiggle), undefined, false)
      }
      const release = contact + length
      keyPose(release, reachArm(writing, right, target.y), undefined, false)
      keyPose(release + WRITE_SETTLE, { rightShoulder: REST_POSE.rightShoulder, rightElbow: REST_POSE.rightElbow, ...EXPRESSIONS.happy })
      end = release + WRITE_SETTLE
      contactAt = contact
      releaseAt = release
    } else if (beat.do === 'push' && beat.target) {
      // Set both hands on the near side, lean in and walk it along to `to`, then let go.
      const target = beat.target
      const goal = beat.to ?? target.x
      const ready = faceToward(start, x + (goal >= target.x ? 1 : -1), beat.mood)
      const near = facing === 1 ? (target.left ?? target.x) : (target.right ?? target.x)
      const pushing: StickPose = { ...pose, turn: 1, lean: 16, bend: 8, rightWrist: 0, leftWrist: 0, lookX: 1, ...extra }
      // A little closer than arm's length, so the elbows bend as it leans in.
      const reach = standToReach(pushing, near, target.y, 'arm')
      const stepped = stepTo(ready, reach + facing * height * 0.06, GRAB_STEP)
      const arm = reachArm(pushing, near, target.y)
      // The left arm mirrors the right: its angles are measured to its own side.
      const set = { ...pushing, ...arm, leftShoulder: -arm.rightShoulder, leftElbow: -arm.rightElbow }
      const contact = stepped + PUSH_SET
      keyPose(contact, set, beat.mood, false)
      const distance = Math.abs(goal - target.x)
      const release = contact + (beat.for ?? Math.max(600, distance / PUSH_SPEED))
      const cycles = distance / gaitStrideLength('shove', height)
      gaitKeys.push({ time: contact, value: 'shove' })
      walkingKeys.push({ time: contact, value: 0 }, { time: contact + START_STOP, value: 1, easing: 'ease-out' }, { time: release - START_STOP, value: 1 }, { time: release, value: 0, easing: 'ease-in' })
      walkKeys.push({ time: contact, value: walkPhase }, { time: release, value: walkPhase + cycles })
      walkPhase += cycles
      xKeys.push({ time: contact, value: x - from }, { time: release, value: x + (goal - target.x) - from })
      x += goal - target.x
      keyPose(release, {}, undefined, false)
      keyPose(release + PUSH_AWAY, { lean: 0, bend: 0, rightShoulder: REST_POSE.rightShoulder, leftShoulder: REST_POSE.leftShoulder, rightElbow: REST_POSE.rightElbow, leftElbow: REST_POSE.leftElbow })
      end = release + PUSH_AWAY
      contactAt = contact
      releaseAt = release
    } else if (ownSteps) {
      // A custom action written as steps: spliced in like a gag, built on the current pose.
      const from = beat.mood ? withExpression(pose, beat.mood) : pose
      const steps = ownSteps.steps(from, beat)
      const keysOfAction = stepsToKeys(steps, { at: start, from })
      keys.push(...keysOfAction)
      pose = keysOfAction[keysOfAction.length - 1].pose as StickPose
      end = start + Math.max(stepsDuration(steps), beat.for ?? 0)
    } else if (isGag(beat.do)) {
      const keysOfGag = gag(beat.do, { at: start, from: beat.mood ? withExpression(pose, beat.mood) : pose })
      keys.push(...keysOfGag)
      pose = keysOfGag[keysOfGag.length - 1].pose as StickPose
      end = start + gagDuration(beat.do)
      // Landing raises dust: the take comes down 900 ms in, a landing 120 ms in.
      if (beat.do === 'take') effects.push({ kind: 'dust', time: start + 900, x, y: floor, length: 500 })
      if (beat.do === 'land') effects.push({ kind: 'dust', time: start + 120, x, y: floor, length: 500 })
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
      const named = beat.do === 'stand' ? (options.rest ?? REST_POSE) : POSES[beat.do as PoseName]
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
      const begin = gaitOf(beat.do) || isGag(beat.do) || ownSteps ? start : start + Math.min(150, (end - start) / 4)
      const finish = gaitOf(beat.do) ? end : Math.max(begin + 200, end - 100)
      lines.push({ text: beat.say, start: begin, end: finish })
      if (beat.do === 'say') addTalkingHead(keys, pose, begin, finish)
    }
    // Carried to a new floor over the beat (a leap lands on its own).
    if (beat.onto !== undefined && beat.do !== 'leap' && beat.onto !== floor) {
      yKeys.push({ time: start, value: floor - ground }, { time: end, value: beat.onto - ground, easing: 'ease-in-out' })
      floor = beat.onto
    }
    // The pose holds to the end of the beat (the acting pass drifts long holds).
    if (end > keys[keys.length - 1].time) keys.push({ time: end, pose })
    spans.push({ start, end, ...(contactAt !== undefined ? { contact: contactAt } : {}), ...(releaseAt !== undefined ? { release: releaseAt } : {}) })
    time = end
  }

  const tracks = actTracks(target, mergeCloseKeys(keys), options)
  const extraTracks: Track[] = [
    { id: `${target}-x`, target, property: 'x', keyframes: xKeys },
    { id: `${target}-y`, target, property: 'y', keyframes: yKeys },
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

const clampUnit = (value: number) => Math.max(-1, Math.min(1, value))

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
