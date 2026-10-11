import { describe, it, expect } from 'vitest'
import { Timeline } from '../engine/core/timeline'
import { characterLookAtTracks, objectPositionAt, stageSpots } from './staging-3d'
import { characterScript3D, lookFields } from './character-script-3d'

describe('looking at things in 3D', () => {
  it('turns the head toward a point, the eyes carrying what the head cannot', () => {
    const ahead = lookFields({ x: 0, z: 0, heading: 0, eyeHeight: 1.5 }, [0, 1.5, 5])
    expect(ahead['head.turn']).toBeCloseTo(0, 9)
    expect(ahead['head.nod']).toBeCloseTo(0, 9)
    const left = lookFields({ x: 0, z: 0, heading: 0, eyeHeight: 1.5 }, [5, 1.5, 5])
    expect(left['head.turn']).toBeCloseTo(45 * 0.75, 6)
    expect(left.lookX).toBeGreaterThan(0)
    const down = lookFields({ x: 0, z: 0, heading: 0, eyeHeight: 1.5 }, [0, 0, 3])
    expect(down['head.nod']).toBeGreaterThan(10)
    expect(down.lookY).toBeGreaterThan(0)
    // Facing +x (heading 90), a point at +x is straight ahead.
    expect(lookFields({ x: 0, z: 0, heading: 90, eyeHeight: 1.5 }, [5, 1.5, 0])['head.turn']).toBeCloseTo(0, 6)
    // Behind: the head turns as far as it goes.
    expect(Math.abs(lookFields({ x: 0, z: 0, heading: 0, eyeHeight: 1.5 }, [1, 1.5, -5])['head.turn']!)).toBe(70)
  })

  it('keeps a character looking at another as both move, and at the camera', () => {
    const a = characterScript3D('a', [{ do: 'walk', to: [4, 0] }], { scene: 's', position: [0, 0], heading: 90 })
    const b = characterScript3D('b', [{ do: 'hold', for: a.duration }], { scene: 's', position: [2, 4], heading: 180 })
    const tracks = [...a.tracks, ...b.tracks]
    const look = characterLookAtTracks(tracks, { scene: 's', character: 'b', at: { object: 'a' }, start: 0, end: a.duration, every: 100, objects: { a: [0, 0, 0], b: [2, 0, 4] } })
    expect(look.map((t) => t.property)).toEqual(['head.turn', 'head.nod', 'lookX', 'lookY'])
    const timeline = new Timeline({ id: 't', tracks: [...tracks, ...look] })
    const turnAt = (time: number) => timeline.getStateAtTime(time).values.get('s/b')?.get('head.turn') as number
    // b faces −z (heading 180) at (2, 4), so its left is −x: a starts at x 0, to b's left (+), and walks across to its right (−).
    expect(turnAt(0)).toBeGreaterThan(0)
    expect(turnAt(a.duration)).toBeLessThan(0)
    // The camera straight in front of b (which faces −z).
    const camera = characterLookAtTracks(tracks, { scene: 's', character: 'b', at: { camera: 'cam' }, start: 0, end: 500, objects: { b: [2, 0, 4], cam: [2, 1.53, -6] } })
    expect(camera[0].keyframes[0].value).toBeCloseTo(0, 6)
    const sampler = objectPositionAt(a.tracks, 's/a')
    expect(sampler(0)).toEqual([0, 0, 0])
    expect(sampler(a.duration)[0]).toBeCloseTo(4, 6)
  })

  it('say lip-syncs a line with a talking head, and look turns the head in a script', () => {
    const script = characterScript3D('a', [{ do: 'say', say: 'Hello there, friend!' }, { do: 'look', look: [3, 0] }, { do: 'look', look: 'camera', for: 300 }], { scene: 's', camera: [0, 1.6, 6] })
    expect(script.beats[0].end).toBe(20 * 65)
    const mouth = script.tracks.find((t) => t.property === 'mouth')!
    expect(mouth.keyframes.length).toBeGreaterThan(6)
    expect(Math.max(...mouth.keyframes.map((k) => k.value as number))).toBeGreaterThan(0.5)
    expect(script.tracks.some((t) => t.property === 'head.tilt')).toBe(true)
    const timeline = new Timeline({ id: 't', tracks: script.tracks })
    expect(timeline.getStateAtTime(script.beats[1].end).values.get('s/a')?.get('head.turn')).toBeGreaterThan(20)
    expect(timeline.getStateAtTime(script.beats[2].end).values.get('s/a')?.get('head.turn')).toBeCloseTo(0, 3)
    expect(() => characterScript3D('a', [{ do: 'say' }], { scene: 's' })).toThrow(/needs `say`/)
    expect(() => characterScript3D('a', [{ do: 'look' }], { scene: 's' })).toThrow(/needs `look`/)
  })
})

describe('stage spots', () => {
  const gap = (spots: Array<{ position: [number, number] }>) => Math.min(...spots.flatMap((a, i) => spots.slice(i + 1).map((b) => Math.hypot(a.position[0] - b.position[0], a.position[1] - b.position[1]))))

  it('place figures in a line, an arc, a circle or a cluster without overlap', () => {
    const line = stageSpots({ count: 3, spacing: 1.5 })
    expect(line.map((s) => s.position[0])).toEqual([-1.5, 0, 1.5])
    expect(line.every((s) => s.heading === 0)).toBe(true)
    const arc = stageSpots({ count: 5, shape: 'arc', spacing: 1.2 })
    expect(gap(arc)).toBeGreaterThan(1)
    expect(arc[0].heading).not.toBe(arc[4].heading)
    expect(arc[0].position[1]).toBeGreaterThan(arc[2].position[1])
    const circle = stageSpots({ count: 6, shape: 'circle', spacing: 1.2, centre: [1, 1] })
    expect(gap(circle)).toBeGreaterThan(1)
    // Each faces the middle.
    const first = circle[0]
    const toward = (Math.atan2(1 - first.position[0], 1 - first.position[1]) * 180) / Math.PI
    expect(((first.heading - toward) % 360 + 360) % 360).toBeCloseTo(0, 6)
    const cluster = stageSpots({ count: 6, shape: 'cluster', spacing: 1.2, seed: 3 })
    expect(cluster).toHaveLength(6)
    expect(gap(cluster)).toBeGreaterThan(0.6)
    expect(stageSpots({ count: 6, shape: 'cluster', spacing: 1.2, seed: 3 })).toEqual(cluster)
    expect(stageSpots({ count: 1 })).toEqual([{ position: [0, 0], heading: 0 }])
  })
})
