import type { Timeline } from '../core/timeline'
import type { AnimatableValue } from '../types'

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
  /** Quality (1-20, lower is better, default: 10) */
  quality?: number
  /** Background color (default: transparent) */
  backgroundColor?: string
  /** Number of loops (0 = infinite, default: 0) */
  loops?: number
  /** Custom render function for each frame */
  renderFrame?: (
    ctx: CanvasRenderingContext2D,
    values: Map<string, Map<string, AnimatableValue>>,
    time: number
  ) => void
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

/**
 * Extract animation frames from a timeline.
 * This function captures frame data that can be used with a GIF encoder.
 *
 * Note: This function requires a DOM environment (canvas element).
 * For actual GIF encoding, use a library like gif.js or gifenc.
 */
export function extractFrames(
  timeline: Timeline,
  options: GIFExportOptions
): GIFExportResult {
  const {
    width,
    height,
    frameRate = 30,
    backgroundColor,
    renderFrame,
  } = options

  // Create an offscreen canvas
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

  // Extract frames at each time point
  for (let i = 0; i <= frameCount; i++) {
    const time = Math.min(i * frameInterval, duration)

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw background if specified
    if (backgroundColor) {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, width, height)
    }

    // Get animation state at this time
    const state = timeline.getStateAtTime(time)

    // Call custom render function if provided
    if (renderFrame) {
      renderFrame(ctx, state.values, time)
    }

    // Capture frame
    const imageData = ctx.getImageData(0, 0, width, height)
    const delay = Math.round(frameInterval / 10) // Convert to centiseconds

    frames.push({
      time,
      imageData,
      delay,
    })
  }

  return {
    frames,
    duration,
    frameCount: frames.length,
  }
}

/**
 * Simple GIF encoder using basic LZW compression.
 * For production use, consider using gif.js or gifenc library.
 */
export class SimpleGIFEncoder {
  private width: number
  private height: number
  private frames: Uint8Array[] = []
  private delays: number[] = []
  private loops: number

  constructor(width: number, height: number, loops: number = 0) {
    this.width = width
    this.height = height
    this.loops = loops
  }

  /**
   * Add a frame to the GIF
   */
  addFrame(imageData: ImageData, delay: number): void {
    // Quantize colors to 256 color palette
    const { pixels } = this.quantizeColors(imageData)
    this.frames.push(pixels)
    this.delays.push(delay)
  }

  /**
   * Quantize image to 256 colors
   */
  private quantizeColors(imageData: ImageData): { pixels: Uint8Array; palette: Uint8Array } {
    const { data, width, height } = imageData
    const pixels = new Uint8Array(width * height)
    const palette = new Uint8Array(256 * 3)

    // Simple color quantization using fixed palette
    // This is a basic implementation - production code should use
    // median cut or octree quantization
    const colorMap = new Map<number, number>()
    let colorIndex = 0

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]

      // Skip transparent pixels (map to index 0)
      if (a < 128) {
        pixels[i / 4] = 0
        continue
      }

      // Reduce color precision for mapping
      const colorKey = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)

      let index = colorMap.get(colorKey)
      if (index === undefined) {
        if (colorIndex < 255) {
          index = colorIndex + 1 // Reserve 0 for transparent
          colorMap.set(colorKey, index)
          palette[index * 3] = r
          palette[index * 3 + 1] = g
          palette[index * 3 + 2] = b
          colorIndex++
        } else {
          // Find closest color in palette
          index = this.findClosestColor(r, g, b, palette, colorIndex)
        }
      }

      pixels[i / 4] = index
    }

    return { pixels, palette }
  }

  /**
   * Find closest color in palette
   */
  private findClosestColor(
    r: number,
    g: number,
    b: number,
    palette: Uint8Array,
    paletteSize: number
  ): number {
    let minDist = Infinity
    let closest = 1

    for (let i = 1; i <= paletteSize; i++) {
      const pr = palette[i * 3]
      const pg = palette[i * 3 + 1]
      const pb = palette[i * 3 + 2]
      const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
      if (dist < minDist) {
        minDist = dist
        closest = i
      }
    }

    return closest
  }

  /**
   * Encode and return the GIF as a Blob
   */
  encode(): Blob {
    const parts: Uint8Array[] = []

    // GIF Header
    parts.push(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])) // GIF89a

    // Logical Screen Descriptor
    const lsd = new Uint8Array(7)
    lsd[0] = this.width & 0xff
    lsd[1] = (this.width >> 8) & 0xff
    lsd[2] = this.height & 0xff
    lsd[3] = (this.height >> 8) & 0xff
    lsd[4] = 0xf7 // Global color table flag, 256 colors
    lsd[5] = 0 // Background color index
    lsd[6] = 0 // Pixel aspect ratio
    parts.push(lsd)

    // Global Color Table (256 colors, RGB)
    const gct = new Uint8Array(256 * 3)
    // Set transparent color at index 0
    gct[0] = 0
    gct[1] = 0
    gct[2] = 0
    // Fill rest with grayscale for simplicity
    for (let i = 1; i < 256; i++) {
      gct[i * 3] = i
      gct[i * 3 + 1] = i
      gct[i * 3 + 2] = i
    }
    parts.push(gct)

    // Netscape Application Extension (for looping)
    parts.push(
      new Uint8Array([
        0x21,
        0xff,
        0x0b, // Extension introducer, app extension, block size
        0x4e,
        0x45,
        0x54,
        0x53,
        0x43,
        0x41,
        0x50,
        0x45, // NETSCAPE
        0x32,
        0x2e,
        0x30, // 2.0
        0x03,
        0x01, // Sub-block size, loop flag
        this.loops & 0xff,
        (this.loops >> 8) & 0xff, // Loop count
        0x00, // Block terminator
      ])
    )

    // Add frames
    for (let i = 0; i < this.frames.length; i++) {
      // Graphic Control Extension
      const gce = new Uint8Array([
        0x21,
        0xf9,
        0x04, // Extension introducer, GCE label, block size
        0x09, // Disposal method (restore to background), transparent flag
        this.delays[i] & 0xff,
        (this.delays[i] >> 8) & 0xff, // Delay (centiseconds)
        0x00, // Transparent color index
        0x00, // Block terminator
      ])
      parts.push(gce)

      // Image Descriptor
      const id = new Uint8Array([
        0x2c, // Image separator
        0x00,
        0x00, // Left position
        0x00,
        0x00, // Top position
        this.width & 0xff,
        (this.width >> 8) & 0xff,
        this.height & 0xff,
        (this.height >> 8) & 0xff,
        0x00, // No local color table
      ])
      parts.push(id)

      // Image Data (LZW compressed)
      const compressed = this.lzwEncode(this.frames[i])
      parts.push(compressed)
    }

    // GIF Trailer
    parts.push(new Uint8Array([0x3b]))

    return new Blob(parts as BlobPart[], { type: 'image/gif' })
  }

  /**
   * Simple LZW encoding for GIF
   */
  private lzwEncode(pixels: Uint8Array): Uint8Array {
    const minCodeSize = 8
    const clearCode = 1 << minCodeSize
    const endCode = clearCode + 1

    const output: number[] = [minCodeSize]
    const buffer: number[] = []

    let codeSize = minCodeSize + 1
    let nextCode = endCode + 1
    const dictionary = new Map<string, number>()

    // Initialize dictionary
    for (let i = 0; i < clearCode; i++) {
      dictionary.set(String(i), i)
    }

    let currentByte = 0
    let bitCount = 0

    const writeBits = (code: number, bits: number) => {
      currentByte |= code << bitCount
      bitCount += bits
      while (bitCount >= 8) {
        buffer.push(currentByte & 0xff)
        currentByte >>= 8
        bitCount -= 8
      }
    }

    const flushBuffer = () => {
      if (buffer.length > 0) {
        output.push(buffer.length)
        output.push(...buffer)
        buffer.length = 0
      }
    }

    // Write clear code
    writeBits(clearCode, codeSize)

    let prefix = ''

    for (let i = 0; i < pixels.length; i++) {
      const pixel = String(pixels[i])
      const combined = prefix + ',' + pixel

      if (dictionary.has(combined)) {
        prefix = combined
      } else {
        // Output code for prefix
        writeBits(dictionary.get(prefix)!, codeSize)

        // Add new code to dictionary
        if (nextCode < 4096) {
          dictionary.set(combined, nextCode++)

          // Increase code size if needed
          if (nextCode > (1 << codeSize) && codeSize < 12) {
            codeSize++
          }
        }

        prefix = pixel

        // Flush buffer if getting large
        if (buffer.length >= 254) {
          flushBuffer()
        }
      }
    }

    // Output remaining code
    if (prefix) {
      writeBits(dictionary.get(prefix)!, codeSize)
    }

    // Write end code
    writeBits(endCode, codeSize)

    // Flush remaining bits
    if (bitCount > 0) {
      buffer.push(currentByte & 0xff)
    }

    flushBuffer()

    // Block terminator
    output.push(0)

    return new Uint8Array(output)
  }
}

/**
 * Export timeline to GIF blob.
 * Requires a render function to draw animation state to canvas.
 */
export function exportToGIF(
  timeline: Timeline,
  options: GIFExportOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const {
        width,
        height,
        frameRate = 30,
        loops = 0,
        backgroundColor,
        renderFrame,
      } = options

      if (!renderFrame) {
        reject(new Error('renderFrame function is required for GIF export'))
        return
      }

      // Create canvas for rendering
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Failed to get canvas 2D context'))
        return
      }

      // Create GIF encoder
      const encoder = new SimpleGIFEncoder(width, height, loops)

      const duration = timeline.duration
      const frameInterval = 1000 / frameRate
      const frameCount = Math.ceil(duration / frameInterval)
      const delay = Math.round(frameInterval / 10) // Centiseconds

      // Render each frame
      for (let i = 0; i <= frameCount; i++) {
        const time = Math.min(i * frameInterval, duration)

        // Clear canvas
        ctx.clearRect(0, 0, width, height)

        // Draw background if specified
        if (backgroundColor) {
          ctx.fillStyle = backgroundColor
          ctx.fillRect(0, 0, width, height)
        }

        // Get animation state at this time
        const state = timeline.getStateAtTime(time)

        // Render frame
        renderFrame(ctx, state.values, time)

        // Add frame to encoder
        const imageData = ctx.getImageData(0, 0, width, height)
        encoder.addFrame(imageData, delay)
      }

      // Encode GIF
      const blob = encoder.encode()
      resolve(blob)
    } catch (error) {
      reject(error)
    }
  })
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
