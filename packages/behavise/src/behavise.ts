import type { StorageAdapter } from '@anovise/behavise-core'
import { PointerTracker } from '@anovise/behavise-pointer'
import type { PointerTrackerOptions } from '@anovise/behavise-pointer'
import { DwellTracker } from '@anovise/behavise-pointer'
import type { DwellTrackerOptions } from '@anovise/behavise-pointer'
import { NavigationTracker } from '@anovise/behavise-page'
import type { NavigationTrackerOptions } from '@anovise/behavise-page'
import { ScrollTracker } from '@anovise/behavise-page'
import type { ScrollTrackerOptions } from '@anovise/behavise-page'
import { ClickTracker } from '@anovise/behavise-interaction'
import type { ClickTrackerOptions } from '@anovise/behavise-interaction'
import { VisibilityTracker } from '@anovise/behavise-interaction'
import type { VisibilityTrackerOptions } from '@anovise/behavise-interaction'

// ─── Options ─────────────────────────────────────────────────────────────────

export interface BehaviseOptions {
  /** Shared storage adapter passed to every tracker */
  storage?: StorageAdapter
  pointer?: PointerTrackerOptions & { enabled?: boolean }
  dwell?: DwellTrackerOptions & { enabled?: boolean }
  navigation?: NavigationTrackerOptions & { enabled?: boolean }
  scroll?: ScrollTrackerOptions & { enabled?: boolean }
  click?: ClickTrackerOptions & { enabled?: boolean }
  visibility?: VisibilityTrackerOptions & { enabled?: boolean }
}

// ─── BehaviseInstance ────────────────────────────────────────────────────────

export interface BehaviseInstance {
  pointer: PointerTracker | null
  dwell: DwellTracker | null
  navigation: NavigationTracker | null
  scroll: ScrollTracker | null
  click: ClickTracker | null
  visibility: VisibilityTracker | null

  /** Start all enabled trackers */
  startAll(): void
  /** Stop all enabled trackers */
  stopAll(): void
  /** Reset all enabled trackers */
  resetAll(): void
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create a pre-configured behavise instance with all desired trackers.
 *
 * Trackers are enabled by default; set `{ enabled: false }` to disable one.
 *
 * @example
 * ```ts
 * import { createBehavise } from '@anovise/behavise'
 *
 * const b = createBehavise({
 *   pointer: { autoStart: true, maxSamples: 500 },
 *   click:   { autoStart: true },
 * })
 *
 * b.click?.on('click', ({ target, count }) => console.log(target, count))
 * ```
 */
export function createBehavise(options: BehaviseOptions = {}): BehaviseInstance {
  function make<T>(
    enabled: boolean | undefined,
    opts: object | undefined,
    factory: (o: object) => T,
  ): T | null {
    if (enabled === false) return null
    return factory(opts ?? {})
  }

  const shared = options.storage ? { storage: options.storage } : {}

  const pointer = make(
    options.pointer?.enabled,
    { ...shared, ...options.pointer },
    (o) => new PointerTracker(o as PointerTrackerOptions),
  )
  const dwell = make(
    options.dwell?.enabled,
    { ...shared, ...options.dwell },
    (o) => new DwellTracker(o as DwellTrackerOptions),
  )
  const navigation = make(
    options.navigation?.enabled,
    { ...shared, ...options.navigation },
    (o) => new NavigationTracker(o as NavigationTrackerOptions),
  )
  const scroll = make(
    options.scroll?.enabled,
    { ...shared, ...options.scroll },
    (o) => new ScrollTracker(o as ScrollTrackerOptions),
  )
  const click = make(
    options.click?.enabled,
    { ...shared, ...options.click },
    (o) => new ClickTracker(o as ClickTrackerOptions),
  )
  const visibility = make(
    options.visibility?.enabled,
    { ...shared, ...options.visibility },
    (o) => new VisibilityTracker(o as VisibilityTrackerOptions),
  )

  const trackers = [pointer, dwell, navigation, scroll, click, visibility].filter(
    Boolean,
  ) as Array<{
    start(): void
    stop(): void
    reset(): void
  }>

  return {
    pointer,
    dwell,
    navigation,
    scroll,
    click,
    visibility,
    startAll: () => trackers.forEach((t) => t.start()),
    stopAll: () => trackers.forEach((t) => t.stop()),
    resetAll: () => trackers.forEach((t) => t.reset()),
  }
}
