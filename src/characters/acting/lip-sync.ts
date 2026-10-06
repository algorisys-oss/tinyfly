import type { Keyframe, Track } from '../../engine/types'
import { Timeline } from '../../engine/core/timeline'

/**
 * Lip-sync from text: the mouth shapes a line of dialogue makes, timed over
 * the span it is spoken in.
 *
 * No audio analysis: the text is read as a sequence of sounds (vowels open
 * the mouth in their shape, m/b/p close it, f/v bite the lip, pauses rest
 * it), and the sounds share the line's time by how long each one tends to
 * take. That is how cartoon lip-sync is usually done by hand (a few mouth
 * shapes, timed to the track), and it is close enough for stick figures and
 * cartoon faces. It reads Latin script and Devanagari.
 *
 * Shapes are the face fields `mouth` (0 closed … 1 wide open) and
 * `mouthWidth` (0.5 pursed … 1.5 wide), which the stick figure and the v2
 * characters both have.
 */

/** A mouth shape. */
export interface Viseme {
  mouth: number
  mouthWidth: number
}

/** The shapes, after the classic cartoon mouth chart. */
export const VISEMES = {
  /** Closed and relaxed */
  rest: { mouth: 0, mouthWidth: 1 },
  /** "ah": open wide */
  a: { mouth: 0.75, mouthWidth: 1.1 },
  /** "eh": open, wide */
  e: { mouth: 0.45, mouthWidth: 1.3 },
  /** "ee": a little open, stretched wide */
  i: { mouth: 0.28, mouthWidth: 1.45 },
  /** "oh": round */
  o: { mouth: 0.6, mouthWidth: 0.7 },
  /** "oo": small and pursed */
  u: { mouth: 0.32, mouthWidth: 0.55 },
  /** m, b, p: lips pressed */
  m: { mouth: 0, mouthWidth: 0.9 },
  /** f, v: lip under the teeth */
  f: { mouth: 0.1, mouthWidth: 1.05 },
  /** l, th, n, d, t: tongue up, a little open */
  l: { mouth: 0.3, mouthWidth: 1 },
  /** Other consonants: slightly open */
  c: { mouth: 0.2, mouthWidth: 1 },
} satisfies Record<string, Viseme>

export type VisemeName = keyof typeof VISEMES

/** One sound of a line: its shape, and how long it takes relative to the others. */
export interface Sound {
  viseme: VisemeName
  weight: number
}

/** Relative lengths: vowels are held, consonants pass quickly, punctuation pauses. */
const VOWEL = 1
const CONSONANT = 0.55
const WORD_GAP = 0.35
const PAUSE = 1.6

const LATIN_VOWELS: Record<string, VisemeName> = { a: 'a', e: 'e', i: 'i', y: 'i', o: 'o', u: 'u' }
const LATIN_CONSONANTS: Record<string, VisemeName> = { m: 'm', b: 'm', p: 'm', f: 'f', v: 'f', w: 'u', q: 'u', l: 'l', n: 'l', d: 'l', t: 'l' }

// Devanagari: independent vowels, vowel signs (matras), and the consonants that show on the lips.
const DEVANAGARI_VOWELS: Record<string, VisemeName> = {
  'अ': 'a', 'आ': 'a', 'इ': 'i', 'ई': 'i', 'उ': 'u', 'ऊ': 'u', 'ऋ': 'i', 'ए': 'e', 'ऐ': 'e', 'ओ': 'o', 'औ': 'o', 'ऍ': 'e', 'ऑ': 'o',
}
const DEVANAGARI_MATRAS: Record<string, VisemeName> = {
  'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u', 'ृ': 'i', 'े': 'e', 'ै': 'e', 'ो': 'o', 'ौ': 'o', 'ॅ': 'e', 'ॉ': 'o',
}
const DEVANAGARI_LIPS: Record<string, VisemeName> = { 'प': 'm', 'फ': 'm', 'ब': 'm', 'भ': 'm', 'म': 'm', 'व': 'u' }
const VIRAMA = '्'
const NUKTA = '़'
const isDevanagariConsonant = (char: string) => char >= 'क' && char <= 'ह'

/** Ends of phrases: the mouth rests. */
const PAUSES = new Set(['.', ',', '!', '?', ';', ':', '…', '।', '॥', '—', '-'])

/** The sounds of a line, in order. */
export function soundsOf(text: string): Sound[] {
  const sounds: Sound[] = []
  const chars = Array.from(text.toLowerCase())
  const push = (viseme: VisemeName, weight: number) => {
    const last = sounds[sounds.length - 1]
    // Two of the same shape in a row hold one longer ("ee", "mm").
    if (last && last.viseme === viseme) last.weight += weight * 0.5
    else sounds.push({ viseme, weight })
  }
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]
    const next = chars[i + 1]
    if (PAUSES.has(char)) push('rest', PAUSE)
    else if (/\s/.test(char)) {
      const last = sounds[sounds.length - 1]
      if (last && last.viseme !== 'rest') sounds.push({ viseme: 'c', weight: WORD_GAP })
    } else if ((char === 'o' || char === 'e') && next === char) {
      // "oo" is pursed (food), "ee" stretched (see).
      push(char === 'o' ? 'u' : 'i', VOWEL)
      i++
    } else if (char in LATIN_VOWELS) push(LATIN_VOWELS[char], VOWEL)
    else if (char in LATIN_CONSONANTS) push(LATIN_CONSONANTS[char], CONSONANT)
    // "h" is breath: the mouth keeps the shape it has.
    else if (char === 'h') continue
    else if (/[a-z]/.test(char)) push('c', CONSONANT)
    else if (char in DEVANAGARI_VOWELS) push(DEVANAGARI_VOWELS[char], VOWEL)
    else if (isDevanagariConsonant(char)) {
      // A consonant: its lips (if they show), then its vowel: a matra, none
      // after a virama, else the inherent "a" (short, and dropped at a word's end).
      const lips = next === NUKTA ? (char === 'फ' ? 'f' : undefined) : DEVANAGARI_LIPS[char]
      push(lips ?? 'c', CONSONANT)
      let after = i + 1
      if (chars[after] === NUKTA) after++
      const sign = chars[after]
      if (sign === VIRAMA) i = after
      else if (sign && sign in DEVANAGARI_MATRAS) {
        push(DEVANAGARI_MATRAS[sign], VOWEL)
        i = after
      } else {
        const wordEnds = !sign || /\s/.test(sign) || PAUSES.has(sign)
        if (!wordEnds) push('a', VOWEL * 0.6)
        i = after - 1
      }
    } else if (char === 'ं' || char === 'ँ') push('l', CONSONANT * 0.6)
    // Anything else (digits, symbols, other marks) takes no time.
  }
  // Trailing word gaps and pauses do not hold the mouth after the line.
  while (sounds.length > 0 && (sounds[sounds.length - 1].viseme === 'rest' || sounds[sounds.length - 1].weight === WORD_GAP)) sounds.pop()
  return sounds
}

export interface LipSyncOptions {
  /** How wide the mouth opens: 1 as charted, less for mumbling, more for shouting (default 1) */
  energy?: number
  /** Field names, if not `mouth` and `mouthWidth` */
  fields?: { mouth?: string; mouthWidth?: string }
}

/** A spoken line: what is said, and when (ms). */
export interface SpokenLine {
  text: string
  start: number
  end: number
}

/**
 * Mouth keyframes for a line spoken from `start` to `end` ms: closed at the
 * start, a shape per sound, closed again at the end. Keys are in time order,
 * for the `mouth` and `mouthWidth` fields.
 */
export function lipSyncKeyframes(line: SpokenLine, options: LipSyncOptions = {}): Record<string, Keyframe<number>[]> {
  const mouthField = options.fields?.mouth ?? 'mouth'
  const widthField = options.fields?.mouthWidth ?? 'mouthWidth'
  const energy = options.energy ?? 1
  const sounds = soundsOf(line.text)
  const mouth: Keyframe<number>[] = [{ time: line.start, value: VISEMES.rest.mouth }]
  const width: Keyframe<number>[] = [{ time: line.start, value: VISEMES.rest.mouthWidth }]
  const total = sounds.reduce((sum, sound) => sum + sound.weight, 0)
  const span = line.end - line.start
  if (total > 0 && span > 0) {
    let at = line.start
    for (const sound of sounds) {
      const length = (span * sound.weight) / total
      // The shape is reached a little into its sound and held through it.
      const time = at + Math.min(length * 0.4, 60)
      if (time > mouth[mouth.length - 1].time) {
        const shape = VISEMES[sound.viseme]
        mouth.push({ time, value: shape.mouth * energy, easing: 'ease-out' })
        width.push({ time, value: 1 + (shape.mouthWidth - 1) * Math.min(1.3, energy), easing: 'ease-out' })
      }
      at += length
    }
  }
  if (line.end > mouth[mouth.length - 1].time) {
    mouth.push({ time: line.end, value: VISEMES.rest.mouth, easing: 'ease-in-out' })
    width.push({ time: line.end, value: VISEMES.rest.mouthWidth, easing: 'ease-in-out' })
  }
  return { [mouthField]: mouth, [widthField]: width }
}

/** Mouth tracks on `target` for several spoken lines (in time order, not overlapping). */
export function lipSyncTracks(target: string, lines: SpokenLine[], options: LipSyncOptions = {}): Track[] {
  const merged: Record<string, Keyframe<number>[]> = {}
  for (const line of [...lines].sort((a, b) => a.start - b.start)) {
    for (const [field, frames] of Object.entries(lipSyncKeyframes(line, options))) {
      const list = (merged[field] ??= [])
      const lastTime = list.length > 0 ? list[list.length - 1].time : -Infinity
      list.push(...frames.filter((frame) => frame.time > lastTime))
    }
  }
  return Object.entries(merged).map(([field, keyframes]) => ({ id: `${target}-${field}`, target, property: field, keyframes }))
}

/**
 * Tracks with spoken lines lip-synced over their mouth: during each line the
 * lip-sync shapes replace the `mouth` and `mouthWidth` keys, starting and
 * ending on whatever the face was doing, so a shocked gape or a grin carries
 * on around the speech. Other tracks pass through. Fields missing from
 * `tracks` start from `rest` (default: closed, normal width).
 */
export function lipSyncOver(target: string, tracks: Track[], lines: SpokenLine[], options: LipSyncOptions & { rest?: Record<string, number> } = {}): Track[] {
  if (lines.length === 0) return tracks
  const mouthField = options.fields?.mouth ?? 'mouth'
  const widthField = options.fields?.mouthWidth ?? 'mouthWidth'
  const rest: Record<string, number> = { [mouthField]: VISEMES.rest.mouth, [widthField]: VISEMES.rest.mouthWidth, ...options.rest }
  const before = new Timeline({ id: 'before-speech', tracks })
  const valueAt = (property: string, time: number) => (before.getStateAtTime(time).values.get(target)?.get(property) as number | undefined) ?? rest[property]
  const fields = [mouthField, widthField]
  const out = tracks.filter((track) => track.target !== target || !fields.includes(track.property))
  for (const property of fields) {
    const own = tracks.find((track) => track.target === target && track.property === property)
    let frames: Keyframe<number>[] = own ? [...(own.keyframes as Keyframe<number>[])] : [{ time: 0, value: valueAt(property, 0) }]
    for (const line of lines) {
      const spoken = lipSyncKeyframes(line, options)[property]
      spoken[0] = { ...spoken[0], value: valueAt(property, line.start) }
      spoken[spoken.length - 1] = { ...spoken[spoken.length - 1], value: valueAt(property, line.end) }
      frames = [...frames.filter((frame) => frame.time < line.start || frame.time > line.end), ...spoken]
      frames.sort((a, b) => a.time - b.time)
    }
    out.push({ id: own?.id ?? `${target}-${property}`, target, property, keyframes: frames })
  }
  return out
}
