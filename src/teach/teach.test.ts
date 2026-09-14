import { describe, it, expect } from 'vitest'
import { deserializeTimeline } from '../engine'
import { validateEmbed, renderFrame } from '../embed/tools'
import { lesson, figure, cells, pointer, stack, queue, table, pipeline } from '.'

const valueAt = (definition: ReturnType<ReturnType<typeof lesson>['definition']>, target: string, property: string, time: number) =>
  deserializeTimeline(definition).getStateAtTime(time).values.get(target)?.get(property)

describe('lesson()', () => {
  it('chains steps from the last value, holds between them, and switches text at once', () => {
    const l = lesson({ id: 'demo' })
    l.initial('box', { x: 10 })
    l.marker('start', { label: 'start', captions: { es: 'inicio' } })
    l.to('box', { x: 100 }, { duration: 500, easing: 'linear' })
    l.wait(500)
    l.set('label', { text: 'len = 4' })
    l.marker('moved', { pause: true, question: 'Where next?' })
    l.together(() => {
      l.to('box', { x: 0 }, { duration: 300, easing: 'linear' })
      l.to('box', { opacity: 0.5 }, { duration: 600, easing: 'linear' })
    })
    const definition = l.definition()

    expect(definition.config.duration).toBe(1600)
    expect(definition.config.markers).toEqual([
      { id: 'start', time: 0, label: 'start' },
      { id: 'moved', time: 1000, pause: true, question: 'Where next?' },
    ])
    expect(definition.captions).toEqual({ es: { start: 'inicio' } })
    expect(valueAt(definition, 'box', 'x', 250)).toBeCloseTo(55)
    expect(valueAt(definition, 'box', 'x', 900)).toBe(100)
    expect(valueAt(definition, 'label', 'text', 999)).toBe('')
    expect(valueAt(definition, 'label', 'text', 1001)).toBe('len = 4')
    expect(valueAt(definition, 'box', 'x', 1300)).toBe(0)
    expect(valueAt(definition, 'box', 'opacity', 1300)).toBeCloseTo(0.75)
  })
})

describe('diagram primitives', () => {
  it('build a full teaching figure that validates and renders at each step', () => {
    const slice = cells({ id: 's', values: [1, 2, 3, ''], x: 20, y: 20 })
    const len = pointer({ id: 'len', label: 'len', x: slice.center(2).x, y: 90 })
    const calls = stack({ id: 'calls', x: 300, y: 10, capacity: 3 })
    const channel = queue({ id: 'ch', x: 20, y: 180, capacity: 2, label: 'chan int' })
    const buckets = table({ id: 'm', x: 300, y: 150, keys: ['a', 'b'] })
    const http = pipeline({ id: 'http', x: 20, y: 280, stages: ['logger', 'auth', 'handler'] })

    const l = lesson({ id: 'tour' })
    l.marker('begin')
    slice.write(l, 3, 4)
    len.moveTo(l, slice.center(3).x)
    slice.highlight(l, 3)
    l.marker('appended')
    calls.push(l, 'main()')
    calls.push(l, 'append()')
    calls.pop(l)
    channel.send(l, '1')
    channel.send(l, '2')
    channel.receive(l)
    buckets.put(l, 'b', 42)
    http.advance(l, 1)
    http.advance(l, 2)
    l.marker('done')
    const definition = l.definition()
    const markup = figure({ width: 640, height: 340, title: 'A tour', children: [slice, len, calls, channel, buckets, http] })

    const errors = validateEmbed(definition, { markup }).filter((problem) => problem.level === 'error')
    expect(errors).toEqual([])
    expect(markup).toContain('<title>A tour</title>')

    const appended = renderFrame(markup, definition, 'appended')
    expect(appended).toMatch(/data-tinyfly="s-value-3"[^>]*>4</)
    expect(appended).toMatch(/data-tinyfly="len"[^>]*translateX\(54px\)/)

    const done = renderFrame(markup, definition, 'done')
    expect(done).toMatch(/data-tinyfly="calls-frame-1"[^>]*opacity: 0/)
    expect(done).toMatch(/data-tinyfly="calls-frame-0"[^>]*opacity: 1/)
    expect(done).toMatch(/data-tinyfly="m-value-1"[^>]*>42</)
    expect(done).toMatch(/data-tinyfly="http-request"[^>]*translateX\(276px\)/)
    // The second token moved up to the front slot when the first was received.
    expect(done).toMatch(/data-tinyfly="ch-token-1"[^>]*translateX\(88px\)/)
  })

  it('refuses impossible operations with clear errors', () => {
    const l = lesson({ id: 'x' })
    const s = stack({ id: 'st', x: 0, y: 0, capacity: 1 })
    s.push(l, 'a')
    expect(() => s.push(l, 'b')).toThrow(/full/)
    expect(() => queue({ id: 'q', x: 0, y: 0, capacity: 1 }).receive(l)).toThrow(/empty/)
    expect(() => table({ id: 't', x: 0, y: 0, keys: ['a'] }).put(l, 'z', 1)).toThrow(/no key "z"/)
  })
})
