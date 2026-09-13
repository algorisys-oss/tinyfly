// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { liveDemos, extractCode } from './index'
import { createLive, Stage, type FrameScheduler } from '../../compat/gsap'
import { exercise, snapshot as markup, stubSvgGeometry } from './test-support'

stubSvgGeometry()

/**
 * Every demo must actually run: build its markup, run its code against a stage
 * scoped to that markup, and produce animations that move something.
 */

function manualScheduler() {
  let pending: ((t: number) => void) | null = null
  let now = 0
  const scheduler: FrameScheduler = {
    request: (cb) => ((pending = cb), 1),
    cancel: () => (pending = null),
  }
  const advance = (ms: number) => {
    const cb = pending
    pending = null
    now += ms
    cb?.(now)
  }
  return { scheduler, advance }
}

describe('live demos', () => {
  it('have unique ids and non-empty code', () => {
    expect(new Set(liveDemos.map((d) => d.id)).size).toBe(liveDemos.length)
    for (const demo of liveDemos) expect(demo.code.trim(), demo.id).not.toBe('')
  })

  it('show code that does not include the demo wrapper', () => {
    for (const demo of liveDemos) {
      expect(demo.code, demo.id).not.toContain('export function run')
      expect(demo.code, demo.id).not.toContain('#region')
    }
  })

  for (const demo of liveDemos) {
    it(`${demo.id} runs, animates, and tears down cleanly`, async () => {
      const root = document.createElement('div')
      root.innerHTML = demo.html
      document.body.appendChild(root)

      const frames = manualScheduler()
      const stage = new Stage({ root, scheduler: frames.scheduler })
      const live = createLive(stage)
      const cleanup = demo.run(live, root)
      await Promise.resolve()

      const snapshot = () => markup(root)
      // Before any input, so a demo that moves only while dragged still counts.
      const beforeInput = snapshot()

      // Interactive demos only move on input; give them some.
      exercise(root)
      await Promise.resolve()

      // Record every frame for 1.6s: a looping demo can be back where it
      // started at any single later moment, so look for any change at all.
      const seen = new Set<string>([beforeInput])
      for (let i = 0; i < 100; i++) {
        frames.advance(16)
        seen.add(snapshot())
      }
      expect(seen.size, demo.id).toBeGreaterThan(1)

      expect(() => {
        cleanup?.()
        stage.destroy()
      }).not.toThrow()
      root.remove()
    })
  }
})

describe('extractCode', () => {
  it('returns the marked region, dedented', () => {
    const source = 'function run() {\n  // #region code\n  live.to(".a", {})\n    .to(".b", {})\n  // #endregion code\n}'
    expect(extractCode(source)).toBe('live.to(".a", {})\n  .to(".b", {})')
  })

  it('throws when the markers are missing', () => {
    expect(() => extractCode('live.to(".a", {})')).toThrow(/region code/)
  })
})
