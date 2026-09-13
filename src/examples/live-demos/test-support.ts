/**
 * Test support for live demos: happy-dom has no layout or SVG geometry, and
 * many demos only move in response to input. These helpers fill both gaps.
 */

/**
 * happy-dom has no SVG geometry (`getTotalLength` is missing or returns 0); give
 * lines a length so draw-on demos can run.
 */
export function stubSvgGeometry(): void {
  const scope = globalThis as unknown as Record<string, { prototype: object } | undefined>
  for (const name of ['SVGElement', 'SVGGeometryElement', 'SVGPathElement', 'SVGCircleElement']) {
    const proto = scope[name]?.prototype as { getTotalLength?: () => number } | undefined
    if (proto) proto.getTotalLength = () => 200
  }
}

/**
 * Poke every element with the input demos listen for: pointer enter, a
 * press-and-drag, clicks and scrolls. Dispatched without bubbling, once per element, so each
 * listener sees one event.
 */
export function exercise(root: Element): void {
  for (const el of [root, ...root.querySelectorAll('*')]) {
    el.dispatchEvent(new PointerEvent('pointerenter', { clientX: 30, clientY: 30 }))
    // A drag in progress, for draggable demos: press and move. No release —
    // with no layout here a throw has nowhere to go, and releasing in the same
    // instant would cancel the press feedback before a frame is drawn.
    el.dispatchEvent(new PointerEvent('pointerdown', { clientX: 10, clientY: 10 }))
    el.dispatchEvent(new PointerEvent('pointermove', { clientX: 30, clientY: 30 }))
    ;(el as HTMLElement).scrollTop = 40
    el.dispatchEvent(new Event('scroll'))
    el.dispatchEvent(new MouseEvent('click'))
  }
}

/** Everything a demo can change about its markup: styles, and attributes like an SVG path's `d`. */
export function snapshot(root: Element): string {
  return root.innerHTML
}
