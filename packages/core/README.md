# @behavier/core

> Foundation types, base tracker, event dispatcher, and storage adapters for the **behavier** library.

## Installation

```bash
npm install @behavier/core
```

## What's inside

### `EventDispatcher<Events>`

A lightweight, type-safe pub/sub event emitter. All trackers extend this class.

```ts
import { EventDispatcher } from '@behavier/core'

type MyEvents = { click: { x: number; y: number }; reset: void }

const bus = new EventDispatcher<MyEvents>()

const off = bus.on('click', ({ x, y }) => console.log(x, y))
bus.once('reset', () => console.log('reset!'))
bus.emit('click', { x: 10, y: 20 })
off() // unsubscribe
bus.removeAllListeners('click')
```

### `BaseTracker<Events>`

Abstract base class for all trackers. Manages `start` / `stop` / `reset` lifecycle and delegates event dispatch to the internal `EventDispatcher`.

Subclasses must implement:

- `_attach()` — add DOM listeners
- `_detach()` — remove DOM listeners
- `_reset()` — clear internal state (call `super._reset()` first)

### Storage adapters

| Class                 | Description                                              |
| --------------------- | -------------------------------------------------------- |
| `MemoryAdapter`       | In-memory store (default; data cleared on page unload)   |
| `LocalStorageAdapter` | Persists data in `localStorage` under a namespace prefix |

```ts
import { MemoryAdapter, LocalStorageAdapter } from '@behavier/core'

const mem = new MemoryAdapter()
const ls = new LocalStorageAdapter('my-app') // keys prefixed as "my-app:..."
```

Implement `StorageAdapter` to add your own backend (IndexedDB, remote API, etc.).

### Core types

| Type / Interface     | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `EventMap`           | `Record<string, unknown>` — constraint for event types |
| `EventListener<T>`   | `(payload: T) => void`                                 |
| `Dispatcher<Events>` | Interface for `EventDispatcher`                        |
| `StorageAdapter`     | Interface for storage backends                         |
| `TrackerOptions`     | Base options: `autoStart?`, `namespace?`, `storage?`   |
| `Tracker`            | Interface with `start / stop / reset / isActive`       |
| `Point`              | `{ x: number; y: number }`                             |
| `BoundingRect`       | `{ top, left, width, height }`                         |
| `Timestamped`        | `{ timestamp: number }`                                |

## License

MIT
