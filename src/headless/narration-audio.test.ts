import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { planNarration } from '../engine/authoring/narration'
import { assembleNarration, encodeWav } from './narration-audio'
import { voiceNarration, decodeAudio } from './node-audio'

const tone = (seconds: number, sampleRate: number, value = 0.5) => new Float32Array(Math.round(seconds * sampleRate)).fill(value)

describe('assembleNarration', () => {
  it('places each clip at its cue, with silence between', () => {
    const plan = planNarration([{ lines: [{ text: 'a', duration: 100 }, { text: 'b', duration: 100 }] }], {
      lead: 100,
      gap: 100,
      tail: 100,
    })
    const out = assembleNarration(plan, [tone(0.1, 1000, 0.25), tone(0.1, 1000, 0.75)], 1000)
    expect(out.length).toBe(500)
    expect([out[99], out[100], out[199], out[200], out[299], out[300], out[399], out[400]]).toEqual([
      0, 0.25, 0.25, 0, 0, 0.75, 0.75, 0,
    ])
  })

  it('needs one clip per line', () => {
    const plan = planNarration([{ lines: [{ text: 'a', duration: 100 }] }])
    expect(() => assembleNarration(plan, [], 1000)).toThrow(/0 clip/)
  })
})

describe('encodeWav', () => {
  it('writes a 16-bit mono PCM header and clipped samples', () => {
    const wav = encodeWav(new Float32Array([0, 1, -1, 2]), 8000)
    const view = new DataView(wav.buffer)
    expect(new TextDecoder().decode(wav.subarray(0, 4))).toBe('RIFF')
    expect(new TextDecoder().decode(wav.subarray(8, 16))).toBe('WAVEfmt ')
    expect(view.getUint32(24, true)).toBe(8000)
    expect(view.getUint32(40, true)).toBe(8)
    expect([0, 1, 2, 3].map((i) => view.getInt16(44 + i * 2, true))).toEqual([0, 32767, -32767, 32767])
  })
})

const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0

describe('voiceNarration', () => {
  it.skipIf(!hasFfmpeg)('times lines from their clips and writes an aligned WAV', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tinyfly-voice-'))
    writeFileSync(join(dir, 'one.wav'), encodeWav(tone(0.5, 48000), 48000))
    writeFileSync(join(dir, 'two.wav'), encodeWav(tone(1.25, 48000), 48000))

    const { plan, audio } = await voiceNarration(
      [{ lines: [{ text: 'One.', audio: 'one.wav' }, { text: 'Two.', audio: 'two.wav', id: 'second' }] }],
      { output: 'build/narration.wav', baseDir: dir }
    )
    expect(plan.cues.map((cue) => [cue.id, cue.start, cue.end])).toEqual([
      ['s0-l0', 350, 850],
      ['second', 1150, 2400],
    ])
    expect(plan.duration).toBe(2950)
    expect(audio).toBe(join(dir, 'build/narration.wav'))

    const samples = await decodeAudio(audio)
    expect(samples.length).toBe(Math.round(2.95 * 48000))
    expect(Math.abs(samples[Math.round(0.34 * 48000)])).toBeLessThan(0.01) // lead is silent
    expect(samples[Math.round(0.6 * 48000)]).toBeCloseTo(0.5, 2) // first line
    expect(Math.abs(samples[Math.round(1.0 * 48000)])).toBeLessThan(0.01) // gap
    expect(readFileSync(audio).subarray(0, 4).toString()).toBe('RIFF')
  })

  it.skipIf(!hasFfmpeg)('reports a clip ffmpeg cannot read', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tinyfly-voice-'))
    await expect(
      voiceNarration([{ lines: [{ text: 'x', audio: 'missing.wav' }] }], { output: 'n.wav', baseDir: dir })
    ).rejects.toThrow(/ffmpeg exited/)
  })
})
