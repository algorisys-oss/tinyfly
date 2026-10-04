import type { EasingType, Track } from '../engine/types'
import { getEasingFunction } from '../engine/interpolation/easing'
import { HAND_REST, HAND_SHAPES, handPose, mixHandPoses, type HandPose, type HandShapeName } from './hands/hand-rig'
import {
  REST_POSE,
  blendPose,
  withExpression,
  type DanceFrame,
  type Dancer,
  type Expression,
  type ExpressionName,
  type StickPose,
} from './stick-figure'

/**
 * Dancing for the stick figure, as plain data.
 *
 * A **move** is a short loop of poses keyed in beats (a disco point is two
 * beats: arm up, arm down). A **style** is a stance, a groove (the bounce and
 * sway every beat carries), its moves and a routine that strings them
 * together. Everything is counted in beats, so the same dance plays at any
 * tempo: `beat = time × bpm / 60000`.
 *
 * Every function here is pure: the same style and beat always give the same
 * pose, so a dance scrubs, renders to video and syncs to music exactly.
 */

/** Hands in a dance key: a shape name or a full hand pose, per side. */
export interface DanceHands {
  left?: HandShapeName | MudraName | HandPose
  right?: HandShapeName | MudraName | HandPose
}

export interface DanceKey {
  /** When, in beats from the start of the move */
  beat: number
  /** Joints that change from the previous key (the first key builds on the stance) */
  pose?: Partial<StickPose>
  /** Start again from the stance before applying `pose`, instead of from the previous key */
  reset?: boolean
  /** Hand shapes from this key on */
  hands?: DanceHands
  /** Easing into this key (default: the move's, else ease-in-out) */
  easing?: EasingType
  /** Parts of the feet that strike the floor at this key: the sounds of tap, a stamp */
  taps?: TapName[]
}

/** Where a foot strikes the floor: its toe (the ball) or its heel. */
export type TapName = 'leftToe' | 'leftHeel' | 'rightToe' | 'rightHeel'

/** One strike of a foot, `beat` beats from the start of the dance. */
export interface DanceTap {
  beat: number
  tap: TapName
}

export interface DanceMove {
  label: string
  /** Length of one loop, in beats */
  beats: number
  /** Keys in beat order; after the last, the move eases back to the first */
  keys: DanceKey[]
  /** Easing between keys that do not name their own */
  easing?: EasingType
}

/**
 * What every beat carries, whatever the move: a knee bounce (down on the beat
 * for hip hop, up for a springy jazz feel) and a side-to-side sway.
 */
export interface Groove {
  /** Knee bend at the bottom of the bounce, degrees (0 none) */
  bounce: number
  /** Where the bounce is lowest: on the beat (`down`, default) or between beats (`up`) */
  accent?: 'down' | 'up'
  /** Upper-body sway, degrees either side, over two beats */
  sway?: number
}

/** One step of a routine: a move, for how many beats, optionally mirrored. */
export interface RoutineStep {
  move: string
  beats: number
  /** Dance it on the other side: left and right swap */
  mirror?: boolean
}

export interface DanceStyle {
  label: string
  /** The tempo it is made for; any tempo plays it */
  bpm: number
  /** Joints that differ from rest while dancing: the base every move builds on */
  stance: Partial<StickPose>
  /** The face while dancing */
  expression?: ExpressionName | Partial<Expression>
  /** Hand shapes before any key sets them (default relaxed) */
  hands?: DanceHands
  groove: Groove
  moves: Record<string, DanceMove>
  /** The moves in order; it loops */
  routine: RoutineStep[]
}

/** Beats over which one routine step blends into the next. */
const STEP_BLEND = 0.5

/**
 * Hand gestures of Indian classical dance (hasta mudras), as cartoon-hand
 * poses, palm toward the viewer. Use them by name in a key's `hands`.
 */
export const MUDRAS = {
  /** Flag: fingers together and straight, thumb bent in */
  pataka: handPose({ 'thumb.curl': 0.3, 'thumb.across': 0.6, 'index.curl': 0, 'middle.curl': 0, 'ring.curl': 0, 'pinky.curl': 0, spread: 0, turn: 2 }),
  /** Pataka with the ring finger bent */
  tripataka: handPose({ 'thumb.curl': 0.3, 'thumb.across': 0.6, 'index.curl': 0, 'middle.curl': 0, 'ring.curl': 1, 'pinky.curl': 0, spread: 0, turn: 2 }),
  /** Lotus in bloom: fingers fanned, each a little more curled than the last */
  alapadma: handPose({ 'thumb.curl': 0.1, 'thumb.across': 0, 'index.curl': 0.05, 'middle.curl': 0.15, 'ring.curl': 0.25, 'pinky.curl': 0.35, spread: 1, turn: 2 }),
  /** Fist */
  mushti: HAND_SHAPES.fist,
  /** Fist, thumb up */
  shikhara: HAND_SHAPES.thumbsUp,
  /** Swan's beak: thumb and index touch, the others fanned */
  hamsasya: handPose({ 'thumb.curl': 0.15, 'thumb.across': 0.6, 'index.curl': 0.6, 'middle.curl': 0, 'ring.curl': 0, 'pinky.curl': 0, spread: 0.7, turn: 2 }),
  /** Bracelet: thumb, index and middle meet, ring and little finger out */
  katakamukha: handPose({ 'thumb.curl': 0.2, 'thumb.across': 0.6, 'index.curl': 0.65, 'middle.curl': 0.7, 'ring.curl': 0, 'pinky.curl': 0, spread: 0.4, turn: 2 }),
} satisfies Record<string, HandPose>

export type MudraName = keyof typeof MUDRAS

/** A key's hand: a shape or mudra by name, or a pose. */
function resolveHand(hand: HandShapeName | MudraName | HandPose): HandPose {
  if (typeof hand !== 'string') return hand
  return hand in MUDRAS ? MUDRAS[hand as MudraName] : HAND_SHAPES[hand as HandShapeName]
}

/** The full pose and hands at each key: each builds on the previous one (or the stance). */
interface ResolvedKey {
  beat: number
  pose: StickPose
  left: HandPose
  right: HandPose
  easing?: EasingType
}

function resolveKeys(move: DanceMove, stance: StickPose, hands: Required<HandPair>): ResolvedKey[] {
  const resolved: ResolvedKey[] = []
  for (const key of move.keys) {
    const previous = resolved[resolved.length - 1]
    const from = !previous || key.reset ? { pose: stance, ...hands } : previous
    resolved.push({
      beat: key.beat,
      pose: { ...from.pose, ...key.pose },
      left: key.hands?.left ? resolveHand(key.hands.left) : from.left,
      right: key.hands?.right ? resolveHand(key.hands.right) : from.right,
      easing: key.easing ?? move.easing,
    })
  }
  return resolved
}

interface HandPair {
  left?: HandPose
  right?: HandPose
}

/** `value` wrapped into 0..length. */
const wrap = (value: number, length: number) => ((value % length) + length) % length

/** A move at `beat` (it loops), built on `stance`. */
function moveFrame(move: DanceMove, beat: number, stance: StickPose, hands: Required<HandPair>): DanceFrame {
  const keys = resolveKeys(move, stance, hands)
  if (keys.length === 0) return { pose: stance, hands }
  const local = wrap(beat, move.beats)
  // The key at or before `local`; before the first key, the last one (the loop wraps).
  let index = keys.length - 1
  for (let i = 0; i < keys.length; i++) if (keys[i].beat <= local) index = i
  const from = keys[index]
  const to = keys[(index + 1) % keys.length]
  const start = from.beat <= local ? from.beat : from.beat - move.beats
  const end = to.beat > start ? to.beat : to.beat + move.beats
  const t = end > start ? (local - start) / (end - start) : 0
  const eased = getEasingFunction(to.easing ?? 'ease-in-out')(Math.min(1, Math.max(0, t)))
  return {
    pose: blendPose(from.pose, to.pose, eased),
    hands: { left: mixHandPoses(from.left, to.left, eased), right: mixHandPoses(from.right, to.right, eased) },
  }
}

const SIDED: Array<[keyof StickPose, keyof StickPose]> = [
  ['leftShoulder', 'rightShoulder'],
  ['leftElbow', 'rightElbow'],
  ['leftWrist', 'rightWrist'],
  ['leftHip', 'rightHip'],
  ['leftKnee', 'rightKnee'],
  ['leftAnkle', 'rightAnkle'],
  ['leftFootOut', 'rightFootOut'],
  ['leftEye', 'rightEye'],
  ['leftBrow', 'rightBrow'],
]

/** Fields that turn the figure one way or the other: mirrored, they change sign. */
const SIGNED: Array<keyof StickPose> = ['lean', 'headTilt', 'lookX', 'spin']

/** A pose danced on the other side: left and right swap, leans and spins reverse. */
export function mirrorPose(pose: StickPose): StickPose {
  const out = { ...pose }
  for (const [left, right] of SIDED) {
    out[left] = pose[right]
    out[right] = pose[left]
  }
  for (const field of SIGNED) out[field] = -pose[field]
  return out
}

/** Bounce and sway at `beat`, on top of a pose. */
export function applyGroove(pose: StickPose, groove: Groove, beat: number): StickPose {
  const phase = wrap(beat, 1)
  // 1 at the bottom of the bounce: on the beat for `down`, half way between for `up`.
  const wave = (1 + Math.cos(2 * Math.PI * phase)) / 2
  const depth = groove.bounce * (groove.accent === 'up' ? 1 - wave : wave)
  // Bending at the knees with the feet planted: thighs out, shins back in, so the hips drop.
  return {
    ...pose,
    leftHip: pose.leftHip + depth / 2,
    rightHip: pose.rightHip + depth / 2,
    leftKnee: pose.leftKnee + depth,
    rightKnee: pose.rightKnee + depth,
    lean: pose.lean + (groove.sway ?? 0) * Math.sin(Math.PI * beat),
  }
}

/** The stance a style dances from, with its face. */
export function danceStance(style: DanceStyle): StickPose {
  const stance = { ...REST_POSE, ...style.stance }
  return style.expression ? withExpression(stance, style.expression) : stance
}

function styleHands(style: DanceStyle): Required<HandPair> {
  return {
    left: style.hands?.left ? resolveHand(style.hands.left) : HAND_REST,
    right: style.hands?.right ? resolveHand(style.hands.right) : HAND_REST,
  }
}

function stepFrame(style: DanceStyle, step: RoutineStep, beat: number): DanceFrame {
  const move = style.moves[step.move]
  if (!move) throw new Error(`dance: "${style.label}" has no move "${step.move}"`)
  const frame = moveFrame(move, beat, danceStance(style), styleHands(style))
  if (!step.mirror) return frame
  return { pose: mirrorPose(frame.pose), hands: { left: frame.hands?.right, right: frame.hands?.left } }
}

export interface DanceOptions {
  /** Dance one move on a loop instead of the style's routine */
  move?: string
  /** Mirror it (with `move`) */
  mirror?: boolean
}

/**
 * The figure dancing `style` at `beat` (beats from the start; it loops): the
 * pose, with the groove, and the hand shapes. Moves blend into each other
 * over half a beat.
 */
export function danceFrame(style: DanceStyle | DanceStyleName, beat: number, options: DanceOptions = {}): DanceFrame {
  const dance = typeof style === 'string' ? DANCE_STYLES[style] : style
  let frame: DanceFrame
  if (options.move) {
    frame = stepFrame(dance, { move: options.move, beats: 1, mirror: options.mirror }, beat)
  } else {
    const steps = dance.routine
    const total = steps.reduce((sum, step) => sum + step.beats, 0)
    const local = wrap(beat, total)
    let start = 0
    let index = 0
    while (index < steps.length - 1 && local >= start + steps[index].beats) start += steps[index++].beats
    const into = local - start
    frame = stepFrame(dance, steps[index], into)
    // Ease out of the previous step (still moving) into this one.
    if (into < STEP_BLEND && steps.length > 1 && beat >= STEP_BLEND) {
      const previous = steps[(index - 1 + steps.length) % steps.length]
      const before = stepFrame(dance, previous, previous.beats + into)
      const t = getEasingFunction('ease-in-out')(into / STEP_BLEND)
      frame = {
        pose: blendPose(before.pose, frame.pose, t),
        hands: { left: mixHandPoses(before.hands!.left!, frame.hands!.left!, t), right: mixHandPoses(before.hands!.right!, frame.hands!.right!, t) },
      }
    }
  }
  return { ...frame, pose: applyGroove(frame.pose, dance.groove, beat) }
}

/** Just the pose of {@link danceFrame}. */
export function dancePose(style: DanceStyle | DanceStyleName, beat: number, options: DanceOptions = {}): StickPose {
  return danceFrame(style, beat, options).pose
}

/** Length of a style's routine, in beats. */
export function routineBeats(style: DanceStyle | DanceStyleName): number {
  const dance = typeof style === 'string' ? DANCE_STYLES[style] : style
  return dance.routine.reduce((sum, step) => sum + step.beats, 0)
}

const MIRRORED_TAPS: Record<TapName, TapName> = { leftToe: 'rightToe', rightToe: 'leftToe', leftHeel: 'rightHeel', rightHeel: 'leftHeel' }

/** A move's taps from `start` (the beat it starts on) for `length` beats, looping it. */
function moveTaps(move: DanceMove, start: number, length: number, mirror: boolean | undefined, out: DanceTap[], from: number, to: number) {
  for (let loop = 0; loop * move.beats < length; loop++) {
    for (const key of move.keys) {
      const within = loop * move.beats + key.beat
      const beat = start + within
      if (within >= length || beat < from || beat >= to) continue
      for (const tap of key.taps ?? []) out.push({ beat, tap: mirror ? MIRRORED_TAPS[tap] : tap })
    }
  }
}

/**
 * The foot strikes between beat `from` (included) and `to` (not), in order:
 * what a scene plays tap sounds or stamps on. Call it each frame with the
 * previous frame's beat and this one's to get exactly the taps that just
 * happened; it follows the routine (and its mirrored steps) as
 * {@link danceFrame} does, looping it.
 */
export function danceTaps(style: DanceStyle | DanceStyleName, from: number, to: number, options: DanceOptions = {}): DanceTap[] {
  const dance = typeof style === 'string' ? DANCE_STYLES[style] : style
  const out: DanceTap[] = []
  if (to <= from) return out
  if (options.move) {
    const move = dance.moves[options.move]
    const first = Math.floor(from / move.beats) * move.beats
    moveTaps(move, first, Math.ceil((to - first) / move.beats) * move.beats, options.mirror, out, from, to)
  } else {
    const total = routineBeats(dance)
    for (let loop = Math.floor(from / total) * total; loop < to; loop += total) {
      let start = loop
      for (const step of dance.routine) {
        moveTaps(dance.moves[step.move], start, step.beats, step.mirror, out, from, to)
        start += step.beats
      }
    }
  }
  return out.sort((a, b) => a.beat - b.beat)
}

/** Beats since `start` at `time` (both ms), at `bpm`. */
export function beatAt(time: number, bpm: number, start = 0): number {
  return ((time - start) * bpm) / 60000
}

/**
 * A {@link Dancer} for `stickFigureTarget({ dance })`: the target's `beat`
 * prop then plays the style (and `dancing` blends it in).
 */
export function dancer(style: DanceStyle | DanceStyleName, options: DanceOptions = {}): Dancer {
  return (beat) => danceFrame(style, beat, options)
}

export interface DanceTrackOptions {
  /** Tempo (default the style's) */
  bpm: number
  /** How many beats to dance */
  beats: number
  /** When the dance starts, ms (default 0) */
  start?: number
  /** Beats to blend in from standing and back out at the end (default 1) */
  fade?: number
}

/**
 * Tracks that make a `stickFigureTarget({ dance })` dance: `beat` counts up
 * at the tempo, and `dancing` blends in at the start and out at the end.
 * Two small tracks, so the timeline JSON stays tiny.
 */
export function danceTracks(target: string, options: DanceTrackOptions): Track[] {
  const start = options.start ?? 0
  const msPerBeat = 60000 / options.bpm
  const end = start + options.beats * msPerBeat
  const fade = Math.min((options.fade ?? 1) * msPerBeat, (end - start) / 2)
  return [
    {
      id: `${target}-beat`,
      target,
      property: 'beat',
      keyframes: [
        { time: start, value: 0 },
        { time: end, value: options.beats, easing: 'linear' },
      ],
    },
    {
      id: `${target}-dancing`,
      target,
      property: 'dancing',
      keyframes: [
        { time: start, value: 0 },
        { time: start + fade, value: 1, easing: 'ease-in-out' },
        { time: end - fade, value: 1 },
        { time: end, value: 0, easing: 'ease-in-out' },
      ],
    },
  ]
}

export interface DanceBakeOptions extends DanceOptions {
  bpm?: number
  /** How many beats to bake (default the routine, or the move's length) */
  beats?: number
  /** When it starts, ms (default 0) */
  start?: number
  /** Keyframes per beat (default 4) */
  samplesPerBeat?: number
}

/**
 * The dance as plain pose keyframes, for any stick-figure target and for
 * timelines that must stand alone as JSON (no `dance` option needed). Only
 * joints that move get a track. Hand shapes are not target props, so they
 * are not baked.
 */
export function bakeDanceTracks(target: string, style: DanceStyle | DanceStyleName, options: DanceBakeOptions = {}): Track[] {
  const dance = typeof style === 'string' ? DANCE_STYLES[style] : style
  const bpm = options.bpm ?? dance.bpm
  const beats = options.beats ?? (options.move ? dance.moves[options.move].beats : routineBeats(dance))
  const perBeat = options.samplesPerBeat ?? 4
  const start = options.start ?? 0
  const count = Math.round(beats * perBeat)
  const samples = Array.from({ length: count + 1 }, (_, i) => {
    const beat = i / perBeat
    return { time: start + (beat * 60000) / bpm, pose: dancePose(dance, beat, options) }
  })
  const fields = Object.keys(REST_POSE) as (keyof StickPose)[]
  return fields
    .filter((field) => samples.some((s) => s.pose[field] !== samples[0].pose[field]) || samples[0].pose[field] !== REST_POSE[field])
    .map((field) => ({
      id: `${target}-${field}`,
      target,
      property: field,
      keyframes: samples.map((s) => ({ time: s.time, value: s.pose[field] })),
    }))
}

// ───────────────────────────────────────────────────────────────────────────
// The styles.
//
// Angles follow the stick figure: limbs are degrees from hanging down, and
// positive spreads outward on each side (90 straight out, 180 straight up).
// An elbow, wrist or knee adds to the bone before it. Seen front-on, a
// figure's right side is on the right of the picture.
// ───────────────────────────────────────────────────────────────────────────

/** A crisp hit that settles, for sharp choreography. */
const HIT: EasingType = { type: 'back', mode: 'out', overshoot: 1.1 }
const SNAP: EasingType = 'ease-out-cubic'

const DISCO: DanceStyle = {
  label: 'Disco',
  bpm: 120,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 6, rightKnee: 6 },
  expression: { smile: 0.9, mouth: 0.15, leftBrow: 0.3, rightBrow: 0.3 },
  groove: { bounce: 10, accent: 'down', sway: 2 },
  moves: {
    point: {
      label: 'The point',
      beats: 2,
      easing: SNAP,
      keys: [
        {
          beat: 0,
          pose: { rightShoulder: 150, rightElbow: 0, rightWrist: 0, leftShoulder: 40, leftElbow: -105, leftWrist: -20, lean: -5, headTilt: 8, rightHip: 18, leftHip: 6, lookX: 0.6, lookY: -0.7 },
          hands: { right: 'point', left: 'fist' },
        },
        { beat: 1, pose: { rightShoulder: -30, rightWrist: 10, lean: 5, headTilt: -6, rightHip: 6, leftHip: 18, lookX: -0.4, lookY: 0.6 } },
      ],
    },
    roll: {
      label: 'Roll the arms',
      beats: 2,
      easing: 'linear',
      keys: [
        { beat: 0, pose: { leftShoulder: 42, leftElbow: -128, rightShoulder: 26, rightElbow: -100, rightHip: 18, leftHip: 6, lean: -3 }, hands: { left: 'fist', right: 'fist' } },
        { beat: 0.5, pose: { leftShoulder: 26, leftElbow: -100, rightShoulder: 42, rightElbow: -128 } },
        { beat: 1, pose: { leftShoulder: 42, leftElbow: -128, rightShoulder: 26, rightElbow: -100, rightHip: 6, leftHip: 18, lean: 3 } },
        { beat: 1.5, pose: { leftShoulder: 26, leftElbow: -100, rightShoulder: 42, rightElbow: -128 } },
      ],
    },
    bump: {
      label: 'Bump and clap',
      beats: 4,
      keys: [
        { beat: 0, pose: { lean: -10, rightHip: 22, leftHip: 4, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: 'spread', right: 'spread' }, easing: SNAP },
        { beat: 1, pose: { lean: 0, rightHip: 10, leftHip: 10, leftShoulder: 168, rightShoulder: 168, leftElbow: 22, rightElbow: 22, leftWrist: 0, rightWrist: 0 }, hands: { left: 'flat', right: 'flat' } },
        { beat: 2, pose: { lean: 10, rightHip: 4, leftHip: 22, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: 'spread', right: 'spread' }, easing: SNAP },
        { beat: 3, pose: { lean: 0, rightHip: 10, leftHip: 10, leftShoulder: 168, rightShoulder: 168, leftElbow: 22, rightElbow: 22, leftWrist: 0, rightWrist: 0 }, hands: { left: 'flat', right: 'flat' } },
      ],
    },
  },
  routine: [
    { move: 'point', beats: 8 },
    { move: 'roll', beats: 4 },
    { move: 'point', beats: 8, mirror: true },
    { move: 'bump', beats: 8 },
  ],
}

/** Side-on running-man limbs: forward is +x, which is a negative angle for the left side. */
const HIP_HOP: DanceStyle = {
  label: 'Hip hop',
  bpm: 95,
  stance: { leftHip: 14, rightHip: 14, leftKnee: 20, rightKnee: 20, leftShoulder: 22, rightShoulder: 22, leftElbow: -30, rightElbow: -30, leftFootOut: 0.15, rightFootOut: 0.15 },
  expression: 'smug',
  hands: { left: 'relaxed', right: 'relaxed' },
  groove: { bounce: 18, accent: 'down' },
  moves: {
    bounce: {
      label: 'Bounce',
      beats: 2,
      keys: [
        { beat: 0, pose: { leftShoulder: 30, rightShoulder: 30, leftElbow: -50, rightElbow: -50, lean: -3, headTilt: -5, leftWrist: -20, rightWrist: -20 } },
        { beat: 1, pose: { leftShoulder: 14, rightShoulder: 14, leftElbow: -18, rightElbow: -18, lean: 3, headTilt: 5, leftWrist: 0, rightWrist: 0 } },
      ],
    },
    runningMan: {
      label: 'Running man',
      beats: 2,
      keys: [
        {
          beat: 0,
          reset: true,
          pose: { turn: 0.85, leftHip: -84, leftKnee: -112, leftAnkle: 25, rightHip: -26, rightKnee: 8, leftShoulder: 35, leftElbow: -50, rightShoulder: 45, rightElbow: 75, lean: 6 },
          hands: { left: 'fist', right: 'fist' },
        },
        { beat: 0.5, pose: { leftHip: -4, leftKnee: -18, leftAnkle: 0, rightHip: 4, rightKnee: 18, leftShoulder: 5, leftElbow: -40, rightShoulder: 5, rightElbow: 40 } },
        { beat: 1, pose: { rightHip: 84, rightKnee: 112, rightAnkle: 25, leftHip: 26, leftKnee: -8, rightShoulder: -35, rightElbow: 50, leftShoulder: -45, leftElbow: -75 } },
        { beat: 1.5, pose: { rightHip: 4, rightKnee: 18, rightAnkle: 0, leftHip: -4, leftKnee: -18, rightShoulder: -5, rightElbow: 40, leftShoulder: -5, leftElbow: -40 } },
      ],
    },
    armWave: {
      label: 'Arm wave',
      beats: 4,
      keys: [
        { beat: 0, reset: true, pose: { leftShoulder: 90, rightShoulder: 90, leftElbow: 0, rightElbow: 0 }, hands: { left: 'flat', right: 'flat' } },
        { beat: 0.5, pose: { leftWrist: 45, leftElbow: -15 } },
        { beat: 1, pose: { leftWrist: -35, leftElbow: 40, leftShoulder: 84 } },
        { beat: 1.5, pose: { leftWrist: 0, leftElbow: -10, leftShoulder: 102, headTilt: -8 } },
        { beat: 2, pose: { leftElbow: 0, leftShoulder: 90, rightShoulder: 102, headTilt: 8 } },
        { beat: 2.5, pose: { rightShoulder: 84, rightElbow: 40, headTilt: 0 } },
        { beat: 3, pose: { rightElbow: -15, rightWrist: 45 } },
        { beat: 3.5, pose: { rightElbow: 0, rightWrist: -35 } },
      ],
    },
  },
  routine: [
    { move: 'bounce', beats: 8 },
    { move: 'runningMan', beats: 8 },
    { move: 'armWave', beats: 8 },
    { move: 'bounce', beats: 4 },
  ],
}

const BREAKING: DanceStyle = {
  label: 'Breaking (toprock)',
  bpm: 110,
  stance: { leftHip: 14, rightHip: 14, leftKnee: 14, rightKnee: 14, leftShoulder: 35, rightShoulder: 35, leftElbow: -90, rightElbow: -90 },
  expression: { smile: 0.3, leftBrow: -0.3, rightBrow: -0.3, browTilt: -0.3 },
  hands: { left: 'fist', right: 'fist' },
  groove: { bounce: 8, accent: 'down' },
  moves: {
    toprock: {
      label: 'Toprock (Indian step)',
      beats: 4,
      keys: [
        { beat: 0, pose: { rightHip: -24, rightKnee: 10, leftHip: 10, leftShoulder: 80, leftElbow: 40, rightShoulder: 55, rightElbow: -50, lean: 6, headTilt: -6 }, easing: SNAP },
        { beat: 1, reset: true, pose: { leftHip: 18, rightHip: 18 } },
        { beat: 2, pose: { leftHip: -24, leftKnee: 10, rightHip: 10, rightShoulder: 80, rightElbow: 40, leftShoulder: 55, leftElbow: -50, lean: -6, headTilt: 6 }, easing: SNAP },
        { beat: 3, reset: true, pose: { leftHip: 18, rightHip: 18 } },
      ],
    },
    kick: {
      label: 'Kick out',
      beats: 2,
      keys: [
        { beat: 0, pose: { rightHip: 72, rightKnee: 4, rightAnkle: -20, leftHip: 4, lean: -12, leftShoulder: 100, leftElbow: 20 }, easing: SNAP },
        { beat: 1, reset: true },
      ],
    },
    freeze: {
      label: 'B-boy stance',
      beats: 4,
      keys: [
        { beat: 0, reset: true, pose: { leftShoulder: 26, leftElbow: -122, rightShoulder: 22, rightElbow: -118, leftHip: 18, rightHip: 18, leftKnee: 6, rightKnee: 6, lean: -4, headTilt: 10, ...{ smile: 0.6, leftEye: 0.6, rightEye: 0.6 } }, easing: HIT },
        { beat: 2, pose: { headTilt: 14, lean: -6 } },
      ],
    },
  },
  routine: [
    { move: 'toprock', beats: 8 },
    { move: 'kick', beats: 4 },
    { move: 'toprock', beats: 8 },
    { move: 'kick', beats: 4, mirror: true },
    { move: 'freeze', beats: 4 },
  ],
}

const JAZZ: DanceStyle = {
  label: 'Jazz',
  bpm: 130,
  stance: { leftHip: 10, rightHip: 10 },
  expression: { mouth: 0.55, smile: 1, mouthWidth: 1.2, leftBrow: 0.6, rightBrow: 0.6 },
  hands: { left: 'spread', right: 'spread' },
  groove: { bounce: 6, accent: 'up' },
  moves: {
    jazzHands: {
      label: 'Jazz hands',
      beats: 2,
      easing: 'linear',
      keys: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75].map((beat, i) => ({
        beat,
        // The hands shimmer: the wrists flick a little each quarter beat.
        pose: { leftShoulder: 128, rightShoulder: 128, leftElbow: 8, rightElbow: 8, leftWrist: i % 2 ? 4 : 26, rightWrist: i % 2 ? 26 : 4, leftHip: 16, rightHip: 16, leftKnee: beat < 1 ? 26 : 8, rightKnee: beat < 1 ? 26 : 8 },
        hands: i === 0 ? { left: { ...HAND_SHAPES.spread, turn: 2 }, right: { ...HAND_SHAPES.spread, turn: 2 } } : undefined,
      })),
    },
    kickBallChange: {
      label: 'Kick ball change',
      beats: 2,
      keys: [
        { beat: 0, reset: true, pose: { rightHip: 88, rightKnee: 0, rightAnkle: 55, leftHip: 4, lean: -12, leftShoulder: 112, rightShoulder: 112, leftWrist: 15, rightWrist: 15 }, hands: { left: 'flat', right: 'flat' }, easing: SNAP },
        { beat: 1, reset: true, pose: { rightHip: 10, rightKnee: 24, rightAnkle: 45, leftShoulder: 60, rightShoulder: 60, leftElbow: -20, rightElbow: -20 } },
        { beat: 1.5, pose: { rightAnkle: 0, rightKnee: 6, leftAnkle: 45, leftKnee: 20 } },
      ],
    },
    splitDrop: {
      label: 'Drop into the splits',
      beats: 8,
      keys: [
        { beat: 0, reset: true },
        // Slide down into a full side split, arms up…
        { beat: 2, reset: true, pose: { leftHip: 90, rightHip: 90, leftKnee: 0, rightKnee: 0, leftAnkle: -45, rightAnkle: -45, leftShoulder: 125, rightShoulder: 125, leftElbow: 10, rightElbow: 10 }, easing: 'ease-in-out-cubic' },
        // …hold and sell it…
        { beat: 4, pose: { leftShoulder: 95, rightShoulder: 95, leftElbow: 0, rightElbow: 0, leftWrist: 50, rightWrist: 50, headTilt: 8 } },
        // …then gather up through a crouch and stand.
        { beat: 6, reset: true, pose: { leftHip: 30, rightHip: 30, leftKnee: 60, rightKnee: 60, leftShoulder: 40, rightShoulder: 40 }, easing: 'ease-in-out-cubic' },
        { beat: 7.5, reset: true },
      ],
    },
    jazzSquare: {
      label: 'Jazz square',
      beats: 4,
      keys: [
        { beat: 0, reset: true, pose: { rightHip: -18, leftHip: 8, leftShoulder: 38, rightShoulder: 46, leftElbow: 100, rightElbow: 96, lean: 4 }, hands: { left: 'pinch', right: 'pinch' } },
        { beat: 1, pose: { leftHip: 18, rightHip: 6, leftShoulder: 46, rightShoulder: 38, lean: -4 } },
        { beat: 2, pose: { rightHip: 22, leftHip: 6, leftShoulder: 38, rightShoulder: 46, lean: 4 } },
        { beat: 3, pose: { leftHip: 10, rightHip: 10, leftShoulder: 46, rightShoulder: 38, lean: 0 } },
      ],
    },
  },
  routine: [
    { move: 'jazzHands', beats: 4 },
    { move: 'kickBallChange', beats: 4 },
    { move: 'kickBallChange', beats: 4, mirror: true },
    { move: 'jazzSquare', beats: 8 },
    { move: 'jazzHands', beats: 4 },
    { move: 'splitDrop', beats: 8 },
  ],
}

const K_POP: DanceStyle = {
  label: 'K-pop',
  bpm: 125,
  stance: { leftHip: 9, rightHip: 9, leftKnee: 4, rightKnee: 4 },
  expression: 'happy',
  groove: { bounce: 5, accent: 'down' },
  moves: {
    pointCombo: {
      label: 'Point combo',
      beats: 4,
      easing: HIT,
      keys: [
        { beat: 0, reset: true, pose: { rightShoulder: 142, rightElbow: 0, leftShoulder: 25, leftElbow: -125, headTilt: 6, lean: -3, lookX: 0.6, lookY: -0.6 }, hands: { right: 'point', left: 'flat' } },
        { beat: 1, pose: { rightShoulder: -38, headTilt: -6, lean: 3, lookX: -0.3, lookY: 0.5, rightHip: 18 } },
        { beat: 2, reset: true, pose: { leftShoulder: 36, leftElbow: -96, rightShoulder: 36, rightElbow: -96, leftWrist: 20, rightWrist: 20 }, hands: { left: 'fist', right: 'fist' } },
        { beat: 3, reset: true, pose: { leftShoulder: 96, rightShoulder: 96, leftElbow: 0, rightElbow: 0, leftWrist: 50, rightWrist: 50, headTilt: 8, leftHip: 18, rightHip: 18 }, hands: { left: 'flat', right: 'flat' } },
      ],
    },
    heart: {
      label: 'Big heart, finger heart',
      beats: 4,
      keys: [
        { beat: 0, reset: true, pose: { leftShoulder: 165, rightShoulder: 165, leftElbow: 46, rightElbow: 46, headTilt: -8, lean: -4 }, hands: { left: 'cupped', right: 'cupped' }, easing: HIT },
        { beat: 1, pose: { headTilt: 8, lean: 4 } },
        { beat: 2, reset: true, pose: { rightShoulder: 32, rightElbow: 112, rightWrist: 10, leftShoulder: 20, leftElbow: -30, headTilt: 10, leftEye: 0, smile: 1 }, hands: { right: 'pinch', left: 'relaxed' }, easing: HIT },
        { beat: 3, pose: { headTilt: 4 } },
      ],
    },
    isolations: {
      label: 'Isolations',
      beats: 2,
      easing: SNAP,
      keys: [
        { beat: 0, reset: true, pose: { lean: -9, headTilt: 11, leftShoulder: 55, leftElbow: -112, rightShoulder: 55, rightElbow: -112, rightHip: 18 }, hands: { left: 'fist', right: 'fist' } },
        { beat: 0.5, pose: { lean: 0, headTilt: 0, rightHip: 9 } },
        { beat: 1, pose: { lean: 9, headTilt: -11, leftHip: 18 } },
        { beat: 1.5, pose: { lean: 0, headTilt: 0, leftHip: 9 } },
      ],
    },
  },
  routine: [
    { move: 'pointCombo', beats: 8 },
    { move: 'isolations', beats: 4 },
    { move: 'heart', beats: 8 },
    { move: 'pointCombo', beats: 8, mirror: true },
    { move: 'isolations', beats: 4 },
  ],
}

const BOLLYWOOD: DanceStyle = {
  label: 'Bollywood',
  bpm: 120,
  stance: { leftHip: 10, rightHip: 10 },
  expression: { smile: 1, mouth: 0.3, leftBrow: 0.4, rightBrow: 0.4 },
  groove: { bounce: 8, accent: 'down', sway: 3 },
  moves: {
    lightBulb: {
      label: 'Screw the bulb, pat the dog',
      beats: 2,
      keys: [
        { beat: 0, reset: true, pose: { rightShoulder: 160, rightElbow: 12, rightWrist: -15, leftShoulder: 40, leftElbow: -12, leftWrist: -45, lean: -4, rightHip: 16, lookX: 0.5, lookY: -0.6 }, hands: { right: { ...HAND_SHAPES.cupped, roll: -30 }, left: { ...HAND_SHAPES.flat, turn: 0 } } },
        { beat: 0.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ...HAND_SHAPES.cupped, roll: 30 } } },
        { beat: 1, pose: { rightWrist: -15, rightElbow: 12, leftWrist: -45, lean: -4, rightHip: 16, leftHip: 6 }, hands: { right: { ...HAND_SHAPES.cupped, roll: -30 } } },
        { beat: 1.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ...HAND_SHAPES.cupped, roll: 30 } } },
      ],
    },
    thumka: {
      label: 'Thumka',
      beats: 2,
      keys: [
        { beat: 0, reset: true, pose: { lean: -11, rightHip: 22, leftHip: 2, leftKnee: 14, rightShoulder: 45, rightElbow: -105, leftShoulder: 128, leftElbow: 18, leftWrist: 35, headTilt: 10, lookX: -0.5 }, hands: { right: 'fist', left: { ...HAND_SHAPES.open, turn: 2 } }, easing: SNAP },
        { beat: 0.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } },
        { beat: 1, pose: { lean: -11, rightHip: 22, headTilt: 10 }, easing: SNAP },
        { beat: 1.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } },
      ],
    },
    flick: {
      label: 'Cross and flick',
      beats: 4,
      keys: [
        { beat: 0, reset: true, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26 }, hands: { left: 'fist', right: 'fist' } },
        { beat: 1, pose: { leftShoulder: 132, rightShoulder: 132, leftElbow: 0, rightElbow: 0, leftWrist: 30, rightWrist: 30, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10, stretch: 1.03 }, hands: { left: 'spread', right: 'spread' }, easing: SNAP },
        { beat: 2, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftWrist: 0, rightWrist: 0, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26, stretch: 1 }, hands: { left: 'fist', right: 'fist' } },
        { beat: 3, pose: { leftShoulder: 62, rightShoulder: 62, leftElbow: 0, rightElbow: 0, leftWrist: 35, rightWrist: 35, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10 }, hands: { left: 'spread', right: 'spread' }, easing: SNAP },
      ],
    },
  },
  routine: [
    { move: 'thumka', beats: 4 },
    { move: 'lightBulb', beats: 8 },
    { move: 'flick', beats: 8 },
    { move: 'thumka', beats: 4, mirror: true },
    { move: 'lightBulb', beats: 8, mirror: true },
  ],
}

const BHANGRA: DanceStyle = {
  label: 'Bhangra',
  bpm: 100,
  stance: { leftShoulder: 150, rightShoulder: 150, leftElbow: 18, rightElbow: 18, leftHip: 10, rightHip: 10 },
  expression: { mouth: 0.6, smile: 1, mouthWidth: 1.2, leftBrow: 0.5, rightBrow: 0.5 },
  hands: { left: 'open', right: 'open' },
  groove: { bounce: 12, accent: 'down' },
  moves: {
    basic: {
      label: 'Bhangra step',
      beats: 2,
      keys: [
        { beat: 0, reset: true, pose: { rightHip: 58, rightKnee: 104, rightAnkle: 30, leftShoulder: 162, rightShoulder: 140, headTilt: 7 } },
        { beat: 0.5, reset: true, pose: { stretch: 0.98 } },
        { beat: 1, reset: true, pose: { leftHip: 58, leftKnee: 104, leftAnkle: 30, rightShoulder: 162, leftShoulder: 140, headTilt: -7 } },
        { beat: 1.5, reset: true, pose: { stretch: 0.98 } },
      ],
    },
    dhamaal: {
      label: 'Dhamaal (jump, arms up)',
      beats: 2,
      keys: [
        { beat: 0, reset: true, pose: { leftHip: 20, rightHip: 20, leftKnee: 40, rightKnee: 40, stretch: 0.94 } },
        { beat: 0.5, reset: true, pose: { rise: 0.07, stretch: 1.06, leftHip: 6, rightHip: 6, leftAnkle: 45, rightAnkle: 45, leftShoulder: 172, rightShoulder: 172, leftElbow: 0, rightElbow: 0 }, hands: { left: 'point', right: 'point' }, easing: 'ease-out-quad' },
        { beat: 1, reset: true, pose: { leftHip: 20, rightHip: 20, leftKnee: 40, rightKnee: 40, stretch: 0.94 }, hands: { left: 'open', right: 'open' }, easing: 'ease-in-quad' },
        { beat: 1.5, reset: true, pose: { rise: 0.07, stretch: 1.06, leftHip: 6, rightHip: 6, leftAnkle: 45, rightAnkle: 45, leftShoulder: 172, rightShoulder: 172, leftElbow: 0, rightElbow: 0 }, hands: { left: 'point', right: 'point' }, easing: 'ease-out-quad' },
      ],
    },
  },
  routine: [
    { move: 'basic', beats: 8 },
    { move: 'dhamaal', beats: 4 },
    { move: 'basic', beats: 8 },
    { move: 'dhamaal', beats: 4 },
  ],
}

/** Aramandi: the half-sit of Bharatanatyam, knees out over turned-out feet. */
const ARAMANDI: Partial<StickPose> = { leftHip: 42, rightHip: 42, leftKnee: 82, rightKnee: 82, leftFootOut: 0.3, rightFootOut: 0.3 }

const BHARATANATYAM: DanceStyle = {
  label: 'Bharatanatyam',
  bpm: 80,
  // Natyarambhe: arms out at shoulder height, hands raised in pataka.
  stance: { ...ARAMANDI, leftShoulder: 90, rightShoulder: 90, leftElbow: 0, rightElbow: 0, leftWrist: 75, rightWrist: 75 },
  expression: { smile: 0.5, leftEye: 1.2, rightEye: 1.2, leftBrow: 0.3, rightBrow: 0.3 },
  hands: { left: 'pataka', right: 'pataka' },
  groove: { bounce: 0 },
  moves: {
    tatta: {
      label: 'Tatta adavu (stamps)',
      beats: 2,
      keys: [
        { beat: 0, reset: true, pose: { rightHip: 48, rightKnee: 104, rightAnkle: -18 } },
        { beat: 0.3, reset: true, easing: 'ease-in-quad', taps: ['rightToe', 'rightHeel'] },
        { beat: 1, reset: true, pose: { leftHip: 48, leftKnee: 104, leftAnkle: -18 } },
        { beat: 1.3, reset: true, easing: 'ease-in-quad', taps: ['leftToe', 'leftHeel'] },
      ],
    },
    natta: {
      label: 'Natta adavu (stretch and look)',
      beats: 4,
      keys: [
        { beat: 0, reset: true, pose: { rightHip: 52, rightKnee: 0, rightAnkle: -40, rightShoulder: 125, rightWrist: 60, leftShoulder: 25, leftElbow: -125, leftWrist: 0, headTilt: 8, lookX: 0.9, lookY: -0.4, lean: -6 } },
        { beat: 1, reset: true },
        { beat: 2, reset: true, pose: { leftHip: 52, leftKnee: 0, leftAnkle: -40, leftShoulder: 125, leftWrist: 60, rightShoulder: 25, rightElbow: -125, rightWrist: 0, headTilt: -8, lookX: -0.9, lookY: -0.4, lean: 6 } },
        { beat: 3, reset: true },
      ],
    },
    alapadma: {
      label: 'Alapadma (lotus) to the sky',
      beats: 4,
      keys: [
        { beat: 0, reset: true, pose: { rightShoulder: 145, rightElbow: 20, rightWrist: 30, leftShoulder: 28, leftElbow: -125, leftWrist: 0, lookX: 0.7, lookY: -0.9, headTilt: 6 }, hands: { right: 'alapadma', left: 'pataka' } },
        { beat: 1, pose: { rightWrist: 55, headTilt: 9 } },
        { beat: 2, reset: true, pose: { leftShoulder: 145, leftElbow: 20, leftWrist: 30, rightShoulder: 28, rightElbow: -125, rightWrist: 0, lookX: -0.7, lookY: -0.9, headTilt: -6 }, hands: { left: 'alapadma', right: 'pataka' } },
        { beat: 3, pose: { leftWrist: 55, headTilt: -9 } },
      ],
    },
  },
  routine: [
    { move: 'tatta', beats: 8 },
    { move: 'natta', beats: 8 },
    { move: 'alapadma', beats: 8 },
    { move: 'tatta', beats: 4 },
  ],
}

/** 1920s Charleston: swivelling feet (turn-out in and out), kicks, crossing knees. */
const CHARLESTON: DanceStyle = {
  label: 'Charleston',
  bpm: 150,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 10, rightKnee: 10, leftShoulder: 30, rightShoulder: 30, leftElbow: 20, rightElbow: 20 },
  expression: { mouth: 0.4, smile: 1, leftBrow: 0.5, rightBrow: 0.5 },
  hands: { left: { ...HAND_SHAPES.spread, turn: 2 }, right: { ...HAND_SHAPES.spread, turn: 2 } },
  groove: { bounce: 8, accent: 'down' },
  moves: {
    basic: {
      label: 'Kick forward, kick back',
      beats: 4,
      keys: [
        { beat: 0, reset: true, pose: { rightHip: 48, rightKnee: 8, rightAnkle: 45, leftShoulder: 75, rightShoulder: 15, leftElbow: 30, rightElbow: -10, lean: -7, headTilt: -5 }, easing: SNAP },
        { beat: 1, reset: true },
        { beat: 2, reset: true, pose: { leftHip: 18, leftKnee: 85, leftAnkle: 35, rightShoulder: 75, leftShoulder: 15, rightElbow: 30, leftElbow: -10, lean: 7, headTilt: 5 }, easing: SNAP },
        { beat: 3, reset: true },
      ],
    },
    twist: {
      label: 'Swivel (heels in, heels out)',
      beats: 2,
      keys: [
        // Toes in, knees in: the heels swivel out.
        { beat: 0, reset: true, pose: { leftFootOut: -0.9, rightFootOut: -0.9, leftHip: 4, rightHip: 4, leftKnee: 4, rightKnee: 4, leftAnkle: -10, rightAnkle: -10, leftShoulder: 18, rightShoulder: 48, leftElbow: -10, rightElbow: 50 } },
        // Toes out, knees out: the heels swivel in.
        { beat: 0.5, pose: { leftFootOut: 0.6, rightFootOut: 0.6, leftHip: 16, rightHip: 16, leftKnee: 22, rightKnee: 22, leftAnkle: 10, rightAnkle: 10, leftShoulder: 48, rightShoulder: 18, leftElbow: 50, rightElbow: -10 } },
        { beat: 1, pose: { leftFootOut: -0.9, rightFootOut: -0.9, leftHip: 4, rightHip: 4, leftKnee: 4, rightKnee: 4, leftAnkle: -10, rightAnkle: -10, leftShoulder: 18, rightShoulder: 48, leftElbow: -10, rightElbow: 50 } },
        { beat: 1.5, pose: { leftFootOut: 0.6, rightFootOut: 0.6, leftHip: 16, rightHip: 16, leftKnee: 22, rightKnee: 22, leftAnkle: 10, rightAnkle: 10, leftShoulder: 48, rightShoulder: 18, leftElbow: 50, rightElbow: -10 } },
      ],
    },
    kneeCross: {
      label: 'Crossing knees',
      beats: 2,
      keys: [
        // Knees knock together while the hands cross over them…
        { beat: 0, reset: true, pose: { leftHip: -6, rightHip: -6, leftKnee: -16, rightKnee: -16, leftFootOut: -0.4, rightFootOut: -0.4, leftShoulder: -12, rightShoulder: -12, leftElbow: 0, rightElbow: 0, lean: 0, lookY: 0.6 } },
        // …then swing apart, hands open.
        { beat: 0.5, pose: { leftHip: 18, rightHip: 18, leftKnee: 28, rightKnee: 28, leftFootOut: 0.3, rightFootOut: 0.3, leftShoulder: 16, rightShoulder: 16, lookY: 0 } },
        { beat: 1, pose: { leftHip: -6, rightHip: -6, leftKnee: -16, rightKnee: -16, leftFootOut: -0.4, rightFootOut: -0.4, leftShoulder: -12, rightShoulder: -12, lookY: 0.6 } },
        { beat: 1.5, pose: { leftHip: 18, rightHip: 18, leftKnee: 28, rightKnee: 28, leftFootOut: 0.3, rightFootOut: 0.3, leftShoulder: 16, rightShoulder: 16, lookY: 0 } },
      ],
    },
  },
  routine: [
    { move: 'basic', beats: 8 },
    { move: 'twist', beats: 8 },
    { move: 'kneeCross', beats: 8 },
    { move: 'basic', beats: 8, mirror: true },
    { move: 'twist', beats: 4 },
  ],
}

/**
 * Tap: the dance is in the feet. Every key that strikes the floor names the
 * toe or heel it strikes with (`taps`), so a scene can play the sounds.
 * Brushes flick the ankle; the ball takes the weight, the heel drops.
 */
const TAP: DanceStyle = {
  label: 'Tap',
  bpm: 120,
  stance: { leftHip: 8, rightHip: 8, leftKnee: 12, rightKnee: 12, leftShoulder: 24, rightShoulder: 24, leftElbow: 34, rightElbow: 34, leftWrist: 20, rightWrist: 20, lean: 2 },
  expression: { smile: 0.9, mouth: 0.2, leftBrow: 0.3, rightBrow: 0.3, lookY: 0.4 },
  hands: { left: { ...HAND_SHAPES.open, turn: 2 }, right: { ...HAND_SHAPES.open, turn: 2 } },
  groove: { bounce: 5, accent: 'down' },
  moves: {
    shuffleBallChange: {
      label: 'Shuffle ball change',
      beats: 2,
      easing: 'ease-out-quad',
      keys: [
        // Brush out, brush back in (the shuffle), step on the ball, change weight.
        { beat: 0, reset: true, pose: { rightHip: 36, rightKnee: 4, rightAnkle: 48 }, taps: ['rightToe'] },
        { beat: 0.25, pose: { rightHip: -4, rightKnee: 26, rightAnkle: 30 }, taps: ['rightToe'] },
        { beat: 0.5, pose: { rightHip: 8, rightKnee: 14, rightAnkle: 45, leftAnkle: 12 }, taps: ['rightToe'] },
        { beat: 0.75, pose: { rightAnkle: 0, leftAnkle: 0 }, taps: ['leftHeel'] },
        { beat: 1, reset: true, pose: { leftHip: 36, leftKnee: 4, leftAnkle: 48 }, taps: ['leftToe'] },
        { beat: 1.25, pose: { leftHip: -4, leftKnee: 26, leftAnkle: 30 }, taps: ['leftToe'] },
        { beat: 1.5, pose: { leftHip: 8, leftKnee: 14, leftAnkle: 45, rightAnkle: 12 }, taps: ['leftToe'] },
        { beat: 1.75, pose: { leftAnkle: 0, rightAnkle: 0 }, taps: ['rightHeel'] },
      ],
    },
    timeStep: {
      label: 'Single time step',
      beats: 4,
      easing: 'ease-out-quad',
      keys: [
        // Stamp…
        { beat: 0, reset: true, pose: { rightHip: 10, rightKnee: 2, rightAnkle: 0, leftShoulder: 40, rightShoulder: 14, lean: -3 }, taps: ['rightToe', 'rightHeel'] },
        // …shuffle…
        { beat: 0.5, pose: { rightHip: 36, rightKnee: 4, rightAnkle: 48 }, taps: ['rightToe'] },
        { beat: 0.75, pose: { rightHip: -2, rightKnee: 30, rightAnkle: 30 }, taps: ['rightToe'] },
        // …hop on the left (up, then land)…
        { beat: 1, pose: { rise: 0.05, leftAnkle: 45, leftKnee: 4, leftHip: 6, rightHip: 10, rightKnee: 46, stretch: 1.03 } },
        { beat: 1.25, pose: { rise: 0, leftAnkle: 0, leftKnee: 14, stretch: 1 }, taps: ['leftToe'] },
        // …step right, flap left, step right.
        { beat: 1.5, pose: { rightHip: 8, rightKnee: 12, rightAnkle: 0, leftShoulder: 14, rightShoulder: 40, lean: 3 }, taps: ['rightToe'] },
        { beat: 2, pose: { leftHip: 26, leftKnee: 4, leftAnkle: 35 }, taps: ['leftToe'] },
        { beat: 2.25, pose: { leftHip: 8, leftKnee: 12, leftAnkle: 0 }, taps: ['leftToe'] },
        { beat: 3, pose: { rightHip: 12, rightAnkle: 30, leftShoulder: 30, rightShoulder: 30, lean: 0 }, taps: ['rightToe'] },
        { beat: 3.5, pose: { rightHip: 8, rightAnkle: 0 } },
      ],
    },
    heelToe: {
      label: 'Heel toe',
      beats: 2,
      easing: 'ease-out-quad',
      keys: [
        // Dig the heel (toe up), then the toe (heel up); arms open as the feet travel out.
        { beat: 0, reset: true, pose: { rightHip: 20, rightAnkle: -35, leftShoulder: 30, rightShoulder: 55, rightElbow: 10 }, taps: ['rightHeel'] },
        { beat: 0.5, pose: { rightHip: 10, rightAnkle: 40, rightKnee: 20 }, taps: ['rightToe'] },
        { beat: 1, reset: true, pose: { leftHip: 20, leftAnkle: -35, rightShoulder: 30, leftShoulder: 55, leftElbow: 10 }, taps: ['leftHeel'] },
        { beat: 1.5, pose: { leftHip: 10, leftAnkle: 40, leftKnee: 20 }, taps: ['leftToe'] },
      ],
    },
    crampRoll: {
      label: 'Cramp roll',
      beats: 2,
      easing: 'ease-out-quad',
      keys: [
        // Up on both balls, right then left, then the heels drop, right then left: four quick sounds.
        { beat: 0, reset: true, pose: { leftKnee: 18, rightKnee: 18, leftHip: 10, rightHip: 10 } },
        { beat: 0.5, pose: { rightAnkle: 40, rise: 0.02 }, taps: ['rightToe'] },
        { beat: 0.625, pose: { leftAnkle: 40 }, taps: ['leftToe'] },
        { beat: 0.75, pose: { rightAnkle: 0, rise: 0 }, taps: ['rightHeel'] },
        { beat: 0.875, pose: { leftAnkle: 0 }, taps: ['leftHeel'] },
        // Arms flare on the finish.
        { beat: 1, pose: { leftShoulder: 120, rightShoulder: 120, leftElbow: 0, rightElbow: 0, leftWrist: 30, rightWrist: 30, leftKnee: 8, rightKnee: 8 }, hands: { left: { ...HAND_SHAPES.spread, turn: 2 }, right: { ...HAND_SHAPES.spread, turn: 2 } } },
        { beat: 1.75, reset: true },
      ],
    },
  },
  routine: [
    { move: 'shuffleBallChange', beats: 8 },
    { move: 'timeStep', beats: 4 },
    { move: 'timeStep', beats: 4, mirror: true },
    { move: 'heelToe', beats: 8 },
    { move: 'crampRoll', beats: 4 },
  ],
}

/** Ready-made dance styles. Each is plain data: copy one and change it to make your own. */
export const DANCE_STYLES = {
  disco: DISCO,
  hipHop: HIP_HOP,
  breaking: BREAKING,
  jazz: JAZZ,
  kpop: K_POP,
  bollywood: BOLLYWOOD,
  bhangra: BHANGRA,
  bharatanatyam: BHARATANATYAM,
  charleston: CHARLESTON,
  tap: TAP,
} satisfies Record<string, DanceStyle>

export type DanceStyleName = keyof typeof DANCE_STYLES
