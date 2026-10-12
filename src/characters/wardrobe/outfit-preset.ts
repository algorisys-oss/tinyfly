import type { BasicOutfitOptions } from './basic-outfit'

export type OutfitCategory = 'everyday' | 'formal' | 'casual'

/** Plain JSON starting points. Garment choices are available for any actor. */
export const OUTFIT_PRESETS: Readonly<Record<OutfitCategory, Readonly<BasicOutfitOptions>>> = Object.freeze({
  everyday: Object.freeze({ shirt: '#bc7050', trousers: '#495a67', sleeves: 'short', bottom: 'trousers', collar: false, tie: null }),
  formal: Object.freeze({ top: 'shirt', shirt: '#f4ede2', trousers: '#394653', sleeves: 'long', bottom: 'trousers', trouserStyle: 'plain', collar: true, tie: '#804453' }),
  casual: Object.freeze({ top: 'tshirt', shirt: '#648a83', trousers: '#426683', sleeves: 'short', bottom: 'trousers', trouserStyle: 'jeans', collar: false, tie: null }),
})

/** Returns fresh, serializable wardrobe options for character({ outfit }). */
export function outfitPreset(category: OutfitCategory, overrides: BasicOutfitOptions = {}): BasicOutfitOptions {
  if (!Object.prototype.hasOwnProperty.call(OUTFIT_PRESETS, category)) throw new Error(`outfitPreset: unknown category '${category}'`)
  const outfit = { ...OUTFIT_PRESETS[category], ...overrides }
  // Selecting a different top opts out of a formal shirt's collar and tie;
  // explicit accessories still take precedence.
  if (overrides.top && overrides.top !== 'shirt') {
    outfit.collar = overrides.collar ?? false
    outfit.tie = overrides.tie ?? null
  }
  if (outfit.top === 'dress') outfit.bottom = 'skirt'
  return outfit
}
