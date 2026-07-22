# 2D Animation Roadmap — Adobe Animate gap analysis & plan

**Status:** Planning (no implementation yet)
**Date:** 2026-07-08

This document captures a gap analysis of tinyfly against a full Adobe Animate
"Complete 2D Animation Course" workflow, and a phased plan for the features and
UX worth pursuing. It is a living plan — we will implement from it over time.

---

## Positioning (read this first)

tinyfly is a **property-animation engine**: you place objects and animate their
properties over time via keyframe tracks (After Effects / GSAP style), with a
JSON-first, inspectable, framework-agnostic core.

Adobe Animate is a **drawing + rigging studio**: you draw pictures (often frame
by frame), rig them with bones, and tween them.

**Roughly 60% of a "complete Animate course" is a different product category.**
Matching all of it would break tinyfly's "GSAP-level power with Excalidraw-level
simplicity" identity and is a multi-year effort. The plan below deliberately
separates **on-brand wins** from **out-of-scope** studio features.

---

## What the reference course covers

Freehand drawing (brush / pencil / shapes / pen), fills / strokes / gradients,
transform (skew / rotate / free-transform), align & distribute, **symbols +
Library** (convert-to-symbol, instances), **frame-by-frame** animation,
motion / classic / **shape tweens**, **onion skinning**, **bone rigging / IK**,
**lip-sync** (mouth-shape swapping), character design & turnarounds,
background / scene composition, a **camera**, motion blur / speed lines, and
publishing (video / GIF / HTML5).

---

## Gap map

| Capability | tinyfly today | Verdict |
|---|---|---|
| Property tweens (move/scale/rotate/opacity/color…) | ✅ Full (tracks, easing, custom curve editor) | Core strength |
| Motion path, filters, clip/mask reveal, shine | ✅ | Strong |
| Multi-scene, transitions, sequencer | ✅ | Strong |
| Per-letter text, typewriter | ✅ | Strong |
| Audio/video elements + sync (editor & embed) | ✅ | Strong |
| Shape / path morph (shape tween) | ⚠️ Partial — can animate path `d`; no morph tooling | Enhance |
| Export | ⚠️ CSS / Lottie / GIF only | Add video / sprite |
| **Symbols + Library (reusable instances)** | ❌ (only flat groups) | **Do — #1** |
| **Camera (pan / zoom / rotate the scene)** | ❌ | **Do** |
| Onion skinning | ❌ | Do (small) |
| Drawing tools (pen / pencil, polygon / star) | ❌ (path element + editor, but no create-tool) | Partial-do |
| Guides / grid / rulers / object snapping | ❌ | UX polish |
| Bone rig / IK / armature | ❌ | Out of scope (or long-term "pivot rig") |
| Frame-by-frame drawing paradigm | ❌ (conflicts with the track model) | Skip |
| Natural-media brush studio, model-sheet tooling | ❌ | Skip |

---

## Phased plan (on-brand)

### Phase A — Reuse & structure (highest leverage)

1. **Symbols + Library** — a symbol is a group with its own nested timeline,
   instanceable multiple times; edit-once-update-everywhere; fully
   JSON-serializable. Unlocks reuse, complex compositions, and a **lightweight
   lip-sync** (swap which symbol/instance shows per keyframe) without a bone
   system. This is the biggest, most on-brand win.
   - Data model: `SymbolDefinition { id, name, elements, timeline }`; instances
     reference a symbol id + an instance transform/override.
   - UI: a Library panel; "Convert to Symbol"; place instances; edit-in-place.
   - Engine: instances expand to their nested timeline at play time; still JSON.

### Phase B — Cinematography & polish

2. **Camera** — a virtual camera whose pan / zoom / rotate animates the whole
   stage. It is just an animated transform on the scene container — very
   on-brand, big demo value.
3. **Onion skinning** — ghost the previous / next frames in the preview. Small,
   high-delight.
4. **Guides, grid, rulers, object snapping** — editor UX the course leans on
   constantly.

### Phase C — Authoring & output

5. **Drawing tools** — a **pen tool** (author bezier paths on canvas; reuse the
   existing path editor), plus **polygon / star** primitives and a
   freehand → simplified-path tool. Stops short of a full brush studio.
6. **Shape-tween tooling** — a proper morph between two path shapes.
7. **Export expansion** — **video (WebM / MP4)** and **sprite-sheet / PNG
   sequence** (build on the existing GIF frame-capture plumbing).

---

## Deliberately out of scope

To protect the product's identity, we are **not** pursuing:

- Bone / IK rigging and armatures (different domain, very complex). If rigging is
  ever wanted, do a **simplified** version: parent / pivot hierarchies on groups,
  not full IK.
- Frame-by-frame drawing paradigm (conflicts with the property-track model).
- Natural-media brushes / paint studio.
- Character-design / model-sheet tooling.

---

## Recommended starting point

Begin with **Phase A: Symbols + Library**. It is the one item that is both a real
Animate gap *and* deeply on-brand (nested JSON timelines), and it retroactively
enables lip-sync-style workflows without a bone system. **Camera** and **onion
skinning** are the fast, flashy follow-ups.

---

## UI / interaction plan (Animate parity, tinyfly-flavoured)

> **Note (added 2026-07-22):** this section plans the *editor UI* for each phase.
> Guiding rule: **Excalidraw-level simplicity** — every new surface must be
> loosely coupled to the engine, discoverable, and skippable. No modal-heavy,
> panel-explosion Animate clone. Studio-grade features live behind an optional
> **"Studio" mode** badge so the default editor stays approachable.

### Cross-cutting UI principles

- **One codebase, tiered UI.** Advanced tools (Library, Camera, onion skin,
  guides, pen) surface progressively; a `Studio mode` toggle can reveal the
  denser controls. Marketing may call the pro workflow *"tinyflash"*, but it is
  the same app.
- **Reuse existing surfaces.** New capabilities extend the current header,
  left/right collapsible panels, timeline panel, and preview overlay rather than
  adding new windows.
- **Everything stays JSON + API-first.** Each UI action maps to a documented
  store/engine call; the editor remains just one consumer.

### Phase A — Symbols + Library (UI)

- **Library panel** — a new collapsible section in the **left** sidebar (tab
  alongside Elements/Tracks): a grid of symbol thumbnails with name, instance
  count, and a search box. Drag a symbol onto the stage to place an instance;
  double-click to **edit in place** (breadcrumb: `Scene ▸ SymbolName`).
- **Convert to Symbol** — a command on the selection (context menu + `Ctrl+K`)
  that bundles the selected elements into a reusable symbol and replaces them
  with an instance.
- **Instance properties** — the right **Property Panel** gains an "Instance"
  section: transform overrides (x/y/scale/rotation/opacity), a **symbol swap**
  dropdown (the lip-sync primitive), and an "Edit Symbol" button.
- **Nested timeline** — when editing a symbol, the bottom **Timeline** shows the
  symbol's own tracks; a breadcrumb returns to the scene. The instance's timeline
  in the parent scene controls *its* transform, not the symbol's internals.
- **Serialization** — `project.symbols: SymbolDefinition[]`; scene elements gain
  a `symbol` type referencing `symbolId`.

### Phase B — Camera, onion skinning, guides (UI)

- **Camera** — a **Camera** toggle in the preview header adds an on-stage camera
  frame (drag to pan, corner handles to zoom, a rotate handle). Camera state is a
  single animated transform track (`camera.x/y/zoom/rotation`) shown as a special
  row at the top of the timeline. A "Reset camera" and "fit" control included.
- **Onion skinning** — a preview-header toggle with a small popover: how many
  before/after frames, opacity falloff, and outline-vs-ghost mode. Ghosts render
  in the preview only.
- **Guides / grid / rulers / snapping** — a **View** menu (or preview-header
  cluster): toggle grid, rulers, snapping; drag guides off the rulers; snap to
  guides / grid / other objects with a live snap indicator.

### Phase C — Drawing, shape-tween, export (UI)

- **Pen / shape tools** — extend the left toolbar with a **Pen** (author bezier
  paths point-by-point on the canvas, reusing the path editor), **Polygon/Star**
  primitives (sides/points inspector), and a freehand → simplified-path tool.
- **Shape-tween** — select two path keyframes and "Create Shape Tween"; a small
  morph inspector (matching hints / point count). Preview shows the interpolated
  `d`.
- **Export expansion** — the existing Export dialog gains **sprite-sheet /
  PNG-sequence** output alongside the current GIF/WebP/MP4.

### UI risks & mitigations

- **Panel overload** → keep advanced panels collapsed by default and behind
  Studio mode; lean on the existing collapsible-sidebar system.
- **Edit-in-place confusion** → always show a breadcrumb and a dimmed parent
  scene while inside a symbol.
- **Mobile/touch** → symbols/library are desktop-first; degrade gracefully (view
  + place, edit on larger screens).

See [symbols-and-library.md](symbols-and-library.md) for the detailed Phase A
data model and implementation plan.
