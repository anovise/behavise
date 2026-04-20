import { BaseTracker } from '@anovise/behavise-core'
import type { Point, TrackerOptions, Timestamped } from '@anovise/behavise-core'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ClickRecord extends Point, Timestamped {
  /** CSS selector or label of the target element */
  target: string
  /** Total click count for this target since tracking started */
  count: number
}

export interface ClickTrackerOptions extends TrackerOptions {
  /**
   * CSS selector used to resolve the target label stored on each click.
   * Defaults to the element's tag + id/class combo.
   */
  resolveTarget?: (el: Element) => string
}

export type ClickTrackerEvents = {
  click: ClickRecord
}

// ─── ClickTracker ────────────────────────────────────────────────────────────

function defaultResolver(el: Element): string {
  let label = el.tagName.toLowerCase()
  if (el.id) label += `#${el.id}`
  else if (el.className && typeof el.className === 'string') {
    const cls = el.className.trim().split(/\s+/).slice(0, 2).join('.')
    if (cls) label += `.${cls}`
  }
  return label
}

/**
 * Counts clicks per element and records click coordinates.
 *
 * @example
 * ```ts
 * const clicks = new ClickTracker({ autoStart: true })
 * clicks.on('click', ({ target, count, x, y }) => console.log(target, count))
 * console.log(clicks.countFor('button#submit')) // 5
 * ```
 */
export class ClickTracker extends BaseTracker<ClickTrackerEvents> {
  private readonly _resolve: (el: Element) => string
  private _counts: Record<string, number> = {}
  private _records: ClickRecord[] = []

  private _handleClick: (e: MouseEvent) => void

  constructor(options: ClickTrackerOptions = {}) {
    super(options)
    this._resolve = options.resolveTarget ?? defaultResolver
    this._handleClick = (e: MouseEvent) => this._onClick(e)
    if (options.autoStart) this.start()
  }

  /** Click counts keyed by resolved target label */
  get counts(): Readonly<Record<string, number>> {
    return this._counts
  }

  /** Full ordered click log */
  get records(): ReadonlyArray<ClickRecord> {
    return this._records
  }

  /** Returns the click count for a specific target label */
  countFor(target: string): number {
    return this._counts[target] ?? 0
  }

  private _onClick(e: MouseEvent): void {
    const el = e.target instanceof Element ? e.target : null
    if (!el) return

    const target = this._resolve(el)
    this._counts[target] = (this._counts[target] ?? 0) + 1

    const record: ClickRecord = {
      target,
      count: this._counts[target]!,
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now(),
    }
    this._records.push(record)
    this.dispatcher.emit('click', record)
  }

  protected _attach(): void {
    document.addEventListener('click', this._handleClick, { capture: true, passive: true })
  }

  protected _detach(): void {
    document.removeEventListener('click', this._handleClick, { capture: true })
  }

  protected override _reset(): void {
    super._reset()
    this._counts = {}
    this._records = []
  }
}
