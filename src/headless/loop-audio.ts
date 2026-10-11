/**
 * Sound cut to a loop, on plain samples: a drone, a riser or a beat trimmed
 * to exactly the loop's length with its end blended into its start, so the
 * audio comes round as seamlessly as the picture. Pure; `cutAudioToLoop`
 * (Node) decodes and writes the files.
 */

export interface LoopSamplesOptions {
  /** The loop's length, samples */
  length: number
  /** How many samples the tail blends into the head over (default 2% of the length) */
  crossfade?: number
  /** Fade the start in and the end out over this many samples (default none): a riser rising from nothing */
  fadeIn?: number
  fadeOut?: number
}

/**
 * Exactly `length` samples that loop: the first `crossfade` samples blend
 * from what followed the loop's end into its own start, so the end runs on
 * into the beginning. Audio shorter than the loop is tiled first.
 */
export function loopSamples(samples: Float32Array, options: LoopSamplesOptions): Float32Array {
  const length = Math.max(1, Math.round(options.length))
  const crossfade = Math.min(length, Math.max(0, Math.round(options.crossfade ?? length * 0.02)))
  if (samples.length === 0) return new Float32Array(length)
  const needed = length + crossfade
  let source = samples
  if (source.length < needed) {
    const tiled = new Float32Array(needed)
    for (let i = 0; i < needed; i++) tiled[i] = samples[i % samples.length]
    source = tiled
  }
  const out = new Float32Array(length)
  for (let i = 0; i < length; i++) out[i] = source[i]
  for (let i = 0; i < crossfade; i++) {
    // Equal-power blend: the tail past the end fades out as the head fades in.
    const t = (i + 1) / (crossfade + 1)
    const head = Math.sin((t * Math.PI) / 2)
    const tail = Math.cos((t * Math.PI) / 2)
    out[i] = source[i] * head + source[length + i] * tail
  }
  const fadeIn = Math.min(length, Math.max(0, Math.round(options.fadeIn ?? 0)))
  for (let i = 0; i < fadeIn; i++) out[i] *= i / fadeIn
  const fadeOut = Math.min(length, Math.max(0, Math.round(options.fadeOut ?? 0)))
  for (let i = 0; i < fadeOut; i++) out[length - 1 - i] *= i / fadeOut
  return out
}
