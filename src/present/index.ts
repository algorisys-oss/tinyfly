/**
 * @algorisys/tinyfly/present — presentations: slides stepped through with a
 * clicker, each with a scene that plays as the presenter clicks, a presenter
 * window with notes and a clock, countdowns, and one offline HTML file to take
 * to the venue.
 *
 *     const deck = createDeck('#deck', { scenes: { intro: () => ({ marks: [800, 2400], draw }) } })
 *
 * `DeckState` is the same deck without a page: slides, steps, scene clocks and
 * countdowns as plain state, driven by explicit times. `inlineDeck` builds the
 * single file (the `tinyfly present` command wraps it).
 */

export { createDeck } from './deck'
export type { Deck, DeckOptions, DeckScene, DeckSceneFactory, DeckSceneContext, DeckFrame } from './deck'
export { DeckState } from './deck-state'
export type {
  DeckSlideSpec,
  DeckSlide,
  DeckTimer,
  DeckTimerSpec,
  DeckTimerState,
  DeckTimerFrame,
  DeckAdvance,
  DeckHint,
} from './deck-state'
export { DEFAULT_DECK_LABELS } from './deck-labels'
export type { DeckLabels } from './deck-labels'
export { inlineDeck } from './inline-deck'
export type { InlineDeckOptions, InlineDeckResult } from './inline-deck'
