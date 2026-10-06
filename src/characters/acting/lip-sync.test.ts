import { describe, it, expect } from 'vitest'
import { VISEMES, lipSyncKeyframes, lipSyncTracks, soundsOf } from './lip-sync'

const shapes = (text: string) => soundsOf(text).map((sound) => sound.viseme)

describe('soundsOf', () => {
  it('reads Latin text: vowels open, m/b/p close, f/v bite, pauses rest', () => {
    expect(shapes('mama')).toEqual(['m', 'a', 'm', 'a'])
    expect(shapes('Boo!')).toEqual(['m', 'u'])
    expect(shapes('five')).toEqual(['f', 'i', 'f', 'e'])
    expect(shapes('Oh, hi')).toEqual(['o', 'rest', 'i'])
  })

  it('reads Devanagari: inherent vowels, matras, virama, lips', () => {
    // पानी: p (lips), aa, n, ii
    expect(shapes('पानी')).toEqual(['m', 'a', 'c', 'i'])
    // घड़ा: gh + inherent a, ड़ (nukta) + aa
    expect(shapes('घड़ा')).toEqual(['c', 'a', 'c', 'a'])
    // प्यास: p with virama (no vowel), y + aa, s (word end drops the inherent a)
    expect(shapes('प्यास')).toEqual(['m', 'c', 'a', 'c'])
    expect(shapes('ओह!')).toEqual(['o', 'c'])
  })

  it('takes no time for symbols and trims pauses at the end', () => {
    expect(shapes('...')).toEqual([])
    expect(shapes('hi...')).toEqual(['i'])
  })
})

describe('lipSyncKeyframes', () => {
  it('opens and closes the mouth within the line', () => {
    const keys = lipSyncKeyframes({ text: 'Hello, my friend', start: 1000, end: 2400 })
    const mouth = keys.mouth
    expect(mouth[0]).toEqual({ time: 1000, value: 0 })
    expect(mouth.at(-1)!.time).toBe(2400)
    expect(mouth.at(-1)!.value).toBe(0)
    expect(Math.max(...mouth.map((k) => k.value))).toBeGreaterThan(0.4)
    const times = mouth.map((k) => k.time)
    expect([...times].sort((a, b) => a - b)).toEqual(times)
    expect(times.every((t) => t >= 1000 && t <= 2400)).toBe(true)
    // m in "my" closes the lips.
    expect(mouth.some((k, i) => i > 0 && i < mouth.length - 1 && k.value === VISEMES.m.mouth)).toBe(true)
  })

  it('scales with energy and can write other fields', () => {
    const loud = lipSyncKeyframes({ text: 'ah', start: 0, end: 500 }, { energy: 1.2, fields: { mouth: 'jaw' } })
    expect(Math.max(...loud.jaw.map((k) => k.value))).toBeCloseTo(VISEMES.a.mouth * 1.2)
    expect(loud.mouthWidth).toBeDefined()
  })

  it('is deterministic and JSON', () => {
    const a = lipSyncKeyframes({ text: 'पानी बहुत नीचे था', start: 0, end: 1800 })
    expect(JSON.parse(JSON.stringify(a))).toEqual(lipSyncKeyframes({ text: 'पानी बहुत नीचे था', start: 0, end: 1800 }))
  })
})

describe('lipSyncTracks', () => {
  it('puts several lines on one pair of tracks, in order', () => {
    const tracks = lipSyncTracks('hero', [
      { text: 'second', start: 3000, end: 3600 },
      { text: 'first', start: 500, end: 1100 },
    ])
    expect(tracks.map((t) => t.property).sort()).toEqual(['mouth', 'mouthWidth'])
    const times = tracks[0].keyframes.map((k) => k.time)
    expect(times[0]).toBe(500)
    expect([...times].sort((a, b) => a - b)).toEqual(times)
    expect(tracks[0].id).toBe('hero-mouth')
  })
})

describe('lipSyncOver', () => {
  it('lip-syncs over acted tracks, keeping the face around the line', async () => {
    const { lipSyncOver } = await import('./lip-sync')
    const acted = [
      { id: 'hero-mouth', target: 'hero', property: 'mouth', keyframes: [{ time: 0, value: 0 }, { time: 400, value: 1 }, { time: 3000, value: 1 }] },
      { id: 'hero-lean', target: 'hero', property: 'lean', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 8 }] },
      { id: 'other-mouth', target: 'other', property: 'mouth', keyframes: [{ time: 0, value: 0.3 }] },
    ]
    const out = lipSyncOver('hero', acted, [{ text: 'mama', start: 1000, end: 2000 }])
    expect(out.find((t) => t.property === 'lean')).toBe(acted[1])
    expect(out.find((t) => t.target === 'other')).toBe(acted[2])
    const mouth = out.find((t) => t.target === 'hero' && t.property === 'mouth')!.keyframes
    // The gape (1) holds up to the line and resumes after it; the lips close for each m.
    expect(mouth.find((k) => k.time === 1000)!.value).toBe(1)
    expect(mouth.find((k) => k.time === 2000)!.value).toBe(1)
    expect(mouth.some((k) => k.time > 1000 && k.time < 2000 && k.value === 0)).toBe(true)
    expect(mouth.at(-1)).toEqual({ time: 3000, value: 1 })
    expect(out.find((t) => t.property === 'mouthWidth')).toBeDefined()
  })
})
