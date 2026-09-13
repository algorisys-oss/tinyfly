export const html = `<style>
  .ce-wrap { width: 260px; display: grid; grid-template-columns: 70px 1fr; gap: 10px 12px; align-items: center; font: 11px system-ui, sans-serif; color: #999; }
  .ce-curve { width: 70px; height: 46px; overflow: visible; }
  .ce-curve path { fill: none; stroke: #c6ff3d; stroke-width: 2; vector-effect: non-scaling-stroke; }
  .ce-lane { position: relative; height: 46px; border-bottom: 1px solid #2a2a2a; }
  .ce-ball { position: absolute; left: 0; bottom: 0; width: 18px; height: 18px; border-radius: 50%; }
  .ce-hop .ce-ball { background: #c6ff3d; }
  .ce-drop .ce-ball { background: #4a9eff; left: 80px; bottom: auto; top: 0; }
  .ce-shake .ce-ball { background: #ec4899; left: 80px; border-radius: 4px; }
</style>
<div class="ce-wrap">
  <svg class="ce-curve" viewBox="0 -0.2 1 1.4" preserveAspectRatio="none"><g transform="translate(0 1) scale(1 -1)"><path d="M0,0 C0.25,0 0.3,1.35 0.55,1.15 C0.75,1 0.85,1 1,1" /></g></svg>
  <div class="ce-lane ce-hop"><div class="ce-ball"></div></div>
  <span>CustomBounce</span>
  <div class="ce-lane ce-drop"><div class="ce-ball"></div></div>
  <span>CustomWiggle</span>
  <div class="ce-lane ce-shake"><div class="ce-ball"></div></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  // Register eases by name (GSAP's CustomEase / CustomBounce / CustomWiggle.create).
  // A curve drawn in a design tool, pasted as path data: overshoots, then settles.
  const hopPath = root.querySelector('.ce-curve path').getAttribute('d')
  live.customEase('hop', hopPath)
  live.customBounce('drop', { strength: 0.65 })
  live.customWiggle('shake', { wiggles: 7 })

  live
    .timeline({ repeat: -1, repeatDelay: 0.6 })
    .fromTo('.ce-hop .ce-ball', { x: 0 }, { x: 160, duration: 1.2, ease: 'hop' })
    .fromTo('.ce-drop .ce-ball', { y: -2 }, { y: 28, duration: 1.4, ease: 'drop' }, 0)
    .fromTo('.ce-shake .ce-ball', { rotate: 0 }, { rotate: 35, duration: 1.2, ease: 'shake' }, 0)
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const customEasesDemo = {
  id: 'live-custom-eases',
  name: 'Custom Eases',
  description: 'A curve pasted as SVG path data (CustomEase), a ball that lands and rebounds (CustomBounce), and a shake that returns home (CustomWiggle).',
  tags: ['CustomEase', 'CustomBounce', 'CustomWiggle', 'ease'],
  html,
  run,
}
