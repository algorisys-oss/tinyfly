/**
 * Where the stick figure finds the list of actions it can be given. The list
 * comes from the beat scripts (gaits, poses, gags and acting beats), which
 * are built on the figure, so the figure cannot import them without a cycle.
 * The acting module registers the list here when it loads (the characters
 * entry always loads it), and the figure's `about.actions` reads it then.
 */

let provider: (() => Record<string, string>) | undefined

/** Called once by the acting module. */
export function provideFigureActions(list: () => Record<string, string>): void {
  provider = list
}

/** The actions a stick figure can be given, with a line each (empty until the acting module has loaded). */
export function figureActions(): Record<string, string> {
  return provider?.() ?? {}
}
