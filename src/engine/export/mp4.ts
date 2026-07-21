import { ByteWriter } from './byte-writer'

/**
 * MP4 muxer for H.264 samples produced by WebCodecs.
 *
 * The browser's `VideoEncoder` gives us compressed access units but no
 * container, so this module writes the ISO base media file format around them:
 * `ftyp`, a single `mdat` holding every sample, and a `moov` with the sample
 * tables that let a player seek. Nothing here touches the DOM, so it is
 * testable and Worker-safe.
 *
 * Output is a plain (non-fragmented) MP4: `moov` is written last, once all
 * sample sizes and offsets are known.
 */

/** 16.16 fixed point, as MP4 uses for rates and dimensions. */
const fixed16 = (value: number) => Math.round(value * 65536)

/** Identity display matrix. */
const IDENTITY_MATRIX = [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000]

/** One encoded video sample. */
export interface MP4Sample {
  data: Uint8Array
  /** Duration in media timescale units. */
  duration: number
  /** Whether this sample is a sync (key) frame. */
  isKeyFrame: boolean
}

export interface MP4MuxOptions {
  width: number
  height: number
  /** Media timescale — ticks per second. */
  timescale: number
  /** `avcC` decoder configuration record from the encoder's metadata. */
  avcC: Uint8Array
}

/** Write a box, patching its size once the body has been written. */
function box(out: ByteWriter, type: string, body: () => void): void {
  const start = out.length
  out.uint32BE(0) // size placeholder
  out.ascii(type)
  body()
  out.patchUint32BE(start, out.length - start)
}

/** Write a full box (a box carrying a version and flags). */
function fullBox(out: ByteWriter, type: string, version: number, flags: number, body: () => void): void {
  box(out, type, () => {
    out.byte(version)
    out.uint24BE(flags)
    body()
  })
}

/**
 * Mux encoded H.264 samples into an MP4 file.
 *
 * Samples are laid out as a single chunk, which keeps the sample-to-chunk table
 * trivial and is fine for the short animations tinyfly exports.
 */
export function muxMP4(samples: MP4Sample[], options: MP4MuxOptions): Uint8Array<ArrayBuffer> {
  const { width, height, timescale, avcC } = options

  if (samples.length === 0) {
    throw new Error('Cannot mux an MP4 with no samples')
  }

  const mediaDuration = samples.reduce((sum, s) => sum + s.duration, 0)
  const movieTimescale = 1000
  const movieDuration = Math.round((mediaDuration / timescale) * movieTimescale)

  const out = new ByteWriter(64 * 1024)

  // ── ftyp ──────────────────────────────────────────────────────────────────
  box(out, 'ftyp', () => {
    out.ascii('isom')
    out.uint32BE(512) // minor version
    out.ascii('isom')
    out.ascii('iso2')
    out.ascii('avc1')
    out.ascii('mp41')
  })

  // ── mdat ──────────────────────────────────────────────────────────────────
  // Written before moov so that chunk offsets are known when the sample tables
  // are built.
  const mdatStart = out.length
  out.uint32BE(0) // size placeholder
  out.ascii('mdat')
  const mdatDataStart = out.length
  for (const sample of samples) out.bytes(sample.data)
  const mdatSize = out.length - mdatStart
  if (mdatSize > 0xffffffff) {
    throw new Error('Exported video exceeds the 4GB limit of a 32-bit mdat box')
  }
  out.patchUint32BE(mdatStart, mdatSize)

  // ── moov ──────────────────────────────────────────────────────────────────
  box(out, 'moov', () => {
    fullBox(out, 'mvhd', 0, 0, () => {
      out.uint32BE(0) // creation time
      out.uint32BE(0) // modification time
      out.uint32BE(movieTimescale)
      out.uint32BE(movieDuration)
      out.uint32BE(fixed16(1)) // rate
      out.uint16BE(0x0100) // volume
      out.uint16BE(0) // reserved
      out.uint32BE(0)
      out.uint32BE(0)
      for (const value of IDENTITY_MATRIX) out.uint32BE(value)
      for (let i = 0; i < 6; i++) out.uint32BE(0) // pre_defined
      out.uint32BE(2) // next track ID
    })

    box(out, 'trak', () => {
      // flags 3 = track enabled + used in the presentation
      fullBox(out, 'tkhd', 0, 3, () => {
        out.uint32BE(0) // creation time
        out.uint32BE(0) // modification time
        out.uint32BE(1) // track ID
        out.uint32BE(0) // reserved
        out.uint32BE(movieDuration)
        out.uint32BE(0)
        out.uint32BE(0)
        out.uint16BE(0) // layer
        out.uint16BE(0) // alternate group
        out.uint16BE(0) // volume (video track)
        out.uint16BE(0) // reserved
        for (const value of IDENTITY_MATRIX) out.uint32BE(value)
        out.uint32BE(fixed16(width))
        out.uint32BE(fixed16(height))
      })

      box(out, 'mdia', () => {
        fullBox(out, 'mdhd', 0, 0, () => {
          out.uint32BE(0)
          out.uint32BE(0)
          out.uint32BE(timescale)
          out.uint32BE(mediaDuration)
          out.uint16BE(0x55c4) // language: 'und'
          out.uint16BE(0)
        })

        fullBox(out, 'hdlr', 0, 0, () => {
          out.uint32BE(0) // pre_defined
          out.ascii('vide')
          out.uint32BE(0)
          out.uint32BE(0)
          out.uint32BE(0)
          out.ascii('VideoHandler')
          out.byte(0) // null terminator
        })

        box(out, 'minf', () => {
          fullBox(out, 'vmhd', 0, 1, () => {
            out.uint16BE(0) // graphics mode
            out.uint16BE(0) // opcolor r
            out.uint16BE(0) // opcolor g
            out.uint16BE(0) // opcolor b
          })

          box(out, 'dinf', () => {
            fullBox(out, 'dref', 0, 0, () => {
              out.uint32BE(1) // entry count
              // Self-contained: media lives in this same file.
              fullBox(out, 'url ', 0, 1, () => {})
            })
          })

          box(out, 'stbl', () => {
            fullBox(out, 'stsd', 0, 0, () => {
              out.uint32BE(1) // entry count
              box(out, 'avc1', () => {
                out.uint32BE(0) // reserved
                out.uint16BE(0) // reserved
                out.uint16BE(1) // data reference index
                out.uint16BE(0) // pre_defined
                out.uint16BE(0) // reserved
                out.uint32BE(0) // pre_defined
                out.uint32BE(0)
                out.uint32BE(0)
                out.uint16BE(width)
                out.uint16BE(height)
                out.uint32BE(0x00480000) // 72 dpi horizontal
                out.uint32BE(0x00480000) // 72 dpi vertical
                out.uint32BE(0) // reserved
                out.uint16BE(1) // frame count
                // compressorname: 32 bytes, length-prefixed and zero-padded.
                out.byte(0)
                for (let i = 0; i < 31; i++) out.byte(0)
                out.uint16BE(0x0018) // depth
                out.uint16BE(0xffff) // pre_defined

                box(out, 'avcC', () => {
                  out.bytes(avcC)
                })
              })
            })

            // stts — run-length encoded sample durations.
            const timeRuns: { count: number; delta: number }[] = []
            for (const sample of samples) {
              const last = timeRuns[timeRuns.length - 1]
              if (last && last.delta === sample.duration) last.count++
              else timeRuns.push({ count: 1, delta: sample.duration })
            }
            fullBox(out, 'stts', 0, 0, () => {
              out.uint32BE(timeRuns.length)
              for (const run of timeRuns) {
                out.uint32BE(run.count)
                out.uint32BE(run.delta)
              }
            })

            // stss — sync sample table. Omitted entirely when every frame is a
            // key frame, which is what "all samples are sync samples" means.
            const keyFrames: number[] = []
            samples.forEach((sample, i) => {
              if (sample.isKeyFrame) keyFrames.push(i + 1)
            })
            if (keyFrames.length !== samples.length) {
              fullBox(out, 'stss', 0, 0, () => {
                out.uint32BE(keyFrames.length)
                for (const index of keyFrames) out.uint32BE(index)
              })
            }

            fullBox(out, 'stsc', 0, 0, () => {
              out.uint32BE(1) // one entry: every sample lives in chunk 1
              out.uint32BE(1) // first chunk
              out.uint32BE(samples.length) // samples per chunk
              out.uint32BE(1) // sample description index
            })

            fullBox(out, 'stsz', 0, 0, () => {
              out.uint32BE(0) // 0 = sizes vary, listed below
              out.uint32BE(samples.length)
              for (const sample of samples) out.uint32BE(sample.data.length)
            })

            fullBox(out, 'stco', 0, 0, () => {
              out.uint32BE(1) // one chunk
              out.uint32BE(mdatDataStart)
            })
          })
        })
      })
    })
  })

  return out.toBytes()
}

/** H.264 codec strings, most compatible first. */
const AVC_CODECS = [
  'avc1.42001f', // Baseline 3.1
  'avc1.4d0028', // Main 4.0
  'avc1.640028', // High 4.0
  'avc1.42E01E', // Constrained Baseline 3.0
]

/** Whether this environment can encode H.264 through WebCodecs. */
export function isWebCodecsMP4Supported(): boolean {
  return typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined'
}

/** First H.264 codec string this browser will accept at the given size. */
export async function pickAVCCodec(
  width: number,
  height: number,
  framerate: number,
  bitrate: number
): Promise<string | null> {
  if (!isWebCodecsMP4Supported()) return null
  for (const codec of AVC_CODECS) {
    try {
      const support = await VideoEncoder.isConfigSupported({
        codec,
        width,
        height,
        framerate,
        bitrate,
        avc: { format: 'avc' },
      })
      if (support.supported) return codec
    } catch {
      // Try the next candidate.
    }
  }
  return null
}

export interface MP4ExportOptions {
  /** Output width in px. Rounded up to an even number for H.264. */
  width: number
  /** Output height in px. Rounded up to an even number for H.264. */
  height: number
  /** Frames per second (default: 30). */
  fps?: number
  /** Total duration to render, in ms. */
  durationMs: number
  /** Target bitrate in bits/sec. Overrides `quality` when given. */
  bitrate?: number
  /**
   * Bits per pixel per frame, used when `bitrate` is not set (default: 0.25).
   *
   * Flat vector art has hard edges that H.264 smears at low bitrates, so this
   * default is deliberately generous compared with camera footage.
   */
  bitsPerPixel?: number
  /** Emit a key frame every N frames (default: 2 seconds' worth). */
  keyFrameInterval?: number
  /** Solid colour painted behind every frame (default white). `null` keeps it transparent. */
  background?: string | null
  /** Draw the animation at `timeMs` onto the cleared, background-filled context. */
  renderFrame: (ctx: CanvasRenderingContext2D, timeMs: number) => void | Promise<void>
  /** Progress callback, 0..1. */
  onProgress?: (fraction: number) => void
  /** Abort the export early. */
  signal?: AbortSignal
}

/**
 * Render a timeline to an MP4 blob using WebCodecs.
 *
 * Unlike the MediaRecorder path this is not real-time: frames are rendered and
 * encoded as fast as the machine allows, and every frame is presented at an
 * exact timestamp, so the same input always yields the same frame timing.
 */
export async function exportToMP4(options: MP4ExportOptions): Promise<Blob> {
  const { durationMs, renderFrame, onProgress, signal } = options
  const fps = options.fps ?? 30

  if (typeof document === 'undefined') {
    throw new Error('MP4 export requires a DOM environment')
  }
  if (!isWebCodecsMP4Supported()) {
    throw new Error('This browser has no WebCodecs VideoEncoder')
  }

  // H.264 requires even dimensions.
  const width = Math.max(2, Math.round(options.width / 2) * 2)
  const height = Math.max(2, Math.round(options.height / 2) * 2)
  const bitrate =
    options.bitrate ?? Math.round(width * height * fps * (options.bitsPerPixel ?? 0.25))

  const codec = await pickAVCCodec(width, height, fps, bitrate)
  if (!codec) {
    throw new Error('This browser cannot encode H.264 at the requested size')
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas 2D context')

  const samples: MP4Sample[] = []
  let avcC: Uint8Array | null = null
  let encodeError: Error | null = null

  // The media timescale is chosen so one frame is exactly 1000 ticks for any
  // integer fps — no rounding drift across the timeline.
  const timescale = fps * 1000
  const sampleDuration = 1000

  const encoder = new VideoEncoder({
    output: (chunk, metadata) => {
      const description = metadata?.decoderConfig?.description
      if (description && !avcC) {
        // `description` is the avcC record, delivered as a buffer or a view.
        avcC = ArrayBuffer.isView(description)
          ? new Uint8Array(description.buffer, description.byteOffset, description.byteLength).slice()
          : new Uint8Array(description as ArrayBuffer).slice()
      }
      const data = new Uint8Array(chunk.byteLength)
      chunk.copyTo(data)
      samples.push({
        data,
        duration: sampleDuration,
        isKeyFrame: chunk.type === 'key',
      })
    },
    error: (err) => {
      encodeError = err instanceof Error ? err : new Error(String(err))
    },
  })

  encoder.configure({
    codec,
    width,
    height,
    framerate: fps,
    bitrate,
    // 'avc' gives length-prefixed samples that match the avcC record; the
    // alternative, Annex-B, is not what an MP4 sample table expects.
    avc: { format: 'avc' },
    // We are not streaming, so let the encoder spend time on quality.
    latencyMode: 'quality',
  })

  const frameDurationUs = 1_000_000 / fps
  const totalFrames = Math.max(1, Math.round(durationMs / (1000 / fps)))
  const keyFrameInterval = options.keyFrameInterval ?? Math.max(1, Math.round(fps * 2))
  const background = options.background === undefined ? '#ffffff' : options.background

  try {
    for (let i = 0; i < totalFrames; i++) {
      if (signal?.aborted) throw new Error('Export aborted')
      if (encodeError) throw encodeError

      const t = Math.min(durationMs, i * (1000 / fps))

      ctx.clearRect(0, 0, width, height)
      if (background) {
        ctx.fillStyle = background
        ctx.fillRect(0, 0, width, height)
      }
      await renderFrame(ctx, t)

      const frame = new VideoFrame(canvas, {
        timestamp: Math.round(i * frameDurationUs),
        duration: Math.round(frameDurationUs),
      })
      encoder.encode(frame, { keyFrame: i % keyFrameInterval === 0 })
      frame.close()

      // Keep the encoder queue shallow so memory stays bounded on long exports.
      while (encoder.encodeQueueSize > 8) {
        await new Promise((resolve) => setTimeout(resolve, 0))
        if (encodeError) throw encodeError
      }

      onProgress?.((i + 1) / totalFrames)
    }

    await encoder.flush()
    if (encodeError) throw encodeError
  } finally {
    if (encoder.state !== 'closed') encoder.close()
  }

  if (!avcC) {
    throw new Error('Encoder produced no H.264 decoder configuration')
  }

  const bytes = muxMP4(samples, { width, height, timescale, avcC })
  return new Blob([bytes], { type: 'video/mp4' })
}
