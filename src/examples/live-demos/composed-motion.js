export const html = `<style>
  .cm-wrap { width: 170px; }
  .cm-orb { width: 38px; height: 38px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, #ffd27a, #f59e0b); }
  .cm-square { width: 28px; height: 28px; margin-top: 24px; border-radius: 6px; background: #ec4899; }
</style>
<div class="cm-wrap">
  <div class="cm-orb"></div>
  <div class="cm-square"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 */
export function run(live) {
  // #region code
  // Three independent tweens on the same element, with different durations.
  // They compose: the orb drifts, bobs and pulses at once.
  live.to('.cm-orb', { x: 110, duration: 2.4, ease: 'sine.inOut', repeat: -1, yoyo: true })
  live.to('.cm-orb', { y: -30, duration: 0.6, ease: 'sine.inOut', repeat: -1, yoyo: true })
  live.to('.cm-orb', { scale: 1.3, duration: 1.1, ease: 'power1.inOut', repeat: -1, yoyo: true })

  // A tween added later that drives the same property wins while it runs.
  live.fromTo('.cm-square', { x: 0 }, { x: 110, rotate: 180, duration: 1.2, ease: 'power2.inOut', repeat: -1, yoyo: true })
  live.to('.cm-square', { rotate: 45, duration: 0.3, delay: 1.5 })
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const composedMotion = {
  id: 'live-composed-motion',
  name: 'Composed Tweens',
  description: 'Separate tweens on one element combine instead of overwriting each other — x, y and scale each on their own clock.',
  tags: ['composition', 'repeat', 'yoyo', 'sine.inOut'],
  html,
  run,
}
