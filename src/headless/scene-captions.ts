import { captionCuesFromTimeline, type CaptionCue } from '../engine/export/captions'
import type { VideoScene } from './video-scene'

/** The scene's own captions, else cues from its timeline's markers, else none. */
export function sceneCaptions(scene: VideoScene, language?: string): CaptionCue[] {
  if (scene.captions) return scene.captions
  if (scene.timeline) return captionCuesFromTimeline(scene.timeline, { language })
  return []
}
