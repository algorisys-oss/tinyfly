import { deserializeTimeline } from '../../engine'
import { loadScene3D, drawScene3D } from '../../scene-3d'
import { lossSurface3D } from '../../math/browser-entry'

// On a standalone page these come from the `tinyfly` global (with tinyfly-scene-3d.iife.js
// and tinyfly-math.iife.js loaded); here from the source modules, so the code runs unchanged in both.
const tinyfly = { deserializeTimeline, loadScene3D, drawScene3D, lossSurface3D }

export const html = `<style>
.lsf-wrap { display:grid;gap:10px;width:100%;max-width:min(720px,calc(100vw - 24px));min-width:0; }
.lsf-canvas { display:block;width:100%;height:auto;aspect-ratio:16/9;border-radius:12px;background:#0f1117; }
.lsf-controls { display:flex;flex-wrap:wrap;gap:12px;align-items:center;font:13px system-ui;color:#cbd5e1; }
.lsf-readout { font:13px ui-monospace,SFMono-Regular,Menlo,monospace;color:#9bb4c7;min-height:1.4em; }
</style><div class="lsf-wrap">
<canvas class="lsf-canvas" width="720" height="405"></canvas>
<div class="lsf-controls"><label>Descent <select class="lsf-kind">
<option value="0.18|0.6">step 0.18, momentum 0.6</option><option value="0.12|0">step 0.12, no momentum</option><option value="0.45|0">step 0.45: zigzag</option>
</select></label></div>
<div class="lsf-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const ctx = root.querySelector('.lsf-canvas').getContext('2d')
  const picker = root.querySelector('.lsf-kind')
  const readout = root.querySelector('.lsf-readout')
  const clock = { time: 0 }
  let loss, scene, timeline, tween

  const build = () => {
    const [rate, momentum] = picker.value.split('|').map(Number)
    // A bowl with a ripple: f(x, y) = (x² + 4y²) / 4 + sin(1.5x) / 2.
    loss = tinyfly.lossSurface3D({ expr: '(x^2 + 4 y^2) / 4 + sin(1.5 x) / 2', start: [-2.6, 2.2], rate, momentum, steps: 40, stepDuration: 220 })
    scene = tinyfly.loadScene3D(loss.scene)
    timeline = tinyfly.deserializeTimeline({ id: 'loss', config: { duration: loss.duration }, tracks: loss.tracks })
    tween?.kill()
    clock.time = 0
    tween = live.to(clock, { time: loss.duration, duration: loss.duration / 1000, ease: 'none', repeat: -1, repeatDelay: 1.5 })
  }

  const draw = () => {
    const step = Math.max(0, Math.min(loss.path.length - 1, Math.floor((clock.time - 600) / 220)))
    readout.textContent = `step ${step} · f = ${loss.losses[step].toFixed(3)}`
    if (ctx) tinyfly.drawScene3D(ctx, scene, timeline.getStateAtTime(clock.time).values, { width: 720, height: 405 })
  }
  build()
  picker.addEventListener('change', build)
  live.ticker.add(draw)
  // #endregion code
  return () => {
    live.ticker.remove(draw)
    picker.removeEventListener('change', build)
  }
}

/** @type {import('./types').LiveDemo} */
export const lossSurface3dDemo = {
  id: 'live-loss-surface-3d', name: 'Loss Surface in 3D',
  description: 'Gradient descent seen from the side: a ball rolls down a loss surface along the exact-gradient path, which appears behind it, while the camera turns slowly round. Try momentum, a plain step, or one so large it zigzags. lossSurface3D() from @algorisys/tinyfly/math builds the scene as data for @algorisys/tinyfly/scene-3d: a coloured mesh of f(x, y), the path and the ball, with their tracks.',
  category: '3d', alsoIn: ['showcase', 'video'], tags: ['math', 'ai', 'ml', 'gradient descent', '3d', 'teaching'],
  addons: ['scene-3d', 'math'],
  html, run,
}
