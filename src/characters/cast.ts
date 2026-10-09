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
  /** `family` (ages and looks) or `work` (dressed for a job, from the occupations sheet) */
  group: 'family' | 'work'
  /** Height next to an adult (1) */
  scale: number
  /** Everything else about them */
  options: Omit<CharacterOptions, 'height'>
}

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
