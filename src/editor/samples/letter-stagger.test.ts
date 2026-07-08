import { describe, it, expect } from 'vitest'
import { Timeline, createTrack } from '../../engine'
import type { Track } from '../../engine'
import { getSampleById } from './sample-definitions'

/**
 * End-to-end check of the per-letter stagger showcase: build a real engine
 * Timeline from the sample data exactly as the editor does when loading a
 * sample, then sample it over time and confirm the letters animate
 * independently and in sequence — the behaviour the preview renders.
 */
function buildTimeline(sampleId: string): Timeline {
  const sample = getSampleById(sampleId)!
  const timeline = new Timeline({
    id: sample.id,
    name: sample.name,
    config: { duration: sample.duration },
  })
  sample.tracks.forEach((track, index) => {
    timeline.addTrack(
      createTrack({ id: `${sample.id}-track-${index}`, ...(track as Omit<Track, 'id'>) })
    )
  })
  return timeline
}

const prop = (tl: Timeline, time: number, target: string, property: string) =>
  tl.getStateAtTime(time).values.get(target)?.get(property) as number | undefined

describe('letter-drop-bounce sample (engine integration)', () => {
  it('exists with one element and two tracks per letter', () => {
    const sample = getSampleById('letter-drop-bounce')!
    expect(sample.elements).toHaveLength(5) // WORLD
    expect(sample.tracks).toHaveLength(10) // y + opacity per letter
    expect(sample.category).toBe('text')
  })

  it('starts every letter hidden and above the stage', () => {
    const tl = buildTimeline('letter-drop-bounce')
    for (let i = 1; i <= 5; i++) {
      expect(prop(tl, 0, `Letter ${i}`, 'opacity')).toBe(0)
      expect(prop(tl, 0, `Letter ${i}`, 'y')!).toBeLessThan(-100)
    }
  })

  it('staggers the letters — the first settles while the last is still hidden', () => {
    const tl = buildTimeline('letter-drop-bounce')
    // Letter 1 runs 0..700ms; Letter 5 does not start until 4*70 = 280ms.
    // At 250ms Letter 1 is well into its drop and visible, Letter 5 has not moved.
    expect(prop(tl, 250, 'Letter 1', 'opacity')).toBe(1)
    expect(prop(tl, 250, 'Letter 5', 'opacity')).toBe(0)
    expect(prop(tl, 250, 'Letter 5', 'y')!).toBeLessThan(-100)
  })

  it('settles all letters at rest (y=0, opacity=1) once the run completes', () => {
    const tl = buildTimeline('letter-drop-bounce')
    // Last letter finishes at 4*70 + 700 = 980ms.
    const t = 1000
    for (let i = 1; i <= 5; i++) {
      expect(prop(tl, t, `Letter ${i}`, 'y')).toBe(0)
      expect(prop(tl, t, `Letter ${i}`, 'opacity')).toBe(1)
    }
  })
})
