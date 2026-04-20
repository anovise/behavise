import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PointerTracker } from '../pointer-tracker.js'

function fireMouseMove(x: number, y: number): void {
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }))
}

describe('PointerTracker', () => {
  let tracker: PointerTracker

  afterEach(() => {
    tracker.reset()
  })

  describe('lifecycle', () => {
    it('starts inactive without autoStart', () => {
      tracker = new PointerTracker()
      expect(tracker.isActive).toBe(false)
    })

    it('starts active with autoStart: true', () => {
      tracker = new PointerTracker({ autoStart: true })
      expect(tracker.isActive).toBe(true)
    })

    it('does not emit events when stopped', () => {
      tracker = new PointerTracker()
      const fn = vi.fn()
      tracker.on('move', fn)
      fireMouseMove(100, 200)
      expect(fn).not.toHaveBeenCalled()
    })
  })

  describe('move event', () => {
    beforeEach(() => {
      tracker = new PointerTracker({ autoStart: true, minDistance: 0 })
    })

    it('emits move with correct coordinates', () => {
      const fn = vi.fn()
      tracker.on('move', fn)
      fireMouseMove(150, 300)
      expect(fn).toHaveBeenCalledWith(expect.objectContaining({ x: 150, y: 300 }))
    })

    it('emitted snapshot includes a timestamp', () => {
      const fn = vi.fn()
      tracker.on('move', fn)
      const before = Date.now()
      fireMouseMove(10, 20)
      const { timestamp } = fn.mock.calls[0]![0] as { timestamp: number }
      expect(timestamp).toBeGreaterThanOrEqual(before)
      expect(timestamp).toBeLessThanOrEqual(Date.now())
    })

    it('updates position after move', () => {
      fireMouseMove(55, 88)
      expect(tracker.position).toEqual({ x: 55, y: 88 })
    })

    it('appends to history', () => {
      fireMouseMove(10, 10)
      fireMouseMove(50, 50)
      expect(tracker.history.length).toBe(2)
    })
  })

  describe('minDistance filter', () => {
    it('ignores moves shorter than minDistance', () => {
      tracker = new PointerTracker({ autoStart: true, minDistance: 20 })
      const fn = vi.fn()
      tracker.on('move', fn)
      fireMouseMove(5, 5) // initial position starts at 0,0 — distance = ~7px < 20
      expect(fn).not.toHaveBeenCalled()
    })

    it('records moves longer than minDistance', () => {
      tracker = new PointerTracker({ autoStart: true, minDistance: 5 })
      const fn = vi.fn()
      tracker.on('move', fn)
      fireMouseMove(0, 0) // distance from 0,0 = 0; skipped
      fireMouseMove(100, 0) // distance = 100px > 5
      expect(fn).toHaveBeenCalledOnce()
    })
  })

  describe('maxSamples cap', () => {
    it('never exceeds maxSamples entries in history', () => {
      tracker = new PointerTracker({ autoStart: true, maxSamples: 3, minDistance: 0 })
      for (let i = 0; i < 10; i++) {
        fireMouseMove(i * 100, 0)
      }
      expect(tracker.history.length).toBeLessThanOrEqual(3)
    })
  })

  describe('reset', () => {
    it('clears history and resets position', () => {
      tracker = new PointerTracker({ autoStart: true, minDistance: 0 })
      fireMouseMove(100, 200)
      tracker.reset()
      expect(tracker.history).toHaveLength(0)
      expect(tracker.position).toEqual({ x: 0, y: 0 })
    })

    it('stops the tracker on reset', () => {
      tracker = new PointerTracker({ autoStart: true })
      tracker.reset()
      expect(tracker.isActive).toBe(false)
    })
  })

  describe('start / stop cycle', () => {
    it('stops recording after stop()', () => {
      tracker = new PointerTracker({ autoStart: true, minDistance: 0 })
      fireMouseMove(10, 10)
      tracker.stop()
      const lenAfterStop = tracker.history.length
      fireMouseMove(200, 200)
      expect(tracker.history.length).toBe(lenAfterStop)
    })

    it('resumes recording after start()', () => {
      tracker = new PointerTracker({ autoStart: true, minDistance: 0 })
      tracker.stop()
      tracker.start()
      fireMouseMove(300, 300)
      expect(tracker.history.length).toBeGreaterThan(0)
    })
  })
})
