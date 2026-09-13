// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { createLive, type LiveApi } from './live'
import { Stage, type FrameScheduler } from './stage'
import { isSpringTrack, type SpringTrack } from '../../engine'

let live: LiveApi
let stage: Stage
let pending: ((t: number) => void) | null = null
let now = 0
const scheduler: FrameScheduler = { request: (cb) => ((pending = cb), 1), cancel: () => (pending = null) }
const frame = (ms: number) => {
  const cb = pending as ((t: number) => void) | null
  pending = null
  now += ms
  cb?.(now)
}
const x = () => Number(document.getElementById('box')!.style.transform.match(/translateX\(([-\d.]+)px/)?.[1] ?? 0)

beforeEach(() => {
  document.body.innerHTML = '<div id="box"></div>'
  stage = new Stage({ scheduler })
  live = createLive(stage)
})

describe('live.quickTo', () => {
  it('animates toward each value, from wherever the property is at that moment', () => {
    const moveX = live.quickTo('#box', 'x', { duration: 1, ease: 'none' })
    moveX(100)
    frame(0)
    frame(500)
    expect(x()).toBeCloseTo(50)

    moveX(0) // re-target mid-flight: from 50 toward 0, no jump
    frame(0)
    expect(x()).toBeCloseTo(50)
    frame(500)
    expect(x()).toBeCloseTo(25)
    frame(600)
    expect(x()).toBe(0)
  })

  it('reuses one timeline and one track however often it is called', () => {
    const moveX = live.quickTo('#box', 'x')
    for (let i = 0; i < 50; i++) moveX(i)
    expect(moveX.tween.timeline.tracks).toHaveLength(1)
  })

  it('costs no DOM write until the next frame', () => {
    const moveX = live.quickTo('#box', 'x', { duration: 1, ease: 'none' })
    moveX(100)
    moveX(200)
    expect(document.getElementById('box')!.style.transform).toBe('')
  })

  it('on a spring, keeps the velocity of the move it interrupts', () => {
    const moveX = live.quickTo('#box', 'x', { spring: 'default' })
    moveX(300)
    frame(0)
    frame(80)
    moveX(0)
    const track = moveX.tween.timeline.tracks.find(isSpringTrack) as SpringTrack
    expect(track.spring.velocity).toBeGreaterThan(100) // still heading right
    expect(track.spring.to).toBe(0)
  })

  it('kill() stops it', () => {
    const moveX = live.quickTo('#box', 'x', { duration: 1, ease: 'none' })
    moveX(100)
    frame(0)
    frame(200)
    moveX.kill()
    const at = x()
    frame(500)
    expect(x()).toBe(at)
  })
})
