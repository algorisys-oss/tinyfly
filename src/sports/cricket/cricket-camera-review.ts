import { TrackPlayer } from '../../engine/core/track'
import type { Object3D } from '../../scene-3d/scene-types'
import type { Vec3 } from '../../engine/math'
import { cricketActor, cricketJoint, restSample } from './cricket-motion'
import { finiteVector } from '../ball-flight'
import type { CricketClip, CricketEvent } from './cricket-types'

export type CricketDecisionView = 'front-foot' | 'striker-crease' | 'bowler-crease'
export const CRICKET_DECISION_VIEWS = Object.freeze({
  'front-foot': Object.freeze({ name: 'Front-foot review', summary: 'A fixed side view of the landing front foot and bowler’s popping crease at release.' }),
  'striker-crease': Object.freeze({ name: 'Striker crease', summary: 'A fixed side view of the striker’s popping crease, wicket and keeper arrival.' }),
  'bowler-crease': Object.freeze({ name: 'Bowler crease', summary: 'A fixed side view of the other crease and wicket for a running batter and return throw.' }),
} satisfies Record<CricketDecisionView, { name: string; summary: string }>)

export function isCricketDecisionView(view: string): view is CricketDecisionView {
  return Object.prototype.hasOwnProperty.call(CRICKET_DECISION_VIEWS, view)
}

/** Choose a physical event; this never seeks playback or changes a ruling. */
export function cricketCameraReview(clip: CricketClip, view: string): CricketEvent | undefined {
  if (!isCricketDecisionView(view)) return undefined
  const find = (id: string) => clip.events.find(event => event.id === id)
  const event = view === 'front-foot' ? find('release')
    : view === 'bowler-crease' ? (clip.action === 'run-out' ? find('wicket') : find('run') ?? find('release'))
    : (clip.action !== 'run-out' ? find('wicket') : undefined) ?? find('run') ?? find('keeper') ?? find('return') ?? clip.events.find(event => event.kind === 'contact')
  if (!event) return undefined
  if (!Number.isFinite(event.time) || event.time < 0 || event.time > clip.duration) throw new Error('cricketCameraReview: event time must be within the clip')
  return { ...event }
}

/** Evaluate only one stock actor's baked numeric pose/position channels. */
export function cricketReviewActor(clip: CricketClip, id: string, time: number) {
  const actor = cricketActor(clip.scene, id), sample = restSample(actor)
  for (const track of clip.timeline.tracks) {
    if (track.target !== clip.scene.id + '/' + id) continue
    if (!('keyframes' in track)) throw new Error('cricketCamera: review requires baked actor tracks')
    const value = new TrackPlayer(track).getValueAtTime(time)
    if (typeof value !== 'number' || !Number.isFinite(value)) continue
    const axis = ['x', 'y', 'z'].indexOf(track.property)
    if (axis >= 0) sample.position[axis] = value
    else sample.pose[track.property] = value
  }
  return { actor, sample }
}

/** Front ankle at authored release, using the native pose/position tracks. */
export function cricketFrontFoot(clip: CricketClip): { point: Vec3; height: number } {
  const event = cricketCameraReview(clip, 'front-foot')
  if (!event) throw new Error('cricketCamera: front-foot view requires a release event')
  const { actor, sample } = cricketReviewActor(clip, 'bowler', event.time)
  return { point: cricketJoint(actor, sample, 'leg.right', 2), height: actor.who.height }
}

export function cricketReviewCrease(clip: CricketClip, view: CricketDecisionView): Vec3 {
  const end = view === 'striker-crease' ? 'striker' : 'bowler'
  const point = clip.landmarks[end + '-crease']
  finiteVector(point, 'cricketCamera.crease')
  return [...point]
}

/** Static crease reference; does not classify feet, bat grounding or dismissals. */
export function cricketDecisionOverlay(clip: CricketClip, view: string): Object3D[] {
  if (!isCricketDecisionView(view)) return []
  const crease = cricketReviewCrease(clip, view)
  const x = view === 'front-foot' ? cricketFrontFoot(clip).point[0] : 0
  return [{ id: 'decision-review-' + view, name: CRICKET_DECISION_VIEWS[view].name + ': crease reference', kind: 'line',
    color: '#f4b83f', width: .035, points: [[x - 1.1, .045, crease[2]], [x + 1.1, .045, crease[2]]] }]
}
