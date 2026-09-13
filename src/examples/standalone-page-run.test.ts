// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { liveDemoPage } from './standalone-page'
import { liveDemos } from './live-demos'
import { createLive, Stage, type FrameScheduler } from '../compat/gsap'
import { exercise, stubSvgGeometry } from './live-demos/test-support'

stubSvgGeometry()

/**
 * Run each copied live demo page the way a browser would: its markup in the
 * document, its inline script executed with a `tinyfly` global. It has to run
 * without throwing and move something.
 */

function load(html: string) {
  const body = html.match(/<body>([\s\S]*?)<\/body>/)![1].replace(/<script[\s\S]*?<\/script>/g, '')
  const inline = html.match(/<script>\n([\s\S]*?)\n\s*<\/script>/)![1]
  return { body, inline }
}

describe('copied live demo pages run', () => {
  for (const demo of liveDemos) {
    it(demo.id, async () => {
      const { body, inline } = load(liveDemoPage(demo))
      document.body.innerHTML = body

      let pending: ((t: number) => void) | null = null
      let now = 0
      const scheduler: FrameScheduler = { request: (cb) => ((pending = cb), 1), cancel: () => (pending = null) }
      const stage = new Stage({ scheduler })
      const step = () => {
        const cb = pending
        pending = null
        now += 16
        cb?.(now)
      }

      expect(() => new Function('tinyfly', inline)({ live: createLive(stage) })).not.toThrow()
      await Promise.resolve()
      exercise(document.body)
      await Promise.resolve()

      const styles = () =>
        Array.from(document.body.querySelectorAll('*'))
          .map((el) => el.getAttribute('style') ?? '')
          .join('|')
      step()
      const before = styles()
      for (let i = 0; i < 20; i++) step()
      expect(styles(), demo.id).not.toBe(before)
      stage.destroy()
    })
  }
})
