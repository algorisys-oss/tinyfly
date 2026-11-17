import { clamp01, easeInOut } from './cosmic-utils'

/**
 * Zooming through scale: the signature science-explainer move (a hand →
 * skin → cells → molecules → one atom). The levels are drawings, each
 * `factor` times smaller than the one before; one number, the depth, drives
 * them all. Level k is drawn at scale `factor ** (depth - k)` inside a
 * circular portal centred on the screen, so the next level opens as a window
 * in the middle of the current one and grows until it fills the frame. A
 * level whose portal covers the frame stops drawing the levels behind it.
 *
 * Every function is pure: give it the time, it gives the same picture.
 */

/** A key on a zoom or depth curve: a time (ms) and a value. */
export interface ZoomKey {
  time: number
  value: number
}

/**
 * A zoom factor at `time`, interpolated in log space with an ease between
 * keys (values must be > 0). Log space is what makes a dive feel steady: from
 * 1x to 1000x, each tenfold step takes the same time.
 */
export function zoomAt(time: number, keys: ReadonlyArray<ZoomKey>): number {
  checkKeys(keys, 'zoomAt')
  if (keys.some((k) => !(k.value > 0))) throw new Error('zoomAt: zoom values must be > 0')
  if (time <= keys[0].time) return keys[0].value
  if (time >= keys[keys.length - 1].time) return keys[keys.length - 1].value
  const logKeys = keys.map((k) => ({ time: k.time, value: Math.log(k.value) }))
  return Math.exp(depthAt(time, logKeys))
}

/** A depth (any number, e.g. 0 = the first level, 4 = the fifth) at `time`, eased between keys. */
export function depthAt(time: number, keys: ReadonlyArray<ZoomKey>): number {
  checkKeys(keys, 'depthAt')
  if (time <= keys[0].time) return keys[0].value
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1]
    const b = keys[i]
    if (time <= b.time) {
      const k = b.time > a.time ? easeInOut((time - a.time) / (b.time - a.time)) : 1
      return a.value + (b.value - a.value) * k
    }
  }
  return keys[keys.length - 1].value
}

function checkKeys(keys: ReadonlyArray<ZoomKey>, name: string): void {
  if (keys.length === 0) throw new Error(`${name}: give at least one key`)
  for (let i = 1; i < keys.length; i++) {
    if (keys[i].time < keys[i - 1].time) throw new Error(`${name}: keys must be in time order (key ${i} is earlier than key ${i - 1})`)
  }
}

/** Draws one level at scale 1, centred on the zoom centre, in its own coordinates. */
export type ZoomLevel = (ctx: CanvasRenderingContext2D, time: number) => void

export interface ZoomLevelsOptions {
  /** The frame, px */
  width: number
  height: number
  /** The current depth: 0 shows level 0 at scale 1; 1.35 shows level 1 filling the frame */
  depth: number
  /** One drawing per level, outermost first */
  levels: ReadonlyArray<ZoomLevel>
  /** How many times smaller each level is than the one before (default 14) */
  factor?: number
  /** The zoom centre, px (default the middle of the frame) */
  center?: { x: number; y: number }
  /** A level's portal radius at scale 1, px (default 520) */
  portalRadius?: number
  /** Portal rim colour, or null for none (default white) */
  rim?: string | null
  /** Rim width, px (default 5) */
  rimWidth?: number
}

/** Which levels are drawn at a depth and at what scale and portal radius (for tests and custom drawing). */
export function zoomLevelLayout(options: Omit<ZoomLevelsOptions, 'levels'> & { levelCount: number }): Array<{ level: number; scale: number; portal: number }> {
  const factor = options.factor ?? 14
  if (!(factor > 1)) throw new Error('drawZoomLevels: factor must be > 1')
  const portalRadius = options.portalRadius ?? 520
  const cover = Math.hypot(options.width, options.height) / 2
  const out: Array<{ level: number; scale: number; portal: number }> = []
  for (let k = 0; k < options.levelCount; k++) {
    const scale = factor ** (options.depth - k)
    const portal = k === 0 ? Infinity : portalRadius * scale
    if (k > 0 && portal < 4) break
    out.push({ level: k, scale, portal })
  }
  // levels hidden behind a portal that already covers the frame are dropped
  const firstCovering = out.findIndex((l) => l.level > 0 && l.portal > cover)
  const lastCovering = out.reduce((acc, l, i) => (l.level > 0 && l.portal > cover ? i : acc), firstCovering)
  return lastCovering >= 0 ? out.slice(lastCovering) : out
}

/**
 * Draw the levels for a depth: the outermost visible one full-frame, the
 * deeper ones in growing portals at the centre. Each level draws itself at
 * scale 1 around `center`; the zoom is applied for it.
 */
export function drawZoomLevels(ctx: CanvasRenderingContext2D, time: number, options: ZoomLevelsOptions): void {
  const center = options.center ?? { x: options.width / 2, y: options.height / 2 }
  const layout = zoomLevelLayout({ ...options, levelCount: options.levels.length })
  for (const { level, scale, portal } of layout) {
    ctx.save()
    if (Number.isFinite(portal) && portal < Math.hypot(options.width, options.height)) {
      ctx.beginPath()
      ctx.arc(center.x, center.y, portal, 0, Math.PI * 2)
      ctx.clip()
    }
    ctx.translate(center.x, center.y)
    ctx.scale(scale, scale)
    ctx.translate(-center.x, -center.y)
    options.levels[level](ctx, time)
    ctx.restore()
    if (Number.isFinite(portal) && options.rim !== null) drawPortalRim(ctx, center.x, center.y, portal, options.rim ?? '#ffffff', options.rimWidth ?? 5)
  }
}

/** A glowing ring (a portal's rim, a lens edge): a wide faint stroke under a crisp one. */
export function drawPortalRim(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color = '#ffffff', width = 5): void {
  if (!(radius > 2)) return
  ctx.save()
  for (const [k, alpha] of [[3.2, 0.12], [2, 0.22], [1, 0.95]] as const) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.lineWidth = width * k
    ctx.globalAlpha = alpha
    ctx.strokeStyle = color
    ctx.stroke()
  }
  ctx.restore()
}

/** How much of a level's chip/label to show at a depth: 1 while it fills the frame, fading out as the next arrives. */
export function levelPresence(depth: number, level: number, settle = 0.35): number {
  return clamp01(1 - Math.abs(depth - (level + settle)) * 1.5)
}
