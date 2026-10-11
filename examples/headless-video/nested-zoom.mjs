/**
 * A nested zoom that loops: a neon frame inside a neon frame, forever, the
 * camera diving one level per loop.
 *
 *   npx tinyfly video examples/headless-video/nested-zoom.mjs -o zoom.mp4
 *   npx tinyfly video examples/headless-video/nested-zoom.mjs --loop-check
 *
 * `loop: true` makes the duration the period: `tinyfly video` checks the loop
 * closes before it renders, and every frame carries `period`. `nestedZoom`
 * draws each level a `step` smaller and turned about the centre, `phase`
 * fractions of a step in, skipping levels too small to see and everything
 * behind a level that fills the frame. After one period every level is where
 * the next was, so the first frame is the last. `wobble` sways the whole
 * picture a whole cycle per loop and `loopNoise` drifts it, both periodic by
 * construction. Colour follows `level - phase`, so it travels with the zoom.
 */
import { similarityAbout, wobble, loopNoise } from '@algorisys/tinyfly'
import { nestedZoom } from '@algorisys/tinyfly/adapters'

const W = 1280
const H = 720
const PERIOD = 3000
const SIDE = 1500 // the frame drawn at level 0, px: it covers the screen once it is 1.1× or more
const CENTRE = { x: W / 2, y: H / 2 }
const STEP = similarityAbout(0.55, 18, CENTRE)

/** A rounded square path centred on the zoom. */
function square(ctx, side, radius) {
  const h = side / 2
  ctx.beginPath()
  ctx.roundRect(CENTRE.x - h, CENTRE.y - h, side, side, radius)
}

export default {
  width: W,
  height: H,
  fps: 30,
  duration: PERIOD,
  loop: true,
  background: '#05030c',
  bloom: { threshold: 0.45, strength: 0.9 },
  draw(ctx, frame) {
    const phase = frame.time / frame.period
    // The whole picture sways and drifts, back where it started every period.
    ctx.translate(CENTRE.x + loopNoise(frame.time, { period: frame.period, seed: 'drift' }) * 18, CENTRE.y)
    ctx.rotate((wobble(frame.time, { period: frame.period, amplitude: 2.5 }) * Math.PI) / 180)
    ctx.translate(-CENTRE.x, -CENTRE.y)
    nestedZoom(ctx, {
      step: STEP,
      phase,
      extent: SIDE * Math.SQRT2,
      minSize: 2,
      coversAbove: 1.1,
      draw(ctx, level, scale) {
        // The hue travels inward with the zoom: a level keeps its colour as it grows.
        const hue = ((((level - phase) / 4) % 1) + 1) % 1
        const colour = `hsl(${Math.round(hue * 360)} 100% 62%)`
        square(ctx, SIDE, SIDE * 0.12)
        ctx.fillStyle = '#05030c'
        ctx.fill()
        ctx.lineWidth = 14 / Math.max(scale, 0.35)
        ctx.strokeStyle = colour
        ctx.stroke()
        // A thinner inner line and four corner dots, so the frames read at every size.
        square(ctx, SIDE * 0.86, SIDE * 0.1)
        ctx.lineWidth = 5 / Math.max(scale, 0.35)
        ctx.globalAlpha = 0.7
        ctx.stroke()
        ctx.globalAlpha = 1
        ctx.fillStyle = colour
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          ctx.beginPath()
          ctx.arc(CENTRE.x + sx * SIDE * 0.36, CENTRE.y + sy * SIDE * 0.36, 16 / Math.max(scale, 0.35), 0, Math.PI * 2)
          ctx.fill()
        }
      },
    })
  },
  timeline: { id: 'zoom', config: { duration: PERIOD, markers: [{ id: 'dive', time: 0, label: 'Diving into the frame, forever' }] }, tracks: [] },
}
