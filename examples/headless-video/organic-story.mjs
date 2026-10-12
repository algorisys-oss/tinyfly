/** A short story/motion study, using only the public character APIs. */
import { softCartoonCharacter, characterScript, characterPoseTracks, characterPoseOf, drawCharacter, humanPose, mirrorHumanPose, HUMAN_POSES, HUMAN_REST, HAND_REST, HAND_SHAPES, lipSyncOver, hairFollowTracks, characterJoints } from '@algorisys/tinyfly/characters'

const actors = ['youngMan', 'youngWoman'].map(name => softCartoonCharacter(name, { height: 420, lineWidth: 1.8 }))
const rest = { ...HUMAN_REST, ...Object.fromEntries(['left', 'right'].flatMap(side => Object.entries(HAND_REST).map(([key, value]) => [`hand.${side}.${key}`, value]))) }
const hand = (shape, turn = 2) => Object.fromEntries(Object.entries({ ...HAND_SHAPES[shape], turn }).map(([key, value]) => [`hand.right.${key}`, value]))
const tracks = actors.flatMap((who, i) => {
  const id = `actor-${i}`, sign = i ? -1 : 1, base = humanPose({ turn: .6, smile: .55 })
  const script = characterScript(id, who, [{ do: 'walk', to: sign * 55, for: 2500 }, { do: 'stand', for: 13500 }], { from: 0, facing: sign })
  const posed = (name, shape) => ({ ...HUMAN_POSES[name], turn: .6, ...hand(shape) })
  const keys = [
    { time: 0, pose: base }, { time: 2500, pose: base },
    { time: 3300, pose: posed('wave', 'open') }, { time: 4700, pose: posed('point', 'point') },
    { time: 6100, pose: posed('think', 'fist') }, { time: 7500, pose: base },
    { time: 9000, pose: { ...base, turn: 1.8 } }, { time: 10500, pose: { ...base, turn: 3.3 } }, { time: 11500, pose: { ...base, turn: 4.6 } },
    { time: 12100, pose: { ...HUMAN_POSES.sit, turn: .6 } },
    { time: 13000, pose: { ...HUMAN_POSES.sit, turn: .6, 'arm.right.spread': 65, 'arm.right.elbow': 0, 'arm.right.bend': 40, ...hand('open') } },
    { time: 15400, pose: { ...HUMAN_POSES.sit, turn: .6 } }, { time: 16000, pose: { ...HUMAN_POSES.sit, turn: .6 } },
  ].map(key => ({ ...key, pose: i ? mirrorHumanPose(key.pose) : key.pose, easing: 'ease-in-out' }))
  let native = characterPoseTracks(id, keys, rest)
  native.push(...script.tracks.filter(track => ['x', 'y', 'walk', 'walking', 'gait'].includes(track.property)))
  native = lipSyncOver(id, native, [{ text: i ? 'Every story can have its own characters.' : 'Let us make a new story together.', start: i ? 13600 : 12200, end: i ? 15400 : 13500 }])
  native.push(...hairFollowTracks(id, native, who))
  return native
})
export default {
  width: 1120, height: 720, fps: 24, duration: 16000, background: '#fbf6ed',
  timeline: { id: 'organic-story', tracks },
  draw(ctx, frame) {
    ctx.textAlign = 'center'; ctx.fillStyle = '#503a32'; ctx.font = '600 30px sans-serif'
    ctx.fillText('Soft cartoon story characters', 560, 46)
    ctx.font = '18px sans-serif'
    ctx.fillText(frame.time < 2500 ? 'Native walking and ground contact' : frame.time < 7500 ? 'Open palm · pointing · fist' : frame.time < 12000 ? 'Full turns with flowing hair' : 'Seated speaking and hand gestures', 560, 77)
    actors.forEach((who, i) => {
      const values = Object.fromEntries(frame.state?.values.get(`actor-${i}`) ?? [])
      const pose = characterPoseOf(values)
      ctx.save(); ctx.translate((i ? 805 : 315) + (values.x ?? 0), 620)
      if (frame.time >= 12100) {
        const hip = characterJoints(who, pose).points.hip
        ctx.fillStyle = '#ad8d6b'; ctx.beginPath(); ctx.roundRect(hip.x - 56, hip.y + 7, 110, 14, 5); ctx.fill(); ctx.fillRect(hip.x - 42, hip.y + 21, 12, -hip.y - 21)
      }
      drawCharacter(ctx, who, pose, frame.time); ctx.restore()
    })
    ctx.font = '16px sans-serif'; ctx.fillStyle = '#806e63'
    ctx.fillText('The same public rig, JSON tracks, body profiles and skin material in every frame', 560, 677)
  },
}
