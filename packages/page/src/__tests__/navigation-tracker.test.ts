import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NavigationTracker } from '../navigation-tracker.js'

describe('NavigationTracker', () => {
  let tracker: NavigationTracker

  afterEach(() => {
    tracker.reset()
    // Restore any history patches
    vi.restoreAllMocks()
  })

  describe('lifecycle', () => {
    it('starts inactive without autoStart', () => {
      tracker = new NavigationTracker()
      expect(tracker.isActive).toBe(false)
    })

    it('starts active with autoStart: true', () => {
      tracker = new NavigationTracker({ autoStart: true })
      expect(tracker.isActive).toBe(true)
    })
  })

  describe('initial URL tracking', () => {
    it('records the initial page URL on start', () => {
      tracker = new NavigationTracker({ autoStart: true })
      const url = location.href
      expect(tracker.visitCounts[url]).toBe(1)
    })

    it('totalVisits starts at 0 before start', () => {
      tracker = new NavigationTracker()
      expect(tracker.totalVisits).toBe(0)
    })

    it('totalVisits stays at 0 until stop() finalizes the visit', () => {
      tracker = new NavigationTracker({ autoStart: true })
      // Visit is still open (no navigation away yet)
      expect(tracker.totalVisits).toBe(0)
    })

    it('stop() closes the current visit and increments totalVisits', () => {
      tracker = new NavigationTracker({ autoStart: true })
      tracker.stop()
      expect(tracker.totalVisits).toBe(1)
    })
  })

  describe('SPA navigation via pushState', () => {
    beforeEach(() => {
      tracker = new NavigationTracker({ autoStart: true })
    })

    it('detects pushState navigation', () => {
      history.pushState({}, '', '/page-a')
      expect(tracker.visitCounts[location.href]).toBeGreaterThanOrEqual(1)
    })

    it('increments visit count on repeated navigation to same URL', () => {
      history.pushState({}, '', '/same')
      history.pushState({}, '', '/other')
      history.pushState({}, '', '/same')
      const url = location.origin + '/same'
      expect(tracker.visitCounts[url]).toBe(2)
    })

    it('emits visit event on navigation with duration', () => {
      const fn = vi.fn()
      tracker.on('visit', fn)
      history.pushState({}, '', '/new-page')
      expect(fn).toHaveBeenCalledOnce()
      const record = fn.mock.calls[0]![0] as { url: string; duration: number | null }
      expect(typeof record.duration).toBe('number')
    })
  })

  describe('normalizeUrl option', () => {
    it('applies normalizeUrl before storing visit counts', () => {
      tracker = new NavigationTracker({
        autoStart: true,
        normalizeUrl: (url) => url.replace(/\?.*$/, ''),
      })
      history.pushState({}, '', '/page?foo=bar')
      const normalized = location.origin + '/page'
      expect(tracker.visitCounts[normalized]).toBeGreaterThanOrEqual(1)
    })
  })

  describe('visits log', () => {
    it('visits array grows with each navigation', () => {
      tracker = new NavigationTracker({ autoStart: true })
      history.pushState({}, '', '/a')
      history.pushState({}, '', '/b')
      tracker.stop() // close last visit
      expect(tracker.visits.length).toBe(3) // initial + /a + /b
    })

    it('each visit record has url and timestamp fields', () => {
      tracker = new NavigationTracker({ autoStart: true })
      tracker.stop()
      const record = tracker.visits[0]!
      expect(typeof record.url).toBe('string')
      expect(typeof record.timestamp).toBe('number')
    })
  })

  describe('reset', () => {
    it('clears all visit data on reset', () => {
      tracker = new NavigationTracker({ autoStart: true })
      history.pushState({}, '', '/page')
      tracker.reset()
      expect(tracker.totalVisits).toBe(0)
      expect(Object.keys(tracker.visitCounts)).toHaveLength(0)
      expect(tracker.visits).toHaveLength(0)
    })
  })
})
