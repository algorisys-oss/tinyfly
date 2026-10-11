import type { Timeline } from '../engine/core/timeline'
import { deserializeTimeline } from '../engine/serialization'
import { CanvasAdapter, applyBloom, applyCamera, cameraFromValues, canvasLike } from '../adapters/canvas'
import type { DrawFunction, FrameInfo, VideoScene } from './video-scene'
import { DEFAULT_FPS } from './video-scene'
import { heldTime } from '../engine/core/clock'

/**
 * Draws a {@link VideoScene} at any time onto a 2D context.
 *
 * Needs no DOM and no Node API: the caller supplies the context (a browser
 * canvas, an OffscreenCanvas, or a Node canvas library). Every frame is drawn
 * from scratch at an explicit time, so rendering is deterministic and frames
 * can be drawn in any order.
 */
export class FrameRenderer {
  readonly scene: VideoScene
  readonly fps: number
  /** Length in ms */
  readonly duration: number
  /** Output size is the scene size times this */
  readonly scale: number
  private readonly timeline?: Timeline
  private readonly adapter = new CanvasAdapter()

  constructor(scene: VideoScene, options: { scale?: number } = {}) {
    this.scene = scene
    this.fps = scene.fps ?? DEFAULT_FPS
    this.scale = options.scale ?? 1
    this.timeline = scene.timeline ? deserializeTimeline(scene.timeline) : undefined
    this.duration = scene.duration ?? this.timeline?.duration ?? 0
    if (!(this.fps > 0)) throw new Error(`video: fps must be positive (got ${scene.fps})`)
    if (!(this.duration > 0)) {
      throw new Error('video: the scene needs a duration (set `duration`, or give it a timeline with tracks)')
    }
    for (const [id, target] of Object.entries(scene.targets ?? {})) {
      this.adapter.registerTarget(id, target)
    }
  }

  /** Output width in pixels */
  get width(): number {
    return Math.round(this.scene.width * this.scale)
  }

  /** Output height in pixels */
  get height(): number {
    return Math.round(this.scene.height * this.scale)
  }

  /** Frames needed to cover the whole duration */
  get frameCount(): number {
    return frameCount(this.duration, this.fps)
  }

  /** Time in ms of a frame */
  frameTime(index: number): number {
    return (index * 1000) / this.fps
  }

  /**
   * Stills worth checking: the middle of each caption (the moment a line is
   * being spoken), else the middle of each marker's step (from the marker to
   * the next one, or the end), else the middle of the video.
   */
  stillTimes(): Array<{ id: string; time: number }> {
    const captions = this.scene.captions ?? []
    if (captions.length > 0) {
      return captions.map((cue, index) => ({ id: cue.id ?? `line-${index}`, time: (cue.start + cue.end) / 2 }))
    }
    const markers = [...(this.scene.timeline?.config?.markers ?? [])].sort((a, b) => a.time - b.time)
    if (markers.length === 0) return [{ id: 'middle', time: this.duration / 2 }]
    return markers.map((marker, index) => {
      const end = index + 1 < markers.length ? markers[index + 1].time : this.duration
      return { id: marker.id, time: (marker.time + end) / 2 }
    })
  }

  /**
   * Clear the context and draw the scene at `time` ms. With `supersample` the
   * frame is drawn larger and scaled down; with `motionBlur` it is the average
   * of several drawings across the shutter's time.
   */
  render(ctx: CanvasRenderingContext2D, time: number, index = 0): void {
    const super_ = Math.max(1, Math.round(this.scene.supersample ?? 1))
    const blur = this.scene.motionBlur
    const samples = blur ? Math.max(1, Math.round(blur.samples)) : 1
    if (super_ === 1 && samples === 1) {
      this.paint(ctx, time, index, this.scale)
      return
    }
    const W = this.width
    const H = this.height
    const big = canvasLike(ctx, W * super_, H * super_)
    const bctx = big?.getContext('2d') as CanvasRenderingContext2D | null | undefined
    if (!big || !bctx) {
      this.paint(ctx, time, index, this.scale)
      return
    }
    const target = samples > 1 ? canvasLike(ctx, W * super_, H * super_) : null
    const tctx = target?.getContext('2d') as CanvasRenderingContext2D | null | undefined
    if (samples > 1 && target && tctx) {
      // The shutter opens at the frame's time and stays open a share of the frame: average the drawings across it.
      const open = ((blur!.shutter ?? 0.5) * 1000) / this.fps
      tctx.setTransform(1, 0, 0, 1, 0, 0)
      tctx.clearRect(0, 0, W * super_, H * super_)
      for (let k = 0; k < samples; k++) {
        this.paint(bctx, time + (open * k) / samples, index, this.scale * super_)
        tctx.globalAlpha = 1 / (k + 1)
        tctx.drawImage(big as unknown as CanvasImageSource, 0, 0)
      }
      tctx.globalAlpha = 1
    } else {
      this.paint(bctx, time, index, this.scale * super_)
    }
    const source = samples > 1 && target ? target : big
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, W, H)
    ctx.save()
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(source as unknown as CanvasImageSource, 0, 0, W * super_, H * super_, 0, 0, W, H)
    ctx.restore()
  }

  /** One drawing of the scene at `time` on a context, at an output scale. */
  private paint(ctx: CanvasRenderingContext2D, time: number, index: number, scale: number): void {
    // The timeline is never played here, so its own clock stays at 0: stamp
    // the state with the frame's time, which custom targets draw at.
    // On twos (or threes), the animation holds each drawing for several frames.
    const drawingRate = this.scene.drawingRate ?? 0
    const animated = heldTime(time, drawingRate)
    const timelineState = this.timeline?.getStateAtTime(animated)
    const state = timelineState && { ...timelineState, currentTime: animated }
    const W = Math.round(this.scene.width * scale)
    const H = Math.round(this.scene.height * scale)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, W, H)
    ctx.save()
    ctx.scale(scale, scale)
    const timeline = this.timeline
    const stateAt = timeline && ((at: number) => timeline.getStateAtTime(heldTime(at, drawingRate)))
    const frame: FrameInfo = { index, time, state, stateAt, width: this.scene.width, height: this.scene.height }
    if (this.scene.loop) frame.period = this.duration
    const background = this.scene.background ?? '#ffffff'
    if (typeof background !== 'function' && background !== 'transparent') {
      ctx.fillStyle = background
      ctx.fillRect(0, 0, this.scene.width, this.scene.height)
    }
    // Everything else is seen through the camera, when the scene has one.
    const camera = this.scene.camera
    if (camera) {
      const id = camera === true ? 'Camera' : camera
      applyCamera(ctx, cameraFromValues(state?.values.get(id)), this.scene)
    }
    if (typeof background === 'function') this.drawIsolated(ctx, background, frame)
    if (state) this.adapter.applyState(state)
    this.adapter.render(ctx)
    if (this.scene.draw) this.drawIsolated(ctx, this.scene.draw, frame)
    ctx.restore()
    if (this.scene.overlay) {
      // Screen space: the output scale, but not the camera.
      ctx.save()
      ctx.scale(scale, scale)
      this.drawIsolated(ctx, this.scene.overlay, frame)
      ctx.restore()
    }
    if (this.scene.bloom) {
      // Over the finished frame, in output pixels: a radius in scene px grows with the scale.
      const options = this.scene.bloom === true ? {} : this.scene.bloom
      applyBloom(ctx, options.radius !== undefined ? { ...options, radius: options.radius * scale } : options)
    }
  }

  /** Run scene code without letting its context changes leak into the rest. */
  private drawIsolated(ctx: CanvasRenderingContext2D, draw: DrawFunction, frame: FrameInfo): void {
    ctx.save()
    draw(ctx, frame)
    ctx.restore()
  }
}

/** Frames at 0, 1/fps, 2/fps, … needed to reach `duration` ms (at least one). */
export function frameCount(duration: number, fps: number): number {
  // The epsilon keeps 2000 ms at 30 fps at exactly 60 frames despite float error.
  return Math.max(1, Math.ceil((duration * fps) / 1000 - 1e-6))
}
