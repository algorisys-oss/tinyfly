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
