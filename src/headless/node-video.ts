/// <reference types="node" />
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { FrameRenderer } from './frame-renderer'
import { ffmpegArgs } from './ffmpeg-args'
import type { VideoScene } from './video-scene'

/**
 * Node rendering: a {@link VideoScene} to an MP4 (through ffmpeg) or to PNG
 * stills.
 *
 * Requirements, both outside the engine on purpose:
 * - `@napi-rs/canvas` (an optional peer dependency) provides the 2D context.
 * - `ffmpeg` on the PATH (or `options.ffmpeg`) encodes the video.
 *
 * Loading the canvas library defines `globalThis.Path2D` when it is missing,
 * because the canvas adapter builds `Path2D` objects for path targets.
 */

/** The parts of `@napi-rs/canvas` this module uses. */
interface NodeCanvasModule {
  createCanvas(width: number, height: number): NodeCanvas
  Path2D: unknown
  GlobalFonts: { registerFromPath(path: string, family?: string): unknown }
}

interface NodeCanvas {
  getContext(type: '2d'): unknown
  encode(format: 'png'): Promise<Uint8Array>
}

/** Options shared by video and stills rendering. */
export interface HeadlessOptions {
  /** Directory that relative `audio` and font paths resolve against (default: cwd) */
  baseDir?: string
  /** Output size multiplier, e.g. 0.5 for a quick preview (default 1) */
  scale?: number
  /** Font files to register before drawing, added to the scene's: `{ Poppins: 'fonts/Poppins-Bold.ttf' }` */
  fonts?: Record<string, string>
}

export interface RenderVideoOptions extends HeadlessOptions {
  /** Output file (.mp4) */
  output: string
  /** Soundtrack to mux in, overriding the scene's; `false` renders silent */
  audio?: string | false
  /** Frames per second, overriding the scene's */
  fps?: number
  /** x264 quality, 0–51 (default 20) */
  crf?: number
  /** x264 preset (default `medium`) */
  preset?: string
  /** ffmpeg executable (default `ffmpeg`) */
  ffmpeg?: string
  /** Called after each frame */
  onProgress?: (done: number, total: number) => void
}

export interface RenderVideoResult {
  output: string
  frames: number
  /** Length in ms */
  duration: number
}

let canvasModule: Promise<NodeCanvasModule> | undefined

/** Load `@napi-rs/canvas` once, with a clear message when it is not installed. */
function loadCanvas(): Promise<NodeCanvasModule> {
  canvasModule ??= import('@napi-rs/canvas').then(
    (mod) => {
      const canvas = mod as unknown as NodeCanvasModule
      const scope = globalThis as { Path2D?: unknown }
      if (scope.Path2D === undefined) scope.Path2D = canvas.Path2D
      return canvas
    },
    () => {
      canvasModule = undefined
      throw new Error('tinyfly: rendering in Node needs the optional package @napi-rs/canvas (npm install @napi-rs/canvas)')
    }
  )
  return canvasModule
}

async function prepare(scene: VideoScene, options: HeadlessOptions & { fps?: number }) {
  const canvasLib = await loadCanvas()
  const baseDir = options.baseDir ?? process.cwd()
  for (const [family, file] of Object.entries({ ...scene.fonts, ...options.fonts })) {
    canvasLib.GlobalFonts.registerFromPath(resolve(baseDir, file), family)
  }
  const renderer = new FrameRenderer(options.fps ? { ...scene, fps: options.fps } : scene, { scale: options.scale })
  const canvas = canvasLib.createCanvas(renderer.width, renderer.height)
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  return { renderer, canvas, ctx, baseDir }
}

/** Render every frame of the scene into an MP4. */
export async function renderVideo(scene: VideoScene, options: RenderVideoOptions): Promise<RenderVideoResult> {
  const { renderer, ctx, baseDir } = await prepare(scene, options)
  const audioFile = options.audio === false ? undefined : (options.audio ?? scene.audio)
  const output = resolve(options.output)
  const encoder = startEncoder(
    options.ffmpeg ?? 'ffmpeg',
    ffmpegArgs({
      width: renderer.width,
      height: renderer.height,
      fps: renderer.fps,
      output,
      audio: audioFile ? resolve(baseDir, audioFile) : undefined,
      crf: options.crf,
      preset: options.preset,
    })
  )

  const total = renderer.frameCount
  try {
    for (let index = 0; index < total; index++) {
      renderer.render(ctx, renderer.frameTime(index), index)
      const pixels = ctx.getImageData(0, 0, renderer.width, renderer.height).data
      await encoder.write(new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.byteLength))
      options.onProgress?.(index + 1, total)
    }
  } catch (error) {
    encoder.abort()
    throw error
  }
  await encoder.finish()
  return { output, frames: total, duration: renderer.duration }
}

export interface RenderStillsOptions extends HeadlessOptions {
  /** Directory to write PNGs into (created if missing) */
  dir: string
  /** Times in ms to render, named by id (default: the middle of each marker's step) */
  times?: Array<{ id: string; time: number }>
}

/**
 * One PNG per marker step (or per given time), for checking layout without
 * encoding a video. Returns the written file paths.
 */
export async function renderStills(scene: VideoScene, options: RenderStillsOptions): Promise<string[]> {
  const { renderer, canvas, ctx } = await prepare(scene, options)
  const dir = resolve(options.dir)
  await mkdir(dir, { recursive: true })
  const times = options.times ?? renderer.stillTimes()
  const width = String(times.length).length
  const files: string[] = []
  for (const [index, { id, time }] of times.entries()) {
    renderer.render(ctx, time)
    const file = join(dir, `${String(index).padStart(width, '0')}-${safeName(id)}.png`)
    await writeFile(file, await canvas.encode('png'))
    files.push(file)
  }
  return files
}

/** Keep ids usable as file names. */
function safeName(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]+/g, '-') || 'frame'
}

/** An ffmpeg process fed raw frames on stdin. */
function startEncoder(ffmpeg: string, args: string[]) {
  const child = spawn(ffmpeg, args, { stdio: ['pipe', 'ignore', 'pipe'] })
  let stderr = ''
  child.stderr.on('data', (chunk: Buffer) => {
    stderr += chunk.toString()
  })
  // A dead ffmpeg surfaces through `done`; this stops EPIPE crashing the process.
  child.stdin.on('error', () => {})

  const done = new Promise<void>((resolveDone, rejectDone) => {
    child.on('error', (error: NodeJS.ErrnoException) => {
      rejectDone(
        error.code === 'ENOENT'
          ? new Error(`tinyfly: "${ffmpeg}" was not found; install ffmpeg or pass its path`)
          : error
      )
    })
    child.on('close', (code) => {
      if (code === 0) resolveDone()
      else rejectDone(new Error(`tinyfly: ffmpeg exited with code ${code}${stderr ? `:\n${stderr.trim()}` : ''}`))
    })
  })
  // Until finish(), any exit is a failure, even a clean one.
  const exitedEarly = done.then(() => {
    throw new Error('tinyfly: ffmpeg stopped before all frames were written')
  })
  exitedEarly.catch(() => {})

  return {
    write(frame: Uint8Array): Promise<void> {
      if (child.stdin.write(frame)) return Promise.resolve()
      const drained = new Promise<void>((resolveDrain) => child.stdin.once('drain', () => resolveDrain()))
      return Promise.race([drained, exitedEarly])
    },
    finish(): Promise<void> {
      child.stdin.end()
      return done
    },
    abort(): void {
      child.kill()
    },
  }
}
