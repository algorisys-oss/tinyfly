import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import {
  fitView,
  flyView,
  greatCircle,
  lonLatToWorld,
  project,
  unproject,
  worldToLonLat,
  type MapView,
} from './projection'
import { findCountry, worldCountries, drawWorld } from './world'
import { drawTiles, OSM_TILES, preloadTiles, TileCache, tilesForView, tileUrl } from './tiles'
import { drawMap, mapAt, mapProps, mapTarget, routeLine, type MapOptions } from './map-target'
import { deserializeTimeline } from '../engine/serialization'

const PLACES = [
  { id: 'mumbai', lon: 72.8777, lat: 19.076, label: 'Mumbai' },
  { id: 'delhi', lon: 77.1025, lat: 28.7041, label: 'Delhi' },
  { id: 'kathmandu', lon: 85.324, lat: 27.7172, label: 'Kathmandu' },
]

const pixels = (width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  draw(ctx)
  return Array.from(canvas.getContext('2d').getImageData(0, 0, width, height).data).join()
}

describe('projection', () => {
  it('maps longitude and latitude to Web Mercator world coordinates and back', () => {
    expect(lonLatToWorld(0, 0)).toEqual({ x: 0.5, y: 0.5 })
    expect(lonLatToWorld(-180, 0).x).toBe(0)
    expect(lonLatToWorld(0, 85.05112878).y).toBeCloseTo(0, 6)
    const [lon, lat] = worldToLonLat(...(Object.values(lonLatToWorld(77.1, 28.7)) as [number, number]))
    expect(lon).toBeCloseTo(77.1, 9)
    expect(lat).toBeCloseTo(28.7, 9)
  })

  it('puts the view centre in the middle, and unprojects back', () => {
    const view: MapView = { lon: 77, lat: 28, zoom: 6, width: 800, height: 600 }
    expect(project(view, 77, 28)).toEqual({ x: 400, y: 300 })
    const p = project(view, 85.3, 27.7)
    const [lon, lat] = unproject(view, p.x, p.y)
    expect(lon).toBeCloseTo(85.3, 9)
    expect(lat).toBeCloseTo(27.7, 9)
    // One zoom step doubles distances.
    const near = project({ ...view, zoom: 7 }, 85.3, 27.7)
    expect(near.x - 400).toBeCloseTo((p.x - 400) * 2, 6)
  })

  it('fits places inside the padding', () => {
    const fit = fitView(PLACES.map((p) => [p.lon, p.lat]), 800, 600, 50)
    const view = { ...fit, width: 800, height: 600 }
    for (const place of PLACES) {
      const p = project(view, place.lon, place.lat)
      expect(p.x).toBeGreaterThanOrEqual(49.99)
      expect(p.x).toBeLessThanOrEqual(750.01)
      expect(p.y).toBeGreaterThanOrEqual(49.99)
      expect(p.y).toBeLessThanOrEqual(550.01)
    }
  })

  it('flies between views, pulling out mid-way when the ends are far apart', () => {
    const london = { lon: -0.13, lat: 51.5, zoom: 9 }
    const delhi = { lon: 77.1, lat: 28.7, zoom: 9 }
    expect(flyView(london, delhi, 0)).toMatchObject({ zoom: 9 })
    expect(flyView(london, delhi, 1).lon).toBeCloseTo(77.1)
    expect(flyView(london, delhi, 0.5).zoom).toBeLessThan(5)
    // Nearby places do not pull out.
    const near = { lon: 0.2, lat: 51.6, zoom: 9 }
    expect(flyView(london, near, 0.5).zoom).toBeCloseTo(9)
  })

  it('follows the great circle', () => {
    const route = greatCircle([-0.13, 51.5], [-74, 40.7], 16)
    expect(route[0][0]).toBeCloseTo(-0.13)
    expect(route[16][1]).toBeCloseTo(40.7)
    // London to New York bows north of both ends.
    expect(Math.max(...route.map(([, lat]) => lat))).toBeGreaterThan(51.5)
  })
})

describe('the offline world', () => {
  it('has the countries, with names and codes', () => {
    expect(worldCountries().length).toBeGreaterThan(170)
    const india = findCountry('IND')!
    expect(india.name).toBe('India')
    expect(findCountry('nepal')?.iso).toBe('NPL')
    // India's outline spans its real extent (roughly 68–97° E, 6–36° N).
    const lons = india.rings.flat().map(([lon]) => lon)
    const lats = india.rings.flat().map(([, lat]) => lat)
    expect(Math.min(...lons)).toBeGreaterThan(66)
    expect(Math.max(...lons)).toBeLessThan(98)
    expect(Math.min(...lats)).toBeGreaterThan(5)
    expect(Math.max(...lats)).toBeLessThan(37)
  })

  it('draws land over sea, the same every time', () => {
    const view: MapView = { lon: 78, lat: 22, zoom: 3, width: 200, height: 160 }
    const draw = (ctx: CanvasRenderingContext2D) => drawWorld(ctx, view, { sea: '#0000ff', land: '#00ff00' })
    expect(pixels(200, 160, draw)).toBe(pixels(200, 160, draw))
    const canvas = createCanvas(200, 160)
    const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
    draw(ctx)
    // The middle of India is land; the Arabian Sea, to its south-west, is sea.
    const centre = project(view, 78, 22)
    expect(Array.from(ctx.getImageData(Math.round(centre.x), Math.round(centre.y), 1, 1).data).slice(0, 3)).toEqual([0, 255, 0])
    const sea = project(view, 66, 14)
    expect(Array.from(ctx.getImageData(Math.round(sea.x), Math.round(sea.y), 1, 1).data).slice(0, 3)).toEqual([0, 0, 255])
  })
})

describe('tiles', () => {
  it('covers a view with the standard tile scheme', () => {
    expect(tilesForView({ lon: 0, lat: 0, zoom: 0, width: 256, height: 256 }, OSM_TILES).map((t) => t.url)).toEqual([
      'https://tile.openstreetmap.org/0/0/0.png',
    ])
    const tiles = tilesForView({ lon: 77.1, lat: 28.7, zoom: 10.5, width: 800, height: 600 }, OSM_TILES)
    expect(new Set(tiles.map((t) => t.z))).toEqual(new Set([10]))
    expect(tiles.every((t) => t.size > 256)).toBe(true) // drawn larger at a fractional zoom
    expect(tileUrl({ ...OSM_TILES, url: 'https://{s}.x/{z}/{x}/{y}.png', subdomains: ['a', 'b'] }, 3, 1, 2)).toBe('https://b.x/3/1/2.png')
  })

  it('draws loaded tiles, stands in a parent for missing ones, and preloads', async () => {
    const tile = createCanvas(256, 256)
    tile.getContext('2d').fillStyle = '#ff0000'
    tile.getContext('2d').fillRect(0, 0, 256, 256)
    const requested: string[] = []
    const cache = new TileCache(async (url) => {
      requested.push(url)
      return tile as unknown as CanvasImageSource
    })
    const view: MapView = { lon: 77.1, lat: 28.7, zoom: 4.2, width: 300, height: 200 }
    const ctx = createCanvas(300, 200).getContext('2d') as unknown as CanvasRenderingContext2D
    expect(drawTiles(ctx, view, OSM_TILES, cache)).toBe(false) // nothing loaded yet; loads started
    await preloadTiles(cache, OSM_TILES, [view])
    expect(drawTiles(ctx, view, OSM_TILES, cache)).toBe(true)
    expect(requested.length).toBe(new Set(requested).size) // each tile asked for once
    // A deeper view whose tiles are missing still draws, from the loaded parents.
    const deeper = createCanvas(300, 200)
    const deeperCtx = deeper.getContext('2d') as unknown as CanvasRenderingContext2D
    expect(drawTiles(deeperCtx, { ...view, zoom: 5.2 }, OSM_TILES, cache)).toBe(false)
    expect(Array.from(deeper.getContext('2d').getImageData(150, 100, 1, 1).data).slice(0, 3)).toEqual([255, 0, 0])
  })
})

describe('map target', () => {
  const options: MapOptions = {
    width: 400,
    height: 300,
    view: { lon: 79, lat: 24, zoom: 4.5 },
    places: PLACES,
    routes: [{ id: 'trip', through: ['mumbai', 'delhi', 'kathmandu'] }],
  }

  it('starts with the view, every place shown, every route drawn and no marker', () => {
    expect(mapProps(options)).toEqual({
      'view.lon': 79,
      'view.lat': 24,
      'view.zoom': 4.5,
      'mumbai.show': 1,
      'delhi.show': 1,
      'kathmandu.show': 1,
      'trip.draw': 1,
      'trip.marker': -1,
    })
  })

  it('runs routes through their stops, as shaped', () => {
    const view = { ...options.view, width: 400, height: 300 }
    for (const shape of ['arc', 'straight', 'great-circle'] as const) {
      const line = routeLine(options, { id: 'r', through: ['mumbai', 'kathmandu'], shape }, view)
      const start = project(view, 72.8777, 19.076)
      const end = project(view, 85.324, 27.7172)
      expect(line[0].x).toBeCloseTo(start.x, 6)
      expect(line[line.length - 1].y).toBeCloseTo(end.y, 6)
    }
    // A flight arc bows upward on the map.
    const arc = routeLine(options, { id: 'r', through: ['mumbai', 'kathmandu'] }, view)
    const straightMid = (arc[0].y + arc[arc.length - 1].y) / 2
    expect(arc[Math.floor(arc.length / 2)].y).toBeLessThan(straightMid)
  })

  it('is posed by timeline tracks, and mapAt finds places in the scene', () => {
    const target = mapTarget({ ...options, x: 100, y: 50 })
    const state = deserializeTimeline({
      id: 't',
      config: { duration: 1000 },
      tracks: [
        { id: 'z', target: 'map', property: 'view.zoom', keyframes: [{ time: 0, value: 4.5 }, { time: 1000, value: 6.5 }] },
        { id: 'd', target: 'map', property: 'trip.draw', keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 1 }] },
      ],
    }).getStateAtTime(500)
    const { view, point } = mapAt(target, { state }, 'map')
    expect(view.zoom).toBeCloseTo(5.5)
    expect(point(79, 24)).toEqual({ x: 300, y: 200 }) // the centre of the box in the scene
  })

  it('draws the same pixels for the same props, and different ones as a route draws on', () => {
    const at = (props: Record<string, number>) => pixels(400, 300, (ctx) => drawMap(ctx, options, props))
    const start = { ...mapProps(options), 'trip.draw': 0 }
    expect(at(start)).toBe(at(start))
    expect(at({ ...start, 'trip.draw': 0.5 })).not.toBe(at(start))
    expect(at({ ...start, 'trip.marker': 0.3 })).not.toBe(at(start))
    expect(at({ ...start, 'delhi.show': 0 })).not.toBe(at(start))
  })
})

describe('authoring helpers', () => {
  const options: MapOptions = {
    width: 400,
    height: 300,
    view: { lon: 79, lat: 24, zoom: 4.5 },
    places: PLACES,
    routes: [{ id: 'trip', through: ['mumbai', 'delhi', 'kathmandu'], shape: 'straight' }],
  }

  it('finds where each stop is along a route', async () => {
    const { routeStops } = await import('./map-target')
    const stops = routeStops(options, 'trip')
    expect(stops[0]).toBe(0)
    expect(stops[2]).toBe(1)
    // Mumbai–Delhi is the longer leg.
    expect(stops[1]).toBeGreaterThan(0.5)
    expect(stops[1]).toBeLessThan(0.75)
  })

  it('flies the view with plain keyframes that start and end on the places', async () => {
    const { mapFlyTracks } = await import('./map-target')
    const tracks = mapFlyTracks('map', { lon: 0, lat: 20, zoom: 1 }, { lon: 79, lat: 24, zoom: 5 }, 1000, 3000, { samples: 8 })
    expect(tracks.map((t) => t.property)).toEqual(['view.lon', 'view.lat', 'view.zoom'])
    const zoom = tracks[2].keyframes
    expect(zoom[0]).toEqual({ time: 1000, value: 1 })
    expect(zoom[zoom.length - 1].time).toBe(3000)
    expect(zoom[zoom.length - 1].value).toBeCloseTo(5)
  })
})
