import { describe, it, expect, vi } from 'vitest'
import { CompatTimeline, timeline } from './timeline'
import { tf } from './index'
import { hasKeyframes, type Track } from '../../engine'

/**
 * The compat facade is a desugarer: every call must compile to ordinary track
 * data. The tests below assert on the compiled output rather than on playback,
 * because "it produces normal tinyfly JSON" is the whole contract.
 */

/** The compiled tracks, narrowed to keyframed ones for assertions. */
const tracksOf = (tl: CompatTimeline): Track[] =>
  tl.timeline.tracks.filter(hasKeyframes) as Track[]

const trackFor = (tl: CompatTimeline, property: string): Track =>
  tracksOf(tl).find((t) => t.property === property)!

describe('to()', () => {
  it('compiles one track per animated property', () => {
    const tl = timeline()
    tl.to('box', { x: 100, opacity: 0, duration: 1 })
    expect(tracksOf(tl).map((t) => t.property).sort()).toEqual(['opacity', 'x'])
  })

  it('converts seconds to milliseconds', () => {
    const tl = timeline()
    tl.to('box', { x: 100, duration: 1.5 })
    expect(trackFor(tl, 'x').keyframes[1].time).toBe(1500)
  })

  it('defaults to a half-second duration', () => {
    const tl = timeline()
    tl.to('box', { x: 100 })
    expect(trackFor(tl, 'x').keyframes[1].time).toBe(500)
  })

  it('ends on the given value', () => {
    const tl = timeline()
    tl.to('box', { x: 100, duration: 1 })
    expect(trackFor(tl, 'x').keyframes[1].value).toBe(100)
  })

  it('applies delay as a track delay', () => {
    const tl = timeline()
    tl.to('box', { x: 100, duration: 1, delay: 0.25 })
    expect(trackFor(tl, 'x').delay).toBe(250)
  })

  it('maps the ease onto the end keyframe', () => {
    const tl = timeline()
    tl.to('box', { x: 100, duration: 1, ease: 'power2.out' })
    expect(trackFor(tl, 'x').keyframes[1].easing).toBe('ease-out-quad')
  })

  it('does not treat reserved keys as properties', () => {
    const tl = timeline()
    tl.to('box', { x: 1, duration: 1, delay: 0.1, ease: 'none', repeat: 2, yoyo: true })
    expect(tracksOf(tl).map((t) => t.property)).toEqual(['x'])
  })
})

describe('from()', () => {
  it('starts at the given value and ends at the resolved default', () => {
    const tl = timeline()
    tl.from('box', { opacity: 0, duration: 1 })

    const kfs = trackFor(tl, 'opacity').keyframes
    expect(kfs[0].value).toBe(0)
    expect(kfs[1].value).toBe(1) // the static default for opacity
  })

  it('uses a defaults map when one is supplied', () => {
    const tl = timeline({ defaults: { x: 250 } })
    tl.from('box', { x: 0, duration: 1 })
    expect(trackFor(tl, 'x').keyframes[1].value).toBe(250)
  })
})

describe('fromTo()', () => {
  it('uses both explicit endpoints', () => {
    const tl = timeline()
    tl.fromTo('box', { x: -50 }, { x: 200, duration: 1 })

    const kfs = trackFor(tl, 'x').keyframes
    expect(kfs[0].value).toBe(-50)
    expect(kfs[1].value).toBe(200)
  })

  it('never warns — the endpoints are explicit', () => {
    const onWarning = vi.fn()
    const tl = timeline({ onWarning })
    tl.fromTo('box', { x: 0 }, { x: 100, duration: 1 })
    expect(onWarning).not.toHaveBeenCalled()
  })
})

describe('set()', () => {
  it('compiles to a single held keyframe', () => {
    const tl = timeline()
    tl.set('box', { opacity: 0 })

    const kfs = trackFor(tl, 'opacity').keyframes
    expect(kfs).toHaveLength(1)
    expect(kfs[0].value).toBe(0)
  })
})

describe('start-value resolution chain', () => {
  it('prefers the last authored value on the timeline', () => {
    const tl = timeline()
    tl.to('box', { x: 100, duration: 1 })
    tl.to('box', { x: 300, duration: 1 })

    // The second tween starts where the first ended, not at the static default.
    const second = tracksOf(tl).filter((t) => t.property === 'x')[1]
    expect(second.keyframes[0].value).toBe(100)
  })

  it('falls back to a defaults map before the static default', () => {
    const tl = timeline({ defaults: { opacity: 0.25 } })
    tl.to('box', { opacity: 1, duration: 1 })
    expect(trackFor(tl, 'opacity').keyframes[0].value).toBe(0.25)
  })

  it('warns when it reaches the static default', () => {
    const onWarning = vi.fn()
    const tl = timeline({ onWarning })
    tl.to('box', { x: 100, duration: 1 })

    expect(onWarning).toHaveBeenCalledTimes(1)
    expect(onWarning.mock.calls[0][0]).toMatch(/static default/)
  })

  it('uses 0 and warns for a property with no known default', () => {
    const onWarning = vi.fn()
    const tl = timeline({ onWarning })
    tl.to('box', { customThing: 50, duration: 1 })

    expect(trackFor(tl, 'customThing').keyframes[0].value).toBe(0)
    expect(onWarning).toHaveBeenCalled()
  })

  it('never reads the DOM — the same script compiles identically anywhere', () => {
    const build = () => {
      const tl = timeline()
      tl.to('box', { x: 100, opacity: 0, duration: 1 })
      return JSON.stringify(tl.toDefinition())
    }
    expect(build()).toBe(build())
  })
})

describe('position parameter', () => {
  it('appends by default', () => {
    const tl = timeline()
    tl.to('a', { x: 1, duration: 1 })
    tl.to('b', { x: 1, duration: 1 })
    expect(tracksOf(tl)[1].delay).toBe(1000)
  })

  it('overlaps with a negative relative offset', () => {
    const tl = timeline()
    tl.to('a', { x: 1, duration: 1 })
    tl.to('b', { x: 1, duration: 1 }, '-=0.5')
    expect(tracksOf(tl)[1].delay).toBe(500)
  })

  it('starts with the previous tween using "<"', () => {
    const tl = timeline()
    tl.to('a', { x: 1, duration: 1 })
    tl.to('b', { x: 1, duration: 1 }, '<')
    expect(tracksOf(tl)[1].delay).toBe(0)
  })

  it('accepts an absolute time, in seconds', () => {
    const tl = timeline()
    tl.to('a', { x: 1, duration: 1 })
    tl.to('b', { x: 1, duration: 1 }, 2.5)
    expect(tracksOf(tl)[1].delay).toBe(2500)
  })

  it('resolves a label', () => {
    const tl = timeline()
    tl.to('a', { x: 1, duration: 1 })
    tl.addLabel('mid')
    tl.to('b', { x: 1, duration: 1 }, 'mid')
    expect(tl.labelTime('mid')).toBe(1000)
    expect(tracksOf(tl)[1].delay).toBe(1000)
  })

  it('places a label at an explicit position, in seconds', () => {
    const tl = timeline()
    tl.addLabel('start', 0.3)
    expect(tl.labelTime('start')).toBe(300)
  })
})

describe('stagger', () => {
  it('compiles a multi-target tween to one staggered track', () => {
    const tl = timeline()
    tl.to(['a', 'b', 'c'], { opacity: 0, duration: 1, stagger: 0.1 })

    const track = trackFor(tl, 'opacity')
    expect(track.targets).toEqual(['a', 'b', 'c'])
    expect(track.stagger).toEqual({ each: 100 })
  })

  it('converts a stagger object from seconds', () => {
    const tl = timeline()
    tl.to(['a', 'b'], { x: 1, duration: 1, stagger: { amount: 0.6, from: 'center' } })
    expect(trackFor(tl, 'x').stagger).toEqual({ amount: 600, from: 'center' })
  })

  it('extends the timeline by the stagger span', () => {
    const tl = timeline()
    tl.to(['a', 'b', 'c'], { x: 1, duration: 1, stagger: 0.1 })
    tl.to('d', { x: 1, duration: 1 })
    // 1000ms tween + 200ms of stagger.
    expect(tracksOf(tl)[1].delay).toBe(1200)
  })

  it('ignores stagger for a single target', () => {
    const tl = timeline()
    tl.to('a', { x: 1, duration: 1, stagger: 0.1 })
    expect(trackFor(tl, 'x').stagger).toBeUndefined()
  })
})

describe('non-bezier eases', () => {
  it('warns and falls back when baking is off', () => {
    const onWarning = vi.fn()
    const tl = timeline({ onWarning })
    tl.fromTo('box', { x: 0 }, { x: 100, duration: 1, ease: 'elastic.out' })

    expect(trackFor(tl, 'x').keyframes).toHaveLength(2)
    expect(onWarning.mock.calls.some((c) => /cubic-bezier/.test(c[0]))).toBe(true)
  })

  it('bakes into intermediate keyframes when enabled', () => {
    const tl = timeline({ bakeEases: true })
    tl.fromTo('box', { x: 0 }, { x: 100, duration: 1, ease: 'elastic.out' })
    expect(trackFor(tl, 'x').keyframes.length).toBeGreaterThan(10)
  })

  it('baked output overshoots, as elastic should', () => {
    const tl = timeline({ bakeEases: true })
    tl.fromTo('box', { x: 0 }, { x: 100, duration: 1, ease: 'elastic.out' })

    const values = trackFor(tl, 'x').keyframes.map((k) => k.value as number)
    expect(Math.max(...values)).toBeGreaterThan(100)
  })

  it('baked output is still plain JSON', () => {
    const tl = timeline({ bakeEases: true })
    tl.fromTo('box', { x: 0 }, { x: 100, duration: 1, ease: 'bounce.out' })

    const definition = tl.toDefinition()
    expect(JSON.parse(JSON.stringify(definition))).toEqual(definition)
  })

  it('honours the bake interval', () => {
    const coarse = timeline({ bakeEases: true, bakeIntervalMs: 100 })
    coarse.fromTo('box', { x: 0 }, { x: 100, duration: 1, ease: 'bounce.out' })

    const fine = timeline({ bakeEases: true, bakeIntervalMs: 10 })
    fine.fromTo('box', { x: 0 }, { x: 100, duration: 1, ease: 'bounce.out' })

    expect(trackFor(fine, 'x').keyframes.length).toBeGreaterThan(
      trackFor(coarse, 'x').keyframes.length
    )
  })
})

describe('function eases', () => {
  it('are rejected, because they cannot serialize', () => {
    const tl = timeline()
    expect(() => tl.to('box', { x: 1, duration: 1, ease: (t: number) => t })).toThrow(
      /cannot be serialized/
    )
  })
})

describe('nested timelines', () => {
  it('flattens a child in at the given offset', () => {
    const child = timeline()
    child.fromTo('inner', { x: 0 }, { x: 50, duration: 1 })

    const parent = timeline()
    parent.fromTo('outer', { x: 0 }, { x: 10, duration: 1 })
    parent.add(child, 2)

    const nested = tracksOf(parent).find((t) => t.target === 'inner')!
    // The child's own delay (0) plus the offset.
    expect(nested.keyframes[0].time + (nested.delay ?? 0)).toBe(2000)
  })

  it('produces a flat track list — there is no nested-timeline runtime', () => {
    const child = timeline()
    child.to('inner', { x: 50, duration: 1 })

    const parent = timeline()
    parent.add(child)

    expect(parent.toDefinition().tracks.every((t) => 'keyframes' in t)).toBe(true)
  })
})

describe('timeline config', () => {
  it('maps repeat and yoyo onto loop and alternate', () => {
    const tl = timeline({ repeat: 2, yoyo: true })
    const config = tl.toDefinition().config
    expect(config.loop).toBe(2)
    expect(config.alternate).toBe(true)
  })

  it('converts repeatDelay from seconds', () => {
    expect(timeline({ repeatDelay: 0.5 }).toDefinition().config.repeatDelay).toBe(500)
  })

  it('maps timeScale onto speed', () => {
    expect(timeline({ timeScale: 2 }).toDefinition().config.speed).toBe(2)
  })
})

describe('playback controls', () => {
  const build = () => {
    const tl = timeline()
    tl.fromTo('box', { x: 0 }, { x: 100, duration: 1 })
    return tl
  }

  it('reports duration in seconds', () => {
    expect(build().duration()).toBe(1)
  })

  it('plays and pauses', () => {
    const tl = build()
    tl.play()
    expect(tl.timeline.playbackState).toBe('playing')
    tl.pause()
    expect(tl.timeline.playbackState).toBe('paused')
  })

  it('seeks in seconds', () => {
    const tl = build()
    tl.seek(0.5)
    expect(tl.timeline.currentTime).toBe(500)
  })

  it('seeks to a label', () => {
    const tl = build()
    tl.addLabel('here', 0.4)
    tl.seek('here')
    expect(tl.timeline.currentTime).toBe(400)
  })

  it('reads and writes progress', () => {
    const tl = build()
    tl.progress(0.25)
    expect(tl.timeline.currentTime).toBe(250)
    expect(tl.progress()).toBeCloseTo(0.25, 10)
  })

  it('reads and writes timeScale', () => {
    const tl = build()
    tl.timeScale(3)
    expect(tl.timeScale()).toBe(3)
  })

  it('kill() removes every track', () => {
    const tl = build()
    tl.kill()
    expect(tl.timeline.tracks).toHaveLength(0)
  })

  it('a tween handle kills only its own tracks', () => {
    const tl = timeline()
    const first = tl.to('a', { x: 1, duration: 1 })
    tl.to('b', { x: 1, duration: 1 })

    first.kill()
    expect(tl.timeline.tracks.map((t) => t.target)).toEqual(['b'])
  })

  it('a tween handle reports its span', () => {
    const tl = timeline()
    tl.to('a', { x: 1, duration: 1 })
    const second = tl.to('b', { x: 1, duration: 2 })

    expect(second.start).toBe(1000)
    expect(second.end).toBe(3000)
  })
})

describe('tf shorthand', () => {
  it('tf.to builds a one-tween timeline', () => {
    const tl = tf.to('box', { x: 100, duration: 1 })
    expect(tracksOf(tl)).toHaveLength(1)
  })

  it('tf.fromTo uses both endpoints', () => {
    const tl = tf.fromTo('box', { x: 0 }, { x: 100, duration: 1 })
    expect(trackFor(tl, 'x').keyframes[0].value).toBe(0)
  })

  it('tf.set holds a single value', () => {
    const tl = tf.set('box', { opacity: 0 })
    expect(trackFor(tl, 'opacity').keyframes).toHaveLength(1)
  })
})

describe('output contract', () => {
  it('compiles to a definition that survives a JSON round-trip', () => {
    const tl = timeline({ repeat: -1, yoyo: true })
    tl.fromTo('box', { x: 0, opacity: 0 }, { x: 200, opacity: 1, duration: 1, ease: 'power2.out' })
    tl.to(['a', 'b', 'c'], { opacity: 0, duration: 0.5, stagger: 0.1 }, '-=0.25')

    const definition = tl.toDefinition()
    expect(JSON.parse(JSON.stringify(definition))).toEqual(definition)
  })

  it('is deterministic — compiling twice gives byte-identical JSON', () => {
    const build = () => {
      const tl = timeline({ id: 'fixed', repeat: 1 })
      tl.fromTo('box', { x: 0 }, { x: 100, duration: 1, ease: 'power3.inout' })
      tl.to(['a', 'b'], { opacity: 0, duration: 0.5, stagger: 0.2 }, '<')
      return JSON.stringify(tl.toDefinition())
    }
    expect(build()).toBe(build())
  })

  it('matches a golden fixture for a representative script', () => {
    const tl = timeline({ id: 'golden' })
    tl.fromTo('box', { x: 0, opacity: 0 }, { x: 100, opacity: 1, duration: 1, ease: 'power2.out' })
    tl.to('box', { x: 200, duration: 0.5 }, '-=0.25')

    expect(tl.toDefinition()).toEqual({
      id: 'golden',
      name: undefined,
      config: {},
      tracks: [
        {
          id: 'box-x-1',
          target: 'box',
          property: 'x',
          delay: 0,
          keyframes: [
            { time: 0, value: 0 },
            { time: 1000, value: 100, easing: 'ease-out-quad' },
          ],
        },
        {
          id: 'box-opacity-2',
          target: 'box',
          property: 'opacity',
          delay: 0,
          keyframes: [
            { time: 0, value: 0 },
            { time: 1000, value: 1, easing: 'ease-out-quad' },
          ],
        },
        {
          id: 'box-x-3',
          target: 'box',
          property: 'x',
          delay: 750,
          keyframes: [
            { time: 0, value: 100 },
            { time: 500, value: 200 },
          ],
        },
      ],
    })
  })
})

describe('startValue option', () => {
  it('supplies a start value before the defaults map', () => {
    const tl = timeline({
      defaults: { x: 5 },
      startValue: (target, property) => (target === 'box' && property === 'x' ? 40 : undefined),
    })
    tl.to('box', { x: 100, duration: 1 })
    expect(trackFor(tl, 'x').keyframes[0].value).toBe(40)
  })

  it('is overridden by a value this timeline already authored', () => {
    const tl = timeline({ startValue: () => 40 })
    tl.fromTo('box', { x: 0 }, { x: 10, duration: 1 })
    tl.to('box', { x: 20, duration: 1 })
    expect(trackFor(tl, 'x').keyframes[0].value).toBe(0)
    expect(tracksOf(tl).filter((t) => t.property === 'x')[1].keyframes[0].value).toBe(10)
  })
})
