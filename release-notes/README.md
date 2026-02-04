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
| [v0.1.0](v0.1.0.md) | 2026-02-04 | Initial release with core engine, editor, and player |

## Contributing

When preparing a release:

1. Create a new file `v{version}.md` in this directory
2. Follow the template format from existing releases
3. Update the releases table above
4. Tag the release in git: `git tag v{version}`
