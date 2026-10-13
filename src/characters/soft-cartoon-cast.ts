import { character, type Character, type CharacterOptions } from './character'

/** Soft child proportions without the adult waist/chest taper. */
function childBody() {
  return {
    torso: [{ at: 0, width: .083 }, { at: .25, width: .08 }, { at: .5, width: .075 }, { at: .8, width: .085 }, { at: 1, width: .023 }],
    arm: [{ at: 0, width: .026 }, { at: .3, width: .024 }, { at: .5, width: .018 }, { at: .7, width: .021 }, { at: 1, width: .012 }],
    leg: [{ at: 0, width: .036 }, { at: .3, width: .037 }, { at: .5, width: .026 }, { at: .7, width: .029 }, { at: 1, width: .015 }],
  }
}

/** Original actors for story scenes. Options, profiles and materials are JSON. */
export const SOFT_CARTOON_CAST = {
  youngMan: {
    figure: 'organic', skin: '#edb98d', ink: '#53372d', headSize: .28,
    shoulderWidth: .074, hipWidth: .045, handSize: .078,
    hair: { style: 'softSweep', color: '#38291f' }, ears: true,
    face: { style: 'anime', shape: 'angular', jawWidth: .83, chinWidth: .35, jawRoundness: 1, eyeScale: .95, eyeAspect: 1.1, nose: true, iris: '#6a472d' },
    outfit: { shirt: '#bc7050', trousers: '#495a67', sleeves: 'short' },
  },
  youngWoman: {
    figure: 'organic', skin: '#f1c299', ink: '#53372d', headSize: .28,
    shoulderWidth: .065, hipWidth: .054, handSize: .075,
    body: {
      torso: [{ at: 0, width: .098 }, { at: .18, width: .097 }, { at: .44, width: .061 }, { at: .7, width: .087 }, { at: .85, width: .09 }, { at: 1, width: .024 }],
      // Her side view: a stylised hourglass in proportion with the front torso above.
      measurements: { height: 165, bust: 86, underbust: 72, waist: 58, hip: 88 },
    },
    hair: { style: 'flowingBob', color: '#38291f' }, ears: true,
    face: { style: 'anime', shape: 'angular', jawWidth: .78, chinWidth: .32, jawRoundness: 1, eyeScale: .95, eyeAspect: 1.1, nose: true, iris: '#6a472d', lashes: true },
    outfit: { shirt: '#72958b', trousers: '#6b6888', sleeves: 'short', bottom: 'skirt' },
  },
  childBoy: {
    figure: 'organic', height: 230, skin: '#edb98d', ink: '#53372d',
    headSize: .36, shoulderWidth: .052, hipWidth: .038, legLength: .82, armLength: .8, handSize: .074,
    body: childBody(), hair: { style: 'softSweep', color: '#38291f' }, ears: true,
    face: { style: 'anime', shape: 'round', eyeScale: 1, eyeAspect: 1.1, nose: true, iris: '#6a472d' },
    outfit: { shirt: '#d99843', trousers: '#497b91', sleeves: 'short', bottom: 'shorts' },
  },
  childGirl: {
    figure: 'organic', height: 225, skin: '#f1c299', ink: '#53372d',
    headSize: .36, shoulderWidth: .052, hipWidth: .038, legLength: .82, armLength: .8, handSize: .074,
    body: childBody(), hair: { style: 'flowingBob', color: '#38291f' }, ears: true,
    face: { style: 'anime', shape: 'round', eyeScale: 1, eyeAspect: 1.1, nose: true, iris: '#6a472d', lashes: true },
    outfit: { shirt: '#ae7396', trousers: '#648769', sleeves: 'short', bottom: 'skirt' },
  },
} satisfies Record<string, CharacterOptions>

export type SoftCartoonName = keyof typeof SOFT_CARTOON_CAST

/** Preset choices can be overridden without changing the source actor. */
export function softCartoonCharacter(name: SoftCartoonName, options: CharacterOptions = {}): Character {
  if (!Object.prototype.hasOwnProperty.call(SOFT_CARTOON_CAST, name)) throw new Error(`softCartoonCharacter: unknown actor '${name}'`)
  const preset: CharacterOptions = SOFT_CARTOON_CAST[name]
  // New measurements reshape the torso, so the preset's own torso makes way for them.
  const presetBody: CharacterOptions['body'] = { ...preset.body }
  if (options.body?.measurements !== undefined) delete presetBody.torso
  return character({ ...preset, ...options, body: { ...presetBody, ...options.body }, face: { ...preset.face, ...options.face } })
}
