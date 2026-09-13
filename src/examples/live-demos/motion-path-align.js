export const html = `<style>
  .mp-wrap { position: relative; width: 260px; height: 140px; }
  .mp-svg { position: absolute; left: 0; top: 0; overflow: visible; }
  .mp-route { fill: none; stroke: #333; stroke-width: 2; stroke-dasharray: 6 6; }
  .mp-arrow { position: absolute; left: 0; top: 0; width: 0; height: 0; border-top: 9px solid transparent; border-bottom: 9px solid transparent; border-left: 22px solid #4a9eff; }
  .mp-dot { position: absolute; left: 0; top: 0; width: 10px; height: 10px; border-radius: 50%; background: #ec4899; }
</style>
<div class="mp-wrap">
  <svg class="mp-svg" width="260" height="140" viewBox="0 0 260 140">
    <path class="mp-route" d="M10 110 C 60 -20, 110 160, 150 60 S 230 -10, 250 100" />
  </svg>
  <div class="mp-dot"></div><div class="mp-dot"></div><div class="mp-dot"></div>
  <div class="mp-arrow"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  // align lays the SVG path over the page, so the followers travel along it
  // exactly where it is drawn. autoRotate turns the arrow to face its direction.
  const route = { path: '.mp-route', align: '.mp-route' }

  live
    .timeline({ repeat: -1, repeatDelay: 0.4 })
    .to('.mp-arrow', { motionPath: { ...route, autoRotate: true }, duration: 2.6, ease: 'power1.inOut' })
    .to('.mp-dot', { motionPath: route, duration: 2.6, ease: 'power1.inOut', stagger: 0.18 }, '<0.25')
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const motionPathAlign = {
  id: 'live-motion-path-align',
  name: 'Motion Path',
  description: 'An arrow and a trail of dots follow an SVG path where it is drawn, using align and autoRotate.',
  tags: ['motionPath', 'align', 'autoRotate', 'stagger'],
  html,
  run,
}
