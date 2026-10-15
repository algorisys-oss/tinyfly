import type { Vec2 } from '../linear/vec2'
import type { MathFigureSpec } from './figure-spec'

/**
 * The mapping between world units (maths axes, y up) and the figure's pixels
 * (y down). Pure data plus two functions; no drawing.
 */
export interface Plane {
  width: number
  height: number
  x: [number, number]
  y: [number, number]
  /** px per world unit, horizontally and vertically */
  unitX: number
  unitY: number
  /** Line widths and text sizes are given at a 600 px figure; this scales them */
  scale: number
  toScreen(p: Vec2): Vec2
  toWorld(p: Vec2): Vec2
}

export function planeOf(spec: Pick<MathFigureSpec, 'width' | 'height' | 'x' | 'y'>): Plane {
  const { width, height } = spec
  const x = spec.x ?? [-5, 5]
  const unitX = width / (x[1] - x[0])
  const y: [number, number] = spec.y ?? [-(height / unitX) / 2, height / unitX / 2]
  const unitY = height / (y[1] - y[0])
  return {
    width,
    height,
    x,
    y,
    unitX,
    unitY,
    scale: Math.min(width, height) / 600,
    toScreen: ([wx, wy]) => [(wx - x[0]) * unitX, (y[1] - wy) * unitY],
    toWorld: ([sx, sy]) => [x[0] + sx / unitX, y[1] - sy / unitY],
  }
}
