import { describe, it, expect } from 'vitest'
import { createCanvas, type Canvas } from '@napi-rs/canvas'
import { Timeline } from '../engine/core/timeline'
import { buildScene, scenePreset, scenery, skyColors } from './scenery'
import { character } from './character'
import { hairFollow, hairFollowTracks, hairMotionAt } from './hair-follow'

const draw = (sky: ReturnType<typeof scenery>, values: Record<string, number>, time = 0) => {
  const canvas = createCanvas(sky.target.width, sky.target.height)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  sky.target.draw(ctx, { ...sky.target, props: { ...sky.target.props, ...values } }, time)
  return canvas
}
const pixel = (canvas: Canvas, x: number, y: number) => [...canvas.getContext('2d').getImageData(x, y, 1, 1).data].slice(0, 3)

describe('scenery', () => {
  it('colours the sky by the hour, with the sun up by day and the moon by night', () => {
    const noon = skyColors(12)
    const night = skyColors(1)
    expect(noon.top).not.toBe(night.top)
    expect(skyColors(24)).toEqual(skyColors(0))
    const sky = scenery({ x: 0, y: 0, width: 400, height: 240, hour: 12 })
    const sunNoon = sky.anchor('sun')
    const sunMorning = scenery({ x: 0, y: 0, width: 400, height: 240, hour: 8 }).anchor('sun')
    const sunEvening = scenery({ x: 0, y: 0, width: 400, height: 240, hour: 16 }).anchor('sun')
    expect(sunMorning.x).toBeLessThan(sunNoon.x)
    expect(sunNoon.x).toBeLessThan(sunEvening.x)
    expect(sunNoon.y).toBeLessThan(sunMorning.y)
    // The sky is brighter at noon than at night, and night has stars.
    const day = draw(sky, { hour: 12 })
    const dark = draw(sky, { hour: 1 })
    const sum = (rgb: number[]) => rgb[0] + rgb[1] + rgb[2]
    expect(sum(pixel(day, 200, 40))).toBeGreaterThan(sum(pixel(dark, 200, 40)) + 100)
  })

  it('draws clouds that drift on the wind, rain that slants and snow, and rooms with a window', () => {
    const sky = scenery({ x: 0, y: 0, width: 400, height: 240, clouds: 0.8, horizon: 'city' })
    const still = draw(sky, { wind: 0 }, 0).toBuffer('image/png')
    const later = draw(sky, { wind: 1 }, 4000).toBuffer('image/png')
    expect(still.equals(later)).toBe(false)
    expect(draw(sky, { rain: 1 }, 100).toBuffer('image/png').equals(draw(sky, { rain: 0 }, 100).toBuffer('image/png'))).toBe(false)
    expect(draw(sky, { snow: 1 }, 100).toBuffer('image/png').equals(draw(sky, { snow: 1 }, 600).toBuffer('image/png'))).toBe(false)
    // The same time draws the same frame.
    expect(draw(sky, { rain: 0.5, snow: 0.3, wind: -0.5 }, 1234).toBuffer('image/png').equals(draw(sky, { rain: 0.5, snow: 0.3, wind: -0.5 }, 1234).toBuffer('image/png'))).toBe(true)
    const room = scenery({ x: 0, y: 0, width: 400, height: 240, kind: 'room', hour: 20 })
    expect(() => draw(room, { rain: 0.6 }, 500)).not.toThrow()
    for (const horizon of ['hills', 'flat'] as const) expect(() => draw(scenery({ x: 0, y: 0, width: 300, height: 200, horizon }), { hour: 18.5 })).not.toThrow()
  })

  it('records its changes as tracks, and names what it does not have', () => {
    const sky = scenery({ x: 0, y: 0, width: 400, height: 240, hour: 8 }).set('hour', { at: 0, value: 20, duration: 4000 }).set('rain', { at: 1000, value: 1, duration: 500 })
    const timeline = new Timeline({ id: 's', tracks: sky.tracks('sky') })
    const at = (time: number, prop: string) => timeline.getStateAtTime(time).values.get('sky')?.get(prop) as number
    expect(at(2000, 'hour')).toBeCloseTo(14, 5)
    expect(at(1500, 'rain')).toBe(1)
    expect(sky.anchor('sun', 2000).x).toBeGreaterThan(sky.anchor('sun', 0).x)
    expect(() => sky.set('fog' as never, { at: 0, value: 1 })).toThrow(/Unknown value "fog"/)
    expect(() => sky.anchor('cloud' as never)).toThrow(/Unknown place "cloud"/)
  })

  it('lays out the park, street, office and home presets on the ground, and builds them', () => {
    for (const name of ['park', 'street', 'office', 'home'] as const) {
      const preset = scenePreset(name, { width: 720, height: 400 })
      expect(preset.props.length).toBeGreaterThanOrEqual(3)
      for (const placed of preset.props) {
        expect(placed.x).toBeGreaterThanOrEqual(0)
        expect(placed.x).toBeLessThanOrEqual(720)
      }
      const built = buildScene(name, { width: 720, height: 400 })
      expect(built.props.length).toBe(preset.props.length)
      expect(built.ground).toBeCloseTo(340, 6)
      expect(built.scenery.target.about?.kind).toBe(name === 'office' || name === 'home' ? 'room' : 'sky')
    }
    expect(() => scenePreset('beach', { width: 1, height: 1 })).toThrow(/Unknown scene preset "beach"/)
  })
})

describe('hair in the wind', () => {
  it('streams downwind while the head is still', () => {
    const calm = hairMotionAt(hairFollow(() => ({ x: 0, y: 0, turn: 1 }), { end: 3000, headRadius: 20 }), 2500)
    const windy = hairMotionAt(hairFollow(() => ({ x: 0, y: 0, turn: 1 }), { end: 3000, headRadius: 20, wind: 1 }), 2500)
    expect(Math.abs(calm['hair.trail'])).toBeLessThan(1e-6)
    // Facing right into a wind from the left, the hair streams back.
    expect(windy['hair.trail']).toBeGreaterThan(0.3)
    const amy = character({ height: 300, hair: 'longWaves' })
    const tracks = [{ id: 'amy-turn', target: 'amy', property: 'turn', keyframes: [{ time: 0, value: 1 }, { time: 2000, value: 1 }] }]
    expect(hairFollowTracks('amy', tracks, amy, { wind: 0.8 }).some((track) => track.property === 'hair.trail')).toBe(true)
  })
})
