# @anovise/behavise-pointer

> Pointer position tracking and dwell-time zone detection for the **behavise** library.

## Installation

```bash
npm install @anovise/behavise-pointer
```

## Trackers

### `PointerTracker`

Records mouse/pointer position and maintains a capped history of recent positions.

```ts
import { PointerTracker } from '@anovise/behavise-pointer'

const tracker = new PointerTracker({
  autoStart: true,
  maxSamples: 500,
  minDistance: 5,
})

tracker.on('move', ({ x, y, timestamp }) => {
  console.log('pointer at', x, y)
})

console.log(tracker.position) // { x, y } — latest position (or null if no events yet)
console.log(tracker.history) // PointerSnapshot[] — up to maxSamples entries
```

**Options**

| Option        | Type             | Default         | Description                               |
| ------------- | ---------------- | --------------- | ----------------------------------------- |
| `maxSamples`  | `number`         | `1000`          | Maximum entries kept in the history array |
| `minDistance` | `number`         | `2`             | Minimum px moved to record a new sample   |
| `autoStart`   | `boolean`        | `false`         | Start tracking on construction            |
| `namespace`   | `string`         | —               | Storage key prefix                        |
| `storage`     | `StorageAdapter` | `MemoryAdapter` | Storage backend                           |

**Events**

| Event  | Payload type                              |
| ------ | ----------------------------------------- |
| `move` | `PointerSnapshot` (`{ x, y, timestamp }`) |

---

### `DwellTracker`

Fires a `dwell` event when the pointer is idle inside a registered zone for at least `threshold` ms.
Zones can be registered at construction time or added/removed dynamically.

```ts
import { DwellTracker } from '@anovise/behavise-pointer'

const dwell = new DwellTracker({
  autoStart: true,
  threshold: 1500, // wait 1.5s of stillness
  tolerance: 10, // allow up to 10px drift
  zones: [
    { id: 'hero', rect: { top: 0, left: 0, width: 1200, height: 600 } },
    { id: 'sidebar', rect: { top: 0, left: 900, width: 300, height: 800 } },
  ],
})

dwell.on('dwell', ({ zoneId, duration, timestamp }) => {
  console.log(`dwelled in "${zoneId}" for ${duration}ms`)
})

dwell.addZone({ id: 'footer', rect: { top: 900, left: 0, width: 1200, height: 100 } })
dwell.removeZone('sidebar')

console.log(dwell.records) // DwellRecord[]
```

**Options**

| Option      | Type             | Default         | Description                                       |
| ----------- | ---------------- | --------------- | ------------------------------------------------- |
| `threshold` | `number`         | `1000`          | ms of idle time required before `dwell` fires     |
| `tolerance` | `number`         | `5`             | Max px drift that is still considered "idle"      |
| `zones`     | `DwellZone[]`    | `[]`            | Zones to watch (can be expanded with `addZone()`) |
| `autoStart` | `boolean`        | `false`         | Start tracking on construction                    |
| `namespace` | `string`         | —               | Storage key prefix                                |
| `storage`   | `StorageAdapter` | `MemoryAdapter` | Storage backend                                   |

**Events**

| Event   | Payload type                                      |
| ------- | ------------------------------------------------- |
| `dwell` | `DwellRecord` (`{ zoneId, duration, timestamp }`) |

## License

MIT
