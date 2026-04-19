import { BaseTracker } from '@behavier/core'
import type { TrackerOptions, Timestamped } from '@behavier/core'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VisibilityRecord extends Timestamped {
  /** CSS selector or label used to identify the element */
  target: string
  /** Total milliseconds the element has been visible */
  totalVisible: number
  /** Number of times the element entered the viewport */
  intersections: number
}

export interface VisibilityTrackerOptions extends TrackerOptions {
  /**
   * IntersectionObserver threshold — fraction of element that must be visible.
   * @default 0.5
   */
  threshold?: number
  /** Elements to observe. More can be added via observe(). */
  targets?: Array<{ el: Element; label: string }>
}

export interface VisibilityTrackerEvents {
  visible: VisibilityRecord
  hidden: VisibilityRecord
}

// ─── VisibilityTracker ───────────────────────────────────────────────────────

interface State {
  label: string
  totalVisible: number
  intersections: number
  enteredAt: number | null
}

/**
 * Measures how long DOM elements are visible in the viewport using IntersectionObserver.
 *
 * @example
 * ```ts
 * const vis = new VisibilityTracker({ autoStart: true, threshold: 0.5 })
 * vis.observe(document.querySelector('#banner')!, 'hero-banner')
 * vis.on('hidden', ({ target, totalVisible }) => console.log(target, totalVisible))
 * ```
 */
export class VisibilityTracker extends BaseTracker<VisibilityTrackerEvents> {
  private readonly _threshold: number
  private readonly _initTargets: Array<{ el: Element; label: string }>
  private _observer: IntersectionObserver | null = null
  private _state: WeakMap<Element, State> = new WeakMap()

  constructor(options: VisibilityTrackerOptions = {}) {
    super(options)
    this._threshold = options.threshold ?? 0.5
    this._initTargets = options.targets ? [...options.targets] : []
    if (options.autoStart) this.start()
  }

  /** Start observing an element. Safe to call before start(). */
  observe(el: Element, label: string): void {
    if (this._observer) {
      this._initState(el, label)
      this._observer.observe(el)
    } else {
      // Queue for when start() is called
      this._initTargets.push({ el, label })
    }
  }

  /** Stop observing a specific element */
  unobserve(el: Element): void {
    this._observer?.unobserve(el)
    this._state.delete(el)
  }

  /** Snapshot of current visibility data for an element */
  getRecord(el: Element): Omit<VisibilityRecord, 'timestamp'> | undefined {
    const s = this._state.get(el)
    if (!s) return undefined
    return { target: s.label, totalVisible: s.totalVisible, intersections: s.intersections }
  }

  private _initState(el: Element, label: string): void {
    if (!this._state.has(el)) {
      this._state.set(el, { label, totalVisible: 0, intersections: 0, enteredAt: null })
    }
  }

  private _onIntersect(entries: IntersectionObserverEntry[]): void {
    const now = Date.now()
    for (const entry of entries) {
      const state = this._state.get(entry.target)
      if (!state) continue

      if (entry.isIntersecting) {
        state.enteredAt = now
        state.intersections++
        this.dispatcher.emit('visible', this._toRecord(state, now))
      } else if (state.enteredAt !== null) {
        state.totalVisible += now - state.enteredAt
        state.enteredAt = null
        this.dispatcher.emit('hidden', this._toRecord(state, now))
      }
    }
  }

  private _toRecord(state: State, timestamp: number): VisibilityRecord {
    return {
      target: state.label,
      totalVisible: state.totalVisible,
      intersections: state.intersections,
      timestamp,
    }
  }

  protected _attach(): void {
    this._observer = new IntersectionObserver((entries) => this._onIntersect(entries), {
      threshold: this._threshold,
    })
    for (const { el, label } of this._initTargets) {
      this._initState(el, label)
      this._observer.observe(el)
    }
  }

  protected _detach(): void {
    this._observer?.disconnect()
    this._observer = null
  }

  protected override _reset(): void {
    super._reset()
    this._state = new WeakMap()
  }
}
