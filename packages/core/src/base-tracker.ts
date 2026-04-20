import type { EventMap, TrackerOptions } from './types.js'
import { EventDispatcher } from './dispatcher.js'
import { MemoryAdapter } from './storage.js'
import type { StorageAdapter } from './types.js'

/**
 * Abstract base class that all behavise trackers extend.
 *
 * Handles the start/stop/reset lifecycle and wires up
 * a typed event dispatcher plus a pluggable storage adapter.
 */
export abstract class BaseTracker<Events extends EventMap = EventMap> {
  protected readonly dispatcher: EventDispatcher<Events>
  protected readonly storage: StorageAdapter
  protected readonly namespace: string

  private _active = false

  constructor(options: TrackerOptions & { storage?: StorageAdapter } = {}) {
    this.dispatcher = new EventDispatcher<Events>()
    this.storage = options.storage ?? new MemoryAdapter()
    this.namespace = options.namespace ?? this.constructor.name.toLowerCase()

    // NOTE: autoStart is intentionally NOT called here.
    // Each concrete tracker calls `if (options.autoStart) this.start()` at the
    // END of its own constructor, after all subclass properties are initialized.
  }

  get isActive(): boolean {
    return this._active
  }

  start(): void {
    if (this._active) return
    this._active = true
    this._attach()
  }

  stop(): void {
    if (!this._active) return
    this._active = false
    this._detach()
  }

  reset(): void {
    this.stop()
    this._reset()
  }

  /** Register a listener for tracker events. Returns an unsubscribe function. */
  on<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): () => void {
    return this.dispatcher.on(event, listener)
  }

  // ── Lifecycle hooks ──────────────────────────────────────────────────────

  /** Called when the tracker is started. Attach DOM event listeners here. */
  protected abstract _attach(): void

  /** Called when the tracker is stopped. Remove DOM event listeners here. */
  protected abstract _detach(): void

  /** Called on reset. Override to clear collected data. */
  protected _reset(): void {
    this.storage.clear()
  }

  // ── Storage helpers ──────────────────────────────────────────────────────

  protected _storageKey(suffix: string): string {
    return `${this.namespace}:${suffix}`
  }
}
