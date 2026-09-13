import { isPathData, pointsToPath, type MotionPathConfig, type PathPoint } from '../../engine'

/**
 * GSAP's `motionPath` tween option, desugared to a motion-path track.
 *
 *     tl.to('dot', { motionPath: { path: 'M0 0 C…', autoRotate: true }, duration: 2 })
 *     tl.to('dot', { motionPath: [{ x: 0, y: 0 }, { x: 100, y: 50 }, { x: 200, y: 0 }] })
 *
 * The facade only accepts data here — path data or points. The live runtime
 * additionally resolves a selector or element to its path data (and computes
 * `matrix` for `align`) before handing the result on, so nothing in the
 * compiler ever touches the DOM.
 */

export type MotionPathMatrix = [number, number, number, number, number, number]

export interface MotionPathVars {
  /** SVG path data, or points to pass through */
  path: string | PathPoint[]
  /** For points: 0 = straight lines, 1 = natural curve (default), more = bowed */
  curviness?: number
  /** Rotate to follow the path. A number also rotates, offset by that many degrees. */
  autoRotate?: boolean | number
  /** Where along the path to start, 0–1 (default 0) */
  start?: number
  /** Where along the path to end, 0–1 (default 1) */
  end?: number
  /** Place the path in the follower's space; normally computed by `live` for `align` */
  matrix?: MotionPathMatrix
}

/** What `motionPath:` may be set to: shorthand path data or points, or the full object. */
export type MotionPathValue = string | PathPoint[] | MotionPathVars

export interface CompiledMotionPath {
  config: MotionPathConfig
  start: number
  end: number
}

/** Normalise any accepted `motionPath` value. Throws with a useful message otherwise. */
export function compileMotionPath(value: unknown): CompiledMotionPath {
  const vars: MotionPathVars =
    typeof value === 'string' || Array.isArray(value)
      ? { path: value as string | PathPoint[] }
      : (value as MotionPathVars)

  if (!vars || (typeof vars.path !== 'string' && !Array.isArray(vars.path))) {
    throw new Error('gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.')
  }

  let pathData: string
  if (Array.isArray(vars.path)) {
    pathData = pointsToPath(vars.path, { curviness: vars.curviness })
  } else if (isPathData(vars.path)) {
    pathData = vars.path
  } else {
    throw new Error(
      `gsap-compat: motionPath "${vars.path}" is not path data. Selectors and elements ` +
        'are resolved by live.to(); timeline() and tf need the path data itself.'
    )
  }

  const config: MotionPathConfig = { pathData }
  if (vars.autoRotate !== undefined && vars.autoRotate !== false) {
    config.autoRotate = true
    if (typeof vars.autoRotate === 'number') config.rotateOffset = vars.autoRotate
  }
  if (vars.matrix) config.matrix = vars.matrix

  return { config, start: vars.start ?? 0, end: vars.end ?? 1 }
}

/** The same motion path travelled the other way — what `from()` animates. */
export function reverseMotionPath(value: unknown): MotionPathVars {
  const vars: MotionPathVars =
    typeof value === 'string' || Array.isArray(value)
      ? { path: value as string | PathPoint[] }
      : { ...(value as MotionPathVars) }
  return { ...vars, start: vars.end ?? 1, end: vars.start ?? 0 }
}
