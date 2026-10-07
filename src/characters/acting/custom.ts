import type { Gait } from '../gaits'
import type { StickPose } from '../stick-figure'
import type { GagStep } from './gags'
import type { Beat } from './script'

/**
 * Your own behaviours, as plain values passed where they are used: there is
 * no global registry. An action is either built from other beats (a macro:
 * `nervousPoint` is a tremble, then a point) or written as timed pose steps
 * from the pose it starts on (like a gag: `facepalm`). A gait is data, like
 * the built-in ones. Hand them to `scriptTracks` (and `checkBeats`, and the
 * figure that draws them) as a cast, or bundle them in a `character()`.
 *
 * ```ts
 * const facepalm = defineAction({
 *   summary: 'Drops its face into its hand.',
 *   steps: (from) => [
 *     { after: 250, pose: { rightShoulder: 150, rightElbow: 150, headTilt: from.headTilt - 12, bend: 12 } },
 *     { after: 900, pose: { headTilt: from.headTilt - 16 } },
 *   ],
 * })
 * const limp = defineGait({ swing: 14, knee: 10, arm: 10, elbow: 6, lean: 6, sway: 6, cycle: 1400 })
 * scriptTracks('hero', [{ do: 'limp', to: 400 }, { do: 'facepalm' }], { actions: { facepalm }, gaits: { limp } })
 * ```
 */

interface ActionBase {
  /** One line: what the figure does (the catalog and `describeTarget` show it) */
  summary: string
  /** Beat fields it needs (checked like the built-in actions') */
  needs?: Array<keyof Beat>
  /** Beat fields it reads */
  uses?: Array<keyof Beat>
}

/** An action written as timed pose steps from the pose it starts on, like a gag. */
export interface StepsAction extends ActionBase {
  steps: (from: StickPose, beat: Beat) => GagStep[]
}

/** An action built from other beats (which may be custom actions too). */
export interface BeatsAction extends ActionBase {
  beats: (beat: Beat) => Beat[]
}

export type ActionDefinition = StepsAction | BeatsAction

/** A gait, and how long one cycle (two steps) takes. */
export interface GaitDefinition extends Gait {
  /** One cycle (two steps), ms (default 1000) */
  cycle?: number
  /** One line about it */
  summary?: string
}

/** Your actions and gaits, by the names beats use. */
export interface Cast {
  actions?: Record<string, ActionDefinition>
  gaits?: Record<string, GaitDefinition>
}

/** An action, checked: it is either steps or beats, and says what it does. */
export function defineAction(definition: ActionDefinition): ActionDefinition {
  const hasSteps = 'steps' in definition && typeof definition.steps === 'function'
  const hasBeats = 'beats' in definition && typeof definition.beats === 'function'
  if (hasSteps === hasBeats) throw new Error('defineAction: give either `steps: (from, beat) => [...]` or `beats: (beat) => [...]`')
  if (!definition.summary) throw new Error('defineAction: give a `summary`: one line on what the figure does')
  return definition
}

/** A gait, checked: every swing is a number. */
export function defineGait(definition: GaitDefinition): GaitDefinition {
  for (const field of ['swing', 'knee', 'arm', 'elbow', 'lean'] as const) {
    if (typeof definition[field] !== 'number') throw new Error(`defineGait: \`${field}\` must be a number (degrees)`)
  }
  if (definition.cycle !== undefined && !(definition.cycle > 0)) throw new Error('defineGait: `cycle` is ms per two steps, above 0')
  return definition
}

/** How deep actions built from actions may nest before it is taken as a loop. */
const MAX_DEPTH = 8

/**
 * Beats with every action built from beats replaced by the beats it builds,
 * all the way down. The first beat of an expansion keeps the original's `at`,
 * and a `mood` or `say` on the original is given to the first beat that has none.
 */
export function expandBeats(beats: Beat[], actions: Record<string, ActionDefinition> = {}, depth = 0): Beat[] {
  if (depth > MAX_DEPTH) throw new Error(`scriptTracks: custom actions nest more than ${MAX_DEPTH} deep (does one build itself?)`)
  return beats.flatMap((beat) => {
    const definition = actions[beat.do]
    if (!definition || !('beats' in definition)) return [beat]
    const built = definition.beats(beat).map((inner, index) =>
      index === 0
        ? { ...inner, ...(beat.at !== undefined && inner.at === undefined ? { at: beat.at } : {}), ...(beat.mood && !inner.mood ? { mood: beat.mood } : {}), ...(beat.say && !inner.say ? { say: beat.say } : {}) }
        : inner
    )
    return expandBeats(built, actions, depth + 1)
  })
}

/** How long a steps action takes, ms. */
export function stepsDuration(steps: GagStep[]): number {
  return steps.length === 0 ? 0 : Math.max(...steps.map((step) => step.after))
}
