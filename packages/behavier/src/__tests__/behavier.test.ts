import { describe, it, expect, vi, afterEach } from 'vitest'
import { createBehavier } from '../behavier.js'

// Mock IntersectionObserver (not available in jsdom by default)
class MockIO {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  constructor(_cb: unknown) {}
}

vi.stubGlobal('IntersectionObserver', MockIO)

describe('createBehavier', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('default instance', () => {
    it('creates all trackers by default', () => {
      const b = createBehavier()
      expect(b.pointer).not.toBeNull()
      expect(b.dwell).not.toBeNull()
      expect(b.navigation).not.toBeNull()
      expect(b.scroll).not.toBeNull()
      expect(b.click).not.toBeNull()
      expect(b.visibility).not.toBeNull()
      b.resetAll()
    })

    it('all trackers start inactive by default', () => {
      const b = createBehavier()
      expect(b.pointer!.isActive).toBe(false)
      expect(b.click!.isActive).toBe(false)
      expect(b.scroll!.isActive).toBe(false)
      b.resetAll()
    })
  })

  describe('autoStart option', () => {
    it('starts trackers when autoStart: true is provided', () => {
      const b = createBehavier({
        pointer: { autoStart: true },
        click: { autoStart: true },
      })
      expect(b.pointer!.isActive).toBe(true)
      expect(b.click!.isActive).toBe(true)
      b.resetAll()
    })
  })

  describe('enabled: false', () => {
    it('sets tracker to null when enabled is false', () => {
      const b = createBehavier({ pointer: { enabled: false } })
      expect(b.pointer).toBeNull()
      b.resetAll()
    })

    it('can disable multiple trackers independently', () => {
      const b = createBehavier({
        dwell: { enabled: false },
        visibility: { enabled: false },
      })
      expect(b.dwell).toBeNull()
      expect(b.visibility).toBeNull()
      expect(b.pointer).not.toBeNull()
      b.resetAll()
    })
  })

  describe('startAll / stopAll / resetAll', () => {
    it('startAll activates all enabled trackers', () => {
      const b = createBehavier()
      b.startAll()
      expect(b.pointer!.isActive).toBe(true)
      expect(b.click!.isActive).toBe(true)
      expect(b.navigation!.isActive).toBe(true)
      b.resetAll()
    })

    it('stopAll deactivates all enabled trackers', () => {
      const b = createBehavier()
      b.startAll()
      b.stopAll()
      expect(b.pointer!.isActive).toBe(false)
      expect(b.click!.isActive).toBe(false)
    })

    it('resetAll stops and clears all trackers', () => {
      const b = createBehavier({ click: { autoStart: true } })
      b.resetAll()
      expect(b.click!.isActive).toBe(false)
    })

    it('startAll/stopAll/resetAll ignore null trackers', () => {
      const b = createBehavier({
        pointer: { enabled: false },
        dwell: { enabled: false },
      })
      expect(() => b.startAll()).not.toThrow()
      expect(() => b.stopAll()).not.toThrow()
      expect(() => b.resetAll()).not.toThrow()
    })
  })

  describe('tracker-specific options are forwarded', () => {
    it('forwards maxSamples to PointerTracker', () => {
      const b = createBehavier({ pointer: { maxSamples: 50, autoStart: true } })
      // We can't directly inspect private fields, but the tracker should be created without error
      expect(b.pointer).not.toBeNull()
      b.resetAll()
    })

    it('forwards threshold to DwellTracker', () => {
      const b = createBehavier({ dwell: { threshold: 2000 } })
      expect(b.dwell).not.toBeNull()
      b.resetAll()
    })

    it('forwards throttleMs to ScrollTracker', () => {
      const b = createBehavier({ scroll: { throttleMs: 250 } })
      expect(b.scroll).not.toBeNull()
      b.resetAll()
    })
  })

  describe('empty options object', () => {
    it('works with an empty options object', () => {
      expect(() => createBehavier({})).not.toThrow()
      const b = createBehavier({})
      b.resetAll()
    })

    it('works with no arguments', () => {
      expect(() => createBehavier()).not.toThrow()
      const b = createBehavier()
      b.resetAll()
    })
  })
})
