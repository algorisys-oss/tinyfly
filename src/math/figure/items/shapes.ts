import type { Vec2 } from '../../linear/vec2'

/** Points round an ellipse centred at (cx, cy), world units, closed by the caller. */
export function ellipsePoints(cx: number, cy: number, rx: number, ry: number, samples = 64): Vec2[] {
  return Array.from({ length: samples }, (_, k): Vec2 => {
    const angle = (k / samples) * 2 * Math.PI
    return [cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)]
  })
}
