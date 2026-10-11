import type { Track } from '../../engine/types'
import { characterScript, checkBeats, hairFollowTracks, type ActingStyleName, type Beat, type Surface } from '../../characters'
import type { CharacterElement } from '../stores/scene-store'
import { characterOf } from './character-element'

/**
 * A Character element's beat script, compiled into its tracks: the same
 * `characterScript` call a page makes, from the feet at the bottom centre of
 * its box, with hair follow-through. Beats may aim at places on the scene's
 * surfaces (a Code element's lines) and change them: a place is
 * `{ surface: '<element name>', anchor: 'line:3' }` wherever a beat takes a
 * `target`, `to`, `toward` or `onto`; a `then` cue runs an edit on a surface
 * at a moment of the beat, and the surface's edits become tracks on its
 * element.
 */

/** A place on a surface in the scene: an element's name, and a place on it. */
export interface SurfacePlace {
  surface: string
  anchor: string
}

/** What a surface does in answer to a beat, at a moment of it. */
export interface SurfaceCue {
  surface: string
  edit: string
  anchor: string
  /** A moment of the beat (default its contact, or its start), or ms after its start */
  at?: 'start' | 'contact' | 'release' | 'end' | number
  [option: string]: unknown
}

/** A beat as a Character element writes it: the script's beats, with surface places and cues. */
export type ElementBeat = Omit<Beat, 'target' | 'to' | 'toward' | 'onto'> & {
  target?: Beat['target'] | SurfacePlace
  to?: number | SurfacePlace
  toward?: Beat['toward'] | SurfacePlace
  onto?: number | SurfacePlace
  then?: SurfaceCue | SurfaceCue[]
}

export interface CompileBeatsOptions {
  facing?: 1 | -1
  acting?: ActingStyleName
  /** The scene's surfaces by element name (Code elements), for places and cues */
  surfaces?: Record<string, Surface>
}

/** How long the timeline holds after the last beat, ms. */
export const SCRIPT_TAIL = 300

const isPlace = (value: unknown): value is SurfacePlace =>
  typeof value === 'object' && value !== null && typeof (value as SurfacePlace).surface === 'string' && typeof (value as SurfacePlace).anchor === 'string'

const cuesOf = (beat: ElementBeat): SurfaceCue[] => (beat.then === undefined ? [] : Array.isArray(beat.then) ? beat.then : [beat.then])

/**
 * The beats with their surface places resolved to scene px and their cues
 * set aside: what `characterScript` takes. Throws naming the beat when a
 * place is on no surface or at no anchor.
 */
function resolve(beats: ElementBeat[], surfaces: Record<string, Surface>): Beat[] {
  const box = (index: number, place: SurfacePlace, field: string) => {
    const surface = surfaces[place.surface]
    if (!surface) throw new Error(`beat ${index + 1}: \`${field}\`: no surface "${place.surface}" in the scene (surfaces: ${Object.keys(surfaces).join(', ') || 'none'})`)
    try {
      return surface.anchor(place.anchor)
    } catch (error) {
      throw new Error(`beat ${index + 1}: \`${field}\`: ${(error as Error).message}`)
    }
  }
  return beats.map((beat, index) => {
    const { then: _then, target, to, toward, onto, ...rest } = beat
    const out: Beat = { ...(rest as Beat) }
    if (isPlace(target)) {
      const b = box(index, target, 'target')
      out.target = { x: b.left + b.width / 2, y: b.top + b.height / 2, left: b.left, right: b.right }
    } else if (target !== undefined) out.target = target
    if (isPlace(to)) {
      const b = box(index, to, 'to')
      out.to = b.left + b.width / 2
    } else if (to !== undefined) out.to = to
    if (isPlace(toward)) {
      const b = box(index, toward, 'toward')
      out.toward = b.left + b.width / 2
    } else if (toward !== undefined) out.toward = toward
    if (isPlace(onto)) out.onto = box(index, onto, 'onto').top
    else if (onto !== undefined) out.onto = onto
    return out
  })
}

/**
 * What stops a beat script from playing: the script's own checks, plus
 * places on no surface, cues on no surface or with an unknown edit. Empty
 * when it is fine.
 */
export function beatProblems(beats: unknown, surfaces: Record<string, Surface> = {}): string[] {
  if (!Array.isArray(beats)) return ['Beats are a list: [{ "do": "walk", "to": 300 }, …]']
  const problems: string[] = []
  let plain: Beat[] = []
  try {
    plain = resolve(beats as ElementBeat[], surfaces)
  } catch (error) {
    problems.push((error as Error).message)
  }
  for (const problem of checkBeats(plain)) if (problem.level === 'error') problems.push(`beat ${problem.beat + 1}: ${problem.message}`)
  ;(beats as ElementBeat[]).forEach((beat, index) => {
    for (const cue of cuesOf(beat)) {
      if (!cue || typeof cue !== 'object' || typeof cue.surface !== 'string' || typeof cue.edit !== 'string' || typeof cue.anchor !== 'string') {
        problems.push(`beat ${index + 1}: \`then\` is a cue, { surface, edit, anchor, at? }`)
        continue
      }
      const surface = surfaces[cue.surface]
      if (!surface) problems.push(`beat ${index + 1}: \`then\`: no surface "${cue.surface}" in the scene (surfaces: ${Object.keys(surfaces).join(', ') || 'none'})`)
      else if (!(cue.edit in surface.about.edits)) problems.push(`beat ${index + 1}: \`then\`: ${cue.surface} has no edit "${cue.edit}" (edits: ${Object.keys(surface.about.edits).join(', ')})`)
    }
  })
  return problems
}

/**
 * The tracks a Character element's beats compile to: its own, on its name,
 * with hair follow-through, and every surface's edits on that surface's
 * element name.
 */
export function compileCharacterBeats(element: CharacterElement, beats: ElementBeat[], options: CompileBeatsOptions = {}): { tracks: Track[]; duration: number } {
  const surfaces = options.surfaces ?? {}
  const who = characterOf(element)
  const script = characterScript(element.name, who, resolve(beats, surfaces), {
    from: element.x + element.width / 2,
    ground: element.y + element.height,
    facing: options.facing ?? 1,
    style: options.acting ?? 'snappy',
  })
  // The cues: each surface's edit at its moment of the beat.
  const used = new Set<string>()
  beats.forEach((beat, index) => {
    const span = script.beats[index]
    for (const cue of cuesOf(beat)) {
      const surface = surfaces[cue.surface]
      if (!surface || !span) continue
      const { surface: _s, edit, anchor, at, until: _until, ...rest } = cue
      const moment = typeof at === 'number' ? span.start + at : at === 'start' ? span.start : at === 'release' ? (span.release ?? span.end) : at === 'end' ? span.end : (span.contact ?? span.start)
      surface.edit(edit, anchor, { ...rest, at: moment })
      used.add(cue.surface)
    }
  })
  // Floors the figure stands on carry it: a chart's bar as it grows, a prop's roof as it lifts, a line of code as the ones above go.
  let ridden = script.tracks
  for (const name of Object.keys(surfaces)) ridden = surfaces[name].ride(ridden, element.name, { ground: element.y + element.height })
  const tracks = [...ridden, ...hairFollowTracks(element.name, ridden, who), ...[...used].flatMap((name) => surfaces[name].tracks(name))]
  return { tracks, duration: script.duration }
}
