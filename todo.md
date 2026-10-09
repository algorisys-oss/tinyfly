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
- [x] Docs completeness pass: file format covers every track kind (spring, inertia, text, motion-path `matrix`, scheduling, `repeatDelay`); API reference covers Timeline queries, type guards, Stage, drivers helpers, media sync and video export; editor guide and getting started match the current toolbar and track form; stale CDN versions, player paths and import paths fixed
- [x] `@algorisys/tinyfly/adapters` package entry (DOM, Canvas, SVG, WebGL adapters) so the documented adapter imports resolve
- [x] Docs for language models: `llms.txt` at the repo root (checked by a file-snapshot test), and the built editor serves `/llms.txt`, `/llms-full.txt` and raw `/docs/<page>.md` (`vite-llms-plugin.ts`); one doc manifest (`src/docs/doc-manifest.ts`) feeds these and the in-app viewer
- [x] In-app docs viewer: all 14 user docs grouped by section, deep links (`/docs/<page>#anchor`), links between docs stay in the app (design notes open on GitHub), section-level search, meta description in `index.html`; e2e `docs` check (Chromium, Firefox)
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

## Phase 25: GSAP-flavoured compat facade (`@algorisys/tinyfly/gsap-compat`) ✓

**Goal:** give GSAP-literate developers a familiar imperative surface without
letting imperative semantics into the engine. The facade is a *desugarer*: every
call it accepts compiles down to ordinary `Track` + `Keyframe` data and is
handed to a normal `Timeline`. Nothing new enters `src/engine/core`.

**Not a goal:** drop-in GSAP compatibility. We will never match plugin APIs,
`gsap.utils`, or GSAP's internal property parsing. This is *familiar*, not
*compatible* — the docs must say so in the first paragraph.

### Placement & rules

- Lives in `src/compat/gsap/`, published as a separate entry `@algorisys/tinyfly/gsap-compat`
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
      entry `@algorisys/tinyfly/interaction`, opt-in, so embed size is unaffected.

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
| Scroll + visibility drivers | `src/drivers/` → `@algorisys/tinyfly/drivers` |
| Pointer/drag interaction | `src/interaction/` → `@algorisys/tinyfly/interaction` |
| FLIP | `src/adapters/dom/flip.ts` |
| WebGL adapter | `src/adapters/webgl/` |
| GSAP compat facade | `src/compat/gsap/` → `@algorisys/tinyfly/gsap-compat` |

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

- [x] An `inertia` track kind (named for GSAP's plugin rather than `decay`):
      release with a velocity, decay by friction, settle.
- [x] Sibling of `SpringTrack`, not a mode of it.
- [x] Snap targets (grid increment or listed values), plus min/max bounds.
      Aiming at a snap keeps the deceleration and lands exactly on it.
- [x] Deterministic and scrub-safe — better than planned: exponential decay has
      an exact closed form, so no fixed-step integration or sample cache at all.
- [x] Pairs with `Draggable`'s release velocity: `live.draggable(target, {
      bounds, inertia: { end } })`, with 2D point snapping.

#### 27B.3 — Authoring-time text/curve generators

These compile to keyframes, so they fit the model with no engine change at all.
Cheapest wins in 27B.

- [ ] **ScrambleText** — character scramble resolving to the target string.
- [x] **CustomBounce / CustomWiggle** — done in 28B.7 (with CustomEase).
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

- [x] `npm run e2e` (`e2e/`): `playwright-core` (pinned, no bundled browsers)
      drives Chromium (system Chrome), Firefox and WebKit against the dev server;
      checks import source modules into `e2e/harness.html` and measure results.
- [x] Covered: editor smoke path + all three renderers, IndexedDB persistence
      across reload, `structuredClone`, path parser vs native SVG geometry,
      DOM/SVG/Canvas adapters by rendered pixels and boxes, `background-clip:
      text` (shine), `transform-box` (SVG origin), GIF/WebP/MP4 export, all 33
      GSAP-style demos under real input, motion-path and Flip precision.
- [x] **Chromium 150 and Firefox 153: all 19 checks pass**, with identical
      precision (path geometry within 0.025px, Flip 0.00px jump, MP4 exports
      in both).
- [x] **Found and fixed:** SVG content rotated/scaled around the SVG's origin
      (top-left) in both the SVG and DOM adapters unless an origin was
      animated; HTML and canvas pivot on the element's centre. Both adapters now
      default SVG content to `transform-box: fill-box` + centre (author origins
      still win). The editor had hidden it with inline styles on its own markup.
- [x] **WebKit 26.5 runs and passes all checks.** It needed `libavif16`, and the runner
      now removes the snap GTK/GIO variables (`GIO_MODULE_DIR`…) that a VS Code snap
      terminal exports. Without that, WebKit's network process loaded snap GIO
      modules against the wrong glibc and failed every page load. MP4 export is a
      note in Linux WebKit: its bundled GStreamer crashes on startup, outside tinyfly.
      The MP4 check runs in its own page, so the crash cannot hide the other results.
- [ ] Run `npm run e2e` in CI.

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

- [ ] **Still to measure:** memory, startup cost, and Firefox/WebKit (now unblocked by
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

- [x] Thin `useTinyfly` hooks for React and Vue, a Svelte action and a Solid primitive —
      `live.context()` scoped to the component, reverted on unmount (Phase 29E).
- [x] Deliberately thin: the engine stays framework-agnostic, and these live in
      their own entry points (each < 1 kB, frameworks as optional peers).

#### 27C.5 — Broaden the test suite's parameter space

- [ ] The spring bug hid because every test used `0 → 100` while every preset
      uses `0 → 1`. That is a suite-design flaw, not a one-off.
- [ ] Audit the numeric tests for fixed magnitudes and add small/large/negative
      and zero-travel cases.
- [ ] Consider property-based testing for the interpolation and easing paths.

#### 27C.6 — Distribution: integrate like GSAP

The engine was usable from a bundler, but not from a `<script>` tag with GSAP's
ergonomics, and it had never been published.

- [x] `live` facade (`src/compat/gsap/live.ts`): `live.to('.box', vars)` plays on
      real elements with no target map and no loop. Selectors / elements / node
      lists; chainable timelines; autoplay on the next microtask.
- [x] Shared `Stage` (`src/compat/gsap/stage.ts`): one rAF loop and one DOM
      adapter for every live animation, merging values per element so separate
      tweens on one element compose instead of overwriting `transform`. The loop
      stops when nothing is playing.
- [x] Start values from what tinyfly last applied (via a new `startValue` hook on
      `CompatTimeline`) — resolved once at build time, still no DOM reads.
- [x] All-in-one browser bundle `lib/browser/tinyfly.{iife,umd}.js` + `@algorisys/tinyfly/browser`
      entry, global `tinyfly` with `to/from/fromTo/set/timeline` at the top level.
      ~29 KB gzipped. Verified in headless Chrome from a plain `<script>` tag.
- [x] `package.json` ready for npm: `private` removed, repository/keywords,
      `unpkg`/`jsdelivr` fields, `prepublishOnly`, Solid moved to devDependencies
      (the published package is the engine and has no runtime dependencies).
- [x] **GitHub CDN.** `publish-oss.sh` builds the browser + player bundles from
      the archived source into the OSS repo's `cdn/`, tags `v<version>` (never
      moving an existing tag), and jsDelivr serves
      `cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v<version>/cdn/tinyfly.iife.js`.
      Copy code pages pin to it. OSS `package.json` keeps the lib build scripts.
      First real publish happens at the next "ship it".
- [x] **Publish to npm.** Published as `@algorisys/tinyfly` v0.64.0 (2026-09-14): npm
      rejected the unscoped `tinyfly` as too similar to `tiny-lr`.
- [x] **One Examples page.** The editor's Samples dialog and the separate `/gallery`
      page were two catalogs that overlapped. Merged into `/examples`
      (`src/examples/`), reached from a single **Examples** toolbar button:
      - One catalog (`example-catalog.ts`), two kinds: *editable* (opens in the
        editor) and *code* (timeline JSON + HTML to copy). Shared categories,
        search, kind/category filters kept in the URL.
      - Editable cards preview through the embed HTML generator
        (`sample-preview.ts`), still frame + hover to play.
      - "Open in editor" → `/?example=<id>` → a **new project** via `applySample`,
        so opening an example never overwrites work (the old dialog replaced the
        current project). Verified in Chrome: project count 1 → 2, stable on reload.
      - `/gallery` redirects to `/examples`. Samples dialog removed.
      - Fixed on the way: the 3 Camera samples were never reachable — the dialog's
        category list omitted `camera`.
- [x] Examples: **GSAP-style** section — six runnable `live` demos
      (`src/examples/live-demos/`): staggered grid, logo sequence with labels,
      composed tweens, timeline controls (play/pause/reverse/timeScale/scrub),
      pointer follow, elastic/bounce/steps via `bakeEases`. Each runs on a
      `Stage({ root })` scoped to its card while hovered; the code shown is read
      from the demo's own source (`?raw`, `// #region code`), so it cannot drift.
      Added `Stage.destroy()` for teardown. Verified in Chrome: all six animate,
      reset on leave, no console errors.
- [x] Examples: eight more GSAP-style demos, recreating popular effects from
      the GSAP demo hub (demos.gsap.com) with original code on `live`: magnetic
      button, proximity grid, dock magnify, velocity skew, card stack, infinite
      marquee, split-text reveal, SVG line draw. Verified in Chrome with real
      pointer/scroll/click input; proximity grid holds 60fps while sweeping.
- [ ] **Engine work so every GSAP demo can be showcased** (in order):
  - [x] **Motion paths from `live` / `tf`.** `motionPath: { path, curviness,
        autoRotate, start, end }`; in `live` also a selector/element (any basic
        SVG shape) plus `align` / `alignOrigin`, measured once into a new
        `MotionPathConfig.matrix`. Path parser rewritten: every command, compact
        notation, exact Q/S/T, arcs as cubics, arc-length speed within curves.
        New public `engine/path` exports incl. `pointsToPath`, `shapeToPathData`.
        Verified in Chrome: followers stay within 0.24px of the browser's own
        path geometry. Demos: Motion Path, Path Through Points.
  - [x] **Shape morph from `live` / `tf`** (`morphSVG`, `live.convertToPath`).
        Engine morph rewritten: subpaths paired, automatic start point and
        winding (shapeIndex auto, or forced), corners of both shapes kept, open
        paths stay open, exact strings at 0 and 1, plans cached. Demos: Shape
        Morph, Play / Pause Morph.
  - [x] **Engine fix found along the way:** a later track on the same
        target+property applied its start value before it started, hiding every
        earlier tween (`.to(x:100).to(x:0)` never showed the first). Resolution is
        now "most recently started wins; before any start, the first to start;
        ties to the later-added". Fast path unchanged when nothing is shared;
        ~30% more per track when it is. Fixed the shipped Split Text and Logo
        Sequence demos, which were silently affected. Compat also now chains
        colours and shapes, not just numbers, and snaps (with a warning) instead
        of animating from a start value of the wrong kind.
  - [x] **Text: typing and ScrambleText.** New keyframed `TextTrack`
        (`property: 'text'`, `textConfig`, progress keyframes) expanded by the
        timeline via pure `textAt`; scramble characters are a hash of seed,
        position and refresh step, so scrubbing and exports replay exactly. DOM
        and SVG adapters set `textContent`; Canvas already takes `text`. `text`
        (TextPlugin) and `scrambleText` in `tf`/`live`; `live` starts from each
        element's current text. Demos: Scramble Text, Typewriter.
  - [x] Editor: **Text Animation** section on text elements (scramble / type
        on) and a **Text Track** inspector (words, scramble options, New
        scramble, timing). Store `addTextTrack` / `updateTextTrack`; new engine
        `Timeline.replaceTrack` keeps track order on edits (springs use it too).
        Adapters update a lone text node in place (`setTextContent`) so the Solid
        preview keeps control of its text; the preview restores an element's
        text when a text track stops driving it. CSS/Lottie exports skip text
        tracks. **Also fixed:** typing into a text element's Content (and Font)
        field reverted every keystroke — its sync effect tracked the local value.
  - [x] **Drag + inertia.** `InertiaTrack` (`kind: 'inertia'`): closed-form
        exponential decay, snapping, bounds, scale-invariant settling; player,
        JSON, baking for exports (shared with springs). `inertia` tween option
        in `tf`/`live` (bare velocity, `min`/`max`, `end` increment/list/
        function resolved at build, `resistance`/`friction`). `live.draggable()`
        drags with `Stage.apply` and throws on release with 2D point snapping;
        `Draggable.getPosition` picks up mid-throw; `Observer` now captures the
        pointer so fast flicks keep their velocity. Editor: Add Inertia, span on
        the timeline, inspector. Demos: Throw to Slots, Inertia Carousel,
        Friction. Verified in Chrome: flicks glide and land exactly (0.00px) on
        slots; carousel settles on card boundaries within bounds.
  - [x] **Flip on live elements.** `live.getFlipState` / `live.flipFrom` /
        `live.flip`: visual box before (transforms included), layout box after
        (transforms ignored), centre offsets + scale, stagger in document order,
        `enter` for newly visible elements, and smooth takeover of a running
        flip. Also fixed the editor `flip()` offsetting by corners (resized
        elements landed off). Demos: Shuffle Grid, Filter Gallery, Layout
        Switch, Expand Tile — verified in Chrome: 0.00px jump at the first
        frame, exact landing, interrupt continuity.
  - [x] **More samples in the editor library** using the new engine features:
        Decode Headline, Scramble Countdown, Throw & Settle, Badge Morph, Stats
        Decode. Samples can now hold text and inertia tracks.
  - [x] **Fixed:** embed/export HTML omitted `data-element-type="text"`, so an
        animated text `fill` painted a background box instead of colouring text.
  - [ ] Flip: `absolute` / `nested` modes (content scales during a resize flip).
  - [x] **More GSAP-style examples** (29 total): Menu Morph, Draw & Follow,
        Orbits, Swipe Cards, Card Flip, Stats Decode — each verified in Chrome
        with measurements (dot 0.05px from drawn tip; planets ≤0.58px from
        orbits; swipes dismiss/return; stats decode to exact values).
  - [x] **Engine fix found along the way:** during a `repeatDelay` pause a
        forward loop showed its *first* frame (it wrapped, then waited), so
        finished states snapped back before the pause. It now holds the last
        frame through the pause, then wraps — as GSAP does.
- [x] Examples: **Copy code** on every card — a complete standalone HTML page
      (`standalone-page.ts`). Demos are plain `.js` (JSDoc types, `allowJs`) so
      the copied code runs unchanged; the code examples' markup CSS moved to
      `code-examples.css` so it can be copied too. Tests compile every generated
      page's script and run the live ones; verified in Chrome by copying four
      pages (live ×2, timeline, editable) and opening each standalone.
- [ ] Examples: remove near-duplicates across the two former catalogs (e.g. two
      "Progress Bar"s, Text Reveal vs Text Slide Up) and move the editor's loaders
      from UI into Loaders.
- [ ] Single shared ticker for `quickPlay`, player and drivers too (today only
      `live` shares one).

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

## Phase 28: Awwwards-style motion — the runtime gaps

Compared against what agency / award sites lean on (scroll pinning, shared
element transitions, springs, WebGL sync, kinetic type, line drawing). Audit
(v0.54.1): scrubbing, Flip, inertia, stagger and morphing exist; the items below
are what is missing or only reachable through the low-level engine. Ordered by
value for effort.

### 28.1 — Plain-object targets and a public ticker ✓

- [x] `live.to(object, vars)` tweens any plain JS object's properties (numbers,
      colour strings, number arrays) from its current values, assigned straight
      back onto it — no DOM adapter (a Three.js `mesh.position`, shader uniforms)
- [x] Several objects each start from their own values; objects and elements mix
      in one timeline and share its clock; arrays / NodeLists stay target lists
- [x] `live.ticker.add(fn)` / `remove(fn)` (and `tinyfly.ticker`): run after each
      frame's values are applied with GSAP's `(time, deltaTime, frame)`; the loop
      runs while any callback is registered
- [x] 8 tests (`live-objects.test.ts`), docs (gsap-compat, api-reference), and the
      "Canvas from Object Tweens" demo

### 28.2 — Split text utility ✓

- [x] `live.splitText(target, { type: 'chars,words,lines', mask })` (and
      `splitText` from `@algorisys/tinyfly/gsap-compat`, `tinyfly.splitText`) returns
      `{ elements, chars, words, lines, masks, revert() }`
- [x] Lines measured once from layout (a word starts a line below the middle of
      the line's first word; `<br>` breaks); inline markup (`<em>`, `<a>`) is
      cloned into each line it spans; spaces stay text so it wraps and copies
- [x] Grapheme-cluster characters (`Intl.Segmenter`), custom classes, `mask`
      wrappers with `overflow: clip`
- [x] `aria-label` on the element and `aria-hidden` on the pieces (opt out with `aria: false`)
- [x] 10 tests (`split-text.test.ts`), docs, the Split Text Reveal demo uses it,
      and a new "Line Mask Reveal" demo

### 28.3 — Scroll options on `live`, pinning, external scrollers ✓

- [x] `scrollTrigger: { trigger, start, end, scrub, pin, scroller, toggleActions,
      once, onUpdate, onEnter… }` on `live.timeline()` / `live.to()`, plus
      `live.scrollTrigger(vars)` with no animation and `live.refreshScroll()`
- [x] `pin` automates the sticky recipe (`ScrollPin`: a spacer as tall as the
      element plus the pinned distance, the element `position: sticky` at the
      start offset); `kill()` and `stage.destroy()` remove it
- [x] `end: '+=600'` / `'+=150%'` relative to the start
- [x] Performance: layout measured on start/resize only — scroll events read the
      scroll offset alone; the smoothing loop stops once settled; resize refreshes
      all drivers once, in start order
- [x] `driver.update(scrollTop)` for virtual scrollers; native-scroll smooth
      scrollers (Lenis) work unchanged
- [x] Velocity in `onUpdate(progress, velocity)`, back to 0 after scrolling stops;
      `direction` on the live `self`
- [x] Fix: a scroll jumping across a short range (or loading past it) now fires
      enter and leave; toggle `play` / `reverse` never jump to the opposite end
- [x] Tests (`scroll-driver-features.test.ts`, `live-scroll.test.ts`), docs
      (scroll-animation, gsap-compat, api-reference), "Pinned Horizontal Scroll"
      demo with a browser check that the pin holds to the pixel

### 28.4 — SVG line drawing ✓

- [x] `drawSVG: true | false | px | '60%' | '20% 80%' | '10 50%'` on `live`
      (`to`, `from`, `fromTo`, staggers), compiled to `strokeDasharray: [visible,
      length]` + `strokeDashoffset: -start` with each element's length measured once
- [x] Undrawn strokes start fully drawn; non-strokes warn and the rest of the tween plays;
      `timeline()` / `tf` throw with a pointer to `drawSvgProperties(value, length)`
- [x] 8 tests (`draw-svg.test.ts`), a browser check against a real bezier's length,
      docs; SVG Line Draw and Draw & Follow demos use it

### 28.5 — Springs from `live` ✓

- [x] `spring: true | 'wobbly' | { preset, stiffness, damping, mass, velocity, restDelta }`
      on `live` and `timeline()` compiles numeric properties to spring tracks;
      non-numeric properties keep `duration` + `ease`; the tween lasts until the
      slowest spring settles; chains and serializes like any tween
- [x] `SPRING_PRESETS` (Gentle, Default, Snappy, Bouncy, Wobbly, Stiff) moved into
      the engine; the editor's spring inspector uses them
- [x] Interrupting carries momentum: `stage.velocityOf()` measures the property's
      current speed from the timeline animating it (finite difference of its
      deterministic state) and feeds the new spring; explicit `velocity`
      (per property, e.g. a drag's `onRelease`) wins
- [x] 10 tests (`spring.test.ts`), docs, "Spring Release" demo with a browser check
      (flung card carries its velocity, overshoots, settles at 0.00px)

### 28.6 — Flip shared elements ✓

- [x] `data-flip-id`: an element not in the recorded state flips from the box of
      the recorded element with its flip id (thumbnail → hero, a different element)
- [x] `fade: true` cross-fades: incoming fades in, the replaced element fades out if still shown
- [x] 3 tests, docs, "Shared Element Gallery" demo with a browser check (hero starts
      on the thumbnail and lands on its layout at 0.00px, and returns)
- [ ] Not done: `absolute` / `nested` modes (still open from Phase 26D)

### 28.7 — Smaller core entry ✓

- [x] GIF / WebP / MP4 / video / sprite-sheet / CSS / Lottie exporters moved from
      the `tinyfly` entry to `@algorisys/tinyfly/export` (built in the add-ons config, its own
      files bundled in, the engine external)
- [x] Measured (gzip): engine entry 26.8 KB → 15.8 KB; script-tag bundle 37.3 KB →
      32.1 KB *including* 28.1–28.6; tree-shaken Timeline + createTrack ≈ 8.5 KB
- [x] Breaking for `import { exportToCSS } from '@algorisys/tinyfly'` and `tinyfly.exportTo…` on
      the script-tag global — import from `@algorisys/tinyfly/export`; docs updated

### 28.8 — Showcase: a full award-site-style page ✓

- [x] "Agency Landing Page" (`src/examples/showcases/agency-landing.js`) using every
      Phase 28 feature together: masked line reveal, pointer-lit canvas on the ticker
      (paused off-screen), hide-on-scroll nav from velocity, velocity marquee,
      scroll-lit manifesto words, pinned horizontal work with a counter, object
      count-ups, drawn service icons with spring hovers, shared-element lightbox,
      spring letters and a magnetic button; responsive down to phone widths
- [x] `/showcase/:id` route on real window scroll (the app's inner scrolling is
      switched off while mounted); Examples page band with **Open the page** and
      **Copy code** (standalone page = same markup and code)
- [x] Unit test runs and tears it down (no pins left); e2e `showcase` check: pin holds,
      stats count, leaving cleans up, no page errors (Chromium, Firefox)

---

## Phase 28B: Production robustness for award-site pages (before the tutorial) ✓

Phase 28 added the effects. This phase makes a real site built with them survive
resizes, phone rotation, breakpoints, reduced-motion settings and route changes
without hand-written re-setup, and replaces patterns the tutorial should not teach.

### 28B.1 — Values that survive a resize ✓

- [x] Function values in `live` vars (`x: (index, target) => …`), resolved per element
      when they differ; callbacks and function eases are left alone
- [x] `tl.invalidate()`: live timelines record their building calls; invalidating
      rewinds to the start, rebuilds (`CompatTimeline.reset()` + replay), and
      returns to the same progress
- [x] `start` / `end` functions on scroll triggers, re-run on refresh;
      `invalidateOnRefresh: true` rebuilds before re-measuring (`ScrollDriver.onRefresh`)
- [x] `splitText({ autoSplit, onSplit })` re-splits on width change (ResizeObserver) or
      fonts loading, killing the animation `onSplit` returned; `split.split()`
- [x] Height-only resizes under 25% on touch devices skipped (address bar)
- [x] Tests (`live-refresh.test.ts`, split-text autoSplit); browser check: after a
      resize the showcase's pin distance is re-measured and the track ends flush
      (0.0px) in Chromium, Firefox and WebKit

### 28B.2 — Responsive setups, reduced motion, scoped cleanup ✓

- [x] `live.context(fn, scope)` / `ctx.add()` / `ctx.revert()`: collects timelines (and
      their triggers and pins), split text, draggables, stand-alone triggers, ticker
      callbacks and returned cleanups; restores touched elements' inline style and
      SVG `d`; `stage.forget()` drops applied values; selectors scope to `scope`
- [x] `live.matchMedia()` with string or named conditions, `ctx.conditions`,
      re-run on change, `mm.revert()`; `tinyfly.context` / `tinyfly.matchMedia` on
      the script-tag global
- [x] The showcase runs under `matchMedia` with a real reduced-motion mode (no pin,
      parallax, marquee or split; final values; the work row scrolls sideways) and
      the pinned-horizontal demo uses function values + `invalidateOnRefresh`
- [x] 7 tests (`live-context.test.ts`), a reduced-motion showcase test, and a browser
      check that toggling `prefers-reduced-motion` removes and restores the pin

### 28B.3 — `live.quickTo` ✓

- [x] `live.quickTo(target, property, { duration, ease, spring })` returns a setter
      that re-targets one reused timeline from the value on screen; writes wait for
      the next frame (many calls, one write); springs carry the current velocity;
      `.tween`, `.kill()`; `tinyfly.quickTo` on the script-tag global
- [x] Magnetic Button, Pointer Follow, Dock Magnify and Proximity Grid demos, and the
      showcase's marquee lean and magnetic button, use it
- [x] 5 tests (`quick-to.test.ts`), docs

### 28B.4 — More scroll trigger options ✓

- [x] `snap`: step, points, function, `'labels'` (live), or `{ snapTo, duration, delay, ease }`.
      Chosen after scrolling stops, projecting the release speed so flicks carry on
      (`snapProgress`, pure); scrolled by `ScrollAnimator`, which gives way to
      wheel, touch, pointer or key input
- [x] `markers`: scroller-start / scroller-end lines fixed to the viewport, and start
      / end markers on the page (`ScrollMarkers`); inside element scrollers too; removed
      on destroy
- [x] `containerAnimation`: horizontal start/end solved by bisection against the row's
      own x tracks (`containerProgressAt`, pure) and mapped onto the row's scroll range
- [x] Tests (`scroll-snap.test.ts`, driver snap and markers, live `'labels'` and
      containerAnimation); the Pinned Horizontal Scroll demo snaps to panels and reveals
      titles through containerAnimation, checked in Chromium, Firefox and WebKit

### 28B.5 — Image-sequence scrubbing ✓

- [x] `live.imageSequence(canvas, { frames, url, fit, concurrency, onProgress })`: an
      object whose `frame` setter draws the nearest frame (cover or contain, device
      pixel ratio, resize); loads nearest-first a few at a time and draws the closest
      loaded frame meanwhile; `destroy()`; collected by contexts; `tinyfly.imageSequence`
- [x] Object targets accept any object (class instances with setters), not only records
- [x] Fix: `onUpdate` now fires when a live timeline is moved by `progress()` / `seek()`,
      which is how scroll scrubbing moves it (GSAP fires it there too)
- [x] 5 tests (`image-sequence.test.ts`) and a scrub `onUpdate` test; "Image Sequence
      Scrub" demo (self-generated frames) with a browser check that scrolling changes the
      drawn frame in Chromium, Firefox and WebKit

### 28B.6 — Page transitions ✓

- [x] `live.pageTransition({ update, from, to, shared, leave, enter, duration, ease, native })`:
      old view out → `update()` (sync or async) → shared elements flip across by
      `data-flip-id` while the new view comes in; resolves when done; `tinyfly.pageTransition`
- [x] With `shared`, leave/enter animate the view's parts that don't contain shared
      elements, so those fly on their own (found by the browser check: the page's
      drop-in dragged the hero 16px)
- [x] `native: true` hands it to the View Transitions API (names from flip ids), falling
      back to the tinyfly version elsewhere
- [x] 4 tests (`live-transition.test.ts`); "Page Transition" demo with a browser check
      (hero starts on the thumbnail and lands on its layout at 0.00px in Chromium,
      Firefox and WebKit); the copied-page test caught a demo variable outside the
      copied code

### 28B.7 — Custom curves ✓

- [x] Engine generators (`engine/authoring/custom-ease.ts`): `customEase` from SVG path
      data (any scale or y direction, normalised) or bezier points, with a single cubic
      kept as an exact cubic-bezier; `customBounce({ strength })` with physically timed
      rebounds; `customWiggle({ wiggles, type })` ending at the start value
- [x] `CustomEase.create` / `CustomBounce.create` / `CustomWiggle.create` (and
      `live.customEase` etc., `tinyfly.CustomEase`) register eases by name; custom
      curves are always baked into keyframes, never smoothed
- [x] Fix: `bakeEasing` ends on the ease's final value (a wiggle ended on `to`)
- [x] Tests (`custom-ease.test.ts`, `custom-eases.test.ts`); "Custom Eases" demo;
      supersedes 27B.3's CustomBounce / CustomWiggle item

### Sequencing

28B.1 + 28B.2 together (both re-run setup code when something changes) → 28B.3 →
update the showcase to use all three → Phase 28C landing page → 28B.4 → 28B.5–28B.7.
Then Phase 29.

---

## Phase 28C: tinyfly.app landing page, editor at `/studio` ✓

The site root is now a landing page built with tinyfly itself; the editor moved to
`/studio`. First-time visitors learn what tinyfly is; returning users reach their work
in one click.

- [x] Routes: `/` landing (`src/landing/`), `/studio` editor (it was `/app` in v0.56–v0.58;
      `/app` now redirects, keeping `?example=`); `/examples`, `/showcase/:id`, `/docs`
      unchanged. Old `/?example=` links redirect to `/studio?example=`
- [x] Back-to-editor and Open-in-editor links, the e2e editor check, README, getting
      started, editor guide and deployment notes point at `/studio`
- [x] Returning users: the hero shows **Continue where you left off** when the
      editor has saved work (`indexedDB.databases()` + the old LocalStorage keys;
      it never opens the database, which could skip the editor's own upgrade)
- [x] Fast first paint: editor, Examples, Showcase and Docs are lazy routes, so `/`
      loads no editor or exporter modules (checked in e2e); the splash only shows
      when opening `/studio` directly
- [x] Content, all under `live.matchMedia` (reduced motion, phones):
      - [x] hero: masked split-text headline (autoSplit), fireflies on a ticker canvas
            following the pointer through `quickTo` on a plain object, CTAs,
            copyable CDN script tag
      - [x] "code becomes motion": editable `live` snippet, its preview, and its
            compiled JSON (`src/landing/playground.ts`)
      - [x] pinned feature story: engine → editor → GSAP-style API → export, with
            `invalidateOnRefresh`
      - [x] gallery strip leaning with scroll velocity; numbers counting up; springy
            closing type and a magnetic button
- [x] Tests: `landing.test.ts` (playground, saved-work detection, motion start and
      cleanup); e2e `landing` check in Chromium, Firefox and WebKit (no editor
      bundle, playground recompiles, story pins, reduced motion, CTA loads the
      editor, legacy links)
- [x] Brand mark (`src/components/brand-mark/`): a fly icon whose wings flutter now and
      then (and on hover), the wordmark, and a BETA badge with a sweeping shine and a
      soft glow (both still under `prefers-reduced-motion`), shared by the landing
      nav and the editor, Examples and Docs headers; `/tinyfly.svg` replaces the Vite favicon
- [x] Static `<noscript>` fallback text and links in `index.html`
- [x] Editor moved from `/app` to `/studio` (the site is tinyfly.app); `/app` redirects
- [x] Refreshing a route no longer 404s: `public/.htaccess` for Apache / LiteSpeed (Hostinger,
      where tinyfly.app runs), plus `public/_redirects` (Netlify,
      Cloudflare Pages), `vercel.json`, and a build-time `404.html` copy of the app
      (GitHub Pages and similar); nginx / Apache / Caddy rules in DEPLOYMENT.md
- [ ] Open Graph image for link previews
- [x] Every example on its own page, `/examples/<id>`, for sharing: card titles link to
      it; it plays without hovering; Copy link; more from the same category; page
      title set; unknown ids say so; the landing gallery links to these pages;
      e2e `example-pages` check in Chromium, Firefox and WebKit
- [ ] Gallery cards show live miniature previews of the demos instead of colour fields
- [x] Festive showcase `/showcase/ganesh-chaturthi` (`src/examples/showcases/ganesh-chaturthi.js`):
      hand-drawn SVG Ganesh ji and Mooshak, drawn-in rangoli, flickering diyas, petals on a ticker
      canvas, springy split-text greeting, tap-to-hop Mooshak, pointer parallax, reduced-motion mode
- [x] Second festive showcase `/showcase/ganesh-chaturthi-poster` (`src/examples/showcases/ganesh-chaturthi-poster.js`),
      a company greeting poster (the original stays): cream paper, marigold garlands swinging in, Algorisys
      wordmark, masked split-char headline, drawn-in growth arrow, SVG Ganesh ji with a morphing red cloth,
      crown glint, rangoli carpet, petals on a ticker canvas, tap for blessings, phone layout, reduced-motion still

---

## Phase 29: Learn tinyfly — an interactive tutorial, basics to award-site level (planned)

A course inside the app at `/learn`, not a separate site. Every lesson is live
code next to a live preview, with checks that say whether you got it right. It
goes from "what is a keyframe" to rebuilding the Agency Landing Page showcase
section by section.

### Principles

- **Learn by changing running code.** Each step shows a short explanation, a code
  panel and a preview. The preview re-runs as you type, the same way Examples
  cards run `live` code: a Stage scoped to the preview and destroyed on every run.
- **Checks are deterministic.** A step passes when a pure check over what your
  code produced says so: the compiled `toDefinition()` JSON, values sampled at
  set times with `getStateAtTime`, or DOM state after the preview runs. No
  screenshots and no timing races. This follows the engine's own principle.
- **No new heavy dependencies.** The code panel is a lightweight editor (textarea
  plus highlighting overlay), not CodeMirror or Monaco, unless an evidence gate
  shows the textarea cannot work.
- **Lessons are plain data.** Each module is a file under `src/learn/modules/`
  holding every step's markdown text, starter code, a solution and checks. Content can be
  added without touching the runtime, and it is testable.
- **Keep moving:** hints, "show solution", "reset step", progress saved
  locally, and every step deep-linkable (`/learn/scroll/pinning`).

### 29A — Lesson runtime (pilot shipped)

- [x] `/learn` course map (modules → lessons → steps, progress dots, Start / Continue,
      Reset progress, "coming next" modules) and `/learn/:module/:lesson/:step`;
      **Learn** in the landing nav and footer and the editor's More menu
- [x] Step layout: explanation (markdown, progressive hints) | code (tab inserts
      spaces, drafts saved) | preview + scrubber + Replay + checks; run 400ms after
      typing; Reset, Show solution, Back / Next (Skip before passing); stacked on phones
- [x] Runner (`src/learn/runner.ts`): the step's markup, a fresh scoped `Stage` per run
      destroyed before the next, `live` recorded so checks see every timeline built
- [x] Checks read compiled data, never screenshots: `context.definitions`,
      `tracks(selector, property)`, `valueAt(selector, property, seconds)` (state at a
      time, independent of playback), `duration()`; builders `animates`, `valueIs`,
      `durationIs`, `easeIs`, `staggerIs`, `timelineCount`, `custom` with
      learner-facing messages
- [x] Progress and drafts in localStorage (a course needs no more; IndexedDB not needed)
- [x] Checks run on a hidden copy of the step (`checkIsolated`: laid out off screen at the
      preview's width, nothing ticking), so checks that click, hover or flip never change
      the preview. Found when the lightbox check left the capstone preview's lightbox open
- [x] Interaction checks: `context.calls(method)` (every `live` call and its arguments),
      `context.fire(selector, type)`, `context.rerun({ reducedMotion })`
- [ ] "Inspect JSON" drawer beside the preview
- [x] Scroll-container previews for the scroll module: the markup is a `.scroller` box and
      triggers pass `scroller: '.scroller'`; pins (sticky) and pinned horizontal rows work
      inside it (checked in Chrome)
- [x] "Copy as page" / "Open in editor" at the end of a module: the step's markup and the
      code as it stands, as a standalone page (`lessonPage`, compiled in the standalone-page
      test for every step), and for JSON lessons a new studio project (`lessonSample`: a box
      per `data-tinyfly` target, handed over in session storage as `/studio?sample=handoff`)

### 29B — Curriculum

1. **Foundations.** ✓ 3 lessons, 8 steps — keyframes (a timeline is JSON, times in
   milliseconds, more keyframes), tracks and values (one track per property,
   colours), easing and loops (easing on the arriving keyframe, cubic-bezier,
   `loop` / `alternate`). Learners edit JSON and call `play(animation)`; the runner
   plays definitions on `data-tinyfly` elements with the same scrub and checks.
   Still to add: an interactive curve visualiser.
2. **The GSAP-style API.** ✓ pilot: 3 lessons, 10 steps — first tween (`to`, duration
   and ease, `from`, `fromTo`), many elements (selectors, `stagger`, `from: 'center'`),
   timelines (sequencing, the position parameter, repeat and yoyo). Still to add:
   labels, `set`, playback controls.
3. **The editor.** ✓ 2 lessons, 5 steps — build visually (element and track, easing a
   keyframe, a second track), same data two ways (a preset's JSON, then the same
   animation in `live` code). Steps end with **More → Copy JSON** (new menu item) and
   pasting into `play( … )`; `play()` gives targets the preview lacks a placeholder
   box. The e2e `learn-editor` check performs every step in the real studio in
   Chromium, Firefox and WebKit and requires the copied JSON to pass.
4. **Motion craft.** ✓ 3 lessons, 7 steps — timing (overlap with `'-=0.3'`, stagger
   `amount`), anticipation and follow-through (a wind-up, `back.out` overshoot),
   springs and durations (`spring: 'bouncy'`, damping without wobble, 0.2s button
   presses). Checks sample motion over time (`sampleValues`) to test overshoot and
   wind-up.
5. **Text and SVG.** ✓ 2 lessons, 6 steps — text (split into words, masked line reveal,
   `scrambleText`), SVG (`drawSVG`, `morphSVG` to another shape, `motionPath`).
   Found while writing it: line masks clipped descenders; masks now leave 0.12em below
   the baseline by default.
6. **Interaction.** ✓ 3 lessons, 6 steps — pointer (hover in and out, a magnetic pull
   with `quickTo`), drag and throw (`draggable` with `bounds`, `inertia`), layout and
   canvas (`flip` on a class change, a tweened plain object drawn on `ticker.add`). The
   runner records `live` calls (`context.calls`) and checks fire real events
   (`context.fire`), so a hover check hovers and then reads the tween it started.
   Still to add: snapping, shared elements.
7. **Scroll.** ✓ 3 lessons, 7 steps — reveals (`start: 'top 80%'`, `toggleActions`
   reverse, a trigger per card), scrub (a reading-progress bar with `scrub: true`,
   smoothed `scrub: 0.5`), pinning and speed (a pinned scrubbed timeline, skew by
   velocity with `live.scrollTrigger` + `quickTo`). The preview is its own scroller
   (`scroller: '.scroller'`, pins use sticky positioning so they work inside it). The
   runner also records `to`/`from`/`fromTo`/`set`/`timeline` vars, so checks read
   each `scrollTrigger`; the velocity check calls `onUpdate` as scrolling would.
   Smooth scrolling ✓ (4th lesson): `live.smoothScroll({ scroller, smooth, effects })`
   with `data-speed` / `data-lag` layers; the runner kills smoothers with the run.
   Still to add: horizontal pinned sections with `containerAnimation`, snap.
8. **Accessibility and performance.** ✓ 3 lessons, 5 steps — reduced motion (two
   modes with `live.matchMedia` on both `prefers-reduced-motion` values, a fade instead
   of movement), keyboard parity (hover feedback on `focus` / `blur` too), performance
   (transforms instead of `left` / `width`, a canvas ticker started and stopped by a
   scroll trigger's edge callbacks). `context.rerun({ reducedMotion })` runs the code
   again off screen with the preference emulated, so both branches are checked in every
   browser whatever its own setting. Still to add: measuring frame cost with the e2e
   harness.
9. **Capstone: build the Agency Landing Page.** ✓ 4 lessons, 10 steps, each one section
   of the showcase in a small scrolling preview with its class names — hero (masked
   line reveal, scrubbed drift), marquee and manifesto (a seamless loop measured by a
   function, a velocity lean clamped with `quickTo`, words lit by scroll), work and
   stats (pinned horizontal row with `invalidateOnRefresh`, plain-object count-ups
   written in `onUpdate`, `once`), details (icons drawn per row with reverse toggle
   actions, a lightbox grown from its tile with `getFlipState` / `flipFrom`, spring
   letters). It ends at the whole page, whose Copy code is the standalone file.
   Hero canvas ✓ (a glow object aimed with `quickTo`, drawn on the ticker, stopped by
   `onLeave` / `onEnterBack`) and magnetic button ✓ (`quickTo` springs measured from
   `offsetLeft`, home on `pointerleave`) added as capstone steps.

**Course complete: 9 modules, 28 lessons, 67 steps.** Every solution passes and every
starter fails in the unit gate, and every step passes in Chromium, Firefox and WebKit.

### 29C — Engine and API work the course needs

- [x] Reduced-motion helper: `live.matchMedia()` (Phase 28B) is the real API lesson 8 teaches
- [x] Friendlier `onWarning` messages, surfaced inline in lessons: no targets
      found, drawSVG on a non-shape, spring on a colour (`learnerWarning`). Found on the
      way: `live` never delivered warnings (its timelines had no `onWarning`), and a spring
      on a non-number eased silently. Now `new Stage({ onWarning })` reports every live
      timeline's warnings, and a spring on a colour warns. Gate: no solution warns
- [x] `live.quickTo` (Phase 28B), taught in lesson 6 (magnetic pull) and 7 (velocity skew)
- [x] Per-element stagger spaced evenly: tweens built one per element (drawSVG, morphSVG,
      text, function values, objects) placed each at `'<'` and then added `i * each`, so
      delays grew quadratically (38 rangoli strokes at 0.025s: the 18th started at 3.8s).
      Found by the Ganesh Chaturthi showcase; each now waits one `each`, with a test

### 29D — Quality gates

- [x] Unit test (`course.test.ts`): every step's **solution** passes its checks, and
      every **starter** fails at least one
- [x] e2e `learn` check (Chromium, Firefox, WebKit): every step via Show solution passes,
      progress is remembered, phone width fits, no page errors
- [x] The course in `llms-full.txt` (`courseMarkdown`: every step's text, link and
      solution, after the docs), with a test
- [x] Keyboard: Tab indents in the code box and **Esc then Tab** leaves it (it trapped
      keyboard users before; checked in Chromium), said under the box via
      `aria-describedby`; code, preview, checks and warnings labelled for screen readers

### 29E — After the course

- [x] Review `tinyfly-vs-gsap.html` (the user's comparison, written at v0.55) against the
      current code. Closed since it was written: page transitions, image sequences,
      custom eases (CustomEase / CustomBounce / CustomWiggle), snap / markers /
      containerAnimation, resize-proof function values with `invalidate()`, the course.
      Fixed while reviewing: per-element tweens (drawSVG, morphSVG, text, objects,
      function values) ignored stagger `amount` and `from`, and piled delays up.
      None of the remaining gaps needs third-party code:
  - [x] **Smooth scrolling (ScrollSmoother):** `SmoothScroll` in `@algorisys/tinyfly/drivers` and
        `live.smoothScroll()`. Eases the wheel on the real scroll position (not a
        transformed wrapper), so triggers, sticky pins, fixed elements and anchors are
        unchanged; touch, keys and scrollbar stay native and are followed. `data-speed` /
        `data-lag` layers on CSS `translate`; rested while `ScrollDriver`s measure and
        re-measured after pins (`ScrollDriver.onRefresh`). `scrollTo(offset | element |
        selector, { offset, duration })`, `paused()`, reduced motion off. On in the Agency
        Landing showcase; e2e checks the wheel eases and parallax lands to 1.5px in 3 browsers
    - [x] A course step for it (Scroll module)
    - [ ] `data-speed="auto"` for images in clipped frames
  - [x] **Timeline callbacks and control:** `onRepeat`, `onReverseComplete`, `tl.call()`,
        `addPause()`, `tweenTo()` / `tweenFromTo()`, `live.delayedCall()`,
        `live.killTweensOf()`, and tween `onStart` / `onUpdate` / `onComplete` inside
        timelines (were silently ignored). A pure `playheadCrossings` works out what each
        frame passed across loops, yoyo and repeat delays; `progress()` fires, `seek()`
        doesn't. Found on the way: the stage ran callbacks before applying the frame, so
        `onUpdate` read the previous frame's values (a count-up's last write was one frame
        stale); it now flushes first. Also `onComplete` fired on reverse completion
  - [x] **`repeatRefresh`:** rebuilds at each repeat so function and `"random(…)"` values
        are drawn again; starts from where the previous loop left values (as GSAP)
  - [x] **Utilities:** `live.utils` — clamp, mapRange, normalize, interpolate, wrap,
        wrapYoyo, snap, random, shuffle, distribute, pipe, splitColor, getUnit, seed; one
        seeded sequence per stage so pages replay identically. `"random(…)"` strings in
        tween vars (per element); function values get `(index, target, targets)`;
        `live.getProperty()` (applied value, object value, or static default)
  - [x] **ScrollTrigger extras:** `live.scrollBatch` (interval, batchMax, grouped
        callbacks), `pinSpacing: false` (spacer gives the distance back with a negative
        margin), `horizontal: true` scrollers (left/right positions, scrollLeft, sticky
        `left` pins). `anticipatePin` is unnecessary by design: sticky pins are held by the
        browser, with no hand-off frame
  - [x] **Scroll-to:** `live.scrollTo(offset | element | selector | 'max' | { x, y },
        { duration, ease, offset, scroller, autoKill })` and `live.to(window, { scrollTo })`
  - [x] **Tween `keyframes`:** array, percentage and value-array forms with `easeEach`;
        with stagger each target plays the whole sequence
  - [x] **Stagger `grid`:** `grid: [rows, cols] | 'auto'`, `from: 'random' | [x, y]`,
        `axis`, `ease` — worked out into explicit `stagger.offsets` (new engine field)
  - [x] **Draggable `type: 'rotation'`:** angle about the centre, unwrapped past ±180°,
        `{ minRotation, maxRotation }`, snap in degrees, inertia spin
  - [x] **Distribution (next, in this order):**
    - [x] npm package: exports per entry were already in place (`npm pack` dry run: 396 kB,
          119 files); `release:npm` added and made step 4 of "ship it" in CLAUDE.md (needs a
          one-time `npm login`). First publish happens on the next "ship it"
    - [x] Framework wrappers (27C.4) on `live.context()`: `@algorisys/tinyfly/react` `useTinyfly`
          (scope, dependencies, `contextSafe`), `@algorisys/tinyfly/vue` composable (scope, watch),
          `@algorisys/tinyfly/svelte` action, `@algorisys/tinyfly/solid` `createTinyfly` — each < 1 kB, frameworks
          optional peers, built by `vite.config.frameworks.ts` against the shared
          `@algorisys/tinyfly/gsap-compat`; tested by mounting in React 19, Vue 3, Solid
    - [x] Ecosystem entry point instead of a plugin API: `docs/extending.md` — adapters,
          plain-object targets, eases and stagger offsets, the contract for a new track kind,
          contributing gallery examples
  - [x] **Morph performance:** `morphPath` profiled at ~77ms/s for 10 continuously
        morphing paths (Ganesh poster). Per frame it built a key string from both path
        strings and wrote every dense sample (up to 320 per subpath). Plans are now thinned
        once (joint Ramer–Douglas–Peucker over both shapes, 0.2-unit tolerance, corners and
        curvature kept) and looked up through a nested cache with a last-pair memo: the
        10-path benchmark went from 43.5 to 24.4 ms/s (points per path 335 → 184)
  - [x] **Native eases instead of baked keyframes:** engine `EasingType` gains parametric
        `steps` (CSS jump positions), `elastic` (mode, amplitude, period), `bounce` (mode),
        `back` (mode, overshoot) — evaluated at play time, one keyframe in JSON. GSAP names
        map to them with their parameters (`elastic.out(1.2, 0.4)`, `back.out(3)`, `steps(n)`
        as GSAP's n + 1 levels). CSS / Lottie exports sample them (`expandParametricEasings`);
        the studio's easing picker has them with their settings. Found on the way: on `live`,
        elastic / bounce / steps silently played **linear** (baking was opt-in and nothing
        opted in)
  - Partial list review (2026-09-14): smooth-scroll parallax ✓ (v0.61, no Lenis needed),
    image-sequence scrubbing ✓ (v0.57); lifecycle hooks → framework wrappers above;
    per-loop random → `repeatRefresh` with seeded random above
  - Parity check (user's list, 2026-09-14): page transitions ✓ (v0.57), ScrollSmoother ✓
    (v0.61); per-frame function values stay out by design (not serializable) — covered
    by `quickTo` / `ticker`, with `repeatRefresh` + `live.utils` above
  - By design, not gaps: elastic / bounce / steps are baked into keyframes (JSON stays
    portable), nested timelines are flattened, no per-frame function values

### Sequencing

After Phase 28B: 29A runtime with module 2 as the pilot (the API most people arrive for) → 29D
gates → modules 1, 3 → 4–7 (with 29C as each needs it) → 8 → 9 capstone.

---

## Phase 30: Teaching embeds (from `education-animation.md`)

Every gap from the Go series spike on teachyourselfcoding.com, fixed:

- [x] **1. Frame on load:** `initialFrame: 'start' | 'end' | ms | 'none'` (default start)
- [x] **2. Markers + step API:** `config.markers [{ id, time, label, pause, question }]`;
      player `next()` (animated), `prev()`, `goToMarker()`, `currentMarker`, `onMarker`,
      `stepMode`; stops worked out with the engine's `playheadCrossings` (moved from compat)
- [x] **3. Reduced motion:** `respectReducedMotion` (default on): no autoplay, final frame,
      steps jump; follows changes to the media query
- [x] **4. Play when visible:** `playWhenVisible` (IntersectionObserver + hidden tabs);
      autoplay waits until first seen
- [x] **5. Controls:** `@algorisys/tinyfly/embed` `createControls` — restart, prev, play/pause, next,
      scrub, step counter, speed, caption, question + Reveal; keys only inside the figure;
      CSS custom properties; labels passed in. `tinyfly-embed.iife.js` on the CDN
- [x] **6. SVG paint:** the DOM adapter writes `fill` / `stroke` / `strokeWidth` /
      `strokeDasharray` / `strokeDashoffset` as SVG styles on SVG elements
- [x] **7. Discrete text:** already worked (strings switch at the keyframe; `text` via the
      adapter); documented, with `steps` count 1 for held numbers
- [x] **8. Captions:** `captions[lang][markerId]` in the JSON, player `captions` option and
      `data-tinyfly-captions` script; page `lang` with region fallback; `aria-live` line
- [x] **9. Declarative auto-mount:** `[data-tinyfly-embed]` + `data-tinyfly-timeline` /
      `data-src`, `data-options`, `data-labels`, `data-controls`, `data-alt`;
      `mountAll()`, and automatic with `data-tinyfly-auto`; SVG gets `role="img"` + a name
- [x] **10. Static rendering:** `renderFrame(markup, definition, at)` with no DOM (the DOM
      adapter on stand-in elements), and `npx @algorisys/tinyfly render`
- [x] **11. Validation:** `validateEmbed` + `npx @algorisys/tinyfly validate --markup` (targets,
      marker order / range / duplicates, late keyframes, orphan captions; warnings for
      missing captions and unanimated elements)
- [x] **12. Diagram primitives:** `@algorisys/tinyfly/teach` — `lesson()` step builder; `cells`,
      `pointer`, `stack`, `queue`, `table`, `pipeline`, `figure`
- [x] **13. Predict-then-reveal:** `pause` + `question` markers; controls show the question
      and a Reveal button
- [x] **14. Release hygiene:** SRI hashes for every `cdn/*.js` in `cdn/README.md`;
      `formatVersion` written, newer versions refused, policy documented
- e2e `embed` check (Chromium, Firefox, WebKit): keyboard stepping only in the focused
  figure, captions in the page language, SVG fill painted, labelled image, autoplay waits
  until seen and pauses off screen, reduced motion final frame
- [x] **Editor UI for markers and captions:** a **Steps** lane under the time ruler (flags,
      click to select and seek, drag to retime as one undo step, double-click / **M** / **+**
      to add); a step inspector in Properties (label, time, id with caption rename, pause,
      question, captions per language with missing-language hints, delete); **[** / **]**
      and ⏮ / ⏭ step the playhead; Delete / Esc on the selected step. Pure helpers in
      `editor/utils/markers.ts`; engine `Timeline.setMarkers` / `setCaptions`; captions
      deep-copied in snapshots. e2e `editor-steps` in Chromium, Firefox and WebKit
- [x] **Fixes from the teachyourselfcoding.com rollout** (`education-animation-fixes.md`):
      the Reveal row showed with no question (`hidden` lost to `display: flex`; now
      `.tf-ctl [hidden] { display: none !important }`); an empty caption strip on figures
      with no captions (hidden then); IIFE bundles merge into one `tinyfly` global
      (`output.extend`); `labels.stepFormat` for the visible counter; reduced motion vs
      `initialFrame` documented; `data-markers="0,2300,3800"` shorthand
- [x] **One script for everything:** `tinyfly.iife.js` includes the teaching embeds
      (controls, `mountAll`, `data-tinyfly-auto`), +3 kB gzipped; build-time
      `validateEmbed` / `renderFrame` stay in npm and the CLI; `tinyfly-embed.iife.js`
      remains the small teaching-only bundle. Auto-mount shared in `embed/auto-mount.ts`
- [x] **Scenarios** (for the System Design series on teachyourselfcoding.com): several
      timelines on one figure and the reader chooses. Player `loadScenarios`,
      `scenarios`, `scenario`, `setScenario` (undoes the previous scenario's styles,
      text and path geometry; keeps the step by marker id; end stays end; playing
      stays playing; reduced motion shows the final frame). Embed: several
      `data-tinyfly-timeline` scripts with `data-scenario` / `data-scenario-label`;
      figure `data-scenario`, `data-scenario-legend`, `data-scenario-control`
      (`buttons` radio group or stepped `slider`); `data-tinyfly-choose` hotspots as
      toggle buttons (`bindChoiceHotspots`). `validateScenarios` and multi-file
      `tinyfly validate`. e2e `embed`: option click, arrow keys, hotspot click and
      Enter, slider by keyboard, computed paint reset, in Chromium, Firefox and WebKit
- [x] **Fixed:** `watchVisibility` cleared the player's subscribers on every `load()`
      (a stray `listeners.clear()` from v0.64.0), so controls stopped updating after
      a second load
- [x] **Full screen for teaching figures** (asked for the System Design lessons):
      `createControls({ fullscreen: true })` / `data-fullscreen="true"`. Fullscreen API
      where the browser allows element fullscreen, a fixed overlay otherwise (iPhone
      Safari has element fullscreen only on iPad, per MDN browser-compat-data) or when a
      request is refused; scroll lock and Esc for the overlay; F key; `tf-fullscreen`
      layout makes the SVG take the remaining space over host figure CSS. Unit tests for
      both routes and refusal; e2e in Chromium, Firefox and WebKit measures the drawing
      filling the viewport over a host `max-width` and `min-width`. v0.70.1: on short
      landscape screens the controls sit in a column beside the drawing (529px drawn on an
      844×390 viewport, up from about 233px). v0.70.2: the step buttons are `|◀` and `▶|`, a
      mirrored pair
- [ ] Next: a `hold` easing alias; RTL caption layout

---

## Phase 31: Video from code (Cairo-style workflow)

Make a whole narrated video (like the pycairo stick-figure pipeline) from code,
without a browser. Guide: `docs/video-rendering.md`; example:
`examples/headless-video/stick-figure.mjs`.

- [x] **Custom canvas target** — `type: 'custom'` with a `draw(ctx, target, time)`
      function; drawn in local coordinates with the usual opacity/transforms/filters;
      tracks write into declared `props`, so drawing is code and timing stays JSON
- [x] **Narration timing** — `planNarration()` (lead / gap / tail, as in
      `render.py`), `narrationMarkers()`, `narrationSceneAt()` in the engine
- [x] **Captions** — `toSRT()`, `toWebVTT()`, `captionCuesFromTimeline()` in
      `@algorisys/tinyfly/export`
- [x] **Headless rendering** — `@algorisys/tinyfly/headless`: `FrameRenderer` (any 2D
      context, deterministic per frame), `renderVideo()` (raw RGBA → ffmpeg → H.264 MP4,
      optional audio), `renderStills()` (one PNG per marker step); `background` may be a
      draw function, `draw` paints over the targets; scene fonts registered by family
- [x] **CLI** — `tinyfly video <scene.mjs> [-o] [--stills] [--scale] [--fps] [--crf]
      [--no-audio] [--srt] [--vtt]`
- [x] `@napi-rs/canvas` as an optional peer dependency (Node has no canvas); ffmpeg on PATH
- [x] **Examples** — `examples/headless-video/` (stick figure with narration, JSON-only
      bar chart, Cairo-style sketch) drawn in tests (`src/headless/examples.test.ts`,
      `@algorisys/tinyfly` aliased to the engine source in Vitest); gallery card
      **Narrated Scene** (`live-narrated-scene`); `docs/examples.md` "Video from Code",
      pointers in getting-started and extending. The copied-page test now gives demos
      the engine on the `tinyfly` global, as the browser bundle does
- [x] **Narration audio** — `voiceNarration()` decodes each line's clip with ffmpeg,
      times the lines from their samples and writes a sample-aligned WAV
      (`assembleNarration`, `encodeWav` are the pure steps)
- [x] **Stick-figure rig** — `@algorisys/tinyfly/characters`: numeric poses (joint
      angles, mouth, smile, blink), `POSES` (rest, wave, cheer, shrug, point, think,
      handsOnHips, sad, surprised), `blendPose`, `walkPose`, `talkingMouth`,
      `drawStickFigure`, `stickFigureTarget` (props: pose + walk/walking/talk),
      `poseTracks`; the stick-figure example uses it
- [x] **BRICS benchmark** — scene 8 of the BRICS video ported call for call:
      draw 4.5 ms/frame vs Cairo's 20.3 (1080p), end to end 52 s vs 46 s, since
      x264 sets the pace; stills match (mean diff about 1/255). Missing pieces were
      all drawing helpers (tag, quote card, round table, labels row, envelope, door,
      camera drift). Results in `docs/video-rendering.md`
- [x] **Stills mid-caption** — `stillTimes()` takes each still halfway through a
      caption line (as the Cairo renderer does), not halfway to the next marker;
      `CaptionCue` gains an optional `id` for naming
- [x] **Characters on the website** — the browser bundle (`tinyfly` global) now carries
      `characters`; a new gallery card **Stick Figure** (pose picker, blend, walk, talk)
      and **Narrated Scene** now poses its figure with `poseTracks` + `drawStickFigure`
- [x] **Facial expressions** — per-eye openness (wide eyes show whites), blink, brows
      (height per side + slant), gaze (`lookX`/`lookY`), mouth width and shapes (grin,
      wail, O); 18 `EXPRESSIONS` (happy, joyful, sad, crying, surprised, shocked, angry,
      furious, worried, scared, confused, skeptical, thinking, sleepy, disgusted, smug,
      wink, neutral), `withExpression`, `expression` keys in `poseTracks`; gallery card
      gets an expression picker and a face close-up
- [x] **Walk cycle fix** — `walkPose` moved both legs (and both arms) the same way on
      screen, since limb angles mirror per side; now the legs scissor evenly about the
      vertical, the lifted shin trails backward, hanging arms swing against the legs and
      raised arms keep their pose
- [x] **Planted feet** — `strideLength(height)`; the video example's `walk` track and the
      Narrated Scene card take the walk phase from distance covered (same easing as `x`),
      so feet no longer slide; the card fades the walk in and out
- [x] **Pencil sketch style (Pencilmation-style look)** — `sketchPen(ctx, style, time)`
      draws hand-drawn strokes (several passes, bowed segments, circles that overshoot)
      with line boil: the wobble is seeded by `seed` + `boilFrame(time, boil)`, so it is
      deterministic; `StickStyle.sketch` draws the figure that way (`drawStickFigure`
      takes `time`); demo scene `examples/headless-video/pencil-sketch.mjs` (a pencil
      draws the ground, the figure finds the gap and glares at the animator)
- [x] **Erasing** — `erasable(target, { path, width })` adds an `erase` prop (0..1) that
      rubs the target out along a path (in its own box, so the gap moves with it) and
      draws a block eraser while rubbing; `withErased()` / `clipErased()` for immediate
      drawing; `scrubPath()`, `drawEraser()`, `partialPath()`, `pointAlong()`; clip-based
      (one clip-out per segment and joint), so no offscreen canvas; demo scene
      `examples/headless-video/eraser-gag.mjs`
- [x] **Squash, stretch and rubber limbs** — `stretch` pose field (body and legs scale by
      it, arms by its square root, head becomes an equal-area ellipse, feet stay put);
      `crouch` / `jump` poses; `style.rubber` (0 jointed → 1 rubber-hose curves through
      the joint, `rubberLimb()`), also a `rubber` prop so a track blends it; kept off the
      pose so named poses never reset it; poses without `stretch` draw unstretched;
      `sketchPen` gains `curve()` and `ellipse()`; demo `examples/headless-video/rubber-hose.mjs`
- [x] **The drawing hand** — `drawnPathTarget({ path, smooth, sketch, hand })` with a `draw`
      prop (0..1) draws a stroke on while a cartoon hand (`drawHand`, `drawPencil`) holds
      the pencil at its end; `erasable(…, { hand: true })` for the eraser; `circlePath()`;
      every `sketchPen` stroke takes `progress` (the partial stroke lies exactly on the
      finished one: bowed cubics are split, not redrawn) and is seeded per stroke, so a
      growing stroke never shifts later strokes' wobble; path helpers moved to
      `polyline.ts`; demo `examples/headless-video/drawing-hand.mjs`; `pencil-sketch.mjs`
      now uses the library hand
- [x] **Sketched canvas shapes** — rect / circle / line / path canvas targets take
      `sketch` (pencil outline, clean fill) and `drawOn` (0..1, outline drawn on, fill
      once complete); outlines via `pathOutline()` / `rectOutline()` (straight runs and
      sampled curves, from the engine's path parser) and `drawOutline()`; the sketch
      pen and polyline helpers moved to `src/adapters/canvas/` (re-exported from
      `characters`); editor: **Pencil Sketch** section in Properties (Canvas preview
      and raster export), `sketch` stored on shape elements
- [x] **Write On for every shape** — the editor's Write On preset now covers rects,
      circles and lines as well as paths: a `drawOn` track (Canvas preview and raster
      export) plus, for paths, the dash tracks (DOM / SVG); `buildWriteOn()` in
      `src/editor/utils/build-write-on.ts`; the DOM and SVG adapters skip `drawOn`
- [x] **Pencil Sketch gallery card** (`src/examples/live-demos/pencil-sketch.js`, Video
      category): the drawing-hand gag live in the browser (hand draws the ground and a
      sun, eraser rubs the sun out), with pencil, boil-rate and rubber-limb toggles
- [x] **Hindi pencil story example** (`examples/pencil-story-hindi/index.html`): a 30 s
      Pencilmation-style retelling of "the thirsty crow" (प्यासा राहगीर) as a standalone
      page on the browser bundle: the hand draws the scene and writes Devanagari
      narration (Kalam font), a JSON timeline moves the traveller and the pot's water,
      pebbles raise the water, and the eraser rubs out the pot; play / pause / scrub
- [x] **A more natural drawing hand** — `drawHand` redrawn as a writing grip (thumb and
      middle finger pinch the tool, index finger along its top, ring and little fingers
      curled under the palm, nails and knuckle creases), a 190 px pencil, and a short
      forearm whose sleeve fades out (`arm`, default 300) instead of a 2000 px arm across
      the frame; `lift` (0..1) raises the hand off the page with a shadow at the tip.
      New `handAt(strokes, time, options)`: one hand for a whole scene, which follows the
      stroke being drawn, lifts and glides between strokes of a run (`linger`), and comes
      in from / goes back to `offstage` (`enter`, `exit`); pure, so scenes scrub
- [x] **Cartoon hands** (`src/characters/hands/`, docs/cartoon-hands.md) — a hand rig: palm
      and five finger chains in the hand's own 3D space, posed by a flat record
      (`<finger>.curl`, `thumb.curl`, `thumb.across`, `spread`, `turn`, `bend`, `tilt`,
      `roll`), blended with `mixHandPoses`; `HAND_SHAPES` (relaxed, open, spread, flat,
      fist, point, thumbsUp, peace, ok, pinch, cupped, wave, pencilGrip, hold);
      `handJoints()` (joints, depths, widths, palm outline, axes) and
      `drawCartoonHand()` through a look's Pen (clean / pencil / silhouette), parts
      sorted far to near, nails where they face the viewer, knuckles on a curled
      back of hand, `fingers: 4`, `plump`, `side: 'left'`, a held `prop` at a depth.
      `drawHand` (the animator's hand) now uses it (pencilGrip, tool as a prop,
      fading forearm). Characters v2: `character({ hands: 'cartoon' })` draws gloves
      posed by `hand.left.*` / `hand.right.*` pose fields (`characterHandPose`).
      Model sheet: `examples/headless-video/hand-shapes.mjs` → docs/model-sheet/hand-shapes.png
- [ ] Hand-shape picker on the editor's Character element; foreshortened hands when
      the forearm points at the viewer; cartoon hands on the v1 stick figure
- [x] **Stick-figure joints and costume layers** (feedback from a story channel dressing
      figures) — `stickFigureJoints(pose, style)` returns the geometry the figure is drawn
      with (hip, neck, shoulders, elbows, hands, knees, feet, `handAngle`, stroked limb
      polylines, head ellipse + face lines in head units), already mirrored for facing;
      drawing and joints share one rig (`rigFigure`), so they cannot disagree;
      `style.layers` hooks (`behind`, `body`, `sleeve`, `behindHead`, `overHead`, `front`)
      draw costumes / hair / props inside the figure's z-order, in figure space, with a
      sketch pen when sketched; the left arm is always the back arm;
      `style.shoulderWidth` (default 0); `resolveStickPose()`, `stickFigureAt(target,
      frame, id)` for immediate-mode `draw`, `jointsToScene()`, `headPoint()`; golden
      PNGs (`src/characters/golden/`) pin the 0.75.0 look pixel for pixel
- [x] **Fix: headless custom targets drew at time 0** — `FrameRenderer` now stamps the
      state with the frame time, so `talk` chatters and sketched figures boil in
      `tinyfly video` (the timeline is never played there, so its own clock stayed at 0)
- [x] **¾ turn** — `turn` pose field (0 front → 1 profile): the face slides toward the
      facing side and narrows (back eye more than front), the mouth narrows, shoulders
      close up by cos(turn·90°); `head.faceX` follows
- [x] **Ground contact** — `feetY` (lower foot) and `grounded.{left,right}` in the joints
- [x] **Sitting** — `sit` pose field (0..1): thighs swing level and forward, shins hang
      down, hips drop to `seatHeight(height)` at 1; the lower foot stays on the ground from
      sit 0.25; `POSES.sit` (hands on knees); label drops with the body
- [x] **Organic stick-figure look (default)** — feedback: figures looked boxy. Tapered
      limbs (`taperedLine()`), joints always a little rounded (rubber ≥ 0.3), small hands
      and feet (feet point the way it faces and tip with the shin by half its angle), the
      lower foot (ankle or toe) always on the ground so walks bob, a forward lean into
      sitting/standing, the back bowing slightly when turned or seated, rounded shoulders;
      `walkPose` leans into the stride and forearms follow through; `style.classic: true`
      keeps the 0.75 drawing (golden PNGs now run in classic); joints gain `toes` and
      `limbs.spine`; joints tests check both looks
- [x] **Brush and head size** — `style.headSize` (head diameter / height, default 0.24;
      the neck moves, hips and feet stay); face line width capped at 14% of the head
      radius so thick brushes (4–5%, the viral look) keep readable faces; defaults
      unchanged (a 2.5–5.5% × 24/30% head comparison sheet informed this)
- [x] **Turned figures: feet and the far arm** (after 0.76.0, from model-sheet review) —
      from the front the feet turn out to their own sides (`FOOT_SPLAY`, foreshortened),
      swinging round to the facing side with `turn`; past `turn` 0.25 the back arm and
      its sleeve hook draw before the torso and `body` layer, so the body hides it
- [x] **Model sheet** — `examples/headless-video/model-sheet.mjs` (a still): Tum and
      Didi, dressed via layers, in five turnaround views (front, 3/4, profile, 3/4 back,
      back; back views are hair over the whole head), height guides from the joints,
      colour swatches, expression close-ups; rendered sheet kept in `docs/model-sheet/`
      for reference
- [x] **Dressed Stick Figures gallery card** (`src/examples/live-demos/dressed-figures.js`,
      Video category): rounded shirt, tapered trousers and sleeves, pleated sari and pallu, spiky hair and a bun via `layers`, a
      lota held at `handAngle`, a walk turned toward travel, sitting on a charpai at
      `seatHeight`, shadows at `feetY`, a speech bubble at the head, joints overlay toggle
- [ ] Next (Pencilmation): erasing that follows a limb rather than the target's box
- [~] **Character system v2, milestone 1 (rig core)** — on `feat/character-v2`, for review
      ([docs/character-system-m1.md](docs/character-system-m1.md)): body plans; bones in 3D
      turned by `turn` (0 front → 1 side → 2 back → 3 other side) and drawn flat; parts drawn
      far to near; contact (lowest of feet/knees/hands/hips/head rests on the ground), `lift`,
      `rotate`; two-bone reaching; human plan + 10 poses (sit, kneel, crouch, crawl, lie down…);
      pen with clean / pencil (boil, pressure, construction lines, rubbed-out attempts) /
      silhouette looks; stick and fluid figures; face that slides round and hides from behind;
      `characterTarget` / `characterAt`; sheet `docs/model-sheet/human-turnaround.png`.
      Editor: 🧍 Character element (figure, look, colours, T-shirt/trousers, view buttons +
      turn slider, body pose and face dropdowns, ◆ Keyframe pose at playhead in one undo
      step, new tracks back-filled with rest at earlier keys, plain-language track names);
      DOM preview via an in-box canvas, Canvas preview and GIF/MP4 export via a custom
      target. Not yet: HTML export / embeds, SVG preview
- [x] **Animated maps** (`@algorisys/tinyfly/maps`, on `feat/maps`) — Web Mercator (`project`,
      `fitView`, `flyView` that pulls out between far places, `greatCircle`); offline world
      outline from Natural Earth 1:110m (public domain, `scripts/build-world-map.mjs`, 33 KB
      gzipped, highlights, pencil borders); OpenStreetMap / `{z}/{x}/{y}` tiles (cache that
      fetches once, parent tiles stand in, `preloadTiles`, attribution drawn); `mapTarget`
      with places (pins drop), routes (arc / great circle / straight, draw on, travelling
      marker), `view.*` props (dotted, so no CSS `zoom` clash), `mapAt`, `routeStops`,
      `mapFlyTracks`, `WORLD_CITIES`; separate CDN add-on `tinyfly-maps.iife.js` (main bundle
      unchanged); Map Route gallery card; `examples/headless-video/map-route.mjs`; editor 🗺 Map
      element (base map, city picker / custom places, route options, fit / world / zoom,
      ◆ keyframe view, ✨ animate trip from playhead; export preloads tiles); docs/maps.md
- [ ] **Character system v2** (planning: [docs/character-system-plan.md](docs/character-system-plan.md)) —
      from six reference model sheets (people, hair, animals, birds, aquatic) in clean
      and Pencilmation looks: 2.5D body plans, gaits as data, contact with any surface,
      IK, heads/faces/visemes/hair, hands, bodies, wardrobe, quadrupeds, birds;
      milestones 1–8, each ending in a model sheet
- [ ] Next: drawing helpers (speech bubbles, wrapped text, tags, quote cards) and a
      label-overlap check for stills
- [ ] Next: named draw functions, so scenes with custom targets stay pure JSON
- [ ] Next: a browser preview page for a scene module (scrub a `FrameRenderer` on a canvas)
- [ ] Next: parallel frame rendering across worker threads for long videos

---

## Phase 32: Dance and flips for the stick figure (`feat/dance`)

Guide: [docs/dance.md](docs/dance.md). Everything is plain data played by pure
functions (beats in, pose out), so dances scrub, sync to music and render to video
deterministically.

### 32A — Joints for dancing ✓
- [x] `leftWrist` / `rightWrist`: wrist bend added to the forearm; `handAngle` includes it;
      joints gain `fingertips`
- [x] `leftAnkle` / `rightAnkle`: point the toe (tiptoe lifts the body) or flex onto the heel
- [x] `leftFootOut` / `rightFootOut`: turn-out (Bharatanatyam aramandi) and turn-in
- [x] `style.hands`: cartoon hands at the wrists (any `HandPose` per side), turned by the wrist;
      dot hands and the classic look draw exactly as before (golden frames unchanged)
- [x] `spin` (whole body about the hips, mirrored with facing) and `rise` (lift; feet let go of
      the ground once airborne, so a tuck keeps the hips' height); joints follow; layer hooks draw
      in the body's frame

### 32B — Dance as data ✓
- [x] `DanceMove` (keys in beats, cumulative or `reset`, hand shapes, easing), `Groove` (bounce on /
      off the beat, sway), `DanceStyle` (stance, face, moves, routine), mirrored steps, half-beat
      blends between steps
- [x] 9 styles in `DANCE_STYLES`: disco, hip hop, breaking toprock, jazz, K-pop, Bollywood, Bhangra,
      Bharatanatyam, Charleston (heel–toe swivels with `footOut`), tap (shuffle ball change, time step,
      heel toe, cramp roll); `MUDRAS` (pataka, tripataka, alapadma, mushti, shikhara, hamsasya, katakamukha)
- [x] `danceFrame()`, `dancePose()`, `routineBeats()`, `beatAt()`, `mirrorPose()`, `applyGroove()`
- [x] Foot strikes as data: `DanceKey.taps` (toe / heel per foot), `danceTaps(style, from, to)` for sounds;
      tap and Bharatanatyam stamps carry them; the Dance Floor flashes the foot and clicks (Web Audio)
- [x] Timeline: `stickFigureTarget({ dance: dancer(style) })` with `beat` / `dancing` props,
      `danceTracks()` (two tiny tracks), `bakeDanceTracks()` (pose keyframes for pure-JSON timelines)

### 32C — Flips ✓
- [x] `Flip` as data: wind up → take off → air → land; parabolic rise, turn quickest at the top;
      lands on a whole turn so it blends into anything
- [x] `FLIPS`: front flip, back flip, layout, scissor flip, side flip, cartwheel (hands reach the
      ground), back handspring, split leap (grand jeté), toe touch (straddle jump); `flipPose()`, `flipTravel()`, `flipTracks()` (with an `x` travel track)

- [x] Full splits: `POSES.sideSplit`, `POSES.frontSplit` (hips settle on the floor); jazz `splitDrop`

### 32D — Showcase and docs ✓
- [x] **Dance Floor** gallery card (`src/examples/live-demos/dance-floor.js`, Video category): style,
      move and tempo pickers, a 1–8 count light, a spotlight, flips on demand blended in and out of
      the dance
- [x] `docs/dance.md`, API reference, README, docs manifest
- [x] Model sheet `examples/headless-video/dance-sheet.mjs` → `docs/model-sheet/dance-and-flips.png`
- [x] Tests: `dance.test.ts` (every style: finite, JSON, smooth, feet on the ground; loops, keys,
      mirroring, mudras, groove, routines, tracks, the target), `acrobatics.test.ts` (start/end
      standing, full turn, peak height, fluid at 60 fps, travel, baking),
      `stick-figure-extremities.test.ts`

### 32E — Next (planned)
- [ ] Music sync: `beatAt()` from an audio track's BPM and offset in the editor; beat markers
- [x] Editor: a Dance section on the 🧍 Character (style, move, tempo → 🕺 Dance from playhead; flip →
      🤸 Flip at playhead), written as ordinary keyframes merged around existing keys; built on
      `stickToHuman()` (stick poses on v2 characters: spread/swing split by the view, plié knees,
      lift/roll)
- [x] Hand shapes as numeric props: `hand.left.*` / `hand.right.*` on targets with `style.hands`;
      `bakeDanceTracks()` bakes them (`hands: false` to skip)
- [x] Tap danced side-on so brushes read forward and back; `mirrorPose()` and the groove understand
      side-on poses (the other limbs, knees forward)
- [x] Editor dances: flips travel (an `x` track from the playhead's offset, mirrored for a character
      facing left); Hands: Cartoon gloves on the Character, with dances keying hand shapes and mudras
      (`hand.*` fields are character fields, labelled "Right hand · index curl")
- [x] v2 characters gain `leg.*.toeOut` (foot turn-out); `stickToHuman(pose, hands)` carries turn-out,
      hand shapes and wrist bends (as hand `roll`)
- [x] Turned-out knees on v2 characters: `leg.*.rotate` (hip rotation; the foot stays forward), so
      front-on stick legs map exactly (Bharatanatyam's half-sit, pliés, bounces bend out over the toes)
- [x] Natural five-fingered hands: `character({ handStyle: 'natural' })`, and Hands: Natural in the editor
- [x] Music beat grid: engine `BeatGrid` helpers and a deterministic `detectTempo(samples, rate)`
      (onset strength → autocorrelation with a ~120 bpm prior → tempo and phase fitted together);
      Audio element Beat (🎵 Detect tempo in the browser, tempo / first beat / beats per bar, 👆 tap
      tempo); timeline beat lines and numbered bars; keyframes snap to beats (Alt to place freely);
      dances and flips follow the beat (music's tempo, start on the nearest beat)
- [x] Travelling dances: `DanceMove.travel` (ground per loop, in heights; mirrored front-on it turns
      round), `danceTravel()`, `danceTravelTrack()` (linear `x` keys where the speed changes),
      `bakeDanceTracks({ height })`; a `popping` style with side glide, moonwalk, forward glide and toe
      stand whose planted foot stays put (tested on the joints); the editor's dances write an `x` track
      from the character's position; the Dance Floor carries the dancer and wraps it round the stage
- [x] Travel eases in and out with `danceTracks()`' `fade` (`danceTravelTrack({ fade })`); editor dances
      for a character facing left are the mirror image (`mirrorHumanPose()`, pixel-checked against a
      flipped drawing) and glide the other way, turned between 3 and 4 like flips
- [ ] Beats: a beat grid in the curve view; snapping step markers; detecting changing tempos
- [ ] More styles: salsa, tap with wings and pullbacks, garba / dandiya,
      Kathak (chakkar spins with `turn`), locking, shuffle, popping hits and the robot
- [ ] More acrobatics: aerial, butterfly kick, 540, round-off, kip-up, flips in a sequence
- [ ] Floor work and body rolls (windmill, headspin, freezes on the hands, body wave) need
      Characters v2's bendable spine, hand contact and IK — port dance and flips to v2 body plans
- [ ] A headless music-video example (dance + flips to a beat, rendered to MP4)

## Phase 33: 3D support (planned)

Plan: [docs/3d-support-plan.md](docs/3d-support-plan.md). 3D values are just tracks (vec3 / quat with
an explicit `slerp` interpolation); an optional `@algorisys/tinyfly/scene-3d` add-on resolves JSON
scenes (camera, lights, meshes, glTF, characters) to plain draw data; renderers in order: our own
Canvas 2D (headless video, Workers, zero dependencies), our own WebGL2, then optional three.js;
WebGPU deferred.

- [x] M0 rotation math (vec3, quat, mat4) and `Track.interpolation: 'slerp'` (`feat/3d`): `src/engine/math/`
      (`vec3`, `quat` with YXZ `fromEuler` / `toEuler` and `slerp`, column-major `mat4` with `compose`,
      `invert`, `perspective`, `orthographic`, `lookAt`); `interpolateQuaternion`; format version 2 only
      when a track uses `interpolation` (writers use the lowest version a file needs); slerp samples in
      baked eases; DOM adapter draws `quaternion` as `matrix3d()`; Quaternion vs Euler gallery demo;
      `docs/3d-rotations.md`
- [x] M1 CSS-style 3D finished (`feat/3d`): one documented transform order in DOM (was track order), SVG,
      Canvas and WebGL; DOM `childPerspective` / `perspectiveOriginX/Y`, `transformStyle` and
      `backfaceVisibility` pass-through; Canvas: the CSS matrix, exact without perspective, through a
      seamless triangle mesh with it (one layer for see-through targets), `backfaceVisibility`, works
      headless; WebGL: a mat4 per quad (perspective-correct textures); SVG: `z`, `quaternion`,
      `rotateZ`; shared `src/adapters/transform-3d.ts`; e2e `transforms-3d` (maths = CSS exactly,
      Canvas / WebGL within a pixel, Chromium / Firefox / WebKit); editor 3D fields (Tilt X, Turn Y,
      Depth, Perspective keyed at the playhead); 3D Card Flip and Cover Flow samples
- [x] e2e demos check counts canvas pixels, not only markup (Dressed Stick Figures was reported static)
- [x] gsap-compat speaks GSAP's 3D names: `rotation` / `rotationZ` → `rotate`, `rotationX` / `rotationY`,
      `transformPerspective` → `perspective`, GSAP's parent `perspective` → `childPerspective`; `quaternion`
      tweens are slerp tracks starting unrotated; `perspective` 0 is none in every adapter
- [x] Examples: a **3D** pill groups every 3D example (Quaternion vs Euler, 3D Card Flip, Cover Flow, and
      the GSAP-style Card Flip and Split Text Reveal, which stay under GSAP-style too: `alsoIn`)
- [x] M2 3D scenes drawn by Canvas 2D (`feat/3d`): `@algorisys/tinyfly/scene-3d` entry and
      `tinyfly-scene-3d.iife.js` (about 7 KB gzipped, sharing the engine): Scene3D JSON (groups, meshes:
      box / sphere / cylinder / cone / plane / torus, perspective and orthographic cameras with `lookAt`,
      ambient / directional / point / spot lights, materials with stylized and realistic fields, fog,
      layers), `validateScene3D`, `loadScene3D`, a pure `resolveScene3D` (tracks at `<scene>/<object>`,
      `activeCamera` cuts, culling, near clipping, total draw order, silhouette / crease / rim outlines),
      unlit / flat / lambert / toon shading, `Canvas2DRenderer`, `Scene3DAdapter`, `drawScene3D` for video
      draw hooks, camera helpers; entry-boundaries test; gallery demo (3D Scene: Orbiting Camera) and
      `examples/headless-video/scene-3d-orbit.mjs` (MP4 in Node); `docs/scene-3d.md`
- [x] M2 `extrude` geometry: any SVG path made solid (curves sampled, holes by nesting, ear-clipping
      triangulation with hole bridges), scaled to a width in metres; golden PNG frames for scene-3d
- [ ] M3 WebGL2 renderer
- [x] M6 3D characters (`feat/3d-characters`): `solvePlanSpace` (forward kinematics split out of
      `solveSkeleton`, which draws as before), `stagePlanSpace` and `skeletonInView` (turn, roll, lift and
      ground contact as front-on, seen through any camera; front-on through a flat camera it is the 2D
      figure exactly, from the side it is turn 3 exactly), `drawCharacterInView`; scene-3d object kinds
      (`loadScene3D(scene, { kinds })`: validate, prepare, resolve to meshes and drawables); the
      `character` object and `characterObjects` (pen look in perspective with face and hands, or a solid
      look of toon-shaded capsules with eyes), soft ground shadows; gallery demo (3D Scene: Dancing
      Characters) and `examples/headless-video/characters-3d-dance.mjs`
- [x] M4 editor 3D Scene element (`feat/3d-editor`): `scene3d` element holding Scene3D JSON, tracks named
      `object.property` on the element (and `activeCamera` for cuts), drawn in the DOM and Canvas previews
      and every raster export (`CustomTarget.acceptsProp` routes tracks it cannot list up front); property
      panel: objects (add box / sphere / cylinder / cone / ring / star / character / light, remove),
      transform keyed at the playhead once animated, material (colour, shading, outline), light, camera
      (fov, look through, cut at playhead), character look and dance from playhead, camera presets,
      background and fog
- [ ] M4 next: an orbit / pan authoring view and on-canvas gizmos; a 3D element in embeds and the player
- [x] M3 WebGL2 renderer (`feat/3d-webgl`): `@algorisys/tinyfly/scene-3d/webgl` and
      `tinyfly-scene-3d-webgl.iife.js`; draws the resolved frame's new `meshes` (world-space meshes,
      including solid characters) with a depth buffer, the same light model per pixel (unlit / flat via
      derivatives / smooth / toon, spot cones, ranges, fog), inverted-hull outlines, see-through meshes far to
      near, and drawables on a 2D overlay; e2e `scene-3d-webgl` (compiles, silhouettes match Canvas 2D
      ~97%, depth buffer correct) in Chromium, Firefox and WebKit; Canvas 2D / WebGL2 switch in the orbit demo
- [ ] M3 next: crease outlines and shadows in WebGL2; the editor's 3D element drawn with WebGL2
- [ ] M5 rigid glTF import
- [ ] M7 skinned glTF; M8 optional three.js adapter
- [ ] Goal: 3D is also for **movies** (Phase 34). Decisions to revisit in the plan before M2, since its
      non-goals work against films: ground / contact shadows for characters (open question 8 → yes, by
      M6), a minimal deterministic post step (anti-aliasing, fog, vignette; not a full stack), and
      headless WebGL2 export (open question 6) for scenes too heavy for Canvas 2D
- [ ] M2 scene JSON leaves room for several cameras and an active-camera track (cuts), so Phase 34
      needs no format change
- [ ] Two render modes from the same scene and timeline JSON (Phase 34H): **stylized** (our renderers:
      flat / toon / pencil, deterministic to the pixel) and **realistic** (the three.js adapter: PBR,
      shadows, environment light). So M2's materials and lights carry both kinds of fields (colour,
      toon steps, outline; roughness, metalness, emissive; light intensity in physical units, which
      settles open question 4 as metres), each renderer reading what it understands; and M8 is no
      longer optional for films
- [ ] Pay only for what you import: 3D ships as separate entries, never inside `.` or `/player`:
      `/scene-3d` (types, resolver, Canvas 2D renderer), `/scene-3d/webgl` (WebGL2 renderer),
      `/scene-3d/gltf` (glTF loader), `/three` (realistic mode). The engine gains only the math
      helpers and slerp. `three` is an optional peer dependency (like React / Vue today), so it is
      installed only by those who use realistic mode; Playwright / Chromium for headless realistic
      renders is never a dependency (the CLI asks for it when needed)
- [ ] A bundle-size check in tests: each entry's built size has a budget, and importing `.`,
      `/player` or `/scene-3d` must not pull in WebGL, glTF or three code (checked on the built
      `lib/` files); the release notes report the sizes
- [ ] Watch the npm tarball (812 kB at v0.82.0): if 3D assets or renderers make it large, move them
      to a separate package (`@algorisys/tinyfly-3d`) rather than grow every install

## Phase 34: 3D movies (planned, after Phase 33 M0–M2 and M6)

A short film is a timeline like any other: shots are time ranges, cuts are a camera switch, and every
frame is rendered from data. Builds on Phase 31 (narration, voice audio, captions, `renderVideo()`,
`tinyfly video`) and Phase 32 (dances, flips, beats); nothing here may break determinism, so a
film re-renders identically, frames in any order.

### 34A — Shots and cameras
- [ ] Several cameras per scene; `activeCamera` as a stepped track, so a cut is one keyframe
- [ ] Shots as data: `{ id, start, end, camera, label }`, a shot list the editor and CLI read
- [ ] Transitions between shots: cut, crossfade, dip to black, wipe (pure, frame-addressable)
- [ ] Camera moves as presets that write tracks: orbit, dolly, crane, pan / tilt, follow, `lookAt`
      a target, focal-length zoom, a deterministic (seeded) handheld shake
- [ ] Aspect ratios and safe areas: 16:9, 2.39:1 letterbox, 9:16 vertical, 1:1

### 34B — Sets, props and light for mood
- [ ] Ground, sky / gradient backdrop, simple set pieces and props as reusable scene objects
- [ ] Ground and contact shadows (blob first, then projected); fog for depth
- [ ] Lighting presets (day, dusk, night, stage spotlight) that write light tracks

### 34C — Characters acting in 3D
- [ ] Walk along a 3D path with feet planted on the ground (stride from speed, as `strideLength`)
- [ ] Head and eyes `lookAt` another character or the camera
- [ ] Lip sync from narration: mouth shapes timed from each line (phoneme-ish from text first,
      from audio energy later), on v2 characters
- [ ] Dances, glides, flips and the moonwalk from Phase 32 placed in the world (travel along the
      character's facing), several characters in one scene, staging so they do not overlap

### 34D — Sound
- [ ] A mix: music bed, narration, sound effects at times or on events (taps, landings)
- [ ] Ducking the music under narration; fades; the mix rendered with the video by ffmpeg
- [ ] Beat grid from the music drives dances and cut timing (reuse `detectTempo`, `BeatGrid`)

### 34E — Rendering a film
- [ ] Motion blur by deterministic sub-frame sampling; anti-aliasing (supersampling)
- [ ] Parallel rendering across worker threads (Phase 31's "next"), chunked and resumable, with a
      frame cache so changing one shot re-renders only that shot
- [ ] Output: 1080p and 4K H.264, ProRes / PNG sequence for editing elsewhere, SRT / VTT (exists)
- [ ] Headless WebGL2 (Chromium) for heavy scenes, Canvas 2D stays the reference renderer

### 34F — Editor
- [ ] Storyboard view: shots as cards with a thumbnail and caption, reorderable, each opening its
      time range on the timeline
- [ ] Look through any camera; a shot strip on the timeline; cut at playhead
- [ ] Render dialog for films (shot range, resolution, quality, audio mix, captions)

### 34H — Two render modes: stylized and realistic
- [ ] `renderMode: 'stylized' | 'realistic'` per film, overridable per shot (decided); the scene,
      timeline, shots and sound do not change between them
- [ ] Stylized: Canvas 2D (reference, goldens, Workers, Node) and WebGL2; flat, toon and pencil
      looks, outlines, blob shadows
- [ ] Realistic: three.js (optional peer dependency, only in the `three` entry): PBR materials,
      shadow maps, an environment map (HDRI) and tone mapping
- [ ] Characters in both: the pen / toon look for stylized; for realistic, the `solid` look with
      PBR shading first (decided: no wait on M7), then a skinned glTF mapped to v2 pose fields (M7)
- [ ] Headless realistic renders through Chromium (Playwright) with WebGL2; deterministic in input,
      checked against stylized renders of the same frame by tolerance, not pixels
- [ ] Editor: a mode switch on the preview and in the render dialog, so a film can be blocked out
      fast in stylized and rendered in realistic

### 34G — Showcase
- [ ] A 1–2 minute short made only from data: two characters, three sets, cuts, narration,
      music, a dance number, captions, rendered by `tinyfly video` and in the editor, once in each
      render mode from the same JSON

---

## Phase 35: Viral loops (planned)

What made the first loop videos hard to build: "Impossible Descent" (an endless zoom into neon Penrose
triangles) and "Droste Head" (a cartoon head whose pupil holds the same head, forever), both made with
`tinyfly video` (2026-10-05). Everything stays deterministic and frame-addressable.

### 35A — Loops that close exactly
- [x] `tinyfly video --loop-check`: renders five frames (first two, last two, the one at the duration);
      reports closure (frame at the duration vs the first), the seam (last → first) and ordinary steps as
      PSNR; closes / seamless / does not loop (exit 1); `checkLoop(scene)`, `psnr`, `loopReport` in
      `@algorisys/tinyfly/headless`
- [x] `--frames 0,79,88` and `--times 0,2640` for stills at chosen frames or times
- [ ] A `loop: true` scene flag: the duration is the period; helpers below default to it
- [ ] Periodic motion helpers guaranteed to repeat over a duration: `wobble(t, { period, cycles })`,
      seeded looping noise (noise on a circle / torus), periodic easing

### 35B — Nested zooms (Droste)
- [ ] A similarity-transform helper (scale, turn, move as one value: `compose`, `pow` for a fraction
      of a step, the fixed point, `apply` to a canvas context), so a self-similar zoom is a few lines
      instead of hand-rolled complex-number maths
- [ ] `nestedZoom({ factor, turn, levels, draw(ctx, level) })`: draws only the levels on screen
      (sub-pixel ones and those hidden behind a full-screen child are skipped) and closes the loop
      after one step per period

### 35C — Faces and characters for close-ups
- [ ] A cartoon head with a full face (bulging eyes, lids, brows, nose, mouth, teeth) driven by
      the existing expression set (`HUMAN_EXPRESSIONS`, lid openness, pupil size), drawable big
- [ ] A hook to draw anything inside the pupil (another scene, the same head), for Droste faces
- [ ] Keyframe curves over any input, not just time: `curve(keys)(x)` reusing keyframes and
      easings (a face driven by its size on screen, a colour by depth)

### 35D — Neon and glow
- [x] A bloom / glow post-effect for headless video (and the Canvas renderer): threshold, blur,
      add; emissive materials in 3D scenes that feed it. `bloom` on a VideoScene, `applyBloom(ctx)`
      for any 2D canvas (bright pass by max channel, 3-pass box blur, tight glow + wide halo,
      `'lighter'` composite at 1/4 size, deterministic); `emissive` in the Canvas 2D and WebGL2
      renderers; `examples/headless-video/neon-bloom.mjs`
- [x] Light trails and comets: a polyline trail helper with tapering width and fade, along paths
      and 3D beams (no dotted look at speed). `trailSamples` (pure, from a function of time;
      `period` for loops), `ribbon` / `ribbonHeadCap`, `drawTrail` (seamless additive strip, round
      head, comet glow, `normal` / `add` blend); `FrameInfo.stateAt`; demos Light Trails and
      3D Scene: Comet Trails; `examples/headless-video/comet-trails.mjs` (loops)
- [ ] A radial / zoom blur and speed lines for dives
- [ ] Impossible-object helpers: Penrose triangle and staircase geometry (2D isometric and the
      3D "aligns from one viewpoint" construction)

### 35G — 3D scenes for loops (from "Impossible Descent 3D", a real 3D Penrose flight)
- [x] Fix: the Canvas 2D renderer inked each triangle right after its fill, so on subdivided meshes
      the next neighbour's fill and seam stroke nicked the ink (tick marks every cell along edges); now
      each edge's ink waits until the faces of the same object at about its depth are painted (before
      anything of another object or clearly nearer, which may still cover it); test measures ink
      coverage along every edge (90% → over 99.5%); scene-3d goldens updated
- [ ] A raw mesh geometry in scene JSON (`{ type: 'mesh', positions, indices }`) with per-face or
      per-vertex colours, so custom shapes (warped beams) need no ObjectKind code
- [ ] Per-object, animatable outline colour and width, and fog on outlines (distant levels fade
      their edges)
- [x] Lines, polylines and trails in 3D, depth-sorted with meshes (grids, comet trails, dust
      streaks), near-clipped: `line` and `trail` scene objects, one drawable per segment, fog,
      animatable `color` / `width` / `opacity` / `length`, `valuesAt` for trails (WebGL2: on the overlay)
- [ ] A depth buffer for headless video: a software z-buffer in the Canvas 2D path, or WebGL2 through
      a headless GL
- [ ] Camera `up` / roll alongside `lookAt`; a near-camera fade so geometry turns to glass at the lens

### 35E — Satisfying matter
- [ ] Gooey shapes: drips, smooth metaball blobs, bubbles that grow, wobble and pop
- [ ] Squash and stretch helpers for blobs (volume-keeping)

### 35F — Sound
- [ ] Audio-reactive and beat-synced timing for loops (reuse `detectTempo`, `BeatGrid`): a drone or
      riser cut to the loop length

---

## Phase 36: Cartoon acting (toward Tom & Jerry / feature-animation fluency)

Story figures moved every joint at once, start to stop, at a smooth 60 fps: the look of procedural
animation. This phase adds the timing habits of hand-drawn animation as pure functions over key
poses (docs/acting.md).

### 36A — Acting pass (done)
- [x] `actTracks()` / `actCharacterTracks()` / `actKeyframes()`: anticipation, overshoot and settle,
      overlap by chain depth, eyes lead and dart, blinks on head turns and idle blinks, moving holds
      (never on the last key), jump squash from `rise`/`lift`; `ACTING_STYLES` full / snappy / limited /
      none, tunable; `STICK_ACTING_RIG`, `HUMAN_ACTING_RIG`; keys with `act: false` pass as written
- [x] Gags as data: `gag()` take, doubleTake, windUp, land, tremble, deflate (`GAGS`, `gagDuration`)
- [x] Motion effects: `drawStickSmear()` (speed lines from `frame.stateAt`), `drawSpeedLines()`,
      `drawDustPuff()`, `drawImpactStars()`
- [x] Drawing on twos: `VideoScene.drawingRate`, `heldTime()`
- [x] Example `examples/headless-video/cartoon-acting.mjs` (before/after)

### 36B — Story tools (done)
- [x] Line of action: `bend` pose field curves the stick figure's spine (circular arc), chest, arms
      and head ride on its end; acted (depth 0), used by the gags; `stickToHuman` maps it to lean +
      head tilt
- [x] Gaits as data: `GAITS` walk, bouncy, doubleBounce, sneak, strut, tired, run; `gaitPose()`,
      `gaitStrideLength()`; the figure target's `gait` prop (a string track switches it) and an
      animatable `facing` prop
- [x] Lip-sync from text: `soundsOf()`, `VISEMES`, `lipSyncKeyframes()`, `lipSyncTracks()`,
      `lipSyncOver()` (over acted tracks); Latin and Devanagari
- [x] Beat scripts: `scriptTracks(target, beats)`: gaits with `to` (turning round as needed), poses,
      gags, look/face, say (lip-sync + talking head), hold; returns tracks, lines, beat spans
- [x] Camera: `applyCamera`, `cameraFromValues`, `cameraPoint` (canvas); `VideoScene.camera` and
      screen-space `overlay`; `cameraTracks()` shots: frame (push/cut), shake, follow with lag
- [x] Acting pass: overlap capped per move (half its gap), not by the shortest gap in the scene
- [x] The Hindi pencil story re-timed: acted keys, take and double take, tired and bouncy walks, a
      lip-synced line, camera pushes with the hand mapped through the camera
- [x] Example `examples/headless-video/beat-script.mjs`; gallery card **Cartoon Acting**

### 36C — Editor acting (done)
- [x] Character element **Acting** section: style picker and **🎭 Act the keyed poses** (the element keeps
      its plain key poses in `acting`; keying a pose, a gag, a walk or a line re-acts; turn off restores
      the plain poses; dances/flips turn it off), all in one undo step each
- [x] Gags from a picker, in the character's current view (`characterGagKeys`)
- [x] Gaits: walk left/right a distance (`characterWalk`: side-on, planted feet, x track)
- [x] Say a line: lip-sync over the acted mouth
- [x] `TimelineConfig.drawingRate` (engine): every value holds on its drawing in every player; editor
      **Drawing** select (every frame / on twos / on threes); `replaceTracks` can remove and join an undo step
- [x] Script `zip` action (wind-up, legs wheel in place, gone; dust hangs) and `effects` cues (dust at a
      take's landing and a zip's exit)
- [x] Orientation matrix (`character-orientation.test.ts`): 5 builds × walks, gags, dances, flips and
      acting in every view; every figure × look × hands × outfit draws them
- [x] Fixed: a front-on flip (cartwheel, side flip) facing left now mirrors (it stepped one way and
      wheeled the other)

### 36D — Builds and native v2 motion (done)
- [x] Builds in the editor's Character element: presets (standard, slim, kid, broad, curvy, stocky) and
      Head / Shoulders / Hips sliders (one undo step per drag); `CharacterElement.build`, `characterOf`
- [x] v2 line of action: `bend` on the human plan (spine 30/70 + neck); `stickToHuman` maps stick bend to it
      in profile; acting rig leads with it
- [x] Native v2 gaits: `humanGaitPose`, `humanGaitStrideLength` from the shared `GAITS` data
- [x] Native v2 gags: `HUMAN_GAGS`, `humanGag` (take, double take, wind-up, land, tremble, deflate) in the
      character's frame; the editor's gags and walks use them (no more stick-figure conversion)

### 36F — Acting on code (done)
- [x] `codePanel()` (characters): a code listing as a canvas scene object with fixed-width layout, so
      lines and words are anchors (`line(n, time?)`, `token(n, text)`, `box`); syntax colours for Go, Rust,
      C#, JS, TS, Python; timed edits `highlight`, `strike`, `remove` (wipe, then the gap closes), `type`
      (hidden lines), written by `tracks(id)` as one track per prop
- [x] Script beats that act on things: `leap` (`to`, `onto` a new floor; `y` track, `ground` option, dust),
      aimed `point` (`target`), sliding `swipe` (`target`), and `onto` on any beat (carried to a floor);
      beat spans report `contact` and `release`; effects carry `y`
- [x] Poses `duck` and `lie` (bed down)
- [x] Gallery card **Code Acting**: a figure points at an unreachable Go line, swipes it away, leaps onto
      `return sum` and lies down

### 36G — Grab, throw, kick (done)
- [x] Code pieces: `piece(n, text)` words that come loose; `follow` (a path), `fling` (ballistic, spinning, fading;
      velocity from the path by default), `move`, `write` (type new text into the gap, the line makes room)
- [x] `remove` styles: `wipe`, `fly` (knocked off the panel, blurring), `blur` (out of focus in place)
- [x] Beats `grab` (stands where the straight arm just reaches, crouches for low things, lifts overhead), `throw`,
      `kick` (stands a leg's length away; the foot meets the target at contact)
- [x] `handPath()`: where a figure's hand is over time, sampled from its tracks
- [x] Aiming measures the body: limb angles are from the chest/pelvis, so a lean or bend no longer throws the aim off
- [x] Fixed: `jointsToScene` (and so `stickFigureAt`) left `fingertips` in figure space
- [x] Gallery card **Code Refactor** (grab and throw `var`, kick the other, `let` typed in, a comment knocked off);
      **Code Acting** gains a delete-style picker

### 36H — Put, write, push (done)
- [x] Code panel `spot(n, column, width?)`, `insert(n, column, text)` (room opens, text types in), `drop(piece, n, column)`
      (lands in room the line opens; its old place closes: `piece.K.away`)
- [x] Beats `put` (palm on the spot), `write` (two-bone arm IK traces the spot left to right; slides along when it is
      wider than the arm reaches), `push` (both hands on the near side, the new `shove` gait keeps them steady)
- [x] Two-bone arm IK in scripts (`reachArm`): law of cosines on the measured upper arm and forearm
- [x] Walks keep a raised arm still either way: a left arm reaching forward (a negative angle) no longer swings
- [x] Gallery card **Code Fix** (Rust: carry the stray `;` to its line, write `mut` in)

### 36I — Ride and reflow (done)
- [x] `code.ride(tracks, target, { ground })`: the figure's `y` follows the line under its feet as gaps close (eased
      keys kept where nothing moves, sampled where a line does; a hop blends between the floors it leaves and lands on;
      its own ground never moves)
- [x] Same-line `drop()` slides the word at the push's pace and closes the text it passes; `landing()` says where it ends
- [x] Gallery card **Code Tidy** (Python: push `not` into place, blur out the TODO, ride the line up); **Code Refactor**
      rides instead of an `onto` beat

### 36J — Made for LLMs (done)
- [x] Beat scripts fail loudly: `checkBeats()` / `scriptTracks()` reject unknown actions, moods, joints and fields with
      "did you mean" (field synonyms: duration → for, expression → mood, text → say…), missing needed fields, bad shapes
- [x] `describeTarget()`, `animatableProperties()`, `checkTracks()`; `CANVAS_PROPERTIES` (units, ranges, types); custom
      targets describe themselves with `about` (stick figure: every joint, prop and action; code panel: props and edits)
- [x] `capabilities()` / `capabilitiesMarkdown()`: the catalog generated from the library; `tinyfly capabilities [--json]`,
      `tinyfly check <beats.json>`
- [x] `llms-full.txt` in the repo (docs, course, catalog); `llms.txt` links pinned to the release tag
- [x] npm package ships `docs/*.md`, `llms.txt`, `llms-full.txt` and `skills/tinyfly/SKILL.md`; `docs/llm-guide.md`
- [x] Code panels reject unknown languages and remove styles; `editDistance`, `closestName`, `unknownName` in the engine

### 36K — Your own behaviours (done)
- [x] `defineAction()` (beats macros or timed pose steps), `defineGait()` (with `cycle`), passed as a cast to
      `scriptTracks`, `checkBeats`, `stickFigureTarget({ cast })` and `handPath`; no global registry; custom names may
      not shadow built-ins; expansions are checked; nesting is capped
- [x] `persona()`: look, height, acting style, gait (`go`), usual mood, stance (`stand` returns to it), energy, own
      actions and gaits; `.figure()`, `.script()`, `.check()`, `.handPath()`, `.describe()`
- [x] `capabilities(version, cast)` lists a cast's own actions and gaits; the catalog documents the API
- [x] `stepsToKeys()` shared by gags and step actions; gallery card **Code Review** (two personas)

### 36L — Props (done, on feature/scene-props)
- [x] Prop rigs: 3D parts on pivots (box, cylinder, ellipsoid, extrude, panel, tube), controls bound to part transforms,
      anchors; `solveProp` through the same view contract as the v2 human (`turn`, `tilt`), drawn with the characters'
      pens (opaque fills, one pencil seed per part), face shading, silhouette and crease outlines, contact shadow, fades
- [x] `propScript`: beats through `actKeyframes` with a per-family acting rig and an `exaggeration` dial; exact (unacted)
      controls for wheels and rotors; `checkPropBeats` with did-you-mean; common `hold`, `turn`, `pop`, `vanish`
- [x] `springFollow` (engine) and `Prop.follow` for follow-through (a car's antenna)
- [x] Families: `vehicle(spec)` with `car`, `truck`, `bus`, `tractor`, `cart`, `trainCar`, `bike`, `motorbike` (drive, brake,
      bump, honk, door, lights; wheels of any size roll exactly); `tree`, `house` (sway, shake, leaves; door, lights,
      smoke); `helicopter`, `airplane` (take off, fly, hover, loop, land; rotors blur)
- [x] `propTarget` (+ `about` for `describeTarget`), `propAt`, `drawProp` with a rider between far and near parts,
      `propRide` + `spliceTracks`, `drawPropEffects` (dust, exhaust, skids, honks, leaves, smoke)
- [x] Catalog: props section; `docs/props.md`; gallery cards **Road Trip**, **Windy Day**, **Helicopter**, **Traffic**

### 36M — Animals (done, on feature/animals)
- [x] `horse()`: barrel, neck and mane, head with ears, eyes and muzzle, four jointed legs, a tail on a spring; gaits walk,
      trot, canter, gallop worked out by the rig's new `derive` from `gait` and the stride phase `walk` (keyed with the
      distance, so the hooves keep pace); `rear` (about the hind hooves), `buck`, `neigh`, `graze`, `nod`, `swish`
- [x] Rig additions: static part rotations (`rotate`), `derive` (controls worked out from others); seamless smooth fills
- [x] `propTow`: a towed prop (cart) on a leader's hitch, turning with it, wheels rolling exactly; cart `shafts` anchor
- [x] Gallery card **Horse & Cart**

### 36N — More animals and line art (done, on feature/animals)
- [x] `quadruped(spec)`: species from proportions; `horse`, `dog`, `cat`, `cow` presets; shared gaits (per-species set and
      cycle scale), `sit` (worked out from the legs: front feet planted, hind paws flat via a new ankle joint), `jump`,
      the species' call, `nod`, `swish`, `graze` for grazers; dog `wag`, `sniff`; cat `arch`, `pounce`
- [x] Rounder animals: tapered tubes (a radius per point), rounded knees, paws and hooves, tail tips
- [x] Outlines weighted by the prop's size on screen
- [x] Stick look (`style: 'stick'`): line art for any prop — tubes as strokes, shapes over paper, solid-only parts hidden
- [x] Gallery card **Farmyard** (with a solid/stick picker)

### 36O — Birds (done, on feature/animals)
- [x] `bird(spec)` with `songbird`, `crow`, `chicken` presets: body, head on a neck joint, beak, eyes, a comb and wattle
      for the chicken, tail, two thin legs with toes, and wings that fold back along the body (rolled flat against its
      side, shorter) and spread out to their full span, with tapering flight feathers
- [x] Wingbeats from a phase (`wingbeat`, keyed steadily at the species' beats per second) through `derive` while
      `flapping` is on; a walk phase (`step`) for legs and a bobbing head
- [x] Actions: `hop`, `walk`, `peck` (a stoop, and a neck that reaches for a chicken), `flap`, `fly` (take-off crouch
      unless already in the air), `land` (to the ground or a perch), `flutter` for a chicken, and each one's call
- [x] Gallery card **Birds** (a robin off a branch and back, a crow up onto a roof, a hen), perches read from anchors

### 36P — Props in 3D scenes (done, on feature/animals)
- [x] `propObjects`: the `prop` object kind (`{ kind: 'prop', prop: 'car', options, values, look, style }`), solved through
      the scene camera and drawn with the props' pens; controls are tracks on the object; did-you-mean on a wrong preset
- [x] `solveProp` in perspective: normals seen as directions, faces culled toward the camera's eye (`{ perspective: true }`)
- [x] `propPreset(name, options)` / `PROP_PRESETS`; the editor's 3D Scene element loads props
- [x] Gallery card **3D Scene: Village** (orbiting camera; car, horse, crow, hen, trees, houses, a character; solid / stick)

- [x] Depth order in 3D: a prop is cut into ~1 m columns (in its rest space, cached) that each sort at their own depth;
      faces drawn far to near inside a column with their own outlines; faces inside or against another solid part left
      out; faces lying on a part's face drawn after it; part `layer` for parts that sit into each other (cabin, roof);
      clipping at the camera's near plane; scene objects refuse `rotateY` as a field (it is a track)

### 36Q — 3D stories (next, in order)
- [x] Props in world metres: `propScript3D` (moves to a point or through points on a smooth path, turning first; wheels,
      strides, wingbeats and rotors keyed from each prop's `moves`; fliers' height; `face`, `hold`, and 2D actions as
      controls only; `checkPropBeats3D`); the Village demo is scripted with it
- [x] Characters in world metres: `characterScript3D` (gaits to a point or through points, the walk phase keyed with the
      distance; face, hold, pose, gag; `checkCharacterBeats3D`); the character object steps its legs from `walk`,
      `walking` and `gait` on the pose it holds; Tum walks, waves, runs and does a take in the Village demo
- [x] Riders in 3D: `propRide3D` (hips on a seat anchor as the prop moves, bobs and pitches; mount and dismount hops),
      `propAnchors3D`, `RIDING_POSES`, a `place` beat; characters drawn part by part at their own depths
      (`characterPartsInView`), so a leg astride a horse shows on each side; Tum rides the horse in the Village demo
- [ ] Riders in closed cabins in the pen looks (the mesh look's glass is see-through already)
- [x] Props lit by the scene's lights (ambient, directional, point, spot, fog), glowing parts over the top; object kinds
      get the scene's lights and fog; the Village demo has a day / sunset / night picker (lit windows and headlights)
- [x] Characters lit by the scene's lights: a pen character's skin takes the light at its chest from the camera's side
      (capped at its own colour) and the fog; the Village demo gives Tum a light ink at night
- [ ] Wardrobe layers lit by the scene (they draw their own colours)
- [x] The mesh look for props (`look: 'mesh'`): parts as the scene's own meshes (built once, placed each frame), lit,
      outlined (smooth shapes without creases: a new `creases` material option), glass see-through, glow emissive, hidden
      faces left out, a disc shadow; exact depth with WebGL2; front windows set a centimetre off their wall

### 36R — Surfaces: figures act on more than code (in progress, on dev)
Goal: the code panel's pattern (named places to stand on and point at, timed edits, pieces that
come loose, floors that carry a figure) as a contract any scene object can follow: boards, charts,
tables, UI mockups, stateful props. For creators who don't make code.
- [x] Step 1: the shared parts pulled out of `codePanel` into `src/characters/surface/` (`editLog`,
      `pieceMotion`, `rideFloors`, `surfaceBox`); `codePanel` built on them, its output unchanged
      (checked byte for byte against the old code on every edit, fling, drop and ride)
- [x] Step 2: the `Surface` contract (`src/characters/surface/surface.ts`), with `codePanel` as the first
      surface: `anchor(name)` (`box`, `line:N`, `token:N:TEXT`, `token:N#K:TEXT`, `spot:N:C[:W]`),
      `piece(anchor)`, `edit(name, anchor, options)` for every panel edit (highlight, strike, remove,
      type, insert, write, drop, move, fling); did-you-mean on anchor kinds and edit names; a
      `surfaces` section in `capabilities()` and the catalog; documented in docs/acting.md
- [x] Step 3: `surfaceScript(figure, surfaces, beats, options)`: `target` / `to` / `onto` as named
      places (`{ surface, anchor }`), `then` cues (a surface edit, or `carry` along the hand) at a beat
      moment (`at`: start / contact / release / end) with `until` (this beat or `{ beat, at }`);
      cues run in beat order, then the figure rides; `checkSurfaceBeats` with did-you-mean on
      surfaces, places, edits and moments; the Code Tidy demo as data gives its tracks key for key
- [x] Step 4: `whiteboard()`, the second surface: whiteboard and chalkboard themes, items as data
      (texts at fixed-width cells; circle / box / underline / arrow marks with a wobble seeded by id),
      places `text:ID`, `term:ID:TEXT`, `mark:ID`; edits write, draw, erase, strike, move, fling;
      terms come loose as pieces; the Board Lesson demo (a figure solves 2x + 4 = 12)
- [x] Fix: `scriptTracks` dropped a start `facing: -1` when the figure never turned, so it was drawn
      facing right with its arm aims mirrored (found by the Board Lesson demo)
- [ ] Board: handwriting font loaded with the page (falls back to the system cursive), arrows that
      bend round other items, a `lines` (ruled paper) theme
- [x] Step 5a: `chart()`, the third surface: bar and line charts from data (light and dark themes,
      a round scale, value labels with prefix / suffix / decimals); places `bar:ID` / `point:ID`,
      `label:ID`, `value:ID` that follow the values over time; edits set, show, highlight; bar tops
      are floors a figure rides as they grow; the Chart Talk demo
- [x] Step 5b: `propSurface(target, { tracks? })`: any prop as a surface; places `anchor:NAME`,
      `part:ID`, `control:NAME` (the parts a control moves or lights), `box`, worked out from its
      values at a time (and its own script's, so they follow it); edits `set` and `switch`; the Home
      Time demo (a figure opens a house's door and its windows light up)
- [ ] Props: a roof or a seat as a floor a figure stands on (`ride`), parts that come loose as pieces
- [ ] Charts: pie / donut (a slice pulled out as a piece), several series, an axis title

### 36E — Next
- [ ] Rider pedalling and steering poses; props in the editor's 3D Scene element palette
- [ ] Code panel in the editor (a Code element whose anchors snap beats)
- [ ] Beat scripts for v2 characters (`scriptTracks` on the human plan)
- [ ] Follow-through on hair, tails, ears (character-system milestones 3 and 5)
- [ ] AI generator emits beat scripts

---

## Phase 37: Character appearance (from the everyday-life reference pack)

Guide: [docs/character-appearance.md](docs/character-appearance.md). From a 16-sheet reference pack
(turnarounds, people, emotions, motion, everyday life, work, animals, birds, home and city,
nature, style families, age and cast, short and long hair, facial hair, hair turnarounds),
reviewed against the library: sheets 1 and 11 were mostly covered already (eight views through
`turn`, the six hand shapes, clean / pencil / silhouette / stick / fluid / rubber-hose); the
biggest gap was the head (sheets 2 and 12–16), so that came first.

### 37A — Heads ✓
- [x] Head regions (`head/shell.ts`): hair, beards and hat crowns are fields over the head's
      surface, split into the part facing the viewer and the part facing away and traced
      (marching squares) to outlines; far parts draw before the body (long hair behind the
      shoulders), near parts over the head, and turned away the hair draws after the whole body
- [x] Hair as data (`hair: 'bob'` or `{ style, color, length, hairline, texture, ties… }`):
      34 presets (bald to twin braids), textures (spiky, curly, wavy, locs), partings and strands,
      ponytails, buns and braids tied to one place on the head, `HAIR_COLORS`
- [x] Facial hair: 20 presets; moustaches on the face (they slide with the mouth), beards on the
      jaw with an opening so every mouth and lip-sync shape stays readable; stubble
- [x] Glasses (round, square, sunglasses; the arm to the ear in profile), hats (cap, beanie,
      hard hat, sun hat, bowler) over the hair, ears (behind the head from the front, on it in profile)
- [x] Face marks `blush`, `tears`, `sweat` (pose fields, 0–1) and 12 more expressions (laughing,
      afraid, bored, tired, embarrassed, proud, determined, affectionate, hurt, suspicious,
      relieved, excited); `crying`, `scared`, `worried` use the marks
- [x] Plain figures draw exactly as before (a test compares the pixels)

### 37B — Bodies and cast ✓
- [x] `HUMAN_BUILDS` in the library (standard, slim, tall, short, broad, curvy, stocky, kid,
      child, toddler) and `legLength` / `armLength`; `humanGaitStrideLength` takes the leg length
- [x] `outfit: { shirt, trousers }` as data; `castMember(name, height)` and `CHARACTER_CAST`
      (boy, girl, young man, young woman, man, woman, grandpa, grandma)
- [x] Editor: a Head section (Cast, Hair, Hair colour, Facial hair, Glasses, Hat, Ears), the new
      builds, Legs and Arms sliders
- [x] Gallery: Cast Turnaround and Hair, Beards & Hats cards; appearance model sheet
      (`examples/headless-video/appearance-sheet.mjs` → `docs/model-sheet/appearance.png`)
- [x] Web help: the Character Appearance page, and the docs viewer now shows images (model
      sheets were links before)

### 37C — Everyday actions ✓
- [x] Held items as data (`holding: { right: 'mug' }`, `{ both: 'parcel' }`): mug, phone, book,
      bag, briefcase, umbrella (canopy over the head), broom, parcel, drawn at the hand's grip and
      sorted with that arm; `held.left` / `held.right` / `held.both` pose fields let go;
      `handGrip(joints, side)` for drawing anything else in a hand
- [x] `meetHands(kind, a, b)`: handshake, high five, fist bump, hand-over (four hands round one
      parcel) as two poses reaching one point; `meetingSpacing`, `reached`; three-quarter or side views
- [x] Poses: sleep, stretch, sitFloor (cross-legged), carry, lift, push, pull, drink, phone, read,
      type (seated); in the editor's Body list, and Right / Left / Both hands pickers
- [x] Hand Over gallery card (walk up, hand a parcel over, wave)

- [x] Wardrobe as data (`outfit`): long or no sleeves, shorts, a skirt, a collar, a tie, an apron,
      a lab coat; the cast dressed with them, and six work cast members (doctor, cook, builder,
      courier, teacher, farmer); editor Sleeves / Below / Over / Collar / Tie

### 37D — Next, from the same pack
- [ ] Hug and help-up (two people, more than hands), sweeping and brushing as cycles
- [ ] More wardrobe: overalls, boots, a hoodie, a cardigan, a sari (the dressed-figures demo's)
- [ ] Furniture and scenery with targets (seat height, desk, bed, door), sky, sun, moon, clouds,
      rain, snow, wind; office, street, park and home scene presets
- [x] Animals: `lie` for every four-legged animal (head up, front paws forward; `lyingPose`), `glide`
      for birds (wings held out still, sinking toward `height`)
- [ ] Animals: perch contact, more species (goat, rabbit, squirrel, pigeon, duck, owl, parrot)
- [ ] Hair follow-through (swing with a turn or a run), a mouth with teeth and a tongue, foot shapes
- [ ] Wheelchair and cane as accessories, not part of an age

---

## Backlog / For Review

- [x] **Live demo controls no longer cut off** — a gallery card's live preview grows to fit its
  pickers, sliders and buttons (180px is now the minimum, not the size). Demos had also shared CSS class
  names (Dance Floor and Dressed Stick Figures both used `df-*`, so one restyled the other's canvas;
  likewise `df-wrap`, `im-hint`, `sg-grid`): renamed, and a test fails when two demos style the
  same class.

- [x] **Export Animation Document** — More → Export Animation Document downloads
  the scene's elements, tracks and canvas as one `*.animation.json`
  (`toAnimationDocument` in `src/editor/utils/animation-document.ts`). Export JSON
  writes the timeline alone, which another app cannot draw: YappyDraw's tinyfly
  import rebuilds the shapes from this file.
  - [ ] Import JSON… does not read Animation Documents yet (it expects a timeline).

- [x] **Docs CDN pins kept current** — five docs still pinned script tags to v0.66.0
  (only the README was bumped at release). All now name the current version, and a test
  (`llms-text.test.ts`) fails when a pinned CDN link in `docs/` or the README doesn't
  match `package.json`.

- [x] **Footer credit** — "SDD by Rajesh Pillai at Algorisys Technologies"
  (links to https://www.algorisys.com) in the studio status bar, the landing page
  footer and the README.

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

- [x] **BUG (fixed, [#1](https://github.com/algorisys-oss/tinyfly/issues/1)): typing
  into a text element's Content field stops after one character** — focus left
  the field after each keystroke. **Root cause:** every `updateElement` replaces
  the element object, and the Property panel's type-specific section was a
  reactive child of that object, so it was rebuilt on every edit, destroying the
  focused input. The field's 150 ms debounce only delayed it. Every text field in
  that section had the same problem (hex colour, font family, media URL, SVG path).
  - [x] Fixed: the section is keyed on the element's id + type and reads a
    live view of the selected element, so fields update in place.
  - [x] e2e `editor` check types slower than the debounce and asserts focus stays.

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

- 1711 tests passing across 99 files (`npx vitest run`); the per-area counts below date from 731 tests and are kept for history
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
