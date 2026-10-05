import { describe, it, expect } from 'vitest'
import { beatAtTime, beatLength, beatTime, beatsBetween, detectTempo, nearestBeat, nextBeat, type BeatGrid } from './beats'
import { createRandom } from './random'

const RATE = 22050

/**
 * A test track: decaying clicks on every beat (louder on `accent` beats), and
 * optional quieter clicks half way between, over a little seeded noise.
 */
function clickTrack(bpm: number, offsetMs: number, seconds: number, options: { offbeats?: boolean; accent?: number; noise?: number } = {}) {
  const samples = new Float32Array(RATE * seconds)
  const random = createRandom(7)
  for (let i = 0; i < samples.length; i++) samples[i] = (random.next() * 2 - 1) * (options.noise ?? 0.01)
  const click = (at: number, loudness: number) => {
    const start = Math.round((at / 1000) * RATE)
    for (let i = 0; i < RATE * 0.04 && start + i < samples.length; i++) {
      if (start + i < 0) continue
      samples[start + i] += loudness * Math.sin(i * 0.3) * Math.exp(-i / (RATE * 0.008))
    }
  }
  const step = 60000 / bpm
  for (let n = 0, t = offsetMs; t < seconds * 1000; n++, t += step) {
    click(t, options.accent && n % 4 === 0 ? options.accent : 0.8)
    if (options.offbeats) click(t + step / 2, 0.3)
  }
  return samples
}

describe('beat grid', () => {
  const grid: BeatGrid = { bpm: 120, offset: 250 }

  it('places beats every 60000 / bpm ms from the offset', () => {
    expect(beatLength(grid)).toBe(500)
    expect(beatTime(grid, 0)).toBe(250)
    expect(beatTime(grid, 4)).toBe(2250)
    expect(beatTime(grid, -1)).toBe(-250)
    expect(beatAtTime(grid, 1000)).toBe(1.5)
  })

  it('finds the nearest and the next beat', () => {
    expect(nearestBeat(grid, 900)).toBe(750)
    expect(nearestBeat(grid, 1100)).toBe(1250)
    expect(nextBeat(grid, 760)).toBe(1250)
    expect(nextBeat(grid, 750)).toBe(750)
  })

  it('lists the beats in a range, marking the bars', () => {
    const beats = beatsBetween(grid, 0, 2300)
    expect(beats.map((b) => b.time)).toEqual([250, 750, 1250, 1750, 2250])
    expect(beats.map((b) => b.bar)).toEqual([true, false, false, false, true])
    expect(beatsBetween({ ...grid, beatsPerBar: 3 }, 0, 1800).filter((b) => b.bar).map((b) => b.time)).toEqual([250, 1750])
    expect(beatsBetween({ bpm: 0, offset: 0 }, 0, 1000)).toEqual([])
  })
})

describe('detectTempo', () => {
  for (const [bpm, offset] of [
    [92, 180],
    [120, 0],
    [128, 340],
    [150, 90],
  ] as const) {
    it(`finds ${bpm} bpm and where the beats fall`, () => {
      const found = detectTempo(clickTrack(bpm, offset, 16), RATE)
      expect(found.bpm).toBeGreaterThan(bpm * 0.985)
      expect(found.bpm).toBeLessThan(bpm * 1.015)
      // The detected first beat sits on one of the real beats (within 20 ms).
      const step = 60000 / bpm
      const off = (((found.offset - offset) % step) + step) % step
      expect(Math.min(off, step - off)).toBeLessThan(20)
      expect(found.confidence).toBeGreaterThan(0.2)
    })
  }

  it('is not fooled into double time by quieter off-beats', () => {
    const found = detectTempo(clickTrack(100, 120, 16, { offbeats: true, accent: 1 }), RATE)
    expect(found.bpm).toBeGreaterThan(98)
    expect(found.bpm).toBeLessThan(102)
  })

  it('is deterministic, and shaky on noise alone', () => {
    const track = clickTrack(110, 50, 10)
    expect(detectTempo(track, RATE)).toEqual(detectTempo(track, RATE))
    const noise = new Float32Array(RATE * 8)
    const random = createRandom(3)
    for (let i = 0; i < noise.length; i++) noise[i] = random.next() * 2 - 1
    expect(detectTempo(noise, RATE).confidence).toBeLessThan(detectTempo(track, RATE).confidence)
  })

  it('handles audio too short to analyse', () => {
    expect(detectTempo(new Float32Array(10), RATE)).toEqual({ bpm: 120, offset: 0, confidence: 0 })
  })
})
