import { describe, it, expect } from 'vitest'
import { buildTypewriter, type TypewriterLetter } from './build-typewriter'

const letters: TypewriterLetter[] = [
  { target: 'L0', x: 0, width: 20 },
  { target: 'L1', x: 20, width: 20 },
  { target: 'L2', x: 40, width: 20 },
]

const opacityOf = (tracks: ReturnType<typeof buildTypewriter>['tracks'], target: string) =>
  tracks.find((t) => t.target === target && t.property === 'opacity')!

describe('buildTypewriter', () => {
  it('emits one opacity reveal track per letter', () => {
    const { tracks } = buildTypewriter(letters, { charDelay: 100 })
    const opacityTracks = tracks.filter((t) => t.property === 'opacity')
    expect(opacityTracks).toHaveLength(3)
  })

  it('keeps each letter hidden until its reveal time, then snaps it on', () => {
    const { tracks } = buildTypewriter(letters, { charDelay: 100 })
    const l2 = opacityOf(tracks, 'L2')
    // Letter index 2 reveals at 200ms.
    expect(l2.keyframes).toEqual([
      { time: 0, value: 0 },
      { time: 200, value: 0 },
      { time: 201, value: 1 },
    ])
  })

  it('reveals the first letter immediately when startTime is 0', () => {
    const { tracks } = buildTypewriter(letters, { charDelay: 100, startTime: 0 })
    expect(opacityOf(tracks, 'L0').keyframes).toEqual([{ time: 0, value: 1 }])
  })

  it('honours startTime for the whole run', () => {
    const { tracks } = buildTypewriter(letters, { charDelay: 100, startTime: 500 })
    expect(opacityOf(tracks, 'L0').keyframes[1].time).toBe(500)
    expect(opacityOf(tracks, 'L1').keyframes[1].time).toBe(600)
  })

  it('adds no cursor tracks by default', () => {
    const { tracks } = buildTypewriter(letters, { charDelay: 100 })
    expect(tracks.some((t) => t.target === 'cursor')).toBe(false)
  })

  it('steps the cursor to each revealed letter’s right edge', () => {
    const { tracks } = buildTypewriter(letters, {
      charDelay: 100,
      cursor: { target: 'cursor', baseX: 0, blink: false },
    })
    const xTrack = tracks.find((t) => t.target === 'cursor' && t.property === 'x')!
    // Right edges relative to baseX 0: 20, 40, 60.
    const jumps = xTrack.keyframes.filter((k) => [20, 40, 60].includes(k.value as number))
    expect(jumps.map((k) => k.value)).toEqual(expect.arrayContaining([20, 40, 60]))
    // Cursor holds then jumps in ~1ms (a hold keyframe exists just before the next char).
    expect(xTrack.keyframes.some((k) => k.time === 99)).toBe(true)
  })

  it('adds a blinking cursor opacity track that toggles over time', () => {
    const { tracks } = buildTypewriter(letters, {
      charDelay: 100,
      cursor: { target: 'cursor', baseX: 0, blink: true, blinkPeriod: 200, holdAfterMs: 400 },
    })
    const blink = tracks.find((t) => t.target === 'cursor' && t.property === 'opacity')!
    expect(blink.keyframes[0]).toEqual({ time: 0, value: 1 })
    expect(blink.keyframes[1]).toEqual({ time: 200, value: 0 })
    // Alternates 1/0.
    const values = blink.keyframes.map((k) => k.value)
    expect(new Set(values)).toEqual(new Set([0, 1]))
  })

  it('reports a duration that covers typing plus the cursor hold', () => {
    const { duration } = buildTypewriter(letters, {
      charDelay: 100,
      cursor: { target: 'cursor', baseX: 0, holdAfterMs: 1000 },
    })
    // typingEnd = 3*100 = 300; + hold 1000; + 200 tail.
    expect(duration).toBe(1500)
  })

  it('handles an empty letter list without cursor tracks', () => {
    const { tracks } = buildTypewriter([], {
      charDelay: 100,
      cursor: { target: 'cursor', baseX: 0 },
    })
    expect(tracks).toHaveLength(0)
  })
})
