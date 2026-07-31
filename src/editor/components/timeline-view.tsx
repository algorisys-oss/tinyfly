import { For, createMemo, createSignal, createEffect, onCleanup } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import type { Track } from '../../engine'
import { trackLabelWidth } from '../utils/track-label-width'
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

export const TIME_SCALE = 0.1 // pixels per millisecond at zoom 1

export const TimelineView: Component<TimelineViewProps> = (props) => {
  const pixelsPerMs = createMemo(() => TIME_SCALE * props.store.state.zoom)
  const duration = createMemo(() => props.store.duration())
  // Float the Camera tracks to the top so they read as a dedicated camera lane.
  const tracks = createMemo(() => {
    const all = props.store.tracks()
    const cam = all.filter((t) => t.target === 'Camera')
    if (cam.length === 0 || cam.length === all.length) return all
    return [...cam, ...all.filter((t) => t.target !== 'Camera')]
  })

  // Drag state for keyframes
  const [dragState, setDragState] = createSignal<DragState | null>(null)

  const timeToX = (time: number) => time * pixelsPerMs()
  const xToTime = (x: number) => x / pixelsPerMs()

  // Bound to the ruler *lane* (right of the label gutter), so `rect.left` is
  // already the zero mark — the same origin the keyframe lanes use.
  const handleRulerClick = (e: MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left + props.store.state.scrollPosition
    const time = Math.max(0, xToTime(x))
    props.store.seek(time)
  }

  const handleTrackClick = (track: Track, _e: MouseEvent) => {
    // A just-completed box drag ends with a click on the row; don't let it
    // collapse the box selection down to a single-track select.
    if (boxJustFinished) {
      boxJustFinished = false
      return
    }
    props.store.selectTrack(track.id)
  }

  // Bound to the keyframe lane, not the whole row: the row includes the label
  // gutter, which would offset every added keyframe by the gutter's width.
  const handleTrackDoubleClick = (track: Track, e: MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left + props.store.state.scrollPosition
    const time = Math.max(0, xToTime(x))

    // Seed the new keyframe with the track's held value at that time (the last
    // keyframe at or before it) so adding it doesn't snap the value to 0.
    const sorted = [...track.keyframes].sort((a, b) => a.time - b.time)
    const held =
      [...sorted].reverse().find((kf) => kf.time <= time)?.value ??
      sorted[0]?.value ??
      0

    props.store.selectTrack(track.id)
    props.store.addKeyframe(time, held)
  }

  // Keyframe drag handlers
  const handleKeyframeMouseDown = (track: Track, index: number, e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    const keyframe = track.keyframes[index]
    if (!keyframe) return

    // Ctrl/Cmd-click toggles the keyframe in the multi-selection (no drag).
    if (e.ctrlKey || e.metaKey) {
      props.store.toggleKeyframeSelection(track.id, index)
      return
    }

    // Plain click on a keyframe that isn't already part of a multi-selection
    // selects just it; then it can be dragged.
    if (!props.store.isKeyframeSelected(track.id, index)) {
      props.store.selectKeyframe(track.id, index)
    }

    setDragState({
      trackId: track.id,
      keyframeIndex: index,
      startX: e.clientX,
      startTime: keyframe.time,
      currentTime: keyframe.time,
    })
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

  // ---- Box (rubber-band) selection over the track area ----
  const ROW_H = 32 // matches .timeline-track height
  let tracksRef: HTMLDivElement | undefined

  // Distance from the track area's left edge to time zero.
  const laneOffset = () => trackLabelWidth(tracksRef)

  let boxStart: { x: number; y: number } | null = null
  let boxMoved = false
  let boxJustFinished = false
  const [box, setBox] = createSignal<{ x1: number; y1: number; x2: number; y2: number } | null>(null)

  const trackCoords = (e: MouseEvent) => {
    const rect = tracksRef!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top + tracksRef!.scrollTop }
  }

  const onBoxMove = (e: MouseEvent) => {
    if (!boxStart) return
    const { x, y } = trackCoords(e)
    if (!boxMoved && Math.hypot(x - boxStart.x, y - boxStart.y) < 4) return
    boxMoved = true
    setBox({ x1: boxStart.x, y1: boxStart.y, x2: x, y2: y })
  }

  const onBoxUp = () => {
    window.removeEventListener('mousemove', onBoxMove)
    window.removeEventListener('mouseup', onBoxUp)
    const b = box()
    if (boxMoved && b) {
      const minX = Math.min(b.x1, b.x2)
      const maxX = Math.max(b.x1, b.x2)
      const minY = Math.min(b.y1, b.y2)
      const maxY = Math.max(b.y1, b.y2)
      const refs: { trackId: string; index: number }[] = []
      const originX = laneOffset()
      tracks().forEach((track, r) => {
        const cy = r * ROW_H + ROW_H / 2
        if (cy < minY || cy > maxY) return
        track.keyframes.forEach((kf, i) => {
          const cx = originX + timeToX(kf.time) - props.store.state.scrollPosition
          if (cx >= minX && cx <= maxX) refs.push({ trackId: track.id, index: i })
        })
      })
      props.store.selectKeyframes(refs)
      boxJustFinished = true // suppress the click that follows the drag
    }
    boxStart = null
    boxMoved = false
    setBox(null)
  }

  const onTracksMouseDown = (e: MouseEvent) => {
    // Keyframes stopPropagation on their own mousedown, so this only fires on
    // empty track area. Left button only.
    if (e.button !== 0) return
    boxStart = trackCoords(e)
    boxMoved = false
    window.addEventListener('mousemove', onBoxMove)
    window.addEventListener('mouseup', onBoxUp)
  }

  onCleanup(() => {
    window.removeEventListener('mousemove', onBoxMove)
    window.removeEventListener('mouseup', onBoxUp)
  })

  return (
    <div class="timeline-view">
      {/* Time ruler. The gutter matches the track-label column so ruler ticks,
          the playhead and keyframes all share one horizontal origin. */}
      <div class="timeline-ruler">
        <div class="ruler-gutter" />
        <div class="ruler-lane" onClick={handleRulerClick}>
          <TimeRuler
            duration={duration()}
            pixelsPerMs={pixelsPerMs()}
            scrollPosition={props.store.state.scrollPosition}
          />
          {/* End of the scene — nothing past this line plays or exports. */}
          <div
            class="scene-end-marker"
            style={{ left: `${timeToX(duration()) - props.store.state.scrollPosition}px` }}
            title={`Scene ends at ${(duration() / 1000).toFixed(3)}s`}
          />
          {/* Playhead */}
          <div
            class="timeline-playhead"
            style={{ left: `${timeToX(props.store.currentTime()) - props.store.state.scrollPosition}px` }}
          />
        </div>
      </div>

      {/* Tracks */}
      <div class="timeline-tracks" ref={tracksRef} onMouseDown={onTracksMouseDown}>
        {box() && (
          <div
            class="selection-box"
            style={{
              left: `${Math.min(box()!.x1, box()!.x2)}px`,
              top: `${Math.min(box()!.y1, box()!.y2)}px`,
              width: `${Math.abs(box()!.x2 - box()!.x1)}px`,
              height: `${Math.abs(box()!.y2 - box()!.y1)}px`,
            }}
          />
        )}
        <For each={tracks()}>
          {(track) => (
            <div
              class="timeline-track"
              classList={{
                selected: props.store.state.selectedTrackId === track.id,
                'camera-track': track.target === 'Camera',
              }}
              onClick={(e) => handleTrackClick(track, e)}
            >
              <div class="track-label">
                <span class="track-target">
                  {track.target === 'Camera' ? '🎥 Camera' : track.target}
                </span>
                <span class="track-property">{track.property}</span>
              </div>
              <div
                class="track-keyframes"
                onDblClick={(e) => handleTrackDoubleClick(track, e)}
              >
                {/* Dim the region past the end of the scene — keyframes there
                    are held, never played. */}
                <div
                  class="past-scene-end"
                  style={{
                    left: `${timeToX(duration()) - props.store.state.scrollPosition}px`,
                  }}
                />
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
                          selected: props.store.isKeyframeSelected(track.id, index()),
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

export interface TimeRulerProps {
  duration: number
  pixelsPerMs: number
  scrollPosition: number
}

export const TimeRuler: Component<TimeRulerProps> = (props) => {
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
