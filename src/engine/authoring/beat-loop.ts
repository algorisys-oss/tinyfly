import { beatAtTime, beatLength, type BeatGrid } from './beats'
import { phaseOf } from './periodic'

/**
 * Beats and sound for loops. A loop closes when its length is a whole number
 * of beats, so the pulse on its last beat runs straight into its first:
 * `loopBeats` fits a grid to a period (or a period to a grid), `beatPulse`
 * is a pulse that spikes on every beat, and `audioEnvelope` turns samples
 * into a level per frame for motion that follows the music. All pure.
 */

/** How many ms a whole number of beats takes. */
export function beatPeriod(grid: Pick<BeatGrid, 'bpm'>, beats: number): number {
  return beats * beatLength({ bpm: grid.bpm, offset: 0 })
}

/**
 * Cut a tempo to a loop: the nearest whole number of beats in `period` ms,
 * and the tempo nudged so they fit it exactly (a drone or riser stretched a
 * hair, never cut mid-beat). The grid's `offset` is kept.
 */
export function loopBeats(period: number, grid: BeatGrid): { beats: number; grid: BeatGrid } {
  const beats = Math.max(1, Math.round(period / beatLength(grid)))
  return { beats, grid: { ...grid, bpm: (beats * 60000) / period } }
}

export interface BeatPulseOptions {
  /** How fast the pulse rises, as a share of a beat (default 0.05) */
  attack?: number
  /** How long it takes to fall back, as a share of a beat (default 0.4) */
  decay?: number
  /** Stress the first beat of each bar this much more, 0.. (default 0: all beats alike) */
  barAccent?: number
}

/**
 * A pulse that spikes to 1 on every beat and decays, as a function of time:
 * scale a shape by `1 + 0.2 * beatPulse(t, grid)` and it bobs to the music.
 * Over a loop that is a whole number of beats (`loopBeats`), it repeats
 * exactly.
 */
export function beatPulse(time: number, grid: BeatGrid, options: BeatPulseOptions = {}): number {
  const attack = Math.max(1e-6, options.attack ?? 0.05)
  const decay = Math.max(1e-6, options.decay ?? 0.4)
  const beat = beatAtTime(grid, time)
  const u = beat - Math.floor(beat)
  const shape = u < attack ? u / attack : Math.max(0, 1 - (u - attack) / decay)
  const accent = options.barAccent ?? 0
  if (accent <= 0) return shape
  const perBar = Math.max(1, Math.round(grid.beatsPerBar ?? 4))
  const n = Math.floor(beat)
  const first = ((n % perBar) + perBar) % perBar === 0
  return shape * (first ? 1 + accent : 1) / (1 + accent)
}

export interface EnvelopeOptions {
  /** Levels per second (default 30: one per video frame) */
  fps?: number
  /** How much each level keeps of the last, 0..1 (default 0.5): higher is smoother, slower to fall */
  smoothing?: number
  /** Scale so the loudest level is 1 (default true) */
  normalize?: boolean
}

/** The loudness of audio over time: one level (0..1) per frame, smoothed. Deterministic. */
export function audioEnvelope(samples: Float32Array, sampleRate: number, options: EnvelopeOptions = {}): Float32Array {
  const fps = options.fps ?? 30
  const window = Math.max(1, Math.round(sampleRate / fps))
  const frames = Math.max(1, Math.ceil(samples.length / window))
  const out = new Float32Array(frames)
  const keep = Math.min(0.99, Math.max(0, options.smoothing ?? 0.5))
  let last = 0
  let peak = 0
  for (let f = 0; f < frames; f++) {
    let sum = 0
    const start = f * window
    const end = Math.min(samples.length, start + window)
    for (let i = start; i < end; i++) sum += samples[i] * samples[i]
    const rms = end > start ? Math.sqrt(sum / (end - start)) : 0
    // Rise at once, fall slowly: a level that jumps on a hit and lets go.
    last = rms > last ? rms : last * keep + rms * (1 - keep)
    out[f] = last
    peak = Math.max(peak, last)
  }
  if (options.normalize !== false && peak > 0) for (let f = 0; f < frames; f++) out[f] /= peak
  return out
}

/** The envelope's level at a time, between its frames; with `period` the time wraps, for a loop. */
export function envelopeAt(levels: Float32Array, time: number, fps = 30, period?: number): number {
  if (levels.length === 0) return 0
  const t = period ? phaseOf(time, period) * period : time
  const frame = (t * fps) / 1000
  const i = Math.floor(frame)
  const a = levels[Math.min(levels.length - 1, Math.max(0, i))]
  const b = levels[Math.min(levels.length - 1, Math.max(0, i + 1))]
  return a + (b - a) * (frame - i)
}
