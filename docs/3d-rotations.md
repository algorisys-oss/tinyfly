# 3D Transforms and Rotations

Flat things (cards, images, text, shapes) can turn in 3D, move toward you and
be seen in perspective, the way CSS 3D transforms work, and they land on the
same pixels in every renderer: DOM, SVG, Canvas and WebGL. Rotations can be
**quaternions**, `[x, y, z, w]`, on a track that says `interpolation: "slerp"`,
which turn from any orientation to any other without gimbal lock. These are the
first steps of [3D support](3d-support-plan.md): the engine stays
renderer-agnostic and gains only small math helpers and one interpolation mode.

Try it on the Examples page: **Quaternion vs Euler (3D rotation)**, **3D Card
Flip** and **Cover Flow**.

## The 3D properties

| Property | Value | Meaning |
|---|---|---|
| `rotateX`, `rotateY` | degrees | Turn about the horizontal / vertical axis (`rotate` / `rotateZ` turns in the picture) |
| `z` | px | Toward the viewer; shows with perspective |
| `perspective` | px | The element's own `perspective()`: its distance from the viewer. Smaller is stronger; none is flat |
| `quaternion` | `[x, y, z, w]` | A whole rotation, on a track with `interpolation: "slerp"` (below) |
| `backfaceVisibility` | `"visible"` / `"hidden"` | Hidden: not drawn while its back faces you (two of them make a two-sided card) |
| `childPerspective`, `perspectiveOriginX`, `perspectiveOriginY` | px, % | DOM only: CSS `perspective` on a parent, so its children share one vanishing point |
| `transformStyle` | `"preserve-3d"` | DOM only: children keep their own depth inside the parent |

```js
const flip = [
  { id: 'p', target: 'card', property: 'perspective', keyframes: [{ time: 0, value: 600 }] },
  { id: 'b', target: 'card', property: 'backfaceVisibility', keyframes: [{ time: 0, value: 'hidden' }] },
  { id: 'r', target: 'card', property: 'rotateY', keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 180, easing: 'ease-in-out' }] },
]
```

### One transform order

Whatever order the tracks were added in, every adapter composes an element's
transform in the same order, about its transform origin (`originX` /
`originY`, the centre by default):

```
perspective  →  translate (x, y, z)  →  rotate  →  rotateX  →  rotateY  →  quaternion  →  scale  →  skew
```

as a CSS transform list (the right-most applies to the element first). So an
element is skewed and scaled in its own plane, turned, then moved, and seen in
perspective last. `scale` wins over `scaleX` / `scaleY` in SVG, Canvas and
WebGL.

### In each renderer

- **DOM and SVG:** the browser's own CSS 3D.
- **Canvas:** the same 4×4 matrix. Without perspective its x / y part is an
  exact 2D transform; with perspective the target is drawn through a mesh of
  small triangles, each a 2D transform of its own, overlapping by a pixel so no
  seam shows. See-through targets in perspective go through one offscreen
  layer, so the overlaps do not darken. It works in Node too (headless video).
- **WebGL:** the same matrix per quad, with the perspective in `w`, so textures
  stay perspective-correct.

The cross-browser checks (`npm run e2e -- --check transforms-3d`) put one card
through all of them in Chromium, Firefox and WebKit: the projection maths
matches the browser's CSS exactly, and Canvas and WebGL land within a pixel.

### In the editor

Every element has a **3D** section under Transform: **Tilt X**, **Turn Y**,
**Depth** and **Perspective** at the playhead. Typing a value keys it there, so
a card flip is two keys on Turn Y. Every preview renderer and every export
(GIF, MP4, video) draws them.

## Why not just rotateX, rotateY and rotateZ?

Euler angles (`rotateX`, `rotateY`, `rotateZ`) are easy to type and still work
everywhere. But each angle is animated on its own, so going from one
orientation to another can take a strange path, tumbling about two axes, and
near straight up or down two of the axes line up and a turn is lost (gimbal
lock). A quaternion describes the whole orientation at once, and **slerp**
(spherical interpolation) turns from one to the other about a single axis, the
short way round, at a steady speed.

```js
import { Timeline, quat } from '@algorisys/tinyfly'

const timeline = new Timeline({
  id: 'flip',
  tracks: [
    {
      id: 'turn',
      target: 'card',
      property: 'quaternion',
      interpolation: 'slerp',
      keyframes: [
        { time: 0, value: quat.identity() },
        { time: 2000, value: quat.fromEuler(0, 180, 180), easing: 'ease-in-out' },
      ],
    },
  ],
})
```

Easing shapes the turn as it shapes any value; eases that overshoot (back,
elastic) carry on along the same arc. When a timeline is exported to a format
that needs baking (CSS, Lottie), the samples follow the arc too.

## Drawing it

- **DOM:** the DOM adapter draws a `quaternion` value as a CSS `matrix3d()`.
  Give the parent `perspective` and the element `transform-style: preserve-3d`
  as for any CSS 3D transform.
- **Anything else:** `mat4.fromQuat(q)` is the rotation matrix, column-major,
  ready for WebGL, a `matrix3d()` string or your own renderer.

```js
const q = timeline.getStateAtTime(t).values.get('card').get('quaternion')
card.style.transform = `matrix3d(${mat4.fromQuat(q).join(', ')})`
```

## The math helpers

Plain arrays in, plain arrays out, no state: `vec3`, `quat` and `mat4`.

| | |
|---|---|
| Axes | right-handed, +y up, +z toward the viewer |
| Angles | degrees |
| Euler order | **YXZ** (yaw, pitch, roll): `quat.fromEuler(x, y, z)` turns as CSS `rotateY(y) rotateX(x) rotateZ(z)` |
| Quaternions | `[x, y, z, w]` (glTF order), unit length |
| Matrices | 16 numbers, column-major (WebGL, glTF, CSS `matrix3d()`); `multiply(a, b)` applies `b` first |

```js
import { quat, mat4, vec3 } from '@algorisys/tinyfly'

const tilt = quat.fromEuler(20, 45, 0)
quat.toEuler(tilt)                         // [20, 45, 0]
quat.rotateVec3(tilt, [0, 0, 1])           // where "forward" points now
const model = mat4.compose([0, 1, 0], tilt, [1, 1, 1])
const view = mat4.lookAt([0, 2, 6], [0, 1, 0])
const projection = mat4.perspective(50, 16 / 9, 0.1, 100)
mat4.transformPoint(mat4.multiply(projection, mat4.multiply(view, model)), [0, 0, 0])
```

The full list is in the [API reference](api-reference.md#3d-math).

## In the file format

A file that uses `interpolation` is written as **format version 2**, so an
older tinyfly refuses it with a clear message instead of blending the four
numbers one by one. Files without it stay at version 1 and open everywhere.
See [the file format](file-format.md#rotation-tracks-interpolation-slerp).

## Limits

- Elements are flat: each is turned and seen on its own (its own
  perspective), not sorted by depth against others; they draw in layer order.
  Real 3D scenes (cameras, lights, meshes, depth) are the next milestones.
- In the editor, back faces are set with a `backfaceVisibility` track (the
  3D Card Flip sample shows how); there is no checkbox yet.

- Springs and inertia stay numeric: use them on `rotateX` and friends, not on
  `quaternion` tracks.
- Use either Euler tracks or a quaternion track for one element's rotation,
  not both.
- 3D scenes (cameras, lights, meshes) are the next milestones of the
  [3D plan](3d-support-plan.md).
