# Cartoon Acting

Key poses say *what* a character does. Acting is *how* it gets there, and it is
most of the difference between a stiff procedural figure and one that feels
drawn. `poseTracks()` moves every joint at once, start to stop. `actTracks()`
takes the same keys and applies the timing habits of hand-drawn animation:

| Habit | What happens |
|---|---|
| **Anticipation** | Before a joint moves, it winds up a little the other way (an arm dips before it rises). |
| **Overshoot and settle** | It passes its target, then eases back (or wobbles, in the `snappy` style). |
| **Overlap** | The body leads and each joint further out trails: hips, then shoulders and knees, then elbows and ankles, then wrists. |
| **Eyes lead** | The eyes dart to a new look before the head and body follow, and the figure blinks as its head turns. |
| **Moving holds** | A long hold drifts slightly instead of freezing dead; the figure still ends on its last pose. |
| **Idle blinks** | Now and then during long holds. |
| **Jump squash** | When `rise` leaves the ground: squash, stretch in the air, squash on landing. |

The output is ordinary keyframe tracks, so seeking, exporting, loops and the
editor all see plain JSON. Nothing is random at play time: the small variations
(which way a hold drifts, when an idle blink falls) come from a hash of the
field and the `seed`.

```js
import { actTracks } from '@algorisys/tinyfly/characters'

const tracks = actTracks('hero', [
  { time: 0, pose: 'rest', expression: 'happy' },
  { time: 900, pose: { turn: 0.6, lookX: 1 }, expression: 'confused' },
  { time: 1800, pose: 'point' },
  { time: 3200, pose: 'wave' },
], { style: 'snappy' })
```

Keys are the same as `poseTracks()` keys: a named pose or the joints that change,
an optional expression and an optional easing (which replaces the style's action
ease for that move). Track ids are the same too (`hero-rightShoulder`), so
switching between them is a one-word change.

For the v2 characters, `actCharacterTracks(target, keys, options)` takes
`characterPoseTracks()` keys.

## Styles

| Style | Feel |
|---|---|
| `full` (default) | Classic feature animation: soft wind-ups, overshoot that settles smoothly, generous overlap. |
| `snappy` | Theatrical cartoon timing: bigger wind-ups held a beat, a fast action that overshoots and wobbles to a stop. |
| `limited` | TV and Pencilmation-style: little anticipation, no overshoot, crisp holds. Pairs well with drawing on twos. |
| `none` | The keys as written: the same tracks as `poseTracks()`. |

Tune any of them by changing values on a preset:

```js
actTracks('hero', keys, { style: { base: 'snappy', overlap: 60, overshoot: 0.2 } })
```

The values are in `ActingStyle`: `anticipation` (share of a move's size),
`anticipationTime` and `hold` (shares of its time), `overshoot`, `settle` (ms),
`settleEase`, `actionEase`, `overlap` (ms per step out a chain), `eyeLead` and
`eyeDart` (ms), `drift`, `blinks` and `jumpSquash`.

What leads, what drags and how far each joint may wind up is an `ActingRig`:
`STICK_ACTING_RIG` for the stick figure, `HUMAN_ACTING_RIG` for the v2 human.
Pass `rig` to act a body of your own. The core, `actKeyframes(keys, rig, options)`,
works on any record of numbers.

A few rules keep the result predictable:

- Moves shorter than 160 ms are not wound up, and moves shorter than 120 ms land without an overshoot. There is no time for either to read.
- A move's delay is at most half the time between its two keys, so a quick move still lands near its key.
- A settle takes at most half the time to the next key.
- If the keys animate `blink` themselves, the pass leaves blinking alone; if they animate `stretch`, it adds no jump squash.

## Gags

Some cartoon moments are their own timing: the take, the double take, the
wind-up before a zip-off. They come as data, built on the pose they start from.
You splice them into a key list:

```js
import { actTracks, gag, gagDuration, resolvePoseKeys } from '@algorisys/tinyfly/characters'

const opening = [{ time: 0, pose: 'rest' }, { time: 1800, pose: 'point' }]
const from = resolvePoseKeys(opening).at(-1)
const keys = [
  ...opening,
  ...gag('take', { at: 2600, from }),
  { time: 2600 + gagDuration('take') + 900, pose: 'shrug' },
]
actTracks('hero', keys, { style: 'snappy' })
```

| Gag | What happens |
|---|---|
| `take` | Squash down in a squint, shoot up stretched with eyes popping, hang, land squashed, end surprised. |
| `doubleTake` | Glance, look away unbothered, snap back in shock with a little hop. |
| `windUp` | Rear back with a knee up and arms cocked, hold, pitch forward ready to run. |
| `land` | Squash on contact with the ground and spring back up. |
| `tremble` | A frightened shiver: fast small shakes with wide eyes. |
| `deflate` | A sigh: the body sags, shoulders and head drop. |

The gag's keys are marked `act: false`, so the acting pass leaves its timing as
written (only the move onto its first pose is acted). Mark any key of your own
the same way to keep it exact. `speed` stretches a gag in time (`2` is twice as
long).

## Speed lines, dust and stars

```js
import { drawStickSmear, drawDustPuff, drawImpactStars } from '@algorisys/tinyfly/characters'

const hero = stickFigureTarget({ x: 640, y: 600, style })
export default {
  // ...
  targets: { hero },
  background(ctx, frame) {
    // Under the figure: streaks behind its fast hands, feet and head.
    drawStickSmear(ctx, hero, frame, 'hero', { color: '#333', length: 110 })
  },
  draw(ctx, frame) {
    drawDustPuff(ctx, { x: 640, y: 600 }, (frame.time - 3500) / 500, { size: 120 })
  },
}
```

`drawStickSmear()` asks where the figure was over the last `length` ms
(`frame.stateAt`, as trails do), and streaks only the parts moving faster than
`threshold` figure heights a second. The streaks fade in above the threshold, so
they never pop. Frames are drawn the same in any order. `parts` chooses among
`hands`, `toes`, `head` and `body`. `drawSpeedLines(ctx, points, style)` streaks
any path.

`drawDustPuff()` and `drawImpactStars()` take a `progress` from 0 to 1 and draw
nothing outside that range, so passing `(time - start) / length` is enough.

## Drawing on twos

Hand-drawn animation is usually drawn "on twos": 12 drawings a second, each
shown for two frames of 24 fps film. Animating on every frame looks smooth but
digital, especially against a pencil line that boils at 8 drawings a second.

A video scene's `drawingRate` holds the timeline to that many drawings a second.
The frame rate stays as set, and so does the time passed to `draw` and
`background`, so a camera move drawn there can stay smooth:

```js
export default { width: 1280, height: 720, fps: 24, drawingRate: 12, timeline, targets }
```

In the browser, `heldTime(time, 12)` (from `@algorisys/tinyfly`) gives the
same held time to evaluate a timeline at.

## Line of action

`bend` curves the stick figure's spine, in degrees from hips to neck: positive
curls forward (the way `lean` tips), negative arches back. Unlike `lean`, which
tips a straight back, the curve spreads along the spine, and the chest, arms
and head ride on its end. A slump, a recoil and a cheer each read from the
curve before anything else.

```js
pose({ bend: 18, headTilt: 10 })   // a slump
pose({ bend: -14, leftShoulder: 150, rightShoulder: 150 })   // arched back, arms up
```

It is a pose field like any other, so it blends, keys and acts (it leads with
the hips, winds up and overshoots). The gags use it: a take arches back as it
shoots up and curls on landing. At 0 the figure is drawn exactly as before.

## Gaits

How a figure walks is data: `GAITS` has `walk` (the plain walk, the same as
`walkPose()`), `bouncy`, `doubleBounce` (two bobs a step), `sneak` (tiptoe in
a crouch, paws up), `strut` (chest out), `tired` (slumped and dragging) and
`run` (knees high, arms pumping, off the ground between steps).

```js
gaitPose('sneak', phase, base)          // a pose at a phase of the cycle
gaitStrideLength('sneak', height)       // ground per cycle, so feet stay planted
```

A gait is a handful of numbers (`swing`, `knee`, `arm`, `elbow`, `forearm`,
`shoulder`, `lean`, `bend`, `headTilt`, `bounce`, `bounces`, `squash`,
`crouch`, `tiptoe`, `sway`), so you can write your own and pass it in place of
a name. On a `stickFigureTarget` the `gait` prop picks one, and a string track
switches it: `{ property: 'gait', keyframes: [{ time: 0, value: 'walk' }, { time: 3000, value: 'run' }] }`.

## Lip-sync

`lipSyncKeyframes({ text, start, end })` reads a line as mouth shapes:
vowels open the mouth in their shape, m/b/p close it, f/v bite the lip, and
pauses rest it. The shapes share the line's time by how long each sound tends
to take. It reads Latin script and Devanagari: inherent vowels, matras and
virama, with lip consonants (प फ ब भ म) closing the mouth. It writes the
`mouth` and `mouthWidth` fields, which both figure systems have.

```js
lipSyncTracks('hero', [{ text: 'Where did my pot go?', start: 4000, end: 5400 }])
// Over acted tracks: the face carries on around the line (a gape, a grin).
lipSyncOver('hero', actTracks('hero', keys), lines)
```

`VISEMES` holds the shapes and `soundsOf(text)` the sounds, for drawing your
own mouths.

## Beat scripts

`scriptTracks()` takes a story written as beats (what the figure does, not
when its joints move) and compiles it into tracks:

```js
const { tracks, duration, lines, beats } = scriptTracks('hero', [
  { do: 'walk', to: 640, mood: 'happy' },
  { do: 'look', toward: 900, mood: 'confused' },
  { do: 'take' },
  { do: 'say', say: 'Is that box ticking?', mood: 'worried' },
  { do: 'sneak', to: 820, mood: 'scared' },
  { do: 'face', toward: 0 },
  { do: 'run', to: 120, say: 'Nope!' },
], { from: 180, height: 220, style: 'snappy' })
```

Each beat starts when the one before ends (or at `at`) and lasts its action's
own length (or `for`).

| `do` | What happens |
|---|---|
| a gait name, with `to` | Walks to a scene x at the gait's pace, feet planted. It turns round first if the place is behind it. Writes `x` (an offset from `from`), `walk`, `walking`, `gait` and `facing`. |
| a pose name (`wave`, `point`, `cheer`, `sit`…) or `stand` | Moves into the pose and holds it. The figure keeps the way it is turned unless the pose sets its own. |
| a gag name (`take`, `doubleTake`…) | Splices the gag in, built on the current pose. |
| `look`, with `toward` | Turns the head and eyes toward a scene x, `viewer`, `ahead` or `back`. |
| `face`, with `toward` | Turns the whole figure, turning round if needed. |
| `zip`, with `to` | The cartoon exit: winds up, wheels its legs in place, then shoots off to `to`. The script's `effects` say where to draw the dust it leaves hanging. |
| `say`, with `say` | Lip-syncs the line, with small head nods and brow lifts, for as long as the line takes. |
| `hold` | Holds (the acting pass drifts long holds). |

Any beat can take `say` (a line said while it happens), `mood` (an
expression) and `pose` (joints to change). The result carries the spoken lines
with their times (for captions), when each beat starts and ends (for camera
shots), and `effects`: dust cues for where a take lands and where a zip
leaves, with a time, a scene x and a length, ready for `drawDustPuff`.

## Camera

Video scenes can be seen through a camera: `camera: true` reads the tracks of
the `Camera` target (the editor's camera uses the same name). `x` and `y`
pan, `scale` zooms and `rotate` rolls about the stage centre, and `shakeX`,
`shakeY` and `shakeRotate` add on top, so a shake never disturbs a pan. A new
`overlay` step draws in screen space after everything else, for captions and
titles that should not move with the camera.

`cameraTracks()` (in `@algorisys/tinyfly`) compiles shots into those tracks:

```js
cameraTracks([
  { at: 2000, duration: 500, frame: { focus: { x: 760, y: 470 }, scale: 1.25 } },    // push in
  { at: 3300, duration: 0, frame: { focus: { x: 640, y: 440 }, scale: 1.6 } },       // a cut (crash zoom)
  { at: 3900, duration: 450, shake: { strength: 14 } },                               // an impact
  { at: 7000, until: 9000, follow: { x: heroX.keyframes, y: 470, lag: 220 } },       // follow a runner
  { at: 9200, duration: 600, frame: {} },                                             // back to the full frame
], { stage: { width: 1280, height: 720 } })
```

A `frame` shot moves so `focus` sits at the centre at `scale` (and `rotate`);
a duration of 0 cuts. A `shake` dies away over its duration and is seeded, so
renders repeat exactly. A `follow` keeps a subject's x (its x track's
keyframes) centred, `lag` ms behind it, with an optional `lead`. Shots play in
time order, and a later one takes over from an earlier one.

In the browser or your own canvas code, `applyCamera(ctx, cameraFromValues(values), stage)`
(from `@algorisys/tinyfly/characters`, `@algorisys/tinyfly/adapters` or the
browser bundle) applies a view to any canvas, and `cameraPoint(view, stage, point)` says where a scene
point lands on screen (the pencil story maps the drawing hand's strokes this
way, so the hand stays on the page while the camera moves).

## Examples

- `examples/headless-video/cartoon-acting.mjs`: the same keys through
  `poseTracks()` and `actTracks()`, side by side, with a take, speed lines
  and a dust puff, drawn on twos.
- `examples/headless-video/beat-script.mjs`: a beat script with gaits, a
  take, dialogue, a sneak and a run, filmed by camera shots (a push-in, a
  crash zoom, a shake and a follow).
- `examples/pencil-story-hindi/`: the thirsty-traveller story, acted. It has a
  take and a double take, a tired walk and a bouncy one, a lip-synced line in
  Hindi, and camera pushes, with the animator's hand drawing through the
  camera.
- The **Cartoon Acting** card in the website gallery: the script live in the
  browser, with pickers for the acting style and the walk, and toggles for
  drawing on twos, speed lines and the camera.

```bash
npx tinyfly video examples/headless-video/beat-script.mjs
```

## In the editor

The Character element has an **Acting** section: a style, **🎭 Act the keyed
poses**, gags, gaits with a distance, lines to say, and the drawing rate (see
the [editor guide](editor-guide.md#characters)). With acting on, the element
keeps its plain key poses (`acting.keys`) and its tracks are generated from
them, so keying a pose, adding a gag or a walk, or saying a line re-acts the
whole performance. Gags and gaits come from the stick figure, turned into
character fields with `stickToHuman`, in the character's current view.

The timeline's `drawingRate` (`TimelineConfig.drawingRate`, set with
`timeline.drawingRate = 12`) holds every value on its drawing, wherever the
timeline plays: editor previews, players, embeds and exports.

## Not yet

- Native gaits, line of action and gags on the v2 body plan (today they come from the stick figure through `stickToHuman`)
- Follow-through on hair, tails and ears (character-system milestones 3 and 5)
