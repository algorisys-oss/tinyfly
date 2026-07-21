import { exportToMP4, isWebCodecsMP4Supported } from './mp4'

/**
 * Video export.
 *
 * Two engines sit behind this module:
 *
 * - **WebCodecs** (preferred) — frames are encoded one at a time and muxed into
 *   an MP4 by {@link exportToMP4}. It runs as fast as the machine allows and
 *   timestamps every frame exactly, so the same timeline always produces the
 *   same file.
 * - **MediaRecorder** (fallback) — records a canvas stream in real time. It is
 *   used only where WebCodecs is unavailable; because it is wall-clock paced it
 *   can drop frames and is not deterministic.
 *
 * Both need a DOM environment (canvas) and a `renderFrame` callback that draws
 * the animation state at a given time.
 */

export interface VideoCodec {
  /** MediaRecorder mime type, e.g. `video/webm;codecs=vp9`. */
  mimeType: string
  /** File extension without the dot. */
  extension: string
  /** Human-readable label for a picker. */
  label: string
}

// Ordered by preference: MP4 first (most portable) then WebM variants.
const CODEC_CANDIDATES: VideoCodec[] = [
  { mimeType: 'video/mp4;codecs=avc1.42E01E', extension: 'mp4', label: 'MP4 (H.264)' },
  { mimeType: 'video/mp4', extension: 'mp4', label: 'MP4' },
  { mimeType: 'video/webm;codecs=vp9', extension: 'webm', label: 'WebM (VP9)' },
  { mimeType: 'video/webm;codecs=vp8', extension: 'webm', label: 'WebM (VP8)' },
  { mimeType: 'video/webm', extension: 'webm', label: 'WebM' },
]

/** Codecs this browser's MediaRecorder can actually produce, in preference order. */
export function getSupportedVideoCodecs(): VideoCodec[] {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return []
  }
  return CODEC_CANDIDATES.filter((c) => MediaRecorder.isTypeSupported(c.mimeType))
}

/** Whether the current environment can export video at all. */
export function isVideoExportSupported(): boolean {
  if (typeof document === 'undefined') return false
  return isWebCodecsMP4Supported() || getSupportedVideoCodecs().length > 0
}

/** A video output the current browser can actually produce. */
export interface VideoExportFormat {
  /** Stable identifier to pass back to {@link exportVideo}. */
  id: string
  /** Human-readable label for a picker. */
  label: string
  /** File extension without the dot. */
  extension: string
  /**
   * True when frames are encoded individually rather than recorded in real
   * time — faster and reproducible.
   */
  deterministic: boolean
}

/** Identifier for the WebCodecs MP4 path. */
export const MP4_WEBCODECS = 'mp4-webcodecs'

/**
 * Video formats available here, best first.
 *
 * The WebCodecs MP4 encoder leads when present; MediaRecorder codecs follow as
 * real-time fallbacks.
 */
export function getVideoExportFormats(): VideoExportFormat[] {
  const formats: VideoExportFormat[] = []

  if (isWebCodecsMP4Supported()) {
    formats.push({
      id: MP4_WEBCODECS,
      label: 'MP4 (H.264)',
      extension: 'mp4',
      deterministic: true,
    })
  }

  for (const codec of getSupportedVideoCodecs()) {
    // Skip a real-time MP4 recorder when we already have the WebCodecs one.
    if (codec.extension === 'mp4' && isWebCodecsMP4Supported()) continue
    formats.push({
      id: codec.mimeType,
      label: `${codec.label} (real-time)`,
      extension: codec.extension,
      deterministic: false,
    })
  }

  return formats
}

export interface VideoExportOptions {
  /** Output width in px. */
  width: number
  /** Output height in px. */
  height: number
  /** Frames per second (default 30). */
  fps?: number
  /** Total duration to record, in ms. */
  durationMs: number
  /** Mime type to record with; defaults to the best supported codec. */
  mimeType?: string
  /**
   * Recording bitrate in bits/sec. Defaults to roughly 0.25 bits per pixel per
   * frame — MediaRecorder's own default is far too low for flat vector art and
   * visibly smears edges and text.
   */
  bitrate?: number
  /** Solid colour painted behind every frame (default white). Pass `null` to keep transparent. */
  background?: string | null
  /** Draw the animation at `timeMs` onto the given context (already cleared + background-filled). May be async (e.g. to seek video frames). */
  renderFrame: (ctx: CanvasRenderingContext2D, timeMs: number) => void | Promise<void>
  /** Progress callback, 0..1. */
  onProgress?: (fraction: number) => void
  /** Abort the export early. */
  signal?: AbortSignal
}

interface CanvasCaptureTrack extends MediaStreamTrack {
  requestFrame?: () => void
}

/**
 * Record the animation to a video Blob. Resolves with the encoded blob.
 *
 * Frames are paced in real time so MediaRecorder timestamps them correctly, so a
 * `durationMs` of 6000 takes ~6s to export.
 */
export async function exportToVideo(opts: VideoExportOptions): Promise<Blob> {
  const { width, height, durationMs, renderFrame } = opts
  const fps = opts.fps ?? 30

  if (typeof document === 'undefined') {
    throw new Error('Video export requires a DOM environment')
  }
  const codecs = getSupportedVideoCodecs()
  const mimeType = opts.mimeType ?? codecs[0]?.mimeType
  if (!mimeType) {
    throw new Error('This browser cannot record video (MediaRecorder unavailable)')
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas 2D context')

  const stream = canvas.captureStream(0)
  const track = stream.getVideoTracks()[0] as CanvasCaptureTrack | undefined
  const bitrate = opts.bitrate ?? Math.round(width * height * fps * 0.25)
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: bitrate })
  const chunks: BlobPart[] = []
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data)
  }

  const stopped = new Promise<void>((resolve, reject) => {
    recorder.onstop = () => resolve()
    recorder.onerror = () => reject(new Error('Recording failed'))
  })

  recorder.start()

  const frameDuration = 1000 / fps
  const totalFrames = Math.max(1, Math.round(durationMs / frameDuration))
  const background = opts.background === undefined ? '#ffffff' : opts.background

  try {
    for (let i = 0; i <= totalFrames; i++) {
      if (opts.signal?.aborted) throw new Error('Export aborted')
      const t = Math.min(durationMs, i * frameDuration)
      ctx.clearRect(0, 0, width, height)
      if (background) {
        ctx.fillStyle = background
        ctx.fillRect(0, 0, width, height)
      }
      await renderFrame(ctx, t)
      track?.requestFrame?.()
      opts.onProgress?.(i / totalFrames)
      await new Promise((r) => setTimeout(r, frameDuration))
    }
  } finally {
    if (recorder.state !== 'inactive') recorder.stop()
    stream.getTracks().forEach((tr) => tr.stop())
  }

  await stopped
  return new Blob(chunks, { type: mimeType })
}

/**
 * Export a video using the best available engine.
 *
 * Pass a `format` id from {@link getVideoExportFormats}; omit it to take the
 * first (best) format. WebCodecs MP4 is used when selected, otherwise the
 * MediaRecorder path records the chosen mime type in real time.
 */
export async function exportVideo(
  opts: VideoExportOptions & { format?: string }
): Promise<{ blob: Blob; extension: string }> {
  const formats = getVideoExportFormats()
  if (formats.length === 0) {
    throw new Error('This browser cannot export video')
  }

  const chosen = formats.find((f) => f.id === opts.format) ?? formats[0]

  if (chosen.id === MP4_WEBCODECS) {
    const blob = await exportToMP4({
      width: opts.width,
      height: opts.height,
      fps: opts.fps,
      durationMs: opts.durationMs,
      background: opts.background,
      bitrate: opts.bitrate,
      renderFrame: opts.renderFrame,
      onProgress: opts.onProgress,
      signal: opts.signal,
    })
    return { blob, extension: chosen.extension }
  }

  const blob = await exportToVideo({ ...opts, mimeType: chosen.id })
  return { blob, extension: chosen.extension }
}

/** Trigger a browser download of an exported video blob. */
export function downloadVideo(blob: Blob, filename: string = 'animation.webm'): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
