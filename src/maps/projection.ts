import type { Point } from '../adapters/canvas/sketch'

/**
 * Web Mercator, the projection web maps use (OpenStreetMap, Google, Mapbox):
 * longitude and latitude to flat coordinates, so routes, pins and tiles line
 * up. Pure arithmetic, so it runs anywhere and always gives the same numbers.
 *
 * World coordinates run 0..1 from the antimeridian eastward (x) and from the
 * north edge of the map southward (y). At zoom z the world is 256 × 2^z px
 * across, as in the standard tile scheme.
 */

/** Tile size in px, and the world's size at zoom 0. */
export const TILE_SIZE = 256

/** Latitudes beyond this do not fit a square Mercator map. */
export const MAX_LATITUDE = 85.05112878

export type LonLat = [lon: number, lat: number]

/** A view of the map: what is at the centre, the zoom, and the size of the window onto it (px). */
export interface MapView {
  lon: number
  lat: number
  zoom: number
  width: number
  height: number
}

const clampLat = (lat: number) => Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, lat))

/** Longitude and latitude (degrees) to world coordinates (0..1). */
export function lonLatToWorld(lon: number, lat: number): Point {
  const sin = Math.sin((clampLat(lat) * Math.PI) / 180)
  return {
    x: (lon + 180) / 360,
    y: 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI),
  }
}

/** World coordinates (0..1) back to longitude and latitude. */
export function worldToLonLat(x: number, y: number): LonLat {
  const lon = x * 360 - 180
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI
  return [lon, lat]
}

/** The world's width in px at a zoom. */
export const worldSize = (zoom: number) => TILE_SIZE * Math.pow(2, zoom)

/** Where a place is in a view, px from the view's top-left corner. */
export function project(view: MapView, lon: number, lat: number): Point {
  const size = worldSize(view.zoom)
  const centre = lonLatToWorld(view.lon, view.lat)
  const p = lonLatToWorld(lon, lat)
  return { x: (p.x - centre.x) * size + view.width / 2, y: (p.y - centre.y) * size + view.height / 2 }
}

/** The place at a point in a view (px from its top-left corner). */
export function unproject(view: MapView, x: number, y: number): LonLat {
  const size = worldSize(view.zoom)
  const centre = lonLatToWorld(view.lon, view.lat)
  return worldToLonLat(centre.x + (x - view.width / 2) / size, centre.y + (y - view.height / 2) / size)
}

/**
 * The centre and zoom that fit `places` in a window `width` × `height` px,
 * with `padding` px to spare on every side. One place is shown at `maxZoom`.
 */
export function fitView(places: LonLat[], width: number, height: number, padding = 40, maxZoom = 16): { lon: number; lat: number; zoom: number } {
  if (places.length === 0) return { lon: 0, lat: 20, zoom: 1 }
  const points = places.map(([lon, lat]) => lonLatToWorld(lon, lat))
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const spanX = Math.max(1e-9, maxX - minX)
  const spanY = Math.max(1e-9, maxY - minY)
  const zoomFor = (span: number, room: number) => Math.log2(Math.max(1, room - padding * 2) / (span * TILE_SIZE))
  const zoom = Math.min(maxZoom, zoomFor(spanX, width), zoomFor(spanY, height))
  const [lon, lat] = worldToLonLat((minX + maxX) / 2, (minY + maxY) / 2)
  return { lon, lat, zoom: Math.max(0, zoom) }
}

/**
 * A view part way (`t` 0..1) along a flight from `from` to `to`: the centre
 * slides across the world while the zoom eases between the two, pulling out
 * in the middle far enough to keep both ends in sight when they are far
 * apart (as map apps fly between places).
 */
export function flyView(
  from: { lon: number; lat: number; zoom: number },
  to: { lon: number; lat: number; zoom: number },
  t: number,
  width = 1024
): { lon: number; lat: number; zoom: number } {
  const a = lonLatToWorld(from.lon, from.lat)
  const b = lonLatToWorld(to.lon, to.lat)
  const distance = Math.hypot(b.x - a.x, b.y - a.y)
  // The zoom that shows both ends; the middle of the flight comes out to it (and a little more).
  const both = distance > 0 ? Math.log2(width / (distance * TILE_SIZE)) - 0.5 : Infinity
  const straight = from.zoom + (to.zoom - from.zoom) * t
  const pullOut = Math.max(0, (from.zoom + to.zoom) / 2 - both)
  const zoom = straight - pullOut * 4 * t * (1 - t)
  const [lon, lat] = worldToLonLat(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)
  return { lon, lat, zoom }
}

/**
 * Points along the great circle from one place to another (the shortest
 * route over the globe, which a flight follows): curved on a flat map.
 */
export function greatCircle(from: LonLat, to: LonLat, samples = 32): LonLat[] {
  const rad = Math.PI / 180
  const toVector = ([lon, lat]: LonLat) => [Math.cos(lat * rad) * Math.cos(lon * rad), Math.cos(lat * rad) * Math.sin(lon * rad), Math.sin(lat * rad)]
  const a = toVector(from)
  const b = toVector(to)
  const angle = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])))
  if (angle < 1e-9) return [from, to]
  const out: LonLat[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const wa = Math.sin((1 - t) * angle) / Math.sin(angle)
    const wb = Math.sin(t * angle) / Math.sin(angle)
    const [x, y, z] = [wa * a[0] + wb * b[0], wa * a[1] + wb * b[1], wa * a[2] + wb * b[2]]
    out.push([Math.atan2(y, x) / rad, Math.atan2(z, Math.hypot(x, y)) / rad])
  }
  return out
}
