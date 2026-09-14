import { For, createSignal, onCleanup } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import './timeline-steps.css'

/**
 * The Steps lane under the time ruler: the timeline's markers as flags.
 *
 * - Click a flag to select it (the Properties panel edits it) and move the playhead there.
 * - Drag a flag to retime it: one undo step per drag.
 * - Double-click the lane, press **M**, or use **+** to add a step at that time.
 *
 * Markers are what teaching players step between, stop at and caption.
 */

interface TimelineStepsProps {
  store: EditorStore
  timeToX: (time: number) => number
  xToTime: (x: number) => number
}

/** Pixels a press must travel before it counts as a drag, not a click. */
const DRAG_THRESHOLD = 3

export const TimelineSteps: Component<TimelineStepsProps> = (props) => {
  const [draggingId, setDraggingId] = createSignal<string | null>(null)
  let drag: { id: string; startX: number; startTime: number; moved: boolean } | null = null
  let lane: HTMLDivElement | undefined

  const left = (time: number) => props.timeToX(time) - props.store.state.scrollPosition

  const timeAt = (clientX: number) => {
    const rect = lane!.getBoundingClientRect()
    return Math.max(0, props.xToTime(clientX - rect.left + props.store.state.scrollPosition))
  }

  const onMove = (event: MouseEvent) => {
    if (!drag) return
    const dx = event.clientX - drag.startX
    if (!drag.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return
      drag.moved = true
      // One history entry for the whole drag, recorded before the first change.
      props.store.pushHistory()
      setDraggingId(drag.id)
    }
    props.store.moveMarkerLive(drag.id, drag.startTime + props.xToTime(dx))
  }

  const onUp = () => {
    if (drag?.moved) {
      const marker = props.store.markers().find((candidate) => candidate.id === drag!.id)
      if (marker) props.store.seek(marker.time)
    }
    drag = null
    setDraggingId(null)
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  onCleanup(onUp)

  const onFlagDown = (id: string, time: number, event: MouseEvent) => {
    if (event.button !== 0) return
    event.stopPropagation()
    event.preventDefault()
    props.store.selectMarker(id)
    props.store.pause()
    props.store.seek(time)
    drag = { id, startX: event.clientX, startTime: time, moved: false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div class="timeline-steps">
      <div class="steps-gutter">
        <span class="steps-title" title="Named steps: players step between them, stop at them and show their captions">
          Steps
        </span>
        <button
          class="steps-add"
          title="Add a step at the playhead (M)"
          aria-label="Add a step at the playhead"
          disabled={!props.store.state.timeline}
          onClick={() => props.store.addMarker()}
        >
          +
        </button>
      </div>
      <div
        class="steps-lane"
        ref={lane}
        onDblClick={(event) => props.store.addMarker(timeAt(event.clientX))}
        title={props.store.markers().length === 0 ? 'Double-click to add a step here' : undefined}
      >
        <For each={props.store.markers()}>
          {(marker, index) => (
            <div
              class="step-flag"
              classList={{
                selected: props.store.state.selectedMarkerId === marker.id,
                dragging: draggingId() === marker.id,
                pause: marker.pause === true,
              }}
              style={{ left: `${left(marker.time)}px` }}
              role="button"
              tabIndex={0}
              aria-label={`Step ${index() + 1}: ${marker.label ?? marker.id} at ${(marker.time / 1000).toFixed(2)}s`}
              title={`${marker.label ?? marker.id} — ${(marker.time / 1000).toFixed(2)}s${marker.pause ? ' · pauses' : ''}${marker.question ? ' · asks a question' : ''}`}
              onMouseDown={(event) => onFlagDown(marker.id, marker.time, event)}
              onDblClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  props.store.selectMarker(marker.id)
                  props.store.seek(marker.time)
                }
              }}
            >
              <span class="step-pin" />
              <span class="step-label">
                {index() + 1}
                {marker.label ? ` ${marker.label}` : ''}
                {marker.question ? ' ?' : ''}
              </span>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
