import { COSMIC_SKIES } from './sky'

/**
 * The cosmic explainer kit as data, for the capabilities catalog: every
 * function with its call shape and what it draws.
 */
export const COSMIC_KIT = {
  depth: {
    'drawSkyGradient(ctx, { width, height, sky?, top?, bottom? })': 'a flat saturated gradient sky filling the frame (one per scene)',
    'drawDust(ctx, time, { width, height, count?, color?, opacity?, size?, drift?, offset?, seed? })': 'twinkling specks in three parallax depths, wrapping round the frame (offset = camera shift)',
    'drawBokeh(ctx, time, { width, height, count?, color?, opacity?, minRadius?, maxRadius?, drift?, offset?, seed? })': 'big soft out-of-focus discs drifting across the frame',
    'dustTwinkle(time, i, seed?)': 'the twinkle 0..1 drawDust uses for speck i',
  },
  shapes: {
    'drawShadedBall(ctx, { x, y, radius, color, light?, shadow?, highlight?, opacity? })': 'a flat sphere: base fill, a darker crescent away from the light, a small highlight; no outline',
    'drawIsoCube(ctx, { x, y, size, color, opacity?, sheen? })': 'an isometric cube: lit top, mid left, dark right face (isoCubeFaces gives the polygons)',
    'drawHaze(ctx, time, { x, y, radius, color?, dots?, dot?, opacity?, squash?, spin?, seed? })': 'a probability cloud of flickering dots, densest on a ring (an electron shell)',
    'cosmicShade(color, amount, alpha?)': 'a colour toward black (amount < 0) or white (> 0), for flat shading',
  },
  zoom: {
    'zoomAt(time, [{ time, value }])': 'a zoom factor eased in log space between keys (a steady dive from 1x to 1000x)',
    'depthAt(time, [{ time, value }])': 'a depth eased between keys (0 = the first level)',
    'drawZoomLevels(ctx, time, { width, height, depth, levels: [(ctx, time) => void], factor?, center?, portalRadius?, rim?, rimWidth? })': 'zoom through scale: each level factor times smaller, opening as a growing portal in the middle of the last; levels behind a covering portal are skipped',
    'zoomLevelLayout({ width, height, depth, levelCount, factor?, portalRadius? })': 'which levels draw at a depth, their scale and portal radius',
    'drawPortalRim(ctx, x, y, radius, color?, width?)': 'a glowing ring',
    'levelPresence(depth, level, settle?)': '0..1: how much a level fills the screen (to fade its label)',
  },
  captions: {
    'drawShortCaption(ctx, time, { lines: [{ text, start, end }], x, y, size?, font?, color?, shadow?, wordsPerChunk?, lowercase? })': 'burned-in short captions: one to three words at a time in step with the voice (by character share)',
    'captionChunkAt({ text, start, end }, time, wordsPerChunk?)': 'the chunk showing at a time, or null',
    'captionChunks(text, wordsPerChunk?)': 'a line cut into chunks (split at spaces; works for Devanagari)',
    'drawLabelChip(ctx, time, { text, x, y, size?, font?, fill?, color?, at?, pop? })': 'a rounded label chip that pops on; returns its width',
    'drawCornerNote(ctx, { text, x, y, size?, font?, color? })': 'a small right-aligned note, e.g. "*not to scale"',
  },
  skies: Object.keys(COSMIC_SKIES),
  sounds: 'from tinyfly/headless: soundWhoosh, soundPop, soundThud, soundShimmer, soundTick, soundClick, soundPad (Float32Array samples for mixAudio / renderMix layers)',
} as const
