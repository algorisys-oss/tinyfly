/**
 * Original soft cartoon actors: views, actions, clothing and legacy modes.
 * node bin/tinyfly.mjs video examples/headless-video/organic-characters.mjs --stills /tmp/organic-sheet
 */
import { character, softCartoonCharacter, drawCharacter, characterJoints, reachCharacter, humanPose, HUMAN_POSES, humanGaitPose, HAND_SHAPES, mirrorHumanPose } from '@algorisys/tinyfly/characters'

const paper = '#fbf6ed', ink = '#503a32'
const actors = ['youngMan', 'youngWoman'].map(name => softCartoonCharacter(name, { height: 235, lineWidth: 1.3 }))
const views = [0, .5, 1, 2, -1, -.5]
const labels = ['Front', '¾ right', 'Right profile', 'Back', 'Left profile', '¾ left']
const hand = shape => Object.fromEntries(Object.entries(HAND_SHAPES[shape]).map(([key, value]) => [`hand.right.${key}`, value]))
const crossed = humanPose({ turn: .35, 'arm.left.spread': 32, 'arm.right.spread': 32, 'arm.left.bend': -130, 'arm.right.bend': -130, 'arm.left.elbow': 0, 'arm.right.elbow': 0 })
const j = characterJoints(actors[0], humanPose({ turn: .5 }))
const cheek = reachCharacter(actors[0], humanPose({ turn: .5 }), 'arm.right', { x: j.head.center.x - j.head.rx * .6, y: j.head.center.y + j.head.ry * .65, depth: j.head.depth + j.head.rx * .6 })
const actions = [
  ['Arms up / open', { ...HUMAN_POSES.cheer, ...hand('open') }],
  ['Extended / point', { ...HUMAN_POSES.point, ...hand('point') }],
  ['Bent / fist', { ...HUMAN_POSES.think, ...hand('fist') }],
  ['Crossing torso', crossed],
  ['Palm at cheek', { ...cheek, ...hand('flat') }],
  ['Seated speaking', { ...HUMAN_POSES.sit, turn: .8, mouth: .4, 'arm.right.spread': 70, 'arm.right.bend': 35, 'arm.right.elbow': 0, ...hand('open') }],
]

function label(ctx, text, x, y, size = 18, bold = false) {
  ctx.fillStyle = ink; ctx.font = `${bold ? '600 ' : ''}${size}px sans-serif`; ctx.fillText(text, x, y)
}
function draw(ctx, who, pose, x, y) {
  ctx.save(); ctx.translate(x, y); drawCharacter(ctx, who, humanPose(pose)); ctx.restore()
}
export default {
  width: 1680, height: 1590, fps: 1, duration: 1000, background: paper,
  draw(ctx) {
    ctx.textAlign = 'center'
    label(ctx, 'SOFT CARTOON CHARACTERS', 840, 40, 30, true)
    label(ctx, 'Original editable actors · one native rig · contours independent of ink', 840, 72)
    actors.forEach((who, row) => {
      label(ctx, row ? 'Soft waist build — everyday clothing' : 'Round build — everyday clothing', 840, 108 + row * 295, 20, true)
      views.forEach((turn, column) => {
        draw(ctx, who, { turn, smile: .5 }, 140 + column * 280, 359 + row * 295)
        label(ctx, labels[column], 140 + column * 280, 383 + row * 295, 15)
      })
    })
    label(ctx, 'Articulated bodies and small hands', 840, 701, 20, true)
    actions.forEach(([name, pose], column) => {
      draw(ctx, actors[column % 2], pose, 140 + column * 280, 949)
      label(ctx, name, 140 + column * 280, 974, 15)
    })
    label(ctx, 'Leaf wardrobe — turns, seated pose and a walking frame', 840, 1007, 20, true)
    ;[0, .5, 1, -.5].forEach((turn, column) => {
      const who = softCartoonCharacter(column % 2 ? 'youngWoman' : 'youngMan', { height: 230, lineWidth: 1.3, outfit: null, leafOutfit: { top: column % 2 === 1 } })
      draw(ctx, who, { turn, smile: .5 }, 140 + column * 280, 1258)
    })
    draw(ctx, softCartoonCharacter('youngWoman', { height: 230, outfit: null, leafOutfit: {} }), { ...HUMAN_POSES.sit, turn: -.8 }, 1260, 1258)
    draw(ctx, softCartoonCharacter('youngMan', { height: 230, outfit: null, leafOutfit: { top: false } }), humanGaitPose('walk', .2, humanPose({ turn: .5 })), 1540, 1258)
    label(ctx, 'Compatibility and independent outline width', 840, 1304, 20, true)
    ;['fluid', 'stick', 'organic'].forEach((figure, column) => {
      draw(ctx, character({ figure, height: 215, skin: '#efbd96', outfit: { shirt: '#bc7050', trousers: '#495a67' } }), { smile: .5 }, 140 + column * 280, 1550)
      label(ctx, figure, 140 + column * 280, 1574, 15)
    })
    ;[0, 1.5, 4].forEach((lineWidth, column) => {
      draw(ctx, softCartoonCharacter('youngWoman', { height: 215, lineWidth, outfit: null, leafOutfit: {}, body: { shading: { mode: 'none' } } }), mirrorHumanPose(humanPose({ turn: .2, smile: .5 })), 980 + column * 280, 1550)
      label(ctx, `${lineWidth}px ink — same anatomy`, 980 + column * 280, 1574, 15)
    })
  },
}
