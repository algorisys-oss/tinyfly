/**
 * A story written as beats, rendered without a browser:
 *
 *   npx tinyfly video examples/headless-video/beat-script.mjs
 *
 * scriptTracks() compiles what the figure does (walk somewhere, look, a take,
 * say a line, sneak, run) into acted tracks: wind-ups, overshoot, overlap,
 * gaits, turning round, lip-sync. cameraTracks() compiles the shots: a push
 * in on the take, a shake when it lands, a follow as it runs off. The scene
 * draws on twos, through the camera.
 */
import { cameraTracks } from '@algorisys/tinyfly'
import { drawDustPuff, drawStickSmear, gagDuration, scriptTracks, sketchPen, stickFigureTarget } from '@algorisys/tinyfly/characters'

const W = 1280
const H = 720
const GROUND = 600
const INK = '#2f2f33'
const START_X = 180
const BOX = { x: 900, w: 120, h: 90 }

const script = scriptTracks(
  'hero',
  [
    { do: 'walk', to: 640, mood: 'happy' },
    { do: 'look', toward: BOX.x, mood: 'confused' },
    { do: 'take' },
    { do: 'say', say: 'Is that box ticking?', mood: 'worried' },
    { do: 'sneak', to: 820, mood: 'scared' },
    { do: 'tremble' },
    { do: 'face', toward: 0, mood: 'scared' },
    { do: 'run', to: 120, say: 'Nope!' },
    { do: 'hold', for: 600 },
  ],
  { from: START_X, height: 220, style: 'snappy' }
)

const [, look, take] = script.beats
const runBeat = script.beats[7]
const LANDS = take.start + 900
const xTrack = script.tracks.find((track) => track.property === 'x')
const camera = cameraTracks(
  [
    { at: look.start, duration: 500, frame: { focus: { x: 760, y: 470 }, scale: 1.25 } },
    { at: take.start + 300, duration: 0, frame: { focus: { x: 640, y: 440 }, scale: 1.6 } },
    { at: LANDS, duration: 450, shake: { strength: 14 } },
    { at: take.start + gagDuration('take') + 200, duration: 700, frame: { focus: { x: 720, y: 470 }, scale: 1.2 } },
    {
      at: runBeat.start,
      until: runBeat.end,
      follow: { x: xTrack.keyframes.map((key) => ({ ...key, value: key.value + START_X })), y: 470, lag: 220, lead: -120, scale: 1.2 },
    },
    { at: runBeat.end + 100, duration: 500, frame: { scale: 1 } },
  ],
  { stage: { width: W, height: H } }
)

const hero = stickFigureTarget({ x: START_X, y: GROUND, style: { height: 220, color: INK, lineWidth: 6, headFill: 'none', rubber: 0.6, sketch: { roughness: 2, seed: 4 } } })

export default {
  width: W,
  height: H,
  fps: 24,
  drawingRate: 12,
  camera: true,
  duration: script.duration + 600,
  timeline: {
    id: 'beat-script',
    config: { markers: script.lines.map((line, i) => ({ id: `line-${i}`, time: line.start, label: line.text })) },
    tracks: [...script.tracks, ...camera],
  },
  targets: { hero },
  captions: script.lines.map((line, i) => ({ id: `line-${i}`, start: line.start, end: line.end + 600, text: line.text })),
  background(ctx, frame) {
    // Paper well past the frame, so pans and the follow never run off it.
    ctx.fillStyle = '#fbf8ef'
    ctx.fillRect(-1000, -600, W + 2000, H + 1200)
    const pen = sketchPen(ctx, { roughness: 3, seed: 2 }, frame.time)
    ctx.strokeStyle = INK
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    const ground = []
    for (let x = -900; x <= W + 900; x += 60) ground.push({ x, y: GROUND + Math.sin(x * 0.037) * 3 })
    pen.line(ground)
    // The box, ticking.
    const tick = Math.floor(frame.time / 500) % 2 === 0 ? 0 : 2
    ctx.lineWidth = 4
    pen.line([{ x: BOX.x, y: GROUND }, { x: BOX.x, y: GROUND - BOX.h - tick }, { x: BOX.x + BOX.w, y: GROUND - BOX.h - tick }, { x: BOX.x + BOX.w, y: GROUND }])
    ctx.font = '28px sans-serif'
    ctx.fillStyle = INK
    ctx.fillText(tick ? 'tick' : 'tock', BOX.x + 30, GROUND - BOX.h - 20)
    drawStickSmear(ctx, hero, frame, 'hero', { color: INK, lineWidth: 3 })
  },
  draw(ctx, frame) {
    drawDustPuff(ctx, { x: 640, y: GROUND }, (frame.time - LANDS) / 500, { size: 120, color: INK })
  },
  // Speech, in screen space so the camera never moves it off the frame.
  overlay(ctx, frame) {
    const line = script.lines.find((l) => frame.time >= l.start && frame.time <= l.end + 500)
    if (line) {
      ctx.font = 'italic 40px sans-serif'
      ctx.fillStyle = INK
      ctx.textAlign = 'center'
      ctx.fillText(`“${line.text}”`, 640, 120)
    }
  },
}
