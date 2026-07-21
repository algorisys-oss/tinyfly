import type { Timeline } from '../core/timeline'
import type { AnimatableValue } from '../types'
import { ByteWriter } from './byte-writer'

/**
 * Animated WebP export.
 *
 * WebP's compression (VP8/VP8L) is already implemented inside every browser that
 * can write `image/webp` from a canvas, so tinyfly does not reimplement it.
 * Instead each frame is encoded as a *still* WebP by the browser, its bitstream
 * chunks are lifted out of that single-image RIFF container, and they are
 * re-muxed into an animated `VP8X`/`ANIM`/`ANMF` container here.
 *
 * That keeps the exporter dependency-free and deterministic at the container
 * level while leaving the pixel compression to a well-tested native encoder.
 */

/** RIFF chunks are padded to an even length. */
const pad = (size: number) => size + (size % 2)

/** VP8X feature flags. */
const FLAG_ALPHA = 0x10
const FLAG_ANIMATION = 0x02

/** The image bitstream lifted out of a single-image WebP file. */
export interface WebPBitstream {
  /** `VP8 ` (lossy) or `VP8L` (lossless) chunk, including its 8-byte header. */
  image: Uint8Array
  /** `ALPH` chunk including its header, when the still carried separate alpha. */
  alpha: Uint8Array | null
  width: number
  height: number
  hasAlpha: boolean
}

/** Read a FourCC at `offset`. */
function fourCC(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3])
}

function uint32LE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>>
    0
  )
}

/**
 * Pull the coded image (and optional alpha) out of a single-image WebP file.
 *
 * Browsers emit either a bare `VP8 `/`VP8L` chunk or, when the canvas has
 * transparency, an extended `VP8X` + `ALPH` + `VP8 ` layout. Both are handled.
 */
export function parseWebPBitstream(bytes: Uint8Array): WebPBitstream {
  if (bytes.length < 12 || fourCC(bytes, 0) !== 'RIFF' || fourCC(bytes, 8) !== 'WEBP') {
    throw new Error('Not a WebP file — the browser may not support canvas WebP encoding')
  }

  let image: Uint8Array | null = null
  let alpha: Uint8Array | null = null
  let width = 0
  let height = 0
  let hasAlpha = false

  let pos = 12
  while (pos + 8 <= bytes.length) {
    const type = fourCC(bytes, pos)
    const size = uint32LE(bytes, pos + 4)
    const payload = bytes.subarray(pos + 8, pos + 8 + size)
    const chunk = bytes.subarray(pos, pos + 8 + size)

    if (type === 'VP8X') {
      hasAlpha = (payload[0] & FLAG_ALPHA) !== 0
      width = (payload[4] | (payload[5] << 8) | (payload[6] << 16)) + 1
      height = (payload[7] | (payload[8] << 8) | (payload[9] << 16)) + 1
    } else if (type === 'ALPH') {
      alpha = chunk
      hasAlpha = true
    } else if (type === 'VP8 ') {
      image = chunk
      // Lossy keyframe header: 3-byte frame tag, 3-byte start code, then the
      // 14-bit dimensions.
      if (!width && payload.length >= 10) {
        width = ((payload[6] | (payload[7] << 8)) & 0x3fff) || width
        height = ((payload[8] | (payload[9] << 8)) & 0x3fff) || height
      }
    } else if (type === 'VP8L') {
      image = chunk
      if (!width && payload.length >= 5) {
        const bits = uint32LE(payload, 1)
        width = (bits & 0x3fff) + 1
        height = ((bits >> 14) & 0x3fff) + 1
        hasAlpha = hasAlpha || ((bits >> 28) & 1) === 1
      }
    }

    pos += 8 + pad(size)
  }

  if (!image) throw new Error('WebP file contained no VP8 or VP8L image data')
  return { image, alpha, width, height, hasAlpha }
}

export interface WebPEncoderOptions {
  /** Number of loops (0 = infinite, default: 0) */
  loops?: number
  /** Canvas colour behind frames, as `[r, g, b, a]` (default: transparent) */
  background?: [number, number, number, number]
}

/**
 * Muxes still-WebP frames into one animated WebP file.
 *
 * Frames are stored full-canvas, so each one fully replaces its predecessor and
 * no inter-frame ghosting is possible.
 */
export class WebPEncoder {
  private readonly loops: number
  private readonly background: [number, number, number, number]
  private frames: { bitstream: WebPBitstream; durationMs: number }[] = []
  private hasAlpha = false
  private width: number
  private height: number

  constructor(width: number, height: number, options: WebPEncoderOptions = {}) {
    this.width = width
    this.height = height
    this.loops = options.loops ?? 0
    this.background = options.background ?? [0, 0, 0, 0]
  }

  get frameCount(): number {
    return this.frames.length
  }

  /**
   * Add one frame from the bytes of a still WebP image.
   *
   * @param durationMs How long the frame is shown, in milliseconds.
   */
  addFrame(webpBytes: Uint8Array, durationMs: number): void {
    const bitstream = parseWebPBitstream(webpBytes)
    if (bitstream.hasAlpha) this.hasAlpha = true
    this.frames.push({ bitstream, durationMs })
  }

  /** Assemble the animated WebP byte stream. */
  encodeToBytes(): Uint8Array {
    if (this.frames.length === 0) {
      throw new Error('Cannot encode an animated WebP with no frames')
    }

    const out = new ByteWriter()
    out.ascii('RIFF')
    const sizeOffset = out.length
    out.uint32LE(0) // patched once the payload length is known
    out.ascii('WEBP')

    // VP8X: declares the canvas size and which optional features are present.
    out.ascii('VP8X')
    out.uint32LE(10)
    out.byte(FLAG_ANIMATION | (this.hasAlpha ? FLAG_ALPHA : 0))
    out.uint24LE(0) // reserved
    out.uint24LE(this.width - 1)
    out.uint24LE(this.height - 1)

    // ANIM: background colour (BGRA) and loop count.
    const [r, g, b, a] = this.background
    out.ascii('ANIM')
    out.uint32LE(6)
    out.bytes([b, g, r, a])
    out.uint16LE(this.loops)

    for (const { bitstream, durationMs } of this.frames) {
      const payloadSize =
        16 + pad(bitstream.alpha ? bitstream.alpha.length : 0) + pad(bitstream.image.length)

      out.ascii('ANMF')
      out.uint32LE(payloadSize)
      out.uint24LE(0) // frame x, in units of 2px
      out.uint24LE(0) // frame y, in units of 2px
      out.uint24LE(this.width - 1)
      out.uint24LE(this.height - 1)
      out.uint24LE(Math.max(0, Math.round(durationMs)))
      // Bit 1: do not blend with the previous canvas. Bit 0: dispose to
      // background. Frames cover the whole canvas, so we simply overwrite.
      out.byte(0x03)

      if (bitstream.alpha) {
        out.bytes(bitstream.alpha)
        if (bitstream.alpha.length % 2) out.byte(0)
      }
      out.bytes(bitstream.image)
      if (bitstream.image.length % 2) out.byte(0)
    }

    // RIFF size counts everything after the size field itself.
    out.patchUint32LE(sizeOffset, out.length - sizeOffset - 4)
    return out.toUint8Array()
  }

  /** Encode and return the animated WebP as a Blob. */
  encode(): Blob {
    return new Blob([this.encodeToBytes().slice()], { type: 'image/webp' })
  }
}

/** Whether this browser's canvas can actually encode WebP stills. */
export function isWebPExportSupported(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    // Browsers without a WebP encoder silently fall back to PNG here.
    return canvas.toDataURL('image/webp').startsWith('data:image/webp')
  } catch {
    return false
  }
}

/** Encode the current canvas contents as a still WebP. */
function canvasToWebP(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas WebP encoding failed'))
        if (blob.type !== 'image/webp') {
          return reject(new Error('This browser cannot encode WebP from a canvas'))
        }
        blob
          .arrayBuffer()
          .then((buffer) => resolve(new Uint8Array(buffer)))
          .catch(reject)
      },
      'image/webp',
      quality
    )
  })
}

export interface WebPExportOptions {
  /** Output width in px. */
  width: number
  /** Output height in px. */
  height: number
  /** Frames per second (default: 30). */
  frameRate?: number
  /** Number of loops (0 = infinite, default: 0). */
  loops?: number
  /** Encoder quality, 0..1 (default: 0.8). */
  quality?: number
  /** Solid colour painted behind every frame. Omit to keep transparency. */
  backgroundColor?: string
  /** Draw the animation state at `time` onto the cleared canvas. */
  renderFrame: (
    ctx: CanvasRenderingContext2D,
    values: Map<string, Map<string, AnimatableValue>>,
    time: number
  ) => void | Promise<void>
  /** Progress callback, 0..1. */
  onProgress?: (fraction: number) => void
  /** Abort the export early. */
  signal?: AbortSignal
}

/**
 * Render a timeline to an animated WebP blob.
 *
 * Frames are rendered one at a time with no real-time pacing, so the export runs
 * as fast as the machine allows and always produces the same frame times.
 */
export async function exportToWebP(
  timeline: Timeline,
  options: WebPExportOptions
): Promise<Blob> {
  const {
    width,
    height,
    frameRate = 30,
    loops = 0,
    quality = 0.8,
    backgroundColor,
    renderFrame,
    onProgress,
    signal,
  } = options

  if (typeof document === 'undefined') {
    throw new Error('WebP export requires a DOM environment')
  }
  if (!isWebPExportSupported()) {
    throw new Error('This browser cannot encode WebP from a canvas. Try Chrome, Edge, or Firefox.')
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas 2D context')

  const encoder = new WebPEncoder(width, height, { loops })

  const duration = timeline.duration
  const frameInterval = 1000 / frameRate
  const frameCount = Math.max(1, Math.round(duration / frameInterval))

  for (let i = 0; i < frameCount; i++) {
    if (signal?.aborted) throw new Error('Export aborted')

    const time = Math.min(i * frameInterval, duration)

    ctx.clearRect(0, 0, width, height)
    if (backgroundColor) {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, width, height)
    }

    const state = timeline.getStateAtTime(time)
    await renderFrame(ctx, state.values, time)

    encoder.addFrame(await canvasToWebP(canvas, quality), Math.round(frameInterval))
    onProgress?.((i + 1) / frameCount)
  }

  return encoder.encode()
}

/** Trigger a browser download of an exported WebP blob. */
export function downloadWebP(blob: Blob, filename: string = 'animation.webp'): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
