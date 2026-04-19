# behavier

> **Modular, type-safe TypeScript library for tracking user behavior in the browser.**

Behavier gives you first-class trackers for the most common UX analytics needs — pointer movement, dwell time, scroll depth, page visits, click counts, and element visibility — all with a consistent API and zero runtime dependencies.

---

## Packages

| Package | Description |
|---|---|
| [`@behavier/core`](packages/core) | Base types, `BaseTracker`, `EventEmitter`, `MemoryAdapter`, `LocalStorageAdapter` |
| [`@behavier/pointer`](packages/pointer) | `PointerTracker` (position + movement history), `DwellTracker` (idle time per zone) |
| [`@behavier/page`](packages/page) | `NavigationTracker` (URL visit counts + duration), `ScrollTracker` (position + depth %) |
| [`@behavier/interaction`](packages/interaction) | `ClickTracker` (click counts + coordinates), `VisibilityTracker` (in-viewport time) |
| [`behavier`](packages/behavier) | Main package — re-exports everything + `createBehavier()` factory |

---

## Quick start

```bash
npm install behavier
```

```ts
import { createBehavier } from 'behavier'

const b = createBehavier({
  pointer:    { autoStart: true },
  click:      { autoStart: true },
  navigation: { autoStart: true },
  scroll:     { autoStart: true },
})

b.pointer?.on('move', ({ x, y }) => console.log('cursor at', x, y))
b.click?.on('click', ({ target, count }) => console.log(target, 'clicked', count, 'times'))
b.navigation?.on('visit', ({ url, duration }) => console.log('left', url, 'after', duration, 'ms'))
b.scroll?.on('scroll', ({ depthPercent }) => console.log('scrolled to', depthPercent + '%'))
```

Or install individual packages if you only need a subset:

```bash
npm install @behavier/pointer
```

---

## Tracker reference

### PointerTracker (`@behavier/pointer`)

Tracks the current pointer position and records movement history.

```ts
import { PointerTracker } from '@behavier/pointer'

const tracker = new PointerTracker({ autoStart: true, maxSamples: 500 })

tracker.on('move', ({ x, y, timestamp }) => { /* ... */ })

tracker.position  // { x, y } — current position
tracker.history   // PointerSnapshot[] — movement log
```

Options:

| Option | Default | Description |
|---|---|---|
| `maxSamples` | `1000` | Max entries kept in memory |
| `minDistance` | `2` | Min px moved to record a new sample |

---

### DwellTracker (`@behavier/pointer`)

Emits `dwell` when the pointer is idle inside a defined zone for `threshold` ms.

```ts
import { DwellTracker } from '@behavier/pointer'

const dwell = new DwellTracker({
  autoStart: true,
  threshold: 1500,
  zones: [{ id: 'sidebar', rect: { top: 0, left: 900, width: 300, height: 800 } }],
})

dwell.on('dwell', ({ zoneId, duration }) => { /* ... */ })
dwell.addZone({ id: 'footer', rect: { top: 900, left: 0, width: 1200, height: 100 } })
```

---

### NavigationTracker (`@behavier/page`)

Counts URL visits and measures time spent per route. Works with SPAs (patches `history.pushState`).

```ts
import { NavigationTracker } from '@behavier/page'

const nav = new NavigationTracker({ autoStart: true })

nav.on('visit', ({ url, duration }) => { /* ... */ })
nav.visitCounts  // { '/home': 3, '/about': 1 }
nav.totalVisits  // 4
```

---

### ScrollTracker (`@behavier/page`)

Records scroll position and calculates scroll depth as a percentage of total page height.

```ts
import { ScrollTracker } from '@behavier/page'

const scroll = new ScrollTracker({ autoStart: true, throttleMs: 200 })

scroll.on('scroll', ({ x, y, depthPercent, maxDepthPercent }) => { /* ... */ })
scroll.maxDepth  // highest % reached
```

---

### ClickTracker (`@behavier/interaction`)

Counts clicks per DOM element and logs click coordinates.

```ts
import { ClickTracker } from '@behavier/interaction'

const clicks = new ClickTracker({ autoStart: true })

clicks.on('click', ({ target, count, x, y }) => { /* ... */ })
clicks.countFor('button#submit')  // 5
clicks.counts  // { 'button#submit': 5, 'a.nav-link': 2 }
```

---

### VisibilityTracker (`@behavier/interaction`)

Measures how long elements are visible in the viewport using `IntersectionObserver`.

```ts
import { VisibilityTracker } from '@behavier/interaction'

const vis = new VisibilityTracker({ autoStart: true, threshold: 0.5 })
vis.observe(document.querySelector('#hero')!, 'hero-section')

vis.on('hidden', ({ target, totalVisible }) => {
  console.log(target, 'was visible for', totalVisible, 'ms')
})
```

---

## Tracker lifecycle

Every tracker shares the same lifecycle API:

```ts
tracker.start()   // begin collecting
tracker.stop()    // pause (data preserved)
tracker.reset()   // stop + clear all data
tracker.isActive  // boolean

tracker.on('event', handler)  // returns unsubscribe function
```

---

## Storage adapters (`@behavier/core`)

```ts
import { MemoryAdapter, LocalStorageAdapter } from '@behavier/core'

// Default: in-memory (data lost on page unload)
new PointerTracker({ storage: new MemoryAdapter() })

// Persistent across reloads
new NavigationTracker({ storage: new LocalStorageAdapter('my-app') })
```

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
```

### Project structure

```
behavier/
├── packages/
│   ├── core/          # @behavier/core
│   ├── pointer/       # @behavier/pointer
│   ├── page/          # @behavier/page
│   ├── interaction/   # @behavier/interaction
│   └── behavier/      # behavier (main)
├── turbo.json
├── tsconfig.base.json
└── package.json
```

---

## License

MIT
