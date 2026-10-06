import { describe, it, expect } from 'vitest'
import { Timeline } from '../core/timeline'
import { cameraTracks } from './camera-shots'
import { cameraFromValues, cameraPoint } from '../../adapters/canvas/camera'

const stage = { width: 1280, height: 720 }
const viewAt = (tracks: ReturnType<typeof cameraTracks>, time: number) =>
  cameraFromValues(new Timeline({ id: 'c', tracks }).getStateAtTime(time).values.get('Camera'))

describe('cameraTracks', () => {
  it('pushes in on a point: it ends up centred, zoomed', () => {
    const focus = { x: 900, y: 500 }
    const tracks = cameraTracks([{ at: 1000, duration: 400, frame: { focus, scale: 2 } }], { stage })
    const before = viewAt(tracks, 900)
    expect(before.scale).toBe(1)
    expect(cameraPoint(before, stage, focus)).toEqual(focus)
    const after = viewAt(tracks, 1400)
    expect(after.scale).toBe(2)
    const seen = cameraPoint(after, stage, focus)
    expect(seen.x).toBeCloseTo(640)
    expect(seen.y).toBeCloseTo(360)
    // Half way, still moving.
    expect(viewAt(tracks, 1200).scale).toBeGreaterThan(1)
    expect(viewAt(tracks, 1200).scale).toBeLessThan(2)
  })

  it('cuts when the move takes no time, and centres with a roll too', () => {
    const focus = { x: 300, y: 200 }
    const tracks = cameraTracks([{ at: 500, duration: 0, frame: { focus, scale: 1.5, rotate: 10 } }], { stage })
    expect(viewAt(tracks, 499).scale).toBe(1)
    const seen = cameraPoint(viewAt(tracks, 520), stage, focus)
    expect(seen.x).toBeCloseTo(640)
    expect(seen.y).toBeCloseTo(360)
  })

  it('shakes within its strength, dying away, then rests', () => {
    const tracks = cameraTracks([{ at: 2000, duration: 600, shake: { strength: 20, seed: 3 } }], { stage })
    expect(tracks.map((t) => t.property).sort()).toEqual(['shakeRotate', 'shakeX', 'shakeY'])
    let early = 0
    let late = 0
    for (let t = 2000; t <= 2600; t += 10) {
      const view = viewAt(tracks, t)
      expect(Math.abs(view.shakeX)).toBeLessThanOrEqual(20)
      if (t < 2200) early = Math.max(early, Math.abs(view.shakeX))
      if (t > 2400) late = Math.max(late, Math.abs(view.shakeX))
    }
    expect(late).toBeLessThan(early)
    expect(viewAt(tracks, 2700).shakeX).toBe(0)
    expect(cameraTracks([{ at: 2000, duration: 600, shake: { seed: 3 } }], { stage })).toEqual(cameraTracks([{ at: 2000, duration: 600, shake: { seed: 3 } }], { stage }))
  })

  it('follows a subject a lag behind', () => {
    const x = [
      { time: 0, value: 200 },
      { time: 2000, value: 1000 },
    ]
    const tracks = cameraTracks([{ at: 0, until: 2000, follow: { x, lag: 300, y: 360 } }], { stage })
    // At 1300 the camera frames where the subject was at 1000 (x 600).
    const seen = cameraPoint(viewAt(tracks, 1300), stage, { x: 600, y: 360 })
    expect(seen.x).toBeCloseTo(640, 0)
    // It holds after the follow ends, on the subject's last place.
    const end = cameraPoint(viewAt(tracks, 3000), stage, { x: 1000, y: 360 })
    expect(end.x).toBeCloseTo(640)
  })

  it('plays shots in time order, whatever order they are given in', () => {
    const shots = [
      { at: 3000, duration: 300, frame: { scale: 1 } },
      { at: 1000, duration: 300, frame: { focus: { x: 800, y: 300 }, scale: 1.4 } },
    ]
    const tracks = cameraTracks(shots, { stage, target: 'cam' })
    expect(tracks.every((t) => t.target === 'cam')).toBe(true)
    for (const track of tracks) {
      const times = track.keyframes.map((k) => k.time)
      expect([...times].sort((a, b) => a - b)).toEqual(times)
    }
  })
})
