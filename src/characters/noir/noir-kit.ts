import { CASE_CARD_KINDS, CASE_MARK_KINDS } from './case-board'

/**
 * The noir / detective kit as data, for the capabilities catalog: every
 * function with its call shape and what it draws.
 */
export const NOIR_KIT = {
  atmosphere: {
    'drawRain(ctx, time, { x, y, width, height, drops?, opacity?, color?, speed?, length?, slant?, lineWidth?, seed? })': 'rain streaks falling in a box (a window, the frame), clipped to it; seeded, a pure function of time',
    'drawBlinds(ctx, { x, y, width, height, opacity?, slope?, spacing?, band?, color? })': 'key light through venetian blinds: slanted bright bands',
    'drawDarkness(ctx, { amount, cones?: [{ x, y, angle (deg), length, width }], holes?: [{ x, y, radius }], bounds?, color?, opacity?, beam?, beamOpacity? })': 'a dark room with torch beams and round holes of light cut out (coneCorners(cone) gives a beam’s corners)',
    'drawGlow(ctx, { x, y, radius, color?, opacity? })': 'a soft pool of light',
    'drawVignette(ctx, { width, height, x?, y?, inner?, outer?, opacity?, color? })': 'the frame’s edges fall into dark',
    'lightningFlash(time, strikes, decay?)': 'flash brightness 0..1 from strike times (ms)',
    'lightFlicker(time, strength?)': 'a failing bulb: how much darker the room is (0 or strength)',
  },
  overlays: {
    'drawClueMarker(ctx, time, { x, y, radius?, at, duration?, color?, lineWidth? })': 'the red magnifier over a clue: pops on, pulses, fades (clueMarkerAt gives its opacity and scale)',
    'drawEvidenceFolder(ctx, { x, y, scale?, angle?, color?, ink?, label?, font? })': 'a tabbed evidence folder',
    'drawClockFace(ctx, { x, y, radius?, hours, minutes, face?, ink? })': 'a wall clock showing a time (clockHandAngles gives the hands)',
    'drawTimeChip(ctx, time, { x, y, text, size?, font?, color?, background?, at? })': 'a time/place chip in a corner; returns its width',
    'drawNameCard(ctx, time, { name, role?, at, duration?, anchor, side?, frame?, dim?, color?, font?, tilt? })': 'a freeze-frame suspect card: the frame dims, a slanted red band beside the head',
    'drawNarrationBox(ctx, time, { text, start, end, speaker?, x?, width?, bottom?, size?, font?, typeDuration? })': 'a first-person narration box along the bottom, words typed on (lineReveal gives opacity and reveal)',
    'drawSpeechBubble(ctx, time, { text, start, end, tail, speaker?, maxWidth?, size?, font?, bounds?, maxCenterY?, gap? })': 'a comic speech bubble above the speaker, tail to the head, popping on',
  },
  caseBoard: {
    'caseBoard({ x, y, width, height, cards, strings?, marks?, cork?, frame?, font?, handFont?, seed? })': 'checks and resolves a case board (did-you-mean on unknown card ids and kinds)',
    'drawCaseBoard(ctx, board, time, { drawCard? })': 'the board at a time: cork, red strings stretching, cards popping up on pins, marker strokes; returns the nib point while a mark is drawn',
    'caseBoardMarkerTip(board, time)': 'where the marker’s nib is (for a hand), or null',
    'caseCardBox(board, id)': 'a card’s pin, centre and corners, scene px',
    'caseMarkPath(board, { on, kind })': 'a mark’s stroke points',
    'drawPushPin(ctx, x, y, { color?, radius? })': 'a red push pin',
    'drawMarkerStroke(ctx, points, progress, { color?, width? })': 'the first part of a marker stroke; returns the nib',
  },
  cardKinds: CASE_CARD_KINDS,
  markKinds: CASE_MARK_KINDS,
  card: '{ id, x, y (its pin, relative to the board), kind?, title?, note?, width?, height?, angle?, color?, at?, highlight?: { at, duration } }',
  string: '{ from, to, at?, duration?, color? }',
  mark: '{ on, kind, at, duration?, color?, width? }',
} as const
