import type { AnimationState, AnimatableValue } from '../../engine/types'
import { composeFilter } from '../filter-utils'
import { shineStops } from '../shine-utils'
import { drawOutline, pathOutline, rectOutline } from './outline'
import { sketchPen, type SketchPen, type SketchStyle } from './sketch'
import { parsePath } from '../../engine/path/path-utils'
import {
  affinePart,
  elementMatrix,
  growTriangle,
  has3dTransform,
  isAffine,
  isBackFacing,
  perspectiveMesh,
  triangleTransform,
} from '../transform-3d'

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

/** An offscreen canvas like `ctx`'s: OffscreenCanvas, a DOM canvas, or the same canvas class (Node). */
function createLayerCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): { getContext(kind: '2d'): unknown } | null {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height)
  const source = ctx.canvas as unknown as { ownerDocument?: Document; constructor?: new (w: number, h: number) => { getContext(kind: '2d'): unknown } }
  if (source?.ownerDocument) {
    const canvas = source.ownerDocument.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  }
  try {
    return source?.constructor ? new source.constructor(width, height) : null
  } catch {
    return null
  }
}

/** Base properties for all canvas targets */
export interface CanvasTargetBase {
  x: number
  y: number
  opacity?: number
  rotate?: number
  rotateX?: number
  rotateY?: number
  /** Depth toward the viewer, px (CSS `translateZ`); shows with `perspective` */
  z?: number
  /** A rotation as an `[x, y, z, w]` quaternion (a track with `interpolation: 'slerp'`) */
  quaternion?: number[]
  /** Distance from the viewer, px (CSS `perspective()`): nearer parts grow, further ones shrink */
  perspective?: number
  /** `'hidden'`: not drawn while its back faces the viewer (a card's face, past 90°) */
  backfaceVisibility?: 'visible' | 'hidden'
  scale?: number
  scaleX?: number
  scaleY?: number
  skewX?: number
  skewY?: number
  /**
   * Transform pivot, as a percentage of the target's bounding box
   * (0 = left/top, 50 = centre, 100 = right/bottom). Defaults to 50/50, which
   * is the behaviour Canvas had before origins existed.
   */
  originX?: number
  originY?: number
  fillStyle?: FillValue
  strokeStyle?: string
  lineWidth?: number
  // Clip-inset (percent 0-100 from each edge) for reveal/wipe "mask" animations.
  clipTop?: number
  clipRight?: number
  clipBottom?: number
  clipLeft?: number
  // Filter properties (composed into ctx.filter): blur / glow / drop-shadow.
  blur?: number
  brightness?: number
  glow?: number
  glowColor?: string
  shadowX?: number
  shadowY?: number
  shadowBlur?: number
  shadowColor?: string
  // Shine sweep progress (0..1); rendered as a moving highlight in the fill.
  shine?: number
  /**
   * Draw the outline in hand-drawn pencil strokes that boil (rect, circle, line
   * and path targets). The fill stays clean underneath.
   */
  sketch?: SketchStyle
  /**
   * How much of the outline is drawn, 0..1 (default 1), for drawing a shape on
   * (rect, circle, line and path targets). The fill appears once it is complete.
   */
  drawOn?: number
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
  /** How the source fits the box (default 'fill'). */
  objectFit?: 'contain' | 'cover' | 'fill'
  /** Rounded-corner clip radius in px (default 0). */
  borderRadius?: number
}

/**
 * Draws a custom target. The context is already translated to the target's
 * `x`/`y` and has its opacity, transforms, fill, stroke and filter applied, so
 * the function draws in local coordinates (0,0 to width,height). `time` is the
 * timeline time in milliseconds of the state last applied.
 */
export type CustomDrawFunction = (
  ctx: CanvasRenderingContext2D,
  target: Readonly<CustomTarget>,
  time: number
) => void

/**
 * Custom target: drawing is done by code instead of a built-in shape.
 *
 * The timeline stays plain data. It animates the base properties (x, y,
 * opacity, rotate, …) as for any target, plus any value declared in `props`:
 * a track whose property is a key of `props` writes into `props`, so the draw
 * function reads `target.props.pose` rather than keyframes. Only keys declared
 * in `props` are routed there, so every animated value is visible up front.
 */
export interface CustomTarget extends CanvasTargetBase {
  type: 'custom'
  /** Bounding box size, used for the transform pivot, clip insets and gradients */
  width: number
  height: number
  draw: CustomDrawFunction
  /** Values the draw function reads, with their initial values */
  props?: Record<string, AnimatableValue>
}

/** Union of all canvas target types */
export type CanvasTarget =
  | RectTarget
  | CircleTarget
  | TextTarget
  | LineTarget
  | PathTarget
  | ImageTarget
  | CustomTarget

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
  // Time of the last applied state, passed to custom draw functions
  private time = 0
  /** Offscreen layer for see-through targets in perspective (see `drawInPerspective`) */
  private layer: { canvas: unknown; ctx: CanvasRenderingContext2D; width: number; height: number } | null = null

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
    // Custom targets get their own props object, so animating one never
    // mutates the definition the caller passed in.
    this.targets.set(id, target.type === 'custom' ? { ...target, props: { ...target.props } } : { ...target })
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
    rotateZ: 'rotate',
  }

  // Properties that are position offsets (applied via ctx.translate)
  private static readonly OFFSET_PROPERTIES = new Set(['x', 'y', 'motionPathX', 'motionPathY'])

  /**
   * Apply animation state to all registered targets.
   * Position properties (x, y) are treated as offsets applied via ctx.translate().
   * This matches how DOM/CSS transforms work (entire element moves together).
   */
  applyState(state: AnimationState): void {
    this.time = state.currentTime
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
        } else if (target.type === 'custom' && target.props && property in target.props) {
          target.props[property] = value
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

    // Apply opacity
    if (target.opacity !== undefined) {
      ctx.globalAlpha = target.opacity
    }

    // 3D: the CSS matrix, exact as a 2D transform without perspective, through
    // a mesh of triangles with it (see transform-3d.ts).
    if (has3dTransform(target)) {
      const matrix = elementMatrix(target, offset, { x: this.getPivotX(target), y: this.getPivotY(target) })
      if (target.backfaceVisibility === 'hidden' && isBackFacing(matrix)) {
        ctx.restore()
        return
      }
      if (isAffine(matrix)) {
        ctx.transform(...affinePart(matrix))
        this.drawContent(ctx, target)
      } else {
        this.drawInPerspective(ctx, target, matrix)
      }
      ctx.restore()
      return
    }

    // Apply animation position offset first (like CSS transform translate)
    // This moves the entire element including line endpoints
    if (offset.x !== 0 || offset.y !== 0) {
      ctx.translate(offset.x, offset.y)
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
      // Move the origin to the target's pivot for rotation/scale. The pivot is
      // its centre unless originX/originY shift it within the bounding box.
      const centerX = this.getPivotX(target)
      const centerY = this.getPivotY(target)

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

    this.drawContent(ctx, target)
    ctx.restore()
  }

  /**
   * Draw a target in perspective: each triangle of a mesh over its bounds is
   * clipped on the canvas and drawn with the 2D transform that carries it
   * there. The triangles overlap by a pixel so no anti-aliased seam shows.
   */
  private drawInPerspective(ctx: CanvasRenderingContext2D, target: CanvasTarget, matrix: number[]): void {
    // See-through targets go through a layer at full opacity, composited once:
    // drawn directly, the overlaps between triangles would show twice as dark.
    const alpha = ctx.globalAlpha
    const layer = alpha < 1 ? this.perspectiveLayer(ctx) : null
    if (layer) {
      layer.ctx.setTransform(ctx.getTransform())
      this.drawMesh(layer.ctx, target, matrix)
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(layer.canvas as CanvasImageSource, 0, 0)
      ctx.restore()
      return
    }
    this.drawMesh(ctx, target, matrix)
  }

  private drawMesh(ctx: CanvasRenderingContext2D, target: CanvasTarget, matrix: number[]): void {
    const bounds = this.contentBounds(ctx, target)
    for (const triangle of perspectiveMesh(matrix, bounds)) {
      const transform = triangleTransform(triangle.source, triangle.target)
      if (!transform) continue
      const [p, q, r] = growTriangle(triangle.target, 1)
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(q.x, q.y)
      ctx.lineTo(r.x, r.y)
      ctx.closePath()
      ctx.clip()
      ctx.transform(...transform)
      this.drawContent(ctx, target)
      ctx.restore()
    }
  }

  /** A cleared offscreen canvas the size of `ctx`'s, reused frame to frame; null where none can be made. */
  private perspectiveLayer(ctx: CanvasRenderingContext2D): { canvas: unknown; ctx: CanvasRenderingContext2D } | null {
    const width = ctx.canvas?.width ?? 0
    const height = ctx.canvas?.height ?? 0
    if (!(width > 0 && height > 0)) return null
    if (!this.layer || this.layer.width !== width || this.layer.height !== height) {
      const canvas = createLayerCanvas(ctx, width, height)
      const layerCtx = canvas?.getContext('2d') as CanvasRenderingContext2D | null | undefined
      this.layer = canvas && layerCtx ? { canvas, ctx: layerCtx, width, height } : null
      if (!this.layer) return null
    }
    const layerCtx = this.layer.ctx
    layerCtx.setTransform(1, 0, 0, 1, 0, 0)
    layerCtx.globalAlpha = 1
    layerCtx.clearRect(0, 0, width, height)
    return this.layer
  }

  /**
   * Everything a target paints, generously: its box, measured text, a path's
   * control points, plus room for its stroke, blur and glow. The perspective
   * mesh covers this, so nothing it draws falls outside.
   */
  private contentBounds(ctx: CanvasRenderingContext2D, target: CanvasTarget): { x: number; y: number; width: number; height: number } {
    let box = this.getTargetBounds(target)
    if (target.type === 'text') {
      const fontSize = target.fontSize ?? 16
      ctx.save()
      ctx.font = `${target.fontWeight ?? 400} ${fontSize}px ${target.fontFamily ?? 'sans-serif'}`
      const width = ctx.measureText(target.text).width
      ctx.restore()
      const align = target.textAlign ?? 'left'
      const left = align === 'center' ? target.x - width / 2 : align === 'right' ? target.x - width : target.x
      const top = (target.textBaseline ?? 'top') === 'top' ? target.y : target.y - fontSize
      box = { x: left, y: top, width, height: fontSize * 1.4 }
    } else if (target.type === 'path') {
      const xs: number[] = []
      const ys: number[] = []
      for (const segment of parsePath(target.d).segments) {
        xs.push(segment.startX, segment.endX)
        ys.push(segment.startY, segment.endY)
        for (let i = 0; i + 1 < segment.points.length; i += 2) {
          xs.push(segment.points[i])
          ys.push(segment.points[i + 1])
        }
      }
      if (xs.length > 0) {
        const minX = Math.min(...xs)
        const minY = Math.min(...ys)
        box = { x: target.x + minX, y: target.y + minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY }
      }
    }
    const pad = (target.lineWidth ?? 1) + 2 + 3 * Math.max(target.blur ?? 0, target.glow ?? 0, target.shadowBlur ?? 0) + Math.max(Math.abs(target.shadowX ?? 0), Math.abs(target.shadowY ?? 0))
    return { x: box.x - pad, y: box.y - pad, width: box.width + 2 * pad, height: box.height + 2 * pad }
  }

  /**
   * Paint a target in the current transform: its fill and stroke styles,
   * filter and clip, then its shape.
   */
  private drawContent(ctx: CanvasRenderingContext2D, target: CanvasTarget): void {
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

    // Apply composed filter (blur / glow / drop-shadow) if any are set.
    const composedFilter = composeFilter(target)
    if (composedFilter) {
      ctx.filter = composedFilter
    }

    // Apply clip-inset (reveal/wipe mask) in the target's own coordinate space.
    if (
      target.clipTop !== undefined ||
      target.clipRight !== undefined ||
      target.clipBottom !== undefined ||
      target.clipLeft !== undefined
    ) {
      const bounds = this.getTargetBounds(target)
      const l = bounds.x + ((target.clipLeft ?? 0) / 100) * bounds.width
      const r = bounds.x + bounds.width - ((target.clipRight ?? 0) / 100) * bounds.width
      const t = bounds.y + ((target.clipTop ?? 0) / 100) * bounds.height
      const b = bounds.y + bounds.height - ((target.clipBottom ?? 0) / 100) * bounds.height
      ctx.beginPath()
      ctx.rect(l, t, Math.max(0, r - l), Math.max(0, b - t))
      ctx.clip()
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
      case 'custom':
        this.renderCustom(ctx, target)
        break
    }
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
      case 'custom':
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

  /** Whether a shape is drawn stroke by stroke: sketched, or only partly drawn on. */
  private drawsOutline(target: CanvasTargetBase): boolean {
    return target.sketch !== undefined || (target.drawOn !== undefined && target.drawOn < 1)
  }

  /**
   * Draw a shape outline-first: the fill (clean) once the outline is complete,
   * then the outline up to `drawOn`, in pencil strokes when sketched.
   */
  private renderOutlined(
    ctx: CanvasRenderingContext2D,
    target: CanvasTargetBase,
    fill: (() => void) | undefined,
    outline: (progress: number, pen: SketchPen | undefined) => void
  ): void {
    const progress = Math.min(1, Math.max(0, target.drawOn ?? 1))
    if (fill && target.fillStyle && progress >= 1) fill()
    if (!target.strokeStyle || progress <= 0) return
    // Pencil lines have round ends unless the target says otherwise.
    const pen = target.sketch ? sketchPen(ctx, target.sketch, this.time) : undefined
    if (pen) {
      ctx.lineCap = (target as { lineCap?: CanvasLineCap }).lineCap ?? 'round'
      ctx.lineJoin = (target as { lineJoin?: CanvasLineJoin }).lineJoin ?? 'round'
    }
    outline(progress, pen)
  }

  /**
   * Render a rectangle.
   */
  private renderRect(ctx: CanvasRenderingContext2D, target: RectTarget): void {
    if (this.drawsOutline(target)) {
      const { x, y, width, height } = target
      return this.renderOutlined(
        ctx,
        target,
        () => {
          ctx.beginPath()
          if (target.borderRadius && target.borderRadius > 0) this.roundRect(ctx, x, y, width, height, target.borderRadius)
          else ctx.rect(x, y, width, height)
          ctx.fill()
        },
        (progress, pen) => drawOutline(ctx, rectOutline(x, y, width, height, target.borderRadius), progress, pen)
      )
    }
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
    if (this.drawsOutline(target)) {
      const { x, y, radius } = target
      return this.renderOutlined(
        ctx,
        target,
        () => {
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fill()
        },
        (progress, pen) => {
          if (pen) return pen.circle(x, y, radius, progress)
          // Clean: an arc from the top, clockwise.
          ctx.beginPath()
          ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress)
          ctx.stroke()
        }
      )
    }
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
      // Shine sweep: a linear gradient fill is naturally clipped to the glyphs
      // by fillText, so a moving highlight band reads as a sheen across the text.
      if (target.shine !== undefined && typeof target.fillStyle === 'string') {
        const width = ctx.measureText(target.text).width
        const align = target.textAlign ?? 'left'
        const left = align === 'center' ? target.x - width / 2 : align === 'right' ? target.x - width : target.x
        const gradient = ctx.createLinearGradient(left, target.y, left + width, target.y)
        for (const stop of shineStops(target.shine, target.fillStyle)) {
          gradient.addColorStop(stop.offset, stop.color)
        }
        ctx.fillStyle = gradient
      }
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

    if (this.drawsOutline(target)) {
      const points = [
        { x: target.x, y: target.y },
        { x: target.x2, y: target.y2 },
      ]
      const length = Math.hypot(target.x2 - target.x, target.y2 - target.y)
      return this.renderOutlined(ctx, target, undefined, (progress, pen) =>
        drawOutline(ctx, [{ kind: 'line', points, length }], progress, pen)
      )
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

    if (this.drawsOutline(target)) {
      return this.renderOutlined(
        ctx,
        target,
        () => ctx.fill(path),
        (progress, pen) => drawOutline(ctx, pathOutline(target.d), progress, pen)
      )
    }

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

    const { x, y, width: bw, height: bh } = target
    const fit = target.objectFit ?? 'fill'
    const radius = target.borderRadius ?? 0

    // Intrinsic source size (image / video / canvas), duck-typed to stay
    // framework-agnostic.
    const src = target.image as unknown as { naturalWidth?: number; videoWidth?: number; width?: number; naturalHeight?: number; videoHeight?: number; height?: number }
    const iw = src.naturalWidth || src.videoWidth || src.width || bw
    const ih = src.naturalHeight || src.videoHeight || src.height || bh

    // Destination rect honouring object-fit (cover crops, contain letterboxes).
    let dx = x, dy = y, dw = bw, dh = bh
    if (fit !== 'fill' && iw > 0 && ih > 0) {
      const scale = fit === 'cover' ? Math.max(bw / iw, bh / ih) : Math.min(bw / iw, bh / ih)
      dw = iw * scale
      dh = ih * scale
      dx = x + (bw - dw) / 2
      dy = y + (bh - dh) / 2
    }

    ctx.save()
    // Clip to the (optionally rounded) box so cover-crop and rounded corners work.
    ctx.beginPath()
    if (radius > 0 && typeof (ctx as CanvasRenderingContext2D & { roundRect?: unknown }).roundRect === 'function') {
      ctx.roundRect(x, y, bw, bh, radius)
    } else {
      ctx.rect(x, y, bw, bh)
    }
    ctx.clip()
    ctx.drawImage(target.image, dx, dy, dw, dh)
    ctx.restore()
  }

  /**
   * Render a custom target by calling its draw function in local coordinates.
   */
  private renderCustom(ctx: CanvasRenderingContext2D, target: CustomTarget): void {
    ctx.translate(target.x, target.y)
    target.draw(ctx, target, this.time)
  }

  /**
   * Transform pivot X: the target's centre, shifted by `originX` across its
   * own width. `originX: 0` pivots on the left edge, 100 on the right.
   */
  private getPivotX(target: CanvasTarget): number {
    const centre = this.getCenterX(target)
    if (target.originX === undefined) return centre
    return centre + ((target.originX - 50) / 100) * this.getBoundsWidth(target)
  }

  /** Transform pivot Y — see `getPivotX`. */
  private getPivotY(target: CanvasTarget): number {
    const centre = this.getCenterY(target)
    if (target.originY === undefined) return centre
    return centre + ((target.originY - 50) / 100) * this.getBoundsHeight(target)
  }

  /**
   * Bounding-box width used to resolve `originX`. Circles use their diameter;
   * text is approximated from its font size, since measuring it would need the
   * context and the pivot only has to be stable, not typographically exact.
   */
  private getBoundsWidth(target: CanvasTarget): number {
    switch (target.type) {
      case 'rect':
      case 'image':
      case 'custom':
        return target.width
      case 'circle':
        return target.radius * 2
      case 'text':
        return (target.text?.length ?? 0) * (target.fontSize ?? 16) * 0.6
      case 'line':
        return Math.abs(target.x2 - target.x)
      case 'path':
        return 100 // Matches the approximate centre used above
    }
  }

  /** Bounding-box height used to resolve `originY`. See `getBoundsWidth`. */
  private getBoundsHeight(target: CanvasTarget): number {
    switch (target.type) {
      case 'rect':
      case 'image':
      case 'custom':
        return target.height
      case 'circle':
        return target.radius * 2
      case 'text':
        return target.fontSize ?? 16
      case 'line':
        return Math.abs(target.y2 - target.y)
      case 'path':
        return 100
    }
  }

  /**
   * Get the center X coordinate of a target.
   */
  private getCenterX(target: CanvasTarget): number {
    switch (target.type) {
      case 'rect':
      case 'image':
      case 'custom':
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
      case 'custom':
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
