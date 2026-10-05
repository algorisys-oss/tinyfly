# 3D Support Plan

**Status:** Milestones 0 (rotation math, slerp tracks), 1 (CSS-style 3D in every adapter), 2 (scenes on Canvas 2D), 3 (WebGL2 renderer), 4 (the editor's 3D Scene element, first version) and 6 (3D characters) implemented; the rest planned
**Date:** 2026-10-04 (revised 2026-10-05: movies, two render modes, entries)
**Related:** [character-system-plan.md](character-system-plan.md),
[character-system-m1.md](character-system-m1.md), [camera.md](camera.md),
[video-rendering.md](video-rendering.md), [file-format.md](file-format.md)

This plan covers adding 3D to tinyfly without changing what tinyfly is: a
small, deterministic, JSON-first engine that computes values over time and
hands them to adapters. Each milestone below ships on its own, as one minor
release, with tests and a gallery demo.

3D is also meant for **movies**: short films made from data, rendered in a
**stylized** look by our own renderers or a **realistic** one by three.js, from
the same scene and timeline. The film work itself (shots, cuts, sets, sound,
long renders) is Phase 34 in `todo.md`; this plan makes sure the 3D foundation
leaves room for it (section 9).

---

## 1. Goals and non-goals

### Goals

1. **3D is data.** A 3D scene, its camera, lights, objects and materials are
   plain JSON. Their animation is ordinary tracks in an ordinary
   `TimelineDefinition`. Nothing about 3D needs a new timeline or a new clock.
2. **The engine stays renderer-agnostic.** `src/engine/` gains only pure math
   helpers (vectors, quaternions, matrices) and one new interpolation mode
   (spherical interpolation of rotations). It does not learn about meshes,
   cameras, lights or GPUs.
3. **Deterministic.** The same scene and timeline at the same time give the same
   resolved scene (the same matrices, the same draw order), in the browser, in a
   Worker and in Node. Frames can be rendered in any order.
4. **Headless works from day one.** `tinyfly video` and `renderVideo()` can
   render a 3D scene to MP4/PNG in Node with the dependencies they already have
   (`@napi-rs/canvas`, ffmpeg).
5. **Usable without the editor**, then usable in the editor, through the same
   public API.
6. **Characters can go 3D.** Character v2 already solves its bones in 3D
   (`SolvedChain.joints3`); a real camera should be able to look at them.
7. **Films.** A scene can hold several cameras and cut between them on the
   timeline, and a whole film renders frame by frame, in any order, to MP4.
8. **Two render modes from one source.** `stylized` (our Canvas 2D and WebGL2
   renderers: flat, toon, pencil; deterministic to the pixel on Canvas 2D) and
   `realistic` (the three.js adapter: PBR, shadow maps, environment light). The
   scene, timeline, shots and sound do not change between them; each renderer
   reads the material and light fields it understands.
9. **Pay only for what you import.** 3D lives in its own entries, never in `.`
   or `/player`; three.js is an optional peer dependency; nothing 3D is
   downloaded into a bundle that does not import it (section 5, *Entries*).

### Non-goals

- A general-purpose 3D engine. No physics, no scene-graph editing at runtime, no
  PBR pipeline in our own renderers (realistic mode gets PBR from three.js), no
  general post-processing stack. Films do need a little, so the stylized
  renderers get **blob / contact shadows** for characters by milestone 6, and
  films get a **small deterministic post step** (supersampled anti-aliasing,
  fog, vignette, motion blur by sub-frame sampling); shadow maps belong to
  realistic mode.
- A hard dependency on three.js, Babylon or any 3D library in the engine, the
  player, or the default adapters bundle. three.js is required only for
  realistic mode, as an optional peer dependency.
- Full glTF coverage. Compressed geometry (Draco, meshopt), KHR material
  extensions, cameras-from-file and multiple scenes per file are out of scope at
  first.
- 3D in exported Lottie files. Lottie's 3D layer support is too thin to target.
- Bit-identical GPU output across machines. Determinism is guaranteed for the
  *resolved scene* and for the CPU renderer; GPU renderers are deterministic in
  input, not in pixels.

---

## 2. What "3D" means in tinyfly

There are four distinct things people mean by "3D". They have very different
costs, so the plan treats them separately.

### 2a. 3D transforms of existing 2D targets (CSS-style 3D)

A card flips, a carousel turns, a layer tilts. The targets stay flat; only their
transform is 3D.

**What exists today:**

| Adapter | 3D support today |
|---|---|
| DOM (`src/adapters/dom/dom-adapter.ts`) | `z`, `rotateX`, `rotateY`, `rotateZ`, `scaleZ` become `translateZ()`, `rotateX()` and so on; `perspective` is emitted first as a `perspective()` transform function on the element itself. |
| SVG (`src/adapters/svg/svg-adapter.ts`) | `rotateX`, `rotateY` and `perspective` composed into a CSS transform on the SVG element. |
| Canvas (`src/adapters/canvas/canvas-adapter.ts`) | An approximation: `rotateX`/`rotateY` scale the target by `cos(angle)` vertically/horizontally. No foreshortening, no `z`, no `perspective`. |
| WebGL (`src/adapters/webgl/webgl-adapter.ts`) | 2D only: a `mat3` per quad; `rotateX`/`rotateY`/`z` are ignored. |

Gallery precedent: `src/examples/live-demos/card-flip-3d.js` already gets a
convincing 3D flip by setting `perspective`, `transform-style: preserve-3d` and
`backface-visibility` in hand-written CSS and animating `rotateY`.

**What is missing:** a parent's `perspective` (as opposed to the
`perspective()` function on the element), `perspective-origin`,
`transform-style: preserve-3d`, `backface-visibility`, a documented transform
order, and quaternion rotations (`matrix3d`) for tumbling without gimbal lock.
These are small, adapter-only changes (milestone 1).

### 2b. A 3D scene adapter: cameras, lights, meshes

A real scene: primitives and models in world space, viewed through a perspective
or orthographic camera, lit by ambient, directional and point lights. This is
the bulk of the work (milestones 2–4).

### 2c. 3D characters

Character v2's skeleton is "2.5D": bones are solved in 3D in the character's own
space (`joints3`), then turned by `turn × 90°` and projected orthographically in
`project()` in `src/characters/rig/skeleton.ts`. Lifting it into a 3D scene
means:

- placing the character's space in the world with a transform (so `turn` becomes
  a yaw on the object, not a special view rule);
- letting the scene camera do the projection (perspective, any angle, including
  from above);
- drawing it either with its existing pens (the clean/pencil/silhouette look,
  under a real camera) or as simple 3D shapes (capsule limbs, ellipsoid head).

### 2d. Importing glTF animations

glTF 2.0 is the standard interchange format. Its animations are already
keyframes: each channel targets a node's `translation`, `rotation`
(quaternion), `scale`, or morph `weights`, with `LINEAR`, `STEP` or
`CUBICSPLINE` sampling. That maps almost one-to-one onto tinyfly tracks. Import
is a pure function (JSON + binary buffers in, scene + tracks out), so it runs in
Node and in Workers.

---

## 3. Renderer options

### Candidates

| Option | Size (min+gz, ballpark) | Worker / OffscreenCanvas | Node / headless video | Fit with tinyfly |
|---|---|---|---|---|
| **Canvas 2D projected renderer** (ours) | ~5–8 KB | Yes (OffscreenCanvas 2D) | **Yes**, through `@napi-rs/canvas`, the dependency headless already uses | Flat or toon-shaded low-poly, painter's algorithm. Deterministic to the pixel on a given canvas backend. Can draw characters with the existing pens. Slow past a few thousand triangles; intersecting meshes sort wrongly. |
| **WebGL2** (ours, raw) | ~8–15 KB | Yes (`OffscreenCanvas.getContext('webgl2')`) | No, without a browser (headless-gl is WebGL1-only and a native build) | Depth buffer, per-pixel lighting, skinning in the vertex shader, tens of thousands of triangles. Universally available in browsers. |
| **WebGPU** (ours, raw) | ~10–20 KB | Yes | Only with Dawn bindings (native, heavy) | Best long-term performance; still not available on every browser/OS combination we must support, and adds a second shader language (WGSL). Later, behind the same interface. |
| **three.js** (optional adapter) | ~150–180 KB core | Yes | Only in a headless browser | PBR, shadows, glTF loader, huge ecosystem. Too large to justify inside tinyfly; fine as an *optional peer dependency* for users who already ship it. |
| **OGL** | ~10–30 KB | Yes | No | Small and clean, but a dependency for what our own ~15 KB WebGL2 renderer would do, and it would still need our resolved-scene mapping. |
| **Babylon.js** | several hundred KB+ | Yes | Only in a headless browser | Full engine with its own scene graph, animation system and clock. Conflicts with "the engine owns time". Not recommended even as an adapter. |
| **regl / twgl** | ~10–25 KB | Yes | No | Thin WebGL helpers. They save little over writing the 300–500 lines ourselves. |

Sizes are order-of-magnitude figures; measure the actual build before any
decision that depends on them.

### Dependency justification (per CLAUDE.md)

- **Our own renderers (Canvas 2D, WebGL2):** no dependency. A minimal renderer
  for primitives, flat/Lambert/toon shading and a depth buffer is a few hundred
  lines, readable, and testable through pure functions, like the existing
  `quadMatrix` tests for the WebGL adapter.
- **three.js:** justified only as an *opt-in adapter* in its own entry point
  (`@algorisys/tinyfly/three`), with `three` as an optional peer dependency,
  externalised in the build exactly as the frameworks entries externalise React
  and Vue. It never appears in the engine, player, or default adapters bundle.
  Its value: users who already have a three.js scene can drive it from tinyfly
  timelines, and get PBR/shadows for free.
- **Nothing else** clears the bar.

### Recommendation

1. **Canvas 2D projected renderer first.** It is the only option that works in
   the browser, in a Worker and in Node video export with zero new dependencies,
   gives pixel-stable golden tests, and can render characters in their pencil
   look under a real camera, which is tinyfly's distinctive output.
2. **WebGL2 renderer second**, consuming the exact same resolved scene, for
   performance, a real depth buffer and skinning.
3. **three.js adapter** once the data model is stable: optional for package
   users, but it *is* realistic mode, so films depend on it (milestone 8).
4. **WebGPU** only when there is a measured need and it is available
   everywhere we play; the renderer interface keeps that door open.

---

## 4. Data model

### Coordinate conventions

- World space is **right-handed, +y up, +z toward the default camera**, in
  **metres** (as glTF, and so that realistic mode's lights and cameras behave
  physically). This matches glTF, WebGL and
  three.js, *and* character v2's own space (+x the character's left, +y up, +z
  the way it faces), so neither import nor characters need axis flips.
- This differs from the 2D stage (y down, pixels). The two never mix inside one
  scene; a 3D scene element is a box on the 2D stage, like the map and character
  elements.
- Angles in authored JSON are **degrees** (as everywhere else in tinyfly);
  quaternions are `[x, y, z, w]` (glTF order).
- Euler rotation order is fixed at **`YXZ`** (yaw, then pitch, then roll), the
  order that reads naturally for cameras and characters. It is documented, not
  configurable, at first.

### Scene JSON

```ts
interface Scene3D {
  formatVersion: number
  id: string
  /** Id of the camera at time 0; a film cuts between cameras with an `activeCamera` track */
  camera: string
  /** Ordered: array order is draw/tie-break order and child order */
  objects: Object3D[]
  materials?: Record<string, Material3D>
  /** Background colour, or 'transparent' */
  background?: string
  /** Realistic mode: an equirectangular HDR asset for lighting and reflections */
  environment?: string
  /** Fog from `near` to `far` metres, both modes */
  fog?: { color: string; near: number; far: number }
  /** Binary assets (glTF buffers, textures) by id; data URIs or URLs, loaded before rendering */
  assets?: Record<string, { uri: string; mimeType?: string }>
}

interface Transform3D {
  position?: [number, number, number]        // default [0, 0, 0]
  /** Euler degrees, YXZ order; or a quaternion via `quaternion` */
  rotation?: [number, number, number]
  quaternion?: [number, number, number, number]
  scale?: [number, number, number] | number   // default 1
}

interface ObjectBase extends Transform3D {
  id: string                                  // track target id within the scene
  name?: string
  parent?: string                             // id of an earlier object
  visible?: boolean
}

type Object3D =
  | (ObjectBase & { kind: 'group' })
  | (ObjectBase & { kind: 'mesh'; geometry: Geometry3D; material: string })
  | (ObjectBase & { kind: 'camera'; projection: 'perspective'; fov: number; near: number; far: number })
  | (ObjectBase & { kind: 'camera'; projection: 'orthographic'; height: number; near: number; far: number })
  | (ObjectBase & { kind: 'light'; light: 'ambient' | 'directional' | 'point' | 'spot'; color: string
      /** Physical units: lux for directional, candela for point and spot; stylized renderers normalise them */
      intensity: number; range?: number; angle?: number; castShadow?: boolean })
  | (ObjectBase & { kind: 'model'; asset: string; node?: string })        // a glTF (sub)tree
  | (ObjectBase & { kind: 'character'; character: CharacterSpec; look?: 'pen' | 'solid'; model?: string })  // `model`: a skinned glTF for realistic mode

type Geometry3D =
  | { type: 'box'; size: [number, number, number] }
  | { type: 'sphere'; radius: number; segments?: number }
  | { type: 'cylinder'; radius: number; height: number; segments?: number }
  | { type: 'cone'; radius: number; height: number; segments?: number }
  | { type: 'plane'; size: [number, number] }
  | { type: 'torus'; radius: number; tube: number; segments?: number }
  | { type: 'extrude'; path: string; depth: number }   // an SVG path, extruded (logos, text outlines)

interface Material3D {
  // Both modes
  color: string
  opacity?: number
  texture?: string                                     // asset id
  doubleSided?: boolean
  // Stylized mode (our renderers); realistic mode ignores these
  shading: 'unlit' | 'flat' | 'lambert' | 'toon'
  /** Toon only: number of light bands */
  bands?: number
  /** Ink outline, in px (Canvas 2D and WebGL renderers both support it) */
  outline?: { width: number; color: string }
  // Realistic mode (three.js, glTF's metallic-roughness); stylized mode ignores these
  roughness?: number                                   // 0..1, default 0.6
  metalness?: number                                   // 0..1, default 0
  emissive?: string
  normalMap?: string                                   // asset id
}
```

A material is written once and looks right in both modes: stylized reads
`shading`, `bands` and `outline`; realistic reads `roughness`, `metalness`,
`emissive` and `normalMap`; both read `color`, `opacity` and `texture`. Neither
fails on the other's fields.

The `extrude` geometry reuses the engine's existing path parsing
(`src/engine/path/`), so any 2D shape in tinyfly can become a 3D object.

### Tracks: how 3D values animate

Tracks address scene objects by **target = `<sceneElementId>/<objectId>`** (for
example `stage3d/cube`), so a 3D scene's tracks can live in the same timeline as
2D elements without id collisions.

| Property | Value | Interpolation |
|---|---|---|
| `x`, `y`, `z` | number | linear (existing) |
| `rotateX`, `rotateY`, `rotateZ` | number, degrees | linear (existing); applied in YXZ order |
| `scale`, `scaleX`, `scaleY`, `scaleZ` | number | linear (existing) |
| `position`, `scale3` | `number[3]` | element-wise (existing `interpolateArray`) |
| `quaternion` | `number[4]` | **slerp** (new) |
| `color`, `material.color`, `light.color` | colour string | existing `interpolateColor` |
| `opacity`, `light.intensity`, `camera.fov`, `camera.height` | number | linear |
| `lookAt` | `number[3]` (a camera's target point) | element-wise |
| `weights` | `number[]` (morph targets) | element-wise |
| `visible` | number 0/1 | stepped |
| `activeCamera` (on the scene) | camera object id | stepped: a cut is one keyframe |
| `pose.*`, `turn`, `gait.*` (character objects) | number | as character v2 today |

Reusing the existing names (`x`, `rotateY`, …) means the editor's property
fields, curve editor, springs and staggers work on 3D objects unchanged.

**Validation rule (no hidden precedence):** an object may be animated by
component tracks (`x`/`y`/`z`, `rotateX…`) *or* by vector tracks
(`position`, `quaternion`) for the same channel, never both. The scene validator
reports the conflict instead of picking a winner.

### The one engine change: explicit slerp

Today `getInterpolator()` in `src/engine/interpolation/interpolators.ts` picks
an interpolator from the *shape* of the value. A 4-number array would therefore
be interpolated element-wise, which is wrong for a quaternion (it shrinks and
takes the wrong path). Guessing "4 numbers means quaternion" would be hidden
magic, so the choice becomes explicit data:

```ts
interface Track {
  // ...existing fields
  /** How keyframe values blend. Default: chosen from the value, as today. */
  interpolation?: 'slerp'
}
```

`interpolateQuaternion(from, to, t)` normalises, takes the shortest arc (flips
`to` when the dot product is negative), falls back to normalised lerp when the
quaternions are nearly equal, and returns a unit quaternion. Easing still shapes
`t`, so every existing ease works on rotations.

Serialisation: a file that uses `interpolation` is written with
`formatVersion: 2`. `FORMAT_VERSION`'s existing rule ("a reader refuses files
from a newer format rather than playing them wrongly") then protects old players
from silently lerping quaternions. Files that don't use it stay at version 1.

Springs and inertia remain numeric: they work on `rotateX` and friends, not on
`quaternion` tracks (the validator says so).

### Deterministic ordering and evaluation

- `objects` is an **array**, never a map; parents must precede children. World
  matrices are computed in array order in one pass.
- The resolver produces a **draw list** sorted by (opaque before transparent,
  then depth, then object index, then triangle index). `Array.prototype.sort` is
  stable, and the index tie-breakers make the order total, so equal depths never
  flicker between runs.
- All math is in float64 (`number`) on the CPU; matrices are only converted to
  `Float32Array` at the GPU boundary.
- No asset loads during `render()`. Assets are loaded (async) up front by
  `loadScene3D()`; rendering a frame is synchronous and pure, so frame N never
  depends on whether frame N−1 was drawn.
- `Math.sin`/`Math.cos` can differ in the last bit between JavaScript engines.
  Golden tests compare on one engine (Node in CI) and use a 1e-9 tolerance for
  matrices in unit tests.

---

## 5. Architecture and module layout

### The pipeline

```
TimelineDefinition ──► engine (unchanged + slerp) ──► AnimationState
                                                          │
Scene3D (JSON) ─────────────────────────────┐             │
                                            ▼             ▼
                              resolveScene3D(scene, state, size)      pure, no GPU, no DOM
                                            │
                                            ▼
                                  ResolvedScene3D (plain data:
                                  world matrices, camera matrices,
                                  lights, sorted draw list)
                                            │
                     ┌──────────────────────┼───────────────────────┐
                     ▼                      ▼                       ▼
            canvas-2d renderer       webgl2 renderer        three adapter (optional)
```

The resolver is the 3D equivalent of what adapters already do with
`AnimationState`, split out so that every renderer shares one implementation of
transforms, cameras and ordering, and so that it can be unit-tested without any
rendering at all.

### Files

All new code; file and folder names lowercase-hyphenated.

```
src/engine/math/                  pure helpers, exported from the engine
  vec3.ts                         add, sub, scale, dot, cross, normalize, lerp
  quat.ts                         fromEuler (YXZ), toEuler, multiply, slerp, rotateVec3
  mat4.ts                         identity, multiply, compose(TRS), invert, perspective, orthographic, lookAt
  index.ts
src/engine/interpolation/
  interpolators.ts                + interpolateQuaternion, chosen by Track.interpolation

src/scene-3d/                     entry: @algorisys/tinyfly/scene-3d (no DOM, no GPU, no glTF)
  scene-types.ts                  Scene3D, Object3D, Geometry3D, Material3D
  validate-scene.ts               ids, parent order, channel conflicts, slerp-only-on-quaternion
  resolve-scene.ts                Scene3D + AnimationState → ResolvedScene3D
  geometry/
    primitives.ts                 box, sphere, cylinder, cone, plane, torus → indexed triangles
    extrude.ts                    SVG path → extruded mesh (uses engine/path)
  camera.ts                       view/projection matrices, orbit and dolly helpers (pure)
  shading.ts                      flat / lambert / toon colour for a normal + lights (pure)
  draw-list.ts                    depth sorting with total-order tie-breaks
  load-scene.ts                   async asset loading, returns a ready scene
  characters/
    character-object.ts           character v2 skeleton placed in world space
  scene-3d-adapter.ts             registerScene / applyState / render / destroy
  canvas-2d-renderer.ts           painter's algorithm, outlines, pens, blob shadows (stylized)
  index.ts
  webgl/                          entry: @algorisys/tinyfly/scene-3d/webgl
    webgl2-renderer.ts            depth buffer, lambert/toon shaders, skinning (stylized)
    index.ts
  gltf/                           entry: @algorisys/tinyfly/scene-3d/gltf
    glb-container.ts              GLB header and chunks → JSON + binary
    gltf-accessors.ts             typed views over buffers
    gltf-to-scene.ts              nodes, meshes, materials → Scene3D objects
    gltf-to-tracks.ts             animation channels → tinyfly tracks
    index.ts

src/adapters/three/               entry: @algorisys/tinyfly/three (three = optional peer)
  three-adapter.ts                Scene3D + AnimationState → three.js objects (realistic)
  index.ts
```

### Entries: pay only for what you import

| Entry | Contains | Pulls in |
|---|---|---|
| `.`, `/player` | the engine, plus the math helpers and slerp | nothing 3D |
| `/scene-3d` | types, validator, resolver, primitives, Canvas 2D renderer | the engine |
| `/scene-3d/webgl` | the WebGL2 renderer | `/scene-3d` |
| `/scene-3d/gltf` | the glTF loader | `/scene-3d` |
| `/three` | realistic mode | `/scene-3d`, and `three` (optional peer, externalised) |

Each gets its own entry in `vite.config.addons.ts` (as `characters` and `maps`
have), and `package.json` keeps `sideEffects` limited to CSS, so bundlers drop
what is not imported. A test checks the built `lib/` files: each entry has a size
budget, and `.`, `/player` and `/scene-3d` contain no WebGL, glTF or three code.
`npm install` still downloads the whole package (812 kB at v0.82.0); if 3D makes
that noticeably larger, the renderers and loaders move to a separate
`@algorisys/tinyfly-3d` package rather than grow every install.

### The adapter interface

The existing adapters share a shape by convention (`registerTarget`,
`applyState`, `render`, `destroy`) rather than a declared interface. The 3D
adapter follows the same shape, and adds an explicit renderer interface so
renderers are swappable:

```ts
interface Renderer3D {
  /** Draw one resolved frame. Synchronous; never loads anything. */
  render(frame: ResolvedScene3D): void
  resize(width: number, height: number, pixelRatio: number): void
  destroy(): void
}

class Scene3DAdapter {
  constructor(renderer: Renderer3D, options: { width: number; height: number })
  registerScene(id: string, scene: LoadedScene3D): void
  unregisterScene(id: string): void
  applyState(state: AnimationState): void    // resolves every registered scene
  render(): void                             // hands each resolved frame to the renderer
  destroy(): void
}

// Usage, no editor:
const scene = await loadScene3D(sceneJson)
const adapter = new Scene3DAdapter(new Canvas2DRenderer(ctx), { width: 800, height: 450 })
adapter.registerScene('stage3d', scene)
timeline.onUpdate = (state) => { adapter.applyState(state); adapter.render() }
```

The Canvas 2D renderer also exposes `drawScene3D(ctx, scene, state, size)`, so a
scene can be a `custom` target inside the existing `CanvasAdapter` and
therefore inside a `VideoScene`, with no change to `src/headless/`.

### Workers

Everything up to `ResolvedScene3D` is plain data, so a Worker can own the
timeline and an `OffscreenCanvas` and run either renderer entirely off the main
thread. Nothing in the engine or the timeline needs 3D-specific code for this.

### Headless

`FrameRenderer` draws on a 2D context. A 3D scene enters it as a custom canvas
target drawn by the Canvas 2D renderer, so `tinyfly video scene.mjs` renders 3D
to MP4 with today's dependencies: this is stylized mode, and the reference for
golden tests. WebGL2 is not available in Node, so heavy stylized scenes and
every realistic render go through headless Chromium (Playwright), driven by the
same scene module, frame by frame. Playwright is never a dependency: the CLI
asks for it when a film needs it. Realistic frames are deterministic in input,
not in pixels, and are checked against the stylized render of the same frame by
tolerance.

### The editor (SolidJS)

The editor stays a consumer of the public API; no 3D logic in components.

| Piece | Where (proposed) |
|---|---|
| `scene3d` element type: a box on the stage hosting one `Scene3D` | `src/editor/stores/scene-store.ts` (alongside `character` and `map`) |
| Element → `Scene3D`, loading, adapter wiring | `src/editor/utils/scene-3d-element.ts` |
| Preview: a canvas inside the element, repainted from `AnimationState` | `src/editor/components/preview-panel.tsx` |
| Outliner: objects, cameras, lights; add primitive / light / camera; import glTF | `src/editor/components/scene-3d-panel.tsx` |
| Property fields: position, rotation (Euler degrees), scale, material, light, camera, each with ◆ keyframe via `keyValuesAtPlayhead` | `src/editor/components/property-panel.tsx` |
| Viewport navigation (orbit, pan, dolly) for *authoring only*; it changes an editor view camera, not the scene, unless "look through camera" is on | calls `orbit()` / `dolly()` from `src/scene-3d/camera.ts` |
| Export (GIF, MP4, HTML embed) | `src/editor/utils/scene-to-canvas.ts` draws the scene with the Canvas 2D renderer |

The editor shows rotations as Euler degrees (people can type them); the library
stores what the user keyed (component tracks), and quaternion tracks appear only
for imported glTF animation, shown read-only with "convert to Euler tracks" as
an action.

---

## 6. Milestones

Each is one minor release with unit tests, a docs page, and a gallery demo (a
live demo in `src/examples/live-demos/` and, where it makes sense, a headless
example in `examples/headless-video/`).

| # | Release | Contents | Tests | Demo |
|---|---|---|---|---|
| 0 | **Rotation math** | `src/engine/math/` (vec3, quat, mat4); `Track.interpolation: 'slerp'` and `interpolateQuaternion`; `formatVersion` 2 only when used; DOM adapter accepts a `quaternion` value and emits `matrix3d()` | slerp shortest path, unit length, endpoints exact, Euler↔quat round trip, JSON round trip, old readers refuse v2 | A CSS cube tumbling on a quaternion track next to the same motion on Euler tracks (gimbal lock visible on the Euler one) |
| 1 | **CSS 3D, finished** | DOM/SVG: `transformStyle`, `perspective` on parents, `perspectiveOrigin`, `backfaceVisibility`; documented transform order; editor fields for `z`, `rotateX`, `rotateY`, perspective; Canvas adapter: true perspective foreshortening for flat targets (projected corners, image drawn as two affine triangles); WebGL adapter: `mat4` per quad so `rotateX/Y/z` work | transform string order, projected-corner maths, canvas vs DOM corner positions agree within 0.5 px | Cover-flow carousel and a 3D card flip, both built in the editor, both exported to GIF |
| 2 | **Scenes on Canvas 2D** | `@algorisys/tinyfly/scene-3d`: types, validator, resolver, primitives, extrude, camera, lights, flat/lambert/toon shading, outlines; Canvas 2D renderer; `drawScene3D` custom target for headless video | resolver matrices, camera matrices, draw-order total and stable, validator errors, golden PNGs rendered twice identically in Node | Orbiting camera around lit primitives and an extruded tinyfly logo; the same scene rendered to MP4 with `tinyfly video` |
| 3 | **WebGL2 renderer** | Same `ResolvedScene3D` on the GPU: depth buffer, Lambert and toon shaders, outlines, textures; OffscreenCanvas in a Worker | pure parts (buffer packing, uniforms) as `webgl-adapter.test.ts` does; a browser smoke test comparing WebGL2 and Canvas 2D output within a tolerance | 2,000 animated cubes with a staggered wave (the case Canvas 2D can't hold at 60 fps) |
| 4 | **Editor 3D element** | `scene3d` element, outliner, add primitives/lights/cameras, transform and material fields with keyframes, authoring viewport, look-through-camera, export | store tests for add/remove/key; exported JSON round-trips through `loadScene3D` | A product-spin scene made entirely in the editor, exported as an embed |
| 5 | **glTF import (rigid)** | GLB/glTF parsing, meshes, base-colour materials and textures, node hierarchy, animation channels → tracks (`LINEAR` → linear/slerp, `STEP` → stepped, `CUBICSPLINE` → baked and simplified with the existing `bake.ts`/`simplifyKeyframes`), morph `weights`; editor "Import glTF" | accessor decoding, every sampler type, channels to tracks, tracks reproduce glTF sample values at keyframe times | Khronos sample models (CC0/CC-BY, e.g. *AnimatedCube*, *BoxAnimated*) playing on the tinyfly timeline, scrubbable |
| 6 | **3D characters** | `character` scene objects: character v2 skeleton (`joints3`) placed in world space; `turn` becomes root yaw; perspective projection through the scene camera; `look: 'pen'` (existing clean/pencil/silhouette pens on Canvas 2D) or `look: 'solid'` (capsule limbs, ellipsoid head, toon-shaded) | joints in world space match the 2.5D solver at `turn` 0–4 under an orthographic front camera (so v2 goldens hold); depth order under any camera | A pencil-look walk cycle with the camera craning from side view to top-down; the same scene in the solid look |
| 7 | **Skinned glTF** | Skins, joints, inverse bind matrices; GPU skinning in WebGL2, CPU skinning in Canvas 2D; optional mapping of a humanoid glTF skeleton to character v2 pose fields | skinning matrices against hand-computed cases, bind pose renders as rest mesh | A rigged CC0 character playing its imported clip, then blended into a tinyfly pose |
| 8 | **three.js adapter** (realistic mode) | `@algorisys/tinyfly/three`: builds three objects from `Scene3D`, applies `AnimationState` each frame; `three` as an optional peer, externalised | mapping tests with three in devDependencies only | The milestone 2 scene rendered with three.js PBR and shadows, driven by the identical timeline JSON |

Milestones 0–2 are the foundation. After that, 3, 5 and 6 can go in any order
(for the story channel, 6 before 3). Milestone 2 already supports several
cameras and the `activeCamera` track, and milestone 6 adds blob shadows, so the
film work (Phase 34) needs no format change. Films in realistic mode need
milestone 8, and realistic characters need 7 (or the `solid` look).

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| **Scope creep**: 3D invites "just one more feature" until tinyfly is a game engine | The non-goals list is part of this plan; each milestone's scope is fixed before it starts |
| **Painter's algorithm artefacts** (intersecting or long overlapping triangles sort wrongly) | Document it; sort per triangle, not per object; keep scenes low-poly in the Canvas 2D renderer; WebGL2 has a depth buffer |
| **Canvas 2D performance** past a few thousand triangles | Back-face culling and frustum culling in the resolver; the WebGL2 renderer for heavy scenes; the docs give a triangle budget |
| **GPU output differs between machines** | Goldens only for the Canvas 2D renderer; GPU tests check pure parts and use tolerances |
| **Floating-point differences between JS engines** | Unit tests use tolerances; goldens are produced and checked in one runtime (Node in CI) |
| **Async assets vs deterministic frames** | Loading is separate from rendering; `render()` is synchronous and refuses scenes whose assets are not loaded |
| **glTF breadth** (extensions, compression, sparse accessors) | Support core glTF 2.0 and sparse accessors; report unsupported extensions by name instead of rendering wrongly |
| **Two coordinate systems** (2D y-down px, 3D y-up units) confusing users | They never mix inside a scene; the 3D element is a box on the 2D stage; the docs open with one diagram of both |
| **Euler order surprises** | One fixed, documented order (YXZ); quaternion tracks when users need tumbling |
| **Editor UX for 3D** (gizmos, selection in depth) is a large design problem | Milestone 4 ships numeric fields and an orbit viewport first; on-canvas gizmos are a later, separate decision |
| **Bundle growth** | `scene-3d` and `three` are separate entries; the engine gains only math helpers and slerp, measured in the release notes |

---

## 8. Open questions

1. **Entry name:** `@algorisys/tinyfly/scene-3d` (proposed) or `/3d`?
2. **Target addressing:** `<sceneElementId>/<objectId>` (proposed), or one
   target per scene with properties like `cube.x`? The first keeps every
   existing property name and editor field unchanged.
3. **Euler order:** is YXZ right for all users, or should `rotationOrder` be a
   per-object option from the start?
4. ~~**Units:**~~ Decided: metres, and physical light intensities (realistic
   mode needs them; stylized renderers normalise).
5. **WebGL1 adapter:** upgrade the existing quad adapter to WebGL2 in milestone
   1, or keep it WebGL1 for the widest reach and keep WebGL2 for scenes only?
6. ~~**Headless WebGL:**~~ Decided: yes. Films need it for realistic mode and
   for heavy stylized scenes; Canvas 2D stays the reference renderer.
7. **Characters:** in a 3D scene, should `turn` stay animatable on a character
   object (as yaw), or be replaced by `rotateY` to avoid two ways of doing the
   same thing?
8. ~~**Shadows:**~~ Decided: blob shadows for characters in milestone 6
   (stylized), projected ground shadows next; shadow maps in realistic mode.
9. **Sample assets:** which CC0 glTF models are acceptable to vendor into the
   repo for tests and the gallery (size, licence)?
10. ~~**Render mode per shot:**~~ Decided: a film sets `renderMode`, and any
    shot may override it. The resolver is shared, so mixing costs nothing; a
    film can be blocked out in stylized and switched shot by shot.
11. ~~**Realistic characters:**~~ Decided: the `solid` look with PBR shading
    first (no wait on milestone 7); skinned glTF characters (`model`) replace it
    when milestone 7 lands. Both are driven by the same v2 pose tracks.

---

## 9. Movies and the two render modes

A film is a timeline like any other. Nothing below needs a new clock or a new
file format beyond what milestones 0–2 define.

- **Shots and cuts.** Shots are time ranges with a camera and a label; a cut is
  one keyframe on the stepped `activeCamera` track. Transitions (crossfade, dip
  to black, wipe) are pure functions of two frames and a progress, so any frame
  of a film can be rendered on its own.
- **Cameras.** Moves are presets that write ordinary tracks: orbit, dolly,
  crane, pan and tilt, follow, `lookAt`, focal-length zoom, and a seeded
  handheld shake (deterministic).
- **Render modes.** `renderMode: 'stylized' | 'realistic'` is set for a film and
  can be overridden per shot. The resolver is shared, so both modes see the same
  world matrices, cameras and cuts; only the renderer differs.

  | | Stylized | Realistic |
  |---|---|---|
  | Renderer | Canvas 2D (reference), WebGL2 | three.js |
  | Look | flat, toon, pencil; outlines | PBR (roughness, metalness), environment map, tone mapping |
  | Shadows | blob, then projected ground shadows | shadow maps |
  | Characters | pen look, or `solid` toon | `solid` with PBR first; a skinned glTF (`model`) after milestone 7 |
  | Headless | Node, pixel-identical between runs | headless Chromium, checked by tolerance |

- **Post step (both modes, small and deterministic).** Supersampled
  anti-aliasing, fog, vignette, and motion blur by averaging sub-frame samples
  at fixed offsets.
- **Long renders.** Frames are independent, so a film renders across worker
  threads, in chunks, resumably, with a per-shot frame cache.
- **Sound, captions, narration.** Reused from video-from-code (Phase 31) and the
  beat grid (Phase 32); see Phase 34 in `todo.md` for the full film plan.

