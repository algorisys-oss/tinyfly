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
