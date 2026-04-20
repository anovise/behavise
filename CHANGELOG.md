# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [0.1.0] — 2025-01-01

### Added

- **`@anovise/behavise-core`** — foundational package
  - `EventDispatcher<Events>` — type-safe pub/sub event emitter
  - `BaseTracker<Events>` — abstract base class with `start / stop / reset / isActive` lifecycle
  - `MemoryAdapter` — in-memory `StorageAdapter` implementation
  - `LocalStorageAdapter` — `localStorage`-backed `StorageAdapter` with namespace key prefix
  - Core types: `EventMap`, `EventListener`, `Dispatcher`, `StorageAdapter`, `TrackerOptions`, `Tracker`, `Point`, `BoundingRect`, `Timestamped`

- **`@anovise/behavise-pointer`** — pointer input tracking
  - `PointerTracker` — records `mousemove` events into a capped `PointerSnapshot[]` history; exposes current `position`
  - `DwellTracker` — fires `dwell` when pointer is idle inside a registered zone for ≥ `threshold` ms; supports dynamic `addZone()` / `removeZone()`

- **`@anovise/behavise-page`** — page navigation and scroll tracking
  - `NavigationTracker` — patches `history.pushState` / `replaceState`; counts URL visits and measures time-on-page
  - `ScrollTracker` — throttled scroll event tracking with `depthPercent` and `maxDepthPercent` calculation

- **`@anovise/behavise-interaction`** — user interaction tracking
  - `ClickTracker` — counts clicks per element with a customizable `resolveTarget` resolver; exposes `counts` map and `records` log
  - `VisibilityTracker` — wraps `IntersectionObserver` to measure total in-viewport time per observed element

- **`@anovise/behavise`** — main entry package
  - Re-exports all `@anovise/behavise-*` symbols
  - `createBehavise(options?)` factory — creates a pre-configured `BehaviseInstance` with all desired trackers; includes `startAll / stopAll / resetAll` convenience methods

- **`apps/example`** — interactive showcase (Vite + Vanilla TypeScript)
  - Live demonstration of all six trackers in a single-page app
  - Deployable to GitHub Pages at `anovise.github.io/showcase/behavise`

- **Development tooling**
  - Turborepo monorepo with `build`, `test`, `type-check`, `dev`, `format` pipelines
  - Vitest + jsdom unit tests for all five packages (134 tests)
  - Prettier code formatting
  - `scripts/deploy.sh` — deploys the showcase to the `gh-pages` branch

[Unreleased]: https://github.com/anovise/behavise/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/anovise/behavise/releases/tag/v0.1.0
