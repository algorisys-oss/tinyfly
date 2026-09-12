import type { Timeline } from '../engine'

/**
 * A driver decides *when* a timeline advances and *to what time*.
 *
 * The engine is a pure function of time; drivers are the boundary where
 * real-world input (a clock, a scroll position, a pointer) becomes a time. They
 * may touch the DOM — the engine must never import one.
 */
export interface Driver {
  /** Begin observing. Safe to call twice. */
  start(): void
  /** Stop observing and release listeners. Safe to call twice. */
  stop(): void
  /** Stop, and drop every reference. The driver cannot be restarted. */
  destroy(): void
}

/** Options shared by drivers that advance a timeline. */
export interface DriverOptions {
  /** The timeline to drive */
  timeline: Timeline
  /** Called after each advance, so the host can render */
  onUpdate?: (timeline: Timeline) => void
}
