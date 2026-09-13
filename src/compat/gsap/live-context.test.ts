// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLive, type LiveApi } from './live'
import { Stage, type FrameScheduler } from './stage'

/**
 * live.context() and live.matchMedia(): everything created inside is undone by
 * revert(), elements go back to their own styles, and media-query setups follow
 * the queries.
 */

let live: LiveApi
let pending: ((t: number) => void) | null = null
let now = 0
const scheduler: FrameScheduler = { request: (cb) => ((pending = cb), 1), cancel: () => (pending = null) }
const frame = (ms: number) => {
  const cb = pending as ((t: number) => void) | null
  pending = null
  now += ms
  cb?.(now)
}
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve))
const el = (id: string) => document.getElementById(id) as HTMLElement

beforeEach(() => {
  document.body.innerHTML = `
    <section id="one"><div class="box" id="a" style="color: red"></div><h2 id="title">Hello world</h2></section>
    <section id="two"><div class="box" id="b"></div></section>`
  live = createLive(new Stage({ scheduler }))
})

afterEach(() => live.stage.destroy())

describe('live.context', () => {
  it('reverts what was created inside: timelines stop and elements get their own styles back', async () => {
    const ctx = live.context(() => {
      live.to('#a', { x: 100, opacity: 0.5, duration: 1 })
    })
    await flush()
    frame(0)
    frame(500)
    expect(el('a').style.transform).toContain('translateX')

    ctx.revert()
    expect(el('a').getAttribute('style')).toBe('color: red')
    frame(500)
    expect(el('a').style.transform).toBe('') // nothing keeps writing

    // The stage forgot the old values: a new tween starts from the natural state.
    const tl = live.to('#a', { x: 10, duration: 1 })
    expect((tl.timeline.tracks[0] as { keyframes: { value: number }[] }).keyframes[0].value).toBe(0)
  })

  it('scopes selectors to the given element', async () => {
    live.context(() => {
      live.to('.box', { x: 50, duration: 0.1 })
    }, el('two'))
    await flush()
    frame(0)
    frame(200)
    expect(el('a').style.transform).toBe('')
    expect(el('b').style.transform).toContain('50px')
  })

  it('reverts split text, ticker callbacks, scroll triggers and a returned cleanup, newest first', async () => {
    const order: string[] = []
    const tick = vi.fn()
    const ctx = live.context(() => {
      live.splitText('#title', { type: 'words' })
      live.ticker.add(tick)
      live.scrollTrigger({ trigger: '#one', onUpdate: () => {} })
      return () => order.push('cleanup')
    })
    expect(el('title').querySelector('.word')).not.toBeNull()

    ctx.revert()
    expect(order).toEqual(['cleanup'])
    expect(el('title').querySelector('.word')).toBeNull()
    frame(16)
    frame(16)
    expect(tick).not.toHaveBeenCalled()
  })

  it('collects work added later with ctx.add(), e.g. from an event handler', async () => {
    const ctx = live.context()
    el('b').addEventListener('click', () => ctx.add(() => live.to('#b', { x: 30, duration: 0.1 })))
    el('b').click()
    await flush()
    frame(0)
    frame(200)
    expect(el('b').style.transform).toContain('30px')
    ctx.revert()
    expect(el('b').hasAttribute('style')).toBe(false)
  })

  it('leaves work created outside the context alone', async () => {
    live.to('#b', { x: 20, duration: 0.1 })
    const ctx = live.context(() => live.to('#a', { x: 20, duration: 0.1 }))
    await flush()
    frame(0)
    frame(200)
    ctx.revert()
    expect(el('b').style.transform).toContain('20px')
  })
})

describe('live.matchMedia', () => {
  /** A controllable window.matchMedia. */
  const queries = new Map<string, { matches: boolean; listeners: Set<() => void> }>()
  const setMatch = (query: string, matches: boolean) => {
    const entry = queries.get(query)!
    entry.matches = matches
    for (const listener of entry.listeners) listener()
  }

  beforeEach(() => {
    queries.clear()
    vi.stubGlobal('matchMedia', (query: string) => {
      if (!queries.has(query)) queries.set(query, { matches: false, listeners: new Set() })
      const entry = queries.get(query)!
      return {
        get matches() {
          return entry.matches
        },
        addEventListener: (_: string, fn: () => void) => entry.listeners.add(fn),
        removeEventListener: (_: string, fn: () => void) => entry.listeners.delete(fn),
      }
    })
    window.matchMedia = globalThis.matchMedia
  })
  afterEach(() => vi.unstubAllGlobals())

  it('runs a setup while its query matches and reverts it when it stops', async () => {
    const setup = vi.fn(() => {
      live.set('#a', { x: 99 })
    })
    const mm = live.matchMedia()
    mm.add('(min-width: 800px)', setup)
    expect(setup).not.toHaveBeenCalled()

    setMatch('(min-width: 800px)', true)
    await flush()
    await flush()
    frame(16)
    expect(setup).toHaveBeenCalledTimes(1)
    expect(el('a').style.transform).toContain('99px')

    setMatch('(min-width: 800px)', false)
    await flush()
    expect(el('a').getAttribute('style')).toBe('color: red')
    mm.revert()
  })

  it('passes named conditions, and re-runs the setup when they change', async () => {
    queries.set('(min-width: 800px)', { matches: true, listeners: new Set() })
    const seen: Record<string, boolean>[] = []
    const mm = live.matchMedia()
    mm.add({ desktop: '(min-width: 800px)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
      seen.push({ ...ctx.conditions })
    })
    expect(seen).toEqual([{ desktop: true, reduce: false }])

    setMatch('(prefers-reduced-motion: reduce)', true)
    await flush()
    expect(seen.at(-1)).toEqual({ desktop: true, reduce: true })

    mm.revert()
    setMatch('(min-width: 800px)', false)
    await flush()
    expect(seen).toHaveLength(2) // no longer listening
  })
})
