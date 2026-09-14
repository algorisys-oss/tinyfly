import { describe, it, expect } from 'vitest'
import { createUtils, isRandomString } from './utils'

describe('live.utils', () => {
  const utils = createUtils()

  it('clamp, mapRange and normalize, called fully or curried', () => {
    expect(utils.clamp(0, 100, 150)).toBe(100)
    expect(utils.clamp(0, 100)(-5)).toBe(0)
    expect(utils.mapRange(0, 800, 0, 100, 200)).toBe(25)
    expect(utils.mapRange(-1, 1, 0, 10)(0)).toBe(5)
    expect(utils.normalize(100, 200, 150)).toBe(0.5)
  })

  it('interpolates numbers, colours, arrays and objects', () => {
    expect(utils.interpolate(0, 100, 0.25)).toBe(25)
    expect(utils.interpolate([0, 10], [10, 20])(0.5)).toEqual([5, 15])
    expect(utils.interpolate({ x: 0, y: 10 }, { x: 100, y: 20 }, 0.5)).toEqual({ x: 50, y: 15 })
    expect(String(utils.interpolate('#000000', '#ffffff', 0.5)).toLowerCase()).toMatch(/80|128|7f|127/)
  })

  it('wraps ranges and arrays, and yoyos', () => {
    expect(utils.wrap(0, 10, 12)).toBe(2)
    expect(utils.wrap(0, 10, -3)).toBe(7)
    expect(utils.wrap(['a', 'b', 'c'])(4)).toBe('b')
    expect([0, 5, 10, 15, 20, 25].map(utils.wrapYoyo(0, 10))).toEqual([0, 5, 10, 5, 0, 5])
  })

  it('snaps to increments, arrays and radii', () => {
    expect(utils.snap(5, 12.4)).toBe(10)
    expect(utils.snap([0, 50, 100])(61)).toBe(50)
    expect(utils.snap({ values: [0, 100], radius: 10 }, 30)).toBe(30)
    expect(utils.snap({ increment: 10, radius: 2 }, 19)).toBe(20)
  })

  it('draws seeded random numbers, repeatable from a seed', () => {
    const a = createUtils(42)
    const b = createUtils(42)
    const drawsA = [a.random(0, 100), a.random(0, 100, 5), a.random(['x', 'y', 'z'])]
    const drawsB = [b.random(0, 100), b.random(0, 100, 5), b.random(['x', 'y', 'z'])]
    expect(drawsA).toEqual(drawsB)
    expect((drawsA[1] as number) % 5).toBe(0)
    expect(createUtils(7).random(0, 1)).not.toBe(createUtils(8).random(0, 1))
    a.seed(42)
    expect(a.random(0, 100)).toBe(drawsA[0])
    const fn = a.random(-1, 1, undefined, true)
    expect(fn()).not.toBe(fn())
  })

  it('shuffles in place, deterministically', () => {
    expect(createUtils(3).shuffle([1, 2, 3, 4, 5])).toEqual(createUtils(3).shuffle([1, 2, 3, 4, 5]))
    expect(createUtils(3).shuffle([1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('distributes a value across targets like a stagger', () => {
    const fromCenter = utils.distribute({ base: 1, amount: 1, from: 'center' })
    const five = [1, 2, 3, 4, 5]
    expect(five.map((_, i) => fromCenter(i, null, five))).toEqual([2, 1.5, 1, 1.5, 2])
  })

  it('pipes, splits colours and reads units', () => {
    expect(utils.pipe(utils.clamp(0, 10), utils.snap(2))(7.3)).toBe(8)
    expect(utils.splitColor('#ff8000')).toEqual([255, 128, 0])
    expect(utils.splitColor('rgba(10, 20, 30, 0.5)')).toEqual([10, 20, 30, 0.5])
    expect(utils.getUnit('20px')).toBe('px')
    expect(utils.getUnit('45%')).toBe('%')
    expect(utils.getUnit(3)).toBe('')
  })

  it('resolves "random(…)" strings', () => {
    expect(isRandomString('random(-100, 100, 10)')).toBe(true)
    expect(isRandomString('random([1, 2])')).toBe(true)
    expect(isRandomString('100px')).toBe(false)
    const value = createUtils().resolveRandomString('random(-100, 100, 10)') as number
    expect(value % 10 === 0 && value >= -100 && value <= 100).toBe(true)
    expect(['red', 'blue']).toContain(createUtils().resolveRandomString("random(['red', 'blue'])"))
  })
})
