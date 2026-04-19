import { BaseTracker } from '@behavier/core'
import type { TrackerOptions, Timestamped } from '@behavier/core'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VisitRecord extends Timestamped {
  url: string
  /** How long (ms) the user spent on this URL before navigating away */
  duration: number | null
}

export interface NavigationTrackerOptions extends TrackerOptions {
  /** Normalize URLs before storing (e.g. strip query strings). */
  normalizeUrl?: (url: string) => string
}

export interface NavigationTrackerEvents {
  visit: VisitRecord
}

// ─── NavigationTracker ───────────────────────────────────────────────────────

/**
 * Counts page/route visits and measures time spent on each URL.
 * Supports both full page loads and SPA navigation via the History API.
 *
 * @example
 * ```ts
 * const nav = new NavigationTracker({ autoStart: true })
 * nav.on('visit', ({ url, duration }) => console.log(url, duration))
 * console.log(nav.visitCounts) // { '/home': 3, '/about': 1 }
 * ```
 */
export class NavigationTracker extends BaseTracker<NavigationTrackerEvents> {
  private readonly _normalize: (url: string) => string
  private _visits: VisitRecord[] = []
  private _counts: Record<string, number> = {}
  private _currentUrl = ''
  private _enteredAt = 0

  private _handlePopState: () => void
  private _handleVisibilityChange: () => void

  constructor(options: NavigationTrackerOptions = {}) {
    super(options)
    this._normalize = options.normalizeUrl ?? ((u) => u)

    this._handlePopState = () => this._recordAndSwitch()
    this._handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') this._closeCurrentVisit()
    }
    if (options.autoStart) this.start()
  }

  /** Visit count per normalized URL */
  get visitCounts(): Readonly<Record<string, number>> {
    return this._counts
  }

  /** Full ordered visit log */
  get visits(): ReadonlyArray<VisitRecord> {
    return this._visits
  }

  /** Total visits recorded */
  get totalVisits(): number {
    return this._visits.length
  }

  private _currentNormalizedUrl(): string {
    return this._normalize(location.href)
  }

  private _closeCurrentVisit(): void {
    if (!this._currentUrl) return
    const record: VisitRecord = {
      url: this._currentUrl,
      timestamp: this._enteredAt,
      duration: Date.now() - this._enteredAt,
    }
    this._visits.push(record)
    this.dispatcher.emit('visit', record)
  }

  private _recordAndSwitch(): void {
    this._closeCurrentVisit()
    this._currentUrl = this._currentNormalizedUrl()
    this._enteredAt = Date.now()
    this._counts[this._currentUrl] = (this._counts[this._currentUrl] ?? 0) + 1
  }

  // Patch History pushState / replaceState to capture SPA navigation
  private _origPush!: typeof history.pushState
  private _origReplace!: typeof history.replaceState

  protected _attach(): void {
    this._origPush = history.pushState.bind(history)
    this._origReplace = history.replaceState.bind(history)

    const self = this
    history.pushState = function (...args) {
      self._origPush(...args)
      self._recordAndSwitch()
    }
    history.replaceState = function (...args) {
      self._origReplace(...args)
      self._recordAndSwitch()
    }

    window.addEventListener('popstate', this._handlePopState)
    document.addEventListener('visibilitychange', this._handleVisibilityChange)

    // Record the initial page
    this._currentUrl = this._currentNormalizedUrl()
    this._enteredAt = Date.now()
    this._counts[this._currentUrl] = (this._counts[this._currentUrl] ?? 0) + 1
  }

  protected _detach(): void {
    if (this._origPush) history.pushState = this._origPush
    if (this._origReplace) history.replaceState = this._origReplace
    window.removeEventListener('popstate', this._handlePopState)
    document.removeEventListener('visibilitychange', this._handleVisibilityChange)
    this._closeCurrentVisit()
    this._currentUrl = ''
  }

  protected override _reset(): void {
    super._reset()
    this._visits = []
    this._counts = {}
    this._currentUrl = ''
    this._enteredAt = 0
  }
}
