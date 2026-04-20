# Contributing to Behavise

Thank you for taking the time to contribute! 🎉

Behavise is created by [Reas Vyn](https://github.com/reasvyn) and maintained by [Anovise](https://github.com/anovise).

This document covers everything you need to know to go from zero to a merged pull request.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Workflow](#workflow)
- [Coding Guidelines](#coding-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Contact](#contact)

---

## Code of Conduct

By participating in this project you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

---

## Getting Started

1. **Fork** the repository and clone your fork.
2. Create a new branch from `main` for your change.
3. Make your changes, add tests, and verify everything passes.
4. Open a pull request against `main`.

---

## Development Setup

**Prerequisites:** Node.js ≥ 18, npm ≥ 10.

```bash
# Clone your fork
git clone https://github.com/<your-username>/behavise.git
cd behavise

# Install all workspace dependencies
npm install

# Build all packages (required before running tests)
npm run build

# Run all tests
npm run test

# Type-check all packages
npm run type-check

# Watch mode (rebuilds on file change)
npm run dev
```

---

## Project Structure

```
behavise/
├── packages/
│   ├── core/          # @anovise/behavise-core — BaseTracker, EventDispatcher, storage adapters
│   ├── pointer/       # @anovise/behavise-pointer — PointerTracker, DwellTracker
│   ├── page/          # @anovise/behavise-page — NavigationTracker, ScrollTracker
│   ├── interaction/   # @anovise/behavise-interaction — ClickTracker, VisibilityTracker
│   └── behavise/      # behavise — main entry point, createBehavise() factory
├── turbo.json
├── tsconfig.base.json
└── package.json
```

Each package is independently buildable and published. Changes to `@anovise/behavise-core` may affect all other packages.

---

## Workflow

| Step            | Command              |
| --------------- | -------------------- |
| Build all       | `npm run build`      |
| Test all        | `npm run test`       |
| Type-check      | `npm run type-check` |
| Lint            | `npm run lint`       |
| Clean artifacts | `npm run clean`      |

> Turbo caches task outputs — clean with `npm run clean` if you see stale results.

---

## Coding Guidelines

- **TypeScript strict mode** is enforced (`strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`). Do not disable any compiler flags.
- **Zero runtime dependencies** — the library must remain dependency-free. DevDependencies are fine.
- **Target ES2017** — do not use language features unavailable in ES2017.
- All new public API surface must be **documented with JSDoc**.
- All new trackers must extend `BaseTracker` from `@anovise/behavise-core` and implement `_attach()`, `_detach()`, and optionally `_reset()`.
- Prefer `readonly` arrays and objects for public getters.
- Use `passive: true` for scroll/pointer/touch event listeners.
- Keep each file focused on a single class or concern.

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`

**Scopes:** `core`, `pointer`, `page`, `interaction`, `behavise`, `deps`, `release`

**Examples:**

```
feat(pointer): add touchmove support to PointerTracker
fix(page): correct scroll depth calculation for custom targets
docs: update ClickTracker usage example in README
test(core): add unit tests for EventDispatcher
```

---

## Pull Request Process

1. Ensure `npm run build`, `npm run test`, and `npm run type-check` all pass locally.
2. Update documentation (README, JSDoc) if you changed public API.
3. Add or update tests for any changed behaviour.
4. Fill in the PR template completely.
5. A maintainer will review your PR. Please be patient — we are a small team.
6. Address review comments and push updates to the same branch.
7. Once approved, a maintainer will squash-merge your PR.

### What gets merged

- Bug fixes with a test that reproduces the issue ✅
- New trackers or features with tests and docs ✅
- Performance improvements with benchmarks or clear reasoning ✅
- Refactors that reduce complexity without breaking the public API ✅

### What does not get merged

- Changes that add runtime dependencies ❌
- Changes that break existing public API without a major version bump ❌
- PRs without tests for new behaviour ❌

---

## Reporting Bugs

Please use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml) issue template. Include:

- A minimal reproduction (code snippet or repository link)
- Your environment (browser, OS, Node.js version)
- Expected vs. actual behaviour

---

## Suggesting Features

Please use the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml) issue template. Describe:

- The problem you're trying to solve
- Your proposed solution
- Alternatives you considered

---

## Contact

For questions that don't fit an issue, reach out at **reasvyn@gmail.com**.
