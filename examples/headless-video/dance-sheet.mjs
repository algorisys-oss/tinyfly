/**
 * Dance and flips: a model sheet of every dance style's moves and every flip.
 * Render it as a still:
 *
 *   npx tinyfly video examples/headless-video/dance-sheet.mjs --stills stills/
 *
 * Each style row shows its moves at their keys (`danceFrame(style, beat, { move })`),
 * with the hand shapes and mudras the keys set. Each flip row shows the flip
 * from wind-up to landing (`flipPose(name, progress)`), spaced out so the
 * frames read one by one, orange while airborne.
 */
import { DANCE_STYLES, FLIPS, danceFrame, flipPose, drawStickFigure } from '@algorisys/tinyfly/characters'

const W = 1920
const PAPER = '#fbf6ec'
const INK = '#2b1d16'
const SOFT = '#9a8676'
const SKIN = '#f2c49b'
const ACCENT = '#c2410c'

const LEFT = 270
const TOP = 120
const ROW_H = 200
const FIGURE = 120
const STYLES = Object.keys(DANCE_STYLES)
const FLIP_NAMES = Object.keys(FLIPS)
/** Flips go higher than dances stand: their rows get more headroom. */
const FLIP_ROW_H = 290
const FLIPS_TOP = TOP + STYLES.length * ROW_H
const H = FLIPS_TOP + FLIP_NAMES.length * FLIP_ROW_H + 40

const heading = (ctx, text, x, y, size = 22) => {
  ctx.fillStyle = INK
  ctx.font = `700 ${size}px sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText(text, x, y)
}
const note = (ctx, text, x, y, align = 'left') => {
  ctx.fillStyle = SOFT
  ctx.font = '14px sans-serif'
  ctx.textAlign = align
  ctx.fillText(text, x, y)
}

const style = { height: FIGURE, color: INK, headFill: SKIN, lineWidth: 4, shoulderWidth: 0.05 }

const ground = (ctx, y) => {
  ctx.strokeStyle = '#e4d8c4'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(LEFT - 20, y + 2)
  ctx.lineTo(W - 30, y + 2)
  ctx.stroke()
}

export default {
  width: W,
  height: H,
  fps: 24,
  duration: 1000,
  background: PAPER,
  draw(ctx, { time }) {
    heading(ctx, 'tinyfly · dance and flips', 40, 56, 32)
    note(ctx, 'Every pose here is data played by a pure function: danceFrame(style, beat) and flipPose(flip, progress).', 40, 86)

    // Dance styles: each move at each of its keys.
    STYLES.forEach((name, row) => {
      const dance = DANCE_STYLES[name]
      const baseY = TOP + row * ROW_H + FIGURE + 40
      heading(ctx, dance.label, 40, baseY - FIGURE + 10, 20)
      note(ctx, `${dance.bpm} bpm`, 40, baseY - FIGURE + 32)
      ground(ctx, baseY)
      let x = LEFT + 50
      for (const [moveName, move] of Object.entries(dance.moves)) {
        // Up to four keys a move; three when a style has more moves, so the row fits.
        const perMove = Object.keys(dance.moves).length > 3 ? 3 : 4
        const beats = [...new Set(move.keys.map((key) => key.beat))].slice(0, perMove)
        note(ctx, move.label, x - 40, baseY + 30)
        for (const beat of beats) {
          const frame = danceFrame(dance, beat, { move: moveName })
          ctx.save()
          ctx.translate(x, baseY)
          drawStickFigure(ctx, frame.pose, { ...style, hands: { ...frame.hands, size: 0.1 } }, time)
          ctx.restore()
          x += 92
        }
        x += 40
      }
    })

    // Flips: wind-up to landing.
    FLIP_NAMES.forEach((name, i) => {
      const flip = FLIPS[name]
      const baseY = FLIPS_TOP + (i + 1) * FLIP_ROW_H - 40
      heading(ctx, flip.label, 40, baseY - FIGURE + 10, 20)
      note(ctx, `spin ${flip.spin}°, ${flip.view ? 'profile' : 'front-on'}`, 40, baseY - FIGURE + 32)
      ground(ctx, baseY)
      const frames = 13
      for (let k = 0; k < frames; k++) {
        const progress = k / (frames - 1)
        const airborne = progress > flip.takeoff && progress < flip.landing
        ctx.save()
        ctx.translate(LEFT + 50 + k * 128, baseY)
        // Dot hands: fingers add little at this size, and a sheet of them is slow to draw.
        drawStickFigure(ctx, flipPose(flip, progress), { ...style, color: airborne ? ACCENT : INK }, time)
        ctx.restore()
      }
    })
  },
}
