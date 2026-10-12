/**
 * Resting shapes for the three flowing cartoon hairstyles in eight views.
 * npx tinyfly video examples/headless-video/flowing-hair-sheet.mjs --stills stills/
 */
import { character, drawCharacterHead, humanPose } from '@algorisys/tinyfly/characters'

const names = ['softSweep', 'flowingBob', 'cascadingWaves']
const labels = ['Soft sweep', 'Flowing bob', 'Cascading waves']
const views = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]
const cast = names.map(style => character({
  height: 300, lineWidth: 2.2, ink: '#342b32', skin: '#f2cfb1', ears: true,
  face: { style: 'anime', iris: '#567f73' }, hair: { style, color: '#985b32' },
}))

export default {
  width: 1440, height: 1120, fps: 1, duration: 1000, background: '#fbf6ee',
  draw(ctx, { time }) {
    ctx.textAlign = 'left'
    ctx.fillStyle = '#493c42'; ctx.font = 'bold 28px sans-serif'
    ctx.fillText('FLOWING CARTOON HAIR', 24, 40)
    ctx.font = '16px sans-serif'
    ctx.fillText('One editable description per style · scalp-attached locks · eight resting views', 24, 69)
    names.forEach((style, row) => {
      ctx.textAlign = 'left'; ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#493c42'
      ctx.fillText(`${labels[row]} · ${style}`, 24, 106 + row * 335)
      views.forEach((turn, column) => {
        const x = 90 + column * 180
        drawCharacterHead(ctx, cast[row], humanPose({ turn, smile: 0.5 }), { x, y: 190 + row * 335, radius: 51, time })
        ctx.textAlign = 'center'; ctx.font = '14px sans-serif'; ctx.fillStyle = '#806e73'
        ctx.fillText(['Front', '¾ right', 'Profile', '¾ back', 'Back', '¾ back', 'Profile', '¾ left'][column], x, 410 + row * 335)
      })
    })
  },
}
