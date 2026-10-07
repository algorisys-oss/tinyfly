# 3D Scenes

`@algorisys/tinyfly/scene-3d` draws real 3D scenes: cameras, lights and
meshes, in world space, seen through a perspective or orthographic camera. The
scene is plain JSON; its motion is ordinary timeline tracks. It draws on a 2D
canvas in the **stylized** look (flat, smooth or toon shading, ink outlines,
fog), in browsers, Web Workers and Node, so the same scene plays on a page and
renders to MP4 with `tinyfly video`. No WebGL, no GPU, no dependencies.

Try it on the Examples page: **3D Scene: Orbiting Camera** and **3D Scene:
Dancing Characters** (under **3D**).
The plan for what comes next (a WebGL renderer, glTF models, 3D characters,
the realistic look, films) is [3D support](3d-support-plan.md).

```js
import { Timeline } from '@algorisys/tinyfly'
import { loadScene3D, drawScene3D } from '@algorisys/tinyfly/scene-3d'

const scene = loadScene3D({
  id: 'stage',
  camera: 'cam',
  background: '#1e293b',
  materials: { red: { color: '#ef4444', shading: 'toon', outline: { width: 2, color: '#0f172a' } } },
  objects: [
    { id: 'cam', kind: 'camera', projection: 'perspective', fov: 45, near: 0.1, far: 50, position: [0, 2, 6], lookAt: [0, 0, 0] },
    { id: 'sun', kind: 'light', light: 'directional', color: '#ffffff', intensity: 0.9, position: [3, 5, 4] },
    { id: 'box', kind: 'mesh', geometry: { type: 'box', size: [1, 1, 1] }, material: 'red' },
  ],
})

const timeline = new Timeline({
  id: 'spin',
  tracks: [{ id: 'turn', target: 'stage/box', property: 'rotateY', keyframes: [{ time: 0, value: 0 }, { time: 2000, value: 360 }] }],
})

// Each frame:
drawScene3D(ctx, scene, timeline.getStateAtTime(time).values, { width: 800, height: 450 })
```

On a page with no build step, load `tinyfly-scene-3d.iife.js` after
`tinyfly.iife.js`; it adds these functions to the same `tinyfly` global.

## The scene

| | |
|---|---|
| Units | metres |
| Axes | right-handed: +x right, +y up, +z toward the default camera (a camera looks down its own -z) |
| Angles | degrees; Euler `rotation` in YXZ order (yaw, pitch, roll), or a `quaternion` `[x, y, z, w]` |
| Order | `objects` is an array: parents before children; ties in depth are broken by array order |

**Objects** share `id`, `position`, `rotation` or `quaternion`, `scale` (one
number or three), `parent` (an earlier object it moves with), `visible`, and
`layer` (below).

| `kind` | Fields |
|---|---|
| `group` | (just a transform: move several objects together, or carry a camera) |
| `mesh` | `geometry`, `material` (a key of `materials`) |
| `camera` | `projection: 'perspective'` with `fov` (vertical, degrees), or `'orthographic'` with `height` (metres); `near`, `far`; optional `lookAt: [x, y, z]` |
| `light` | `light: 'ambient' \| 'directional' \| 'point' \| 'spot'`, `color`, `intensity` (1 is full light); directional and spot shine from their position toward `target` (default the origin); point and spot fade to nothing at `range`; spot's cone is `angle` (half-angle, default 30°) |

**Geometry**: `box` (`size: [w, h, d]`), `sphere` (`radius`, `segments`),
`cylinder` and `cone` (`radius`, `height`, `segments`), `torus` (`radius` to
the tube's middle, `tube`, `segments`), `plane` (a floor: `size: [w, d]`
facing up, `segments` per side), and `extrude`: any SVG `path` made solid,
`depth` metres thick and scaled to `width` metres wide (default 1), with
`curveSegments` points per curve (default 12). Subpaths inside others are
holes (an "o", a ring); outlines inside holes are solid again. The path's y
(down) is flipped to 3D's y (up). All centred on the origin.

```js
{ id: 'star', kind: 'mesh', material: 'gold',
  geometry: { type: 'extrude', path: 'M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z', depth: 0.3, width: 1.4 } }
```

**Materials**: `color`, `opacity`, `doubleSided`, and for the stylized look:

| `shading` | Looks |
|---|---|
| `unlit` | the colour as it is |
| `flat` | lit per face: faceted |
| `lambert` (default) | lit with smoothed normals: curved shapes read as round |
| `toon` | lit in `bands` steps (default 3) |

`outline: { width, color }` inks silhouettes, creases (edges sharper than 30°)
and open rims. `emissive` is light the surface gives off itself: it is added
after lighting, so the surface shows in the dark, in both renderers. Pair it
with a video's `bloom` (see [Rendering Video from Code](video-rendering.md#bloom))
for a neon glow: `{ color: '#000000', emissive: '#ff2bd6', shading: 'unlit' }`.
`roughness` and `metalness` are for the realistic look (three.js, a later
milestone); the stylized renderers ignore them, so one material serves both.

The scene can have `background` and `fog: { color, near, far }` (metres from
the camera). A scene with no lights gets a soft default (ambient plus a key
light from upper right).

## Animating it

Tracks address objects as **`<sceneId>/<objectId>`**, so a 3D scene's tracks
live in the same timeline as everything else.

| Property | On | Value |
|---|---|---|
| `x`, `y`, `z` or `position` | any object | metres |
| `rotateX`, `rotateY`, `rotateZ` or `quaternion` | any object | degrees (YXZ), or `[x, y, z, w]` on a track with `interpolation: "slerp"` |
| `scale`, `scaleX`, `scaleY`, `scaleZ` | any object | |
| `visible` | any object | 0 or 1 (children hide with their parent) |
| `opacity` | meshes | 0..1, times the material's |
| `color` | meshes, lights | a colour, over the material's or light's |
| `intensity`, `target` | lights | |
| `fov` / `height`, `lookAt` | cameras | |
| `color`, `width`, `opacity` | lines, trails | |
| `length` | trails | ms |
| `activeCamera` | the scene, target `<sceneId>` | a camera's id: **a cut is one keyframe** |

Animate either the components (`x`, `rotateY`) or the vector (`position`,
`quaternion`) of one object, not both: `validateScene3D(scene, tracks)` says
so instead of picking a winner.

**Orbiting** is a rotation, not a path: put the camera on a `group` and turn
the group. `orbitPosition(target, yaw, pitch, distance)` and
`dollyPosition(eye, target, amount)` place cameras for keyframes.

## Lines and trails

Two more kinds of object draw a band that faces the camera, as wide as
`width` metres (so it narrows with distance):

```js
// A polyline through points in its own space (it moves with its transform and parent)
{ id: 'ring', kind: 'line', points: [[0, 0, 0], [1, 0, 0], [1, 1, 0]], closed: true, width: 0.04, color: '#b6ff3b' }
// Where another object has been over the last `length` ms
{ id: 'tail', kind: 'trail', follow: 'comet', length: 1200, samples: 64, width: 0.1, color: '#00e5ff', blend: 'add' }
```

| Field | Meaning |
|---|---|
| `color`, `width` (default 0.05), `opacity` | |
| `taper`, `fade` | 0..1: how much it narrows and fades toward its start (a line's first point, a trail's tail). Trails default to 1, lines to 0 |
| `blend` | `normal` paints over what is behind; `add` adds its light: glowing beams, best on dark scenes and with [bloom](video-rendering.md#bloom) |
| `follow`, `length`, `samples` (trail) | The object it follows, how far back it reaches (ms), points along it (default 32) |
| `period` (trail) | For motion that repeats every `period` ms: earlier times wrap, so a loop's first frame already has the last lap's tail |

Each segment of the band is placed in the draw order by its own depth, so a
trail passes behind one shape and in front of another. Fog turns a normal
band toward the fog colour and dims an added one. The head ends round.

A trail is not a history of frames: it asks where the object was at earlier
times, so the same time always draws the same trail (scrubbing, seeking,
frames in any order, loops). The renderer needs a way to ask:

- in a video, nothing to do: the frame carries `stateAt`, and
  `drawScene3D(ctx, scene, frame.state?.values, frame)` passes it on;
- elsewhere, `valuesAt`: `drawScene3D(ctx, scene, values, { width, height, time, valuesAt: (t) => timeline.getStateAtTime(t).values })`,
  `resolveScene3D(…, { time, valuesAt })`, or `new Scene3DAdapter(renderer, { width, height, valuesAt })`.

Without it a trail draws nothing. `examples/headless-video/comet-trails.mjs`
is a looping comet video; the **3D Scene: Comet Trails** demo is the live
version. With the WebGL2 renderer, lines and trails go on the overlay, in
front of the meshes. For trails on a plain 2D canvas, see `drawTrail` in
[Rendering Video from Code](video-rendering.md#light-trails).

## Drawing

```ts
loadScene3D(json): LoadedScene3D            // validates and builds meshes once (throws with every problem)
validateScene3D(json, tracks?): string[]    // problems as sentences, empty when fine
resolveScene3D(loaded, values, { width, height, time?, valuesAt? }): ResolvedScene3D   // pure: matrices, camera, lights, sorted triangles
drawScene3D(ctx, loaded, values, { width, height, time?, valuesAt? | stateAt? })      // resolve and draw, in one call
new Scene3DAdapter(new Canvas2DRenderer(ctx), { width, height, valuesAt? })           // registerScene, applyState(state), render()
```

`resolveScene3D` is the whole 3D pipeline as data: world matrices, the
camera's view and projection, lights in world space, and every visible
triangle on screen with its depth, normals and outline edges, sorted. A
renderer only paints it. The same values always give the same frame, and
frames can be drawn in any order.

**In a video**, draw the scene from the frame's timeline state:

```js
export default {
  width: 1280, height: 720, duration: 9000,
  timeline: { id: 'orbit', tracks: [ /* stage/... tracks */ ] },
  draw(ctx, frame) {
    drawScene3D(ctx, scene, frame.state?.values, frame)
  },
}
```

`examples/headless-video/scene-3d-orbit.mjs` orbits a camera around lit
shapes and cuts to a wide shot; `characters-3d-dance.mjs` has two characters
dance while the camera cranes up, then cuts to a close shot.

Golden frames (`src/scene-3d/golden/`) pin the look: the same scenes must draw
exactly the same pixels on every run.

## In the editor

The editor's **🧊 3D Scene** element holds a scene like these: add shapes,
characters and lights, move and key them, dance characters from the playhead,
pick camera views and cut between cameras. Its tracks are on the element,
named `object.property` (`box.rotateY`); see the
[Editor Guide](editor-guide.md#3d-scenes).

## Characters

tinyfly's v2 characters stand in 3D scenes, seen by the scene's camera from
anywhere: in front, behind, from above. A character is an object like any
other; drawing it comes from the characters add-on, so this entry stays small:

```js
import { loadScene3D, drawScene3D } from '@algorisys/tinyfly/scene-3d'
import { characterObjects, danceFrame, stickToHuman } from '@algorisys/tinyfly/characters'

const scene = loadScene3D({
  id: 'stage', camera: 'cam', /* … */
  objects: [
    /* camera, lights, a floor … */
    { id: 'tum', kind: 'character', position: [-0.9, 0, 0], character: { look: 'clean', skin: '#f2c49b', hands: 'cartoon' } },
    { id: 'didi', kind: 'character', look: 'solid', position: [0.9, 0, 0], solid: { color: '#7c3aed' } },
  ],
}, { kinds: [characterObjects] })
```

| Field | |
|---|---|
| `character` | `character()` options: `figure`, `look` (`clean`, `pencil`, `silhouette`), `ink`, `skin`, `hands`, `handStyle`, … |
| `height` | metres (default 1.7) |
| `pose` | its pose: character pose fields (`arm.right.spread`, `turn`, `lean`, …) |
| `look` | `pen` (default): drawn by its pens, in perspective, with its face and hands. `solid`: shaded capsules along its bones, an ellipsoid head with eyes, lit, outlined and depth-sorted like the scene's meshes |
| `solid` | the solid look's `color`, `skin`, `shading` (default toon) and `outline` (or `false`) |
| `shadow` | a soft shadow on the ground under it (default true) |

A character faces +z before any turn and stands on its object's ground: its
lowest point at the object's y, so at y 0 it stands on a floor at y 0. Its
pose fields are tracks on its object, next to `x`, `rotateY` and the rest:
`stage/tum` `arm.right.spread`, `stage/tum` `turn`. Every dance and flip
plays in 3D: `stickToHuman(danceFrame(style, beat))` gives the pose, and
`mirrorHumanPose()` its mirror image for a partner. Its `turn`, `roll`,
`lift` and ground contact behave as they do front-on; seen front-on through a
flat camera, a character is exactly the 2D figure.

**Walking in metres.** `characterScript3D(id, beats, { scene, position, heading, height })`
scripts a character in world metres, as `propScript3D` does props:

```js
import { characterScript3D } from '@algorisys/tinyfly/characters'

const tum = characterScript3D('tum', [
  { do: 'walk', to: [1.4, 1.6] },                       // a gait, to a point [x, z] metres
  { do: 'pose', pose: 'wave', for: 500 },               // a named pose (or pose fields)
  { do: 'run', through: [[3.5, 0], [2.5, -3], [-3, 0]] }, // along a smooth path
  { do: 'face', toward: [0, 3] },                       // a point, or a heading in degrees
  { do: 'gag', gag: 'take' },
], { scene: 'village', position: [0.6, 0.2], heading: 0 })
```

A move is a gait (`walk`, `run`, `sneak`, `strut`, `tired`, `bouncy`,
`doubleBounce`, `shove`); it turns to face the way first and goes at the
gait's pace for its height (or `speed`, `for`). It keys `walk` (the gait's
phase) with the distance, one stride per cycle, so the feet stay planted, plus
`walking` (eased in and out) and `gait`. The character object turns those into
the stepping pose as it draws, on the pose it holds: a wave carries on while it
walks. Objects take `gait` and `walking` as fields too.

**Riding.** `propRide3D({ prop, propId, propTracks, scene, placement, anchor, riderId, pose, start, end, mount?, dismount? })`
keeps a rider's hips on a prop's seat anchor (a horse's `saddle`, a bike's or
a cart's `seat`) as the prop moves, turns, bobs with its stride and pitches,
writing the rider's `x`, `y`, `z` and `rotateY`; `mount: { from: [x, z] }` and
`dismount: { to: [x, z] }` hop it on and off. `spliceTracks(riderTracks, ride, { from, to })`
puts the ride into the rider's script, which holds the riding pose
(`RIDING_POSES.astride` or `.seated`) meanwhile and `place`s it where it got
off. A character in a scene is drawn part by part, each part at its own depth
(`characterPartsInView`), so a leg astride a horse shows on each side of it.
A seat inside a closed cabin (a car's) is not handled yet: its glass is opaque
in 3D.

Outside scenes, `drawCharacterInView(ctx, character, pose, projection, { height })`
draws a character through any camera (`projection.toView` / `toScreen`), and
`skeletonInView` / `stagePlanSpace` give its joints.

## Props

Props (cars, trucks, trees, houses, aircraft, horses, dogs, birds…) stand in
scenes too, named by their preset in plain data and drawn with the same pens
as the characters, solid or as line art:

```js
import { characterObjects, propObjects } from '@algorisys/tinyfly/characters'

const scene = loadScene3D({
  id: 'village', camera: 'cam', /* … */
  objects: [
    /* camera, lights, ground … */
    { id: 'car', kind: 'prop', prop: 'car', position: [0, 0, 3], rotation: [0, 90, 0], values: { door: 1 } },
    { id: 'barn', kind: 'prop', prop: 'house', position: [3.5, 0, -5], options: { colors: { walls: '#c0583f' } } },
    { id: 'crow', kind: 'prop', prop: 'crow', position: [0, 3, 0], values: { spread: 1, flapping: 1 }, style: 'stick' },
  ],
}, { kinds: [characterObjects, propObjects] })
```

| Field | |
|---|---|
| `prop` | the preset's name (`car`, `truck`, `bus`, `tractor`, `cart`, `trainCar`, `bike`, `motorbike`, `tree`, `house`, `helicopter`, `airplane`, `horse`, `dog`, `cat`, `cow`, `songbird`, `crow`, `chicken`); a wrong one is refused with the one probably meant |
| `options` | the preset's options (colours, sizes) |
| `values` | its control values as placed (`door`, `lights`, `spread`, …) |
| `look` | `clean` (default), `pencil` or `silhouette`, drawn with the figures' pens; or `mesh`, built of the scene's own meshes |
| `shading`, `outline` | the mesh look's shading (`toon` by default) and outline width in px (default 2) |
| `style` | `solid` (default) or `stick` (line art) |
| `ink`, `paper` | outline colour, and the paper a stick prop is filled with |
| `shadow` | its contact shadow (default true) |

A prop is built in metres, faces +z and stands on its object's ground; the
scene's camera turns it (its own `turn` and `tilt` are not used), and faces
are culled toward the camera's eye, so it is right in perspective close up.
Its controls are tracks on its object: `village/car` `wheelSpin`,
`village/horse` `walk` and `walking`, `village/crow` `wingbeat`. Keep wheels
and strides honest the way the 2D scripts do: key `wheelSpin` as the distance
over the wheel radius (`car().wheelRadius`), and a horse's `walk` phase as the
distance over `horseStrideLength('walk')`.

**Scripting props in metres.** `propScript3D(id, prop, beats, { scene, position, heading })`
compiles beats with world targets into the object's tracks (`x`, `z`,
`rotateY` and its controls):

```js
import { propScript3D, car, horse, crow } from '@algorisys/tinyfly/characters'

const drive = propScript3D('car', car(), [
  { do: 'drive', to: [9, 3] },                                   // a point on the ground, [x, z] metres
  { do: 'honk' },                                                // any action, as in 2D (controls only)
  { do: 'drive', through: [[11, 4.6], [9, 6.2], [-9, 6.2]] },   // a smooth path through points
  { do: 'face', toward: [0, 0] },                                // a point, or a heading in degrees
], { scene: 'village', position: [-9, 3], heading: 90 })
const flight = propScript3D('crow', crow(), [{ do: 'fly', to: [2, 1], height: 0 }], { scene: 'village', position: [0, 5], values: { lift: 3 } })
const timeline = deserializeTimeline({ id: 'village', tracks: [...drive.tracks, ...flight.tracks] })
```

A move (a prop's `moves`: `drive`; `walk`, `trot`, `canter`, `gallop` or
`run`; a bird's `walk` and `fly`; an aircraft's `fly`) turns to face the way
first, then goes at its own speed (or `speed`, metres per second, or `for`
ms), easing in and out. Its wheels and strides are keyed with the distance at
every moment, so wheels roll and feet step exactly; a wingbeat or a rotor
keeps time. A flier's `height` is how high it goes (`0` lands it); between
flights it stays up with its wings beating. `face`, `hold` and the prop's own
actions (`honk`, `bark`, `peck`, `door`…) work as in 2D. `checkPropBeats3D`
names what was probably meant; `end` gives where it finished, for the next
script.

**Lit by the scene.** A pen-drawn prop is lit by the scene's lights as its
meshes are (ambient, directional, point and spot, with fog): each face at its
place in the world, so a low orange sun warms its sunlit sides and a night's
blue moon darkens it. Glowing parts (lit windows, headlights: a house's or a
car's `lights` control) glow over the top, so they shine in the dark. A scene
with no lights keeps the props' own light, which follows the camera; line art
(`style: 'stick'`) stays unlit. A pen-drawn character's skin takes the light
reaching its chest from the camera's side (at most its own colour) and the fog
there: lit from behind the camera its face shows, against a low sun it goes
dark, at night it dims. Its ink is its own, so give a character a light ink in
a dark scene (`character: { ink: '#dfe5f0' }`). The solid look is lit as
meshes are.

**The mesh look.** `look: 'mesh'` builds a prop of the scene's own meshes, as
a character's `look: 'solid'` does: each part's shape is built once and placed
each frame, lit and outlined like everything else, glass see-through (so a
driver shows behind a windscreen), glowing parts as light of their own, hidden
faces left out, its shadow a soft disc. With the WebGL2 renderer its depth
order is exact, pixel by pixel; the canvas renderer sorts it triangle by
triangle, which can slip where a small part lies on a big face (a window on a
wall). For the canvas, the pen looks sort better (below); for exact depth, use
the mesh look with WebGL2.

**How props sort.** A pen-drawn prop is not drawn whole at one depth. It is
cut into columns about a metre across (along its length and width), and each
column sorts at its own depth among the scene's other things, so a figure
walking past a bus is covered by its front end and covers its back. Inside a
column, faces are drawn far to near, each with its own outlines. Faces no one
can see are left out: those inside another solid part, or lying against one
(a house's wall tops under its roof, a tyre's tread inside the fender). A
face lying on another part's face (a light, a window, a door) is drawn just
after it. Where a part sits partly into another, its `layer` says which is
drawn over (a car's cabin over its body, a roof over its walls). What is
nearer than the camera's near plane is cut away, so a camera can come close or
go inside. A pen-drawn character is still drawn whole at its middle's depth,
and painter's order has limits: for exact order use the solid look and the
WebGL2 renderer.

**Other object kinds** come the same way: an `ObjectKind` validates its
objects, prepares them once, and each frame returns meshes (shaded and sorted
with the scene's) and drawables (drawn whole at their depth). Pass it in
`loadScene3D(scene, { kinds })`.

## The WebGL2 renderer

`@algorisys/tinyfly/scene-3d/webgl` (`tinyfly-scene-3d-webgl.iife.js` for
script tags) draws the same resolved frame with WebGL2:

```js
import { loadScene3D, resolveScene3D } from '@algorisys/tinyfly/scene-3d'
import { WebGL2Renderer } from '@algorisys/tinyfly/scene-3d/webgl'

const renderer = new WebGL2Renderer(canvas.getContext('webgl2'), { overlay })
renderer.render(resolveScene3D(scene, values, { width: canvas.width, height: canvas.height }))
// or drive it from a timeline: new Scene3DAdapter(renderer, { width, height })
```

- **A depth buffer**: shapes that cut through each other, huge floors and
  long meshes draw right, with no `layer` needed.
- **Light per pixel**: smooth shading is smooth, toon bands and spot pools
  have clean edges, fog fades per pixel. The same light model as the Canvas
  2D renderer (up to 8 lights).
- **Outlines** by the inverted hull: silhouettes in the ink colour and
  width. (Creases inside a silhouette are inked only by the Canvas 2D
  renderer.)
- **See-through meshes** are drawn after the opaque ones, far to near.
- Objects drawn whole, such as characters in their pen look, lines and
  trails, go on `overlay`, a 2D canvas laid over the GL one (in front of the meshes);
  solid characters are meshes and sort properly.

It runs on a page or in a Worker (OffscreenCanvas). Node has no WebGL2, so
headless video uses the Canvas 2D renderer. The cross-browser checks
(`npm run e2e -- --check scene-3d-webgl`) compile it in Chromium, Firefox and
WebKit, compare its silhouettes with the Canvas 2D renderer's and check the
depth buffer.

## Draw order and its limits

The Canvas 2D renderer paints back to front (painter's algorithm), culling
back faces and clipping at the camera's near plane. Within a `layer`
(default 0) triangles sort far to near; lower layers draw first, so a floor at
`layer: -1` never covers what stands on it. Triangles that cross each other,
or very long ones, can sort wrongly: give big planes `segments`, keep meshes
modest, or use a layer. Each triangle has one colour, so smooth shading is
smoothed per triangle, not per pixel; more segments look rounder. The WebGL2
renderer (above) has a depth buffer and per-pixel light.

Rendering speed in Node: a 1280×720 scene of a few thousand triangles renders
at a few frames a second; parallel rendering for long films is planned.
