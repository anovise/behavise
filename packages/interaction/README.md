# @anovise/behavise-interaction

> Click-count tracking and element visibility measurement for the **behavise** library.

Created by [Reas Vyn](https://github.com/reasvyn) and maintained by [Anovise](https://github.com/anovise).

## Installation

```bash
npm install @anovise/behavise-interaction
```

## Trackers

### `ClickTracker`

Counts clicks per DOM element and records the coordinates of every click. The target label is determined by a customizable resolver function.

```ts
import { ClickTracker } from '@anovise/behavise-interaction'

const clicks = new ClickTracker({
  autoStart: true,
  // Custom resolver — use a data attribute when available
  resolveTarget: (el) => el.getAttribute('data-track') ?? el.tagName.toLowerCase(),
})

clicks.on('click', ({ target, count, x, y, timestamp }) => {
  console.log(`${target} clicked ${count} times at (${x}, ${y})`)
})

console.log(clicks.countFor('button#submit')) // 5
console.log(clicks.counts) // { 'button#submit': 5, 'a.nav-link': 2 }
console.log(clicks.records) // ClickRecord[] — full log
```

**Options**

| Option          | Type                      | Default                        | Description                               |
| --------------- | ------------------------- | ------------------------------ | ----------------------------------------- |
| `resolveTarget` | `(el: Element) => string` | `tag#id` / `tag.class1.class2` | Derives the label stored for a clicked el |
| `autoStart`     | `boolean`                 | `false`                        | Start tracking on construction            |
| `namespace`     | `string`                  | —                              | Storage key prefix                        |
| `storage`       | `StorageAdapter`          | `MemoryAdapter`                | Storage backend                           |

**Events**

| Event   | Payload type                                         |
| ------- | ---------------------------------------------------- |
| `click` | `ClickRecord` (`{ target, count, x, y, timestamp }`) |

**Properties / Methods**

| Member             | Description                           |
| ------------------ | ------------------------------------- |
| `counts`           | `Record<string, number>` — all counts |
| `records`          | `ClickRecord[]` — full click log      |
| `countFor(target)` | Returns the click count for a label   |

---

### `VisibilityTracker`

Measures how long specific elements are visible in the viewport using the `IntersectionObserver` API. Elements must be explicitly registered with `observe()`.

```ts
import { VisibilityTracker } from '@anovise/behavise-interaction'

const vis = new VisibilityTracker({ autoStart: true, threshold: 0.5 })

// Observe elements after starting
vis.observe(document.querySelector('#hero')!, 'hero-section')
vis.observe(document.querySelector('#pricing')!, 'pricing-table')

vis.on('visible', ({ target, label, timestamp }) => {
  console.log(`${label} entered viewport`)
})

vis.on('hidden', ({ target, label, totalVisible, timestamp }) => {
  console.log(`${label} was visible for ${totalVisible}ms`)
})
```

**Requirements:** Requires `IntersectionObserver` support (all modern browsers). When running in Node / jsdom environments, stub it with a mock.

**Options**

| Option      | Type             | Default         | Description                                                        |
| ----------- | ---------------- | --------------- | ------------------------------------------------------------------ |
| `threshold` | `number`         | `0`             | `IntersectionObserver` threshold (0–1 fraction of element visible) |
| `autoStart` | `boolean`        | `false`         | Start tracking on construction                                     |
| `namespace` | `string`         | —               | Storage key prefix                                                 |
| `storage`   | `StorageAdapter` | `MemoryAdapter` | Storage backend                                                    |

**Events**

| Event     | Payload                                                                       |
| --------- | ----------------------------------------------------------------------------- |
| `visible` | `{ target: Element, label: string, timestamp: number }`                       |
| `hidden`  | `{ target: Element, label: string, totalVisible: number, timestamp: number }` |

## License

MIT
