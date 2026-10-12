# Building Animations with an LLM

tinyfly is built to be written by code, and that includes code a language
model writes. This page is for you, setting up an assistant (Claude Code,
Cursor, Copilot, a chat window), and for the assistant itself.

The short version: **read the catalog, write, check, look.**

## 1. Read the catalog first

Everything tinyfly can do, read from the library itself:

```bash
npx @algorisys/tinyfly capabilities          # markdown
npx @algorisys/tinyfly capabilities --json   # the same as data
```

It lists the easings, track kinds, every property each canvas shape can
animate (with units and ranges), the stick figure's joints, poses,
expressions, gags, gaits, beat actions, dances, flips and hand shapes, the v2
character's poses, native dances, expressions, builds, hairstyles, facial hair, glasses,
hats and cast, the code panel's languages, every surface's anchors and
edits (code panel, whiteboard, chart), camera shots and the teaching
helpers. It is generated from the code, so it can't
fall behind: **a name in it is accepted, and a name not in it is rejected.**
It is also the last part of `llms-full.txt`.

From code, the same catalog is `capabilities()` (and `capabilitiesMarkdown()`)
in `@algorisys/tinyfly/characters`.

## Props

For objects in a story (vehicles, trees, houses, furniture, aircraft,
animals, birds), use the presets (`car()`, `tree()`, `chair()`, `door()`,
`wheelchair()`, `helicopter()`, `dog()`, `goat()`, `owl()`…) with
`propTarget` and `propScript`; the catalog lists each preset's actions,
controls and anchors, and `checkPropBeats` checks prop beats. Furniture has
the places a figure uses it at as anchors (`seat`, `top`, `mattress`,
`handle`, `doorway`): aim beats at them rather than guessing a spot. For a
sky or a room behind everything use `scenery()` (or `scenePreset('park')`),
whose `hour`, `clouds`, `wind`, `rain` and `snow` are tracks, not a drawing
of your own. `style: 'stick'`
draws any prop as line art to go with stick figures. A bird's `lift` is in
metres: to perch it on a branch or a roof, work the height out from that
prop's anchor (`propAt(tree, frame, 'tree').anchor('branch')`). In a 3D
scene a prop is an object, `{ kind: 'prop', prop: 'car', position, rotation: [0, 90, 0] }` (`rotateY` is a track, not a field),
loaded with `kinds: [characterObjects, propObjects]`; its controls are tracks
on the object. Script it in world metres with `propScript3D` (`to: [x, z]`,
`through: [[x, z], …]`, `face`), not with `propScript`, whose `to` is screen px.
Characters in a 3D scene walk the same way with `characterScript3D`
(`{ do: 'walk', to: [x, z] }`, `pose`, `gag`, `face`, `place`, `say` with a
line, `look` at a point or `'camera'`); a rider is seated with `propRide3D`
and spliced into its script with `spliceTracks`. A film from a 3D scene is a
shot list (`shotTracks`, `transitionAt` + `drawTransition`), camera moves as
tracks (`cameraMoveTracks`, `cameraHandheldTracks`), a mood from
`lightingPreset('dusk')` with `ground()` and `shadow: true` on meshes, and
sound from `renderMix`; draw it with `depthBuffer: true` when shapes cross.
See `docs/props.md` and `docs/scene-3d.md`.

Native garba/dandiya use `humanDanceFrame(style, beat, base)` or
`humanDanceTracks(target, { style, bpm, beats })`, keeping heading independent
of local limb motion. `danceCircleAt` / `danceCircleTracks` coordinate a
formation's x/z travel, facing and foot plants. Sparse clip fields use base,
human/hand rest or zero defaults throughout the loop and JSON bakes.
Contacts alternate left/right each integer beat, starting left, with stance
through 0.6 of the beat; custom keys do not change this. For different
footwork use `plantFeet: false` and your own `plantDanceFoot` contacts.
Circle bakes require `beats` and default to 120 BPM (not the custom style's
tempo); explicit `count` must match the targets. Render with the bake's base
pose and build, since unchanged pose fields are omitted. Whole orbits and
routines close only when the extra body spins also total whole revolutions.
Zero-roll circle bakes use `rotateY`; with nonzero `pose.roll`, they use
pose `turn` (quarter-turns), include roll, and set `rotateY: 0` to preserve
yaw before roll and grounding. Supply roll when baking; apply all tracks
together without adding heading twice. Apply both `pose` and
`position` from `plantDanceFoot`; ankle/toe IK preserves authored `leg.*.rotate`
hip turn-out. `meetDandiya` gives paired poses and 3D
grip/tip segments with a `reached` flag. Build contact characters from the
rendered dancers' options so body proportions, line width and hands match.
Scripted dance entry and hand pose transitions use `HAND_REST` for missing
hand fields, preserving relaxed hands during preceding holds and explicit zeros.
Use `{ do: 'spin', turns: 2,
for: 1500 }` for full rotations: `face` takes the shortest route, so facing
360° does not spin. A script dance stays in place; `for` alone derives its
beat count at the BPM, and `beats` with `for` fits the beats into that duration.
Stick geometry and paired IK are separate from native frames and circle
bakes. See `docs/dance.md`.

## Characters with a look

A v2 character's appearance is plain options to `character()`, never drawing
code: `build` (`child`, `tall`, `short`…), `hair` (a style name, or
`{ style, color, length, … }`), `facialHair`, `glasses`, `hat`, `ears: true`,
`face: { teeth, tongue }` (shown when the mouth opens), `feet` (`round`,
`flat`, `pointed`, `big`) and `outfit: { shirt, trousers, over: 'hoodie' |
'cardigan' | 'overalls' | 'sari' | 'apron' | 'labCoat', shoes: 'boots' }`.
`castMember('grandpa', 300)` gives a whole ready-made character to start
from. The eight presets in `ANIME_CAST` (`animeBoy`, `animeGirl`,
`animeYoungMan`, `animeYoungWoman`, `animeMan`, `animeWoman`,
`animeOlderMan`, `animeOlderWoman`) work through `castMember` too.
Use `face: { style: 'anime', iris: '#4b7fce', lashes: true, ageLines: 0.6 }`
for coloured expressive eyes and optional creases; this is a face style,
not a `look` value. It uses the same expressions, blink, gaze and turn fields.
Age is proportions, hair, creases and clothes, never a stoop; a `cane` in a hand or
a `wheelchair()` to ride (`RIDING_POSES.wheeling`) is an accessory any
character can have. Expressions come from `HUMAN_EXPRESSIONS`
and are pose fields, as are the face marks `blush`, `tears` and `sweat` (0–1)
and the close-up fields `pupil`, `lid` and `bulge`, so any face goes with any
action or view; `drawCharacterHead(ctx, who, pose, { x, y, radius })` draws
just the head big, and `face: { nose, inPupil }` adds a nose and a drawing in
the pupils. Hair and hats turn with the head:
don't draw a different hairstyle per view. Hanging hair swings on its own:
after the character's tracks add `hairFollowTracks(target, tracks, who)` (or,
posing per frame, `hairFollow` once and `hairMotionAt(keys, t)` each frame)
rather than keying `hair.swing` by hand. Put things in hands with `holding`
(`{ right: 'mug' }`, `{ both: 'parcel' }`; the pose field `held.both` lets go),
and for two characters touching use `meetHands('handshake', a, b)` with the
two standing `meetingSpacing(…)` apart, `embrace(a, b)` for a hug at
`embraceSpacing` and `helpUp(helper, sitter, progress)` for a help-up at
`helpUpSpacing`, never two separate clips. See
`docs/character-appearance.md`.

## Surfaces

Code panels (`codePanel()`), whiteboards (`whiteboard()`), charts
(`chart()`) and props (`propSurface(propTarget(…))`) are surfaces: their places have names (`line:7`,
`token:4:Println`, `text:eq`, `term:eq:+ 4`, `bar:q4`) and their edits are
called by name (`surface.edit('highlight', 'line:4', { at })`). Write a scene
on one with `surfaceScript()`: beats aim at `{ surface, anchor }` and say what
the surface does in answer with `then`, at a moment of the beat (`at:
'contact'`, `'release'`…). A whiteboard's texts and marks and a chart's data
are declared up front, each with an id the places use. The catalog lists each
surface's places and edits. See "A whole scene as data", "Whiteboards" and
"Charts" in `docs/acting.md`.

## Your own behaviours

Write new actions with `defineAction()` (from beats, or as timed pose steps),
new gaits with `defineGait()`, and characters with `persona()`. Pass them where
they are used; `persona.describe()` and `capabilities(version, cast)` list them,
and the checks accept them. See "Your own actions, gaits and personas" in
`docs/acting.md`.

## 2. Ask a target what it can do

```js
import { stickFigureTarget, codePanel, describeTarget } from '@algorisys/tinyfly/characters'

describeTarget({ type: 'rect', x: 0, y: 0, width: 80, height: 40 })
// { type: 'rect', properties: [{ name: 'opacity', unit: '0..1', min: 0, max: 1, value: … }, …] }

describeTarget(stickFigureTarget({ x: 200, y: 300 }))
// { kind: 'stick figure', properties: [{ name: 'rightShoulder', unit: 'degrees', description: '…', value: 18 }, …],
//   actions: { walk: '…', grab: 'Steps to where its arm reaches the target …', … } }
```

Custom targets can describe themselves with `about` (`kind`, `summary`,
`props`, `actions`); the stick figure and the code panel do.
`animatableProperties(target)` is just the names.

## 3. Check before you play

Wrong names fail loudly, with the name that was probably meant:

```text
scriptTracks: 2 problem(s) in the beats:
  beat 0: Unknown action "jumpp": did you mean "jump"? Known: walk, bouncy, …
  beat 1: Unknown beat field "expression": did you mean "mood"? Known: do, at, for, …
```

- **Beat scripts**: `scriptTracks()` throws on errors. `checkBeats(beats)`
  returns errors and warnings without throwing, and from the command line:
  `npx @algorisys/tinyfly check beats.json`. For a v2 `character()` use
  `characterScript(target, who, beats, options)`: the same beats and checks,
  compiled for the human body and a `characterTarget` (its `walk`, `walking`
  and `gait` tracks step the gait as it draws); add
  `hairFollowTracks(target, tracks, who)` after it.
- **Tracks**: `checkTracks(tracks, targets)` finds tracks aimed at targets
  that aren't there, properties a target can't animate (`rotation` → `rotate`),
  keys out of time order, values of the wrong kind and values out of range.
- **Code panels** reject unknown languages and remove styles. `token()` throws
  when a line doesn't have the word.
- **Teaching timelines**: `npx @algorisys/tinyfly validate timeline.json --markup figure.svg`.

## 4. Look at it

An animation that compiles can still look wrong. Render frames and look at
them before calling it done:

```bash
npx @algorisys/tinyfly video scene.mjs --stills frames --times 0,800,1600,2400
npx @algorisys/tinyfly video scene.mjs --loop-check   # a looping video: does the frame at the duration match the first?
```

A model that can read images should look at the PNGs: is the hand on the
word, does the figure stand on the line, does the text land where it should?
Fix, render again.

**A video that loops** (Shorts, Reels): say `loop: true` on the scene and
make every motion a function of `frame.time / frame.period` that repeats
exactly: `wobble`, `loopEase`, `loopNoise` for motion, `nestedZoom` for a
zoom that steps one level per loop, `bubblePath` with `period`, `beatPulse`
on a tempo from `loopBeats`, and `cutAudioToLoop` for the sound. Whole
numbers of turns and cycles only; `--loop-check` must say "closes". See the
Loops chapter of `docs/video-rendering.md`.

## The rules that trip models up

- **Milliseconds in JSON, seconds in the GSAP-style API.** Timeline keyframes
  and beats are ms; `live.to(el, { duration: 1 })` is seconds.
- **Canvas `x`/`y` tracks are offsets** from where the target was placed, not
  positions. A beat script's `to` is a scene x, and its tracks are offsets
  from `from` (and `ground` for y).
- **Scene y grows downward.** A floor higher up the screen has a smaller y.
- **Walk figures in front of props, not through them.** A prop stands on its
  middle; its front comes forward of that. Use its front line as the
  figure's `ground` (a house's `anchor:doorstep`).
- **Angles are degrees.** Stick-figure arms: 0 hangs down, 90 straight out,
  180 straight up; in profile the left arm's forward is negative.
- **A character's look is data, and names are checked.** `hair: 'bob'`, not
  a drawing in `layers`; a style name not in the catalog throws (`hair:
  unknown style`). Side names (`at: 'left'`, `arm.left`) are the character's
  own: from the front its left is on screen right.
- **Aim beats at anchors, not guessed numbers**: `code.line(7)`,
  `code.token(3, 'var')`, `code.spot(2, 8, 4)`, `piece.home`.
- **Key reactions to contact times.** Beats that touch something report
  `result.beats[i].contact` (and `release`): wipe the line, fling the word or
  type the text at those times.
- **Record panel edits before `code.ride()`**, which reads the moves they make.
- **Or write it all as data with `surfaceScript`**: name places
  (`target: { surface: 'code', anchor: 'token:3:var' }`) and put the surface's
  answer on the beat (`then: { surface: 'code', edit: 'fling', anchor: 'token:3:var', at: 'release' }`).
  A cue's `at` is a moment name (`start`, `contact`, `release`, `end`), never
  ms. It records the edits and rides the lines for you, in beat order.

## Set up your assistant

The npm package ships everything an agent needs, at the version installed:

```text
node_modules/@algorisys/tinyfly/
  llms.txt              the index
  llms-full.txt         every doc, the course and the capability catalog
  docs/*.md             the docs
  skills/tinyfly/SKILL.md
```

**Claude Code**: copy the skill into your project and it loads when you ask
for an animation:

```bash
mkdir -p .claude/skills && cp -r node_modules/@algorisys/tinyfly/skills/tinyfly .claude/skills/
```

**Other agents** (Cursor, Copilot, Codex, Aider): point them at the skill
from your `AGENTS.md` or rules file:

```markdown
When writing tinyfly animations, follow node_modules/@algorisys/tinyfly/skills/tinyfly/SKILL.md.
```

**A chat window**: paste the output of `npx @algorisys/tinyfly capabilities`,
or link `llms-full.txt`.

### Manga faces and original stick-figure proportions

`MANGA_CAST` supplies four original young adult presets through `castMember`.
`face.shape: 'angular'`, `jawWidth` and `chinWidth` shape the projected pen head;
`eyeScale` and `eyeAspect` shape anime eyes. Hair and outfit overrides remain
independent; spread the preset's face when changing one nested field.
`mangaSpikes` / `mangaSweep` contain editable `hair.spikes` tufts as JSON
(`around` degrees, `up` scalp height, `length` and `width` head radii).
The solid mesh head and contact bounds retain their existing geometry.
For the original stick figure use `style.armLength` (positive finite, default 1)
in `drawStickFigure`, `stickFigureJoints` or `stickFigureTarget`; it changes
both arm segments, with hands and the rest of the body keeping their sizes.

### Full-page example previews

Catalog cards offer **Open full page** at `/examples/<id>/full`: a shareable
new-tab player using the same standalone HTML as Copy code. Live demos,
timeline examples and editable sample scenes play with their own controls
and scrolling, without the gallery panels. Use these URLs when sharing an
example for visual review.
