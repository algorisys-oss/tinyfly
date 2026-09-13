export const html = `<style>
  .im-button { width: 84px; height: 84px; border: none; border-radius: 50%; background: #262626; cursor: pointer; display: grid; place-items: center; }
  .im-button:hover { background: #2e2e2e; }
  .im-icon { fill: #fff; }
  .im-hint { margin-top: 12px; color: #555; font: 11px system-ui, sans-serif; text-align: center; }
</style>
<div>
  <button class="im-button" aria-label="Play">
    <svg width="40" height="40" viewBox="0 0 40 40"><path class="im-icon" d="M12 8 L32 20 L12 32 Z" /></svg>
  </button>
  <div class="im-hint">click to toggle</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  // Two bars as one path with two subpaths. The play triangle is drawn as two
  // halves, so each bar has a half to become — subpaths morph pairwise.
  const play = 'M12 8 L22 14 L22 26 L12 32 Z M22 14 L32 20 L32 20 L22 26 Z'
  const pause = 'M11 9 L17 9 L17 31 L11 31 Z M23 9 L29 9 L29 31 L23 31 Z'

  const button = root.querySelector('.im-button')
  const icon = button.querySelector('.im-icon')
  live.set(icon, { d: play })

  let playing = false
  const toggle = () => {
    playing = !playing
    button.setAttribute('aria-label', playing ? 'Pause' : 'Play')
    live.to(icon, { morphSVG: playing ? pause : play, duration: 0.35, ease: 'back.out' })
    live.fromTo(button, { scale: 0.9 }, { scale: 1, duration: 0.3, ease: 'back.out' })
  }

  button.addEventListener('click', toggle)
  // #endregion code

  return () => button.removeEventListener('click', toggle)
}

/** @type {import('./types').LiveDemo} */
export const iconMorph = {
  id: 'live-icon-morph',
  name: 'Play / Pause Morph',
  description: 'A button icon morphs between play and pause on click. Two subpaths pair up, so each bar grows from half the triangle.',
  tags: ['morphSVG', 'subpaths', 'click', 'back.out'],
  html,
  run,
}
