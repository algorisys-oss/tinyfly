import type { Track, TimelineDefinition, AnyTrack, MotionPathTrack } from '../types'
import { isMotionPathTrack } from '../types'
import { Timeline } from '../core/timeline'
import { createTrack } from '../core/track'

/**
 * Serialize a track to a plain JSON-compatible object.
 * Handles both regular tracks and motion path tracks.
 */
export function serializeTrack(track: AnyTrack): AnyTrack {
  if (isMotionPathTrack(track)) {
    return {
      id: track.id,
      target: track.target,
      property: 'motionPath',
      motionPathConfig: { ...track.motionPathConfig },
      keyframes: track.keyframes.map((kf) => ({
        time: kf.time,
        value: kf.value,
        ...(kf.easing && { easing: kf.easing }),
      })),
    }
  }

  return {
    id: track.id,
    target: track.target,
    property: track.property,
    keyframes: track.keyframes.map((kf) => ({
      time: kf.time,
      value: kf.value,
      ...(kf.easing && { easing: kf.easing }),
    })),
  }
}

/**
 * Deserialize a plain object to a Track.
 * Handles both regular tracks and motion path tracks.
 * Ensures keyframes are sorted by time.
 */
export function deserializeTrack(data: AnyTrack): AnyTrack {
  // Check if this is a motion path track
  if (data.property === 'motionPath' && 'motionPathConfig' in data) {
    const motionData = data as MotionPathTrack
    const sortedKeyframes = [...motionData.keyframes].sort((a, b) => a.time - b.time)
    return {
      id: motionData.id,
      target: motionData.target,
      property: 'motionPath',
      motionPathConfig: { ...motionData.motionPathConfig },
      keyframes: sortedKeyframes,
    }
  }

  return createTrack({
    id: data.id,
    target: data.target,
    property: data.property,
    keyframes: data.keyframes,
  } as Track)
}

/**
 * Serialize a Timeline to a TimelineDefinition object.
 */
export function serializeTimeline(timeline: Timeline): TimelineDefinition {
  return {
    id: timeline.id,
    name: timeline.name,
    config: {
      duration: timeline.duration > 0 ? timeline.duration : undefined,
      loop: timeline['_config'].loop,
      speed: timeline['_config'].speed,
      alternate: timeline['_config'].alternate,
    },
    tracks: timeline.tracks.map(serializeTrack),
  }
}

/**
 * Deserialize a TimelineDefinition to a Timeline instance.
 */
export function deserializeTimeline(definition: TimelineDefinition): Timeline {
  return new Timeline({
    id: definition.id,
    name: definition.name,
    config: definition.config,
    tracks: definition.tracks.map(deserializeTrack),
  })
}

/**
 * Convert a Timeline to a JSON string.
 */
export function toJSON(timeline: Timeline): string {
  return JSON.stringify(serializeTimeline(timeline))
}

/**
 * Parse a JSON string to a Timeline instance.
 */
export function fromJSON(json: string): Timeline {
  const definition = JSON.parse(json) as TimelineDefinition
  return deserializeTimeline(definition)
}
