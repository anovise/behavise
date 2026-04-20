import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ScrollTracker } from '../scroll-tracker.js'

function fireScroll(): void {
  window.dispatchEvent(new Event('scroll'))
}

/** Simulate scrolling by manipulating jsdom scroll properties */
function setScrollPosition(y: number): void {
  Object.defineProperty(window, 'scrollY', { value: y, writable: true, configurable: true })
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: y + window.innerHeight + 400,
    writable: true,
    configurable: true,
  })
  fireScroll()
}

describe('ScrollTracker', () => {
  let tracker: ScrollTracker

  beforeEach(() => {
    vi.useFakeTimers()
    // Reset scroll
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
    Object.defineProperty(window, 'scrollX', { value: 0, writable: true, configurable: true })
  })

  afterEach(() => {
    tracker.reset()
    vi.useRealTimers()
  })

  describe('lifecycle', () => {
    it('starts inactive without autoStart', () => {
      tracker = new ScrollTracker()
      expect(tracker.isActive).toBe(false)
    })

    it('starts active with autoStart: true', () => {
      tracker = new ScrollTracker({ autoStart: true })
      expect(tracker.isActive).toBe(true)
    })

    it('does not record scroll when stopped', () => {
      tracker = new ScrollTracker()
      vi.useFakeTimers()
      fireScroll()
      vi.advanceTimersByTime(200)
      expect(tracker.snapshots).toHaveLength(0)
    })
  })

  describe('scroll events', () => {
    beforeEach(() => {
      tracker = new ScrollTracker({ autoStart: true, throttleMs: 0 })
    })

    it('emits scroll event on window scroll', () => {
      const fn = vi.fn()
      tracker.on('scroll', fn)
      fireScroll()
      expect(fn).toHaveBeenCalledOnce()
    })

    it('snapshot includes x, y, depthPercent, maxDepthPercent, timestamp', () => {
      const fn = vi.fn()
      tracker.on('scroll', fn)
      fireScroll()
      const snap = fn.mock.calls[0]![0] as {
        x: number
        y: number
        depthPercent: number
        maxDepthPercent: number
        timestamp: number
      }
      expect(typeof snap.x).toBe('number')
      expect(typeof snap.y).toBe('number')
      expect(typeof snap.depthPercent).toBe('number')
      expect(typeof snap.maxDepthPercent).toBe('number')
      expect(typeof snap.timestamp).toBe('number')
    })
  })

  describe('depthPercent calculation', () => {
    it('calculates depth as percentage of scrollable height', () => {
      tracker = new ScrollTracker({ autoStart: true, throttleMs: 0 })
      // Set scrollY = 200, scrollHeight = 200 + innerHeight + 200 → maxScroll = 200
      Object.defineProperty(window, 'scrollY', { value: 200, writable: true, configurable: true })
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: window.innerHeight + 400,
        writable: true,
        configurable: true,
      })
      const fn = vi.fn()
      tracker.on('scroll', fn)
      fireScroll()
      const snap = fn.mock.calls[0]![0] as { depthPercent: number }
      expect(snap.depthPercent).toBeGreaterThan(0)
      expect(snap.depthPercent).toBeLessThanOrEqual(100)
    })

    it('depth is 0 when at top of page', () => {
      tracker = new ScrollTracker({ autoStart: true, throttleMs: 0 })
      const fn = vi.fn()
      tracker.on('scroll', fn)
      fireScroll()
      const snap = fn.mock.calls[0]![0] as { depthPercent: number }
      expect(snap.depthPercent).toBe(0)
    })
  })

  describe('maxDepth', () => {
    it('tracks the maximum depth reached', () => {
      tracker = new ScrollTracker({ autoStart: true, throttleMs: 0 })
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true, configurable: true })
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: window.innerHeight + 1000,
        writable: true,
        configurable: true,
      })
      fireScroll()
      const maxAfterDeep = tracker.maxDepth

      // Scroll back up
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
      fireScroll()

      expect(tracker.maxDepth).toBe(maxAfterDeep)
      expect(tracker.maxDepth).toBeGreaterThan(0)
    })
  })

  describe('throttling', () => {
    it('throttles rapid scroll events', () => {
      tracker = new ScrollTracker({ autoStart: true, throttleMs: 500 })
      const fn = vi.fn()
      tracker.on('scroll', fn)

      fireScroll()
      fireScroll()
      fireScroll()
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledOnce()
    })

    it('records second scroll after throttle window elapses', () => {
      tracker = new ScrollTracker({ autoStart: true, throttleMs: 100 })
      const fn = vi.fn()
      tracker.on('scroll', fn)

      fireScroll()
      vi.advanceTimersByTime(150)
      fireScroll()

      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('position getter', () => {
    it('returns {0,0} before any scroll', () => {
      tracker = new ScrollTracker({ autoStart: true, throttleMs: 0 })
      expect(tracker.position).toEqual({ x: 0, y: 0 })
    })
  })

  describe('reset', () => {
    it('clears snapshots and maxDepth on reset', () => {
      tracker = new ScrollTracker({ autoStart: true, throttleMs: 0 })
      fireScroll()
      tracker.reset()
      expect(tracker.snapshots).toHaveLength(0)
      expect(tracker.maxDepth).toBe(0)
    })
  })
})
