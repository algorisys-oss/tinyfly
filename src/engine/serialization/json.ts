import type { Keyframe, AnimatableValue, Track, TimelineDefinition, AnyTrack, MotionPathTrack, SpringTrack } from '../types'
import { isMotionPathTrack, isSpringTrack } from '../types'
import { Timeline } from '../core/timeline'
import { createTrack } from '../core/track'

/**
 * Serialize a track to a plain JSON-compatible object.
 * Handles both regular tracks and motion path tracks.
 */
export function serializeTrack(track: AnyTrack): AnyTrack {
  if (isSpringTrack(track)) {
    return {
      id: track.id,
      target: track.target,
      property: track.property,
      kind: 'spring',
      spring: { ...track.spring },
      ...scheduling(track),
    }
  }

  if (isMotionPathTrack(track)) {
    return {
      id: track.id,
      target: track.target,
      property: 'motionPath',
      motionPathConfig: { ...track.motionPathConfig },
      keyframes: track.keyframes.map(serializeKeyframe),
      ...scheduling(track),
    }
  }

  return {
    id: track.id,
    target: track.target,
    property: track.property,
    keyframes: track.keyframes.map(serializeKeyframe),
    ...scheduling(track),
  }
}

function serializeKeyframe<T extends AnimatableValue>(kf: Keyframe<T>) {
  return {
    time: kf.time,
    value: kf.value,
    ...(kf.easing && { easing: kf.easing }),
  }
}

/**
 * Scheduling fields shared by every track kind. Omitted when unset so existing
 * JSON round-trips byte-identically.
 */
function scheduling(track: AnyTrack) {
  const endDelay = (track as Track).endDelay
  return {
    ...(track.delay !== undefined && { delay: track.delay }),
    ...(endDelay !== undefined && { endDelay }),
    ...(track.targets !== undefined && { targets: [...track.targets] }),
    ...(track.stagger !== undefined && { stagger: { ...track.stagger } }),
  }
}

/**
 * Deserialize a plain object to a Track.
 * Handles both regular tracks and motion path tracks.
 * Ensures keyframes are sorted by time.
 */
export function deserializeTrack(data: AnyTrack): AnyTrack {
  if (isSpringTrack(data)) {
    const springData = data as SpringTrack
    return {
      id: springData.id,
      target: springData.target,
      property: springData.property,
      kind: 'spring',
      spring: { ...springData.spring },
      ...scheduling(springData),
    }
  }

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
      ...scheduling(motionData),
    }
  }

  return createTrack({
    id: data.id,
    target: data.target,
    property: data.property,
    keyframes: (data as Track).keyframes,
    ...scheduling(data),
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
      repeatDelay: timeline['_config'].repeatDelay,
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
