/** Original child presets, proportions, poses and turns using the public rig. */
import { softCartoonCharacter, drawCharacter, humanPose, HUMAN_POSES, humanGaitPose } from '@algorisys/tinyfly/characters'

export default {
  width: 1440, height: 1170, fps: 1, duration: 1000, background: '#fbf6ed',
  draw(ctx) {
    ctx.textAlign = 'center'; ctx.fillStyle = '#503a32'; ctx.font = '600 28px sans-serif'
    ctx.fillText('Original child story characters', 720, 40)
    ctx.font = '17px sans-serif'; ctx.fillText('Larger head · shorter limbs · rounded torso · the same public motion APIs', 720, 72)
    const actors = ['youngMan', 'youngWoman', 'childBoy', 'childGirl']
    actors.forEach((name, i) => {
      const who = softCartoonCharacter(name)
      ctx.save(); ctx.translate(180 + i * 360, 400); drawCharacter(ctx, who, humanPose({ smile: .5 }), 0); ctx.restore()
      ctx.fillStyle = '#503a32'; ctx.font = '17px sans-serif'; ctx.fillText(name, 180 + i * 360, 430)
    })
    ;['childBoy', 'childGirl'].forEach((name, row) => {
      const who = softCartoonCharacter(name, { height: 195 })
      ;[0, .5, 1, 2, -1, -.5].forEach((turn, col) => {
        ctx.save(); ctx.translate(120 + col * 240, 670 + row * 230)
        drawCharacter(ctx, who, humanPose({ turn, smile: .5 }), 0); ctx.restore()
      })
    })
    const poses = [HUMAN_POSES.cheer, HUMAN_POSES.point, HUMAN_POSES.think, HUMAN_POSES.sit, humanGaitPose('walk', .2), humanPose({ turn: .6 })]
    poses.forEach((pose, i) => {
      const who = softCartoonCharacter(i % 2 ? 'childGirl' : 'childBoy', { height: 175, ...(i > 3 ? { outfit: null, leafOutfit: { top: true } } : {}) })
      ctx.save(); ctx.translate(120 + i * 240, 1120); drawCharacter(ctx, who, pose, 0); ctx.restore()
    })
  },
}
