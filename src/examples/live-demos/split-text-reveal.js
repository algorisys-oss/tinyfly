export const html = `<style>
  .st-heading { margin: 0; color: #fff; font: 800 34px system-ui, sans-serif; letter-spacing: 1px; }
  .st-word { perspective: 400px; }
  .st-char { transform-origin: 50% 100%; }
</style>
<h2 class="st-heading">Split &amp; reveal</h2>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  // Split the heading into word and character spans. Spaces stay real spaces,
  // and the heading keeps an aria-label with its full text.
  live.splitText('.st-heading', { type: 'words,chars', wordsClass: 'st-word', charsClass: 'st-char' })

  live
    .timeline({ repeat: -1, repeatDelay: 0.6 })
    .fromTo(
      '.st-char',
      { opacity: 0, y: 40, rotateX: -90 },
      { opacity: 1, y: 0, rotateX: 0, duration: 0.6, ease: 'back.out', stagger: 0.04 }
    )
    .to('.st-char', { y: -10, duration: 0.2, ease: 'power2.out', stagger: 0.03 }, '+=0.3')
    .to('.st-char', { y: 0, duration: 0.3, ease: 'power2.in', stagger: 0.03 }, '<0.2')
    .to('.st-char', { opacity: 0, y: -24, duration: 0.35, ease: 'power2.in', stagger: { each: 0.02, from: 'end' } }, '+=0.8')
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const splitTextReveal = {
  id: 'live-split-text-reveal',
  name: 'Split Text Reveal',
  description: 'Characters flip up in 3D one after another, ripple in a wave, then leave from the end.',
  tags: ['text', 'splitText', 'stagger', 'rotateX', 'back.out'],
  html,
  run,
}
