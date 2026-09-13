// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createPlayground, DEFAULT_SNIPPET } from './playground'
import { hasSavedWork } from './saved-work'
import { startLandingMotion } from './landing-motion'

describe('landing playground', () => {
  let preview: HTMLElement
  beforeEach(() => {
    document.body.innerHTML = '<div id="preview"></div>'
    preview = document.getElementById('preview')!
  })

  it('runs the default snippet and shows the JSON it compiles to', () => {
    const playground = createPlayground(preview)
    const result = playground.run(DEFAULT_SNIPPET)
    expect(result.error).toBeUndefined()
    expect(preview.querySelectorAll('.box')).toHaveLength(3)
    const json = JSON.parse(result.json)
    expect(json.tracks.some((track: { property: string }) => track.property === 'x')).toBe(true)
    playground.destroy()
  })

  it('reports errors instead of throwing, and each run starts clean', () => {
    const playground = createPlayground(preview)
    expect(playground.run('live.to(').error).toBeTruthy()
    playground.run("live.to('.box', { x: 10 })")
    playground.run("live.to('.box', { y: 10 })")
    expect(preview.querySelectorAll('.box')).toHaveLength(3)
    playground.destroy()
  })
})

describe('hasSavedWork', () => {
  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('is true when the editor left projects in LocalStorage or IndexedDB, without opening the database', async () => {
    vi.stubGlobal('indexedDB', { databases: async () => [], open: vi.fn() })
    expect(await hasSavedWork()).toBe(false)

    localStorage.setItem('tinyfly-current-project', 'p1')
    expect(await hasSavedWork()).toBe(true)
    localStorage.clear()

    const open = vi.fn()
    vi.stubGlobal('indexedDB', { databases: async () => [{ name: 'tinyfly', version: 1 }], open })
    expect(await hasSavedWork()).toBe(true)
    expect(open).not.toHaveBeenCalled()
  })
})

describe('landing motion', () => {
  it('starts and cleans up without a browser layout', async () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes('no-preference'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia
    document.body.innerHTML = `<div class="lp"><nav class="lp-nav"></nav><header class="lp-hero"><canvas class="lp-flies"></canvas>
      <h1 class="lp-title">Motion, <em>as data.</em></h1><p class="lp-hero-reveal">x</p></header>
      <section class="lp-story"><ol><li class="lp-step">a</li><li class="lp-step">b</li></ol>
      <div class="lp-panel"><div class="lp-track"></div><span class="lp-playhead"></span></div><div class="lp-panel"><i class="lp-chip"></i></div></section>
      <section class="lp-strip"><div class="lp-strip-track"></div></section><span data-count="16">0</span>
      <footer class="lp-closing"><h2 class="lp-closing-title">Start</h2><a class="lp-magnet">go</a></footer></div>`
    const root = document.querySelector('.lp') as HTMLElement
    const stop = startLandingMotion(root)
    await Promise.resolve() // scroll triggers attach after the tweens chained onto them
    expect(root.querySelector('.pin-spacer')).not.toBeNull()
    stop()
    expect(root.querySelector('.pin-spacer')).toBeNull()
    expect(root.querySelector('.lp-title .line')).toBeNull()
  })
})
