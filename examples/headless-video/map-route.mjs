/**
 * An animated trip on a map, rendered without a browser or a network:
 *
 *   npx tinyfly video examples/headless-video/map-route.mjs
 *
 * The camera starts on the whole world and flies in to India; pins drop on
 * Mumbai, Delhi and Kathmandu as a flight path draws itself between them and
 * a plane travels along it.
 *
 * - The base map is the offline world outline (Natural Earth, public domain),
 *   so the video renders the same every time with no tiles to download. For
 *   OpenStreetMap tiles in a browser, see the Map Route gallery card.
 * - The view (`view.lon`, `view.lat`, `view.zoom`), each pin's `.show` and the route's
 *   `.draw` and `.marker` are props of the map target: plain keyframe tracks.
 * - `mapFlyTracks()` samples the camera flight into keyframes; `routeStops()`
 *   says how far along the route each city is, so its pin drops as the line
 *   arrives.
 */
import { fitView, mapAt, mapFlyTracks, mapTarget, routeStops } from '@algorisys/tinyfly/maps'

const W = 1280
const H = 720

const places = [
  { id: 'mumbai', lon: 72.8777, lat: 19.076, label: 'Mumbai' },
  { id: 'delhi', lon: 77.1025, lat: 28.7041, label: 'Delhi' },
  { id: 'kathmandu', lon: 85.324, lat: 27.7172, label: 'Kathmandu' },
]

const world = { lon: 30, lat: 25, zoom: 2.2 }
const india = fitView(places.map((p) => [p.lon, p.lat]), W, H, 110)

const map = {
  x: 0,
  y: 0,
  width: W,
  height: H,
  view: world,
  style: { sea: '#cfe6f2', land: ['#f3ecd9', '#efe4c8', '#f6efdf', '#ece0c2', '#f1e8d0', '#e9dcbc', '#f4ead3'], highlight: { IND: '#f7d9a8', NPL: '#f3c9a0' } },
  places,
  routes: [{ id: 'trip', through: ['mumbai', 'delhi', 'kathmandu'], width: 4, dashed: false }],
  font: '700 22px sans-serif',
}

const target = mapTarget(map)

const FLY = [800, 3200]
const DRAW = [3600, 8200]
const stops = routeStops(map, 'trip')
/** When the line reaches stop `i`. */
const reach = (i) => Math.round(DRAW[0] + (DRAW[1] - DRAW[0]) * stops[i])

const key = (property, frames) => ({
  id: `map-${property}`,
  target: 'map',
  property,
  keyframes: frames.map(([time, value, easing]) => ({ time, value, ...(easing ? { easing } : {}) })),
})

export default {
  width: W,
  height: H,
  fps: 30,
  duration: 10000,
  targets: { map: target },
  timeline: {
    id: 'map-route',
    config: {
      duration: 10000,
      markers: [
        { id: 'world', time: 0, label: 'The world' },
        { id: 'india', time: FLY[1], label: 'India' },
        { id: 'trip', time: DRAW[0], label: 'The trip' },
        { id: 'arrive', time: DRAW[1], label: 'Kathmandu' },
      ],
    },
    tracks: [
      ...mapFlyTracks('map', world, india, FLY[0], FLY[1], { width: W }),
      // Pins drop in turn: Mumbai before the line sets off, the others as it arrives.
      key('mumbai.show', [[0, 0], [DRAW[0] - 500, 0], [DRAW[0], 1, 'ease-out']]),
      key('delhi.show', [[0, 0], [reach(1) - 250, 0], [reach(1) + 250, 1, 'ease-out']]),
      key('kathmandu.show', [[0, 0], [reach(2) - 250, 0], [reach(2) + 250, 1, 'ease-out']]),
      key('trip.draw', [[0, 0], [DRAW[0], 0], [DRAW[1], 1]]),
      key('trip.marker', [[0, -1], [DRAW[0] - 1, -1], [DRAW[0], 0], [DRAW[1], 1]]),
    ],
  },
  draw(ctx, frame) {
    // A title card, and a caption that stays beside Kathmandu once the plane lands.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.fillRect(40, 36, 430, 64)
    ctx.fillStyle = '#1f2937'
    ctx.font = '800 30px sans-serif'
    ctx.fillText('Mumbai → Delhi → Kathmandu', 58, 80)
    if (frame.time > DRAW[1]) {
      const { point } = mapAt(target, frame, 'map')
      const at = point(85.324, 27.7172)
      ctx.globalAlpha = Math.min(1, (frame.time - DRAW[1]) / 500)
      ctx.font = 'italic 600 20px sans-serif'
      ctx.fillStyle = '#7c2d12'
      ctx.fillText('1,600 km, three cities', at.x - 60, at.y + 40)
    }
  },
}
