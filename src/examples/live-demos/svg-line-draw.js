export const html = `<style>
  .sd-svg { overflow: visible; }
  .sd-line { fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; color: #4a9eff; }
</style>
<svg class="sd-svg" viewBox="0 0 240 120" width="240" height="120">
  <path class="sd-line" d="M10 100 C 50 20, 90 20, 120 60 S 190 110, 230 20" />
  <path class="sd-line" d="M10 60 L 60 60 L 80 25 L 110 100 L 140 40 L 160 60 L 230 60" />
  <circle class="sd-line" cx="120" cy="60" r="46" />
</svg>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const lines = root.querySelectorAll('.sd-line')
  const tl = live.timeline({ repeat: -1, yoyo: true, repeatDelay: 0.5 })

  // drawSVG measures each line's length once and animates its dash, so lines
  // of different lengths all draw in over the same time.
  tl.fromTo(lines, { drawSVG: 0 }, { drawSVG: true, duration: 1.2, ease: 'power2.inOut', stagger: 0.3 })
    // Then shrink each to its middle and back out, a segment rather than a start.
    .to(lines, { drawSVG: '45% 55%', duration: 0.6, ease: 'power2.in', stagger: 0.1 }, '+=0.2')

  // The stroke uses currentColor, so animating `color` recolours the lines.
  tl.fromTo(lines, { color: '#4a9eff' }, { color: '#3ecf7a', duration: 0.5, stagger: 0.1 }, '<')
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const svgLineDraw = {
  id: 'live-svg-line-draw',
  name: 'SVG Line Draw',
  description: 'Lines draw in with drawSVG, shrink to a middle segment and recolour through currentColor.',
  tags: ['svg', 'drawSVG', 'currentColor', 'yoyo'],
  html,
  run,
}
