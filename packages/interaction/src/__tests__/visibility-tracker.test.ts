import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { VisibilityTracker } from '../visibility-tracker.js'

// ─── IntersectionObserver mock ────────────────────────────────────────────────

type IOCallback = (entries: IntersectionObserverEntry[]) => void

let lastCallback: IOCallback | null = null
const observedEls = new Set<Element>()

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds = [0]

  constructor(cb: IOCallback) {
    lastCallback = cb
  }

  observe(el: Element): void {
    observedEls.add(el)
  }

  unobserve(el: Element): void {
    observedEls.delete(el)
  }

  disconnect(): void {
    observedEls.clear()
    lastCallback = null
  }

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

function simulateEntry(el: Element, isIntersecting: boolean): void {
  lastCallback?.([
    {
      target: el,
      isIntersecting,
      boundingClientRect: el.getBoundingClientRect(),
      intersectionRatio: isIntersecting ? 1 : 0,
      intersectionRect: el.getBoundingClientRect(),
      rootBounds: null,
      time: Date.now(),
    } as IntersectionObserverEntry,
  ])
}

describe('VisibilityTracker', () => {
  let tracker: VisibilityTracker
  let el: HTMLDivElement

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    el = document.createElement('div')
    el.id = 'target'
    document.body.appendChild(el)
    observedEls.clear()
    lastCallback = null
  })

  afterEach(() => {
    tracker.reset()
    el.remove()
    vi.unstubAllGlobals()
  })

  describe('lifecycle', () => {
    it('starts inactive without autoStart', () => {
      tracker = new VisibilityTracker()
      expect(tracker.isActive).toBe(false)
    })

    it('starts active with autoStart: true', () => {
      tracker = new VisibilityTracker({ autoStart: true })
      expect(tracker.isActive).toBe(true)
    })
  })

  describe('observe / visibility events', () => {
    beforeEach(() => {
      tracker = new VisibilityTracker({ autoStart: true })
      tracker.observe(el, 'hero')
    })

    it('emits visible event when element enters viewport', () => {
      const fn = vi.fn()
      tracker.on('visible', fn)
      simulateEntry(el, true)
      expect(fn).toHaveBeenCalledOnce()
      expect(fn).toHaveBeenCalledWith(expect.objectContaining({ target: 'hero' }))
    })

    it('emits hidden event when element leaves viewport', () => {
      const fn = vi.fn()
      tracker.on('hidden', fn)
      simulateEntry(el, true)
      simulateEntry(el, false)
      expect(fn).toHaveBeenCalledOnce()
      expect(fn).toHaveBeenCalledWith(expect.objectContaining({ target: 'hero' }))
    })

    it('accumulates totalVisible across multiple intersections', () => {
      vi.useFakeTimers()
      simulateEntry(el, true)
      vi.advanceTimersByTime(1000)
      simulateEntry(el, false)
      simulateEntry(el, true)
      vi.advanceTimersByTime(500)
      simulateEntry(el, false)

      const record = tracker.getRecord(el)
      expect(record?.totalVisible).toBeGreaterThanOrEqual(1500)
      vi.useRealTimers()
    })

    it('increments intersections count per visibility entry', () => {
      simulateEntry(el, true)
      simulateEntry(el, false)
      simulateEntry(el, true)
      simulateEntry(el, false)

      const record = tracker.getRecord(el)
      expect(record?.intersections).toBe(2)
    })
  })

  describe('observe() called before start()', () => {
    it('queues elements and observes them when start() is called', () => {
      tracker = new VisibilityTracker()
      tracker.observe(el, 'queued')
      tracker.start()

      const fn = vi.fn()
      tracker.on('visible', fn)
      simulateEntry(el, true)
      expect(fn).toHaveBeenCalledWith(expect.objectContaining({ target: 'queued' }))
    })
  })

  describe('targets option', () => {
    it('observes initial targets from constructor options', () => {
      tracker = new VisibilityTracker({ autoStart: true, targets: [{ el, label: 'init-target' }] })
      const fn = vi.fn()
      tracker.on('visible', fn)
      simulateEntry(el, true)
      expect(fn).toHaveBeenCalledWith(expect.objectContaining({ target: 'init-target' }))
    })
  })

  describe('unobserve', () => {
    it('stops tracking a specific element', () => {
      tracker = new VisibilityTracker({ autoStart: true })
      tracker.observe(el, 'test')
      tracker.unobserve(el)

      const fn = vi.fn()
      tracker.on('visible', fn)
      simulateEntry(el, true)
      expect(fn).not.toHaveBeenCalled()
    })
  })

  describe('getRecord', () => {
    it('returns undefined for an unobserved element', () => {
      tracker = new VisibilityTracker({ autoStart: true })
      expect(tracker.getRecord(el)).toBeUndefined()
    })

    it('returns a record after observe()', () => {
      tracker = new VisibilityTracker({ autoStart: true })
      tracker.observe(el, 'banner')
      const record = tracker.getRecord(el)
      expect(record).toBeDefined()
      expect(record?.target).toBe('banner')
    })
  })

  describe('hidden event payload', () => {
    it('includes totalVisible and intersections in hidden event', () => {
      tracker = new VisibilityTracker({ autoStart: true })
      tracker.observe(el, 'section')
      const fn = vi.fn()
      tracker.on('hidden', fn)
      simulateEntry(el, true)
      simulateEntry(el, false)
      const payload = fn.mock.calls[0]![0] as {
        totalVisible: number
        intersections: number
        timestamp: number
      }
      expect(typeof payload.totalVisible).toBe('number')
      expect(payload.intersections).toBe(1)
      expect(typeof payload.timestamp).toBe('number')
    })
  })
})
