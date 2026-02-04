import { For, createMemo, createSignal, createEffect, onCleanup } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import type { Track } from '../../engine'
import './timeline-view.css'

interface TimelineViewProps {
  store: EditorStore
}

interface DragState {
  trackId: string
  keyframeIndex: number
  startX: number
  startTime: number
  currentTime: number
}

const TIME_SCALE = 0.1 // pixels per millisecond at zoom 1

export const TimelineView: Component<TimelineViewProps> = (props) => {
  const pixelsPerMs = createMemo(() => TIME_SCALE * props.store.state.zoom)
  const duration = createMemo(() => props.store.duration())
  const tracks = createMemo(() => props.store.tracks())

  // Drag state for keyframes
  const [dragState, setDragState] = createSignal<DragState | null>(null)

  const timeToX = (time: number) => time * pixelsPerMs()
  const xToTime = (x: number) => x / pixelsPerMs()

  const handleRulerClick = (e: MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left + props.store.state.scrollPosition
    const time = Math.max(0, xToTime(x))
    props.store.seek(time)
  }

  const handleTrackClick = (track: Track, _e: MouseEvent) => {
    props.store.selectTrack(track.id)
  }

  const handleTrackDoubleClick = (track: Track, e: MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = Math.max(0, xToTime(x))

    // Add keyframe at clicked position
    props.store.selectTrack(track.id)
    // Default value - in real editor, would prompt or use last value
    props.store.addKeyframe(time, 0)
  }

  // Keyframe drag handlers
  const handleKeyframeMouseDown = (track: Track, index: number, e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    const keyframe = track.keyframes[index]
    if (!keyframe) return

    setDragState({
      trackId: track.id,
      keyframeIndex: index,
      startX: e.clientX,
      startTime: keyframe.time,
      currentTime: keyframe.time,
    })

    props.store.selectKeyframe(track.id, index)
  }

  const handleMouseMove = (e: MouseEvent) => {
    const state = dragState()
    if (!state) return

    const deltaX = e.clientX - state.startX
    const deltaTime = xToTime(deltaX)
    const newTime = Math.max(0, state.startTime + deltaTime)

    setDragState({ ...state, currentTime: newTime })
  }

  const handleMouseUp = () => {
    const state = dragState()
    if (!state) return

    // Update the keyframe with the new time
    if (state.currentTime !== state.startTime) {
      props.store.updateKeyframe(state.trackId, state.keyframeIndex, {
        time: Math.round(state.currentTime), // Round to nearest ms
      })
    }

    setDragState(null)
  }

  // Get the display time for a keyframe (use drag position if dragging)
  const getKeyframeDisplayTime = (track: Track, index: number, originalTime: number): number => {
    const state = dragState()
    if (state && state.trackId === track.id && state.keyframeIndex === index) {
      return state.currentTime
    }
    return originalTime
  }

  // Add global mouse listeners when dragging
  const setupDragListeners = () => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const cleanupDragListeners = () => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }

  // Watch for drag state changes to add/remove listeners
  createEffect(() => {
    if (dragState()) {
      setupDragListeners()
    } else {
      cleanupDragListeners()
    }
  })

  onCleanup(() => {
    cleanupDragListeners()
  })

  return (
    <div class="timeline-view">
      {/* Time ruler */}
      <div class="timeline-ruler" onClick={handleRulerClick}>
        <TimeRuler
          duration={duration()}
          pixelsPerMs={pixelsPerMs()}
          scrollPosition={props.store.state.scrollPosition}
        />
        {/* Playhead */}
        <div
          class="timeline-playhead"
          style={{ left: `${timeToX(props.store.currentTime()) - props.store.state.scrollPosition}px` }}
        />
      </div>

      {/* Tracks */}
      <div class="timeline-tracks">
        <For each={tracks()}>
          {(track) => (
            <div
              class="timeline-track"
              classList={{ selected: props.store.state.selectedTrackId === track.id }}
              onClick={(e) => handleTrackClick(track, e)}
              onDblClick={(e) => handleTrackDoubleClick(track, e)}
            >
              <div class="track-label">
                <span class="track-target">{track.target}</span>
                <span class="track-property">{track.property}</span>
              </div>
              <div class="track-keyframes">
                <For each={track.keyframes}>
                  {(keyframe, index) => {
                    const isDragging = () => {
                      const state = dragState()
                      return state?.trackId === track.id && state?.keyframeIndex === index()
                    }
                    const displayTime = () => getKeyframeDisplayTime(track, index(), keyframe.time)

                    return (
                      <div
                        class="keyframe"
                        classList={{
                          selected:
                            props.store.state.selectedTrackId === track.id &&
                            props.store.state.selectedKeyframeIndex === index(),
                          dragging: isDragging(),
                        }}
                        style={{
                          left: `${timeToX(displayTime()) - props.store.state.scrollPosition}px`,
                        }}
                        onMouseDown={(e) => handleKeyframeMouseDown(track, index(), e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )
                  }}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}

interface TimeRulerProps {
  duration: number
  pixelsPerMs: number
  scrollPosition: number
}

const TimeRuler: Component<TimeRulerProps> = (props) => {
  const markers = createMemo(() => {
    const result: { time: number; label: string; major: boolean }[] = []
    const visibleDuration = Math.max(props.duration, 5000)

    // Determine marker interval based on zoom
    let interval = 1000 // 1 second
    if (props.pixelsPerMs < 0.05) interval = 5000
    if (props.pixelsPerMs < 0.02) interval = 10000
    if (props.pixelsPerMs > 0.2) interval = 500
    if (props.pixelsPerMs > 0.5) interval = 100

    for (let t = 0; t <= visibleDuration; t += interval) {
      const seconds = t / 1000
      result.push({
        time: t,
        label: seconds % 1 === 0 ? `${seconds}s` : `${seconds.toFixed(1)}s`,
        major: t % 1000 === 0,
      })
    }

    return result
  })

  return (
    <div class="ruler-markers">
      <For each={markers()}>
        {(marker) => (
          <div
            class="ruler-marker"
            classList={{ major: marker.major }}
            style={{ left: `${marker.time * props.pixelsPerMs - props.scrollPosition}px` }}
          >
            <span class="ruler-label">{marker.label}</span>
          </div>
        )}
      </For>
    </div>
  )
}

export default TimelineView
