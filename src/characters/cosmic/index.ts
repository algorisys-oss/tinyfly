/**
 * The cosmic explainer kit: gradient skies, parallax dust and bokeh, flat-
 * shaded shapes (sphere, isometric cube, probability haze), zooming through
 * scale with portals, burned-in short captions and label chips. Pair it with
 * the noir kit's drawGlow and drawVignette, and the sound generators in
 * tinyfly/headless. See docs/cosmic-explainer.md.
 */
export * from './sky'
export * from './shapes'
export * from './zoom'
export * from './captions'
export { shade as cosmicShade, parseRgb } from './cosmic-utils'
export { COSMIC_KIT } from './cosmic-kit'
