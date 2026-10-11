import type { Keyframe, Track } from '../../engine/types'
import { Timeline } from '../../engine/core/timeline'
import { scriptTracks, type Beat, type ScriptOptions, type ScriptResult } from './script'
import { lipSyncOver } from './lip-sync'
import { actCharacterTracks } from './act-tracks'
import { stickToHuman } from '../stick-to-human'
import { mirrorHumanPose, HUMAN_REST, humanPose } from '../species/human'
import { humanGaitStrideLength } from '../species/human-motion'
import type { Pose } from '../rig/body-plan'
import { GAITS, gaitStrideLength, type Gait } from '../gaits'
import { REST_POSE, resolvePoseKeys, stickFigureJoints, type StickPose } from '../stick-figure'
import { characterJoints, reachCharacter, type Character, type CharacterPoseKey } from '../character'

/**
 * Beat scripts for v2 characters: the same beats `scriptTracks` compiles for
 * the stick figure (walk and the other gaits, `say`, `look`, `face`, poses,
 * gags, `zip`, `leap`, `grab`, `throw`, `kick`, `put`, `write`, `push`, your
 * own actions and gaits), compiled into tracks for a `characterTarget`.
 *
 * ```js
 * const amy = character(castMember('youngWoman', 170))
 * const script = characterScript('amy', amy, [
 *   { do: 'walk', to: 330, mood: 'happy' },
 *   { do: 'say', say: 'Is that box ticking?', mood: 'worried' },
 *   { do: 'take' },
 *   { do: 'zip', to: -200 },
 * ], { from: 90 })
 * const timeline = deserializeTimeline({ id: 'scene', tracks: script.tracks })
 * ```
 *
 * How it works: the stick-figure script plans the story (timing, where the
 * figure is, which way it faces, its gait, its speech); its key poses are
 * taken onto the human body (`stickToHuman`, mirrored when it faces left, so
 * the character's `turn` runs negative that way); the human acting pass then
 * winds up, overshoots and overlaps on this body, and the lines are
 * lip-synced over its mouth. The walk phase is rekeyed to the character's own
 * stride (its height and legs), so its feet stay planted. The `walk`,
 * `walking` and `gait` tracks step the gait as the target draws, as the 3D
 * character object does.
 *
 * The stick-figure script solves every reach (a `point`, a `grab`, a `kick`…)
 * for its own body. The human's arms and legs reach differently, so the plan
 * is made with its own reach (`reach`: the figure steps to where the human
 * limb reaches), and while a beat's hand or foot is on its target the human
 * limb is re-aimed (`reachCharacter`) at where the stick figure's landed, so
 * it lands exactly.
 */

export type CharacterScriptOptions = Omit<ScriptOptions, 'height'>

export interface CharacterScriptResult extends Omit<ScriptResult, 'keys'> {
  /** The key poses on the human body, before acting */
  keys: CharacterPoseKey[]
}

/** The tracks the stick-figure script writes beside its pose: taken as they are. */
const CARRIED = new Set(['x', 'y', 'walking', 'gait'])

/** Thigh plus shin as a fraction of the height, as `humanGaitStrideLength` has it. */
const LEG = 0.215 + 0.205

/**
 * Ground one gait cycle covers for this character, px: its own height and
 * legs (a child's are shorter), so the feet stay planted.
 */
export function characterStrideLength(who: Character, gait: Gait | string | undefined, stride = 1): number {
  // Thigh plus shin, measured along the bones (the rest pose splays the legs a little).
  const { points } = characterJoints(who, HUMAN_REST)
  const hip = points['hip.left']
  const knee = points['knee.left']
  const ankle = points['ankle.left']
  const legPx = hip && knee && ankle ? Math.hypot(knee.x - hip.x, knee.y - hip.y) + Math.hypot(ankle.x - knee.x, ankle.y - knee.y) : LEG * who.height
  return humanGaitStrideLength(gait, legPx / LEG, stride)
}

export function characterScript(target: string, who: Character, beats: Beat[], options: CharacterScriptOptions = {}): CharacterScriptResult {
  const planned = scriptTracks(target, beats, { ...options, height: who.height, reach: options.reach ?? reachOf(who) })

  // Which way it faces at each moment: the facing track steps between ±1.
  const facingKeys = (planned.tracks.find((track) => track.property === 'facing')?.keyframes ?? []) as Keyframe<number>[]
  const facingAt = (time: number) => {
    let facing: number = options.facing ?? 1
    for (const key of facingKeys) if (key.time <= time) facing = key.value
    return facing
  }

  // The key poses on the human body, mirrored when the figure faces left.
  const stickPoses = resolvePoseKeys(planned.keys)
  const keys: CharacterPoseKey[] = planned.keys.map((key, index) => {
    const human = stickToHuman(stickPoses[index])
    return {
      time: key.time,
      pose: facingAt(key.time) < 0 ? mirrorHumanPose(human) : human,
      ...(key.easing ? { easing: key.easing } : {}),
      ...(key.act === false ? { act: false } : {}),
    }
  })
  // The acting options (style, exaggeration…) carry over; `rest` and `start` are stick poses, used by the plan above.
  const { rest: _rest, start: _start, ...acting } = options
  landReaches(keys, stickPoses, beats, planned, who, facingAt, options)
  const acted = actCharacterTracks(target, keys, acting)
  const voiced = lipSyncOver(target, acted, planned.lines, { energy: options.energy })

  const carried = planned.tracks.filter((track) => CARRIED.has(track.property))
  const walk = planned.tracks.find((track) => track.property === 'walk')
  const tracks = walk ? [...voiced, ...carried, rekeyedWalk(target, walk, planned.tracks, who, options)] : [...voiced, ...carried]
  return { tracks, duration: planned.duration, lines: planned.lines, keys, beats: planned.beats, effects: planned.effects }
}

/**
 * How far the character's straight arm and leg reach, as a share of the stick
 * figure's at the same height: the script stands it that much nearer.
 */
export function reachOf(who: Character): { arm: number; leg: number } {
  const straight = humanPose({ 'arm.left.spread': 90, 'arm.left.elbow': 0, 'arm.left.bend': 0, 'leg.left.knee': 0 })
  const human = characterJoints(who, straight).points
  const arm = Math.hypot(human['hand.left'].x - human['shoulder.left'].x, human['hand.left'].y - human['shoulder.left'].y)
  const leg = Math.hypot(human['toe.left'].x - human['hip.left'].x, human['toe.left'].y - human['hip.left'].y)
  const stickArm = stickFigureJoints({ ...REST_POSE, rightShoulder: 90, rightElbow: 0, rightWrist: 0 }, { height: who.height, facing: 1 })
  const stickLeg = stickFigureJoints({ ...REST_POSE, rightHip: 90, rightKnee: 0 }, { height: who.height, facing: 1 })
  const palm = { x: (stickArm.hands.right.x + stickArm.fingertips.right.x) / 2, y: (stickArm.hands.right.y + stickArm.fingertips.right.y) / 2 }
  const stickArmLength = Math.hypot(palm.x - stickArm.shoulders.right.x, palm.y - stickArm.shoulders.right.y)
  const stickLegLength = Math.hypot(stickLeg.feet.right.x - stickLeg.hip.x, stickLeg.feet.right.y - stickLeg.hip.y)
  return { arm: stickArmLength > 0 ? arm / stickArmLength : 1, leg: stickLegLength > 0 ? leg / stickLegLength : 1 }
}

/** Beats whose hand (or foot) lands on a target, and which limb does it. */
const REACHING: Record<string, 'arm' | 'leg'> = { point: 'arm', grab: 'arm', put: 'arm', write: 'arm', swipe: 'arm', push: 'arm', kick: 'leg' }
/** Of those, the beats that land on one spot: their target is the point to reach. */
const ON_THE_SPOT = new Set(['point', 'grab', 'put', 'kick'])

/**
 * Re-aim the human limb at where the stick figure's landed, for every key
 * while a reaching beat's hand or foot is on its target (from its contact
 * to its release). Both bodies stand with their feet at the same point, so
 * the stick hand's place in its drawing space is the human hand's target in
 * its own. Custom actions expand into several beats, so when the beats and
 * the planned spans no longer line up the keys are left as converted.
 */
function landReaches(keys: CharacterPoseKey[], stickPoses: StickPose[], beats: Beat[], planned: ScriptResult, who: Character, facingAt: (time: number) => number, options: CharacterScriptOptions): void {
  const spans = planned.beats
  if (beats.length !== spans.length) return
  // Where the feet stand at a time (scene px), to put a beat's target in the character's drawing space.
  const placed = new Timeline({ id: 'placed', tracks: planned.tracks.filter((track) => track.property === 'x' || track.property === 'y') })
  const feetAt = (time: number) => {
    const values = placed.getStateAtTime(time).values.get(planned.tracks[0]?.target ?? '')
    return { x: (options.from ?? 0) + Number(values?.get('x') ?? 0), y: (options.ground ?? 0) + Number(values?.get('y') ?? 0) }
  }
  beats.forEach((beat, index) => {
    const limb = REACHING[beat.do]
    const span = spans[index]
    if (!limb || span.contact === undefined || (beat.do !== 'swipe' && !beat.target)) return
    const from = span.contact
    const to = span.release ?? span.contact
    keys.forEach((key, k) => {
      if (key.time < from - 1 || key.time > to + 1) return
      const facing = facingAt(key.time)
      // The stick figure reaches with its right arm and kicks with its right leg: the human's left when it faces right, right when mirrored.
      const joints = stickFigureJoints(stickPoses[k], { height: who.height, facing: facing < 0 ? -1 : 1 })
      // A beat on one spot (a point, a grab, a put, a kick) aims at the spot itself; one that slides along
      // its target (a swipe, a write, a push) follows where the stick figure's palm went.
      const feet = feetAt(key.time)
      const spot = ON_THE_SPOT.has(beat.do) && beat.target ? { x: beat.target.x - feet.x, y: beat.target.y - feet.y } : undefined
      const palm = { x: (joints.hands.right.x + joints.fingertips.right.x) / 2, y: (joints.hands.right.y + joints.fingertips.right.y) / 2 }
      const point = spot ?? (limb === 'arm' ? palm : joints.toes.right)
      const side = facing < 0 ? 'right' : 'left'
      const chain = `${limb}.${side}`
      let pose = key.pose as Pose
      if (beat.do === 'point') {
        // A point aims a straight arm at the spot (the hand need not reach it).
        pose = reachCharacter(who, pose, chain, point)
      } else if (limb === 'arm') {
        // A low or far point: lean the body down toward it until the arm reaches, then reach.
        pose = reachCharacter(who, leanToReach(who, pose, side, point), chain, point)
      } else {
        // The leg solver lands the ankle: aim it a foot short of where the toe should be, settling the foot's turn.
        for (let i = 0; i < 3; i++) {
          const j = characterJoints(who, pose).points
          const ankle = j[`ankle.${side}`]
          const toe = j[`toe.${side}`]
          pose = reachCharacter(who, pose, chain, { x: point.x - (toe.x - ankle.x), y: point.y - (toe.y - ankle.y) })
        }
      }
      keys[k] = { ...key, pose }
    })
  })
}

/** How far a straight arm reaches from the shoulder, px. */
function armReach(who: Character, side: 'left' | 'right'): number {
  const straight = humanPose({ [`arm.${side}.spread`]: 90, [`arm.${side}.elbow`]: 0, [`arm.${side}.bend`]: 0 })
  const points = characterJoints(who, straight).points
  return Math.hypot(points[`hand.${side}`].x - points[`shoulder.${side}`].x, points[`hand.${side}`].y - points[`shoulder.${side}`].y)
}

/** The most the body leans and bends down to bring a point within the arm's reach, degrees, and how many steps it takes. */
const LEAN_STEP = 5
const BEND_STEP = 4
const LEAN_STEPS = 8

/**
 * The pose leaned and bent forward just enough for the arm's reach to cover
 * `point` (drawing space): a figure picking something up off the floor bends
 * down to it. Left as it is when the point is already in reach, or still out
 * of reach bent as far as it goes.
 */
function leanToReach(who: Character, pose: Pose, side: 'left' | 'right', point: { x: number; y: number }): Pose {
  // Well inside the straight arm's reach, so the bend has room and a little depth does not put the point past it.
  const reach = armReach(who, side) * 0.9
  const within = (tried: Pose) => {
    const shoulder = characterJoints(who, tried).points[`shoulder.${side}`]
    return Math.hypot(point.x - shoulder.x, point.y - shoulder.y) <= reach
  }
  if (within(pose)) return pose
  let tried = pose
  for (let step = 1; step <= LEAN_STEPS; step++) {
    tried = { ...pose, lean: (pose.lean ?? 0) + LEAN_STEP * step, bend: (pose.bend ?? 0) + BEND_STEP * step }
    if (within(tried)) return tried
  }
  return tried
}

/**
 * The walk phase keyed for the character's stride: the stick-figure script
 * keyed it as distance over its own stride, so each step between keys is
 * scaled by the two strides' ratio for the gait in use then.
 */
function rekeyedWalk(target: string, walk: Track, tracks: Track[], who: Character, options: CharacterScriptOptions): Track {
  const gaitTrack = tracks.find((track) => track.property === 'gait')
  const gaits = gaitTrack ? new Timeline({ id: `${target}-gait-of`, tracks: [gaitTrack] }) : undefined
  const gaitAt = (time: number): Gait | string | undefined => {
    const name = gaits?.getStateAtTime(time).values.get(target)?.get('gait')
    if (typeof name !== 'string') return undefined
    return (GAITS as Record<string, Gait>)[name] ?? options.gaits?.[name] ?? name
  }
  const keys = walk.keyframes as Keyframe<number>[]
  const out: Keyframe<number>[] = []
  let phase = keys[0]?.value ?? 0
  keys.forEach((key, index) => {
    if (index > 0) {
      const previous = keys[index - 1]
      const gait = gaitAt((previous.time + key.time) / 2)
      const stick = gaitStrideLength(gait, who.height)
      const human = characterStrideLength(who, gait)
      phase += (key.value - previous.value) * (human > 0 ? stick / human : 1)
    } else {
      phase = key.value
    }
    out.push({ ...key, value: phase })
  })
  return { ...walk, keyframes: out }
}
