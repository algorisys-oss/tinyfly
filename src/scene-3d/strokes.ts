import { mat4, vec3, type Vec3 } from '../engine/math'
import { ribbon, ribbonHeadCap } from '../engine/path/trail'
import type { Drawable } from './object-kind'
import type { ResolvedCamera, ResolvedScene3D, ScreenPoint } from './resolve-scene'
import { fogAmount, parseColor } from './shading'

/**
 * Lines and trails in a 3D scene: a band through world points, facing the
 * camera, as many drawables as it has segments, so each sits at its own
 * depth among the meshes' triangles (a trail can pass behind one shape and in
 * front of another).
 */

export interface StrokeLook {
  color: string
  /** Metres */
  width: number
  taper: number
  fade: number
  opacity: number
  additive: boolean
}

export interface StrokeView {
  camera: ResolvedCamera
  /** Canvas height, px */
  height: number
  fog?: ResolvedScene3D['fog']
  toScreen(view: Vec3): ScreenPoint
}

/**
 * The band through `points` (world space), each with its age: 0 at the head,
 * 1 at the tail, where taper and fade apply in full.
 */
export function strokeDrawables(points: Vec3[], ages: number[], look: StrokeLook, view: StrokeView): Drawable[] {
  const { camera } = view
  const near = camera.near
  const viewPoints = points.map((p) => mat4.transformPoint(camera.view, p))
  // Pixels per metre at a depth: the projection's vertical scale, over the depth when in perspective.
  const scale = (camera.projection[5] * view.height) / 2
  const pxWidth = (age: number, depth: number) => (look.width * (1 - look.taper * age) * scale) / (camera.orthographic ? 1 : Math.max(depth, near))
  const base = parseColor(look.color)

  // Runs of points in front of the near plane; a segment that crosses it is cut there.
  type Point = { view: Vec3; age: number }
  const runs: Point[][] = []
  let run: Point[] = []
  const inFront = (p: Vec3) => -p[2] >= near
  for (let i = 0; i < viewPoints.length; i++) {
    const p = viewPoints[i]
    if (inFront(p)) {
      if (run.length === 0 && i > 0 && !inFront(viewPoints[i - 1])) run.push(cut(viewPoints[i - 1], p, ages[i - 1], ages[i], near))
      run.push({ view: p, age: ages[i] })
    } else if (run.length > 0) {
      run.push(cut(viewPoints[i - 1], p, ages[i - 1], ages[i], near))
      runs.push(run)
      run = []
    }
  }
  if (run.length > 0) runs.push(run)

  const drawables: Drawable[] = []
  for (const points of runs) {
    if (points.length < 2) continue
    const depths = points.map((p) => -p.view[2])
    const screen = points.map((p) => view.toScreen(p.view))
    const band = screen.map((s, i) => ({ x: s.x, y: s.y, width: pxWidth(points[i].age, depths[i]) }))
    const edges = ribbon(band)
    // A round end where the band is at its head (age 0): a line's last point, a trail's now.
    const cap = points[points.length - 1].age === 0 ? ribbonHeadCap(band) : null
    for (let i = 0; i + 1 < points.length; i++) {
      const depth = (depths[i] + depths[i + 1]) / 2
      if (depth > camera.far) continue
      let alpha = look.opacity * (1 - look.fade * ((points[i].age + points[i + 1].age) / 2))
      // Fog: a normal band turns toward the fog colour; light added in fog just dims.
      const midpoint = vec3.lerp(points[i].view, points[i + 1].view, 0.5)
      const amount = fogAmount(view.fog, vec3.length(midpoint))
      let rgb = base
      if (view.fog && amount > 0) {
        if (look.additive) alpha *= 1 - amount
        else {
          const f = parseColor(view.fog.color)
          rgb = [base[0] + (f[0] - base[0]) * amount, base[1] + (f[1] - base[1]) * amount, base[2] + (f[2] - base[2]) * amount]
        }
      }
      if (alpha <= 0) continue
      const color = `rgb(${rgb.map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255)).join(', ')})`
      const corners = [edges.left[i], edges.left[i + 1], edges.right[i + 1], edges.right[i]]
      const end = i + 2 === points.length ? cap : null
      drawables.push({
        depth,
        draw(ctx) {
          if (look.additive) ctx.globalCompositeOperation = 'lighter'
          ctx.globalAlpha = Math.min(1, alpha)
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.moveTo(corners[0].x, corners[0].y)
          ctx.lineTo(corners[1].x, corners[1].y)
          if (end) ctx.arc(end.x, end.y, end.radius, end.start, end.start - Math.PI, true)
          ctx.lineTo(corners[2].x, corners[2].y)
          ctx.lineTo(corners[3].x, corners[3].y)
          ctx.closePath()
          ctx.fill()
          // An opaque band is also stroked a hair wide in its colour, so segment joins leave no seams.
          if (!look.additive && alpha >= 1) {
            ctx.strokeStyle = color
            ctx.lineWidth = 0.75
            ctx.stroke()
          }
        },
      })
    }
  }
  return drawables
}

/** Where the segment from `a` to `b` crosses the near plane, with its age there. */
function cut(a: Vec3, b: Vec3, ageA: number, ageB: number, near: number): { view: Vec3; age: number } {
  const t = (-near - a[2]) / (b[2] - a[2])
  return { view: vec3.lerp(a, b, t), age: ageA + (ageB - ageA) * t }
}
