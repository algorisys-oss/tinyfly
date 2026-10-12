import { expect, it } from 'vitest'
import { Timeline } from '../engine/core/timeline'
import { ballFlightPoint, ballFlightTracks, sampleTimes } from './ball-flight'

it('samples a deterministic arc with exact endpoints and sideways curve', () => {
  const flight = { target: 'ground/ball', start: 100, end: 1100, from: [0, 0, 0] as [number, number, number], to: [0, 0, 10] as [number, number, number], arc: 3, curve: 2, every: 500 }
  expect(ballFlightPoint(flight, -1)).toEqual(flight.from)
  expect(ballFlightPoint(flight, 2000)).toEqual(flight.to)
  expect(ballFlightPoint(flight, 600)).toEqual([-2, 3, 5])
  const tracks = ballFlightTracks(flight)
  const values = new Timeline({ id: 'flight', tracks }).getStateAtTime(600).values.get('ground/ball')!
  expect(['x', 'y', 'z'].map(key => values.get(key))).toEqual([-2, 3, 5])
  expect(sampleTimes(100, 1100, 400, [190, 1100, NaN])).toEqual([100, 190, 500, 900, 1100])
  flight.from[0] = 999
  expect(tracks[0].keyframes[0].value).toBe(0)
})

it('rejects invalid timing, coordinates, targets, heights and sample counts', () => {
  const flight = { target: 'ball', start: 0, end: 100, from: [0, 0, 0] as [number, number, number], to: [1, 1, 1] as [number, number, number] }
  for (const options of [{ ...flight, target: '' }, { ...flight, end: 0 }, { ...flight, arc: -1 }, { ...flight, from: [NaN, 0, 0] as [number, number, number] }, { ...flight, every: 0 }]) expect(() => ballFlightTracks(options)).toThrow()
  expect(() => sampleTimes(0, 1e9, 16)).toThrow()
  expect(() => ballFlightPoint(flight, Infinity)).toThrow()
})
