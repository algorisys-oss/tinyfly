const tiles = Array.from({ length: 8 }, (_, i) => `<div class="cf-tile"><div class="cf-inner">
  <div class="cf-face cf-front">${i + 1}</div><div class="cf-face cf-back">✦</div>
</div></div>`).join('')

export const html = `<style>
  .cf-grid { display: grid; grid-template-columns: repeat(4, 50px); gap: 10px; }
  .cf-tile { width: 50px; height: 64px; perspective: 400px; }
  .cf-inner { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; }
  .cf-face { position: absolute; inset: 0; border-radius: 8px; display: grid; place-items: center; font: 700 18px system-ui, sans-serif; color: #fff; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
  .cf-front { background: #262626; border: 1px solid #333; }
  .cf-back { background: linear-gradient(135deg, #4a9eff, #9b59b6); transform: rotateY(180deg); }
</style>
<div class="cf-grid">${tiles}</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 */
export function run(live) {
  // #region code
  // Each tile is a front and a back face; rotating the inner wrapper past 90°
  // hides one and shows the other. A centre-out stagger turns it into a ripple.
  live
    .timeline({ repeat: -1, repeatDelay: 0.9, yoyo: true })
    .to('.cf-inner', {
      rotateY: 180,
      duration: 0.7,
      ease: 'power2.inOut',
      stagger: { each: 0.08, from: 'center' },
    })
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const cardFlip3d = {
  id: 'live-card-flip-3d',
  name: 'Card Flip',
  description: 'A grid of tiles flips over in 3D, rippling out from the centre and back.',
  tags: ['rotateY', '3D', 'stagger', 'from: center'],
  html,
  run,
}
