import { describe, it, expect } from 'vitest'
import { getMotionPathPoint } from './motion-path'
import { pointsToPath, shapeToPathData } from './path-builders'
import { getPathLength, getPointAtProgress } from './path-utils'
import { Timeline } from '../core/timeline'
import { serializeTimeline, deserializeTimeline } from '../serialization'

const close = (actual: number, expected: number, tolerance = 0.01) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance)

describe('getMotionPathPoint with a matrix', () => {
  it('is the identity without one', () => {
    expect(getMotionPathPoint({ pathData: 'M0 0 L10 0' }, 0.5)).toEqual({ x: 5, y: 0, angle: 0 })
  })

  it('scales and translates points', () => {
    const p = getMotionPathPoint({ pathData: 'M0 0 L10 0', matrix: [2, 0, 0, 2, 100, 50] }, 0.5)
    expect([p.x, p.y]).toEqual([110, 50])
  })

  it('rotates the tangent along with the path', () => {
    // 90° rotation: a path heading right now heads down.
    const p = getMotionPathPoint({ pathData: 'M0 0 L10 0', matrix: [0, 1, -1, 0, 0, 0] }, 0.5)
    close(p.x, 0)
    close(p.y, 5)
    close(p.angle, 90)
  })

  it('mirrors the tangent when the matrix flips', () => {
    const p = getMotionPathPoint({ pathData: 'M0 0 L10 10', matrix: [1, 0, 0, -1, 0, 0] }, 0.5)
    close(p.angle, -45)
  })

  it('does not mutate cached path points', () => {
    const config = { pathData: 'M0 0 L10 0', matrix: [3, 0, 0, 3, 0, 0] as [number, number, number, number, number, number] }
    getMotionPathPoint(config, 0.5)
    expect(getPointAtProgress('M0 0 L10 0', 0.5).x).toBe(5)
  })

  it('survives a JSON round trip on a timeline', () => {
    const timeline = new Timeline({
      id: 't',
      tracks: [
        {
          id: 'mp',
          target: 'dot',
          property: 'motionPath',
          motionPathConfig: { pathData: 'M0 0 L10 0', matrix: [2, 0, 0, 2, 1, 1] },
          keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 1 }],
        },
      ],
    })
    const restored = deserializeTimeline(JSON.parse(JSON.stringify(serializeTimeline(timeline))))
    expect(restored.getStateAtTime(500).values.get('dot')?.get('motionPathX')).toBe(11)
  })
})

describe('pointsToPath', () => {
  const points = [{ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 0 }]

  it('passes through every point', () => {
    const d = pointsToPath(points)
    expect(getPointAtProgress(d, 0)).toMatchObject({ x: 0, y: 0 })
    expect(getPointAtProgress(d, 1)).toMatchObject({ x: 100, y: 0 })
    expect(d).toContain('50 50')
  })

  it('draws straight lines at curviness 0', () => {
    close(getPathLength(pointsToPath(points, { curviness: 0 })), 2 * Math.hypot(50, 50))
  })

  it('bows further as curviness grows', () => {
    const lengths = [0, 1, 2].map((curviness) => getPathLength(pointsToPath(points, { curviness })))
    expect(lengths[1]).toBeGreaterThan(lengths[0])
    expect(lengths[2]).toBeGreaterThan(lengths[1])
  })

  it('closes smoothly back to the start', () => {
    const d = pointsToPath(points, { closed: true })
    expect(d.endsWith('Z')).toBe(true)
    close(getPointAtProgress(d, 1).x, 0)
  })

  it('handles zero and one point', () => {
    expect(pointsToPath([])).toBe('')
    expect(pointsToPath([{ x: 3, y: 4 }])).toBe('M3 4')
  })
})

describe('shapeToPathData', () => {
  it('returns a path element\'s d', () => {
    expect(shapeToPathData({ tag: 'path', attributes: { d: 'M0 0 L1 1' } })).toBe('M0 0 L1 1')
  })

  it('converts a circle, starting at 3 o\'clock', () => {
    const d = shapeToPathData({ tag: 'circle', attributes: { cx: '50', cy: '50', r: '40' } })!
    close(getPathLength(d), 2 * Math.PI * 40, 0.5)
    expect(getPointAtProgress(d, 0)).toMatchObject({ x: 90, y: 50 })
  })

  it('converts an ellipse', () => {
    const d = shapeToPathData({ tag: 'ellipse', attributes: { cx: '0', cy: '0', rx: '20', ry: '10' } })!
    const p = getPointAtProgress(d, 0.25)
    close((p.x / 20) ** 2 + (p.y / 10) ** 2, 1, 0.01)
  })

  it('converts sharp and rounded rects', () => {
    close(getPathLength(shapeToPathData({ tag: 'rect', attributes: { width: '100', height: '50' } })!), 300)
    const rounded = shapeToPathData({ tag: 'rect', attributes: { width: '100', height: '50', rx: '10' } })!
    close(getPathLength(rounded), 300 - 80 + 2 * Math.PI * 10, 0.5)
  })

  it('clamps rect corner radii to half the size', () => {
    const d = shapeToPathData({ tag: 'rect', attributes: { width: '20', height: '20', rx: '50' } })!
    close(getPathLength(d), 2 * Math.PI * 10, 0.5)
  })

  it('converts lines, polylines and polygons', () => {
    expect(getPathLength(shapeToPathData({ tag: 'line', attributes: { x1: '0', y1: '0', x2: '3', y2: '4' } })!)).toBe(5)
    expect(getPathLength(shapeToPathData({ tag: 'polyline', attributes: { points: '0,0 10,0 10,10' } })!)).toBe(20)
    expect(getPathLength(shapeToPathData({ tag: 'polygon', attributes: { points: '0 0 10 0 10 10 0 10' } })!)).toBe(40)
  })

  it('returns null for unsupported elements or empty points', () => {
    expect(shapeToPathData({ tag: 'g', attributes: {} })).toBeNull()
    expect(shapeToPathData({ tag: 'polygon', attributes: { points: '' } })).toBeNull()
  })
})
