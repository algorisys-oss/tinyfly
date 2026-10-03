import type { Point } from '../adapters/canvas/sketch'
import { sketchPen, type SketchStyle } from '../adapters/canvas/sketch'
import { WORLD_110M, WORLD_110M_SCALE } from './world-110m'
import { lonLatToWorld, worldSize, type LonLat, type MapView } from './projection'

/**
 * The offline world map: country outlines from Natural Earth (public domain),
 * drawn as vector shapes. It needs no network and no images, so it works the
 * same in a browser, a Worker and headless video, and it can be drawn in pencil.
 */

export interface WorldCountry {
  name: string
  /** ISO 3166-1 alpha-3 code ('IND', 'NPL', 'FRA'…) */
  iso: string
  /** Natural Earth colour index 1..7: neighbouring countries differ */
  color: number
  /** Outer edges and holes, as longitude/latitude points */
  rings: LonLat[][]
  /** Each ring in world coordinates (0..1), and its bounds, for quick drawing */
  world: Array<{ points: Point[]; minX: number; maxX: number; minY: number; maxY: number }>
}

let decoded: WorldCountry[] | undefined

/** Every country of the offline world map (decoded once). */
export function worldCountries(): WorldCountry[] {
  if (decoded) return decoded
  decoded = WORLD_110M.map(([name, iso, color, encoded]) => {
    const rings = encoded.map((deltas) => {
      const ring: LonLat[] = []
      let x = 0
      let y = 0
      for (let i = 0; i < deltas.length; i += 2) {
        x += deltas[i]
        y += deltas[i + 1]
        ring.push([x / WORLD_110M_SCALE, y / WORLD_110M_SCALE])
      }
      return ring
    })
    const world = rings.map((ring) => {
      const points = ring.map(([lon, lat]) => lonLatToWorld(lon, lat))
      const xs = points.map((p) => p.x)
      const ys = points.map((p) => p.y)
      return { points, minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
    })
    return { name, iso, color, rings, world }
  })
  return decoded
}

/** A country by its ISO alpha-3 code or its name. */
export function findCountry(code: string): WorldCountry | undefined {
  const key = code.toLowerCase()
  return worldCountries().find((c) => c.iso.toLowerCase() === key || c.name.toLowerCase() === key)
}

export interface WorldStyle {
  /** Sea colour (default pale blue) */
  sea?: string
  /** Land colour, or one colour per Natural Earth colour index 1..7 (default a soft cream) */
  land?: string | string[]
  /** Border colour and width (default a soft brown, 1 px) */
  border?: string
  borderWidth?: number
  /** Countries to fill in their own colour, by ISO code or name */
  highlight?: Record<string, string>
  /** Draw the borders in hand-drawn pencil strokes that boil */
  sketch?: SketchStyle
}

export const WORLD_STYLE_DEFAULTS = {
  sea: '#cfe6f2',
  land: '#f3ecd9',
  border: '#9c8a74',
  borderWidth: 1,
} as const

/**
 * Draw the world outline for a view, into the box (0, 0)–(width, height).
 * `time` picks the boil frame of a sketched border.
 */
export function drawWorld(ctx: CanvasRenderingContext2D, view: MapView, style: WorldStyle = {}, time = 0): void {
  const size = worldSize(view.zoom)
  const centre = lonLatToWorld(view.lon, view.lat)
  const left = centre.x - view.width / 2 / size
  const right = centre.x + view.width / 2 / size
  const top = centre.y - view.height / 2 / size
  const bottom = centre.y + view.height / 2 / size
  const highlight = new Map(Object.entries(style.highlight ?? {}).map(([key, color]) => [findCountry(key)?.iso ?? key, color]))
  const land = style.land ?? WORLD_STYLE_DEFAULTS.land
  const fillFor = (country: WorldCountry) =>
    highlight.get(country.iso) ?? (Array.isArray(land) ? land[(country.color - 1) % land.length] : land)
  const pen = style.sketch ? sketchPen(ctx, style.sketch, time) : undefined

  ctx.save()
  ctx.fillStyle = style.sea ?? WORLD_STYLE_DEFAULTS.sea
  ctx.fillRect(0, 0, view.width, view.height)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  // Zoomed far out, the world repeats sideways, as on a web map.
  for (let copy = Math.floor(left); copy <= Math.floor(right); copy++) {
    for (const country of worldCountries()) {
      const rings = country.world.filter((r) => r.maxX + copy >= left && r.minX + copy <= right && r.maxY >= top && r.minY <= bottom)
      if (rings.length === 0) continue
      const screen = rings.map((r) => r.points.map((p) => ({ x: (p.x + copy - centre.x) * size + view.width / 2, y: (p.y - centre.y) * size + view.height / 2 })))
      ctx.beginPath()
      for (const ring of screen) {
        ctx.moveTo(ring[0].x, ring[0].y)
        for (const p of ring.slice(1)) ctx.lineTo(p.x, p.y)
        ctx.closePath()
      }
      ctx.fillStyle = fillFor(country)
      ctx.fill('evenodd')
      ctx.strokeStyle = style.border ?? WORLD_STYLE_DEFAULTS.border
      ctx.lineWidth = style.borderWidth ?? WORLD_STYLE_DEFAULTS.borderWidth
      if (pen) for (const ring of screen) pen.line([...ring, ring[0]])
      else ctx.stroke()
    }
  }
  ctx.restore()
}
