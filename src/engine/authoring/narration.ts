import type { TimelineMarker } from '../types'

/**
 * Narration timing: lay spoken lines out on a timeline.
 *
 * A narrated video is timed by its voice-over. Each line is a recorded (or
 * synthesised) clip of known length; scenes group lines and add a short lead
 * before the first line, a gap between lines and a tail after the last. This
 * module turns those clip lengths into absolute start/end times, so drawing,
 * markers and captions all follow the audio. It is pure: same lines in, same
 * times out.
 */

/** One spoken line. */
export interface NarrationLine {
  /** The text shown as its caption */
  text: string
  /** Length of the spoken clip, in milliseconds */
  duration: number
  /** Marker id for the line (default `s{scene}-l{line}`, both 0-based) */
  id?: string
}

/** A scene: consecutive lines that share one picture. */
export interface NarrationScene {
  /** Scene id (default `s{scene}`) */
  id?: string
  lines: NarrationLine[]
  /** Extra hold after this scene's last line, added to the default tail, in ms */
  tail?: number
}

/** Pauses around the lines, in milliseconds. */
export interface NarrationOptions {
  /** Silence before a scene's first line (default 350) */
  lead?: number
  /** Silence between lines in a scene (default 300) */
  gap?: number
  /** Silence after a scene's last line (default 550) */
  tail?: number
}

/** A line placed on the timeline. Times are absolute milliseconds. */
export interface NarrationCue {
  id: string
  /** Index of the scene the line belongs to */
  scene: number
  /** Index of the line within its scene */
  line: number
  start: number
  end: number
  text: string
}

/** A scene placed on the timeline. */
export interface NarrationSceneTiming {
  id: string
  /** Absolute start, in ms */
  start: number
  /** Scene length including lead, gaps and tail, in ms */
  duration: number
  cues: NarrationCue[]
}

/** The whole narration laid out. */
export interface NarrationPlan {
  /** Total length, in ms */
  duration: number
  scenes: NarrationSceneTiming[]
  /** Every line in order */
  cues: NarrationCue[]
}

const DEFAULT_LEAD = 350
const DEFAULT_GAP = 300
const DEFAULT_TAIL = 550

/**
 * Lay the scenes' lines out end to end.
 *
 * Within a scene: lead, line 0, gap, line 1, …, last line, tail. Scenes follow
 * each other with no extra space. The narration audio must be assembled with
 * the same pauses for it to line up (or built from the returned cue times).
 */
export function planNarration(scenes: NarrationScene[], options: NarrationOptions = {}): NarrationPlan {
  const lead = options.lead ?? DEFAULT_LEAD
  const gap = options.gap ?? DEFAULT_GAP
  const tail = options.tail ?? DEFAULT_TAIL

  const timings: NarrationSceneTiming[] = []
  let sceneStart = 0

  scenes.forEach((scene, sceneIndex) => {
    const cues: NarrationCue[] = []
    let cursor = sceneStart + lead
    scene.lines.forEach((line, lineIndex) => {
      if (!(line.duration >= 0)) {
        throw new Error(`narration: scene ${sceneIndex} line ${lineIndex} has an invalid duration (${line.duration})`)
      }
      if (lineIndex > 0) cursor += gap
      cues.push({
        id: line.id ?? `s${sceneIndex}-l${lineIndex}`,
        scene: sceneIndex,
        line: lineIndex,
        start: cursor,
        end: cursor + line.duration,
        text: line.text,
      })
      cursor += line.duration
    })
    const end = cursor + tail + (scene.tail ?? 0)
    timings.push({ id: scene.id ?? `s${sceneIndex}`, start: sceneStart, duration: end - sceneStart, cues })
    sceneStart = end
  })

  return { duration: sceneStart, scenes: timings, cues: timings.flatMap((scene) => scene.cues) }
}

/**
 * One marker per line, at its start, labelled with its text. Players step
 * through them and show the label as the caption.
 */
export function narrationMarkers(plan: NarrationPlan): TimelineMarker[] {
  return plan.cues.map((cue) => ({ id: cue.id, time: cue.start, label: cue.text }))
}

/** The scene playing at `time` (the last one at or past the end). */
export function narrationSceneAt(plan: NarrationPlan, time: number): NarrationSceneTiming | undefined {
  let found = plan.scenes[0]
  for (const scene of plan.scenes) {
    if (time >= scene.start) found = scene
    else break
  }
  return found
}
