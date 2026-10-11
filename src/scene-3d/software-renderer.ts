import type { ResolvedScene3D } from './resolve-scene'
import { inkColor, parseColor, shadeTriangle } from './shading'
import { vec3 } from '../engine/math'
import type { Renderer3D } from './canvas-2d-renderer'

/**
 * A software depth buffer for the Canvas 2D path: every triangle is
 * rasterised into a pixel buffer with a depth per pixel, so shapes that cut
 * through each other, huge floors and long meshes draw right with no `layer`
 * needed, in Node as well as on a page. Each triangle keeps its one shaded
 * colour (and its fog), edges are hard (no anti-aliasing), and the ink is
 * drawn into the same buffer with a depth test, so an outline never shows
 * through what is in front of it. Deterministic: the same frame gives the
 * same bytes anywhere.
 *
 * Layers keep their meaning: a lower layer is drawn first and a higher one
 * paints over it whatever the depths (the depth buffer is cleared between
 * layers). Objects drawn whole with the canvas API (characters in their pen
 * looks, lines, trails) go on top of the meshes, as on the WebGL2 renderer's
 * overlay; solid characters are meshes and sort by depth.
 */

export interface RasterImage {
  width: number
  height: number
  /** RGBA bytes, row by row */
  data: Uint8ClampedArray
  /** The nearest depth drawn at each pixel, metres; Infinity where nothing was */
  depth: Float32Array
}

export interface RasterOptions {
  /** Start from these pixels instead of the background (what was on the canvas under a transparent scene) */
  under?: Uint8ClampedArray
}

/** Rasterise a resolved frame's triangles and ink into a pixel buffer with a depth per pixel. */
export function rasterizeResolvedScene(frame: ResolvedScene3D, options: RasterOptions = {}): RasterImage {
  const W = frame.width
  const H = frame.height
  const data = new Uint8ClampedArray(W * H * 4)
  const depth = new Float32Array(W * H).fill(Infinity)
  if (options.under && options.under.length === data.length) data.set(options.under)
  else if (frame.background && frame.background !== 'transparent') {
    const top = parseColor(typeof frame.background === 'string' ? frame.background : frame.background.top)
    const bottom = parseColor(typeof frame.background === 'string' ? frame.background : frame.background.bottom)
    for (let y = 0; y < H; y++) {
      const t = H > 1 ? y / (H - 1) : 0
      const r = Math.round((top[0] + (bottom[0] - top[0]) * t) * 255)
      const g = Math.round((top[1] + (bottom[1] - top[1]) * t) * 255)
      const b = Math.round((top[2] + (bottom[2] - top[2]) * t) * 255)
      for (let x = 0; x < W; x++) {
        const i = y * W + x
        data[i * 4] = r
        data[i * 4 + 1] = g
        data[i * 4 + 2] = b
        data[i * 4 + 3] = 255
      }
    }
  }
  const image: RasterImage = { width: W, height: H, data, depth }

  // Triangles come by layer, then far to near. Each layer starts with a clear depth buffer.
  let layer = -Infinity
  const later: Array<ResolvedScene3D['triangles'][number]> = []
  const flush = () => {
    // See-through triangles of the layer go last, far to near, tested against the opaque ones but not writing depth.
    for (const t of later) paintTriangle(image, frame, t, false)
    later.length = 0
  }
  for (const triangle of frame.triangles) {
    if (triangle.layer !== layer) {
      flush()
      layer = triangle.layer
      depth.fill(Infinity)
    }
    if (triangle.opacity < 1) later.push(triangle)
    else paintTriangle(image, frame, triangle, true)
  }
  flush()
  return image
}

/** A triangle's fill, then its ink, into the buffer with a depth test. */
function paintTriangle(image: RasterImage, frame: ResolvedScene3D, triangle: ResolvedScene3D['triangles'][number], writeDepth: boolean): void {
  const { color, alpha } = shadeTriangle(triangle, frame.lights, frame.camera, frame.fog)
  const rgb = parseColor(color).map((v) => Math.round(v * 255)) as [number, number, number]
  fillTriangle(image, triangle.screen, triangle.depths, rgb, alpha, writeDepth)
  if (triangle.ink && triangle.outline.length > 0) {
    const ink = parseColor(inkColor(triangle.ink.color, frame.fog, vec3.distance(triangle.centroid, frame.camera.position))).map((v) => Math.round(v * 255)) as [number, number, number]
    triangle.outline.forEach((edge, i) => {
      const depths = triangle.outlineDepths[i] ?? [triangle.depth, triangle.depth]
      strokeSegment(image, edge[0], edge[1], depths, triangle.ink!.width, ink, alpha)
    })
  }
}

/** Write a colour at a pixel, blending by alpha. */
function blend(data: Uint8ClampedArray, i: number, rgb: [number, number, number], alpha: number): void {
  const o = i * 4
  if (alpha >= 1) {
    data[o] = rgb[0]
    data[o + 1] = rgb[1]
    data[o + 2] = rgb[2]
    data[o + 3] = 255
    return
  }
  const a = data[o + 3] / 255
  const outA = alpha + a * (1 - alpha)
  if (outA <= 0) return
  for (let c = 0; c < 3; c++) data[o + c] = Math.round((rgb[c] * alpha + data[o + c] * a * (1 - alpha)) / outA)
  data[o + 3] = Math.round(outA * 255)
}

/** How much nearer an outline counts than the face it sits on, as a share of the depth, so it wins the test. */
const INK_BIAS = 0.004

/** Fill a screen triangle with one colour, interpolating 1/depth across it for the depth test. */
function fillTriangle(image: RasterImage, screen: ResolvedScene3D['triangles'][number]['screen'], depths: [number, number, number], rgb: [number, number, number], alpha: number, writeDepth: boolean): void {
  const [a, b, c] = screen
  const area = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
  if (area === 0) return
  const minX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x)))
  const maxX = Math.min(image.width - 1, Math.ceil(Math.max(a.x, b.x, c.x)))
  const minY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y)))
  const maxY = Math.min(image.height - 1, Math.ceil(Math.max(a.y, b.y, c.y)))
  if (minX > maxX || minY > maxY) return
  const inv = [1 / Math.max(1e-9, depths[0]), 1 / Math.max(1e-9, depths[1]), 1 / Math.max(1e-9, depths[2])]
  const sign = area > 0 ? 1 : -1
  for (let y = minY; y <= maxY; y++) {
    const py = y + 0.5
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5
      // Barycentric weights from the edge functions, oriented so inside is positive whichever way the triangle winds.
      const w0 = ((b.x - px) * (c.y - py) - (b.y - py) * (c.x - px)) * sign
      const w1 = ((c.x - px) * (a.y - py) - (c.y - py) * (a.x - px)) * sign
      const w2 = ((a.x - px) * (b.y - py) - (a.y - py) * (b.x - px)) * sign
      if (w0 < 0 || w1 < 0 || w2 < 0) continue
      const total = w0 + w1 + w2
      const z = total / (w0 * inv[0] + w1 * inv[1] + w2 * inv[2])
      const i = y * image.width + x
      if (z >= image.depth[i]) continue
      blend(image.data, i, rgb, alpha)
      if (writeDepth) image.depth[i] = z
    }
  }
}

/** Draw an ink segment `width` px wide into the buffer, its depth interpolated along it and biased nearer. */
function strokeSegment(image: RasterImage, p: { x: number; y: number }, q: { x: number; y: number }, depths: [number, number], width: number, rgb: [number, number, number], alpha: number): void {
  const half = Math.max(0.5, width / 2)
  const minX = Math.max(0, Math.floor(Math.min(p.x, q.x) - half))
  const maxX = Math.min(image.width - 1, Math.ceil(Math.max(p.x, q.x) + half))
  const minY = Math.max(0, Math.floor(Math.min(p.y, q.y) - half))
  const maxY = Math.min(image.height - 1, Math.ceil(Math.max(p.y, q.y) + half))
  const dx = q.x - p.x
  const dy = q.y - p.y
  const length2 = dx * dx + dy * dy
  const r2 = half * half
  for (let y = minY; y <= maxY; y++) {
    const py = y + 0.5
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5
      const t = length2 > 0 ? Math.min(1, Math.max(0, ((px - p.x) * dx + (py - p.y) * dy) / length2)) : 0
      const cx = p.x + dx * t
      const cy = p.y + dy * t
      if ((px - cx) ** 2 + (py - cy) ** 2 > r2) continue
      const z = (depths[0] + (depths[1] - depths[0]) * t) * (1 - INK_BIAS)
      const i = y * image.width + x
      if (z > image.depth[i]) continue
      blend(image.data, i, rgb, alpha)
    }
  }
}

/** Draw a resolved frame on `ctx` through the depth buffer, then its drawables on top. */
export function drawResolvedSceneWithDepth(ctx: CanvasRenderingContext2D, frame: ResolvedScene3D): void {
  const transparent = !frame.background || frame.background === 'transparent'
  const under = transparent ? ctx.getImageData(0, 0, frame.width, frame.height).data : undefined
  const image = rasterizeResolvedScene(frame, { under })
  const out = ctx.createImageData(frame.width, frame.height)
  out.data.set(image.data)
  ctx.putImageData(out, 0, 0)
  ctx.save()
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  for (const d of frame.drawables) {
    ctx.save()
    d.draw(ctx, frame)
    ctx.restore()
  }
  ctx.restore()
}

/** The depth-buffered renderer, for the adapter: `new Scene3DAdapter(new SoftwareRenderer(ctx), …)`. */
export class SoftwareRenderer implements Renderer3D {
  private readonly ctx: CanvasRenderingContext2D

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  render(frame: ResolvedScene3D): void {
    drawResolvedSceneWithDepth(this.ctx, frame)
  }
}
