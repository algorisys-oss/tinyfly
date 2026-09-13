export const html = `<style>
  .sc-wrap { width: 260px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .sc-headline { margin: 0 0 12px; color: #fff; font-size: 22px; font-weight: 700; letter-spacing: 1px; min-height: 30px; }
  .sc-line { color: #777; font-size: 12px; line-height: 1.7; white-space: pre; }
  .sc-value { color: #3ecf7a; }
</style>
<div class="sc-wrap">
  <h2 class="sc-headline">ANIMATE</h2>
  <div class="sc-line">&gt; access  <span class="sc-value">........</span></div>
  <div class="sc-line">&gt; token   <span class="sc-value">........</span></div>
  <div class="sc-line">&gt; status  <span class="sc-value">........</span></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 */
export function run(live) {
  // #region code
  // Each tween scrambles from whatever the element shows now. The "random"
  // characters are seeded, so scrubbing replays exactly the same frames.
  live
    .timeline({ repeat: -1, repeatDelay: 1 })
    .to('.sc-headline', { scrambleText: 'DECODE', duration: 1.2 })
    .to('.sc-value', {
      scrambleText: { text: 'granted', chars: 'numbers', revealDelay: 0.3 },
      duration: 0.9,
      stagger: 0.25,
    }, '<0.2')
    .to('.sc-headline', { scrambleText: { text: 'DETERMINISM', chars: 'upperAndLowerCase' }, duration: 1.4 }, '+=0.6')
    .to('.sc-headline', { scrambleText: 'ANIMATE', duration: 1 }, '+=1')
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const scrambleText = {
  id: 'live-scramble-text',
  name: 'Scramble Text',
  description: 'A headline decodes into new words and terminal lines resolve one by one. Seeded, so every replay matches.',
  tags: ['scrambleText', 'chars', 'revealDelay', 'stagger'],
  html,
  run,
}
