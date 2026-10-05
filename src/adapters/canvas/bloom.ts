import { canvasLike } from './offscreen'

/**
 * Bloom: light spilling around what is bright, the glow of neon. Applied to
 * a canvas after drawing: the bright parts are found at a reduced size,
 * blurred twice (a tight glow and a wide halo) and added back over the
 * picture.
 *
 * Deterministic: the blur is plain arithmetic (no `ctx.filter`), so the same
 * frame blooms the same in every browser and in Node.
 */
export interface BloomOptions {
  /**
   * How bright a pixel must be to glow, 0..1, by its brightest channel (so a
   * saturated neon magenta counts as bright). Default 0.55.
   */
  threshold?: number
  /** How strongly the glow is added, 0.. (default 0.9) */
  strength?: number
  /** The glow's reach, px at the canvas's size (default 2% of its larger side); the halo reaches 3× further */
  radius?: number
  /** Work at 1/n of the size: faster and softer (default 4) */
  downsample?: number
  /** How much of the wide halo joins the glow, 0..1 (default 0.6) */
  halo?: number
}

/**
 * What glows: each pixel scaled by how far its brightest channel is past the
 * threshold (keeping its hue), as linear RGB floats (3 per pixel).
 */
export function brightPass(data: ArrayLike<number>, threshold: number): Float32Array {
  const pixels = data.length / 4
  const out = new Float32Array(pixels * 3)
  const t = Math.min(0.999, Math.max(0, threshold))
  for (let i = 0; i < pixels; i++) {
    const r = data[i * 4] / 255
    const g = data[i * 4 + 1] / 255
    const b = data[i * 4 + 2] / 255
    const a = data[i * 4 + 3] / 255
    const peak = Math.max(r, g, b)
    if (peak <= t) continue
    const k = (((peak - t) / (1 - t)) * a) / peak
    out[i * 3] = r * k
    out[i * 3 + 1] = g * k
    out[i * 3 + 2] = b * k
  }
  return out
}

/** One box blur pass along rows (`horizontal`) or columns, edges clamped; RGB floats. */
function boxPass(source: Float32Array, width: number, height: number, radius: number, horizontal: boolean): Float32Array {
  const out = new Float32Array(source.length)
  const lines = horizontal ? height : width
  const length = horizontal ? width : height
  const at = (line: number, i: number) => (horizontal ? line * width + i : i * width + line) * 3
  const span = radius * 2 + 1
  for (let line = 0; line < lines; line++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0
      for (let i = -radius; i <= radius; i++) sum += source[at(line, Math.min(length - 1, Math.max(0, i))) + c]
      for (let i = 0; i < length; i++) {
        out[at(line, i) + c] = sum / span
        const leaving = source[at(line, Math.max(0, i - radius)) + c]
        const entering = source[at(line, Math.min(length - 1, i + radius + 1)) + c]
        sum += entering - leaving
      }
    }
  }
  return out
}

/** A soft blur close to a Gaussian: three box blurs each way. */
export function boxBlur(source: Float32Array, width: number, height: number, radius: number): Float32Array {
  const r = Math.max(1, Math.round(radius / Math.sqrt(3)))
  let out = source
  for (let pass = 0; pass < 3; pass++) {
    out = boxPass(out, width, height, r, true)
    out = boxPass(out, width, height, r, false)
  }
  return out
}

/** Add a bloom to what is already drawn on `ctx` (its whole canvas, in device pixels). */
export function applyBloom(ctx: CanvasRenderingContext2D, options: BloomOptions = {}): void {
  const canvas = ctx.canvas as unknown as { width: number; height: number }
  const W = canvas.width
  const H = canvas.height
  if (!(W > 0 && H > 0)) return
  const factor = Math.max(1, Math.round(options.downsample ?? 4))
  const w = Math.max(1, Math.ceil(W / factor))
  const h = Math.max(1, Math.ceil(H / factor))
  const small = canvasLike(ctx, w, h)
  const sctx = small?.getContext('2d') as CanvasRenderingContext2D | null | undefined
  if (!small || !sctx) return

  sctx.imageSmoothingEnabled = true
  sctx.drawImage(ctx.canvas as CanvasImageSource, 0, 0, w, h)
  const bright = brightPass(sctx.getImageData(0, 0, w, h).data, options.threshold ?? 0.55)
  const radius = (options.radius ?? Math.max(W, H) * 0.02) / factor
  const glow = boxBlur(bright, w, h, radius)
  const wide = boxBlur(bright, w, h, radius * 3)
  const halo = options.halo ?? 0.6

  const image = sctx.createImageData(w, h)
  for (let i = 0; i < w * h; i++) {
    for (let c = 0; c < 3; c++) image.data[i * 4 + c] = Math.round(Math.min(1, glow[i * 3 + c] + wide[i * 3 + c] * halo) * 255)
    image.data[i * 4 + 3] = 255
  }
  sctx.putImageData(image, 0, 0)

  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalCompositeOperation = 'lighter'
  ctx.globalAlpha = Math.max(0, options.strength ?? 0.9)
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(small as unknown as CanvasImageSource, 0, 0, W, H)
  ctx.restore()
}
