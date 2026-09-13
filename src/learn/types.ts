import type { AnimatableValue, TimelineDefinition } from '../engine'

/**
 * A course is plain data: modules of lessons of steps. Each step is some
 * explanation, the markup its preview starts with, the code the learner starts
 * from, a solution, and checks that say whether the code does what the step asks.
 */

export interface Module {
  id: string
  title: string
  summary: string
  lessons: Lesson[]
}

export interface Lesson {
  id: string
  title: string
  summary: string
  steps: Step[]
}

export interface Step {
  id: string
  title: string
  /** Markdown: what to learn and what to do */
  body: string
  /** The preview's HTML, including a `<style>` block */
  markup: string
  /** The code the step starts with */
  starter: string
  /** One correct answer (other answers may pass too) */
  solution: string
  checks: Check[]
  hints?: string[]
}

/** A check passes by returning true, and fails by returning what is still wrong. */
export interface Check {
  label: string
  test: (context: CheckContext) => true | string
}

/** What checks can ask about the code the learner ran. */
export interface CheckContext {
  /** Every timeline the code built, as plain JSON, in the order they were built */
  definitions: TimelineDefinition[]
  /** The preview's root element */
  root: HTMLElement
  /**
   * A property's value on the first element matching `selector`, `seconds` into
   * the animation (as if every timeline had played that long). Undefined when
   * nothing animates it.
   */
  valueAt(selector: string, property: string, seconds: number): AnimatableValue | undefined
  /** Tracks on elements matching `selector` (all tracks when omitted), optionally for one property */
  tracks(selector?: string, property?: string): TimelineDefinition['tracks']
  /** Total length in seconds of the longest timeline the code built (Infinity for endless repeats) */
  duration(): number
  /** Engine target names of the elements matching `selector` */
  targets(selector: string): string[]
}
