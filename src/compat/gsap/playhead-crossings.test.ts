import { describe, it, expect } from 'vitest'
import { playheadCrossings, type Crossing } from './playhead-crossings'

const events = (crossings: Crossing[]) => crossings.map((c) => (c.kind === 'repeat' ? 'repeat' : `${c.index}${c.direction === 'reverse' ? '<' : ''}`))
const plain = { duration: 1000, alternate: false }
const yoyo = { duration: 1000, alternate: true }

describe('playheadCrossings', () => {
  const times = [0, 250, 500, 1000]

  it('reports events passed going forward, excluding where it already was', () => {
    const { crossings } = playheadCrossings(times, { time: 250, iteration: 0, direction: 'forward' }, { time: 600, iteration: 0, direction: 'forward' }, plain)
    expect(events(crossings)).toEqual(['2'])
  })

  it('includes the start on a first play, and the end on arrival', () => {
    const start = playheadCrossings(times, { time: 0, iteration: 0, direction: 'forward', fresh: true }, { time: 100, iteration: 0, direction: 'forward' }, plain)
    expect(events(start.crossings)).toEqual(['0'])
    const end = playheadCrossings(times, { time: 900, iteration: 0, direction: 'forward' }, { time: 1000, iteration: 0, direction: 'forward' }, plain)
    expect(events(end.crossings)).toEqual(['3'])
  })

  it('reports events in reverse order going backwards', () => {
    const { crossings } = playheadCrossings(times, { time: 800, iteration: 0, direction: 'reverse' }, { time: 0, iteration: 0, direction: 'reverse' }, plain)
    expect(events(crossings)).toEqual(['2<', '1<', '0<'])
  })

  it('wraps a plain repeat: to the end, repeat, then from the start again', () => {
    const { crossings, passes } = playheadCrossings(times, { time: 900, iteration: 0, direction: 'forward' }, { time: 300, iteration: 1, direction: 'forward' }, plain)
    expect(events(crossings)).toEqual(['3', 'repeat', '0', '1'])
    expect(passes).toEqual([[900, 1000], [0, 300]])
  })

  it('turns a yoyo around without firing the turning point twice', () => {
    const { crossings } = playheadCrossings(times, { time: 900, iteration: 0, direction: 'forward' }, { time: 400, iteration: 1, direction: 'reverse' }, yoyo)
    expect(events(crossings)).toEqual(['3', 'repeat', '2<'])
  })

  it('stops at the boundary while a plain repeat waits out its delay', () => {
    const { crossings } = playheadCrossings(times, { time: 900, iteration: 0, direction: 'forward' }, { time: 1000, iteration: 1, direction: 'forward' }, { ...plain, holding: true })
    expect(events(crossings)).toEqual(['3', 'repeat'])
  })

  it('handles several loops in one frame', () => {
    const { crossings } = playheadCrossings([500], { time: 600, iteration: 0, direction: 'forward' }, { time: 100, iteration: 3, direction: 'forward' }, plain)
    expect(events(crossings)).toEqual(['repeat', '0', 'repeat', '0', 'repeat'])
  })

  it('keeps events at the same time in the order they were added', () => {
    const { crossings } = playheadCrossings([500, 500], { time: 0, iteration: 0, direction: 'forward' }, { time: 600, iteration: 0, direction: 'forward' }, plain)
    expect(events(crossings)).toEqual(['0', '1'])
  })
})
