# Cricket stories

Build a cricket scene and a play as JSON with `@algorisys/tinyfly/sports`.
The same data runs in a browser, Worker or Node. Players use tinyfly's
existing organic adult and child rig. Try the [interactive cricket example](https://tinyfly.app/examples/live-cricket-story)
or its [full-page view](https://tinyfly.app/examples/live-cricket-story/full).

```ts
import { Timeline } from '@algorisys/tinyfly'
import { cricketClip, cricketCameraTracks, cricketEventAt } from '@algorisys/tinyfly/sports'
import { characterObjects } from '@algorisys/tinyfly/characters'
import { loadScene3D, drawScene3D } from '@algorisys/tinyfly/scene-3d'

const clip = cricketClip({ format: 't20', action: 'stumping', cast: 'mixed' })
const tracks = [...clip.timeline.tracks, ...cricketCameraTracks(clip, { view: 'keeper' })]
const timeline = new Timeline({ ...clip.timeline, tracks })
const scene = loadScene3D(clip.scene, { kinds: [characterObjects] })
// Your explicit clock supplies time in milliseconds.
function draw(ctx, time) {
  drawScene3D(ctx, scene, timeline.getStateAtTime(time).values,
    { width: 1280, height: 720, time })
  const caption = cricketEventAt(clip.events, time)?.caption
  return caption
}
const json = JSON.stringify({ ...clip, timeline: { ...clip.timeline, tracks } })
```

With script tags, load `tinyfly.iife.js` and the scene-3d add-on. Sports builders
and characters are available on `tinyfly`; scene rendering uses the add-on.
See [getting started](getting-started.md) for the versioned CDN URLs.

## Builders

| API | Result |
| --- | --- |
| `cricketPlayer({ id, role, preset?, format?, height?, position?, color?, headwear?, appearance? })` | An owned JSON `character` scene object. Roles: batter, bowler, keeper, fielder, umpire. Presets include youngMan, youngWoman, childBoy, childGirl. |
| `cricketField({ id?, format?, cast?, boundaryRadius?, markingProfile?, battingColor?, fieldingColor? })` | `scene`, `format`, `boundaryRadius`, `landmarks`, `markingProfile`, `fieldingArea`; stock fielders have human-readable JSON `name` labels. A 20.12 × 3.05 metre pitch, standard creases, wickets/bails, two bats, ball, boundary, eleven fielding players, two batters and two umpires. |
| `cricketFieldingAreaContains(field, point)` | `true` inside/on the ideal restriction-area capsule, `false` outside, `null` without region metadata. Uses x/z; point height is ignored. |
| `cricketFieldingPositions(field)` | Owned setup-position data for stock fielders: `id`, `name`, `position`, `inside`. |
| `cricketFieldingOverlay(field)` | Optional static JSON line markers, green inside/orange outside. Append to scene objects without changing motion. |
| `cricketAction(field, { action?, duration?, every? })` | A JSON timeline, timed events/captions and declared example result. Does not modify the field. |
| `cricketPlay(field, options)` | Composes independent delivery, shot, finish, fielding, context and candidate decision; returns `play`, `ruling`, timeline, events and result. |
| `cricketPlayClip(options)` | Builds a field and composed play together. |
| `cricketClip(options)` | Combines field and action; default T20, adult cast, pace bowling, 6000 ms. |
| `cricketCameraTracks(clip, { view?, yaw?, zoom?, every? })` | Ordinary scene camera tracks. Merge these with the action tracks. |
| `cricketEventAt(events, time)` | Most recent event at that time, including when seeking backward. |
| `ballFlightPoint(options, time)`, `ballFlightTracks(options)` | Shared sampled arcs for other sports too. `from`, `to`, `arc`, `curve`, `start`, `end`, `target`; exact endpoints. |

Units are metres, milliseconds and degrees. `cast` is `adults`, `men`, `children` or
`mixed`; `CRICKET_CASTS` exports their labels. `men` uses the existing youngMan
organic preset for every role; adults/children/mixed retain their varied casts; `format` is `test`, `odi` or `t20`. `boundaryRadius` defaults to 64 m
and accepts 24–250 m. A boundary is venue dependent. Sampling defaults to 40 ms,
accepts 16–1000 ms and always includes play contact events. Durations accept
4000–60000 ms; changing duration scales the whole play. Player height accepts
0.5–3 m. Bare heads are the default; optional `headwear` is `none`, `cap` or
`sun-hat`. Appearance is JSON data, without canvas hooks or rig callbacks.

The standard action builder expects the named actors/equipment from
`cricketField`; required actors must be unparented with no object rotation or
scale. It owns poses and paths for that layout. Customize appearance and
uniforms before compiling; author your own scene tracks for a different layout.

Fielders watch the bowler during the run-up, smoothly pick up the moving ball
after release, track its flight and bounce, then follow it after contact or a miss. Head turns
use the rig's neck frame, including torso lean, and are independent of the
camera. Stationary fielders turn their bodies toward the play; running players
face their travel and collectors keep their catch/throw poses. The striker uses
a side-on right-handed guard: left shoulder and front foot toward the bowler,
soft knees, both feet supported, left hand above the right on the handle and a
bat resting near the back foot. These authored poses also fit the child rig.

The live example keeps cast/action/camera selection and playback/scrubbing in a
panel beside the scene, or above it on narrow screens. Select **Men** in Cast for
the male team; individual players remain editable through `cricketPlayer`.

## Teams and stock field positions

Each team has eleven players. `cricketField` shows all eleven of the fielding
XI, two on-field batters (striker and non-striker) and two umpires. The other
nine members of the batting XI wait off-field.

`CRICKET_FIELDING_POSITIONS` exports the stock actor IDs and labels as plain
JSON data. Each corresponding scene object also carries the label in `name`:
Bowler, Wicketkeeper, Extra cover (`fielder`, the collecting actor), Slip,
Point, Cover, Mid-off, Mid-on, Square leg, Fine leg and Third man. IDs used by
action tracks remain stable. These are illustrative placements, not a roster
or automatic field-setting system.

For this right-handed striker, the off side is in front of the chest (+x),
and the on or leg side is behind the back (−x). Mid-on stands on the leg side
closer to the pitch toward the bowler; long-on is its deeper boundary
alternative. Long-on is not an additional stock fielder. Choose a different
layout by authoring your own scene and tracks.

Wicketkeeper and slip stand behind the striker. Their attention follows the
actual delivery through its flight and bounce rather than turning to the batter
before the ball arrives. Their native head poses aim at world targets,
independently of their body yaw and camera selection. The live example's
**Teams and field positions** disclosure uses the scene's JSON labels.

## Field marking profiles

`markingProfile` is `icc-men` (default), `icc-women` or `mcc`, independent of
`cast`. `CRICKET_MARKING_PROFILES` exports their names, dimensions and summaries.
These select field markings only; venue boundaries, player eligibility,
powerplay phases and the rest of a competition's conditions require separate
checks. A caller-selected small boundary remains an illustrative venue.

| Profile | Popping crease painted on each side | ODI/T20 restriction area |
| --- | --- | --- |
| `icc-men` | 7.5 m | Wicket-centred semicircles of radius 27.43 m, joined by straight sides |
| `icc-women` | 7.5 m | Wicket-centred semicircles of radius 23 m, joined by straight sides |
| `mcc` | 1.83 m minimum | None prescribed by the base Laws |

Test has no restriction-area line for any profile. All profiles retain the
20.12 m pitch, the 1.22 m popping-crease offset and the return-crease positions.
The painted popping crease is a finite visual mark; the actual crease is
considered unlimited in length. The existing object ID `fielding-circle` is
retained for the corrected capsule outline. For ICC men its extrema are
x = ±27.43 m and z = ±37.49 m; the two arc centres are z = ±10.06 m.

The dimensions follow MCC 2026 Law 7.3 and ICC October 2026 clauses 7.3/28.7.
Sources: [MCC Laws](https://www.lords.org/getmedia/a4ef9f77-2a25-4f5b-a286-4601f08e6334/Laws-of-Cricket-2017-Code-4th-Edition-%282026%29_5.pdf),
[ICC men Test](https://images.icc-cricket.com/image/upload/prd/a8114zro5tkioifz0jqg.pdf),
[ODI](https://images.icc-cricket.com/image/upload/prd/bxkzkcyvfn6tvi70zh0w.pdf),
[T20I](https://images.icc-cricket.com/image/upload/prd/bsxcho7ufe2pjban0wjp.pdf),
[ICC women Test](https://images.icc-cricket.com/image/upload/prd/hbwwi78pugzpdwft0v4v.pdf),
[ODI](https://images.icc-cricket.com/image/upload/prd/qunpw1kfh3ibxlz58jlw.pdf) and
[T20I](https://images.icc-cricket.com/image/upload/prd/o3vhm0zw7pppoxpgopke.pdf).

```ts
import { cricketField, cricketFieldingAreaContains, cricketFieldingPositions,
  cricketFieldingOverlay } from '@algorisys/tinyfly/sports'

const field = cricketField({ format: 't20', markingProfile: 'icc-women' })
const inside = cricketFieldingAreaContains(field, [0, 0, 30]) // true
const setup = cricketFieldingPositions(field)
const outside = setup.filter(player => player.inside === false)
const sceneWithMarkers = { ...field.scene,
  objects: [...field.scene.objects, ...cricketFieldingOverlay(field)] }
```

Classification uses the ideal capsule rather than a midpoint circle. Points on
its boundary count as inside, with a 1 nm numeric tolerance. `null` distinguishes
an absent area from an outside point, including older/custom JSON fields with
no `fieldingArea` metadata. The query accepts world-ground x/z reference points;
it does not judge whole-player/foot placement or whether a field is legal.
The setup helpers read the stock players' unparented scene positions. Markers
stay there during playback. Both ICC stock layouts have nine reference points
inside and two outside (Fine leg and Third man), useful for a powerplay placement
illustration; this is not automatic umpiring.

Select **Markings** and **Setup field markers** in the example, then choose an
overhead/whole-ground camera. Profile and overlay changes preserve current
story time and playback; selected zoom is retained. Downloaded JSON includes
the profile, analytic region metadata, corrected line and optional markers.

## Review zoom

Pass `zoom` to `cricketCameraTracks(clip, { view: 'batter', zoom: 2 })` for
2× magnification. All eight views support 0.25–4 (default 1), including orbit
and ball follow. Zoom changes the field of view while preserving camera position,
look target, clipping distances, player motion and current story time. Invalid
or non-finite zoom values throw. The generated camera tracks are ordinary JSON.

The example provides a 25%–400% slider, zoom-in/out buttons and **Reset**.
Zoom persists while choosing another play, cast or view, and downloaded story
JSON includes the selected magnification. Native range controls support keyboard
and touch review; zooming does not seek, pause or restart playback.

## Plays and cameras

`CRICKET_ACTIONS` contains sixteen plays:

- `bowling`, `spin`: run-up, delivery, bounce and keeper collection.
- `batting`, `defend`: drive or block with two hands gripping the bat.
- `running`: batters change ends for one illustrated run.
- `four`, `six`: grounded boundary or boundary crossed in the air, with signals.
- `catch`, `fielding`, `throw`: aerial catch, ground collection or return throw.
- `bowled`, `lbw`, `stumping`, `run-out`: distinct authored dismissal examples.
- `no-ball`, `wide`: extra, umpire signal and an uncounted delivery.

The ball releases from a rendered palm, meets the blade at contact, and follows
the collecting hand. Bails move after the relevant wicket break. Bats scale
with child proportions. Events carry `id`, `time`, `kind`, `label`, `caption`;
the timeline also contains matching markers and English captions.
Drive and ground-fielding plays use distinct collection positions, with the
ball and fielder keyed to the same palm contact.
Defensive blocks retain their downward two-hand bat pose and emit the `contact`
event with the “Bat contact” label. Pace, spin, no-ball and stumping deliveries
pass outside the off stump on the side away from the batter, allowing for the
displayed ball and stump radii before collection. Their positive-x clearance
path also avoids both native legs throughout the delivery, including the
striker’s movement during stumping. Bowled keeps its intentional
wicket collision; stumping keeps the later hand-held wicket break.

`CRICKET_VIEWS` offers `pitch`, `batter`, `bowler`, `keeper`, `field`, `overhead`,
`orbit` and `follow-ball`. `yaw` chooses any azimuth; `orbit` adds a complete
360° revolution over the play. `CRICKET_CAMERA_ANGLES` provides suggested
starting angles. Equivalent azimuths such as 0° and 360° use identical geometry.
The field camera's clipping range scales with the boundary radius so wide views
include the full supported ground. Following the ball samples only its three
position channels with forward keyframe cursors, using the requested camera
spacing without evaluating actor tracks.

Development full-page previews load the local browser API and scene add-ons;
production previews and copied HTML retain the versioned CDN bundles.

## Composed plays and authored decisions

Use `cricketPlay` on an existing field or `cricketPlayClip` for a new scene.
Delivery legality is authored, not calculated from foot geometry. No-ball uses
the stock front-foot overstep, while shots, catches and wicket breaks retain
their native contact keys. A candidate dismissal is separate from that motion;
omitted/null `decision.dismissal` means no dismissal.

```ts
import { cricketPlayClip } from '@algorisys/tinyfly/sports'

const first = cricketPlayClip({
  format: 't20', delivery: { style: 'pace', legality: 'no-ball' },
  shot: 'miss', finish: 'stumps', decision: { dismissal: 'bowled' },
})
// Bails fall, but ruling is { dismissal: null, reason: 'no-ball' }.
// result: 0 bat runs, 1 extra, 0 wickets, legalBall false, freeHitNext true.
const next = cricketPlayClip({
  format: 't20', delivery: { style: 'spin', legality: 'legal' },
  context: { freeHit: first.result.freeHitNext },
  shot: 'drive', fielding: 'catch', decision: { dismissal: 'caught' },
})
// Catch stays visible. Not out; this legal delivery consumes the free hit.
// Store/advance innings, score, strike and lesson state in your application.
const again = JSON.stringify(next) // normalized play + ruling + all motion/events
```

`play` contains owned, normalized input. `action` identifies the compiled stock
motion recipe; it does not declare the composed verdict. `ruling` holds the
accepted dismissal or null and its reason. `result.dismissal` exists only for an
accepted dismissal. Decision changes preserve the ball/actor motion, apart from
the umpire signal. Physical catch, pad contact and wicket-break captions stay
separate from the final **Out** / **Not out** decision.

| Component | Choices/default |
| --- | --- |
| `delivery.style` | `pace` (default), `spin` |
| `delivery.legality` | `legal` (default), `no-ball`, `wide`; select the final call, with no-ball taking precedence over Wide |
| `shot` | `miss` (default), `drive`, `defend` |
| `finish` | `none` (default), `single`, `four`, `six`, `stumps`, `pad` |
| `fielding` | `none`, `keeper`, `catch`, `gather`, `throw`, `stumping`, `run-out`; defaults below |
| `context.freeHit` | Boolean, default false; ODI/T20 only |
| `decision.dismissal` | `caught`, `bowled`, `lbw`, `stumped`, `run-out`, null (default); candidate must match the physical recipe |
| `duration`, `every` | Same scaling and contact-preserving sampling as `cricketAction` |

Supported physical combinations:

| Shot | Finish | Fielding (default when omitted) |
| --- | --- | --- |
| `miss` | `none` | `keeper` (default) or explicit `stumping` |
| `miss` | `stumps` / `pad` | `none` (default) |
| `defend` | `none` | `none` (default) |
| `drive` | `none` | `gather` (default), `catch`, `throw`, `run-out` |
| `drive` | `single` | `gather` (default) |
| `drive` | `four` / `six` | `none` (default) |

Other combinations throw rather than silently substitute a different play.
Wide currently supports only an untouched miss gathered by the keeper; Wide
stumping/run-out and additional Wide runs require future motion recipes.
`single`/`four`/`six` score 1/4/6 bat runs; an illegal delivery adds one extra.
Run-out depicts an attempted, uncompleted run and scores no completed runs.
Byes, leg-byes, penalties and other dismissal modes are outside this subset.

No-ball/free-hit context suppresses caught, bowled, LBW and stumped candidates,
while the supported run-out candidate remains available. A no-ball arms the
next free hit in ODI/T20; an existing free hit carries over a Wide/no-ball and
is consumed by a legal delivery. Test has no automatic free hit and rejects an
explicit current free-hit context. These conditions follow clauses 21.12,
21.17–21.18 in [ICC ODI October 2026](https://images.icc-cricket.com/image/upload/prd/bxkzkcyvfn6tvi70zh0w.pdf)
and [ICC T20I October 2026](https://images.icc-cricket.com/image/upload/prd/bsxcho7ufe2pjban0wjp.pdf).
They cover the supported authored examples, not a complete umpiring engine.

`CRICKET_PLAY_COMPONENTS` and `CRICKET_PLAY_EXAMPLES` provide JSON discovery;
the latter has five frozen examples. In the live example's **Play** selector,
choose the **Composed plays** group: no-ball/stumps, free-hit/catch,
no-ball/four, free-hit/run-out or free-hit/Wide. Free-hit choices are disabled
in Test; switching to Test from one selects no-ball/stumps. Downloads include
normalized components, ruling, result, scene, camera tracks and captions.
The original sixteen `cricketAction`/`cricketClip` presets retain their original
motion, result shape and captions.

## Teaching scope

These are authored visual demonstrations. Arcs, the enlarged ball, timings,
field placements and results are illustrative. The API does not infer a
cricket decision from collisions, enforce every law, simulate ball physics,
manage an innings or supply lesson navigation/quizzes. `result` declares
`runs`, `extras`, `wickets`, `legalBall`, `freeHitNext` and optional `dismissal`.
Use it with your own tutorial, narration, scoring or lesson system.

`CRICKET_FORMATS` records basic Test, ODI and T20 differences. Test has two
innings per side and no innings over limit; ODI/T20 have one innings per side
and maximum 50/20 overs respectively. See the [ICC format overview](https://www.icc-cricket.com/about/cricket/game-formats/the-three-formats).
No-balls and wides each add one extra and do not count as legal over balls.
The stumping example uses a legal delivery and a batter outside their ground,
without an attempted run. The LBW caption explicitly leaves a full decision's
pitching, impact and bat-contact checks to the author. Consult the
[MCC Laws, 2026 edition](https://www.lords.org/getmedia/a4ef9f77-2a25-4f5b-a286-4601f08e6334/Laws-of-Cricket-2017-Code-4th-Edition-(2026)_5.pdf).
ODI/T20 no-balls lead to a free hit on the next legitimate delivery; Test
does not add this automatically. Competition rules and effective dates matter:
see [ICC playing conditions](https://www.icc-cricket.com/about/cricket/rules-and-regulations/playing-conditions)
and the [October 2026 changes](https://www.icc-cricket.com/news/key-changes-across-formats-with-new-icc-playing-conditions).

## Headless video

After `npm run build:libs`:

```sh
node bin/tinyfly.mjs video examples/headless-video/cricket-story.mjs --stills /tmp/cricket-story
node bin/tinyfly.mjs video examples/headless-video/cricket-story.mjs -o /tmp/cricket-story.mp4
```

The example consumes the same public clip, camera and scene APIs. JSON download
in the interactive example includes the selected camera tracks, ready to sample
again after parsing. Other sports can reuse `ballFlightTracks`, character rigs
and scene cameras; cricket-specific motion remains in the sports add-on.
