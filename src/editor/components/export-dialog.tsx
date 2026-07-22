import { createSignal, createMemo, Show, For } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import type { SceneStore } from '../stores/scene-store'
import type { ProjectStore } from '../stores/project-store'
import {
  exportToCSS,
  exportToLottieJSON,
  exportToGIF,
  downloadGIF,
  exportToWebP,
  downloadWebP,
  isWebPExportSupported,
  exportVideo,
  getVideoExportFormats,
  downloadVideo,
} from '../../engine/export'
import { buildExportComposite } from '../utils/export-composite'
import { expandSymbolInstances } from '../utils/expand-symbols'
import { useEscapeClose } from '../utils/use-escape-close'
import { slugifyFilename } from '../utils/filename'
import './export-dialog.css'

interface ExportDialogProps {
  store: EditorStore
  sceneStore: SceneStore
  projectStore: ProjectStore
  isOpen: boolean
  onClose: () => void
  sceneName?: string
}

type ExportFormat = 'css' | 'lottie' | 'gif' | 'webp' | 'video'

/** Formats that rasterise the scene frame by frame. */
const RASTER_FORMATS: ExportFormat[] = ['gif', 'webp', 'video']

export const ExportDialog: Component<ExportDialogProps> = (props) => {
  useEscapeClose(() => props.isOpen, () => props.onClose())
  const [format, setFormat] = createSignal<ExportFormat>('css')
  const [copied, setCopied] = createSignal(false)
  const [minify, setMinify] = createSignal(false)
  const [lottieWidth, setLottieWidth] = createSignal(512)
  const [lottieHeight, setLottieHeight] = createSignal(512)
  const [lottieFrameRate, setLottieFrameRate] = createSignal(60)

  // Shared raster settings. Exporting at 2x and letting the player downscale
  // keeps text and edges crisp, which a 1x export visibly loses.
  const [scale, setScale] = createSignal(2)
  const [fps, setFps] = createSignal(30)
  const [transparent, setTransparent] = createSignal(false)
  const canvasSize = () => props.projectStore.currentProject().canvas
  // Null until the user picks a colour, so the artboard background is followed
  // by default and exports match what the preview shows.
  const [backgroundOverride, setBackgroundOverride] = createSignal<string | null>(null)
  const background = () => backgroundOverride() ?? canvasSize().background
  const setBackground = (value: string) => setBackgroundOverride(value)

  // GIF settings
  const [gifColors, setGifColors] = createSignal(255)
  const [gifDither, setGifDither] = createSignal(true)

  // WebP settings
  const [webpQuality, setWebpQuality] = createSignal(0.85)

  // Video settings
  const videoFormats = getVideoExportFormats()
  const [videoFormat, setVideoFormat] = createSignal(videoFormats[0]?.id ?? '')

  const [exporting, setExporting] = createSignal(false)
  const [progress, setProgress] = createSignal(0)
  const [exportError, setExportError] = createSignal('')
  const [abortController, setAbortController] = createSignal<AbortController | null>(null)

  const webpSupported = isWebPExportSupported()

  const outputWidth = () => Math.max(2, Math.round(canvasSize().width * scale()))
  const outputHeight = () => Math.max(2, Math.round(canvasSize().height * scale()))

  /** MP4 has no alpha channel, so transparency only applies to GIF and WebP. */
  const supportsTransparency = () => format() === 'gif' || format() === 'webp'
  const effectiveBackground = () =>
    supportsTransparency() && transparent() ? undefined : background()

  const selectedVideoFormat = () =>
    videoFormats.find((f) => f.id === videoFormat()) ?? videoFormats[0]

  /** Extension the current format will produce, shown next to the name field. */
  const currentExtension = () => {
    switch (format()) {
      case 'css':
        return 'css'
      case 'lottie':
        return 'json'
      case 'gif':
        return 'gif'
      case 'webp':
        return 'webp'
      default:
        return selectedVideoFormat()?.extension ?? 'mp4'
    }
  }

  // Null until the user types, so the field tracks the project name until it is
  // deliberately overridden.
  const [filenameOverride, setFilenameOverride] = createSignal<string | null>(null)
  const defaultFilename = () =>
    slugifyFilename(
      props.projectStore.currentProject().name || props.store.state.timeline?.name || ''
    )
  /** What the field shows: the user's text, or the project-derived default. */
  const filenameInput = () => filenameOverride() ?? defaultFilename()
  /** What actually gets written to disk, always safe. */
  const baseFilename = () => slugifyFilename(filenameInput())

  /**
   * Run a frame-based export.
   *
   * Builds the composite renderer once (so image and video layers are drawn
   * too), scales the context up to the output resolution, and hands a single
   * draw callback to whichever encoder was chosen.
   */
  const runRasterExport = async () => {
    const timeline = props.store.state.timeline
    if (!timeline || exporting()) return

    const canvas = canvasSize()
    const outW = outputWidth()
    const outH = outputHeight()
    const scaleX = outW / canvas.width
    const scaleY = outH / canvas.height

    const controller = new AbortController()
    setAbortController(controller)
    setExportError('')
    setExporting(true)
    setProgress(0)

    // Make sure any custom webfonts are loaded so Canvas text renders correctly.
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      try { await document.fonts.ready } catch { /* ignore */ }
    }

    // Flatten symbol instances, then composite the DOM-only layers (image +
    // video) the Canvas renderer skips.
    const flattened = expandSymbolInstances(props.sceneStore.elements(), props.projectStore.getSymbol)
    const composite = await buildExportComposite(flattened)

    const draw = async (ctx: CanvasRenderingContext2D, timeMs: number) => {
      await composite.prepareFrame(timeMs)
      composite.adapter.applyState(timeline.getStateAtTime(timeMs))
      ctx.save()
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.scale(scaleX, scaleY)
      composite.adapter.render(ctx)
      ctx.restore()
    }

    try {
      if (format() === 'gif') {
        const blob = await exportToGIF(timeline, {
          width: outW,
          height: outH,
          frameRate: fps(),
          backgroundColor: effectiveBackground(),
          dither: gifDither(),
          maxColors: gifColors(),
          renderFrame: (ctx, _values, time) => draw(ctx, time),
          onProgress: setProgress,
          signal: controller.signal,
        })
        downloadGIF(blob, `${baseFilename()}.gif`)
      } else if (format() === 'webp') {
        const blob = await exportToWebP(timeline, {
          width: outW,
          height: outH,
          frameRate: fps(),
          quality: webpQuality(),
          backgroundColor: effectiveBackground(),
          renderFrame: (ctx, _values, time) => draw(ctx, time),
          onProgress: setProgress,
          signal: controller.signal,
        })
        downloadWebP(blob, `${baseFilename()}.webp`)
      } else {
        const { blob, extension } = await exportVideo({
          width: outW,
          height: outH,
          fps: fps(),
          durationMs: timeline.duration,
          format: videoFormat(),
          background: background(),
          renderFrame: draw,
          onProgress: setProgress,
          signal: controller.signal,
        })
        downloadVideo(blob, `${baseFilename()}.${extension}`)
      }
    } catch (err) {
      setExportError(err instanceof Error ? err.message : String(err))
    } finally {
      composite.dispose()
      setAbortController(null)
      setExporting(false)
    }
  }

  const cancelExport = () => abortController()?.abort()

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
      default:
        return ''
    }
  })

  const isTextFormat = () => format() === 'css' || format() === 'lottie'

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

    const isCSS = format() === 'css'
    const blob = new Blob([output], { type: isCSS ? 'text/css' : 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${baseFilename()}.${isCSS ? 'css' : 'json'}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose()
    }
  }

  /** Whether the chosen format can run in this browser. */
  const exportBlockedReason = () => {
    if (format() === 'webp' && !webpSupported) {
      return "This browser can't encode WebP from a canvas. Try Chrome, Edge, or Firefox."
    }
    if (format() === 'video' && videoFormats.length === 0) {
      return "This browser can't export video (no WebCodecs or MediaRecorder). Try Chrome or Edge."
    }
    return ''
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
                classList={{ active: format() === 'webp' }}
                onClick={() => setFormat('webp')}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2zm0 4.2L7.2 9v6l4.8 2.8 4.8-2.8V9L12 6.2z" fill="currentColor"/>
                </svg>
                WebP
              </button>
              <button
                class="export-format-btn"
                classList={{ active: format() === 'video' }}
                onClick={() => setFormat('video')}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" fill="currentColor"/>
                </svg>
                MP4
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
                <p>Export a real animated GIF — frames are quantized to a 255-colour palette per frame and LZW-compressed. Supports a transparent background.</p>
              )}
              {format() === 'webp' && (
                <p>Export an animated WebP. Much smaller and truer in colour than GIF, with full alpha, and supported by every modern browser.</p>
              )}
              {format() === 'video' && (
                <p>
                  Export an MP4 (H.264). Shapes, text, paths, images, and video layers are all composited in, with video layers seeked in sync with the timeline.
                  <Show when={selectedVideoFormat()?.deterministic}>
                    {' '}Encoded frame by frame via WebCodecs — faster than real time and reproducible.
                  </Show>
                </p>
              )}
            </div>

            {/* Applies to every format, so it sits above the per-format options. */}
            <div class="export-options">
              <div class="export-option-row">
                <label class="export-filename-label">
                  Filename:
                  <input
                    type="text"
                    class="export-filename-input"
                    value={filenameInput()}
                    disabled={exporting()}
                    placeholder={defaultFilename()}
                    onInput={(e) => setFilenameOverride(e.currentTarget.value)}
                  />
                  <span class="export-filename-ext">.{currentExtension()}</span>
                </label>
                <Show when={filenameOverride() !== null}>
                  <button
                    class="export-btn export-btn-inline"
                    disabled={exporting()}
                    onClick={() => setFilenameOverride(null)}
                  >
                    Reset
                  </button>
                </Show>
              </div>
              <Show when={baseFilename() !== filenameInput()}>
                <p class="export-video-hint">
                  Saved as <strong>{baseFilename()}.{currentExtension()}</strong>
                </p>
              </Show>
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

              <Show when={RASTER_FORMATS.includes(format())}>
                <div class="export-option-row">
                  <label>
                    Resolution:
                    <select
                      value={String(scale())}
                      disabled={exporting()}
                      onChange={(e) => setScale(parseFloat(e.currentTarget.value))}
                    >
                      <option value="1">1x</option>
                      <option value="2">2x</option>
                      <option value="3">3x</option>
                      <option value="4">4x</option>
                    </select>
                  </label>
                  <label>
                    FPS:
                    <input
                      type="number"
                      value={fps()}
                      disabled={exporting()}
                      onChange={(e) => setFps(parseInt(e.target.value) || 30)}
                    />
                  </label>
                  <Show when={format() === 'video' && videoFormats.length > 1}>
                    <label>
                      Format:
                      <select
                        value={videoFormat()}
                        disabled={exporting()}
                        onChange={(e) => setVideoFormat(e.currentTarget.value)}
                      >
                        <For each={videoFormats}>
                          {(f) => <option value={f.id}>{f.label}</option>}
                        </For>
                      </select>
                    </label>
                  </Show>
                  <Show when={format() === 'gif'}>
                    <label>
                      Colors:
                      <input
                        type="number"
                        min="2"
                        max="255"
                        value={gifColors()}
                        disabled={exporting()}
                        onChange={(e) => setGifColors(Math.max(2, Math.min(255, parseInt(e.target.value) || 255)))}
                      />
                    </label>
                  </Show>
                  <Show when={format() === 'webp'}>
                    <label>
                      Quality:
                      <input
                        type="number"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={webpQuality()}
                        disabled={exporting()}
                        onChange={(e) => setWebpQuality(Math.max(0.1, Math.min(1, parseFloat(e.target.value) || 0.85)))}
                      />
                    </label>
                  </Show>
                </div>

                <div class="export-option-row">
                  <Show when={!transparent() || !supportsTransparency()}>
                    <label>
                      Background:
                      <input
                        type="color"
                        value={background()}
                        disabled={exporting()}
                        onChange={(e) => setBackground(e.currentTarget.value)}
                      />
                    </label>
                  </Show>
                  <Show when={supportsTransparency()}>
                    <label class="export-checkbox">
                      <input
                        type="checkbox"
                        checked={transparent()}
                        disabled={exporting()}
                        onChange={(e) => setTransparent(e.target.checked)}
                      />
                      Transparent background
                    </label>
                  </Show>
                  <Show when={format() === 'gif'}>
                    <label class="export-checkbox">
                      <input
                        type="checkbox"
                        checked={gifDither()}
                        disabled={exporting()}
                        onChange={(e) => setGifDither(e.target.checked)}
                      />
                      Dither
                    </label>
                  </Show>
                </div>
              </Show>
            </div>

            <Show when={isTextFormat()}>
              <div class="export-code-container">
                <pre class="export-code">{currentOutput()}</pre>
              </div>
            </Show>

            <Show when={RASTER_FORMATS.includes(format())}>
              <div class="export-video-panel">
                <p class="export-video-hint">
                  Output: {outputWidth()}×{outputHeight()} at {fps()} fps
                  <Show when={scale() > 1}> ({scale()}x the {canvasSize().width}×{canvasSize().height} canvas)</Show>
                </p>
                <Show when={exportBlockedReason()}>
                  <p class="export-video-unsupported">{exportBlockedReason()}</p>
                </Show>
                <Show when={exporting()}>
                  <div class="export-progress">
                    <div class="export-progress-bar" style={{ width: `${Math.round(progress() * 100)}%` }} />
                  </div>
                  <p class="export-video-hint">
                    Rendering… {Math.round(progress() * 100)}%
                    <Show when={format() === 'video' && !selectedVideoFormat()?.deterministic}>
                      {' '}(records in real time)
                    </Show>
                  </p>
                </Show>
                <Show when={exportError()}>
                  <p class="export-video-unsupported">{exportError()}</p>
                </Show>
              </div>
            </Show>

            <div class="export-actions">
              <Show when={isTextFormat()}>
                <button class="export-btn export-btn-primary" onClick={handleCopy}>
                  {copied() ? 'Copied!' : 'Copy'}
                </button>
                <button class="export-btn" onClick={handleDownload}>
                  Download
                </button>
              </Show>
              <Show when={RASTER_FORMATS.includes(format())}>
                <button
                  class="export-btn export-btn-primary"
                  disabled={exporting() || !!exportBlockedReason()}
                  onClick={runRasterExport}
                >
                  {exporting() ? 'Exporting…' : `Export ${format().toUpperCase()}`}
                </button>
                <Show when={exporting()}>
                  <button class="export-btn" onClick={cancelExport}>
                    Cancel
                  </button>
                </Show>
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
                  <li>Pick a resolution and frame rate — higher FPS means a bigger file</li>
                  <li>Lower <strong>Colors</strong> for a smaller file; turn off <strong>Dither</strong> for flat, banded colour</li>
                  <li>Click <strong>Export GIF</strong> — the file downloads when encoding finishes</li>
                </ol>
              )}
              {format() === 'webp' && (
                <ol>
                  <li>Pick a resolution, frame rate, and quality (0.1–1)</li>
                  <li>Enable <strong>Transparent background</strong> for a WebP with alpha</li>
                  <li>Click <strong>Export WEBP</strong> — use it in an <code>&lt;img&gt;</code> just like a GIF</li>
                </ol>
              )}
              {format() === 'video' && (
                <ol>
                  <li>Pick a resolution — <strong>2x</strong> keeps text and edges crisp</li>
                  <li>Choose a frame rate and format</li>
                  <li>Click <strong>Export MP4</strong> — the file downloads when encoding finishes</li>
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
