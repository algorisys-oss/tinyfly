/**
 * AI animation generation — prompt/scenario → a ready-to-edit tinyfly timeline.
 *
 * The LLM returns strict JSON matching the tinyfly sample schema
 * (`{ name, description, duration, canvas?, elements, tracks }`). We validate
 * it, then load it through the SAME store calls the Samples dialog uses — so an
 * AI-generated animation and a hand-authored sample are indistinguishable to
 * the rest of the editor. No animation logic lives here; this is pure data.
 */

import type { EditorStore } from '../stores/editor-store'
import type { SceneStore } from '../stores/scene-store'
import type { ProjectStore } from '../stores/project-store'
import type { SceneElement } from '../stores/scene-store'
import type { Track } from '../../engine/types'
import { callLLM } from './ai-providers'
import { getActiveProviderConfig } from './ai-settings'
import { buildAnimationSystemPrompt } from './animation-system-prompt'

/** The animation shape the LLM produces (mirrors SampleDefinition, sans presentation fields). */
export interface GeneratedAnimation {
  name: string
  description: string
  duration: number
  canvas?: { width: number; height: number }
  elements: Partial<SceneElement>[]
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
 * Load a validated animation into the editor, replacing the current scene's
 * content. Mirrors `loadSample` in samples-dialog.tsx.
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

  // Fresh timeline.
  const id = `ai-${anim.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)}`
  store.createNewTimeline(id, anim.name, { duration: anim.duration })

  // Elements.
  anim.elements.forEach((element) => {
    sceneStore.addElement(element.type!, element)
  })

  // Tracks (assign stable ids; the AI schema intentionally omits ids).
  anim.tracks.forEach((track, index) => {
    store.addTrack({ id: `${id}-track-${index}`, ...track })
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

  applyGeneratedAnimation(stores, animation)
  return { ok: true, animation }
}
