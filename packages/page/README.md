# @anovise/behavise-page

> SPA navigation tracking and scroll depth measurement for the **behavise** library.

## Installation

```bash
npm install @anovise/behavise-page
```

## Trackers

### `NavigationTracker`

Counts URL visits and measures the time spent on each route. Works with single-page applications by patching `history.pushState` and `history.replaceState`.

```ts
import { NavigationTracker } from '@anovise/behavise-page'

const nav = new NavigationTracker({ autoStart: true })

nav.on('visit', ({ url, duration, timestamp }) => {
  // 'duration' is null for the very first page view (no previous page)
  console.log(`left ${url} after ${duration}ms`)
})

console.log(nav.visitCounts) // { '/home': 3, '/about': 1, '/pricing': 2 }
console.log(nav.totalVisits) // 6
```

**Options**

| Option      | Type             | Default         | Description                    |
| ----------- | ---------------- | --------------- | ------------------------------ |
| `autoStart` | `boolean`        | `false`         | Start tracking on construction |
| `namespace` | `string`         | —               | Storage key prefix             |
| `storage`   | `StorageAdapter` | `MemoryAdapter` | Storage backend                |

**Events**

| Event   | Payload                                                        |
| ------- | -------------------------------------------------------------- |
| `visit` | `{ url: string, duration: number \| null, timestamp: number }` |

**Properties**

| Property      | Type                     | Description              |
| ------------- | ------------------------ | ------------------------ |
| `visitCounts` | `Record<string, number>` | Map of URL → visit count |
| `totalVisits` | `number`                 | Total visits recorded    |

---

### `ScrollTracker`

Records scroll position on every scroll event (throttled) and calculates how far down the page the user has scrolled as a percentage of total scrollable height.

```ts
import { ScrollTracker } from '@anovise/behavise-page'

const scroll = new ScrollTracker({ autoStart: true, throttleMs: 100 })

scroll.on('scroll', ({ x, y, depthPercent, maxDepthPercent, timestamp }) => {
  console.log(`scrolled to ${depthPercent.toFixed(1)}% (max: ${maxDepthPercent.toFixed(1)}%)`)
})

console.log(scroll.maxDepth) // highest depth % reached this session
```

**Options**

| Option       | Type             | Default         | Description                           |
| ------------ | ---------------- | --------------- | ------------------------------------- |
| `throttleMs` | `number`         | `200`           | Minimum ms between consecutive events |
| `autoStart`  | `boolean`        | `false`         | Start tracking on construction        |
| `namespace`  | `string`         | —               | Storage key prefix                    |
| `storage`    | `StorageAdapter` | `MemoryAdapter` | Storage backend                       |

**Events**

| Event    | Payload type                                                            |
| -------- | ----------------------------------------------------------------------- |
| `scroll` | `ScrollSnapshot` (`{ x, y, depthPercent, maxDepthPercent, timestamp }`) |

**Properties**

| Property   | Type     | Description                       |
| ---------- | -------- | --------------------------------- |
| `maxDepth` | `number` | Highest `depthPercent` value seen |

## License

MIT
