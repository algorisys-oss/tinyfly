import type { AnimationState, AnimatableValue } from '../../engine/types'

/** Gradient stop definition */
export interface GradientStop {
  offset: number // 0-1
  color: string
}

/** Linear gradient definition */
export interface LinearGradient {
  type: 'linear'
  angle: number // degrees, 0 = left to right, 90 = top to bottom
  stops: GradientStop[]
}

/** Radial gradient definition */
export interface RadialGradient {
  type: 'radial'
  centerX: number // 0-1, relative to element
  centerY: number // 0-1, relative to element
  radius: number // 0-1, relative to element size
  stops: GradientStop[]
}

/** Gradient type union */
export type Gradient = LinearGradient | RadialGradient

/** Fill value can be a solid color string or a gradient */
export type FillValue = string | Gradient

/** Check if a fill value is a gradient */
export function isGradient(fill: FillValue | undefined): fill is Gradient {
  return typeof fill === 'object' && fill !== null && 'type' in fill
}

/** Base properties for all canvas targets */
export interface CanvasTargetBase {
  x: number
  y: number
  opacity?: number
  rotate?: number
  rotateX?: number
  rotateY?: number
  scale?: number
  scaleX?: number
  scaleY?: number
  skewX?: number
  skewY?: number
  fillStyle?: FillValue
  strokeStyle?: string
  lineWidth?: number
}

/** Rectangle target */
export interface RectTarget extends CanvasTargetBase {
  type: 'rect'
  width: number
  height: number
  borderRadius?: number
}

/** Circle target */
export interface CircleTarget extends CanvasTargetBase {
  type: 'circle'
  radius: number
}

/** Text target */
export interface TextTarget extends CanvasTargetBase {
  type: 'text'
  text: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: number
  textAlign?: 'left' | 'center' | 'right'
  textBaseline?: CanvasTextBaseline
}

/** Line target */
export interface LineTarget extends CanvasTargetBase {
  type: 'line'
  x2: number
  y2: number
  lineCap?: CanvasLineCap
}

/** Path target (SVG path data) */
export interface PathTarget extends CanvasTargetBase {
  type: 'path'
  d: string // SVG path data
  lineCap?: CanvasLineCap
  lineJoin?: CanvasLineJoin
}

/** Image target */
export interface ImageTarget extends CanvasTargetBase {
  type: 'image'
  width: number
  height: number
  image: CanvasImageSource | null
}

/** Union of all canvas target types */
export type CanvasTarget = RectTarget | CircleTarget | TextTarget | LineTarget | PathTarget | ImageTarget

/**
 * CanvasAdapter manages canvas drawing objects and applies
 * animation state to them. Call render() in your animation loop
 * to draw all targets.
 */
export class CanvasAdapter {
  private targets = new Map<string, CanvasTarget>()
  private targetOrder: string[] = []
  // Store animation offsets separately - these are applied via ctx.translate() during rendering
  // This ensures that entire elements (including line x2/y2) move together like CSS transforms
  private animationOffsets = new Map<string, { x: number; y: number }>()
  // Track alias IDs that point to the same target (for lookup only, not rendering)
  private aliases = new Map<string, string>()

  /**
   * Register a canvas drawing target.
   * @param id - The ID to register the target under
   * @param target - The canvas target to register
   * @param aliasFor - If provided, this ID is an alias for another target (won't render separately)
   */
  registerTarget(id: string, target: CanvasTarget, aliasFor?: string): void {
    if (aliasFor) {
      // This is an alias - just store a reference, don't add to render order
      this.aliases.set(id, aliasFor)
      this.targets.set(id, target)
      return
    }

    if (!this.targets.has(id)) {
      this.targetOrder.push(id)
    }
    this.targets.set(id, { ...target })
    // Initialize with zero offset
    this.animationOffsets.set(id, { x: 0, y: 0 })
  }

  /**
   * Unregister a target by its ID.
   */
  unregisterTarget(id: string): void {
    this.targets.delete(id)
    this.animationOffsets.delete(id)
    this.aliases.delete(id)
    this.targetOrder = this.targetOrder.filter((tid) => tid !== id)
  }

  /**
   * Get a registered target.
   */
  getTarget(id: string): CanvasTarget | undefined {
    return this.targets.get(id)
  }

  /**
   * Clear all registered targets.
   */
  clearTargets(): void {
    this.targets.clear()
    this.animationOffsets.clear()
    this.aliases.clear()
    this.targetOrder = []
  }

  // Map animation property names to canvas target property names
  private static readonly PROPERTY_MAP: Record<string, string> = {
    fill: 'fillStyle',
    stroke: 'strokeStyle',
    strokeWidth: 'lineWidth',
    motionPathRotate: 'rotate',
  }

  // Properties that are position offsets (applied via ctx.translate)
  private static readonly OFFSET_PROPERTIES = new Set(['x', 'y', 'motionPathX', 'motionPathY'])

  /**
   * Apply animation state to all registered targets.
   * Position properties (x, y) are treated as offsets applied via ctx.translate().
   * This matches how DOM/CSS transforms work (entire element moves together).
   */
  applyState(state: AnimationState): void {
    for (const [targetId, properties] of state.values) {
      const target = this.targets.get(targetId)
      if (!target) continue

      // Resolve alias to primary ID for offset storage
      const primaryId = this.aliases.get(targetId) ?? targetId
      const offsets = this.animationOffsets.get(primaryId) ?? { x: 0, y: 0 }

      for (const [property, value] of properties) {
        // Handle position offsets separately - stored and applied during rendering
        if (CanvasAdapter.OFFSET_PROPERTIES.has(property) && typeof value === 'number') {
          if (property === 'x' || property === 'motionPathX') {
            offsets.x = value
          } else if (property === 'y' || property === 'motionPathY') {
            offsets.y = value
          }
        } else {
          // Map property name if needed
          const targetProperty = CanvasAdapter.PROPERTY_MAP[property] ?? property
          // Update target property directly
          ;(target as unknown as Record<string, AnimatableValue>)[targetProperty] = value
        }
      }

      this.animationOffsets.set(primaryId, offsets)
    }
  }

  /**
   * Get animation offset for a target (for testing).
   */
  getAnimationOffset(id: string): { x: number; y: number } | undefined {
    return this.animationOffsets.get(id)
  }

  /**
   * Render all targets to the provided canvas context.
   * Call this in your animation loop after applyState().
   */
  render(ctx: CanvasRenderingContext2D): void {
    for (const id of this.targetOrder) {
      const target = this.targets.get(id)
      if (!target) continue

      const offset = this.animationOffsets.get(id) ?? { x: 0, y: 0 }
      this.renderTarget(ctx, target, offset)
    }
  }

  /**
   * Render a single target.
   */
  private renderTarget(
    ctx: CanvasRenderingContext2D,
    target: CanvasTarget,
    offset: { x: number; y: number }
  ): void {
    ctx.save()

    // Apply animation position offset first (like CSS transform translate)
    // This moves the entire element including line endpoints
    if (offset.x !== 0 || offset.y !== 0) {
      ctx.translate(offset.x, offset.y)
    }

    // Apply opacity
    if (target.opacity !== undefined) {
      ctx.globalAlpha = target.opacity
    }

    // Apply transforms (rotation/scale/skew around element center)
    const hasTransform =
      target.rotate !== undefined ||
      target.rotateX !== undefined ||
      target.rotateY !== undefined ||
      target.scale !== undefined ||
      target.scaleX !== undefined ||
      target.scaleY !== undefined ||
      target.skewX !== undefined ||
      target.skewY !== undefined

    if (hasTransform) {
      // Move origin to target center for rotation/scale
      const centerX = this.getCenterX(target)
      const centerY = this.getCenterY(target)

      ctx.translate(centerX, centerY)

      if (target.rotate !== undefined) {
        ctx.rotate((target.rotate * Math.PI) / 180)
      }

      // Apply 3D rotation simulation (rotateX/rotateY as 2D perspective approximation)
      // rotateX flattens vertically (affects scaleY), rotateY flattens horizontally (affects scaleX)
      let effectiveScaleX = target.scaleX ?? 1
      let effectiveScaleY = target.scaleY ?? 1

      if (target.rotateX !== undefined) {
        effectiveScaleY *= Math.cos((target.rotateX * Math.PI) / 180)
      }
      if (target.rotateY !== undefined) {
        effectiveScaleX *= Math.cos((target.rotateY * Math.PI) / 180)
      }

      if (target.scale !== undefined) {
        ctx.scale(target.scale, target.scale)
      } else if (effectiveScaleX !== 1 || effectiveScaleY !== 1) {
        ctx.scale(effectiveScaleX, effectiveScaleY)
      }

      // Apply skew using transform matrix
      // transform(a, b, c, d, e, f) where:
      // a = horizontal scaling, b = vertical skewing, c = horizontal skewing, d = vertical scaling
      if (target.skewX !== undefined || target.skewY !== undefined) {
        const skewXRad = ((target.skewX ?? 0) * Math.PI) / 180
        const skewYRad = ((target.skewY ?? 0) * Math.PI) / 180
        ctx.transform(1, Math.tan(skewYRad), Math.tan(skewXRad), 1, 0, 0)
      }

      ctx.translate(-centerX, -centerY)
    }

    // Set fill style (handle gradients)
    if (target.fillStyle) {
      ctx.fillStyle = this.resolveFillStyle(ctx, target)
    }

    // Set stroke style
    if (target.strokeStyle) {
      ctx.strokeStyle = target.strokeStyle
    }

    if (target.lineWidth !== undefined) {
      ctx.lineWidth = target.lineWidth
    }

    // Draw based on target type
    switch (target.type) {
      case 'rect':
        this.renderRect(ctx, target)
        break
      case 'circle':
        this.renderCircle(ctx, target)
        break
      case 'text':
        this.renderText(ctx, target)
        break
      case 'line':
        this.renderLine(ctx, target)
        break
      case 'path':
        this.renderPath(ctx, target)
        break
      case 'image':
        this.renderImage(ctx, target)
        break
    }

    ctx.restore()
  }

  /**
   * Resolve a fill style to a canvas-compatible value.
   */
  private resolveFillStyle(
    ctx: CanvasRenderingContext2D,
    target: CanvasTarget
  ): string | CanvasGradient {
    const fill = target.fillStyle
    if (!fill) return 'transparent'
    if (typeof fill === 'string') return fill

    // Create canvas gradient from gradient definition
    const bounds = this.getTargetBounds(target)

    if (fill.type === 'linear') {
      return this.createLinearGradient(ctx, fill, bounds)
    } else {
      return this.createRadialGradient(ctx, fill, bounds)
    }
  }

  /**
   * Create a canvas linear gradient from a LinearGradient definition.
   */
  private createLinearGradient(
    ctx: CanvasRenderingContext2D,
    gradient: LinearGradient,
    bounds: { x: number; y: number; width: number; height: number }
  ): CanvasGradient {
    // Convert angle to start/end points
    const angleRad = (gradient.angle - 90) * (Math.PI / 180)
    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2
    const length = Math.max(bounds.width, bounds.height)

    const x1 = centerX - Math.cos(angleRad) * length / 2
    const y1 = centerY - Math.sin(angleRad) * length / 2
    const x2 = centerX + Math.cos(angleRad) * length / 2
    const y2 = centerY + Math.sin(angleRad) * length / 2

    const canvasGradient = ctx.createLinearGradient(x1, y1, x2, y2)
    for (const stop of gradient.stops) {
      canvasGradient.addColorStop(stop.offset, stop.color)
    }
    return canvasGradient
  }

  /**
   * Create a canvas radial gradient from a RadialGradient definition.
   */
  private createRadialGradient(
    ctx: CanvasRenderingContext2D,
    gradient: RadialGradient,
    bounds: { x: number; y: number; width: number; height: number }
  ): CanvasGradient {
    const centerX = bounds.x + bounds.width * gradient.centerX
    const centerY = bounds.y + bounds.height * gradient.centerY
    const radius = Math.max(bounds.width, bounds.height) * gradient.radius

    const canvasGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    for (const stop of gradient.stops) {
      canvasGradient.addColorStop(stop.offset, stop.color)
    }
    return canvasGradient
  }

  /**
   * Get target bounding box for gradient calculations.
   */
  private getTargetBounds(target: CanvasTarget): { x: number; y: number; width: number; height: number } {
    switch (target.type) {
      case 'rect':
      case 'image':
        return { x: target.x, y: target.y, width: target.width, height: target.height }
      case 'circle':
        return {
          x: target.x - target.radius,
          y: target.y - target.radius,
          width: target.radius * 2,
          height: target.radius * 2,
        }
      case 'text':
        // Text bounds are approximate
        return { x: target.x, y: target.y - (target.fontSize ?? 16), width: 100, height: target.fontSize ?? 16 }
      case 'line':
        return {
          x: Math.min(target.x, target.x2),
          y: Math.min(target.y, target.y2),
          width: Math.abs(target.x2 - target.x),
          height: Math.abs(target.y2 - target.y),
        }
      case 'path':
        // Path bounds would require parsing - use approximate
        return { x: target.x, y: target.y, width: 100, height: 100 }
    }
  }

  /**
   * Render a rectangle.
   */
  private renderRect(ctx: CanvasRenderingContext2D, target: RectTarget): void {
    ctx.beginPath()
    if (target.borderRadius && target.borderRadius > 0) {
      this.roundRect(ctx, target.x, target.y, target.width, target.height, target.borderRadius)
    } else {
      ctx.rect(target.x, target.y, target.width, target.height)
    }

    if (target.fillStyle) {
      ctx.fill()
    }
    if (target.strokeStyle) {
      ctx.stroke()
    }
    ctx.closePath()
  }

  /**
   * Draw a rounded rectangle path.
   */
  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const r = Math.min(radius, width / 2, height / 2)
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + width - r, y)
    ctx.arcTo(x + width, y, x + width, y + r, r)
    ctx.lineTo(x + width, y + height - r)
    ctx.arcTo(x + width, y + height, x + width - r, y + height, r)
    ctx.lineTo(x + r, y + height)
    ctx.arcTo(x, y + height, x, y + height - r, r)
    ctx.lineTo(x, y + r)
    ctx.arcTo(x, y, x + r, y, r)
  }

  /**
   * Render a circle.
   */
  private renderCircle(ctx: CanvasRenderingContext2D, target: CircleTarget): void {
    ctx.beginPath()
    ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2)

    if (target.fillStyle) {
      ctx.fill()
    }
    if (target.strokeStyle) {
      ctx.stroke()
    }
    ctx.closePath()
  }

  /**
   * Render text.
   */
  private renderText(ctx: CanvasRenderingContext2D, target: TextTarget): void {
    const fontSize = target.fontSize ?? 16
    const fontFamily = target.fontFamily ?? 'sans-serif'
    const fontWeight = target.fontWeight ?? 400
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    ctx.textAlign = target.textAlign ?? 'left'
    ctx.textBaseline = target.textBaseline ?? 'top'

    if (target.fillStyle) {
      ctx.fillText(target.text, target.x, target.y)
    }
    if (target.strokeStyle) {
      ctx.strokeText(target.text, target.x, target.y)
    }
  }

  /**
   * Render a line.
   */
  private renderLine(ctx: CanvasRenderingContext2D, target: LineTarget): void {
    if (target.lineCap) {
      ctx.lineCap = target.lineCap
    }

    ctx.beginPath()
    ctx.moveTo(target.x, target.y)
    ctx.lineTo(target.x2, target.y2)

    if (target.strokeStyle) {
      ctx.stroke()
    }
    ctx.closePath()
  }

  /**
   * Render an SVG path.
   */
  private renderPath(ctx: CanvasRenderingContext2D, target: PathTarget): void {
    if (target.lineCap) {
      ctx.lineCap = target.lineCap
    }
    if (target.lineJoin) {
      ctx.lineJoin = target.lineJoin
    }

    // Use Path2D to render SVG path data
    const path = new Path2D(target.d)

    // Apply translation for target position
    ctx.translate(target.x, target.y)

    if (target.fillStyle) {
      ctx.fill(path)
    }
    if (target.strokeStyle) {
      ctx.stroke(path)
    }
  }

  /**
   * Render an image.
   */
  private renderImage(ctx: CanvasRenderingContext2D, target: ImageTarget): void {
    if (!target.image) return

    if (target.opacity !== undefined) {
      ctx.globalAlpha = target.opacity
    }

    ctx.drawImage(target.image, target.x, target.y, target.width, target.height)
  }

  /**
   * Get the center X coordinate of a target.
   */
  private getCenterX(target: CanvasTarget): number {
    switch (target.type) {
      case 'rect':
      case 'image':
        return target.x + target.width / 2
      case 'circle':
        return target.x
      case 'text':
        return target.x
      case 'line':
        return (target.x + target.x2) / 2
      case 'path':
        return target.x + 50 // Approximate center
    }
  }

  /**
   * Get the center Y coordinate of a target.
   */
  private getCenterY(target: CanvasTarget): number {
    switch (target.type) {
      case 'rect':
      case 'image':
        return target.y + target.height / 2
      case 'circle':
        return target.y
      case 'text':
        return target.y + (target.fontSize ?? 16) / 2
      case 'line':
        return (target.y + target.y2) / 2
      case 'path':
        return target.y + 50 // Approximate center
    }
  }

  /**
   * Load an image and return a promise that resolves to the image.
   * Useful for creating ImageTarget objects.
   */
  static loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }
}
