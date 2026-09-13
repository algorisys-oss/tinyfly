export const html = `<style>
  .mm-button { width: 72px; height: 72px; border: none; border-radius: 16px; background: #262626; cursor: pointer; display: grid; place-items: center; }
  .mm-button:hover { background: #2e2e2e; }
  .mm-icon { fill: #fff; }
  .mm-hint { margin-top: 10px; color: #555; font: 11px system-ui, sans-serif; text-align: center; }
</style>
<div>
  <button class="mm-button" aria-label="Open menu">
    <svg class="mm-svg" width="40" height="40" viewBox="0 0 40 40">
      <path class="mm-icon" d="M6 9 L34 9 L34 12 L6 12 Z M6 18.5 L34 18.5 L34 21.5 L6 21.5 Z M6 28 L34 28 L34 31 L6 31 Z" />
    </svg>
  </button>
  <div class="mm-hint">click to toggle</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  // Three bars and an X, each drawn as three subpaths: the top and bottom bars
  // become the two strokes of the X and the middle bar shrinks to nothing.
  // Subpaths morph pairwise, so each bar visibly turns into its stroke.
  const bars = 'M6 9 L34 9 L34 12 L6 12 Z M6 18.5 L34 18.5 L34 21.5 L6 21.5 Z M6 28 L34 28 L34 31 L6 31 Z'
  const cross =
    'M11.16 9.04 L30.96 28.84 L28.84 30.96 L9.04 11.16 Z ' +
    'M19.5 20 L20.5 20 L20.5 20 L19.5 20 Z ' +
    'M9.04 28.84 L28.84 9.04 L30.96 11.16 L11.16 30.96 Z'

  const button = root.querySelector('.mm-button')
  const icon = root.querySelector('.mm-icon')
  const svg = root.querySelector('.mm-svg')
  let open = false

  const toggle = () => {
    open = !open
    button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
    live.to(icon, { morphSVG: open ? cross : bars, duration: 0.45, ease: 'power3.inOut' })
    live.to(svg, { rotate: open ? 180 : 0, duration: 0.45, ease: 'power3.inOut' })
  }

  button.addEventListener('click', toggle)
  // #endregion code

  return () => button.removeEventListener('click', toggle)
}

/** @type {import('./types').LiveDemo} */
export const menuMorph = {
  id: 'live-menu-morph',
  name: 'Menu Morph',
  description: 'A hamburger icon turns into a close icon: three subpaths morph pairwise while the icon spins.',
  tags: ['morphSVG', 'subpaths', 'click', 'rotate'],
  html,
  run,
}
