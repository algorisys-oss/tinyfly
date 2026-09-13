import type { MotionPathTrack } from '../../engine/types'
import type { EditorStore } from '../stores/editor-store'
import type { SceneStore } from '../stores/scene-store'
import type { ProjectStore } from '../stores/project-store'
import type { SampleDefinition } from './sample-definitions'

export interface SampleStores {
  store: EditorStore
  sceneStore: SceneStore
  projectStore: ProjectStore
}

function isMotionPathSampleTrack(track: unknown): track is Omit<MotionPathTrack, 'id'> {
  return (
    typeof track === 'object' &&
    track !== null &&
    'property' in track &&
    (track as { property: string }).property === 'motionPath' &&
    'motionPathConfig' in track
  )
}

/**
 * Load a sample into the editor, replacing the current scene's elements and
 * tracks. Callers decide which project it lands in — the Examples flow creates
 * a new project first, so opening an example never overwrites existing work.
 */
export function applySample(stores: SampleStores, sample: SampleDefinition): void {
  const { store, sceneStore, projectStore } = stores

  sceneStore.clearElements()
  store.tracks().forEach((track) => store.removeTrack(track.id))

  // Resize the canvas if the sample declares its own aspect ratio (e.g. a
  // vertical 9:16 promo); otherwise keep the current canvas.
  if (sample.canvas) {
    projectStore.setCanvas({ ...sample.canvas })
  }

  store.createNewTimeline(sample.id, sample.name, { duration: sample.duration })

  sample.elements.forEach((element) => {
    sceneStore.addElement(element.type!, element)
  })

  sample.tracks.forEach((track, index) => {
    if (isMotionPathSampleTrack(track)) {
      const first = track.keyframes[0]
      const last = track.keyframes[track.keyframes.length - 1]
      const duration = track.keyframes.length > 1 ? last.time - first.time : sample.duration
      store.createMotionPathAnimation(track.target, track.motionPathConfig.pathData, {
        duration,
        autoRotate: track.motionPathConfig.autoRotate,
        rotateOffset: track.motionPathConfig.rotateOffset,
        startTime: first?.time ?? 0,
        easing: last?.easing,
      })
    } else {
      store.addTrack({ id: `${sample.id}-track-${index}`, ...track })
    }
  })

  store.clearHistory()
  sceneStore.selectElement(null)
}
