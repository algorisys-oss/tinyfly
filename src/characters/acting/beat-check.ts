import { EXPRESSIONS, POSES, REST_POSE } from '../stick-figure'
import { GAITS, type GaitName } from '../gaits'
import { closestName, unknownName } from '../../engine/authoring/did-you-mean'
import { GAGS, type GagName } from './gags'
import type { Action, Beat } from './script'
import type { PoseName } from '../stick-figure'
import { provideFigureActions } from '../figure-actions'
import type { Cast } from './custom'

/**
 * Checking beat scripts before they are compiled. Beats are often written by
 * hand or by a language model, and a wrong name must not fail quietly (an
 * unknown action used to become a hold, an unknown mood was ignored): every
 * problem is reported with what was probably meant and what is allowed.
 */

/** What a beat field holds, for the checks and the capability catalog. */
export interface ActionGuide {
  /** One line: what the figure does */
  summary: string
  /** Fields it needs */
  needs?: Array<keyof Beat>
  /** Fields it reads besides the ones every beat has (at, for, mood, say, pose, onto) */
  uses?: Array<keyof Beat>
}

/** The actions that are not a gait, a named pose or a gag. */
export const SCRIPT_ACTIONS = {
  look: { summary: 'Turns the head and eyes toward a scene x, `viewer`, `ahead` or `back`.', uses: ['toward'] },
  face: { summary: 'Turns the whole figure toward a scene x (turning round if needed), `viewer`, `ahead` or `back`.', uses: ['toward'] },
  say: { summary: 'Lip-syncs the `say` line with small nods; the beat lasts as long as the line.', needs: ['say'] },
  hold: { summary: 'Holds the pose (the acting pass drifts long holds).' },
  stand: { summary: 'Back to its resting stance (a character’s own, else the rest pose), keeping the way it is turned.' },
  go: { summary: 'Walks to `to` in its own gait (a character’s, else walk).', needs: ['to'] },
  zip: { summary: 'The cartoon exit: winds up, wheels its legs in place, then shoots off to `to`, leaving dust.', needs: ['to'] },
  leap: { summary: 'Crouches, springs, arcs and lands squashed at `to`, on the floor `onto` (a scene y).', uses: ['to', 'onto'] },
  swipe: { summary: 'Winds an arm up, then slides along the target with the arm out so the hand crosses it edge to edge.', uses: ['target'] },
  grab: { summary: 'Steps to where its arm reaches the target (crouching for low things), takes it and lifts it overhead.', needs: ['target'] },
  throw: { summary: 'Winds the arm back and throws forward and up toward `to` (or the target); `release` is when it lets go.', uses: ['to', 'target'] },
  kick: { summary: 'Steps to a leg’s length from the target, draws the leg back and kicks through it.', needs: ['target'] },
  put: { summary: 'Steps to where its arm reaches the spot and sets the thing down there.', needs: ['target'] },
  write: { summary: 'Reaches a pen to the spot and writes along it left to right (moving along when it is wide).', needs: ['target'] },
  push: { summary: 'Sets both hands on the target’s near side and walks it along until its centre is at `to`.', needs: ['target', 'to'] },
} satisfies Record<Exclude<Action, GaitName | PoseName | GagName>, ActionGuide>

export type ScriptActionName = keyof typeof SCRIPT_ACTIONS

/** Every name `do` accepts: gaits, named poses, gags, the actions above, and a cast's own actions and gaits. */
export function actionNames(cast: Cast = {}): string[] {
  return [
    ...Object.keys(GAITS),
    ...Object.keys(POSES),
    ...Object.keys(GAGS),
    ...Object.keys(SCRIPT_ACTIONS),
    ...Object.keys(cast.gaits ?? {}),
    ...Object.keys(cast.actions ?? {}),
  ]
}

/** Errors in a cast itself: a custom name may not reuse a built-in one (it would be ambiguous which runs). */
export function checkCast(cast: Cast = {}): string[] {
  const builtIn = new Set(actionNames())
  const problems: string[] = []
  for (const name of [...Object.keys(cast.actions ?? {}), ...Object.keys(cast.gaits ?? {})]) {
    if (builtIn.has(name)) problems.push(`Custom action or gait "${name}" has the name of a built-in one; give it its own name.`)
  }
  for (const name of Object.keys(cast.actions ?? {})) {
    if (cast.gaits && name in cast.gaits) problems.push(`"${name}" is both a custom action and a custom gait.`)
  }
  return problems
}

/** Every action `do` accepts, with a line each: what a stick figure can do. */
export function scriptActionSummaries(cast: Cast = {}): Record<string, string> {
  const out: Record<string, string> = {}
  for (const gait of Object.keys(GAITS)) out[gait] = `Walks to \`to\` in the ${gait} gait, feet planted, turning round first if needed.`
  for (const pose of Object.keys(POSES)) out[pose] = `Moves into the ${pose} pose and holds it.`
  for (const gag of Object.keys(GAGS)) out[gag] = `The ${gag} gag, built on the current pose.`
  for (const [name, guide] of Object.entries(SCRIPT_ACTIONS)) out[name] = guide.summary
  for (const [name, gait] of Object.entries(cast.gaits ?? {})) out[name] = gait.summary ?? `Walks to \`to\` in the ${name} gait (custom).`
  for (const [name, action] of Object.entries(cast.actions ?? {})) out[name] = action.summary
  return out
}

/** Every field a beat can have. */
export const BEAT_FIELDS = ['do', 'at', 'for', 'to', 'toward', 'mood', 'say', 'pose', 'target', 'onto'] as const satisfies ReadonlyArray<keyof Beat>

/** Names people (and models) reach for, and the field they meant. */
const FIELD_HINTS: Record<string, (typeof BEAT_FIELDS)[number]> = {
  action: 'do',
  type: 'do',
  verb: 'do',
  time: 'at',
  start: 'at',
  delay: 'at',
  duration: 'for',
  length: 'for',
  ms: 'for',
  x: 'to',
  position: 'to',
  destination: 'to',
  expression: 'mood',
  emotion: 'mood',
  face: 'mood',
  feeling: 'mood',
  text: 'say',
  line: 'say',
  speech: 'say',
  dialogue: 'say',
  joints: 'pose',
  y: 'onto',
  floor: 'onto',
  ground: 'onto',
  object: 'target',
  at_target: 'target',
}

const TOWARD_WORDS = ['viewer', 'ahead', 'back']

export interface BeatProblem {
  level: 'error' | 'warning'
  /** Which beat (0-based) */
  beat: number
  message: string
}

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/**
 * Problems in a beat script: unknown actions, moods, pose joints and fields
 * (with the likely intended name), missing or malformed fields, and times
 * that go backwards. Errors make `scriptTracks` throw; warnings are things
 * that compile but probably do not do what was meant.
 */
export function checkBeats(beats: unknown, cast: Cast = {}): BeatProblem[] {
  const problems: BeatProblem[] = checkCast(cast).map((message) => ({ level: 'error', beat: -1, message }))
  if (!Array.isArray(beats)) return [...problems, { level: 'error', beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof beats}).` }]
  const actions = actionNames(cast)
  const isGaitName = (name: string) => name in GAITS || name in (cast.gaits ?? {})
  const moods = Object.keys(EXPRESSIONS)
  const joints = Object.keys(REST_POSE)
  let lastAt = -Infinity

  beats.forEach((beat: unknown, index) => {
    const error = (message: string) => problems.push({ level: 'error', beat: index, message })
    const warning = (message: string) => problems.push({ level: 'warning', beat: index, message })
    if (!beat || typeof beat !== 'object' || Array.isArray(beat)) {
      error(`Each beat must be an object like { do: 'walk', to: 400 } (got ${JSON.stringify(beat)}).`)
      return
    }
    const fields = beat as Record<string, unknown>

    for (const key of Object.keys(fields)) {
      if ((BEAT_FIELDS as readonly string[]).includes(key)) continue
      error(unknownName('beat field', key, BEAT_FIELDS, FIELD_HINTS[key.toLowerCase()]))
    }

    const action = fields.do
    if (action === undefined) {
      error(`A beat needs \`do\` (what happens). Actions: ${actions.join(', ')}`)
      return
    }
    if (typeof action !== 'string' || !actions.includes(action)) {
      error(unknownName('action', action, actions))
      return
    }
    const guide = (SCRIPT_ACTIONS as Record<string, ActionGuide>)[action] ?? cast.actions?.[action]

    for (const field of guide?.needs ?? []) {
      if (fields[field] === undefined) error(`\`${action}\` needs \`${field}\`.`)
    }
    if (isGaitName(action) && fields.to === undefined) warning(`\`${action}\` without \`to\` walks nowhere.`)
    if (action === 'leap' && fields.to === undefined && fields.onto === undefined) warning('`leap` without `to` or `onto` jumps on the spot.')

    if (fields.mood !== undefined && (typeof fields.mood !== 'string' || !moods.includes(fields.mood))) error(unknownName('mood', fields.mood, moods))

    if (fields.pose !== undefined) {
      if (!fields.pose || typeof fields.pose !== 'object' || Array.isArray(fields.pose)) {
        error('`pose` is joints to change, an object like { rightShoulder: 90 } (for a named pose, use it as the action).')
      } else {
        for (const [joint, value] of Object.entries(fields.pose)) {
          if (!joints.includes(joint)) error(unknownName('pose joint', joint, joints))
          else if (!isNumber(value)) error(`Pose joint \`${joint}\` must be a number (got ${JSON.stringify(value)}).`)
        }
      }
    }

    for (const field of ['at', 'for'] as const) {
      const value = fields[field]
      if (value !== undefined && !(isNumber(value) && value >= 0)) error(`\`${field}\` is milliseconds, a number ≥ 0 (got ${JSON.stringify(value)}).`)
    }
    if (isNumber(fields.at)) {
      if (fields.at < lastAt) warning(`\`at\` ${fields.at} is before an earlier beat's \`at\` (${lastAt}); beats run in order, so it starts when the one before ends.`)
      lastAt = fields.at
    }
    for (const field of ['to', 'onto'] as const) {
      const value = fields[field]
      if (value !== undefined && !isNumber(value)) error(`\`${field}\` is a scene ${field === 'to' ? 'x' : 'y'} in px, a number (got ${JSON.stringify(value)}).`)
    }
    if (fields.toward !== undefined && !isNumber(fields.toward) && !TOWARD_WORDS.includes(fields.toward as string)) {
      error(`\`toward\` is a scene x or one of ${TOWARD_WORDS.join(', ')}${typeof fields.toward === 'string' && closestName(fields.toward, TOWARD_WORDS) ? ` (did you mean "${closestName(fields.toward, TOWARD_WORDS)}"?)` : ''} (got ${JSON.stringify(fields.toward)}).`)
    }
    if (fields.say !== undefined && typeof fields.say !== 'string') error(`\`say\` is the line spoken, a string (got ${JSON.stringify(fields.say)}).`)
    if (fields.target !== undefined) {
      const target = fields.target as Record<string, unknown> | null
      if (!target || typeof target !== 'object' || !isNumber(target.x) || !isNumber(target.y)) {
        error('`target` is a point or box in scene px: { x, y } (a code panel’s line(), token() or spot() fits).')
      }
    }
  })
  return problems
}

/** Throws one error listing every error in the beats (warnings are left to `checkBeats`). */
export function assertBeats(beats: unknown, cast: Cast = {}, context = 'scriptTracks'): void {
  const errors = checkBeats(beats, cast).filter((problem) => problem.level === 'error')
  if (errors.length === 0) return
  throw new Error(`${context}: ${errors.length} problem(s) in the beats:\n${errors.map((p) => `  ${p.beat >= 0 ? `beat ${p.beat}: ` : ''}${p.message}`).join('\n')}`)
}

// A stick figure's `about.actions` lists what this module can compile.
provideFigureActions(scriptActionSummaries)
