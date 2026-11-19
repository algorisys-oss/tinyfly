/**
 * The state of a presentation: which slide, which click, where each slide's
 * scene clock is, and its countdown timers.
 *
 * No DOM and no clock of its own: every method that depends on the time takes
 * `now` (ms), so the same calls always give the same state. `createDeck` drives
 * it from the page; tests and other runtimes can drive it directly.
 *
 * A slide's steps come from its `marks`: `marks[0]` is the scene time (ms) where
 * the entrance ends, and `marks[k]` is where click `k` ends. `next()` sets the
 * target to the next mark and `advance()` plays the scene clock up to it.
 * Pressing next while the clock is still running snaps to the mark, so a double
 * press on a clicker never skips a step.
 */

export type DeckTimerState = 'idle' | 'running' | 'done'

/** A countdown on one step of a slide (a poll, a QR code, a question). */
export interface DeckTimerSpec {
  /** The step the countdown belongs to */
  step: number
  /** Its length in seconds */
  seconds: number
}

export interface DeckSlideSpec {
  id: string
  title?: string
  notes?: string
  /** Scene times in ms, one per step (see the file comment). Default `[0]` */
  marks?: number[]
  /** The highest step any markup fragment asks for; marks are padded up to it */
  fragmentSteps?: number
  timers?: DeckTimerSpec[]
}

export interface DeckTimer extends DeckTimerSpec {
  state: DeckTimerState
  /** `now` when it started */
  startedAt: number
  /** `now` when it finished */
  endedAt: number
}

export interface DeckSlide {
  id: string
  title: string
  notes: string
  marks: number[]
  /** Number of clicks on this slide */
  steps: number
  /** The current step, 0 … steps */
  step: number
  /** The scene clock, ms */
  time: number
  /** Where the scene clock is playing to, ms */
  target: number
  timers: DeckTimer[]
}

/** What a scene is told about a slide's countdown while it runs or has finished. */
export interface DeckTimerFrame {
  state: 'running' | 'done'
  /** ms since it started */
  elapsed: number
  seconds: number
  /** ms since it finished (0 while running) */
  sinceEnd: number
}

/** What `next()` did. */
export type DeckAdvance = 'snap' | 'timer-start' | 'timer-end' | 'step' | 'slide' | 'end'

/** What the next press will do, for the presenter view. */
export type DeckHint =
  | { kind: 'timer-start'; seconds: number }
  | { kind: 'timer-end' }
  | { kind: 'step'; step: number }
  | { kind: 'slide'; title: string }
  | { kind: 'end' }

function buildMarks(marks: number[] | undefined, fragmentSteps: number): number[] {
  const result = marks && marks.length > 0 ? marks.slice() : [0]
  while (result.length <= fragmentSteps) result.push(result[result.length - 1])
  return result
}

export class DeckState {
  readonly slides: DeckSlide[]
  /** The current slide, 0-based */
  index = 0
  private fragmentSteps: number[]

  constructor(specs: DeckSlideSpec[]) {
    if (specs.length === 0) throw new Error('A deck needs at least one slide')
    this.fragmentSteps = specs.map((spec) => Math.max(0, spec.fragmentSteps ?? 0))
    this.slides = specs.map((spec, i) => {
      const marks = buildMarks(spec.marks, this.fragmentSteps[i])
      return {
        id: spec.id,
        title: spec.title ?? spec.id,
        notes: spec.notes ?? '',
        marks,
        steps: marks.length - 1,
        step: 0,
        time: marks[0],
        target: marks[0],
        timers: (spec.timers ?? []).map((timer) => ({ ...timer, state: 'idle' as DeckTimerState, startedAt: 0, endedAt: 0 })),
      }
    })
  }

  get slide(): DeckSlide {
    return this.slides[this.index]
  }

  /** True while the current slide's scene clock is still playing to its target. */
  get playing(): boolean {
    return this.slide.time < this.slide.target - 1
  }

  /**
   * Give a slide its marks once its scene is built (scenes are built when first
   * needed). The slide keeps its step, clamped to the new count.
   */
  setMarks(index: number, marks: number[] | undefined): void {
    const slide = this.slides[index]
    slide.marks = buildMarks(marks, this.fragmentSteps[index])
    slide.steps = slide.marks.length - 1
    slide.step = Math.min(slide.step, slide.steps)
    slide.time = slide.target = slide.marks[slide.step]
  }

  /**
   * Show slide `index` at `step` (`'last'` for its final step). With `play`, the
   * scene plays into that step from the one before; otherwise it is shown as it
   * ends. Timers on the slide left and the slide shown go back to idle.
   */
  goTo(index: number, step: number | 'last' = 0, options: { play?: boolean } = {}): void {
    const i = Math.max(0, Math.min(this.slides.length - 1, Math.trunc(index) || 0))
    this.resetTimers(this.slide)
    this.index = i
    const slide = this.slide
    this.resetTimers(slide)
    const k = step === 'last' ? slide.steps : Math.max(0, Math.min(slide.steps, Math.trunc(step) || 0))
    slide.step = k
    slide.target = slide.marks[k]
    slide.time = options.play ? (k > 0 ? slide.marks[k - 1] : 0) : slide.target
  }

  /** The clicker's forward button. */
  next(now: number): DeckAdvance {
    const slide = this.slide
    if (this.playing) {
      slide.time = slide.target
      return 'snap'
    }
    const timer = this.stepTimer()
    if (timer && timer.state === 'idle') {
      this.startTimer(timer, now)
      return 'timer-start'
    }
    if (timer && timer.state === 'running') {
      this.finishTimer(timer, now)
      return 'timer-end'
    }
    if (slide.step < slide.steps) {
      slide.step++
      slide.target = slide.marks[slide.step]
      return 'step'
    }
    if (this.index < this.slides.length - 1) {
      this.goTo(this.index + 1, 0, { play: true })
      return 'slide'
    }
    return 'end'
  }

  /** Back one step, shown as it ends; from a slide's first step, to the end of the slide before. */
  prev(): boolean {
    const slide = this.slide
    if (slide.step > 0) this.goTo(this.index, slide.step - 1)
    else if (this.index > 0) this.goTo(this.index - 1, 'last')
    else return false
    return true
  }

  /** Play the current step again. */
  replay(): void {
    this.goTo(this.index, this.slide.step, { play: true })
  }

  /** The countdown that belongs to the current step, if any. */
  stepTimer(): DeckTimer | undefined {
    const slide = this.slide
    return slide.timers.find((timer) => timer.step === slide.step)
  }

  /**
   * Start a countdown, or end it when it is running: the current step's, or
   * `timer` (one of the current slide's, on a step already reached). False when
   * there is none to toggle.
   */
  toggleTimer(now: number, timer: DeckTimer | undefined = this.stepTimer()): boolean {
    if (!timer || !this.slide.timers.includes(timer) || timer.step > this.slide.step) return false
    if (timer.state === 'running') this.finishTimer(timer, now)
    else this.startTimer(timer, now)
    return true
  }

  /** Move the scene clock on by `dt` ms and finish countdowns that have run out. */
  advance(dt: number, now: number): void {
    const slide = this.slide
    if (slide.time < slide.target) slide.time = Math.min(slide.target, slide.time + Math.max(0, dt))
    for (const timer of slide.timers) {
      if (timer.state === 'running' && now - timer.startedAt >= timer.seconds * 1000) {
        timer.state = 'done'
        timer.endedAt = timer.startedAt + timer.seconds * 1000
      }
    }
  }

  /** The current slide's countdown as a scene sees it: the last one that is running or done. */
  timerFrame(now: number): DeckTimerFrame | null {
    let frame: DeckTimerFrame | null = null
    for (const timer of this.slide.timers) {
      if (timer.state === 'idle') continue
      frame = {
        state: timer.state,
        elapsed: now - timer.startedAt,
        seconds: timer.seconds,
        sinceEnd: timer.state === 'done' ? now - timer.endedAt : 0,
      }
    }
    return frame
  }

  /** Seconds left on a countdown, never below 0. */
  secondsLeft(timer: DeckTimer, now: number): number {
    if (timer.state === 'idle') return timer.seconds
    if (timer.state === 'done') return 0
    // A frame's time can be a little before the press that started the countdown.
    return Math.max(0, Math.min(timer.seconds, timer.seconds - (now - timer.startedAt) / 1000))
  }

  /** What the next press will do. */
  hint(): DeckHint {
    const slide = this.slide
    const timer = this.stepTimer()
    if (timer && timer.state === 'idle') return { kind: 'timer-start', seconds: timer.seconds }
    if (timer && timer.state === 'running') return { kind: 'timer-end' }
    if (slide.step < slide.steps) return { kind: 'step', step: slide.step + 1 }
    const following = this.slides[this.index + 1]
    return following ? { kind: 'slide', title: following.title } : { kind: 'end' }
  }

  private startTimer(timer: DeckTimer, now: number): void {
    timer.state = 'running'
    timer.startedAt = now
    timer.endedAt = 0
  }

  private finishTimer(timer: DeckTimer, now: number): void {
    timer.state = 'done'
    timer.endedAt = now
  }

  private resetTimers(slide: DeckSlide): void {
    for (const timer of slide.timers) {
      timer.state = 'idle'
      timer.startedAt = 0
      timer.endedAt = 0
    }
  }
}
