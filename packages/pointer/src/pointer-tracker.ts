import { BaseTracker } from '@anovise/behavise-core'
import type { Point, TrackerOptions, Timestamped } from '@anovise/behavise-core'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PointerSnapshot extends Point, Timestamped {}

export interface PointerTrackerOptions extends TrackerOptions {
  /**
   * Maximum number of movement samples stored in memory.
   * Older entries are dropped when the limit is reached.
   * @default 1000
   */
  maxSamples?: number
  /**
   * Minimum distance (px) between two samples before a new one is recorded.
   * Helps reduce noise on high-DPI / high-frequency devices.
   * @default 2
   */
  minDistance?: number
}

export type PointerTrackerEvents = {
  move: PointerSnapshot
}

// ─── PointerTracker ──────────────────────────────────────────────────────────

/**
 * Tracks the current pointer position and records its movement history.
 *
 * @example
 * ```ts
 * const tracker = new PointerTracker({ autoStart: true })
 * tracker.on('move', ({ x, y }) => console.log(x, y))
 * ```
 */
export class PointerTracker extends BaseTracker<PointerTrackerEvents> {
  private readonly _maxSamples: number
  private readonly _minDistance: number
  private _history: PointerSnapshot[] = []
  private _current: Point = { x: 0, y: 0 }
  private _handleMove: (e: MouseEvent) => void

  constructor(options: PointerTrackerOptions = {}) {
    super(options)
    this._maxSamples = options.maxSamples ?? 1000
    this._minDistance = options.minDistance ?? 2
    this._handleMove = (e: MouseEvent) => this._onMove(e)
    if (options.autoStart) this.start()
  }

  /** Current pointer position */
  get position(): Readonly<Point> {
    return this._current
  }

  /** Recorded movement history (oldest → newest) */
  get history(): ReadonlyArray<PointerSnapshot> {
    return this._history
  }

  private _onMove(e: MouseEvent): void {
    const { clientX: x, clientY: y } = e

    const dx = x - this._current.x
    const dy = y - this._current.y
    if (Math.sqrt(dx * dx + dy * dy) < this._minDistance) return

    this._current = { x, y }
    const snapshot: PointerSnapshot = { x, y, timestamp: Date.now() }

    this._history.push(snapshot)
    if (this._history.length > this._maxSamples) this._history.shift()

    this.dispatcher.emit('move', snapshot)
  }

  protected _attach(): void {
    document.addEventListener('mousemove', this._handleMove, { passive: true })
  }

  protected _detach(): void {
    document.removeEventListener('mousemove', this._handleMove)
  }

  protected override _reset(): void {
    super._reset()
    this._history = []
    this._current = { x: 0, y: 0 }
  }
}
