import { describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { soundClick, soundPad, soundPop, soundShimmer, soundThud, soundTick, soundWhoosh } from './sound-effects'
import { mixAudio } from './audio-mix'
import { renderMix } from './node-audio'

const RATE = 24000
const peak = (s: Float32Array) => s.reduce((m, v) => Math.max(m, Math.abs(v)), 0)

describe('sound effects', () => {
  const sounds: Record<string, Float32Array> = {
    whoosh: soundWhoosh(RATE),
    pop: soundPop(RATE),
    thud: soundThud(RATE),
    shimmer: soundShimmer(RATE),
    tick: soundTick(RATE),
    click: soundClick(RATE),
    pad: soundPad(RATE, { duration: 3000 }),
  }

  it('makes audible sounds that never clip', () => {
    for (const [name, s] of Object.entries(sounds)) {
      expect(s.length, name).toBeGreaterThan(0)
      expect(peak(s), name).toBeGreaterThan(0.01)
      expect(peak(s), name).toBeLessThanOrEqual(1)
      expect(s.every(Number.isFinite), name).toBe(true)
    }
  })

  it('has the asked length', () => {
    expect(soundWhoosh(RATE, { duration: 500 }).length).toBe(12000)
    expect(soundPad(RATE, { duration: 3000 }).length).toBe(72000)
  })

  it('is deterministic per seed, and different with another seed', () => {
    expect(soundWhoosh(RATE, { seed: 5 })).toEqual(soundWhoosh(RATE, { seed: 5 }))
    expect(soundWhoosh(RATE, { seed: 5 })).not.toEqual(soundWhoosh(RATE, { seed: 6 }))
  })

  it('sweeps a whoosh up or down', () => {
    const energy = (s: Float32Array, from: number, to: number) => {
      let e = 0
      for (let i = Math.floor(from * s.length); i < Math.floor(to * s.length); i++) e += Math.abs(s[i] - (s[i - 1] ?? 0))
      return e
    }
    const up = soundWhoosh(RATE, { rise: true })
    const down = soundWhoosh(RATE, { rise: false })
    // high-frequency content (sample-to-sample change) late vs early
    expect(energy(up, 0.55, 0.75)).toBeGreaterThan(energy(up, 0.25, 0.45))
    expect(energy(down, 0.25, 0.45)).toBeGreaterThan(energy(down, 0.55, 0.75))
  })

  it('drops into mixAudio layers at times', () => {
    const mix = mixAudio([{ samples: soundPop(RATE), at: [100, 600] }], { sampleRate: RATE, duration: 1000 })
    expect(peak(mix.subarray(Math.round(RATE * 0.1), Math.round(RATE * 0.2)))).toBeGreaterThan(0.1)
    expect(peak(mix.subarray(Math.round(RATE * 0.3), Math.round(RATE * 0.55)))).toBe(0)
  })

  it('renderMix takes generated samples as layers, without ffmpeg', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tinyfly-sfx-'))
    try {
      const out = await renderMix([{ samples: soundThud(RATE), at: [0] }], { output: 'mix.wav', baseDir: dir, sampleRate: RATE, duration: 500, ffmpeg: '/nonexistent-ffmpeg' })
      const wav = await readFile(out)
      expect(wav.subarray(0, 4).toString()).toBe('RIFF')
      expect(wav.length).toBeGreaterThan(44)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
