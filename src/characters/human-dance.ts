import type { Pose } from './rig/body-plan'
import { HUMAN_REST, humanPlan } from './species/human'
import { HAND_REST, HAND_SHAPES } from './hands/hand-rig'
import type { Track } from '../engine/types'
import { reachPose } from './rig/reach'

/**
 * Native, body-local dance keys. Heading belongs to the caller, not the clip.
 * Foot plants assume left/right alternation each integer beat, starting left,
 * with stance through 0.6 of the beat. Custom footwork that changes that
 * pattern should use danceCircleAt with plantFeet: false and supply its own contacts.
 */
export interface HumanDanceStyle {
  label: string
  bpm: number
  beats: number
  keys: Array<{ beat: number; pose: Pose }>
  /** Claps or stick strikes, in beats from the start of the loop. */
  strikes: number[]
}

export interface HumanDanceFrame {
  pose: Pose
  /** Alternating support side and absolute integer planting beat; weight is 1 through phase 0.6, then fades to 0. */
  contact: { side: 'left' | 'right'; start: number; weight: number }
  /** 1 on a strike, fading to 0 a quarter beat either side. */
  strike: number
}

const wrap = (n: number, length: number) => ((n % length) + length) % length
const smooth = (t: number) => t * t * (3 - 2 * t)
const hands = (shape: keyof typeof HAND_SHAPES): Pose => Object.fromEntries(
  ['left', 'right'].flatMap((side) => Object.entries(HAND_SHAPES[shape]).map(([field, value]) => [`hand.${side}.${field}`, value]))
)

/** Keys carry weight from one leg to the other; arms recover between hits. */
function garbaKeys(strikes: number[], sticks = false): HumanDanceStyle['keys'] {
  const plan = humanPlan()
  const clapLeft = reachPose(plan, HUMAN_REST, 'arm.left', [0.015, 0.68, 0.2], { height: 1 })
  const clap = reachPose(plan, clapLeft, 'arm.right', [-0.015, 0.68, 0.2], { height: 1 })
  return Array.from({ length: 32 }, (_, i) => {
    const beat = i / 4
    const step = Math.floor(beat)
    const phase = beat - step
    const left = step % 2 === 0
    const lift = Math.sin(Math.PI * phase)
    const hit = Math.max(0, ...strikes.map((at) => 1 - Math.min(wrap(beat - at, 8), wrap(at - beat, 8)) / 0.5))
    const pose: Pose = {
      side: (left ? 1 : -1) * 5 * Math.sin(Math.PI * phase),
      bend: 2 + 3 * lift,
      'head.tilt': (left ? -1 : 1) * 3 * lift,
      'head.nod': -2 * lift,
      'leg.left.swing': left ? -4 * lift : 17 * lift,
      'leg.right.swing': left ? 17 * lift : -4 * lift,
      'leg.left.knee': left ? 5 * lift : 36 * lift,
      'leg.right.knee': left ? 36 * lift : 5 * lift,
      'leg.left.spread': 4,
      'leg.right.spread': 4,
      'arm.left.swing': 22 + hit * (sticks ? 45 : 42),
      'arm.right.swing': 22 + hit * (sticks ? 45 : 42),
      'arm.left.spread': 28 - 22 * hit,
      'arm.right.spread': 28 - 22 * hit,
      'arm.left.elbow': 48 + 22 * hit,
      'arm.right.elbow': 48 + 22 * hit,
      'arm.left.bend': -35 * hit,
      'arm.right.bend': -35 * hit,
      smile: 0.9,
      ...hands(sticks ? 'hold' : 'spread'),
    }
    if (!sticks) for (const field of Object.keys(clap)) if (field.startsWith('arm.')) pose[field] += (clap[field] - pose[field]) * hit
    return { beat, pose }
  })
}

/** Simple stylised routines, editable as JSON; not a motion-capture recording. */
export const HUMAN_DANCES = {
  garba: { label: 'Garba · two clap', bpm: 120, beats: 8, strikes: [2, 3, 6, 7], keys: garbaKeys([2, 3, 6, 7]) },
  garbaThreeClap: { label: 'Garba · three clap', bpm: 120, beats: 8, strikes: [1, 2, 3, 5, 6, 7], keys: garbaKeys([1, 2, 3, 5, 6, 7]) },
  dandiya: { label: 'Dandiya · partner strikes', bpm: 120, beats: 8, strikes: [1, 3, 5, 7], keys: garbaKeys([1, 3, 5, 7], true) },
} satisfies Record<string, HumanDanceStyle>

export type HumanDanceName = keyof typeof HUMAN_DANCES

function resolveDance(style: HumanDanceName | HumanDanceStyle): HumanDanceStyle {
  const dance = typeof style === 'string' && Object.hasOwn(HUMAN_DANCES, style) ? HUMAN_DANCES[style] : typeof style === 'string' ? undefined : style
  if (!dance || !Number.isFinite(dance.beats) || dance.beats <= 0 || !Array.isArray(dance.keys) || !dance.keys.length || !Array.isArray(dance.strikes)
    || !dance.keys.every((key, i) => Number.isFinite(key.beat) && key.beat >= 0 && key.beat < dance.beats && (i === 0 || key.beat > dance.keys[i - 1].beat) && key.pose && Object.values(key.pose).every(Number.isFinite))
    || !dance.strikes.every((beat) => Number.isFinite(beat) && beat >= 0 && beat < dance.beats)) throw new Error('humanDanceFrame: a dance with positive finite beats, ordered pose keys and strike beats within its loop is required')
  return dance
}

/** Random-access evaluation: turning never changes the authored local limb motion. */
export function humanDanceFrame(style: HumanDanceName | HumanDanceStyle, beat: number, base: Pose = HUMAN_REST): HumanDanceFrame {
  const dance = resolveDance(style)
  if (!Number.isFinite(beat)) throw new Error('humanDanceFrame: beat must be finite')
  const local = wrap(beat, dance.beats)
  let index = dance.keys.length - 1
  for (let i = 0; i < dance.keys.length; i++) if (dance.keys[i].beat <= local) index = i
  const a = dance.keys[index]
  const b = dance.keys[(index + 1) % dance.keys.length]
  const start = a.beat > local ? a.beat - dance.beats : a.beat
  const end = b.beat <= a.beat ? b.beat + dance.beats : b.beat
  const t = smooth((local - start) / (end - a.beat))
  const pose: Pose = { ...HUMAN_REST, ...base }
  for (const field of new Set(dance.keys.flatMap((key) => Object.keys(key.pose)))) {
    if (field === 'turn' || field === 'roll') continue
    const handField = field.match(/^hand\.(?:left|right)\.(.+)$/)?.[1]
    const fallback = base[field] ?? HUMAN_REST[field] ?? (handField ? HAND_REST[handField] : undefined) ?? 0
    const from = a.pose[field] ?? fallback
    pose[field] = from + ((b.pose[field] ?? fallback) - from) * t
  }
  const step = Math.floor(beat)
  const phase = beat - step
  const weight = phase <= 0.6 ? 1 : 1 - smooth((phase - 0.6) / 0.4)
  const strike = Math.max(0, ...dance.strikes.map((at) => 1 - Math.min(wrap(local - at, dance.beats), wrap(at - local, dance.beats)) / 0.25))
  return { pose, contact: { side: wrap(step, 2) === 0 ? 'left' : 'right', start: step, weight }, strike }
}

export interface HumanDanceTrackOptions {
  /** A native name or custom JSON routine. */
  style: HumanDanceName | HumanDanceStyle
  /** Beats per minute; default the style's tempo. Positive and finite. */
  bpm?: number
  /** Length from beat 0; default one routine. Positive and finite. */
  beats?: number
  /** Start time in milliseconds, default 0; finite. */
  start?: number
  /** Base pose, default HUMAN_REST; use the same pose on the rendered target. */
  pose?: Pose
  /** Sampling density, default 16; positive and finite. */
  samplesPerBeat?: number
}

/**
 * Ordinary linear JSON pose tracks, including hands; view/roll remain
 * independently animated. Unchanged base/rest fields are omitted. Between
 * samples, linear playback approximates the smoothly evaluated frame.
 */
export function humanDanceTracks(target: string, options: HumanDanceTrackOptions): Track[] {
  const style = resolveDance(options.style)
  const bpm = options.bpm ?? style.bpm
  const beats = options.beats ?? style.beats
  const density = options.samplesPerBeat ?? 16
  if (![bpm, beats, density].every((n) => Number.isFinite(n) && n > 0)) throw new Error('humanDanceTracks: bpm, beats and samplesPerBeat must be positive and finite')
  if (!Number.isFinite(options.start ?? 0)) throw new Error('humanDanceTracks: start must be finite')
  const count = Math.max(1, Math.ceil(beats * density))
  const samples = Array.from({ length: count + 1 }, (_, i) => ({ time: (options.start ?? 0) + beats * i / count * 60000 / bpm, pose: humanDanceFrame(style, beats * i / count, options.pose).pose }))
  return Object.keys(samples[0].pose).filter((field) => field !== 'turn' && field !== 'roll' && samples.some((s) => s.pose[field] !== (options.pose?.[field] ?? HUMAN_REST[field]))).map((field) => ({
    id: `${target}-dance-${field}`, target, property: field,
    keyframes: samples.map((sample) => ({ time: sample.time, value: sample.pose[field], easing: 'linear' as const })),
  }))
}
