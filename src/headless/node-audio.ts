/// <reference types="node" />
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import {
  planNarration,
  type NarrationLine,
  type NarrationOptions,
  type NarrationPlan,
} from '../engine/authoring/narration'
import { assembleNarration, encodeWav } from './narration-audio'
import { loopSamples } from './loop-audio'
import { mixAudio, type MixLayer, type MixOptions } from './audio-mix'
import { ffmpegDecodeArgs, ffmpegExitError, ffmpegStartError } from './ffmpeg-args'

/**
 * Voice-over for a video: time the lines from their recorded clips and write
 * the narration track.
 *
 * Each line names an audio file (any format ffmpeg reads). Its length comes
 * from the decoded samples, so nobody types durations and the picture's timing
 * matches the sound exactly. Needs ffmpeg on the PATH (or `options.ffmpeg`).
 */

/** A spoken line with its recording. */
export interface VoicedLine extends Omit<NarrationLine, 'duration'> {
  /** Audio file of the line, relative to `baseDir` */
  audio: string
}

export interface VoicedScene {
  id?: string
  lines: VoicedLine[]
  /** Extra hold after this scene's last line, in ms */
  tail?: number
}

export interface VoiceNarrationOptions extends NarrationOptions {
  /** WAV file to write, relative to `baseDir` */
  output: string
  /** Directory relative paths resolve against (default: cwd) */
  baseDir?: string
  /** Sample rate of the output (default 48000) */
  sampleRate?: number
  /** ffmpeg executable (default `ffmpeg`) */
  ffmpeg?: string
}

export interface VoicedNarration {
  /** Timing of every line, measured from the clips */
  plan: NarrationPlan
  /** Absolute path of the written WAV; pass it as the scene's `audio` */
  audio: string
}

/**
 * Decode every line's clip, lay the lines out with {@link planNarration} and
 * write the whole narration as one WAV.
 */
export async function voiceNarration(scenes: VoicedScene[], options: VoiceNarrationOptions): Promise<VoicedNarration> {
  const baseDir = options.baseDir ?? process.cwd()
  const sampleRate = options.sampleRate ?? 48000
  const ffmpeg = options.ffmpeg ?? 'ffmpeg'

  const clips: Float32Array[] = []
  const timedScenes = []
  for (const scene of scenes) {
    const lines: NarrationLine[] = []
    for (const { audio, ...line } of scene.lines) {
      const samples = await decodeAudio(resolve(baseDir, audio), { sampleRate, ffmpeg })
      clips.push(samples)
      lines.push({ ...line, duration: (samples.length * 1000) / sampleRate })
    }
    timedScenes.push({ id: scene.id, lines, tail: scene.tail })
  }

  const plan = planNarration(timedScenes, options)
  const output = resolve(baseDir, options.output)
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, encodeWav(assembleNarration(plan, clips, sampleRate), sampleRate))
  return { plan, audio: output }
}

export interface CutAudioToLoopOptions {
  /** WAV file to write, relative to `baseDir` */
  output: string
  /** The loop's length, ms (a looping scene's duration) */
  period: number
  /** The tail blends into the head over this long, ms (default 2% of the period) */
  crossfade?: number
  /** Fade in and out, ms (default none): a riser from nothing */
  fadeIn?: number
  fadeOut?: number
  baseDir?: string
  sampleRate?: number
  ffmpeg?: string
}

/**
 * A drone, a riser or a beat cut to a loop: decode the file, trim it to the
 * period with its end blended into its start (tiling it first if it is
 * shorter), and write the WAV to pass as the scene's `audio`.
 */
export async function cutAudioToLoop(file: string, options: CutAudioToLoopOptions): Promise<string> {
  const baseDir = options.baseDir ?? process.cwd()
  const sampleRate = options.sampleRate ?? 48000
  const samples = await decodeAudio(resolve(baseDir, file), { sampleRate, ffmpeg: options.ffmpeg ?? 'ffmpeg' })
  const ms = (value: number | undefined) => (value === undefined ? undefined : Math.round((value * sampleRate) / 1000))
  const looped = loopSamples(samples, { length: (options.period * sampleRate) / 1000, crossfade: ms(options.crossfade), fadeIn: ms(options.fadeIn), fadeOut: ms(options.fadeOut) })
  const output = resolve(baseDir, options.output)
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, encodeWav(looped, sampleRate))
  return output
}

export interface MixFileLayer extends Omit<MixLayer, 'samples'> {
  /** The audio file, relative to `baseDir` (any format ffmpeg reads) */
  file: string
}

export interface RenderMixOptions extends Omit<MixOptions, 'sampleRate'> {
  /** WAV file to write, relative to `baseDir` */
  output: string
  baseDir?: string
  sampleRate?: number
  ffmpeg?: string
}

/**
 * A film's sound: decode a music bed, the narration and sound effects, mix
 * them (gains, fades, effects at times, the music ducked under the voice)
 * and write the WAV to pass as the scene's `audio`; ffmpeg muxes it with the
 * picture. `mixAudio` is the pure step.
 */
export async function renderMix(layers: MixFileLayer[], options: RenderMixOptions): Promise<string> {
  const baseDir = options.baseDir ?? process.cwd()
  const sampleRate = options.sampleRate ?? 48000
  const decoded: MixLayer[] = []
  for (const { file, ...layer } of layers) {
    decoded.push({ ...layer, samples: await decodeAudio(resolve(baseDir, file), { sampleRate, ffmpeg: options.ffmpeg ?? 'ffmpeg' }) })
  }
  const output = resolve(baseDir, options.output)
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, encodeWav(mixAudio(decoded, { sampleRate, duration: options.duration, master: options.master }), sampleRate))
  return output
}

/** Decode an audio file to mono float samples with ffmpeg. */
export function decodeAudio(
  file: string,
  options: { sampleRate?: number; ffmpeg?: string } = {}
): Promise<Float32Array> {
  const ffmpeg = options.ffmpeg ?? 'ffmpeg'
  const child = spawn(ffmpeg, ffmpegDecodeArgs(file, options.sampleRate ?? 48000), { stdio: ['ignore', 'pipe', 'pipe'] })
  const chunks: Buffer[] = []
  let stderr = ''
  child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk))
  child.stderr.on('data', (chunk: Buffer) => {
    stderr += chunk.toString()
  })
  return new Promise((resolveSamples, reject) => {
    child.on('error', (error: NodeJS.ErrnoException) => reject(ffmpegStartError(ffmpeg, error)))
    child.on('close', (code) => {
      if (code !== 0) return reject(ffmpegExitError(code, stderr))
      const bytes = Buffer.concat(chunks)
      // Copy into a fresh, aligned buffer: Buffer pooling can leave an odd byteOffset.
      const samples = new Float32Array(Math.floor(bytes.length / 4))
      new Uint8Array(samples.buffer).set(bytes.subarray(0, samples.length * 4))
      resolveSamples(samples)
    })
  })
}
