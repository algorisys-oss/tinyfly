/**
 * The animator's hand, rendered without a browser:
 *
 *   npx tinyfly video examples/headless-video/drawing-hand.mjs
 *
 * A figure stands on nothing, worried. A hand draws the ground under it, then a
 * sun; the figure cheers. Then the hand comes back with an eraser.
 *
 * - drawnPathTarget() draws a stroke on: its `draw` prop (0..1) is a track, and
 *   a hand holds the pencil at the end of the line while it draws. The stroke
 *   is sketched, and the part drawn so far is exactly the finished stroke.
 * - erasable(…, { hand: true }) wraps the sun, so the same kind of hand rubs
 *   it out along a scrubPath() on an `erase` track.
 * - Every piece of timing is a keyframe track: the whole scene is JSON apart
 *   from the drawing code.
 */
import {
  circlePath,
  drawnPathTarget,
  erasable,
  scrubPath,
  stickFigureTarget,
  poseTracks,
} from '@algorisys/tinyfly/characters'

const W = 1280
const H = 720
const GROUND = 560
const GRAPHITE = '#2f2f33'
const SUN = { x: 1000, y: 180, r: 70 }

const groundPath = []
for (let x = 80; x <= 1200; x += 70) groundPath.push({ x, y: GROUND + Math.sin(x * 0.037) * 3 })

const DRAW_GROUND = [600, 2400]
const DRAW_SUN = [3600, 4700]
const ERASE_SUN = [6400, 7900]
const END = 9200

/** A two-key track: `property` of `target` goes from `from` to `to` over [start, end]. */
const span = (target, property, [start, end], from = 0, to = 1, easing) => ({
  id: `${target}-${property}`,
  target,
  property,
  keyframes: [{ time: start, value: from }, { time: end, value: to, ...(easing ? { easing } : {}) }],
})

const timeline = {
  id: 'drawing-hand',
  config: { duration: END },
  tracks: [
    span('ground', 'draw', DRAW_GROUND),
    span('sun', 'draw', DRAW_SUN, 0, 1, 'ease-in-out'),
    span('sun', 'erase', ERASE_SUN),
    ...poseTracks('doodle', [
      // Nothing to stand on.
      { time: 0, pose: 'rest', expression: { smile: -0.3, browTilt: 0.8, leftBrow: 0.3, rightBrow: 0.3, lookY: 1 } },
      // Watches the pencil go by under its feet, then relaxes.
      { time: 1200, expression: { lookX: 0.8, lookY: 1 } },
      { time: DRAW_GROUND[1] + 200, pose: 'handsOnHips', expression: 'happy', easing: 'ease-out' },
      // Looks up as the sun is drawn, and cheers.
      { time: DRAW_SUN[0] - 200, expression: { lookX: 1, lookY: -1 } },
      { time: DRAW_SUN[1] + 100, pose: 'cheer', easing: { type: 'back', mode: 'out' } },
      { time: ERASE_SUN[0] + 100, pose: 'cheer' },
      // The eraser: shock, then gloom.
      { time: ERASE_SUN[0] + 400, pose: 'surprised', expression: { lookX: 1, lookY: -1 }, easing: 'ease-out' },
      { time: ERASE_SUN[1] - 300, pose: 'surprised', expression: { lookX: 1, lookY: -1 } },
      { time: ERASE_SUN[1] + 300, pose: 'sad', easing: 'ease-in-out' },
    ]),
  ],
}

const sun = drawnPathTarget({
  path: circlePath(SUN.x, SUN.y, SUN.r),
  smooth: true,
  lineWidth: 5,
  sketch: { roughness: 3, seed: 5 },
})

export default {
  width: W,
  height: H,
  fps: 24,
  timeline,
  // Drawn in this order: the figure, then the ground over its feet, then the sun.
  targets: {
    doodle: stickFigureTarget({
      x: 520,
      y: GROUND,
      style: { height: 280, color: GRAPHITE, lineWidth: 6, headFill: 'none', sketch: { roughness: 3, seed: 7 } },
    }),
    ground: drawnPathTarget({ path: groundPath, lineWidth: 5, sketch: { roughness: 3, seed: 2 } }),
    // The erase path is in the sun's own box: (0, 0) is the top-left of the circle.
    sun: erasable(sun, { path: scrubPath(-12, -12, 2 * SUN.r + 24, 2 * SUN.r + 24, 9), width: 36, hand: true }),
  },
  // Notebook paper.
  background(ctx) {
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
    ctx.strokeStyle = '#efb5b5'
    ctx.beginPath()
    ctx.moveTo(120, 0)
    ctx.lineTo(120, H)
    ctx.stroke()
  },
}
