import { describe, expect, it } from 'vitest'
import { Timeline } from '../../engine/core/timeline'
import { surfaceScript } from '../acting/surface-script'
import { car, house } from '..'
import { propSurface } from './prop-surface'
import { propScript } from './script'
import { drawProp, propTarget } from './target'
import { createCanvas } from '@napi-rs/canvas'

const makeCar = () => propTarget({ x: 300, y: 380, prop: car(), values: { turn: 1 } })

describe('propSurface', () => {
  it('names a prop’s anchors and where a control’s parts are', () => {
    const surface = propSurface(makeCar())
    const box = surface.anchor('box')
    const door = surface.anchor('control:door')
    expect(door.left).toBeGreaterThanOrEqual(box.left)
    expect(door.right).toBeLessThanOrEqual(box.right)
    expect(door.bottom).toBeLessThanOrEqual(380)
    // In profile the lamps are edge-on: nothing to aim at. Turned toward the viewer, they are there.
    expect(() => surface.anchor('control:lights')).toThrow(/turned away from the viewer after its edits; aim at an anchor \(anchor:seat/)
    const facing = propSurface(propTarget({ x: 300, y: 380, prop: car(), values: { turn: 0.5 } }))
    expect(facing.anchor('control:lights').width).toBeGreaterThan(0)
    expect(surface.anchor('anchor:door').width).toBeCloseTo(0.2 * 60)
    const wheel = surface.anchor('part:wheel-0-left')
    // Near the ground (seen from a little above, its bottom sits a few px up).
    expect(wheel.bottom).toBeGreaterThan(360)
    expect(wheel.bottom).toBeLessThanOrEqual(385)
    expect(() => surface.anchor('part:wheel-9')).toThrow(/Unknown car part "wheel-9"/)
  })

  it('opens a door and switches lights on and off, from where each was', () => {
    const surface = propSurface(makeCar())
      .edit('switch', 'control:door', { at: 1000, duration: 400 })
      .edit('switch', 'control:lights', { at: 500, duration: 100 })
      .edit('switch', 'control:lights', { at: 2000, duration: 100, on: false })
      .edit('set', 'control:door', { at: 3000, value: 0.5 })
    const timeline = new Timeline({ id: 'c', tracks: surface.tracks('car') })
    const at = (time: number, prop: string) => timeline.getStateAtTime(time).values.get('car')?.get(prop) as number
    expect(at(1200, 'door')).toBeCloseTo(0.5)
    expect(at(1400, 'door')).toBe(1)
    expect(at(1000, 'lights')).toBe(1)
    expect(at(2100, 'lights')).toBe(0)
    expect(at(3400, 'door')).toBe(0.5)
  })

  it('moves its places as the door swings', () => {
    const surface = propSurface(makeCar()).edit('switch', 'control:door', { at: 1000, duration: 400 })
    expect(surface.anchor('control:door', 1400)).not.toEqual(surface.anchor('control:door', 0))
  })

  it('follows a prop that is scripted to move', () => {
    const target = makeCar()
    const script = propScript('car', target.prop, [{ do: 'drive', to: 600 }], { from: 300 })
    const surface = propSurface(target, { tracks: script.tracks })
    expect(surface.anchor('box').x - surface.anchor('box', 0).x).toBeCloseTo(300, 0)
  })

  it('says what is wrong, naming what it has', () => {
    const surface = propSurface(makeCar())
    expect(() => surface.anchor('control:dor')).toThrow(/Unknown car control "dor": did you mean "door"\?/)
    expect(() => surface.anchor('anchor:trunk')).toThrow(/Unknown car anchor "trunk"/)
    expect(() => surface.anchor('contrl:door')).toThrow(/Unknown anchor "contrl": did you mean "control"\?/)
    expect(() => surface.edit('open', 'control:door', { at: 0 })).toThrow(/Unknown edit "open"/)
    expect(() => surface.edit('set', 'control:door', { at: 0 })).toThrow(/set needs `value`/)
    expect(() => surface.edit('switch', 'anchor:door', { at: 0 })).toThrow(/switch takes control anchors/)
    expect(surface.anchor('control:lift')).toEqual(surface.anchor('box'))
  })

  it('a house lights its windows when a figure flips the switch', () => {
    const home = propTarget({ x: 300, y: 380, prop: house() })
    const surface = propSurface(home)
    const result = surfaceScript(
      'hero',
      { home: surface },
      [{ do: 'point', target: { surface: 'home', anchor: 'control:lights' }, then: { surface: 'home', edit: 'switch', anchor: 'control:lights' } }],
      { from: 500, ground: 380, height: 100, facing: -1 }
    )
    const [point] = result.beats
    const lights = result.tracks.find((track) => track.target === 'home' && track.property === 'lights')!
    expect(lights.keyframes.map((key) => [key.time, key.value])).toEqual([[point.contact, 0], [point.contact! + 400, 1]])
  })
})

describe('props with loose parts and floors', () => {
  it('lets a part come loose, knocks it off or carries it to a place, and draws it where it went', () => {
    const target = makeCar()
    const surface = propSurface(target)
    const wheel = surface.piece('part:wheel-0-left')
    expect(wheel.part).toBe('wheel-0-left')
    expect(surface.piece('part:wheel-0-left')).toBe(wheel)
    expect(target.loose?.get('wheel-0-left')).toBe(1)
    expect(target.loose?.get('wheel-0-left-hub')).toBe(1)
    surface.edit('fling', 'part:wheel-0-left', { at: 500, velocity: { x: 0.5, y: -0.4 } })
    surface.edit('move', 'part:wheel-1-left', { at: 2000, to: 'anchor:roof' })
    const timeline = new Timeline({ id: 'c', tracks: surface.tracks('car') })
    const at = (time: number, prop: string) => timeline.getStateAtTime(time).values.get('car')?.get(prop) as number
    expect(at(400, 'piece.1.x')).toBe(0)
    expect(at(900, 'piece.1.x')).toBeGreaterThan(100)
    expect(at(1500, 'piece.1.opacity')).toBeLessThan(0.05)
    expect(at(2500, 'piece.2.y')).toBeLessThan(-20)
    const frame = (time: number) => {
      const canvas = createCanvas(600, 420)
      const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
      drawProp(ctx, target, { time, state: timeline.getStateAtTime(time) }, 'car')
      return canvas.toBuffer('image/png')
    }
    expect(frame(400).equals(frame(700))).toBe(false)
    expect(() => surface.piece('anchor:roof')).toThrow(/a piece is a part, part:ID/)
    expect(() => surface.edit('move', 'part:wheel-1-left', { at: 0 })).toThrow(/move needs `to`/)
  })

  it('carries a figure standing on the roof as the car lifts', () => {
    const surface = propSurface(makeCar())
    const ground = surface.anchor('anchor:roof', 0).top
    surface.edit('set', 'control:lift', { at: 1000, duration: 1000, value: 0.5 })
    const tracks = [{ id: 'hero-y', target: 'hero', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 3000, value: 0 }] }]
    const ridden = surface.ride(tracks, 'hero', { ground })
    const timeline = new Timeline({ id: 'r', tracks: ridden })
    const y = (time: number) => timeline.getStateAtTime(time).values.get('hero')?.get('y') as number
    const rise = surface.anchor('anchor:roof').top - ground
    expect(rise).toBeLessThan(-10)
    expect(y(500)).toBe(0)
    expect(y(1500)).toBeCloseTo(rise / 2, 0)
    expect(y(3000)).toBeCloseTo(rise, 0)
    // A prop that never moves leaves the tracks alone.
    expect(propSurface(makeCar()).ride(tracks, 'hero', { ground })).toBe(tracks)
  })
})
