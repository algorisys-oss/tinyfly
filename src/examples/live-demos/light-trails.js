import { trailSamples } from '../../engine'
import { drawTrail, applyBloom } from '../../adapters/canvas'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { trailSamples, drawTrail, applyBloom }

export const html = `<style>
  .lt-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .lt-canvas { width: 100%; max-width: 420px; aspect-ratio: 16 / 9; height: auto; border-radius: 8px; background: #05030c; }
  .lt-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .lt-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; }
  .lt-row select { font: 12px system-ui, sans-serif; padding: 2px 6px; border-radius: 6px; border: 1px solid #475569; background: #1e293b; color: #e2e8f0; }
</style>
<div class="lt-wrap">
  <canvas class="lt-canvas" width="640" height="360"></canvas>
  <div class="lt-row">
    <label>length <input type="range" class="lt-length" min="100" max="2500" value="1200" /></label>
    <select class="lt-blend" aria-label="Blend">
      <option value="add">add (light)</option>
      <option value="normal">normal (paint)</option>
    </select>
    <label><input type="checkbox" class="lt-bloom" checked /> bloom</label>
  </div>
  <div class="lt-readout">t 0.0 s</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.lt-canvas')
  const lengthInput = root.querySelector('.lt-length')
  const blend = root.querySelector('.lt-blend')
  const bloom = root.querySelector('.lt-bloom')
  const readout = root.querySelector('.lt-readout')
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height

  // Each comet's position is a plain function of time, so its trail is too:
  // the trail is where the comet was, asked again every frame, never a history.
  const comet = (phase, a, b) => (t) => ({
    x: W / 2 + W * 0.4 * Math.sin((t / 1000) * a + phase),
    y: H / 2 + H * 0.36 * Math.sin((t / 1000) * b + phase * 1.7),
  })
  const comets = [
    { at: comet(0, 1.3, 2.1), color: '#00e5ff' },
    { at: comet(2.1, 1.7, 1.1), color: '#ff2bd6' },
    { at: comet(4.2, 0.9, 1.9), color: '#b6ff3b' },
  ]

  const clock = { time: 0 }
  live.to(clock, { time: 600000, duration: 600, ease: 'none', repeat: -1 })

  const draw = () => {
    readout.textContent = `t ${(clock.time / 1000).toFixed(1)} s · trail ${lengthInput.value} ms`
    if (!ctx) return
    ctx.fillStyle = '#05030c'
    ctx.fillRect(0, 0, W, H)
    for (const { at, color } of comets) {
      const trail = tinyfly.trailSamples(at, clock.time, { length: Number(lengthInput.value), samples: 64 })
      tinyfly.drawTrail(ctx, trail, { color, width: 9, blend: blend.value, head: { radius: 12, color: '#ffffff' } })
    }
    // Bright pass, blur, add back: the glow. Deterministic, no ctx.filter.
    if (bloom.checked) tinyfly.applyBloom(ctx, { threshold: 0.5 })
  }
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const lightTrails = {
  id: 'live-light-trails',
  name: 'Light Trails',
  description:
    'Comets on a 2D canvas with glowing tails: trailSamples asks where each comet was over the last moments (a pure function of time, so scrubbing and video frames draw the same trail), drawTrail lays a tapering, fading band along it with a comet head, and applyBloom adds the glow. Light adds where trails cross; switch to normal to paint instead.',
  category: 'effects',
  tags: ['trail', 'comet', 'bloom', 'glow', 'neon', 'canvas'],
  html,
  run,
}
