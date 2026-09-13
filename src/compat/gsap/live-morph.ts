import { isPathData, shapeToPathData } from '../../engine'
import { morphShapeOf } from './morph-vars'

/**
 * The DOM side of `morphSVG` for the live runtime: reading shapes off the page.
 * Everything here runs once, when a tween is built — never per frame.
 */

const isElement = (value: unknown): value is Element =>
  typeof value === 'object' && value !== null && (value as Node).nodeType === 1

function attributesOf(element: Element): Record<string, string> {
  const attributes: Record<string, string> = {}
  for (const attribute of Array.from(element.attributes)) attributes[attribute.name] = attribute.value
  return attributes
}

/**
 * The path data an element currently draws: its own geometry if it is a basic
 * SVG shape, otherwise the first `<path>` inside it (which is what the DOM
 * adapter animates for wrapper elements). Null when there is none.
 */
export function pathDataOf(element: Element | null | undefined): string | null {
  if (!element) return null
  const own = shapeToPathData({ tag: element.localName, attributes: attributesOf(element) })
  if (own) return own
  const inner = element.querySelector('path')
  return inner?.getAttribute('d') ?? null
}

/** Resolve a `morphSVG` value (path data, selector, element, or `{ shape }`) to path data. */
export function resolveMorphShape(
  value: unknown,
  query: (selector: string) => Element | null,
  warn: (message: string) => void
): string {
  const shape = morphShapeOf(value)
  if (typeof shape === 'string' && isPathData(shape)) return shape

  const element = isElement(shape) ? shape : typeof shape === 'string' ? query(shape) : null
  const data = pathDataOf(element)
  if (!data) {
    warn(`gsap-compat: morphSVG could not find a shape for "${String(shape)}"`)
    return ''
  }
  return data
}

const GEOMETRY_ATTRIBUTES = new Set(['cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'x1', 'y1', 'x2', 'y2', 'points'])

/**
 * Replace basic SVG shapes (circle, ellipse, rect, line, polyline, polygon) with
 * equivalent `<path>` elements, keeping every other attribute (class, fill,
 * style…). A `<circle>` has no `d` to animate; after this it does. Paths and
 * non-shapes are left alone. Returns the resulting elements, in order.
 *
 * This changes the document, so it is an explicit call — like GSAP's
 * `MorphSVGPlugin.convertToPath`.
 */
export function convertToPath(
  targets: string | Element | ArrayLike<Element>,
  root: ParentNode = document
): Element[] {
  const elements =
    typeof targets === 'string'
      ? Array.from(root.querySelectorAll(targets))
      : isElement(targets)
        ? [targets]
        : Array.from(targets)

  return elements.map((element) => {
    if (element.localName === 'path') return element
    const data = shapeToPathData({ tag: element.localName, attributes: attributesOf(element) })
    if (!data || !element.parentNode) return element

    const path = element.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'path')
    for (const attribute of Array.from(element.attributes)) {
      if (!GEOMETRY_ATTRIBUTES.has(attribute.name)) path.setAttribute(attribute.name, attribute.value)
    }
    path.setAttribute('d', data)
    element.parentNode.replaceChild(path, element)
    return path
  })
}
