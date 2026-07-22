import type {
  SceneElement,
  RectElement,
  CircleElement,
  TextElement,
  ImageElement,
  AudioElement,
  VideoElement,
} from '../stores/scene-store'
import type { LineElement, ArrowElement, PathElement, SymbolInstanceElement } from '../stores/scene-store'
import type { SymbolDefinition } from '../stores/scene-types'

/** Common media attributes (volume/muted/loop) for embedded <audio>/<video>. */
function mediaAttrs(media: AudioElement | VideoElement): string {
  const parts = [`data-volume="${media.volume}"`, 'preload="auto"']
  if (media.muted) parts.push('muted')
  if (media.loop) parts.push('loop')
  return parts.join(' ')
}

/**
 * Generate CSS style string for an element.
 */
export function generateElementStyle(element: SceneElement): string {
  const styles: string[] = [
    'position: absolute',
    `left: ${element.x}px`,
    `top: ${element.y}px`,
    `width: ${element.width}px`,
    `height: ${element.height}px`,
    `opacity: ${element.opacity}`,
  ]

  if (element.rotation !== 0) {
    styles.push(`transform: rotate(${element.rotation}deg)`)
  }

  switch (element.type) {
    case 'rect': {
      const rect = element as RectElement
      styles.push(`background: ${rect.fill}`)
      if (rect.strokeWidth > 0) {
        styles.push(`border: ${rect.strokeWidth}px solid ${rect.stroke}`)
      }
      if (rect.borderRadius > 0) {
        styles.push(`border-radius: ${rect.borderRadius}px`)
      }
      break
    }
    case 'circle': {
      const circle = element as CircleElement
      styles.push(`background: ${circle.fill}`)
      if (circle.strokeWidth > 0) {
        styles.push(`border: ${circle.strokeWidth}px solid ${circle.stroke}`)
      }
      styles.push('border-radius: 50%')
      break
    }
    case 'text': {
      const text = element as TextElement
      styles.push('background: transparent')
      styles.push(`color: ${text.fill}`)
      styles.push(`font-size: ${text.fontSize}px`)
      styles.push(`font-family: ${text.fontFamily}`)
      styles.push(`font-weight: ${text.fontWeight}`)
      styles.push(`text-align: ${text.textAlign}`)
      styles.push('display: flex')
      styles.push('align-items: center')
      const justify = text.textAlign === 'center' ? 'center' : text.textAlign === 'right' ? 'flex-end' : 'flex-start'
      styles.push(`justify-content: ${justify}`)
      break
    }
    case 'image': {
      styles.push('background: transparent')
      styles.push('overflow: hidden')
      break
    }
    case 'audio': {
      styles.push('display: none')
      break
    }
    case 'video': {
      const video = element as VideoElement
      styles.push('background: transparent')
      styles.push('overflow: hidden')
      styles.push(`object-fit: ${video.objectFit}`)
      if (video.borderRadius) styles.push(`border-radius: ${video.borderRadius}px`)
      break
    }
    case 'line':
    case 'arrow':
    case 'path':
      break
  }

  return styles.join('; ')
}

/**
 * Generate HTML string for a scene element (for embedding/sequencer).
 */
export function generateElementHtml(element: SceneElement, indent: string = '  '): string {
  if (!element.visible) return ''

  const style = generateElementStyle(element)

  switch (element.type) {
    case 'rect':
    case 'circle':
      return `${indent}<div data-tinyfly="${element.name}" style="${style}"></div>`

    case 'text': {
      const text = element as TextElement
      return `${indent}<div data-tinyfly="${element.name}" style="${style}">${text.text}</div>`
    }

    case 'image': {
      const img = element as ImageElement
      if (img.src) {
        return `${indent}<div data-tinyfly="${element.name}" style="${style}">
${indent}  <img src="${img.src}" style="width: 100%; height: 100%; object-fit: ${img.objectFit};" />
${indent}</div>`
      }
      return `${indent}<div data-tinyfly="${element.name}" style="${style}"></div>`
    }

    case 'audio': {
      const audio = element as AudioElement
      if (!audio.src) return ''
      return `${indent}<audio data-tinyfly-media data-tinyfly-start="${audio.startTime}" ${mediaAttrs(audio)} src="${audio.src}" style="display: none;"></audio>`
    }

    case 'video': {
      const video = element as VideoElement
      if (!video.src) {
        return `${indent}<div data-tinyfly="${element.name}" style="${style}"></div>`
      }
      return `${indent}<video data-tinyfly="${element.name}" data-tinyfly-media data-tinyfly-start="${video.startTime}" ${mediaAttrs(video)} src="${video.src}" playsinline style="${style}"></video>`
    }

    case 'line': {
      const line = element as LineElement
      const minX = Math.min(line.x, line.x2)
      const minY = Math.min(line.y, line.y2)
      const width = Math.abs(line.x2 - line.x) + line.strokeWidth
      const height = Math.max(Math.abs(line.y2 - line.y) + line.strokeWidth, line.strokeWidth)
      const x1 = line.x - minX + line.strokeWidth / 2
      const y1 = line.y - minY + line.strokeWidth / 2
      const x2 = line.x2 - minX + line.strokeWidth / 2
      const y2 = line.y2 - minY + line.strokeWidth / 2

      return `${indent}<svg data-tinyfly="${element.name}" style="position: absolute; left: ${minX}px; top: ${minY}px; width: ${width}px; height: ${height}px; overflow: visible;">
${indent}  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${line.stroke}" stroke-width="${line.strokeWidth}" stroke-linecap="${line.lineCap}" />
${indent}</svg>`
    }

    case 'arrow': {
      const arrow = element as ArrowElement
      const minX = Math.min(arrow.x, arrow.x2)
      const minY = Math.min(arrow.y, arrow.y2)
      const padding = Math.max(arrow.strokeWidth / 2, arrow.headSize)
      const width = Math.abs(arrow.x2 - arrow.x) + padding * 2
      const height = Math.max(Math.abs(arrow.y2 - arrow.y) + padding * 2, padding * 2)
      const x1 = arrow.x - minX + padding
      const y1 = arrow.y - minY + padding
      const x2 = arrow.x2 - minX + padding
      const y2 = arrow.y2 - minY + padding
      const markerId = `arrow-${element.name.replace(/\s+/g, '-')}`

      let markers = ''
      if (arrow.endHead) {
        markers += `
${indent}    <marker id="${markerId}-end" markerWidth="${arrow.headSize}" markerHeight="${arrow.headSize}" refX="${arrow.headSize - 1}" refY="${arrow.headSize / 2}" orient="auto" markerUnits="userSpaceOnUse">
${indent}      <path d="M0,0 L0,${arrow.headSize} L${arrow.headSize},${arrow.headSize / 2} Z" fill="${arrow.stroke}" />
${indent}    </marker>`
      }
      if (arrow.startHead) {
        markers += `
${indent}    <marker id="${markerId}-start" markerWidth="${arrow.headSize}" markerHeight="${arrow.headSize}" refX="1" refY="${arrow.headSize / 2}" orient="auto" markerUnits="userSpaceOnUse">
${indent}      <path d="M${arrow.headSize},0 L${arrow.headSize},${arrow.headSize} L0,${arrow.headSize / 2} Z" fill="${arrow.stroke}" />
${indent}    </marker>`
      }

      const markerStart = arrow.startHead ? ` marker-start="url(#${markerId}-start)"` : ''
      const markerEnd = arrow.endHead ? ` marker-end="url(#${markerId}-end)"` : ''

      return `${indent}<svg data-tinyfly="${element.name}" style="position: absolute; left: ${minX - padding}px; top: ${minY - padding}px; width: ${width}px; height: ${height}px; overflow: visible;">
${indent}  <defs>${markers}
${indent}  </defs>
${indent}  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${arrow.stroke}" stroke-width="${arrow.strokeWidth}"${markerStart}${markerEnd} />
${indent}</svg>`
    }

    case 'path': {
      const pathEl = element as PathElement
      return `${indent}<svg data-tinyfly="${element.name}" style="position: absolute; left: ${element.x}px; top: ${element.y}px; width: ${element.width}px; height: ${element.height}px; overflow: visible;">
${indent}  <path d="${pathEl.d}" fill="${pathEl.fill}" stroke="${pathEl.stroke}" stroke-width="${pathEl.strokeWidth}" stroke-linecap="${pathEl.lineCap}" stroke-linejoin="${pathEl.lineJoin}" />
${indent}</svg>`
    }

    default:
      return ''
  }
}

/**
 * HTML for a symbol instance: a positioned container tagged with
 * `data-tinyfly-symbol` (so the player can drive its nested timeline) plus a
 * scaled inner wrapper holding the symbol's contents. The container also carries
 * `data-tinyfly="<name>"` so the scene timeline can move the whole instance.
 */
export function generateSymbolInstanceHtml(
  inst: SymbolInstanceElement,
  symbol: SymbolDefinition,
  indent: string = '  '
): string {
  if (!inst.visible) return ''
  const sx = symbol.width ? inst.width / symbol.width : 1
  const sy = symbol.height ? inst.height / symbol.height : 1
  const inner = symbol.elements
    .filter((e) => e.visible)
    .map((e) => generateElementHtml(e, ''))
    .join('')

  const outer = [
    'position: absolute',
    `left: ${inst.x}px`,
    `top: ${inst.y}px`,
    `width: ${inst.width}px`,
    `height: ${inst.height}px`,
    `opacity: ${inst.opacity}`,
    inst.rotation ? `transform: rotate(${inst.rotation}deg)` : '',
    'overflow: hidden',
  ]
    .filter(Boolean)
    .join('; ')
  const innerStyle = `position:absolute;left:0;top:0;width:${symbol.width}px;height:${symbol.height}px;transform-origin:0 0;transform:scale(${sx},${sy})`

  return `${indent}<div data-tinyfly="${inst.name}" data-tinyfly-symbol="${symbol.id}" style="${outer}"><div style="${innerStyle}">${inner}</div></div>`
}
