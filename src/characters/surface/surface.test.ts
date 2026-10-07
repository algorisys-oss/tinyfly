import { describe, expect, it } from 'vitest'
import { Timeline } from '../../engine/core/timeline'
import { changingWindows, editLog, valueAt } from './edit-log'
import { pieceMotion } from './pieces'
import { rideFloors } from './ride'
import { surfaceBox } from './surface-box'

describe('editLog', () => {
  it('records tweens as keys and writes them out as tracks in time order', () => {
    const log = editLog()
    log.tween('bar.1.height', 0, 1, { at: 500, duration: 200, easing: 'ease-out' })
    log.tween('bar.1.height', 1, 0.5, { at: 100 })
    expect(log.last('bar.1.height', 0)).toBe(1)
    expect(log.tracks('chart')).toEqual([
      {
        id: 'chart-bar.1.height',
        target: 'chart',
        property: 'bar.1.height',
        keyframes: [
          { time: 100, value: 1 },
          { time: 400, value: 0.5 },
          { time: 500, value: 0 },
          { time: 700, value: 1, easing: 'ease-out' },
        ],
      },
    ])
  })

  it('reads a value between keys and finds when it changes', () => {
    const keys = [{ time: 0, value: 0 }, { time: 100, value: 0 }, { time: 200, value: 2 }]
    expect(valueAt(keys, 150)).toBe(1)
    expect(valueAt(keys, 999)).toBe(2)
    expect(valueAt(undefined, 50)).toBe(0)
    expect(changingWindows(keys)).toEqual([{ start: 100, end: 200 }])
  })
})

describe('pieceMotion', () => {
  it('moves a piece from wherever it is, and flings it on an arc that fades', () => {
    const log = editLog()
    const motion = pieceMotion(log)
    const note = { id: 1, home: surfaceBox(100, 100, 40, 20) }
    motion.move(note, { at: 0, duration: 100, to: { x: 220, y: 60 } })
    expect(motion.at(note, 100)).toEqual({ x: 220, y: 60 })
    motion.fling(note, { at: 200, velocity: { x: 1, y: 0 }, gravity: 0, duration: 330 })
    expect(motion.at(note, 200 + 33 * 3).x).toBeCloseTo(220 + 99)
    expect(log.last('piece.1.opacity', 1)).toBe(0)
  })
})

describe('rideFloors', () => {
  it('carries a figure on any moving floor, not only a line of code', () => {
    // A shelf at y 300 that slides 50px up between 1000 and 1500.
    const shelf = [{ time: 1000, value: 0 }, { time: 1500, value: -50 }]
    const floors = [{ top: 300, offset: (time: number) => valueAt(shelf, time), windows: changingWindows(shelf) }]
    const tracks = [{ id: 'hero-y', target: 'hero', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 2000, value: 0 }] }]
    const ridden = rideFloors(tracks, 'hero', { ground: 300, every: 50, floors })
    const timeline = new Timeline({ id: 'r', tracks: ridden })
    const y = (time: number) => timeline.getStateAtTime(time).values.get('hero')?.get('y') as number
    expect(y(500)).toBe(0)
    expect(y(1250)).toBeCloseTo(-25)
    expect(y(2000)).toBeCloseTo(-50)
  })

  it('returns the tracks as they are when no floor moves', () => {
    const tracks = [{ id: 'hero-y', target: 'hero', property: 'y', keyframes: [{ time: 0, value: 0 }] }]
    expect(rideFloors(tracks, 'hero', { ground: 0, every: 33, floors: [{ top: 0, offset: () => 0, windows: [] }] })).toBe(tracks)
  })
})
