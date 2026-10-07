import { unknownName } from '../../engine/authoring/did-you-mean'
import type { Track } from '../../engine/types'
import type { StickStyle } from '../stick-figure'
import type { Surface } from '../surface/surface'
import { checkBeats, type BeatProblem } from './beat-check'
import { expandBeats, type Cast } from './custom'
import { handPath } from './hand-path'
import { scriptTracks, type Beat, type BeatTarget, type ScriptBeatSpan, type ScriptOptions, type ScriptResult } from './script'

/**
 * A figure acting on surfaces, written as plain data: beats name the places
 * they act on (`{ surface: 'code', anchor: 'token:4:Println' }`) and say what
 * the surface does in answer (`then`), at a moment of the beat.
 *
 * ```ts
 * const result = surfaceScript('hero', { code }, [
 *   { do: 'leap', to: { surface: 'code', anchor: 'line:4' }, onto: { surface: 'code', anchor: 'line:5' } },
 *   { do: 'grab', target: { surface: 'code', anchor: 'token:4:Println' },
 *     then: { surface: 'code', edit: 'carry', anchor: 'token:4:Println', until: { beat: 2, at: 'release' } } },
 *   { do: 'throw', then: { surface: 'code', edit: 'fling', anchor: 'token:4:Println', at: 'release' } },
 * ], { from: 600, ground: code.box.bottom })
 * const timeline = { tracks: result.tracks }   // the figure's tracks and every surface's
 * ```
 *
 * It compiles to the same calls written by hand: the beats go to
 * `scriptTracks` with each named place swapped for its box (as laid out,
 * before any edit moves it), then each `then` runs `surface.edit()` at its
 * beat's moment, in the order the beats are written. A `carry` makes the
 * piece follow the figure's hand (`handPath`). Last, the figure is carried
 * by any surface it stands on (`surface.ride()`), unless `ride: false`.
 */

/** A named place on one of the scene's surfaces (`surfaces[surface].anchor(anchor)`). */
export interface SurfaceRef {
  surface: string
  anchor: string
}

/** A moment of a beat: when it starts, when it touches its target, when it lets go, when it ends. */
export type BeatMoment = 'start' | 'contact' | 'release' | 'end'
export const BEAT_MOMENTS: readonly BeatMoment[] = ['start', 'contact', 'release', 'end']

/** A moment of this beat, or of a later one (`beat` is its index in the script). */
export type CueTime = BeatMoment | { beat: number; at?: BeatMoment }

/**
 * What a surface does in answer to a beat: one of its edits (or `carry`),
 * at one of its places. Every other field is the edit's own options (`text`,
 * `into`, `to`, `style`…). Its time is a moment of the beat, not ms.
 */
export interface SurfaceCue {
  surface: string
  /** One of the surface's edits, or `carry`: the piece at `anchor` follows the hand from `at` to `until` */
  edit: string
  anchor: string | string[]
  /** When it starts: a moment of the beat (default its contact, or its start when it has none) */
  at?: BeatMoment
  /** When it ends: sets the edit's duration (`carry` needs it) */
  until?: CueTime
  [option: string]: unknown
}

/** A beat whose places can be named on a surface, and that a surface can answer. */
export interface SurfaceBeat extends Omit<Beat, 'target' | 'to' | 'onto'> {
  /** What it acts on: a point or box, or a named place */
  target?: BeatTarget | SurfaceRef
  /** Walking: where to, scene x, or a named place (its centre x) */
  to?: number | SurfaceRef
  /** The floor it ends the beat on, scene y, or a named place (its top) */
  onto?: number | SurfaceRef
  /** What the surfaces do in answer */
  then?: SurfaceCue | SurfaceCue[]
}

export interface SurfaceScriptOptions extends ScriptOptions {
  /** How the figure is drawn, for a `carry` to follow its hand (default: just its `height`) */
  figureStyle?: StickStyle
  /** Carry the figure on the surfaces it stands on (default true) */
  ride?: boolean
}

export interface SurfaceScriptResult extends ScriptResult {
  /** The figure's tracks (ridden), then every surface's tracks, keyed by its name in `surfaces` */
  tracks: Track[]
  /** Just the figure's tracks (ridden) */
  figureTracks: Track[]
}

/** The fields a cue reserves; the rest are the edit's options. */
const CUE_FIELDS = ['surface', 'edit', 'anchor', 'at', 'until']
/** Edits a surface script adds to every surface's own. */
const SCRIPT_EDITS = ['carry']

const isRef = (value: unknown): value is SurfaceRef =>
  !!value && typeof value === 'object' && !Array.isArray(value) && 'surface' in value && 'anchor' in value
const cuesOf = (beat: SurfaceBeat): SurfaceCue[] => (beat.then === undefined ? [] : Array.isArray(beat.then) ? beat.then : [beat.then])

/**
 * Compile beats that act on surfaces into the figure's tracks and the
 * surfaces' edits. Throws when a beat or a cue is wrong (see
 * `checkSurfaceBeats`), naming the beat.
 */
export function surfaceScript(figure: string, surfaces: Record<string, Surface>, beats: SurfaceBeat[], options: SurfaceScriptOptions = {}): SurfaceScriptResult {
  const errors = checkSurfaceBeats(beats, surfaces, options).filter((problem) => problem.level === 'error')
  if (errors.length > 0) {
    throw new Error(`surfaceScript: ${errors.length} problem(s) in the beats:\n${errors.map((p) => `  ${p.beat >= 0 ? `beat ${p.beat}: ` : ''}${p.message}`).join('\n')}`)
  }
  const plain = beats.map((beat) => plainBeat(beat, surfaces))
  const script = scriptTracks(figure, plain, options)
  const moments = writtenMoments(plain, script.beats, options)
  const ground = options.ground ?? 0
  const ride = (tracks: Track[]) =>
    options.ride === false ? tracks : Object.values(surfaces).reduce((ridden, surface) => surface.ride(ridden, figure, { ground }), tracks)

  beats.forEach((beat, index) => {
    for (const cue of cuesOf(beat)) {
      const fail = (message: string) => new Error(`surfaceScript: beat ${index} (${beat.do}), ${cue.edit} on ${cue.surface}: ${message}`)
      const momentOf = (time: CueTime, fallback?: BeatMoment) => {
        const beatIndex = typeof time === 'object' ? time.beat : index
        const name = (typeof time === 'object' ? time.at : time) ?? fallback ?? 'start'
        const at = moments[beatIndex][name]
        if (at === undefined) {
          const has = BEAT_MOMENTS.filter((moment) => moments[beatIndex][moment] !== undefined).join(', ')
          throw fail(`beat ${beatIndex} (${beats[beatIndex].do}) has no ${name} (it has ${has})`)
        }
        return at
      }
      const surface = surfaces[cue.surface]
      const at = momentOf(cue.at ?? (moments[index].contact !== undefined ? 'contact' : 'start'))
      const until = cue.until === undefined ? undefined : momentOf(cue.until, 'end')
      if (until !== undefined && until < at) throw fail(`it ends (${until} ms) before it starts (${at} ms)`)
      try {
        if (cue.edit === 'carry') {
          const piece = surface.piece(cue.anchor as string)
          const path = handPath(figure, ride(script.tracks), {
            x: options.from ?? 0,
            y: ground,
            style: options.figureStyle ?? (options.height ? { height: options.height } : undefined),
            cast: options,
            start: at,
            end: until!,
          })
          surface.follow(piece, path)
          continue
        }
        const edit = Object.fromEntries(Object.entries(cue).filter(([key]) => !CUE_FIELDS.includes(key)))
        surface.edit(cue.edit, cue.anchor, { ...edit, at, ...(until !== undefined ? { duration: until - at } : {}) })
      } catch (error) {
        throw fail((error as Error).message)
      }
    }
  })

  const figureTracks = ride(script.tracks)
  const surfaceTracks = Object.entries(surfaces).flatMap(([name, surface]) => surface.tracks(name))
  return { ...script, tracks: [...figureTracks, ...surfaceTracks], figureTracks }
}

/**
 * Problems in beats that act on surfaces: everything `checkBeats` finds,
 * plus surfaces, places, edits and moments that do not exist (with the
 * likely intended name). Errors make `surfaceScript` throw.
 */
export function checkSurfaceBeats(beats: unknown, surfaces: Record<string, Surface>, cast: Cast = {}): BeatProblem[] {
  if (!Array.isArray(beats)) return checkBeats(beats, cast)
  const problems: BeatProblem[] = []
  const names = Object.keys(surfaces)
  const surfaceOf = (index: number, name: unknown, where: string) => {
    const surface = typeof name === 'string' ? surfaces[name] : undefined
    if (!surface) problems.push({ level: 'error', beat: index, message: `${where}: ${unknownName('surface', name, names)}` })
    return surface
  }
  /** Checks one named place; problems are added, and `ok` says whether it is there. */
  const checkPlace = (index: number, surface: Surface, anchor: unknown, where: string) => {
    if (typeof anchor !== 'string') {
      problems.push({ level: 'error', beat: index, message: `${where}: \`anchor\` is a place name such as ${Object.keys(surface.about.anchors).join(', ')} (got ${JSON.stringify(anchor)}).` })
      return
    }
    try {
      surface.anchor(anchor, 0)
    } catch (error) {
      problems.push({ level: 'error', beat: index, message: `${where}: ${(error as Error).message}` })
    }
  }
  const checkTime = (index: number, time: unknown, where: string) => {
    const name = typeof time === 'object' && time !== null ? (time as { at?: unknown }).at : time
    if (typeof time === 'object' && time !== null) {
      const beat = (time as { beat?: unknown }).beat
      if (typeof beat !== 'number' || !Number.isInteger(beat) || beat < index || beat >= beats.length) {
        problems.push({ level: 'error', beat: index, message: `${where}: \`beat\` is the index of this beat or a later one, ${index} to ${beats.length - 1} (got ${JSON.stringify(beat)}).` })
      }
      if (name === undefined) return
    }
    if (typeof name === 'number') problems.push({ level: 'error', beat: index, message: `${where}: a cue starts at a moment of its beat (${BEAT_MOMENTS.join(', ')}), not at ms; set the beat's own \`at\` to move it.` })
    else if (typeof name !== 'string' || !BEAT_MOMENTS.includes(name as BeatMoment)) problems.push({ level: 'error', beat: index, message: `${where}: ${unknownName('moment', name, BEAT_MOMENTS)}` })
  }

  beats.forEach((beat: unknown, index) => {
    if (!beat || typeof beat !== 'object' || Array.isArray(beat)) return
    const fields = beat as Record<string, unknown>
    for (const field of ['target', 'to', 'onto']) {
      if (!isRef(fields[field])) continue
      const ref = fields[field] as SurfaceRef
      const surface = surfaceOf(index, ref.surface, `\`${field}\``)
      if (surface) checkPlace(index, surface, ref.anchor, `\`${field}\``)
    }
    if (fields.then === undefined) return
    const cues = Array.isArray(fields.then) ? fields.then : [fields.then]
    cues.forEach((cue: unknown) => {
      if (!cue || typeof cue !== 'object' || Array.isArray(cue)) {
        problems.push({ level: 'error', beat: index, message: '`then` is a cue, { surface, edit, anchor, at?, until? }, or a list of them.' })
        return
      }
      const c = cue as Record<string, unknown>
      const surface = surfaceOf(index, c.surface, '`then`')
      if (!surface) return
      const where = `\`then\` (${String(c.edit)} on ${String(c.surface)})`
      const edits = [...Object.keys(surface.about.edits), ...SCRIPT_EDITS]
      if (typeof c.edit !== 'string' || !edits.includes(c.edit)) {
        problems.push({ level: 'error', beat: index, message: `\`then\`: ${unknownName('edit', c.edit, edits)}` })
        return
      }
      for (const anchor of Array.isArray(c.anchor) ? c.anchor : [c.anchor]) checkPlace(index, surface, anchor, where)
      if (c.edit === 'carry' && typeof c.anchor !== 'string') problems.push({ level: 'error', beat: index, message: `${where}: \`carry\` takes one anchor, the piece it carries.` })
      if (c.edit === 'carry' && c.until === undefined) problems.push({ level: 'error', beat: index, message: `${where}: \`carry\` needs \`until\` (when it lets go, such as { beat: ${index + 1}, at: 'release' }).` })
      if (c.at !== undefined) checkTime(index, c.at, `${where} \`at\``)
      if (c.until !== undefined) checkTime(index, c.until, `${where} \`until\``)
      if (c.until !== undefined && c.duration !== undefined) problems.push({ level: 'error', beat: index, message: `${where}: give \`until\` or \`duration\`, not both.` })
    })
  })

  // The beats as `scriptTracks` sees them: places as boxes (a place that is not there stands in at 0, 0).
  const plain = beats.map((beat: unknown) => (beat && typeof beat === 'object' && !Array.isArray(beat) ? plainBeat(beat as SurfaceBeat, surfaces, true) : beat))
  return [...checkBeats(plain, cast), ...problems]
}

/** A beat with its named places swapped for their boxes (as laid out) and its cues left off. */
function plainBeat(beat: SurfaceBeat, surfaces: Record<string, Surface>, lenient = false): Beat {
  const { then: _then, ...rest } = beat
  const place = (ref: SurfaceRef) => {
    try {
      return surfaces[ref.surface].anchor(ref.anchor, 0)
    } catch (error) {
      if (lenient) return { x: 0, y: 0, left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 }
      throw error
    }
  }
  const out = { ...rest } as Beat & Record<string, unknown>
  if (isRef(beat.target)) out.target = place(beat.target)
  if (isRef(beat.to)) out.to = place(beat.to).x
  if (isRef(beat.onto)) out.onto = place(beat.onto).top
  return out
}

/**
 * Each written beat's moments, ms. A custom action built from beats spans
 * all of them: it starts with the first, ends with the last, touches with
 * the first that touches and lets go with the last that lets go.
 */
function writtenMoments(beats: Beat[], spans: ScriptBeatSpan[], options: SurfaceScriptOptions): Array<Partial<Record<BeatMoment, number>>> {
  let next = 0
  return beats.map((beat) => {
    const count = expandBeats([beat], options.actions).length
    const own = spans.slice(next, next + count)
    next += count
    const contact = own.find((span) => span.contact !== undefined)?.contact
    const release = [...own].reverse().find((span) => span.release !== undefined)?.release
    return {
      start: own[0]?.start,
      end: own[own.length - 1]?.end,
      ...(contact !== undefined ? { contact } : {}),
      ...(release !== undefined ? { release } : {}),
    }
  })
}
