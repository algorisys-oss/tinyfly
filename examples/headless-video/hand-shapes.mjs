/**
 * Cartoon hands: a model sheet of every hand shape, turned and in every look.
 * Render it as a still:
 *
 *   npx tinyfly video examples/headless-video/hand-shapes.mjs --stills stills/
 *
 * Every hand is the same small rig: a palm and five finger chains in the
 * hand's own 3D space, posed by numbers (`index.curl`, `thumb.across`,
 * `spread`, `turn`…). Turning the wrist needs no extra drawing: fingers behind
 * the palm are drawn behind it, and nails show only where they face us.
 * Rows: the back of the hand, a 3/4 turn, the thumb side, the palm, the left
 * hand in pencil, the classic four-fingered glove and silhouettes. Below: a
 * fist opening (two shapes blended) and the animator's hand holding a pencil
 * and an eraser (`drawHand`, built on the same rig).
 */
import { drawCartoonHand, drawHand, HAND_SHAPES, mixHandPoses, sketchPen } from '@algorisys/tinyfly/characters'

const W = 1920
const H = 1500
const PAPER = '#fbf6ec'
const INK = '#2b1d16'
const SOFT = '#9a8676'

const SHAPES = Object.keys(HAND_SHAPES)
const LEFT = 220
const COL_W = (W - LEFT - 40) / SHAPES.length
const TOP = 150
const ROW_H = 150
const SIZE = 104

const ROWS = [
  { title: 'Back', note: 'turn 0', pose: (p) => p },
  { title: '3/4', note: 'turn 0.5', pose: (p) => ({ ...p, turn: (p.turn ?? 0) + 0.5 }) },
  { title: 'Thumb side', note: 'turn 1', pose: (p) => ({ ...p, turn: (p.turn ?? 0) + 1 }) },
  { title: 'Palm', note: 'turn 2', pose: (p) => ({ ...p, turn: (p.turn ?? 0) + 2 }) },
  { title: 'Left, pencil', note: "side: 'left'", style: { side: 'left', look: 'pencil' } },
  { title: 'Glove', note: 'fingers: 4', style: { fingers: 4, skin: '#ffffff' } },
  { title: 'Silhouette', note: "look: 'silhouette'", style: { look: 'silhouette', ink: INK } },
]

function heading(ctx, text, x, y, size = 20) {
  ctx.fillStyle = INK
  ctx.font = `bold ${size}px sans-serif`
  ctx.fillText(text, x, y)
}

function note(ctx, text, x, y, align = 'left') {
  ctx.fillStyle = SOFT
  ctx.font = '13px monospace'
  ctx.textAlign = align
  ctx.fillText(text, x, y)
  ctx.textAlign = 'left'
}

export default {
  width: W,
  height: H,
  fps: 24,
  duration: 1000,
  background: PAPER,
  draw(ctx, { time }) {
    heading(ctx, 'CARTOON HANDS', 40, 52, 30)
    note(ctx, 'tinyfly characters · a hand rig in 3D, drawn flat · HAND_SHAPES × turn × look', 320, 50)
    ctx.strokeStyle = INK
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(40, 70)
    ctx.lineTo(W - 40, 70)
    ctx.stroke()

    SHAPES.forEach((name, i) => note(ctx, name, LEFT + i * COL_W + COL_W / 2, TOP - 34, 'center'))
    ROWS.forEach((row, r) => {
      const wristY = TOP + r * ROW_H + ROW_H - 30
      heading(ctx, row.title, 40, wristY - 50, 18)
      note(ctx, row.note, 40, wristY - 30)
      SHAPES.forEach((name, i) => {
        const base = HAND_SHAPES[name]
        const pose = row.pose ? row.pose(base) : base
        drawCartoonHand(ctx, { x: LEFT + i * COL_W + COL_W / 2, y: wristY }, pose, { size: SIZE, ...row.style }, time)
      })
    })

    // A fist opening: two shapes blended, as a track would.
    const blendTop = TOP + ROWS.length * ROW_H + 40
    heading(ctx, 'Blending', 40, blendTop + 20, 18)
    note(ctx, 'mixHandPoses(fist, open, t)', 40, blendTop + 40)
    for (let k = 0; k <= 6; k++) {
      const t = k / 6
      const pose = { ...mixHandPoses(HAND_SHAPES.fist, HAND_SHAPES.open, t), turn: 1.6 }
      drawCartoonHand(ctx, { x: LEFT + 60 + k * 130, y: blendTop + 200 }, pose, { size: SIZE }, time)
      note(ctx, `t ${t.toFixed(2)}`, LEFT + 60 + k * 130, blendTop + 225, 'center')
    }

    // The animator's hand: the same rig in its pencil grip, holding a tool.
    const handX = LEFT + 7 * 130 + 80
    heading(ctx, "The animator's hand", handX, blendTop + 20, 18)
    note(ctx, "drawHand(ctx, tip, { tool, lift })", handX, blendTop + 40)
    const pen = sketchPen(ctx, { roughness: 2, boil: 8, seed: 3 }, time)
    ctx.strokeStyle = INK
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    pen.line([{ x: handX, y: blendTop + 170 }, { x: handX + 150, y: blendTop + 170 }])
    drawHand(ctx, { x: handX + 150, y: blendTop + 170 }, { scale: 0.6, arm: 120 }, pen)
    drawHand(ctx, { x: handX + 330, y: blendTop + 150 }, { scale: 0.6, tool: 'eraser', arm: 120 }, pen)
    drawHand(ctx, { x: handX + 500, y: blendTop + 170 }, { scale: 0.6, lift: 1, arm: 120 }, pen)
    note(ctx, 'pencil', handX + 150, blendTop + 240, 'center')
    note(ctx, 'eraser', handX + 330, blendTop + 240, 'center')
    note(ctx, 'lifted', handX + 500, blendTop + 240, 'center')
  },
}
