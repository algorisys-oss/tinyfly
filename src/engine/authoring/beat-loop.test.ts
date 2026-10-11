import { describe, it, expect } from 'vitest'
import { audioEnvelope, beatPeriod, beatPulse, envelopeAt, loopBeats } from './beat-loop'

describe('beats for loops', () => {
  it('fits a tempo to a period in whole beats', () => {
    const { beats, grid } = loopBeats(4000, { bpm: 118, offset: 0 })
    expect(beats).toBe(8)
    expect(grid.bpm).toBeCloseTo(120, 9)
    expect(beatPeriod(grid, beats)).toBeCloseTo(4000, 9)
    expect(loopBeats(1000, { bpm: 30, offset: 100 })).toEqual({ beats: 1, grid: { bpm: 60, offset: 100 } })
  })

  it('pulses on every beat and repeats over a loop of whole beats', () => {
    const grid = { bpm: 120, offset: 0 }
    expect(beatPulse(0, grid)).toBe(0)
    expect(beatPulse(25, grid)).toBe(1) // 5% into a 500 ms beat
    expect(beatPulse(125, grid)).toBeCloseTo(0.5, 9)
    expect(beatPulse(400, grid)).toBe(0)
    expect(beatPulse(4000 + 125, grid)).toBeCloseTo(beatPulse(125, grid), 9)
    const accented = (t: number) => beatPulse(t, { ...grid, beatsPerBar: 4 }, { barAccent: 1 })
    expect(accented(25)).toBe(1)
    expect(accented(525)).toBeCloseTo(0.5, 9)
  })

  it('reads an envelope per frame from samples, rising at once and letting go slowly', () => {
    const rate = 1000
    const samples = new Float32Array(1000)
    for (let i = 198; i < 231; i++) samples[i] = 0.8 // a hit filling frame 6 (at 30 fps, frames are 33 samples)
    const levels = audioEnvelope(samples, rate, { fps: 30, smoothing: 0.5 })
    expect(levels.length).toBe(31)
    expect(levels[6]).toBe(1)
    expect(levels[7]).toBeCloseTo(0.5, 6)
    expect(levels[8]).toBeCloseTo(0.25, 6)
    expect(levels[0]).toBe(0)
    expect(envelopeAt(levels, 6 * 1000 / 30, 30)).toBe(1)
    expect(envelopeAt(levels, 6.5 * 1000 / 30, 30)).toBeCloseTo(0.75, 6)
    // Wrapped into a period for a loop.
    expect(envelopeAt(levels, 1000 + 200, 30, 1000)).toBeCloseTo(envelopeAt(levels, 200, 30, 1000), 9)
    expect(envelopeAt(new Float32Array(0), 5)).toBe(0)
    expect(audioEnvelope(samples, rate, { normalize: false })[6]).toBeCloseTo(0.8, 2)
  })
})
