import { describe, it, expect } from 'vitest'
import { Timeline } from '../engine/core/timeline'
import { cameraFollowTracks, cameraHandheldTracks, cameraMoveTracks, cameraPoseAt, checkShots, shotAt, shotMarkers, shotTracks, snapShotsToBeats, transitionAt, withActiveCamera, type Shot } from './shots'
import { orbitPosition } from './camera'

const shots: Shot[] = [
  { id: 'a', start: 0, end: 3000, camera: 'wide', label: 'Wide' },
  { id: 'b', start: 3000, end: 6000, camera: 'close', transition: { kind: 'crossfade', duration: 500 } },
  { id: 'c', start: 6000, end: 8000, camera: 'top', transition: { kind: 'wipe', duration: 400, direction: 'up' } },
]

describe('shots', () => {
  it('cut with one keyframe each, mark the timeline, and know the shot and transition at a time', () => {
    const [track] = shotTracks(shots, 'set')
    expect(track.target).toBe('set')
    expect(track.property).toBe('activeCamera')
    expect(track.keyframes.map((k) => [k.time, k.value])).toEqual([[0, 'wide'], [3000, 'close'], [6000, 'top']])
    const at = (time: number) => new Timeline({ id: 't', tracks: [track] }).getStateAtTime(time).values.get('set')?.get('activeCamera')
    expect(at(2999)).toBe('wide')
    expect(at(3000)).toBe('close')
    expect(shotAt(shots, 4500)?.id).toBe('b')
    expect(shotAt(shots, -1)).toBeUndefined()
    expect(shotMarkers(shots).map((m) => m.label)).toEqual(['Wide', 'b', 'c'])
    const mid = transitionAt(shots, 3250)!
    expect([mid.kind, mid.from.id, mid.to.id, mid.progress]).toEqual(['crossfade', 'a', 'b', 0.5])
    expect(transitionAt(shots, 3500)).toBeUndefined()
    expect(transitionAt(shots, 6100)?.direction).toBe('up')
    const values = withActiveCamera(new Map([['set/box', new Map([['x', 1]])]]), 'set', 'wide')
    expect(values.get('set')?.get('activeCamera')).toBe('wide')
    expect(values.get('set/box')?.get('x')).toBe(1)
    expect(checkShots(shots)).toEqual([])
    expect(checkShots([{ id: 'x', start: 0, end: 1000, camera: 'c', transition: { kind: 'crossfade', duration: 2000 } }, { id: 'x', start: 500, end: 400, camera: 'c' }])).toEqual([
      'shot "x" is first: nothing to transition from',
      'shot "x": its transition is longer than the shot',
      'two shots share the id "x"',
      'shot "x" ends before it starts',
      'shot "x" starts before "x" ends',
    ])
  })
})

describe('cutting on the beat', () => {
  it('moves each cut to the nearest beat, the first shot staying put', () => {
    const snapped = snapShotsToBeats(shots, { bpm: 120, offset: 100 })
    expect(snapped.map((s) => [s.start, s.end])).toEqual([[0, 3100], [3100, 6100], [6100, 8000]])
    expect(snapped[1].transition).toEqual(shots[1].transition)
    expect(snapShotsToBeats([], { bpm: 120, offset: 0 })).toEqual([])
  })
})

describe('camera moves', () => {
  it('write position, lookAt and fov tracks for an orbit, a dolly, a pan and a zoom', () => {
    const orbit = cameraMoveTracks({ scene: 'set', camera: 'cam', start: 0, end: 1000, from: { target: [0, 1, 0], yaw: 0, pitch: 10, distance: 5 }, to: { yaw: 90 }, easing: 'linear', every: 500 })
    expect(orbit.map((t) => t.property)).toEqual(['position', 'lookAt'])
    expect(orbit[0].keyframes.map((k) => k.time)).toEqual([0, 500, 1000])
    expect(orbit[0].keyframes[0].value).toEqual(orbitPosition([0, 1, 0], 0, 10, 5))
    expect(orbit[0].keyframes[2].value).toEqual(orbitPosition([0, 1, 0], 90, 10, 5))
    expect(orbit[1].keyframes[1].value).toEqual([0, 1, 0])
    const zoom = cameraMoveTracks({ scene: 'set', camera: 'cam', start: 0, end: 1000, from: { target: [0, 0, 0], fov: 50 }, to: { fov: 30 }, easing: 'linear', every: 1000 })
    expect(zoom[2].property).toBe('fov')
    expect(zoom[2].keyframes.map((k) => k.value)).toEqual([50, 30])
    const pan = cameraPoseAt({ position: [0, 2, 8], lookAt: [-2, 1, 0] }, { lookAt: [2, 1, 0] }, 0.5)
    expect(pan.position).toEqual([0, 2, 8])
    expect(pan.lookAt).toEqual([0, 1, 0])
    const dolly = cameraPoseAt({ target: [0, 0, 0], yaw: 0, pitch: 0, distance: 10 }, { distance: 4 }, 0.5)
    expect(dolly.position[2]).toBeCloseTo(7, 9)
  })

  it('follow a subject with an offset and a lag, and add a seeded handheld shake', () => {
    const follow = cameraFollowTracks({ scene: 'set', camera: 'cam', start: 0, end: 1000, subjectAt: (t) => [t / 1000, 0, 0], offset: [0, 2, 5], lag: 500, every: 500 })
    expect(follow[1].keyframes[2].value).toEqual([1, 0, 0])
    expect(follow[0].keyframes[2].value).toEqual([0.5, 2, 5])
    const still = cameraHandheldTracks([], { scene: 'set', camera: 'cam', start: 0, end: 2000, base: { position: [0, 2, 8], lookAt: [0, 1, 0] }, seed: 'x', every: 100 })
    expect(still.map((t) => t.property).sort()).toEqual(['lookAt', 'position'])
    const positions = still.find((t) => t.property === 'position')!.keyframes.map((k) => k.value as number[])
    expect(positions.length).toBe(21)
    expect(positions.some((p) => Math.abs(p[0]) > 0.005)).toBe(true)
    expect(positions.every((p) => Math.abs(p[0]) <= 0.04 + 1e-9 && Math.abs(p[1] - 2) <= 0.04 + 1e-9)).toBe(true)
    expect(JSON.stringify(cameraHandheldTracks([], { scene: 'set', camera: 'cam', start: 0, end: 2000, base: { position: [0, 2, 8], lookAt: [0, 1, 0] }, seed: 'x', every: 100 }))).toBe(JSON.stringify(still))
    expect(JSON.stringify(cameraHandheldTracks([], { scene: 'set', camera: 'cam', start: 0, end: 2000, base: { position: [0, 2, 8], lookAt: [0, 1, 0] }, seed: 'y', every: 100 }))).not.toBe(JSON.stringify(still))
    // Onto a move: the move's keys keep their times, shaken a little; other tracks pass through.
    const move = cameraMoveTracks({ scene: 'set', camera: 'cam', start: 0, end: 1000, from: { target: [0, 0, 0], distance: 5 }, to: { yaw: 30 }, every: 250 })
    const other = { id: 'o', target: 'set/box', property: 'x', keyframes: [{ time: 0, value: 1 }] }
    const shaken = cameraHandheldTracks([...move, other], { scene: 'set', camera: 'cam', start: 0, end: 1000, amount: 0.02 })
    expect(shaken).toHaveLength(3)
    const shakenPosition = shaken.find((t) => t.property === 'position')!
    expect(shakenPosition.keyframes.map((k) => k.time)).toEqual(move[0].keyframes.map((k) => k.time))
    expect(shakenPosition.keyframes[2].value).not.toEqual(move[0].keyframes[2].value)
  })
})
