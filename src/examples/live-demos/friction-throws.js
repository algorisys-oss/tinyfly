export const html = `<style>
  .ft-lane { position: relative; width: 250px; height: 36px; margin: 6px 0; border-radius: 18px; background: #1b1b1b; }
  .ft-ball { position: absolute; left: 6px; top: 6px; width: 24px; height: 24px; border-radius: 50%; }
  .ft-label { position: absolute; right: 12px; top: 10px; color: #666; font: 11px ui-monospace, monospace; }
  .ft-grid { position: absolute; top: 4px; bottom: 4px; width: 1px; background: #333; }
</style>
<div>
  <div class="ft-lane"><span class="ft-label">friction 2</span><div class="ft-ball" style="background:#4a9eff"></div></div>
  <div class="ft-lane"><span class="ft-label">friction 4</span><div class="ft-ball" style="background:#9b59b6"></div></div>
  <div class="ft-lane"><span class="ft-label">friction 8</span><div class="ft-ball" style="background:#ec4899"></div></div>
  <div class="ft-lane"><span class="ft-label">snap 60</span>
    <div class="ft-grid" style="left:18px"></div><div class="ft-grid" style="left:78px"></div><div class="ft-grid" style="left:138px"></div><div class="ft-grid" style="left:198px"></div>
    <div class="ft-ball" style="background:#3ecf7a"></div>
  </div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  // The same throw, velocity 700px/s, under different friction. No keyframes:
  // each lane is one inertia tween that decides its own duration.
  const [loose, normal, tight, snapped] = root.querySelectorAll('.ft-ball')

  const tl = live.timeline({ repeat: -1, repeatDelay: 0.8 })
  tl.fromTo([loose, normal, tight, snapped], { x: 0 }, { x: 0, duration: 0 })
  tl.to(loose, { inertia: { x: { velocity: 700, friction: 2, max: 214 } } }, 0)
  tl.to(normal, { inertia: { x: { velocity: 700, friction: 4 } } }, 0)
  tl.to(tight, { inertia: { x: { velocity: 700, friction: 8 } } }, 0)
  // Snapping aims the throw at the nearest grid line, keeping its deceleration.
  tl.to(snapped, { inertia: { x: { velocity: 700, end: 60 } } }, 0)
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const frictionThrows = {
  id: 'live-friction-throws',
  name: 'Friction',
  description: 'One throw, four ways: low, default and high friction, and snapping to a grid — the inertia tween option without any dragging.',
  tags: ['inertia', 'friction', 'snap', 'max'],
  html,
  run,
}
