# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Production documentation suite: `README.md` (with architecture diagram),
  `AUDIT.md`, `LICENSE` (MIT), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
  `SECURITY.md`, and `CHANGELOG.md`.
- Editor/tooling config: `.editorconfig`, `.prettierrc.json`.
- GitHub community files: bug & feature issue templates, pull request template,
  and Dependabot configuration.
- Full CI pipeline (`install`, `typecheck`, `build`, `test`) for every PR.
- Automated unit tests covering the public agent contract.

### Changed
- Package `license` field set to `MIT` to match the new `LICENSE`.
- Repository documentation upgraded to production quality.

### Fixed
- CI now runs a real `build` step and fails on test failure (no silent pass).

## [1.0.0] - 2026-08-02

### Added
- Initial scaffold: agent manifest, mount/unmount lifecycle, intent routing,
  typecheck workflow, and committed `dist/` build output.
