/**
 * An eraser gag on notebook paper, rendered without a browser:
 *
 *   npx tinyfly video examples/headless-video/eraser-gag.mjs
 *
 * The figure points proudly, the eraser rubs out its forearm, it complains to
 * whoever holds the eraser, and the eraser takes the ground from under it.
 *
 * - erasable() wraps the figure target: its `erase` prop (0..1) is how far the
 *   eraser has rubbed along a scrubPath(), so erasing is an ordinary track.
 *   The path is in the figure's own box, so the missing forearm falls with it.
 * - The ground is drawn in background(), so withErased() erases it from the
 *   time, and draw() puts the eraser on top while it rubs.
 */
import {
  erasable,
  scrubPath,
  withErased,
  pointAlong,
  drawEraser,
  sketchPen,
  stickFigureTarget,
  poseTracks,
} from '@algorisys/tinyfly/characters'

const W = 1280
const H = 720
const GROUND = 560
const GRAPHITE = '#2f2f33'
const HEIGHT = 300
const FEET_X = 640

// The pointing forearm, in the figure's box (feet at (HEIGHT * 0.4, HEIGHT)).
const ARM_SCRUB = scrubPath(196, 70, 58, 50, 7)
// The ground under the feet, in scene coordinates.
const GROUND_SCRUB = scrubPath(FEET_X - 90, GROUND - 18, 180, 36, 9)
const GROUND_ERASE = { start: 4500, end: 6400, width: 30 }

const FALL = 7900
const END = 9200

/** How far the ground eraser has rubbed at `time`, 0..1. */
function groundProgress(time) {
  return Math.min(1, Math.max(0, (time - GROUND_ERASE.start) / (GROUND_ERASE.end - GROUND_ERASE.start)))
}

/** Keyframes as plain data: [time, value, easing?] triples. */
const track = (property, frames) => ({
  id: `doodle-${property}`,
  target: 'doodle',
  property,
  keyframes: frames.map(([time, value, easing]) => ({ time, value, ...(easing ? { easing } : {}) })),
})

const timeline = {
  id: 'eraser-gag',
  config: { duration: END },
  tracks: [
    track('erase', [[800, 0], [2600, 1]]),
    track('talk', [[3500, 0], [3600, 1], [4300, 1], [4400, 0]]),
    // The fall: y is an offset, accelerating like a drop.
    track('y', [[FALL, 0], [FALL + 700, 520, 'ease-in-cubic']]),
    ...poseTracks('doodle', [
      { time: 0, pose: 'rest', expression: 'happy' },
      // Points proudly at nothing in particular. The right arm stays put from
      // here on: the erased swath is fixed in the figure's box.
      { time: 400, pose: { rightShoulder: 95, rightElbow: 0 }, expression: { lookX: 1 }, easing: 'ease-out' },
      { time: 2600, expression: { lookX: 1 } },
      { time: 2900, expression: { lookX: 1, smile: 0, mouth: 0.7, mouthWidth: 0.7, leftEye: 1.5, rightEye: 1.5, leftBrow: 1, rightBrow: 1 } },
      // Glares up at the eraser's owner and complains.
      { time: 3300, pose: { leftShoulder: 30, leftElbow: 85, lean: 3 }, expression: 'furious', easing: 'ease-out' },
      { time: 4400, expression: { lookY: -1 } },
      { time: GROUND_ERASE.start + 200, expression: { lookX: -0.6, lookY: 0.2 } },
      // Looks down: no ground. Then at us. Then down it goes.
      { time: GROUND_ERASE.end + 200, expression: 'shocked', easing: 'ease-out' },
      { time: GROUND_ERASE.end + 300, expression: { lookY: 1 } },
      { time: 7200, expression: { lookY: 0, lookX: 0 } },
      { time: 7300, expression: 'worried' },
      { time: FALL, pose: { leftShoulder: 140, leftElbow: 25 }, expression: 'scared', easing: 'ease-out' },
    ]),
  ],
}

export default {
  width: W,
  height: H,
  fps: 24,
  timeline,
  targets: {
    doodle: erasable(
      stickFigureTarget({
        x: FEET_X,
        y: GROUND,
        style: { height: HEIGHT, color: GRAPHITE, lineWidth: 6, headFill: 'none', sketch: { roughness: 3, seed: 7 } },
      }),
      { path: ARM_SCRUB, width: 26 }
    ),
  },
  // Notebook paper, then the ground, minus whatever the eraser has rubbed out.
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
    ctx.strokeStyle = '#efb5b5'
    ctx.beginPath()
    ctx.moveTo(120, 0)
    ctx.lineTo(120, H)
    ctx.stroke()

    withErased(ctx, GROUND_SCRUB, GROUND_ERASE.width, groundProgress(time), () => {
      const pen = sketchPen(ctx, { roughness: 3, seed: 2 }, time)
      ctx.strokeStyle = GRAPHITE
      ctx.lineWidth = 5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      const points = []
      for (let x = 60; x <= 1220; x += 60) points.push({ x, y: GROUND + Math.sin(x * 0.037) * 3 })
      pen.line(points)
    })
  },
  // The ground eraser, over the figure, while it rubs.
  draw(ctx, { time }) {
    const progress = groundProgress(time)
    if (progress > 0 && progress < 1) drawEraser(ctx, pointAlong(GROUND_SCRUB, progress))
  },
}
