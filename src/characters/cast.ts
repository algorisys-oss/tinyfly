import type { CharacterOptions } from './character'
import { HAIR_COLORS } from './head/hair'

/**
 * A ready-made recurring cast: a family of characters a viewer can tell
 * apart at a glance, by build, hair, facial hair, glasses and clothes. Each
 * member is plain character options (no height: `scale` is how tall they
 * stand next to an adult), so it can be saved, changed field by field, or
 * given any pose, expression or action.
 *
 * These are starting points from the age-and-cast reference sheet, not rules:
 * any hairstyle, build or outfit suits anyone, and age is shown by hair and
 * proportions, never by a stoop or a walking aid unless one is chosen.
 */
export interface CastMember {
  /** What to call them in a picker */
  label: string
  /** A family, occupation, colour anime or young adult manga preset. */
  group: 'family' | 'work' | 'anime' | 'manga'
  /** Height next to an adult (1) */
  scale: number
  /** Everything else about them */
  options: Omit<CharacterOptions, 'height'>
}

/** Colour anime starting points, using the same human rig, face fields, clothes and head turns as the original cast. */
export const ANIME_CAST = {
  animeBoy: {
    label: 'Anime boy', group: 'anime', scale: 0.68,
    options: { figure: 'fluid', look: 'clean', proportions: 'thin', build: 'child', headSize: 0.34, skin: '#f2c7a5', ink: '#302c48', ears: true, hands: 'cartoon', handStyle: 'natural',
      hair: { style: 'spiky', color: '#263c68' }, face: { style: 'anime', iris: '#318fa5', lashes: false },
      outfit: { shirt: '#efac45', trousers: '#375a91', bottom: 'shorts', shoes: 'boots' } },
  },
  animeGirl: {
    label: 'Anime girl', group: 'anime', scale: 0.68,
    options: { figure: 'fluid', look: 'clean', proportions: 'thin', build: 'child', headSize: 0.34, skin: '#e8ad8c', ink: '#302c48', ears: true, hands: 'cartoon', handStyle: 'natural',
      hair: { style: 'bob', color: '#4f304e' }, face: { style: 'anime', iris: '#9d5f32' },
      outfit: { shirt: '#e9779f', trousers: '#5c4c86', bottom: 'shorts', shoes: 'boots' } },
  },
  animeYoungMan: {
    label: 'Anime young man', group: 'anime', scale: 1,
    options: { figure: 'fluid', look: 'clean', proportions: 'thin', build: 'tall', headSize: 0.23, skin: '#efbf9c', ink: '#302c48', ears: true, hands: 'cartoon', handStyle: 'natural',
      hair: { style: 'spiky', color: '#243552' }, face: { style: 'anime', iris: '#507bcc', lashes: false },
      outfit: { shirt: '#57bbc0', trousers: '#334967', sleeves: 'long', over: 'hoodie', overColor: '#57bbc0', shoes: 'boots' } },
  },
  animeYoungWoman: {
    label: 'Anime young woman', group: 'anime', scale: 1,
    options: { figure: 'fluid', look: 'clean', proportions: 'thin', build: 'slim', headSize: 0.23, skin: '#f3cbb4', ink: '#302c48', ears: true, hands: 'cartoon', handStyle: 'natural',
      hair: { style: 'highPonytail', color: '#773853' }, face: { style: 'anime', iris: '#9163c4' },
      outfit: { shirt: '#ae7cda', trousers: '#35456c', sleeves: 'long', shoes: 'boots' } },
  },
  animeMan: {
    label: 'Anime man', group: 'anime', scale: 1,
    options: { figure: 'fluid', look: 'clean', proportions: 'thin', build: 'broad', headSize: 0.23, skin: '#b67f62', ink: '#302c48', ears: true, hands: 'cartoon', handStyle: 'natural',
      hair: { style: 'sidePart', color: '#302839' }, face: { style: 'anime', iris: '#9b713b', lashes: false },
      outfit: { shirt: '#677aab', trousers: '#343848', sleeves: 'long', collar: true, shoes: 'boots' } },
  },
  animeWoman: {
    label: 'Anime woman', group: 'anime', scale: 1,
    options: { figure: 'fluid', look: 'clean', proportions: 'thin', build: 'standard', headSize: 0.23, skin: '#d59a73', ink: '#302c48', ears: true, hands: 'cartoon', handStyle: 'natural',
      hair: { style: 'shoulderWaves', color: '#382c4c' }, face: { style: 'anime', iris: '#2b8f82' },
      outfit: { shirt: '#df6c79', trousers: '#46506c', sleeves: 'long', bottom: 'skirt', shoes: 'boots' } },
  },
  animeOlderMan: {
    label: 'Anime older man', group: 'anime', scale: 1,
    options: { figure: 'fluid', look: 'clean', proportions: 'thin', build: 'stocky', headSize: 0.25, skin: '#e0b291', ink: '#302c48', ears: true, hands: 'cartoon', handStyle: 'natural',
      hair: { style: 'receding', color: '#b8c4d1' }, facialHair: { style: 'shortBoxed', color: '#dae0e8' }, face: { style: 'anime', iris: '#557c8b', lashes: false, ageLines: 0.8 },
      outfit: { shirt: '#9c846c', trousers: '#46505c', sleeves: 'long', collar: true, shoes: 'boots' } },
  },
  animeOlderWoman: {
    label: 'Anime older woman', group: 'anime', scale: 1,
    options: { figure: 'fluid', look: 'clean', proportions: 'thin', build: 'standard', headSize: 0.25, skin: '#c4947b', ink: '#302c48', ears: true, hands: 'cartoon', handStyle: 'natural',
      hair: { style: 'topBun', color: '#d1d3df' }, face: { style: 'anime', iris: '#7a6998', ageLines: 0.8 },
      outfit: { shirt: '#6d9b93', trousers: '#66597a', sleeves: 'long', over: 'cardigan', overColor: '#6d9b93', shoes: 'boots' } },
  },
} satisfies Record<string, CastMember>

export type AnimeCastName = keyof typeof ANIME_CAST

/** Original young adult manga archetypes; every feature remains plain editable character options. */
export const MANGA_CAST = {
  mangaYoungMan: {
    label: 'Manga young man', group: 'manga', scale: 1,
    options: { figure: 'fluid', look: 'clean', proportions: 'thin', build: 'tall', headSize: 0.21, lineWidth: 2.8, skin: '#edbf9b', ink: '#252536', ears: true, hands: 'cartoon', handStyle: 'natural',
      hair: { style: 'mangaSpikes', color: '#27354c' },
      face: { style: 'anime', shape: 'angular', jawWidth: 0.78, chinWidth: 0.16, eyeScale: 0.8, eyeAspect: 0.63, iris: '#3a9baa', lashes: false, nose: true },
      outfit: { shirt: '#c65a49', trousers: '#293c56', sleeves: 'long', collar: true, shoes: 'boots' } },
  },
  mangaYoungWoman: {
    label: 'Manga young woman', group: 'manga', scale: 1,
    options: { figure: 'fluid', look: 'clean', proportions: 'thin', build: 'slim', headSize: 0.21, lineWidth: 2.8, skin: '#e2a482', ink: '#252536', ears: true, hands: 'cartoon', handStyle: 'natural',
      hair: { style: 'mangaSweep', color: '#683e64' },
      face: { style: 'anime', shape: 'angular', jawWidth: 0.69, chinWidth: 0.1, eyeScale: 0.85, eyeAspect: 0.72, iris: '#8462b7', nose: true },
      outfit: { shirt: '#518c96', trousers: '#364361', sleeves: 'long', shoes: 'boots' } },
  },
  mangaRival: {
    label: 'Manga rival', group: 'manga', scale: 1,
    options: { figure: 'fluid', look: 'clean', proportions: 'thin', build: 'broad', headSize: 0.21, lineWidth: 2.8, skin: '#b77e5f', ink: '#252536', ears: true, hands: 'cartoon', handStyle: 'natural',
      hair: { style: 'mangaSpikes', color: '#e6e0cc', volume: 0.16 },
      face: { style: 'anime', shape: 'angular', jawWidth: 0.9, chinWidth: 0.25, eyeScale: 0.75, eyeAspect: 0.55, iris: '#ba8445', lashes: false, nose: true },
      outfit: { shirt: '#4c4b75', trousers: '#303348', sleeves: 'long', over: 'hoodie', shoes: 'boots' } },
  },
  mangaHeroine: {
    label: 'Manga heroine', group: 'manga', scale: 1,
    options: { figure: 'fluid', look: 'clean', proportions: 'thin', build: 'tall', headSize: 0.21, lineWidth: 2.8, skin: '#f0c5aa', ink: '#252536', ears: true, hands: 'cartoon', handStyle: 'natural',
      hair: { style: 'highPonytail', color: '#263647', texture: 'spiky', textureAmount: 0.35 },
      face: { style: 'anime', shape: 'angular', jawWidth: 0.73, chinWidth: 0.12, eyeScale: 0.83, eyeAspect: 0.65, iris: '#427e9b', nose: true },
      outfit: { shirt: '#b65e7c', trousers: '#31405b', sleeves: 'long', collar: true, shoes: 'boots' } },
  },
} satisfies Record<string, CastMember>

export type MangaCastName = keyof typeof MANGA_CAST

export const CHARACTER_CAST = {
  boy: {
    label: 'Boy',
    group: 'family',
    scale: 0.66,
    options: { build: 'child', hair: 'short', ears: true, outfit: { shirt: '#4f8fd6', trousers: '#2f4d6b', bottom: 'shorts' } },
  },
  girl: {
    label: 'Girl',
    group: 'family',
    scale: 0.66,
    options: { build: 'child', hair: { style: 'bob', color: HAIR_COLORS.chestnut }, ears: true, outfit: { shirt: '#e86a92', trousers: '#4a5b8c', bottom: 'skirt' } },
  },
  youngMan: {
    label: 'Young man',
    group: 'family',
    scale: 1,
    options: { build: 'tall', hair: 'spiky', ears: true, outfit: { shirt: '#3c9a6e', trousers: '#2d3a4f' } },
  },
  youngWoman: {
    label: 'Young woman',
    group: 'family',
    scale: 0.96,
    options: { build: 'slim', hair: { style: 'highPonytail', color: HAIR_COLORS.auburn }, ears: true, outfit: { shirt: '#f0b43c', trousers: '#36507a' } },
  },
  man: {
    label: 'Man',
    group: 'family',
    scale: 1,
    options: { build: 'broad', hair: 'sidePart', facialHair: 'chevron', ears: true, outfit: { shirt: '#7a8fa6', trousers: '#3b3f46', sleeves: 'long', collar: true, tie: '#2b4f8c' } },
  },
  woman: {
    label: 'Woman',
    group: 'family',
    scale: 0.95,
    options: { build: 'curvy', hair: { style: 'shoulderWaves', color: HAIR_COLORS.black }, ears: true, outfit: { shirt: '#9b5fc0', trousers: '#2f2f3a', sleeves: 'long' } },
  },
  grandpa: {
    label: 'Grandpa',
    group: 'family',
    scale: 0.96,
    options: {
      build: 'stocky',
      hair: { style: 'receding', color: HAIR_COLORS.gray },
      facialHair: { style: 'shortBoxed', color: HAIR_COLORS.white },
      glasses: 'square',
      ears: true,
      outfit: { shirt: '#b98a5a', trousers: '#4b4440', sleeves: 'long', collar: true },
    },
  },
  grandma: {
    label: 'Grandma',
    group: 'family',
    scale: 0.9,
    options: { build: 'short', hair: { style: 'topBun', color: HAIR_COLORS.white }, glasses: 'round', ears: true, outfit: { shirt: '#5d9fa8', trousers: '#5a4a5e', sleeves: 'long', bottom: 'skirt' } },
  },
  doctor: {
    label: 'Doctor',
    group: 'work',
    scale: 0.97,
    options: { build: 'slim', hair: { style: 'lowPonytail', color: HAIR_COLORS.black }, ears: true, outfit: { shirt: '#8fb8d8', trousers: '#36507a', over: 'labCoat', collar: true } },
  },
  cook: {
    label: 'Cook',
    group: 'work',
    scale: 1,
    options: { build: 'stocky', hair: 'crewCut', facialHair: 'shortMoustache', ears: true, outfit: { shirt: '#f4f6f8', trousers: '#3b3f46', sleeves: 'long', over: 'apron', overColor: '#e2493b' } },
  },
  builder: {
    label: 'Builder',
    group: 'work',
    scale: 1,
    options: { build: 'broad', hair: 'short', facialHair: 'stubble', hat: 'hardHat', ears: true, outfit: { shirt: '#f08a3c', trousers: '#4a5b8c' } },
  },
  courier: {
    label: 'Courier',
    group: 'work',
    scale: 0.98,
    options: { build: 'standard', hair: 'short', hat: { style: 'cap', color: '#d64535' }, ears: true, outfit: { shirt: '#c94a3b', trousers: '#2f2f3a', bottom: 'shorts' } },
  },
  teacher: {
    label: 'Teacher',
    group: 'work',
    scale: 1,
    options: { build: 'tall', hair: 'slickBack', glasses: 'square', ears: true, outfit: { shirt: '#f4f6f8', trousers: '#3b3f46', sleeves: 'long', collar: true, tie: '#9a4426' } },
  },
  farmer: {
    label: 'Farmer',
    group: 'work',
    scale: 0.97,
    options: { build: 'stocky', hair: { style: 'shoulderStraight', color: HAIR_COLORS.blond }, hat: 'sunHat', ears: true, outfit: { shirt: '#d64535', trousers: '#4f6b3a', sleeves: 'long' } },
  },
  ...ANIME_CAST,
  ...MANGA_CAST,
} satisfies Record<string, CastMember>

export type CastName = keyof typeof CHARACTER_CAST

/**
 * Character options for a cast member at an adult `height` (px; they stand
 * at their own scale of it), with any options changed: `castMember('grandpa',
 * 300, { look: 'pencil' })`.
 */
export function castMember(name: CastName, height = 300, changes: Partial<CharacterOptions> = {}): CharacterOptions {
  const member = CHARACTER_CAST[name] as CastMember | undefined
  if (!member) throw new Error(`castMember: unknown cast member '${name}'`)
  return { ...member.options, height: Math.round(height * member.scale), ...changes }
}
