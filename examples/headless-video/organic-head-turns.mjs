/** Close-up review of the story's independent head turns through profile/back. */
import { softCartoonCharacter, drawCharacterHead, humanPose } from '@algorisys/tinyfly/characters'

const turns = [0, .3, .6, .82, 1, 1.15, 1.5, 2, -1.5, -1, -.82, -.6]
export default {
  width: 1920, height: 490, fps: 1, duration: 1000, background: '#fbf6ed',
  draw(ctx) {
    ctx.textAlign = 'center'; ctx.fillStyle = '#503a32'; ctx.font = '600 26px sans-serif'
    ctx.fillText('Story head turns — eyes, mouth and hair follow one volume', 960, 36)
    ;['youngMan', 'youngWoman'].forEach((name, row) => {
      const who = softCartoonCharacter(name, { lineWidth: 1.2 })
      turns.forEach((turn, column) => {
        const x = column * 160 + 80, y = row * 210 + 130
        // Keep the body at its story orientation; only turn the head.
        drawCharacterHead(ctx, who, humanPose({ turn: .6, 'head.turn': turn * 90 - 54, smile: .5, mouth: .15 }), { x, y, radius: 52 })
        ctx.fillStyle = '#503a32'; ctx.font = '15px sans-serif'; ctx.fillText(`${Math.round(turn * 90)}°`, x, y + 88)
      })
    })
    ctx.font = '15px sans-serif'; ctx.fillText('Native head.turn · volume projection · opaque hair · no reflected or floating eyes', 960, 477)
  },
}
