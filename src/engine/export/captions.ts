import type { TimelineDefinition } from '../types'
import { deserializeTimeline } from '../serialization'

/**
 * Caption files: SubRip (`.srt`) and WebVTT (`.vtt`).
 *
 * A cue is a span of time and its text. Cues come either from a narration plan
 * (`planNarration(...).cues`, which are already cue-shaped) or from a
 * timeline's markers via {@link captionCuesFromTimeline}. Pure string output;
 * no DOM.
 */

/** One caption. Times are milliseconds from the start. */
export interface CaptionCue {
  /** Optional name, e.g. a narration cue's `s0-l1`; used to name stills */
  id?: string
  start: number
  end: number
  text: string
}

/** `HH:MM:SS<sep>mmm`, rounded to whole milliseconds. */
function formatTime(ms: number, separator: ',' | '.'): string {
  const total = Math.max(0, Math.round(ms))
  const hours = Math.floor(total / 3_600_000)
  const minutes = Math.floor((total % 3_600_000) / 60_000)
  const seconds = Math.floor((total % 60_000) / 1000)
  const millis = total % 1000
  const pad = (value: number, width = 2) => String(value).padStart(width, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}${separator}${pad(millis, 3)}`
}

/** Blank lines end a cue in both formats, so collapse them inside the text. */
function cueText(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(/\n{2,}/g, '\n').trim()
}

/** SubRip text: numbered cues with `00:00:01,250 --> 00:00:03,000` times. */
export function toSRT(cues: CaptionCue[]): string {
  return cues
    .map((cue, index) => `${index + 1}\n${formatTime(cue.start, ',')} --> ${formatTime(cue.end, ',')}\n${cueText(cue.text)}\n`)
    .join('\n')
}

/** WebVTT text: a `WEBVTT` header, then cues with `00:00:01.250` times. */
export function toWebVTT(cues: CaptionCue[]): string {
  const body = cues
    .map((cue) => `${formatTime(cue.start, '.')} --> ${formatTime(cue.end, '.')}\n${cueText(cue.text)}\n`)
    .join('\n')
  return `WEBVTT\n\n${body}`
}

export interface TimelineCaptionOptions {
  /** Caption language to read from `captions`; falls back to each marker's label */
  language?: string
}

/**
 * Cues from a timeline's markers: each marker's caption (or label) runs from
 * its time until the next marker, and the last one until the end of the
 * timeline. Markers with no text are skipped but still end the previous cue.
 */
export function captionCuesFromTimeline(
  definition: TimelineDefinition,
  options: TimelineCaptionOptions = {}
): CaptionCue[] {
  const markers = [...(definition.config.markers ?? [])].sort((a, b) => a.time - b.time)
  const translations = options.language ? definition.captions?.[options.language] : undefined
  const duration = deserializeTimeline(definition).duration
  const cues: CaptionCue[] = []
  markers.forEach((marker, index) => {
    const text = translations?.[marker.id] ?? marker.label
    if (!text) return
    const end = index + 1 < markers.length ? markers[index + 1].time : duration
    if (end > marker.time) cues.push({ start: marker.time, end, text })
  })
  return cues
}
