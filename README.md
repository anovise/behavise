# behavise

> **Modular, type-safe TypeScript library for tracking user behavior in the browser.**

Behavise gives you first-class trackers for the most common UX analytics needs — pointer movement, dwell time, scroll depth, page visits, click counts, and element visibility — all with a consistent API, zero runtime dependencies, and full TypeScript support.

Created by [Reas Vyn](https://github.com/reasvyn) and maintained by [Anovise](https://github.com/anovise).

[![npm](https://img.shields.io/npm/v/%40anovise%2Fbehavise)](https://www.npmjs.com/package/@anovise/behavise)
[![license](https://img.shields.io/github/license/anovise/behavise)](LICENSE)

---

## Packages

| Package                                         | Description                                                                             |
| ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| [`@anovise/behavise-core`](packages/core)               | Base types, `BaseTracker`, `EventDispatcher`, `MemoryAdapter`, `LocalStorageAdapter`    |
| [`@anovise/behavise-pointer`](packages/pointer)         | `PointerTracker` (position + movement history), `DwellTracker` (idle time per zone)     |
| [`@anovise/behavise-page`](packages/page)               | `NavigationTracker` (URL visit counts + duration), `ScrollTracker` (position + depth %) |
| [`@anovise/behavise-interaction`](packages/interaction) | `ClickTracker` (click counts + coordinates), `VisibilityTracker` (in-viewport time)     |
| [`@anovise/behavise`](packages/behavise)        | Main package — re-exports everything + `createBehavise()` factory                       |

---

## Quick start

```bash
npm install @anovise/behavise
```

```ts
import { createBehavise } from '@anovise/behavise'

const b = createBehavise({
  pointer: { autoStart: true },
  click: { autoStart: true },
  navigation: { autoStart: true },
  scroll: { autoStart: true, throttleMs: 200 },
})

b.pointer?.on('move', ({ x, y }) => console.log('cursor at', x, y))
b.click?.on('click', ({ target, count }) => console.log(target, 'clicked', count, 'times'))
b.navigation?.on('visit', ({ url, duration }) => console.log('left', url, 'after', duration, 'ms'))
b.scroll?.on('scroll', ({ depthPercent }) => console.log('scrolled to', depthPercent + '%'))
```

Or install individual packages if you only need a subset:

```bash
npm install @anovise/behavise-pointer
npm install @anovise/behavise-page
npm install @anovise/behavise-interaction
```

---

## Tracker reference

### `createBehavise(options?)` — `@anovise/behavise`

Creates a single instance containing all desired trackers. Each tracker key accepts the tracker's own options plus an `enabled` flag.

```ts
import { createBehavise } from '@anovise/behavise'

const b = createBehavise({
  storage: new LocalStorageAdapter('my-app'), // shared storage for all trackers
  pointer: { autoStart: true, maxSamples: 500 },
  dwell: { autoStart: true, threshold: 1500, zones: [] },
  navigation: { autoStart: true },
  scroll: { autoStart: true, throttleMs: 100 },
  click: { autoStart: true },
  visibility: { threshold: 0.5 },
})

b.startAll() // start all enabled trackers
b.stopAll() // pause all
b.resetAll() // stop + clear data on all
```

**`BehaviseOptions`**

| Key          | Type                                      | Description                                    |
| ------------ | ----------------------------------------- | ---------------------------------------------- |
| `storage`    | `StorageAdapter`                          | Shared storage adapter passed to every tracker |
| `pointer`    | `PointerTrackerOptions & { enabled? }`    | Options for `PointerTracker`                   |
| `dwell`      | `DwellTrackerOptions & { enabled? }`      | Options for `DwellTracker`                     |
| `navigation` | `NavigationTrackerOptions & { enabled? }` | Options for `NavigationTracker`                |
| `scroll`     | `ScrollTrackerOptions & { enabled? }`     | Options for `ScrollTracker`                    |
| `click`      | `ClickTrackerOptions & { enabled? }`      | Options for `ClickTracker`                     |
| `visibility` | `VisibilityTrackerOptions & { enabled? }` | Options for `VisibilityTracker`                |

Set `enabled: false` on any tracker key to exclude it (the property will be `null`).

---

### `PointerTracker` — `@anovise/behavise-pointer`

Tracks the current pointer position and records a capped movement history.

```ts
import { PointerTracker } from '@anovise/behavise-pointer'

const tracker = new PointerTracker({ autoStart: true, maxSamples: 500 })

tracker.on('move', ({ x, y, timestamp }) => {
  /* ... */
})

console.log(tracker.position) // { x: 120, y: 340 } — latest position
console.log(tracker.history) // PointerSnapshot[] — up to maxSamples entries
```

**Options**

| Option        | Type      | Default | Description                               |
| ------------- | --------- | ------- | ----------------------------------------- |
| `maxSamples`  | `number`  | `1000`  | Maximum entries kept in the history array |
| `minDistance` | `number`  | `2`     | Minimum px moved to record a new sample   |
| `autoStart`   | `boolean` | `false` | Start tracking on construction            |

**Events**

| Event  | Payload                                   |
| ------ | ----------------------------------------- |
| `move` | `{ x, y, timestamp }` (`PointerSnapshot`) |

---

### `DwellTracker` — `@anovise/behavise-pointer`

Emits `dwell` when the pointer stays idle inside a defined zone for at least `threshold` ms.

```ts
import { DwellTracker } from '@anovise/behavise-pointer'

const dwell = new DwellTracker({
  autoStart: true,
  threshold: 1500,
  tolerance: 10,
  zones: [{ id: 'sidebar', rect: { top: 0, left: 900, width: 300, height: 800 } }],
})

dwell.on('dwell', ({ zoneId, duration, timestamp }) => {
  /* ... */
})

// Dynamic zone management
dwell.addZone({ id: 'footer', rect: { top: 900, left: 0, width: 1200, height: 100 } })
dwell.removeZone('sidebar')
```

**Options**

| Option      | Type          | Default | Description                                            |
| ----------- | ------------- | ------- | ------------------------------------------------------ |
| `threshold` | `number`      | `1000`  | ms the pointer must be idle before a dwell event fires |
| `tolerance` | `number`      | `5`     | Max px drift still considered "idle"                   |
| `zones`     | `DwellZone[]` | `[]`    | Initial zones; add more at runtime with `addZone()`    |
| `autoStart` | `boolean`     | `false` | Start tracking on construction                         |

**Events**

| Event   | Payload                                           |
| ------- | ------------------------------------------------- |
| `dwell` | `{ zoneId, duration, timestamp }` (`DwellRecord`) |

---

### `NavigationTracker` — `@anovise/behavise-page`

Counts URL visits and measures time spent per route. Works with SPAs by patching `history.pushState` and `history.replaceState`.

```ts
import { NavigationTracker } from '@anovise/behavise-page'

const nav = new NavigationTracker({ autoStart: true })

nav.on('visit', ({ url, duration }) => {
  /* duration is null for the first page */
})

console.log(nav.visitCounts) // { '/home': 3, '/about': 1 }
console.log(nav.totalVisits) // 4
```

**Options**

| Option      | Type      | Default | Description                    |
| ----------- | --------- | ------- | ------------------------------ |
| `autoStart` | `boolean` | `false` | Start tracking on construction |

**Events**

| Event   | Payload                                                |
| ------- | ------------------------------------------------------ |
| `visit` | `{ url: string, duration: number \| null, timestamp }` |

---

### `ScrollTracker` — `@anovise/behavise-page`

Records scroll position and calculates scroll depth as a percentage of total page height.

```ts
import { ScrollTracker } from '@anovise/behavise-page'

const scroll = new ScrollTracker({ autoStart: true, throttleMs: 200 })

scroll.on('scroll', ({ x, y, depthPercent, maxDepthPercent, timestamp }) => {
  /* ... */
})

console.log(scroll.maxDepth) // highest depth % reached in this session
```

**Options**

| Option       | Type      | Default | Description                       |
| ------------ | --------- | ------- | --------------------------------- |
| `throttleMs` | `number`  | `200`   | Min ms between consecutive events |
| `autoStart`  | `boolean` | `false` | Start tracking on construction    |

**Events**

| Event    | Payload                                                                 |
| -------- | ----------------------------------------------------------------------- |
| `scroll` | `{ x, y, depthPercent, maxDepthPercent, timestamp }` (`ScrollSnapshot`) |

---

### `ClickTracker` — `@anovise/behavise-interaction`

Counts clicks per DOM element and records click coordinates.

```ts
import { ClickTracker } from '@anovise/behavise-interaction'

const clicks = new ClickTracker({
  autoStart: true,
  resolveTarget: (el) => el.getAttribute('data-track') ?? el.tagName.toLowerCase(),
})

clicks.on('click', ({ target, count, x, y, timestamp }) => {
  /* ... */
})

console.log(clicks.countFor('button#submit')) // 5
console.log(clicks.counts) // { 'button#submit': 5, 'a.nav-link': 2 }
```

**Options**

| Option          | Type                      | Default                      | Description                                      |
| --------------- | ------------------------- | ---------------------------- | ------------------------------------------------ |
| `resolveTarget` | `(el: Element) => string` | tag + `#id` / `.class` combo | Derives the label stored for the clicked element |
| `autoStart`     | `boolean`                 | `false`                      | Start tracking on construction                   |

**Events**

| Event   | Payload                                              |
| ------- | ---------------------------------------------------- |
| `click` | `{ target, count, x, y, timestamp }` (`ClickRecord`) |

---

### `VisibilityTracker` — `@anovise/behavise-interaction`

Measures how long observed elements are visible in the viewport using `IntersectionObserver`.

```ts
import { VisibilityTracker } from '@anovise/behavise-interaction'

const vis = new VisibilityTracker({ autoStart: true, threshold: 0.5 })

// Observe elements individually (start() must be called first)
vis.observe(document.querySelector('#hero')!, 'hero-section')
vis.observe(document.querySelector('#pricing')!, 'pricing')

vis.on('visible', ({ target, label }) => console.log(label, 'entered viewport'))
vis.on('hidden', ({ target, totalVisible, label }) =>
  console.log(label, 'visible for', totalVisible, 'ms'),
)
```

**Options**

| Option      | Type      | Default | Description                                                         |
| ----------- | --------- | ------- | ------------------------------------------------------------------- |
| `threshold` | `number`  | `0`     | `IntersectionObserver` threshold (0–1, fraction of element visible) |
| `autoStart` | `boolean` | `false` | Start tracking on construction                                      |

**Events**

| Event     | Payload                                                               |
| --------- | --------------------------------------------------------------------- |
| `visible` | `{ target: Element, label: string, timestamp }`                       |
| `hidden`  | `{ target: Element, label: string, totalVisible: number, timestamp }` |

---

## Tracker lifecycle

Every tracker shares the same lifecycle interface:

```ts
tracker.start() // begin collecting events
tracker.stop() // pause without clearing data
tracker.reset() // stop + clear all collected data
tracker.isActive // boolean — whether the tracker is currently running

const unsub = tracker.on('event', handler)
unsub() // remove the listener
tracker.off('event', handler) // alternative removal
```

---

## Event system

Each tracker extends `EventDispatcher`, which provides a type-safe pub/sub interface. You can also use `EventDispatcher` directly in your own classes:

```ts
import { EventDispatcher } from '@anovise/behavise-core'

type MyEvents = { ping: { id: number }; pong: string }

const bus = new EventDispatcher<MyEvents>()

const off = bus.on('ping', ({ id }) => console.log('ping', id))
bus.once('pong', (msg) => console.log('pong', msg))
bus.emit('ping', { id: 1 })
off() // unsubscribe
bus.removeAllListeners('ping') // or remove all at once
```

---

## Storage adapters

By default, all trackers store data in-memory (cleared on page unload). Use `LocalStorageAdapter` for persistence across reloads:

```ts
import { MemoryAdapter, LocalStorageAdapter } from '@anovise/behavise-core'

// In-memory (default)
new PointerTracker({ storage: new MemoryAdapter() })

// Persisted in localStorage under the given namespace prefix
new NavigationTracker({ storage: new LocalStorageAdapter('my-app') })

// Shared adapter across all trackers (via createBehavise)
const b = createBehavise({ storage: new LocalStorageAdapter('analytics') })
```

You can implement the `StorageAdapter` interface to plug in any custom store (e.g. IndexedDB, a remote API):

```ts
import type { StorageAdapter } from '@anovise/behavise-core'

class MyAdapter implements StorageAdapter {
  get<T>(key: string): T | undefined {
    /* ... */
  }
  set<T>(key: string, value: T): void {
    /* ... */
  }
  delete(key: string): void {
    /* ... */
  }
  clear(): void {
    /* ... */
  }
  keys(): string[] {
    /* ... */
  }
}
```

---

## TypeScript

Behavise is written in strict TypeScript. All event payloads are fully typed:

```ts
import { ClickTracker } from '@anovise/behavise-interaction'

const tracker = new ClickTracker({ autoStart: true })

// 'data' is inferred as ClickRecord — no casts needed
tracker.on('click', (data) => {
  console.log(data.target, data.count, data.x, data.y)
})
```

The library is compatible with `"strict": true` (including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`). It ships both ESM and CJS builds with bundled `.d.ts` declaration files.

**Browser support:** Behavise targets browsers supporting ES2017+ (Chrome 58, Firefox 52, Safari 10.1, Edge 16). `VisibilityTracker` additionally requires `IntersectionObserver` support (all modern browsers; polyfill available).

---

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run all tests
npm run test

# Type-check all packages
npm run type-check

# Watch mode (rebuild on change)
npm run dev

# Format code with Prettier
npm run format

# Check formatting
npm run format:check
```

### Project structure

```
behavise/
├── apps/
│   └── example/          # Showcase app (Vite + Vanilla TS)
├── packages/
│   ├── core/             # @anovise/behavise-core
│   ├── pointer/          # @anovise/behavise-pointer
│   ├── page/             # @anovise/behavise-page
│   ├── interaction/      # @anovise/behavise-interaction
│   └── behavise/         # @anovise/behavise (main entry + factory)
├── turbo.json
├── tsconfig.base.json
└── package.json
```

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

---

## License

MIT
