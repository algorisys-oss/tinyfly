import type { EasingType, Keyframe, Track } from '../engine/types'
import { getEasingFunction } from '../engine/interpolation/easing'
import { unknownName } from '../engine/authoring/did-you-mean'
import type { Pose } from './rig/body-plan'
import { GAITS } from './gaits'
import { HUMAN_POSES, HUMAN_REST, type HumanPoseName } from './species/human'
import { HUMAN_GAGS, humanGag, humanGaitStrideLength, type HumanGagName } from './species/human-motion'
import { along, groundPath, headingOf, inverse, isGroundPoint, tidy, turnBetween, type GroundPoint } from './ground-path'

/**
 * Characters in world metres, for 3D scenes: a v2 character walks to a point
 * or along a path through points, turning to face the way first, its gait's
 * phase keyed with the distance so its feet stay planted; it faces things,
 * strikes poses and plays gags. It writes the scene object's tracks: `x`,
 * `z`, `rotateY`, its walk (`walk`, `walking`, `gait`, which the character
 * object turns into the stepping pose as it draws) and pose fields.
 *
 * ```js
 * const tum = characterScript3D('tum', [
 *   { do: 'walk', to: [2, 1] },
 *   { do: 'pose', pose: 'wave', for: 400 },
 *   { do: 'run', through: [[4, -2], [0, -4]] },
 *   { do: 'face', toward: [0, 0] },
 *   { do: 'gag', gag: 'take' },
 * ], { scene: 'village', position: [0, 3], heading: 0 })
 * ```
 */

export interface CharacterBeat3D {
  /** A gait to move in (`walk`, `run`, `sneak`, `strut`, `tired`, `bouncy`, `doubleBounce`, `shove`), `face`, `hold`, `pose`, `gag`, or `place` (put it at `to` at once, facing `toward`: where a ride left it) */
  do: string
  /** When it starts, ms (default: when the beat before ends) */
  at?: number
  /** How long it takes, ms (a move: default the distance at the gait's pace; a pose: default 500) */
  for?: number
  /** A move: where to, [x, z] metres */
  to?: GroundPoint
  /** A move: a path through these points, [x, z] metres each; it curves smoothly through them */
  through?: GroundPoint[]
  /** `face`: a point [x, z] to face, or a heading in degrees (0 faces +z, 90 faces +x) */
  toward?: GroundPoint | number
  /** A move: metres per second (default the gait's own pace for its height) */
  speed?: number
  /** `pose`: a named pose (`wave`, `point`, `cheer`, `think`, `sit`…) or pose fields */
  pose?: HumanPoseName | Pose
  /** `gag`: a gag's name (`take`, `doubleTake`, `windUp`…) */
  gag?: HumanGagName
}

export const CHARACTER_BEAT_3D_FIELDS = ['do', 'at', 'for', 'to', 'through', 'toward', 'speed', 'pose', 'gag'] as const satisfies ReadonlyArray<keyof CharacterBeat3D>

export interface CharacterScript3DOptions {
  /** The scene's id: the tracks target `<scene>/<id>` */
  scene: string
  /** Where it was placed, [x, z] metres (its object's position) */
  position?: GroundPoint
  /** Which way it faces at first, degrees (its object's rotation about y; 0 faces +z) */
  heading?: number
  /** Its height, metres, as its object has it (default 1.7): its stride and pace follow it */
  height?: number
  /** The pose it starts in (its object's `pose`) */
  pose?: Pose
}

export interface CharacterScript3DResult {
  tracks: Track[]
  duration: number
  beats: Array<{ do: string; start: number; end: number }>
  end: { position: GroundPoint; heading: number; pose: Pose }
}

/** How fast each gait goes for a 1.7 m person, metres per second (taller is faster, shorter slower). */
export const CHARACTER_GAIT_SPEEDS: Record<keyof typeof GAITS, number> = {
  walk: 1.3,
  bouncy: 1.4,
  doubleBounce: 1.2,
  sneak: 0.6,
  strut: 1.2,
  tired: 0.8,
  run: 3.6,
  shove: 0.7,
}

const GAIT_NAMES = Object.keys(GAITS)
const POSE_NAMES = Object.keys(HUMAN_POSES)
const GAG_NAMES = Object.keys(HUMAN_GAGS)
const SAMPLE = 0.25
const TURN_PER_DEGREE = 700 / 180
const TURN_LEAST = 200
const EASE_IN_OUT = 300

/** Problems in 3D character beats, naming what was probably meant. */
export function checkCharacterBeats3D(beats: unknown): Array<{ beat: number; message: string }> {
  if (!Array.isArray(beats)) return [{ beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof beats}).` }]
  const names = [...GAIT_NAMES, 'face', 'hold', 'pose', 'gag', 'place']
  const problems: Array<{ beat: number; message: string }> = []
  beats.forEach((beat: unknown, index) => {
    const error = (message: string) => problems.push({ beat: index, message })
    if (!beat || typeof beat !== 'object' || Array.isArray(beat)) return error("Each beat must be an object like { do: 'walk', to: [x, z] }.")
    const fields = beat as Record<string, unknown>
    const hints: Record<string, string> = { duration: 'for', path: 'through', position: 'to', heading: 'toward', direction: 'toward' }
    for (const key of Object.keys(fields)) if (!(CHARACTER_BEAT_3D_FIELDS as readonly string[]).includes(key)) error(unknownName('beat field', key, CHARACTER_BEAT_3D_FIELDS, hints[key]))
    // A pose or gag named as the beat itself is what was probably meant.
    const doHint = typeof fields.do === 'string' ? (POSE_NAMES.includes(fields.do) ? 'pose' : GAG_NAMES.includes(fields.do) ? 'gag' : fields.do === 'turn' ? 'face' : undefined) : undefined
    if (typeof fields.do !== 'string' || !names.includes(fields.do)) return error(unknownName('character 3D beat', fields.do, names, doHint))
    if (GAIT_NAMES.includes(fields.do)) {
      if (fields.to === undefined && fields.through === undefined) error(`\`${fields.do}\` needs \`to\` ([x, z] metres) or \`through\` (a list of them).`)
      if (fields.to !== undefined && !isGroundPoint(fields.to)) error(`\`to\` is a point on the ground, [x, z] metres (got ${JSON.stringify(fields.to)}).`)
      if (fields.through !== undefined && !(Array.isArray(fields.through) && fields.through.length > 0 && fields.through.every(isGroundPoint))) error('`through` is a list of points on the ground, each [x, z] metres.')
    }
    if (fields.do === 'place' && !isGroundPoint(fields.to)) error('`place` needs `to`: a point on the ground, [x, z] metres.')
    if (fields.do === 'face' && !(isGroundPoint(fields.toward) || typeof fields.toward === 'number')) error('`face` needs `toward`: a point [x, z] or a heading in degrees.')
    if (fields.do === 'pose' && !(typeof fields.pose === 'object' && fields.pose !== null) && !POSE_NAMES.includes(fields.pose as string)) error(unknownName('pose', fields.pose, POSE_NAMES))
    if (fields.do === 'gag' && !GAG_NAMES.includes(fields.gag as string)) error(unknownName('gag', fields.gag, GAG_NAMES))
  })
  return problems
}

/** Compiles 3D character beats into the scene object's tracks (see the module's notes). */
export function characterScript3D(id: string, beats: CharacterBeat3D[], options: CharacterScript3DOptions): CharacterScript3DResult {
  const problems = checkCharacterBeats3D(beats)
  if (problems.length > 0) throw new Error(`characterScript3D: ${problems.length} problem(s) in the beats:\n${problems.map((p) => `  beat ${p.beat}: ${p.message}`).join('\n')}`)
  const height = options.height ?? 1.7
  const pose: Pose = { ...HUMAN_REST, ...options.pose }
  let [x, z] = options.position ?? [0, 0]
  let heading = options.heading ?? 0
  let phase = 0
  const keys = new Map<string, Keyframe<number>[]>()
  const gaitKeys: Keyframe<string>[] = []
  const key = (property: string, time: number, value: number, easing: EasingType = 'linear') => {
    const list = keys.get(property) ?? []
    list.push({ time, value, easing })
    keys.set(property, list)
  }
  key('x', 0, x)
  key('z', 0, z)
  key('rotateY', 0, heading)

  const turnTo = (start: number, toward: number): number => {
    const delta = turnBetween(heading, toward)
    if (Math.abs(delta) < 1) return start
    const length = Math.max(TURN_LEAST, Math.abs(delta) * TURN_PER_DEGREE)
    key('rotateY', start, heading)
    heading += delta
    key('rotateY', start + length, heading, 'ease-in-out')
    return start + length
  }

  /** Changes pose fields from `start` to `end`, easing into them. */
  const poseTo = (start: number, end: number, changes: Pose, easing: EasingType = 'ease-in-out') => {
    for (const [field, value] of Object.entries(changes)) {
      if (pose[field] === value) continue
      key(field, start, pose[field] ?? 0)
      key(field, end, value, easing)
      pose[field] = value
    }
  }

  const move = (gait: string, beat: CharacterBeat3D, start: number): number => {
    const path = groundPath([[x, z], ...(beat.through ?? [beat.to!])])
    if (path.length < 2) return start
    const t = turnTo(start, headingOf(path[0].point, path[1].point))
    const length = path[path.length - 1].at
    // A taller person goes faster, as the square root of its height (strides and leg swings scale together).
    const pace = beat.speed ?? CHARACTER_GAIT_SPEEDS[gait as keyof typeof GAITS] * Math.sqrt(height / 1.7)
    const travel = beat.for ?? (length / pace) * 1000
    const stride = humanGaitStrideLength(gait, height)
    const ease = getEasingFunction('ease-in-out')
    const ramp = Math.min(EASE_IN_OUT, travel / 4)
    gaitKeys.push({ time: t, value: gait })
    key('walking', t, 0)
    key('walking', t + ramp, 1, 'ease-out')
    key('walking', t + travel - ramp, 1)
    key('walking', t + travel, 0, 'ease-in')
    // A key every SAMPLE metres: where it is, which way it faces, and its gait's phase, in step with the
    // distance (it covers one stride per cycle), so its feet stay planted as it speeds up and slows down.
    const from = phase
    let facing = heading
    for (let s = 0; ; s = Math.min(length, s + SAMPLE)) {
      const time = t + inverse(ease, s / length) * travel
      const { point, direction } = along(path, s)
      facing += turnBetween(facing, headingOf([0, 0], direction))
      key('x', time, point[0])
      key('z', time, point[1])
      key('rotateY', time, facing)
      key('walk', time, from + s / stride)
      if (s >= length) break
    }
    phase = from + length / stride
    ;[x, z] = path[path.length - 1].point
    heading = facing
    return t + travel
  }

  const spans: CharacterScript3DResult['beats'] = []
  let time = 0
  for (const beat of beats) {
    const start = beat.at ?? time
    let end = start
    if (GAIT_NAMES.includes(beat.do)) end = move(beat.do, beat, start)
    else if (beat.do === 'face') end = turnTo(start, typeof beat.toward === 'number' ? beat.toward : headingOf([x, z], beat.toward!))
    else if (beat.do === 'hold') end = start + (beat.for ?? 1000)
    else if (beat.do === 'place') {
      // At once: one ms from where it was to where it is put.
      key('x', start, x)
      key('z', start, z)
      ;[x, z] = beat.to!
      key('x', start + 1, x)
      key('z', start + 1, z)
      if (typeof beat.toward === 'number') {
        key('rotateY', start, heading)
        heading = beat.toward
        key('rotateY', start + 1, heading)
      }
      end = start + 1
    } else if (beat.do === 'pose') {
      end = start + (beat.for ?? 500)
      const target = typeof beat.pose === 'string' ? HUMAN_POSES[beat.pose] : beat.pose!
      poseTo(start, end, target)
    } else if (beat.do === 'gag') {
      const steps = humanGag(beat.gag!, { at: start, from: { ...pose } })
      let previous = steps[0]
      for (const step of steps.slice(1)) {
        poseTo(previous.time, step.time, Object.fromEntries(Object.entries(step.pose).filter(([field, value]) => pose[field] !== value)), step.easing ?? 'ease-in-out')
        previous = step
      }
      end = previous.time
    }
    spans.push({ do: beat.do, start, end })
    time = end
  }

  const target = `${options.scene}/${id}`
  const tracks: Track[] = [...keys].map(([property, frames]) => ({ id: `${id}-${property}`, target, property, keyframes: tidy(frames) }))
  if (gaitKeys.length > 0) tracks.push({ id: `${id}-gait`, target, property: 'gait', keyframes: gaitKeys })
  return { tracks, duration: time, beats: spans, end: { position: [x, z], heading, pose: { ...pose } } }
}
