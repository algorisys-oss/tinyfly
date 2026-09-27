/**
 * A narrated stick-figure clip, rendered without a browser:
 *
 *   npx tinyfly video examples/headless-video/stick-figure.mjs --srt stick-figure.srt
 *   npx tinyfly video examples/headless-video/stick-figure.mjs --stills stills/
 *
 * - planNarration() times the scenes from their line lengths. With recorded
 *   lines, use voiceNarration() from '@algorisys/tinyfly/headless' instead: it
 *   measures each clip and writes the narration WAV (see the note at the end).
 * - The figure comes from '@algorisys/tinyfly/characters': poseTracks() turns
 *   named poses into keyframe tracks, and `walk`, `walking` and `talk` tracks
 *   make it walk and chatter. strideLength() turns distance into strides, so
 *   the feet stay planted.
 * - background() and draw() paint the backdrop and the caption each frame,
 *   Cairo-style, under and over the figure.
 */
import { planNarration, narrationMarkers, narrationSceneAt } from '@algorisys/tinyfly'
import { stickFigureTarget, poseTracks, strideLength } from '@algorisys/tinyfly/characters'

const W = 1280
const H = 720
const FLOOR = 620

const plan = planNarration([
  { id: 'enter', lines: [{ text: 'Meet the figure.', duration: 1600 }] },
  { id: 'wave', lines: [{ text: 'It waves hello,', duration: 1200 }, { text: 'and says so out loud.', duration: 1500 }] },
  { id: 'shrug', lines: [{ text: 'Then it runs out of things to say.', duration: 1800 }] },
  { id: 'leave', lines: [{ text: 'So it walks off.', duration: 1400 }], tail: 400 },
])
const cue = (id) => plan.cues.find((c) => c.id === id)
const scene = (id) => plan.scenes.find((s) => s.id === id)

/** Keyframes as plain data: [time, value, easing?] triples. */
const track = (property, frames) => ({
  id: `hero-${property}`,
  target: 'hero',
  property,
  keyframes: frames.map(([time, value, easing]) => ({ time, value, ...(easing ? { easing } : {}) })),
})

const HEIGHT = 340
// Strides for a distance, so the feet stay planted: the walk track uses the
// same easing as x, so steps keep pace with the ground.
const strides = (distance) => distance / strideLength(HEIGHT)
const arrive = cue('s0-l0').end
const leave = scene('leave').start + 200
const end = plan.duration
const talking = cue('s1-l1')

const timeline = {
  id: 'stick-figure',
  config: { duration: end, markers: narrationMarkers(plan) },
  tracks: [
    // Walk in from the left, stop, and walk off to the right (x is an offset).
    track('x', [[0, -720], [arrive, 0, 'ease-out'], [leave, 0], [end, 820, 'ease-in']]),
    track('walk', [[0, 0], [arrive, strides(720), 'ease-out'], [leave, strides(720)], [end, strides(720 + 820), 'ease-in']]),
    track('walking', [[0, 1], [arrive - 200, 1], [arrive, 0], [leave, 0], [leave + 200, 1]]),
    track('talk', [[talking.start, 0], [talking.start + 100, 1], [talking.end, 1], [talking.end + 100, 0]]),
    // Poses, by name, timed from the narration.
    ...poseTracks('hero', [
      { time: cue('s1-l0').start, pose: 'rest' },
      { time: cue('s1-l0').start + 300, pose: 'wave', easing: 'ease-out' },
      { time: talking.end, pose: 'wave' },
      { time: cue('s2-l0').start + 300, pose: 'shrug', easing: 'ease-in-out' },
      { time: leave - 100, pose: 'shrug' },
      { time: leave + 200, pose: 'rest' },
    ]),
  ],
}

const SKY = { enter: '#bfe6ff', wave: '#fde7d3', shrug: '#ede9fe', leave: '#e6f4ea' }

export default {
  width: W,
  height: H,
  fps: 30,
  timeline,
  // Exact spoken spans; without this, captions run from marker to marker.
  captions: plan.cues,
  targets: {
    hero: stickFigureTarget({
      x: W / 2,
      y: FLOOR + 10,
      style: { height: HEIGHT, color: '#1e3a8a', headFill: '#f2c49b', label: 'HERO' },
    }),
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
    const line = plan.cues.find((c) => time >= c.start && time < c.end)
    if (!line) return
    ctx.font = '600 38px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const width = ctx.measureText(line.text).width + 48
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(W / 2 - width / 2, H - 76, width, 60)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(line.text, W / 2, H - 46)
  },
}

/*
 * With recorded lines, time everything from the clips instead:
 *
 *   import { voiceNarration } from '@algorisys/tinyfly/headless'
 *   const { plan, audio } = await voiceNarration(
 *     [{ id: 'enter', lines: [{ text: 'Meet the figure.', audio: 'voice/01.wav' }] }, …],
 *     { output: 'build/narration.wav', baseDir: new URL('.', import.meta.url).pathname }
 *   )
 *   // …build the timeline from `plan` exactly as above, and add `audio` to the scene.
 */
