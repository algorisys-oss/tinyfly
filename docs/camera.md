# Camera — Phase B design

**Status:** In progress (foundation landed)
**Date:** 2026-07-22
**Roadmap:** [2d-animation-roadmap.md](2d-animation-roadmap.md) → Phase B

A **camera** animates a pan / zoom / rotate over the whole stage — cinematic
moves without touching your elements. True to tinyfly's "animation = a transform"
ethos, the camera is **just an animated element**: a reserved layer named
`Camera` that wraps the stage, driven by ordinary keyframe tracks.

---

## Model

No new data model. The camera is a set of tracks targeting the reserved name
**`Camera`** with the existing animatable properties:

| Track property | Effect on the stage |
|----------------|---------------------|
| `x`, `y` | Pan (translate the whole stage) |
| `scale` | Zoom (around the stage centre) |
| `rotate` | Rotate (around the stage centre) |

The preview wraps all elements in a `Camera` layer
(`<div data-tinyfly="Camera">`) registered with the DOM adapter, so those tracks
transform everything at once. With no `Camera` tracks the layer is identity —
completely inert — so nothing changes until you add a camera.

Because it's ordinary tracks + a named layer, the camera **serializes for free**
(it's in the timeline JSON), keyframes like any track, and — once the layer is
emitted — flows through export and embeds via the same adapters.

---

## Store API

```ts
addCamera()                     // add x/y/scale/rotate tracks on "Camera", seeded at identity
removeCamera()                  // drop all Camera tracks
hasCamera()                     // is a camera present?
getCameraValue(prop)            // current pan/zoom/rotate at the playhead
setCameraValue(prop, value)     // keyframe a camera prop at the playhead (upsert)
```

`addCamera` seeds each track with a keyframe at `0` and at the timeline's end, so
it's ready to keyframe. Keyframe the camera like any track (select a Camera
track, add/drag keyframes, edit values in the Property Panel).

**Camera inspector.** With a camera present and nothing selected, the Property
Panel shows a 🎥 **Camera** section with Pan X / Pan Y / Zoom / Rotation inputs.
Editing a field calls `setCameraValue`, which upserts a keyframe **at the
playhead** — so you scrub to a time, dial in the framing, and the pan/zoom is
recorded. "Reset to identity" and "Remove camera" live there too.

---

## Implementation slices

1. **Foundation (this slice):** `Camera` layer in the **DOM preview** + store
   `addCamera` / `removeCamera` / `hasCamera` + a **🎥 Camera** toggle in the
   preview header. Camera animation plays in the DOM preview. Unit-tested.
2. **Everywhere else (done):** the camera applies in the **Canvas** and **SVG**
   previews, **raster export** (GIF/WebP/MP4), and **embeds** (single-scene via a
   `Camera` wrapper the player animates; multi-scene via a per-scene camera layer
   in the sequencer). `src/editor/utils/camera.ts` holds the shared transform math.
3. **Camera inspector (done):** a 🎥 **Camera** section in the Property Panel
   (shown when a camera exists and nothing is selected) with Pan X/Y, Zoom, and
   Rotation inputs that keyframe at the playhead via `setCameraValue`, plus
   "Reset to identity" / "Remove camera". Unit-tested.
3b. **On-stage camera frame (next):** a draggable camera rectangle in the preview
   (drag to pan, corners to zoom, a handle to rotate) that writes the same Camera
   keyframes, plus a dedicated camera row at the top of the timeline.
4. **Edit-in-camera correctness:** element drag/resize math accounts for the
   current camera transform (today, edit at the camera's start/identity frame).

---

## Known limitations (foundation)

- Editing elements while the playhead sits on a **camera-transformed** frame is
  approximate — the drag math assumes identity. Set up your scene first, then
  keyframe the camera (slice 4 fixes this).

---

## Non-goals

- Multiple cameras / camera switching (one camera per scene).
- Depth / parallax layers (possible later via per-layer camera influence).
