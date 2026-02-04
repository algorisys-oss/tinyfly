import { createSignal, createMemo, Show } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import type { SceneStore, SceneElement, RectElement, CircleElement, TextElement, LineElement, ArrowElement, PathElement, ImageElement } from '../stores/scene-store'
import { serializeTimeline } from '../../engine'
import './embed-dialog.css'

interface EmbedDialogProps {
  store: EditorStore
  sceneStore: SceneStore
  isOpen: boolean
  onClose: () => void
}

type EmbedType = 'inline' | 'external'

/**
 * Generate CSS style string for an element
 */
function generateElementStyle(element: SceneElement): string {
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
    // Line, arrow, and path are handled with SVG
    case 'line':
    case 'arrow':
    case 'path':
      // These need special SVG rendering
      break
  }

  return styles.join('; ')
}

/**
 * Generate HTML for an element
 */
function generateElementHtml(element: SceneElement, indent: string = '  '): string {
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

export const EmbedDialog: Component<EmbedDialogProps> = (props) => {
  const [embedType, setEmbedType] = createSignal<EmbedType>('inline')
  const [copied, setCopied] = createSignal(false)

  const animationJson = createMemo(() => {
    // Access tracks() to trigger reactivity when tracks change
    const tracks = props.store.tracks()
    if (!props.store.state.timeline) return ''
    // tracks variable ensures memo recomputes when tracks are added/removed
    void tracks
    return JSON.stringify(serializeTimeline(props.store.state.timeline), null, 2)
  })

  const animationJsonMinified = createMemo(() => {
    // Access tracks() to trigger reactivity when tracks change
    const tracks = props.store.tracks()
    if (!props.store.state.timeline) return ''
    // tracks variable ensures memo recomputes when tracks are added/removed
    void tracks
    return JSON.stringify(serializeTimeline(props.store.state.timeline))
  })

  // Generate HTML for all scene elements
  const elementsHtml = createMemo(() => {
    const elements = props.sceneStore.getTopLevelElements()
    if (elements.length === 0) {
      return '  <!-- Add your target elements here -->\n  <div data-tinyfly="Box" style="position: absolute; left: 40px; top: 70px; width: 60px; height: 60px; background: #4a9eff; border-radius: 4px;"></div>'
    }
    return elements
      .filter(el => el.visible && el.type !== 'group')
      .map(el => generateElementHtml(el))
      .filter(Boolean)
      .join('\n')
  })

  const containerStyle = createMemo(() => {
    // Use project dimensions if available, or defaults
    return 'position: relative; width: 300px; height: 200px; background: #252525; overflow: hidden;'
  })

  const inlineCode = createMemo(() => {
    const json = animationJsonMinified()
    if (!json) return ''

    return `<!-- Tinyfly Animation -->
<style>
  #tinyfly-container { ${containerStyle()} }
</style>

<div id="tinyfly-container">
${elementsHtml()}
</div>

<script src="tinyfly-player.iife.js"></script>
<script>
const animation = ${json};

tinyfly.play('#tinyfly-container', animation, {
  loop: -1,  // -1 for infinite loop
  autoplay: true
});
</script>`
  })

  const externalCode = createMemo(() => {
    return `<!-- Tinyfly Animation -->
<style>
  #tinyfly-container { ${containerStyle()} }
</style>

<div id="tinyfly-container">
${elementsHtml()}
</div>

<script src="tinyfly-player.iife.js"></script>
<script>
// Load animation from external JSON file
tinyfly.play('#tinyfly-container', './animation.json', {
  loop: -1,  // -1 for infinite loop
  autoplay: true
});
</script>`
  })

  const currentCode = createMemo(() => {
    return embedType() === 'inline' ? inlineCode() : externalCode()
  })

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownloadJson = () => {
    const json = animationJson()
    if (!json) return

    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'animation.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose()
    }
  }

  return (
    <Show when={props.isOpen}>
      <div class="embed-dialog-overlay" onClick={handleOverlayClick}>
        <div class="embed-dialog">
          <div class="embed-dialog-header">
            <h2>Embed Animation</h2>
            <button class="embed-close-btn" onClick={props.onClose}>
              ×
            </button>
          </div>

          <div class="embed-dialog-content">
            <div class="embed-type-selector">
              <button
                class="embed-type-btn"
                classList={{ active: embedType() === 'inline' }}
                onClick={() => setEmbedType('inline')}
              >
                Inline JSON
              </button>
              <button
                class="embed-type-btn"
                classList={{ active: embedType() === 'external' }}
                onClick={() => setEmbedType('external')}
              >
                External File
              </button>
            </div>

            <div class="embed-description">
              {embedType() === 'inline' ? (
                <p>Animation data is embedded directly in the HTML. Best for small animations.</p>
              ) : (
                <p>Animation loads from a separate JSON file. Better for larger animations.</p>
              )}
            </div>

            <div class="embed-code-container">
              <pre class="embed-code">{currentCode()}</pre>
            </div>

            <div class="embed-actions">
              <button class="embed-btn embed-btn-primary" onClick={handleCopy}>
                {copied() ? 'Copied!' : 'Copy Code'}
              </button>
              <Show when={embedType() === 'external'}>
                <button class="embed-btn" onClick={handleDownloadJson}>
                  Download JSON
                </button>
              </Show>
            </div>

            <div class="embed-instructions">
              <h4>Instructions</h4>
              <ol>
                <li>Build the player: <code>npm run build:player</code></li>
                <li>Copy <code>dist/player/tinyfly-player.iife.js</code> to your project</li>
                <li>Copy the code above into your HTML</li>
                <li>Adjust the script src path if needed</li>
              </ol>
              <p class="embed-note">
                <strong>Note:</strong> The <code>data-tinyfly</code> attribute must match the target names in your animation tracks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Show>
  )
}

export default EmbedDialog
