import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { Timeline } from '../engine/core/timeline'
import { loadScene3D, drawScene3D, type Scene3D } from '../scene-3d'
import { characterScript3D, checkCharacterBeats3D } from './character-script-3d'
import { characterObjects } from './scene-objects'
import { humanGaitStrideLength } from './species/human-motion'
import { HUMAN_POSES } from './species/human'

const stateOf = (result: ReturnType<typeof characterScript3D>, target: string) => {
  const timeline = new Timeline({ id: 't', tracks: result.tracks })
  return (time: number) => Object.fromEntries(timeline.getStateAtTime(time).values.get(target) ?? []) as Record<string, number | string>
}

describe('characterScript3D', () => {
  it('walks to a point with its gait in step with the distance, so its feet stay planted', () => {
    const result = characterScript3D('tum', [{ do: 'walk', to: [4, 3] }], { scene: 's', position: [0, 0], heading: 53.13 })
    const state = stateOf(result, 's/tum')
    const stride = humanGaitStrideLength('walk', 1.7)
    for (let time = 0; time <= result.duration; time += 61) {
      const now = state(time)
      expect((now.walk as number) * stride).toBeCloseTo(Math.hypot(now.x as number, now.z as number), 6)
    }
    const end = state(result.duration)
    expect(end.x).toBeCloseTo(4)
    expect(end.z).toBeCloseTo(3)
    expect(end.walking).toBeCloseTo(0)
    expect(state(result.duration / 2).walking).toBeCloseTo(1)
    expect(state(result.duration / 2).gait).toBe('walk')
    // At a walk's pace: 5 m in about 5 / 1.3 s.
    expect(result.duration).toBeCloseTo((5 / 1.3) * 1000, -2)
  })

  it('runs faster than it walks, and a taller character covers more ground per stride', () => {
    const walk = characterScript3D('a', [{ do: 'walk', to: [0, 10] }], { scene: 's' })
    const run = characterScript3D('a', [{ do: 'run', to: [0, 10] }], { scene: 's' })
    expect(run.duration).toBeLessThan(walk.duration / 2)
    expect(humanGaitStrideLength('walk', 2)).toBeGreaterThan(humanGaitStrideLength('walk', 1.7))
  })

  it('poses, plays gags and faces things, keying only what changes', () => {
    const result = characterScript3D('tum', [{ do: 'pose', pose: 'wave' }, { do: 'face', toward: [-1, 0] }, { do: 'gag', gag: 'take' }], { scene: 's', heading: 0 })
    const state = stateOf(result, 's/tum')
    expect(state(result.beats[0].end)['arm.right.spread']).toBeCloseTo(HUMAN_POSES.wave['arm.right.spread'])
    expect(state(result.beats[1].end).rotateY).toBeCloseTo(-90)
    expect(result.beats[2].end).toBeGreaterThan(result.beats[2].start + 500)
    expect(result.tracks.find((t) => t.property === 'arm.left.knee')).toBeUndefined()
  })

  it('the character object steps its legs from walk and walking, on the pose it holds', () => {
    const scene: Scene3D = {
      id: 's',
      camera: 'cam',
      background: '#ffffff',
      objects: [
        { id: 'cam', kind: 'camera', projection: 'perspective', fov: 40, near: 0.1, far: 50, position: [5, 1, 0], lookAt: [0, 0.9, 0] },
        { id: 'tum', kind: 'character' },
      ],
    }
    const draw = (values: Record<string, number | string>) => {
      const ctx = createCanvas(160, 120).getContext('2d') as unknown as CanvasRenderingContext2D
      drawScene3D(ctx, loadScene3D(scene, { kinds: [characterObjects] }), new Map([['s/tum', new Map(Object.entries(values))]]), { width: 160, height: 120 })
      return ctx.getImageData(0, 0, 160, 120).data
    }
    const differ = (a: Uint8ClampedArray, b: Uint8ClampedArray) => a.some((v, i) => v !== b[i])
    const still = draw({})
    expect(differ(still, draw({ walk: 0.25, walking: 0 }))).toBe(false)
    expect(differ(still, draw({ walk: 0.25, walking: 1 }))).toBe(true)
    expect(differ(draw({ walk: 0.25, walking: 1 }), draw({ walk: 0.25, walking: 1, gait: 'run' }))).toBe(true)
  })

  it('checks its beats, naming what was probably meant', () => {
    expect(checkCharacterBeats3D([{ do: 'wlak', to: [1, 1] }])[0].message).toMatch(/did you mean "walk"/)
    expect(checkCharacterBeats3D([{ do: 'wave' }])[0].message).toMatch(/did you mean "pose"/)
    expect(checkCharacterBeats3D([{ do: 'take' }])[0].message).toMatch(/did you mean "gag"/)
    expect(checkCharacterBeats3D([{ do: 'turn', toward: 90 }])[0].message).toMatch(/did you mean "face"/)
    expect(checkCharacterBeats3D([{ do: 'pose', pose: 'wav' }])[0].message).toMatch(/did you mean "wave"/)
    expect(checkCharacterBeats3D([{ do: 'run', to: 3 }])[0].message).toMatch(/\[x, z\] metres/)
    expect(() => characterScript3D('t', [{ do: 'wlak', to: [1, 1] }], { scene: 's' })).toThrow(/beat 0/)
  })
})
