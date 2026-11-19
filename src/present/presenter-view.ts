import type { DeckState } from './deck-state'
import { fillLabel, type DeckLabels } from './deck-labels'
import { PRESENTER_CSS } from './deck-styles'

/**
 * The presenter's second window: a clock, the time left of the slot, the
 * current slide's title, clicks and notes, and what the next press will do.
 *
 * It is written into a blank window (`window.open('')`), so it works from
 * `file://` and needs no second file. The window holds no state of its own:
 * `update()` writes the deck's state into it.
 */

export interface PresenterViewOptions {
  state: DeckState
  labels: DeckLabels
  /** The deck's name, for the window title */
  title: string
  /** The talk's length in minutes; without it only the elapsed time shows */
  slotMinutes?: number
  onNext: () => void
  onPrev: () => void
  onKey: (event: KeyboardEvent) => void
}

export interface PresenterView {
  /** Open the window, or focus it when it is open */
  open(): void
  /** Write the deck's state into the window (does nothing while it is closed) */
  update(): void
  close(): void
}

/** The clock turns to its warning colour for the last sixth of the slot, at most 5 minutes. */
const warnMs = (slot: number) => Math.min(5 * 60 * 1000, slot / 6)

function clockText(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] as string)
}

export function createPresenterView(options: PresenterViewOptions): PresenterView {
  const { state, labels } = options
  let win: Window | null = null
  let startedAt = 0
  let interval: ReturnType<typeof setInterval> | undefined

  const isOpen = () => win !== null && !win.closed
  const byId = (id: string) => (win as Window).document.getElementById(id) as HTMLElement

  function tick(): void {
    if (!isOpen()) {
      clearInterval(interval)
      return
    }
    const elapsed = Date.now() - startedAt
    const timer = byId('timer')
    timer.textContent = clockText(elapsed)
    if (options.slotMinutes) {
      const slot = options.slotMinutes * 60 * 1000
      timer.className = elapsed > slot ? 'over' : elapsed > slot - warnMs(slot) ? 'warn' : ''
      byId('left').textContent =
        elapsed > slot ? labels.overTime : fillLabel(labels.timeLeft, { left: clockText(slot - elapsed), slot: clockText(slot) })
    }
    byId('clock').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function hintText(): string {
    const hint = state.hint()
    if (hint.kind === 'timer-start') return fillLabel(labels.hintTimerStart, { seconds: hint.seconds })
    if (hint.kind === 'timer-end') return labels.hintTimerEnd
    if (hint.kind === 'step') return fillLabel(labels.hintStep, { step: hint.step })
    if (hint.kind === 'slide') return fillLabel(labels.hintSlide, { title: hint.title })
    return labels.hintEnd
  }

  function update(): void {
    if (!isOpen()) return
    const slide = state.slide
    byId('where').textContent = fillLabel(labels.slideOf, { index: state.index + 1, total: state.slides.length })
    byId('title').textContent = slide.title
    const dots = Array.from({ length: slide.steps }, (_, k) => `<span class="${k < slide.step ? 'on' : ''}"></span>`).join('')
    byId('steps').innerHTML = slide.steps
      ? `${dots} <small>${escapeHtml(fillLabel(labels.clicks, { step: slide.step, steps: slide.steps }))}</small>`
      : ''
    byId('notes').textContent = slide.notes
    byId('next').textContent = hintText()
    tick()
  }

  function open(): void {
    if (isOpen()) {
      ;(win as Window).focus()
      return
    }
    win = window.open('', 'tinyfly-presenter', 'width=1200,height=760')
    if (!win) {
      window.alert(labels.popupBlocked)
      return
    }
    const doc = win.document
    doc.open()
    doc.write(
      `<!doctype html><meta charset="utf-8"><title>${escapeHtml(fillLabel(labels.presenterTitle, { title: options.title }))}</title>` +
        `<style>${PRESENTER_CSS}</style>` +
        '<header><div id="timer">0:00</div><div id="left"></div><div id="clock"></div></header>' +
        '<main><div id="where"></div><div id="title"></div><div id="steps"></div><p id="notes"></p></main>' +
        `<footer><button id="prev">${escapeHtml(labels.prev)}</button><button id="nextb">${escapeHtml(labels.next)}</button>` +
        `<button id="reset">${escapeHtml(labels.resetClock)}</button><div id="next"></div></footer>`
    )
    doc.close()
    startedAt = Date.now()
    byId('prev').onclick = options.onPrev
    byId('nextb').onclick = options.onNext
    byId('reset').onclick = () => {
      startedAt = Date.now()
      tick()
    }
    doc.addEventListener('keydown', options.onKey)
    clearInterval(interval)
    interval = setInterval(tick, 500)
    update()
  }

  function close(): void {
    clearInterval(interval)
    if (isOpen()) (win as Window).close()
    win = null
  }

  return { open, update, close }
}
