import type { Dispatcher, EventListener, EventMap } from './types.js'

/**
 * Lightweight type-safe event dispatcher.
 */
export class EventDispatcher<Events extends EventMap> implements Dispatcher<Events> {
  private readonly _listeners: {
    [K in keyof Events]?: Set<EventListener<Events[K]>>
  } = {}

  on<K extends keyof Events>(event: K, listener: EventListener<Events[K]>): () => void {
    let set = this._listeners[event]
    if (!set) {
      set = new Set()
      this._listeners[event] = set
    }
    set.add(listener)
    return () => this.off(event, listener)
  }

  once<K extends keyof Events>(event: K, listener: EventListener<Events[K]>): () => void {
    const wrapper: EventListener<Events[K]> = (payload) => {
      listener(payload)
      this.off(event, wrapper)
    }
    return this.on(event, wrapper)
  }

  off<K extends keyof Events>(event: K, listener: EventListener<Events[K]>): void {
    this._listeners[event]?.delete(listener)
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this._listeners[event]?.forEach((fn) => fn(payload))
  }

  /** Remove all listeners, optionally for a specific event. */
  removeAllListeners<K extends keyof Events>(event?: K): void {
    if (event !== undefined) {
      delete this._listeners[event]
    } else {
      for (const key in this._listeners) {
        delete this._listeners[key]
      }
    }
  }
}
