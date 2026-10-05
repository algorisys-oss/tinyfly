/**
 * Beats: a steady pulse laid over the timeline, so motion can land on the
 * music. A grid is a tempo, where its first beat falls, and how many beats a
 * bar has; everything else (which beat a moment is on, the nearest beat, the
 * beats in a range) follows from it. Pure functions, no audio or DOM.
 *
 * `detectTempo` finds a grid in audio samples: the tempo and where the beats
 * fall. It is deterministic (the same samples always give the same grid), so
 * it runs anywhere: the editor decodes a clip and passes its samples in, a
 * Node script passes samples from `decodeAudio`.
 */

export interface BeatGrid {
  /** Beats per minute */
  bpm: number
  /** Timeline time of a beat (ms); the grid runs forward and back from it */
  offset: number
  /** Beats in a bar (default 4): the grid's stronger lines */
  beatsPerBar?: number
}

/** Milliseconds between beats. */
export const beatLength = (grid: BeatGrid): number => 60000 / grid.bpm

/** Timeline time (ms) of beat `n` (0 is the beat at `offset`; it may be negative or fractional). */
export function beatTime(grid: BeatGrid, n: number): number {
  return grid.offset + n * beatLength(grid)
}

/** Which beat `time` is on, counted from `offset` (fractional between beats). */
export function beatAtTime(grid: BeatGrid, time: number): number {
  return (time - grid.offset) / beatLength(grid)
}

/** The beat nearest `time`, ms. */
export function nearestBeat(grid: BeatGrid, time: number): number {
  return beatTime(grid, Math.round(beatAtTime(grid, time)))
}

/** The first beat at or after `time`, ms. */
export function nextBeat(grid: BeatGrid, time: number): number {
  // A hair of tolerance so a time already on a beat stays on it.
  return beatTime(grid, Math.ceil(beatAtTime(grid, time) - 1e-9))
}

/** Every beat from `from` to `to` (ms, inclusive), and whether it starts a bar. */
export function beatsBetween(grid: BeatGrid, from: number, to: number): Array<{ time: number; bar: boolean; n: number }> {
  const perBar = Math.max(1, Math.round(grid.beatsPerBar ?? 4))
  const out: Array<{ time: number; bar: boolean; n: number }> = []
  if (!(grid.bpm > 0) || to < from) return out
  for (let n = Math.ceil(beatAtTime(grid, from) - 1e-9); ; n++) {
    const time = beatTime(grid, n)
    if (time > to + 1e-9) break
    out.push({ time, bar: ((n % perBar) + perBar) % perBar === 0, n })
  }
  return out
}

export interface TempoOptions {
  /** Slowest and fastest tempos to consider (default 70–180 bpm) */
  minBpm?: number
  maxBpm?: number
  /** Analyse at most this many seconds from the start (default 60) */
  maxSeconds?: number
}

export interface DetectedTempo {
  bpm: number
  /** Where the first beat falls, ms from the start of the audio */
  offset: number
  /** How clearly the audio pulses, 0..1: low means the guess is shaky */
  confidence: number
}

/** Onset strength frames per second (a 10 ms hop). */
const FRAME_RATE = 100

/**
 * Find the tempo of audio, and where its beats fall.
 *
 * 1. Onset strength: the audio's loudness in 10 ms frames, log-compressed;
 *    where it rises (a drum hit, a strum) is a likely beat.
 * 2. Tempo: the onset strength compared with itself shifted by each beat
 *    length in range (autocorrelation). The best match is the beat; a gentle
 *    preference for tempos near 120 settles half- and double-time doubts.
 * 3. Tempo and phase: of the grids close to that tempo, and every position
 *    each could take, the one whose beats land on the most onset strength
 *    across the whole clip.
 *
 * `samples` are mono; mix channels down first.
 */
export function detectTempo(samples: Float32Array, sampleRate: number, options: TempoOptions = {}): DetectedTempo {
  const minBpm = options.minBpm ?? 70
  const maxBpm = options.maxBpm ?? 180
  const hop = Math.max(1, Math.round(sampleRate / FRAME_RATE))
  const length = Math.min(samples.length, Math.round((options.maxSeconds ?? 60) * sampleRate))
  const frames = Math.floor(length / hop)
  if (frames < 4) return { bpm: 120, offset: 0, confidence: 0 }

  // 1. Log energy per frame, then its rises.
  const energy = new Float64Array(frames)
  for (let f = 0; f < frames; f++) {
    let sum = 0
    for (let i = f * hop; i < (f + 1) * hop; i++) sum += samples[i] * samples[i]
    energy[f] = Math.log(1e-6 + sum / hop)
  }
  const onset = new Float64Array(frames)
  for (let f = 1; f < frames; f++) onset[f] = Math.max(0, energy[f] - energy[f - 1])
  // Remove the slowly changing level, so only the rises count.
  const mean = onset.reduce((a, b) => a + b, 0) / frames
  for (let f = 0; f < frames; f++) onset[f] = Math.max(0, onset[f] - mean)

  // 2. Autocorrelation over beat lengths in range, weighted toward ~120 bpm.
  const minLag = Math.max(1, Math.floor((60 * FRAME_RATE) / maxBpm))
  const maxLag = Math.min(frames - 1, Math.ceil((60 * FRAME_RATE) / minBpm))
  const correlate = (lag: number) => {
    let sum = 0
    for (let f = lag; f < frames; f++) sum += onset[f] * onset[f - lag]
    return sum / (frames - lag)
  }
  let zero = 0
  for (let f = 0; f < frames; f++) zero += onset[f] * onset[f]
  zero /= frames
  const scores: number[] = []
  let best = minLag
  let bestScore = -Infinity
  for (let lag = minLag; lag <= maxLag; lag++) {
    const bpm = (60 * FRAME_RATE) / lag
    const prior = Math.exp(-0.5 * (Math.log2(bpm / 120) / 0.9) ** 2)
    const score = correlate(lag) * prior
    scores[lag] = score
    if (score > bestScore) {
      bestScore = score
      best = lag
    }
  }
  // 3. Tempo and phase together: of the grids near that beat length (to a
  // hundredth of a frame) and every position they could take, the one whose
  // beats land on the most onset strength. Fitting both over the whole clip
  // keeps a small tempo error from drifting the later beats off.
  const sampleAt = (t: number) => {
    const i = Math.floor(t)
    if (i < 0 || i + 1 >= frames) return 0
    return onset[i] + (onset[i + 1] - onset[i]) * (t - i)
  }
  const comb = (period: number, phase: number) => {
    let sum = 0
    for (let t = phase; t < frames; t += period) sum += sampleAt(t)
    return sum
  }
  let lag = best
  let bestPhase = 0
  let bestSum = -Infinity
  for (let period = best - 0.6; period <= best + 0.6 + 1e-9; period += 0.02) {
    if (period < 1) continue
    const steps = Math.max(1, Math.round(period * 4))
    for (let s = 0; s < steps; s++) {
      const phase = (s / steps) * period
      const sum = comb(period, phase)
      if (sum > bestSum) {
        bestSum = sum
        bestPhase = phase
        lag = period
      }
    }
  }
  const bpm = (60 * FRAME_RATE) / lag

  const confidence = zero > 0 ? Math.max(0, Math.min(1, correlate(best) / zero)) : 0
  // An onset is counted in the frame its hit starts in; the hit is, on average, half a frame in.
  const offset = ((bestPhase + 0.5) * 1000) / FRAME_RATE
  return { bpm: Math.round(bpm * 100) / 100, offset: Math.round(offset % ((60000 / bpm))), confidence }
}
