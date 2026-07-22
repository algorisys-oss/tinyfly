import { describe, it, expect } from 'vitest'
import { onionGhostTimes } from './onion'

describe('onionGhostTimes', () => {
  it('samples symmetric ghosts around the playhead', () => {
    const g = onionGhostTimes(1000, 5000, { frames: 2, step: 100, maxAlpha: 0.4 })
    expect(g.map((x) => x.time).sort((a, b) => a - b)).toEqual([800, 900, 1100, 1200])
  })

  it('fades nearer ghosts brighter than further ones', () => {
    const g = onionGhostTimes(1000, 5000, { frames: 3, step: 100, maxAlpha: 0.3 })
    const near = g.find((x) => x.time === 900)!
    const far = g.find((x) => x.time === 700)!
    expect(near.alpha).toBeGreaterThan(far.alpha)
  })

  it('drops ghosts outside [0, duration]', () => {
    // At t=50 with step 100, the -1 ghosts (-50) fall off the front.
    const g = onionGhostTimes(50, 300, { frames: 2, step: 100 })
    expect(g.every((x) => x.time >= 0 && x.time <= 300)).toBe(true)
    expect(g.some((x) => x.time < 0)).toBe(false)
    // Past the end (250 with duration 300) the +2 ghost is dropped too.
    const end = onionGhostTimes(250, 300, { frames: 2, step: 100 })
    expect(end.some((x) => x.time > 300)).toBe(false)
  })

  it('returns nothing for zero frames or step', () => {
    expect(onionGhostTimes(1000, 5000, { frames: 0 })).toEqual([])
    expect(onionGhostTimes(1000, 5000, { step: 0 })).toEqual([])
  })
})
