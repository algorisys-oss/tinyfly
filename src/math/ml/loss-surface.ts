import type { Track } from '../../engine/types'
import type { Vec2 } from '../linear/vec2'
import { colorAt, type Colormap } from './colormap'
import { descentPath, surface } from './descent'

/**
 * A loss surface in 3D, as plain scene JSON for `@algorisys/tinyfly/scene-3d`:
 * f(x, y) as a coloured mesh, a ball rolling down it by gradient descent
 * (the same exact-gradient path the 2D `descent` item draws), the path
 * appearing behind it, and an optional slow camera orbit.
 *
 *     const loss = lossSurface3D({ expr: '(x^2 + 3 y^2) / 4', start: [-2.6, 1.8], rate: 0.25 })
 *     const scene = loadScene3D(loss.scene)              // from @algorisys/tinyfly/scene-3d
 *     const timeline = new Timeline({ id: 'loss', config: { duration: loss.duration }, tracks: loss.tracks })
 *     drawScene3D(ctx, scene, timeline.getStateAtTime(t).values, { width, height })
 *
 * The maths module does not import scene-3d: the scene is data in its
 * format (metres, y up), so it loads anywhere scene-3d does, Node included.
 * Pure: the same options always give the same scene and tracks.
 */
export interface LossSurfaceOptions {
  /** f(x, y), an expression (number values come from `scope`) */
  expr: string
  /** The x and y ranges shown (default [[-3, 3], [-3, 3]]) */
  region?: [[number, number], [number, number]]
  /** Grid cells per side (default 36) */
  resolution?: number
  /** Height of the highest point above the lowest, metres (default 1.6); the region spans 5 m */
  height?: number
  /** Where descent starts, and its rate and momentum */
  start: Vec2
  rate: number
  momentum?: number
  /** Steps taken (default 40) and how long each takes, ms (default 250) */
  steps?: number
  stepDuration?: number
  /** Degrees the camera turns round the surface over the whole run (default 50; 0 for a fixed camera) */
  orbit?: number
  colormap?: Colormap
  /** Scene id: tracks address objects as `<id>/<object>` (default `loss`) */
  id?: string
  background?: string
  scope?: Record<string, number>
}

type Vec3 = [number, number, number]

/** The scene objects this builds, in scene-3d's format. */
export type LossSceneObject =
  | { id: string; kind: 'group'; position?: Vec3; rotation?: Vec3 }
  | { id: string; kind: 'camera'; parent?: string; projection: 'perspective'; fov: number; near: number; far: number; position: Vec3; lookAt: Vec3 }
  | { id: string; kind: 'light'; light: 'ambient' | 'directional'; color: string; intensity: number; position?: Vec3 }
  | { id: string; kind: 'mesh'; material: string; position?: Vec3; geometry: { type: 'mesh'; positions: number[]; indices: number[]; colors: string[] } | { type: 'sphere'; radius: number; segments?: number } }
  | { id: string; kind: 'line'; points: Vec3[]; color: string; width?: number; visible?: boolean }

export interface LossSurfaceScene {
  id: string
  camera: string
  background: string
  materials: Record<string, { color: string; shading?: 'unlit' | 'flat' | 'lambert' | 'toon'; doubleSided?: boolean; creases?: boolean; outline?: { width: number; color: string } }>
  objects: LossSceneObject[]
}

export interface LossSurface3D {
  scene: LossSurfaceScene
  /** The ball's position, the path appearing, the camera's orbit */
  tracks: Track[]
  /** ms, until the ball has finished */
  duration: number
  /** The descent path in the function's own (x, y) */
  path: Vec2[]
  /** f along the path */
  losses: number[]
}

export function lossSurface3D(options: LossSurfaceOptions): LossSurface3D {
  const id = options.id ?? 'loss'
  const [[x0, x1], [y0, y1]] = options.region ?? [[-3, 3], [-3, 3]]
  const n = Math.max(4, Math.min(120, Math.round(options.resolution ?? 36)))
  const span = 5
  const f = surface(options.expr)
  const scope = options.scope ?? {}
  const value = (x: number, y: number) => f(x, y, scope)

  // Heights over the grid, scaled so the surface rises `height` metres.
  const grid = Array.from({ length: n + 1 }, (_, j) => Array.from({ length: n + 1 }, (_, i) => value(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * j) / n)))
  const finite = grid.flat().filter(Number.isFinite)
  const low = Math.min(...finite)
  const high = Math.max(...finite)
  const rise = options.height ?? 1.6
  const level = (v: number) => (high === low ? 0 : (Math.min(high, Math.max(low, v)) - low) / (high - low))
  /** The function's (x, y) and value to scene metres: x right, f up, y away from the camera. */
  const toScene = (x: number, y: number, v: number, lift = 0): Vec3 => [
    ((x - x0) / (x1 - x0) - 0.5) * span,
    level(v) * rise + lift,
    -((y - y0) / (y1 - y0) - 0.5) * span,
  ]

  const positions: number[] = []
  const colors: string[] = []
  for (let j = 0; j <= n; j++) {
    for (let i = 0; i <= n; i++) {
      const v = grid[j][i]
      positions.push(...toScene(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * j) / n, Number.isFinite(v) ? v : high))
      colors.push(colorAt(options.colormap ?? 'viridis', level(v)))
    }
  }
  // Two triangles per cell, counter-clockwise seen from above.
  const indices: number[] = []
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const a = j * (n + 1) + i
      const b = a + 1
      const c = a + n + 1
      const d = c + 1
      indices.push(a, b, c, b, d, c)
    }
  }

  const steps = Math.max(1, Math.round(options.steps ?? 40))
  const path = descentPath(options.expr, options.start, options.rate, steps, options.momentum ?? 0, scope)
  const losses = path.map(([x, y]) => value(x, y))
  const ballRadius = 0.09
  // Lifted a little, so the surface's own facets never cover the path.
  const onSurface = path.map(([x, y], k) => toScene(x, y, losses[k], 0.06))
  const stepDuration = options.stepDuration ?? 250
  const lead = 600
  const duration = lead + (path.length - 1) * stepDuration + 800

  const objects: LossSceneObject[] = [
    { id: 'rig', kind: 'group', rotation: [0, 0, 0] },
    { id: 'cam', kind: 'camera', parent: 'rig', projection: 'perspective', fov: 40, near: 0.1, far: 60, position: [0, rise + 3.6, 6.4], lookAt: [0, rise * 0.25, 0] },
    { id: 'sky', kind: 'light', light: 'ambient', color: '#ffffff', intensity: 0.45 },
    { id: 'sun', kind: 'light', light: 'directional', color: '#ffffff', intensity: 0.85, position: [3, 6, 4] },
    { id: 'surface', kind: 'mesh', material: 'surface', geometry: { type: 'mesh', positions, indices, colors } },
    // One short line per step, shown as the ball passes it.
    // One piece per step, shown as the ball passes it; each follows the surface between its ends
    // (a straight line between two points on a curved surface would dip under it).
    ...path.slice(1).map(([x, y], k): LossSceneObject => {
      const [px, py] = path[k]
      const points = Array.from({ length: 10 }, (_, s): Vec3 => {
        const t = s / 9
        const sx = px + (x - px) * t
        const sy = py + (y - py) * t
        return toScene(sx, sy, value(sx, sy), 0.06)
      })
      return { id: `path${k}`, kind: 'line', points, color: '#fc6255', width: 0.05, visible: false }
    }),
    { id: 'ball', kind: 'mesh', material: 'ball', position: [onSurface[0][0], onSurface[0][1] + ballRadius, onSurface[0][2]], geometry: { type: 'sphere', radius: ballRadius, segments: 16 } },
  ]

  const tracks: Track[] = [
    {
      id: `${id}-ball`, target: `${id}/ball`, property: 'position',
      // Four keys per step, on the surface, so the ball rides over bumps rather than through them.
      keyframes: path.flatMap(([x, y], k) => {
        if (k === 0) return [{ time: lead, value: [onSurface[0][0], onSurface[0][1] + ballRadius, onSurface[0][2]] }]
        const [px, py] = path[k - 1]
        return [1, 2, 3, 4].map((q) => {
          const sx = px + ((x - px) * q) / 4
          const sy = py + ((y - py) * q) / 4
          const [bx, by, bz] = toScene(sx, sy, value(sx, sy), 0.06)
          return { time: lead + (k - 1 + q / 4) * stepDuration, value: [bx, by + ballRadius, bz] }
        })
      }),
    },
    ...onSurface.slice(1).map((_, k): Track => ({
      id: `${id}-path${k}`, target: `${id}/path${k}`, property: 'visible',
      keyframes: [{ time: 0, value: 0 }, { time: lead + (k + 1) * stepDuration - 1, value: 0 }, { time: lead + (k + 1) * stepDuration, value: 1 }],
    })),
  ]
  const orbit = options.orbit ?? 50
  if (orbit !== 0) {
    tracks.push({ id: `${id}-orbit`, target: `${id}/rig`, property: 'rotateY', keyframes: [{ time: 0, value: -orbit / 2 }, { time: duration, value: orbit / 2, easing: 'ease-in-out' }] })
  }

  return {
    scene: {
      id,
      camera: 'cam',
      background: options.background ?? '#0f1117',
      materials: {
        surface: { color: '#ffffff', shading: 'lambert', doubleSided: true, creases: false },
        ball: { color: '#ffd75e', shading: 'toon', outline: { width: 2, color: '#0f1117' } },
      },
      objects,
    },
    tracks,
    duration,
    path,
    losses,
  }
}
