---
name: tinyfly
description: Write animations with tinyfly (@algorisys/tinyfly), the JSON-first animation engine — timelines and tracks, canvas shapes, stick-figure characters acting from beat scripts, surfaces figures act on (code panels, whiteboards, charts, props), teaching figures and headless video. Use when asked to create, edit or fix a tinyfly animation, a stick-figure scene, an animated code walkthrough, a whiteboard lesson, a chart presentation or a tinyfly timeline.
---

# Writing tinyfly animations

Work in this loop: **read the catalog, write, check, look.** Do not guess
names: tinyfly rejects names it does not have, and its errors say which name
was probably meant.

## 1. Read what exists

Run `npx @algorisys/tinyfly capabilities` (add `--json` for data) and read it
before writing anything. It is generated from the installed library: easings,
track kinds, every canvas property with units and ranges, the stick figure's
joints, poses, expressions (moods), gags, gaits, beat actions (and the fields
each needs), dances, flips, hand shapes, the v2 character's builds, hairstyles,
facial hair, glasses, hats, cast, face styles and expressions, the code panel's languages, every surface's
anchors and edits (code, board, chart), camera shots, teaching helpers.

For the how-to, read the docs shipped with the package, at the installed
version: `node_modules/@algorisys/tinyfly/llms.txt` (index), `docs/*.md`, or
`llms-full.txt` (everything). For characters acting on code, boards and
charts, read `docs/acting.md` ("Beat scripts", "Acting on code", "A whole
scene as data", "Whiteboards", "Charts").

At runtime, `describeTarget(target)` says what any target animates (with its
current values) and what it can do; `animatableProperties(target)` gives the
names.

## 2. Write

- Colour anime characters: use `castMember('animeYoungWoman', height)` or any
  of the eight age presets in `ANIME_CAST`. For a custom character use
  `face: { style: 'anime', iris: '#4b7fce', lashes: true, ageLines: 0.6 }`.
  Keep `look` as `clean`, `pencil` or `silhouette`; anime is a face style.
  The same `HUMAN_EXPRESSIONS`, blink, gaze, turn, acting and dance fields apply.

- Prefer the high-level builders: `scriptTracks()` beats for characters
  (`characterScript(target, who, beats)` for the same beats on a v2
  `character()`, then `hairFollowTracks`), `codePanel()` for code, `whiteboard()` for lessons on a board,
  `chart()` for bar, line, pie and donut charts (several series, a legend, axis
  titles; slices come loose as pieces), `lesson()` and the diagram primitives for teaching
  figures, `cameraTracks()` for camera moves. They produce plain JSON tracks.
- Aim beats at anchors, never guessed coordinates: `code.line(n)`,
  `code.token(n, 'word')`, `code.spot(n, column, width)`, `piece.home`,
  `code.landing(piece, n, column)`.
- Key reactions to the contact times beats report:
  `script.beats[i].contact` / `.release` (wipe a line, fling a word, type text).
- Units: JSON times are milliseconds; the GSAP-style `live` API takes seconds.
  Canvas `x`/`y` tracks are offsets from where a target was placed. Scene y
  grows downward. Angles are degrees.
- Record code-panel edits before `code.ride(tracks, figureId, { ground })`.
- For a figure acting on a surface (code panel, whiteboard, chart), prefer
  `surfaceScript(figureId, { name: surface }, beats, options)`: aim beats at
  named places (`target: { surface: 'board', anchor: 'term:eq:+ 4' }`) and put
  the surface's answer on the beat (`then: { surface, edit, anchor, at: 'release' }`).
  A cue's `at` is a moment name (`start`, `contact`, `release`, `end`), never
  ms; `until` sets its length. It records the edits in beat order and rides
  the figure on bars and lines for you. Use `result.tracks` (figure and
  surfaces). Places name items by id: declare them first (`items`, `data`).
- A figure that starts on the right walking left needs `facing: -1` in the
  script options.
- For native garba or dandiya, use `humanDanceFrame(style, beat, base)` or
  `humanDanceTracks(target, { style, bpm, beats })`; heading stays independent
  of local limb motion. `danceCircleAt` / `danceCircleTracks` coordinate a
  circle's travel, facing, spins and foot plants. Sparse custom keys use base,
  human/hand rest or zero defaults across the loop. Contacts always alternate
  left/right each integer beat, starting left, with stance through 0.6;
  custom keys do not change this. Use `plantFeet: false` and your own
  `plantDanceFoot` contacts for different footwork. Circle bakes require
  `beats`, default to 120 BPM and reject `count` different from target count.
  Render with the same base pose and build: unchanged pose fields are omitted.
  Close whole orbits/routines with whole extra body revolutions too.
  Zero-roll circle bakes
  use `rotateY`; nonzero `pose.roll` keeps heading in pose `turn` (quarter-turns),
  includes roll, and sets `rotateY: 0`, preserving yaw before roll and grounding.
  Supply roll when baking and apply all tracks without adding heading twice.
  Apply both pose and position
  from `plantDanceFoot`; ankle/toe IK preserves authored `leg.*.rotate` hip turn-out.
  `meetDandiya` gives paired strike poses and world-space
  grip/tip segments, with unreachable contacts reported. Construct contact
  characters from the rendered dancers' options to match proportions,
  line width and hands. Scripted dance entry and hand pose transitions use
  `HAND_REST` for missing hand fields, preserving relaxed hands through holds
  and explicit zero values. In a 3D script use
  `{ do: 'spin', turns: 2, for: 1500 }` for full revolutions: `face` takes the
  shortest route, so facing 360° does not spin. A scripted dance stays in
  place; `for` alone derives beats at the BPM, while `beats` with `for` fits
  those beats into the duration. Stick drawing and paired IK are separate
  from native frames and circle bakes. See `docs/dance.md`.
- A figure changes a prop's state through `propSurface(propTarget(…))`
  (`switch` / `set` on `control:door`, `control:lights`; aim at `anchor:NAME`
  or `part:ID`). Walk figures on a prop's front line (a house's
  `anchor:doorstep` y), not on the prop's own `y`, or they pass through its
  walls.
- For objects in the scene (vehicles, trees, houses, furniture, aircraft,
  animals, birds) use the prop presets with `propScript()`; seat figures with
  `propRide()`, tow with `propTow()`. Furniture's anchors are where a figure
  uses it (`seat`, `top`, `mattress`, `handle`, `doorway`); a `wheelchair()`
  is ridden on its `seat` in `RIDING_POSES.wheeling`. A sky or a room is
  `scenery()` / `scenePreset('park')` with `hour`, `wind`, `rain`, `snow` as
  tracks. Aim figure beats at prop anchors
  (`propAt(...).anchor('door')`), and perch birds at them (`branch`, `ridge`).
  `style: 'stick'` draws props as line art. In a 3D scene, place props with
  `rotation: [0, deg, 0]` (`rotateY` is a track) and script them with
  `propScript3D` (`to: [x, z]` metres), not `propScript` (screen px);
  characters there with `characterScript3D` (`say`, `look` too), riders with
  `propRide3D`. A film: `shotTracks` + `transitionAt` / `drawTransition`,
  `cameraMoveTracks`, `lightingPreset`, `ground`, `shadow: true`, `renderMix`;
  `depthBuffer: true` when shapes cut through each other.
- Give a v2 `character()` its look as options, not drawing code: `build`,
  `hair` (`'bob'` or `{ style, color, length }`), `facialHair`, `glasses`,
  `hat`, `ears: true`, `face: { teeth, tongue }`, `feet: 'flat' | 'pointed' |
  'big'`, `outfit: { shirt, trousers, over, shoes }`; or start from
  `castMember('grandma', height)`. A `cane` in a hand or a wheelchair is an
  accessory, not an age. Built-in tops keep thighs behind their hem through turns.
  Custom `layers.parts[id].clip` clips the bare body only, before `over`;
  use `joints.parts[id].order` for garments spanning several parts. Hair and hats
  turn with the head, so one description serves every view; hanging hair swings after a turn or a run when
  you add `hairFollowTracks(target, tracks, who)` after the character's tracks
  (per-frame code: `hairFollow` once, `hairMotionAt(keys, t)` each frame).
  Faces are `HUMAN_EXPRESSIONS` plus the pose
  fields `blush`, `tears`, `sweat` (0–1). Items in hands: `holding`
  (`held.<side>` lets go); hands that meet: `meetHands(kind, a, b)` at
  `meetingSpacing`; a hug: `embrace(a, b)` at `embraceSpacing`; a help-up:
  `helpUp(helper, sitter, progress)` at `helpUpSpacing`. See `docs/character-appearance.md`.
- For recurring characters, make a `persona()` (look, acting, gait, mood,
  stance) and use `persona.script()`; for a move the catalog lacks, write it
  with `defineAction()` rather than hand-keying joints in many places.

## 3. Check

- Beat scripts: `npx @algorisys/tinyfly check beats.json` (or `checkBeats()`;
  `scriptTracks()` throws on the same errors). Beats with surface places and
  cues: `checkSurfaceBeats(beats, surfaces)` (`surfaceScript()` throws on the
  same errors).
- Tracks: `checkTracks(tracks, targets)` — unknown targets and properties,
  key order, value kinds and ranges.
- Teaching timelines: `npx @algorisys/tinyfly validate timeline.json --markup figure.svg`.

Fix every error; read every warning.

## 4. Look

Render stills and look at them before saying it works:

```bash
npx @algorisys/tinyfly video scene.mjs --stills frames --times 0,800,1600
```

Check that hands meet what they touch, figures face and point the right
way, stand on their floors (and ride bars as they grow), text lands where it
should and nothing leaves the frame. Fix and render again.

For a video that loops, set `loop: true` on the scene and drive every motion
from `frame.time / frame.period` with helpers that repeat exactly (`wobble`,
`loopEase`, `loopNoise`, `nestedZoom`, `beatPulse` on `loopBeats`,
`bubblePath` with `period`; sound via `cutAudioToLoop`), whole turns and
cycles only; then `npx @algorisys/tinyfly video scene.mjs --loop-check` must
say "closes".

### Manga cast and stick-figure arm proportions

- `MANGA_CAST` / `castMember('mangaYoungMan', height)` supply four original young adult presets. `face.shape: 'angular'`, `jawWidth`, `chinWidth`, `eyeScale` and `eyeAspect` customise them; keep expressions as pose fields.
- Hair styles `mangaSpikes` and `mangaSweep` use editable `spikes: [{ around, up, length, width }]` in head radii (around in degrees). Hair and clothes can be replaced independently of the face. Spread nested preset face options before changing one field.
- Flowing cartoon styles: `softSweep`, `flowingBob`, `cascadingWaves`. `locks: [{ path, width, follow? }]` are cubic curves: a root plus groups of three `{ around, up, lift? }` points. Around is degrees; up, lift and width are head radii; the root has up 0..1 and lift 0. Edit paths for lock lengths; `length` controls the supporting mass. `follow: 0` pins a lock; `hairFollowTracks` drives flexible locks, including short sweeps, after the same acting/story tracks. `fall: { taper, wave }` softens the hanging mass and `shine` (0..1) adds clean-look highlights.
- Pen head outlines follow yaw/nod/roll; contact bounds and the solid mesh head remain unchanged.
- The original stick figure takes `style.armLength` as a positive finite multiplier (default 1) in its draw, joints and target APIs. Both arm bones scale; hands and other body proportions retain their sizes. The newer human rig retains its `CharacterOptions.armLength`.

### Share an example preview

Catalog examples have an **Open full page** link at `/examples/<id>/full`,
for a full-viewport standalone player in a separate tab. It supports live,
timeline and editable examples, with their controls and scrolling. Use the
normal `/examples/<id>` route for the gallery card and code.
