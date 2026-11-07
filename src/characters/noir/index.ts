/**
 * The noir / detective kit: atmosphere (rain, blinds, darkness with torch
 * beams, glow, vignette, lightning, a failing bulb), detective overlays (the
 * clue marker, an evidence folder, a clock and a time chip, a suspect's name
 * card, a narration box, speech bubbles) and a case board (cards, pins, red
 * string, marker cross-outs and scribble-outs). See docs/noir-detective.md.
 */
export * from './atmosphere'
export * from './overlays'
export * from './case-board'
export { fadeWindow, withAlpha, wrapText, popIn } from './noir-utils'
export { NOIR_KIT } from './noir-kit'
