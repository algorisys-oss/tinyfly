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

  // A dash as long as the line, offset by its full length, hides it. Animating the
  // offset to 0 draws it in. Lengths differ, so each line gets its own tween.
  lines.forEach((line, i) => {
    const length = line.getTotalLength()
    line.style.strokeDasharray = String(length)
    tl.fromTo(line, { strokeDashoffset: length }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, i * 0.3)
  })

  // The stroke uses currentColor, so animating `color` recolours the lines.
  tl.fromTo(lines, { color: '#4a9eff' }, { color: '#3ecf7a', duration: 0.5, stagger: 0.1 }, '>-0.3')
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const svgLineDraw = {
  id: 'live-svg-line-draw',
  name: 'SVG Line Draw',
  description: 'Lines draw themselves with stroke-dashoffset, then recolour through currentColor. No plugin needed.',
  tags: ['svg', 'strokeDashoffset', 'currentColor', 'yoyo'],
  html,
  run,
}
