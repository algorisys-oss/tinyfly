import type { AnimationState, AnimatableValue } from '../../engine/types'
import { FILTER_PROPERTIES, composeFilter, type FilterValues } from '../filter-utils'
import { shineStops } from '../shine-utils'
import { setTextContent } from '../text-content'
import { ensureSvgTransformBox } from '../svg-transform-box'

const SVG_NS = 'http://www.w3.org/2000/svg'

/** SVG attributes that should be set directly */
const SVG_ATTRIBUTES = new Set([
  'fill',
  'stroke',
  'd',
  'points',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'width',
  'height',
  'viewBox',
  'preserveAspectRatio',
])

/** Properties that map to hyphenated SVG attributes */
const ATTRIBUTE_MAP: Record<string, string> = {
  strokeWidth: 'stroke-width',
  strokeLinecap: 'stroke-linecap',
  strokeLinejoin: 'stroke-linejoin',
  strokeDasharray: 'stroke-dasharray',
  strokeDashoffset: 'stroke-dashoffset',
  fillRule: 'fill-rule',
  fillOpacity: 'fill-opacity',
  strokeOpacity: 'stroke-opacity',
  borderRadius: 'rx', // Map CSS borderRadius to SVG rx
}

/** Transform properties */
const TRANSFORM_PROPERTIES = new Set([
  'x', // Position x treated as translateX
  'y', // Position y treated as translateY
  'translateX',
  'translateY',
  'rotate',
  'rotateX',
  'rotateY',
  'scale',
  'scaleX',
  'scaleY',
  'skewX',
  'skewY',
  // Motion path properties (treated like x/y/rotate)
  'motionPathX',
  'motionPathY',
  'motionPathRotate',
])

/** Clip-inset properties (percent 0-100), composed into clip-path: inset(...). */
const CLIP_PROPERTIES = new Set(['clipTop', 'clipRight', 'clipBottom', 'clipLeft'])

/**
 * SVGAdapter applies animation state to SVG elements.
 * It maps animation properties to SVG attributes and handles
 * transform composition.
 */
export class SVGAdapter {
  private targets = new Map<string, SVGElement>()

  /**
   * Register an SVG element as an animation target.
   */
  registerTarget(id: string, element: SVGElement): void {
    this.targets.set(id, element)
  }

  /**
   * Unregister a target by its ID.
   */
  unregisterTarget(id: string): void {
    this.targets.delete(id)
  }

  /**
   * Get a registered target element.
   */
  getTarget(id: string): SVGElement | undefined {
    return this.targets.get(id)
  }

  /**
   * Clear all registered targets.
   */
  clearTargets(): void {
    this.targets.clear()
  }

  /**
   * Apply animation state to all registered targets.
   */
  applyState(state: AnimationState): void {
    for (const [targetId, properties] of state.values) {
      const element = this.targets.get(targetId)
      if (!element) continue

      this.applyProperties(element, properties)
    }
  }

  /**
   * Apply properties to a single SVG element.
   */
  private applyProperties(
    element: SVGElement,
    properties: Map<string, AnimatableValue>
  ): void {
    const transforms: Record<string, number> = {}
    const origin: Record<string, number> = {}
    const clip: Record<string, number> = {}
    const filter: FilterValues = {}
    let hasFilter = false

    for (const [property, value] of properties) {
      if (TRANSFORM_PROPERTIES.has(property)) {
        transforms[property] = value as number
      } else if (property === 'originX' || property === 'originY') {
        if (typeof value === 'number') origin[property] = value
      } else if (property === 'perspective') {
        if (typeof value === 'number') transforms.perspective = value
      } else if (CLIP_PROPERTIES.has(property)) {
        if (typeof value === 'number') clip[property] = value
      } else if (FILTER_PROPERTIES.has(property)) {
        ;(filter as Record<string, AnimatableValue>)[property] = value
        hasFilter = true
      } else if (property === 'text') {
        if (typeof value === 'string') setTextContent(element, value)
      } else if (property === 'shine') {
        if (typeof value === 'number') this.applyShine(element, value)
      } else if (property === 'opacity') {
        // Apply opacity to both fill and stroke
        element.setAttribute('fill-opacity', String(value))
        element.setAttribute('stroke-opacity', String(value))
      } else {
        this.applyAttribute(element, property, value)
      }
    }

    // Apply composed transform via CSS style (works with transform-origin)
    if (Object.keys(transforms).length > 0) {
      const transformString = this.buildCssTransformString(transforms)
      ;(element as SVGElement & { style: CSSStyleDeclaration }).style.transform = transformString
      ensureSvgTransformBox(element)
    }

    // Apply transform-origin. SVG defaults its origin to the user-space origin
    // rather than the element's own box, so `transform-box: fill-box` is set
    // alongside it to make percentages mean "of this element".
    if (Object.keys(origin).length > 0) {
      const style = (element as SVGElement & { style: CSSStyleDeclaration }).style
      style.transformBox = 'fill-box'
      style.transformOrigin = `${origin.originX ?? 50}% ${origin.originY ?? 50}%`
    }

    // Apply composed clip-path (reveal/wipe mask). Missing sides default to 0.
    if (Object.keys(clip).length > 0) {
      const t = clip.clipTop ?? 0
      const r = clip.clipRight ?? 0
      const b = clip.clipBottom ?? 0
      const l = clip.clipLeft ?? 0
      ;(element as SVGElement & { style: CSSStyleDeclaration }).style.clipPath = `inset(${t}% ${r}% ${b}% ${l}%)`
    }

    // Apply composed filter (blur / glow / drop-shadow).
    if (hasFilter) {
      const composed = composeFilter(filter)
      if (composed) {
        ;(element as SVGElement & { style: CSSStyleDeclaration }).style.filter = composed
      }
    }
  }

  /**
   * Build a CSS transform string (for use with transform-origin).
   */
  private buildCssTransformString(transforms: Record<string, number>): string {
    // `perspective()` only affects the 3D functions that follow it, so it is
    // emitted first (see the push order below).
    const parts: string[] = []

    if (transforms.perspective !== undefined) {
      parts.push(`perspective(${transforms.perspective}px)`)
    }

    // Translation - motion path takes precedence over regular x/y
    const tx = transforms.motionPathX ?? transforms.x ?? transforms.translateX
    const ty = transforms.motionPathY ?? transforms.y ?? transforms.translateY
    if (tx !== undefined || ty !== undefined) {
      parts.push(`translate(${tx ?? 0}px, ${ty ?? 0}px)`)
    }

    // Rotation - motion path takes precedence
    const rotation = transforms.motionPathRotate ?? transforms.rotate
    if (rotation !== undefined) {
      parts.push(`rotate(${rotation}deg)`)
    }

    // 3D Rotations (rotateX, rotateY)
    if (transforms.rotateX !== undefined) {
      parts.push(`rotateX(${transforms.rotateX}deg)`)
    }
    if (transforms.rotateY !== undefined) {
      parts.push(`rotateY(${transforms.rotateY}deg)`)
    }

    // Scale
    if (transforms.scale !== undefined) {
      parts.push(`scale(${transforms.scale})`)
    } else if (transforms.scaleX !== undefined || transforms.scaleY !== undefined) {
      const sx = transforms.scaleX ?? 1
      const sy = transforms.scaleY ?? 1
      parts.push(`scale(${sx}, ${sy})`)
    }

    // Skew
    if (transforms.skewX !== undefined) {
      parts.push(`skewX(${transforms.skewX}deg)`)
    }
    if (transforms.skewY !== undefined) {
      parts.push(`skewY(${transforms.skewY}deg)`)
    }

    return parts.join(' ')
  }

  /**
   * Apply a single attribute to an SVG element.
   */
  /**
   * Apply a shine sweep to an SVG (text) element by filling it with an injected
   * linear gradient whose highlight band moves with `progress` (0..1). The
   * gradient lives in the owner SVG's <defs> and is reused across frames.
   */
  private applyShine(element: SVGElement, progress: number): void {
    const svg = element.ownerSVGElement
    const doc = element.ownerDocument
    if (!svg || !doc) return

    // Capture the base fill colour once, before we swap to the gradient.
    const el = element as SVGElement & { dataset: DOMStringMap }
    if (!el.dataset.shineBase) {
      el.dataset.shineBase = element.getAttribute('fill') || '#000000'
    }
    const base = el.dataset.shineBase

    // Ensure a <defs> and a gradient element for this target.
    let defs = svg.querySelector('defs')
    if (!defs) {
      defs = doc.createElementNS(SVG_NS, 'defs')
      svg.insertBefore(defs, svg.firstChild)
    }
    let gradId = el.dataset.shineGrad
    let gradient = gradId ? (defs.querySelector(`#${gradId}`) as SVGElement | null) : null
    if (!gradient) {
      gradId = `tinyfly-shine-${Math.random().toString(36).slice(2, 9)}`
      el.dataset.shineGrad = gradId
      gradient = doc.createElementNS(SVG_NS, 'linearGradient')
      gradient.setAttribute('id', gradId)
      defs.appendChild(gradient)
    }

    // Rebuild the stops for this frame.
    while (gradient.firstChild) gradient.removeChild(gradient.firstChild)
    for (const stop of shineStops(progress, base)) {
      const s = doc.createElementNS(SVG_NS, 'stop')
      s.setAttribute('offset', String(stop.offset))
      s.setAttribute('stop-color', stop.color)
      gradient.appendChild(s)
    }

    element.setAttribute('fill', `url(#${gradId})`)
  }

  private applyAttribute(
    element: SVGElement,
    property: string,
    value: AnimatableValue
  ): void {
    // Map property name to SVG attribute name
    let attrName = property

    if (ATTRIBUTE_MAP[property]) {
      attrName = ATTRIBUTE_MAP[property]
    } else if (SVG_ATTRIBUTES.has(property)) {
      attrName = property
    }

    // Convert value to string
    const attrValue = Array.isArray(value) ? value.join(' ') : String(value)

    element.setAttribute(attrName, attrValue)
  }
}
