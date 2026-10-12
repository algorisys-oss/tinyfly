import type { Track } from '../../engine/types'
import { vec3, type Vec3 } from '../../engine/math'
import { HUMAN_REST } from '../../characters/species/human'
import { humanGaitPose, humanGaitStrideLength } from '../../characters/species/human-motion'
import { HAND_SHAPES } from '../../characters/hands/hand-rig'
import type { Pose } from '../../characters/rig/body-plan'
import { ballFlightPoint, sampleTimes } from '../ball-flight'
import { CRICKET_PITCH, cricketField } from './cricket-field'
import { CRICKET_ACTIONS, CRICKET_FORMATS, cricketChoice, type CricketAction, type CricketActionOptions, type CricketActionResult, type CricketClip, type CricketEvent, type CricketField, type CricketFieldOptions, type CricketResult } from './cricket-types'
import { add, alignCricketEquipment, batSweetSpot, blendPose, cricketActor, cricketJoint, cricketPalm, cricketReach, gripBat, poseSequence, progress, restSample, smooth, type CricketActor, type CricketSample } from './cricket-motion'

const RELEASE = 1900
const BOUNCE = 2450
const CONTACT = 2900
const CATCH = 4100
const COLLECT = 4200
const THROW = 4600
const RETURN = 5300
const FINISH = 5500

/** Native gait, keyed ahead of time. Travel and stride use the same distance. */
function runBetween(actor: CricketActor, time: number, start: number, end: number, from: Vec3, to: Vec3): CricketSample {
  const u = progress(time, start, end)
  const distance = vec3.distance(from, to)
  const turn = Math.atan2(to[0] - from[0], to[2] - from[2]) * 2 / Math.PI
  const base = { ...HUMAN_REST, ...actor.object.pose, turn }
  const stride = humanGaitStrideLength('run', actor.who.height, 1, (actor.object.character?.legLength as number | undefined) ?? 1)
  const gait = humanGaitPose('run', distance * u / stride, base)
  const weight = Math.min(u * 12, (1 - u) * 12, 1)
  return { position: vec3.lerp(from, to, u), pose: blendPose(base, gait, Math.max(0, weight)) }
}

function toward(sample: CricketSample, forward: number, height: number): Vec3 {
  const angle = (sample.pose.turn ?? 0) * Math.PI / 2
  return add(sample.position, [Math.sin(angle) * forward, height, Math.cos(angle) * forward])
}

function appendActorTracks(tracks: Track[], scene: string, actor: CricketActor, times: number[], samples: CricketSample[]): void {
  const target = `${scene}/${actor.object.id}`
  const rest = { ...HUMAN_REST, ...actor.object.pose }
  const fields = new Set(samples.flatMap(sample => Object.keys(sample.pose)))
  for (const field of fields) {
    const initial = rest[field] ?? 0
    if (!samples.some(sample => sample.pose[field] !== initial)) continue
    tracks.push({ id: `${actor.object.id}-${field}`, target, property: field, keyframes: times.map((time, i) => ({ time, value: samples[i].pose[field] ?? initial })) })
  }
  for (const [axis, property] of ['x', 'y', 'z'].entries()) {
    if (!samples.some(sample => sample.position[axis] !== (actor.object.position?.[axis] ?? 0))) continue
    tracks.push({ id: `${actor.object.id}-${property}`, target, property, keyframes: times.map((time, i) => ({ time, value: samples[i].position[axis] })) })
  }
  if (samples[0].bat) {
    const id = actor.object.id === 'batter' ? 'bat' : 'non-striker-bat'
    const batTarget = `${scene}/${id}`
    tracks.push({ id: `${id}-visible`, target: batTarget, property: 'visible', keyframes: [{ time: 0, value: 1 }] })
    tracks.push({ id: `${id}-position`, target: batTarget, property: 'position', keyframes: times.map((time, i) => ({ time, value: [...samples[i].bat!.grip] })) })
    tracks.push({ id: `${id}-rotation`, target: batTarget, property: 'quaternion', interpolation: 'slerp', keyframes: times.map((time, i) => ({ time, value: alignCricketEquipment(samples[i].bat!.axis) })) })
  }
}

function outcome(action: CricketActionResult['action'], format: CricketField['format']): CricketResult {
  const result: CricketResult = { runs: 0, extras: 0, wickets: 0, legalBall: true, freeHitNext: false }
  if (action === 'running') result.runs = 1
  if (action === 'four') result.runs = 4
  if (action === 'six') result.runs = 6
  if (action === 'wide' || action === 'no-ball') { result.extras = 1; result.legalBall = false }
  if (action === 'no-ball') result.freeHitNext = CRICKET_FORMATS[format].freeHitAfterNoBall
  const dismissals: Partial<Record<CricketAction, CricketResult['dismissal']>> = { catch: 'caught', bowled: 'bowled', lbw: 'lbw', stumping: 'stumped', 'run-out': 'run-out' }
  const dismissal = dismissals[action]
  if (dismissal) { result.wickets = 1; result.dismissal = dismissal }
  return result
}

/** Compile an authored play on a cricketField into JSON tracks and narration events. No renderer or clock. */
export function cricketAction(field: CricketField, options: CricketActionOptions = {}): CricketActionResult {
  const action = cricketChoice(CRICKET_ACTIONS, options.action ?? 'bowling', 'cricketAction.action')
  cricketChoice(CRICKET_FORMATS, field.format, 'cricketAction.format')
  const duration = options.duration ?? 6000
  if (!Number.isFinite(duration) || duration < 4000 || duration > 60000) throw new Error('cricketAction: duration must be between 4000 and 60000 ms')
  const scene = field.scene.id
  for (const id of ['ball', 'bat', 'non-striker-bat', 'lbw-guide', 'striker-bail-0', 'striker-bail-1', 'bowler-bail-0', 'bowler-bail-1']) {
    if (!field.scene.objects.some(object => object.id === id)) throw new Error(`cricketAction: required equipment '${id}' is missing`)
  }
  const actors = Object.fromEntries(['batter', 'non-striker', 'bowler', 'keeper', 'fielder', 'umpire'].map(id => [id, cricketActor(field.scene, id)]))
  const h = (id: string) => actors[id].who.height
  const base = (id: string) => restSample(actors[id])
  const phase = (real: number) => Math.round(real * 6000 / duration * 1e9) / 1e9
  const actual = (normal: number) => normal * duration / 6000
  const hits = ['batting', 'defend', 'running', 'four', 'six', 'catch', 'fielding', 'throw', 'run-out'].includes(action)
  const keeperDelivery = ['bowling', 'spin', 'no-ball', 'stumping'].includes(action)
  const fielded = ['catch', 'fielding', 'throw', 'run-out', 'batting', 'running'].includes(action)
  const running = action === 'running' || action === 'run-out'
  const cache = new Map<string, Map<number, CricketSample>>()
  const bowlEnd: Vec3 = [base('bowler').position[0], 0, action === 'no-ball' ? -8.25 : -9.55]
  const gatherPosition: Vec3 = action === 'fielding' ? [10.5, 0, 2] : [9, 0, -1]
  const fieldStart = base('fielder').position

  const sampleActor = (id: string, time: number): CricketSample => {
    let cached = cache.get(id)
    if (!cached) { cached = new Map(); cache.set(id, cached) }
    const found = cached.get(time)
    if (found) return found
    const actor = actors[id]
    let sample = base(id)
    if (id === 'bowler') {
      const from = sample.position
      if (time < 1400) {
        const end = add(bowlEnd, [0, 0, -.65])
        sample = runBetween(actor, time, 0, 1400, from, end)
        sample.pose['arm.right.swing'] = 45; sample.pose['arm.right.elbow'] = 80
      } else {
        sample.position = time <= RELEASE ? vec3.lerp(add(bowlEnd, [0, 0, -.65]), bowlEnd, smooth(progress(time, 1400, RELEASE))) : add(bowlEnd, [0, 0, .8 * smooth(progress(time, RELEASE, 2600))])
        sample.pose = poseSequence(time, [
          [1400, { turn: 0, 'arm.right.swing': 285, 'arm.right.elbow': 8, 'arm.left.swing': 115, 'leg.right.swing': 15, 'leg.left.knee': 45 }],
          [1800, { turn: 0, 'arm.right.swing': 180, 'arm.right.elbow': 0, 'arm.left.swing': 80, 'leg.right.swing': 25, 'leg.right.knee': 0, 'leg.left.swing': -25, 'leg.left.knee': 60 }],
          [RELEASE, { turn: 0, lean: 8, 'arm.right.swing': 155, 'arm.right.elbow': 0, 'arm.left.swing': 45, 'leg.right.swing': 25, 'leg.right.knee': 0, 'leg.left.swing': -25, 'leg.left.knee': 60 }],
          [2250, { turn: 0, lean: 26, bend: 12, 'arm.right.swing': 40, 'arm.right.elbow': 0, 'arm.left.swing': -35, 'leg.left.swing': -35, 'leg.left.knee': 55 }],
          [3000, { turn: 0, 'head.turn': 10 }], [6000, { turn: 0, 'head.turn': 10 }],
        ])
      }
      if (action === 'spin') sample.pose = { ...sample.pose, 'arm.right.spread': 18, 'head.tilt': -5 }
      for (const [key, value] of Object.entries(time < RELEASE ? HAND_SHAPES.hold : HAND_SHAPES.open)) sample.pose[`hand.right.${key}`] = value
    } else if (id === 'batter' || id === 'non-striker') {
      const H = h(id)
      if (action === 'lbw' && id === 'batter') sample.position[0] = 0
      if (action === 'stumping' && id === 'batter') sample.position[2] -= 1.1 * smooth(progress(time, 2150, 2800))
      if (running && time > 3050) {
        const from = sample.position
        const to: Vec3 = id === 'batter' ? [1, 0, -9.5] : [-1, 0, 9.5]
        const end = action === 'run-out' ? 6000 : FINISH
        sample = runBetween(actor, time, 3050, end, from, to)
        const grip = cricketPalm(actor, sample, 'right')
        sample.bat = { grip, axis: vec3.normalize([.7, -.35, .5]), scale: H / 1.78 }
      } else {
        sample.pose = { ...sample.pose, 'leg.left.spread': 10, 'leg.right.spread': 10, 'leg.left.knee': 10, 'leg.right.knee': 8, 'head.turn': id === 'batter' ? 12 : -12 }
        const direction = id === 'batter' ? -1 : 1
        const down: Vec3 = [0, -1, direction * .12]
        let axis = down
        let grip = add(sample.position, [-.18, H * .49, direction * .22 * H])
        if (id === 'batter') {
          const wind = smooth(progress(time, 2100, 2600)) * (1 - smooth(progress(time, 2600, CONTACT)))
          const strike = smooth(progress(time, 2600, CONTACT)) * (1 - smooth(progress(time, CONTACT, 3800)))
          const follow = smooth(progress(time, CONTACT, 3250)) * (1 - smooth(progress(time, 3250, 4000)))
          if (hits) {
            grip = add(sample.position, [-.18 - .08 * strike - .13 * follow, H * (.49 + .12 * wind + .13 * follow), H * (-.22 + .18 * wind - .035 * strike)])
            axis = vec3.normalize([.45 * wind - .85 * follow, -1 + 1.9 * wind + .8 * follow, -.12 + .8 * wind - .4 * strike - .45 * follow])
            if (action === 'defend') { axis = down; grip = add(sample.position, [-.18, H * .49, -.27 * H]) }
            sample.pose.lean = 5 + 8 * strike
          } else if (['stumping', 'bowled', 'lbw'].includes(action)) {
            axis = vec3.normalize([-.5, .7, .4]); grip = add(sample.position, [-.1, H * .64, -.1 * H])
          }
        }
        sample = gripBat(actor, sample, grip, axis)
      }
    } else if (id === 'keeper') {
      sample.pose = { ...sample.pose, turn: 2, lean: 20, 'leg.left.swing': 22, 'leg.right.swing': 22, 'leg.left.knee': 50, 'leg.right.knee': 50 }
      if (action === 'wide') sample.position[0] = 2.15 * smooth(progress(time, 2900, 3500))
      if (action === 'stumping') sample.position[2] -= .85 * smooth(progress(time, 3400, 3900))
      const target = toward(sample, h(id) * .27, h(id) * .44)
      if (action === 'stumping' && time >= 3500) {
        const start = toward({ ...sample, position: base(id).position }, h(id) * .27, h(id) * .44)
        const point: Vec3 = [0, CRICKET_PITCH.stumpHeight, CRICKET_PITCH.length / 2]
        const grip = vec3.lerp(start, point, smooth(progress(time, 3500, 3900)))
        sample = cricketReach(actor, sample, 'right', grip)
        sample = cricketReach(actor, sample, 'left', add(grip, [.045, 0, 0]))
      } else {
        sample = cricketReach(actor, sample, 'right', target)
        sample = cricketReach(actor, sample, 'left', add(target, [.045, 0, 0]))
      }
    } else if (id === 'fielder' && fielded) {
      sample = runBetween(actor, time, 3050, action === 'catch' ? 3800 : 3950, fieldStart, gatherPosition)
      sample.pose.turn = -.55
      if (time >= 3800) {
        const catchPose: Pose = { ...HUMAN_REST, turn: -.55, lean: action === 'catch' ? 5 : 42, bend: action === 'catch' ? 0 : 18, 'leg.left.swing': action === 'catch' ? 0 : 45, 'leg.right.swing': action === 'catch' ? 0 : 45, 'leg.left.knee': action === 'catch' ? 0 : 85, 'leg.right.knee': action === 'catch' ? 0 : 85, smile: .7 }
        sample.pose = blendPose(sample.pose, catchPose, smooth(progress(time, 3800, COLLECT)))
        const target = toward(sample, h(id) * .22, h(id) * (action === 'catch' ? .73 : .2))
        sample = cricketReach(actor, sample, 'right', target)
        sample = cricketReach(actor, sample, 'left', add(target, [.035, 0, 0]))
        if ((action === 'throw' || action === 'run-out') && time > COLLECT) {
          const wind = { ...HUMAN_REST, turn: action === 'throw' ? -.75 : -1.5, 'arm.right.swing': 225, 'arm.right.elbow': 60, 'arm.left.spread': 70, 'leg.left.swing': 15 }
          const release = { ...wind, 'arm.right.swing': 110, 'arm.right.elbow': 0, lean: 15 }
          sample.pose = poseSequence(time, [[COLLECT, sample.pose], [4450, wind], [THROW, release], [4900, { ...HUMAN_REST, turn: wind.turn, 'arm.right.swing': 25, lean: 22 }], [6000, { ...HUMAN_REST, turn: wind.turn }]])
        }
      }
    } else if (id === 'umpire') {
      let signal: Pose = { ...HUMAN_REST }
      const decision = action === 'stumping' ? 4150 : action === 'run-out' ? 5150 : action === 'bowled' || action === 'lbw' ? 3500 : action === 'catch' ? 4350 : 5100
      if (action === 'no-ball') signal = { ...signal, 'arm.right.spread': 90, 'arm.right.elbow': 0 }
      else if (action === 'wide') signal = { ...signal, 'arm.right.spread': 90, 'arm.left.spread': 90, 'arm.right.elbow': 0, 'arm.left.elbow': 0 }
      else if (action === 'six') signal = { ...signal, 'arm.right.spread': 180, 'arm.left.spread': 180, 'arm.right.elbow': 0, 'arm.left.elbow': 0 }
      else if (action === 'four') signal = { ...signal, 'arm.right.spread': 90 - 70 * (.5 + Math.sin((time - 5100) / 180) * .5), 'arm.right.elbow': 12 }
      else if (['catch', 'bowled', 'lbw', 'stumping', 'run-out'].includes(action)) {
        signal = { ...signal, 'arm.right.swing': 165, 'arm.right.elbow': 0 }
        for (const [key, value] of Object.entries(HAND_SHAPES.point)) signal[`hand.right.${key}`] = value
      }
      sample.pose = blendPose(sample.pose, signal, smooth(progress(time, action === 'no-ball' ? RELEASE : action === 'wide' ? 3100 : decision, (action === 'no-ball' ? RELEASE : action === 'wide' ? 3100 : decision) + 350)))
    }
    cached.set(time, sample)
    return sample
  }

  const palmAt = (id: string, time: number) => cricketPalm(actors[id], sampleActor(id, time), 'right')
  const contact = hits ? batSweetSpot(sampleActor('batter', CONTACT).bat!) : action === 'lbw' ? vec3.lerp(cricketJoint(actors.batter, sampleActor('batter', CONTACT), 'leg.right', 1), cricketJoint(actors.batter, sampleActor('batter', CONTACT), 'leg.right', 2), .6) : [keeperDelivery ? -(CRICKET_PITCH.wicketWidth / 2 + .075 + .15) : 0, .45, 9.25] as Vec3
  const release = palmAt('bowler', RELEASE)
  const bounce: Vec3 = [action === 'wide' ? .85 : action === 'spin' ? -.35 : action === 'lbw' ? contact[0] * .6 : 0, .075, 3.9]
  const keeperCatch = palmAt('keeper', action === 'stumping' ? 3400 : 3500)
  const fieldCatch = palmAt('fielder', CATCH)
  const gather = palmAt('fielder', COLLECT)
  const endWicket = action === 'run-out' ? 'bowler' : 'striker'
  const brokenAt = action === 'run-out' ? 5000 : action === 'stumping' ? 3900 : 3200
  const boundary: Vec3 = [field.boundaryRadius * .8, action === 'six' ? 2.1 : .075, -field.boundaryRadius * .6]
  const flight = (time: number, start: number, end: number, from: Vec3, to: Vec3, arc = 0, curve = 0) => ballFlightPoint({ target: `${scene}/ball`, start, end, from, to, arc, curve }, time)
  const pointAt = (time: number): Vec3 => {
    if (time <= RELEASE) return palmAt('bowler', time)
    if (time <= BOUNCE) return flight(time, RELEASE, BOUNCE, release, bounce, .15, action === 'spin' ? .35 : 0)
    const delivered = action === 'wide' ? add(keeperCatch, [0, 0, -.6]) : contact
    if (time <= CONTACT) return flight(time, BOUNCE, CONTACT, bounce, delivered, .08)
    if (action === 'bowled') {
      const wicket: Vec3 = [0, .36, CRICKET_PITCH.length / 2]
      return time <= brokenAt ? flight(time, CONTACT, brokenAt, contact, wicket) : flight(time, brokenAt, 4100, wicket, [0, .075, 12.5], .2)
    }
    if (action === 'lbw') return [...contact]
    if (['bowling', 'spin', 'no-ball', 'wide', 'stumping'].includes(action)) {
      const caughtAt = action === 'stumping' ? 3400 : 3500
      if (keeperDelivery && time <= caughtAt) {
        const passed: Vec3 = [delivered[0], keeperCatch[1], CRICKET_PITCH.length / 2 + .2]
        return time <= 3200 ? flight(time, CONTACT, 3200, delivered, passed, .04) : flight(time, 3200, caughtAt, passed, keeperCatch, .04)
      }
      return time <= caughtAt ? flight(time, CONTACT, caughtAt, delivered, keeperCatch, .04) : palmAt('keeper', time)
    }
    if (action === 'defend') return flight(time, CONTACT, 3400, contact, add(contact, [-.5, -contact[1] + .075, -.7]), .12)
    if (action === 'four' || action === 'six') {
      if (action === 'six') return time <= 5000 ? flight(time, CONTACT, 5000, contact, boundary, 12) : flight(time, 5000, 5700, boundary, add(boundary, [2, -2.025, -1.5]))
      const landed: Vec3 = [5, .075, 5]
      return time <= 3300 ? flight(time, CONTACT, 3300, contact, landed, .5) : flight(time, 3300, 5000, landed, boundary)
    }
    if (action === 'catch') return time <= CATCH ? flight(time, CONTACT, CATCH, contact, fieldCatch, 5) : palmAt('fielder', time)
    const landed: Vec3 = [4, .075, 5]
    if (time <= 3300) return flight(time, CONTACT, 3300, contact, landed, .8)
    if (time <= COLLECT) return flight(time, 3300, COLLECT, landed, gather)
    if (action === 'throw' || action === 'run-out') {
      if (time <= THROW) return palmAt('fielder', time)
      const thrown = palmAt('fielder', THROW)
      const to: Vec3 = action === 'run-out' ? [0, .42, -CRICKET_PITCH.length / 2] : palmAt('keeper', RETURN)
      const arrives = action === 'run-out' ? brokenAt : RETURN
      if (time <= arrives) return flight(time, THROW, arrives, thrown, to, 1.2)
      return action === 'run-out' ? flight(time, arrives, 5700, to, [0, .075, -12], .18) : palmAt('keeper', time)
    }
    return [...gather]
  }

  const events: CricketEvent[] = []
  const event = (id: string, time: number, kind: CricketEvent['kind'], label: string, caption: string) => events.push({ id, time: actual(time), kind, label, caption })
  event('setup', 0, 'setup', CRICKET_ACTIONS[action].name, CRICKET_ACTIONS[action].summary)
  event('release', RELEASE, 'release', 'Ball released', action === 'no-ball' ? 'The front foot has landed beyond the popping crease. No-ball.' : 'The bowler releases the ball; the front foot is behind the popping crease.')
  event('bounce', BOUNCE, 'bounce', 'Pitch bounce', action === 'spin' ? 'The curved flight is illustrative. Spin can change the ball’s path after it bounces.' : 'The delivery bounces on the pitch on its way to the striker.')
  if (hits) event('contact', CONTACT, 'contact', 'Bat contact', 'The ball meets the blade. The bat is keyed from the same two hand grips.')
  else if (action === 'lbw') event('pad-contact', CONTACT, 'contact', 'Pad contact', 'The highlighted path illustrates a ball that would hit the stumps. This is an authored LBW example.')
  else event('miss', CONTACT, 'contact', action === 'wide' ? 'Beyond normal reach' : 'The batter misses', action === 'wide' ? 'The untouched ball is too far away for a normal stroke. The umpire calls Wide.' : 'The untouched delivery passes the striker.')
  if (action === 'catch') event('catch', CATCH, 'collect', 'Catch controlled', 'The fielder controls the ball before it touches the ground: caught.')
  if (['fielding', 'throw', 'run-out', 'batting', 'running'].includes(action)) event('gather', COLLECT, 'collect', 'Ground ball gathered', 'The ball has touched the ground. Gathering it is fielding, not a catch dismissal.')
  if (['bowling', 'spin', 'wide', 'no-ball', 'stumping'].includes(action)) event('keeper', action === 'stumping' ? 3400 : 3500, 'collect', 'Keeper gathers', 'The keeper controls the ball behind the striker’s wicket.')
  if (action === 'throw' || action === 'run-out') event('throw', THROW, 'throw', 'Throw released', 'The fielder releases the gathered ball toward the wicket.')
  if (action === 'throw') event('return', RETURN, 'collect', 'Return received', 'The keeper receives and controls the return throw.')
  if (action === 'stumping') event('wicket', brokenAt, 'wicket', 'Stumped', 'Holding the ball, the keeper removes a bail. The striker is out of ground and is not attempting a run.')
  if (action === 'run-out') event('wicket', brokenAt, 'wicket', 'Run out', 'The direct throw removes a bail before the running batter makes this ground.')
  if (action === 'bowled') event('wicket', brokenAt, 'wicket', 'Bowled', 'The legal delivery hits the wicket and removes a bail.')
  if (action === 'four' || action === 'six') event('boundary', 5000, 'boundary', action === 'four' ? 'Four runs' : 'Six runs', action === 'four' ? 'The struck ball reaches the boundary after touching the ground: four.' : 'The struck ball clears the boundary without touching the ground: six.')
  if (action === 'running') event('run', FINISH, 'result', 'One run completed', 'Both batters have reached the opposite ground. One run is completed.')
  const result = outcome(action, field.format)
  event('result', 5700, 'result', 'Illustrated result', action === 'no-ball' ? `One no-ball extra; it does not count in the over.${result.freeHitNext ? ' The next legitimate delivery is a free hit.' : ' Test cricket has no automatic free hit.'}` : action === 'wide' ? 'One wide extra; the delivery does not count in the over.' : action === 'lbw' ? 'LBW is declared for this illustrated legal delivery. A full decision also checks pitching, impact and any bat contact.' : `${result.runs} bat runs · ${result.extras} extras · ${result.wickets} wicket${result.wickets === 1 ? '' : 's'}.`)
  events.sort((a, b) => a.time - b.time)

  const times = sampleTimes(0, duration, options.every, [1400, 1800, RELEASE, 2100, 2150, 2250, BOUNCE, 2600, 2800, CONTACT, 3050, 3100, 3200, 3250, 3300, 3400, 3500, 3800, 3900, 3950, 4000, CATCH, COLLECT, 4350, 4450, THROW, 4900, 5000, 5100, 5150, RETURN, FINISH, 5700].map(actual))
  const tracks: Track[] = []
  for (const [id, actor] of Object.entries(actors)) appendActorTracks(tracks, scene, actor, times, times.map(time => sampleActor(id, phase(time))))
  const ball = times.map(time => pointAt(phase(time)))
  for (const [axis, property] of ['x', 'y', 'z'].entries()) tracks.push({ id: `ball-${property}`, target: `${scene}/ball`, property, keyframes: times.map((time, i) => ({ time, value: ball[i][axis] })) })
  if (['bowled', 'stumping', 'run-out'].includes(action)) {
    for (let i = 0; i < 2; i++) {
      const id = `${endWicket}-bail-${i}`
      const object = field.scene.objects.find(object => object.id === id)!
      const position = object.position!
      tracks.push({ id: `${id}-fall`, target: `${scene}/${id}`, property: 'position', keyframes: [{ time: 0, value: [...position] }, { time: actual(brokenAt), value: [...position] }, { time: actual(brokenAt + 180), value: add(position, [i ? .25 : -.25, .22, endWicket === 'striker' ? .22 : -.22]), easing: 'ease-out' }, { time: actual(brokenAt + 650), value: [position[0] + (i ? .4 : -.4), .035, position[2] + (endWicket === 'striker' ? .45 : -.45)], easing: 'ease-in' }] })
      tracks.push({ id: `${id}-spin`, target: `${scene}/${id}`, property: 'rotateZ', keyframes: [{ time: 0, value: 0 }, { time: actual(brokenAt), value: 0 }, { time: actual(brokenAt + 650), value: i ? 145 : -145 }] })
    }
  }
  if (action === 'lbw') {
    const end: Vec3 = [contact[0] * .8, contact[1], CRICKET_PITCH.length / 2]
    const direction = vec3.subtract(end, contact)
    tracks.push({ id: 'lbw-position', target: `${scene}/lbw-guide`, property: 'position', keyframes: [{ time: 0, value: [...contact] }] },
      { id: 'lbw-rotation', target: `${scene}/lbw-guide`, property: 'quaternion', interpolation: 'slerp', keyframes: [{ time: 0, value: alignCricketEquipment(direction) }] },
      { id: 'lbw-length', target: `${scene}/lbw-guide`, property: 'scaleY', keyframes: [{ time: 0, value: vec3.distance(contact, end) }] },
      { id: 'lbw-visible', target: `${scene}/lbw-guide`, property: 'visible', keyframes: [{ time: 0, value: 0 }, { time: actual(CONTACT) - .001, value: 0 }, { time: actual(CONTACT), value: 1 }] })
  }
  return { action, duration, events, result, timeline: { id: `${scene}-${action}`, formatVersion: 2, name: CRICKET_ACTIONS[action].name, config: { duration, markers: events.map(event => ({ id: event.id, time: event.time, label: event.label })) }, captions: { en: Object.fromEntries(events.map(event => [event.id, event.caption])) }, tracks } }
}

/** An owned scene and timeline ready for browser/Worker/Node consumers. */
export function cricketClip(options: CricketFieldOptions & CricketActionOptions = {}): CricketClip {
  const field = cricketField(options)
  return { ...field, ...cricketAction(field, options) }
}

/** Event/caption selection is time based, so seeking and reverse playback work too. */
export function cricketEventAt(events: readonly CricketEvent[], time: number): CricketEvent | undefined {
  if (!Number.isFinite(time)) throw new Error('cricketEventAt: time must be finite')
  let current: CricketEvent | undefined
  for (const event of events) { if (event.time > time) break; current = event }
  return current
}
