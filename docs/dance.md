# Dance and Flips

The stick figure from `@algorisys/tinyfly/characters` can dance (disco, hip
hop, breaking toprock, jazz, K-pop, Bollywood, Bhangra, Bharatanatyam,
Charleston, tap, popping with its glides and the moonwalk) and do
flips (front, back, layout, scissor, side flip, cartwheel, back handspring),
leaps (split leap, toe touch) and full splits.
Like everything else in tinyfly, it is plain data played by pure functions:
the same style at the same beat always gives the same pose, so a dance scrubs,
renders to video and syncs to music exactly.

Try it on the Examples page: **Dance Floor (Characters)**.

## Native character dances, circles and spins

For v2 characters use `humanDanceFrame(style, beat, basePose)`, with
`style` set to `garba`, `garbaThreeClap` or `dandiya`, or a custom `HumanDanceStyle`.
These stylised eight-beat routines author limbs in the body's own 3D space,
including weight shifts, knee lifts, clap preparation and recovery. `turn`
and `roll` stay with the caller, so the same steps work from the front, back
or either side. `HUMAN_DANCES` is plain JSON: copy a routine's `keys`,
`strikes`, `beats`, `bpm` and `label` to customise it. Keys are ordered by beat,
within `[0, beats)`, and loop back to the first key. Sparse keys use the full
clip's field union at every beat: a missing value uses the caller's base pose,
then the human or hand rest value, then zero for other fields. Both bakers
preserve these numeric fields even when first authored at a later key.
The frame also contains `contact: { side, start, weight }`: the support side,
the absolute integer planting beat, and a weight that is 1 through stance
and fades smoothly to 0 before the next beat. `strike` is 1 at a clap or
stick-strike beat and fades linearly to 0 a quarter beat either side. Foot plants
assume left/right alternation at each integer beat, starting with the left
foot, and stance through 0.6 of each beat. Custom keys do not change this
contact pattern. For hops, longer stances or reversed support, set
`plantFeet: false` and supply your own contacts with `plantDanceFoot`.

```js
import { character, drawCharacter, humanDanceFrame, humanDanceTracks, danceCircleAt, danceCircleTracks } from '@algorisys/tinyfly/characters'

const who = character({ height: 220, hands: 'cartoon', handStyle: 'natural' })
const frame = humanDanceFrame('garba', time * 120 / 60000, { turn: 2 })
drawCharacter(ctx, who, frame.pose) // back view, without mirroring the step

const tracks = humanDanceTracks('dancer', { style: 'garba', bpm: 120, beats: 8 })
// Ordinary JSON keyframes; turn/roll tracks can animate independently.

const members = danceCircleAt(time * 120 / 60000, {
  radius: 1.8, count: 8, beatsPerTurn: 32, facing: 'inward', style: 'garba',
})
// Each member: character, pose, position [x,y,z], heading (degrees), strike,
// planted. Heading is already included in pose.turn for direct drawing.

const circleTracks = danceCircleTracks(['stage/a', 'stage/b'], {
  radius: 1.8, beatsPerTurn: 32, beats: 32, bpm: 120,
})
// Scene tracks: x/y/z, rotateY, and local pose fields; no doubled pose.turn.
```

`humanDanceTracks(target, { style, bpm?, beats?, start?, pose?, samplesPerBeat? })`
defaults to the style's tempo and beat count, `start: 0` ms, `HUMAN_REST`
and 16 samples per beat. It samples from beat 0 through `beats`, with
linear JSON keys at `start + beat * 60000 / bpm`; between samples playback
approximates the smoothly interpolated frame. It omits `turn`, `roll` and
fields that stay at the supplied base/rest value. Give the target the same
base pose, since omitted fields are not reset. Hand fields are included;
use a hand rig to display them or filter `hand.*` tracks for dot hands.

Circle positions use `center: [x,z]`, `radius`, initial `angle` (degrees),
`direction: 1 | -1`, and equal spacing. Facing can be `inward`, `outward`,
`tangent`, or a fixed numeric heading. `spins` adds independent body turns
per orbit, including negative or fractional turns. Defaults are
`center: [0,0]`, `count: 8`, `beatsPerTurn: 32`, `angle: 0`, `direction: 1`
(clockwise viewed from above), `facing: 'inward'`, `spins: 0`, `style: 'garba'`
and `plantFeet: true`; `radius` must be positive. At angle 0 the first
dancer stands along +z; heading 0 faces +z, 90 faces +x.
Height and placement use the same units (default 1.7 metres).
`danceCircleTracks(targets, options)` requires `beats`, takes its member
count from `targets.length`, and defaults to 120 BPM, `start: 0` ms and
16 samples per beat, even when a custom style has a different tempo.
Its linear keys omit unchanged base/rest pose fields but always include
world placement; give the rendered characters the same base pose and build.
With zero roll, circle bakes put heading in object `rotateY` (degrees) and
omit pose `turn`; start with neutral object rotation and pose `turn: 0`.
With a nonzero `pose.roll`, they instead bake heading into pose `turn`
(quarter-turns), include the supplied `roll`, and write `rotateY: 0`. This
keeps native yaw before roll, including its grounding and foot contacts.
Apply these tracks together and do not add the same heading as object yaw.
Set roll in the bake options so the contact solver uses that roll too.
Use `character: who` for a custom build. Support toes are held at their
planting point through the first 0.6 beat, then released smoothly;
`plantFeet: false` disables this. `planted: false` also reports an unreachable
plant, a releasing stance, or disabled planting. Keep travel per step within
leg reach. To close a loop, use complete orbits and routines, an even number
of beats for the alternating contacts, and a whole number of extra body
revolutions (`spins * orbits`). Fractional spins can require multiple orbits
to close. Run the video loop check for the whole scene.

For a custom path or pivot, `plantDanceFoot({ character, pose, position },
side, worldPoint, 'toe' | 'ankle')` returns the adjusted **pose and position**
and a `reached` flag. Apply both outputs: the vertical position correction
transfers weight to the supporting leg. It does not translate sideways to
hide an unreachable target. The default point is `toe`; `reached` means
the joint is within 0.002 times the character height of the target.
`danceJoint(partner, chain, joint)` reads a world-space joint with pose yaw,
roll, grounding and position applied: arm index 2 is the wrist, leg index 2
the ankle, and leg index 3 the toe. Include heading in `pose.turn`
(quarter-turns); these contact helpers do not read scene object rotations.
Foot IK preserves authored `leg.left.rotate` and
`leg.right.rotate` hip turn-out when placing either ankle or toe, including
straight-leg contacts at full reach.

For partner dandiya use `meetDandiya(a, b, { sideA, sideB, point, length })`,
where each partner has `{ character, pose, position: [x,y,z] }`. Both grips
and stick tips are solved in world space. It returns `a`/`b` poses, two
`sticks` (`grip` → `tip` segments), the shared `point`, and `reached`. Defaults:
right hands, chest-height contact, stick length 0.22 of the shorter height.
The default point is halfway between the partners in x/z and at the higher
position y plus 0.62 times the shorter height. `reached` means both tips
are within 0.002 times that height of the point; inspect it before applying
an unreachable solve. Neither partner's position changes. The returned
poses set the selected hands to the `hold` shape. Dandiya frames and circle
bakes supply choreography, not stick geometry or automatic partner IK;
call `meetDandiya` and draw its segments yourself.
Blend strike poses with `humanDanceFrame('dandiya', beat).pose` between hits,
using its `strike` envelope; draw the returned sticks at each arm's depth.
Construct the contact character from the same options as the rendered dancers,
including height, head size, figure, limb proportions, line width and hands.
The festive live and headless examples use `character(people[0])` so their
solver and displayed bodies share the same geometry.

In a 3D beat script, use `{ do: 'dance', dance: 'garba', bpm: 120, beats: 8 }`
and `{ do: 'spin', turns: 2, for: 1500 }`. Spin preserves the full signed
rotation, unlike `face`, which deliberately chooses the shortest route.
`spin` starts from the current heading, defaults to one positive revolution
over 1000 ms, and turns at constant angular speed; negative and fractional
`turns` are allowed. `dance` defaults to the style's BPM and one routine.
With only `for`, its beat count is `for * bpm / 60000`; with both `beats`
and `for`, that many beats are fitted into `for` ms, overriding the tempo.
The script dances in place: use circle helpers for travel and foot plants.
`at` must be finite and non-negative; `for`, `bpm` and `beats` must be
finite and positive, and `turns` must be finite. Invalid beats are reported
by `checkCharacterBeats3D` and rejected by `characterScript3D`.
`face` honors an explicit `for` duration even when already facing the target.
Scripted dances blend in for up to 150 ms within their duration, preserving
a preceding hold, including relaxed hands. Missing hand fields use `HAND_REST`
for both the start anchor and entry blend; explicit values, including zero,
are preserved. Hand pose transitions use the same rest fallback.
Unchanged action-start anchors preserve the preceding
transition's endpoint easing; the next action keeps its own easing.
Circle track `count`, when given, must match the target count.
Garba, three-clap garba and dandiya are also in the editor's Character and
3D Scene dance menus. The Character menu follows the audio's beat grid.
Native styles offer a whole routine, without individual moves; their tracks
do not replace existing view or spin tracks. The Character menu keys hands
only with Cartoon gloves or Natural hands. The 3D Scene menu uses the style's
default tempo and omits hand tracks.

See `examples/headless-video/garba-circle.mjs` for a complete looping scene.
The Examples page also includes **Navratri: Festive Garba & Dandiya**, with
festive clothing, larger decorated sticks, partner strikes and half/full
spins. Render `examples/headless-video/festive-dandiya.mjs` for its video.

![Every dance style's moves and every flip](model-sheet/dance-and-flips.png)

The sheet is `examples/headless-video/dance-sheet.mjs`.

```js
import { danceFrame, drawStickFigure } from '@algorisys/tinyfly/characters'

// Beats, not milliseconds: any tempo plays the same dance.
const beat = (time * 120) / 60000
const { pose, hands } = danceFrame('disco', beat)
drawStickFigure(ctx, pose, { height: 220, hands: { ...hands } })
```

## The joints that make it dance

Dancing needs more than shoulders, elbows, hips and knees. These pose fields
are numbers like every other, so they blend and can be timeline tracks:

| Field | Meaning |
|---|---|
| `leftWrist`, `rightWrist` | Wrist bend, degrees, added to the forearm like the elbow is to the upper arm. Turns `handAngle`, `fingertips` and the drawn hands |
| `leftAnkle`, `rightAnkle` | Positive points the toe down (onto tiptoe, which lifts the body); negative flexes it up onto the heel |
| `leftFootOut`, `rightFootOut` | Feet turned out (positive, 1 fully sideways) or in (negative) from their natural splay: Bharatanatyam's turn-out, a twist |
| `spin` | The whole body turned about the hips, degrees: positive rolls forward (a front flip), negative backward. Front-on (`turn` 0) it is a cartwheel |
| `rise` | Lift off the ground, as a fraction of the height. Once off the ground, the feet stop being planted, so a tuck keeps the hips' height |

The joints gain `fingertips` (where each hand reaches), and `handAngle` now
includes the wrist. All of these default to 0, which draws exactly as before.

### Hands with fingers

`style.hands` replaces the dot hands with [cartoon hands](cartoon-hands.md),
posed per side and turned by the wrist:

```js
drawStickFigure(ctx, pose, {
  hands: { left: HAND_SHAPES.fist, right: HAND_SHAPES.point, size: 0.1 },
})
```

Dance keys set hand shapes by name: any of `HAND_SHAPES` (`point`, `fist`,
`spread`, `peace`, `cupped`…) or the `MUDRAS` of Indian classical dance:
`pataka`, `tripataka`, `alapadma`, `mushti`, `shikhara`, `hamsasya`,
`katakamukha`.

## Moves, styles and routines

A **move** is a short loop of keys counted in beats. Each key changes some
joints from the previous key (`reset: true` starts again from the stance), may
set hand shapes, and names the easing into it:

```js
const point = {
  label: 'The point',
  beats: 2,
  easing: 'ease-out-cubic',
  keys: [
    { beat: 0, pose: { rightShoulder: 150, leftShoulder: 40, leftElbow: -105, lean: -5 }, hands: { right: 'point', left: 'fist' } },
    { beat: 1, pose: { rightShoulder: -30, lean: 5 } },
  ],
}
```

A **style** gathers a stance (the base every move builds on), a face, a
**groove** (a knee bounce on or off the beat and a sway over two beats, which
every move carries), its moves, and a **routine** that strings them together.
Steps can be mirrored (left and right swap), and one step blends into the next
over half a beat.

```js
const twoStep = {
  label: 'Two-step',
  bpm: 100,
  stance: { leftHip: 12, rightHip: 12 },
  expression: 'happy',
  groove: { bounce: 10, accent: 'down', sway: 3 },
  moves: { point },
  routine: [
    { move: 'point', beats: 8 },
    { move: 'point', beats: 8, mirror: true },
  ],
}
```

`DANCE_STYLES` has eleven ready-made styles. Each is plain data, so copy one and
change it:

| Style | Moves |
|---|---|
| `disco` | the point, rolling arms, bump and clap |
| `hipHop` | bounce (down on the beat), running man (side-on), arm wave |
| `breaking` | toprock (Indian step), kick out, b-boy stance |
| `jazz` | jazz hands, kick ball change (pointed toe), jazz square, drop into the splits |
| `kpop` | point combo, big heart and finger heart, isolations (sharp hits) |
| `bollywood` | thumka, screw the bulb and pat the dog, cross and flick |
| `bhangra` | the bhangra step (knee lifts, arms up), dhamaal jumps |
| `bharatanatyam` | tatta adavu (stamps in aramandi), natta adavu, alapadma to the sky |
| `charleston` | kick forward and back, swivel (heels in, heels out with `footOut`), crossing knees |
| `tap` | side-on: shuffle ball change, single time step (stamp, shuffle, hop, step, flap, step), heel toe, cramp roll; every strike is in `taps` |
| `popping` | side glide (front-on), moonwalk and forward glide (side-on), toe stand; the glides travel (see below) |

### Travelling moves: glides and the moonwalk

Most moves dance on the spot. A move with `travel` carries the figure across
the floor at a steady speed: `travel` is the ground one loop covers, as a
fraction of the figure's height, positive toward +x (the way a side-on figure
faces). The moonwalk's is negative, so it slides backward while its feet look
like they step forward. A mirrored step travels the other way front-on (left
and right swap) and keeps its direction side-on (the figure still faces the
same way).

Popping's glides follow one rule. On each beat one foot is planted on its toe
and drops its heel while the other slides flat along the floor; then they
swap. Their keys are linear and their `travel` matches the planted foot, so
that foot stays put on the floor while the body glides over it. The tests
check this with `stickFigureJoints()`. The popping routine glides right, back
left, moonwalks away and glides forward home, so it loops on the spot.

```js
import { danceFrame, danceTravel, danceTravelTrack, drawStickFigure } from '@algorisys/tinyfly/characters'

const { pose } = danceFrame('popping', beat, { move: 'moonwalk' })
const x = startX + danceTravel('popping', beat, { move: 'moonwalk' }) * 220 // heights → px
drawStickFigure(ctx, pose, { height: 220 })

// On a timeline: an x track with linear keys where the speed changes.
const xTrack = danceTravelTrack('tum', 'popping', { bpm: 100, height: 220, x: 340 })
```

`bakeDanceTracks()` and the editor's **🕺 Dance from playhead** add that `x`
track themselves when given the figure's height (the editor uses the
character's, from where it is at the playhead). With `danceTracks()` add
`danceTravelTrack()` beside the two tracks. It eases in and out over the same
`fade` (default 1 beat), so the figure does not glide before it has danced in.
Pass `fade: 0` for full speed from the first beat to the last. A routine that does not come back
keeps going the same way each time it loops. The Dance Floor carries its
dancer off one side of the stage and brings it back in at the other.

### Dancing to music

Beats are the tempo's: `beatAt(time, bpm, start)` turns time into beats, so
`danceFrame(style, beatAt(time, music.bpm, music.firstBeat))` keeps a dancer
on the music. To find a song's tempo and its first beat, use the engine's
`detectTempo(samples, sampleRate)` (see the API reference); in the editor, an
Audio element's **🎵 Detect tempo** does it, and a Character's dances then
follow the beat.

### Taps: when the feet strike the floor

A key can name the parts of the feet that strike the floor on it:
`taps: ['rightToe']`, `['leftHeel']`, or both of a foot for a stamp. Tap is
built on them, and Bharatanatyam's stamps carry them too. `danceTaps(style,
from, to)` lists the strikes between two beats (the end not included), in
order, through the routine and its mirrored steps, so calling it each frame
with the last frame's beat and this one's gives exactly the taps that just
happened: play a sound, flash the foot, shake the floor.

```js
for (const { beat, tap } of danceTaps('tap', lastBeat, beat)) {
  playClick(tap.endsWith('Heel') ? 'heel' : 'toe')
}
```

The Dance Floor example flashes the foot at `joints.toes[side]` and, with
"tap sounds" on, clicks through Web Audio.

### The functions

```ts
danceFrame(style, beat, { move?, mirror? }): { pose, hands }  // the routine, or one move on a loop
stickToHuman(pose): CharacterPose                             // a stick pose on a v2 character
danceTaps(style, fromBeat, toBeat, options?): { beat, tap }[]  // foot strikes, for sounds
danceTravel(style, beat, options?): number                    // ground covered, in heights
danceTravelTrack(target, style, { height, x?, bpm?, beats?, start?, fade?, move?, mirror? }): Track | undefined
mirrorHumanPose(pose): CharacterPose                            // a v2 pose's mirror image
dancePose(style, beat, options?): StickPose
routineBeats(style): number
beatAt(timeMs, bpm, startMs = 0): number
mirrorPose(pose): StickPose
applyGroove(pose, groove, beat): StickPose
danceStance(style): StickPose
```

### On a timeline

Give a stick-figure target a dancer, then two small tracks make it dance:
`beat` counts beats at the tempo, and `dancing` blends it in from standing and
back out.

```js
import { stickFigureTarget, dancer, danceTracks } from '@algorisys/tinyfly/characters'

const tum = stickFigureTarget({ x: 340, y: 300, dance: dancer('bollywood'), style: { hands: {} } })
const tracks = danceTracks('tum', { bpm: 120, beats: 32, start: 1000 })
```

For a timeline that must stand alone as JSON (no `dance` option), bake the
dance into pose keyframes, a few per beat:

```js
bakeDanceTracks('tum', 'kpop', { bpm: 125, beats: 16, samplesPerBeat: 4 })
```

Hand shapes bake too, as `hand.left.*` / `hand.right.*` tracks (one per hand
pose field that moves, such as `hand.right.index.curl`). A target drawn with
`style.hands` has a prop for every hand field, so those tracks pose its
fingers; pass `hands: false` to leave them out.

### On a v2 character, and in the editor

`stickToHuman(pose)` turns a stick-figure pose into a v2 character pose, so
every dance and flip plays on `character()` figures too. Each stick limb angle
is split by the view into a sideways `spread` and a forward `swing`, and the
character turns the same way. Front-on, a stick leg lies in the picture: on
the character that is a leg turned out 90° at the hip (`leg.*.rotate`), so
knees bend out over the toes as they do on the stick figure (Bharatanatyam's
half-sit, a plié). Foot turn-out becomes `leg.*.toeOut`, and `rise` and `spin`
become `lift` and `roll`. Pass the frame's hands too, `stickToHuman(frame.pose,
frame.hands)`, and it adds the `hand.left.*` / `hand.right.*` fields a
character with `hands: 'cartoon'` draws: the shapes and mudras, with the wrist
bends as each hand's `roll`. `handStyle: 'natural'` gives five-fingered hands,
so mudras read finger by finger.

```js
import { character, drawCharacter, danceFrame, stickToHuman } from '@algorisys/tinyfly/characters'

const frame = danceFrame('bharatanatyam', beat)
drawCharacter(ctx, character({ figure: 'fluid', hands: 'cartoon', handStyle: 'natural' }), stickToHuman(frame.pose, frame.hands), time)
```

In the editor, a **🧍 Character** has a **Dance** section: pick a style, a
move (or the whole routine) and a tempo, then **🕺 Dance from playhead**. Or
pick a flip and **🤸 Flip at playhead**. Both write ordinary keyframes, a few
a beat, and keep the character's keys before and after. Glides and the
moonwalk also write an `x` track from where the character stands. A character
using a converted stick-figure style and facing left (the *Side (left)* view)
dances the mirror image (`mirrorHumanPose()`:
sides swap, it turns, tips and rolls the other way) and glides the other way;
it turns between 3 (side-on, facing left) and 4 (front-on), never round the
back. With **Hands:
Cartoon gloves** or **Natural**, dances key the hand shapes and mudras too. Flips travel from where
the character is, the way it faces: pick the *Side* or *Side (left)* view
first.

### Side-on moves

Moves can be danced side-on (tap, the running man). Side-on, a limb's angle
swings it forward or back, and forward is a positive angle for the right limbs
and a negative one for the left. The groove follows: both knees bend forward.
Mirroring a side-on pose gives the move to the other arm and leg while the
figure keeps facing the same way; front-on it is a mirror image.

## Flips

A flip is one continuous motion: wind up (crouch, arms back), take off (arms
swing up, toes push), the air, and land (absorb in a crouch, stand).
`progress` runs 0 → 1 through all of it. The body's pose is keyed; the turn
and the height are not. In the air the hips follow a parabola, and the turn
starts at take-off and is quickest at the top, where a tuck spins fastest.
After landing the turn is a whole number of turns, drawn as none, so the
figure blends on into any other pose.

```js
import { flipPose, flipTravel, flipTracks, FLIPS } from '@algorisys/tinyfly/characters'

const figure = flipPose('backFlip', 0.5)          // upside down, at the top
const x = startX + flipTravel('backFlip', 0.5, 220)  // ground covered so far, px

// As keyframe tracks (every moving joint, spin, rise, and x when given a height):
const tracks = flipTracks('tum', 'frontFlip', { start: 2000, height: 220 })
```

| Flip | Seen | Notes |
|---|---|---|
| `frontFlip` | profile | tuck, rolls forward |
| `backFlip` | profile | tuck, rolls backward |
| `layout` | profile | back flip with a straight, arched body |
| `scissorFlip` | profile | legs scissor through the turn |
| `sideFlip` | front-on | tucked side flip |
| `cartwheel` | front-on | arms overhead reach the ground half way round |
| `backHandspring` | profile | arms reach back to the ground, legs snap over |
| `splitLeap` | profile | grand jeté: a front split in the air, no turn |
| `toeTouch` | front-on | straddle jump, hands reaching for the toes |

Each `Flip` is data (`view`, `spin`, `height`, `travel`, `takeoff`, `landing`,
`duration`, `keys`), so new ones are a copy and a few numbers. To flip in the
middle of a dance, blend from the dance pose to `flipPose()` over the first and
last tenth of the flip, as the Dance Floor example does.

## Full splits

`POSES.sideSplit` (front-on, legs straight out to each side) and
`POSES.frontSplit` (in profile, one leg forward, one back) put the legs flat
along the floor; the planted feet bring the hips right down to it, so a split
is just a pose to blend into. Jazz's `splitDrop` move slides down into one,
holds, and gathers back up through a crouch.

## Limits

The stick figure is drawn in one plane, front-on or in profile. Floor work
(windmills, headspins, freezes on the hands) and body rolls need a bendable
spine and limbs that reach a point; those come with
[Characters v2](character-system-plan.md).
