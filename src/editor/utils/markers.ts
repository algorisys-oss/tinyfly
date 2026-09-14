import type { TimelineMarker } from '../../engine'

/**
 * Pure helpers behind the editor's marker (step) and caption editing, so the
 * rules live in one testable place and the store only applies them.
 */

export type Captions = Record<string, Record<string, string>>

/** A marker id: letters, digits, dashes and underscores (it keys captions and URLs). */
export function normaliseMarkerId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
}

/** The first free `step-N` id and its matching `Step N` label. */
export function nextStepName(markers: TimelineMarker[]): { id: string; label: string } {
  const taken = new Set(markers.map((marker) => marker.id))
  let n = markers.length + 1
  while (taken.has(`step-${n}`)) n++
  return { id: `step-${n}`, label: `Step ${n}` }
}

/** Insert a marker at a time, in order. A marker already at that exact time is returned instead. */
export function insertMarker(markers: TimelineMarker[], time: number): { markers: TimelineMarker[]; id: string } {
  const at = Math.max(0, Math.round(time))
  const existing = markers.find((marker) => marker.time === at)
  if (existing) return { markers, id: existing.id }
  const { id, label } = nextStepName(markers)
  return { markers: sortMarkers([...markers, { id, time: at, label }]), id }
}

export function sortMarkers(markers: TimelineMarker[]): TimelineMarker[] {
  return [...markers].sort((a, b) => a.time - b.time)
}

export interface MarkerPatch {
  id?: string
  time?: number
  label?: string
  pause?: boolean
  question?: string
}

/**
 * Apply an edit to one marker. Renaming moves its captions along; an id that is
 * empty or taken is refused (the result says why). Empty labels and questions are
 * removed rather than stored as "".
 */
export function patchMarker(
  markers: TimelineMarker[],
  captions: Captions | undefined,
  id: string,
  patch: MarkerPatch,
  duration: number
): { markers: TimelineMarker[]; captions: Captions | undefined; id: string; error?: string } {
  const index = markers.findIndex((marker) => marker.id === id)
  if (index === -1) return { markers, captions, id, error: `no marker "${id}"` }
  const current = markers[index]
  const next: TimelineMarker = { ...current }
  let nextCaptions = captions

  if (patch.id !== undefined) {
    const newId = normaliseMarkerId(patch.id)
    if (!newId) return { markers, captions, id, error: 'An id needs at least one letter or digit.' }
    if (newId !== id && markers.some((marker) => marker.id === newId)) return { markers, captions, id, error: `Another step is already "${newId}".` }
    next.id = newId
    if (newId !== id && captions) nextCaptions = renameCaptionKey(captions, id, newId)
  }
  if (patch.time !== undefined) next.time = Math.max(0, Math.min(duration, Math.round(patch.time)))
  if (patch.label !== undefined) setOptional(next, 'label', patch.label)
  if (patch.question !== undefined) setOptional(next, 'question', patch.question)
  if (patch.pause !== undefined) {
    if (patch.pause) next.pause = true
    else delete next.pause
  }

  const updated = [...markers]
  updated[index] = next
  return { markers: sortMarkers(updated), captions: nextCaptions, id: next.id }
}

/** Remove a marker and its captions. */
export function removeMarker(markers: TimelineMarker[], captions: Captions | undefined, id: string): { markers: TimelineMarker[]; captions: Captions | undefined } {
  const nextCaptions: Captions = {}
  for (const [language, byMarker] of Object.entries(captions ?? {})) {
    const { [id]: _removed, ...rest } = byMarker
    if (Object.keys(rest).length > 0) nextCaptions[language] = rest
  }
  return { markers: markers.filter((marker) => marker.id !== id), captions: Object.keys(nextCaptions).length > 0 ? nextCaptions : undefined }
}

/** Set (or clear, with empty text) one caption. */
export function setCaption(captions: Captions | undefined, language: string, id: string, text: string): Captions | undefined {
  const next: Captions = JSON.parse(JSON.stringify(captions ?? {}))
  const lang = language.trim()
  if (!lang) return captions
  if (text.trim() === '') {
    if (next[lang]) delete next[lang][id]
  } else {
    ;(next[lang] ??= {})[id] = text
  }
  return next
}

/** The languages the captions use, plus any the author added but has not filled in. */
export function captionLanguages(captions: Captions | undefined, extra: string[] = []): string[] {
  return [...new Set([...Object.keys(captions ?? {}), ...extra])].sort()
}

/** Drop a whole language. */
export function removeCaptionLanguage(captions: Captions | undefined, language: string): Captions | undefined {
  if (!captions?.[language]) return captions
  const { [language]: _removed, ...rest } = captions
  return Object.keys(rest).length > 0 ? rest : undefined
}

/** A BCP 47-ish language tag: `es`, `pt-BR`, `zh-CN`. */
export function normaliseLanguage(raw: string): string | undefined {
  const match = /^\s*([a-zA-Z]{2,3})(?:[-_]([a-zA-Z0-9]{2,8}))?\s*$/.exec(raw)
  if (!match) return undefined
  return match[2] ? `${match[1].toLowerCase()}-${match[2].length === 2 ? match[2].toUpperCase() : match[2]}` : match[1].toLowerCase()
}

/** The marker nearest before / after a time (for stepping the playhead). */
export function neighbourMarker(markers: TimelineMarker[], time: number, direction: 1 | -1): TimelineMarker | undefined {
  const sorted = sortMarkers(markers)
  return direction === 1 ? sorted.find((marker) => marker.time > time + 0.5) : [...sorted].reverse().find((marker) => marker.time < time - 0.5)
}

function renameCaptionKey(captions: Captions, from: string, to: string): Captions {
  const next: Captions = {}
  for (const [language, byMarker] of Object.entries(captions)) {
    const entries = Object.entries(byMarker).map(([key, text]) => [key === from ? to : key, text] as const)
    next[language] = Object.fromEntries(entries)
  }
  return next
}

function setOptional(marker: TimelineMarker, key: 'label' | 'question', value: string) {
  if (value.trim() === '') delete marker[key]
  else marker[key] = value
}
