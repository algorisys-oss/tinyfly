import type { CustomTarget } from '../adapters/canvas/canvas-adapter'
import type { PropertyInfo } from '../adapters/canvas/target-properties'
import { createRandom } from '../engine/authoring/random'
import { unknownName } from '../engine/authoring/did-you-mean'
import type { Track } from '../engine/types'
import { editLog, type EditOptions } from './surface/edit-log'
import { propPreset, type PropPresetName } from './props/presets'
import { propTarget, type PropTarget } from './props/target'

/**
 * Scenery behind the figures: a sky with the sun and moon on their arcs, stars
 * at night, clouds drifting on the wind, rain that slants with it and snow
 * that drifts, hills or a city on the horizon and the ground; or a room with
 * a wall, a floor and a window on that sky. It is a canvas target whose
 * values (`hour`, `clouds`, `wind`, `rain`, `snow`) are tracks, so a day
 * passes and weather comes and goes as keyframes, and every frame is drawn
 * from its time alone. `scenePreset` lays out a park, a street, an office or
 * a home with it.
 *
 * ```ts
 * const sky = scenery({ x: 0, y: 0, width: 720, height: 400, hour: 9, clouds: 0.4, horizon: 'hills' })
 * sky.set('hour', { at: 0, value: 20, duration: 12000 })   // a day passes
 * sky.set('rain', { at: 5000, value: 0.8, duration: 1500 })
 * const tracks = sky.tracks('sky')
 * ```
 */

export type SceneryHorizon = 'hills' | 'city' | 'flat'

export interface SceneryOptions {
  /** The backdrop's box, scene px */
  x: number
  y: number
  width: number
  height: number
  /** Outdoors under a sky (default), or a room */
  kind?: 'sky' | 'room'
  /** Scene y of the ground line (default 85% of the way down the box) */
  ground?: number
  /** Time of day, 0..24 (default 12): the sky's colours and where the sun and moon are */
  hour?: number
  /** Cloud cover, 0..1 (default 0.3) */
  clouds?: number
  /** Wind, −1..1 (default 0): clouds drift, rain slants, snow drifts; hair streams (see `hairFollow`) */
  wind?: number
  /** Rain and snow, 0..1 (default 0) */
  rain?: number
  snow?: number
  /** What is on the horizon (default hills outdoors) */
  horizon?: SceneryHorizon
  /** A room: a window on the sky (default true) */
  window?: boolean
  /** The particles' and the clouds' seed (default 1) */
  seed?: number
  colors?: Partial<SceneryColors>
}

export interface SceneryColors {
  ground: string
  hills: string
  city: string
  cloud: string
  sun: string
  moon: string
  rain: string
  snow: string
  wall: string
  floor: string
  skirting: string
  frame: string
}

export const SCENERY_COLORS: SceneryColors = {
  ground: '#7fb56a',
  hills: '#5f9a58',
  city: '#4b5468',
  cloud: '#ffffff',
  sun: '#ffd45c',
  moon: '#f3f0e0',
  rain: '#9fc4e8',
  snow: '#ffffff',
  wall: '#e9e1cf',
  floor: '#b08a5e',
  skirting: '#8a6a44',
  frame: '#f7f3ea',
}

export interface Scenery {
  readonly kind: 'scenery'
  readonly target: CustomTarget
  /** Scene y of the ground line */
  readonly ground: number
  /** Where a named place is at a time: `sun`, `moon`, `horizon`, `ground` (scene px; the sun and moon when up, else where they are below the horizon) */
  anchor(name: 'sun' | 'moon' | 'horizon' | 'ground', time?: number): { x: number; y: number }
  /** Change a value at a time: `hour`, `clouds`, `wind`, `rain`, `snow` */
  set(prop: 'hour' | 'clouds' | 'wind' | 'rain' | 'snow', edit: EditOptions & { value: number }): Scenery
  /** The recorded changes as tracks on `target` (the scenery's key in the scene) */
  tracks(target: string): Track[]
}

/** The sky's colours (top, bottom) through the day, keyed by hour. */
const SKY: Array<[number, string, string]> = [
  [0, '#0b1530', '#1b2a4a'],
  [4.5, '#141a3e', '#2a2f5a'],
  [6, '#4a3f7a', '#f0a070'],
  [7.5, '#86c2ee', '#d8ecf8'],
  [12, '#5aaef2', '#c0e2f8'],
  [16.5, '#69b0e6', '#f5d79a'],
  [18.5, '#4c3f78', '#f08a5a'],
  [20.5, '#17203f', '#2d3660'],
  [24, '#0b1530', '#1b2a4a'],
]

const mix = (a: string, b: string, t: number): string => {
  const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const [from, to] = [parse(a), parse(b)]
  return `#${from.map((c, i) => Math.round(c + (to[i] - c) * t).toString(16).padStart(2, '0')).join('')}`
}

/** How bright the day is at an hour, 0 (night) to 1 (noon), for darkening the ground. */
const daylight = (hour: number) => {
  const h = ((hour % 24) + 24) % 24
  if (h < 5 || h > 20) return 0
  if (h < 7) return (h - 5) / 2
  if (h > 18) return (20 - h) / 2
  return 1
}

/** The sky's colours at an hour. */
export function skyColors(hour: number): { top: string; bottom: string } {
  const h = ((hour % 24) + 24) % 24
  for (let i = 1; i < SKY.length; i++) {
    const [h0, top0, bottom0] = SKY[i - 1]
    const [h1, top1, bottom1] = SKY[i]
    if (h <= h1) {
      const t = (h - h0) / (h1 - h0)
      return { top: mix(top0, top1, t), bottom: mix(bottom0, bottom1, t) }
    }
  }
  return { top: SKY[0][1], bottom: SKY[0][2] }
}

/** Where a body that rises at `rise` and sets `rise + 12` hours later is: 0 at rising, 1 at setting; outside, below the horizon. */
const arcOf = (hour: number, rise: number) => {
  const h = (((hour - rise) % 24) + 24) % 24
  return h <= 12 ? h / 12 : -1
}

/** How many of each the box holds at full cover, per 100,000 px². */
const CLOUDS_PER_AREA = 9
const DROPS_PER_AREA = 55
const FLAKES_PER_AREA = 28

export function scenery(options: SceneryOptions): Scenery {
  const { x, y, width, height } = options
  const kind = options.kind ?? 'sky'
  const ground = options.ground ?? y + height * 0.85
  const colors: SceneryColors = { ...SCENERY_COLORS, ...options.colors }
  const horizon = options.horizon ?? 'hills'
  const window = options.window !== false
  const random = createRandom(options.seed ?? 1)
  const area = (width * height) / 100000
  // Seeded once: the clouds' shapes and places, the drops' and flakes' columns.
  const cloudSeeds = Array.from({ length: Math.ceil(CLOUDS_PER_AREA * area) + 2 }, () => ({ u: random.next(), v: random.next(), size: 0.6 + random.next() * 0.8, puffs: 2 + Math.floor(random.next() * 3) }))
  const dropSeeds = Array.from({ length: Math.ceil(DROPS_PER_AREA * area) + 4 }, () => ({ u: random.next(), v: random.next(), speed: 0.8 + random.next() * 0.5 }))
  const flakeSeeds = Array.from({ length: Math.ceil(FLAKES_PER_AREA * area) + 4 }, () => ({ u: random.next(), v: random.next(), speed: 0.7 + random.next() * 0.6, sway: random.next() * Math.PI * 2, size: 1.5 + random.next() * 2 }))
  const starSeeds = Array.from({ length: Math.ceil(30 * area) + 10 }, () => ({ u: random.next(), v: random.next() * 0.6, size: 0.6 + random.next() * 1.2 }))
  const hillSeeds = Array.from({ length: 6 }, () => ({ phase: random.next() * Math.PI * 2, amp: 0.5 + random.next() }))
  const citySeeds = Array.from({ length: 24 }, () => ({ h: 0.35 + random.next() * 0.65, w: 0.6 + random.next() * 0.8, windows: random.next() > 0.3 }))

  const props: Record<string, number> = {
    hour: options.hour ?? 12,
    clouds: options.clouds ?? 0.3,
    wind: options.wind ?? 0,
    rain: options.rain ?? 0,
    snow: options.snow ?? 0,
  }
  const log = editLog()
  const at = (prop: string, time: number) => (log.keys(prop)?.length ? log.valueAt(prop, time) : props[prop])

  /** The sun's or moon's place in the box (local px) at an hour; below the horizon when not up. */
  const bodyAt = (hour: number, rise: number) => {
    const t = arcOf(hour, rise)
    const u = t < 0 ? 0.5 : t
    const skyBottom = ground - y
    return { x: 0.1 * width + 0.8 * width * u, y: t < 0 ? skyBottom + height * 0.2 : skyBottom - Math.sin(u * Math.PI) * skyBottom * 0.8, up: t >= 0 }
  }

  const drawSky = (ctx: CanvasRenderingContext2D, read: (prop: string) => number, time: number, box: { x: number; y: number; w: number; h: number; ground: number }, withGround: boolean) => {
    const hour = read('hour')
    const { top, bottom } = skyColors(hour)
    const gradient = ctx.createLinearGradient(0, box.y, 0, box.ground)
    gradient.addColorStop(0, top)
    gradient.addColorStop(1, bottom)
    ctx.fillStyle = gradient
    ctx.fillRect(box.x, box.y, box.w, box.ground - box.y)
    const light = daylight(hour)
    // Stars come out as the light goes.
    if (light < 0.6) {
      ctx.fillStyle = '#ffffff'
      ctx.globalAlpha = (0.6 - light) / 0.6 * 0.9
      for (const star of starSeeds) {
        ctx.beginPath()
        ctx.arc(box.x + star.u * box.w, box.y + star.v * (box.ground - box.y), star.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }
    // The sun by day, the moon by night, each on its arc.
    const sun = bodyAt(hour, 6)
    const moon = bodyAt(hour, 18)
    const r = Math.min(box.w, box.h) * 0.06
    if (sun.up) {
      ctx.fillStyle = colors.sun
      ctx.beginPath()
      ctx.arc(box.x + (sun.x / width) * box.w, box.y + (sun.y / height) * box.h, r, 0, Math.PI * 2)
      ctx.fill()
    }
    if (moon.up) {
      const mx = box.x + (moon.x / width) * box.w
      const my = box.y + (moon.y / height) * box.h
      ctx.fillStyle = colors.moon
      ctx.beginPath()
      ctx.arc(mx, my, r * 0.8, 0, Math.PI * 2)
      ctx.fill()
      // A bite out of it: the night sky over one side.
      ctx.fillStyle = top
      ctx.beginPath()
      ctx.arc(mx - r * 0.35, my - r * 0.15, r * 0.7, 0, Math.PI * 2)
      ctx.fill()
    }
    // Clouds: as many as the cover says, drifting with the wind and wrapping round.
    const cover = Math.max(0, Math.min(1, read('clouds')))
    const wind = Math.max(-1, Math.min(1, read('wind')))
    const shown = Math.round(cover * cloudSeeds.length)
    ctx.fillStyle = mix('#ffffff', colors.cloud === '#ffffff' ? '#ffffff' : colors.cloud, 1)
    ctx.globalAlpha = 0.55 + 0.4 * light
    for (let i = 0; i < shown; i++) {
      const cloud = cloudSeeds[i]
      const drift = ((cloud.u * box.w + wind * time * 0.012 * (0.6 + cloud.size * 0.5)) % (box.w * 1.4) + box.w * 1.4) % (box.w * 1.4) - box.w * 0.2
      const cx = box.x + drift
      const cy = box.y + (0.08 + cloud.v * 0.42) * (box.ground - box.y)
      const size = Math.min(box.w, box.h) * 0.07 * cloud.size
      for (let p = 0; p < cloud.puffs; p++) {
        ctx.beginPath()
        ctx.ellipse(cx + (p - (cloud.puffs - 1) / 2) * size * 0.9, cy + (p % 2) * size * 0.25, size * (p % 2 ? 0.8 : 1), size * 0.62, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
    if (!withGround) return
    // The horizon and the ground, darker as night falls.
    const shade = (color: string) => mix(mix(color, '#0b1530', 0.65), color, light)
    if (horizon === 'hills') {
      ctx.fillStyle = shade(colors.hills)
      ctx.beginPath()
      ctx.moveTo(box.x, box.ground)
      const steps = 40
      for (let i = 0; i <= steps; i++) {
        const u = i / steps
        let lift = 0
        hillSeeds.forEach((hill, k) => (lift += Math.sin(u * Math.PI * (1.5 + k * 0.7) + hill.phase) * hill.amp))
        ctx.lineTo(box.x + u * box.w, box.ground - Math.max(0, lift) * box.h * 0.045 - box.h * 0.03)
      }
      ctx.lineTo(box.x + box.w, box.ground)
      ctx.closePath()
      ctx.fill()
    } else if (horizon === 'city') {
      ctx.fillStyle = shade(colors.city)
      let cx = box.x
      const unit = box.w / 18
      for (const building of citySeeds) {
        if (cx > box.x + box.w) break
        const w = unit * building.w
        const h = box.h * 0.22 * building.h
        ctx.fillRect(cx, box.ground - h, w, h)
        if (building.windows && light < 0.5) {
          ctx.fillStyle = '#ffd66b'
          ctx.globalAlpha = 0.5 - light
          for (let wy = box.ground - h + 6; wy < box.ground - 8; wy += 9) for (let wx = cx + 4; wx < cx + w - 4; wx += 8) ctx.fillRect(wx, wy, 3, 4)
          ctx.globalAlpha = 1
          ctx.fillStyle = shade(colors.city)
        }
        cx += w + unit * 0.15
      }
    }
    ctx.fillStyle = shade(colors.ground)
    ctx.fillRect(box.x, box.ground, box.w, box.y + box.h - box.ground)
  }

  /** Rain and snow over the whole box, falling steadily and drifting with the wind: every frame from its time alone. */
  const drawWeather = (ctx: CanvasRenderingContext2D, read: (prop: string) => number, time: number, box: { x: number; y: number; w: number; h: number }) => {
    const wind = Math.max(-1, Math.min(1, read('wind')))
    const rain = Math.max(0, Math.min(1, read('rain')))
    const snow = Math.max(0, Math.min(1, read('snow')))
    if (rain > 0) {
      ctx.strokeStyle = colors.rain
      ctx.globalAlpha = 0.35 + 0.45 * rain
      ctx.lineWidth = 1.2
      ctx.lineCap = 'round'
      const length = box.h * 0.05
      const slant = wind * 0.45
      const shown = Math.round(rain * dropSeeds.length)
      ctx.beginPath()
      for (let i = 0; i < shown; i++) {
        const drop = dropSeeds[i]
        const fall = ((drop.v * box.h + time * drop.speed * 0.9) % box.h + box.h) % box.h
        const dx = ((drop.u * box.w + fall * slant) % box.w + box.w) % box.w
        ctx.moveTo(box.x + dx, box.y + fall)
        ctx.lineTo(box.x + dx + slant * length, box.y + fall + length)
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    if (snow > 0) {
      ctx.fillStyle = colors.snow
      ctx.globalAlpha = 0.85
      const shown = Math.round(snow * flakeSeeds.length)
      for (let i = 0; i < shown; i++) {
        const flake = flakeSeeds[i]
        const fall = ((flake.v * box.h + time * flake.speed * 0.08) % box.h + box.h) % box.h
        const sway = Math.sin(time * 0.002 + flake.sway) * box.w * 0.02
        const dx = ((flake.u * box.w + sway + wind * fall * 0.3) % box.w + box.w) % box.w
        ctx.beginPath()
        ctx.arc(box.x + dx, box.y + fall, flake.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }
  }

  const target: CustomTarget = {
    type: 'custom',
    x,
    y,
    width,
    height,
    props,
    about: {
      kind: kind === 'room' ? 'room' : 'sky',
      summary: kind === 'room' ? 'A room: a wall, a floor and a window on the sky. Its values are tracks: hour, clouds, wind, rain, snow (seen through the window).' : `A sky over ${horizon === 'flat' ? 'the ground' : horizon}: the sun and moon on their arcs, stars, clouds on the wind, rain and snow. Its values are tracks: hour (0–24), clouds, wind (−1..1), rain, snow (0..1).`,
      props: Object.fromEntries(Object.keys(props).map((name) => [name, describeSceneryProp(name)])),
    },
    draw(ctx, self, time) {
      const values = (self.props ?? {}) as Record<string, number>
      const read = (key: string) => Number(values[key] ?? props[key] ?? 0)
      ctx.save()
      const box = { x: 0, y: 0, w: width, h: height, ground: ground - y }
      if (kind === 'sky') {
        drawSky(ctx, read, time, box, true)
        drawWeather(ctx, read, time, box)
      } else {
        // A room: the wall, the floor from the ground line down, the skirting, and a window on the sky.
        ctx.fillStyle = colors.wall
        ctx.fillRect(0, 0, width, box.ground)
        ctx.fillStyle = colors.floor
        ctx.fillRect(0, box.ground, width, height - box.ground)
        ctx.fillStyle = colors.skirting
        ctx.fillRect(0, box.ground - height * 0.012, width, height * 0.012)
        if (window) {
          const ww = width * 0.26
          const wh = box.ground * 0.5
          const wx = width * 0.62
          const wy = box.ground * 0.14
          ctx.fillStyle = colors.frame
          ctx.fillRect(wx - 6, wy - 6, ww + 12, wh + 12)
          ctx.save()
          ctx.beginPath()
          ctx.rect(wx, wy, ww, wh)
          ctx.clip()
          drawSky(ctx, read, time, { x: wx, y: wy, w: ww, h: wh, ground: wy + wh * 0.8 }, true)
          drawWeather(ctx, read, time, { x: wx, y: wy, w: ww, h: wh })
          ctx.restore()
          ctx.strokeStyle = colors.frame
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.moveTo(wx + ww / 2, wy)
          ctx.lineTo(wx + ww / 2, wy + wh)
          ctx.moveTo(wx, wy + wh / 2)
          ctx.lineTo(wx + ww, wy + wh / 2)
          ctx.stroke()
        }
      }
      ctx.restore()
    },
  }

  const self: Scenery = {
    kind: 'scenery',
    target,
    ground,
    anchor(name, time = Infinity) {
      const hour = at('hour', time)
      if (name === 'sun' || name === 'moon') {
        const body = bodyAt(hour, name === 'sun' ? 6 : 18)
        return { x: x + body.x, y: y + body.y }
      }
      if (name === 'horizon') return { x: x + width / 2, y: ground - height * 0.03 }
      if (name === 'ground') return { x: x + width / 2, y: ground }
      throw new Error(`scenery: ${unknownName('place', name, ['sun', 'moon', 'horizon', 'ground'])}`)
    },
    set(prop, edit) {
      if (!(prop in props)) throw new Error(`scenery: ${unknownName('value', prop, Object.keys(props))}`)
      if (typeof edit.value !== 'number' || !Number.isFinite(edit.value)) throw new Error('scenery.set needs `value`, a number')
      log.tween(prop, at(prop, edit.at), edit.value, edit, 1000)
      return self
    },
    tracks: log.tracks,
  }
  return self
}

function describeSceneryProp(name: string): PropertyInfo {
  switch (name) {
    case 'hour':
      return { description: 'The time of day, 0–24: the sky’s colours, the sun and the moon on their arcs, stars at night', unit: 'hours', min: 0, max: 24 }
    case 'clouds':
      return { description: 'Cloud cover', unit: '0..1', min: 0, max: 1 }
    case 'wind':
      return { description: 'The wind, blowing left (−) or right (+): clouds drift, rain slants, snow drifts', unit: '-1..1', min: -1, max: 1 }
    case 'rain':
      return { description: 'How hard it rains', unit: '0..1', min: 0, max: 1 }
    default:
      return { description: 'How hard it snows', unit: '0..1', min: 0, max: 1 }
  }
}

// --- presets ------------------------------------------------------------------

export type ScenePresetName = 'park' | 'street' | 'office' | 'home'

export interface ScenePresetOptions {
  /** The scene's size, scene px */
  width: number
  height: number
  /** Scene y of the ground (default 85% of the height) */
  ground?: number
  /** Px per metre for the props (default: a quarter of the height per metre) */
  scale?: number
  /** Overrides for the scenery (an hour, weather, colours) */
  scenery?: Partial<SceneryOptions>
}

/** A prop in a preset: which, where its middle stands (scene x), facing which way, with its scale. */
export interface PlacedProp {
  preset: PropPresetName
  x: number
  turn?: number
  scale: number
  values?: Record<string, number>
}

export interface ScenePreset {
  scenery: SceneryOptions
  props: PlacedProp[]
}

/**
 * Ready-made scenes as plain data: the scenery and where the props stand, as
 * shares of the width. A park under a late-morning sky with trees and a
 * bench; a street at the end of the afternoon with houses, a car and a
 * tree against the city; an office with a desk, a chair and a door; a home
 * with a bed, a chair and a door.
 */
export function scenePreset(name: ScenePresetName | string, options: ScenePresetOptions): ScenePreset {
  const { width, height } = options
  const ground = options.ground ?? height * 0.85
  const scale = options.scale ?? height / 4.5
  const base: SceneryOptions = { x: 0, y: 0, width, height, ground }
  const place = (preset: PropPresetName, share: number, extra: Partial<PlacedProp> = {}): PlacedProp => ({ preset, x: width * share, scale, ...extra })
  switch (name) {
    case 'park':
      return {
        scenery: { ...base, hour: 10.5, clouds: 0.35, horizon: 'hills', ...options.scenery },
        props: [place('tree', 0.14, { scale: scale * 1.1 }), place('chair', 0.5, { turn: 0 }), place('tree', 0.86, { scale: scale * 0.9 })],
      }
    case 'street':
      return {
        scenery: { ...base, hour: 16, clouds: 0.25, horizon: 'city', colors: { ground: '#8a8f99' }, ...options.scenery },
        props: [place('house', 0.2, { scale: scale * 0.75, turn: 0.1 }), place('car', 0.5, { turn: 1, scale: scale * 0.9 }), place('house', 0.78, { scale: scale * 0.7, turn: 0.1 }), place('tree', 0.95, { scale: scale * 0.8 })],
      }
    case 'office':
      return {
        scenery: { ...base, kind: 'room', hour: 11, clouds: 0.3, colors: { wall: '#dfe5ec', floor: '#9aa3ad', skirting: '#6c757d' }, ...options.scenery },
        props: [place('door', 0.1, { turn: 0.15 }), place('chair', 0.46, { turn: 0 }), place('desk', 0.58, { turn: 0 })],
      }
    case 'home':
      return {
        scenery: { ...base, kind: 'room', hour: 20, clouds: 0.2, ...options.scenery },
        props: [place('door', 0.08, { turn: 0.15 }), place('chair', 0.35, { turn: 0.3 }), place('bed', 0.72, { turn: 0.25 })],
      }
    default:
      throw new Error(unknownName('scene preset', name, ['park', 'street', 'office', 'home']))
  }
}

/** A preset built: its scenery target and its props as prop targets standing on the ground, in drawing order (left to right). */
export function buildScene(name: ScenePresetName | string, options: ScenePresetOptions): { scenery: Scenery; props: PropTarget[]; ground: number } {
  const preset = scenePreset(name, options)
  const sky = scenery(preset.scenery)
  const props = preset.props.map((placed) => propTarget({ x: placed.x, y: sky.ground, prop: propPreset(placed.preset), scale: placed.scale, values: { turn: placed.turn ?? 0, ...placed.values } }))
  return { scenery: sky, props, ground: sky.ground }
}
