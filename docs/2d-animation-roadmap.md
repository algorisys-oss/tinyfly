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
