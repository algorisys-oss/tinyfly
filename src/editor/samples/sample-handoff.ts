import type { SampleDefinition } from './sample-definitions'

/**
 * Hands a sample built elsewhere in the app (a course step, say) to the studio:
 * the sender stores it for this tab and opens `/studio?sample=handoff`, and the
 * studio takes it once, into a new project. Session storage keeps it to this tab
 * and out of URLs, however large the timeline.
 */

const KEY = 'tinyfly:sample-handoff'

export const HANDOFF_PARAM = 'handoff'

export function stashSampleForStudio(sample: SampleDefinition): void {
  sessionStorage.setItem(KEY, JSON.stringify(sample))
}

/** The stashed sample, removed as it is read, so a reload doesn't open it again. */
export function takeStashedSample(): SampleDefinition | undefined {
  let text: string | null = null
  try {
    text = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
  } catch {
    return undefined
  }
  if (!text) return undefined
  try {
    const sample = JSON.parse(text) as SampleDefinition
    return Array.isArray(sample.elements) && Array.isArray(sample.tracks) ? sample : undefined
  } catch {
    return undefined
  }
}
