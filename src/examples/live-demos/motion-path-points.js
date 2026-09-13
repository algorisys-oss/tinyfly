import { pointsToPath } from '../../engine'

const POINTS = [
  { x: 10, y: 60 }, { x: 70, y: 15 }, { x: 130, y: 60 }, { x: 190, y: 15 }, { x: 250, y: 60 },
]

const markers = POINTS.map(({ x, y }) => `<div class="pp-marker" style="left:${x - 3}px;top:${y - 3}px"></div>`).join('')

// The guide lines are drawn with the same path the follower takes, so the
// difference curviness makes is visible even before anything moves.
const row = (curviness) => `<div class="pp-row">
  <span class="pp-label">curviness ${curviness}</span>
  <div class="pp-track">
    <svg class="pp-guide" width="260" height="56" viewBox="0 0 260 56"><path d="${pointsToPath(POINTS, { curviness })}" /></svg>
    ${markers}<div class="pp-dot" data-curviness="${curviness}"></div>
  </div>
</div>`

export const html = `<style>
  .pp-row { display: flex; align-items: center; gap: 8px; }
  .pp-label { width: 70px; color: #888; font: 10px ui-monospace, monospace; text-align: right; }
  .pp-track { position: relative; width: 260px; height: 56px; transform: scale(0.72); transform-origin: 0 50%; margin-right: -72px; }
  .pp-guide { position: absolute; left: 0; top: 0; overflow: visible; }
  .pp-guide path { fill: none; stroke: #333; stroke-width: 2; }
  .pp-marker { position: absolute; width: 6px; height: 6px; border-radius: 50%; background: #444; }
  .pp-dot { position: absolute; left: -7px; top: -7px; width: 14px; height: 14px; border-radius: 50%; background: #3ecf7a; }
</style>
<div>${row(0)}${row(1)}${row(2)}</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  // A path through points, no SVG needed. curviness 0 is straight lines,
  // 1 a natural curve, and higher values bow further out.
  const points = [
    { x: 10, y: 60 }, { x: 70, y: 15 }, { x: 130, y: 60 }, { x: 190, y: 15 }, { x: 250, y: 60 },
  ]

  const tl = live.timeline({ repeat: -1, yoyo: true, repeatDelay: 0.3 })
  root.querySelectorAll('.pp-dot').forEach((dot) => {
    const curviness = Number(dot.dataset.curviness)
    tl.to(dot, { motionPath: { path: points, curviness }, duration: 2, ease: 'sine.inOut' }, 0)
  })
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const motionPathPoints = {
  id: 'live-motion-path-points',
  name: 'Path Through Points',
  description: 'Followers pass through the same five points at curviness 0, 1 and 2 — a smooth path without drawing any SVG.',
  tags: ['motionPath', 'points', 'curviness'],
  html,
  run,
}
