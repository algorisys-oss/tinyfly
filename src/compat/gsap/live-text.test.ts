// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { createLive } from './live'
import { Stage, type FrameScheduler } from './stage'
import { isTextTrack, type TextTrack } from '../../engine'

beforeEach(() => {
  document.body.innerHTML = '<h1 id="title">Old title</h1><p class="line">first</p><p class="line">second</p>'
})

function setup() {
  let pending: ((t: number) => void) | null = null
  let now = 0
  const scheduler: FrameScheduler = { request: (cb) => ((pending = cb), 1), cancel: () => (pending = null) }
  const live = createLive(new Stage({ scheduler }))
  const run = (ms: number) => {
    for (let t = 0; t <= ms + 32; t += 16) {
      const cb = pending
      pending = null
      now += 16
      cb?.(now)
    }
  }
  return { live, run }
}

describe('live text', () => {
  it('scrambles from the element\'s current text to the new text', async () => {
    const { live, run } = setup()
    const tween = live.to('#title', { scrambleText: 'New title', duration: 0.3, ease: 'none' })
    expect((tween.timeline.tracks.find(isTextTrack) as TextTrack).textConfig.from).toBe('Old title')

    await Promise.resolve()
    run(120)
    const mid = document.getElementById('title')!.textContent!
    expect(mid).not.toBe('Old title')
    expect(mid).not.toBe('New title')
    run(400)
    expect(document.getElementById('title')!.textContent).toBe('New title')
  })

  it('gives each element its own starting text', () => {
    const { live } = setup()
    const tl = live.timeline({ paused: true }).to('.line', { text: 'done', duration: 1, stagger: 0.2 })
    const tracks = tl.timeline.tracks.filter(isTextTrack) as TextTrack[]
    expect(tracks.map((t) => t.textConfig.from)).toEqual(['first', 'second'])
    expect(tracks.map((t) => t.delay)).toEqual([0, 200])
  })
})
