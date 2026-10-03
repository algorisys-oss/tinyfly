import { OSM_TILES, TileCache, browserTileLoader, drawMap, fitView, flyView, mapProps, routeStops } from '../../maps'

// On a standalone page these come from the `tinyfly` global, added by the maps
// add-on (tinyfly-maps.iife.js, loaded after the browser bundle); here they come
// from the source modules, so the code below runs unchanged in both.
const tinyfly = { OSM_TILES, TileCache, browserTileLoader, drawMap, fitView, flyView, mapProps, routeStops }

export const html = `<style>
  .mr-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .mr-canvas { width: 272px; height: 153px; border-radius: 8px; background: #e5e3df; }
  .mr-row { display: flex; align-items: center; gap: 8px; font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .mr-row select { font: 12px system-ui, sans-serif; padding: 2px 4px; border-radius: 6px;
    border: 1px solid #475569; background: #1e293b; color: #e2e8f0; }
  .mr-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; }
</style>
<div class="mr-wrap">
  <canvas class="mr-canvas" width="800" height="450"></canvas>
  <div class="mr-row">
    <label>map <select class="mr-base" aria-label="Base map">
      <option value="tiles" selected>street map (OpenStreetMap)</option>
      <option value="outline">world outline (offline)</option>
      <option value="pencil">pencil outline</option>
    </select></label>
  </div>
  <div class="mr-readout">the world</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.mr-canvas')
  const baseSelect = root.querySelector('.mr-base')
  const readout = root.querySelector('.mr-readout')
  const ctx = canvas.getContext('2d')
  const W = 800
  const H = 450

  const places = [
    { id: 'mumbai', lon: 72.8777, lat: 19.076, label: 'Mumbai' },
    { id: 'delhi', lon: 77.1025, lat: 28.7041, label: 'Delhi' },
    { id: 'kathmandu', lon: 85.324, lat: 27.7172, label: 'Kathmandu' },
  ]
  const world = { lon: 40, lat: 22, zoom: 1.6 }
  const india = tinyfly.fitView(places.map((p) => [p.lon, p.lat]), W, H, 70)
  // Tiles load as the camera needs them; until one arrives, its parent stands in.
  const tiles = new tinyfly.TileCache(tinyfly.browserTileLoader())
  const route = { id: 'trip', through: ['mumbai', 'delhi', 'kathmandu'], width: 4 }

  const map = (base) => ({
    width: W,
    height: H,
    view: world,
    base: base === 'tiles' ? 'tiles' : 'outline',
    tiles: tinyfly.OSM_TILES,
    tileCache: tiles,
    style:
      base === 'pencil'
        ? { sea: '#fbf6ec', land: '#fbf6ec', border: '#3a3a40', borderWidth: 1.5, sketch: { roughness: 1.5, seed: 4 }, highlight: { IND: '#f6ecd6' } }
        : { highlight: { IND: '#f7d9a8', NPL: '#f3c9a0' } },
    sketch: base === 'pencil' ? { roughness: 2, seed: 9 } : undefined,
    places,
    routes: [route],
    font: '700 16px sans-serif',
  })

  // One clock drives the whole trip, and loops.
  const LOOP = 11000
  const FLY = [700, 3300]
  const DRAW = [3800, 8600]
  const stops = tinyfly.routeStops(map('outline'), 'trip')
  const clock = { time: 0 }
  live.to(clock, { time: LOOP, duration: LOOP / 1000, ease: 'none', repeat: -1 })

  const ramp = (t, from, to) => Math.min(1, Math.max(0, (t - from) / (to - from)))
  const smooth = (u) => u * u * (3 - 2 * u)

  /** Every animated value of the map at time `t`. */
  const propsAt = (options, t) => {
    const view = tinyfly.flyView(world, india, smooth(ramp(t, ...FLY)), W)
    const along = ramp(t, ...DRAW)
    const reach = (i) => DRAW[0] + (DRAW[1] - DRAW[0]) * stops[i]
    return {
      ...tinyfly.mapProps(options),
      'view.lon': view.lon,
      'view.lat': view.lat,
      'view.zoom': view.zoom,
      'mumbai.show': ramp(t, DRAW[0] - 500, DRAW[0]),
      'delhi.show': ramp(t, reach(1) - 250, reach(1) + 250),
      'kathmandu.show': ramp(t, reach(2) - 250, reach(2) + 250),
      'trip.draw': along,
      'trip.marker': t >= DRAW[0] ? along : -1,
    }
  }

  const draw = () => {
    const t = clock.time
    readout.textContent =
      t < FLY[0] ? 'the world' : t < FLY[1] ? 'flying in to India' : t < DRAW[0] ? 'India' : t < DRAW[1] ? 'Mumbai → Delhi → Kathmandu' : 'arrived'
    if (!ctx) return
    const options = map(baseSelect.value)
    tinyfly.drawMap(ctx, options, propsAt(options, t), t)
  }
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const mapRoute = {
  id: 'live-map-route',
  name: 'Map Route (OpenStreetMap)',
  description:
    'An animated trip: the camera flies from the whole world in to India, pins drop on Mumbai, Delhi and Kathmandu as a flight path draws itself between them, and a plane travels it. The street map is OpenStreetMap tiles (switch the tile server for heavy use); the world outline is offline Natural Earth data that also renders in headless video, and can be drawn in pencil. The view, pins and route are plain numbers, so they are timeline tracks.',
  category: 'video',
  addons: ['maps'],
  tags: ['canvas', 'map', 'openstreetmap', 'route', 'travel', 'camera', 'explainer', 'video'],
  html,
  run,
}
