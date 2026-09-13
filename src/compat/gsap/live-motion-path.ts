import { isPathData, shapeToPathData, type PathPoint } from '../../engine'
import type { MotionPathMatrix, MotionPathVars } from './motion-path-vars'
import { layoutRect } from './layout'

/**
 * `motionPath` as the live runtime accepts it: everything the compiler accepts,
 * plus a selector or element for the path, and GSAP's `align`.
 *
 *     live.to('.plane', { motionPath: { path: '#route', align: '#route', autoRotate: true }, duration: 3 })
 *
 * This is the one place a motion path reads the DOM, and it does so once, when
 * the tween is built: the path element's geometry becomes path data, and
 * `align` becomes a matrix. What reaches the compiler is plain data.
 */

export interface LiveMotionPathVars extends Omit<MotionPathVars, 'path'> {
  /** Path data, points, or a selector / element for a path, circle, ellipse, rect, line, polyline or polygon */
  path: string | Element | PathPoint[]
  /**
   * Lay the path over an element on the page, so the follower moves along it
   * where it is drawn. `true` aligns to the path element itself. Without it,
   * path coordinates are x/y offsets from where the follower already sits.
   */
  align?: boolean | string | Element
  /** The point of the follower that sits on the path, as fractions of its size (default [0.5, 0.5]) */
  alignOrigin?: [number, number]
}

export interface LiveMotionPathContext {
  /** Resolve a selector the way the stage does (scoped to its root) */
  query(selector: string): Element | null
  /** The elements the tween animates; the first one's layout is measured for `align` */
  targets: Element[]
  warn(message: string): void
}

const isElement = (value: unknown): value is Element =>
  typeof value === 'object' && value !== null && (value as Node).nodeType === 1

function attributesOf(element: Element): Record<string, string> {
  const attributes: Record<string, string> = {}
  for (const attribute of Array.from(element.attributes)) attributes[attribute.name] = attribute.value
  return attributes
}

/** Maps the align element's own coordinates to viewport pixels. */
function screenMatrixOf(element: Element): MotionPathMatrix {
  const ctm = (element as SVGGraphicsElement).getScreenCTM?.()
  if (ctm) return [ctm.a, ctm.b, ctm.c, ctm.d, ctm.e, ctm.f]
  // An HTML element: its coordinates are pixels from its top-left corner.
  const rect = element.getBoundingClientRect()
  return [1, 0, 0, 1, rect.left, rect.top]
}

/** Resolve a live `motionPath` value to the plain data the compiler accepts. */
export function resolveLiveMotionPath(value: unknown, context: LiveMotionPathContext): MotionPathVars {
  const vars: LiveMotionPathVars =
    typeof value === 'string' || Array.isArray(value) || isElement(value)
      ? { path: value as LiveMotionPathVars['path'] }
      : (value as LiveMotionPathVars)
  const { align, alignOrigin, path, ...rest } = vars

  const lookup = (ref: string | Element): Element | null => {
    const element = isElement(ref) ? ref : context.query(ref)
    if (!element) context.warn(`gsap-compat: motionPath could not find "${String(ref)}"`)
    return element
  }

  // The path: data and points pass straight through; anything else is an element.
  let pathElement: Element | null = null
  let resolvedPath: string | PathPoint[] = ''
  if (Array.isArray(path) || (typeof path === 'string' && isPathData(path))) {
    resolvedPath = path
  } else {
    pathElement = lookup(path)
    const data = pathElement && shapeToPathData({ tag: pathElement.localName, attributes: attributesOf(pathElement) })
    if (pathElement && !data) {
      context.warn(`gsap-compat: motionPath element <${pathElement.localName}> has no path geometry`)
    }
    resolvedPath = data ?? ''
  }

  const resolved: MotionPathVars = { ...rest, path: resolvedPath }
  if (align === undefined || align === false) return resolved

  const alignElement = align === true ? pathElement : lookup(align)
  if (!alignElement) {
    if (align === true) context.warn('gsap-compat: motionPath align: true needs the path to be an element')
    return resolved
  }

  const follower = context.targets[0]
  if (!follower) return resolved

  const [a, b, c, d, e, f] = screenMatrixOf(alignElement)
  const box = layoutRect(follower)
  const [originX, originY] = alignOrigin ?? [0.5, 0.5]

  // Several followers share one matrix, so they must start from the same place.
  for (const other of context.targets.slice(1)) {
    const otherBox = layoutRect(other)
    if (Math.abs(otherBox.left - box.left) > 0.5 || Math.abs(otherBox.top - box.top) > 0.5) {
      context.warn('gsap-compat: motionPath align measures the first target; the others are laid out elsewhere')
      break
    }
  }

  resolved.matrix = [a, b, c, d, e - box.left - originX * box.width, f - box.top - originY * box.height]
  return resolved
}
