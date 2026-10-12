import { TrackPlayer } from '../../engine/core/track'
import type { Track } from '../../engine/types'
import { cameraFollowTracks, cameraMoveTracks } from '../../scene-3d/shots'
import type { Vec3 } from '../../engine/math'
import { cricketChoice, type CricketClip } from './cricket-types'

export type CricketView = 'pitch' | 'batter' | 'bowler' | 'keeper' | 'field' | 'overhead' | 'orbit' | 'follow-ball'
export const CRICKET_VIEWS: Readonly<Record<CricketView, string>> = Object.freeze({ pitch: 'Whole pitch', batter: 'Batter close-up', bowler: 'Bowler close-up', keeper: 'Keeper close-up', field: 'Whole ground', overhead: 'Overhead ground', orbit: '360° ground orbit', 'follow-ball': 'Follow the ball' })
export const CRICKET_CAMERA_ANGLES: Readonly<Record<CricketView, number>> = Object.freeze({ pitch: 75, batter: 145, bowler: 35, keeper: 145, field: 75, overhead: 75, orbit: 75, 'follow-ball': 75 })

export interface CricketCameraOptions {
  view?: CricketView
  /** Any azimuth, degrees; orbit adds one complete revolution to this angle. */
  yaw?: number
  every?: number
}

/** Public scene camera tracks; UI controls merely select these builder inputs. */
export function cricketCameraTracks(clip: CricketClip, options: CricketCameraOptions = {}): Track[] {
  const view = cricketChoice(CRICKET_VIEWS, options.view ?? 'pitch', 'cricketCamera.view')
  const angle = options.yaw ?? CRICKET_CAMERA_ANGLES[view]
  if (!Number.isFinite(angle)) throw new Error('cricketCamera: yaw must be finite')
  const yaw = ((angle % 360) + 360) % 360
  const every = options.every ?? 40
  if (!Number.isFinite(every) || every < 16 || every > 1000) throw new Error('cricketCamera: every must be between 16 and 1000 ms')
  if (view === 'follow-ball') {
    const channels = ['x', 'y', 'z'].map(property => {
      const track = clip.timeline.tracks.find(track => track.target === `${clip.scene.id}/ball` && track.property === property)
      if (!track || !('keyframes' in track) || !track.keyframes.length) throw new Error(`cricketCamera: missing ball ${property} keyframes`)
      const keys = track.keyframes
      let index = 0
      let player = new TrackPlayer({ ...track, keyframes: keys.slice(0, 2) })
      return (time: number) => {
        const previous = index
        while (index < keys.length - 2 && time - (track.delay ?? 0) > keys[index + 1].time) index++
        if (index !== previous) player = new TrackPlayer({ ...track, keyframes: keys.slice(index, index + 2) })
        return player.getValueAtTime(time) as number
      }
    })
    return cameraFollowTracks({ scene: clip.scene.id, camera: 'camera', start: 0, end: clip.duration, every, offset: [5, 3, 6], subjectAt: time => channels.map(sample => sample(time)) as Vec3 })
  }
  const wide = view === 'field' || view === 'overhead' || view === 'orbit'
  const target: Vec3 = view === 'batter' ? [.1, .85, 9.3] : view === 'bowler' ? [.68, 1.0, -9.55] : view === 'keeper' ? [0, .7, 10.1] : [0, .65, 0]
  const distance = wide ? clip.boundaryRadius * 2.8 : view === 'pitch' ? 29 : 4.3
  const pitch = view === 'overhead' ? 89 : wide ? 52 : view === 'pitch' ? 16 : 12
  return cameraMoveTracks({ scene: clip.scene.id, camera: 'camera', start: 0, end: clip.duration, every, easing: 'linear', from: { target, yaw, pitch, distance, fov: wide ? 48 : view === 'pitch' ? 50 : 46 }, to: { yaw: view === 'orbit' ? yaw + 360 : yaw } })
}
