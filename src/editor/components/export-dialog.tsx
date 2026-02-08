import { createSignal, createMemo, Show } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import type { SceneStore } from '../stores/scene-store'
import { exportToCSS, exportToLottieJSON } from '../../engine/export'
import './export-dialog.css'

interface ExportDialogProps {
  store: EditorStore
  sceneStore: SceneStore
  isOpen: boolean
  onClose: () => void
  sceneName?: string
}

type ExportFormat = 'css' | 'lottie' | 'gif'

export const ExportDialog: Component<ExportDialogProps> = (props) => {
  const [format, setFormat] = createSignal<ExportFormat>('css')
  const [copied, setCopied] = createSignal(false)
  const [minify, setMinify] = createSignal(false)
  const [lottieWidth, setLottieWidth] = createSignal(512)
  const [lottieHeight, setLottieHeight] = createSignal(512)
  const [lottieFrameRate, setLottieFrameRate] = createSignal(60)

  const cssOutput = createMemo(() => {
    const timeline = props.store.state.timeline
    if (!timeline) return ''
    // Trigger reactivity
    props.store.tracks()
    return exportToCSS(timeline, { minify: minify() }).css
  })

  const lottieOutput = createMemo(() => {
    const timeline = props.store.state.timeline
    if (!timeline) return ''
    // Trigger reactivity
    props.store.tracks()
    return exportToLottieJSON(timeline, {
      width: lottieWidth(),
      height: lottieHeight(),
      frameRate: lottieFrameRate(),
      name: timeline.name || 'Animation',
    })
  })

  const currentOutput = createMemo(() => {
    switch (format()) {
      case 'css':
        return cssOutput()
      case 'lottie':
        return lottieOutput()
      case 'gif':
        return '// GIF export requires canvas rendering.\n// Use the exportToGIF() function programmatically with a render callback.'
      default:
        return ''
    }
  })

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentOutput())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownload = () => {
    const output = currentOutput()
    if (!output) return

    let filename: string
    let mimeType: string

    switch (format()) {
      case 'css':
        filename = 'animation.css'
        mimeType = 'text/css'
        break
      case 'lottie':
        filename = 'animation.json'
        mimeType = 'application/json'
        break
      default:
        return
    }

    const blob = new Blob([output], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
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
      <div class="export-dialog-overlay" onClick={handleOverlayClick}>
        <div class="export-dialog">
          <div class="export-dialog-header">
            <h2>Export Animation</h2>
            {props.sceneName && <span style="font-size: 12px; color: #888; margin-left: 8px;">Scene: {props.sceneName}</span>}
            <button class="export-close-btn" onClick={props.onClose}>
              ×
            </button>
          </div>

          <div class="export-dialog-content">
            <div class="export-format-selector">
              <button
                class="export-format-btn"
                classList={{ active: format() === 'css' }}
                onClick={() => setFormat('css')}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M5 3l-.65 3.34h13.59L17.5 8.5H3.92l-.66 3.33h13.59l-.76 3.81-5.48 1.81-4.75-1.81.33-1.64H2.85l-.79 4 7.85 3 9.05-3 1.2-6.03.24-1.21L21.94 3H5z" fill="currentColor"/>
                </svg>
                CSS
              </button>
              <button
                class="export-format-btn"
                classList={{ active: format() === 'lottie' }}
                onClick={() => setFormat('lottie')}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                </svg>
                Lottie
              </button>
              <button
                class="export-format-btn"
                classList={{ active: format() === 'gif' }}
                onClick={() => setFormat('gif')}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor"/>
                </svg>
                GIF
              </button>
            </div>

            <div class="export-description">
              {format() === 'css' && (
                <p>Export as CSS @keyframes animations. Works with any HTML/CSS workflow.</p>
              )}
              {format() === 'lottie' && (
                <p>Export as Lottie JSON for use with lottie-web, Bodymovin, or After Effects.</p>
              )}
              {format() === 'gif' && (
                <p>Export as animated GIF. Requires programmatic usage with canvas rendering.</p>
              )}
            </div>

            {/* Format-specific options */}
            <div class="export-options">
              {format() === 'css' && (
                <label class="export-checkbox">
                  <input
                    type="checkbox"
                    checked={minify()}
                    onChange={(e) => setMinify(e.target.checked)}
                  />
                  Minify output
                </label>
              )}

              {format() === 'lottie' && (
                <div class="export-option-row">
                  <label>
                    Width:
                    <input
                      type="number"
                      value={lottieWidth()}
                      onChange={(e) => setLottieWidth(parseInt(e.target.value) || 512)}
                    />
                  </label>
                  <label>
                    Height:
                    <input
                      type="number"
                      value={lottieHeight()}
                      onChange={(e) => setLottieHeight(parseInt(e.target.value) || 512)}
                    />
                  </label>
                  <label>
                    FPS:
                    <input
                      type="number"
                      value={lottieFrameRate()}
                      onChange={(e) => setLottieFrameRate(parseInt(e.target.value) || 60)}
                    />
                  </label>
                </div>
              )}
            </div>

            <div class="export-code-container">
              <pre class="export-code">{currentOutput()}</pre>
            </div>

            <div class="export-actions">
              <Show when={format() !== 'gif'}>
                <button class="export-btn export-btn-primary" onClick={handleCopy}>
                  {copied() ? 'Copied!' : 'Copy'}
                </button>
                <button class="export-btn" onClick={handleDownload}>
                  Download
                </button>
              </Show>
              <Show when={format() === 'gif'}>
                <div class="export-gif-note">
                  <p>GIF export is available programmatically:</p>
                  <code>
                    {`import { exportToGIF } from 'tinyfly/export'

exportToGIF(timeline, {
  width: 300,
  height: 200,
  frameRate: 30,
  renderFrame: (ctx, values, time) => {
    // Draw your animation frame
  }
}).then(blob => {
  // Download or use the GIF blob
})`}
                  </code>
                </div>
              </Show>
            </div>

            <div class="export-instructions">
              <h4>Usage</h4>
              {format() === 'css' && (
                <ol>
                  <li>Add the CSS to your stylesheet</li>
                  <li>Apply the generated class to your element</li>
                  <li>Customize animation-duration, iteration-count as needed</li>
                </ol>
              )}
              {format() === 'lottie' && (
                <ol>
                  <li>Save the JSON file</li>
                  <li>Install lottie-web: <code>npm install lottie-web</code></li>
                  <li>Load with: <code>lottie.loadAnimation({'{'} path: 'animation.json' {'}'})</code></li>
                </ol>
              )}
              {format() === 'gif' && (
                <ol>
                  <li>Import the exportToGIF function</li>
                  <li>Provide a renderFrame callback that draws to canvas</li>
                  <li>The function returns a Promise with the GIF Blob</li>
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>
    </Show>
  )
}

export default ExportDialog
