import { lonLatToWorld, TILE_SIZE, worldSize, type MapView } from './projection'

/**
 * Raster map tiles (OpenStreetMap, or any server using the standard
 * {z}/{x}/{y} scheme) for a view.
 *
 * Loading images is the one part of the maps module that is not pure: tiles
 * arrive over the network, later or not at all. Drawing never waits: a tile
 * not loaded yet is drawn from a loaded parent tile (blurrier, but in place),
 * or left as the background. To render frames that must be complete (video,
 * stills), call `preloadTiles` for every view first.
 */

export interface TileSource {
  /** URL template with {z}, {x}, {y} and optionally {s} (a subdomain) */
  url: string
  /** Credit line drawn on the map; required by most tile servers' terms */
  attribution: string
  /** Deepest zoom the server has (default 19) */
  maxZoom?: number
  /** Values for {s} (default none) */
  subdomains?: string[]
}

/**
 * OpenStreetMap's standard tiles. Their use policy allows light use with
 * attribution and forbids heavy use: for anything busy, point `url` at your
 * own tile server or a commercial provider.
 */
export const OSM_TILES: TileSource = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19,
}

/** Loads one tile image; return a promise of anything `drawImage` accepts. */
export type TileLoader = (url: string) => Promise<CanvasImageSource>

/** A tile loader for browsers: an <img> with CORS on, so canvases stay exportable. */
export function browserTileLoader(): TileLoader {
  return (url) =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error(`tile failed: ${url}`))
      image.src = url
    })
}

/** Loaded tiles by URL, loading on first ask; the oldest are forgotten past `limit`. */
export class TileCache {
  private readonly tiles = new Map<string, CanvasImageSource | 'loading' | 'failed'>()
  /** Loads in flight, so a tile asked for twice is fetched once */
  private readonly pending = new Map<string, Promise<void>>()
  private readonly load: TileLoader
  private readonly limit: number

  constructor(load: TileLoader, limit = 400) {
    this.load = load
    this.limit = limit
  }

  /** The tile if it has loaded; otherwise starts loading it and returns undefined. */
  get(url: string): CanvasImageSource | undefined {
    const tile = this.tiles.get(url)
    if (tile === undefined) {
      this.fetch(url)
      return undefined
    }
    return tile === 'loading' || tile === 'failed' ? undefined : tile
  }

  /** The tile if it has loaded, without starting a load. */
  peek(url: string): CanvasImageSource | undefined {
    const tile = this.tiles.get(url)
    return tile === undefined || tile === 'loading' || tile === 'failed' ? undefined : tile
  }

  /** Load every URL; resolves when all have arrived or failed. */
  async ready(urls: string[]): Promise<void> {
    await Promise.all(urls.map((url) => this.fetch(url)))
  }

  private fetch(url: string): Promise<void> {
    const inFlight = this.pending.get(url)
    if (inFlight) return inFlight
    if (this.tiles.has(url)) return Promise.resolve()
    this.tiles.set(url, 'loading')
    if (this.tiles.size > this.limit) {
      const oldest = this.tiles.keys().next().value
      if (oldest !== undefined && oldest !== url) this.tiles.delete(oldest)
    }
    const loading = this.load(url).then(
      (image) => void this.tiles.set(url, image),
      () => void this.tiles.set(url, 'failed')
    )
    const done = loading.finally(() => this.pending.delete(url))
    this.pending.set(url, done)
    return done
  }
}

export interface TilePlacement {
  url: string
  z: number
  x: number
  y: number
  /** Where the tile goes in the view, px */
  left: number
  top: number
  size: number
}

export function tileUrl(source: TileSource, z: number, x: number, y: number): string {
  const subdomains = source.subdomains ?? []
  const s = subdomains.length ? subdomains[(x + y) % subdomains.length] : ''
  return source.url.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y)).replace('{s}', s)
}

/** The tiles that cover a view, and where each one goes. */
export function tilesForView(view: MapView, source: TileSource): TilePlacement[] {
  const z = Math.max(0, Math.min(source.maxZoom ?? 19, Math.floor(view.zoom)))
  const count = Math.pow(2, z)
  // Tiles at z, drawn bigger by the zoom's fraction.
  const size = TILE_SIZE * Math.pow(2, view.zoom - z)
  const centre = lonLatToWorld(view.lon, view.lat)
  const originX = centre.x * worldSize(view.zoom) - view.width / 2
  const originY = centre.y * worldSize(view.zoom) - view.height / 2
  const placements: TilePlacement[] = []
  // Tiles that overlap the view (one ending exactly on its edge does not).
  for (let ty = Math.floor(originY / size); ty < Math.ceil((originY + view.height) / size); ty++) {
    if (ty < 0 || ty >= count) continue
    for (let tx = Math.floor(originX / size); tx < Math.ceil((originX + view.width) / size); tx++) {
      const x = ((tx % count) + count) % count // the world repeats sideways
      placements.push({ url: tileUrl(source, z, x, ty), z, x, y: ty, left: tx * size - originX, top: ty * size - originY, size })
    }
  }
  return placements
}

/** Load every tile the views need (for rendering frames that must be complete). */
export function preloadTiles(cache: TileCache, source: TileSource, views: MapView[]): Promise<void> {
  const urls = new Set(views.flatMap((view) => tilesForView(view, source).map((tile) => tile.url)))
  return cache.ready([...urls])
}

/**
 * Draw the tiles for a view into the box (0, 0)–(width, height). Returns
 * whether every tile was loaded (false while some are still arriving).
 */
export function drawTiles(ctx: CanvasRenderingContext2D, view: MapView, source: TileSource, cache: TileCache): boolean {
  let complete = true
  for (const tile of tilesForView(view, source)) {
    // Whole pixels, a hair larger, so neighbouring tiles leave no seams.
    const left = Math.floor(tile.left)
    const top = Math.floor(tile.top)
    const size = Math.ceil(tile.size + (tile.left - left)) + 1
    const image = cache.get(tile.url)
    if (image) {
      ctx.drawImage(image, left, top, size, size)
      continue
    }
    complete = false
    // Until it arrives, the matching corner of a loaded parent tile stands in.
    for (let up = 1; up <= 4 && tile.z - up >= 0; up++) {
      const parent = cache.peek(tileUrl(source, tile.z - up, tile.x >> up, tile.y >> up))
      if (!parent) continue
      const part = TILE_SIZE / Math.pow(2, up)
      const sx = (tile.x - ((tile.x >> up) << up)) * part
      const sy = (tile.y - ((tile.y >> up) << up)) * part
      ctx.drawImage(parent, sx, sy, part, part, left, top, size, size)
      break
    }
  }
  return complete
}
