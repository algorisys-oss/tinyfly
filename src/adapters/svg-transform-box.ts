/**
 * Make CSS transforms on an SVG element pivot around the element itself.
 *
 * SVG content transforms about its user-space origin (the SVG's top-left) by
 * default, so `rotate: 90` on a rect swings it around the corner of the whole
 * drawing, while the same animation on an HTML element or a canvas shape turns
 * it in place. Setting `transform-box: fill-box` with a centre origin makes all
 * three agree, which is also what GSAP does for SVG.
 *
 * Only applied when the author has not set a transform box: an explicit origin
 * (inline style, or an origin track) always wins.
 */
export function ensureSvgTransformBox(element: Element): void {
  // SVG content elements have an `ownerSVGElement` property (null for the root
  // <svg> itself); HTML elements do not. Avoids `instanceof`, which needs a DOM.
  if (!('ownerSVGElement' in element)) return
  const style = (element as SVGElement).style
  if (!style || style.transformBox) return
  style.transformBox = 'fill-box'
  if (!style.transformOrigin) style.transformOrigin = '50% 50%'
}
