/**
 * A 9:16 science short in the cosmic explainer style: a gradient sky with
 * parallax dust and bokeh, a dive through scale (skin → cells → one atom) in
 * growing portals, flat-shaded shapes, burned-in short captions and label
 * chips, and a sound mix made entirely from the sound generators (no files).
 *
 *   npx tinyfly video examples/headless-video/cosmic-explainer.mjs -o cosmic.mp4
 *   npx tinyfly video examples/headless-video/cosmic-explainer.mjs --stills stills/
 *
 * `depthAt` turns depth keys into the dive; `drawZoomLevels` draws each level
 * at its scale inside its portal and skips what a covering portal hides.
 * `drawShortCaption` shows two words at a time in step with the lines (here
 * timed by hand; with narration, use the narration cues). Every frame is
 * drawn from its time, so the video renders the same in any order.
 */
import {
  drawSkyGradient, drawDust, drawBokeh, drawShadedBall, drawIsoCube, drawHaze, drawZoomLevels,
  depthAt, levelPresence, drawShortCaption, drawLabelChip, drawCornerNote, drawGlow,
} from '@algorisys/tinyfly/characters'
import { renderMix, soundWhoosh, soundPop, soundShimmer, soundPad } from '@algorisys/tinyfly/headless'
import { tmpdir } from 'node:os'

const W = 720
const H = 1280
const END = 12000
const CX = W / 2
const CY = H * 0.45

// When things happen, ms
const DIVE = [{ time: 1800, value: 0 }, { time: 3400, value: 1.35 }, { time: 5400, value: 2.35 }, { time: 7600, value: 3.35 }]
const LABELS = ['', 'skin', 'cells', 'one atom']
const LINES = [
  { text: 'You are mostly empty space.', start: 300, end: 1700 },
  { text: 'Zoom in. Skin. Cells. Atoms.', start: 1900, end: 7400 },
  { text: 'The nucleus holds almost all the mass.', start: 8000, end: 11600 },
]

/** Level 0: a hand-like blob with a palm to dive into. */
function hand(ctx) {
  drawSkyGradient(ctx, { width: W, height: H, sky: 'cyan' })
  drawShadedBall(ctx, { x: CX, y: CY, radius: 120, color: '#f2c49b' })
  for (let i = 0; i < 4; i++) drawShadedBall(ctx, { x: CX - 90 + i * 60, y: CY - 150, radius: 34, color: '#f2c49b' })
}

/** Level 1: skin, with fingerprint ridges. */
function skin(ctx) {
  ctx.fillStyle = '#f2c49b'
  ctx.fillRect(CX - 900, CY - 900, 1800, 1800)
  ctx.strokeStyle = '#d4a479'
  ctx.lineWidth = 12
  for (let r = 40; r < 900; r += 44) {
    ctx.beginPath()
    ctx.ellipse(CX, CY + 40, r, r * 1.25, 0, Math.PI * 1.1, Math.PI * 2.9)
    ctx.stroke()
  }
}

/** Level 2: cells, flat-shaded. */
function cells(ctx) {
  drawSkyGradient(ctx, { width: W, height: H, top: '#fbcfe8', bottom: '#db2777' })
  for (let gy = -6; gy <= 6; gy++) {
    for (let gx = -6; gx <= 6; gx++) {
      const x = CX + gx * 140 + (gy % 2 ? 70 : 0)
      const y = CY + gy * 122
      drawShadedBall(ctx, { x, y, radius: 60, color: '#fda4af' })
      drawShadedBall(ctx, { x: x + 10, y: y + 8, radius: 20, color: '#be185d', highlight: false })
    }
  }
}

/** Level 3: one atom, a nucleus in a probability haze. */
function atom(ctx, time) {
  drawSkyGradient(ctx, { width: W, height: H, sky: 'space' })
  drawHaze(ctx, time, { x: CX, y: CY, radius: 120, dots: 520, dot: 1.6 })
  drawGlow(ctx, { x: CX, y: CY, radius: 60, color: '#fb923c', opacity: 0.8 })
  drawShadedBall(ctx, { x: CX, y: CY, radius: 6, color: '#fb923c', highlight: false })
}

// The sound: a whoosh into each level, a pop on each label, a shimmer on the reveal, a quiet drone under it all.
const RATE = 48000
const levelTimes = DIVE.slice(1).map((k) => k.time)
const audio = await renderMix(
  [
    { samples: soundPad(RATE, { duration: END }), gain: 0.4 },
    { samples: soundWhoosh(RATE, { duration: 800 }), at: levelTimes.map((t) => t - 650), gain: 0.5 },
    { samples: soundPop(RATE), at: levelTimes.map((t) => t - 250), gain: 0.4 },
    { samples: soundShimmer(RATE), at: [8200], gain: 0.5 },
  ],
  { output: 'tinyfly-cosmic-explainer-mix.wav', baseDir: tmpdir(), sampleRate: RATE, duration: END }
)

export default {
  width: W,
  height: H,
  fps: 30,
  duration: END,
  audio,
  captions: LINES,
  draw(ctx, frame) {
    const t = frame.time
    const depth = depthAt(t, DIVE)
    drawZoomLevels(ctx, t, { width: W, height: H, depth, levels: [hand, skin, cells, atom], center: { x: CX, y: CY }, portalRadius: 340 })
    // depth layers over everything, moving a little with the dive
    drawBokeh(ctx, t, { width: W, height: H, offset: { x: depth * 40, y: 0 } })
    drawDust(ctx, t, { width: W, height: H, count: 50, offset: { x: depth * 60, y: 0 } })
    // the label for the level that fills the screen
    for (let level = 1; level < LABELS.length; level++) {
      const k = levelPresence(depth, level)
      if (k > 0.5) drawLabelChip(ctx, t, { text: LABELS[level], x: CX, y: 150, size: 40, at: DIVE[level].time - 250 })
    }
    if (t > 8000) {
      drawLabelChip(ctx, t, { text: 'nucleus: 99.9%+ of the mass', x: CX, y: 260, size: 32, at: 8400 })
      drawIsoCube(ctx, { x: CX, y: H * 0.62, size: 90 * Math.min(1, (t - 8000) / 600), color: '#fb923c', sheen: 0.6 })
      drawCornerNote(ctx, { text: '*not to scale', x: W - 30, y: 60 })
    }
    drawShortCaption(ctx, t, { lines: LINES, x: CX, y: H * 0.72, size: 44 })
  },
}
