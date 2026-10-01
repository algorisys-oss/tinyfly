# Rendering Video from Code

tinyfly can render a complete animation to an MP4 **without a browser**: write a
scene in JavaScript, run one command, get a video (plus captions and PNG stills
for checking). This is the workflow of Cairo or Processing scripts, with
tinyfly's timeline, easing and JSON on top.

```bash
npm install @algorisys/tinyfly @napi-rs/canvas   # @napi-rs/canvas: the 2D canvas for Node
# ffmpeg must be on the PATH

npx tinyfly video scene.mjs -o scene.mp4 --srt scene.srt
npx tinyfly video scene.mjs --stills stills/     # one PNG per caption line (else per marker step)
npx tinyfly video scene.mjs --scale 0.5 --fps 12 # quick preview
```

Runnable scenes are in [`examples/headless-video/`](../examples/headless-video/):
a narrated stick figure (`stick-figure.mjs`), a bar chart made only of timeline
targets (`bar-chart.mjs`), a pure immediate-mode sketch (`cairo-style.mjs`) and a
pencil-test gag on notebook paper with boiling lines (`pencil-sketch.mjs`), an
eraser gag that rubs out the figure's arm and then the ground under it (`eraser-gag.mjs`),
squash, stretch and rubber-hose limbs in a jump and a noodle-arm wave (`rubber-hose.mjs`), and
the animator's hand drawing the ground and a sun, then erasing the sun (`drawing-hand.mjs`).
The Examples gallery's **Video** category has a **Narrated Scene** card that
plays the same idea live in the browser, a **Stick Figure** card for trying
the poses, and a **Pencil Sketch** card that plays the drawing-hand gag live with
toggles for the pencil, the boil rate and rubber limbs.

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

### From recorded lines

With a voice-over recorded (or synthesised) one clip per line, let the clips set
the timing. `voiceNarration` decodes every clip with ffmpeg, measures it from its
samples, lays the lines out with `planNarration`, and writes the whole narration
as one WAV whose lines start exactly at their cue times:

```js
import { voiceNarration } from '@algorisys/tinyfly/headless'

const { plan, audio } = await voiceNarration(
  [
    { id: 'intro', lines: [{ text: 'Meet the figure.', audio: 'voice/01.wav' }] },
    { id: 'wave', lines: [{ text: 'It waves,', audio: 'voice/02.wav' }, { text: 'and talks.', audio: 'voice/03.mp3' }] },
  ],
  { output: 'build/narration.wav', baseDir: new URL('.', import.meta.url).pathname, sampleRate: 48000 }
)

export default { /* …timeline built from plan… */ audio, captions: plan.cues }
```

Scene modules may use top-level `await`, or default-export an async function.
`assembleNarration(plan, clips, sampleRate)` and `encodeWav(samples, sampleRate)`
are the pure steps underneath, for audio you generate yourself.

## Characters

`@algorisys/tinyfly/characters` has a poseable stick figure. A pose is a set of
numbers (joint angles in degrees, plus the face: eyes, brows, mouth and gaze), so
poses blend and every joint can be a timeline track. It is also on the script-tag
bundle's `tinyfly` global (`tinyfly.drawStickFigure`, `tinyfly.POSES`, …):

```js
import { stickFigureTarget, poseTracks, POSES } from '@algorisys/tinyfly/characters'

targets: {
  hero: stickFigureTarget({
    x: 640, y: 620,                 // where the feet stand
    style: { height: 340, color: '#1e3a8a', headFill: '#f2c49b', label: 'HERO', facing: 1 },
  }),
},
timeline: {
  id: 'hero',
  config: { duration: 4000 },
  tracks: [
    ...poseTracks('hero', [
      { time: 0, pose: 'rest' },
      { time: 400, pose: 'wave', easing: 'ease-out' },
      { time: 2000, pose: { rightShoulder: 90, rightElbow: 0 } }, // changes from the last key
      { time: 2600, expression: 'surprised' },                   // only the face changes
      { time: 3200, pose: 'shrug', expression: 'confused' },     // body and face
    ]),
    // Walking and talking are props too
    { id: 'walk', target: 'hero', property: 'walk', keyframes: [{ time: 0, value: 0 }, { time: 2000, value: 3 }] },
    { id: 'walking', target: 'hero', property: 'walking', keyframes: [{ time: 0, value: 1 }, { time: 2000, value: 0 }] },
    { id: 'talk', target: 'hero', property: 'talk', keyframes: [{ time: 2000, value: 1 }, { time: 3500, value: 1 }] },
  ],
},
```

| | |
|---|---|
| `POSES` | `rest`, `wave`, `cheer`, `shrug`, `point`, `think`, `handsOnHips`, `sad`, `surprised`, `crouch` (squashed), `jump` (stretched) |
| `EXPRESSIONS` | `neutral`, `happy`, `joyful`, `sad`, `crying`, `surprised`, `shocked`, `angry`, `furious`, `worried`, `scared`, `confused`, `skeptical`, `thinking`, `sleepy`, `disgusted`, `smug`, `wink` |
| `withExpression(pose, face)` | The pose with its face replaced: a name, or face fields to change |
| `pose(changes)` | A full pose from the joints that differ from rest |
| `blendPose(a, b, t)` | Linear blend of two poses |
| `walkPose(phase, base?, stride?)` | A stride at `phase` (0 → 1 is one cycle): legs scissor, hanging arms swing against them; raised arms and the face keep `base` |
| `strideLength(height)` | Ground one walk cycle covers; set `walk` to distance / stride length (with the same easing as `x`) so the feet stay planted |
| `talkingMouth(time)` | A deterministic 0..1 chatter |
| `drawStickFigure(ctx, pose, style, time?)` | Draw with the feet at (0, 0), for `draw` functions; `time` picks the boil frame of a `sketch` style |
| `sketchPen(ctx, sketch, time)` | Hand-drawn `line(points)`, `curve(points)`, `circle(cx, cy, r)` and `ellipse(cx, cy, rx, ry)` strokes with line boil; each takes a last `progress` (0..1) to draw it on |
| `stickFigureTarget({ x, y, pose, style })` | A `custom` target whose props are the pose plus `walk`, `walking`, `talk`, `rubber` |
| `rubberLimb(root, joint, end, rubber)` | Points along a limb, from jointed (0) to a rubber-hose curve through the joint (1) |
| `poseTracks(target, keys)` | Tracks for a sequence of named or partial poses, each optionally with an `expression`; only fields that leave rest get a track |

Angles are degrees from hanging straight down; positive raises a limb outward.
Elbows add to the upper arm's angle (past 180° the forearm folds back in), and
knees swing the shin back toward the centre. The module is browser-safe, so the
same figure draws on a web page's canvas.

### Faces

Every face feature is a number too, so expressions blend and animate like joints:

| Field | Range |
|---|---|
| `leftEye`, `rightEye` | 0 shut, 1 normal, up to 1.6 wide (the whites show above about 1.2) |
| `blink` | 0..1, closes both eyes on top of their openness |
| `leftBrow`, `rightBrow` | -1 lowered, 0 rest, 1 raised |
| `browTilt` | -1 angry (inner ends down) to 1 worried (inner ends up) |
| `lookX`, `lookY` | -1..1: where the pupils point (+x is the way the figure faces, +y is down) |
| `mouth` | 0 closed to 1 wide open |
| `smile` | -1..1: a frown or smile when closed; open, a wail (-) or a grin (+) |
| `mouthWidth` | 1 normal, 0.5 pursed, 1.5 wide |

Shut eyes arch upward when the figure smiles (a laugh) and curve down otherwise.
`talk` sets only `mouth`, so a figure keeps its expression while it speaks.

### Squash, stretch and rubber limbs

Two more numbers give the figure cartoon acting:

- **`stretch`** is part of the pose (1 normal). Above 1 the figure is taller and
  thinner, as in a jump; below 1 it squashes, as in a wind-up or a landing. The
  body and legs scale by it, the arms by its square root, the head becomes an
  ellipse of the same area, and the feet stay on the ground. `POSES.crouch`
  and `POSES.jump` carry a squash and a stretch, and any key can set it:

  ```js
  ...poseTracks('hero', [
    { time: 0, pose: 'rest' },
    { time: 400, pose: 'crouch', easing: 'ease-out' },        // wind up
    { time: 560, pose: 'jump', easing: 'ease-out' },          // spring
    { time: 1200, pose: { stretch: 0.75 } },                  // land
    { time: 1400, pose: { stretch: 1.08 }, easing: 'ease-out' },
    { time: 1600, pose: { stretch: 1 }, easing: 'ease-in-out' }, // settle
  ]),
  ```

- **`rubber`** is how the limbs are drawn: 0 straight segments jointed at the
  elbows and knees, 1 smooth rubber-hose curves through them, in between a blend.
  Set it on the style (`style: { rubber: 1 }`) for a rubber-hose character. It is
  also a prop of `stickFigureTarget`, so a `rubber` track can stiffen and loosen
  the limbs. It lives on the style rather than in the pose so that a named
  pose never resets it.

A pose written before `stretch` existed draws unstretched.

### Pencil sketch style

For a hand-drawn, pencil-test look, give the figure a `sketch` style. Each line
is drawn in a few slightly bowed passes, the head is a circle whose end
overshoots its start, and the wobble *boils*: it is redrawn a few times a second,
so the figure looks alive even standing still.

```js
stickFigureTarget({
  x: 640, y: 560,
  style: { height: 300, color: '#2f2f33', lineWidth: 6, headFill: 'none',
           sketch: { roughness: 3, passes: 2, boil: 8, seed: 7 } },
})
```

| `sketch` field | |
|---|---|
| `roughness` | Largest wobble in px (default 2) |
| `passes` | Strokes per line: 1 clean, 2–3 sketched (default 2) |
| `boil` | Redraws per second; 0 holds the wobble still (default 8) |
| `seed` | So two drawings do not boil in step (default 1) |

Canvas shapes take the same style: a `rect`, `circle`, `line` or `path` target
with `sketch: { … }` draws its outline in pencil (the fill stays clean), and a
`drawOn` track (0..1) draws it on. See the [API reference](api-reference.md#canvasadapter).

The same strokes are available for anything you draw yourself, such as ground
lines and props in `background` or `draw`:

```js
import { sketchPen } from '@algorisys/tinyfly/characters'

background(ctx, { time }) {
  const pen = sketchPen(ctx, { roughness: 3, seed: 2 }, time)
  ctx.strokeStyle = '#2f2f33'
  ctx.lineWidth = 5
  pen.line([{ x: 60, y: 560 }, { x: 700, y: 562 }])
  pen.circle(900, 200, 40)
}
```

The wobble comes from a generator seeded by `seed`, the boil frame
(`boilFrame(time, boil)`) and the stroke's place in the drawing order, never
`Math.random`, so a frame renders the same every time. Draw strokes in the same
order each frame.

Every stroke takes a last `progress` argument (0..1) to draw it on:
`pen.line(points, 0.4)` draws the first 40% of the line. The part drawn so far
lies exactly on the finished stroke, so it grows without jumping, and a stroke
drawn partway does not change the wobble of the strokes after it. `drawStickFigure(ctx, pose, style, time)` takes
the time for the same reason.

### The drawing hand

The animator's hand draws things into the scene. `drawnPathTarget()` is a
custom target that draws a stroke on: its `draw` prop (0..1) is a track, and
while it is between 0 and 1 a cartoon hand holds the pencil at the end of the
line, its arm reaching in from off screen.

```js
import { drawnPathTarget, circlePath } from '@algorisys/tinyfly/characters'

targets: {
  ground: drawnPathTarget({ path: [{ x: 80, y: 560 }, { x: 1200, y: 560 }], sketch: { roughness: 3 } }),
  sun: drawnPathTarget({ path: circlePath(1000, 180, 70), smooth: true, sketch: { roughness: 3 } }),
},
// …and in the timeline:
{ id: 'g', target: 'ground', property: 'draw', keyframes: [{ time: 600, value: 0 }, { time: 2400, value: 1 }] }
```

The path is in scene coordinates. `smooth: true` draws a curve through the
points instead of straight segments; `hand: false` hides the hand, and a
`HandStyle` changes it. `erasable(target, { path, hand: true })` puts the same
hand on the eraser.

| | |
|---|---|
| `drawnPathTarget({ path, smooth?, color?, lineWidth?, sketch?, hand? })` | A target with a `draw` prop (0..1) that draws the path on, with the hand at its end |
| `drawHand(ctx, at, style?, pen?)` | A hand holding a pencil (or `tool: 'eraser'`) with the tool's tip at `at`; `angle`, `scale`, `skin`, `sleeve`, `outline` |
| `drawPencil(ctx, at, style?, pen?)` | Just the pencil, tip at `at` |
| `circlePath(cx, cy, r, overshoot?)` | A circle as points from the top, a little past a full turn, for drawing on |

### Erasing

An eraser travels along a path and rubs out whatever is under the part it has
covered. How far it has got is one number, 0..1, so erasing is a timeline track.

Wrap a custom target in `erasable()` and it gains an `erase` prop:

```js
import { erasable, scrubPath, stickFigureTarget } from '@algorisys/tinyfly/characters'

targets: {
  doodle: erasable(stickFigureTarget({ x: 640, y: 560, style }), {
    path: scrubPath(196, 70, 58, 50, 7), // back and forth over a box, in the target's own box
    width: 26,                           // eraser width, px
  }),
},
// …and in the timeline:
{ id: 'rub', target: 'doodle', property: 'erase', keyframes: [{ time: 800, value: 0 }, { time: 2600, value: 1 }] }
```

The path is in the target's own box (0, 0 is its top-left), so the erased part
moves with the target. It does not follow a limb: if an erased arm moves, the
gap stays where the arm was. The eraser is drawn while `erase` is between 0 and
1; pass `eraser: false` to hide it, or an `EraserStyle` to change it.

For things you draw yourself, `withErased()` erases from them by time:

```js
import { withErased, pointAlong, drawEraser } from '@algorisys/tinyfly/characters'

background(ctx, { time }) {
  const progress = Math.min(1, Math.max(0, (time - 4500) / 1900))
  withErased(ctx, GROUND_SCRUB, 30, progress, () => drawGround(ctx, time))
},
draw(ctx, { time }) {
  const progress = Math.min(1, Math.max(0, (time - 4500) / 1900))
  if (progress > 0 && progress < 1) drawEraser(ctx, pointAlong(GROUND_SCRUB, progress))
},
```

| | |
|---|---|
| `erasable(target, { path, width?, eraser? })` | The target with an `erase` prop (0..1) that rubs it out along `path` |
| `withErased(ctx, path, width, progress, draw)` | Run `draw` with the swath erased from it |
| `clipErased(ctx, path, width, progress)` | The clip itself, for use between your own `save()` and `restore()` |
| `scrubPath(x, y, width, height, strokes?)` | A back-and-forth path covering a box |
| `drawEraser(ctx, at, style?, pen?)` | A block eraser with its rubbing end at `at` (sketched when given a `sketchPen`) |
| `erasable(…, { hand: true })` | The eraser is held by the animator's hand |
| `partialPath(path, t)`, `pointAlong(path, t)`, `pathLength(path)` | Polyline helpers: the start of a path, the point at `t` of its length, its length |

Erasing cuts the swath out with clipping, not an offscreen layer, so it needs
only a Canvas 2D context. Only what is drawn inside it is erased: whatever was
drawn earlier (the paper, the background) shows through.

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
| `figure()`, `blend_pose()`, `walker()` | `stickFigureTarget`, `blendPose`, `walkPose` from `@algorisys/tinyfly/characters` |
| TTS clips → `narration.wav` (`build_timeline`) | `voiceNarration()` |
| Other helpers (`tag()`, `quote_card()`) | custom targets, or plain functions called from `draw` |
| ffmpeg pipe + `write_srt` | `tinyfly video … --srt` |

### Benchmark: one scene of a real Cairo video

Scene 8 of a published pycairo explainer ("the table grows": 12 stick figures
round a growing table, flying envelopes, a doorway, a quote card, a waiting
room) was ported call for call to Canvas 2D and rendered at 1920×1080, 24 fps,
1202 frames, with the same x264 settings (`medium`, CRF 20). Same machine, no other load:

| | pycairo | tinyfly (`@napi-rs/canvas`) |
|---|---|---|
| Draw only | 24.4 s (20.3 ms/frame) | 5.4 s (4.5 ms/frame) |
| Draw + encode to MP4 | 46.5 s | 52.3 s |

- Drawing is about 4.5× faster. The finished video is not: both renders spend
  most of their time in x264, so the encoder sets the pace.
- The stills match frame for frame (mean pixel difference about 1/255). What
  differs is text: Skia draws glyphs slightly narrower than Cairo.
- The port was 235 lines for the scene (the Python was 125) plus 368 lines of
  helpers carried over from the Cairo engine: tags, top captions, quote cards,
  the round table, envelopes, doors, camera drift and a figure matching the
  original proportions. Those helpers are what tinyfly still lacks, not engine
  features.

## Requirements and limits

- Node 18+, `@napi-rs/canvas` (an optional peer dependency, loaded only when
  rendering) and `ffmpeg`. Rendering defines `globalThis.Path2D` from the canvas
  package when it is missing, because path targets use it.
- Output is H.264 MP4 (`yuv420p`, odd sizes padded to even), with AAC audio when
  `audio` is set; video stops at the shorter of picture and sound.
- `image` targets need images loaded with the canvas package's `loadImage`.
