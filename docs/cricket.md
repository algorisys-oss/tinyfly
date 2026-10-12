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
| `cricketField({ id?, format?, cast?, boundaryRadius?, battingColor?, fieldingColor? })` | `scene`, `format`, `boundaryRadius`, `landmarks`. A 20.12 × 3.05 metre pitch, standard creases, wickets/bails, two bats, ball, boundary, eleven fielding players, two batters and two umpires. |
| `cricketAction(field, { action?, duration?, every? })` | A JSON timeline, timed events/captions and declared example result. Does not modify the field. |
| `cricketClip(options)` | Combines field and action; default T20, adult cast, pace bowling, 6000 ms. |
| `cricketCameraTracks(clip, { view?, yaw?, every? })` | Ordinary scene camera tracks. Merge these with the action tracks. |
| `cricketEventAt(events, time)` | Most recent event at that time, including when seeking backward. |
| `ballFlightPoint(options, time)`, `ballFlightTracks(options)` | Shared sampled arcs for other sports too. `from`, `to`, `arc`, `curve`, `start`, `end`, `target`; exact endpoints. |

Units are metres, milliseconds and degrees. `cast` is `adults`, `children` or
`mixed`; `format` is `test`, `odi` or `t20`. `boundaryRadius` defaults to 64 m
and accepts 24–250 m. A boundary is venue dependent. Sampling defaults to 40 ms,
accepts 16–1000 ms and always includes play contact events. Durations accept
4000–60000 ms; changing duration scales the whole play. Player height accepts
0.5–3 m. Bare heads are the default; optional `headwear` is `none`, `cap` or
`sun-hat`. Appearance is JSON data, without canvas hooks or rig callbacks.

The standard action builder expects the named actors/equipment from
`cricketField`; required actors must be unparented with no object rotation or
scale. It owns poses and paths for that layout. Customize appearance and
uniforms before compiling; author your own scene tracks for a different layout.

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
displayed ball and stump radii before collection. Bowled keeps its intentional
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
