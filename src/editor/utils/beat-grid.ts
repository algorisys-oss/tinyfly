import { detectTempo, type BeatGrid, type DetectedTempo } from '../../engine'
import type { AudioElement, SceneElement } from '../stores/scene-store'

/**
 * The editor's beat grid: the tempo of the scene's music, laid over the
 * timeline. It comes from the first audio element given a tempo (by hand,
 * by tapping, or detected from the audio).
 */

/** The audio element that sets the beat, if any. */
export function beatAudio(elements: readonly SceneElement[]): AudioElement | undefined {
  return elements.find((el): el is AudioElement => el.type === 'audio' && (el as AudioElement).bpm !== undefined && (el as AudioElement).bpm! > 0)
}

/** The scene's beat grid in timeline time: the audio's beats, shifted to where the audio starts. */
export function beatGridOf(elements: readonly SceneElement[]): BeatGrid | null {
  const audio = beatAudio(elements)
  if (!audio) return null
  return { bpm: audio.bpm!, offset: audio.startTime + (audio.beatOffset ?? 0), beatsPerBar: audio.beatsPerBar ?? 4 }
}

/**
 * Tempo from tapped times (ms, oldest first): the median gap between the
 * taps, so one late tap does not throw it. Needs at least three taps; taps
 * more than two seconds apart start a new count.
 */
export function tapTempo(taps: readonly number[]): number | null {
  let start = taps.length - 1
  while (start > 0 && taps[start] - taps[start - 1] <= 2000) start--
  const recent = taps.slice(start)
  if (recent.length < 3) return null
  const gaps = recent.slice(1).map((t, i) => t - recent[i]).sort((a, b) => a - b)
  const median = gaps[Math.floor(gaps.length / 2)]
  return Math.round((60000 / median) * 10) / 10
}

/**
 * Decode an audio source (a data URL or a URL) in the browser and detect its
 * tempo. Channels are mixed to mono first.
 */
export async function detectAudioTempo(src: string): Promise<DetectedTempo> {
  const bytes = await (await fetch(src)).arrayBuffer()
  const Offline =
    globalThis.OfflineAudioContext ?? (globalThis as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext
  if (!Offline) throw new Error('This browser cannot decode audio')
  const buffer = await new Offline(1, 1, 44100).decodeAudioData(bytes)
  const mono = new Float32Array(buffer.length)
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const channel = buffer.getChannelData(c)
    for (let i = 0; i < mono.length; i++) mono[i] += channel[i] / buffer.numberOfChannels
  }
  return detectTempo(mono, buffer.sampleRate)
}
