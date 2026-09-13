export const html = `<style>
  .sm-svg { overflow: visible; }
  .sm-shape { fill: currentColor; color: #4a9eff; }
  .sm-targets { display: none; }
</style>
<svg class="sm-svg" width="140" height="140" viewBox="0 0 140 140">
  <circle class="sm-shape" cx="70" cy="70" r="55" />
  <g class="sm-targets">
    <path id="sm-star" d="M70 8 L85 50 L130 52 L94 80 L107 124 L70 98 L33 124 L46 80 L10 52 L55 50 Z" />
    <path id="sm-heart" d="M70 124 C 20 90, 5 60, 22 35 C 38 12, 62 18, 70 40 C 78 18, 102 12, 118 35 C 135 60, 120 90, 70 124 Z" />
    <path id="sm-blob" d="M70 12 C 110 10, 132 40, 128 72 C 124 108, 96 130, 64 126 C 28 122, 8 96, 14 62 C 18 30, 38 14, 70 12 Z" />
  </g>
</svg>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 */
export function run(live) {
  // #region code
  // A <circle> has no path data to animate, so turn it into an equivalent <path>
  // first. The target shapes are hidden paths in the same SVG.
  const [shape] = live.convertToPath('.sm-shape')
  const circle = shape.getAttribute('d')

  // Each morph starts from whatever the shape is when it begins. tinyfly pairs
  // up the points so nothing twists, and keeps the star's corners sharp.
  live
    .timeline({ repeat: -1, repeatDelay: 0.3 })
    .fromTo(shape, { color: '#4a9eff' }, { morphSVG: '#sm-star', color: '#f59e0b', duration: 0.9, ease: 'power2.inOut' })
    .to(shape, { morphSVG: '#sm-heart', color: '#ec4899', duration: 0.9, ease: 'power2.inOut' }, '+=0.4')
    .to(shape, { morphSVG: '#sm-blob', color: '#3ecf7a', duration: 0.9, ease: 'power2.inOut' }, '+=0.4')
    .to(shape, { morphSVG: circle, color: '#4a9eff', duration: 0.9, ease: 'power2.inOut' }, '+=0.4')
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const shapeMorph = {
  id: 'live-shape-morph',
  name: 'Shape Morph',
  description: 'A circle becomes a star, a heart and a blob, and back. Points are matched so nothing twists, and corners stay sharp.',
  tags: ['morphSVG', 'convertToPath', 'currentColor'],
  html,
  run,
}
