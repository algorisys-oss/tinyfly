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

- 645 tests passing
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
- Editor store: 6 tests (staggered presets)
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
