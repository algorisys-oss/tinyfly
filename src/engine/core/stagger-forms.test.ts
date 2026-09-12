import { describe, it, expect } from 'vitest'
import { Timeline, createTrack, serializeTimeline } from '../index'

/**
 * The runtime-stagger evidence gate (Phase 26H).
 *
 * The spec said: do not add a second way to express stagger without a profile
 * showing the baked form is actually too slow. The profile was run, and the
 * answer was not what the spec expected:
 *
 *   count | baked eval | runtime eval | baked JSON | runtime JSON
 *      10 |     5.9 ms |       3.5 ms |      1,176 |          251
 *      50 |    10.7 ms |       7.3 ms |      5,826 |          492
 *     100 |     8.1 ms |       7.0 ms |     11,676 |          792
 *     250 |    23.1 ms |      16.8 ms |     29,526 |        1,842
 *     500 |    41.3 ms |      41.9 ms |     59,626 |        3,593
 *
 *   (600 evaluations each, after warm-up.)
 *
 * **Evaluation speed is not the reason.** The two are within noise of each
 * other, and identical at 500 targets — expanding one track across N targets
 * costs the same as evaluating N tracks, which is what you would expect.
 *
 * **File size is the reason**, and it is not close: ~15x smaller at 100
 * targets and ~17x at 500. A 500-letter split is 59 KB of JSON baked and 3.5 KB
 * as a runtime stagger. That matters for a format whose whole point is being
 * shipped over a network and stored per project.
 *
 * So the feature is justified, but by size rather than speed. The tests below
 * assert the size relationship, which is deterministic; the timings above are
 * recorded as a one-off rather than asserted, because timing assertions in CI
 * are flaky and would tell us nothing we act on.
 */

const COUNT = 100

function bakedTimeline(count: number) {
  const tracks = Array.from({ length: count }, (_, i) =>
    createTrack({
      id: `letter-${i}`,
      target: `l${i}`,
      property: 'opacity',
      keyframes: [
        { time: 0 + i * 30, value: 0 },
        { time: 500 + i * 30, value: 1 },
      ],
    })
  )
  return new Timeline({ id: 'baked', tracks })
}

function runtimeTimeline(count: number) {
  return new Timeline({
    id: 'runtime',
    tracks: [
      createTrack({
        id: 'letters',
        target: 'unused',
        targets: Array.from({ length: count }, (_, i) => `l${i}`),
        stagger: { each: 30 },
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 500, value: 1 },
        ],
      }),
    ],
  })
}

const jsonSize = (timeline: Timeline) => JSON.stringify(serializeTimeline(timeline)).length

describe('runtime vs baked stagger', () => {
  it('produces identical values at every target and time', () => {
    const baked = bakedTimeline(COUNT)
    const runtime = runtimeTimeline(COUNT)

    for (const time of [0, 250, 900, 1800, 3000, 3500]) {
      for (const i of [0, 1, 25, 50, 99]) {
        const target = `l${i}`
        expect(
          runtime.getStateAtTime(time).values.get(target)?.get('opacity'),
          `${target} @ ${time}ms`
        ).toBeCloseTo(baked.getStateAtTime(time).values.get(target)?.get('opacity') as number, 10)
      }
    }
  })

  it('reports the same duration', () => {
    expect(runtimeTimeline(COUNT).duration).toBe(bakedTimeline(COUNT).duration)
  })

  it('serializes an order of magnitude smaller — the reason the feature exists', () => {
    const baked = jsonSize(bakedTimeline(COUNT))
    const runtime = jsonSize(runtimeTimeline(COUNT))
    expect(runtime * 10).toBeLessThan(baked)
  })

  it('the size gap widens with target count', () => {
    const ratioAt = (count: number) => jsonSize(bakedTimeline(count)) / jsonSize(runtimeTimeline(count))
    expect(ratioAt(500)).toBeGreaterThan(ratioAt(50))
  })

  it('the baked form grows linearly with target count', () => {
    // Each extra target is another whole track.
    expect(jsonSize(bakedTimeline(200)) / jsonSize(bakedTimeline(100))).toBeGreaterThan(1.8)
  })

  it('the runtime form grows only by one target name per target', () => {
    // The keyframes are written once no matter how many targets there are.
    const small = jsonSize(runtimeTimeline(100))
    const large = jsonSize(runtimeTimeline(200))
    expect(large - small).toBeLessThan(small)
  })
})
