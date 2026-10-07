import { describe, expect, it } from 'vitest'
import { Timeline } from '../../engine/core/timeline'
import { surfaceScript } from '../acting/surface-script'
import { car, house } from '..'
import { propSurface } from './prop-surface'
import { propScript } from './script'
import { propTarget } from './target'

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
    expect(() => surface.anchor('control:turn')).toThrow(/moves no parts of its own/)
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
