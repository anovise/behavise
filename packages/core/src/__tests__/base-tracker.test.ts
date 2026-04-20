import { describe, it, expect, vi } from 'vitest'
import { BaseTracker } from '../base-tracker.js'
import type { EventMap } from '../types.js'

// ─── Minimal concrete tracker for testing ─────────────────────────────────────

interface TestEvents extends EventMap {
  tick: { n: number }
}

class TestTracker extends BaseTracker<TestEvents> {
  attachCalls = 0
  detachCalls = 0
  resetCalls = 0

  constructor(options: ConstructorParameters<typeof BaseTracker>[0] = {}) {
    super(options)
    if ((options as { autoStart?: boolean }).autoStart) this.start()
  }

  protected _attach(): void {
    this.attachCalls++
  }

  protected _detach(): void {
    this.detachCalls++
  }

  protected override _reset(): void {
    super._reset()
    this.resetCalls++
  }

  emitTick(n: number): void {
    this.dispatcher.emit('tick', { n })
  }
}

describe('BaseTracker', () => {
  describe('lifecycle', () => {
    it('starts inactive by default', () => {
      const t = new TestTracker()
      expect(t.isActive).toBe(false)
    })

    it('becomes active after start()', () => {
      const t = new TestTracker()
      t.start()
      expect(t.isActive).toBe(true)
    })

    it('calls _attach() exactly once on start()', () => {
      const t = new TestTracker()
      t.start()
      expect(t.attachCalls).toBe(1)
    })

    it('calling start() twice only attaches once', () => {
      const t = new TestTracker()
      t.start()
      t.start()
      expect(t.attachCalls).toBe(1)
    })

    it('becomes inactive after stop()', () => {
      const t = new TestTracker()
      t.start()
      t.stop()
      expect(t.isActive).toBe(false)
    })

    it('calls _detach() on stop()', () => {
      const t = new TestTracker()
      t.start()
      t.stop()
      expect(t.detachCalls).toBe(1)
    })

    it('calling stop() on an inactive tracker does nothing', () => {
      const t = new TestTracker()
      t.stop()
      expect(t.detachCalls).toBe(0)
    })

    it('reset() calls _reset() and stops the tracker', () => {
      const t = new TestTracker()
      t.start()
      t.reset()
      expect(t.isActive).toBe(false)
      expect(t.resetCalls).toBe(1)
    })

    it('autoStart starts the tracker immediately', () => {
      const t = new TestTracker({ autoStart: true })
      expect(t.isActive).toBe(true)
      expect(t.attachCalls).toBe(1)
    })
  })

  describe('on / event dispatch', () => {
    it('listener receives emitted events', () => {
      const t = new TestTracker()
      const fn = vi.fn()
      t.on('tick', fn)
      t.emitTick(7)
      expect(fn).toHaveBeenCalledWith({ n: 7 })
    })

    it('on() returns an unsubscribe function', () => {
      const t = new TestTracker()
      const fn = vi.fn()
      const unsub = t.on('tick', fn)
      unsub()
      t.emitTick(1)
      expect(fn).not.toHaveBeenCalled()
    })

    it('multiple listeners can be registered', () => {
      const t = new TestTracker()
      const a = vi.fn()
      const b = vi.fn()
      t.on('tick', a)
      t.on('tick', b)
      t.emitTick(5)
      expect(a).toHaveBeenCalledOnce()
      expect(b).toHaveBeenCalledOnce()
    })
  })

  describe('can be restarted', () => {
    it('start → stop → start attaches twice', () => {
      const t = new TestTracker()
      t.start()
      t.stop()
      t.start()
      expect(t.attachCalls).toBe(2)
      expect(t.detachCalls).toBe(1)
      expect(t.isActive).toBe(true)
    })
  })
})
