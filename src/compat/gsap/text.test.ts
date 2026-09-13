import { describe, it, expect } from 'vitest'
import { timeline } from './timeline'
import { compileTextVars } from './text-vars'
import { isTextTrack, type TextTrack } from '../../engine'

const textTrack = (tl: ReturnType<typeof timeline>, index = 0) =>
  tl.timeline.tracks.filter(isTextTrack)[index] as TextTrack
const textAt = (tl: ReturnType<typeof timeline>, ms: number, target = 'title') =>
  tl.timeline.getStateAtTime(ms).values.get(target)?.get('text')

describe('compileTextVars', () => {
  it('maps text to type mode', () => {
    expect(compileTextVars({ text: 'Hi' }, 't', 1000)).toEqual({ to: 'Hi', mode: 'type' })
    expect(compileTextVars({ text: { value: 'Hi', rightToLeft: true } }, 't', 1000)).toEqual({ to: 'Hi', mode: 'type', rightToLeft: true })
  })

  it('maps scrambleText options, converting revealDelay to a fraction and speed to a rate', () => {
    const config = compileTextVars({ scrambleText: { text: 'Hi', chars: 'numbers', revealDelay: 0.5, speed: 2 } }, 't', 2000)!
    expect(config).toMatchObject({ to: 'Hi', mode: 'scramble', chars: 'numbers', revealDelay: 0.25, refreshRate: 40 })
  })

  it('derives a stable seed from the target and text', () => {
    const a = compileTextVars({ scrambleText: 'Hi' }, 'x', 1000)!.seed
    expect(compileTextVars({ scrambleText: 'Hi' }, 'x', 1000)!.seed).toBe(a)
    expect(compileTextVars({ scrambleText: 'Hi' }, 'y', 1000)!.seed).not.toBe(a)
    expect(compileTextVars({ scrambleText: { text: 'Hi', seed: 5 } }, 'x', 1000)!.seed).toBe(5)
  })

  it('returns undefined without text options, and rejects malformed ones', () => {
    expect(compileTextVars({}, 't', 1000)).toBeUndefined()
    expect(() => compileTextVars({ scrambleText: {} }, 't', 1000)).toThrow(/scrambleText/)
    expect(() => compileTextVars({ text: {} }, 't', 1000)).toThrow(/text needs/)
  })
})

describe('text in timelines', () => {
  it('types onto empty text by default', () => {
    const tl = timeline()
    tl.to('title', { text: 'Hello', duration: 1, ease: 'none' })
    expect(textTrack(tl).textConfig).toMatchObject({ from: '', to: 'Hello', mode: 'type' })
    expect(textAt(tl, 600)).toBe('Hel')
  })

  it('chains from the text last set', () => {
    const tl = timeline()
    tl.to('title', { text: 'One', duration: 1 })
    tl.to('title', { scrambleText: 'Two', duration: 1 })
    expect(textTrack(tl, 1).textConfig.from).toBe('One')
    expect(textAt(tl, 1000)).toBe('One')
    expect(textAt(tl, 2000)).toBe('Two')
  })

  it('takes an explicit start from fromTo', () => {
    const tl = timeline()
    tl.fromTo('title', { text: 'Start' }, { scrambleText: 'End', duration: 1 })
    expect(textTrack(tl).textConfig).toMatchObject({ from: 'Start', to: 'End' })
  })

  it('from() goes from the given text to the current one, keeping options', () => {
    const tl = timeline()
    tl.to('title', { text: 'Now', duration: 0.5 })
    tl.from('title', { scrambleText: { text: 'Before', chars: 'numbers' }, duration: 1 })
    expect(textTrack(tl, 1).textConfig).toMatchObject({ from: 'Before', to: 'Now', chars: 'numbers' })
  })

  it('eases progress like any tween', () => {
    const tl = timeline()
    tl.to('title', { text: 'ABCDEFGHIJ', duration: 1, ease: 'power3.in' })
    expect((textAt(tl, 500) as string).length).toBeLessThan(5)
  })

  it('staggers across several targets', () => {
    const tl = timeline()
    tl.to(['a', 'b'], { text: 'Hi', duration: 1, stagger: 0.5, ease: 'none' })
    expect(textAt(tl, 1000, 'a')).toBe('Hi')
    expect(textAt(tl, 1000, 'b')).toBe('H')
  })

  it('animates other properties alongside', () => {
    const tl = timeline()
    tl.to('title', { scrambleText: 'Hi', opacity: 0.5, duration: 1 })
    expect(tl.timeline.tracks.map((t) => t.property).sort()).toEqual(['opacity', 'text'])
  })
})
