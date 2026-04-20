# behavise

> Modular, type-safe TypeScript library for tracking user behavior in the browser.

This is the main entry package. It re-exports everything from all `@anovise/behavise-*` packages and adds the `createBehavise()` factory for convenient one-call setup.

## Installation

```bash
npm install @anovise/behavise
```

## Usage

```ts
import { createBehavise, LocalStorageAdapter } from '@anovise/behavise'

const b = createBehavise({
  storage: new LocalStorageAdapter('my-app'),

  pointer: { autoStart: true, maxSamples: 500 },
  dwell: { autoStart: true, threshold: 1500 },
  navigation: { autoStart: true },
  scroll: { autoStart: true, throttleMs: 100 },
  click: { autoStart: true },
  visibility: { threshold: 0.5 },
})

b.pointer?.on('move', ({ x, y }) => console.log(x, y))
b.click?.on('click', ({ target, count }) => console.log(target, count))
b.navigation?.on('visit', ({ url, duration }) => console.log(url, duration))
b.scroll?.on('scroll', ({ depthPercent }) => console.log(depthPercent))

// Lifecycle shortcuts
b.startAll() // start all enabled trackers
b.stopAll() // pause all
b.resetAll() // stop + clear all data
```

### Disabling a tracker

Set `enabled: false` on any tracker key — the corresponding property on the instance will be `null`:

```ts
const b = createBehavise({
  pointer: { enabled: false }, // b.pointer === null
  click: { autoStart: true }, // b.click is a ClickTracker
})
```

## `createBehavise` options

| Key          | Type                                      | Description                                    |
| ------------ | ----------------------------------------- | ---------------------------------------------- |
| `storage`    | `StorageAdapter`                          | Shared storage adapter passed to every tracker |
| `pointer`    | `PointerTrackerOptions & { enabled? }`    | Options for `PointerTracker`                   |
| `dwell`      | `DwellTrackerOptions & { enabled? }`      | Options for `DwellTracker`                     |
| `navigation` | `NavigationTrackerOptions & { enabled? }` | Options for `NavigationTracker`                |
| `scroll`     | `ScrollTrackerOptions & { enabled? }`     | Options for `ScrollTracker`                    |
| `click`      | `ClickTrackerOptions & { enabled? }`      | Options for `ClickTracker`                     |
| `visibility` | `VisibilityTrackerOptions & { enabled? }` | Options for `VisibilityTracker`                |

## Re-exports

`@anovise/behavise` re-exports everything from:

- `@anovise/behavise-core` — types, `EventDispatcher`, `BaseTracker`, storage adapters
- `@anovise/behavise-pointer` — `PointerTracker`, `DwellTracker`
- `@anovise/behavise-page` — `NavigationTracker`, `ScrollTracker`
- `@anovise/behavise-interaction` — `ClickTracker`, `VisibilityTracker`

You can import any symbol directly from `@anovise/behavise`:

```ts
import {
  PointerTracker,
  DwellTracker,
  NavigationTracker,
  ScrollTracker,
  ClickTracker,
  VisibilityTracker,
  EventDispatcher,
  MemoryAdapter,
  LocalStorageAdapter,
  createBehavise,
} from '@anovise/behavise'
```

## License

MIT
