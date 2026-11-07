# Noir and Detective Scenes

A kit for detective stories and film-noir moods on a canvas: rain on the
window, street light through venetian blinds, a dark room with a torch beam,
soft pools of light and a vignette; the red magnifier that marks a clue, an
evidence folder, a wall clock and a time chip, a freeze-frame name card for a
suspect, a first-person narration box and speech bubbles; and a case board
with pinned cards, red string and the marker's cross-outs and scribble-outs.

Every function draws on a Canvas 2D context, takes the time in ms and plain
options, and draws the same thing for the same input: rain comes from a
seeded generator, never `Math.random`, so a frame looks the same whether it
is rendered in order, out of order or scrubbed to. Text is always yours (any
language or script) and so are the fonts (`font` is a CSS family list).

```js
import { character, castMember, drawCharacter, humanPose, HUMAN_POSES,
  drawRain, drawBlinds, drawDarkness, drawVignette, drawClueMarker,
  drawNameCard, drawNarrationBox, drawTimeChip } from '@algorisys/tinyfly/characters'

const detective = character(castMember('beanDetective', 460))

function frame(ctx, time) {
  ctx.fillStyle = '#232b37'
  ctx.fillRect(0, 0, 1920, 1080)
  drawRain(ctx, time, { x: 1500, y: 160, width: 340, height: 440 })          // the window
  drawBlinds(ctx, { x: 0, y: 0, width: 1920, height: 1080, opacity: 0.08 })
  ctx.save(); ctx.translate(560, 880)
  drawCharacter(ctx, detective, humanPose({ ...HUMAN_POSES.think, turn: 0.45 }), time)
  ctx.restore()
  drawDarkness(ctx, { amount: 1, cones: [{ x: 640, y: 520, angle: 15, length: 760, width: 190 }] })
  drawClueMarker(ctx, time, { x: 900, y: 680, at: 1500 })
  drawNameCard(ctx, time, { name: 'The witness', role: 'heard footsteps', at: 6800, anchor: { x: 1340, y: 470 } })
  drawVignette(ctx, { width: 1920, height: 1080 })
  drawTimeChip(ctx, time, { x: 50, y: 40, text: 'Tuesday · 9:40 PM' })
  drawNarrationBox(ctx, time, { text: 'It rained all night.', start: 300, end: 3400, speaker: 'Case file #1' })
}
```

The [Noir Case File](https://tinyfly.app/examples/live-noir-case-file)
example plays a whole scene and its case board.

## Atmosphere

| Function | What it draws |
|---|---|
| `drawRain(ctx, time, { x, y, width, height, drops?, opacity?, color?, speed?, length?, slant?, lineWidth?, seed? })` | Streaks falling in a box (a window, or the whole frame), clipped to it. 70 drops at 900–1440 px/s by default; `seed` moves them. |
| `drawBlinds(ctx, { x, y, width, height, opacity?, slope?, spacing?, band?, color? })` | Key light through venetian blinds: parallel slanted bands (`slope` 0.35, every 52 px, 24 px thick). |
| `drawDarkness(ctx, { amount, cones?, holes?, bounds?, color?, opacity?, beam?, beamOpacity? })` | A dark overlay (`amount` 0–1) with torch beams and round holes cut out. A cone is `{ x, y, angle, length, width }`: from its apex toward `angle` degrees (0 right, 90 down), `width` half-wide at its end; a hole is `{ x, y, radius }`. Beams keep a little of the dark and a faint warm tint (`beam: null` for none). `coneCorners(cone)` gives a beam's corners. |
| `drawGlow(ctx, { x, y, radius, color?, opacity? })` | A soft pool of light (a lamp, a lit window): a radial gradient to clear. |
| `drawVignette(ctx, { width, height, x?, y?, inner?, outer?, opacity?, color? })` | The frame's edges fall into dark, from `inner` to `outer` of the half-diagonal. |
| `lightningFlash(time, strikes, decay?)` | Flash brightness 0–1 from strike times; fill the frame with a pale blue at about 0.25 × this. |
| `lightFlicker(time, strength?)` | A failing bulb: 0 or `strength`, in an irregular but repeatable rhythm; darken the room by it. |

Colours may be `#rgb`, `#rrggbb`, `rgb()` or `rgba()`; opacities multiply in.

## Detective overlays

| Function | What it draws |
|---|---|
| `drawClueMarker(ctx, time, { x, y, radius?, at, duration?, color?, lineWidth? })` | The red magnifier over a clue (or a red herring): pops on at `at`, pulses, fades out over the last 400 ms of `duration` (3000). Returns its opacity; `clueMarkerAt(time, { at, duration })` gives `{ opacity, scale }`. |
| `drawEvidenceFolder(ctx, { x, y, scale?, angle?, color?, ink?, label?, font? })` | A tabbed folder (68 × 48 px at scale 1), tilted `angle` degrees, with an optional short label. |
| `drawClockFace(ctx, { x, y, radius?, hours, minutes, face?, ink? })` | A wall clock showing a time; `clockHandAngles(hours, minutes)` gives the hands. |
| `drawTimeChip(ctx, time, { x, y, text, size?, font?, color?, background?, at? })` | A time or place chip (amber on black) that fades in; returns its width. |
| `drawNameCard(ctx, time, { name, role?, at, duration?, anchor, side?, frame?, dim?, color?, nameSize?, roleSize?, font?, tilt? })` | The freeze-frame suspect card: the frame dims (`dim` 0.35) and a slanted red band names them beside their head (`anchor`), on the side with room (`side: 'auto'`). Returns its opacity. |
| `drawNarrationBox(ctx, time, { text, start, end, speaker?, x?, width?, bottom?, size?, font?, background?, ink?, tagColor?, typeDuration? })` | A first-person narration box along the bottom: cream paper, the narrator's tag, the words typed on a whole word at a time (so every script types cleanly). `lineReveal(time, start, end)` gives `{ opacity, reveal }`. |
| `drawSpeechBubble(ctx, time, { text, start, end, tail, speaker?, maxWidth?, size?, font?, bounds?, maxCenterY?, gap?, fill?, ink? })` | A crisp comic bubble above the speaker, its tail to `tail` (their head), kept inside `bounds`; pops on at `start`, shrinks away after `end`. |

The defaults fit a 1920 × 1080 frame; pass `frame`, `bounds` or `x`/`width`
for another size. Draw overlays after the camera's transform is undone (in
screen space) and map heads with your camera, as `cameraPoint` does.

## The case board

A board is plain data: cards (photos of suspects, notes about clues), strings
between them and the marker's work, each with a time.

```js
import { caseBoard, drawCaseBoard, caseBoardMarkerTip, drawCharacter, humanPose } from '@algorisys/tinyfly/characters'

const board = caseBoard({
  x: 60, y: 110, width: 1800, height: 900,
  cards: [
    { id: 'title', x: 900, y: 40, kind: 'note', title: 'WHO CUT THE ALARM?', width: 520, height: 96 },
    { id: 'lift', x: 900, y: 300, title: 'Lift 2', note: 'stuck at 9:40' },
    { id: 'guard', x: 330, y: 540, title: 'The guard', note: 'had the key', at: 700 },
    { id: 'wire', x: 1450, y: 220, kind: 'note', title: 'alarm wire: cut', at: 1400 },
  ],
  strings: [{ from: 'lift', to: 'guard', at: 1000 }, { from: 'lift', to: 'wire', at: 1400 }],
  marks: [
    { on: 'guard', kind: 'cross', at: 3200 },
    { on: 'title', kind: 'scribble', at: 6000, duration: 1200 },
  ],
})

const nib = drawCaseBoard(ctx, board, time, {
  drawCard: (ctx, card, area) => { /* draw a portrait inside area (clipped), in the card's frame */ },
})
if (nib) drawMarkerHand(ctx, nib)   // your own hand or pen, at the marker's nib
```

- **Cards**: `{ id, x, y, kind?, title?, note?, width?, height?, angle?, color?, at?, highlight? }`.
  `x`, `y` is where the card is pinned (its top centre), relative to the
  board. `kind: 'photo'` (default, 220 × 260) is a print with a dark picture
  area, a bold title and a red note; `kind: 'note'` (220 × 124) is a yellow
  slip with the title and note in `handFont`. A card pops up onto its pin at
  `at`; `highlight: { at, duration }` pulses an amber outline round it. Tilts
  default to a small seeded angle.
- **Strings**: `{ from, to, at?, duration?, color? }`, red string stretching
  from one pin to the other over `duration` (600 ms), under the cards.
- **Marks**: `{ on, kind, at, duration?, color?, width? }`, the marker drawn
  on over `duration` (1400 ms): `cross` (two diagonals, one after the
  other: ruled out), `strike` (one diagonal: half ruled out), `scribble` (a
  zigzag across the card: scribbled out) and `circle` (a loose ring round
  it). Marks stay once drawn.
- `caseBoard` checks the board and resolves every default; an unknown card
  id or kind throws with a did-you-mean.
- `drawCaseBoard(ctx, board, time, { drawCard })` returns the marker's nib
  while a mark is being drawn (else null), as does
  `caseBoardMarkerTip(board, time)`: put a hand there. `caseCardBox(board, id)`
  gives a card's pin, centre and corners; `caseMarkPath(board, mark)` a
  mark's stroke points; `drawPushPin` and `drawMarkerStroke(ctx, points,
  progress)` draw single pieces for your own boards.

## With the characters

The [bean figures](character-appearance.md#bean-figures-white-outlined-stick-figures)
come dressed for it: `castMember('beanDetective')` wears a trench coat, a
fedora and aviator shades, and household clothes (`skirt`, `drape`,
`bangles`; `castMember('beanSari')`) dress the witnesses. Draw a suspect in a
photo card through `drawCard`, and anchor a name card or a speech bubble at a
figure's head from `characterJoints`.

## In the catalog

`npx tinyfly capabilities` lists the kit under "Noir / detective kit";
`capabilities().noir` has it as data (`NOIR_KIT`).
