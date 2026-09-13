import { describe, it, expect } from 'vitest'
import { textAt, charactersFor } from './text-value'
import { Timeline } from '../core/timeline'
import { serializeTimeline, deserializeTimeline } from '../serialization'
import type { TextConfig, TextTrack } from '../types'

const scramble = (extra: Partial<TextConfig> = {}): TextConfig => ({ from: 'HELLO', to: 'WORLD', mode: 'scramble', ...extra })

describe('textAt: type', () => {
  const type: TextConfig = { from: 'old text', to: 'NEW TEXT', mode: 'type' }

  it('returns from and to exactly at the ends', () => {
    expect(textAt(type, 0)).toBe('old text')
    expect(textAt(type, 1)).toBe('NEW TEXT')
  })

  it('overwrites the old text one character at a time', () => {
    expect(textAt(type, 0.5)).toBe('NEW text')
  })

  it('types onto nothing', () => {
    expect(textAt({ to: 'abcd', mode: 'type' }, 0.5)).toBe('ab')
  })

  it('deletes one character at a time when typing towards shorter text', () => {
    const erase: TextConfig = { from: 'abcd', to: '', mode: 'type' }
    expect(textAt(erase, 0.5)).toBe('cd')
    expect(textAt({ ...erase, rightToLeft: true }, 0.25)).toBe('abc')
    expect(textAt({ ...erase, rightToLeft: true }, 0.75)).toBe('a')
  })

  it('can reveal from the right', () => {
    expect(textAt({ from: 'aaaa', to: 'bbbb', mode: 'type', rightToLeft: true }, 0.5)).toBe('aabb')
  })

  it('counts emoji as single characters', () => {
    expect(textAt({ to: '🙂🙂🙂🙂', mode: 'type' }, 0.5)).toBe('🙂🙂')
  })
})

describe('textAt: scramble', () => {
  it('returns from and to exactly at the ends', () => {
    expect(textAt(scramble(), 0)).toBe('HELLO')
    expect(textAt(scramble(), 1)).toBe('WORLD')
  })

  it('settles characters left to right as progress grows', () => {
    const mid = textAt(scramble(), 0.6, 123)
    expect(mid.slice(0, 3)).toBe('WOR')
    expect(mid).toHaveLength(5)
  })

  it('settles from the right when asked', () => {
    expect(textAt(scramble({ rightToLeft: true }), 0.6, 123).slice(2)).toBe('RLD')
  })

  it('draws unsettled characters from the chosen set', () => {
    const digits = textAt(scramble({ chars: 'numbers', from: '', to: 'ABCDEFGHIJ' }), 0.01, 500)
    expect(digits).toMatch(/^\d*$/)
    const custom = textAt(scramble({ chars: 'xo', from: 'XXXXXXXX', to: 'YYYYYYYY' }), 0.05, 500)
    expect(custom).toMatch(/^[xo]+$/)
  })

  it('is deterministic for the same time, and changes with the refresh step', () => {
    const config = scramble({ from: 'AAAAAAAAAAAA', to: 'BBBBBBBBBBBB' })
    expect(textAt(config, 0.1, 400)).toBe(textAt(config, 0.1, 400))
    // Two moments 1s apart at 20 refreshes/s are different steps.
    expect(textAt(config, 0.1, 400)).not.toBe(textAt(config, 0.1, 1400))
  })

  it('holds still within one refresh step', () => {
    const config = scramble({ from: 'AAAAAAAAAAAA', to: 'BBBBBBBBBBBB', refreshRate: 10 })
    expect(textAt(config, 0.1, 0)).toBe(textAt(config, 0.1, 99))
  })

  it('differs between seeds', () => {
    const a = textAt(scramble({ from: 'AAAAAAAAAAAA', to: 'BBBBBBBBBBBB', seed: 1 }), 0.1, 0)
    const b = textAt(scramble({ from: 'AAAAAAAAAAAA', to: 'BBBBBBBBBBBB', seed: 2 }), 0.1, 0)
    expect(a).not.toBe(b)
  })

  it('keeps spaces so word shapes stay readable', () => {
    expect(textAt(scramble({ from: '', to: 'AB CD EF' }), 0.01, 0).length).toBeLessThanOrEqual(8)
    expect(textAt(scramble({ from: 'xx xx xx', to: 'AB CD EF', tweenLength: false }), 0.01, 0)[2]).toBe(' ')
  })

  it('grows the length over the tween, unless told not to', () => {
    const grow = scramble({ from: 'AB', to: 'ABCDEFGHIJ' })
    expect(textAt(grow, 0.5, 0)).toHaveLength(6)
    expect(textAt({ ...grow, tweenLength: false }, 0.5, 0)).toHaveLength(10)
  })

  it('waits for revealDelay before settling anything', () => {
    const config = scramble({ from: 'AAAAA', to: 'BBBBB', revealDelay: 0.5, chars: 'x' })
    expect(textAt(config, 0.4, 0)).toBe('xxxxx')
    expect(textAt(config, 0.8, 0).startsWith('BBB')).toBe(true)
  })
})

describe('charactersFor', () => {
  it('names sets, accepts custom strings, and falls back for empty', () => {
    expect(charactersFor('numbers')).toHaveLength(10)
    expect(charactersFor('ab✓')).toEqual(['a', 'b', '✓'])
    expect(charactersFor('')).toHaveLength(26)
  })
})

describe('text tracks on a timeline', () => {
  const track = (extra: Partial<TextTrack> = {}): TextTrack => ({
    id: 't',
    target: 'label',
    property: 'text',
    textConfig: { from: 'HELLO', to: 'WORLD', mode: 'scramble', seed: 7 },
    keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 1 }],
    ...extra,
  })
  const textAtTime = (tl: Timeline, ms: number) => tl.getStateAtTime(ms).values.get('label')!.get('text')

  it('expands progress into the string', () => {
    const tl = new Timeline({ id: 'x', tracks: [track()] })
    expect(textAtTime(tl, 0)).toBe('HELLO')
    expect(textAtTime(tl, 1000)).toBe('WORLD')
    expect(textAtTime(tl, 600)).toMatch(/^WOR/)
  })

  it('scrambles on time measured from the track\'s own start', () => {
    const early = new Timeline({ id: 'a', tracks: [track()] })
    const delayed = new Timeline({ id: 'b', tracks: [track({ delay: 5000 })] })
    expect(textAtTime(delayed, 5300)).toBe(textAtTime(early, 300))
  })

  it('round-trips through JSON', () => {
    const tl = new Timeline({ id: 'x', tracks: [track({ delay: 100 })] })
    const json = JSON.parse(JSON.stringify(serializeTimeline(tl)))
    expect(json.tracks[0].textConfig).toMatchObject({ from: 'HELLO', to: 'WORLD', mode: 'scramble', seed: 7 })
    const restored = deserializeTimeline(json)
    for (const ms of [0, 250, 700, 1100]) expect(textAtTime(restored, ms)).toBe(textAtTime(tl, ms))
  })

  it('plays sequential text tracks in order', () => {
    const tl = new Timeline({
      id: 'x',
      tracks: [
        track({ id: 'a', textConfig: { from: '', to: 'ONE', mode: 'type' } }),
        track({ id: 'b', textConfig: { from: 'ONE', to: 'TWO', mode: 'type' }, delay: 1000 }),
      ],
    })
    expect(textAtTime(tl, 1000)).toBe('ONE')
    expect(textAtTime(tl, 2000)).toBe('TWO')
  })
})
