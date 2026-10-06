/**
 * Cartoon acting, before and after, rendered without a browser:
 *
 *   npx tinyfly video examples/headless-video/cartoon-acting.mjs
 *
 * Two pencil figures play the same key poses. The left one uses
 * poseTracks(): every joint starts and stops together. The right one uses
 * actTracks() in the `snappy` style: it winds up before each move, overshoots
 * and wobbles to a stop, its limbs overlap (hips lead, wrists drag), its eyes
 * dart ahead of the head and it blinks as it turns. Both do a `take` (a gag:
 * squash, shoot up, hang, land), and the right one gets speed lines and a
 * dust puff on landing.
 *
 * The scene draws on twos (`drawingRate: 12` at 24 fps), as hand-drawn
 * animation is timed, which matches the pencil's line boil.
 */
import {
  actTracks,
  drawDustPuff,
  drawStickSmear,
  gag,
  gagDuration,
  poseTracks,
  resolvePoseKeys,
  sketchPen,
  stickFigureTarget,
} from '@algorisys/tinyfly/characters'

const W = 1280
const H = 720
const GROUND = 600
const GRAPHITE = '#2f2f33'
const TAKE_AT = 2600
/** When the take lands (its fifth step, 900 ms in) */
const LANDS = TAKE_AT + 900
const END = 8400

// The story, as key poses: when each pose is reached, not how to get there.
const opening = [
  { time: 0, pose: 'rest', expression: 'happy' },
  { time: 900, pose: { turn: 0.6, lookX: 1, headTilt: 6 }, expression: 'confused' },
  { time: 1800, pose: { turn: 0.6, rightShoulder: 90, rightElbow: 0, lean: 6 }, expression: { lookX: 1 } },
]
const before = resolvePoseKeys(opening).at(-1)
const keys = [
  ...opening,
  ...gag('take', { at: TAKE_AT, from: before }),
  { time: TAKE_AT + gagDuration('take') + 900, pose: { ...before, turn: 0, rightShoulder: 30, rightElbow: 85, leftShoulder: 30, leftElbow: 85, lean: 0 }, expression: 'confused' },
  { time: 5600, pose: 'wave' },
  { time: 6500, pose: { rightElbow: -20 } },
  { time: 7100, pose: 'rest', expression: 'happy' },
]

const style = { height: 260, color: GRAPHITE, lineWidth: 6, headFill: 'none', rubber: 0.6, sketch: { roughness: 2.2, seed: 5 } }

const acted = stickFigureTarget({ x: 920, y: GROUND, style })

export default {
  width: W,
  height: H,
  fps: 24,
  drawingRate: 12,
  timeline: {
    id: 'cartoon-acting',
    config: {
      duration: END,
      markers: [
        { id: 'notice', time: 600, label: 'Notices something' },
        { id: 'take', time: TAKE_AT + 300, label: 'The take' },
        { id: 'wave', time: 5300, label: 'Waves it off' },
      ],
    },
    tracks: [...poseTracks('plain', keys), ...actTracks('acted', keys, { style: 'snappy' })],
  },
  targets: {
    plain: stickFigureTarget({ x: 360, y: GROUND, style: { ...style, sketch: { ...style.sketch, seed: 3 } } }),
    acted,
  },
  background(ctx, frame) {
    ctx.fillStyle = '#fbf8ef'
    ctx.fillRect(0, 0, W, H)
    const pen = sketchPen(ctx, { roughness: 3, seed: 2 }, frame.time)
    ctx.strokeStyle = GRAPHITE
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    for (const [from, to] of [[120, 600], [680, 1160]]) {
      const points = []
      for (let x = from; x <= to; x += 60) points.push({ x, y: GROUND + Math.sin(x * 0.037) * 3 })
      pen.line(points)
    }
    ctx.fillStyle = GRAPHITE
    ctx.font = '28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('poseTracks', 360, 90)
    ctx.fillText('actTracks · snappy', 920, 90)
    // Speed lines go under the figure they trail.
    drawStickSmear(ctx, acted, frame, 'acted', { color: GRAPHITE, lineWidth: 3, length: 110 })
  },
  draw(ctx, frame) {
    drawDustPuff(ctx, { x: 920, y: GROUND }, (frame.time - LANDS) / 500, { size: 120, color: GRAPHITE })
  },
}
