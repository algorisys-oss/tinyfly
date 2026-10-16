import { describe, it, expect } from 'vitest'
import { lossSurface3D } from './loss-surface'
import { loadScene3D } from '../../scene-3d'
import { deserializeTimeline } from '../../engine'

describe('lossSurface3D', () => {
  const loss = lossSurface3D({ expr: '(x^2 + 4 y^2) / 4', start: [-2.5, 2], rate: 0.2, steps: 20, resolution: 12 })

  it('builds a scene scene-3d loads: a coloured surface mesh, path pieces and a ball', () => {
    const scene = loadScene3D(loss.scene as never)
    expect(scene).toBeTruthy()
    const surface = loss.scene.objects.find((o) => o.id === 'surface')!
    expect(surface.kind === 'mesh' && surface.geometry.type === 'mesh' && surface.geometry.positions.length).toBe(13 * 13 * 3)
    expect(surface.kind === 'mesh' && surface.geometry.type === 'mesh' && surface.geometry.indices.length).toBe(12 * 12 * 6)
    expect(surface.kind === 'mesh' && surface.geometry.type === 'mesh' && surface.geometry.colors[0]).toMatch(/^#[0-9a-f]{6}$/)
    expect(loss.scene.objects.filter((o) => o.id.startsWith('path'))).toHaveLength(loss.path.length - 1)
  })

  it('rolls the ball downhill along the descent path and reveals the path behind it', () => {
    for (let k = 1; k < loss.losses.length; k++) expect(loss.losses[k]).toBeLessThanOrEqual(loss.losses[k - 1] + 1e-12)
    const timeline = deserializeTimeline({ id: 'loss', config: { duration: loss.duration }, tracks: loss.tracks })
    const ballY = (t: number) => (timeline.getStateAtTime(t).values.get('loss/ball')!.get('position') as number[])[1]
    expect(ballY(loss.duration)).toBeLessThan(ballY(0))
    const shown = (t: number) => timeline.getStateAtTime(t).values.get('loss/path0')!.get('visible')
    expect(shown(0)).toBe(0)
    expect(shown(loss.duration)).toBe(1)
  })

  it('is the same every time', () => {
    expect(lossSurface3D({ expr: '(x^2 + 4 y^2) / 4', start: [-2.5, 2], rate: 0.2, steps: 20, resolution: 12 })).toEqual(loss)
  })
})
