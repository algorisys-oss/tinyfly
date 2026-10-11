import { describe, it, expect } from 'vitest'
import { mixAudio } from './audio-mix'

const tone = (length: number, value = 0.5) => new Float32Array(length).fill(value)

describe('mixAudio', () => {
  it('lays layers at their starts with gain and fades, loops a bed, and places effects at times', () => {
    const rate = 1000
    const out = mixAudio([
      { id: 'bed', samples: tone(100, 0.2), loop: true },
      { id: 'voice', samples: tone(200, 0.4), start: 300, fadeIn: 100 },
      { id: 'tap', samples: tone(10, 0.3), at: [50, 700], gain: 0.5 },
    ], { sampleRate: rate, duration: 1000 })
    expect(out.length).toBe(1000)
    expect(out[10]).toBeCloseTo(0.2, 6)        // the bed, looped past its 100 samples
    expect(out[250]).toBeCloseTo(0.2, 6)
    expect(out[300]).toBeCloseTo(0.2, 6)       // the voice fades in from nothing
    expect(out[350]).toBeCloseTo(0.2 + 0.4 * 0.5, 6)
    expect(out[450]).toBeCloseTo(0.6, 6)
    expect(out[55]).toBeCloseTo(0.2 + 0.15, 6) // a tap at 50 ms, half gain
    expect(out[705]).toBeCloseTo(0.35, 6)
    expect(out[999]).toBeCloseTo(0.2, 6)
  })

  it('ducks the music under the voice, with a release after it, and soft-limits peaks', () => {
    const rate = 1000
    const out = mixAudio([
      { id: 'voice', samples: tone(300, 0.5), start: 300 },
      { id: 'bed', samples: tone(1000, 0.4), duck: { under: 'voice', amount: 0.75, attack: 20, release: 200 } },
    ], { sampleRate: rate, duration: 1000 })
    expect(out[100]).toBeCloseTo(0.4, 6)
    // Under the voice the bed is a quarter of itself.
    expect(out[500] - 0.5).toBeLessThan(0.15)
    expect(out[500] - 0.5).toBeGreaterThan(0.05)
    // Just after the voice the bed is still down, and back up well after.
    expect(out[620]).toBeLessThan(0.3)
    expect(out[990]).toBeGreaterThan(0.35)
    const loud = mixAudio([{ samples: tone(10, 0.9) }, { samples: tone(10, 0.9) }], { sampleRate: rate, duration: 10 })
    expect(loud[5]).toBeLessThan(1)
    expect(loud[5]).toBeGreaterThan(0.9)
    expect(() => mixAudio([{ samples: tone(1), duck: { under: 'nobody' } }], { sampleRate: rate, duration: 1 })).toThrow(/no layer "nobody"/)
  })
})
