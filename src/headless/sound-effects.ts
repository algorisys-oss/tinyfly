/**
 * Sound effects made from numbers: no sample files to find or license. Each
 * generator returns mono Float32Array samples at the given rate, ready for a
 * `mixAudio` or `renderMix` layer (`{ samples: soundPop(48000), at: [1200] }`).
 * Noise comes from a seeded generator, so the same call gives the same sound.
 * Pure: no Node, no DOM.
 */
import { createRandom } from '../engine/authoring/random'

const length = (sampleRate: number, ms: number) => Math.max(1, Math.round((sampleRate * ms) / 1000))

/** A one-pole low-pass with a per-sample cutoff 0..1. */
function lowPass(input: Float32Array, cutoff: (i: number) => number): Float32Array {
  const out = new Float32Array(input.length)
  let acc = 0
  for (let i = 0; i < input.length; i++) {
    acc += cutoff(i) * (input[i] - acc)
    out[i] = acc
  }
  return out
}

function normalise(samples: Float32Array, peak: number): Float32Array {
  let max = 0
  for (const v of samples) max = Math.max(max, Math.abs(v))
  if (max > 0) for (let i = 0; i < samples.length; i++) samples[i] *= peak / max
  return samples
}

/** A filtered-noise swell for zooms, cuts and things flying past; `rise` sweeps up (false: down). */
export function soundWhoosh(sampleRate: number, options: { duration?: number; rise?: boolean; seed?: number } = {}): Float32Array {
  const n = length(sampleRate, options.duration ?? 700)
  const random = createRandom(options.seed ?? 1)
  const noise = new Float32Array(n)
  for (let i = 0; i < n; i++) noise[i] = random.next() * 2 - 1
  const rise = options.rise ?? true
  const swept = lowPass(noise, (i) => {
    const u = i / n
    return 0.02 + 0.25 * (rise ? u : 1 - u) ** 1.5
  })
  const rumble = lowPass(swept, () => 0.01)
  for (let i = 0; i < n; i++) swept[i] = (swept[i] - rumble[i]) * Math.sin((Math.PI * i) / n) ** 2
  return normalise(swept, 0.8)
}

/** A short pitched blip for things appearing (chips, labels). */
export function soundPop(sampleRate: number, options: { frequency?: number; duration?: number } = {}): Float32Array {
  const n = length(sampleRate, options.duration ?? 120)
  const f0 = options.frequency ?? 660
  const out = new Float32Array(n)
  let phase = 0
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate
    phase += (2 * Math.PI * f0 * (1 + 0.6 * Math.exp(-t * 40))) / sampleRate
    out[i] = 0.8 * Math.sin(phase) * Math.exp(-t * 28)
  }
  return out
}

/** A low hit for impacts, landings and bonks. */
export function soundThud(sampleRate: number, options: { duration?: number; seed?: number } = {}): Float32Array {
  const n = length(sampleRate, options.duration ?? 350)
  const random = createRandom(options.seed ?? 3)
  const out = new Float32Array(n)
  let phase = 0
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate
    phase += (2 * Math.PI * (55 + 90 * Math.exp(-t * 18))) / sampleRate
    const click = (random.next() * 2 - 1) * Math.exp(-t * 160) * 0.3
    out[i] = Math.sin(phase) * Math.exp(-t * 11) + click
  }
  return normalise(out, 0.9)
}

/** A bright sparkle for reveals: a few bell partials on a pentatonic-ish set of pitches. */
export function soundShimmer(sampleRate: number, options: { duration?: number; seed?: number } = {}): Float32Array {
  const ms = options.duration ?? 900
  const n = length(sampleRate, ms)
  const random = createRandom(options.seed ?? 2)
  const out = new Float32Array(n)
  for (let k = 0; k < 7; k++) {
    const f = 1200 * 2 ** (Math.floor(random.next() * 12) / 12)
    const start = Math.round((k * n) / 10)
    for (let i = start; i < n; i++) {
      const t = (i - start) / sampleRate
      out[i] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 9)
    }
  }
  const release = length(sampleRate, Math.min(200, ms))
  for (let i = 0; i < n; i++) out[i] *= 0.25 * Math.min(1, (n - i) / release)
  return out
}

/** A tiny click for counters ticking up. */
export function soundTick(sampleRate: number): Float32Array {
  const n = length(sampleRate, 30)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate
    out[i] = 0.5 * Math.sin(2 * Math.PI * 2400 * t) * Math.exp(-t * 300)
  }
  return out
}

/** A latch snapping shut (a padlock, a switch): two short metallic transients. */
export function soundClick(sampleRate: number, options: { seed?: number } = {}): Float32Array {
  const n = length(sampleRate, 120)
  const random = createRandom(options.seed ?? 6)
  const out = new Float32Array(n)
  for (const [t0, f] of [[0, 3200], [0.035, 2100]] as const) {
    for (let i = Math.round(t0 * sampleRate); i < n; i++) {
      const t = i / sampleRate - t0
      out[i] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 120)
    }
  }
  for (let i = 0; i < n; i++) out[i] = 0.7 * (out[i] + (random.next() * 2 - 1) * Math.exp(-(i / sampleRate) * 200) * 0.25)
  return out
}

/**
 * A slow ambient drone for under narration (a music bed without music):
 * a soft chord with drifting detune and a breathing level, faded in and out.
 * Mix it low (gain about 0.05 of the voice).
 */
export function soundPad(sampleRate: number, options: { duration: number; seed?: number }): Float32Array {
  const n = length(sampleRate, options.duration)
  const random = createRandom(options.seed ?? 4)
  const out = new Float32Array(n)
  const voices: Array<{ f: number; phase: number }> = []
  for (const f of [110, 164.8, 196, 261.6]) for (const d of [-0.4, 0.4]) voices.push({ f: f + d, phase: random.next() * 2 * Math.PI })
  const fadeIn = length(sampleRate, 2000)
  const fadeOut = length(sampleRate, 2500)
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate
    let v = 0
    for (const voice of voices) v += Math.sin(2 * Math.PI * voice.f * t + voice.phase + 0.3 * Math.sin(2 * Math.PI * 0.07 * t))
    const breath = 0.6 + 0.4 * Math.sin((2 * Math.PI * t) / 9)
    out[i] = (v * breath) / 8 * Math.min(1, i / fadeIn) * Math.min(1, (n - i) / fadeOut)
  }
  return out
}
