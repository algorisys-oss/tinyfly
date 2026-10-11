import { character, drawCharacter, humanPose, humanGaitPose, humanGaitStrideLength, humanCyclePose, mixPoses, castMember, embrace, embraceSpacing, helpUp, helpUpSpacing, HUMAN_EXPRESSIONS, HUMAN_POSES } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { character, drawCharacter, humanPose, humanGaitPose, humanGaitStrideLength, humanCyclePose, mixPoses, castMember, embrace, embraceSpacing, helpUp, helpUpSpacing, HUMAN_EXPRESSIONS, HUMAN_POSES }

export const html = `<style>
  .hup-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .hup-canvas { width: 100%; max-width: 460px; aspect-ratio: 720 / 330; height: auto; border-radius: 8px; background: #f3efe4; }
  .hup-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; min-height: 1.4em; }
</style>
<div class="hup-wrap">
  <canvas class="hup-canvas" width="720" height="330"></canvas>
  <div class="hup-readout"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.hup-canvas')
  const readout = root.querySelector('.hup-readout')
  const ctx = canvas.getContext('2d')
  const W = 720
  const H = 330
  const GROUND = 300
  const LOOP = 11000

  // A cook sweeping the yard with a broom (something held), and grandpa, who has sat down on the floor, tired.
  const cook = tinyfly.character(tinyfly.castMember('cook', 230, { holding: { right: 'broom' }, hands: 'cartoon' }))
  const grandpa = tinyfly.character(tinyfly.castMember('grandpa', 230, { hands: 'cartoon' }))
  const face = (name) => tinyfly.HUMAN_EXPRESSIONS[name]
  const ease = (u) => u * u * (3 - 2 * u)
  const between = (t, t0, t1) => ease(Math.min(1, Math.max(0, (t - t0) / (t1 - t0))))

  // Where they stand: the cook sweeps on the left, grandpa sits on the right; the cook walks over to the
  // help-up distance, and after it they stand a hug apart.
  const sweepAt = 150
  const sitAt = 520
  const helpAt = sitAt - tinyfly.helpUpSpacing(cook, grandpa)
  const hugAt = sitAt - tinyfly.embraceSpacing(cook, grandpa)
  const hug = tinyfly.embrace({ character: cook, x: hugAt }, { character: grandpa, x: sitAt })

  const clock = { time: 0 }
  live.to(clock, { time: LOOP, duration: LOOP / 1000, ease: 'none', repeat: -1 })

  /** A walk from `from` to `to` between t0 and t1: the gait's phase follows the distance, so the feet stay planted. */
  const walking = (who, t, t0, t1, from, to, base) => {
    const u = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)))
    const x = from + (to - from) * u
    const stride = tinyfly.humanGaitStrideLength('walk', who.height)
    return { x, pose: tinyfly.humanGaitPose('walk', Math.abs(x - from) / stride, { ...base, turn: to > from ? 1 : 3 }) }
  }

  const cookAt = (t) => {
    // Sweeping: a cycle like a gait, one stroke and back per 900 ms, the broom in hand.
    if (t < 3000) return { x: sweepAt, pose: tinyfly.humanCyclePose('sweeping', t / 900, { ...tinyfly.humanPose(face('neutral')), turn: 0.62 }) }
    // Notices grandpa, puts the broom down (lets go of it) and walks over.
    if (t < 3600) return { x: sweepAt, pose: tinyfly.mixPoses(tinyfly.humanCyclePose('sweeping', 3000 / 900, { ...tinyfly.humanPose(face('neutral')), turn: 0.62 }), { ...tinyfly.humanPose(face('worried')), turn: 0.62, 'held.right': 0 }, between(t, 3000, 3500)) }
    if (t < 5000) return walking(cook, t, 3600, 5000, sweepAt, helpAt, { ...face('worried'), 'held.right': 0 })
    // The help-up: the cook bows to take the hand, and straightens as grandpa rises (progress 0 → 1).
    if (t < 7400) {
      const up = tinyfly.helpUp({ character: cook, x: helpAt, pose: { ...face('determined'), 'held.right': 0 } }, { character: grandpa, x: sitAt, pose: face('tired') }, between(t, 5600, 7000))
      return { x: helpAt, pose: up.helper }
    }
    // Then a hug.
    const stepIn = between(t, 7400, 8000)
    return { x: helpAt + (hugAt - helpAt) * stepIn, pose: tinyfly.mixPoses(tinyfly.helpUp({ character: cook, x: helpAt, pose: { ...face('determined'), 'held.right': 0 } }, { character: grandpa, x: sitAt }, 1).helper, { ...hug.a, ...face('affectionate'), 'held.right': 0 }, stepIn) }
  }

  const grandpaAt = (t) => {
    const sitting = { ...tinyfly.HUMAN_POSES.sitFloor, ...face('tired'), turn: 3.38 }
    if (t < 5000) return { x: sitAt, pose: sitting }
    if (t < 7400) {
      const up = tinyfly.helpUp({ character: cook, x: helpAt }, { character: grandpa, x: sitAt, pose: face(t < 6800 ? 'tired' : 'relieved') }, between(t, 5600, 7000))
      return { x: sitAt, pose: up.sitter }
    }
    const stepIn = between(t, 7400, 8000)
    return { x: sitAt, pose: tinyfly.mixPoses(tinyfly.helpUp({ character: cook, x: helpAt }, { character: grandpa, x: sitAt, pose: face('relieved') }, 1).sitter, { ...hug.b, ...face('affectionate') }, stepIn) }
  }

  const caption = (t) =>
    t < 3000 ? "humanCyclePose('sweeping', phase): a stroke and back, the broom held" : t < 5000 ? 'lets go of the broom (held.right 0) and walks over' : t < 7400 ? 'helpUp(helper, sitter, progress): hands joined from the floor to standing' : 'embrace(a, b): arms over the shoulder and round the waist, heads together'

  const draw = () => {
    const t = clock.time
    readout.textContent = caption(t)
    if (!ctx) return
    ctx.fillStyle = '#f3efe4'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#ddd3bd'
    ctx.fillRect(0, GROUND, W, H - GROUND)
    const a = cookAt(t)
    const b = grandpaAt(t)
    for (const [who, at] of [[grandpa, b], [cook, a]]) {
      ctx.save()
      ctx.translate(at.x, GROUND)
      tinyfly.drawCharacter(ctx, who, at.pose, t)
      ctx.restore()
    }
  }
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const helpUpCard = {
  id: 'live-help-up',
  name: 'Help Up',
  description:
    'A cook sweeps the yard (humanCyclePose: sweeping, a stroke and back per phase, the broom held in hand), sees grandpa sitting on the floor, lets go of the broom and walks over. helpUp(helper, sitter, progress) keeps their hands joined from the floor to standing as the cook bows and straightens, then embrace(a, b) puts each one’s arms over the other’s shoulder and round the waist, heads together. Two people, more than hands, all plain poses from where they stand.',
  category: 'video',
  tags: ['canvas', 'character', 'interaction', 'hug', 'help', 'sweeping', 'cast', 'video'],
  html,
  run,
}
