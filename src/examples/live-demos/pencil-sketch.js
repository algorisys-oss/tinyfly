import {
  POSES,
  EXPRESSIONS,
  withExpression,
  blendPose,
  drawStickFigure,
  sketchPen,
  drawHand,
  withErased,
  scrubPath,
  circlePath,
  pointAlong,
} from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = {
  POSES,
  EXPRESSIONS,
  withExpression,
  blendPose,
  drawStickFigure,
  sketchPen,
  drawHand,
  withErased,
  scrubPath,
  circlePath,
  pointAlong,
}

export const html = `<style>
  .ps-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .ps-canvas { width: 272px; height: 136px; border-radius: 8px; background: #fbf8ef; }
  .ps-row { display: flex; align-items: center; gap: 8px; font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .ps-row select { font: 12px system-ui, sans-serif; padding: 2px 4px; border-radius: 6px;
    border: 1px solid #475569; background: #1e293b; color: #e2e8f0; }
  .ps-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; }
</style>
<div class="ps-wrap">
  <canvas class="ps-canvas" width="680" height="340"></canvas>
  <div class="ps-row">
    <label><input type="checkbox" class="ps-sketch" checked /> pencil</label>
    <label>boil <select class="ps-boil" aria-label="Boil per second">
      <option value="0">off</option><option value="4">4/s</option><option value="8" selected>8/s</option><option value="12">12/s</option>
    </select></label>
    <label><input type="checkbox" class="ps-rubber" /> rubber limbs</label>
  </div>
  <div class="ps-readout">the hand draws the ground</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.ps-canvas')
  const sketchBox = root.querySelector('.ps-sketch')
  const boilSelect = root.querySelector('.ps-boil')
  const rubberBox = root.querySelector('.ps-rubber')
  const readout = root.querySelector('.ps-readout')
  const ctx = canvas.getContext('2d')

  const W = 680
  const H = 340
  const GROUND = 290
  const ink = '#2f2f33'

  // The strokes the hand draws and the eraser rubs, as points.
  const ground = []
  for (let x = 30; x <= 650; x += 40) ground.push({ x, y: GROUND + Math.sin(x * 0.05) * 2 })
  const sun = tinyfly.circlePath(540, 90, 42)
  const rub = tinyfly.scrubPath(486, 36, 108, 108, 8)

  // The story, in ms: each beat says how far its stroke has got (0..1).
  const LOOP = 8000
  const span = (t, start, end) => Math.min(1, Math.max(0, (t - start) / (end - start)))
  const beats = (t) => ({
    ground: span(t, 300, 2000),
    sun: span(t, 2600, 3600),
    erase: span(t, 4600, 6000),
  })

  // The figure's acting: a pose (with its face) per moment, blended in between.
  const pose = (name, face) => (face ? tinyfly.withExpression(tinyfly.POSES[name], face) : tinyfly.POSES[name])
  const acting = [
    [0, pose('rest', { smile: -0.3, browTilt: 0.8, lookY: 1 })], // nothing to stand on
    [2000, pose('rest', { smile: -0.3, browTilt: 0.8, lookY: 1 })],
    [2300, pose('handsOnHips', 'happy')],
    [3600, pose('handsOnHips', { ...tinyfly.EXPRESSIONS.happy, lookX: 1, lookY: -1 })],
    [3900, pose('cheer')],
    [4700, pose('cheer')],
    [5000, pose('surprised', { ...tinyfly.EXPRESSIONS.shocked, lookX: 1, lookY: -1 })],
    [6000, pose('surprised', { ...tinyfly.EXPRESSIONS.shocked, lookX: 1, lookY: -1 })],
    [6400, pose('sad')],
    [LOOP, pose('sad')],
  ]
  const poseAt = (t) => {
    const next = acting.findIndex(([time]) => time > t)
    if (next <= 0) return acting[acting.length - 1][1]
    const [t0, a] = acting[next - 1]
    const [t1, b] = acting[next]
    const k = (t - t0) / (t1 - t0)
    return tinyfly.blendPose(a, b, k * k * (3 - 2 * k)) // eased in and out
  }

  // One clock (ms) drives the whole scene; it loops.
  const clock = { time: 0 }
  live.to(clock, { time: LOOP, duration: LOOP / 1000, ease: 'none', repeat: -1 })

  const draw = () => {
    const t = clock.time
    const { ground: g, sun: s, erase: e } = beats(t)
    const beat = g < 1 ? ['the hand draws the ground', g] : s < 1 ? ['then a sun', s] : e === 0 ? ['hooray'] : e < 1 ? ['the eraser', e] : ['oh.']
    readout.textContent = beat.length > 1 ? `${beat[0]} · ${Math.round(beat[1] * 100)}%` : `${beat[0]} · ${(t / 1000).toFixed(1)}s`
    if (!ctx) return

    const boil = Number(boilSelect.value)
    const sketch = sketchBox.checked ? { roughness: 2.5, boil, seed: 7 } : undefined
    // With pencil off, the same strokes are drawn clean (one pass, no wobble).
    const pen = tinyfly.sketchPen(ctx, sketch ?? { roughness: 0, passes: 1 }, t)

    // Notebook paper.
    ctx.fillStyle = '#fbf8ef'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = '#cfe0f0'
    ctx.lineWidth = 2
    for (let y = 40; y < H; y += 34) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }

    ctx.strokeStyle = ink
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    // The sun, minus whatever the eraser has rubbed out so far.
    tinyfly.withErased(ctx, rub, 30, e, () => pen.curve(sun, s))

    ctx.save()
    ctx.translate(230, GROUND)
    tinyfly.drawStickFigure(
      ctx,
      poseAt(t),
      { height: 170, color: ink, lineWidth: 4.5, headFill: 'none', sketch, rubber: rubberBox.checked ? 1 : 0 },
      t
    )
    ctx.restore()

    ctx.strokeStyle = ink
    ctx.lineWidth = 4
    pen.line(ground, g)

    // The animator's hand, while it draws or rubs.
    const hand = { scale: 0.6 }
    if (g > 0 && g < 1) tinyfly.drawHand(ctx, tinyfly.pointAlong(ground, g), hand, pen)
    else if (s > 0 && s < 1) tinyfly.drawHand(ctx, tinyfly.pointAlong(sun, s), hand, pen)
    else if (e > 0 && e < 1) tinyfly.drawHand(ctx, tinyfly.pointAlong(rub, e), { ...hand, tool: 'eraser' }, pen)
  }
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const pencilSketch = {
  id: 'live-pencil-sketch',
  name: 'Pencil Sketch (Pencilmation-style)',
  description:
    'A hand draws the ground under a worried stick figure, then a sun, then comes back with an eraser. Pencil strokes boil (their wobble is redrawn a few times a second, seeded by time so frames are deterministic), strokes draw themselves on with a progress value, and erasing is clip-based. Toggle the pencil, the boil rate and rubber-hose limbs.',
  category: 'video',
  tags: ['canvas', 'character', 'stick figure', 'sketch', 'pencil', 'line boil', 'eraser', 'write-on', 'video'],
  html,
  run,
}
