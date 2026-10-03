import type { CustomTarget } from '../../adapters/canvas'
import type { AnimationState, Keyframe } from '../../engine/types'
import {
  browserTileLoader,
  drawMap,
  fitView,
  mapProps,
  OSM_TILES,
  preloadTiles,
  routeStops,
  TileCache,
  type MapOptions,
  type MapView,
} from '../../maps'
import type { MapElement } from '../stores/scene-store'

/**
 * Map elements: the editor's bridge to the maps module. The element is plain
 * data (base map, view, places, route); these turn it into map options, its
 * animated props at a moment, a canvas target, a painted canvas, and the
 * tracks of a whole trip.
 */

const ROUTE_ID = 'route'

/** Every tile the editor draws, shared by the previews and the exporter. */
let tileCache: TileCache | undefined
const tileListeners = new Set<() => void>()

/** The editor's tile cache: tiles load in the background; listeners repaint as each arrives. */
export function editorTileCache(): TileCache {
  if (!tileCache) {
    const load = browserTileLoader()
    tileCache = new TileCache((url) =>
      load(url).then((image) => {
        for (const listener of tileListeners) listener()
        return image
      })
    )
  }
  return tileCache
}

/** Call `listener` whenever a map tile arrives (to repaint). Returns an unsubscribe. */
export function onMapTile(listener: () => void): () => void {
  tileListeners.add(listener)
  return () => tileListeners.delete(listener)
}

/** The map options an element describes, drawn into its box. */
export function mapOptionsOf(element: MapElement): MapOptions {
  const pencil = element.base === 'pencil'
  return {
    width: Math.max(1, element.width),
    height: Math.max(1, element.height),
    view: element.view,
    base: element.base === 'tiles' ? 'tiles' : 'outline',
    tiles: OSM_TILES,
    tileCache: element.base === 'tiles' ? editorTileCache() : undefined,
    style: pencil
      ? { sea: '#fbf6ec', land: '#fbf6ec', border: '#3a3a40', borderWidth: 1.2, sketch: { roughness: 1.2, seed: 3 } }
      : undefined,
    sketch: pencil ? { roughness: 1.6, seed: 7 } : undefined,
    places: element.places.map((place) => ({ id: place.id, lon: place.lon, lat: place.lat, label: place.name, color: element.pinColor })),
    routes:
      element.route.show && element.places.length > 1
        ? [
            {
              id: ROUTE_ID,
              through: element.places.map((place) => place.id),
              shape: element.route.shape,
              color: element.route.color,
              dashed: element.route.dashed,
              marker: element.route.marker,
            },
          ]
        : [],
    font: `700 ${Math.round(Math.max(11, Math.min(18, element.height / 22)))}px sans-serif`,
  }
}

/** Is `property` one of a map's animatable values? */
export function isMapField(property: string): boolean {
  return property.startsWith('view.') || property === 'route.draw' || property === 'route.marker' || property.endsWith('.show')
}

/** A map's props at a moment: its own view and defaults, then any animated values (by name or id). */
export function mapElementProps(element: MapElement, state?: AnimationState | null): Record<string, number> {
  const props = mapProps(mapOptionsOf(element))
  for (const key of [element.id, element.name]) {
    const values = state?.values.get(key)
    if (!values) continue
    for (const [property, value] of values) {
      if (typeof value === 'number' && property in props) props[property] = value
    }
  }
  return props
}

/** The view a map shows at a moment. */
export function mapElementView(element: MapElement, state?: AnimationState | null): MapView {
  const props = mapElementProps(element, state)
  return { lon: props['view.lon'], lat: props['view.lat'], zoom: props['view.zoom'], width: element.width, height: element.height }
}

/** A canvas target for the Canvas preview and the exporters; its props are the map's animatable values. */
export function mapElementTarget(element: MapElement): CustomTarget {
  const options = mapOptionsOf(element)
  return {
    type: 'custom',
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    opacity: element.opacity,
    rotate: element.rotation || undefined,
    props: mapProps(options),
    draw(ctx, target, time) {
      drawMap(ctx, options, target.props as Record<string, number>, time)
    },
  }
}

/** Paint a map element into a canvas the size of its box. */
export function paintMapCanvas(canvas: HTMLCanvasElement, element: MapElement, props: Record<string, number>, time: number, pixelRatio = 1): void {
  const width = Math.max(1, Math.round(element.width * pixelRatio))
  const height = Math.max(1, Math.round(element.height * pixelRatio))
  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  ctx.clearRect(0, 0, element.width, element.height)
  drawMap(ctx, mapOptionsOf(element), props, time)
}

/** The centre and zoom that fit every place in the element's box (the whole world with none). */
export function fitPlaces(element: MapElement): { lon: number; lat: number; zoom: number } {
  if (element.places.length === 0) return { lon: 20, lat: 20, zoom: Math.max(0, Math.log2(element.width / 256)) }
  // Room for the pin heads and labels above the places.
  const padding = Math.min(element.width, element.height) * 0.22
  return fitView(element.places.map((p) => [p.lon, p.lat]), element.width, element.height, padding, 10)
}

/**
 * The tracks of a whole trip starting at `start` ms and lasting `duration`:
 * the first pin drops, the route draws itself while a marker travels it, and
 * each later pin drops as the line reaches it. The view holds on all the
 * places. Values before `start` keep everything hidden.
 */
export function tripTracks(element: MapElement, start: number, duration: number): Array<{ property: string; keyframes: Keyframe[] }> {
  const options = mapOptionsOf(element)
  const fit = fitPlaces(element)
  const hasRoute = (options.routes ?? []).length > 0
  const travel = { from: start + 450, to: start + duration }
  const stops = hasRoute ? routeStops({ ...options, view: fit }, ROUTE_ID) : element.places.map((_, i) => i / Math.max(1, element.places.length - 1))
  const arrive = (i: number) => (i === 0 ? start : Math.round(travel.from + (travel.to - travel.from) * stops[i]))
  const tracks: Array<{ property: string; keyframes: Keyframe[] }> = [
    { property: 'view.lon', keyframes: [{ time: start, value: fit.lon }] },
    { property: 'view.lat', keyframes: [{ time: start, value: fit.lat }] },
    { property: 'view.zoom', keyframes: [{ time: start, value: fit.zoom }] },
  ]
  element.places.forEach((place, i) => {
    const at = arrive(i)
    tracks.push({
      property: `${place.id}.show`,
      keyframes: [
        ...(at - 300 > 0 ? [{ time: 0, value: 0 }] : []),
        { time: Math.max(0, at - 300), value: 0 },
        { time: at + 200, value: 1, easing: 'ease-out' },
      ],
    })
  })
  if (hasRoute) {
    tracks.push({
      property: 'route.draw',
      keyframes: [...(start > 0 ? [{ time: 0, value: 0 }] : []), { time: travel.from, value: 0 }, { time: travel.to, value: 1, easing: 'ease-in-out' }],
    })
    tracks.push({
      property: 'route.marker',
      keyframes: [
        ...(start > 0 ? [{ time: 0, value: -1 }] : []),
        { time: travel.from - 1, value: -1 },
        { time: travel.from, value: 0 },
        { time: travel.to, value: 1, easing: 'ease-in-out' },
      ],
    })
  }
  // Keyframes at the same time would fight: keep the last of each.
  return tracks.map((track) => ({
    ...track,
    keyframes: track.keyframes.filter((k, i, all) => !all.slice(i + 1).some((later) => later.time === k.time)),
  }))
}

/** Load the tiles a map element needs at each of these moments (for complete export frames). */
export async function preloadMapTiles(element: MapElement, states: Array<AnimationState | null>, timeoutMs = 4000): Promise<void> {
  if (element.base !== 'tiles') return
  const views = states.map((state) => mapElementView(element, state))
  await Promise.race([preloadTiles(editorTileCache(), OSM_TILES, views), new Promise<void>((resolve) => setTimeout(resolve, timeoutMs))])
}

/** Plain-language names for map tracks ("View · zoom", "Delhi · pin"). */
export function mapFieldLabel(property: string): string {
  if (property === 'view.lon') return 'View · longitude'
  if (property === 'view.lat') return 'View · latitude'
  if (property === 'view.zoom') return 'View · zoom'
  if (property === 'route.draw') return 'Route · draw'
  if (property === 'route.marker') return 'Route · marker'
  if (property.endsWith('.show')) {
    const id = property.slice(0, -'.show'.length)
    return `${id.charAt(0).toUpperCase()}${id.slice(1).replace(/-/g, ' ')} · pin`
  }
  return property
}

/** A place id from its name: lower-case, hyphenated, unique among `taken`. */
export function placeId(name: string, taken: string[]): string {
  const base = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'place'
  let id = base
  for (let n = 2; taken.includes(id) || id === ROUTE_ID; n++) id = `${base}-${n}`
  return id
}
