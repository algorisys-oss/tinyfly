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
 * Poke every element with the input demos listen for: pointer enter/move/leave,
 * clicks and scrolls. Dispatched without bubbling, once per element, so each
 * listener sees one event.
 */
export function exercise(root: Element): void {
  for (const el of [root, ...root.querySelectorAll('*')]) {
    el.dispatchEvent(new PointerEvent('pointerenter', { clientX: 30, clientY: 30 }))
    el.dispatchEvent(new PointerEvent('pointermove', { clientX: 30, clientY: 30 }))
    ;(el as HTMLElement).scrollTop = 40
    el.dispatchEvent(new Event('scroll'))
  }
}
