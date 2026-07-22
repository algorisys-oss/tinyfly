import { createSignal, Show } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import { TimelineView } from './timeline-view'
import { CurveView } from './curve-view'
import './timeline-panel.css'

interface TimelinePanelProps {
  store: EditorStore
}

type ViewMode = 'dope' | 'curves'

/**
 * Timeline container with a Dope Sheet / Curves view switcher.
 *
 * Both views read the same editor store (tracks, playhead, zoom, scroll,
 * selection), so switching between them never loses state — the dope sheet is
 * for timing, the curve editor for the shape of the motion (easing).
 */
export const TimelinePanel: Component<TimelinePanelProps> = (props) => {
  const [mode, setMode] = createSignal<ViewMode>('dope')

  return (
    <div class="timeline-panel">
      <div class="timeline-panel-header">
        <div class="timeline-view-switch" role="tablist" aria-label="Timeline view">
          <button
            class="timeline-view-tab"
            classList={{ active: mode() === 'dope' }}
            onClick={() => setMode('dope')}
            role="tab"
            aria-selected={mode() === 'dope'}
            title="Dope sheet — keyframes and timing"
          >
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" fill="currentColor" />
            </svg>
            Dope Sheet
          </button>
          <button
            class="timeline-view-tab"
            classList={{ active: mode() === 'curves' }}
            onClick={() => setMode('curves')}
            role="tab"
            aria-selected={mode() === 'curves'}
            title="Curve editor — value over time and easing"
          >
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path
                d="M3 20c6-1 5-14 11-14 3 0 4 3 7 3"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            Curves
          </button>
        </div>
      </div>

      <div class="timeline-panel-body">
        <Show when={mode() === 'dope'} fallback={<CurveView store={props.store} />}>
          <TimelineView store={props.store} />
        </Show>
      </div>
    </div>
  )
}

export default TimelinePanel
