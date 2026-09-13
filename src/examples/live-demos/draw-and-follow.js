export const html = `<style>
  .df-wrap { position: relative; width: 260px; height: 140px; }
  .df-svg { position: absolute; left: 0; top: 0; overflow: visible; }
  .df-guide { fill: none; stroke: #262626; stroke-width: 3; }
  .df-line { fill: none; stroke: #4a9eff; stroke-width: 3; stroke-linecap: round; }
  .df-dot { position: absolute; left: 0; top: 0; width: 14px; height: 14px; border-radius: 50%; background: #fff; box-shadow: 0 0 12px #4a9eff; }
</style>
<div class="df-wrap">
  <svg class="df-svg" width="260" height="140" viewBox="0 0 260 140">
    <path class="df-guide" d="M12 120 C 40 20, 80 20, 100 70 S 150 130, 175 60 S 230 10, 248 30" />
    <path class="df-line" d="M12 120 C 40 20, 80 20, 100 70 S 150 130, 175 60 S 230 10, 248 30" />
  </svg>
  <div class="df-dot"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  // The line draws itself while a dot rides its tip: the same path, the same
  // duration and ease, once as drawSVG and once as a motion path.
  const line = root.querySelector('.df-line')

  const draw = { duration: 2.2, ease: 'power1.inOut' }
  live
    .timeline({ repeat: -1, repeatDelay: 0.6, yoyo: true })
    .fromTo(line, { drawSVG: 0 }, { drawSVG: '100%', ...draw })
    .to('.df-dot', { motionPath: { path: line, align: line }, ...draw }, '<')
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const drawAndFollow = {
  id: 'live-draw-and-follow',
  name: 'Draw & Follow',
  description: 'A path draws itself while a glowing dot rides its tip — stroke-dashoffset and motionPath in lockstep.',
  tags: ['motionPath', 'align', 'drawSVG', 'yoyo'],
  html,
  run,
}
