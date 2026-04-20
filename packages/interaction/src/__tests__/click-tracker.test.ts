import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ClickTracker } from '../click-tracker.js'

function fireClick(el: Element, x = 100, y = 200): void {
  el.dispatchEvent(
    new MouseEvent('click', { clientX: x, clientY: y, bubbles: true, cancelable: true }),
  )
}

describe('ClickTracker', () => {
  let tracker: ClickTracker
  let btn: HTMLButtonElement

  beforeEach(() => {
    btn = document.createElement('button')
    btn.id = 'submit'
    document.body.appendChild(btn)
  })

  afterEach(() => {
    tracker.reset()
    btn.remove()
  })

  describe('lifecycle', () => {
    it('starts inactive without autoStart', () => {
      tracker = new ClickTracker()
      expect(tracker.isActive).toBe(false)
    })

    it('starts active with autoStart: true', () => {
      tracker = new ClickTracker({ autoStart: true })
      expect(tracker.isActive).toBe(true)
    })

    it('does not record clicks when stopped', () => {
      tracker = new ClickTracker()
      fireClick(btn)
      expect(tracker.records).toHaveLength(0)
    })
  })

  describe('click event', () => {
    beforeEach(() => {
      tracker = new ClickTracker({ autoStart: true })
    })

    it('emits click event on element click', () => {
      const fn = vi.fn()
      tracker.on('click', fn)
      fireClick(btn, 50, 75)
      expect(fn).toHaveBeenCalledOnce()
    })

    it('emitted record contains target, count, x, y, timestamp', () => {
      const fn = vi.fn()
      tracker.on('click', fn)
      fireClick(btn, 50, 75)
      const record = fn.mock.calls[0]![0] as {
        target: string
        count: number
        x: number
        y: number
        timestamp: number
      }
      expect(record.x).toBe(50)
      expect(record.y).toBe(75)
      expect(record.count).toBe(1)
      expect(typeof record.target).toBe('string')
      expect(typeof record.timestamp).toBe('number')
    })
  })

  describe('click count accumulation', () => {
    beforeEach(() => {
      tracker = new ClickTracker({ autoStart: true })
    })

    it('increments count on repeated clicks on the same element', () => {
      fireClick(btn)
      fireClick(btn)
      fireClick(btn)
      const label = 'button#submit'
      expect(tracker.countFor(label)).toBe(3)
    })

    it('counts different elements independently', () => {
      const link = document.createElement('a')
      link.id = 'nav'
      document.body.appendChild(link)

      fireClick(btn)
      fireClick(link)
      fireClick(btn)

      expect(tracker.countFor('button#submit')).toBe(2)
      expect(tracker.countFor('a#nav')).toBe(1)

      link.remove()
    })

    it('countFor returns 0 for unknown target', () => {
      expect(tracker.countFor('span.unknown')).toBe(0)
    })
  })

  describe('default target resolver', () => {
    beforeEach(() => {
      tracker = new ClickTracker({ autoStart: true })
    })

    it('resolves to tagName#id for elements with id', () => {
      const fn = vi.fn()
      tracker.on('click', fn)
      fireClick(btn)
      const { target } = fn.mock.calls[0]![0] as { target: string }
      expect(target).toBe('button#submit')
    })

    it('resolves to tagName.class for elements without id', () => {
      const span = document.createElement('span')
      span.className = 'chip active'
      document.body.appendChild(span)
      const fn = vi.fn()
      tracker.on('click', fn)
      fireClick(span)
      const { target } = fn.mock.calls[0]![0] as { target: string }
      expect(target).toBe('span.chip.active')
      span.remove()
    })
  })

  describe('custom resolveTarget', () => {
    it('uses the custom resolver when provided', () => {
      tracker = new ClickTracker({
        autoStart: true,
        resolveTarget: (el) => el.getAttribute('data-track') ?? el.tagName.toLowerCase(),
      })
      btn.setAttribute('data-track', 'cta-button')
      const fn = vi.fn()
      tracker.on('click', fn)
      fireClick(btn)
      const { target } = fn.mock.calls[0]![0] as { target: string }
      expect(target).toBe('cta-button')
    })
  })

  describe('counts and records getters', () => {
    beforeEach(() => {
      tracker = new ClickTracker({ autoStart: true })
    })

    it('counts object reflects all recorded clicks', () => {
      fireClick(btn)
      fireClick(btn)
      expect(tracker.counts['button#submit']).toBe(2)
    })

    it('records array grows with each click', () => {
      fireClick(btn)
      fireClick(btn)
      expect(tracker.records).toHaveLength(2)
    })
  })

  describe('reset', () => {
    it('clears all counts and records on reset', () => {
      tracker = new ClickTracker({ autoStart: true })
      fireClick(btn)
      tracker.reset()
      expect(tracker.records).toHaveLength(0)
      expect(tracker.countFor('button#submit')).toBe(0)
      expect(tracker.isActive).toBe(false)
    })
  })
})
