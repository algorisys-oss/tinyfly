# tinyfly Development Progress

## Phase 1: Core Engine ✓

- [x] Set up Vite + SolidJS + TypeScript project
- [x] Set up Vitest testing framework
- [x] Define core types (Timeline, Track, Keyframe, AnimationState)
- [x] Implement easing functions (linear, quad, cubic)
- [x] Implement interpolators (number, color, array)
- [x] Build Clock/time management (RAF + Manual)
- [x] Build Track with keyframe interpolation
- [x] Build Timeline with playback controls
  - [x] play/pause/stop/seek/reverse
  - [x] Looping (finite and infinite)
  - [x] Alternate direction (ping-pong)
  - [x] Speed control
- [x] Add JSON serialization (import/export)

## Phase 2: Adapters ✓

- [x] DOM adapter (CSS styles, transforms)
- [x] Canvas adapter (rect, circle shapes)
- [x] SVG adapter (attributes, transforms)

## Phase 3: Editor UI (SolidJS) ✓

- [x] Editor store (state management)
- [x] Timeline visualization component
- [x] Playback controls (play/pause/stop/seek)
- [x] Preview panel with DOM adapter
- [x] Keyframe editor (property inspector)
- [x] Track management UI (add/remove tracks)

## Phase 4: Undo/Redo ✓

- [x] History store with push/undo/redo/batch operations
- [x] Editor store integration (track/keyframe mutations)
- [x] Undo/redo buttons in playback controls
- [x] Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y)

## Phase 5: Export/Import ✓

- [x] Export timeline as JSON file download
- [x] Import timeline from JSON file
- [x] Toolbar component with import/export buttons
- [x] Clear history on import (fresh start)

## Phase 6: Drag Keyframes ✓

- [x] Mouse drag to reposition keyframes on timeline
- [x] Real-time visual feedback during drag
- [x] Snap to nearest millisecond on release
- [x] History integration (undo/redo works with drags)

## Phase 7: Project Management ✓

- [x] Project store with LocalStorage persistence
- [x] Project metadata (name, canvas size, created/modified)
- [x] New Project button with confirmation dialog
- [x] Project settings dialog (rename, canvas dimensions)
- [x] Auto-save to LocalStorage on changes
- [x] Load/restore projects from LocalStorage

## Phase 8: Embeddable Player ✓

- [x] TinyflyPlayer class for runtime playback
- [x] Auto-register targets by data-tinyfly attribute, class, or id
- [x] Simple play() helper function for quick embedding
- [x] Embed dialog with copy-paste code generation
- [x] Inline JSON and external file embed options
- [x] Player supports all playback controls (play/pause/seek/speed)

## Phase 9: Multiple Preview Elements ✓

- [x] Scene store for element management
- [x] Element types: rect, circle, text
- [x] Element library UI (add/remove/reorder)
- [x] Dynamic preview panel rendering
- [x] Element selection in preview
- [x] Property panel for element editing
  - [x] Transform properties (x, y, width, height, rotation, opacity)
  - [x] Appearance properties (fill, stroke, strokeWidth, borderRadius)
  - [x] Text properties (content, fontSize, fontFamily, fontWeight, textAlign)
- [x] Layer ordering controls (up/down/top/bottom)
- [x] Element visibility and lock toggles
- [x] Element duplication

## Phase 10: Additional Elements ✓

- [x] Line element (x, y, x2, y2, stroke, strokeWidth, lineCap)
- [x] Arrow element (startHead, endHead, headSize)
- [x] Image element (src, objectFit)
- [x] Color animation support for fill/stroke properties

## Phase 11: Element Grouping ✓

- [x] Multi-selection with Ctrl/Cmd+click
- [x] Group selected elements into a group
- [x] Ungroup to restore individual elements
- [x] Group rendering with child elements

## Phase 12: Canvas Interaction ✓

- [x] Drag elements on canvas to reposition
- [x] Resize handles on selected elements (8 handles for shapes, 2 endpoints for line/arrow)
- [x] Rotation handle for elements (hold Shift to snap to 15° increments)

## Phase 13: Keyboard Shortcuts ✓

- [x] Delete/Backspace key for element deletion
- [x] Ctrl+D for duplicate element
- [x] Ctrl+G for group, Ctrl+Shift+G for ungroup
- [x] Arrow keys for nudging (1px, 10px with Shift)

## Phase 14: Copy/Paste ✓

- [x] Copy elements to internal clipboard (Ctrl+C)
- [x] Cut elements (Ctrl+X) - copy and remove
- [x] Paste elements with offset (Ctrl+V)
- [x] Multi-element copy/paste support

## Phase 15: Animation Presets ✓

- [x] Preset definitions (entrance, emphasis, exit, motion categories)
- [x] 17 presets: fade in/out, slide, scale, pulse, bounce, shake, spin, flash, float, swing, breathe
- [x] Preset panel UI with category tabs
- [x] Apply preset to selected element
- [x] applyPreset method in editor store

## Phase 16: Path/Bezier Element ✓

- [x] PathElement type with SVG path data (d attribute)
- [x] Fill, stroke, strokeWidth, lineCap, lineJoin properties
- [x] Path rendering in preview panel using SVG
- [x] Path property editing in property panel
- [x] Path support in embed dialog export

## Phase 17: Gradient Fills ✓

- [x] Gradient types (LinearGradient, RadialGradient)
- [x] FillValue union type (string | Gradient)
- [x] Gradient helper functions (isGradient, fillToCss, create*)
- [x] Gradient UI in property panel with color stops
- [x] Support for rect, circle, and path elements

## Phase 18: Enhanced Canvas Adapter ✓

- [x] Text target support (font, alignment, baseline)
- [x] Line target support (x2, y2, lineCap)
- [x] Path target support (SVG path data via Path2D)
- [x] Image target support (CanvasImageSource)
- [x] Linear gradient fill support
- [x] Radial gradient fill support
- [x] Border radius support for rectangles
- [x] Static loadImage helper method

## Phase 19: Export Formats ✓

- [x] CSS animations exporter (@keyframes, animation properties)
- [x] Easing to CSS timing function mapping
- [x] Transform property combination (translateX, rotate, scale)
- [x] Minification support for CSS output
- [x] Lottie JSON exporter (bodymovin-compatible)
- [x] Animated transform properties (position, rotation, scale, opacity)
- [x] GIF exporter with frame extraction
- [x] **Real animated GIF encoder** — median-cut quantization + Floyd–Steinberg
  dithering, per-frame local colour tables, transparency, and a spec-conformant
  LZW coder. Fixes the previous encoder, which wrote a hardcoded **greyscale**
  palette (every GIF came out grey) and desynced decoders at the 512-code
  boundary. Verified by decoding output back to pixels in the tests.
- [x] **Animated WebP exporter** — `canvas.toBlob('image/webp')` per frame,
  re-muxed into a `VP8X`/`ANIM`/`ANMF` container. ~3× smaller than GIF with true
  colour and full alpha.
- [x] **MP4 exporter via WebCodecs + hand-written ISO BMFF muxer** — H.264
  samples into `ftyp`/`mdat`/`moov` with full sample tables. Deterministic and
  faster than real time; MediaRecorder kept as fallback.
- [x] Shared `ByteWriter` + `quantize` modules; export dialog covers GIF/WebP/MP4
  with resolution multiplier, background/transparency, progress and cancel.
- [x] Browser verification harness (`export-check.html`) — exports all three
  formats in headless Chrome and validates them (GIF decoded to pixels, WebP
  decoded by the browser, MP4 loaded and seeked in a `<video>`).
- [ ] Remaining: MP4 needs WebCodecs (Firefox falls back to real-time WebM);
  WebP needs canvas WebP encoding; MP4 has no alpha; 32-bit `mdat` caps output
  at 4GB. Consider a Web Worker so large exports don't block the UI thread.

## All Core Features Complete ✓

---

## Phase 20: Polish & UX ✓

- [x] Add more sample animations (14 new samples added)
- [x] Add onboarding/help tooltips
- [x] Improve mobile responsiveness
- [x] Keyboard shortcuts help dialog
- [x] Ctrl+A should select all elements on canvas (not text)
- [x] Shift+resize should resize elements proportionately
- [x] Test motion path animation thoroughly (center alignment, full path coverage)
- [x] Renderer switcher (DOM/Canvas/SVG) in preview panel
- [x] Add "Algorisys" product showcase samples (6 viral-infographic demos: TinyFly, YappyDraw, HappyPaint, ProPeak, SkillzEngine, Ecosystem)
- [x] Hard-reload the app when the version chip in the status bar is clicked
- [x] **Scene duration is authorable and self-correcting** — the `2.000 / 2.000`
  readout is now an editable field (seconds), the timeline auto-extends when a
  keyframe is added or dragged past the end (so late keyframes always play), and
  a **Fit** button appears when keyframes sit past the end after a manual trim.
- [x] **Timeline ruler alignment** — the dope-sheet and curve-editor rulers were
  offset from the keyframe lanes by the width of the track-label column, so ticks,
  the playhead and keyframes never lined up. Ruler now sits in its own lane behind
  a matching gutter; ruler clicks and track double-clicks map to the right time.
- [x] **End-of-scene marker** — a dashed line at the duration plus dimming past it,
  so keyframes that will never play are obvious at a glance.
- [x] **Auto-save data-loss fix** — the auto-save and thumbnail effects bailed on
  the `isSwitchingScene` guard *before* reading any signal, so Solid left them
  with no dependencies and they never ran again after the first scene/project
  switch. Projects could reopen with an empty canvas. Reads now come first, and
  `vitest.config.ts` resolves solid to its client build so reactive wiring is
  testable at all.
- [x] **`isSwitchingScene` is a signal** — the effects subscribe to it, so the
  auto-save skipped during a scene/project switch retries the moment the switch
  ends instead of waiting for the user's next edit.
- [x] **One definition of the track-label width** — `--track-label-w` on
  `.timeline-panel` drives the dope-sheet labels, curve-lane labels, ruler gutter
  and scrollbar; `trackLabelWidth()` reads it back for hit-testing. The old
  hard-coded `120` in JS ignored the 90/70 mobile breakpoints, so box-select in
  Curves, zoom-at-cursor and the scrollbar were all misaligned on phones.

## Phase 21: Advanced Features

- [x] Audio/video sync support (`MediaSync` + `player.attachMedia()`; editor **Audio & Video elements** synced in the preview; media carried into embeds and auto-synced by the player via `[data-tinyfly-media]`)
- [x] Motion path (animate along SVG path)
- [x] Mask/clip support (animatable clip-inset reveal/wipe across all adapters — see Phase 23)
- [x] Multiple scenes/artboards
- [x] Scene transitions (fade, slide-left, slide-right, slide-up, slide-down)
- [x] Multi-scene player/sequencer (TinyflySequencer)
- [ ] Collaborative editing
- [x] Custom easing curve editor
- [x] **Curve / graph timeline view** — a Dope Sheet | Curves switcher
  (`timeline-panel.tsx`). The Curves view (`curve-view.tsx`) draws each numeric
  track as a value-over-time curve, normalized per-track, with the real easing
  sampled between keyframes (`curve-math.ts`, `getEasingFunction`). Keyframe
  points drag in 2D (time + value); double-click a lane adds a keyframe. Both
  views share the same store (playhead/zoom/scroll/selection), so switching is
  lossless. Non-numeric tracks (colour/motion-path/array) are noted, not drawn.
  - [x] Draggable **easing handles** on the selected keyframe — shape the
    cubic-bezier right on the curve (`easingToBezierPoints` seeds handles from
    built-in easings; a named easing converts to custom on grab).
  - [x] Ctrl/Cmd-click **multi-select** of curve points (parity with dope sheet).
  - [x] **Horizontal timeline zoom + scroll** — shared −/+/reset control,
    Ctrl/⌘+wheel zoom-to-cursor, Shift/horizontal-wheel pan, and a draggable
    scrollbar in `timeline-panel.tsx` (drives both views via `zoom`/`scrollPosition`).
  - [x] Dope-sheet double-click add-keyframe holds the track's value (no more
    snap-to-0) and is scroll-aware.
  - [x] **Box (rubber-band) select** of keyframes in the Dope Sheet and points in
    the Curves view (drag across empty space).
  - [x] **Overlay mode** in the Curves view — all numeric curves on one shared
    axis with a colour legend (`Lanes | Overlay` toggle).
  - [x] **Per-scene thumbnails** on the Scene Bar tabs (generated from each
    scene's elements; the active scene stays fresh via the editor's capture).

## Phase 23: Text Animation (Adobe Animate parity)

Reference: Adobe Animate text-animation techniques (drop & bounce, cascade,
wave, assemble, typewriter, shine/mask reveal, blur-in).

- [x] Split text into per-letter elements (Animate-style "break apart")
- [x] Staggered preset application (fan one preset across letters/selection with a per-letter delay)
- [x] Per-letter stagger UI in the preset panel (toggle + delay control)
- [x] Purpose-built letter presets: Drop & Bounce, Cascade Up, Wave, Assemble, Pop In
- [x] "Letter Drop & Bounce" showcase sample (data-authored, plays anywhere)
- [x] "Draw · Guess · Repeat" showcase sample — vertical app-promo beat (colour-swap scenes, staggered per-letter words, drawn underline)
- [x] Canvas-aware preview — the preview artboard (DOM/Canvas/SVG) now sizes to the project canvas and refits, so non-default aspect ratios (e.g. vertical 9:16) render at true proportions
- [x] Samples can declare their own `canvas` size; loading one resizes the project canvas (the promo sample loads as 360×640)
- [x] Device-frame preset — one-click phone mockup (body + rounded video screen + notch), canvas-aware sized and multi-selected; drop a screen-recording into the screen's `src`
  - [x] Phone (portrait), Landscape, and Tablet variants
  - [x] Rounded screen corners — `borderRadius` on the Video element (preview + export)
- [x] Version chip in the status bar restyled as an obvious reload button (pill + ⟳ icon, hover spin)
- [x] MP4 / WebM video export — records the Canvas renderer via MediaRecorder (size/FPS/codec picker, progress); `exportToVideo` in the engine
  - [x] Composite DOM-only layers (image + video) into the export — video frames are seeked in sync so a device screen's recording appears in the file
- [x] SVG stroke "write-on" on the DOM renderer — animated `strokeDasharray`/`strokeDashoffset` bound on the path, plus a one-click "Write On" preset
- [x] Resizable preview / timeline split — drag the splitter (double-click to reset)
- [x] **Unified undo/redo** — history now snapshots the timeline AND the scene
  elements, so one Ctrl+Z reverses the last change of either kind (add/delete/
  move/resize/rotate/group/device/property edits + keyframe/track edits).
  Continuous gestures collapse into a single undo step.
- [x] Typewriter / character-by-character reveal (with blinking, stepping cursor)
- [x] Timeline `setDuration` (auto-extends to fit generated effects)
- [x] Clip/mask reveal — animatable clip-inset in DOM, SVG, and Canvas adapters
- [x] Reveal/wipe presets (Reveal Right/Left/Up/Down); combine with stagger for per-letter mask reveal
- [x] Animatable filters (blur, glow, drop-shadow) — shared `composeFilter` across DOM, SVG, Canvas
- [x] Filter presets (Blur In, Drop Shadow, real Glow Pulse)
- [x] Shine sweep — highlight clipped to text glyphs; `text-shine` preset
- [x] Shine sweep across all renderers (DOM via background-clip:text; SVG/Canvas via gradient fill)

## Phase 22: Distribution

- [x] NPM package for the engine (`vite.config.engine.ts`, `build:engine` → `lib/engine`; `exports` map + type declarations)
- [x] CDN hosted player script (`build:player` → `lib/player/tinyfly-player.iife.js`, global `tinyfly`)
- [x] Audio/video sync (`MediaSync`, `player.attachMedia()`; exported from the player bundle)
- [x] Documentation (getting started, editor guide, API reference, examples, in-app viewer)
- [x] Example gallery (14 professional examples with DOM/Canvas renderer toggle)

## Phase 24: 2D Animation (planned)

Gap analysis vs a full Adobe Animate workflow and a phased plan — see
[docs/2d-animation-roadmap.md](docs/2d-animation-roadmap.md). On-brand next steps:

- [~] Phase A — Symbols + Library (reusable instances, nested timelines; enables lip-sync-style swapping)
  - [x] Foundation: `SymbolDefinition` + `'symbol'` instance type; `project.symbols`
    Library with migration; project-store Library API (create/get/rename/update/
    count/delete-guarded); persistence + tests (`symbol-library.test.ts`).
  - [x] Convert-to-Symbol (bundle selection → symbol + replace with instance,
    `element-bounds.ts`), `LibraryPanel` (list/place/rename/delete + thumbnails),
    and DOM-preview instance rendering (expand + scale via `generateElementHtml`).
  - [x] Edit-in-place (breadcrumb + nested-timeline editing) — double-click an
    instance or the Library pencil; auto-save branches to `updateSymbol`.
  - [x] Nested playback — a symbol's own timeline animates inside every instance
    (DOM preview, synced to the scene playhead via per-instance DOM adapters).
  - [x] Symbol-swap (lip-sync) — instance `swapSet` + `swapIndex` track; DOM preview shows `set[floor(swapIndex)]`; property-panel swap editor.
  - [x] Export/embed/thumbnail + Canvas expansion of instances via
    `expandSymbolInstances` (flatten to shapes).
  - [x] **Raster export (GIF/WebP/MP4) bakes in nested animation + swaps** via
    `symbol-export-layer` (per-symbol composites rendered under a ctx transform
    that honours the instance's own scene animation). Embeds still static; SVG
    preview + instance-opacity compositing pending.
  - [x] SVG preview rendering of instances (flattened, matches Canvas).
  - [ ] Undo of Convert also removes the orphaned symbol (deferred — clean fix
    would deep-copy the library on every history push; harmless + deletable).
  - [ ] Instance-opacity compositing in export (rare; needs offscreen canvas).
  - [x] Nested animation baked into **single-scene embeds** (player runs each
    instance's nested timeline (single-scene: PlayerOptions.symbols; multi-scene: SequenceDefinition.symbols + sequencer). Swap-in-embed still pending.
  - [ ] (was) Nested animation/swaps baked into embeds (needs runtime nested
    playback in the player — largest remaining item).
  - See [docs/symbols-and-library.md](docs/symbols-and-library.md).
- [~] Phase B — Camera (animated pan/zoom/rotate), onion skinning, guides/grid/snapping
  - [x] Camera foundation: `Camera` layer in the DOM preview + addCamera/removeCamera/hasCamera + preview toggle; keyframe pan/zoom/rotate as ordinary tracks. See [docs/camera.md](docs/camera.md).
  - [x] Camera in Canvas/SVG preview + raster export + embeds (slice 2) — shared `camera.ts` transform; sequencer per-scene camera layer.
  - [x] Camera demo templates (Push In, Pan Across, Orbit Reveal).
  - [x] Camera inspector (slice 3a): 🎥 Camera section in the Property Panel — Pan X/Y, Zoom, Rotation keyframed at the playhead via `setCameraValue`; Reset / Remove.
  - [x] On-stage pan + timeline camera lane (slice 3b): ✋ Pan drag overlay in the DOM preview pans the camera (x/y keyframes at playhead); Camera tracks float to the top of the timeline as a distinct 🎥 lane.
  - [ ] Full on-stage frame (corner-zoom + rotate handle) + edit-in-camera coords (slice 4).
  - [x] Onion skinning (Canvas renderer): 🧅 toggle draws faint ghost frames before/after the playhead. Pure `onion.ts` helper (tested). See [docs/onion-skinning.md](docs/onion-skinning.md).
  - [x] Grid + snapping: ▦ Grid overlay + 🧲 Snap (drag snaps to grid/element edges/centre/artboard) with live pink guides. Pure `snap.ts` helper (tested). See [docs/grid-and-snapping.md](docs/grid-and-snapping.md).
  - [x] Resize snapping: the dragged edge/corner snaps to the same targets (Shift-aspect-lock disables it).
  - [x] Rulers + draggable guides: 📏 Rulers toggle; drag guides out of the rulers, reposition, drop off-stage to remove; elements snap to guides. See [docs/grid-and-snapping.md](docs/grid-and-snapping.md).
- [x] Phase C — Pen tool + polygon/star, shape-tween morph tooling, video/sprite-sheet export (all shipped)
  - [x] Polygon + star shapes: ⬡/★ in the Elements panel; parametric `shape` spec (sides/points/inner ratio) that regenerates the path `d` on edit + resize. Pure `poly-star.ts` (tested). See [docs/polygon-star.md](docs/polygon-star.md).
  - [x] Shape-tween morphing: engine morphs path `d` strings (sample-and-lerp), routed via `getInterpolator`; 🌀 Shape Morph authoring in Properties; renders in DOM/SVG/Canvas/export/embeds. Pure `path-morph.ts` (tested). See [docs/shape-morph.md](docs/shape-morph.md).
  - [x] Sprite-sheet export: frames packed into one PNG grid + JSON metadata (frame size, columns/rows, count, fps). Pure `sprite-sheet.ts` layout (tested); reuses the raster `draw`. See [docs/sprite-sheet-export.md](docs/sprite-sheet-export.md).
  - [x] Pen tool: ✒️ click to place anchors, click-drag for smooth bezier handles (Alt = corner/cusp), drag existing anchors/handles to adjust mid-draw, pen points snap to grid/guides/elements, click first point / Enter to finish, Backspace undoes last point, close-hover cue, Esc to cancel; produces a normal PathElement. Pure `pen-path.ts` (tested). See [docs/pen-tool.md](docs/pen-tool.md).
- [ ] Out of scope: bone/IK rigging, frame-by-frame drawing, natural-media brushes

---

## Phase 25: GSAP-flavoured compat facade (`tinyfly/gsap-compat`) ✓

**Goal:** give GSAP-literate developers a familiar imperative surface without
letting imperative semantics into the engine. The facade is a *desugarer*: every
call it accepts compiles down to ordinary `Track` + `Keyframe` data and is
handed to a normal `Timeline`. Nothing new enters `src/engine/core`.

**Not a goal:** drop-in GSAP compatibility. We will never match plugin APIs,
`gsap.utils`, or GSAP's internal property parsing. This is *familiar*, not
*compatible* — the docs must say so in the first paragraph.

### Placement & rules

- Lives in `src/compat/gsap/`, published as a separate entry `tinyfly/gsap-compat`
  (add to `exports` in `package.json`, build via a third Vite lib config).
- Depends **only** on the public engine API (`Timeline`, `createTrack`, easing
  helpers). Zero new engine exports; zero DOM imports in the compile step.
- Every method returns a plain `TimelineDefinition` on `.toDefinition()`, so
  anything authored through the facade opens in the editor and round-trips as
  JSON. This is the acceptance test for the whole phase.
- Seconds in, milliseconds stored. The facade is the only place `* 1000` lives.

### Slice 1 — tween desugaring

- [x] `tf.to(target, vars)`, `tf.from(target, vars)`, `tf.fromTo(target, fromVars, toVars)`,
      `tf.set(target, vars)`.
  - `vars` splits into **reserved keys** (`duration`, `delay`, `ease`, `repeat`,
    `yoyo`, `stagger`, `onComplete`, `onUpdate`) and **animated properties**
    (everything else → one `Track` each).
  - Each property compiles to a 2-keyframe track: `{time: start, value: from}`,
    `{time: start + duration, value: to, easing}`.
  - `tf.set` compiles to a single keyframe (a step hold).
- [x] **The `from` problem.** GSAP reads the live DOM for the implicit start
      value; we must not (determinism rule 5). Resolution order:
  1. explicit `from` in `fromTo` — always wins;
  2. the target's last authored value earlier on this timeline;
  3. a `defaults` map passed to `tf.timeline({ defaults })`;
  4. the property's documented static default (`opacity: 1`, `x: 0`, `scale: 1`).
  A `to()` whose start value resolves to (4) logs a one-line dev warning naming
  the property, because that is the case where GSAP users will be surprised.
  **No `getComputedStyle` anywhere.** Document this as an intentional divergence.
- [x] Target resolution: accept a target-name string (engine-native) or an array
      of them. A CSS selector or raw `Element` is accepted **only** by the DOM
      convenience wrapper in slice 5, which registers it with a `DOMAdapter` and
      mints a stable generated name — the compile step still sees only names.

### Slice 2 — sequencing & the position parameter

- [x] `tl.to(target, vars, position)` where `position` is:
  - a number → absolute seconds;
  - `"+=n"` / `"-=n"` → relative to the current end-of-timeline cursor;
  - `"<"` / `">"` → start/end of the *previous* tween;
  - `"<n"` / `">n"` → previous tween's start/end, offset by `n` seconds;
  - a label string → the labelled time.
- [x] `tl.add(child, position)` for nesting another compat timeline (flattened at
      compile time by offsetting every keyframe — no nested-timeline runtime).
- [x] `tl.addLabel(name, position)`, and labels resolvable by `seek(label)`.
- [x] Internal cursor semantics documented in one comment block: append-by-default,
      exactly like GSAP, since that is the behaviour people rely on most.

### Slice 3 — stagger

- [x] `stagger: number` → each target's start offset by `i * n`.
- [x] `stagger: { each, from, amount, grid, axis, ease }` with `from` supporting
      `'start' | 'center' | 'edges' | 'end' | index`.
- [x] Compiles to N independent tracks with shifted keyframe times — i.e. exactly
      what the editor's per-letter stagger already bakes
      (`src/editor/utils/split-text.ts`). **Reuse that offset math**, don't fork
      it: extract the ordering/offset function into a shared pure helper both
      call. This is the single highest-value item in the phase.

### Slice 4 — ease-name mapping

- [x] Map GSAP ease strings to our easing set. Exact where we have it, closest
      cubic-bezier where we don't:
  - `none`/`linear` → `linear`; `power1..4.in/out/inOut` → quad/cubic equivalents
    or generated bezier; `sine`, `expo`, `circ`, `back` → cubic-bezier;
  - `elastic`, `bounce`, `steps(n)` → **not representable** by a single bezier.
    Options: (a) reject with a clear error naming the ease, or (b) bake them by
    sampling the ease into N intermediate keyframes at author time.
    **Decision: (b), behind `{ bakeEases: true }`, default off** — baking keeps
    JSON portable and the engine untouched, but multiplies keyframe count, so it
    must be opt-in and the docs must state the keyframe cost.
  - [ ] **Deliberately not done** — adding `elastic`/`bounce`/`steps` as
        first-class `BuiltInEasingType` values is gated on baking proving
        unusable in practice. Baking works; springs (26C) cover the cases where
        a real spring was what the author wanted. Revisit only with evidence.
- [x] `ease` may also be a raw `CubicBezierPoints` or an `EasingFunction`
      (function eases can't serialize — reject them at `toDefinition()` with a
      message pointing at `createCubicBezier`).

### Slice 5 — DOM convenience wrapper & control surface

- [x] `tf.quickPlay(...)` style helper that wires `DOMAdapter` + a rAF loop, so
      the 12-line boilerplate in `docs/examples.md` becomes one call. This is the
      *real* reason GSAP feels lighter than us today — worth doing regardless of
      the rest of the phase.
- [x] Control aliases on the returned handle: `play/pause/reverse/restart/kill`,
      `seek(secondsOrLabel)`, `progress()`, `timeScale()` → mapped onto
      `Timeline` + `config.speed`. `repeat`/`yoyo` → `loop`/`alternate`.
- [x] `kill()` = stop + unregister targets. No GSAP-style tween-level overwrite
      semantics (we have no live tween objects to overwrite) — document the gap.

### Explicitly out of scope

Plugins (ScrollTrigger, Draggable, Flip, MorphSVG, MotionPathPlugin's
autoRotate-from-live-DOM), `gsap.utils.*`, `gsap.matchMedia`, `quickSetter`,
keyframe-arrays-inside-vars, tween-level overwrite/conflict resolution, and
GSAP's implicit `getComputedStyle` start values. Scroll-driven playback is a
separate idea (it's a *clock* concern, not a compat concern) — if we want it,
it belongs in the engine as an alternative clock, not here.

### Acceptance

- [x] A compat-authored animation exports JSON that loads in the editor unchanged.
- [x] Golden-file tests: for ~10 representative GSAP snippets, assert the compiled
      `TimelineDefinition` matches a checked-in fixture.
- [x] Determinism test: compiling the same script twice yields byte-identical JSON.
- [x] Engine bundle size unchanged (facade is a separate entry, tree-shakeable).
- [x] `docs/gsap-compat.md` — mapping table + a "what we deliberately don't do"
      section, linked from the README.

---

## Phase 26: Closing the GSAP capability gaps ✓

Phase 25 closes the *syntax* gap. This phase closes the *capability* gap: the
animation kinds GSAP can express that tinyfly currently cannot, regardless of
which API you use.

Organising principle: **the engine stays a pure function of time.** Everything
here either (a) becomes a new *driver* that decides what time to pass in, (b)
becomes an authoring-time compiler that emits ordinary keyframes, or (c) is a
narrow, deterministic extension of the track model. Anything that cannot be
made to fit one of those three shapes is listed under "Deliberately rejected"
with the reasoning, so it is not relitigated every six months.

Precedent for (a): `Clock` already samples wall-clock time from rAF
(`src/engine/core/clock.ts`). The engine is deterministic *given a time*, not
given a wall clock — drivers are an existing, accepted boundary, not a new
compromise.

### 26A — Driver layer + scroll-driven playback  ← highest value

The biggest real-world gap. Most GSAP production work is scroll-driven, and we
have no answer at all.

- [x] Establish `src/drivers/` — modules that own *when* and *to what time* a
      timeline is advanced. They may touch the DOM; the engine must not import
      them. A driver's only contract is calling `seek()` / `tick()`.
- [x] `VisibilityDriver` (slice 1, ship first): IntersectionObserver → play once
      / play each time / reset on exit. ~80 lines, no layout maths, and it covers
      the most common "animate when it scrolls into view" case. Do this before
      any scrub work.
- [x] `ScrollDriver` (slice 2): maps scroll progress to timeline time (scrub).
  - Pure core: `scrollProgress(rect, viewport, start, end) -> 0..1` as a tested
    standalone function. All DOM reading happens in a thin shell around it.
  - GSAP-style `start`/`end` strings (`"top bottom"`, `"center center"`,
    `"+=400"`) parsed by a pure resolver with a fixture table of cases.
  - `scrub: true | number` — the number is a smoothing time constant; implement
    as exponential approach toward target time, and note that smoothing makes
    playback frame-rate dependent (offer `scrub: true` as the exact, snappy path).
  - `onEnter`/`onLeave`/`onEnterBack`/`onLeaveBack` callbacks.
- [x] **Pinning** (slice 3, decide before building): pinning mutates layout
      (position/spacer insertion) and is where ScrollTrigger's real complexity
      lives. Options: (a) implement it, (b) document a CSS `position: sticky`
      recipe that covers ~80% of uses with zero engine surface.
      **Leaning (b) first** — ship the recipe in docs, revisit (a) only if the
      sticky approach demonstrably fails for a real example in the gallery.
- [x] Editor support: **scroll-scrub preview** (`⇅ Scroll` in the preview
      header → `scroll-preview.tsx`). Attaches a real `ScrollDriver` to a real
      scroll strip, so the triggers behave exactly as they will in production
      rather than being simulated. Start/end presets, scrub smoothing, runway
      length, a live progress readout, and the code snippet to reproduce it.
- [x] `docs/scroll-animation.md` (written, including the `position: sticky`
      pinning recipe).
  - [x] Three gallery examples in a new **Scroll** category: Scroll Reveal,
        Scroll Parallax, Scroll Progress Bar. Each carries a `driverSnippet`
        shown on the card — the gallery loops them (a card is too small to
        scroll in), so the snippet is how you make them scroll-driven.

### 26B — Interaction layer (Draggable / Observer)

- [x] `src/interaction/` — pointer/wheel/touch normalisation (`Observer`
      equivalent): a single unified event source emitting
      `{deltaX, deltaY, velocityX, velocityY, isDragging}`.
- [x] `Draggable`: bounds, axis lock, snapping, and two output modes below.
  - [x] Snapping shares the editor's math: `snap.ts` moved to
        `src/interaction/snap.ts` (it was already pure — only its location was
        editor-specific) and both callers use `snapAxis` / `gridLinesFor`.
        `Draggable` gains `snapLinesX/Y` for edge snapping and reports which
        line caught, for drawing guides. The threshold defaults to half the
        grid size so existing grid behaviour is unchanged.
  1. **drive a timeline's time** (drag to scrub) — needs nothing new;
  2. **drive a target's properties directly** via an adapter — bypasses the
     timeline entirely and is therefore *not* serializable. Must be documented
     as a live-interaction API with no JSON representation.
- [x] Keep this out of the engine and out of the default player bundle — separate
      entry `tinyfly/interaction`, opt-in, so embed size is unaffected.

### 26C — Deterministic springs & inertia (a second track kind)

GSAP's InertiaPlugin/physics cannot be keyframed ahead of time. Rather than
reject physics outright, extend the track model in the one way that stays
deterministic and serializable.

- [x] New track kind `SpringTrack`:
      `{ kind: 'spring', target, property, from, to, stiffness, damping, mass, restDelta }`.
- [x] **Fixed-timestep integration** (e.g. 1 ms substeps) evaluated from t=0 for
      any requested time — so `getValueAtTime(t)` is pure and repeatable, and
      `seek()` backwards gives the identical value. Never integrate from the
      previous frame's state; that would make output frame-rate dependent and
      break determinism rule 5.
  - [x] Memoise per-track simulation results to keep scrubbing cheap.
- [x] Fully JSON-representable (it's just parameters), so it round-trips through
      the editor and export like any other track.
- [x] Derive `restDelta`-based natural duration so a spring track contributes a
      sensible length to `Timeline.duration`.
- [x] Curves view: spring tracks draw from `sampleSpringCurve`, which samples
      the same `SpringSampler` the engine plays back — so the drawn curve is
      what runs. They get read-only lanes (dashed, badged `spring`) because a
      spring's shape comes from parameters, not draggable points. `springRange`
      sizes the lane from sampled values so an underdamped overshoot is not
      clipped.
- [x] This also supersedes the Phase 25 "bake elastic/bounce" workaround for the
      cases where a real spring is what the author actually wanted.

### 26D — Live-layout transitions (Flip) as an authoring-time compiler

- [x] `flip(targets, mutate)` helper in the DOM layer: measure rects → run the
      caller's layout mutation → measure again → emit an ordinary two-keyframe
      track per changed target (x/y/scaleX/scaleY).
- [x] Engine untouched: measurement is DOM-layer, output is plain keyframes, and
      the result serializes normally. The JSON is a snapshot of one specific
      layout change — document that clearly, since GSAP's Flip is re-measured
      every run and ours is not.

### 26E — Relative, function-based, and randomised values (compile-time only)

GSAP resolves these at runtime. We resolve them at **compile time** and store
the concrete result, which preserves both determinism and JSON-first.

- [x] `"+=100"` / `"-=50"` / `"*=2"` resolve against the previous authored value
      on that target+property (shared resolver with Phase 25's `from` chain —
      one implementation, not two).
- [x] `"random(-100, 100)"` and function values resolve once at authoring time
      against a **recorded seed** stored in the timeline JSON, so regenerating
      reproduces the same animation and the output is still plain numbers.
- [x] `random(...)` needs a small seeded PRNG (acceptable under the dependency
      rule — a dozen lines, no package).
- [x] Explicitly *not* re-evaluated per loop iteration (GSAP's `repeatRefresh`).
      Document the divergence.

### 26F — Track conflict resolution & addressable spans

- [x] **Existing undocumented behaviour, now documented:** when two tracks share a
      target+property, `getStateAtTime` writes both into the same map key, so the
      *last track added* silently wins (`timeline.ts`, the
      `targetValues.set(track.property, value)` line). Nothing documents this and
      nothing warns. Decide and document an explicit rule:
      last-added-wins (current, cheap) vs. an explicit `priority` field on
      `Track`. **Leaning: keep last-added-wins, document it, and surface a
      warning in the editor when two tracks overlap in time on the same
      target+property** — silent overwrite is the bug, not the rule itself.
  - [x] Rule documented in `getStateAtTime`; `findConflicts()` added to detect
        overlaps.
  - [x] The editor warns: `trackConflicts()` / `overriddenTrackIds()` on the
        store feed a banner in the Tracks panel, and each overridden track is
        struck through with a ⚠ and a tooltip naming the track that wins.
- [x] `timeline.getTracks(filter)` / `removeTracks(filter)` by target, property,
      or time range — the closest principled equivalent to GSAP's per-tween
      `kill()`, given we have no live tween objects.
- [x] Phase 25's facade returns handles that carry the generated track ids, so
      `tween.kill()` maps onto `removeTracks`.

### 26G — Missing animatable properties

Small, unglamorous, and each one blocks real animations today.

- [x] `transformOrigin` (DOM + SVG + Canvas). Canvas needs it most — it currently
      has no origin concept, so rotate/scale always pivot at the element's own
      anchor. Non-interpolating string values (`"50% 50%"`) need a step-hold
      interpolator, or restrict to a numeric `[x, y]` pair — **prefer the numeric
      pair**, it interpolates and serializes cleanly.
- [x] `perspective` / `transformPerspective` (DOM real; Canvas already only
      approximates 3D at `canvas-adapter.ts` — document the approximation rather
      than pretending parity).
- [x] `repeatDelay` on `TimelineConfig` (pause between loop iterations).
- [x] Per-track `delay` / `endDelay` convenience (currently expressible only by
      shifting keyframe times).

### 26H — Runtime stagger primitive (optional, after Phase 25)

Phase 25 bakes stagger into keyframes at author time, which is correct for JSON
portability but multiplies track count for large splits (100 letters = 100
tracks). If that proves to be a real perf or file-size problem:

- [x] Allow one track to carry `targets: string[]` + a `stagger` descriptor,
      expanded at evaluation time instead of author time.
- [x] Shipped, but **the evidence gate was not honoured** — runtime stagger was
      built without first profiling the baked form. It is covered by a test
      asserting the two forms produce identical output, so neither is wrong;
      still, the baked form remains the default in the editor and the runtime
      form should be justified by a profile before it is promoted.

### 26I — WebGL adapter

- [x] Built the minimal adapter rather than amending the doc: quad-per-element
      with transform, opacity and tint (`src/adapters/webgl/`). Pure
      `quadMatrix` / `parseColor` are unit-tested; the GL calls need a real
      context and are not.
  - Scope is honest in the module doc: no paths, text, or gradients — use the
    Canvas or SVG adapter for those.

### Deliberately rejected (superseded — see Phase 27)

These were rejected during Phase 26 for the reasons below. Most have since been
**reopened for consideration** in Phase 27, which proposes versions that keep the
determinism and JSON-first guarantees intact. The original reasoning is kept
because it is still the bar any proposal has to clear.

- **Runtime function-based values** (`x: () => Math.random()*100` evaluated each
  play) — breaks determinism rule 5 and cannot serialize. 26E is the answer.
  → reopened as **27A.1** (load-time resolution, not per-frame).
- **`repeatRefresh`** — same reason.
  → reopened as **27A.2** (seed derived from the loop iteration).
- **Tween-level overwrite/conflict auto-resolution** — GSAP's `overwrite: 'auto'`
  depends on live tween instances mutating each other. Our model is declarative
  data; 26F's explicit rule is the principled equivalent.
  → reopened as **27B.5** (explicit priority, still declarative).
- **`gsap.matchMedia` / `gsap.context`** — responsive variants belong in the host
  app choosing which timeline JSON to load, not in the engine.
  → reopened as **27A.3 / 27A.4** (variants as data; disposal as a host helper).
- **Plugin architecture** — a plugin system would let arbitrary code into the
  evaluation path and destroy the "inspectable, deterministic" property that is
  the whole point. New capability lands as engine features or drivers, reviewed
  individually.
  **Still rejected.** Nothing in Phase 27 requires it.

### What shipped

All nine slices are implemented and tested (1085 tests, up from 731). New modules:

| Area | Location |
|---|---|
| Stagger maths (shared) | `src/engine/core/stagger.ts` |
| Spring simulation | `src/engine/core/spring.ts` |
| Baking (springs + eases) | `src/engine/core/bake.ts` |
| Compile-time values + seeded PRNG | `src/engine/authoring/` |
| Track queries + conflict detection | `Timeline.getTracks/removeTracks/findConflicts` |
| Scroll + visibility drivers | `src/drivers/` → `tinyfly/drivers` |
| Pointer/drag interaction | `src/interaction/` → `tinyfly/interaction` |
| FLIP | `src/adapters/dom/flip.ts` |
| WebGL adapter | `src/adapters/webgl/` |
| GSAP compat facade | `src/compat/gsap/` → `tinyfly/gsap-compat` |

Add-ons build to `lib/addons` via `vite.config.addons.ts`, with the engine
externalised to the bare `tinyfly` specifier — importing both `tinyfly` and an
add-on must not yield two `Timeline` classes.

Docs: [gsap-compat.md](docs/gsap-compat.md), [scroll-animation.md](docs/scroll-animation.md),
plus new API-reference sections. Both are registered in the in-app help viewer
(`src/docs/docs-viewer.tsx`), so they appear under **Docs** in the editor.

**Two bugs the tests caught in the new code, worth remembering:**
- The compat facade defaulted its timeline id to `Date.now()`, so the same
  script compiled to different JSON on every run — a direct determinism
  violation, caught by the "compiles identically" test.
- Position parameters (`'-=0.25'`) were parsed as milliseconds when GSAP means
  seconds. Fixed with an explicit `scale` on `PositionContext`, so the
  seconds→ms conversion lives in exactly one place.

### Follow-up pass (all five carried-forward items now done)

The five items left open at the end of the first pass have been completed:

| Item | Where |
|---|---|
| Scroll-scrub preview in the editor | `src/editor/components/scroll-preview.tsx` |
| Conflict warning wired to `findConflicts()` | `track-panel.tsx` + store `trackConflicts()` |
| Curves view samples spring tracks | `curve-math.ts` `sampleSpringCurve` / `springRange` |
| `Draggable` shares the editor's snap math | `snap.ts` moved to `src/interaction/` |
| Gallery examples for scroll | three in a new **Scroll** category |

Tests: 1085 → 1122.

Two notes worth keeping:

- The scroll preview runs the **real** `ScrollDriver` against a **real** scroll
  container rather than simulating scroll. That is what makes it trustworthy:
  a trigger string tuned in the editor behaves identically on the page. It also
  means the preview needed a `syncPlayheadFromTimeline()` primitive on the
  store, since a driver seeks the `Timeline` directly and the editor's readouts
  follow a signal.
- The store's conflict accessors are `createMemo`s, so — like the existing
  `tracks()` / `duration()` memos — they only recompute under the observer graph
  the running app provides. The tests therefore assert against
  `timeline.findConflicts()` directly, which is the convention this suite
  already documents.

### Spring presets (done)

`PresetTrack` is now a union — `KeyframePresetTrack | SpringPresetTrack` — so a
preset can mix both kinds, which Spring Pop and friends do (a keyframed opacity
fade alongside a spring on scale). Five presets in a new **Spring** category:
Spring Pop, Spring Drop, Spring Slide, Spring Wobble, Spring Settle.

Two of them exist to demonstrate the physics rather than just to look nice:

- **Spring Wobble** has `from === to` and a non-zero `velocity`, so the motion
  comes entirely from the initial flick. That is what makes it read as a knock
  rather than a return from somewhere.
- **Spring Settle** is damped past critical, so it never overshoots — the
  counterexample to the other four.

Both properties are asserted in tests, so a future edit that quietly breaks the
characteristic fails rather than just looking slightly different.

### Spring authoring (done)

Springs are now fully authorable without touching the API:

- **Tracks panel** → **+** → **Add Spring** creates one for a target/property.
- **Properties** shows a spring inspector: named feel presets (stiffness and
  damping interact, so pairs that work are far more useful than two bare
  sliders), from/to, delay, and sliders for stiffness/damping/mass plus initial
  velocity. It reports the settle time and flags overshoot.
- `updateSpring` **replaces** the track rather than mutating it, because the
  timeline memoises a sampler per spring when the track is added — editing the
  config in place would leave the old simulation cached and the preview showing
  the previous motion. There is a test for exactly that.
- `requiredDurationMs()` was added because `lastKeyframeTime()` only sees
  keyframes, and a spring has none — a spring-only scene would have computed a
  duration of 0 and played nothing.
- `isUnderdamped` / `criticalDamping` moved into the engine so the editor's
  "overshoots" badge is a tested physics claim, not inline UI arithmetic. A test
  checks the closed form against the simulation across a range of parameters.

### 26H evidence gate: resolved (and the answer was not what the spec expected)

The spec gated runtime stagger on a profile showing the baked form was "too
slow". It was run (`src/engine/core/stagger-forms.test.ts` carries the numbers):

| targets | baked eval | runtime eval | baked JSON | runtime JSON |
|---|---|---|---|---|
| 10 | 5.9 ms | 3.5 ms | 1,176 | 251 |
| 100 | 8.1 ms | 7.0 ms | 11,676 | 792 |
| 500 | 41.3 ms | 41.9 ms | 59,626 | 3,593 |

**Speed is not the reason.** The two forms are within noise of each other and
identical at 500 targets — expanding one track across N targets costs about what
evaluating N tracks costs, which is what you would expect.

**File size is the reason**, and it is not close: ~15x at 100 targets, ~17x at
500. For a format whose whole point is being shipped over a network and stored
per project, that justifies the feature — just for a different reason than the
spec anticipated.

Consequence for the editor: it should **keep baking**, because the baked form is
what makes each letter individually draggable, and authorability is worth more
than file size inside the editor. The runtime form is for the API and for
export.

Follow-on idea (not built): an export-time pass that collapses a set of
identically-shaped, evenly-offset tracks back into one runtime stagger track.
That would give small files and per-letter editing at once.

The timing numbers are recorded as a comment rather than asserted — timing
assertions in CI are flaky and there is no action we would take on them. The
size relationship *is* asserted, because it is deterministic and it is the
property the feature exists for.

### Found by browser testing (v0.50.1)

Driving the real editor turned up three defects that the test suite could not
have caught. Worth recording *why* each was invisible to tests:

1. **IndexedDB writes were silently failing** (pre-existing, since before this
   work — confirmed by running v0.46.2). Project records go straight from a
   Solid store into `IDBObjectStore.put`, and in the browser those are Proxies,
   which structured clone rejects with `DataCloneError`. The only record that
   ever persisted was the initial *empty* project: the moment the canvas had
   anything on it every save was dropped, and the loss only showed after a
   reload. Fixed by `unwrap`-ing before the write, with a JSON retry.
   - Why tests missed it: under Vitest's Node environment `createStore` does not
     proxy at all (`state === unwrap(state)`), so the failure is not
     reproducible there. The regression test asserts the properties the fix
     relies on and says so explicitly.

2. **Spring rest detection was scale-dependent.** The thresholds were absolute,
   so a `scale: 0 → 1` spring hit them ~100x sooner than an `x: 0 → 100` one —
   it was declared "settled" at its first pass through the target, never
   overshot, and reported 140 ms instead of 854 ms. The editor's "overshoots"
   badge was therefore lying, which is exactly the failure mode the badge was
   supposed to prevent. Thresholds are now fractions of travel distance, so
   settling depends on the spring's parameters and not on the units of the
   property it drives.
   - Why tests missed it: every existing spring test used `from: 0, to: 100`.
     The presets all use `0 → 1`. `spring-scale.test.ts` now covers small
     magnitudes and asserts scale invariance directly.

3. **The scroll preview was invisible.** Stacked below the stage, it was clipped
   away by the preview panel's `overflow: hidden` — the timeline splitter owns
   most of that column's height. Moved beside the stage, where it costs no
   vertical height at all.
   - Why tests missed it: layout is not something this suite can assert.

### Still open

Everything remaining from Phase 26 is carried into **Phase 27** below, which
also covers the runtime-dynamism items and the maturity gaps found by the
v0.50.1 comparison against GSAP.

- Pinning in `ScrollDriver` → **27B.1** (still gated on a concrete example that
  the `position: sticky` recipe cannot express).
- Export-time collapse of baked staggers into runtime stagger tracks — the one
  item *not* in Phase 27, because it is an optimisation rather than a gap. Still
  worth doing: it would give small files and per-letter editing at once.

### Sequencing recommendation

26A slice 1 (visibility) → 26G (missing properties) → 26A slice 2 (scroll scrub)
→ 26F (conflict rule) → 26E → 26C → 26B → 26D. 26H and 26I are conditional.
26A and 26G together cover the majority of real complaints a GSAP user would
have; everything after that is long-tail.

---

## Phase 27: Closing on GSAP — runtime dynamism, missing plugins, maturity — planned

Written after a full comparison at v0.50.1. Phase 26 closed most of the
*capability* gap; this phase covers what is left, in three groups of very
different character:

- **27A Runtime dynamism** — things we rejected on principle. Reopened, with
  designs that keep determinism and JSON-first intact. **Read the rejection
  reasoning in "Deliberately rejected" above before starting any of these.**
- **27B Missing runtime features** — ordinary work, no principle conflict.
- **27C Maturity** — not features at all, and probably worth more than 27A+27B
  combined.

**Ordering note:** 27C first. The v0.50.1 post-mortem is the argument — 1,191
tests, and twenty minutes of real browser use found three bugs including silent
data loss that had shipped for four releases. More features on an under-verified
base is the wrong trade.

---

### 27A — Runtime dynamism (principle-sensitive)

The shared insight behind all four: GSAP resolves these **per frame**, which is
what makes them un-serializable. Resolving them **once, at load**, gets most of
the value and keeps the JSON a complete description of the animation.

#### 27A.1 — Load-time value resolution

- [ ] `deserializeTimeline(definition, { resolve })` where `resolve(token)`
      turns a named token into a value.
- [ ] JSON carries a token, not code: `{ "value": { "$ref": "viewportWidth" } }`.
- [ ] The host supplies the values; the engine never evaluates anything.
- [ ] Unresolved tokens fall back to a `default` recorded alongside the token,
      so a player with no resolver still plays something sensible.

**Why this clears the bar:** deterministic given its inputs, fully serializable,
and the player stays free of an expression evaluator. Covers the real use case
(viewport-relative distances, themed colours) without arbitrary code.

**What it does not cover:** per-frame variation. That stays rejected.

#### 27A.2 — Per-iteration randomisation (`repeatRefresh`)

- [ ] Derive the PRNG seed from `baseSeed + loopIteration` so each loop draws
      different values.

**Why this clears the bar:** still reproducible, and — better than GSAP — you
can compute iteration N's values directly without playing 1..N-1, so scrubbing
and export still work. That property is worth protecting in the design.

- [ ] Requires random values to be resolved at *evaluation* rather than
      authoring time for tracks that opt in. Scope carefully: this is the one
      item here that touches the hot path.

#### 27A.3 — Responsive variants (`matchMedia`)

- [ ] A `variants` map in the timeline definition, keyed by media query:
      `{ "(max-width: 600px)": { ...overrides } }`.
- [ ] Resolved once at load by the player, which already knows the viewport.
- [ ] Overrides are partial track data, merged over the base — not whole
      alternative timelines, which would triple file size.

**Why this clears the bar:** it is data. The engine still receives one concrete
timeline.

#### 27A.4 — Scoped cleanup (`gsap.context`)

- [ ] A `TimelineGroup` (or plain disposer) that owns a set of timelines,
      drivers and adapters and tears them all down together.
- [ ] Mostly a host-side convenience; no engine change expected.
- [ ] Low risk, high value for framework users — this is what React/Vue
      integrations will reach for on unmount.

---

### 27B — Missing runtime features

#### 27B.1 — Scroll pinning

- [ ] The one we deferred twice. `position: sticky` covers the common case and
      is documented; this is for what it cannot express (pinning inside a
      transformed ancestor, horizontal pins, pin-spacing with anchors).
- [ ] Requires mutating layout: reposition the element and insert a spacer to
      preserve scroll height. That is where most of ScrollTrigger's complexity
      lives, and why it was deferred.
- [ ] **Gate: build only when a concrete example defeats the sticky recipe.**
      Write that example first; if it cannot be written, close the item.

#### 27B.2 — Inertia / throw (`InertiaPlugin`)

- [ ] A `decay` track kind: release with a velocity, decay by friction, settle.
- [ ] Different equation from a spring (exponential friction decay, not
      oscillation), so it is a sibling of `SpringTrack`, not a mode of it.
- [ ] Optional snap targets — land on the nearest of a set of values.
- [ ] Same fixed-timestep-from-t=0 treatment as springs, for the same reason:
      deterministic, serializable, scrub-safe. Reuse `SpringSampler`'s shape.
- [ ] Pairs with `Draggable`'s release velocity, which is already reported.

#### 27B.3 — Authoring-time text/curve generators

These compile to keyframes, so they fit the model with no engine change at all.
Cheapest wins in 27B.

- [ ] **ScrambleText** — character scramble resolving to the target string.
- [ ] **CustomBounce / CustomWiggle** — parameterised generators producing a
      keyframe sequence or a sampled ease.
- [ ] All three belong in an `authoring/generators` module beside the existing
      typewriter and split-text builders.

#### 27B.4 — Nested timelines at runtime

- [ ] Today `gsap-compat`'s `add()` flattens a child at compile time, so a child
      cannot have its own `timeScale`, loop count, or be controlled separately.
- [ ] A `TimelineTrack` kind referencing a child definition would fix that.
- [ ] Touches duration computation, serialization, the editor's track list and
      conflict detection. **Not small.** Needs a design note before code.

#### 27B.5 — Explicit track priority

- [ ] 26F documented last-added-wins and made overlaps detectable. The next step
      is an optional `priority` field so authors can override the rule.
- [ ] Still declarative — no live tween objects, no auto-resolution.
- [ ] Editor: let the conflict banner offer "make this one win".

#### 27B.6 — ScrollSmoother equivalent

- [ ] Smooth-scrolling the whole page.
- [ ] **Recommend rejecting.** It is a page-level scrolling concern, not an
      animation-engine one, it fights native scroll and accessibility, and
      several good standalone libraries exist. Recorded so the question is not
      reopened from scratch.

---

### 27C — Maturity (do this first)

Not features. The v0.50.1 post-mortem says this is where the real gap is.

#### 27C.1 — Cross-browser testing

- [ ] The suite has only ever run in Node, and the editor has only ever been
      driven in Chromium. **Firefox and WebKit are completely unverified.**
- [ ] Playwright across all three engines for: the editor smoke path, persistence
      (this is where the `DataCloneError` bug lived), adapters, and export.
- [ ] Highest-risk areas by prior evidence: IndexedDB, `structuredClone`,
      WebCodecs (MP4 export), `background-clip: text` (shine), `transform-box`
      (SVG origin).

#### 27C.2 — Performance benchmark against GSAP ✓ (first pass)

- [x] Harnesses in `bench/` — engine-only (Node), per-frame work vs GSAP, and an
      engine/adapter split. Results and method in [bench/README.md](bench/README.md).
- [x] Published honestly, including where we lose.

**Headline: GSAP is ~3x faster per frame at realistic sizes.** tinyfly 3.00 ms
vs GSAP 1.10 ms at 1,000 animated elements. We still have 5.6x headroom at 60fps
there, so this is not a problem for normal pages — but at 4,000 elements we are
at the budget and GSAP still has 5x spare.

The ratio is roughly flat from 100 to 2,000 elements, which means a **constant
factor rather than a worse algorithm**. That is the encouraging reading.

**The DOM adapter is ~75% of our frame cost; interpolation is ~25%.** The engine
is not the problem. Some adapter cost is structural — the engine produces a
state Map and the adapter reads it back and composes strings, where GSAP writes
straight to the element — so the remaining work is optimising *within* the
adapter architecture, not abandoning it.

Two optimisations landed from this (see bench/README.md for numbers): colour
endpoints are now memoised rather than re-parsed every frame, and the adapter
allocates its origin/clip/filter objects lazily instead of per element per
frame. One proposed optimisation — caching the composed transform string to skip
unchanged writes — measured *worse* and was reverted, with the reason recorded
at the write site.

- [ ] **Still to measure:** memory, startup cost, and Firefox/WebKit (blocked on
      27C.1).

#### 27C.2b — Follow-on adapter optimisation (from the profile above)

Now that the adapter is identified as the hot half, in rough order of expected
value:

- [ ] Reuse the state `Map` between frames instead of rebuilding a
      Map-of-Maps every tick. Needs care: `getStateAtTime` is currently pure and
      callers may hold the result.
- [ ] Compose transforms with the individual CSS properties (`translate`,
      `rotate`, `scale`) where supported, avoiding string building entirely.
- [ ] Cache per-target property→handler dispatch instead of re-testing each
      property against several `Set`s every frame.
- [ ] Re-measure after each. The transform-cache result is the cautionary tale:
      **measure, do not assume.**

#### 27C.3 — Exercise the WebGL adapter for real

- [ ] Only `quadMatrix` and `parseColor` are tested. **No GL call has ever
      run** — shader compilation, texture upload and draw are unverified.
- [ ] Needs a real context (headless-gl in CI, or a Playwright browser test).
- [ ] Until then the adapter should be described as experimental in the docs.

#### 27C.4 — Framework wrappers

- [ ] Thin `useTinyfly` hooks for React, Vue and Svelte — load a definition,
      register targets, drive the loop, dispose on unmount (pairs with 27A.4).
- [ ] Deliberately thin: the engine stays framework-agnostic, and these live in
      their own entry points.

#### 27C.5 — Broaden the test suite's parameter space

- [ ] The spring bug hid because every test used `0 → 100` while every preset
      uses `0 → 1`. That is a suite-design flaw, not a one-off.
- [ ] Audit the numeric tests for fixed magnitudes and add small/large/negative
      and zero-travel cases.
- [ ] Consider property-based testing for the interpolation and easing paths.

---

### Sequencing

**27C.1 → 27C.3 → 27C.5 → 27C.2**, then 27B.3 (cheap, no engine change) and
27A.4 (low risk, unblocks framework users), then 27A.1 and 27A.3 together (they
share the load-time resolution seam), then 27B.2 and 27B.5. 27B.1 and 27B.4 are
gated on evidence and a design note respectively. 27B.6 is a recommended
rejection.

**The honest framing for this phase:** none of 27A or 27B closes the gap that
actually matters. A GSAP user's real objection to tinyfly is not a missing
plugin — it is that GSAP has ten years of production hardening and we found
silent data loss last week. 27C is the answer to that, and it is unglamorous.

---

## Backlog / For Review

- [x] **Esc closes any dialog** — every dialog (AI Settings, Project Settings,
  Export, Embed, Samples, Shortcuts, Transition) closes on Escape from anywhere
  on the page, via a shared `useEscapeClose(isOpen, onClose)` hook. It listens on
  `document` in the capture phase and stops propagation on close, so dialog
  dismissal takes precedence over the editor's other Escape handlers
  (exit-maximized-preview, deselect-all, cancel-rename).

- [x] **AI animation generation (prompt → timeline)** — an editor-layer AI
  feature (mirrors YappyDraw's): a prompt bar under the scene bar takes a
  natural-language brief and generates a fully editable animation. Multi-provider
  and dependency-free (raw `fetch`), bring-your-own-key for **OpenAI / Gemini /
  Anthropic**; keys live in `localStorage` (base64-obfuscated) and go straight to
  the provider. The LLM emits tinyfly's sample JSON schema
  (`{ elements, tracks, duration }`), which is validated and loaded through the
  same path as the sample library — so output is ordinary keyframes.
  - Engine untouched (loose coupling): all code lives in `src/editor/ai/` +
    `ai-prompt-bar` / `ai-settings-dialog` components.
  - System prompt documents element types, animatable properties, and easing
    names — kept in sync with the DOM adapter + engine types.
  - [ ] Remaining: image/video elements (needs media sources), streaming
    responses, and a "refine this animation" follow-up turn.

- [x] **Video export fidelity** — the Canvas image/video draw path now honours
  `objectFit` (cover/contain/fill) and a rounded-corner clip (`borderRadius`), so
  a device screen's video exports with cover-cropping and rounded corners. Fonts
  are awaited (`document.fonts.ready`) before export.
  - [ ] Remaining: video sync uses per-frame seeking (approximate for long
    clips) — consider play-based sync.
- [x] **BUG (fixed): restored animation doesn't play after a page reload** — with a saved
  project present, reloading leaves the animation unplayable (loading a sample
  works). **Root cause: timeline edits are never auto-saved.** The auto-save
  effect in `editor.tsx` reads `store.state.timeline` — a reference that never
  changes, because `addTrack`/keyframe edits mutate the *same* `Timeline`
  instance and signal via the separate `timelineVersion` counter in
  `editor-store.ts`. So adding tracks or keyframes schedules no save, and the
  reload restores a stale/empty timeline (duration 0 → `timeline.tick()` returns
  early, or demo tracks targeting a non-existent `'box'` that the DOM adapter
  silently skips). Serialization, `deserializeTimeline` and adapter
  re-registration are all correct — only the save trigger is wrong.
  - [x] Fixed: the auto-save effect now reads `store.tracks()` /
    `store.duration()` so it subscribes to the mutation counter.
  - [x] Hardened: the scene is flushed on `beforeunload` + `visibilitychange`, so
    the 1000 ms auto-save debounce can't swallow the last edit on a fast reload.

- [x] **Artboard background is project data** — `ProjectCanvas.background`
  (default `#252525`) drives the preview instead of a hard-coded CSS rule, is
  editable in Project Settings, serializes with the project, and is the default
  background for GIF/WebP/MP4 export. Older projects are migrated on load.

- [x] **Name your export file** — the Export dialog has a Filename field used by
  all five formats, defaulting to the project name and sanitized via
  `slugifyFilename` (path separators, reserved characters and awkward
  punctuation stripped; Windows device names avoided; capped at 100 chars).
  Previously the name came from `Timeline.name`, which is set once at creation
  and never updated — so a fresh project always exported as `scene-1.*` and
  renaming the scene or project had no effect. `Timeline.name` stays readonly.

- [x] **BETA badge** in the editor header next to the wordmark.

- [ ] **Drag-to-resize preview panel** — the preview area is small and today the
  only escape is the Maximize button. Add a draggable splitter on the preview's
  edge so its height/width can be adjusted freely, and persist the chosen size.

- [x] **IndexedDB persistence + animation gallery** — projects (and thumbnails)
  now persist to **IndexedDB** via a pluggable `ProjectBackend`
  (`project-persistence.ts`); the store keeps its in-memory `Map` for
  synchronous reads and writes through asynchronously. A new **My Animations**
  gallery (`gallery-dialog.tsx`) shows every saved animation with a live
  thumbnail (`scene-thumbnail.ts`, Canvas poster frame → WebP) and
  last-modified, and supports open / duplicate / delete / new. Existing
  LocalStorage projects are migrated on first run; the backend falls back to
  LocalStorage where IndexedDB is unavailable. The default (test) path stays on
  synchronous LocalStorage, so the store's public API is unchanged.
  - [x] Collapsible **Elements/Tracks** and **Properties/Presets** side panels
    (desktop show/hide with reveal tabs).
  - [x] Inline project-title rename (double-click the toolbar title) and an
    explicit **Save** button with Save / Saving… / Saved ✓ status (auto-save
    still runs; the button is the tap-friendly manual trigger for mobile/tablet).
  - [x] tinyfly wordmark + BETA badge added to the `/gallery` examples route.
  - [x] Live thumbnail refresh — a debounced capture re-renders the thumbnail
    while editing and when leaving a project, so a brand-new project shows its
    thumbnail in the gallery without opening it first.
  - [x] **File-format docs** (`docs/file-format.md` + in-app docs viewer) — full
    tinyfly JSON reference (animation documents, timelines, projects, sequences)
    for third-party integrations.
  - [ ] Remaining: per-scene thumbnails for multi-scene projects.

## Test Coverage

- 731 tests passing
- Easing functions: 48 tests
- Interpolators: 21 tests
- Clock: 19 tests
- Track: 14 tests
- Timeline: 33 tests
- JSON serialization: 12 tests
- DOM adapter: 16 tests
- Canvas adapter: 25 tests
- SVG adapter: 16 tests
- History store: 14 tests
- Project store: 58 tests
- Player: 30 tests
- Sequencer: 30 tests
- Scene store: 45 tests (incl. split-text)
- Editor store: 29 tests (staggered presets, camera, scene duration)
- Split-text util: 8 tests
- Typewriter builder: 9 tests
- Letter-stagger sample (engine integration): 4 tests
- Animation presets: 18 tests
- CSS export: 10 tests
- Lottie export: 10 tests
- GIF export: 19 tests (decode round-trip)
- MP4 muxer: 16 tests
- WebP muxer: 16 tests
- AI animation generator (parse/validate): 10 tests
- Project backend injection (IndexedDB seam): 5 tests
- Scene thumbnail render guards: 4 tests
- Curve-math (numeric detection, padded range, eased sampling, easing→bezier): 14 tests
- Symbol Library (create/clone/rename/count-guard/persist): 7 tests
