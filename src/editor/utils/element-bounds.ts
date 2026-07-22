import type { SceneElement, LineElement, ArrowElement } from '../stores/scene-store'

/** Axis-aligned bounding box of a set of elements, in canvas coordinates. */
export function elementsBounds(elements: SceneElement[]): {
  x: number
  y: number
  width: number
  height: number
} {
  if (elements.length === 0) return { x: 0, y: 0, width: 0, height: 0 }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const el of elements) {
    // Line/arrow are defined by two endpoints (x,y)–(x2,y2), not a box.
    if (el.type === 'line' || el.type === 'arrow') {
      const l = el as LineElement | ArrowElement
      minX = Math.min(minX, l.x, l.x2)
      minY = Math.min(minY, l.y, l.y2)
      maxX = Math.max(maxX, l.x, l.x2)
      maxY = Math.max(maxY, l.y, l.y2)
    } else {
      minX = Math.min(minX, el.x)
      minY = Math.min(minY, el.y)
      maxX = Math.max(maxX, el.x + el.width)
      maxY = Math.max(maxY, el.y + el.height)
    }
  }

  return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) }
}

/**
 * Translate an element by (dx, dy). Mutates and returns the element — pass a
 * clone if you don't want the original moved. Handles the line/arrow second
 * endpoint too.
 */
export function shiftElement<T extends SceneElement>(el: T, dx: number, dy: number): T {
  el.x += dx
  el.y += dy
  if (el.type === 'line' || el.type === 'arrow') {
    const l = el as unknown as LineElement | ArrowElement
    l.x2 += dx
    l.y2 += dy
  }
  return el
}
