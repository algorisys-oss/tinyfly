import { describe, it, expect } from 'vitest'
import { Timeline } from './timeline'
import { createTrack } from './track'
import type { SpringTrack } from '../types'

/**
 * Behaviour added in Phase 26: track delay/endDelay, runtime stagger, spring
 * tracks, repeatDelay, and the track query / conflict API.
 */

const fade = (id: string, target = 'box', extra = {}) =>
  createTrack({
    id,
    target,
    property: 'opacity',
    keyframes: [
      { time: 0, value: 0 },
      { time: 1000, value: 1 },
    ],
    ...extra,
  })

describe('track delay', () => {
  it('shifts keyframe times without rewriting them', () => {
    const tl = new Timeline({ id: 't', tracks: [fade('a', 'box', { delay: 500 })] })
    expect(tl.getStateAtTime(500).values.get('box')?.get('opacity')).toBe(0)
    expect(tl.getStateAtTime(1500).values.get('box')?.get('opacity')).toBe(1)
  })

  it('holds the first value through the delay', () => {
    const tl = new Timeline({ id: 't', tracks: [fade('a', 'box', { delay: 500 })] })
    expect(tl.getStateAtTime(0).values.get('box')?.get('opacity')).toBe(0)
  })

  it('extends the timeline duration', () => {
    const tl = new Timeline({ id: 't', tracks: [fade('a', 'box', { delay: 500 })] })
    expect(tl.duration).toBe(1500)
  })
})

describe('track endDelay', () => {
  it('extends the duration while holding the last value', () => {
    const tl = new Timeline({ id: 't', tracks: [fade('a', 'box', { endDelay: 300 })] })
    expect(tl.duration).toBe(1300)
    expect(tl.getStateAtTime(1200).values.get('box')?.get('opacity')).toBe(1)
  })

  it('applies to motion-path tracks too', () => {
    const tl = new Timeline({
      id: 't',
      tracks: [{ id: 'p', target: 'dot', property: 'motionPath', motionPathConfig: { pathData: 'M0 0 L100 0' }, endDelay: 300, keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 1 }] }],
    })
    expect(tl.duration).toBe(1300)
    expect(tl.getStateAtTime(1200).values.get('dot')?.get('motionPathX')).toBe(100)
  })
})

describe('runtime stagger', () => {
  const staggered = createTrack({
    id: 'letters',
    target: 'unused',
    targets: ['l1', 'l2', 'l3'],
    stagger: { each: 100 },
    property: 'opacity',
    keyframes: [
      { time: 0, value: 0 },
      { time: 500, value: 1 },
    ],
  })

  it('drives every target from one track', () => {
    const tl = new Timeline({ id: 't', tracks: [staggered] })
    const state = tl.getStateAtTime(250)
    expect(state.values.get('l1')).toBeDefined()
    expect(state.values.get('l2')).toBeDefined()
    expect(state.values.get('l3')).toBeDefined()
  })

  it('offsets each target in turn', () => {
    const tl = new Timeline({ id: 't', tracks: [staggered] })
    const state = tl.getStateAtTime(250)
    const l1 = state.values.get('l1')!.get('opacity') as number
    const l2 = state.values.get('l2')!.get('opacity') as number
    const l3 = state.values.get('l3')!.get('opacity') as number
    // Later letters are further behind.
    expect(l1).toBeGreaterThan(l2)
    expect(l2).toBeGreaterThan(l3)
  })

  it('ignores the single `target` field when `targets` is present', () => {
    const tl = new Timeline({ id: 't', tracks: [staggered] })
    expect(tl.getStateAtTime(250).values.get('unused')).toBeUndefined()
  })

  it('extends the duration by the widest offset', () => {
    const tl = new Timeline({ id: 't', tracks: [staggered] })
    expect(tl.duration).toBe(700) // 500 + 2 * 100
  })

  it('matches what baking the same stagger into separate tracks would give', () => {
    const runtime = new Timeline({ id: 'runtime', tracks: [staggered] })
    const baked = new Timeline({
      id: 'baked',
      tracks: ['l1', 'l2', 'l3'].map((t, i) =>
        createTrack({
          id: `baked-${t}`,
          target: t,
          property: 'opacity',
          keyframes: [
            { time: 0 + i * 100, value: 0 },
            { time: 500 + i * 100, value: 1 },
          ],
        })
      ),
    })

    for (const time of [0, 120, 300, 480, 650, 700]) {
      for (const target of ['l1', 'l2', 'l3']) {
        expect(runtime.getStateAtTime(time).values.get(target)?.get('opacity')).toBeCloseTo(
          baked.getStateAtTime(time).values.get(target)?.get('opacity') as number,
          10
        )
      }
    }
  })
})

describe('spring tracks', () => {
  const spring: SpringTrack = {
    id: 's1',
    target: 'box',
    property: 'x',
    kind: 'spring',
    spring: { from: 0, to: 100 },
  }

  it('produces values through the timeline', () => {
    const tl = new Timeline({ id: 't', tracks: [spring] })
    expect(tl.getStateAtTime(0).values.get('box')?.get('x')).toBe(0)
    expect(tl.getStateAtTime(50).values.get('box')?.get('x')).toBeGreaterThan(0)
  })

  it('contributes its settle time to the timeline duration', () => {
    const tl = new Timeline({ id: 't', tracks: [spring] })
    expect(tl.duration).toBeGreaterThan(0)
  })

  it('scrubs deterministically in any order', () => {
    const tl = new Timeline({ id: 't', tracks: [spring] })
    const forward = [0, 100, 200, 300].map((t) => tl.getStateAtTime(t).values.get('box')!.get('x'))
    const backward = [300, 200, 100, 0]
      .map((t) => tl.getStateAtTime(t).values.get('box')!.get('x'))
      .reverse()
    expect(backward).toEqual(forward)
  })

  it('serializes through toDefinition', () => {
    const tl = new Timeline({ id: 't', tracks: [spring] })
    const def = tl.toDefinition()
    expect(def.tracks[0]).toMatchObject({ kind: 'spring', spring: { from: 0, to: 100 } })
  })

  it('can be staggered across targets', () => {
    const tl = new Timeline({
      id: 't',
      tracks: [{ ...spring, targets: ['a', 'b'], stagger: { each: 100 } }],
    })
    const state = tl.getStateAtTime(120)
    expect(state.values.get('a')!.get('x')).toBeGreaterThan(state.values.get('b')!.get('x') as number)
  })

  it('is removable like any other track', () => {
    const tl = new Timeline({ id: 't', tracks: [spring] })
    tl.removeTrack('s1')
    expect(tl.tracks).toHaveLength(0)
    expect(tl.getStateAtTime(50).values.get('box')).toBeUndefined()
  })
})

describe('repeatDelay', () => {
  it('holds the finished frame through the pause, then starts over', () => {
    const tl = new Timeline({
      id: 't',
      tracks: [fade('a')],
      config: { loop: -1, repeatDelay: 500 },
    })
    tl.play()

    tl.tick(1000) // reach the end, arm the delay
    expect(tl.currentTime).toBe(1000)
    expect(tl.getStateAtTime(tl.currentTime).values.get('box')?.get('opacity')).toBe(1)

    tl.tick(200) // still waiting, still showing the end
    expect(tl.currentTime).toBe(1000)

    tl.tick(300) // delay consumed exactly: back to the start
    expect(tl.currentTime).toBe(0)

    tl.tick(100) // now advancing again
    expect(tl.currentTime).toBe(100)
  })

  it('emits the finished frame while it waits', () => {
    const tl = new Timeline({ id: 't', tracks: [fade('a')], config: { loop: -1, repeatDelay: 500 } })
    const seen: number[] = []
    tl.onUpdate = (state) => seen.push(state.values.get('box')?.get('opacity') as number)
    tl.play()
    tl.tick(1000)
    tl.tick(200)
    expect(seen).toEqual([1, 1])
  })

  it('carries leftover time past the pause into the next iteration', () => {
    const tl = new Timeline({ id: 't', tracks: [fade('a')], config: { loop: -1, repeatDelay: 500 } })
    tl.play()
    tl.tick(1000)
    tl.tick(650)
    expect(tl.currentTime).toBe(150)
  })

  it('does not hold when unset', () => {
    const tl = new Timeline({ id: 't', tracks: [fade('a')], config: { loop: -1 } })
    tl.play()
    tl.tick(1100)
    expect(tl.currentTime).toBe(100)
  })

  it('is cancelled by an explicit seek', () => {
    const tl = new Timeline({
      id: 't',
      tracks: [fade('a')],
      config: { loop: -1, repeatDelay: 5000 },
    })
    tl.play()
    tl.tick(1000)
    tl.seek(200)
    tl.tick(100)
    expect(tl.currentTime).toBe(300)
  })

  it('still completes a non-looping timeline', () => {
    let done = false
    const tl = new Timeline({ id: 't', tracks: [fade('a')], config: { repeatDelay: 500 } })
    tl.onComplete = () => { done = true }
    tl.play()
    tl.tick(1000)
    expect(done).toBe(true)
  })
})

describe('getTracks / removeTracks', () => {
  const build = () =>
    new Timeline({
      id: 't',
      tracks: [
        fade('a', 'box'),
        createTrack({ id: 'b', target: 'box', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 10 }] }),
        fade('c', 'other'),
      ],
    })

  it('returns everything with an empty filter', () => {
    expect(build().getTracks()).toHaveLength(3)
  })

  it('filters by target', () => {
    expect(build().getTracks({ target: 'box' }).map((t) => t.id)).toEqual(['a', 'b'])
  })

  it('filters by property', () => {
    expect(build().getTracks({ property: 'opacity' }).map((t) => t.id)).toEqual(['a', 'c'])
  })

  it('combines filters with AND', () => {
    expect(build().getTracks({ target: 'box', property: 'opacity' }).map((t) => t.id)).toEqual(['a'])
  })

  it('filters by id', () => {
    expect(build().getTracks({ id: 'c' }).map((t) => t.id)).toEqual(['c'])
  })

  it('filters by overlapping time range', () => {
    const tl = build()
    expect(tl.getTracks({ timeRange: { from: 600, to: 900 } }).map((t) => t.id)).toEqual(['a', 'c'])
  })

  it('matches a multi-target track by any of its targets', () => {
    const tl = new Timeline({
      id: 't',
      tracks: [
        createTrack({
          id: 'multi',
          target: 'ignored',
          targets: ['p', 'q'],
          property: 'opacity',
          keyframes: [{ time: 0, value: 0 }],
        }),
      ],
    })
    expect(tl.getTracks({ target: 'q' })).toHaveLength(1)
  })

  it('removes matching tracks and reports their ids', () => {
    const tl = build()
    expect(tl.removeTracks({ target: 'box' })).toEqual(['a', 'b'])
    expect(tl.tracks.map((t) => t.id)).toEqual(['c'])
  })
})

describe('findConflicts', () => {
  it('reports nothing when tracks drive different properties', () => {
    const tl = new Timeline({
      id: 't',
      tracks: [
        fade('a'),
        createTrack({ id: 'b', target: 'box', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 1 }] }),
      ],
    })
    expect(tl.findConflicts()).toEqual([])
  })

  it('reports nothing when spans do not overlap', () => {
    const tl = new Timeline({
      id: 't',
      tracks: [
        fade('a'),
        createTrack({ id: 'b', target: 'box', property: 'opacity', keyframes: [{ time: 2000, value: 0 }, { time: 3000, value: 1 }] }),
      ],
    })
    expect(tl.findConflicts()).toEqual([])
  })

  it('reports an overlap on the same target and property', () => {
    const tl = new Timeline({ id: 't', tracks: [fade('a'), fade('b')] })
    expect(tl.findConflicts()).toEqual([
      { target: 'box', property: 'opacity', losingTrackId: 'a', winningTrackId: 'b' },
    ])
  })

  it('names the later-added track as the winner, matching evaluation order', () => {
    const tl = new Timeline({
      id: 't',
      tracks: [
        createTrack({ id: 'first', target: 'box', property: 'opacity', keyframes: [{ time: 0, value: 0.2 }, { time: 1000, value: 0.2 }] }),
        createTrack({ id: 'second', target: 'box', property: 'opacity', keyframes: [{ time: 0, value: 0.9 }, { time: 1000, value: 0.9 }] }),
      ],
    })
    const conflict = tl.findConflicts()[0]
    expect(conflict.winningTrackId).toBe('second')
    // And the winner is what actually renders.
    expect(tl.getStateAtTime(500).values.get('box')?.get('opacity')).toBe(0.9)
  })

  it('reports one conflict per shared target', () => {
    const multi = (id: string) =>
      createTrack({
        id,
        target: 'x',
        targets: ['p', 'q'],
        property: 'opacity',
        keyframes: [{ time: 0, value: 0 }, { time: 100, value: 1 }],
      })
    const tl = new Timeline({ id: 't', tracks: [multi('a'), multi('b')] })
    expect(tl.findConflicts().map((c) => c.target)).toEqual(['p', 'q'])
  })
})

describe('getTrackSpan', () => {
  it('covers first keyframe to last, including delay', () => {
    const tl = new Timeline({ id: 't', tracks: [fade('a', 'box', { delay: 200 })] })
    expect(tl.getTrackSpan('a')).toEqual({ from: 200, to: 1200 })
  })

  it('is undefined for an unknown track', () => {
    expect(new Timeline({ id: 't' }).getTrackSpan('nope')).toBeUndefined()
  })
})

/**
 * Several tracks on one target+property. A sequence of tweens has to play as a
 * sequence: a later track holds its starting value but must not apply it before
 * it starts, or it hides everything before it.
 */
describe('resolving several tracks on one property', () => {
  const x = (id: string, from: number, to: number, a: number, b: number, extra = {}) =>
    createTrack({ id, target: 'box', property: 'x', keyframes: [{ time: from, value: a }, { time: to, value: b }], ...extra })
  const xAt = (tl: Timeline, t: number) => tl.getStateAtTime(t).values.get('box')?.get('x')

  it('plays back-to-back tracks in order', () => {
    const tl = new Timeline({ id: 't', tracks: [x('go', 0, 1000, 0, 100), x('back', 1000, 2000, 100, 0)] })
    expect([0, 500, 1000, 1500, 2000].map((t) => xAt(tl, t))).toEqual([0, 50, 100, 50, 0])
  })

  it('holds the earlier track\'s end value in a gap before the next starts', () => {
    const tl = new Timeline({ id: 't', tracks: [x('a', 0, 500, 0, 100), x('b', 900, 1400, 300, 0)] })
    expect(xAt(tl, 700)).toBe(100)
    expect(xAt(tl, 900)).toBe(300)
  })

  it('shows the first track\'s start value before anything has started', () => {
    const tl = new Timeline({ id: 't', tracks: [x('later', 800, 1000, 50, 60), x('first', 200, 400, 10, 20)] })
    expect(xAt(tl, 0)).toBe(10)
  })

  it('gives an overlap to the track that started last, whichever was added first', () => {
    const tl = new Timeline({ id: 't', tracks: [x('late', 500, 1500, 1000, 2000), x('early', 0, 1000, 0, 100)] })
    expect(xAt(tl, 250)).toBe(25)
    expect(xAt(tl, 750)).toBe(1250)
  })

  it('breaks ties on start time in favour of the track added last', () => {
    const tl = new Timeline({ id: 't', tracks: [x('a', 0, 1000, 0, 0), x('b', 0, 1000, 7, 7)] })
    expect(xAt(tl, 500)).toBe(7)
  })

  it('uses each staggered target\'s own start', () => {
    const tl = new Timeline({
      id: 't',
      tracks: [
        createTrack({ id: 'in', target: 'a', targets: ['a', 'b'], property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 100, value: 10 }] }),
        createTrack({ id: 'out', target: 'a', targets: ['a', 'b'], property: 'x', stagger: { each: 500 }, delay: 200, keyframes: [{ time: 0, value: 10 }, { time: 100, value: 0 }] }),
      ],
    })
    const values = tl.getStateAtTime(400).values
    expect(values.get('a')?.get('x')).toBe(0) // its "out" ran 200–300 and finished at 0
    expect(values.get('b')?.get('x')).toBe(10) // its "out" starts at 700: "in" still applies
  })

  it('resolves motion paths by the same rule', () => {
    const tl = new Timeline({
      id: 't',
      tracks: [
        { id: 'p1', target: 'dot', property: 'motionPath', motionPathConfig: { pathData: 'M0 0 L100 0' }, keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 1 }] },
        { id: 'p2', target: 'dot', property: 'motionPath', motionPathConfig: { pathData: 'M0 50 L100 50' }, keyframes: [{ time: 1000, value: 0 }, { time: 2000, value: 1 }] },
      ],
    })
    expect(tl.getStateAtTime(500).values.get('dot')?.get('motionPathY')).toBe(0)
    expect(tl.getStateAtTime(1500).values.get('dot')?.get('motionPathY')).toBe(50)
  })

  it('reports the later-starting track as the conflict winner', () => {
    const tl = new Timeline({ id: 't', tracks: [x('late', 500, 1500, 0, 1), x('early', 0, 1000, 0, 1)] })
    expect(tl.findConflicts()[0]).toMatchObject({ winningTrackId: 'late', losingTrackId: 'early' })
  })

  it('recomputes after tracks are removed', () => {
    const tl = new Timeline({ id: 't', tracks: [x('a', 0, 1000, 0, 100), x('b', 0, 1000, 5, 5)] })
    expect(xAt(tl, 500)).toBe(5)
    tl.removeTrack('b')
    expect(xAt(tl, 500)).toBe(50)
  })
})

describe('replaceTrack', () => {
  const t = (id: string, value: number) =>
    createTrack({ id, target: 'box', property: 'x', keyframes: [{ time: 0, value }, { time: 1000, value }] })

  it('swaps a track in place, keeping the order', () => {
    const tl = new Timeline({ id: 't', tracks: [t('a', 1), t('b', 2), t('c', 3)] })
    tl.replaceTrack('a', t('a2', 9))
    expect(tl.tracks.map((track) => track.id)).toEqual(['a2', 'b', 'c'])
    // Order decides ties: 'c' was added last, so it still wins.
    expect(tl.getStateAtTime(500).values.get('box')?.get('x')).toBe(3)
  })

  it('does nothing for an unknown id', () => {
    const tl = new Timeline({ id: 't', tracks: [t('a', 1)] })
    tl.replaceTrack('nope', t('z', 5))
    expect(tl.tracks.map((track) => track.id)).toEqual(['a'])
  })
})
