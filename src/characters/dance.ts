import type { EasingType, Track } from '../engine/types'
import { getEasingFunction } from '../engine/interpolation/easing'
import { HAND_REST, HAND_SHAPES, handPose, mixHandPoses, type HandPose, type HandShapeName } from './hands/hand-rig'
import {
  REST_POSE,
  blendPose,
  handProp,
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
  /**
   * Ground covered in one loop, as a fraction of the figure's height, at a
   * steady speed: positive toward +x (the way a side-on figure faces), negative
   * the other way. A glide or a moonwalk travels; most moves stay on the spot.
   * Mirrored front-on it travels the other way; side-on it keeps its direction.
   */
  travel?: number
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

/** Fields that turn the figure one way or the other: mirrored front-on, they change sign. */
const SIGNED: Array<keyof StickPose> = ['lean', 'headTilt', 'lookX', 'spin']

/** Limb angles: side-on, forward is a negative angle on the left and a positive one on the right. */
const LIMB_ANGLES = new Set<keyof StickPose>(['leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist', 'leftHip', 'rightHip', 'leftKnee', 'rightKnee'])

/**
 * A pose danced on the other side. Front-on (`turn` below 0.5) left and right
 * swap and leans and spins reverse, a mirror image. Side-on the figure still
 * faces the same way: the other arm and leg do the same thing (swapped, and
 * their angles negated, since forward is negative on the left), and leans and
 * spins stay as they are.
 */
export function mirrorPose(pose: StickPose): StickPose {
  const out = { ...pose }
  const sideOn = (pose.turn ?? 0) >= 0.5
  for (const [left, right] of SIDED) {
    const flip = sideOn && LIMB_ANGLES.has(left) ? -1 : 1
    out[left] = flip * pose[right]
    out[right] = flip * pose[left]
  }
  if (!sideOn) for (const field of SIGNED) out[field] = -pose[field]
  return out
}

/**
 * How the left leg bends to match the right: the same way front-on (both
 * spread out), the opposite way side-on (forward is negative on the left),
 * passing smoothly through the three-quarter views.
 */
const leftSign = (turn: number) => Math.min(1, Math.max(-1, (0.5 - turn) * 4))

/** Bounce and sway at `beat`, on top of a pose. */
export function applyGroove(pose: StickPose, groove: Groove, beat: number): StickPose {
  const phase = wrap(beat, 1)
  // 1 at the bottom of the bounce: on the beat for `down`, half way between for `up`.
  const wave = (1 + Math.cos(2 * Math.PI * phase)) / 2
  const depth = groove.bounce * (groove.accent === 'up' ? 1 - wave : wave)
  // Bending at the knees with the feet planted: thighs out (or forward, side-on), shins
  // back, so the hips drop. Side-on, a sway would rock forward and back, so it fades out.
  const turn = Math.min(1, Math.max(0, pose.turn ?? 0))
  const left = leftSign(turn)
  return {
    ...pose,
    leftHip: pose.leftHip + (left * depth) / 2,
    rightHip: pose.rightHip + depth / 2,
    leftKnee: pose.leftKnee + left * depth,
    rightKnee: pose.rightKnee + depth,
    lean: pose.lean + (groove.sway ?? 0) * (1 - turn) * Math.sin(Math.PI * beat),
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

/** Ground a routine step covers per beat, in heights (signed, see {@link DanceMove.travel}). */
function stepSpeed(style: DanceStyle, step: RoutineStep): number {
  const move = style.moves[step.move]
  if (!move?.travel) return 0
  const speed = move.travel / move.beats
  if (!step.mirror) return speed
  // Mirrored front-on, left and right swap, so it travels the other way; side-on it still faces the same way.
  const first = resolveKeys(move, danceStance(style), styleHands(style))[0]
  const sideOn = (first?.pose.turn ?? danceStance(style).turn ?? 0) >= 0.5
  return sideOn ? speed : -speed
}

/** The steps a dance plays, with the beat each starts on: the routine, or one move on a loop. */
function travelSteps(dance: DanceStyle, options: DanceOptions): RoutineStep[] {
  return options.move ? [{ move: options.move, beats: dance.moves[options.move].beats, mirror: options.mirror }] : dance.routine
}

/**
 * How far the dance has carried the figure at `beat`, as a fraction of its
 * height (multiply by the height in px for an `x` offset). Travelling moves go
 * at a steady speed, so it is a straight line between step changes; the
 * other moves hold it still. A routine that does not come back to where it
 * started keeps going that way each time it loops.
 */
export function danceTravel(style: DanceStyle | DanceStyleName, beat: number, options: DanceOptions = {}): number {
  const dance = typeof style === 'string' ? DANCE_STYLES[style] : style
  const steps = travelSteps(dance, options)
  const total = steps.reduce((sum, step) => sum + step.beats, 0)
  const perLoop = steps.reduce((sum, step) => sum + stepSpeed(dance, step) * step.beats, 0)
  const loops = Math.floor(beat / total)
  let travel = loops * perLoop
  let left = beat - loops * total
  for (const step of steps) {
    const beats = Math.min(step.beats, left)
    travel += stepSpeed(dance, step) * beats
    left -= beats
    if (left <= 0) break
  }
  return travel
}

/** The beats where the travel changes speed in `0..beats` (0 and `beats` included): an `x` track needs keys only there. */
function travelBeats(dance: DanceStyle, beats: number, options: DanceOptions): number[] {
  const steps = travelSteps(dance, options)
  const out = [0]
  let at = 0
  for (let i = 0; at < beats; i = (i + 1) % steps.length) {
    at += steps[i].beats
    out.push(Math.min(at, beats))
  }
  return out
}

export interface DanceTravelOptions extends DanceOptions {
  /** Tempo (default the style's) */
  bpm?: number
  /** How many beats (default the routine, or one loop of the move) */
  beats?: number
  /** When the dance starts, ms (default 0) */
  start?: number
  /** The figure's height, px: travel is measured in heights */
  height: number
  /** The `x` offset the figure starts from (default 0) */
  x?: number
  /**
   * Beats the dance blends in from standing and back out over, as
   * {@link danceTracks}' `fade` (default 1, the same): the glide eases in and
   * out with the pose. 0 travels at full speed from the first beat to the last.
   */
  fade?: number
}

/** Keys per beat while a glide eases in or out. */
const FADE_KEYS_PER_BEAT = 8

/**
 * The ground a dance covers as an `x` track, to play beside
 * {@link danceTracks} (or {@link bakeDanceTracks}, which adds it itself).
 * Travel goes at a steady speed, so the keys are linear and only where the
 * speed changes, plus a few while it eases in and out with the `fade`.
 * Undefined when the dance stays on the spot.
 */
export function danceTravelTrack(target: string, style: DanceStyle | DanceStyleName, options: DanceTravelOptions): Track | undefined {
  const dance = typeof style === 'string' ? DANCE_STYLES[style] : style
  const bpm = options.bpm ?? dance.bpm
  const beats = options.beats ?? (options.move ? dance.moves[options.move].beats : routineBeats(dance))
  const steps = travelBeats(dance, beats, options)
  if (steps.every((beat) => danceTravel(dance, beat, options) === 0)) return undefined
  // How much of the dance is applied at a beat: `danceTracks`' `dancing`, eased in and out.
  const fade = Math.min(options.fade ?? 1, beats / 2)
  const ease = getEasingFunction('ease-in-out')
  const weight = (beat: number) => (fade <= 0 ? 1 : Math.min(ease(Math.min(1, beat / fade)), ease(Math.min(1, (beats - beat) / fade))))
  const fadeKeys = Math.ceil(fade * FADE_KEYS_PER_BEAT)
  const eased = fade <= 0 ? [] : Array.from({ length: fadeKeys + 1 }, (_, i) => [(i / fadeKeys) * fade, beats - (i / fadeKeys) * fade]).flat()
  const keys = [...new Set([...steps, ...eased])].sort((a, b) => a - b)
  // Ground covered is the travel weighted by how much it dances: summed in small slices.
  let travel = 0
  const covered = keys.map((beat, i) => {
    if (i > 0) {
      const from = keys[i - 1]
      const slices = Math.max(1, Math.ceil((beat - from) * 16))
      for (let s = 0; s < slices; s++) {
        const a = from + ((beat - from) * s) / slices
        const b = from + ((beat - from) * (s + 1)) / slices
        travel += (danceTravel(dance, b, options) - danceTravel(dance, a, options)) * weight((a + b) / 2)
      }
    }
    return { beat, travel }
  })
  const start = options.start ?? 0
  const x = options.x ?? 0
  return {
    id: `${target}-x`,
    target,
    property: 'x',
    keyframes: covered.map((key) => ({ time: start + (key.beat * 60000) / bpm, value: x + options.height * key.travel, easing: 'linear' as const })),
  }
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
  /** Bake the hand shapes too, as `hand.left.*` / `hand.right.*` tracks (default true) */
  hands?: boolean
  bpm?: number
  /** How many beats to bake (default the routine, or the move's length) */
  beats?: number
  /** When it starts, ms (default 0) */
  start?: number
  /** Keyframes per beat (default 4) */
  samplesPerBeat?: number
  /** The figure's height, px: with it a travelling dance (a glide, a moonwalk) moves it, as an `x` track */
  height?: number
  /** The `x` offset it starts from (default 0) */
  x?: number
}

/**
 * The dance as plain pose keyframes, for any stick-figure target and for
 * timelines that must stand alone as JSON (no `dance` option needed). Only
 * joints that move get a track. Hand shapes are baked as `hand.left.*` /
 * `hand.right.*` tracks, which a target drawn with `style.hands` plays.
 * With `height`, a dance that travels gets an `x` track too.
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
    return { time: start + (beat * 60000) / bpm, frame: danceFrame(dance, beat, options) }
  })
  const track = (property: string, value: (frame: DanceFrame) => number): Track => ({
    id: `${target}-${property}`,
    target,
    property,
    keyframes: samples.map((s) => ({ time: s.time, value: value(s.frame) })),
  })
  const fields = Object.keys(REST_POSE) as (keyof StickPose)[]
  const poseTracks = fields
    .filter((field) => samples.some((s) => s.frame.pose[field] !== samples[0].frame.pose[field]) || samples[0].frame.pose[field] !== REST_POSE[field])
    .map((field) => track(field, (frame) => frame.pose[field]))
  const travel = options.height === undefined ? undefined : danceTravelTrack(target, dance, { ...options, bpm, beats, start, height: options.height, fade: 0 })
  if (travel) poseTracks.push(travel)
  if (options.hands === false) return poseTracks
  // Hand fields that leave rest or move; a target with `style.hands` has a prop for each.
  const handTracks: Track[] = []
  for (const side of ['left', 'right'] as const) {
    for (const field of Object.keys(HAND_REST)) {
      const value = (frame: DanceFrame) => frame.hands?.[side]?.[field] ?? HAND_REST[field]
      if (samples.some((s) => value(s.frame) !== HAND_REST[field])) handTracks.push(track(handProp(side, field), value))
    }
  }
  return [...poseTracks, ...handTracks]
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
  // Three-quarters to side-on, so shuffles read as brushes forward and back. Side-on,
  // forward is a positive angle for the right limbs and a negative one for the left.
  stance: {
    turn: 0.8,
    leftHip: -3, rightHip: 3, leftKnee: -10, rightKnee: 10,
    leftShoulder: 12, rightShoulder: 12, leftElbow: -40, rightElbow: 40, leftWrist: -15, rightWrist: 15,
    lean: 4,
  },
  expression: { smile: 0.9, mouth: 0.2, leftBrow: 0.3, rightBrow: 0.3, lookY: 0.3 },
  hands: { left: 'relaxed', right: 'relaxed' },
  groove: { bounce: 6, accent: 'down' },
  moves: {
    shuffleBallChange: {
      label: 'Shuffle ball change',
      beats: 2,
      easing: 'ease-out-quad',
      keys: [
        // Knee up, the foot brushes forward (toe strikes)…
        { beat: 0, reset: true, pose: { rightHip: 34, rightKnee: 8, rightAnkle: 30, leftShoulder: 30, rightShoulder: -10 }, taps: ['rightToe'] },
        // …and back from the knee (toe strikes again)…
        { beat: 0.25, pose: { rightHip: 24, rightKnee: 62, rightAnkle: 40 }, taps: ['rightToe'] },
        // …step on the ball behind, then change weight to the other foot.
        { beat: 0.5, pose: { rightHip: -8, rightKnee: 14, rightAnkle: 50, leftAnkle: 15, leftShoulder: 12, rightShoulder: 12 }, taps: ['rightToe'] },
        { beat: 0.75, pose: { rightHip: 3, rightKnee: 10, rightAnkle: 0, leftAnkle: 0 }, taps: ['leftHeel'] },
        { beat: 1, reset: true, pose: { leftHip: -34, leftKnee: -8, leftAnkle: 30, rightShoulder: -30, leftShoulder: 10 }, taps: ['leftToe'] },
        { beat: 1.25, pose: { leftHip: -24, leftKnee: -62, leftAnkle: 40 }, taps: ['leftToe'] },
        { beat: 1.5, pose: { leftHip: 8, leftKnee: -14, leftAnkle: 50, rightAnkle: 15, leftShoulder: 12, rightShoulder: 12 }, taps: ['leftToe'] },
        { beat: 1.75, pose: { leftHip: -3, leftKnee: -10, leftAnkle: 0, rightAnkle: 0 }, taps: ['rightHeel'] },
      ],
    },
    timeStep: {
      label: 'Single time step',
      beats: 4,
      easing: 'ease-out-quad',
      keys: [
        // Stamp the right foot flat…
        { beat: 0, reset: true, pose: { rightHip: 8, rightKnee: 4, rightAnkle: 0, leftShoulder: 25, rightShoulder: -20 }, taps: ['rightToe', 'rightHeel'] },
        // …shuffle (brush forward, brush back)…
        { beat: 0.5, pose: { rightHip: 34, rightKnee: 8, rightAnkle: 30 }, taps: ['rightToe'] },
        { beat: 0.75, pose: { rightHip: 22, rightKnee: 62, rightAnkle: 40 }, taps: ['rightToe'] },
        // …hop on the left (up, then land)…
        { beat: 1, pose: { rise: 0.05, leftAnkle: 45, leftKnee: -4, leftHip: -2, rightHip: 26, rightKnee: 70, stretch: 1.03 } },
        { beat: 1.25, pose: { rise: 0, leftAnkle: 0, leftKnee: -14, stretch: 1 }, taps: ['leftToe'] },
        // …step right, flap left (brush forward and step), step right.
        { beat: 1.5, pose: { rightHip: 4, rightKnee: 12, rightAnkle: 0, rightShoulder: 25, leftShoulder: -20 }, taps: ['rightToe'] },
        { beat: 2, pose: { leftHip: -30, leftKnee: -6, leftAnkle: 35 }, taps: ['leftToe'] },
        { beat: 2.25, pose: { leftHip: -4, leftKnee: -12, leftAnkle: 0 }, taps: ['leftToe'] },
        { beat: 3, pose: { rightHip: 10, rightAnkle: 35, rightKnee: 18, leftShoulder: 12, rightShoulder: 12 }, taps: ['rightToe'] },
        { beat: 3.5, pose: { rightHip: 3, rightKnee: 10, rightAnkle: 0 } },
      ],
    },
    heelToe: {
      label: 'Heel toe',
      beats: 2,
      easing: 'ease-out-quad',
      keys: [
        // Dig the heel in front (toe up), then the toe behind (heel up); the arms swing against the feet.
        { beat: 0, reset: true, pose: { rightHip: 26, rightKnee: 0, rightAnkle: -35, leftShoulder: 30, rightShoulder: -20 }, taps: ['rightHeel'] },
        { beat: 0.5, pose: { rightHip: -16, rightKnee: 24, rightAnkle: 55, leftShoulder: -15, rightShoulder: 25 }, taps: ['rightToe'] },
        { beat: 1, reset: true, pose: { leftHip: -26, leftKnee: 0, leftAnkle: -35, rightShoulder: -30, leftShoulder: 20 }, taps: ['leftHeel'] },
        { beat: 1.5, pose: { leftHip: 16, leftKnee: -24, leftAnkle: 55, rightShoulder: 15, leftShoulder: -25 }, taps: ['leftToe'] },
      ],
    },
    crampRoll: {
      label: 'Cramp roll',
      beats: 2,
      easing: 'ease-out-quad',
      keys: [
        // Up on both balls, right then left, then the heels drop, right then left: four quick sounds.
        { beat: 0, reset: true, pose: { rightHip: 12, rightKnee: 26, leftHip: -12, leftKnee: -26 } },
        { beat: 0.5, pose: { rightAnkle: 40, rise: 0.02 }, taps: ['rightToe'] },
        { beat: 0.625, pose: { leftAnkle: 40 }, taps: ['leftToe'] },
        { beat: 0.75, pose: { rightAnkle: 0, rise: 0 }, taps: ['rightHeel'] },
        { beat: 0.875, pose: { leftAnkle: 0 }, taps: ['leftHeel'] },
        // Arms flare on the finish: one up in front, one up behind.
        { beat: 1, pose: { rightShoulder: 135, leftShoulder: 125, leftElbow: 0, rightElbow: 0, leftWrist: 0, rightWrist: 30, rightKnee: 8, leftKnee: -8, rightHip: 4, leftHip: -4 }, hands: { left: { ...HAND_SHAPES.spread, turn: 2 }, right: { ...HAND_SHAPES.spread, turn: 2 } } },
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

/**
 * Popping's floor glides, which travel. Each half beat-pair one foot is
 * planted on its toe and drops its heel while the other slides flat along the
 * floor; then they swap. The keys are linear and the travel matches the
 * planted foot, so it stays put on the floor while the body glides.
 * Side-on the figure faces +x: forward is a negative angle for the left leg
 * and a positive one for the right.
 */
const POPPING: DanceStyle = {
  label: 'Popping (glides, moonwalk)',
  bpm: 100,
  stance: { leftHip: 9, rightHip: 9, leftShoulder: 16, rightShoulder: 16, leftElbow: -24, rightElbow: -24 },
  expression: { smile: 0.35, leftEye: 0.85, rightEye: 0.85, leftBrow: -0.2, rightBrow: -0.2 },
  hands: { left: 'relaxed', right: 'relaxed' },
  groove: { bounce: 0 },
  moves: {
    sideGlide: {
      label: 'Side glide',
      beats: 2,
      easing: 'linear',
      travel: 0.2,
      keys: [
        {
          beat: 0,
          reset: true,
          pose: { leftHip: 11, leftKnee: 0, leftAnkle: 0, rightHip: 36, rightKnee: 45, rightAnkle: 45, rightShoulder: 80, rightElbow: -10, rightWrist: 10, leftShoulder: 28, leftElbow: 18, lean: -2, headTilt: 4, lookX: 0.7 },
          hands: { right: 'flat', left: 'relaxed' },
        },
        { beat: 1, pose: { leftHip: 27, leftKnee: 54, leftAnkle: 45, rightHip: -1, rightKnee: 0, rightAnkle: 0, rightShoulder: 74, rightWrist: -10, lean: 2 } },
      ],
    },
    moonwalk: {
      label: 'Moonwalk',
      beats: 2,
      easing: 'linear',
      travel: -0.29,
      keys: [
        {
          beat: 0,
          reset: true,
          pose: { turn: 0.9, lean: 4, headTilt: -4, leftHip: -12, leftKnee: 0, leftAnkle: 0, rightHip: 23, rightKnee: 57, rightAnkle: 45, leftShoulder: -10, leftElbow: -45, rightShoulder: 14, rightElbow: 50 },
        },
        { beat: 1, pose: { leftHip: -23, leftKnee: -57, leftAnkle: 45, rightHip: 12, rightKnee: 0, rightAnkle: 0, leftShoulder: -14, leftElbow: -50, rightShoulder: 10, rightElbow: 45 } },
      ],
    },
    forwardGlide: {
      label: 'Forward glide',
      beats: 2,
      easing: 'linear',
      travel: 0.29,
      keys: [
        {
          beat: 0,
          reset: true,
          pose: { turn: 0.9, lean: 2, leftHip: 16, leftKnee: 0, leftAnkle: 0, rightHip: 33, rightKnee: 59, rightAnkle: 45, leftShoulder: 12, leftElbow: -40, rightShoulder: -12, rightElbow: 40 },
        },
        { beat: 1, pose: { leftHip: -33, leftKnee: -59, leftAnkle: 45, rightHip: -16, rightKnee: 0, rightAnkle: 0, leftShoulder: -12, leftElbow: -40, rightShoulder: 12, rightElbow: 40 } },
      ],
    },
    toeStand: {
      label: 'Toe stand',
      beats: 4,
      keys: [
        {
          beat: 0,
          reset: true,
          pose: { leftHip: 6, rightHip: 6, leftKnee: 0, rightKnee: 0, leftAnkle: 65, rightAnkle: 65, rightShoulder: 150, rightElbow: 75, leftShoulder: 30, leftElbow: 20, headTilt: -10, lookY: 0.4 },
          hands: { right: 'fist', left: 'fist' },
          easing: HIT,
        },
        { beat: 2, pose: { headTilt: -14, lean: -2 } },
      ],
    },
  },
  routine: [
    { move: 'sideGlide', beats: 4 },
    { move: 'sideGlide', beats: 4, mirror: true },
    { move: 'moonwalk', beats: 8 },
    { move: 'forwardGlide', beats: 8 },
    { move: 'toeStand', beats: 4 },
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
  popping: POPPING,
} satisfies Record<string, DanceStyle>

export type DanceStyleName = keyof typeof DANCE_STYLES
