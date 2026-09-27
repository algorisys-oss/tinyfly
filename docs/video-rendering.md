# Rendering Video from Code

tinyfly can render a complete animation to an MP4 **without a browser**: write a
scene in JavaScript, run one command, get a video (plus captions and PNG stills
for checking). This is the workflow of Cairo or Processing scripts, with
tinyfly's timeline, easing and JSON on top.

```bash
npm install @algorisys/tinyfly @napi-rs/canvas   # @napi-rs/canvas: the 2D canvas for Node
# ffmpeg must be on the PATH

npx tinyfly video scene.mjs -o scene.mp4 --srt scene.srt
npx tinyfly video scene.mjs --stills stills/     # one PNG per marker step
npx tinyfly video scene.mjs --scale 0.5 --fps 12 # quick preview
```

Runnable scenes are in [`examples/headless-video/`](../examples/headless-video/):
a narrated stick figure (`stick-figure.mjs`), a bar chart made only of timeline
targets (`bar-chart.mjs`) and a pure immediate-mode sketch (`cairo-style.mjs`).
The Examples gallery's **Video** category has a **Narrated Scene** card that
plays the same idea live in the browser.

## The scene

A scene module default-exports a `VideoScene` (or a function, sync or async,
that returns one):

```js
export default {
  width: 1920,
  height: 1080,
  fps: 30,                      // default 30
  duration: 5000,               // ms; defaults to the timeline's duration
  timeline,                     // a TimelineDefinition (plain JSON)
  targets: { … },               // canvas targets the timeline animates, by id
  background: '#fff',           // a colour, 'transparent', or a draw function
  draw(ctx, frame) { … },       // immediate-mode drawing over the targets
  audio: 'narration.wav',       // muxed in; relative to the scene file
  fonts: { Poppins: 'fonts/Poppins-Bold.ttf' },
  captions: [ { start, end, text } ],  // default: from the timeline's markers
}
```

Every frame is drawn from scratch at an exact time (`frame / fps`): background,
then the targets at the timeline's state, then `draw`. The output is
deterministic: the same scene renders the same pixels, in any frame order.

There are three ways to draw, and they mix freely:

| | What it is | Good for |
|---|---|---|
| **Targets** | `rect`, `circle`, `text`, `line`, `path`, `image` animated by timeline tracks | Anything the editor can make; stays pure data |
| **Custom targets** | A target whose `draw` function is code; the timeline animates its values | Characters, charts, props: drawn by code, driven by keyframes |
| **`background` / `draw`** | Functions of `(ctx, { time, index, state, width, height })` | Backdrops, captions, one-off effects, porting Cairo scripts |

## Custom targets

A `custom` canvas target is drawn by a function, but positioned, faded, rotated
and scaled like any other target, and its own values are animated by tracks:

```js
const figure = {
  type: 'custom',
  x: 500, y: 300, width: 120, height: 300,  // the box is the transform pivot
  props: { arm: 0, mouth: 0 },               // values tracks may animate
  draw(ctx, target, time) {
    // ctx is already translated to (x, y), with opacity/transforms applied
    const { arm, mouth } = target.props
    …
  },
}
```

A track whose `property` is a key of `props` writes into `props`; `x`, `y`,
`opacity`, `rotate`, `scale` and the other base properties work as for every
canvas target. Only keys declared in `props` are routed there, so every animated
value is listed up front. This works in the browser too: `CanvasAdapter` renders
custom targets anywhere.

## Timing from narration

For a narrated video, the voice sets the timing. `planNarration` lays out scenes
of spoken lines from their clip lengths, with a lead before each scene's first
line, a gap between lines and a tail after the last:

```js
import { planNarration, narrationMarkers, narrationSceneAt } from '@algorisys/tinyfly'

const plan = planNarration(
  [
    { id: 'intro', lines: [{ text: 'Meet the figure.', duration: 1400 }] },
    { id: 'wave', lines: [{ text: 'It waves,', duration: 1200 }, { text: 'and talks.', duration: 1500 }], tail: 400 },
  ],
  { lead: 350, gap: 300, tail: 550 } // the defaults, in ms
)

plan.duration        // total ms
plan.scenes          // [{ id, start, duration, cues }]
plan.cues            // [{ id: 's0-l0', scene, line, start, end, text }, …]
narrationMarkers(plan)          // one marker per line: { id, time, label }
narrationSceneAt(plan, time)    // the scene playing at a time
```

Use `cue.start` / `cue.end` as keyframe times, put `narrationMarkers(plan)` in
the timeline's `config.markers` (stills and players step through them), and pass
`captions: plan.cues` so the caption file covers exactly the spoken spans. The
audio must be assembled with the same pauses, or from the cue times.

## Captions

`toSRT(cues)` and `toWebVTT(cues)` (in `@algorisys/tinyfly/export` and
`@algorisys/tinyfly/headless`) write caption files from `{ start, end, text }` cues.
`captionCuesFromTimeline(definition, { language })` makes cues from a timeline's
markers: each marker's caption (or label) runs until the next marker.

## From a script

The CLI is a thin wrapper over `@algorisys/tinyfly/headless`:

```js
import { renderVideo, renderStills, sceneCaptions, toSRT } from '@algorisys/tinyfly/headless'
import { writeFileSync } from 'node:fs'
import scene from './scene.mjs'

await renderVideo(scene, {
  output: 'out.mp4',
  baseDir: '.', // relative audio and font paths resolve against this
  scale: 1, crf: 20, preset: 'medium',
  onProgress: (done, total) => {},
})
await renderStills(scene, { dir: 'stills' })
writeFileSync('out.srt', toSRT(sceneCaptions(scene)))
```

`FrameRenderer` (also exported) draws a scene at any time onto any 2D context.
It needs no Node API, so the same scene can be previewed on a browser canvas:

```js
const renderer = new FrameRenderer(scene)
renderer.render(canvas.getContext('2d'), timeMs)
```

## Porting a Cairo script

| Cairo / pycairo | tinyfly |
|---|---|
| `draw(ctx, t, T)` per scene | `draw(ctx, { time })`, with `narrationSceneAt(plan, time)` to pick the scene |
| `T.s(i)`, `T.e(i)`, `T.on(i, t)` | `plan.scenes[n].cues[i].start` / `.end`, `time >= cue.start` |
| `ease(seg(t, a, b))` | a keyframe track with an easing, or `getEasingFunction('ease-out')` in code |
| `ctx.set_source_rgb`, `ctx.arc`, `ctx.stroke` | the Canvas 2D API: `fillStyle`, `arc`, `stroke` |
| `ctx.push_group` + `paint_with_alpha` | `globalAlpha`, or a target's `opacity` track |
| Reusable helpers (`figure()`, `tag()`) | custom targets, or plain functions called from `draw` |
| ffmpeg pipe + `write_srt` | `tinyfly video … --srt` |

## Requirements and limits

- Node 18+, `@napi-rs/canvas` (an optional peer dependency, loaded only when
  rendering) and `ffmpeg`. Rendering defines `globalThis.Path2D` from the canvas
  package when it is missing, because path targets use it.
- Output is H.264 MP4 (`yuv420p`, odd sizes padded to even), with AAC audio when
  `audio` is set; video stops at the shorter of picture and sound.
- `image` targets need images loaded with the canvas package's `loadImage`.
