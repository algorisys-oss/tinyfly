/**
 * A pencil-test gag on notebook paper, rendered without a browser:
 *
 *   npx tinyfly video examples/headless-video/pencil-sketch.mjs
 *
 * A pencil draws the ground, the figure walks in and finds the line ends,
 * glares up at whoever is drawing it, the pencil finishes the line, and the
 * figure walks off happy.
 *
 * - The figure's `sketch` style draws it in pencil strokes that boil (redraw
 *   their wobble 8 times a second), so even standing still it looks hand-drawn.
 * - sketchPen() draws the ground line in immediate mode, and drawHand() puts
 *   the animator's hand at its end. The wobble is seeded by the time, so every
 *   render of a frame is identical. (drawnPathTarget does the same as a
 *   target, timed by a `draw` track: see drawing-hand.mjs.)
 */
import { drawHand, sketchPen, stickFigureTarget, poseTracks, strideLength } from '@algorisys/tinyfly/characters'

const W = 1280
const H = 720
const GROUND = 560
const GRAPHITE = '#2f2f33'

// The ground is drawn in two goes: first up to the edge, later the rest.
const EDGE = 700
const FIRST = { start: 200, end: 1500, from: 60, to: EDGE }
const SECOND = { start: 5000, end: 6400, from: EDGE, to: 1240 }

/** Where the pencil's tip is at `time`, or undefined when it is not drawing. */
function pencilX(time) {
  for (const stroke of [FIRST, SECOND]) {
    if (time >= stroke.start && time <= stroke.end) {
      const t = (time - stroke.start) / (stroke.end - stroke.start)
      return stroke.from + (stroke.to - stroke.from) * t
    }
  }
  return undefined
}

/** How far right the ground has been drawn at `time`. */
function groundEnd(time) {
  return pencilX(time) ?? (time < FIRST.start ? FIRST.from : time < SECOND.start ? EDGE : SECOND.to)
}

/** A gently uneven ground: the same points every frame, so only the boil moves it. */
function groundPoints(toX) {
  const points = []
  for (let x = FIRST.from; x < toX; x += 60) points.push({ x, y: GROUND + Math.sin(x * 0.037) * 3 })
  points.push({ x: toX, y: GROUND + Math.sin(toX * 0.037) * 3 })
  return points
}

/** Keyframes as plain data: [time, value, easing?] triples. */
const track = (property, frames) => ({
  id: `doodle-${property}`,
  target: 'doodle',
  property,
  keyframes: frames.map(([time, value, easing]) => ({ time, value, ...(easing ? { easing } : {}) })),
})

const HEIGHT = 300
const STOP = EDGE - 70 // where the feet stop, just short of the edge
const strides = (distance) => distance / strideLength(HEIGHT)
const ARRIVE = 3200
const LEAVE = 7000
const END = 9400

const timeline = {
  id: 'pencil-sketch',
  config: { duration: END },
  tracks: [
    // x is an offset from STOP: walk in from off the left, stop, later walk off the right.
    track('x', [[1000, -STOP - 120], [ARRIVE, 0, 'ease-out'], [LEAVE, 0], [END, W - STOP + 160, 'ease-in']]),
    track('walk', [
      [1000, 0],
      [ARRIVE, strides(STOP + 120), 'ease-out'],
      [LEAVE, strides(STOP + 120)],
      [END, strides(STOP + 120 + W - STOP + 160), 'ease-in'],
    ]),
    track('walking', [[0, 1], [ARRIVE - 200, 1], [ARRIVE, 0], [LEAVE, 0], [LEAVE + 200, 1]]),
    track('talk', [[4300, 0], [4400, 1], [4900, 1], [5000, 0]]),
    ...poseTracks('doodle', [
      { time: ARRIVE, pose: 'rest' },
      // Looks down at where the ground stops…
      { time: ARRIVE + 300, pose: { headTilt: 18, lean: 6 }, expression: { lookY: 1, lookX: 0.6 }, easing: 'ease-out' },
      { time: ARRIVE + 700, expression: 'shocked', easing: { type: 'back', mode: 'out' } },
      // …then glares up at the animator and complains.
      { time: 4200, pose: 'handsOnHips', expression: { lookX: 0, lookY: -1, smile: -0.6, browTilt: -1, leftBrow: -0.6, rightBrow: -0.6 }, easing: 'ease-in-out' },
      { time: SECOND.start, pose: 'handsOnHips', expression: { lookX: 1, lookY: 0.2, smile: -0.6, browTilt: -1 } },
      // Watches the line get finished, and cheers up.
      { time: SECOND.end, pose: 'handsOnHips', expression: { lookX: 1, lookY: 0.2, smile: -0.2, browTilt: 0 } },
      { time: SECOND.end + 300, pose: 'cheer', easing: { type: 'back', mode: 'out' } },
      { time: LEAVE - 100, pose: 'cheer' },
      { time: LEAVE + 200, pose: 'rest', expression: 'happy' },
    ]),
  ],
}

export default {
  width: W,
  height: H,
  fps: 24,
  timeline,
  targets: {
    doodle: stickFigureTarget({
      x: STOP,
      y: GROUND,
      style: { height: HEIGHT, color: GRAPHITE, lineWidth: 6, headFill: 'none', sketch: { roughness: 3, boil: 8, seed: 7 } },
    }),
  },
  // Notebook paper, then the ground drawn so far, under the figure.
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

    const pen = sketchPen(ctx, { roughness: 3, boil: 8, seed: 2 }, time)
    ctx.strokeStyle = GRAPHITE
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    pen.line(groundPoints(groundEnd(time)))
  },
  // The animator's hand, over everything, while it draws.
  draw(ctx, { time }) {
    const x = pencilX(time)
    if (x === undefined) return
    drawHand(ctx, { x, y: GROUND + Math.sin(x * 0.037) * 3 }, {}, sketchPen(ctx, { roughness: 2, seed: 3 }, time))
  },
}
