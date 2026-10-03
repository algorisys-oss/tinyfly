# Video from code: example scenes

Each `.mjs` file here default-exports a tinyfly video scene. Render one to MP4
without a browser (needs `ffmpeg` on the PATH and `npm install @napi-rs/canvas`):

```bash
npx tinyfly video examples/headless-video/stick-figure.mjs --srt stick-figure.srt
npx tinyfly video examples/headless-video/bar-chart.mjs --stills stills/
npx tinyfly video examples/headless-video/cairo-style.mjs --scale 0.5 --fps 12
```

In this repository, run `npm run build:libs` first so `@algorisys/tinyfly`
resolves to the built package.

| Scene | Shows |
|---|---|
| `stick-figure.mjs` | Narration timing (`planNarration`), the `characters` stick figure posed, walked and voiced by tracks, a per-scene backdrop, captions |
| `bar-chart.mjs` | Timeline targets only: the whole animation is JSON |
| `cairo-style.mjs` | Pure immediate mode: a duration and `draw(ctx, { time })` |
| `pencil-sketch.mjs` | A Pencilmation-style gag: the `sketch` style (pencil strokes with line boil) on the figure, `sketchPen` for the ground and the pencil |
| `eraser-gag.mjs` | Erasing: `erasable()` rubs out the figure's forearm on an `erase` track, `withErased()` takes the ground from under it |
| `rubber-hose.mjs` | Squash and stretch (`stretch` in poses, `crouch` / `jump`) and rubber-hose limbs (`style.rubber`, a `rubber` track blending to jointed and back) |
| `human-turnaround.mjs` | Characters v2 (milestone 1): one skeleton in 3D drawn flat, turned front to back in stick, fluid, clothed, pencil and silhouette rows; contact poses (sit, kneel, crouch, crawl, lie down, jump); reaching; one pose in every look. Kept in [`docs/model-sheet/`](../../docs/model-sheet/) |
| `map-route.mjs` | An animated trip on the offline world map (no network): the camera flies in to India (`mapFlyTracks`), pins drop on Mumbai, Delhi and Kathmandu as a flight path draws itself (`routeStops`) and a plane travels it; a caption stays on the map (`mapAt`). See [docs/maps.md](../../docs/maps.md) |
| `model-sheet.mjs` | A character model sheet (a still): two dressed figures in five turnaround views via `turn` and `facing`, clothes and hair as `style.layers`, height guides from `stickFigureJoints()`, colour swatches and expression close-ups. Kept in [`docs/model-sheet/`](../../docs/model-sheet/) |
| `hand-shapes.mjs` | Cartoon hands (a still): every `HAND_SHAPES` entry from the back, 3/4, thumb side and palm, a left hand in pencil, four-fingered gloves, silhouettes, a fist opening by `mixHandPoses`, and the animator's hand (`drawHand`) built on the same rig. Kept in [`docs/model-sheet/`](../../docs/model-sheet/); see [docs/cartoon-hands.md](../../docs/cartoon-hands.md) |
| `drawing-hand.mjs` | The animator's hand: `drawnPathTarget()` draws the ground and a sun on (`draw` tracks), `erasable(…, { hand: true })` rubs the sun out |

The guide is [docs/video-rendering.md](../../docs/video-rendering.md). The unit
tests (`src/headless/examples.test.ts`) draw every still of every scene here.
