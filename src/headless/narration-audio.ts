import type { NarrationPlan } from '../engine/authoring/narration'

/**
 * Narration audio as plain samples: place each line's clip at its cue time and
 * encode the result as a WAV file.
 *
 * Pure (no Node, no DOM). Clips are mono float samples in [-1, 1] at one
 * sample rate; silence fills the lead, gaps and tails. Placement rounds to the
 * nearest sample, so the audio lines up with the picture to within one sample.
 */

/** Mono samples of the whole narration, `plan.duration` long. */
export function assembleNarration(plan: NarrationPlan, clips: Float32Array[], sampleRate: number): Float32Array {
  if (clips.length !== plan.cues.length) {
    throw new Error(`narration audio: ${clips.length} clip(s) for ${plan.cues.length} line(s)`)
  }
  const total = Math.round((plan.duration * sampleRate) / 1000)
  const out = new Float32Array(total)
  plan.cues.forEach((cue, index) => {
    const start = Math.round((cue.start * sampleRate) / 1000)
    const clip = clips[index]
    out.set(clip.subarray(0, Math.max(0, Math.min(clip.length, total - start))), start)
  })
  return out
}

/** A 16-bit PCM mono WAV file. Samples outside [-1, 1] are clipped. */
export function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const bytesPerSample = 2
  const dataSize = samples.length * bytesPerSample
  const bytes = new Uint8Array(44 + dataSize)
  const view = new DataView(bytes.buffer)
  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
  }
  ascii(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  ascii(8, 'WAVE')
  ascii(12, 'fmt ')
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * bytesPerSample, true) // byte rate
  view.setUint16(32, bytesPerSample, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  ascii(36, 'data')
  view.setUint32(40, dataSize, true)
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * bytesPerSample, Math.round(clamped * 32767), true)
  }
  return bytes
}
