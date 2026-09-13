export const html = `<style>
  .lm-copy { margin: 0; max-width: 250px; color: #fff; font: 700 22px/1.25 system-ui, sans-serif; }
  .lm-copy em { color: #4a9eff; font-style: normal; }
</style>
<p class="lm-copy">Motion that reads like <em>editorial type</em>, one line at a time, rising from behind its own edge.</p>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  // Lines are measured where the browser wrapped them; each is wrapped in a
  // clipping mask so it can slide up from below its own edge.
  const split = live.splitText('.lm-copy', { type: 'lines', mask: 'lines' })

  live
    .timeline({ repeat: -1, repeatDelay: 0.8 })
    .fromTo(split.lines, { y: 32, rotate: 3 }, { y: 0, rotate: 0, duration: 0.9, ease: 'expo.out', stagger: 0.12 })
    .to(split.lines, { y: -32, duration: 0.5, ease: 'power2.in', stagger: 0.06 }, '+=1.2')
  // #endregion code

  return () => split.revert()
}

/** @type {import('./types').LiveDemo} */
export const lineMaskReveal = {
  id: 'live-line-mask-reveal',
  name: 'Line Mask Reveal',
  description: 'Split a paragraph into its rendered lines and slide each up from behind a mask — the agency-site headline reveal.',
  tags: ['text', 'splitText', 'lines', 'mask', 'expo.out'],
  html,
  run,
}
