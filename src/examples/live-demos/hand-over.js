import {
  character,
  drawCharacter,
  humanPose,
  humanGaitPose,
  humanGaitStrideLength,
  mixPoses,
  castMember,
  meetHands,
  meetingSpacing,
  HUMAN_EXPRESSIONS,
  HUMAN_POSES,
} from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { character, drawCharacter, humanPose, humanGaitPose, humanGaitStrideLength, mixPoses, castMember, meetHands, meetingSpacing, HUMAN_EXPRESSIONS, HUMAN_POSES }

export const html = `<style>
  .hov-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .hov-canvas { width: 100%; max-width: 460px; aspect-ratio: 720 / 330; height: auto; border-radius: 8px; background: #eaf3f8; }
  .hov-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; min-height: 1.4em; }
</style>
<div class="hov-wrap">
  <canvas class="hov-canvas" width="720" height="330"></canvas>
  <div class="hov-readout"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.hov-canvas')
  const readout = root.querySelector('.hov-readout')
  const ctx = canvas.getContext('2d')
  const W = 720
  const H = 330
  const GROUND = 300
  const LOOP = 10000

  // A courier with a parcel, and a neighbour. Both are cast members; the
  // parcel is something held (`holding: { both: 'parcel' }`), shown while
  // the pose's `held.both` is 1.
  const courier = tinyfly.character(tinyfly.castMember('man', 230, { hat: 'cap', holding: { both: 'parcel' }, hands: 'cartoon' }))
  const neighbour = tinyfly.character(tinyfly.castMember('youngWoman', 230, { holding: { both: 'parcel' }, hands: 'cartoon' }))

  // Where they stop: as far apart as a handshake and a hand-over need.
  const centre = W / 2
  const gap = tinyfly.meetingSpacing('handOver', courier, neighbour)
  const stopA = centre - gap / 2
  const stopB = centre + gap / 2
  const startA = 60
  const startB = W - 60
  const give = tinyfly.meetHands('handOver', { character: courier, x: stopA }, { character: neighbour, x: stopB })

  const ease = (u) => u * u * (3 - 2 * u)
  const between = (t, t0, t1) => ease(Math.min(1, Math.max(0, (t - t0) / (t1 - t0))))
  const face = (name) => tinyfly.HUMAN_EXPRESSIONS[name]

  /** A walk from `from` to `to` between t0 and t1: the gait's phase follows the distance, so feet stay planted. */
  const walking = (who, t, t0, t1, from, to, base) => {
    const u = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)))
    const x = from + (to - from) * u
    const stride = tinyfly.humanGaitStrideLength('walk', who.height)
    const pose = tinyfly.humanGaitPose('walk', Math.abs(x - from) / stride, { ...base, turn: to > from ? 1 : 3 })
    return { x, pose, moving: u > 0 && u < 1 }
  }

  const clock = { time: 0 }
  live.to(clock, { time: LOOP, duration: LOOP / 1000, ease: 'none', repeat: -1 })

  const courierAt = (t) => {
    if (t < 2200) {
      const walk = walking(courier, t, 0, 2200, startA, stopA, { ...tinyfly.HUMAN_POSES.lift, ...face('happy') })
      // Carrying: the arms keep the parcel at the chest while the legs walk.
      for (const key of Object.keys(tinyfly.HUMAN_POSES.lift)) if (key.startsWith('arm.')) walk.pose[key] = tinyfly.HUMAN_POSES.lift[key]
      return walk
    }
    const holdParcel = { ...tinyfly.HUMAN_POSES.lift, ...face('happy'), turn: 0.62 }
    let pose = tinyfly.mixPoses(holdParcel, give.a, between(t, 2400, 3000))
    // Hand it over at 3600: the courier lets go as the neighbour takes it.
    pose = { ...pose, 'held.both': t < 3600 ? 1 : 0 }
    pose = tinyfly.mixPoses(pose, { ...tinyfly.humanPose(face('happy')), turn: 0.62, 'held.both': 0 }, between(t, 3700, 4200))
    pose = tinyfly.mixPoses(pose, { ...tinyfly.HUMAN_POSES.wave, ...face('joyful'), turn: 0.62, 'held.both': 0 }, between(t, 4800, 5300))
    if (t > 7000) return walking(courier, t, 7400, 9600, stopA, startA, { ...face('happy'), 'held.both': 0 })
    return { x: stopA, pose }
  }

  const neighbourAt = (t) => {
    if (t < 2200) return walking(neighbour, t, 400, 2200, startB, stopB, { ...face('neutral'), 'held.both': 0 })
    let pose = tinyfly.mixPoses({ ...tinyfly.humanPose(face('surprised')), turn: 3.38, 'held.both': 0 }, { ...give.b, ...face('excited'), 'held.both': 0 }, between(t, 2700, 3400))
    pose = { ...pose, 'held.both': t < 3600 ? 0 : 1 }
    pose = tinyfly.mixPoses(pose, { ...tinyfly.HUMAN_POSES.lift, ...face('affectionate'), turn: 3.38, 'held.both': 1 }, between(t, 3700, 4200))
    pose = tinyfly.mixPoses(pose, { ...tinyfly.HUMAN_POSES.lift, ...face('happy'), turn: 3.38, 'held.both': 1 }, between(t, 6400, 6900))
    return { x: stopB, pose }
  }

  const caption = (t) =>
    t < 2200 ? 'walk (feet planted, stride from the build)' : t < 3600 ? "meetHands('handOver'): four hands reach one parcel" : t < 4800 ? 'held.both: 1 → 0 as the other’s goes 0 → 1' : t < 7400 ? 'wave · affectionate (blush)' : 'walk away'

  const draw = () => {
    const t = clock.time
    readout.textContent = caption(t)
    if (!ctx) return
    ctx.fillStyle = '#eaf3f8'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#d9e6c8'
    ctx.fillRect(0, GROUND, W, H - GROUND)
    const a = courierAt(t)
    const b = neighbourAt(t)
    for (const [who, at] of [[neighbour, b], [courier, a]]) {
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
export const handOver = {
  id: 'live-hand-over',
  name: 'Hand Over',
  description:
    'A courier walks up with a parcel and hands it over. Two characters’ hands meet at one point (meetHands: hand-over, handshake, high five, fist bump) instead of two clips hoping to line up; the parcel is something held (`holding: { both: "parcel" }`) that passes from one to the other as their `held.both` fields cross.',
  category: 'video',
  tags: ['canvas', 'character', 'interaction', 'handshake', 'props', 'cast', 'video'],
  html,
  run,
}
