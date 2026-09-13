export const html = `<style>
  .be-wrap { width: 260px; }
  .be-row { display: flex; align-items: center; gap: 10px; height: 34px; }
  .be-label { width: 78px; flex-shrink: 0; color: #888; font: 11px ui-monospace, monospace; text-align: right; }
  .be-ball { width: 20px; height: 20px; border-radius: 50%; background: #4a9eff; }
  .be-row:nth-child(2) .be-ball { background: #3ecf7a; }
  .be-row:nth-child(3) .be-ball { background: #f59e0b; }
  .be-row:nth-child(4) .be-ball { background: #ec4899; }
</style>
<div class="be-wrap">
  <div class="be-row"><span class="be-label">power2.out</span><div class="be-ball" id="be-power"></div></div>
  <div class="be-row"><span class="be-label">elastic.out</span><div class="be-ball" id="be-elastic"></div></div>
  <div class="be-row"><span class="be-label">bounce.out</span><div class="be-ball" id="be-bounce"></div></div>
  <div class="be-row"><span class="be-label">steps(6)</span><div class="be-ball" id="be-steps"></div></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 */
export function run(live) {
  // #region code
  // Elastic, bounce and steps have no cubic-bezier form. bakeEases samples them
  // into keyframes, so the result is still plain, portable JSON.
  const tl = live.timeline({ repeat: -1, repeatDelay: 0.6, bakeEases: true })

  tl.fromTo('#be-power', { x: 0 }, { x: 130, duration: 1.2, ease: 'power2.out' })
  tl.fromTo('#be-elastic', { x: 0 }, { x: 130, duration: 1.2, ease: 'elastic.out' }, '<')
  tl.fromTo('#be-bounce', { x: 0 }, { x: 130, duration: 1.2, ease: 'bounce.out' }, '<')
  tl.fromTo('#be-steps', { x: 0 }, { x: 130, duration: 1.2, ease: 'steps(6)' }, '<')
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const bakedEases = {
  id: 'live-baked-eases',
  name: 'Elastic, Bounce & Steps',
  description: 'GSAP eases with no bezier equivalent, sampled into keyframes with bakeEases — compared against power2.out.',
  tags: ['easing', 'elastic.out', 'bounce.out', 'steps', 'bakeEases'],
  html,
  run,
}
