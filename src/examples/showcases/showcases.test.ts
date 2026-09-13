// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { showcases, findShowcase } from './index'
import { createLive, Stage, type FrameScheduler } from '../../compat/gsap'
import { exercise, stubSvgGeometry } from '../live-demos/test-support'
import { showcasePage } from '../standalone-page'

stubSvgGeometry()

/** Media queries answer as a browser with no motion preference would, so the full setup runs. */
window.matchMedia = ((query: string) => ({
  matches: query.includes('no-preference'),
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
})) as unknown as typeof window.matchMedia

/**
 * Full-page showcases must run end to end without a browser's layout: build the
 * page, run its code, drive frames and scroll, and tear down leaving nothing
 * behind (pins, spacers). Their motion is checked in real browsers by e2e.
 */
describe('showcases', () => {
  it('have ids, code and a standalone page that carries the same code', () => {
    expect(showcases.length).toBeGreaterThan(0)
    for (const showcase of showcases) {
      expect(findShowcase(showcase.id)).toBe(showcase)
      expect(showcase.code).not.toContain('#region')
      const page = showcasePage(showcase)
      expect(page).toContain(showcase.code.split('\n')[0])
      expect(page).toContain('const root = document.getElementById(\'page\')')
    }
  })

  for (const showcase of showcases) {
    it(`${showcase.id} runs, responds to input, and cleans up`, async () => {
      const host = document.createElement('div')
      host.innerHTML = showcase.html
      document.body.appendChild(host)

      let pending: ((t: number) => void) | null = null
      let now = 0
      const scheduler: FrameScheduler = { request: (cb) => ((pending = cb), 1), cancel: () => (pending = null) }
      const stage = new Stage({ root: host, scheduler })
      const cleanup = showcase.run(createLive(stage), host)
      await Promise.resolve()

      exercise(host)
      window.dispatchEvent(new Event('scroll'))
      for (let i = 0; i < 60; i++) {
        const cb = pending as ((t: number) => void) | null
        pending = null
        now += 16
        cb?.(now)
      }

      expect(() => {
        cleanup?.()
        stage.destroy()
      }).not.toThrow()
      expect(host.querySelector('.pin-spacer')).toBeNull()
      host.remove()
    })
  }

  it('agency-landing has a reduced-motion mode: no pin, no split, final values straight away', async () => {
    const saved = window.matchMedia
    window.matchMedia = ((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia
    try {
      const showcase = findShowcase('agency-landing')!
      const host = document.createElement('div')
      host.innerHTML = showcase.html
      document.body.appendChild(host)
      const stage = new Stage({ root: host, scheduler: { request: () => 1, cancel: () => {} } })
      const cleanup = showcase.run(createLive(stage), host)
      await Promise.resolve()

      expect(host.classList.contains('ag-reduced')).toBe(true)
      expect(host.querySelector('.pin-spacer')).toBeNull()
      expect(host.querySelector('.ag-manifesto-text .word')).toBeNull()

      cleanup?.()
      stage.destroy()
      expect(host.classList.contains('ag-reduced')).toBe(false)
      host.remove()
    } finally {
      window.matchMedia = saved
    }
  })
})
