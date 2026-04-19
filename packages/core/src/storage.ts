import type { StorageAdapter } from './types.js'

/**
 * In-memory storage adapter — data is lost on page unload.
 */
export class MemoryAdapter implements StorageAdapter {
  private readonly _store = new Map<string, unknown>()

  get<T>(key: string): T | undefined {
    return this._store.get(key) as T | undefined
  }

  set<T>(key: string, value: T): void {
    this._store.set(key, value)
  }

  delete(key: string): void {
    this._store.delete(key)
  }

  clear(): void {
    this._store.clear()
  }

  keys(): string[] {
    return Array.from(this._store.keys())
  }
}

/**
 * localStorage-backed adapter — data survives page reloads.
 *
 * Falls back to MemoryAdapter in environments without localStorage.
 */
export class LocalStorageAdapter implements StorageAdapter {
  private readonly _prefix: string

  constructor(prefix = 'behavier') {
    this._prefix = `${prefix}:`
  }

  private _key(key: string): string {
    return `${this._prefix}${key}`
  }

  private get _storage(): Storage | null {
    try {
      return typeof window !== 'undefined' ? window.localStorage : null
    } catch {
      return null
    }
  }

  get<T>(key: string): T | undefined {
    const raw = this._storage?.getItem(this._key(key))
    if (raw == null) return undefined
    try {
      return JSON.parse(raw) as T
    } catch {
      return undefined
    }
  }

  set<T>(key: string, value: T): void {
    try {
      this._storage?.setItem(this._key(key), JSON.stringify(value))
    } catch {
      // Quota exceeded or private mode — silently ignore
    }
  }

  delete(key: string): void {
    this._storage?.removeItem(this._key(key))
  }

  clear(): void {
    const storage = this._storage
    if (!storage) return
    const toRemove: string[] = []
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i)
      if (k?.startsWith(this._prefix)) toRemove.push(k)
    }
    toRemove.forEach((k) => storage.removeItem(k))
  }

  keys(): string[] {
    const storage = this._storage
    if (!storage) return []
    const result: string[] = []
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i)
      if (k?.startsWith(this._prefix)) result.push(k.slice(this._prefix.length))
    }
    return result
  }
}
