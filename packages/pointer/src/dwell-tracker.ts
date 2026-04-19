import { BaseTracker } from '@behavier/core'
import type { BoundingRect, TrackerOptions, Timestamped } from '@behavier/core'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DwellZone {
  /** Unique identifier for this zone */
  id: string
  rect: BoundingRect
}

export interface DwellRecord extends Timestamped {
  zoneId: string
  /** Duration in milliseconds the pointer was idle in this zone */
  duration: number
}

export interface DwellTrackerOptions extends TrackerOptions {
  /**
   * Minimum time (ms) the pointer must be still before a dwell event fires.
   * @default 1000
   */
  threshold?: number
  /**
   * Maximum distance (px) the pointer can drift and still be considered "still".
   * @default 5
   */
  tolerance?: number
  /** Zones to watch. Can also be added dynamically via addZone(). */
  zones?: DwellZone[]
}

export interface DwellTrackerEvents {
  dwell: DwellRecord
}

// ─── DwellTracker ────────────────────────────────────────────────────────────

/**
 * Emits a `dwell` event when the pointer is idle inside a defined zone
 * for longer than `threshold` milliseconds.
 *
 * @example
 * ```ts
 * const dwell = new DwellTracker({
 *   autoStart: true,
 *   zones: [{ id: 'hero', rect: { top: 0, left: 0, width: 800, height: 400 } }],
 * })
 * dwell.on('dwell', ({ zoneId, duration }) => console.log(zoneId, duration))
 * ```
 */
export class DwellTracker extends BaseTracker<DwellTrackerEvents> {
  private readonly _threshold: number
  private readonly _tolerance: number
  private _zones: DwellZone[]
  private _records: DwellRecord[] = []

  private _lastX = -Infinity
  private _lastY = -Infinity
  private _dwellStart = 0
  private _timer: ReturnType<typeof setTimeout> | null = null

  private _handleMove: (e: MouseEvent) => void

  constructor(options: DwellTrackerOptions = {}) {
    super(options)
    this._threshold = options.threshold ?? 1000
    this._tolerance = options.tolerance ?? 5
    this._zones = options.zones ? [...options.zones] : []
    this._handleMove = (e: MouseEvent) => this._onMove(e)
  }

  /** All recorded dwell events */
  get records(): ReadonlyArray<DwellRecord> {
    return this._records
  }

  addZone(zone: DwellZone): void {
    this._zones.push(zone)
  }

  removeZone(id: string): void {
    this._zones = this._zones.filter((z) => z.id !== id)
  }

  private _onMove(e: MouseEvent): void {
    const { clientX: x, clientY: y } = e

    const dx = x - this._lastX
    const dy = y - this._lastY
    const moved = Math.sqrt(dx * dx + dy * dy) > this._tolerance

    if (moved) {
      this._cancelTimer()
      this._lastX = x
      this._lastY = y
      this._dwellStart = Date.now()
      this._scheduleCheck(x, y)
    }
  }

  private _scheduleCheck(x: number, y: number): void {
    this._timer = setTimeout(() => {
      const duration = Date.now() - this._dwellStart
      const zone = this._zones.find((z) => this._inZone(x, y, z))
      if (!zone) return

      const record: DwellRecord = {
        zoneId: zone.id,
        duration,
        timestamp: this._dwellStart,
      }
      this._records.push(record)
      this.emitter.emit('dwell', record)
    }, this._threshold)
  }

  private _cancelTimer(): void {
    if (this._timer !== null) {
      clearTimeout(this._timer)
      this._timer = null
    }
  }

  private _inZone(x: number, y: number, zone: DwellZone): boolean {
    const { top, left, width, height } = zone.rect
    return x >= left && x <= left + width && y >= top && y <= top + height
  }

  protected _attach(): void {
    document.addEventListener('mousemove', this._handleMove, { passive: true })
  }

  protected _detach(): void {
    document.removeEventListener('mousemove', this._handleMove)
    this._cancelTimer()
  }

  protected override _reset(): void {
    super._reset()
    this._records = []
    this._lastX = -Infinity
    this._lastY = -Infinity
    this._cancelTimer()
  }
}
