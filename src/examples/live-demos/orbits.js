export const html = `<style>
  .ob-space { position: relative; width: 170px; height: 170px; }
  .ob-svg { position: absolute; left: 0; top: 0; overflow: visible; }
  .ob-orbit { fill: none; stroke: #262626; stroke-width: 1.5; }
  .ob-sun { position: absolute; left: 70px; top: 70px; width: 30px; height: 30px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #ffe08a, #f59e0b); box-shadow: 0 0 24px rgba(245, 158, 11, 0.6); }
  .ob-planet { position: absolute; left: 0; top: 0; border-radius: 50%; }
  .ob-rocket { position: absolute; left: 0; top: 0; width: 0; height: 0; border-top: 5px solid transparent; border-bottom: 5px solid transparent; border-left: 14px solid #ec4899; }
</style>
<div class="ob-space">
  <svg class="ob-svg" width="170" height="170" viewBox="0 0 170 170">
    <circle class="ob-orbit" id="ob-inner" cx="85" cy="85" r="34" />
    <circle class="ob-orbit" id="ob-middle" cx="85" cy="85" r="56" />
    <ellipse class="ob-orbit" id="ob-outer" cx="85" cy="85" rx="82" ry="70" />
  </svg>
  <div class="ob-sun"></div>
  <div class="ob-planet" id="ob-p1" style="width: 10px; height: 10px; background: #4a9eff"></div>
  <div class="ob-planet" id="ob-p2" style="width: 14px; height: 14px; background: #3ecf7a"></div>
  <div class="ob-rocket"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 */
export function run(live) {
  // #region code
  // Orbits are plain SVG circles and an ellipse. A basic shape works as a motion
  // path directly, and align puts each follower on the orbit where it is drawn.
  const orbit = (selector) => ({ path: selector, align: selector })

  live.to('#ob-p1', { motionPath: orbit('#ob-inner'), duration: 3, ease: 'none', repeat: -1 })
  live.to('#ob-p2', { motionPath: orbit('#ob-middle'), duration: 5.5, ease: 'none', repeat: -1 })
  // The rocket faces the way it travels.
  live.to('.ob-rocket', { motionPath: { ...orbit('#ob-outer'), autoRotate: true }, duration: 8, ease: 'none', repeat: -1 })
  live.to('.ob-sun', { scale: 1.12, duration: 1.6, ease: 'sine.inOut', repeat: -1, yoyo: true })
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const orbits = {
  id: 'live-orbits',
  name: 'Orbits',
  description: 'Planets and a rocket travel SVG circles and an ellipse — basic shapes as motion paths, aligned and auto-rotated.',
  tags: ['motionPath', 'circle', 'align', 'repeat: -1'],
  html,
  run,
}
