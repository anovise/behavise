import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryAdapter, LocalStorageAdapter } from '../storage.js'

// ─── MemoryAdapter ────────────────────────────────────────────────────────────

describe('MemoryAdapter', () => {
  let store: MemoryAdapter

  beforeEach(() => {
    store = new MemoryAdapter()
  })

  it('returns undefined for a key that has not been set', () => {
    expect(store.get('missing')).toBeUndefined()
  })

  it('stores and retrieves a value', () => {
    store.set('key', 42)
    expect(store.get('key')).toBe(42)
  })

  it('overwrites an existing value', () => {
    store.set('key', 'first')
    store.set('key', 'second')
    expect(store.get<string>('key')).toBe('second')
  })

  it('deletes a key', () => {
    store.set('key', 'value')
    store.delete('key')
    expect(store.get('key')).toBeUndefined()
  })

  it('deleting a non-existent key does not throw', () => {
    expect(() => store.delete('nope')).not.toThrow()
  })

  it('clear removes all keys', () => {
    store.set('a', 1)
    store.set('b', 2)
    store.clear()
    expect(store.get('a')).toBeUndefined()
    expect(store.get('b')).toBeUndefined()
    expect(store.keys()).toHaveLength(0)
  })

  it('keys returns all stored keys', () => {
    store.set('x', 1)
    store.set('y', 2)
    expect(store.keys()).toEqual(expect.arrayContaining(['x', 'y']))
    expect(store.keys()).toHaveLength(2)
  })

  it('stores complex objects', () => {
    const obj = { nested: { value: [1, 2, 3] } }
    store.set('obj', obj)
    expect(store.get('obj')).toEqual(obj)
  })
})

// ─── LocalStorageAdapter ──────────────────────────────────────────────────────

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter

  beforeEach(() => {
    localStorage.clear()
    adapter = new LocalStorageAdapter('test')
  })

  it('returns undefined for a missing key', () => {
    expect(adapter.get('missing')).toBeUndefined()
  })

  it('stores and retrieves a value', () => {
    adapter.set('num', 99)
    expect(adapter.get<number>('num')).toBe(99)
  })

  it('persists data in localStorage with the correct prefix', () => {
    adapter.set('k', 'v')
    expect(localStorage.getItem('test:k')).toBe('"v"')
  })

  it('different prefixes are isolated', () => {
    const a = new LocalStorageAdapter('ns-a')
    const b = new LocalStorageAdapter('ns-b')
    a.set('key', 'alpha')
    b.set('key', 'beta')
    expect(a.get<string>('key')).toBe('alpha')
    expect(b.get<string>('key')).toBe('beta')
  })

  it('deletes a specific key', () => {
    adapter.set('del', 'bye')
    adapter.delete('del')
    expect(adapter.get('del')).toBeUndefined()
  })

  it('clear only removes keys with its prefix', () => {
    const other = new LocalStorageAdapter('other')
    adapter.set('mine', 1)
    other.set('yours', 2)
    adapter.clear()
    expect(adapter.get('mine')).toBeUndefined()
    expect(other.get<number>('yours')).toBe(2)
  })

  it('keys returns only keys belonging to this prefix', () => {
    const other = new LocalStorageAdapter('other')
    adapter.set('a', 1)
    adapter.set('b', 2)
    other.set('c', 3)
    expect(adapter.keys()).toEqual(expect.arrayContaining(['a', 'b']))
    expect(adapter.keys()).not.toContain('c')
    expect(adapter.keys()).toHaveLength(2)
  })

  it('returns undefined for invalid JSON (corrupted value)', () => {
    localStorage.setItem('test:bad', 'not-json{{{')
    expect(adapter.get('bad')).toBeUndefined()
  })

  it('stores complex objects via JSON serialization', () => {
    const data = { arr: [1, 2], flag: true }
    adapter.set('data', data)
    expect(adapter.get('data')).toEqual(data)
  })
})
