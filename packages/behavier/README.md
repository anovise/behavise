# behavier

> Modular, type-safe TypeScript library for tracking user behavior in the browser.

This is the main entry package. It re-exports everything from all `@behavier/*` packages and adds the `createBehavier()` factory for convenient one-call setup.

## Installation

```bash
npm install behavier
```

## Usage

```ts
import { createBehavier, LocalStorageAdapter } from 'behavier'

const b = createBehavier({
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
const b = createBehavier({
  pointer: { enabled: false }, // b.pointer === null
  click: { autoStart: true }, // b.click is a ClickTracker
})
```

## `createBehavier` options

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

`behavier` re-exports everything from:

- `@behavier/core` — types, `EventDispatcher`, `BaseTracker`, storage adapters
- `@behavier/pointer` — `PointerTracker`, `DwellTracker`
- `@behavier/page` — `NavigationTracker`, `ScrollTracker`
- `@behavier/interaction` — `ClickTracker`, `VisibilityTracker`

You can import any symbol directly from `behavier`:

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
  createBehavier,
} from 'behavier'
```

## License

MIT
