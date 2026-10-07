import { unknownName } from '../../engine/authoring/did-you-mean'
import { EXPRESSIONS, POSES, pose as poseFrom, stickFigureTarget, withExpression, type ExpressionName, type PoseName, type StickFigureTarget, type StickPose, type StickStyle } from '../stick-figure'
import { GAITS } from '../gaits'
import { ACTING_STYLES, type ActingOptions } from './acting'
import { checkBeats, checkCast, scriptActionSummaries, type BeatProblem } from './beat-check'
import type { Cast } from './custom'
import { handPath, type HandPathOptions } from './hand-path'
import { scriptTracks, type Beat, type ScriptResult } from './script'
import type { Track } from '../../engine/types'

/**
 * A persona: one stick figure's look, acting and habits, in one value. Its
 * figures look like it, its scripts act like it (its acting style, its gait
 * for `go`, its usual face and stance, which `stand` returns to), and its own
 * actions and gaits are known to its scripts, its checks and `describeTarget`.
 *
 * ```ts
 * const junior = persona({
 *   name: 'Junior',
 *   summary: 'A nervous junior developer',
 *   look: { color: '#2563eb', rubber: 0.6 },
 *   acting: 'full', gait: 'sneak', mood: 'worried',
 *   actions: { facepalm },
 * })
 * const hero = junior.figure({ x: 600, y: 300 })
 * const script = junior.script('hero', [{ do: 'go', to: 300 }, { do: 'facepalm' }, { do: 'stand' }], { from: 600, ground: 300 })
 * ```
 *
 * Personas are plain values: make as many as the story needs, and put each
 * one's figures in the scene under their own ids.
 */

export interface PersonaOptions extends Cast {
  name: string
  /** One line: who this is */
  summary?: string
  /** Feet to top of head, px (default 120) */
  height?: number
  /** How it looks (the stick figure's style, without its height) */
  look?: Omit<StickStyle, 'height'>
  /** How it acts: an acting style (default snappy) */
  acting?: ActingOptions['style']
  /** How it walks when told to `go` somewhere: a built-in gait or one of its own (default walk) */
  gait?: string
  /** Its usual face */
  mood?: ExpressionName
  /** How it stands at rest: a named pose or joints (default the rest pose); `stand` returns here */
  stance?: PoseName | Partial<StickPose>
  /** How much it moves its mouth when it talks (lip-sync energy, default 1) */
  energy?: number
}

export interface Persona {
  readonly name: string
  readonly summary: string
  /** Its own actions and gaits */
  readonly cast: Cast
  /** Its resting pose, with its usual face */
  readonly rest: StickPose
  readonly height: number
  /** A figure that looks like it, feet at x, y */
  figure(at: { x: number; y: number; facing?: 1 | -1 }): StickFigureTarget
  /** Beats compiled the way it acts (`from` and `ground` are where its figure was placed) */
  script(target: string, beats: Beat[], options?: { from?: number; ground?: number; facing?: 1 | -1 }): ScriptResult
  /** Problems in beats written for it (its own actions count as known) */
  check(beats: unknown): BeatProblem[]
  /** Where its hand is over time, for things it carries */
  handPath(target: string, tracks: Track[], options: Omit<HandPathOptions, 'style' | 'cast'>): ReturnType<typeof handPath>
  /** Who it is and what it can do, as data */
  describe(): PersonaDescription
}

export interface PersonaDescription {
  name: string
  summary: string
  habits: { height: number; acting: string; gait: string; mood?: string; stance: string }
  /** Every action its beats can use, built-in and its own, a line each */
  actions: Record<string, string>
  /** Its own actions and gaits, by name */
  own: { actions: string[]; gaits: string[] }
}

export function persona(options: PersonaOptions): Persona {
  const cast: Cast = { actions: options.actions, gaits: options.gaits }
  const castProblems = checkCast(cast)
  if (castProblems.length > 0) throw new Error(`persona "${options.name}": ${castProblems.join(' ')}`)
  const gaits = [...Object.keys(GAITS), ...Object.keys(options.gaits ?? {})]
  const gait = options.gait ?? 'walk'
  if (!gaits.includes(gait)) throw new Error(`persona "${options.name}": ${unknownName('gait', gait, gaits)}`)
  if (options.mood && !(options.mood in EXPRESSIONS)) throw new Error(`persona "${options.name}": ${unknownName('mood', options.mood, Object.keys(EXPRESSIONS))}`)
  const acting = options.acting ?? 'snappy'
  if (typeof acting === 'string' && !(acting in ACTING_STYLES)) throw new Error(`persona "${options.name}": ${unknownName('acting style', acting, Object.keys(ACTING_STYLES))}`)
  if (typeof options.stance === 'string' && !(options.stance in POSES)) throw new Error(`persona "${options.name}": ${unknownName('stance', options.stance, Object.keys(POSES))}`)

  const height = options.height ?? 120
  const stance = typeof options.stance === 'string' ? POSES[options.stance] : poseFrom(options.stance ?? {})
  const rest = options.mood ? withExpression(stance, options.mood) : stance
  const style: StickStyle = { ...options.look, height }
  const summary = options.summary ?? `${options.name}, a stick figure`

  return {
    name: options.name,
    summary,
    cast,
    rest,
    height,
    figure: (at) => stickFigureTarget({ x: at.x, y: at.y, pose: rest, style: { ...style, ...(at.facing ? { facing: at.facing } : {}) }, cast }),
    script: (target, beats, placed = {}) =>
      scriptTracks(target, beats, {
        ...cast,
        from: placed.from,
        ground: placed.ground,
        facing: placed.facing,
        height,
        style: acting,
        gait,
        start: rest,
        rest,
        energy: options.energy,
      }),
    check: (beats) => checkBeats(beats, cast),
    handPath: (target, tracks, path) => handPath(target, tracks, { ...path, style, cast }),
    describe: () => ({
      name: options.name,
      summary,
      habits: {
        height,
        acting: typeof acting === 'string' ? acting : 'custom',
        gait,
        ...(options.mood ? { mood: options.mood } : {}),
        stance: typeof options.stance === 'string' ? options.stance : options.stance ? 'custom' : 'rest',
      },
      actions: scriptActionSummaries(cast),
      own: { actions: Object.keys(options.actions ?? {}), gaits: Object.keys(options.gaits ?? {}) },
    }),
  }
}
