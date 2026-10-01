/**
 * Squash, stretch and rubber-hose limbs, rendered without a browser:
 *
 *   npx tinyfly video examples/headless-video/rubber-hose.mjs
 *
 * The figure winds up (squash), jumps (stretch), lands (squash) and wobbles
 * back to rest, waves a noodle arm, then stiffens into jointed limbs and
 * goes rubbery again.
 *
 * - `stretch` is a pose number like any joint, so poseTracks() keyframes it;
 *   the named poses `crouch` and `jump` carry a squash and a stretch.
 * - `rubber` is the figure's limb style (style.rubber) and a prop, so a track
 *   blends it: 0.5 is half way from jointed limbs to curves.
 */
import { sketchPen, stickFigureTarget, poseTracks } from '@algorisys/tinyfly/characters'

const W = 1280
const H = 720
const GROUND = 600
const GRAPHITE = '#2f2f33'

const TAKEOFF = 1000
const APEX = 1450
const LAND = 1850
const END = 7000

/** Keyframes as plain data: [time, value, easing?] triples. */
const track = (property, frames) => ({
  id: `doodle-${property}`,
  target: 'doodle',
  property,
  keyframes: frames.map(([time, value, easing]) => ({ time, value, ...(easing ? { easing } : {}) })),
})

// The wave: the forearm flaps back and forth, and with rubber limbs it noodles.
const flaps = []
for (let i = 0; i < 6; i++) flaps.push({ time: 2900 + i * 220, pose: { rightElbow: i % 2 === 0 ? -50 : 40 }, easing: 'ease-in-out' })

const timeline = {
  id: 'rubber-hose',
  config: { duration: END },
  tracks: [
    // Up and down: y is an offset (negative is up), slowing at the top like a throw.
    track('y', [[TAKEOFF, 0], [APEX, -150, 'ease-out-quad'], [LAND, 0, 'ease-in-quad']]),
    // Limbs: rubber hose, stiffening to jointed for a moment near the end.
    track('rubber', [[4700, 1], [5500, 0, 'ease-in-out'], [5900, 0], [6600, 1, 'ease-in-out']]),
    ...poseTracks('doodle', [
      { time: 0, pose: 'rest', expression: 'happy' },
      // Wind up, then spring out of the crouch.
      { time: 300 },
      { time: 800, pose: crouch(), easing: 'ease-out' },
      { time: TAKEOFF, pose: crouch() },
      { time: TAKEOFF + 160, pose: 'jump', easing: 'ease-out' },
      { time: APEX + 100, pose: { stretch: 1.05 } },
      // Stretched as it falls, squashed as it lands, then a wobble that dies away.
      { time: LAND - 60, pose: { stretch: 1.18 }, easing: 'ease-in' },
      { time: LAND + 60, pose: { ...crouch(), smile: 0.9 } },
      { time: LAND + 260, pose: { stretch: 1.1 }, expression: 'joyful', easing: 'ease-out' },
      { time: LAND + 420, pose: { stretch: 0.94 }, expression: 'happy', easing: 'ease-in-out' },
      { time: LAND + 560, pose: { stretch: 1.03 }, easing: 'ease-in-out' },
      { time: LAND + 700, pose: { stretch: 1 }, easing: 'ease-in-out' },
      // A noodle-arm wave.
      { time: 2600, pose: { rightShoulder: 140, rightElbow: 30 }, easing: 'ease-out' },
      ...flaps,
      { time: 4500, pose: { rightShoulder: 18, rightElbow: -6 }, easing: 'ease-in-out' },
      // Stiffens into jointed limbs (skeptical about it), then goes rubbery again.
      { time: 4700, pose: { leftShoulder: 45, leftElbow: -100, rightShoulder: 45, rightElbow: -100 }, easing: 'ease-out' },
      { time: 5500, expression: 'skeptical', easing: 'ease-in-out' },
      { time: 6600, expression: 'joyful', easing: 'ease-in-out' },
    ]),
  ],
}

/** The crouch's joints and squash, leaving the face as it is (POSES.crouch would reset it). */
function crouch() {
  return { stretch: 0.72, leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50, leftHip: 22, rightHip: 22, headTilt: -4 }
}

export default {
  width: W,
  height: H,
  fps: 24,
  timeline,
  targets: {
    doodle: stickFigureTarget({
      x: W / 2,
      y: GROUND,
      style: { height: 280, color: GRAPHITE, lineWidth: 6, headFill: 'none', rubber: 1, sketch: { roughness: 2.5, seed: 11 } },
    }),
  },
  // Notebook paper and a pencilled ground.
  background(ctx, { time }) {
    ctx.fillStyle = '#fbf8ef'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = '#cfe0f0'
    ctx.lineWidth = 2
    for (let y = 90; y < H; y += 44) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }
    const pen = sketchPen(ctx, { roughness: 3, seed: 2 }, time)
    ctx.strokeStyle = GRAPHITE
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    const points = []
    for (let x = 80; x <= 1200; x += 70) points.push({ x, y: GROUND + Math.sin(x * 0.037) * 3 })
    pen.line(points)
  },
}
