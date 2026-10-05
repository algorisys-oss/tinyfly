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
and open rims. `roughness`, `metalness` and `emissive` are for the realistic
look (three.js, a later milestone); the stylized renderer ignores them, so one
material serves both.

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
| `activeCamera` | the scene, target `<sceneId>` | a camera's id: **a cut is one keyframe** |

Animate either the components (`x`, `rotateY`) or the vector (`position`,
`quaternion`) of one object, not both: `validateScene3D(scene, tracks)` says
so instead of picking a winner.

**Orbiting** is a rotation, not a path: put the camera on a `group` and turn
the group. `orbitPosition(target, yaw, pitch, distance)` and
`dollyPosition(eye, target, amount)` place cameras for keyframes.

## Drawing

```ts
loadScene3D(json): LoadedScene3D            // validates and builds meshes once (throws with every problem)
validateScene3D(json, tracks?): string[]    // problems as sentences, empty when fine
resolveScene3D(loaded, values, { width, height }): ResolvedScene3D   // pure: matrices, camera, lights, sorted triangles
drawScene3D(ctx, loaded, values, { width, height })                // resolve and draw, in one call
new Scene3DAdapter(new Canvas2DRenderer(ctx), { width, height })   // registerScene, applyState(state), render()
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

Outside scenes, `drawCharacterInView(ctx, character, pose, projection, { height })`
draws a character through any camera (`projection.toView` / `toScreen`), and
`skeletonInView` / `stagePlanSpace` give its joints.

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
- Objects drawn whole, such as characters in their pen look, go on
  `overlay`, a 2D canvas laid over the GL one (in front of the meshes);
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
