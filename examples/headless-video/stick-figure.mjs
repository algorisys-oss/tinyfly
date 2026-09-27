/**
 * A narrated stick-figure clip, rendered without a browser:
 *
 *   npx tinyfly video examples/headless-video/stick-figure.mjs --srt stick-figure.srt
 *   npx tinyfly video examples/headless-video/stick-figure.mjs --stills stills/
 *
 * - planNarration() times three scenes from their line lengths (swap in the
 *   real clip durations of a voice-over and pass `audio`).
 * - The figure is a `custom` canvas target: code draws it, the timeline
 *   animates its pose values (`arm`, `mouth`) and its position.
 * - background() and draw() paint the backdrop and the caption each frame,
 *   Cairo-style, under and over the figure.
 */
import { planNarration, narrationMarkers, narrationSceneAt } from '@algorisys/tinyfly'

const W = 1280
const H = 720
const FLOOR = 600

const plan = planNarration([
  { id: 'enter', lines: [{ text: 'Meet the figure.', duration: 1400 }] },
  { id: 'wave', lines: [{ text: 'It waves hello,', duration: 1200 }, { text: 'and says so out loud.', duration: 1500 }] },
  { id: 'leave', lines: [{ text: 'Then it walks off.', duration: 1600 }], tail: 400 },
])
const at = (id) => plan.cues.find((cue) => cue.id === id)

/** Keyframes as plain data: [time, value, easing?] triples. */
const track = (target, property, frames) => ({
  id: `${target}-${property}`,
  target,
  property,
  keyframes: frames.map(([time, value, easing]) => ({ time, value, ...(easing ? { easing } : {}) })),
})

const waveStart = at('s1-l0').start
const leaveStart = plan.scenes[2].start

const timeline = {
  id: 'stick-figure',
  config: { duration: plan.duration, markers: narrationMarkers(plan) },
  tracks: [
    track('figure', 'x', [[0, -200], [1200, 0, 'ease-out'], [leaveStart + 300, 0], [plan.duration, 900, 'ease-in']]),
    track('figure', 'step', [[0, 0], [1200, 6], [leaveStart + 300, 6], [plan.duration, 14]]),
    track('figure', 'arm', [[waveStart, 0], [waveStart + 300, 1, 'ease-out'], [leaveStart, 1], [leaveStart + 300, 0]]),
    track('figure', 'mouth', [[at('s1-l1').start, 0], [at('s1-l1').start + 150, 1], [at('s1-l1').end, 1], [at('s1-l1').end + 150, 0]]),
  ],
}

/** A stick figure in local coordinates: feet at (60, 300). */
function stickFigure(ctx, target, time) {
  const { step, arm, mouth } = target.props
  const swing = Math.sin(step * Math.PI) * 22
  ctx.strokeStyle = '#1e3a8a'
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  const line = (x1, y1, x2, y2) => {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
  // legs and body
  line(60, 200, 60 - 14 - swing, 300)
  line(60, 200, 60 + 14 + swing, 300)
  line(60, 200, 60, 100)
  // left arm hangs; right arm lifts into a wave as `arm` goes 0 → 1
  line(60, 120, 30 + swing / 2, 190)
  const lift = arm * (Math.PI * 0.75)
  const wiggle = arm * Math.sin(time / 90) * 0.25
  const angle = Math.PI / 2 - lift + wiggle
  line(60, 120, 60 + Math.cos(angle) * 75, 120 + Math.sin(angle) * 75)
  // head, eyes and a mouth that opens while talking
  ctx.fillStyle = '#f2c49b'
  ctx.beginPath()
  ctx.arc(60, 60, 40, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#1e3a8a'
  for (const x of [46, 74]) {
    ctx.beginPath()
    ctx.arc(x, 52, 5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.beginPath()
  ctx.ellipse(60, 76, 12, 2 + mouth * 8 * Math.abs(Math.sin(time / 70)), 0, 0, Math.PI * 2)
  ctx.fill()
}

const SKY = { enter: '#bfe6ff', wave: '#fde7d3', leave: '#e6f4ea' }

export default {
  width: W,
  height: H,
  fps: 30,
  timeline,
  // Exact spoken spans; without this, captions run from marker to marker.
  captions: plan.cues,
  targets: {
    figure: {
      type: 'custom',
      x: 500,
      y: FLOOR - 300,
      width: 120,
      height: 300,
      props: { step: 0, arm: 0, mouth: 0 },
      draw: stickFigure,
    },
  },
  // Drawn under the targets: a sky that changes colour per scene, and the floor.
  background(ctx, { time }) {
    ctx.fillStyle = SKY[narrationSceneAt(plan, time).id]
    ctx.fillRect(0, 0, W, FLOOR)
    ctx.fillStyle = '#c8b28a'
    ctx.fillRect(0, FLOOR, W, H - FLOOR)
  },
  // Drawn over the targets: the caption of the line being spoken.
  draw(ctx, { time }) {
    const cue = plan.cues.find((c) => time >= c.start && time < c.end)
    if (cue) {
      ctx.font = '600 40px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const width = ctx.measureText(cue.text).width + 48
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(W / 2 - width / 2, H - 90, width, 64)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(cue.text, W / 2, H - 58)
    }
  },
}
