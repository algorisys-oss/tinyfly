/**
 * A sound mix on plain samples: a music bed, narration, sound effects at
 * times, each with a gain and fades, the music ducked under the voice, all
 * summed into one track for the video. Pure (no Node, no DOM); `renderMix`
 * decodes files into it and writes the WAV.
 */

export interface MixLayer {
  /** A name other layers' `duck` can point at */
  id?: string
  /** Mono samples at the mix's sample rate */
  samples: Float32Array
  /** When it starts, ms (default 0); with `at`, where each copy goes instead */
  start?: number
  /** A sound effect: a copy at each of these times, ms */
  at?: number[]
  /** Volume, 1 as recorded (default 1) */
  gain?: number
  /** Fades, ms (default none) */
  fadeIn?: number
  fadeOut?: number
  /** Repeat the samples to the end of the mix (a bed shorter than the film) */
  loop?: boolean
  /** Make way for another layer: while `under` sounds, drop to `1 − amount` (default 0.7 of the way down) */
  duck?: { under: string; amount?: number; attack?: number; release?: number; threshold?: number }
}

export interface MixOptions {
  sampleRate: number
  /** The mix's length, ms */
  duration: number
  /** Volume of the whole mix (default 1); the result is soft-limited so peaks do not clip */
  master?: number
}

/** The layer's samples laid out over the mix's length: at its start (or at each of its times), looped, with gain and fades. */
function layOut(layer: MixLayer, sampleRate: number, length: number): Float32Array {
  const out = new Float32Array(length)
  const gain = layer.gain ?? 1
  const source = layer.samples
  if (source.length === 0) return out
  const starts = layer.at ? layer.at : [layer.start ?? 0]
  const fadeIn = Math.round(((layer.fadeIn ?? 0) * sampleRate) / 1000)
  const fadeOut = Math.round(((layer.fadeOut ?? 0) * sampleRate) / 1000)
  for (const startMs of starts) {
    const start = Math.round((startMs * sampleRate) / 1000)
    const span = layer.loop && !layer.at ? length - start : Math.min(source.length, length - start)
    for (let i = 0; i < span; i++) {
      const index = start + i
      if (index < 0 || index >= length) continue
      let v = source[layer.loop && !layer.at ? i % source.length : i] * gain
      if (fadeIn > 0 && i < fadeIn) v *= i / fadeIn
      if (fadeOut > 0 && span - 1 - i < fadeOut) v *= (span - 1 - i) / fadeOut
      out[index] += v
    }
  }
  return out
}

/** How loud a track is over time: its level (RMS) per 10 ms frame. */
function loudness(samples: Float32Array, sampleRate: number): Float32Array {
  const hop = Math.max(1, Math.round(sampleRate / 100))
  const frames = Math.ceil(samples.length / hop)
  const out = new Float32Array(frames)
  for (let f = 0; f < frames; f++) {
    let sum = 0
    const start = f * hop
    const end = Math.min(samples.length, start + hop)
    for (let i = start; i < end; i++) sum += samples[i] * samples[i]
    out[f] = end > start ? Math.sqrt(sum / (end - start)) : 0
  }
  return out
}

/** The gain to duck by over time: down while the other sounds (over `attack` ms), back up after it (over `release` ms), per 10 ms frame. */
function duckGain(other: Float32Array, sampleRate: number, amount: number, attack: number, release: number, threshold: number): Float32Array {
  const level = loudness(other, sampleRate)
  const out = new Float32Array(level.length)
  const down = 1 - Math.exp(-10 / Math.max(1, attack))
  const up = 1 - Math.exp(-10 / Math.max(1, release))
  let gain = 1
  for (let f = 0; f < level.length; f++) {
    const target = level[f] > threshold ? 1 - amount : 1
    gain += (target - gain) * (target < gain ? down : up)
    out[f] = gain
  }
  return out
}

/** Sum the layers into one mono track `duration` ms long, ducked where asked, soft-limited. */
export function mixAudio(layers: ReadonlyArray<MixLayer>, options: MixOptions): Float32Array {
  const { sampleRate } = options
  const length = Math.max(0, Math.round((options.duration * sampleRate) / 1000))
  const laid = layers.map((layer) => layOut(layer, sampleRate, length))
  const byId = new Map<string, number>()
  layers.forEach((layer, i) => { if (layer.id) byId.set(layer.id, i) })
  const out = new Float32Array(length)
  const hop = Math.max(1, Math.round(sampleRate / 100))
  layers.forEach((layer, i) => {
    let track = laid[i]
    if (layer.duck) {
      const under = byId.get(layer.duck.under)
      if (under === undefined) throw new Error(`mixAudio: no layer "${layer.duck.under}" to duck under`)
      const amount = Math.min(1, Math.max(0, layer.duck.amount ?? 0.7))
      const gain = duckGain(laid[under], sampleRate, amount, layer.duck.attack ?? 80, layer.duck.release ?? 400, layer.duck.threshold ?? 0.01)
      track = new Float32Array(length)
      for (let s = 0; s < length; s++) track[s] = laid[i][s] * gain[Math.min(gain.length - 1, Math.floor(s / hop))]
    }
    for (let s = 0; s < length; s++) out[s] += track[s]
  })
  const master = options.master ?? 1
  for (let s = 0; s < length; s++) {
    const v = out[s] * master
    // A soft knee above 0.8 keeps peaks under 1 without the crunch of a hard clip.
    out[s] = Math.abs(v) <= 0.8 ? v : Math.sign(v) * (0.8 + 0.2 * Math.tanh((Math.abs(v) - 0.8) / 0.2))
  }
  return out
}
