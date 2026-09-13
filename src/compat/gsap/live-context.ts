/**
 * Scoped setup and cleanup for the live runtime — GSAP's `gsap.context()` and
 * `gsap.matchMedia()`.
 *
 *     const ctx = live.context(() => {
 *       live.from('.card', { y: 40, stagger: 0.1 })
 *       live.timeline({ scrollTrigger: { pin: true, … } }).to(…)
 *     }, section)
 *     ctx.revert()   // kills it all, removes pins, restores the elements' styles
 *
 *     const mm = live.matchMedia()
 *     mm.add({ desktop: '(min-width: 800px)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
 *       if (ctx.conditions.reduce) return
 *       …
 *     })
 *
 * While a context's function runs, everything the live API creates registers
 * with it: timelines and tweens (and so their scroll triggers and pins), split
 * text, draggables, stand-alone scroll triggers and ticker callbacks. Anything
 * created later — in an event handler — joins by running inside `ctx.add()`.
 *
 * Reverting kills what was created, newest first, then restores each element
 * the context animated to the inline style (and SVG `d`) it had before, and
 * makes the stage forget the values it applied, so a later setup starts clean.
 */

/** Something a context can undo. */
export interface Revertible {
  revert?(): unknown
  kill?(): unknown
  destroy?(): unknown
}

/** What the live API reports to the context that is currently collecting. */
export interface ContextCollector {
  /** Selectors resolve within this, when given */
  readonly scope?: ParentNode
  track(item: Revertible): void
  /** Called before an element is first written to */
  touch(element: Element, name: string): void
}

/** How a context switches collection on and off, and forgets applied values. */
export interface ContextHost {
  readonly collector: ContextCollector | undefined
  setCollector(collector: ContextCollector | undefined): void
  forget(name: string): void
}

interface Snapshot {
  name: string
  style: string | null
  d: string | null
}

export class LiveContext implements ContextCollector {
  /** For contexts made by matchMedia: which named queries match */
  conditions: Record<string, boolean> = {}

  readonly scope?: ParentNode
  private readonly host: ContextHost
  private readonly items: Revertible[] = []
  private readonly snapshots = new Map<Element, Snapshot>()

  constructor(host: ContextHost, scope?: ParentNode) {
    this.host = host
    this.scope = scope
  }

  /**
   * Run `fn` with this context collecting, and return what it returns. A function
   * it returns is kept as cleanup and called on `revert()`.
   */
  add<T>(fn: () => T): T {
    const previous = this.host.collector
    this.host.setCollector(this)
    try {
      const result = fn()
      if (typeof result === 'function') this.items.push({ revert: result as () => unknown })
      return result
    } finally {
      this.host.setCollector(previous)
    }
  }

  track(item: Revertible): void {
    this.items.push(item)
  }

  touch(element: Element, name: string): void {
    if (this.snapshots.has(element)) return
    this.snapshots.set(element, { name, style: element.getAttribute('style'), d: element.getAttribute('d') })
  }

  /** Undo everything, newest first, and restore the elements this context animated. */
  revert(): void {
    for (const item of this.items.splice(0).reverse()) {
      if (item.revert) item.revert()
      else if (item.kill) item.kill()
      else item.destroy?.()
    }
    for (const [element, { name, style, d }] of this.snapshots) {
      if (style === null) element.removeAttribute('style')
      else element.setAttribute('style', style)
      if (d !== null) element.setAttribute('d', d)
      this.host.forget(name)
    }
    this.snapshots.clear()
  }

  /** Same as `revert()`: GSAP's name for dropping a context. */
  kill(): void {
    this.revert()
  }
}

type Conditions = string | Record<string, string>

interface MediaEntry {
  conditions: Conditions
  setup: (context: LiveContext) => unknown
  queries: Map<string, MediaQueryList>
  context?: LiveContext
  /** The condition values the current context was set up for */
  key?: string
}

/**
 * Setups that apply while media queries match. Each `add()` runs its setup in a
 * context when (any of) its queries match, reverts it when they stop matching,
 * and runs it again for the new conditions when they change.
 */
export class LiveMatchMedia {
  private readonly host: ContextHost
  private readonly scope?: ParentNode
  private readonly entries: MediaEntry[] = []
  private readonly listeners: Array<() => void> = []
  private scheduled = false

  constructor(host: ContextHost, scope?: ParentNode) {
    this.host = host
    this.scope = scope
  }

  add(conditions: Conditions, setup: (context: LiveContext) => unknown): this {
    const entry: MediaEntry = { conditions, setup, queries: new Map() }
    const named = typeof conditions === 'string' ? { matches: conditions } : conditions
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      for (const [name, query] of Object.entries(named)) {
        const list = window.matchMedia(query)
        entry.queries.set(name, list)
        const onChange = () => this.scheduleUpdate()
        list.addEventListener('change', onChange)
        this.listeners.push(() => list.removeEventListener('change', onChange))
      }
    }
    this.entries.push(entry)
    this.update(entry)
    return this
  }

  /** Revert every active setup and stop listening. */
  revert(): void {
    for (const remove of this.listeners.splice(0)) remove()
    for (const entry of this.entries.splice(0)) entry.context?.revert()
  }

  kill(): void {
    this.revert()
  }

  /** Several queries change on one resize; handle them together. */
  private scheduleUpdate(): void {
    if (this.scheduled) return
    this.scheduled = true
    queueMicrotask(() => {
      this.scheduled = false
      for (const entry of this.entries) this.update(entry)
    })
  }

  private update(entry: MediaEntry): void {
    const values: Record<string, boolean> = {}
    for (const [name, list] of entry.queries) values[name] = list.matches
    const active = Object.values(values).some(Boolean)
    const key = active ? JSON.stringify(values) : undefined
    if (key === entry.key) return

    entry.context?.revert()
    entry.context = undefined
    entry.key = key
    if (!active) return

    const context = new LiveContext(this.host, this.scope)
    context.conditions = values
    context.add(() => entry.setup(context))
    entry.context = context
  }
}
