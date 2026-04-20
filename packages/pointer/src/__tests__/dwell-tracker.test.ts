import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DwellTracker } from '../dwell-tracker.js'

function fireMouseMove(x: number, y: number): void {
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }))
}

const ZONE_A = {
  id: 'zone-a',
  rect: { top: 0, left: 0, width: 500, height: 500 },
}

const ZONE_B = {
  id: 'zone-b',
  rect: { top: 600, left: 0, width: 300, height: 200 },
}

describe('DwellTracker', () => {
  let tracker: DwellTracker

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    tracker.reset()
    vi.useRealTimers()
  })

  describe('lifecycle', () => {
    it('starts inactive without autoStart', () => {
      tracker = new DwellTracker()
      expect(tracker.isActive).toBe(false)
    })

    it('starts active with autoStart: true', () => {
      tracker = new DwellTracker({ autoStart: true, zones: [ZONE_A] })
      expect(tracker.isActive).toBe(true)
    })
  })

  describe('dwell event', () => {
    it('emits dwell after threshold elapses without movement', () => {
      tracker = new DwellTracker({ autoStart: true, threshold: 1000, zones: [ZONE_A] })
      const fn = vi.fn()
      tracker.on('dwell', fn)

      fireMouseMove(250, 250) // inside zone-a
      vi.advanceTimersByTime(1001)

      expect(fn).toHaveBeenCalledOnce()
      expect(fn).toHaveBeenCalledWith(expect.objectContaining({ zoneId: 'zone-a' }))
    })

    it('does not emit dwell if pointer moves before threshold', () => {
      tracker = new DwellTracker({ autoStart: true, threshold: 1000, zones: [ZONE_A] })
      const fn = vi.fn()
      tracker.on('dwell', fn)

      fireMouseMove(250, 250)
      vi.advanceTimersByTime(500)
      fireMouseMove(260, 260) // small move resets timer
      vi.advanceTimersByTime(600)

      expect(fn).not.toHaveBeenCalled()
    })

    it('does not emit dwell if pointer is outside all zones', () => {
      tracker = new DwellTracker({ autoStart: true, threshold: 500, zones: [ZONE_A] })
      const fn = vi.fn()
      tracker.on('dwell', fn)

      fireMouseMove(900, 900) // outside zone-a
      vi.advanceTimersByTime(600)

      expect(fn).not.toHaveBeenCalled()
    })

    it('emitted record includes duration and timestamp', () => {
      tracker = new DwellTracker({ autoStart: true, threshold: 500, zones: [ZONE_A] })
      const fn = vi.fn()
      tracker.on('dwell', fn)

      fireMouseMove(100, 100)
      vi.advanceTimersByTime(550)

      const record = fn.mock.calls[0][0] as { duration: number; timestamp: number }
      expect(record.duration).toBeGreaterThanOrEqual(500)
      expect(typeof record.timestamp).toBe('number')
    })
  })

  describe('zone management', () => {
    it('addZone registers a new zone', () => {
      tracker = new DwellTracker({ autoStart: true, threshold: 500 })
      tracker.addZone(ZONE_A)
      const fn = vi.fn()
      tracker.on('dwell', fn)

      fireMouseMove(200, 200)
      vi.advanceTimersByTime(600)

      expect(fn).toHaveBeenCalledWith(expect.objectContaining({ zoneId: 'zone-a' }))
    })

    it('removeZone prevents dwell events for that zone', () => {
      tracker = new DwellTracker({ autoStart: true, threshold: 500, zones: [ZONE_A, ZONE_B] })
      tracker.removeZone('zone-a')
      const fn = vi.fn()
      tracker.on('dwell', fn)

      fireMouseMove(200, 200) // inside zone-a (now removed)
      vi.advanceTimersByTime(600)

      expect(fn).not.toHaveBeenCalled()
    })

    it('fires for correct zone when multiple zones exist', () => {
      tracker = new DwellTracker({ autoStart: true, threshold: 500, zones: [ZONE_A, ZONE_B] })
      const fn = vi.fn()
      tracker.on('dwell', fn)

      fireMouseMove(150, 700) // inside zone-b
      vi.advanceTimersByTime(600)

      expect(fn).toHaveBeenCalledWith(expect.objectContaining({ zoneId: 'zone-b' }))
    })
  })

  describe('tolerance', () => {
    it('does not reset timer for tiny movements within tolerance', () => {
      tracker = new DwellTracker({
        autoStart: true,
        threshold: 1000,
        tolerance: 20,
        zones: [ZONE_A],
      })
      const fn = vi.fn()
      tracker.on('dwell', fn)

      fireMouseMove(250, 250)
      vi.advanceTimersByTime(400)
      fireMouseMove(253, 253) // 3px drift — within tolerance
      vi.advanceTimersByTime(700)

      // Timer should have fired (not reset by the tiny drift)
      expect(fn).toHaveBeenCalledOnce()
    })
  })

  describe('records', () => {
    it('accumulates dwell records', () => {
      tracker = new DwellTracker({ autoStart: true, threshold: 200, zones: [ZONE_A] })

      fireMouseMove(100, 100)
      vi.advanceTimersByTime(250)

      fireMouseMove(400, 400) // reset
      vi.advanceTimersByTime(50)
      fireMouseMove(100, 100) // re-enter
      vi.advanceTimersByTime(250)

      expect(tracker.records.length).toBe(2)
    })
  })

  describe('reset', () => {
    it('clears records on reset', () => {
      tracker = new DwellTracker({ autoStart: true, threshold: 200, zones: [ZONE_A] })
      fireMouseMove(100, 100)
      vi.advanceTimersByTime(250)
      expect(tracker.records.length).toBe(1)
      tracker.reset()
      expect(tracker.records.length).toBe(0)
    })
  })
})
