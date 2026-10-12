/** Editable everyday, formal and casual garments on original adult/child rigs. */
import { softCartoonCharacter, drawCharacter, humanPose, outfitPreset } from '@algorisys/tinyfly/characters'

const styles = [
  { label: 'Everyday' },
  { label: 'Formal shirt & tie', category: 'formal' },
  { label: 'Formal blouse & skirt', category: 'formal', options: { top: 'blouse', bottom: 'skirt' } },
  { label: 'Casual T-shirt & jeans', category: 'casual' },
  { label: 'Cargo shorts', category: 'casual', options: { bottom: 'shorts', trouserStyle: 'cargo', trousers: '#6a7657' } },
  { label: 'Dress', category: 'casual', options: { top: 'dress', shirt: '#aa6b91', sleeves: 'none' } },
]

export default {
  width: 1440, height: 1120, fps: 1, duration: 1000, background: '#fbf6ed',
  draw(ctx) {
    ctx.textAlign = 'center'; ctx.fillStyle = '#503a32'; ctx.font = '600 28px sans-serif'
    ctx.fillText('Editable story clothing', 720, 40)
    ctx.font = '17px sans-serif'; ctx.fillText('Everyday · Formal · Casual — every garment is available for every actor', 720, 72)
    styles.forEach((style, col) => { ctx.font = '15px sans-serif'; ctx.fillText(style.label, 120 + col * 240, 104) })
    for (let row = 0; row < 3; row++) {
      styles.forEach((style, col) => {
        const name = row === 0 ? 'youngMan' : row === 1 ? 'youngWoman' : col % 2 ? 'childGirl' : 'childBoy'
        const actor = softCartoonCharacter(name, {
          height: row === 2 ? 225 : 260,
          ...(style.category ? { outfit: outfitPreset(style.category, style.options) } : {}),
        })
        const x = 120 + col * 240, y = 400 + row * 330
        ctx.save(); ctx.translate(x, y)
        drawCharacter(ctx, actor, humanPose({ turn: row === 1 ? .5 : 0, smile: .5 }), 0); ctx.restore()
        ctx.fillStyle = '#503a32'; ctx.font = '14px sans-serif'; ctx.fillText(name, x, y + 28)
      })
    }
  },
}
