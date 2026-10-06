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
- Delays are capped at a quarter of the shortest gap between keys, so shifted keys never pass each other.
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

## Example

`examples/headless-video/cartoon-acting.mjs` plays the same keys on two pencil
figures, `poseTracks()` on the left and `actTracks()` (`snappy`) on the right,
with a take, speed lines and a dust puff, drawn on twos:

```bash
npx tinyfly video examples/headless-video/cartoon-acting.mjs
```

## Not yet

Planned next, toward feature-animation fluency:

- A bendable spine set by one "line of action" value
- Gaits with personality (bouncy, sneak, double-bounce walk)
- Follow-through on hair, tails and ears
- Lip-sync from narration timing
- Story scripts written as beats that compile to acted keys
- Camera acting (shake on impact, push in on a take, a follow with lag)
- Acting in the editor
