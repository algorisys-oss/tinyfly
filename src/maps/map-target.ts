import type { CustomTarget } from '../adapters/canvas'
import type { FrameInfo } from '../headless/video-scene'
import type { EasingType, Track } from '../engine/types'
import { sketchPen, type Point, type SketchStyle } from '../adapters/canvas/sketch'
import { partialPath, pathLength, pointAlong } from '../adapters/canvas/polyline'
import { flyView, greatCircle, project, type LonLat, type MapView } from './projection'
import { drawWorld, type WorldStyle } from './world'
import { drawTiles, type TileCache, type TileSource } from './tiles'

/**
 * A map as a canvas target: a base map (the offline world outline, or raster
 * tiles) with places and routes on it. Everything that moves is a number the
 * timeline can animate:
 *
 * - `view.lon`, `view.lat`, `view.zoom`: the view (fly the camera with these).
 *   Named with a dot so they never clash with a CSS property (`zoom` is one)
 * - `<place>.show`: 0..1, a pin drops in and its label fades up (default 1)
 * - `<route>.draw`: 0..1, how much of a route is drawn (default 1)
 * - `<route>.marker`: 0..1, where a marker travelling the route is; below 0 hides it (default -1)
 *
 * Places and routes are drawn through the same view as the base map, so they
 * stay put on it as the view pans and zooms.
 */

export interface MapPlace {
  id: string
  lon: number
  lat: number
  /** Text beside the pin (default none) */
  label?: string
  /** Pin colour (default red) */
  color?: string
}

export interface MapRoute {
  id: string
  /** Stops: place ids, or [lon, lat] points */
  through: Array<string | LonLat>
  /**
   * `arc` (default): a flight-path bow between stops; `great-circle`: the
   * shortest way over the globe; `straight`: straight on the map
   */
  shape?: 'arc' | 'great-circle' | 'straight'
  /** Line colour and width (default dark red, 3 px) */
  color?: string
  width?: number
  /** Dashed line (default false) */
  dashed?: boolean
  /** The travelling marker: a dot, or an arrow that points along the route (default arrow) */
  marker?: 'dot' | 'arrow'
}

export interface MapOptions {
  /** Size of the map's box, px */
  width: number
  height: number
  /** The view at the start; `lon`/`lat`/`zoom` tracks animate it */
  view: { lon: number; lat: number; zoom: number }
  /** `outline` (default): the offline world map. `tiles`: raster tiles (needs `tiles` and `tileCache`) */
  base?: 'outline' | 'tiles'
  tiles?: TileSource
  tileCache?: TileCache
  /** The outline map's colours (and pencil borders) */
  style?: WorldStyle
  places?: MapPlace[]
  routes?: MapRoute[]
  /** Draw routes in hand-drawn pencil strokes that boil (the outline borders follow `style.sketch`) */
  sketch?: SketchStyle
  /** Label font (default 600 14px sans-serif) */
  font?: string
}

/** The props a map starts with: its view, every place shown, every route drawn, no markers. */
export function mapProps(options: MapOptions): Record<string, number> {
  const props: Record<string, number> = { 'view.lon': options.view.lon, 'view.lat': options.view.lat, 'view.zoom': options.view.zoom }
  for (const place of options.places ?? []) props[`${place.id}.show`] = 1
  for (const route of options.routes ?? []) {
    props[`${route.id}.draw`] = 1
    props[`${route.id}.marker`] = -1
  }
  return props
}

/** The view a map shows for these props. */
export function mapView(options: MapOptions, props: Record<string, number>): MapView {
  return {
    lon: props['view.lon'] ?? options.view.lon,
    lat: props['view.lat'] ?? options.view.lat,
    zoom: props['view.zoom'] ?? options.view.zoom,
    width: options.width,
    height: options.height,
  }
}

/** A route's line in the map's box, through its stops, shaped as asked. */
export function routeLine(options: MapOptions, route: MapRoute, view: MapView): Point[] {
  const stops = route.through
    .map((stop) => (typeof stop === 'string' ? (options.places ?? []).find((p) => p.id === stop) : { lon: stop[0], lat: stop[1] }))
    .filter((stop): stop is { lon: number; lat: number } => stop !== undefined)
  const points: Point[] = []
  for (let i = 1; i < stops.length; i++) {
    const a: LonLat = [stops[i - 1].lon, stops[i - 1].lat]
    const b: LonLat = [stops[i].lon, stops[i].lat]
    let segment: Point[]
    if (route.shape === 'great-circle') {
      segment = greatCircle(a, b).map(([lon, lat]) => project(view, lon, lat))
    } else {
      const from = project(view, ...a)
      const to = project(view, ...b)
      if (route.shape === 'straight') {
        segment = [from, to]
      } else {
        // A bow to one side, upward on the map, a fifth of the way's length.
        let nx = -(to.y - from.y)
        let ny = to.x - from.x
        if (ny > 0) [nx, ny] = [-nx, -ny]
        const bow = 0.2
        const control = { x: (from.x + to.x) / 2 + nx * bow, y: (from.y + to.y) / 2 + ny * bow }
        segment = Array.from({ length: 25 }, (_, k) => {
          const t = k / 24
          const u = 1 - t
          return { x: u * u * from.x + 2 * u * t * control.x + t * t * to.x, y: u * u * from.y + 2 * u * t * control.y + t * t * to.y }
        })
      }
    }
    points.push(...(points.length ? segment.slice(1) : segment))
  }
  return points
}

function drawPin(ctx: CanvasRenderingContext2D, at: Point, show: number, color: string) {
  // Dropping in: from above, easing out, as it fades in.
  const drop = 1 - Math.pow(1 - show, 3)
  const y = at.y - (1 - drop) * 28
  const r = 7
  ctx.save()
  ctx.globalAlpha *= Math.min(1, show * 1.5)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)'
  ctx.beginPath()
  ctx.ellipse(at.x, at.y, r * 0.9 * drop, r * 0.35 * drop, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = color
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(at.x, y)
  ctx.bezierCurveTo(at.x - r * 0.4, y - r * 1.2, at.x - r * 1.3, y - r * 1.6, at.x - r * 1.3, y - r * 2.4)
  ctx.arc(at.x, y - r * 2.4, r * 1.3, Math.PI, 0)
  ctx.bezierCurveTo(at.x + r * 1.3, y - r * 1.6, at.x + r * 0.4, y - r * 1.2, at.x, y)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(at.x, y - r * 2.4, r * 0.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawLabel(ctx: CanvasRenderingContext2D, at: Point, text: string, show: number, font: string) {
  ctx.save()
  ctx.globalAlpha *= Math.max(0, Math.min(1, (show - 0.5) * 2))
  ctx.font = font
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 4
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.fillStyle = '#1f2937'
  ctx.strokeText(text, at.x + 12, at.y - 16)
  ctx.fillText(text, at.x + 12, at.y - 16)
  ctx.restore()
}

function drawMarker(ctx: CanvasRenderingContext2D, line: Point[], at: number, kind: 'dot' | 'arrow', color: string) {
  const p = pointAlong(line, at)
  const ahead = pointAlong(line, Math.min(1, at + 0.01))
  const behind = pointAlong(line, Math.max(0, at - 0.01))
  const angle = Math.atan2(ahead.y - behind.y, ahead.x - behind.x)
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.fillStyle = color
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  if (kind === 'dot') {
    ctx.arc(0, 0, 6, 0, Math.PI * 2)
  } else {
    ctx.rotate(angle)
    ctx.moveTo(11, 0)
    ctx.lineTo(-7, -7)
    ctx.lineTo(-3, 0)
    ctx.lineTo(-7, 7)
    ctx.closePath()
  }
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

/** Draw a map into the box (0, 0)–(width, height) for a set of props; `time` picks pencil boil frames. */
export function drawMap(ctx: CanvasRenderingContext2D, options: MapOptions, props: Record<string, number>, time = 0): void {
  const view = mapView(options, props)
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, options.width, options.height)
  ctx.clip()

  if ((options.base ?? 'outline') === 'tiles' && options.tiles && options.tileCache) {
    ctx.fillStyle = options.style?.sea ?? '#e5e3df'
    ctx.fillRect(0, 0, options.width, options.height)
    drawTiles(ctx, view, options.tiles, options.tileCache)
  } else {
    drawWorld(ctx, view, options.style, time)
  }

  const pen = options.sketch ? sketchPen(ctx, options.sketch, time) : undefined
  for (const route of options.routes ?? []) {
    const line = routeLine(options, route, view)
    if (line.length < 2) continue
    const color = route.color ?? '#b91c1c'
    const draw = Math.max(0, Math.min(1, props[`${route.id}.draw`] ?? 1))
    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = route.width ?? 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (route.dashed) ctx.setLineDash([ctx.lineWidth * 3, ctx.lineWidth * 2.5])
    if (draw > 0) {
      if (pen && !route.dashed) {
        pen.line(line, draw)
      } else {
        const drawn = partialPath(line, draw)
        ctx.beginPath()
        ctx.moveTo(drawn[0].x, drawn[0].y)
        for (const p of drawn.slice(1)) ctx.lineTo(p.x, p.y)
        ctx.stroke()
      }
    }
    ctx.restore()
    const marker = props[`${route.id}.marker`] ?? -1
    if (marker >= 0) drawMarker(ctx, line, Math.min(1, marker), route.marker ?? 'arrow', color)
  }

  const font = options.font ?? '600 14px sans-serif'
  for (const place of options.places ?? []) {
    const show = Math.max(0, Math.min(1, props[`${place.id}.show`] ?? 1))
    if (show <= 0) continue
    const at = project(view, place.lon, place.lat)
    drawPin(ctx, at, show, place.color ?? '#dc2626')
    if (place.label) drawLabel(ctx, at, place.label, show, font)
  }

  if ((options.base ?? 'outline') === 'tiles' && options.tiles) {
    // The tile server's credit, as its terms ask.
    ctx.font = '11px sans-serif'
    const text = options.tiles.attribution
    const width = ctx.measureText(text).width + 10
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fillRect(options.width - width, options.height - 18, width, 18)
    ctx.fillStyle = '#333333'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, options.width - width + 5, options.height - 9)
  }
  ctx.restore()
}

/** A `custom` target made by {@link mapTarget}. */
export interface MapTarget extends CustomTarget {
  readonly map: MapOptions
}

/**
 * A `custom` canvas target that draws a map in the box at (x, y). Its props
 * are the view (`view.lon`, `view.lat`, `view.zoom`) and each place's `.show`, each route's
 * `.draw` and `.marker`, so timeline tracks fly the camera, drop pins and draw
 * routes on.
 */
export function mapTarget(options: MapOptions & { x: number; y: number }): MapTarget {
  return {
    type: 'custom',
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    props: mapProps(options),
    map: options,
    draw(ctx, target, time) {
      drawMap(ctx, options, target.props as Record<string, number>, time)
    },
  }
}

/**
 * A map target's view in a frame, and where a place is in the scene then:
 * for immediate-mode drawing that stays on the map (a caption by a city).
 * `id` is the target's key in the scene's `targets`.
 */
export function mapAt(
  target: CustomTarget,
  frame: Pick<FrameInfo, 'state'>,
  id: string
): { view: MapView; point: (lon: number, lat: number) => Point } {
  const options = (target as Partial<MapTarget>).map
  if (!options) throw new Error('mapAt: the target was not made by mapTarget')
  const props = { ...(target.props as Record<string, number>) }
  let dx = 0
  let dy = 0
  for (const [property, value] of frame.state?.values.get(id) ?? []) {
    if (typeof value !== 'number') continue
    if (property === 'x') dx = value
    else if (property === 'y') dy = value
    else if (property in props) props[property] = value
  }
  const view = mapView(options, props)
  return {
    view,
    point: (lon, lat) => {
      const p = project(view, lon, lat)
      return { x: p.x + target.x + dx, y: p.y + target.y + dy }
    },
  }
}

/**
 * How far along a route (0..1 of its drawn length) each of its stops is, so a
 * pin can drop as the line reaches it. The same at any zoom.
 */
export function routeStops(options: MapOptions, routeId: string): number[] {
  const route = (options.routes ?? []).find((r) => r.id === routeId)
  if (!route) throw new Error(`routeStops: no route ${routeId}`)
  const view = { ...options.view, width: options.width, height: options.height }
  const stops: number[] = [0]
  let travelled = 0
  for (let i = 1; i < route.through.length; i++) {
    const leg = routeLine(options, { ...route, through: [route.through[i - 1], route.through[i]] }, view)
    travelled += pathLength(leg)
    stops.push(travelled)
  }
  return stops.map((d) => (travelled > 0 ? d / travelled : 0))
}

/**
 * Keyframe tracks for `view.lon`, `view.lat` and `view.zoom` that fly a map target's view
 * from one place to another between `start` and `end` ms, pulling out in the
 * middle when they are far apart (see `flyView`). The flight is sampled into
 * `samples` keys, so the JSON is plain keyframes.
 */
export function mapFlyTracks(
  target: string,
  from: { lon: number; lat: number; zoom: number },
  to: { lon: number; lat: number; zoom: number },
  start: number,
  end: number,
  options: { samples?: number; width?: number; easing?: EasingType } = {}
): Track[] {
  const samples = Math.max(2, options.samples ?? 12)
  // Ease the flight as a whole (default ease-in-out), then sample it.
  const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
  const keys = Array.from({ length: samples + 1 }, (_, i) => {
    const t = i / samples
    return { time: start + (end - start) * t, view: flyView(from, to, options.easing === 'linear' ? t : ease(t), options.width) }
  })
  return (['lon', 'lat', 'zoom'] as const).map((field) => ({
    id: `${target}-fly-${field}-${start}`,
    target,
    property: `view.${field}`,
    keyframes: keys.map((key) => ({ time: Math.round(key.time), value: key.view[field] })),
  }))
}
