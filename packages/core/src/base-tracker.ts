import type { EventMap, TrackerOptions } from './types.js'
import { EventEmitter } from './emitter.js'
import { MemoryAdapter } from './storage.js'
import type { StorageAdapter } from './types.js'

/**
 * Abstract base class that all behavier trackers extend.
 *
 * Handles the start/stop/reset lifecycle and wires up
 * a typed event emitter plus a pluggable storage adapter.
 */
export abstract class BaseTracker<Events extends EventMap = EventMap> {
  protected readonly emitter: EventEmitter<Events>
  protected readonly storage: StorageAdapter
  protected readonly namespace: string

  private _active = false

  constructor(options: TrackerOptions & { storage?: StorageAdapter } = {}) {
    this.emitter = new EventEmitter<Events>()
    this.storage = options.storage ?? new MemoryAdapter()
    this.namespace = options.namespace ?? this.constructor.name.toLowerCase()

    if (options.autoStart) this.start()
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
    return this.emitter.on(event, listener)
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
