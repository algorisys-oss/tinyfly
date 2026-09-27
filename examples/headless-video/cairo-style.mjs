/**
 * Pure immediate mode, as in a Cairo or Processing script: no timeline, no
 * targets, just a duration and a draw function of the time. The engine's
 * easing functions do the timing maths.
 *
 *   npx tinyfly video examples/headless-video/cairo-style.mjs --fps 60
 */
import { getEasingFunction } from '@algorisys/tinyfly'

const W = 1280
const H = 720
const easeOut = getEasingFunction('ease-out-cubic')
const easeInOut = getEasingFunction('ease-in-out')

/** 0..1 progress of `t` through [a, b], clamped (Cairo's `seg`). */
const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)))

export default {
  width: W,
  height: H,
  fps: 30,
  duration: 4000,
  background: '#0f1115',
  draw(ctx, { time }) {
    const cx = W / 2
    const cy = H / 2

    // A ring of dots that spreads out, then spins.
    const spread = easeOut(seg(time, 0, 1200))
    const spin = easeInOut(seg(time, 1000, 3200)) * Math.PI * 2
    for (let i = 0; i < 24; i++) {
      const angle = spin + (i / 24) * Math.PI * 2
      const r = 40 + spread * 220
      ctx.beginPath()
      ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 6 + 10 * spread, 0, Math.PI * 2)
      ctx.fillStyle = `hsl(${(i / 24) * 360 + time / 20}, 80%, 60%)`
      ctx.fill()
    }

    // A title that slides up and fades in, then a line that draws under it.
    const reveal = easeOut(seg(time, 1500, 2300))
    ctx.globalAlpha = reveal
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 72px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('tinyfly', cx, cy + 40 * (1 - reveal))
    ctx.globalAlpha = 1
    const underline = easeOut(seg(time, 2300, 3000)) * 260
    ctx.strokeStyle = '#4a9eff'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(cx - underline / 2, cy + 60)
    ctx.lineTo(cx + underline / 2, cy + 60)
    ctx.stroke()
  },
}
