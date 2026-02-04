import type { AnimationState, AnimatableValue } from '../../engine/types'

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

    for (const [property, value] of properties) {
      if (TRANSFORM_PROPERTIES.has(property)) {
        transforms[property] = value as number
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
    }
  }

  /**
   * Build a CSS transform string (for use with transform-origin).
   */
  private buildCssTransformString(transforms: Record<string, number>): string {
    const parts: string[] = []

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
