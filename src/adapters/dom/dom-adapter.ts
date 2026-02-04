import type { AnimationState, AnimatableValue } from '../../engine/types'

/** Properties that need px units when numeric */
const PX_PROPERTIES = new Set([
  'width',
  'height',
  'top',
  'right',
  'bottom',
  'left',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderRadius',
  'borderWidth',
  'fontSize',
  'lineHeight',
  'letterSpacing',
  'outlineWidth',
  'gap',
  'rowGap',
  'columnGap',
])

/** Transform properties that need special handling */
const TRANSFORM_PROPERTIES = new Set([
  'x',
  'y',
  'z',
  'rotate',
  'rotateX',
  'rotateY',
  'rotateZ',
  'scale',
  'scaleX',
  'scaleY',
  'scaleZ',
  'skewX',
  'skewY',
  // Motion path properties
  'motionPathX',
  'motionPathY',
  'motionPathRotate',
])

/** Map animation property names to CSS property names */
const PROPERTY_MAP: Record<string, string> = {
  fill: 'backgroundColor',
  stroke: 'borderColor',
  strokeWidth: 'borderWidth',
  color: 'color',
  backgroundColor: 'backgroundColor',
  borderColor: 'borderColor',
}

/**
 * DOMAdapter applies animation state to HTML elements.
 * It maps animation properties to CSS styles and handles
 * transform composition.
 */
export class DOMAdapter {
  private targets = new Map<string, HTMLElement>()

  /**
   * Register an HTML element as an animation target.
   */
  registerTarget(id: string, element: HTMLElement): void {
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
  getTarget(id: string): HTMLElement | undefined {
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
   * Apply properties to a single element.
   */
  private applyProperties(
    element: HTMLElement,
    properties: Map<string, AnimatableValue>
  ): void {
    const transformParts: string[] = []

    // Check if motion path values are present (they take priority over x/y/rotate)
    const hasMotionPathX = properties.has('motionPathX')
    const hasMotionPathY = properties.has('motionPathY')
    const hasMotionPathRotate = properties.has('motionPathRotate')

    for (const [property, value] of properties) {
      // Skip regular x/y/rotate if motion path equivalents are present
      if (property === 'x' && hasMotionPathX) continue
      if (property === 'y' && hasMotionPathY) continue
      if ((property === 'rotate' || property === 'rotateZ') && hasMotionPathRotate) continue

      if (TRANSFORM_PROPERTIES.has(property)) {
        const transformValue = this.buildTransformPart(property, value)
        if (transformValue) {
          transformParts.push(transformValue)
        }
      } else {
        this.applyStyleProperty(element, property, value)
      }
    }

    // Apply composed transform
    if (transformParts.length > 0) {
      element.style.transform = transformParts.join(' ')
    }
  }

  /**
   * Build a transform function string for a property.
   */
  private buildTransformPart(
    property: string,
    value: AnimatableValue
  ): string | null {
    if (typeof value !== 'number') return null

    switch (property) {
      case 'x':
      case 'motionPathX':
        return `translateX(${value}px)`
      case 'y':
      case 'motionPathY':
        return `translateY(${value}px)`
      case 'z':
        return `translateZ(${value}px)`
      case 'rotate':
      case 'rotateZ':
      case 'motionPathRotate':
        return `rotate(${value}deg)`
      case 'rotateX':
        return `rotateX(${value}deg)`
      case 'rotateY':
        return `rotateY(${value}deg)`
      case 'scale':
        return `scale(${value})`
      case 'scaleX':
        return `scaleX(${value})`
      case 'scaleY':
        return `scaleY(${value})`
      case 'scaleZ':
        return `scaleZ(${value})`
      case 'skewX':
        return `skewX(${value}deg)`
      case 'skewY':
        return `skewY(${value}deg)`
      default:
        return null
    }
  }

  /**
   * Apply a single style property to an element.
   */
  private applyStyleProperty(
    element: HTMLElement,
    property: string,
    value: AnimatableValue
  ): void {
    // Map property name to CSS equivalent
    // For text elements, 'fill' should map to 'color' (text color), not 'backgroundColor'
    let cssProperty: string
    if (property === 'fill' && element.dataset.elementType === 'text') {
      cssProperty = 'color'
    } else {
      cssProperty = PROPERTY_MAP[property] ?? property
    }

    let cssValue: string

    if (typeof value === 'number') {
      if (PX_PROPERTIES.has(property) || PX_PROPERTIES.has(cssProperty)) {
        cssValue = `${value}px`
      } else {
        cssValue = String(value)
      }
    } else if (Array.isArray(value)) {
      // Arrays are typically used for things like rgb values
      cssValue = value.join(', ')
    } else {
      cssValue = value
    }

    // Apply to element style
    // TypeScript doesn't know all CSS properties, so we use index access
    ;(element.style as unknown as Record<string, string>)[cssProperty] = cssValue
  }
}
