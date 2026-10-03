import { describe, it, expect } from 'vitest'
import { createSceneStore, type MapElement } from '../stores/scene-store'
import { fitPlaces, isMapField, mapElementProps, mapElementTarget, mapOptionsOf, placeId, tripTracks } from './map-element'
import { trackPropertyLabel } from './track-labels'
import { sceneElementToCanvasTarget } from './scene-to-canvas'
import type { AnimationState } from '../../engine/types'

const PLACES = [
  { id: 'mumbai', name: 'Mumbai', lon: 72.88, lat: 19.08 },
  { id: 'delhi', name: 'Delhi', lon: 77.21, lat: 28.61 },
  { id: 'kathmandu', name: 'Kathmandu', lon: 85.32, lat: 27.72 },
]

function aMap(overrides: Partial<MapElement> = {}): MapElement {
  const store = createSceneStore()
  store.addElement('map', { width: 480, height: 270, places: PLACES, ...overrides })
  return store.elements()[0] as MapElement
}

const stateWith = (target: string, values: Record<string, number>): AnimationState => ({
  values: new Map([[target, new Map(Object.entries(values))]]),
  currentTime: 0,
  playbackState: 'paused',
  direction: 'forward',
  loopIteration: 0,
})

describe('map elements', () => {
  it('are added with a world view, OSM tiles and a route', () => {
    const map = aMap({ places: [] })
    expect(map).toMatchObject({ type: 'map', name: 'Map 1', base: 'tiles', places: [], route: { show: true, shape: 'arc' } })
  })

  it('describe map options: places with labels, a route through them in order', () => {
    const options = mapOptionsOf(aMap({ base: 'outline' }))
    expect(options.base).toBe('outline')
    expect(options.places?.map((p) => p.label)).toEqual(['Mumbai', 'Delhi', 'Kathmandu'])
    expect(options.routes?.[0].through).toEqual(['mumbai', 'delhi', 'kathmandu'])
    expect(mapOptionsOf(aMap({ places: PLACES.slice(0, 1) })).routes).toEqual([]) // one place: no route
  })

  it('animate the view, pins and route, by name or id', () => {
    const map = aMap()
    expect(mapElementProps(map)).toMatchObject({ 'view.lon': map.view.lon, 'delhi.show': 1, 'route.draw': 1, 'route.marker': -1 })
    const animated = mapElementProps(map, stateWith(map.name, { 'view.zoom': 5, 'route.draw': 0.4, opacity: 0.5 }))
    expect(animated['view.zoom']).toBe(5)
    expect(animated['route.draw']).toBe(0.4)
    expect(animated).not.toHaveProperty('opacity')
    const target = mapElementTarget(map)
    expect([target.type, target.width, target.height]).toEqual(['custom', 480, 270])
    expect(sceneElementToCanvasTarget(map)?.type).toBe('custom')
  })

  it('build a whole trip: first pin at the start, the route drawn, later pins as it arrives', () => {
    const tracks = tripTracks(aMap(), 1000, 6000)
    const track = (property: string) => tracks.find((t) => t.property === property)!
    expect(track('view.zoom').keyframes[0].time).toBe(1000)
    expect(track('mumbai.show').keyframes.at(-1)!.time).toBe(1200)
    expect(track('route.draw').keyframes.map((k) => [k.time, k.value])).toEqual([[0, 0], [1450, 0], [7000, 1]])
    expect(track('route.marker').keyframes[0]).toEqual({ time: 0, value: -1 })
    // Delhi is reached before Kathmandu, and both after the route sets off.
    const delhi = track('delhi.show').keyframes.at(-1)!.time
    const kathmandu = track('kathmandu.show').keyframes.at(-1)!.time
    expect(delhi).toBeGreaterThan(1450)
    expect(kathmandu).toBeGreaterThan(delhi)
    // Every track's keyframes are in time order with no two at once.
    for (const t of tracks) {
      const times = t.keyframes.map((k) => k.time)
      expect([...times].sort((a, b) => a - b)).toEqual(times)
      expect(new Set(times).size).toBe(times.length)
    }
  })

  it('fit their places, and name new places uniquely', () => {
    const fit = fitPlaces(aMap())
    expect(fit.zoom).toBeGreaterThan(3)
    expect(fit.lon).toBeGreaterThan(72)
    expect(fit.lon).toBeLessThan(86)
    expect(placeId('São Paulo', [])).toBe('sao-paulo')
    expect(placeId('Delhi', ['delhi'])).toBe('delhi-2')
    expect(placeId('Route', [])).toBe('route-2') // never the route's own id
  })

  it('label their tracks in plain language', () => {
    expect(isMapField('view.zoom')).toBe(true)
    expect(isMapField('zoom')).toBe(false) // a CSS property, never a map field
    expect(trackPropertyLabel('view.zoom')).toBe('View · zoom')
    expect(trackPropertyLabel('kathmandu.show')).toBe('Kathmandu · pin')
    expect(trackPropertyLabel('route.draw')).toBe('Route · draw')
  })
})
