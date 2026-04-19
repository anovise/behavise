import { BaseTracker } from '@behavier/core'
import type { Point, TrackerOptions, Timestamped } from '@behavier/core'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScrollSnapshot extends Timestamped {
  x: number
  y: number
  /** Vertical scroll depth as a percentage of total page height (0–100) */
  depthPercent: number
  /** Maximum vertical depth reached so far (0–100) */
  maxDepthPercent: number
}

export interface ScrollTrackerOptions extends TrackerOptions {
  /** Target element to observe. Defaults to window. */
  target?: Element
  /**
   * Throttle interval (ms) between recorded scroll events.
   * @default 100
   */
  throttleMs?: number
}

export interface ScrollTrackerEvents {
  scroll: ScrollSnapshot
}

// ─── ScrollTracker ───────────────────────────────────────────────────────────

/**
 * Records scroll position and calculates scroll depth.
 *
 * @example
 * ```ts
 * const scroll = new ScrollTracker({ autoStart: true })
 * scroll.on('scroll', ({ depthPercent }) => console.log(`${depthPercent}%`))
 * ```
 */
export class ScrollTracker extends BaseTracker<ScrollTrackerEvents> {
  private readonly _target: Element | null
  private readonly _throttleMs: number
  private _lastFired = 0
  private _maxDepth = 0
  private _snapshots: ScrollSnapshot[] = []

  private _handleScroll: () => void

  constructor(options: ScrollTrackerOptions = {}) {
    super(options)
    this._target = options.target ?? null
    this._throttleMs = options.throttleMs ?? 100

    this._handleScroll = () => {
      const now = Date.now()
      if (now - this._lastFired < this._throttleMs) return
      this._lastFired = now
      this._record(now)
    }
    if (options.autoStart) this.start()
  }

  /** Latest scroll position */
  get position(): Point {
    const last = this._snapshots.at(-1)
    return last ? { x: last.x, y: last.y } : { x: 0, y: 0 }
  }

  /** Maximum scroll depth reached (0–100) */
  get maxDepth(): number {
    return this._maxDepth
  }

  /** All recorded scroll snapshots */
  get snapshots(): ReadonlyArray<ScrollSnapshot> {
    return this._snapshots
  }

  private _record(timestamp: number): void {
    const { x, y, depthPercent } = this._getScrollInfo()
    if (depthPercent > this._maxDepth) this._maxDepth = depthPercent

    const snapshot: ScrollSnapshot = {
      x,
      y,
      depthPercent,
      maxDepthPercent: this._maxDepth,
      timestamp,
    }
    this._snapshots.push(snapshot)
    this.dispatcher.emit('scroll', snapshot)
  }

  private _getScrollInfo(): { x: number; y: number; depthPercent: number } {
    if (this._target) {
      const el = this._target
      const x = el.scrollLeft
      const y = el.scrollTop
      const maxY = el.scrollHeight - el.clientHeight
      return { x, y, depthPercent: maxY > 0 ? Math.round((y / maxY) * 100) : 0 }
    }
    const x = window.scrollX
    const y = window.scrollY
    const maxY = document.documentElement.scrollHeight - window.innerHeight
    return { x, y, depthPercent: maxY > 0 ? Math.round((y / maxY) * 100) : 0 }
  }

  protected _attach(): void {
    const el = this._target ?? window
    el.addEventListener('scroll', this._handleScroll, { passive: true })
  }

  protected _detach(): void {
    const el = this._target ?? window
    el.removeEventListener('scroll', this._handleScroll)
  }

  protected override _reset(): void {
    super._reset()
    this._snapshots = []
    this._maxDepth = 0
    this._lastFired = 0
  }
}
