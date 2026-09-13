/**
 * Layout reads the live runtime makes when a tween or interaction is set up.
 * Never called per frame.
 */

/** An element's box as laid out, ignoring its own transform (which animation owns). */
export function layoutRect(element: Element): DOMRect {
  const style = (element as HTMLElement).style
  if (!style) return element.getBoundingClientRect()
  const previous = style.transform
  style.transform = 'none'
  const rect = element.getBoundingClientRect()
  style.transform = previous
  return rect
}
