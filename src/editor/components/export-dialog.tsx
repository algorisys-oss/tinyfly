import { createSignal, createMemo, Show, For } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import type { SceneStore } from '../stores/scene-store'
import type { ProjectStore } from '../stores/project-store'
import { exportToCSS, exportToLottieJSON, exportToVideo, getSupportedVideoCodecs, downloadVideo } from '../../engine/export'
import { buildExportComposite } from '../utils/export-composite'
import './export-dialog.css'

interface ExportDialogProps {
  store: EditorStore
  sceneStore: SceneStore
  projectStore: ProjectStore
  isOpen: boolean
  onClose: () => void
  sceneName?: string
}

type ExportFormat = 'css' | 'lottie' | 'gif' | 'video'

export const ExportDialog: Component<ExportDialogProps> = (props) => {
  const [format, setFormat] = createSignal<ExportFormat>('css')
  const [copied, setCopied] = createSignal(false)
  const [minify, setMinify] = createSignal(false)
  const [lottieWidth, setLottieWidth] = createSignal(512)
  const [lottieHeight, setLottieHeight] = createSignal(512)
  const [lottieFrameRate, setLottieFrameRate] = createSignal(60)

  // Video export
  const codecs = getSupportedVideoCodecs()
  const [videoWidth, setVideoWidth] = createSignal(0)
  const [videoHeight, setVideoHeight] = createSignal(0)
  const [videoFps, setVideoFps] = createSignal(30)
  const [videoMime, setVideoMime] = createSignal(codecs[0]?.mimeType ?? '')
  const [exporting, setExporting] = createSignal(false)
  const [progress, setProgress] = createSignal(0)
  const [videoError, setVideoError] = createSignal('')

  // Default the video size to the project canvas the first time the tab is opened.
  const ensureVideoSize = () => {
    if (videoWidth() === 0 || videoHeight() === 0) {
      const canvas = props.projectStore.currentProject().canvas
      setVideoWidth(canvas.width)
      setVideoHeight(canvas.height)
    }
  }

  const handleExportVideo = async () => {
    const timeline = props.store.state.timeline
    if (!timeline || exporting()) return
    const canvas = props.projectStore.currentProject().canvas
    const outW = videoWidth() || canvas.width
    const outH = videoHeight() || canvas.height
    const scaleX = outW / canvas.width
    const scaleY = outH / canvas.height

    setVideoError('')
    setExporting(true)
    setProgress(0)
    // Build a renderer that also composites image/video layers (device screens,
    // screenshots) that the Canvas renderer skips on its own.
    const composite = await buildExportComposite(props.sceneStore.elements())
    try {
      const codec = codecs.find((c) => c.mimeType === videoMime()) ?? codecs[0]
      const blob = await exportToVideo({
        width: outW,
        height: outH,
        fps: videoFps(),
        durationMs: timeline.duration,
        mimeType: codec?.mimeType,
        renderFrame: async (ctx, t) => {
          await composite.prepareFrame(t)
          composite.adapter.applyState(timeline.getStateAtTime(t))
          ctx.save()
          ctx.scale(scaleX, scaleY)
          composite.adapter.render(ctx)
          ctx.restore()
        },
        onProgress: (f) => setProgress(f),
      })
      downloadVideo(blob, `${(timeline.name || 'animation').replace(/\s+/g, '-').toLowerCase()}.${codec?.extension ?? 'webm'}`)
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : String(err))
    } finally {
      composite.dispose()
      setExporting(false)
    }
  }

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
              <button
                class="export-format-btn"
                classList={{ active: format() === 'video' }}
                onClick={() => { setFormat('video'); ensureVideoSize() }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" fill="currentColor"/>
                </svg>
                Video
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
              {format() === 'video' && (
                <p>Record the animation to an MP4/WebM video — shapes, text, paths, images, and video layers (e.g. a device screen) are all composited in. Video layers are seeked in sync with the timeline.</p>
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

              {format() === 'video' && (
                <div class="export-option-row">
                  <label>
                    Width:
                    <input
                      type="number"
                      value={videoWidth()}
                      disabled={exporting()}
                      onChange={(e) => setVideoWidth(parseInt(e.target.value) || 0)}
                    />
                  </label>
                  <label>
                    Height:
                    <input
                      type="number"
                      value={videoHeight()}
                      disabled={exporting()}
                      onChange={(e) => setVideoHeight(parseInt(e.target.value) || 0)}
                    />
                  </label>
                  <label>
                    FPS:
                    <input
                      type="number"
                      value={videoFps()}
                      disabled={exporting()}
                      onChange={(e) => setVideoFps(parseInt(e.target.value) || 30)}
                    />
                  </label>
                  <Show when={codecs.length > 0}>
                    <label>
                      Format:
                      <select value={videoMime()} disabled={exporting()} onChange={(e) => setVideoMime(e.currentTarget.value)}>
                        <For each={codecs}>
                          {(c) => <option value={c.mimeType}>{c.label}</option>}
                        </For>
                      </select>
                    </label>
                  </Show>
                </div>
              )}
            </div>

            <Show when={format() === 'css' || format() === 'lottie'}>
              <div class="export-code-container">
                <pre class="export-code">{currentOutput()}</pre>
              </div>
            </Show>

            <Show when={format() === 'video'}>
              <div class="export-video-panel">
                <Show when={codecs.length === 0}>
                  <p class="export-video-unsupported">This browser can't record video (MediaRecorder unavailable). Try Chrome or Edge.</p>
                </Show>
                <Show when={exporting()}>
                  <div class="export-progress">
                    <div class="export-progress-bar" style={{ width: `${Math.round(progress() * 100)}%` }} />
                  </div>
                  <p class="export-video-hint">Recording… {Math.round(progress() * 100)}% (plays through in real time)</p>
                </Show>
                <Show when={videoError()}>
                  <p class="export-video-unsupported">{videoError()}</p>
                </Show>
              </div>
            </Show>

            <div class="export-actions">
              <Show when={format() === 'css' || format() === 'lottie'}>
                <button class="export-btn export-btn-primary" onClick={handleCopy}>
                  {copied() ? 'Copied!' : 'Copy'}
                </button>
                <button class="export-btn" onClick={handleDownload}>
                  Download
                </button>
              </Show>
              <Show when={format() === 'video'}>
                <button
                  class="export-btn export-btn-primary"
                  disabled={exporting() || codecs.length === 0}
                  onClick={handleExportVideo}
                >
                  {exporting() ? 'Recording…' : 'Export Video'}
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
              {format() === 'video' && (
                <ol>
                  <li>Pick a size (defaults to the canvas), FPS, and format</li>
                  <li>Click <strong>Export Video</strong> — the animation plays through once while recording</li>
                  <li>The file downloads when recording finishes</li>
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
