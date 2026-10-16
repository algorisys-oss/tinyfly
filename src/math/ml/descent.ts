import { evaluate, type Scope } from '../expr/evaluate'
import { parseExpression, type Expression } from '../expr/parse-expression'
import { differentiate } from '../expr/differentiate'
import type { Vec2 } from '../linear/vec2'

/**
 * Gradient descent on f(x, y), with the gradient worked out symbolically:
 * each step moves against the gradient by `rate`, plus `momentum` times the
 * last step. Returns every point visited, the start first. Stops early if a
 * step leaves the real numbers (a rate too large can diverge).
 */
export function descentPath(expr: string, start: Vec2, rate: number, steps: number, momentum = 0, scope: Scope = {}): Vec2[] {
  const f = parseExpression(expr)
  const dfdx = differentiate(f, 'x')
  const dfdy = differentiate(f, 'y')
  const grad = (x: number, y: number): Vec2 => {
    const at = { ...scope, x, y }
    return [evaluate(dfdx, at), evaluate(dfdy, at)]
  }
  const path: Vec2[] = [start]
  let velocity: Vec2 = [0, 0]
  for (let k = 0; k < steps; k++) {
    const [x, y] = path[path.length - 1]
    const [gx, gy] = grad(x, y)
    velocity = [momentum * velocity[0] - rate * gx, momentum * velocity[1] - rate * gy]
    const next: Vec2 = [x + velocity[0], y + velocity[1]]
    if (!Number.isFinite(next[0]) || !Number.isFinite(next[1]) || Math.abs(next[0]) > 1e6 || Math.abs(next[1]) > 1e6) break
    path.push(next)
  }
  return path
}

/** A parsed f(x, y) to evaluate many times. */
export function surface(expr: string): (x: number, y: number, scope?: Scope) => number {
  const tree: Expression = parseExpression(expr)
  return (x, y, scope = {}) => evaluate(tree, { ...scope, x, y })
}
