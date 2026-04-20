import { describe, it, expect, vi } from 'vitest'
import { EventDispatcher } from '../dispatcher.js'

interface TestEvents {
  ping: { value: number }
  pong: { message: string }
}

function makeDispatcher() {
  return new EventDispatcher<TestEvents>()
}

describe('EventDispatcher', () => {
  describe('on / emit', () => {
    it('calls registered listener with correct payload', () => {
      const d = makeDispatcher()
      const fn = vi.fn()
      d.on('ping', fn)
      d.emit('ping', { value: 42 })
      expect(fn).toHaveBeenCalledOnce()
      expect(fn).toHaveBeenCalledWith({ value: 42 })
    })

    it('calls multiple listeners for the same event', () => {
      const d = makeDispatcher()
      const a = vi.fn()
      const b = vi.fn()
      d.on('ping', a)
      d.on('ping', b)
      d.emit('ping', { value: 1 })
      expect(a).toHaveBeenCalledOnce()
      expect(b).toHaveBeenCalledOnce()
    })

    it('does not call listener for a different event', () => {
      const d = makeDispatcher()
      const fn = vi.fn()
      d.on('ping', fn)
      d.emit('pong', { message: 'hi' })
      expect(fn).not.toHaveBeenCalled()
    })

    it('emitting with no listeners does not throw', () => {
      const d = makeDispatcher()
      expect(() => d.emit('ping', { value: 0 })).not.toThrow()
    })

    it('returns an unsubscribe function', () => {
      const d = makeDispatcher()
      const fn = vi.fn()
      const unsub = d.on('ping', fn)
      unsub()
      d.emit('ping', { value: 1 })
      expect(fn).not.toHaveBeenCalled()
    })

    it('does not call the same listener twice if registered twice', () => {
      const d = makeDispatcher()
      const fn = vi.fn()
      d.on('ping', fn)
      d.on('ping', fn) // same reference — Set deduplicates
      d.emit('ping', { value: 1 })
      expect(fn).toHaveBeenCalledOnce()
    })
  })

  describe('off', () => {
    it('removes a specific listener', () => {
      const d = makeDispatcher()
      const fn = vi.fn()
      d.on('ping', fn)
      d.off('ping', fn)
      d.emit('ping', { value: 1 })
      expect(fn).not.toHaveBeenCalled()
    })

    it('removing a non-registered listener does not throw', () => {
      const d = makeDispatcher()
      const fn = vi.fn()
      expect(() => d.off('ping', fn)).not.toThrow()
    })

    it('only removes the specified listener, leaving others intact', () => {
      const d = makeDispatcher()
      const a = vi.fn()
      const b = vi.fn()
      d.on('ping', a)
      d.on('ping', b)
      d.off('ping', a)
      d.emit('ping', { value: 1 })
      expect(a).not.toHaveBeenCalled()
      expect(b).toHaveBeenCalledOnce()
    })
  })

  describe('once', () => {
    it('fires the listener exactly once', () => {
      const d = makeDispatcher()
      const fn = vi.fn()
      d.once('ping', fn)
      d.emit('ping', { value: 1 })
      d.emit('ping', { value: 2 })
      expect(fn).toHaveBeenCalledOnce()
      expect(fn).toHaveBeenCalledWith({ value: 1 })
    })

    it('returns an unsubscribe function that prevents the single call', () => {
      const d = makeDispatcher()
      const fn = vi.fn()
      const unsub = d.once('ping', fn)
      unsub()
      d.emit('ping', { value: 1 })
      expect(fn).not.toHaveBeenCalled()
    })
  })

  describe('removeAllListeners', () => {
    it('removes all listeners for a specific event', () => {
      const d = makeDispatcher()
      const a = vi.fn()
      const b = vi.fn()
      d.on('ping', a)
      d.on('pong', b)
      d.removeAllListeners('ping')
      d.emit('ping', { value: 1 })
      d.emit('pong', { message: 'hi' })
      expect(a).not.toHaveBeenCalled()
      expect(b).toHaveBeenCalledOnce()
    })

    it('removes all listeners for all events when called without argument', () => {
      const d = makeDispatcher()
      const a = vi.fn()
      const b = vi.fn()
      d.on('ping', a)
      d.on('pong', b)
      d.removeAllListeners()
      d.emit('ping', { value: 1 })
      d.emit('pong', { message: 'hi' })
      expect(a).not.toHaveBeenCalled()
      expect(b).not.toHaveBeenCalled()
    })
  })
})
