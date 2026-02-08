import { createSignal, createMemo, Show } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import type { SceneStore } from '../stores/scene-store'
import type { ProjectStore } from '../stores/project-store'
import { serializeTimeline } from '../../engine'
import { generateElementHtml } from '../utils/element-html'
import './embed-dialog.css'

interface EmbedDialogProps {
  store: EditorStore
  sceneStore: SceneStore
  projectStore: ProjectStore
  isOpen: boolean
  onClose: () => void
  sceneName?: string
}

type EmbedType = 'inline' | 'external'
type EmbedScope = 'single' | 'sequence'

export const EmbedDialog: Component<EmbedDialogProps> = (props) => {
  const [embedType, setEmbedType] = createSignal<EmbedType>('inline')
  const [embedScope, setEmbedScope] = createSignal<EmbedScope>('single')
  const [copied, setCopied] = createSignal(false)

  const hasMultipleScenes = () => props.projectStore.getScenes().length > 1

  const animationJson = createMemo(() => {
    const tracks = props.store.tracks()
    if (!props.store.state.timeline) return ''
    void tracks
    return JSON.stringify(serializeTimeline(props.store.state.timeline), null, 2)
  })

  const animationJsonMinified = createMemo(() => {
    const tracks = props.store.tracks()
    if (!props.store.state.timeline) return ''
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
    return 'position: relative; width: 300px; height: 200px; background: #252525; overflow: hidden;'
  })

  // Sequence JSON for multi-scene embed
  const sequenceJson = createMemo(() => {
    if (embedScope() !== 'sequence') return ''
    const seq = props.projectStore.exportSequence()
    return JSON.stringify(seq, null, 2)
  })

  const sequenceJsonMinified = createMemo(() => {
    if (embedScope() !== 'sequence') return ''
    const seq = props.projectStore.exportSequence()
    return JSON.stringify(seq)
  })

  // Single-scene codes
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

  // Multi-scene (sequence) codes
  const sequenceInlineCode = createMemo(() => {
    const json = sequenceJsonMinified()
    if (!json) return ''

    return `<!-- Tinyfly Animation Sequence -->
<style>
  #tinyfly-sequence { ${containerStyle()} }
</style>

<div id="tinyfly-sequence"></div>

<script src="tinyfly-player.iife.js"></script>
<script>
const sequence = ${json};

tinyfly.playSequence('#tinyfly-sequence', sequence, {
  loop: -1,  // -1 for infinite loop
  autoplay: true
});
</script>`
  })

  const sequenceExternalCode = createMemo(() => {
    return `<!-- Tinyfly Animation Sequence -->
<style>
  #tinyfly-sequence { ${containerStyle()} }
</style>

<div id="tinyfly-sequence"></div>

<script src="tinyfly-player.iife.js"></script>
<script>
// Load sequence from external JSON file
tinyfly.playSequence('#tinyfly-sequence', './sequence.json', {
  loop: -1,  // -1 for infinite loop
  autoplay: true
});
</script>`
  })

  const currentCode = createMemo(() => {
    if (embedScope() === 'sequence') {
      return embedType() === 'inline' ? sequenceInlineCode() : sequenceExternalCode()
    }
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
    if (embedScope() === 'sequence') {
      const json = sequenceJson()
      if (!json) return
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'sequence.json'
      a.click()
      URL.revokeObjectURL(url)
    } else {
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
            <Show when={embedScope() === 'single' && props.sceneName}>
              <span style="font-size: 12px; color: #888; margin-left: 8px;">Scene: {props.sceneName}</span>
            </Show>
            <Show when={embedScope() === 'sequence'}>
              <span style="font-size: 12px; color: #4a9eff; margin-left: 8px;">All Scenes ({props.projectStore.getScenes().length})</span>
            </Show>
            <button class="embed-close-btn" onClick={props.onClose}>
              &times;
            </button>
          </div>

          <div class="embed-dialog-content">
            {/* Scope selector: single scene vs all scenes */}
            <Show when={hasMultipleScenes()}>
              <div class="embed-scope-selector">
                <button
                  class="embed-scope-btn"
                  classList={{ active: embedScope() === 'single' }}
                  onClick={() => setEmbedScope('single')}
                >
                  Single Scene
                </button>
                <button
                  class="embed-scope-btn"
                  classList={{ active: embedScope() === 'sequence' }}
                  onClick={() => setEmbedScope('sequence')}
                >
                  All Scenes (Sequence)
                </button>
              </div>
            </Show>

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
              <Show when={embedScope() === 'sequence'} fallback={
                embedType() === 'inline' ? (
                  <p>Animation data is embedded directly in the HTML. Best for small animations.</p>
                ) : (
                  <p>Animation loads from a separate JSON file. Better for larger animations.</p>
                )
              }>
                {embedType() === 'inline' ? (
                  <p>All scenes with transitions embedded directly in the HTML. Uses the TinyflySequencer for playback.</p>
                ) : (
                  <p>All scenes load from a separate JSON file. Uses the TinyflySequencer for playback.</p>
                )}
              </Show>
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
                  {embedScope() === 'sequence' ? 'Download Sequence JSON' : 'Download JSON'}
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
              <Show when={embedScope() === 'single'}>
                <p class="embed-note">
                  <strong>Note:</strong> The <code>data-tinyfly</code> attribute must match the target names in your animation tracks.
                </p>
              </Show>
              <Show when={embedScope() === 'sequence'}>
                <p class="embed-note">
                  <strong>Note:</strong> The sequencer automatically creates elements and transitions between scenes. Scene elements are rendered from the sequence JSON data.
                </p>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </Show>
  )
}

export default EmbedDialog
