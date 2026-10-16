/**
 * Gradient descent on a 3D loss surface (1920×1080): a ball rolls down a
 * rippled bowl along the exact-gradient path while the camera turns round.
 *
 *   npx tinyfly video examples/headless-video/loss-surface-3d.mjs
 *   npx tinyfly video examples/headless-video/loss-surface-3d.mjs --stills stills/ --times 1000,5000,9500
 */
import { lossSurface3D } from '@algorisys/tinyfly/math'
import { loadScene3D, drawScene3D } from '@algorisys/tinyfly/scene-3d'

const W = 1920
const H = 1080
const loss = lossSurface3D({ expr: '(x^2 + 4 y^2) / 4 + sin(1.5 x) / 2', start: [-2.6, 2.2], rate: 0.18, momentum: 0.6, steps: 40, stepDuration: 220, resolution: 48, orbit: 70 })
const scene = loadScene3D(loss.scene)

export default {
  width: W,
  height: H,
  fps: 30,
  background: '#0f1117',
  timeline: { id: 'loss-surface-3d', config: { duration: loss.duration }, tracks: loss.tracks },
  draw(ctx, frame) {
    drawScene3D(ctx, scene, frame.state.values, { width: W, height: H })
    const step = Math.max(0, Math.min(loss.path.length - 1, Math.floor((frame.time - 600) / 220)))
    ctx.fillStyle = '#f2f2f2'
    ctx.font = '600 40px serif'
    ctx.textAlign = 'center'
    ctx.fillText('Gradient descent on a loss surface', W / 2, 80)
    ctx.font = '28px serif'
    ctx.fillText(`step ${step}   ·   f = ${loss.losses[step].toFixed(3)}`, W / 2, H - 60)
  },
}
