---
name: tinyfly
description: Write animations with tinyfly (@algorisys/tinyfly), the JSON-first animation engine — timelines and tracks, canvas shapes, stick-figure characters acting from beat scripts, code panels figures act on, teaching figures and headless video. Use when asked to create, edit or fix a tinyfly animation, a stick-figure scene, an animated code walkthrough or a tinyfly timeline.
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
each needs), dances, flips, hand shapes, the code panel's languages, anchors
and edits, camera shots, teaching helpers.

For the how-to, read the docs shipped with the package, at the installed
version: `node_modules/@algorisys/tinyfly/llms.txt` (index), `docs/*.md`, or
`llms-full.txt` (everything). For characters acting on code, read
`docs/acting.md` ("Beat scripts" and "Acting on code").

At runtime, `describeTarget(target)` says what any target animates (with its
current values) and what it can do; `animatableProperties(target)` gives the
names.

## 2. Write

- Prefer the high-level builders: `scriptTracks()` beats for characters,
  `codePanel()` for code, `lesson()` and the diagram primitives for teaching
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
- For objects in the scene (vehicles, trees, houses, aircraft, animals,
  birds) use the prop presets with `propScript()`; seat figures with
  `propRide()`, tow with `propTow()`. Aim figure beats at prop anchors
  (`propAt(...).anchor('door')`), and perch birds at them (`branch`, `ridge`).
  `style: 'stick'` draws props as line art. In a 3D scene, place props with
  `rotation: [0, deg, 0]` (`rotateY` is a track) and script them with
  `propScript3D` (`to: [x, z]` metres), not `propScript` (screen px);
  characters there with `characterScript3D`, riders with `propRide3D`.
- For recurring characters, make a `persona()` (look, acting, gait, mood,
  stance) and use `persona.script()`; for a move the catalog lacks, write it
  with `defineAction()` rather than hand-keying joints in many places.

## 3. Check

- Beat scripts: `npx @algorisys/tinyfly check beats.json` (or `checkBeats()`;
  `scriptTracks()` throws on the same errors).
- Tracks: `checkTracks(tracks, targets)` — unknown targets and properties,
  key order, value kinds and ranges.
- Teaching timelines: `npx @algorisys/tinyfly validate timeline.json --markup figure.svg`.

Fix every error; read every warning.

## 4. Look

Render stills and look at them before saying it works:

```bash
npx @algorisys/tinyfly video scene.mjs --stills frames --times 0,800,1600
```

Check that hands meet what they touch, figures stand on their floors, text
lands where it should and nothing leaves the frame. Fix and render again.
