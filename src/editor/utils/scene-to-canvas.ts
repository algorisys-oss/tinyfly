import type { CanvasTarget } from '../../adapters/canvas'
import type {
  SceneElement,
  RectElement,
  CircleElement,
  TextElement,
  LineElement,
  PathElement,
} from '../stores/scene-store'

/**
 * Map a scene element to a Canvas adapter target.
 *
 * Shared by the live Canvas preview and the video exporter so both draw scenes
 * identically. Returns `null` for element types the Canvas renderer does not
 * support (image, video, audio, arrow, group) — video/image are DOM-only.
 */
export function sceneElementToCanvasTarget(element: SceneElement): CanvasTarget | null {
  const base = {
    x: element.x,
    y: element.y,
    opacity: element.opacity,
    rotate: element.rotation,
  }

  switch (element.type) {
    case 'rect': {
      const rect = element as RectElement
      return {
        ...base,
        type: 'rect',
        width: rect.width,
        height: rect.height,
        fillStyle: typeof rect.fill === 'string' ? rect.fill : undefined,
        strokeStyle: rect.stroke,
        lineWidth: rect.strokeWidth,
        borderRadius: rect.borderRadius,
      }
    }
    case 'circle': {
      const circle = element as CircleElement
      return {
        ...base,
        type: 'circle',
        x: circle.x + circle.width / 2,
        y: circle.y + circle.height / 2,
        radius: Math.min(circle.width, circle.height) / 2,
        fillStyle: typeof circle.fill === 'string' ? circle.fill : undefined,
        strokeStyle: circle.stroke,
        lineWidth: circle.strokeWidth,
      }
    }
    case 'text': {
      const text = element as TextElement
      return {
        ...base,
        type: 'text',
        text: text.text,
        fontSize: text.fontSize,
        fontFamily: text.fontFamily,
        fontWeight: text.fontWeight,
        fillStyle: typeof text.fill === 'string' ? text.fill : undefined,
      }
    }
    case 'line': {
      const line = element as LineElement
      return {
        ...base,
        type: 'line',
        x2: line.x2,
        y2: line.y2,
        strokeStyle: line.stroke,
        lineWidth: line.strokeWidth,
        lineCap: line.lineCap as CanvasLineCap,
      }
    }
    case 'path': {
      const path = element as PathElement
      return {
        ...base,
        type: 'path',
        d: path.d,
        fillStyle: typeof path.fill === 'string' ? path.fill : undefined,
        strokeStyle: path.stroke,
        lineWidth: path.strokeWidth,
      }
    }
    default:
      return null
  }
}
