import { describe, it, expect } from 'vitest'
import { checkBeats, actionNames } from './beat-check'
import { scriptTracks } from './script'
import { closestName } from '../../engine/authoring/did-you-mean'

const messages = (beats: unknown) => checkBeats(beats).map((p) => `${p.level} ${p.beat}: ${p.message}`)

describe('checkBeats', () => {
  it('accepts every kind of action', () => {
    const target = { x: 100, y: -50 }
    const beats = actionNames().map((action) => ({ do: action, to: 200, target, say: 'hi' }))
    expect(checkBeats(beats).filter((p) => p.level === 'error')).toEqual([])
  })

  it('names the action, mood and joint that were probably meant', () => {
    const out = messages([{ do: 'walkk', to: 1 }, { do: 'cheer', mood: 'joyfull' }, { do: 'hold', pose: { rightSholder: 90 } }])
    expect(out[0]).toMatch(/Unknown action "walkk": did you mean "walk"\?/)
    expect(out[1]).toMatch(/Unknown mood "joyfull": did you mean "joyful"\?/)
    expect(out[2]).toMatch(/Unknown pose joint "rightSholder": did you mean "rightShoulder"\?/)
  })

  it('maps the field names people reach for to the real ones', () => {
    const out = messages([{ do: 'walk', to: 300, duration: 900, expression: 'happy', text: 'hi' }])
    expect(out).toContainEqual(expect.stringMatching(/"duration": did you mean "for"/))
    expect(out).toContainEqual(expect.stringMatching(/"expression": did you mean "mood"/))
    expect(out).toContainEqual(expect.stringMatching(/"text": did you mean "say"/))
  })

  it('asks for the fields an action needs, and checks their shape', () => {
    const out = messages([{ do: 'grab' }, { do: 'push', target: { x: 1, y: 2 } }, { do: 'kick', target: { x: 'a' } }, { do: 'look', toward: 'veiwer' }, { do: 'hold', for: -5 }])
    expect(out[0]).toMatch(/`grab` needs `target`/)
    expect(out[1]).toMatch(/`push` needs `to`/)
    expect(out[2]).toMatch(/`target` is a point or box/)
    expect(out[3]).toMatch(/did you mean "viewer"/)
    expect(out[4]).toMatch(/`for` is milliseconds/)
  })

  it('warns about beats that compile but do nothing much', () => {
    expect(messages([{ do: 'walk' }])).toEqual([expect.stringMatching(/^warning 0: `walk` without `to`/)])
  })

  it('makes scriptTracks throw with every problem listed', () => {
    expect(() => scriptTracks('hero', [{ do: 'hop' as never, to: 3 }, { do: 'wave', mood: 'excited' as never }])).toThrow(
      /2 problem\(s\)[\s\S]*beat 0: Unknown action "hop"[\s\S]*beat 1: Unknown mood "excited"/
    )
  })

  it('suggests only close names', () => {
    expect(closestName('xyzzy', ['walk', 'run'])).toBeUndefined()
    expect(closestName('Run', ['walk', 'run'])).toBe('run')
  })
})
