import { describe, it, expect } from 'vitest'
import { characterDanceTracks, characterFlipTracks, danceLength, facingOf, mergeKeyframes } from './character-dance'
import { DANCE_STYLES, FLIPS, HUMAN_REST, routineBeats } from '../../characters'
import { isCharacterField } from './character-element'

describe('character dances in the editor', () => {
  it('samples a dance into character pose tracks from the playhead', () => {
    const tracks = characterDanceTracks({ style: 'disco', move: 'point', bpm: 120, start: 1000 })
    expect(tracks.length).toBeGreaterThan(3)
    for (const track of tracks) {
      expect(track.property in HUMAN_REST, track.property).toBe(true)
      expect(track.keyframes[0].time).toBe(1000)
      // 2 beats at 120 bpm, 4 keys a beat.
      expect(track.keyframes).toHaveLength(9)
      expect(track.keyframes[8].time).toBe(2000)
    }
  })

  it('plays the whole routine by default', () => {
    const tracks = characterDanceTracks({ style: 'bhangra', bpm: 100, start: 0 })
    const end = tracks[0].keyframes[tracks[0].keyframes.length - 1].time
    expect(end).toBe(Math.round((routineBeats('bhangra') * 60000) / 100))
    expect(danceLength('bhangra', 100)).toBeCloseTo(end)
  })

  it('writes flips with their turn and lift', () => {
    const tracks = characterFlipTracks('backFlip', { start: 500 })
    const roll = tracks.find((t) => t.property === 'roll')!
    const lift = tracks.find((t) => t.property === 'lift')!
    expect(roll.keyframes[0].time).toBe(500)
    expect(roll.keyframes[roll.keyframes.length - 1].time).toBe(500 + FLIPS.backFlip.duration)
    expect(Math.min(...roll.keyframes.map((k) => k.value as number))).toBeLessThan(-170)
    expect(Math.max(...lift.keyframes.map((k) => k.value as number))).toBeGreaterThan(0.3)
  })

  it('merges into existing keys, keeping those before and after', () => {
    const existing = [
      {
        target: 'tum',
        property: 'lean',
        keyframes: [
          { time: 0, value: 1 },
          { time: 1500, value: 2 },
          { time: 5000, value: 3 },
        ],
      },
      { target: 'other', property: 'lean', keyframes: [{ time: 100, value: 9 }] },
    ]
    const [merged] = mergeKeyframes(existing, 'tum', [{ property: 'lean', keyframes: [{ time: 1000, value: 5 }, { time: 2000, value: 6 }] }])
    expect(merged.keyframes.map((k) => [k.time, k.value])).toEqual([[0, 1], [1000, 5], [2000, 6], [5000, 3]])
  })
})

describe('hands and travel in the editor', () => {
  it('keys hand shapes when the character has cartoon hands', () => {
    const withHands = characterDanceTracks({ style: 'bharatanatyam', move: 'alapadma', bpm: 80, start: 0, hands: true })
    const without = characterDanceTracks({ style: 'bharatanatyam', move: 'alapadma', bpm: 80, start: 0 })
    expect(withHands.some((t) => t.property === 'hand.left.spread')).toBe(true)
    expect(without.some((t) => t.property.startsWith('hand.'))).toBe(false)
    for (const track of withHands) expect(isCharacterField(track.property), track.property).toBe(true)
  })

  it('counts hand fields as character fields, and nothing else new', () => {
    expect(isCharacterField('hand.right.index.curl')).toBe(true)
    expect(isCharacterField('hand.left.turn')).toBe(true)
    expect(isCharacterField('hand.left.nonsense')).toBe(false)
    expect(isCharacterField('leg.left.toeOut')).toBe(true)
  })

  it('travels a flip from the current x, the way the character faces', () => {
    const right = characterFlipTracks('frontFlip', { start: 0, height: 200, x: 40 })
    const x = right.find((t) => t.property === 'x')!
    expect(x.keyframes[0].value).toBe(40)
    expect(x.keyframes[x.keyframes.length - 1].value).toBeCloseTo(40 + FLIPS.frontFlip.travel * 200)

    const left = characterFlipTracks('frontFlip', { start: 0, height: 200, facing: -1 })
    const leftX = left.find((t) => t.property === 'x')!
    expect(leftX.keyframes[leftX.keyframes.length - 1].value).toBeCloseTo(-FLIPS.frontFlip.travel * 200)
    // Seen from the other side, rolling the other way.
    expect(left.find((t) => t.property === 'turn')!.keyframes[0].value).toBe(3)
    const roll = left.find((t) => t.property === 'roll')!
    expect(Math.min(...roll.keyframes.map((k) => k.value as number))).toBeLessThan(-170)

    // On the spot without a height.
    expect(characterFlipTracks('frontFlip', { start: 0 }).some((t) => t.property === 'x')).toBe(false)
  })

  it('moonwalks from the current x as an x track; on-the-spot dances add none', () => {
    const tracks = characterDanceTracks({ style: 'popping', move: 'moonwalk', bpm: 100, start: 0, height: 200, x: 30 })
    const x = tracks.find((t) => t.property === 'x')!
    expect(x.keyframes[0].value).toBe(30)
    expect(x.keyframes[x.keyframes.length - 1].value).toBeCloseTo(30 + 200 * DANCE_STYLES.popping.moves.moonwalk.travel!)
    expect(x.keyframes.every((k) => k.easing === 'linear')).toBe(true)
    expect(characterDanceTracks({ style: 'disco', bpm: 120, start: 0, height: 200 }).some((t) => t.property === 'x')).toBe(false)
  })

  it('facing left, dances the mirror image and glides the other way', () => {
    const options = { style: 'popping' as const, bpm: 100, start: 0, height: 200 }
    const right = characterDanceTracks(options)
    const left = characterDanceTracks({ ...options, facing: -1 })
    const field = (tracks: typeof left, property: string) => tracks.find((t) => t.property === property)!.keyframes
    // Side glide right becomes side glide left: the x track is mirrored about the start.
    const xRight = field(right, 'x')
    const xLeft = field(left, 'x')
    for (let i = 0; i < xRight.length; i++) expect(xLeft[i].value).toBeCloseTo(-(xRight[i].value as number))
    // Turned between Side (left), 3, and the front, 4: never round the back.
    const turns = field(left, 'turn').map((k) => k.value as number)
    expect(Math.min(...turns)).toBeGreaterThanOrEqual(3)
    expect(Math.max(...turns)).toBeLessThanOrEqual(4)
    expect(turns.some((turn) => turn < 3.5)).toBe(true)
    // Limbs swap sides.
    expect(field(left, 'arm.right.spread')[0].value).toBeCloseTo(field(right, 'arm.left.spread')[0].value as number)
  })

  it('reads which way a character faces from its turn, going round either way', () => {
    expect(facingOf(0)).toBe(1)
    expect(facingOf(1)).toBe(1)
    expect(facingOf(3)).toBe(-1)
    expect(facingOf(3.1)).toBe(-1)
    expect(facingOf(-0.9)).toBe(-1)
    expect(facingOf(4)).toBe(1)
  })
})
