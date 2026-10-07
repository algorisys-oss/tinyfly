# Props: Everyday Objects with Behaviours

Stories need a world: cars and buses, bikes and tractors, trees and houses,
helicopters and planes. In tinyfly these are **props**: objects that act, the
way the figures do, and that can be seen from any side.

```js
import { car, propTarget, propScript, drawProp, drawPropEffects } from '@algorisys/tinyfly/characters'

const prop = car()
const target = propTarget({ x: 200, y: 300, prop, scale: 52, values: { turn: 1 }, look: 'pencil' })
const script = propScript('car', prop, [
  { do: 'honk' },
  { do: 'turn', toward: 'viewer' },
  { do: 'turn', toward: 'right' },
  { do: 'drive', to: 480 },
  { do: 'bump' },
  { do: 'brake', to: 620 },
], { from: 200, ground: 300, scale: 52, start: { turn: 1 }, exaggeration: 1.5 })

// each frame:
drawProp(ctx, target, { time, state }, 'car')
drawPropEffects(ctx, script.effects, time)
```

## What a prop is

A prop is a **3D rig of simple parts on pivots**: boxes, cylinders, ellipsoids,
side profiles made solid (`extrude`), flat panels and tubes. Named **controls**
move the parts (`wheelSpin` turns the wheels, `door` swings the doors), and
**anchors** mark where other things attach (`seat`, `door`, `chimney`).

It is seen through the same kind of view as the v2 character, so it **turns
toward the camera**:

- `turn` 0 faces the viewer, 1 screen-right, 2 away, 3 (or −1) screen-left,
  with every angle in between drawn in 3D.
- `tilt` sets how far the camera looks down on it (12° gives the ¾ look).

It is drawn with the characters' pens, so `look: 'clean' | 'pencil' |
'silhouette'` match the figures beside it. Each part has its own pencil seed,
so lines don't jump as parts change drawing order while turning. Faces are
shaded by how they face the light, outlines follow the silhouette and the
creases, and a **contact shadow** keeps it on the ground. The shadow shrinks
as the prop lifts.

Every prop has these common controls (plus its own):

| Control | Unit | What it does |
|---|---|---|
| `turn` | quarter turns | which way it faces |
| `tilt` | degrees | how far the camera looks down on it |
| `pitch` | degrees | nose up (+) or down (−) |
| `roll` | degrees | tipped onto a side |
| `squash` | factor | squash and stretch about the ground, keeping volume |
| `lift` | metres | off the ground |
| `lean` | shear | the top sheared forward (speed) or back (drag) |
| `size` | factor | its size: 0 gone, 1 as built |

`describeTarget(target)` lists them all with the prop's own controls and its
actions; `checkTracks` checks tracks against them.

## Behaviours and the 12 principles

`propScript(id, prop, beats, options)` compiles beats into tracks through the
same acting pass the figures use. Families write their actions as key poses of
the controls, and the pass adds the rest. The principles, and where they live:

| Principle | In props |
|---|---|
| Squash and stretch | `squash` (volume-preserving): bumps, landings, pops, honks |
| Anticipation | a drive rocks back and squats before it lunges; a helicopter's skids squash as it spools up |
| Staging, solid drawing | `turn` and `tilt`: any view, drawn in 3D |
| Straight ahead and pose to pose | keyed beats, plus procedural motion (gusts, hovering bob) |
| Follow-through, overlapping action | the acting rig's depths (the canopy trails the trunk); `springFollow` (a car's antenna trails on a spring) |
| Slow in and slow out | eases, and the acting style |
| Arcs | lift curves, flight paths, a plane's loop |
| Secondary action | effects: dust, exhaust, skid marks, honk lines, leaves, smoke |
| Timing | acting styles (`full`, `snappy`, `limited`), drawing on twos |
| Exaggeration | `exaggeration`: 0.5 restrained, 1 as designed, 2 a cartoon |
| Appeal | the families' design |

Options:
- `from` / `ground`: where its middle was placed (its `x`/`y` tracks are offsets).
- `scale`: px per metre, as its target draws it.
- `style`: an acting style (default `snappy`).
- `exaggeration`: as above.
- `start`: its starting control values.

The result gives `tracks`, `beats` (with `contact` / `release` times, as figure
beats do) and `effects` (cues for `drawPropEffects`).

Beats have the fields `do`, `at`, `for`, `to`, `toward`, `speed`, `open`, `on`,
`height` and `wind`. `checkPropBeats(beats, prop)` reports wrong names with the
one probably meant, and `propScript` throws on them.

**Every prop can:**
- `hold`
- `turn` (`toward`: viewer, right, away, left, or a number)
- `pop`: spring into being, stretched, with overshoot
- `vanish`

## The families

| Preset | Actions |
|---|---|
| `car()`, `truck()`, `bus()`, `tractor()`, `cart()`, `trainCar()`, `bike()`, `motorbike()` | `drive` (`to`), `brake` (`to`, a skid with locked wheels), `bump`, `honk`, `door` (`open`), `lights` (`on`) — doors and lights where it has them |
| `tree()` | `sway` (`wind`, `for`), `shake`, `shedLeaves` |
| `house()` | `door` (`open`), `lights` (`on`), `smoke` (`for`, runs in the background), `shake` |
| `helicopter()` | `takeOff` (`height`), `fly` (`to`, `height`), `hover`, `land` |
| `airplane()` | `takeOff` (`to`, `height`), `fly` (`to`, `height`), `loop`, `land` (`to`) |
| `horse()` | `walk`, `trot`, `canter`, `gallop` (`to`), `rear`, `buck`, `neigh`, `graze`, `sit`, `jump`, `nod`, `swish` |
| `dog()` | `walk`, `trot`, `run` (`to`), `bark`, `wag`, `sniff`, `sit`, `jump`, `nod`, `swish` |
| `cat()` | `walk`, `trot`, `run` (`to`), `meow`, `arch`, `pounce` (`to`), `sit`, `jump`, `nod`, `swish` |
| `cow()` | `walk`, `trot` (`to`), `moo`, `graze`, `sit`, `jump`, `nod`, `swish` |
| `songbird()`, `crow()` | `hop`, `walk` (`to`), `peck` (`for`), `flap` (`for`), `fly` (`to`, `height`), `land` (`height`, `to`), `tweet` / `caw` |
| `chicken()` | `walk` (`to`), `peck`, `flap`, `flutter`, `cluck` (it cannot fly) |

**Line art.** `propTarget({ …, style: 'stick' })` (or `drawSolvedProp(…, { style: 'stick' })`)
draws a prop as line art to go with stick figures: tubes (legs, necks, tails,
frames) as single even strokes, other shapes outlined and filled with the
paper colour (`paper`), dark details kept dark. Both looks work with it.

**Animals.** `quadruped(spec)` builds a four-legged animal from proportions;
`horse()`, `dog()`, `cat()` and `cow()` are presets. A horse is a prop too: a barrel body, neck, head, four jointed
legs and a tail. A rig's `derive` works its legs out from its gait (`gait`: 0
walk, 1 trot, 2 canter, 3 gallop) and the phase of its stride (`walk`), each
gait with its own footfall pattern (four beats; diagonal pairs; three beats
with a rock; the gallop). The phase is keyed with the distance, so the hooves
keep pace with the ground. Rearing pitches it up about its hind hooves; its
tail trails on a spring.

**Birds.** `bird(spec)` builds one from proportions; `songbird()`, `crow()` and
`chicken()` are presets. Its wings fold back along the body at rest and open
out with `spread`. They beat from the shoulders: `flap` raises or lowers them,
and while `flapping` is on, the rig's `derive` beats them from a phase,
`wingbeat`, keyed steadily so the wings keep their rhythm (a songbird nine beats
a second, a crow four). Its head pecks from a neck joint (`peck`; a chicken's
neck stretches down to reach), and it walks with its head bobbing or hops.
`fly` takes off with a crouch and a leap (no crouch if it is already in the
air) and flies to `height` metres; `land` comes down to the ground or to a
perch (`height`). Perch it with anchors:

```js
const branch = propAt(treeTarget, { time: 0 }, 'tree').anchor('branch')
const perch = (GROUND - branch.y) / birdScale // metres above the ground
propScript('robin', songbird(), [
  { do: 'fly', to: 380, height: 0.25 }, { do: 'land' }, { do: 'hop', to: 410 }, { do: 'peck' },
  { do: 'fly', to: branch.x, height: perch }, { do: 'land', height: perch }, { do: 'tweet' },
], { from: branch.x, ground: GROUND, scale: birdScale, start: { turn: 1, lift: perch } })
```

Wheels **roll exactly the distance driven**: `wheelSpin` is keyed in step with
the motion, and wheels of different sizes (a tractor's) turn at their own
rates. Rotors and propellers spin from `rotor`, keyed exactly, and blur into a
disc at speed.

Make your own from the family generators: `vehicle(spec)` takes:
- a body side profile and a width
- a glass cabin with pillars
- wheels (any radius; `side: 0` for a bike's middle line; `style: 'spoked'`)
- doors, lights, side windows, frame tubes, an antenna, a seat and extra parts

`tree(spec)` and `house(spec)` take sizes and colours.

## Figures with props

- **Riding.** `propRide({ prop, propId, propTracks, anchor: 'seat', figure, figureId, start, end, offset })`
  writes a figure's `x`/`y` (and `turn`/`facing`) so it is carried at an
  anchor and turns with the prop. `spliceTracks(heroTracks, ride, { from, to })`
  puts that into the figure's script. Pass a rider to `drawProp(…, { rider })`
  and it is drawn between the prop's far and near parts: a driver behind the
  windscreen, a figure in a doorway behind a door until it opens.
- **Towing.** `propTow({ leader, leaderId, leaderTracks, hitch: 'hitch', towed, towedId, anchor: 'shafts', start, end })`
  makes a prop follow another: a cart behind a horse turns with it, keeps its
  shaft tips on the horse's hitch, and rolls its wheels the distance it covers.
- **Reaching.** Figure beats aim at anchors:
  `propAt(target, frame, id).anchor('door')` gives the scene point for a
  `put`, `grab` or `push`.

See the gallery cards **Road Trip**, **Windy Day**, **Helicopter**,
**Traffic**, **Horse & Cart**, **Farmyard**, **Birds** and **3D Scene: Village**.

## In 3D scenes

Props stand in `@algorisys/tinyfly/scene-3d` scenes too:
`{ kind: 'prop', prop: 'car', position, rotation, values }` with
`loadScene3D(scene, { kinds: [characterObjects, propObjects] })`. The scene's
camera sees them in perspective from anywhere, drawn with the same pens; each
prop is drawn a column at a time, so figures walking round a bus or a house
sort rightly against it. A part's `layer` says which of two parts that sit
into each other is drawn over in 3D (a cabin over a car's body).
`propScript3D(id, prop, beats, { scene, position, heading })` scripts them in
world metres: `{ do: 'drive', to: [x, z] }`, `{ do: 'walk', through: [[x, z], …] }`,
`{ do: 'fly', to, height }`, `{ do: 'face', toward }`, and their actions,
with wheels and strides keyed with the distance (from each prop's `moves`).
`propPreset(name, options)` makes a preset by name. See
[3D Scenes](scene-3d.md#props) and the gallery card **3D Scene: Village**.

## Not yet

- Pedalling and steering poses for riders
