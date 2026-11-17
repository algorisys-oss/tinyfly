# Cosmic Explainer Scenes

A kit for animated science explainers in the bright, flat, glowing look of
popular science channels: a saturated gradient sky per scene, drifting dust
and soft bokeh for depth, flat-shaded shapes with no outlines (a sphere with a
shadow crescent and a highlight, an isometric cube, a probability haze),
zooming through scale with growing portals (a hand → skin → cells → one atom),
burned-in short captions two words at a time, label chips, and sound effects
made from numbers.

Every function draws on a Canvas 2D context, takes the time in ms and plain
options, and draws the same thing for the same input: particles sit where a
hash of their index puts them, never `Math.random`, so a frame looks the same
whether it is rendered in order, out of order or scrubbed to. Text is yours
(any script that separates words with spaces, Devanagari included) and so are
the fonts. Pair it with the noir kit's `drawGlow` and `drawVignette`, the
scene's `bloom`, and the characters.

```js
import { drawSkyGradient, drawDust, drawBokeh, drawShadedBall, drawHaze, drawZoomLevels,
  depthAt, levelPresence, drawShortCaption, drawLabelChip, drawGlow } from '@algorisys/tinyfly/characters'

const dive = [{ time: 1800, value: 0 }, { time: 3400, value: 1.35 }, { time: 5400, value: 2.35 }]
const atom = (ctx, time) => {
  drawSkyGradient(ctx, { width: 720, height: 1280, sky: 'space' })
  drawHaze(ctx, time, { x: 360, y: 576, radius: 120 })
  drawGlow(ctx, { x: 360, y: 576, radius: 60, color: '#fb923c' })
}

function frame(ctx, time) {
  const depth = depthAt(time, dive)
  drawZoomLevels(ctx, time, { width: 720, height: 1280, depth, levels: [hand, cells, atom], center: { x: 360, y: 576 } })
  drawBokeh(ctx, time, { width: 720, height: 1280, offset: { x: depth * 40, y: 0 } })
  drawDust(ctx, time, { width: 720, height: 1280, offset: { x: depth * 60, y: 0 } })
  if (levelPresence(depth, 2) > 0.5) drawLabelChip(ctx, time, { text: 'one atom', x: 360, y: 150, at: 5150 })
  drawShortCaption(ctx, time, { lines: narrationCues, x: 360, y: 920 })
}
```

`examples/headless-video/cosmic-explainer.mjs` is a whole 9:16 short built
this way, with its sound mix made entirely from the generators, and the
[Cosmic Dive](https://tinyfly.app/examples/live-cosmic-dive) example plays the
same dive at 16:9 in the browser (pause and scrub it).

## Skies and depth

| Function | Draws |
|---|---|
| `drawSkyGradient(ctx, { width, height, sky?, top?, bottom? })` | A vertical gradient filling the frame. `sky` is one of `COSMIC_SKIES`: `space`, `micro`, `magenta`, `cyan`, `lime`, `sunset`, `ocean`; or give `top` and `bottom`. An unknown name throws with the list. |
| `drawDust(ctx, time, { width, height, count?, color?, opacity?, size?, drift?, offset?, seed? })` | Twinkling specks in three parallax depths, wrapping round the frame. `drift` is px per second for the nearest layer; `offset` is the camera's shift (far specks move less). |
| `drawBokeh(ctx, time, { width, height, count?, color?, opacity?, minRadius?, maxRadius?, drift?, offset?, seed? })` | Big soft out-of-focus discs drifting across (foreground depth); they move 1.6× the camera offset. |

Give each scene a different sky, so a scene change reads even without a hard
cut, and keep dust and bokeh in every shot, so no frame is ever still.

## Flat-shaded shapes

| Function | Draws |
|---|---|
| `drawShadedBall(ctx, { x, y, radius, color, light?, shadow?, highlight?, opacity? })` | A sphere: the base fill, a darker crescent away from `light` (each axis −1..1, default top left), a small white highlight. No outline. |
| `drawIsoCube(ctx, { x, y, size, color, opacity?, sheen? })` | An isometric cube: lit top, a mid left face, a dark right face, an optional sparkle. `isoCubeFaces` gives the three polygons. |
| `drawHaze(ctx, time, { x, y, radius, color?, dots?, dot?, opacity?, squash?, spin?, seed? })` | A probability cloud of flickering dots, densest on a ring at `radius` (an electron shell). |
| `cosmicShade(color, amount, alpha?)` | The colour toward black (`amount` < 0) or white (> 0): the flat-shading palette from one base colour. |

Colours are `#rgb`, `#rrggbb` or `rgb()`; anything else throws, since the kit
has to shade it.

## Zooming through scale

The signature move: a dive from something you know down through levels of
scale. The levels are drawings, each `factor` times smaller than the one
before (default 14); one number, the **depth**, drives them all. Level *k* is
drawn at scale `factor ** (depth − k)` inside a circular portal at the zoom
centre, so the next level opens as a window in the middle of the current one
and grows until it fills the frame; levels hidden behind a covering portal are
not drawn.

| Function | |
|---|---|
| `depthAt(time, keys)` | The depth at a time, eased between `{ time, value }` keys. About `k + 0.35` shows level *k* filling the frame. |
| `zoomAt(time, keys)` | A zoom factor eased in log space (values > 0): halfway between 1× and 100× is 10×, so a dive feels steady. |
| `drawZoomLevels(ctx, time, { width, height, depth, levels, factor?, center?, portalRadius?, rim?, rimWidth? })` | Draw the visible levels; each level function draws itself at scale 1 around `center`. `rim: null` drops the glowing ring. |
| `zoomLevelLayout({ width, height, depth, levelCount, factor?, portalRadius? })` | Which levels draw at a depth, with their scale and portal radius. |
| `levelPresence(depth, level)` | 0..1: how fully a level fills the screen, to show or fade its label. |
| `drawPortalRim(ctx, x, y, radius, color?, width?)` | The glowing ring on its own (a lens edge, an inset). |

A level covers the frame once its portal reaches half the frame's diagonal: `portalRadius × factor^(depth − k) ≥ √(w² + h²) / 2`. With the defaults (520 px, ×14) that is depth `k + 0.28` on a 1920×1080 frame; a smaller `portalRadius` needs a deeper key before the level behind stops showing at the corners.

Time the depth keys to the narration: put each level's arrival on the word
that names it. For an endless, self-similar zoom (the same frame inside
itself forever) use `nestedZoom` from `tinyfly/adapters` instead.

## Short captions and chips

| Function | |
|---|---|
| `drawShortCaption(ctx, time, { lines, x, y, size?, font?, color?, shadow?, wordsPerChunk?, lowercase? })` | Burned-in captions one to three words at a time (default 2), lower case, boxless, with a drop shadow; returns the text drawn. `lines` are `{ text, start, end }` (narration cues fit as they are). Sit them at about 72% of the height in 9:16, 86% in 16:9. |
| `captionChunkAt(line, time, wordsPerChunk?)` | The chunk showing at a time: each chunk gets its share of the line by its share of the characters, close enough for a few words at a time. |
| `captionChunks(text, wordsPerChunk?)` | A line cut at spaces. |
| `drawLabelChip(ctx, time, { text, x, y, size?, font?, fill?, color?, at?, pop? })` | A rounded chip that pops on at `at`; returns its width. |
| `drawCornerNote(ctx, { text, x, y, size?, font?, color? })` | A small right-aligned note, such as `*not to scale`. |

## Sound effects from numbers

`@algorisys/tinyfly/headless` makes sound effects as mono `Float32Array`
samples, seeded and deterministic, with no files to find or license:
`soundWhoosh(rate, { duration?, rise?, seed? })` for zooms and cuts,
`soundPop(rate, { frequency?, duration? })` for chips, `soundThud(rate)` for
impacts, `soundShimmer(rate)` for reveals, `soundTick(rate)` for counters,
`soundClick(rate)` for a latch or padlock, and `soundPad(rate, { duration })`,
a slow ambient drone to mix low under narration.

`renderMix` layers take `samples` as well as `file`, so a mix needs no ffmpeg
decoding for them:

```js
import { renderMix, soundPad, soundWhoosh, soundPop } from '@algorisys/tinyfly/headless'

const audio = await renderMix([
  { id: 'voice', file: 'build/narration.wav' },
  { samples: soundPad(48000, { duration: END }), gain: 0.2, duck: { under: 'voice', amount: 0.5 } },
  { samples: soundWhoosh(48000), at: [3000, 5200], gain: 0.5 },
  { samples: soundPop(48000), at: [3300, 5500], gain: 0.4 },
], { output: 'build/mix.wav', duration: END, baseDir: here })
```

## Style notes

- One sky per scene; dust and bokeh always on; a slow push-in on every shot.
- A whoosh on every zoom or scene change, a pop on every chip, ticks for
  counters, a thud for impacts, a shimmer for reveals, a quiet pad under all.
- Anything drawn at an illustrative scale gets a `drawCornerNote` saying so;
  anything that claims a scale is drawn to it.
