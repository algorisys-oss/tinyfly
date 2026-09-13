import type { LiveApi } from '../../compat/gsap'

/**
 * A GSAP-style example that runs real `live` code on the Examples page.
 *
 * `run` receives a `live` API bound to a stage scoped to the card, so selectors
 * like `'.cell'` only match inside that card — exactly as they would match
 * inside your page. It may return a cleanup function for anything it set up
 * outside tinyfly (event listeners); the page destroys the stage itself.
 *
 * Demos are written in plain JavaScript (JSDoc for types), because the code
 * shown on the card — read from the demo's own source file between
 * `// #region code` and `// #endregion code` — is also what "Copy code" puts in
 * a standalone page. It cannot drift from what runs, and it runs when pasted.
 */
export interface LiveDemo {
  id: string
  name: string
  description: string
  tags: string[]
  /** Markup the demo animates, including a scoped `<style>` block */
  html: string
  run(live: LiveApi, root: HTMLElement): void | (() => void)
}
