/**
 * AI animation generation — prompt/scenario → a ready-to-edit tinyfly timeline.
 *
 * The LLM returns strict JSON matching the tinyfly sample schema
 * (`{ name, description, duration, canvas?, elements, tracks }`). We validate
 * it, then load it through the SAME store calls `applySample` uses — so an
 * AI-generated animation and a hand-authored sample are indistinguishable to
 * the rest of the editor. No animation logic lives here; this is pure data.
 *
 * Characters are the one exception to keyframes-only: a character element may
 * carry a beat script (`beats`, the same beats `scriptTracks` takes), and a
 * `cast` name that dresses it. Loading compiles the beats with
 * `characterScript` (the public API, as the Character Acting card uses it),
 * adds hair follow-through, and keeps the beats on the element.
 */

import type { EditorStore } from '../stores/editor-store'
import type { SceneStore } from '../stores/scene-store'
import type { ProjectStore } from '../stores/project-store'
import type { SceneElement } from '../stores/scene-store'
import type { Track } from '../../engine/types'
import { CHARACTER_CAST, checkBeats, type ActingStyleName, type Beat, type CastName } from '../../characters'
import { castElementFields } from '../utils/character-element'
import { compileCharacterBeats, SCRIPT_TAIL } from '../utils/character-beats'
import { callLLM } from './ai-providers'
import { getActiveProviderConfig } from './ai-settings'
import { buildAnimationSystemPrompt } from './animation-system-prompt'

/** What a generated character element may carry besides its element fields. */
export interface GeneratedCharacterFields {
  /** A cast member to dress it as (`CHARACTER_CAST`) */
  cast?: string
  /** Which way it faces at first: 1 right (default), -1 left */
  facing?: 1 | -1
  /** The acting style its beats are compiled in (default snappy) */
  acting?: ActingStyleName
  /** The story it acts, as beats; compiled on load into its tracks */
  beats?: Beat[]
}

/** The animation shape the LLM produces (mirrors SampleDefinition, sans presentation fields). */
export interface GeneratedAnimation {
  name: string
  description: string
  duration: number
  canvas?: { width: number; height: number }
  elements: Array<Partial<SceneElement> & GeneratedCharacterFields>
  tracks: Omit<Track, 'id'>[]
}

export interface GenerateResult {
  ok: boolean
  error?: string
  animation?: GeneratedAnimation
}

export interface EditorStores {
  store: EditorStore
  sceneStore: SceneStore
  projectStore: ProjectStore
}

/** Strip markdown fences and parse; tolerant of models that wrap JSON despite instructions. */
export function parseAnimation(raw: string): GeneratedAnimation | null {
  try {
    let cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    // If the model added prose, grab the outermost { ... } block.
    if (!cleaned.startsWith('{')) {
      const start = cleaned.indexOf('{')
      const end = cleaned.lastIndexOf('}')
      if (start === -1 || end === -1) return null
      cleaned = cleaned.slice(start, end + 1)
    }
    const obj = JSON.parse(cleaned)
    return validate(obj) ? (obj as GeneratedAnimation) : null
  } catch {
    return null
  }
}

/** Shallow structural validation — enough to trust the loader, not a full schema. */
function validate(obj: unknown): obj is GeneratedAnimation {
  if (!obj || typeof obj !== 'object') return false
  const a = obj as Record<string, unknown>
  if (!Array.isArray(a.elements) || a.elements.length === 0) return false
  if (!Array.isArray(a.tracks)) return false
  if (typeof a.duration !== 'number' || a.duration <= 0) return false
  // Every element needs a type + a name (names are what tracks target).
  const names = new Set<string>()
  for (const el of a.elements as Record<string, unknown>[]) {
    if (!el || typeof el.type !== 'string' || typeof el.name !== 'string') return false
    // A character's beats, when given, are a list of beats with an action each (`checkBeats` says more).
    if (el.beats !== undefined && (el.type !== 'character' || !Array.isArray(el.beats) || el.beats.some((beat) => !beat || typeof beat !== 'object' || typeof (beat as Record<string, unknown>).do !== 'string'))) return false
    names.add(el.name)
  }
  // Every track must reference a real element name and carry keyframes.
  for (const t of a.tracks as Record<string, unknown>[]) {
    if (!t || typeof t.target !== 'string' || typeof t.property !== 'string') return false
    if (!names.has(t.target)) return false
    if (!Array.isArray(t.keyframes) || t.keyframes.length === 0) return false
  }
  return true
}

/**
 * What stops a parsed animation from loading: beat scripts that would not
 * compile (an unknown action or mood, a missing field), named by element.
 * Empty when it is fine.
 */
export function generatedProblems(anim: GeneratedAnimation): string[] {
  const problems: string[] = []
  for (const element of anim.elements) {
    if (element.type !== 'character' || !element.beats?.length) continue
    for (const problem of checkBeats(element.beats)) {
      if (problem.level === 'error') problems.push(`${element.name}: beat ${problem.beat + 1}: ${problem.message}`)
    }
  }
  return problems
}

export { compileCharacterBeats } from '../utils/character-beats'

/**
 * Load a validated animation into the editor, replacing the current scene's
 * content. Mirrors `applySample` in samples/apply-sample.ts. A character's
 * beats compile into its tracks (and stay on the element); the timeline
 * grows to fit the longest script.
 */
export function applyGeneratedAnimation(stores: EditorStores, anim: GeneratedAnimation): void {
  const { store, sceneStore, projectStore } = stores

  // Clear existing elements and tracks.
  sceneStore.clearElements()
  store.tracks().forEach((track) => store.removeTrack(track.id))

  // Resize the canvas if the animation declares its own dimensions.
  if (anim.canvas && anim.canvas.width > 0 && anim.canvas.height > 0) {
    projectStore.setCanvas({ ...anim.canvas })
  }

  // Elements; a character's cast dresses it, its beats compile once it is placed.
  const id = `ai-${anim.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)}`
  const compiled: Track[] = []
  let duration = anim.duration
  anim.elements.forEach((element) => {
    const { cast, facing, acting, beats, ...fields } = element
    let overrides: Partial<SceneElement> = fields
    if (element.type === 'character') {
      const dressed = cast && cast in CHARACTER_CAST ? castElementFields(cast as CastName) : {}
      const height = typeof fields.height === 'number' ? fields.height : undefined
      overrides = {
        ...dressed,
        ...fields,
        ...(fields.width === undefined && height ? { width: Math.round(height * 0.8) } : {}),
        ...(beats?.length ? { beats } : {}),
      } as Partial<SceneElement>
    }
    const placed = sceneStore.addElement(element.type!, overrides)
    if (placed.type === 'character' && beats?.length) {
      const script = compileCharacterBeats(placed, beats, { facing, acting })
      compiled.push(...script.tracks)
      duration = Math.max(duration, script.duration + SCRIPT_TAIL)
    }
  })

  // Fresh timeline, long enough for every script.
  store.createNewTimeline(id, anim.name, { duration })

  // Tracks (assign stable ids; the AI schema intentionally omits ids).
  anim.tracks.forEach((track, index) => {
    store.addTrack({ id: `${id}-track-${index}`, ...track })
  })
  compiled.forEach((track, index) => {
    store.addTrack({ ...track, id: `${id}-script-${index}` })
  })

  store.clearHistory()
  sceneStore.selectElement(null)
}

/**
 * Generate an animation from a natural-language brief and load it into the
 * editor. Returns a result the caller can use to show a toast/inline error.
 */
export async function generateAnimation(promptText: string, stores: EditorStores): Promise<GenerateResult> {
  const brief = promptText.trim()
  if (!brief) return { ok: false, error: 'Describe the animation you want.' }

  const { provider, model, apiKey } = getActiveProviderConfig()
  if (!apiKey) return { ok: false, error: 'Add an API key in AI Settings first.' }

  const canvas = stores.projectStore.currentProject().canvas
  const res = await callLLM({
    provider,
    model,
    apiKey,
    systemPrompt: buildAnimationSystemPrompt(canvas.width, canvas.height),
    userPrompt: `Animation brief: ${brief}`,
    temperature: 0.7,
    maxTokens: 4096,
  })

  if (!res.success) return { ok: false, error: res.error || 'Generation failed.' }

  const animation = parseAnimation(res.content)
  if (!animation) return { ok: false, error: 'The AI returned an unusable animation — try rephrasing.' }
  const problems = generatedProblems(animation)
  if (problems.length > 0) return { ok: false, error: `The AI wrote a beat script that will not play: ${problems.join('; ')}`, animation }

  applyGeneratedAnimation(stores, animation)
  return { ok: true, animation }
}
