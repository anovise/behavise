// ─── Coordinates ────────────────────────────────────────────────────────────

export interface Point {
  x: number
  y: number
}

export interface BoundingRect {
  top: number
  left: number
  width: number
  height: number
}

// ─── Event system ───────────────────────────────────────────────────────────

export type EventMap = Record<string, unknown>

export type EventListener<T> = (payload: T) => void

export interface Emitter<Events extends EventMap> {
  on<K extends keyof Events>(event: K, listener: EventListener<Events[K]>): () => void
  off<K extends keyof Events>(event: K, listener: EventListener<Events[K]>): void
  emit<K extends keyof Events>(event: K, payload: Events[K]): void
  once<K extends keyof Events>(event: K, listener: EventListener<Events[K]>): () => void
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export interface StorageAdapter {
  get<T>(key: string): T | undefined
  set<T>(key: string, value: T): void
  delete(key: string): void
  clear(): void
  keys(): string[]
}

// ─── Tracker base ────────────────────────────────────────────────────────────

export interface TrackerOptions {
  /** Namespace used as key prefix in storage */
  namespace?: string
  /** Whether to start tracking immediately on construction */
  autoStart?: boolean
}

export interface Tracker {
  /** Start collecting data */
  start(): void
  /** Stop collecting data without clearing it */
  stop(): void
  /** Stop and clear all collected data */
  reset(): void
  /** Whether the tracker is currently active */
  readonly isActive: boolean
}

// ─── Shared snapshot type ────────────────────────────────────────────────────

export interface Timestamped {
  timestamp: number
}
