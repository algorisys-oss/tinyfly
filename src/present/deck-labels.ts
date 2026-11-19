/**
 * Every word the deck shows, so a deck can speak its audience's language.
 * `{name}` parts are filled in by the deck.
 */
export interface DeckLabels {
  /** A countdown before it starts: `{seconds}` */
  timerStart: string
  timerDone: string
  /** The slide number being typed: `{slide}` */
  goTo: string
  helpTitle: string
  helpNext: string
  helpPrev: string
  helpGoTo: string
  helpEnds: string
  helpBlank: string
  helpFullscreen: string
  helpReplay: string
  helpTimer: string
  helpPresenter: string
  helpHelp: string
  /** The presenter window's title: `{title}` */
  presenterTitle: string
  popupBlocked: string
  /** `{index}` and `{total}` */
  slideOf: string
  /** `{step}` and `{steps}` */
  clicks: string
  /** `{left}` and `{slot}`, both as m:ss */
  timeLeft: string
  overTime: string
  prev: string
  next: string
  resetClock: string
  /** `{seconds}` */
  hintTimerStart: string
  hintTimerEnd: string
  /** `{step}` */
  hintStep: string
  /** `{title}` */
  hintSlide: string
  hintEnd: string
}

export const DEFAULT_DECK_LABELS: DeckLabels = {
  timerStart: '▶ Start {seconds}s timer',
  timerDone: '✓ Time’s up',
  goTo: 'Go to {slide}',
  helpTitle: 'Keys',
  helpNext: 'Next step (also a click)',
  helpPrev: 'Back (also a right click)',
  helpGoTo: 'Go to a slide',
  helpEnds: 'First and last slide',
  helpBlank: 'Black or white screen',
  helpFullscreen: 'Full screen',
  helpReplay: 'Play this step again',
  helpTimer: 'Start or end the countdown',
  helpPresenter: 'Presenter window',
  helpHelp: 'This list',
  presenterTitle: 'Presenter · {title}',
  popupBlocked: 'Allow pop-ups for this page to open the presenter window.',
  slideOf: 'Slide {index} of {total}',
  clicks: '{step}/{steps} clicks',
  timeLeft: '{left} left of {slot}',
  overTime: 'over time',
  prev: '◀ Prev',
  next: 'Next ▶',
  resetClock: 'Reset clock',
  hintTimerStart: 'Next: start the {seconds}s timer',
  hintTimerEnd: 'Timer running (Next ends it)',
  hintStep: 'Next: click {step} on this slide',
  hintSlide: 'Next slide: {title}',
  hintEnd: 'End of deck',
}

/** Fill `{name}` parts of a label. */
export function fillLabel(label: string, values: Record<string, string | number>): string {
  return label.replace(/\{(\w+)\}/g, (whole, name: string) => (name in values ? String(values[name]) : whole))
}
