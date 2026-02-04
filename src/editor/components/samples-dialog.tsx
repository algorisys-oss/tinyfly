import { createSignal, For, Show } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import type { SceneStore } from '../stores/scene-store'
import type { MotionPathTrack } from '../../engine/types'
import {
  sampleDefinitions,
  getCategories,
  categoryNames,
  type SampleDefinition,
} from '../samples'
import './samples-dialog.css'

// Check if a track is a motion path track
function isMotionPathSampleTrack(track: unknown): track is Omit<MotionPathTrack, 'id'> {
  return (
    typeof track === 'object' &&
    track !== null &&
    'property' in track &&
    (track as { property: string }).property === 'motionPath' &&
    'motionPathConfig' in track
  )
}

interface SamplesDialogProps {
  store: EditorStore
  sceneStore: SceneStore
  isOpen: boolean
  onClose: () => void
}

export const SamplesDialog: Component<SamplesDialogProps> = (props) => {
  const [selectedCategory, setSelectedCategory] = createSignal<SampleDefinition['category']>('basic')
  const [hoveredSample, setHoveredSample] = createSignal<string | null>(null)

  const filteredSamples = () => {
    return sampleDefinitions.filter((s) => s.category === selectedCategory())
  }

  const loadSample = (sample: SampleDefinition) => {
    // Clear existing elements and tracks
    props.sceneStore.clearElements()
    const existingTracks = props.store.tracks()
    existingTracks.forEach((track) => {
      props.store.removeTrack(track.id)
    })

    // Create new timeline
    props.store.createNewTimeline(sample.id, sample.name, { duration: sample.duration })

    // Add elements
    sample.elements.forEach((element) => {
      props.sceneStore.addElement(element.type!, element)
    })

    // Add tracks with generated IDs
    sample.tracks.forEach((track, index) => {
      if (isMotionPathSampleTrack(track)) {
        // Handle motion path tracks
        const mpTrack = track as Omit<MotionPathTrack, 'id'>
        const duration = mpTrack.keyframes.length > 1
          ? mpTrack.keyframes[mpTrack.keyframes.length - 1].time - mpTrack.keyframes[0].time
          : sample.duration
        props.store.createMotionPathAnimation(
          mpTrack.target,
          mpTrack.motionPathConfig.pathData,
          {
            duration,
            autoRotate: mpTrack.motionPathConfig.autoRotate,
            rotateOffset: mpTrack.motionPathConfig.rotateOffset,
            startTime: mpTrack.keyframes[0]?.time ?? 0,
            easing: mpTrack.keyframes[mpTrack.keyframes.length - 1]?.easing,
          }
        )
      } else {
        // Handle regular tracks
        props.store.addTrack({
          id: `${sample.id}-track-${index}`,
          ...track,
        })
      }
    })

    // Clear history and selection
    props.store.clearHistory()
    props.sceneStore.selectElement(null)

    // Close dialog
    props.onClose()
  }

  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose()
    }
  }

  return (
    <Show when={props.isOpen}>
      <div class="samples-dialog-overlay" onClick={handleOverlayClick}>
        <div class="samples-dialog">
          <div class="samples-dialog-header">
            <h2>Sample Animations</h2>
            <button class="samples-close-btn" onClick={props.onClose}>
              ×
            </button>
          </div>

          <div class="samples-dialog-content">
            {/* Category tabs */}
            <div class="samples-categories">
              <For each={getCategories()}>
                {(category) => (
                  <button
                    class="samples-category-btn"
                    classList={{ active: selectedCategory() === category }}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {categoryNames[category]}
                  </button>
                )}
              </For>
            </div>

            {/* Samples grid */}
            <div class="samples-grid">
              <For each={filteredSamples()}>
                {(sample) => (
                  <div
                    class="sample-card"
                    classList={{ hovered: hoveredSample() === sample.id }}
                    onMouseEnter={() => setHoveredSample(sample.id)}
                    onMouseLeave={() => setHoveredSample(null)}
                    onClick={() => loadSample(sample)}
                  >
                    <div class="sample-thumbnail">{sample.thumbnail}</div>
                    <div class="sample-info">
                      <h4 class="sample-name">{sample.name}</h4>
                      <p class="sample-description">{sample.description}</p>
                      <span class="sample-duration">{(sample.duration / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                )}
              </For>
            </div>

            <div class="samples-footer">
              <p class="samples-hint">
                Click a sample to load it. This will replace your current animation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Show>
  )
}

export default SamplesDialog
