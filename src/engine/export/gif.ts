import type { Timeline } from '../core/timeline'
import type { AnimatableValue } from '../types'
import { buildPalette, quantizeImage } from './quantize'
import { ByteWriter } from './byte-writer'

/**
 * Animated GIF export.
 *
 * Frames are quantized to a 255-colour local palette (index 0 is reserved for
 * transparency), LZW-compressed, and written as a GIF89a stream. Encoding is
 * pure byte manipulation — the only DOM dependency is the canvas used to
 * rasterise frames, so `GIFEncoder` itself runs anywhere, including Workers.
 */

/**
 * GIF export options
 */
export interface GIFExportOptions {
  /** Canvas width */
  width: number
  /** Canvas height */
  height: number
  /** Frame rate (default: 30) */
  frameRate?: number
  /** Background color (default: transparent) */
  backgroundColor?: string
  /** Number of loops (0 = infinite, default: 0) */
  loops?: number
  /** Diffuse quantization error into neighbouring pixels (default: true) */
  dither?: boolean
  /** Palette size per frame, 2-255 (default: 255) */
  maxColors?: number
  /** Custom render function for each frame */
  renderFrame?: (
    ctx: CanvasRenderingContext2D,
    values: Map<string, Map<string, AnimatableValue>>,
    time: number
  ) => void | Promise<void>
  /** Progress callback, 0..1 */
  onProgress?: (fraction: number) => void
  /** Abort the export early */
  signal?: AbortSignal
}

/**
 * GIF frame data
 */
export interface GIFFrame {
  /** Frame time in milliseconds */
  time: number
  /** Frame image data */
  imageData: ImageData
  /** Frame delay in centiseconds (1/100th of a second) */
  delay: number
}

/**
 * GIF export result
 */
export interface GIFExportResult {
  /** Array of frames ready for encoding */
  frames: GIFFrame[]
  /** Total duration in milliseconds */
  duration: number
  /** Number of frames */
  frameCount: number
}

/** Minimal image shape the encoder needs — matches `ImageData`. */
interface RGBAImage {
  data: Uint8ClampedArray | Uint8Array
  width: number
  height: number
}

/**
 * LZW-compress palette indices into GIF image data (sub-block framing included,
 * minus the leading minimum-code-size byte).
 *
 * Codes are written LSB-first and the dictionary is reset with a clear code
 * whenever it fills, as the GIF89a spec requires.
 */
export function lzwEncode(indices: Uint8Array, minCodeSize: number): Uint8Array {
  const clearCode = 1 << minCodeSize
  const endCode = clearCode + 1

  const out = new ByteWriter()
  const block = new Uint8Array(255)
  let blockLen = 0

  let acc = 0
  let accBits = 0

  const flushBlock = () => {
    if (blockLen === 0) return
    out.byte(blockLen)
    out.bytes(block.subarray(0, blockLen))
    blockLen = 0
  }

  const writeCode = (code: number, codeSize: number) => {
    acc |= code << accBits
    accBits += codeSize
    while (accBits >= 8) {
      block[blockLen++] = acc & 0xff
      acc >>= 8
      accBits -= 8
      if (blockLen === 255) flushBlock()
    }
  }

  let dictionary = new Map<number, number>()
  const resetDictionary = () => {
    dictionary = new Map<number, number>()
  }

  let codeSize = minCodeSize + 1
  let nextCode = endCode + 1

  writeCode(clearCode, codeSize)

  if (indices.length > 0) {
    let prefix = indices[0]

    for (let i = 1; i < indices.length; i++) {
      const pixel = indices[i]
      // Dictionary keys pack (prefix, pixel) into one integer: pixel occupies
      // the low 8 bits, prefix (at most 4095) sits above it.
      const key = (prefix << 8) | pixel
      const existing = dictionary.get(key)

      if (existing !== undefined) {
        prefix = existing
        continue
      }

      writeCode(prefix, codeSize)

      if (nextCode < 4096) {
        dictionary.set(key, nextCode++)
        // Widen as soon as the next code would not fit. A decoder builds its
        // dictionary one entry behind us, so widening any later desyncs it.
        if (nextCode >= 1 << codeSize && codeSize < 12) codeSize++
      } else {
        // Dictionary is full — reset both sides of the stream.
        writeCode(clearCode, codeSize)
        resetDictionary()
        codeSize = minCodeSize + 1
        nextCode = endCode + 1
      }

      prefix = pixel
    }

    writeCode(prefix, codeSize)
  }

  writeCode(endCode, codeSize)

  // Flush any partial byte still in the accumulator. `writeCode` flushes at 255,
  // so there is always room for one more byte here.
  if (accBits > 0) block[blockLen++] = acc & 0xff
  flushBlock()

  out.byte(0x00) // block terminator
  return out.toUint8Array()
}

export interface GIFEncoderOptions {
  /** Number of loops (0 = infinite, default: 0) */
  loops?: number
  /** Diffuse quantization error into neighbouring pixels (default: true) */
  dither?: boolean
  /** Palette size per frame, 2-255 (default: 255) */
  maxColors?: number
}

/**
 * Animated GIF encoder.
 *
 * Each frame is quantized and compressed as it is added, so only compressed
 * bytes are retained — memory stays proportional to output size rather than to
 * frame count times canvas area.
 */
export class GIFEncoder {
  private readonly width: number
  private readonly height: number
  private readonly loops: number
  private readonly dither: boolean
  private readonly maxColors: number
  /** Fully-encoded blocks (GCE + descriptor + palette + data) per frame. */
  private frames: Uint8Array[] = []

  constructor(width: number, height: number, loopsOrOptions: number | GIFEncoderOptions = 0) {
    this.width = width
    this.height = height
    const options: GIFEncoderOptions =
      typeof loopsOrOptions === 'number' ? { loops: loopsOrOptions } : loopsOrOptions
    this.loops = options.loops ?? 0
    this.dither = options.dither ?? true
    this.maxColors = Math.max(2, Math.min(255, options.maxColors ?? 255))
  }

  /** Number of frames added so far. */
  get frameCount(): number {
    return this.frames.length
  }

  /**
   * Quantize and compress one frame.
   *
   * @param delay Frame delay in centiseconds (1/100s), as GIF stores it.
   */
  addFrame(imageData: RGBAImage, delay: number): void {
    const { data } = imageData
    const width = imageData.width || this.width
    const height = imageData.height || this.height

    const palette = buildPalette(data, this.maxColors)
    const { indices, hasTransparency } = quantizeImage(data, width, height, palette, {
      dither: this.dither,
      transparentIndex: 0,
    })

    const out = new ByteWriter()

    // Graphic Control Extension. Disposal 2 (restore to background) prevents
    // transparent frames from ghosting over their predecessor; opaque frames
    // fully overwrite, so disposal 1 (leave in place) is enough.
    const disposal = hasTransparency ? 2 : 1
    out.bytes([0x21, 0xf9, 0x04])
    out.byte((disposal << 2) | (hasTransparency ? 1 : 0))
    out.uint16LE(Math.max(0, Math.round(delay)))
    out.byte(0x00) // transparent colour index
    out.byte(0x00) // block terminator

    // Image Descriptor — full-canvas frame with a local colour table.
    out.byte(0x2c)
    out.uint16LE(0) // left
    out.uint16LE(0) // top
    out.uint16LE(width)
    out.uint16LE(height)
    out.byte(0x87) // local colour table, 256 entries

    // Local Colour Table: index 0 is the transparent slot, palette follows.
    const table = new Uint8Array(256 * 3)
    table.set(palette.rgb.subarray(0, Math.min(palette.size, 255) * 3), 3)
    out.bytes(table)

    // Image data. Eight bits because the palette spans indices 0-255.
    out.byte(8)
    out.bytes(lzwEncode(indices, 8))

    this.frames.push(out.toUint8Array())
  }

  /** Assemble the full GIF byte stream. */
  encodeToBytes(): Uint8Array {
    const out = new ByteWriter()

    out.bytes([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]) // "GIF89a"

    // Logical Screen Descriptor. No global colour table — every frame carries
    // its own — but we still advertise 8-bit colour resolution.
    out.uint16LE(this.width)
    out.uint16LE(this.height)
    out.byte(0x70)
    out.byte(0x00) // background colour index
    out.byte(0x00) // pixel aspect ratio

    // Netscape Application Extension: loop count.
    out.bytes([0x21, 0xff, 0x0b])
    out.bytes([0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45]) // "NETSCAPE"
    out.bytes([0x32, 0x2e, 0x30]) // "2.0"
    out.bytes([0x03, 0x01])
    out.uint16LE(this.loops)
    out.byte(0x00)

    for (const frame of this.frames) out.bytes(frame)

    out.byte(0x3b) // trailer
    return out.toUint8Array()
  }

  /** Encode and return the GIF as a Blob. */
  encode(): Blob {
    const bytes = this.encodeToBytes()
    // Copy out of the growable buffer so the Blob owns a right-sized view.
    return new Blob([bytes.slice()], { type: 'image/gif' })
  }
}

/**
 * @deprecated Use {@link GIFEncoder}. Kept as an alias for existing callers.
 */
export const SimpleGIFEncoder = GIFEncoder

/**
 * Extract animation frames from a timeline as raw `ImageData`.
 *
 * Useful when you want to post-process frames yourself; {@link exportToGIF}
 * uses the same rasterisation path and encodes in one step.
 *
 * Note: requires a DOM environment (canvas element).
 */
export function extractFrames(
  timeline: Timeline,
  options: GIFExportOptions
): GIFExportResult {
  const { width, height, frameRate = 30, backgroundColor, renderFrame } = options

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to get canvas 2D context')
  }

  const duration = timeline.duration
  const frameInterval = 1000 / frameRate
  const frameCount = Math.ceil(duration / frameInterval)
  const frames: GIFFrame[] = []

  for (let i = 0; i <= frameCount; i++) {
    const time = Math.min(i * frameInterval, duration)

    ctx.clearRect(0, 0, width, height)
    if (backgroundColor) {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, width, height)
    }

    const state = timeline.getStateAtTime(time)
    // A render function returning a promise can't be awaited here; use
    // exportToGIF for async renderers.
    renderFrame?.(ctx, state.values, time)

    frames.push({
      time,
      imageData: ctx.getImageData(0, 0, width, height),
      delay: Math.round(frameInterval / 10),
    })
  }

  return { frames, duration, frameCount: frames.length }
}

/**
 * Render a timeline to an animated GIF blob.
 *
 * The `renderFrame` callback draws the animation state onto an already-cleared
 * (and optionally background-filled) canvas; it may be async, which lets callers
 * seek video layers before each frame.
 */
export async function exportToGIF(
  timeline: Timeline,
  options: GIFExportOptions
): Promise<Blob> {
  const {
    width,
    height,
    frameRate = 30,
    loops = 0,
    backgroundColor,
    renderFrame,
    dither,
    maxColors,
    onProgress,
    signal,
  } = options

  if (typeof document === 'undefined') {
    throw new Error('GIF export requires a DOM environment')
  }
  if (!renderFrame) {
    throw new Error('renderFrame function is required for GIF export')
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context')
  }

  const encoder = new GIFEncoder(width, height, { loops, dither, maxColors })

  const duration = timeline.duration
  const frameInterval = 1000 / frameRate
  const frameCount = Math.max(1, Math.round(duration / frameInterval))
  // GIF delays are centiseconds, and most decoders clamp anything under 2.
  const delay = Math.max(2, Math.round(frameInterval / 10))

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

    encoder.addFrame(ctx.getImageData(0, 0, width, height), delay)
    onProgress?.((i + 1) / frameCount)
  }

  return encoder.encode()
}

/**
 * Download a GIF blob as a file
 */
export function downloadGIF(blob: Blob, filename: string = 'animation.gif'): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
