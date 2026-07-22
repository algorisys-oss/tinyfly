# Release Notes

This directory contains release notes for each version of tinyfly.

## Format

Each release has its own markdown file named `v{MAJOR}.{MINOR}.{PATCH}.md`.

Release notes follow [Keep a Changelog](https://keepachangelog.com/) conventions:

- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Vulnerability fixes

## Versioning

tinyfly follows [Semantic Versioning](https://semver.org/):

- **MAJOR** - Incompatible API changes
- **MINOR** - Backwards-compatible new features
- **PATCH** - Backwards-compatible bug fixes

## Releases

| Version | Date | Highlights |
|---------|------|------------|
| [v0.45.1](v0.45.1.md) | 2026-07-22 | Pen-tool polish — Backspace undoes the last point; first-anchor close-hover cue |
| [v0.45.0](v0.45.0.md) | 2026-07-22 | Pen tool — ✒️ click/drag to draw custom bezier paths; completes Phase C |
| [v0.44.0](v0.44.0.md) | 2026-07-22 | Sprite-sheet export — every frame in one PNG grid + JSON metadata for game engines |
| [v0.43.0](v0.43.0.md) | 2026-07-22 | Shape morphing — 🌀 tween one path into another; engine-level path interpolation, renders everywhere |
| [v0.42.0](v0.42.0.md) | 2026-07-22 | Phase C: polygon & star shapes — ⬡/★ parametric shapes (sides/points/inner %), resizable, export everywhere |
| [v0.41.0](v0.41.0.md) | 2026-07-22 | Rulers & draggable guides — 📏 pull guide lines out of the rulers; elements snap to them |
| [v0.40.0](v0.40.0.md) | 2026-07-22 | Resize snapping — the dragged edge/corner snaps to grid/elements/artboard (Shift-aspect-lock disables) |
| [v0.39.0](v0.39.0.md) | 2026-07-22 | Grid & snapping — ▦ grid overlay + 🧲 snap dragged elements to grid/edges/centre with pink guides |
| [v0.38.0](v0.38.0.md) | 2026-07-22 | Onion skinning — 🧅 faint ghost frames before/after the playhead (Canvas renderer) |
| [v0.37.0](v0.37.0.md) | 2026-07-22 | On-stage camera pan (✋ Pan drag) + a dedicated 🎥 Camera lane at the top of the timeline |
| [v0.36.0](v0.36.0.md) | 2026-07-22 | Camera inspector — pan/zoom/rotate the stage from the Property Panel, keyframed at the playhead |
| [v0.35.1](v0.35.1.md) | 2026-07-22 | Camera demo samples (Push In, Pan Across, Orbit Reveal) in a new Camera category |
| [v0.35.0](v0.35.0.md) | 2026-07-22 | Camera everywhere — Canvas/SVG previews, raster export, and embeds (single + multi-scene) |
| [v0.34.0](v0.34.0.md) | 2026-07-22 | Phase B starts: Camera — animate pan/zoom/rotate of the whole stage (DOM preview) |
| [v0.33.0](v0.33.0.md) | 2026-07-22 | Multi-scene sequence embeds animate symbols too (sequencer runs nested timelines) |
| [v0.32.0](v0.32.0.md) | 2026-07-22 | Animated symbols in single-scene embeds — the player runs each instance's nested timeline |
| [v0.31.1](v0.31.1.md) | 2026-07-22 | Symbol instances now render in the SVG preview too (were DOM + Canvas only) |
| [v0.31.0](v0.31.0.md) | 2026-07-22 | Top toolbar: More overflow menu + merged the two Export buttons (one row, no wrapping) |
| [v0.30.0](v0.30.0.md) | 2026-07-22 | Collapsible Elements/Tracks/Library panels + working timeline resizer (real range on short windows) |
| [v0.29.0](v0.29.0.md) | 2026-07-22 | Reclaim top vertical space: collapsible AI prompt bar, auto-hiding scene bar, slimmer header |
| [v0.28.4](v0.28.4.md) | 2026-07-22 | Fix: Dope Sheet track list now scrolls (was clipping rows) |
| [v0.28.3](v0.28.3.md) | 2026-07-22 | Timeline Expand button now truly maximizes (hides preview) for a full timeline view on any window height |
| [v0.28.2](v0.28.2.md) | 2026-07-22 | Fix demo animation (missing box element) + timeline pane clipping its rows on short windows |
| [v0.28.1](v0.28.1.md) | 2026-07-22 | Taller/resizable/persistent timeline pane + one-click Expand (fixes the cramped bottom pane) |
| [v0.28.0](v0.28.0.md) | 2026-07-22 | Symbols animate in export — GIF/WebP/MP4 bake in a symbol's nested animation and swaps (lip-sync) |
| [v0.27.0](v0.27.0.md) | 2026-07-22 | Symbol swap (lip-sync) — a swap set + swapIndex track animates which symbol an instance shows |
| [v0.26.0](v0.26.0.md) | 2026-07-22 | Symbols render everywhere — instances flatten into raster export, embeds, thumbnails, and the Canvas preview |
| [v0.25.0](v0.25.0.md) | 2026-07-22 | Nested symbol playback — a symbol's own timeline animates inside every instance, synced to the scene playhead |
| [v0.24.0](v0.24.0.md) | 2026-07-22 | Symbol edit-in-place: double-click an instance to edit the symbol; a breadcrumb + save-to-definition so all instances update |
| [v0.23.0](v0.23.0.md) | 2026-07-22 | Symbols + Library (Phase A): convert selection to a reusable symbol, place instances, DOM-preview rendering |
| [v0.22.0](v0.22.0.md) | 2026-07-22 | Box-select in both timeline views, a curve Overlay (shared-axis) mode, and per-scene tab thumbnails |
| [v0.21.0](v0.21.0.md) | 2026-07-22 | Timeline zoom & scroll (both views), value-holding keyframe add, and a beginner-first docs overhaul |
| [v0.20.0](v0.20.0.md) | 2026-07-22 | Curves (graph) timeline editor — eased curves, 2D point drag, draggable easing handles; horizontal-overflow white-strip fix |
| [v0.19.1](v0.19.1.md) | 2026-07-22 | Live gallery thumbnails (refresh while editing) and a complete file-format reference for integrations |
| [v0.19.0](v0.19.0.md) | 2026-07-22 | My Animations gallery (IndexedDB persistence, thumbnails, open/duplicate/delete) and collapsible side panels |
| [v0.18.0](v0.18.0.md) | 2026-07-22 | Name your export file (all five formats, sanitized, defaults to the project name) and a BETA badge |
| [v0.17.0](v0.17.0.md) | 2026-07-22 | Real raster export (animated GIF fixed, new animated WebP, deterministic MP4 via WebCodecs); project artboard background; reload-doesn't-play fix |
| [v0.16.0](v0.16.0.md) | 2026-07-18 | AI animation generation (prompt → editable timeline; OpenAI/Gemini/Anthropic, BYO key) and Esc-closes-any-dialog |
| [v0.15.0](v0.15.0.md) | 2026-07-11 | Video export fidelity: object-fit (cover/contain) + rounded corners for image/video layers |
| [v0.14.0](v0.14.0.md) | 2026-07-11 | Video export composites image & video layers (device screens captured, seeked in sync) |
| [v0.13.0](v0.13.0.md) | 2026-07-11 | Unified undo/redo across the timeline and scene elements (drags collapse to one step) |
| [v0.12.0](v0.12.0.md) | 2026-07-11 | MP4/WebM video export, stroke write-on on the DOM renderer, and a resizable preview/timeline split |
| [v0.11.0](v0.11.0.md) | 2026-07-11 | Device-frame preset (Phone/Landscape/Tablet with a rounded video screen) and a reload-button version chip |
| [v0.10.0](v0.10.0.md) | 2026-07-11 | Canvas-aware preview (any aspect ratio, e.g. vertical 9:16) and a "Draw · Guess · Repeat" promo sample |
| [v0.9.0](v0.9.0.md) | 2026-07-08 | Fit-to-view preview stage and a full-window Maximize mode |
| [v0.8.0](v0.8.0.md) | 2026-07-08 | Keyframe multi-select, copy/paste, and batch delete |
| [v0.7.0](v0.7.0.md) | 2026-07-08 | Video element and audio/video in embeds (player auto-syncs media) |
| [v0.6.0](v0.6.0.md) | 2026-07-08 | NPM engine package, CDN player bundle, audio/video sync, shine on all renderers |
| [v0.5.0](v0.5.0.md) | 2026-07-08 | Animatable filters (blur/glow/drop-shadow) and text shine sweep |
| [v0.4.0](v0.4.0.md) | 2026-07-08 | Text animation: per-letter stagger, typewriter, clip/mask reveal; sidebar scrollbar fixes |
| [v0.3.1](v0.3.1.md) | 2026-07-07 | Fix double scrollbar on the editor left panel |
| [v0.3.0](v0.3.0.md) | 2026-07-07 | Algorisys product showcase samples, version-chip hard reload |
| [v0.2.0](v0.2.0.md) | 2026-02-08 | Scene transitions, multi-scene sequencer, documentation, in-app docs viewer |
| [v0.1.0](v0.1.0.md) | 2026-02-04 | Initial release with core engine, editor, and player |

## Contributing

When preparing a release:

1. Create a new file `v{version}.md` in this directory
2. Follow the template format from existing releases
3. Update the releases table above
4. Tag the release in git: `git tag v{version}`
