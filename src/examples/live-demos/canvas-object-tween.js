export const html = `<style>
  .co-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .co-canvas { width: 240px; height: 140px; border-radius: 8px; background: #0f1115; }
  .co-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; }
</style>
<div class="co-wrap">
  <canvas class="co-canvas" width="480" height="280"></canvas>
  <div class="co-readout">radius 30 · spread 0.00</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.co-canvas')
  const readout = root.querySelector('.co-readout')
  const ctx = canvas.getContext('2d')

  // No elements here: tinyfly tweens a plain object, and the canvas draws from it.
  const scene = { radius: 30, spread: 0, spin: 0, color: '#4a9eff' }

  live
    .timeline({ repeat: -1, yoyo: true, repeatDelay: 0.3 })
    .to(scene, { radius: 90, spread: 1, duration: 1.4, ease: 'expo.inOut' })
    .to(scene, { spin: Math.PI, color: '#ec4899', duration: 1.4, ease: 'power2.inOut' }, 0)

  // The ticker runs every frame, right after tinyfly applies values — so the
  // canvas (or a Three.js render) always draws this frame's numbers.
  const draw = () => {
    readout.textContent = `radius ${scene.radius.toFixed(0)} · spread ${scene.spread.toFixed(2)}`
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < 12; i++) {
      const angle = scene.spin + (i / 12) * Math.PI * 2
      const r = scene.radius * (1 + 0.6 * scene.spread * Math.sin(i * 1.7))
      ctx.beginPath()
      ctx.arc(240 + Math.cos(angle) * r * 2, 140 + Math.sin(angle) * r, 8 + 6 * scene.spread, 0, Math.PI * 2)
      ctx.fillStyle = scene.color
      ctx.globalAlpha = 0.35 + 0.65 * (i / 12)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const canvasObjectTween = {
  id: 'live-canvas-object-tween',
  name: 'Canvas from Object Tweens',
  description: 'Tween a plain JS object, draw a canvas from it on the ticker — the same pattern drives Three.js or shader uniforms.',
  tags: ['canvas', 'object targets', 'ticker', 'webgl'],
  html,
  run,
}
